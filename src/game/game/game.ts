import { Types } from "@enable3d/phaser-extension";
import { ServerScene } from "../scenes/serverScene";
import { GameObject } from "../gameObject/gameObject";
import { Player } from "../player/player";
import { Debug } from "../../utils/debug/debug";
import { ServerClock } from "@enable3d/ammo-on-nodejs";

export class Game
{
    public clientPlayer?: Player;

    private _players = new Map<string, Player>();

    public serverScene: ServerScene;

    public gameObjects: GameObject[] = [];
    
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

    public createCompoundBody()
    {
        // Create an empty compound shape
        const compoundShape = new Ammo.btCompoundShape();
    
        // Define two box shapes with their respective transforms
        const boxShape1 = new Ammo.btBoxShape(new Ammo.btVector3(0.5, 0.5, 0.5));
        const boxShape2 = new Ammo.btBoxShape(new Ammo.btVector3(0.5, 0.5, 0.5));
    
        const transform1 = new Ammo.btTransform();
        transform1.setIdentity();
        transform1.setOrigin(new Ammo.btVector3(0, 0, 0));
    
        const transform2 = new Ammo.btTransform();
        transform2.setIdentity();
        transform2.setOrigin(new Ammo.btVector3(0, 2, 0));
    
        // Add the box shapes to the compound shape with their transforms
        compoundShape.addChildShape(transform1, boxShape1);
        compoundShape.addChildShape(transform2, boxShape2);
    
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, 2, 0));

        // Create a motion state with the desired initial position and orientation
        const motionState = new Ammo.btDefaultMotionState(transform);
        
        // Calculate the inertia for the compound shape
        const localInertia = new Ammo.btVector3(0, 0, 0);
        compoundShape.calculateLocalInertia(1.0, localInertia);  // 1.0 is the mass
    
        // Create the rigid body using the compound shape
        const bodyInfo = new Ammo.btRigidBodyConstructionInfo(1.0, motionState, compoundShape, localInertia);
        const body = new Ammo.btRigidBody(bodyInfo);

        return {body: body, compoundShape: compoundShape};
    }

    public createBox()
    {
        Debug.log("Game", "create box");
        
        const body = this.createCompoundBody();

        this.serverScene.physics.physicsWorld.addRigidBody(body.body);

        const gameObject = new GameObject(body.body, body.compoundShape);

        this.gameObjects.push(gameObject);

        return gameObject;
    }
}