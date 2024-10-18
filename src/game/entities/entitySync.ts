import THREE from "three";
import { Entity } from "./entity";
import { Vector3_DistanceTo } from "../../shared/ammo/vector";
import { ammoQuaternionToThree, ammoVector3ToThree } from "../../shared/utils";

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

    constructor(entity: Entity)
    {
        this.entity = entity;
    }

    public update(delta: number)
    {
        if(this.syncType == eSyncType.SYNC_NONE) return;

        if(this.syncType == eSyncType.SYNC_RECONCILIATE || this.syncType == eSyncType.SYNC_DEFAULT)
        {
            if(this.getDistanceFromEntity() >= 3)
            {
                this.forceSetPosition();
            }
        }

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

        let lerpAmount = 0.005 * delta;
        //console.log(lerpAmount);

        if(this.syncType == eSyncType.SYNC_RECONCILIATE)
        {
            if(this.getDistanceFromEntity() < 3)
            {
                update = false;
            }
        }

        const newPosition = position_t.lerp(targetPosition_t, lerpAmount);

        if(update)
            this.setEntityPosition(newPosition.x, newPosition.y, newPosition.z);
    }

    public forceSetPosition()
    {
        this.setEntityPosition(this.targetPosition.x(), this.targetPosition.y(), this.targetPosition.z());
        this.setEntityRotation(this.targetRotation.x(), this.targetRotation.y(), this.targetRotation.z(), this.targetRotation.w());
    }

    private setEntityPosition(x: number, y: number, z: number)
    {   
        this.entity.setPosition(x, y, z);
    }

    private syncVelocity(delta: number)
    {
        // const newVelocity = this.targetVelocity;
        // let update = true;

        // if(this.syncType == eSyncType.SYNC_RECONCILIATE)
        // {
        //     update = false;
        // }

        // if(update)
        //     this.entity.setVelocity(newVelocity.x(), newVelocity.y(), newVelocity.z());
    }

    private syncRotation(delta: number)
    {

        //const rotation_t = ammoQuaternionToThree(this.entity.getRotation());

        const targetRotation = this.targetRotation;
        //const targetRotation_t = ammoQuaternionToThree(this.targetRotation);

        // let lerpAmount = 0.005 * delta;

        // rotation_t.slerp(targetRotation_t, lerpAmount);

        let update = true;

        if(this.syncType == eSyncType.SYNC_RECONCILIATE)
        {
            update = false;
        }
        
        if(update)
            this.setEntityRotation(targetRotation.x(), targetRotation.y(), targetRotation.z(), targetRotation.w());
    }

    private setEntityRotation(x: number, y: number, z: number, w: number)
    {
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

        if(this.syncType != eSyncType.SYNC_RECONCILIATE)
        {
            //this.setEntityRotation(x, y, z, w);
        }
    }
}