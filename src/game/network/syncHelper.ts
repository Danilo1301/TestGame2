import { XYZ, XYZ_SetValue, XYZW_SetValue } from "../../shared/ammo/ammoUtils";
import { Vector3_GetDirectionBetweenVectors } from "../../shared/ammo/vector";
import { BaseObject } from "../../shared/baseObject";
import { Entity, EntityType } from "../entities/entity";
import { eSyncType } from "../entities/entitySync";
import { Ped, PedData_JSON } from "../entities/ped";
import { Vehicle } from "../entities/vehicle";
import { Gameface } from "../gameface/gameface";
import { IPacket, IPacketData_Entities, IPacketData_Entity_Info_Basic, IPacketData_Health, IPacketData_WeaponShot, PACKET_TYPE } from "./packet";

export class SyncHelper
{
    public static drivingVehicle?: Vehicle;

    public static update()
    {
        const player = Gameface.Instance.player;

        if(!player) return;

        const vehicle = player.onVehicle;

        if(this.drivingVehicle != vehicle)
        {
            if(vehicle)
            {
                //vehicle.sync.syncType = eSyncType.SYNC_NONE;
            } else {
                //this.drivingVehicle!.sync.syncType = eSyncType.SYNC_DEFAULT
            }

            this.drivingVehicle = vehicle;
        }
    }

    public static onReceivePacket(packet: IPacket)
    {
        // if(packet.type == PACKET_TYPE.PACKET_ENTITIES)
        // {
        //     const data = packet.data as IPacketData_Entities;

        //     SyncHelper.onReceiveEntitiesPacket(data);
        // }

        if(packet.type == PACKET_TYPE.PACKET_ENTITY_INFO_BASIC)
        {
            const data = packet.data as IPacketData_Entity_Info_Basic;

            SyncHelper.onReceiveEntityInfoBasic(data);
        }
    
        // if(packet.type == PACKET_TYPE.PACKET_WEAPON_SHOT)
        // {
        //     const data = packet.data as IPacketData_WeaponShot;

        //     const game = Gameface.Instance.game;
        //     const ped = game.entityFactory.entities.get(data.byPed) as Ped;

        //     if(ped && ped != Gameface.Instance.player)
        //     {
        //         const hitPos = new Ammo.btVector3(data.hit[0], data.hit[1], data.hit[2]);

        //         const dir = Vector3_GetDirectionBetweenVectors(ped.cameraPosition, hitPos);

        //         ped.weapon?.shootDirectionEx(ped.cameraPosition, dir, false);

        //         Ammo.destroy(hitPos);
        //         Ammo.destroy(dir);
        //     }
        // }

        // if(packet.type == PACKET_TYPE.PACKET_HEALTH)
        // {
        //     const data = packet.data as IPacketData_Health;

        //     const game = Gameface.Instance.game;
        //     const entity = game.entityFactory.entities.get(data.entityId);

        //     if(entity)
        //     {
        //         entity.health = data.health;
        //     }
        // }
    }

    public static onReceiveEntityInfoBasic(data: IPacketData_Entity_Info_Basic)
    {
        const game = Gameface.Instance.game;

        //console.log(data);
        
        let entity: Entity | undefined = undefined;
        let justCreated = false;

        if(!game.entityFactory.entities.has(data.id))
        {
            switch(data.type)
            {
                case EntityType.PED:
                    entity = game.entityFactory.spawnPed(0, 0, 0);
                    break;
                case EntityType.BOX:
                    entity = game.entityFactory.spawnBox(0, 0, 0);
                    break;
                case EntityType.BALL:
                    entity = game.entityFactory.spawnBall(0, 0, 0);
                    break;
                case EntityType.VEHICLE:
                    entity = game.entityFactory.spawnCar(0, 0, 0);
                    break;
                case EntityType.BIKE:
                    entity = game.entityFactory.spawnBike(0, 0, 0);
                    break;
                default:
                    break;
            }

            if(!entity)
            {
                throw "SyncHelper: entity type " + data.type + " was not created";
            }

            entity.sync.syncType = eSyncType.SYNC_DEFAULT;

            game.entityFactory.changeEntityId(entity, data.id);
            
            justCreated = true;
        }

        if(!entity) entity = game.entityFactory.entities.get(data.id);

        if(!entity)
        {
            throw "SyncHelper: could not find entity" + data.id;
        }

        if(entity.id == Gameface.Instance.playerId)
        {
            if(!Gameface.Instance.player)
                {
                Gameface.Instance.player = entity as Ped;
                Gameface.Instance.player.equipWeapon(0);

                entity.sync.syncType = eSyncType.SYNC_RECONCILIATE;

                Gameface.Instance.entityWatcher.addEntity(entity);
            }
        }

        const targetPosition = entity.sync.targetPosition;
        const position = XYZ_SetValue(data.position, {x: targetPosition.x(), y: targetPosition.y(), z: targetPosition.z()});
        
        entity.sync.setPosition(position.x!, position.y!, position.z!);

        const targetVelocity = entity.sync.targetVelocity;
        const velocity = XYZ_SetValue(data.velocity, {x: targetVelocity.x(), y: targetVelocity.y(), z: targetVelocity.z()});
        
        entity.sync.setVelocity(velocity.x!, velocity.y!, velocity.z!);

        // rotation

        const targetRotation = entity.sync.targetRotation;
        const rotation = XYZW_SetValue(data.rotation, {x: targetRotation.x(), y: targetRotation.y(), z: targetRotation.z(), w: targetRotation.w()});
        
        entity.sync.setRotation(rotation.x!, rotation.y!, rotation.z!, rotation.w!);
        
        //

        if(justCreated) entity.setPosition(entity.sync.targetPosition.x(), entity.sync.targetPosition.y(), entity.sync.targetPosition.z());

        if(data.health != undefined) entity.health = data.health;

        const entityInput: XYZ = {x: entity.inputX, y: entity.inputY, z: entity.inputZ};
        const input = XYZ_SetValue(data.input, entityInput);
        entity.inputX = input.x!;
        entity.inputY = input.y!;
        entity.inputZ = input.z!;
        
        if(entity instanceof Ped)
        {
            if(entity.id != Gameface.Instance.playerId)
            {
                if(data.aiming != undefined) entity.aiming = data.aiming;

                const pedLookDir = entity.lookDir;
                const lookDir = XYZW_SetValue(data.lookDir, {x: pedLookDir.x(), y: pedLookDir.y(), z: pedLookDir.z(), w: pedLookDir.w()});
        
                entity.lookDir.setValue(lookDir.x!, lookDir.y!, lookDir.z!, lookDir.w!);

                if(data.weapon != undefined)
                {
                    let currentWeaponId = -1;
                    if(entity.weapon) currentWeaponId = entity.weapon.weaponData.id;

                    if(currentWeaponId != data.weapon)
                    {
                        entity.equipWeapon(data.weapon);
                    }
                }
            }
        }
        //entity.sync.setVelocity(velocity[0], velocity[1], velocity[2]);
        //entity.sync.setRotation(rotation[0], rotation[1], rotation[2], rotation[3]);

        //const input = entityJson.input;

        //entity.inputX = input[0];
        //entity.inputY = input[1];
        //entity.inputZ = input[2];

        if(entity.id != Gameface.Instance.playerId)
        {
            if(entity instanceof Ped)
            {
                const ped = entity as Ped;
                // const pedData = entityJson.data as PedData_JSON;

                // ped.lookDir.setValue(pedData.lookDir[0], pedData.lookDir[1], pedData.lookDir[2], pedData.lookDir[3]);
                // ped.aiming = pedData.aiming;

                // let currentWeaponId = -1;
                // if(ped.weapon) currentWeaponId = ped.weapon.weaponData.id;

                // if(currentWeaponId != pedData.weapon)
                // {
                //     ped.equipWeapon(pedData.weapon);
                // }
            }
        }
    }
}