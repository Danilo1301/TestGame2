import { ExtendedObject3D, Physics, ServerClock } from '@enable3d/ammo-on-nodejs'
import { Game } from '../game/game';
import { Debug } from '../../shared/debug';

export class ServerScene
{
    public game: Game;

    public physics!: Physics;
    public clock!: ServerClock;
    public objects: ExtendedObject3D[] = [];

    public box?: ExtendedObject3D;

    public testRigidBody?: Ammo.btRigidBody;

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
        this.game.entityFactory.spawnGround(0, 0, 0, 50, 50);

        /*
        const ground = this.physics.add.box({
            name: 'ground',
            width: 40,
            depth: 40,
            collisionFlags: 2,
            mass: 0,
            y: -2
        })
        */
    }

    public createLocalScene()
    {
        
    }

    public createServerScene()
    {
        const box = this.game.entityFactory.spawnBox(0, 5, 0);

        const npc = this.game.entityFactory.spawnPed(0, 5, 0);
        npc.equipWeapon(0);
        npc.aiming = true;
        
        setInterval(() => {
            npc.lookAtEntity(box);
            npc.weapon!.shoot();
        }, 1000);

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

        if(!this.physics) return;

        //Debug.log("ServerScene", "update physics");

        this.physics.update(delta)

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