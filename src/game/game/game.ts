import { Types } from "@enable3d/phaser-extension";
import { ServerScene } from "../scenes/serverScene";
import { GameObject } from "../gameObject/gameObject";
import { Player } from "../player/player";
import { Debug } from "../../utils/debug/debug";
import { ServerClock } from "@enable3d/ammo-on-nodejs";
import THREE from "three";
import path from "path"
import { isNode, randomIntFromInterval } from "../../utils/utils";
import { ThreeModelManager } from "../three/threeModelManager";
import { GLTFCollection } from "./gltfCollection";
import { Ped } from "../entities/ped";
import { MakeBodyOptions } from "../gameObject/gameObjectCollision";
import { BaseObject } from "../../utils/baseObject";
import { Bullet } from "../entities/bullet";

export class Game extends BaseObject
{
    public serverScene: ServerScene;

    public gameObjects = new Map<string, GameObject>();

    public gltfCollection: GLTFCollection = new GLTFCollection();
    
    constructor()
    {
        super()

        this.serverScene = new ServerScene(this);
    }

    public update(delta: number)
    {
        this.serverScene.update(delta);

        for(const gameObject of this.gameObjects.values())
        {
            gameObject.update(delta);

            const spawn = new THREE.Vector3(0, 0, 3);

            if(gameObject.getPosition().distanceTo(spawn) > 20)
            {
                const newPos = gameObject.getPosition();

                gameObject.setPosition(spawn.x, spawn.y, spawn.z);
                gameObject.setVelocity(0, 0, 0);
            }
        }
        
    }

    public startClock()
    {
        // clock
        const clock = new ServerClock()

        // for debugging you disable high accuracy
        // high accuracy uses much more cpu power
        if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()

        clock.onTick(delta => this.update(delta))
    }

    public spawnPed()
    {
        this.log(`spawn ped`);

        const ped = new Ped();
        ped.model = "ped";

        this.setupGameObject(ped, {mass: 1});

        return ped;
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
        this.serverScene.physics.physicsWorld.removeRigidBody(gameObject.collision.body!);
        
        this.gameObjects.delete(gameObject.id);

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
            const gltf = this.gltfCollection.gltfs.get(modelName);

            if(!gltf) throw "GLTF " + modelName + " was not found";

            gameObject.collision.createCollisionsFromGLTF(gltf, options);
        } else {
            gameObject.collision.makeBody(options);
        }

        this.gameObjects.set(gameObject.id, gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        gameObject.init();
    }

    public changeGameObjectId(gameObject: GameObject, id: string)
    {
        this.gameObjects.delete(id);

        gameObject.id = id;

        this.gameObjects.set(id, gameObject);
    }

    public createGround()
    {
        const gameObject = new GameObject();
        gameObject.model = "ground";
        gameObject.displayName = "ground"
        gameObject.drawCollision = false;

        //const modelName = gameObject.model;
        //const gltf = this.gltfCollection.gltfs.get(modelName);
        //if(!gltf) throw "GLTF " + modelName + " was not found";

        const box = gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(20, 2, 20));
        box.color = 0x00ff00;
        gameObject.collision.makeBody({mass: 0, position: new THREE.Vector3(0, -1, 0)});

        this.gameObjects.set(gameObject.id, gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        return gameObject;
    }

    public createBulding()
    {
        const gameObject = new GameObject();
        gameObject.model = "building";
        gameObject.displayName = "building"

        const modelName = gameObject.model;
        const gltf = this.gltfCollection.gltfs.get(modelName);
        if(!gltf) throw "GLTF " + modelName + " was not found";

        gameObject.collision.createCollisionsFromGLTF(gltf, {mass: 0});

        this.gameObjects.set(gameObject.id, gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

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

        this.gameObjects.set(gameObject.id, gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        return gameObject;
    }
}