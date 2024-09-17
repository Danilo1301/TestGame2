import { Gameface } from "../../gameface/gameface";
import { ThreeScene } from "../../three/threeScene";
import { ClientGameObject } from "../../gameObject/clientGameObject";
import { GameObject } from "../../gameObject/gameObject";
import { Input } from "../../../utils/input/input";
import { Joystick } from "../../../utils/ui/joystick";
import THREE from "three";
import { ammoVector3ToThree, threeVector3ToAmmo } from "../../../utils/utils";
import { Vector3_MoveAlongAngle } from "../../../utils/ammo/vector";
import { Camera } from "../../camera/camera";
import { FormatVector3, Quaternion_ToEuler } from "../../game/ammoUtils";
import { Ped } from "../../entities/ped";
import { ClientPed } from "../../clientEntities/clientPed";
import { IPacketData_EnterLeaveVehicle, PACKET_TYPE } from "../../network/packet";

export class GameScene extends Phaser.Scene
{
    public static Instance: GameScene;

    public gameObjects = new Map<GameObject, ClientGameObject>();

    public joystick: Joystick = new Joystick();

    public camera: Camera = new Camera();

    constructor()
    {
        super({});

        GameScene.Instance = this;
    }

    public async create()
    {
        this.joystick.create();
        this.camera.init();

        Input.events.on("pointerdown", () => {
            console.log("shoot");

            const player = Gameface.Instance.player!;
            const rotation = player.getRotation();

            const bullet = Gameface.Instance.game.gameObjectFactory.spawnBullet();

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
        Gameface.Instance.update(delta / 1000);

        this.joystick.update();

        this.updateGameScene(delta);

        Gameface.Instance.postUpdate(delta / 1000);
    }

    private updateGameScene(delta: number)
    {
        const game = Gameface.Instance.game;

        for(const gameObject of game.gameObjects.values())
        {
            if(!this.gameObjects.has(gameObject))
            {
                console.log("create client game object...");

                let clientGameObject: ClientGameObject | undefined;
                if(gameObject instanceof Ped)
                {
                    clientGameObject = new ClientPed(gameObject);
                } else {
                    clientGameObject = new ClientGameObject(gameObject);
                }
                    
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

            clientGameObject.update(delta);
        }
        
        for(const gameObject of destroyedObjects)
        {
            const clientGameObject = this.gameObjects.get(gameObject)!;
            clientGameObject.destroy();
            this.gameObjects.delete(gameObject);
        }
    
        const player = Gameface.Instance.player;

        if(player)
        {
            const vehicle = player.getVehicleIsUsing();
            const position = vehicle ? vehicle.getPosition() : player.getPosition();
            this.camera.position.setX(position.x);
            this.camera.position.setY(position.y);
            this.camera.position.setZ(position.z);
        }

        this.camera.update();

        // player movement
        if(player)
        {
            const cameraDir = this.camera.getCameraQuaternion();

            player.lookDir = cameraDir;

            player.inputX = 0;
            player.inputY = 0;
            player.inputZ = 0;

            if(Input.getKey("W"))
            {
                player.inputZ = 1;
            } else if(Input.getKey("S"))
            {
                player.inputZ = -1;
            }

            if(Input.getKey("A"))
            {
                player.inputX = -1;
            } else if(Input.getKey("D"))
            {
                player.inputX = 1;
            }

            if(Input.getKey(" "))
            {
                player.inputY = 1;
            }
        }

        if(player)
        {
        // player enter car
            if(Input.getKeyDown("F"))
            {
                if(!player.getVehicleIsUsing())
                {
                    const vehicle = player.getClosestVehicle();
                
                    if(vehicle)
                    {
                        console.log("enter vehicle")

                        player.enterVehicle(vehicle);

                        Gameface.Instance.network.send<IPacketData_EnterLeaveVehicle>(PACKET_TYPE.PACKET_ENTER_LEAVE_VEHICLE, {
                            vehicleId: vehicle.id
                        });
                    } else {
                        console.log("no vehicle found")
                    }
                } else {
                    Gameface.Instance.network.send<IPacketData_EnterLeaveVehicle>(PACKET_TYPE.PACKET_ENTER_LEAVE_VEHICLE, {
                        vehicleId: player.onVehicle!.id
                    });
                    player.leaveVehicle();
                }
            }
        }

        // joystick
        if(player)
        {
            const joystick = GameScene.Instance.joystick;
            
            if(joystick.isMoving)
            {
                player.inputX = joystick.inputX * joystick.intensity;
                player.inputZ = joystick.inputY * joystick.intensity;
            }
        }
    }
}