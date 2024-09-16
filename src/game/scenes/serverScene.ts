import { ExtendedObject3D, Physics, ServerClock } from '@enable3d/ammo-on-nodejs'
import { Debug } from '../../utils/debug/debug';
import { GameObject } from '../gameObject/gameObject'
import { Game } from '../game/game';
import THREE from 'three';
import { Gameface } from '../gameface/gameface';
import { isNode } from '../../utils/utils';

export class ServerScene
{
    public game: Game;

    public physics!: Physics;
    public clock!: ServerClock;
    public objects: ExtendedObject3D[] = [];

    public box?: ExtendedObject3D;
    public box2?: GameObject;

    public testRigidBody?: Ammo.btRigidBody;

    private _lastUpdated: number = performance.now();

    constructor(game: Game)
    {
        this.game = game;
    }

    public async init()
    {
        Debug.log("ServerScene", "init");

        // test if we have access to Ammo
        Debug.log('ServerScene', 'Ammo', new Ammo.btVector3(1, 2, 3).y() === 2)

        // init the Physics
        this.physics = new Physics();
    }

    public create()
    {
        /*
        this.physics.add.box({ name: 'box', y: 5 });
        this.physics.add.box({ name: 'box', y: 5 });
        this.physics.add.box({ name: 'box', y: 5 });

        const ground = this.physics.add.box({
            name: 'ground',
            width: 40,
            depth: 40,
            collisionFlags: 2,
            mass: 0,
            y: 0
        })

        */

        //this.game.createBulding();

        //this.game.spawnVehicle();

        //const box2 = this.game.createBox();
        //this.box2 = box2;

        //const box3 = this.game.createBox();

    
        const ground = this.game.gameObjectFactory.createGround();
    }

    public createServerScene()
    {
        this.game.gameObjectFactory.spawnNPC();
        this.game.gameObjectFactory.spawnNPC();
    }

    public update(delta: number)
    {
        const now = performance.now();
        const timeDiff = now - this._lastUpdated;
        this._lastUpdated = now;

        //console.log(timeDiff)
        
        if(!this.physics) return;

        if(isNode())
        {
            this.physics.update(timeDiff / (16/30)) // 16ms in client and 30ms in server
        } else {
            this.physics.update(timeDiff)
        }

        //this.physics.update(delta * 1000)

        if(this.box2)
        {
            const body = this.box2.collision.body!;
            const transform = body.getWorldTransform();
            const position = transform.getOrigin();

            body.applyTorque(new Ammo.btVector3(1, 1, 1));

            //console.log(position.y())
        }
    }
}