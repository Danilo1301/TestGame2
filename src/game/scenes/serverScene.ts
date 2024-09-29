import { ExtendedObject3D, Physics, ServerClock } from '@enable3d/ammo-on-nodejs'
import { Debug } from '../../utils/debug/debug';
import { Game } from '../game/game';
import { isNode } from '../../utils/utils';

export class ServerScene
{
    public game: Game;

    public physics!: Physics;
    public clock!: ServerClock;
    public objects: ExtendedObject3D[] = [];

    public box?: ExtendedObject3D;

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
        const ground = this.physics.add.box({
            name: 'ground',
            width: 40,
            depth: 40,
            collisionFlags: 2,
            mass: 0,
            y: 0
        })

        */

        this.game.entityFactory.spawnGround(100, 100);
        //

        //this.game.createBulding();

        //this.game.spawnVehicle();

        //const box2 = this.game.createBox();
        //this.box2 = box2;

        //const box3 = this.game.createBox();

        
    }

    public createServerScene()
    {
        //this.game.entityFactory.spawnBox(0.2, 6, 0);
        //this.game.entityFactory.spawnBox(0.3, 7, 0);
        //this.game.entityFactory.spawnBox(0.4, 8, 0);
        //this.game.entityFactory.spawnBox(0.5, 9, 0);
        
        //this.game.entityFactory.spawnPed(0, 3, 0);

        //this.game.entityFactory.spawnVehicle(0, 2, -10);
        //this.game.entityFactory.spawnBike(5, 2, -10);
    }

    public update(delta: number)
    {
        const now = performance.now();
        const timeDiff = now - this._lastUpdated;
        this._lastUpdated = now;

        //console.log(timeDiff)
        
        if(!this.physics) return;

        //Debug.log("ServerScene", "update physics");

        this.physics.update(timeDiff)

        /*
        if(isNode())
        {
            this.physics.update(timeDiff / (16/30)) // 16ms in client and 30ms in server
        } else {
            this.physics.update(timeDiff)
        }
        */

        
    }
}