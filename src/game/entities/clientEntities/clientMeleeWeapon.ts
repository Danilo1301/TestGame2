import { MeleeWeaponItem } from "../meleeWeaponItem";
import { ClientHandItem } from "./clientHandItem";


export class ClientMeleeWeapon extends ClientHandItem
{
    public get meleeWeaponItem() { return this.entity as MeleeWeaponItem; }
}