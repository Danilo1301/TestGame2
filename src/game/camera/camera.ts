import { clamp } from "three/src/math/MathUtils";
import { BaseObject } from "../../utils/baseObject";
import { Input } from "../../utils/input/input";
import { Gameface } from "../gameface/gameface";
import { ThreeScene } from "../three/threeScene";

export class Camera extends BaseObject
{
    public position = new Ammo.btVector3(0, 0, 0);

    public cameraView = new Phaser.Math.Vector2(0, 0);

    public get threeCamera() { return ThreeScene.Instance.third.camera; };

    public init()
    {
        Input.events.on('pointermove', (pointer: PointerEvent, movementX: number, movementY: number) => {

            if(!Gameface.Instance.isPointerLocked()) return;

            const sentitivity = 0.4;

            this.cameraView.x += movementX * sentitivity;
            this.cameraView.y += movementY * sentitivity;

            this.cameraView.y = clamp(this.cameraView.y, -90, 90);

        });
    }

    public update()
    {
        const camera = this.threeCamera;

        const angleX = Phaser.Math.DegToRad(this.cameraView.x % 360);
        const angleY = Phaser.Math.DegToRad(this.cameraView.y);
        const distance = 4;
        
        const xDirection = -1;
        const yDirection = 1;

        const lDirection = new Phaser.Math.Vector3(
            Math.sin(xDirection * angleX) *  Math.cos(angleY) * distance * yDirection,  // Horizontal movement combined with vertical tilt
            Math.sin(angleY) * distance,                    // Vertical movement
            Math.cos(xDirection * angleX) * Math.cos(angleY) * distance * yDirection  // Depth (Z-axis) movement combined with vertical tilt
        );

        camera.position.set(
            this.position.x() + lDirection.x,
            this.position.y() + lDirection.y,
            this.position.z() + lDirection.z
        );
        camera.lookAt(this.position.x(), this.position.y(), this.position.z());
    }

    public getCameraQuaternion()
    {
        const camQuat = this.threeCamera.quaternion;
        const quat = new Ammo.btQuaternion(camQuat.x, camQuat.y, camQuat.z, camQuat.w);
        return quat;
    }
}