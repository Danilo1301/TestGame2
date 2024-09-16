import { Scene3D, Types } from "@enable3d/phaser-extension";
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
import { AmmoUtils, FormatVector3 } from "./ammoUtils";
import { Input } from "../../utils/input/input";
import { Quaternion_Multiply_Vector3 } from "../../utils/ammo/quaterion";
import { GameObjectFactory } from "./gameObjectFactory";

const WHEEL_MASS = 100;
const ROTOR_MASS = 500;
const AXIS_MASS = 300;
const VEHICLE_MASS = 300;
const FORCE = 300;

export class Game extends BaseObject
{
    public serverScene: ServerScene;

    public gameObjectFactory: GameObjectFactory;
    public gameObjects = new Map<string, GameObject>();

    public gltfCollection: GLTFCollection = new GLTFCollection();

    public ammoUtils: AmmoUtils;
    
    constructor()
    {
        super()

        this.gameObjectFactory = new GameObjectFactory(this);
        this.serverScene = new ServerScene(this);
        this.ammoUtils = new AmmoUtils();
    }

    public init()
    {
        this.serverScene.init();
        this.ammoUtils.physicsWorld = this.serverScene.physics.physicsWorld;
    }

    public update(delta: number)
    {
        this.serverScene.update(delta);

        for(const gameObject of this.gameObjects.values())
        {
            gameObject.update(delta);

            const spawn = new THREE.Vector3(0, 0, 3);

            if(gameObject.getPosition().distanceTo(spawn) > 80)
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
}