import { Quaternion_Clone, Quaternion_ToEuler } from "../../utils/ammo/quaterion";
import { Entity, EntityData_JSON } from "./entity";
import { Vehicle } from "./vehicle";
import { Input } from "../../utils/input/input";

export class Bike extends Vehicle {
    public init()
    {
        super.init();

        //this.collision.body!.setAngularFactor(new Ammo.btVector3(1, 1, 0));
    }

    public update(delta: number)
    {
        super.update(delta);

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
        this.setRotation(newQuat.x(), newQuat.y(), newQuat.z(), newQuat.w());

        Ammo.destroy(euler);
        Ammo.destroy(right);
        Ammo.destroy(forceRelative);
        Ammo.destroy(newQuat);

        /*


        //console.log(euler)
        
        const right = this.right;
        right.op_mul(30000);

        const yaw = euler.z();
        
        //console.log(yaw.toFixed(3))

        
        if(yaw > 0)
        {
            right.op_mul(Math.abs(yaw) + 0.1);
            this.body.applyForce(right, new Ammo.btVector3(0, 2, 0));
        }
        if(yaw < 0)
        {
            right.op_mul(Math.abs(yaw) + 0.1);
            right.op_mul(-1);
            this.body.applyForce(right, new Ammo.btVector3(0, 2, 0));

            //this.body.applyForce(new Ammo.btVector3(-8000, 0, 0), new Ammo.btVector3(0, 2, 0));
        }

        Ammo.destroy(right);
        Ammo.destroy(euler);
        */

        const bike = this;             
        if(Input.getKey("X"))
        {
            bike.setPosition(0, 5, 0);
            bike.setVehicleRotation(0, 0, 0, 1);
            bike.setVelocity(0, 0, 0);
        }

        if(Input.getKey("Z"))
        {
            const rotation = bike.getRotation();
            Quaternion_Clone(rotation);
            rotation.setEulerZYX(0, Math.PI/2, 0);

            bike.setPosition(0, 5, 0);
            bike.setVehicleRotation(rotation.x(), rotation.y(), rotation.z(), rotation.w());
            bike.setVelocity(0, 0, 0);
            
            Ammo.destroy(rotation);
        }
    }
}