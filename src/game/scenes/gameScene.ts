import { Gameface } from "../gameface/gameface";;
import { Joystick } from "../../utils/ui/joystick";
import { Camera } from "../camera/camera";
import { ClientEntityManager } from "../entities/clientEntities/clientEntityManager";
import { Input } from "../../utils/input/input";
import { Ped } from "../entities/ped";
import { IPacketData_EnterLeaveVehicle, PACKET_TYPE } from "../network/packet";

export class GameScene extends Phaser.Scene
{
    public static Instance: GameScene;

    public joystick: Joystick = new Joystick();
    public camera: Camera = new Camera();
    public clientEntityManager = new ClientEntityManager(this);

    constructor()
    {
        super({});

        GameScene.Instance = this;
    }

    public async create()
    {
        this.joystick.create();
        this.camera.init();
    }

    public update(time: number, delta: number)
    {
        Gameface.Instance.update(delta / 1000);

        this.clientEntityManager.update(delta);

        this.joystick.update();

        this.updateGameScene(delta);

        Gameface.Instance.postUpdate(delta / 1000);
    }

    private updateGameScene(delta: number)
    {
        const game = Gameface.Instance.game;

        const player = Gameface.Instance.player as Ped;

        // camera position
        if(player)
        {
            const position = player.getPosition();
            this.camera.position.setX(position.x());
            this.camera.position.setY(position.y());
            this.camera.position.setZ(position.z());

            const vehicle = player.onVehicle;
            if(vehicle)
            {
                const vehPosition = vehicle.getPosition();
                this.camera.position.setX(vehPosition.x());
                this.camera.position.setY(vehPosition.y());
                this.camera.position.setZ(vehPosition.z());
            }
        }

        this.camera.update();

        // player movement
        if(player)
        {
            const cameraDir = this.camera.getCameraQuaternion();
            
            player.lookDir.setValue(cameraDir.x(), cameraDir.y(), cameraDir.z(), cameraDir.w());

            const rotationAxis = new Ammo.btVector3(0, 1, 0);    // Y-axis (change for other axes)
            const angle = Math.PI;                               // 180 degrees in radians

            // Set the rotation by 180 degrees around the Y-axis
            const rotationQuat = new Ammo.btQuaternion(0, 0, 0, 1);
            rotationQuat.setRotation(rotationAxis, angle);

            // Multiply the original quaternion by the rotation quaternion
            player.lookDir.op_mulq(rotationQuat);

            Ammo.destroy(rotationAxis);
            Ammo.destroy(rotationQuat);

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

        // player enter car
        if(player)
        {
            if(Input.getKeyDown("F"))
            {
                if(!player.onVehicle)
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
                    console.log("leave vehicle")

                    Gameface.Instance.network.send<IPacketData_EnterLeaveVehicle>(PACKET_TYPE.PACKET_ENTER_LEAVE_VEHICLE, {
                        vehicleId: player.onVehicle!.id
                    });
                    player.leaveVehicle();
                }
            }
        }

        // grau
        if(player)
        {
            if(player.onVehicle)
            {
                player.onVehicle.darGrau = false;
                if(Input.getKey("SHIFT"))
                {
                    player.onVehicle.darGrau = true;
                }
            }
        }
    }
}