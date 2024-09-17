import THREE from "three";
import { GameObject } from "./gameObject";

export enum eSyncType {
    SYNC_NONE,
    SYNC_DEFAULT
}

export class GameObjectSync {
    public syncType: eSyncType = eSyncType.SYNC_NONE;
    public gameObject!: GameObject;

    public targetPosition = new THREE.Vector3(0, 0, 0);
    public targetVelocity = new THREE.Vector3(0, 0, 0);
    public targetRotation = new Ammo.btQuaternion(0, 0, 0, 1);

    public onSetGameObjectPosition?: (x: number, y: number, z: number) => boolean;
    public onSetGameObjectRotation?: (x: number, y: number, z: number, w: number) => boolean;

    public update(delta: number)
    {
        if(this.syncType == eSyncType.SYNC_NONE) return;

        this.syncPosition(delta);
        this.syncVelocity(delta);
        this.syncRotation(delta);
    }

    private syncPosition(delta: number)
    {
        const position = this.gameObject.getPosition();
        const targetPosition = this.targetPosition;

        let syncPower = Math.min(delta * 15, 1);
        //syncPower = 0.3;
        if(position.distanceTo(targetPosition) > 2) syncPower = 1;
        //console.log(syncPower);

        const newPosition = position.lerp(targetPosition, syncPower);

        this.setGameObjectPosition(newPosition.x, newPosition.y, newPosition.z);
    }

    private setGameObjectPosition(x: number, y: number, z: number)
    {
        if(this.onSetGameObjectPosition)
        {
            const result = this.onSetGameObjectPosition(x, y, z);
            if(result == false)
            {
                //console.log("set cancelled")
                return;
            }
        }

        this.gameObject.setPosition(x, y, z);
    }

    private syncVelocity(delta: number)
    {
        //const position = this.gameObject.getPosition();
        const targetVelocity = this.targetVelocity;

        if(targetVelocity.length() > 0) this.gameObject.activateBody();

        this.gameObject.setVelocity(targetVelocity.x, targetVelocity.y, targetVelocity.z);
    }

    private syncRotation(delta: number)
    {
        const targetRotation = this.targetRotation;

        this.setGameObjectRotation(targetRotation.x(), targetRotation.y(), targetRotation.z(), targetRotation.w());
    }

    private setGameObjectRotation(x: number, y: number, z: number, w: number)
    {
        if(this.onSetGameObjectRotation)
        {
            const result = this.onSetGameObjectRotation(x, y, z, w);
            if(result == false)
            {
                //console.log("set cancelled")
                return;
            }
        }

        this.gameObject.setRotation(x, y, z, w);
    }

    public setPosition(x: number, y: number, z: number)
    {
        this.targetPosition.set(x, y, z);
    }

    public setVelocity(x: number, y: number, z: number)
    {
        this.targetVelocity.set(x, y, z);
    }

    public setRotation(x: number, y: number, z: number, w: number)
    {
        this.targetRotation.setValue(x, y, z, w);
    }
}