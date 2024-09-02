import { setRigidBodyNoGravity } from "../../utils/utils";
import { Entity } from "./entity";

export class Bullet extends Entity {

    public speed: number = 5;

    public init()
    {
        super.init();

        setRigidBodyNoGravity(this.collision.body!);
    }

    public update(delta: number)
    {
        super.update(delta);

        const body = this.collision.body!;

        const forward = this.forward;

        const force = forward.op_mul(10);

        body.setLinearVelocity(force);

        //body.applyForce(force, new Ammo.btVector3(0, 0, 0));
    }
}