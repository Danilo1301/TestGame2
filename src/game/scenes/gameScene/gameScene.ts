import { Gameface } from "../../gameface/gameface";
import { ThreeScene } from "../../three/threeScene";
import { ClientGameObject } from "../../gameObject/clientGameObject";
import { GameObject } from "../../gameObject/gameObject";
import { Input } from "../../../utils/input/input";
import { Joystick } from "../../../utils/ui/joystick";
import THREE from "three";

export class GameScene extends Phaser.Scene
{
    public static Instance: GameScene;

    public gameObjects = new Map<GameObject, ClientGameObject>();

    public joystick: Joystick = new Joystick();

    constructor()
    {
        super({});

        GameScene.Instance = this;
    }

    public async create()
    {
        this.joystick.create();
    }

    public update(time: number, delta: number)
    {
        this.joystick.update();

        Gameface.Instance.update(delta / 1000);

        const game = Gameface.Instance.game;

        for(const gameObject of game.gameObjects.values())
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
            const body = player.collision.body!;

            const position = player.getPosition();

            camera.position.set(position.x, position.y + 10, position.z + 5);
            camera.lookAt(position.x, position.y, position.z);

            const joystick = GameScene.Instance.joystick;

            player.inputX = 0;
            player.inputZ = 0;
            if(joystick.isMoving)
            {
                player.inputX = joystick.inputX * joystick.intensity;
                player.inputZ = joystick.inputY * joystick.intensity;
            }

            //player.setPosition(new THREE.Vector3(0, 0, 5));
        }
    }
}