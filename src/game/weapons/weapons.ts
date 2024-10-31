import { BaseObject } from "../../shared/baseObject";
import { WeaponData } from "./weapon";
import { MeleeWeaponData } from "./meleeWeapon";

export class Weapons extends BaseObject {

    public weaponDatas = new Map<string, WeaponData>();
    public meleeWeaponDatas = new Map<string, MeleeWeaponData>();

    public init()
    {
        const m4 = this.createWeaponData("m4");
        
        const ak = this.createWeaponData("ak");

        const pickaxe = this.createMeleeWeaponData("pickaxe");
    }

    public createWeaponData(id: string)
    {
        const weaponData: WeaponData = {
            id: id,
            anim: "m4",
            damage: 18
        }

        this.weaponDatas.set(id, weaponData);
        
        return weaponData;
    }

    public createMeleeWeaponData(id: string)
    {
        const weaponData: MeleeWeaponData = {
            id: id,
            damage: 18,
            attackTime: 200,
            attackCooldown: 1000
        }

        this.meleeWeaponDatas.set(id, weaponData);
        
        return weaponData;
    }

    public getWeaponData(id: string): WeaponData | undefined
    {
        return this.weaponDatas.get(id);
    }

    public getMeleeWeaponData(id: string): MeleeWeaponData | undefined
    {
        return this.meleeWeaponDatas.get(id);
    }
}