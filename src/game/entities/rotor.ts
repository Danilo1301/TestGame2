import { Entity, EntityData_JSON } from "./entity";
import { Vehicle } from "./vehicle";

export class Rotor extends Entity {
    public offsetFromChassis = new Ammo.btVector3(0, 0, 0);
}