import THREE from "three";
import { BaseObject } from "../../utils/baseObject";
import { Ped } from "../entities/ped";
import { Game } from "./game";
import { Vehicle } from "../entities/vehicle";
import { GameObject } from "../gameObject/gameObject";
import { Bullet } from "../entities/bullet";
import { MakeBodyOptions } from "../gameObject/gameObjectCollision";
import { Debug } from "../../utils/debug/debug";
import { Bike } from "../entities/bike";
import { Input } from "../../utils/input/input";

export class GameObjectFactory extends BaseObject {
    public game: Game;
    
    constructor(game: Game)
    {
        super();
        
        this.game = game;
    }

    public spawnPed()
    {
        this.log(`spawn ped`);

        const ped = new Ped();
        ped.model = "ped";

        const height = 1.5;

        ped.collision.addCapsule(new THREE.Vector3(0, height/2, 0), 0.3, height);

        this.setupGameObject(ped, {mass: 50});

        return ped;
    }

    public spawnVehicle()
    {
        const gameObject = new Vehicle();
        gameObject.displayName = "Vehicle";

        const chassisHeight = gameObject.chassisHeight;
        const wheelHeight = 1.0;
        const vehicleSize = {x: 1.8, y: chassisHeight, z: 4};

        gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(vehicleSize.x, vehicleSize.y, vehicleSize.z));
        gameObject.collision.addBox(new THREE.Vector3(1, 1, 0), new THREE.Vector3(1, 1, 1));

        this.setupGameObject(gameObject, {mass: 300});

        gameObject.setPosition(0, chassisHeight/2 + wheelHeight/2, 0);

        gameObject.setupVehicleBoke(this.game, false);
        
        return gameObject;
    }

    public spawnBike()
    {
        const gameObject = new Bike();
        gameObject.displayName = "Bike";

        const chassisHeight = gameObject.chassisHeight;
        const wheelHeight = 1.0;
        const vehicleSize = {x: 1.8, y: chassisHeight, z: 4};

        gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(vehicleSize.x, vehicleSize.y, vehicleSize.z));

        this.setupGameObject(gameObject, {mass: 200});

        gameObject.setPosition(0, chassisHeight/2 + wheelHeight/2, 0);

        gameObject.setupVehicleBoke(this.game, true);
        
        return gameObject;
    }

    public spawnWheel(x: number, z: number, options: {radius: number, depth: number, mass: number})
    {
        const gameObject = new GameObject();
        gameObject.displayName = "Wheel";
        gameObject.model = "wheel";

        gameObject.collision.addCylinder(new THREE.Vector3(0, 0, 0), options.radius, options.depth);

        this.setupGameObject(gameObject, {mass: options?.mass});

        gameObject.body.setFriction(3)

        const quat = new THREE.Quaternion(0, 0, 0, 1);
        quat.setFromEuler(new THREE.Euler(0, 0, Math.PI/2))
        gameObject.setRotation(quat.x, quat.y, quat.z, quat.w);

        gameObject.setPosition(x, 1, z);

        return gameObject;
    }

    public spawnWheel2(x: number, z: number, options: {radius: number, depth: number, mass: number})
    {
        const gameObject = new GameObject();
        gameObject.displayName = "Wheel";
        gameObject.model = "wheel2";

        gameObject.collision.addSphere(new THREE.Vector3(0, 0, 0), options.radius);

        this.setupGameObject(gameObject, {mass: options?.mass});

        gameObject.body.setFriction(3)

        gameObject.setPosition(x, 1, z);

        return gameObject;
    }

    public addRotor(x: number, z: number, options: {mass: number})
    {
        const gameObject = new GameObject();
        gameObject.displayName = "rotor";
        gameObject.model = "wheel";

        gameObject.collision.addCylinder(new THREE.Vector3(0, 0, 0), 0.35, 0.4);
        //gameObject.collision.addSphere(new THREE.Vector3(0, 0, 0), 0.5);

        this.setupGameObject(gameObject, {mass: options.mass});

        const quat = new THREE.Quaternion(0, 0, 0, 1);
        quat.setFromEuler(new THREE.Euler(0, 0, Math.PI/2))
        gameObject.setRotation(quat.x, quat.y, quat.z, quat.w);

        gameObject.setPosition(x, 1, z);

        return gameObject;
    }

    public addRotor2(x: number, z: number, options: {mass: number})
    {
        const gameObject = new GameObject();
        gameObject.displayName = "rotor";
        //gameObject.model = "wheel2";

        gameObject.collision.addCylinder(new THREE.Vector3(0, 0, 0), 0.35, 0.4);
        //gameObject.collision.addSphere(new THREE.Vector3(0, 0, 0), 0.5);

        this.setupGameObject(gameObject, {mass: options.mass});

        gameObject.setPosition(x, 1, z);

        return gameObject;
    }

    public addAxis(z: number, size: number, radius: number)
    {
        const gameObject = new GameObject();
        gameObject.displayName = "axis";

        const col = gameObject.collision.addCylinder(new THREE.Vector3(0, 0, 0), radius, size);
        col.color = 0x0000ff;

        this.setupGameObject(gameObject, {mass: 300});

        let CF_NO_CONTACT_RESPONSE = 4;

        gameObject.body.setCollisionFlags(gameObject.body.getCollisionFlags() | CF_NO_CONTACT_RESPONSE);

        const quat = new THREE.Quaternion(0, 0, 0, 1);
        quat.setFromEuler(new THREE.Euler(0, 0, Math.PI/2))
        gameObject.setRotation(quat.x, quat.y, quat.z, quat.w);

        gameObject.setPosition(0, 1, z);

        return gameObject;
      }

    public addAxis2(z: number, size: number, radius: number)
    {
        const gameObject = new GameObject();
        gameObject.displayName = "axis";

        const col = gameObject.collision.addCylinder(new THREE.Vector3(0, 0, 0), radius, size);
        col.color = 0x0000ff;

        this.setupGameObject(gameObject, {mass: 300});

        let CF_NO_CONTACT_RESPONSE = 4;

        gameObject.body.setCollisionFlags(gameObject.body.getCollisionFlags() | CF_NO_CONTACT_RESPONSE);

        gameObject.setPosition(0, 1, z);

        return gameObject;
    }


    public spawnBullet()
    {
        this.log(`spawn bullet`);

        const bullet = new Bullet();
        bullet.displayName = "bullet";

        const box = bullet.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2, 0.2, 0.2));
        box.color = 0xffff00;

        this.setupGameObject(bullet, {mass: 1});

        setTimeout(() => {
            this.removeGameObject(bullet);
        }, 2000);

        return bullet;
    }

    public removeGameObject(gameObject: GameObject)
    {
        //possible memory leak
        this.game.serverScene.physics.physicsWorld.removeRigidBody(gameObject.collision.body!);
        
        this.game.gameObjects.delete(gameObject.id);

        gameObject.collision.body = undefined;
        gameObject.destroy();
    }

    public spawnNPC()
    {
        const ped = this.spawnPed();

        ped.inputZ = 1;

        setInterval(() => {
        }, 500);
    }

    private setupGameObject(gameObject: GameObject, options: MakeBodyOptions)
    {
        const modelName = gameObject.model;

        if(modelName)
        {
            const gltf = this.game.gltfCollection.gltfs.get(modelName);

            if(!gltf) throw "GLTF " + modelName + " was not found";

            gameObject.collision.createCollisionsFromGLTF(gltf, options);
        } else {
            gameObject.collision.makeBody(options);
        }

        this.game.gameObjects.set(gameObject.id, gameObject);

        this.game.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        gameObject.init();
    }

    public changeGameObjectId(gameObject: GameObject, id: string)
    {
        this.game.gameObjects.delete(id);

        gameObject.id = id;

        this.game.gameObjects.set(id, gameObject);
    }

    public createGround()
    {
        const gameObject = new GameObject();
        gameObject.model = "ground";
        gameObject.displayName = "ground"
        gameObject.drawCollision = true;

        const box = gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(100, 2, 100));
        box.color = 0x00ff00;

        this.setupGameObject(gameObject, {mass: 0, position: new THREE.Vector3(0, -1, 0)});

        return gameObject;
    }

    public createBulding()
    {
        const gameObject = new GameObject();
        gameObject.model = "building";
        gameObject.displayName = "building"

        const modelName = gameObject.model;
        const gltf = this.game.gltfCollection.gltfs.get(modelName);
        if(!gltf) throw "GLTF " + modelName + " was not found";

        gameObject.collision.createCollisionsFromGLTF(gltf, {mass: 0});

        this.game.gameObjects.set(gameObject.id, gameObject);

        this.game.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        return gameObject;
    }

    public createBox()
    {
        Debug.log("Game", "create box");
        
        const gameObject = new GameObject();
        
        const box1 = gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));
        box1.color = 0xff0000;
        //box1.rotation = new THREE.Quaternion();
        //box1.rotation.setFromEuler(new THREE.Euler(45, 0, 0));

        //const box2 = gameObject.collision.addBox(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 1, 1));
        //box2.color = 0x0000ff;

        gameObject.collision.makeBody({mass: 1, position: new THREE.Vector3(0, 3, 0)});

        this.game.gameObjects.set(gameObject.id, gameObject);

        this.game.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        return gameObject;
    }
}