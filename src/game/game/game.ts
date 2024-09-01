import { Types } from "@enable3d/phaser-extension";
import { ServerScene } from "../scenes/serverScene";
import { GameObject } from "../gameObject/gameObject";
import { Player } from "../player/player";
import { Debug } from "../../utils/debug/debug";
import { ServerClock } from "@enable3d/ammo-on-nodejs";
import THREE from "three";
import path from "path"
import { isNode } from "../../utils/utils";
import { ThreeModelManager } from "../three/threeModelManager";
import { GLTFCollection } from "./gltfCollection";

export class Game
{
    public clientPlayer?: Player;

    private _players = new Map<string, Player>();

    public serverScene: ServerScene;

    public gameObjects: GameObject[] = [];

    public gltfCollection: GLTFCollection = new GLTFCollection();
    
    constructor()
    {
        this.serverScene = new ServerScene(this);
    }

    public update(delta: number)
    {
        this.serverScene.update(delta);
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

    public spawnPlayer(x: number, y: number, z: number)
    {
        const player = new Player();
        this._players.set(player.id, player);

        player.setPosition(x, y, z);
        
        return player;
    }

    public createGround()
    {
        const gameObject = new GameObject();

        const box = gameObject.collision.addBox(new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(10, 1, 10));
        box.color = 0x00ff00;
        gameObject.collision.makeBody({mass: 0, position: new THREE.Vector3(0, 0, 0)});

        this.gameObjects.push(gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        return gameObject;
    }

    public createBulding()
    {
        const gameObject = new GameObject();
        gameObject.model = "building";

        const modelName = gameObject.model;

        const gltf = this.gltfCollection.gltfs.get(modelName);

        if(!gltf) throw "GLTF " + modelName + " was not found";

        gameObject.collision.createCollisionsFromGLTF(gltf);

        //const box = gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));
        //box.color = 0x00ff00;
        //gameObject.collision.makeBody({mass: 0, position: new THREE.Vector3(0, 0, 0)});

        this.gameObjects.push(gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        /*
        setTimeout(() => {
            console.log("making new body")

            this.serverScene.physics.physicsWorld.removeRigidBody(gameObject.collision.body!);
            gameObject.collision.body = undefined;

            gameObject.collision.shapes = [];
            gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));
            const box2 = gameObject.collision.addBox(new THREE.Vector3(2, 0, 0), new THREE.Vector3(1, 1, 1));
            box2.color = 0xff0000;
            gameObject.collision.makeBody({mass: 0, position: new THREE.Vector3(0, 0, 0)});
            this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);
        }, 1000);
        */

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

        this.gameObjects.push(gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        return gameObject;
    }
}