import { ItemData } from "./itemData";
import { v4 as uuidv4 } from 'uuid';

export class Item
{
    public itemData: ItemData;
    public id: string = uuidv4();

    constructor(itemData: ItemData)
    {
        this.itemData = itemData;
    }
}