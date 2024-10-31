import { Weapon } from '../weapons/weapon';
import { HandItem } from './handItem';

export class WeaponItem extends HandItem
{
    public weapon!: Weapon;
}