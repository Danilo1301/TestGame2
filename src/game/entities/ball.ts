import { Entity } from './entity';
import THREE from 'three';
import { eSyncType } from './entitySync';

export class Ball extends Entity
{
    public initCollision()
    {
        super.initCollision();
        this.collision.addSphere(new THREE.Vector3(0, 0, 0), 1);
    }

    public update(delta: number)
    {
        super.update(delta);

   
        if(this.sync.syncType == eSyncType.SYNC_DEFAULT)
        {
            const v = this.sync.targetRotation;
            console.log(`${v.x().toFixed(2)}, ${v.y().toFixed(2)}, ${v.z().toFixed(2)}, ${v.w().toFixed(2)}`);
        } else {
            const v = this.getRotation();
            console.log(`${v.x().toFixed(2)}, ${v.y().toFixed(2)}, ${v.z().toFixed(2)}, ${v.w().toFixed(2)}`);
        }
    }
}