import THREE, { Vector3 } from "three";
import { MakeBodyOptions } from "./entityCollision";
import { BaseObject } from "../../shared/baseObject";
import { Game } from "../game/game";
import { Entity } from "./entity";
import { Box } from "./box";
import { Ped } from "./ped";
import { WeaponItem } from "./weaponItem";
import { Weapon } from "../weapons/weapon";
import { Vehicle } from "./vehicle";
import { Bike } from "./bike";
import { CollisionGroups } from "../collisionGroups";
import { Wheel } from "./wheel";
import { Axis } from "./axis";

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
            entity.collision.makeBody(options);
            
            if(options.group != undefined || options.mask != undefined)
            {
                if(!options.group) throw `You forgot collision group`;
                if(!options.mask) throw `You forgot collision mask`;

                console.log(`[EntityFactory] Adding rigid body with group ${options.group}, mask ${options.mask}`)

                this.game.serverScene.physics.physicsWorld.addRigidBody(entity.collision.body!, options.group, options.mask);
            } else {

                console.log(`[EntityFactory] Adding rigid body to world`);

                this.game.serverScene.physics.physicsWorld.addRigidBody(entity.collision.body!, 1, -1);
            }
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
        entity.body.setFriction(0.8);
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

    public spawnVehicle<T extends Vehicle>(c: typeof Vehicle, model: string)
    {
        const entity = this.spawnEntity(c) as T;
        entity.displayName = "vehicle";
        entity.setModel(model);

        const GROUP_CHASSIS = entity.chassisCollisionGroup = CollisionGroups.createCollisionGroup();
        const GROUP_WHEELS = entity.wheelsCollisionGroup = CollisionGroups.createCollisionGroup();

        const MASK_CHASSIS = ~GROUP_WHEELS;

        this.setupEntity(entity, {
            mass: 100,
            localInertia: new THREE.Vector3(0, 0, 0),
            group: GROUP_CHASSIS,
            mask: MASK_CHASSIS
        });

        if(entity instanceof Bike)
        {
            entity.setupVehicleBody(true);
        } else {
            entity.setupVehicleBody();
        }
        

        return entity;
    }

    public spawnCar(x: number, y: number, z: number)
    {
        const entity = this.spawnVehicle(Vehicle, "policecar");
        entity.setPosition(x, y, z);
        return entity;
    }

    public spawnBike(x: number, y: number, z: number)
    {
        const entity = this.spawnVehicle(Bike, "policebike");
        entity.setPosition(x, y, z);
        return entity;
    }

    public spawnWheel(x: number, y: number, z: number, options: MakeBodyOptions)
    {
        let wheelRadius = 0.4;

        const entity = this.spawnEntity<Wheel>(Wheel);
        //entity.collision.addCylinder(new THREE.Vector3(0, 0, 0), wheelRadius, 0.5);
        entity.collision.addSphere(new THREE.Vector3(0, 0, 0), wheelRadius);
        entity.displayName = "wheel";
        entity.setModel("wheel2");
        
        this.setupEntity(entity, options);
        entity.setPosition(x, y, z);

        const quat = new THREE.Quaternion(0, 0, 0, 1);
        quat.setFromEuler(new THREE.Euler(0, 0, Math.PI/2));
        //entity.setRotation(quat.x, quat.y, quat.z, quat.w);

        return entity;
    }

    public spawnAxis(x: number, y: number, z: number)
    {
        const entity = this.spawnEntity(Axis) as Axis;
        //entity.collision.addCylinder(new THREE.Vector3(0, 0, 0), wheelRadius, 0.5);
        entity.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0.2, 0.2));
        entity.displayName = "axis";

        this.setupEntity(entity, {mass: 50});
        const CF_NO_CONTACT_RESPONSE = 4; // Constant for no contact response
        entity.body.setCollisionFlags(CF_NO_CONTACT_RESPONSE);

        entity.setPosition(x, y, z);

        const quat = new THREE.Quaternion(0, 0, 0, 1);
        quat.setFromEuler(new THREE.Euler(0, 0, Math.PI/2));
        //entity.setRotation(quat.x, quat.y, quat.z, quat.w);

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