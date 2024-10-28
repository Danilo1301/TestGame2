import { BaseObject } from "../../shared/baseObject";
import { WeaponData } from "./weapon";

export class Weapons extends BaseObject {

    public weaponDatas = new Map<string, WeaponData>();

    public init()
    {
        const m4 = this.createWeaponData("m4");
        
        const ak = this.createWeaponData("ak");
    }

    public createWeaponData(id: string)
    {
        const weaponData: WeaponData = {
            id: id,
            anim: "m4"
        }

        this.weaponDatas.set(id, weaponData);
        
        return weaponData;
    }

    public getWeaponData(id: string): WeaponData | undefined
    {
        return this.weaponDatas.get(id);
    }
}