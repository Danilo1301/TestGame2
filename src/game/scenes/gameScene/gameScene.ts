import { Gameface } from "../../gameface/gameface";
import { ThreeScene } from "../../three/threeScene";
import { ClientGameObject } from "../../gameObject/clientGameObject";
import { GameObject } from "../../gameObject/gameObject";
import { Input } from "../../../utils/input/input";

export class GameScene extends Phaser.Scene
{
    public static Instance: GameScene;

    public gameObjects = new Map<GameObject, ClientGameObject>();

    constructor()
    {
        super({});

        GameScene.Instance = this;
    }

    public async create()
    {
        
    }

    public update(time: number, delta: number)
    {
        Gameface.Instance.update(delta / 1000);

     
        const game = Gameface.Instance.game;

        for(const gameObject of game.gameObjects)
        {
            if(!this.gameObjects.has(gameObject))
            {
                console.log("create client game object...");

                const clientGameObject = new ClientGameObject(gameObject);
                this.gameObjects.set(gameObject, clientGameObject);
                clientGameObject.create();
            }
        }

        
        for(const clientGameObject of this.gameObjects.values())
        {
            clientGameObject.update();
        }
        
       
        const player = Gameface.Instance.player;
        const camera = ThreeScene.Instance.third.camera;

        if(player)
        {
            const position = player.getPosition();

            //camera.position.set(position.x, position.y, position.z + 10);
            camera.lookAt(position.x, position.y, position.z);

            if(Input.isKeyDown("A"))
            {
                player.collision.body?.applyForce(new Ammo.btVector3(-10, 0, 0), new Ammo.btVector3(0, 0, 0));
            }

            if(Input.isKeyDown("D"))
            {
                player.collision.body?.applyForce(new Ammo.btVector3(10, 0, 0), new Ammo.btVector3(0, 0, 0));
            }

            if(Input.isKeyDown("W"))
            {
                player.collision.body?.applyForce(new Ammo.btVector3(0, 0, -10), new Ammo.btVector3(0, 0, 0));
            }

            if(Input.isKeyDown("S"))
            {
                player.collision.body?.applyForce(new Ammo.btVector3(0, 0, 10), new Ammo.btVector3(0, 0, 0));
            }

            if(Input.isKeyDown(" "))
            {
                player.collision.body?.applyForce(new Ammo.btVector3(0, 20, 0), new Ammo.btVector3(0, 0, 0));
            }
        }
    }
}