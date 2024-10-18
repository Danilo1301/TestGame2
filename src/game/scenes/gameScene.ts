import { Quaternion_Right, Quaternion_Up } from "../../shared/ammo/quaterion";
import { Camera } from "../camera";
import { ClientEntityManager } from "../entities/clientEntities/clientEntityManager";
import { Gameface } from "../gameface/gameface";import { Input } from "../input";
import { PACKET_TYPE } from "../network/packet";
import { Joystick } from "../joystick";
import { Widgets } from "../widgets/widgets";
import { getIsMobile } from "../../shared/utils";
import { Chat } from "../chat";

export class GameScene extends Phaser.Scene
{
    public static Instance: GameScene;

    public clientEntityManager = new ClientEntityManager(this);
    public camera = new Camera();
    public joystick = new Joystick();
    public chat = new Chat();

    private _prevMouse2Down: boolean = false;

    constructor()
    {
        super({});

        GameScene.Instance = this;
    }

    public async create()
    {
        Widgets.init();

        this.camera.init();
        this.joystick.create();
        this.chat.create();

        const gameSize = Gameface.Instance.getGameSize();

        const crosshair = this.add.image(gameSize.x/2, gameSize.y/2, "crosshair_shotgun");
        crosshair.setOrigin(0.5);
    }

    public updateScene(delta: number)
    {
        Widgets.update();
        this.updatePlayerInput();
    }

    private updatePlayerInput()
    {
        const player = Gameface.Instance.player;

        this.joystick.update();

        if(!player) return;

        //camera

        const cameraDir = this.camera.getCameraQuaternion();
        player.lookDir.setValue(cameraDir.x(), cameraDir.y(), cameraDir.z(), cameraDir.w());
        Ammo.destroy(cameraDir);

        const cameraPosition = this.camera.position;
        player.controlledByPlayer = true;
        player.cameraPosition.setValue(cameraPosition.x(), cameraPosition.y(), cameraPosition.z());

        function magicallyRotateAQuaternion180Degrees(quat: Ammo.btQuaternion)
        {
            const rotationAxis = new Ammo.btVector3(0, 1, 0);    // Y-axis (change for other axes)
            const angle = Math.PI;                               // 180 degrees in radians

            // Set the rotation by 180 degrees around the Y-axis
            const rotationQuat = new Ammo.btQuaternion(0, 0, 0, 1);
            rotationQuat.setRotation(rotationAxis, angle);

            // Multiply the original quaternion by the rotation quaternion
            quat.op_mulq(rotationQuat);

            Ammo.destroy(rotationAxis);
            Ammo.destroy(rotationQuat);
        }

        magicallyRotateAQuaternion180Degrees(player.lookDir);

        //input

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

        if(this.joystick.isMoving)
        {
            player.inputZ = this.joystick.inputForward;
            player.inputX = this.joystick.inputRight;
        }

        //aim

        if(!getIsMobile())
        {
            player.mouse1 = Input.isMouseDown();
        }

        const mouse2Down = Input.isMouse2Down();
        if(this._prevMouse2Down != mouse2Down)
        {
            this._prevMouse2Down = mouse2Down;   

            player.aiming = mouse2Down;
        }

        //vehicle

        if(Input.getKeyDown("F"))
        {
            this.tryEnterOrLeaveVehicle();
        }

        //camera

        if(Input.getKeyDown("V"))
        {
            if(this.camera.distance == 0)
            {
                this.camera.distance = 5;
            } else {
                this.camera.distance = 0;
            }
        }
    }

    public updateCamera()
    {
        const player = Gameface.Instance.player;

        // camera position
        if(player)
        {
            const position = player.getPosition();

            const camPosition = new Ammo.btVector3(position.x(), position.y() + 1, position.z())

            if(player.aiming)
            {
                const quat = this.camera.getCameraQuaternion();

                const right = Quaternion_Right(quat);
                right.op_mul(0.5);

                const up = Quaternion_Up(quat);
                up.op_mul(0.8);

                camPosition.op_add(right);
                camPosition.op_add(up);

                Ammo.destroy(right);
                Ammo.destroy(up);
                Ammo.destroy(quat);

                this.camera.distance = 2;
            } else {
                this.camera.distance = 3;
            }

            this.camera.position.setX(camPosition.x());
            this.camera.position.setY(camPosition.y());
            this.camera.position.setZ(camPosition.z());

            Ammo.destroy(camPosition);

            
            const vehicle = player.onVehicle;
            if(vehicle)
            {
                const vehPosition = vehicle.getPosition();
                this.camera.position.setX(vehPosition.x());
                this.camera.position.setY(vehPosition.y());
                this.camera.position.setZ(vehPosition.z());
                
                this.camera.distance = 6;
            }
        }

        this.camera.update();
    }

    public tryEnterOrLeaveVehicle()
    {
        const player = Gameface.Instance.player;

        if(!player) return;

        if(!player.onVehicle)
        {
            const vehicle = player.getClosestVehicle();
        
            if(vehicle)
            {
                console.log("enter vehicle");

                player.enterVehicle(vehicle);

                // Gameface.Instance.network.send<IPacketData_EnterLeaveVehicle>(PACKET_TYPE.PACKET_ENTER_LEAVE_VEHICLE, {
                //     vehicleId: vehicle.id
                // });
            } else {
                console.log("no vehicle found")
            }
        } else {
            console.log("leave vehicle");

            player.leaveVehicle();
            
            // Gameface.Instance.network.send<IPacketData_EnterLeaveVehicle>(PACKET_TYPE.PACKET_ENTER_LEAVE_VEHICLE, {
            //     vehicleId: player.onVehicle!.id
            // });
        }
    }
}