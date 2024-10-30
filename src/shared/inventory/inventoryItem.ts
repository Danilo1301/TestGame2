import { Item, Item_JSON } from "./item/item";

export interface InventoryItem_JSON {
    id: number
    item: Item_JSON
}

export class InventoryItem
{
    public id: number;
    public item: Item;

    constructor(id: number, item: Item)
    {
        this.id = id;
        this.item = item;
    }

    public toJSON()
    {
        const json: InventoryItem_JSON = {
            id: this.id,
            item: this.item.toJSON()
        }
        return json;
    }
}