import { Entity, EntityData_JSON } from "./entity";
import { Vehicle } from "./vehicle";

export class Wheel extends Entity {
    public offsetFromChassis = new Ammo.btVector3(0, 0, 0);

    public init()
    {
        super.init();

        this.body.setFriction(3);
    }

    public update(delta: number)
    {
        super.update(delta);

    }
}