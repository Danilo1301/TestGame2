import { BaseObject } from "../../utils/baseObject";

export interface WeaponData {
    id: number
    anim: string
}

export class Weapon extends BaseObject {

    public weaponData: WeaponData;

    constructor(weaponData: WeaponData)
    {
        super();
        this.weaponData = weaponData;
    }
}