import { ItemData } from "./itemData";
import { v4 as uuidv4 } from 'uuid';

export interface Item_JSON {
    id: string
    amount: number
    itemData: string
}

export class Item
{
    public itemData: ItemData;
    public id: string = uuidv4();
    public amount: number = 1;

    constructor(itemData: ItemData)
    {
        this.itemData = itemData;
    }

    public toJSON()
    {
        const json: Item_JSON = {
            id: this.id,
            amount: this.amount,
            itemData: this.itemData.id
        }
        return json;
    }

    public fromJSON(json: Item_JSON)
    {
        this.amount = json.amount;
    }
}