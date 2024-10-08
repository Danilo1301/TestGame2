import { BaseObject } from "../../shared/baseObject";
import { WeaponData } from "./weapon";

export class Weapons extends BaseObject {

    public weaponDatas: WeaponData[] = [];

    public init()
    {
        const m4 = this.createWeaponData();
        
        const ak = this.createWeaponData();
    }

    public createWeaponData()
    {
        const weaponData: WeaponData = {
            id: this.weaponDatas.length,
            anim: "m4"
        }

        this.weaponDatas.push(weaponData);
        
        return weaponData;
    }

    public getWeaponData(id: number): WeaponData | undefined
    {
        return this.weaponDatas[id];
    }
}