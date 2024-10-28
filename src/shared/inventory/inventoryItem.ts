import { Item } from "./item/item";

export class InventoryItem
{
    public id: number;
    public item: Item;

    constructor(id: number, item: Item)
    {
        this.id = id;
        this.item = item;
    }
}