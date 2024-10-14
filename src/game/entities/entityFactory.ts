import THREE, { Vector3 } from "three";
import { MakeBodyOptions } from "./entityCollision";
import { BaseObject } from "../../shared/baseObject";
import { Game } from "../game/game";
import { Entity } from "./entity";
import { Box } from "./box";
import { Ped } from "./ped";
import { WeaponItem } from "./weaponItem";
import { Weapon } from "../weapons/weapon";

export class EntityFactory extends BaseObject {
    public game: Game;
    public entities = new Map<string, Entity>();

    constructor(game: Game)
    {
        super();
        this.game = game;
    }

    public spawnEntity<T extends Entity>(e: typeof Entity)
    {
        const entity = new e();
        entity.game = this.game;

        this.entities.set(entity.id, entity);
        
        return entity as T;
    }

    public setupEntity(entity: Entity, options: MakeBodyOptions)
    {
        entity.initCollision();

        if(entity.modelName != undefined)
        {
            const gltf = this.game.gltfCollection.gltfs.get(entity.modelName);

            if(!gltf) throw "EntityFactory: GLTF " + entity.modelName + " was not found";

            entity.collision.createCollisionsFromGLTF(gltf);
        }

        if(entity.collision.shapes.length > 0)
        {
            console.warn("wtf");

            entity.collision.makeBody(options);
            this.game.serverScene.physics.physicsWorld.addRigidBody(entity.collision.body!);
        }

        entity.init();
    }

    public removeEntity(entity: Entity)
    {
        //possible memory leak
        this.game.serverScene.physics.physicsWorld.removeRigidBody(entity.collision.body!);
        entity.collision.body = undefined;
        
        entity.destroy();

        this.entities.delete(entity.id);
    }

    public changeEntityId(entity: Entity, id: string)
    {
        this.entities.delete(entity.id);

        entity.setId(id);

        this.entities.set(id, entity);
    }

    public spawnGround(x: number, y: number, z: number, sx: number, sz: number)
    {
        const entity = this.spawnEntity(Entity);
        entity.displayName = "ground";
        entity.invincible = true;
        entity.setModel("ground");
        
        const box = entity.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(sx, 2, sz));
        box.color = 0xffff00;

        this.setupEntity(entity, {mass: 0});
        entity.setPosition(x, y, z);
        return entity;
    }
    
    public spawnPed(x: number, y: number, z: number)
    {
        const entity = this.spawnEntity<Ped>(Ped);
        entity.displayName = "ped";
        entity.setModel("ped");

        this.setupEntity(entity, {mass: 20});
        entity.setPosition(x, y, z);
        return entity;
    }

    public spawnBox(x: number, y: number, z: number)
    {
        const entity = this.spawnEntity(Box);
        entity.displayName = "box";
        entity.setModel("wheel");

        this.setupEntity(entity, {mass: 100});
        entity.setPosition(x, y, z);
        entity.body.setFriction(1);
        return entity;
    }

    public spawnWeaponItem(weapon: Weapon)
    {
        const entity = this.spawnEntity<WeaponItem>(WeaponItem);
        entity.displayName = "weaponItem";
        entity.weapon = weapon;
        entity.setModel("m4");

        this.setupEntity(entity, {});
        entity.setPosition(0, 0, 0);
        return entity;
    }

    public spawnEmptyEntity(x: number, y: number, z: number)
    {
        const entity = this.spawnEntity(Entity);
        entity.displayName = "empty";

        this.setupEntity(entity, {});
        entity.setPosition(x, y, z);
        return entity;
    }
}