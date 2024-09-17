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

    public update(delta: number)
    {
        if(this.syncType == eSyncType.SYNC_NONE) return;

        this.syncPosition(delta);
        this.syncVelocity(delta);
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

        this.gameObject.setPosition(newPosition.x, newPosition.y, newPosition.z);
    }

    private syncVelocity(delta: number)
    {
        //const position = this.gameObject.getPosition();
        const targetVelocity = this.targetVelocity;

        if(targetVelocity.length() > 0) this.gameObject.activateBody();

        this.gameObject.setVelocity(targetVelocity.x, targetVelocity.y, targetVelocity.y);
    }

    public setPosition(x: number, y: number, z: number)
    {
        this.targetPosition.set(x, y, z);
    }

    public setVelocity(x: number, y: number, z: number)
    {
        this.targetVelocity.set(x, y, z);
    }
}