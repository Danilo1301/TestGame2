import { Weapon } from '../weapons/weapon';
import { Entity } from './entity';

export class WeaponItem extends Entity
{
    public weapon!: Weapon;
}