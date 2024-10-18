import { Weapon } from '../weapons/weapon';
import { Entity } from './entity';
import { Input } from "../input";
import { Ped } from './ped';
import { Vehicle } from './vehicle';
import { Quaternion_ToEuler } from '../../shared/ammo/quaterion';

export class Bike extends Vehicle
{
    public update(delta: number)
    {
        super.update(delta);

        this.applyForceToStabilize();
    }

    private applyForceToStabilize()
    {
        const rotation = this.getRotation();
        const euler = Quaternion_ToEuler(rotation);
        const yaw = euler.z();

        const right = this.right;
        right.op_mul(30000);

        const forceRelative = new Ammo.btVector3(0, 2, 0)

        //console.log(yaw);
        if(yaw > 0)
        {
            right.op_mul(Math.abs(yaw));
            this.body.applyForce(right, forceRelative);
        }
        if(yaw < 0)
        {
            right.op_mul(Math.abs(yaw));
            right.op_mul(-1);
            this.body.applyForce(right, forceRelative);
        }

        const newQuat = new Ammo.btQuaternion(0, 0, 0, 1);
        newQuat.setEulerZYX(0, euler.y(), euler.x());
       
        this.body.getWorldTransform().setRotation(newQuat);


        Ammo.destroy(euler);
        Ammo.destroy(right);
        Ammo.destroy(forceRelative);
        Ammo.destroy(newQuat);
    }
}