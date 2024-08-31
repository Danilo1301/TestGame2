import { ExtendedObject3D, Physics, ServerClock } from '@enable3d/ammo-on-nodejs'
import { Debug } from '../../utils/debug/debug';
import { GameObject } from '../gameObject/gameObject'
import { Game } from '../game/game';
import THREE from 'three';

export class ServerScene
{
    public game: Game;

    public physics!: Physics;
    public clock!: ServerClock;
    public objects: ExtendedObject3D[] = [];

    public box?: ExtendedObject3D;
    public box2?: GameObject;

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

        this.create()
    }

    public create()
    {
        const ground = this.physics.add.box({
            name: 'ground',
            width: 40,
            depth: 40,
            collisionFlags: 2,
            mass: 0,
            y: -5
        })

        //const box = this.physics.add.box({ name: 'box', y: 5 });

        //test
        const box2 = this.game.createBox();
        this.box2 = box2;

        const box3 = this.game.createBox();
    }

    public update(delta: number)
    {
        //console.log(`physics update, delta=${delta * 1000}`);

        this.physics.update(delta * 1000)

        if(this.box2)
        {
            const body = this.box2.body;
            const transform = body.getWorldTransform();
            const position = transform.getOrigin();

            body.applyTorque(new Ammo.btVector3(1, 1, 1));

            //console.log(position.y())
        }
    }
}