import THREE, { Vector3 } from "three";
import { BaseObject } from "../../utils/baseObject";
import { Game } from "../game/game";
import { Entity } from "./entity";
import { MakeBodyOptions } from "./entityCollision";
import { Box } from "./box";
import { Ped } from "./ped";
import { Vehicle } from "./vehicle";
import { Wheel } from "./wheel";
import { Bike } from "./bike";
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

    public spawnWeaponItem(weapon: Weapon)
    {
        const entity = new WeaponItem();
        entity.displayName = "WeaponItem";
        entity.model = "m4";

        entity.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2, 0.2, 0.2));

        this.setupEntity(entity, {mass: 10});

        return entity;
    }

    public spawnVehicle(x: number, y: number, z: number)
    {
        const entity = new Vehicle();
        entity.displayName = "Vehicle";

        const chassisHeight = entity.chassisHeight;
        const wheelHeight = 1.0;
        const vehicleSize = {x: 1.8, y: chassisHeight, z: 4};

        entity.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(vehicleSize.x, vehicleSize.y, vehicleSize.z));
        entity.collision.addBox(new THREE.Vector3(1, 1, 0), new THREE.Vector3(1, 1, 1));

        this.setupEntity(entity, {mass: 200, position: new THREE.Vector3(x, y, z)});

        //entity.setPosition(0, chassisHeight/2 + wheelHeight/2, 0);

        entity.setupVehicleBody(false);

        //entity.setPosition(x, y, z);

        return entity;
    }

    public spawnBike(x: number, y: number, z: number)
    {
        const entity = new Bike();
        entity.displayName = "Bike";

        const chassisHeight = entity.chassisHeight;
        const wheelHeight = 1.0;
        const vehicleSize = {x: 1.8, y: chassisHeight, z: 4};

        entity.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(vehicleSize.x, vehicleSize.y, vehicleSize.z));

        this.setupEntity(entity, {mass: 200, position: new THREE.Vector3(x, y, z)});

        //entity.setPosition(0, chassisHeight/2 + wheelHeight/2, 0);

        entity.setupVehicleBody(true);

        //entity.setPosition(x, y, z);

        return entity;
    }

    public spawnWheel(x: number, y: number, z: number, options: {radius: number, depth: number, mass: number})
    {
        const entity = new Wheel();
        entity.displayName = "Wheel";
        entity.model = "wheel2";

        entity.collision.addSphere(new THREE.Vector3(0, 0, 0), options.radius);

        this.setupEntity(entity, {mass: options?.mass, position: new THREE.Vector3(x,y, z)});

        return entity;
    }

    public spawnPed(x: number, y: number, z: number)
    {
        const entity = new Ped();
        entity.displayName = "Ped";
        entity.model = "ped";

        const height = 1.5;
        const calsuleRoundHeight = 0.2;

        entity.collision.addCapsule(new THREE.Vector3(0, height/2 + calsuleRoundHeight, 0), 0.2, height);

        this.setupEntity(entity, {mass: 20});

        entity.setPosition(x, y, z);

        return entity;
    }

    public spawnBox(x: number, y: number, z: number)
    {
        const entity = new Box();
        entity.displayName = "Box";

        entity.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));

        this.setupEntity(entity, {mass: 1});

        entity.setPosition(x, y, z);

        return entity;
    }

    public spawnGround(sx: number, sz: number)
    {
        const entity = new Entity();
        entity.displayName = "Ground";
        entity.model = "ground";

        const box = entity.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(sx, 2, sz));
        box.color = 0xffff00;

        this.setupEntity(entity, {
            mass: 0,
            position: new THREE.Vector3(0, -1, 0)
        });

        return entity;
    }

    public removeEntity(entity: Entity)
    {
        //possible memory leak
        this.game.serverScene.physics.physicsWorld.removeRigidBody(entity.collision.body!);
        
        this.entities.delete(entity.id);

        entity.collision.body = undefined;
        entity.destroy();
    }

    private setupEntity(entity: Entity, options: MakeBodyOptions)
    {
        entity.game = this.game;

        const modelName = entity.model;

        if(modelName)
        {
            const gltf = this.game.gltfCollection.gltfs.get(modelName);

            if(!gltf) throw "GLTF " + modelName + " was not found";

            entity.collision.createCollisionsFromGLTF(gltf, options);
        } else {
            entity.collision.makeBody(options);
        }

        this.entities.set(entity.id, entity);

        this.game.serverScene.physics.physicsWorld.addRigidBody(entity.collision.body!);

        entity.init();
    }

    public removeEntityCollision(entity: Entity)
    {
        this.game.serverScene.physics.physicsWorld.removeRigidBody(entity.collision.body!);
        entity.collision.body = undefined;
    }

    public changeEntityId(entity: Entity, id: string)
    {
        this.entities.delete(id);

        entity.id = id;

        this.entities.set(id, entity);
    }
}