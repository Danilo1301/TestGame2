import { Entity } from "./entity";

export class Wheel extends Entity {
    public offsetFromChassis = new Ammo.btVector3(0, 0, 0);

    public init()
    {
        super.init();
        this.body.setFriction(3);
    }
}