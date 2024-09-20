import { BaseObject } from "../../utils/baseObject";
import { Entity, EntityType } from "../entities/entity";
import { Ped, PedData_JSON } from "../entities/ped";
import { eSyncType } from "../entities/entitySync";
import { Gameface } from "../gameface/gameface";
import { IPacketData_Entities } from "./packet";
import { Vehicle } from "../entities/vehicle";

export class SyncHelper extends BaseObject {

    public static onReceiveEntitiesPacket(data: IPacketData_Entities)
    {
        const game = Gameface.Instance.game;

        //console.log(data);

        for(const entityJson of data.entities)
        {
            let entity: Entity | undefined = undefined;

            if(!game.entityFactory.entities.has(entityJson.id))
            {
                switch(entityJson.type)
                {
                    case EntityType.PED:
                        entity = game.entityFactory.spawnPed(0, 0, 0);
                        break;
                    case EntityType.BOX:
                        entity = game.entityFactory.spawnBox(0, 0, 0);
                        break;
                    case EntityType.VEHICLE:
                        entity = game.entityFactory.spawnVehicle(0, 0, 0);
                        break;
                    case EntityType.BIKE:
                        entity = game.entityFactory.spawnBike(0, 0, 0);
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
            } else {
                
                entity.sync.syncType = eSyncType.SYNC_DEFAULT;

                if(entity instanceof Vehicle)
                {
                    if(entity.pedDriving == Gameface.Instance.player)
                    {
                        entity.sync.syncType = eSyncType.SYNC_RECONCILIATE;
                    }
                }
            }

            if(entity instanceof Ped)
            {
                const ped = entity as Ped;

                const pedData = entityJson.data as PedData_JSON;

                //console.log(pedData.lookDir)

                ped.lookDir.setValue(pedData.lookDir[0], pedData.lookDir[1], pedData.lookDir[2], pedData.lookDir[3]);
            }

            

            const position = entityJson.position;
            const velocity = entityJson.velocity;
            const rotation = entityJson.rotation;

            //console.log(velocity);

            entity.sync.setPosition(position[0], position[1], position[2]);
            entity.sync.setVelocity(velocity[0], velocity[1], velocity[2]);
            entity.sync.setRotation(rotation[0], rotation[1], rotation[2], rotation[3]);
        }
    }
}