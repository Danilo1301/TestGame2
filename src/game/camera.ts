import { clamp } from "three/src/math/MathUtils.js";
import { BaseObject } from "../shared/baseObject";
import { Gameface } from "./gameface/gameface";
import { Input } from "./input";
import { ThreeScene } from "./scenes/threeScene";
import THREE from "three";
import { ammoQuaternionToThree, getIsMobile } from "../shared/utils";
import { THREEQuaternion_Rotate } from "../shared/three/quaternion";

export class Camera extends BaseObject
{
    public position = new Ammo.btVector3(0, 3, 0);

    public cameraView = new Phaser.Math.Vector2(0, 0);

    public distance = 5;

    public get threeCamera() { return ThreeScene.Instance.third.camera; };

    public init()
    {
        Input.events.on('pointermove', (pointer: any, movementX: number, movementY: number) => {

            if(!getIsMobile())
            {
                if(!Gameface.Instance.isPointerLocked()) return;
            }


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

        const distance = this.distance;
        const thirdPerson = distance > 0;

        if(thirdPerson)
        {
            const xDirection = -1;
            const yDirection = 1;
    
            const lDirection = new THREE.Vector3(
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
        } else {
            camera.position.set(
                this.position.x(),
                this.position.y(),
                this.position.z()
            );

            let quat = new THREE.Quaternion(0, 0, 0, 1);

            quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angleX);
            
            quat = THREEQuaternion_Rotate(new THREE.Vector3(1, 0, 0), quat, -angleY);

            camera.setRotationFromQuaternion(quat);
        }
    }

    public getCameraQuaternion()
    {
        const camQuat = this.threeCamera.quaternion;
        const quat = new Ammo.btQuaternion(camQuat.x, camQuat.y, camQuat.z, camQuat.w);
        return quat;
    }

    public getCameraPosition()
    {
        const camQuat = this.threeCamera.position;
        const quat = new Ammo.btVector3(camQuat.x, camQuat.y, camQuat.z);
        return quat;
    }
}