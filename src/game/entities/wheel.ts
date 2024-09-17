import { setRigidBodyNoGravity } from "../../utils/utils";
import { Entity } from "./entity";

export class Wheel extends Entity {

    public speed: number = 5;

    public offsetFromChassis = new Ammo.btVector3(0, 0, 0)

    public init()
    {
        super.init();
    }

    public update(delta: number)
    {
        super.update(delta);
    }
}