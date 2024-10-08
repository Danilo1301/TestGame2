import { Camera } from "../camera";
import { ClientEntityManager } from "../entities/clientEntities/clientEntityManager";
import { Gameface } from "../gameface/gameface";import { Input } from "../input";
;

export class GameScene extends Phaser.Scene
{
    public static Instance: GameScene;

    public clientEntityManager = new ClientEntityManager(this);
    public camera = new Camera();
    //public joystick = new Joystick();

    constructor()
    {
        super({});

        GameScene.Instance = this;
    }

    public async create()
    {
        this.camera.init();
        //this.joystick.create();
    }

    public updateScene(delta: number)
    {
        this.updatePlayerInput();
    }

    private updatePlayerInput()
    {
        const player = Gameface.Instance.player;

        if(!player) return;

        //camera

        const cameraDir = this.camera.getCameraQuaternion();
        player.lookDir.setValue(cameraDir.x(), cameraDir.y(), cameraDir.z(), cameraDir.w());
        Ammo.destroy(cameraDir);

        //input

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
            this.camera.position.setX(position.x());
            this.camera.position.setY(position.y());
            this.camera.position.setZ(position.z());

            /*
            const vehicle = player.onVehicle;
            if(vehicle)
            {
                const vehPosition = vehicle.getPosition();
                this.camera.position.setX(vehPosition.x());
                this.camera.position.setY(vehPosition.y());
                this.camera.position.setZ(vehPosition.z());
            }
            */
        }

        this.camera.update();
    }
}