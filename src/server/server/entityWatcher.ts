import { Entity, Entity_Info_Basic, EntityType } from "../../game/entities/entity";
import { Ped } from "../../game/entities/ped";
import { Game } from "../../game/game/game";
import { IPacketData_Entity_Info_Basic, PACKET_TYPE } from "../../game/network/packet";
import { XYZ, XYZW } from "../../shared/ammo/ammoUtils";
import { ObjectGroup } from "../../shared/objectWatcher/objectGroup";
import { ObjectWatcher } from "../../shared/objectWatcher/objectWatcher";
import { Server } from "./server";

interface EntityWatchData {
    objectWatcher: ObjectWatcher
}

export class EntityWatcher
{
    public game: Game;
    public entities = new Map<Entity, EntityWatchData>();

    public onEntityInfoChange?: (entity: Entity, info: Entity_Info_Basic) => void;

    constructor(game: Game)
    {
        this.game = game;
    }

    public check()
    {
        for(const data of this.entities.values())
        {
            data.objectWatcher.check();
        }
    }

    public hasEntity(entity: Entity)
    {
        return this.entities.has(entity);
    }

    public addEntity(entity: Entity)
    {
        const data: EntityWatchData = {
            objectWatcher: new ObjectWatcher()
        }

        this.entities.set(entity, data);
        
        console.log(`[EntityWatcher] added entity ${entity.displayName}`);

        const objectWatcher = data.objectWatcher;
        
        const entityInfo = objectWatcher.createGroup("entity_info");

        entityInfo.watch("x", () => entity.getPosition().x()).setMinDifference(0.1);
        entityInfo.watch("y", () => entity.getPosition().y()).setMinDifference(0.1);
        entityInfo.watch("z", () => entity.getPosition().z()).setMinDifference(0.1);

        entityInfo.watch("rotationX", () => entity.getRotation().x()).setMinDifference(0.1);
        entityInfo.watch("rotationY", () => entity.getRotation().y()).setMinDifference(0.1);
        entityInfo.watch("rotationZ", () => entity.getRotation().z()).setMinDifference(0.1);
        entityInfo.watch("rotationW", () => entity.getRotation().w()).setMinDifference(0.1);

        entityInfo.watch("input.x", () => entity.inputX);
        entityInfo.watch("input.y", () => entity.inputY);
        entityInfo.watch("input.z", () => entity.inputZ);

        entityInfo.watch("health", () => entity.health);

        if(entity instanceof Ped)
        {
            entityInfo.watch("aiming", () => entity.aiming);

            entityInfo.watch("lookDir.x", () => entity.lookDir.x()).setMinDifference(0.1);
            entityInfo.watch("lookDir.y", () => entity.lookDir.y()).setMinDifference(0.1);
            entityInfo.watch("lookDir.z", () => entity.lookDir.z()).setMinDifference(0.1);
            entityInfo.watch("lookDir.w", () => entity.lookDir.w()).setMinDifference(0.1);

            entityInfo.watch("weapon", () => entity.weapon ? entity.weapon.weaponData.id : -1);
        }

        entityInfo.onChange = () => {
            //console.log(`[EntityWatcher] entity_info changed`);

            const type = this.getEntityType(entity);

            if(type == EntityType.UNDEFINED)
            {
                console.log(`Entity ${entity.displayName} can not be synced`);
                return;
            }

            const info: Entity_Info_Basic = {
                id: entity.id,
                type: type
            }

            const position: XYZ = {};
            if(entityInfo.hasValueChanged("x")) position.x = entityInfo.getValue("x");
            if(entityInfo.hasValueChanged("y")) position.y = entityInfo.getValue("y");
            if(entityInfo.hasValueChanged("z")) position.z = entityInfo.getValue("z");
            info.position = position;

            const rotation: XYZW = {};
            if(entityInfo.hasValueChanged("rotationX")) rotation.x = entityInfo.getValue("rotationX");
            if(entityInfo.hasValueChanged("rotationY")) rotation.y = entityInfo.getValue("rotationY");
            if(entityInfo.hasValueChanged("rotationZ")) rotation.z = entityInfo.getValue("rotationZ");
            if(entityInfo.hasValueChanged("rotationW")) rotation.w = entityInfo.getValue("rotationW");
            info.rotation = rotation;

            const input: XYZ = {};
            if(entityInfo.hasValueChanged("input.x")) input.x = entityInfo.getValue("input.x");
            if(entityInfo.hasValueChanged("input.y")) input.y = entityInfo.getValue("input.y");
            if(entityInfo.hasValueChanged("input.z")) input.z = entityInfo.getValue("input.z");
            info.input = input;

            if(entityInfo.hasValueChanged("health")) info.health = entityInfo.getValue("health");

            if(entity instanceof Ped)
            {
                if(entityInfo.hasValueChanged("aiming")) info.aiming = entityInfo.getValue("aiming");

                const lookDir: XYZW = {};
                if(entityInfo.hasValueChanged("lookDir.x")) lookDir.x = entityInfo.getValue("lookDir.x");
                if(entityInfo.hasValueChanged("lookDir.y")) lookDir.y = entityInfo.getValue("lookDir.y");
                if(entityInfo.hasValueChanged("lookDir.z")) lookDir.y = entityInfo.getValue("lookDir.z");
                if(entityInfo.hasValueChanged("lookDir.w")) lookDir.w = entityInfo.getValue("lookDir.w");
                info.lookDir = lookDir;

                if(entityInfo.hasValueChanged("weapon")) info.weapon = entityInfo.getValue("weapon");
            }

            this.onEntityInfoChange?.(entity, info);
        };

        this.setEntityAsChangedAll(entity);
    }

    public getEntityType(entity: Entity)
    {
        for(const pair of this.game.entitiesInformation)
        {
            if(entity instanceof pair[0])
            {
                return pair[1];
            }
        }

        return EntityType.UNDEFINED;
    }

    public setEntityAsChangedAll(entity: Entity)
    {
        this.entities.get(entity)!.objectWatcher.setAsChangedAll();
        this.check();
    }

    public setAllEntityAsChangedAll()
    {
        for(const entity of this.entities.values()) entity.objectWatcher.setAsChangedAll();
        this.check();
    }
}