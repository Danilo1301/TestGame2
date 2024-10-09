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

            if(!gltf) throw "GLTF " + entity.modelName + " was not found";

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

    public spawnGround(x: number, y: number, z: number, sx: number, sz: number)
    {
        const entity = this.spawnEntity(Entity);
        
        const box = entity.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(sx, 2, sz));
        box.color = 0xffff00;

        entity.displayName = "ground";
        entity.setModel("ground");
        this.setupEntity(entity, {mass: 0});
        entity.setPosition(x, y, z);
        return entity;
    }
    
    public spawnPed(x: number, y: number, z: number)
    {
        const entity = this.spawnEntity<Ped>(Ped);
        this.setupEntity(entity, {mass: 20});
        entity.setPosition(x, y, z);
        entity.setModel("ped");
        return entity;
    }

    public spawnBox(x: number, y: number, z: number)
    {
        const entity = this.spawnEntity(Box);
        this.setupEntity(entity, {mass: 100});
        entity.setPosition(x, y, z);
        entity.body.setFriction(1);
        return entity;
    }

    public spawnWeaponItem(weapon: Weapon)
    {
        const entity = this.spawnEntity<WeaponItem>(WeaponItem);
        this.setupEntity(entity, {});
        entity.displayName = "weaponItem";
        entity.weapon = weapon;
        entity.setModel("m4");
        entity.setPosition(0, 0, 0);
        return entity;
    }

    public spawnEmptyEntity(x: number, y: number, z: number)
    {
        const entity = this.spawnEntity(Entity);
        this.setupEntity(entity, {});
        entity.setPosition(x, y, z);
        return entity;
    }
}