import { BaseObject } from "../../shared/baseObject";
import { Entity, EntityType } from "../entities/entity";
import { eSyncType } from "../entities/entitySync";
import { Ped, PedData_JSON } from "../entities/ped";
import { Gameface } from "../gameface/gameface";
import { IPacketData_Entities } from "./packet";

export class SyncHelper extends BaseObject {

    public static onReceiveEntitiesPacket(data: IPacketData_Entities)
    {
        const game = Gameface.Instance.game;

        //console.log(data)

        for(const entityJson of data.entities)
        {
            let entity: Entity | undefined = undefined;

            let justCreated = false;

            if(!game.entityFactory.entities.has(entityJson.id))
            {
                justCreated = true;

                switch(entityJson.type)
                {
                    case EntityType.PED:
                        entity = game.entityFactory.spawnPed(0, 0, 0);
                        break;
                    case EntityType.BOX:
                        entity = game.entityFactory.spawnBox(0, 0, 0);
                        break;
                    case EntityType.VEHICLE:
                        //entity = game.entityFactory.spawnVehicle(0, 0, 0);
                        break;
                    case EntityType.BIKE:
                        //entity = game.entityFactory.spawnBike(0, 0, 0);
                        break;
                    default:
                        break;
                }

                if(entity)
                    game.entityFactory.changeEntityId(entity, entityJson.id);
            }

            if(!entity) entity = game.entityFactory.entities.get(entityJson.id);

            if(!entity)
            {
                throw "SyncHelper: entity type " + entityJson.type + " was not created";
            }

            if(entity.id == Gameface.Instance.playerId)
            {
                if(!Gameface.Instance.player) Gameface.Instance.player = entity as Ped;
                entity.sync.syncType = eSyncType.SYNC_RECONCILIATE;
            }

            if(entity.id != Gameface.Instance.playerId)
            {
                entity.sync.syncType = eSyncType.SYNC_DEFAULT;
            }

            const position = entityJson.position;
            const velocity = entityJson.velocity;
            const rotation = entityJson.rotation;

            //console.log(velocity);

            entity.sync.setPosition(position[0], position[1], position[2]);
            if(justCreated) entity.setPosition(position[0], position[1], position[2]);

            entity.sync.setVelocity(velocity[0], velocity[1], velocity[2]);
            entity.sync.setRotation(rotation[0], rotation[1], rotation[2], rotation[3]);

            const input = entityJson.input;

            entity.inputX = input[0];
            entity.inputY = input[1];
            entity.inputZ = input[2];

            if(entity.id != Gameface.Instance.playerId)
            {
                if(entity instanceof Ped)
                {
                    const ped = entity as Ped;
                    const pedData = entityJson.data as PedData_JSON;
    
                    ped.lookDir.setValue(pedData.lookDir[0], pedData.lookDir[1], pedData.lookDir[2], pedData.lookDir[3]);
                }
            }
        }
    }
}