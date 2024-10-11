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
        this.game.entityFactory.spawnGround(0, 0, 0, 50, 50);

        //this.game.entityFactory.spawnPed(0, 5, 0);
        //this.game.entityFactory.spawnPed(0, 5, 0);

        // setInterval(() => {
        //     if(box.position.y <= 1) return;
        //     console.log(box.position.y)
        // }, 10);

        //this.game.entityFactory.spawnGround(100, 100);
        //

        //this.game.createBulding();

        //this.game.spawnVehicle();

        //const box2 = this.game.createBox();
        //this.box2 = box2;

        //const box3 = this.game.createBox(); 

        //this.game.entityFactory.spawnEmptyEntity(0, 2, 0);
        
        return;

        const box = this.game.entityFactory.spawnBox(0, 5, 0);
        box.setPosition(10, 2, 0);

        let pos = 0;

        setInterval(() => {
            if(pos == 0)
            {
                pos = 1;
                box.setPosition(10, 2, 0);
            } else {
                pos = 0;
                box.setPosition(-10, 2, 0);
            }
        }, 4000);

        const npc = this.game.entityFactory.spawnPed(0, 5, 0);
        npc.inputZ = 1;        

        setInterval(() => {
            npc.lookAt(box.getPosition());
        }, 20);

        const box2 = this.game.entityFactory.spawnBox(0, 2, 0);
        setTimeout(() => {
            this.game.entityFactory.removeEntity(box2);
        }, 2000);
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
            npc.lookAt(box.getPosition());
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