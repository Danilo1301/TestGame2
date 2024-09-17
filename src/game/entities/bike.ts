import { clamp } from "three/src/math/MathUtils";
import { FormatVector3, Quaternion_ToEuler } from "../game/ammoUtils";
import { Vehicle } from "./vehicle";
import { Input } from "../../utils/input/input";

/*
this guy just saved my bike
https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=11238
*/
export class Bike extends Vehicle {

    public init()
    {
        super.init();
    }

    public update(delta: number)
    {
        super.update(delta);

        //console.log("angular velocity", FormatVector3(this.body.getAngularVelocity()))

        const rotation = this.getRotation();

        const euler = Quaternion_ToEuler(rotation);

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

        

        const newQuat = new Ammo.btQuaternion(0, 0, 0, 1);
        newQuat.setEulerZYX(0, euler.y(), euler.x());
        this.setRotation(newQuat.x(), newQuat.y(), newQuat.z(), newQuat.w());

        if(Input.getKey("X"))
        {
            this.setVehiclePosition(0, 5, 0);
            this.setVehicleRotation(0, 0, 0, 1);

        }

        if(Input.getKey("Z"))
        {
            const quat = new Ammo.btQuaternion(0, 0, 0, 1);
            quat.setEulerZYX(0, Math.PI/2, 0);
            
            this.setVehiclePosition(0, 5, 0);
            this.setVehicleRotation(quat.x(), quat.y(), quat.z(), quat.w());
        }


        //this.stabilizeChassis(this.body);

        for(const wheel of this.wheels)
        {
            //this.checkWheelRotation(wheel.body);
        }


        //this.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0))
    }
}