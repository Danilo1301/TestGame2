import THREE from "three";
import { Entity } from "./entity";
import { Vector3_DistanceTo } from "../../utils/ammo/vector";
import { ammoVector3ToThree } from "../../utils/utils";

export enum eSyncType {
    SYNC_NONE,
    SYNC_DEFAULT,
    SYNC_RECONCILIATE
}

export class EntitySync {
    public syncType: eSyncType = eSyncType.SYNC_NONE;
    public entity: Entity;

    public targetPosition = new Ammo.btVector3(0, 0, 0);
    public targetVelocity = new Ammo.btVector3(0, 0, 0);
    public targetRotation = new Ammo.btQuaternion(0, 0, 0, 1);

    public onSetGameObjectPosition?: (x: number, y: number, z: number) => boolean;
    public onSetGameObjectRotation?: (x: number, y: number, z: number, w: number) => boolean;

    constructor(entity: Entity)
    {
        this.entity = entity;
    }

    public update(delta: number)
    {
        if(this.syncType == eSyncType.SYNC_NONE) return;

        this.syncPosition(delta);
        this.syncVelocity(delta);
        this.syncRotation(delta);
    }

    private getDistanceFromEntity()
    {
        const newPosition = this.targetPosition;
        const currentPosition = this.entity.getPosition();

        const distance = Vector3_DistanceTo(currentPosition, newPosition);

        return distance;
    }

    private syncPosition(delta: number)
    {
        let update = true;

        const targetPosition_t = ammoVector3ToThree(this.targetPosition);
        
        const position = this.entity.getPosition();
        const position_t = ammoVector3ToThree(position);

        const lerpAmount = 0.005 * delta;
        //console.log(lerpAmount);

        const newPosition = position_t.lerp(targetPosition_t, lerpAmount);
    

        if(this.syncType == eSyncType.SYNC_RECONCILIATE)
        {
            if(this.getDistanceFromEntity() < 10)
            {
                update = false;
            }
        }

        if(update)
            this.setEntityPosition(newPosition.x, newPosition.y, newPosition.z)
    }

    private setEntityPosition(x: number, y: number, z: number)
    {
        if(this.onSetGameObjectPosition)
        {
            const result = this.onSetGameObjectPosition(x, y, z);
            if(result == false)
            {
                return;
            }
        }
        
        this.entity.setPosition(x, y, z);
    }

    private syncVelocity(delta: number)
    {
        const newVelocity = this.targetVelocity;
        let update = true;

        if(this.syncType == eSyncType.SYNC_RECONCILIATE)
        {
            update = false;
        }

        if(update)
            this.entity.setVelocity(newVelocity.x(), newVelocity.y(), newVelocity.z());
    }

    private syncRotation(delta: number)
    {
        const newRotation = this.targetRotation;
        let update = true;

        if(this.syncType == eSyncType.SYNC_RECONCILIATE)
        {
            update = false;
        }

        if(update)
            this.setEntityRotation(newRotation.x(), newRotation.y(), newRotation.z(), newRotation.w());
    }

    private setEntityRotation(x: number, y: number, z: number, w: number)
    {
        if(this.onSetGameObjectRotation)
        {
            const result = this.onSetGameObjectRotation(x, y, z, w);
            if(result == false)
            {
                return;
            }
        }

        this.entity.setRotation(x, y, z, w);
    }

    public setPosition(x: number, y: number, z: number)
    {
        this.targetPosition.setValue(x, y, z);
    }

    public setVelocity(x: number, y: number, z: number)
    {
        this.targetVelocity.setValue(x, y, z);
    }

    public setRotation(x: number, y: number, z: number, w: number)
    {
        this.targetRotation.setValue(x, y, z, w);
    }
}