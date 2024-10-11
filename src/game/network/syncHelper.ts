import { Vector3_GetDirectionBetweenVectors } from "../../shared/ammo/vector";
import { BaseObject } from "../../shared/baseObject";
import { Entity, EntityType } from "../entities/entity";
import { eSyncType } from "../entities/entitySync";
import { Ped, PedData_JSON } from "../entities/ped";
import { Gameface } from "../gameface/gameface";
import { IPacket, IPacketData_Entities, IPacketData_Health, IPacketData_WeaponShot, PACKET_TYPE } from "./packet";

export class SyncHelper extends BaseObject {

    public static onReceivePacket(packet: IPacket)
    {
        if(packet.type == PACKET_TYPE.PACKET_ENTITIES)
        {
            const data = packet.data as IPacketData_Entities;

            SyncHelper.onReceiveEntitiesPacket(data);
        }
    
        if(packet.type == PACKET_TYPE.PACKET_WEAPON_SHOT)
        {
            const data = packet.data as IPacketData_WeaponShot;

            const game = Gameface.Instance.game;
            const ped = game.entityFactory.entities.get(data.byPed) as Ped;

            if(ped && ped != Gameface.Instance.player)
            {
                const hitPos = new Ammo.btVector3(data.hit[0], data.hit[1], data.hit[2]);

                const dir = Vector3_GetDirectionBetweenVectors(ped.cameraPosition, hitPos);

                ped.weapon?.shootDirectionEx(ped.cameraPosition, dir, false);

                Ammo.destroy(hitPos);
                Ammo.destroy(dir);
            }
        }

        if(packet.type == PACKET_TYPE.PACKET_HEALTH)
        {
            const data = packet.data as IPacketData_Health;

            const game = Gameface.Instance.game;
            const entity = game.entityFactory.entities.get(data.entityId);

            if(entity)
            {
                entity.health = data.health;
            }
        }
    }

    public static onReceiveEntitiesPacket(data: IPacketData_Entities)
    {
        const game = Gameface.Instance.game;

        console.log(`SyncHelper: got packet`)
        console.log(data)

        for(const entityJson of data.entities)
        {
            let entity: Entity | undefined = undefined;
            let justCreated = false;

            if(entityJson.fullData)
            {
                //console.log("received full data for entity " + entityJson.id);

                if(!game.entityFactory.entities.has(entityJson.id))
                {
                    switch(entityJson.fullData.type)
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

                    if(!entity)
                    {
                        throw "SyncHelper: entity type " + entityJson.fullData.type + " was not created";
                    }

                    game.entityFactory.changeEntityId(entity, entityJson.id);

                    justCreated = true;
                }
            }

            
            if(!entity) entity = game.entityFactory.entities.get(entityJson.id);

            if(!entity)
            {
                throw "SyncHelper: could not find entity" + entityJson.id;
            }
            

            if(entity.id == Gameface.Instance.playerId)
            {

                if(!Gameface.Instance.player) {
                    Gameface.Instance.player = entity as Ped;
                    Gameface.Instance.player.equipWeapon(0);
                }
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
                    ped.aiming = pedData.aiming;

                    let currentWeaponId = -1;
                    if(ped.weapon) currentWeaponId = ped.weapon.weaponData.id;

                    if(currentWeaponId != pedData.weapon)
                    {
                        ped.equipWeapon(pedData.weapon);
                    }
                }
            }
        }
    }
}