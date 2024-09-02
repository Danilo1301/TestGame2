import { Gameface } from "../../gameface/gameface";
import { ThreeScene } from "../../three/threeScene";
import { ClientGameObject } from "../../gameObject/clientGameObject";
import { GameObject } from "../../gameObject/gameObject";
import { Input } from "../../../utils/input/input";
import { Joystick } from "../../../utils/ui/joystick";
import THREE from "three";
import { ammoVector3ToThree, threeVector3ToAmmo } from "../../../utils/utils";
import { Vector3_MoveAlongAngle } from "../../../utils/ammo/vector";

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

        Input.events.on("pointerdown", () => {
            console.log("shoot");

            const player = Gameface.Instance.player!;
            const rotation = player.getRotation();

            const bullet = Gameface.Instance.game.spawnBullet();

            let bulletPosition = threeVector3ToAmmo(player.getPosition());

            bulletPosition.setY(bulletPosition.y() + 0);

            Vector3_MoveAlongAngle(bulletPosition, -player.angle + Math.PI/2, 2);

            //const forward = player.forward;
            //const move = ammoVector3ToThree(forward.op_mul(2));

            //bulletPosition.add(move);

            rotation.setEulerZYX(0, player.angle, 0);

            bullet.setPosition(bulletPosition.x(), bulletPosition.y(), bulletPosition.z());
            bullet.setRotation(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        });
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

        const destroyedObjects: GameObject[] = [];
        
        for(const clientGameObject of this.gameObjects.values())
        {
            if(clientGameObject.gameObject.destroyed)
            {
                destroyedObjects.push(clientGameObject.gameObject);
                continue;
            }

            clientGameObject.update();
        }
        
        for(const gameObject of destroyedObjects)
        {
            const clientGameObject = this.gameObjects.get(gameObject)!;
            clientGameObject.destroy();
            this.gameObjects.delete(gameObject);
        }

       
        const player = Gameface.Instance.player;
        const camera = ThreeScene.Instance.third.camera;

        if(player)
        {
            const gameSize = Gameface.Instance.getGameSize();
            const centerOfScreen = new Phaser.Math.Vector2(gameSize.x / 2, gameSize.y / 2);
            const mousePosition = Input.mousePosition;
            const angle = -Phaser.Math.Angle.BetweenPoints(centerOfScreen, mousePosition) + Math.PI/2;

            player.angle = angle;

            const body = player.collision.body!;

            const position = player.getPosition();

            camera.position.set(position.x, position.y + 10, position.z + 5);
            camera.lookAt(position.x, position.y, position.z);

            const joystick = GameScene.Instance.joystick;

            player.inputX = 0;
            player.inputY = 0;
            player.inputZ = 0;
            
            if(joystick.isMoving)
            {
                player.inputX = joystick.inputX * joystick.intensity;
                player.inputZ = joystick.inputY * joystick.intensity;
            }

            if(Input.isKeyDown("A"))
            {
                player.inputX = -1;
            }
            if(Input.isKeyDown("D"))
            {
                player.inputX = 1;
            }
            if(Input.isKeyDown("W"))
            {
                player.inputZ = -1;
            }
            if(Input.isKeyDown("S"))
            {
                player.inputZ = 1;
            }
            if(Input.isKeyDown(" "))
            {
                player.inputY = 1;
            }

            //player.setPosition(new THREE.Vector3(0, 0, 5));
        }
    }
}