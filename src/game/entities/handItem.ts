import { ItemData } from '../../shared/inventory/item/itemData';
import { Weapon } from '../weapons/weapon';
import { Entity } from './entity';
import { Ped } from './ped';

export class HandItem extends Entity
{
    public itemData!: ItemData;

    public ped!: Ped;
}