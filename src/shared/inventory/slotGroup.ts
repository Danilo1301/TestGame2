import { Inventory } from "./inventory";
import { InventoryItem } from "./inventoryItem";
import { Item } from "./item/item";

export class SlotGroup
{
    public inventory: Inventory;

    public slots: number[][] = [];
    public items = new Map<number, InventoryItem>();

    public offset = new Phaser.Math.Vector2(0, 0);

    constructor(inventory: Inventory, sx: number, sy: number)
    {
        this.inventory = inventory;

        for(var y = 0; y < sy; y++)
        {
            const col: number[] = [];

            for(var x = 0; x < sx; x++)
            {
                col.push(-1);
            }

            this.slots.push(col);
        }
    }

    private createInventoryItem(item: Item)
    {
        var id = 0;

        while(this.items.has(id))
        {
            id++;
        }

        const inventoryItem = new InventoryItem(id, item);

        console.log(`[SlotGroup] Created item id ${id}`);

        this.items.set(inventoryItem.id, inventoryItem);
        
        return inventoryItem;
    }

    public print()
    {
        console.log(`SlotGroup:`);
        for(var y = 0; y < this.slots.length; y++)
        {
            const col = this.slots[y];

            console.log(`${y}: ` + col.join(","));
        }
    }

    public addItemToSlot(item: Item, x: number, y: number)
    {
        if(!this.isSlotValid(x, y)) 
        {
            console.warn("Not a valid slot to add item");
            return;
        }

        const inventoryItemInSlot = this.getItemInSlot(x, y);

        if(inventoryItemInSlot)
        {
            console.warn("Theres already an item in this slot");
            return;
        }

        const inventoryItem = this.createInventoryItem(item);

        this.slots[y][x] = inventoryItem.id;

        return inventoryItem;
    }

    public removeItemFromSlot(x: number, y: number)
    {
        if(!this.isSlotValid(x, y)) 
        {
            console.warn("Not a valid slot to add item");
            return;
        }

        const inventoryItemInSlot = this.getItemInSlot(x, y);

        if(!inventoryItemInSlot)
        {
            console.warn("No items in this slot");
            return;
        }

        const item = inventoryItemInSlot.item;

        this.items.delete(inventoryItemInSlot.id);

        this.slots[y][x] = -1;

        return item;
    }

    public moveItem(x: number, y: number, toSlotGroup: SlotGroup, toX: number, toY: number)
    {
        console.log(`[SlotGroup] MoveItem ${x},${y} to ${toX},${toY}`);

        const removedItem = this.removeItemFromSlot(x, y);

        if(!removedItem)
        {
            console.log(`[SlotGroup] No items in slot ${x},${y}`);
            return false;
        }

        const hasItemInSlot = this.getItemInSlot(toX, toY) != undefined;

        if(hasItemInSlot)
        {
            console.log(`[SlotGroup] There is already an item in in slot ${toX},${toY}`);
            const removedItem2 = this.removeItemFromSlot(toX, toY)!;
            
            this.addItemToSlot(removedItem2, x, y);
        }

        toSlotGroup.addItemToSlot(removedItem, toX, toY);

        this.inventory.events.emit("item_moved", this, x, y, toSlotGroup, toX, toY);
        toSlotGroup.inventory.events.emit("item_moved", this, x, y, toSlotGroup, toX, toY);

        return true;
    }

    public isSlotValid(x: number, y: number)
    {
        if(y >= this.slots.length) return false;
        if(x >= this.slots[0].length) return false;

        return true;
    }

    public getItemInSlot(x: number, y: number)
    {
        if(!this.isSlotValid(x, y)) return undefined;

        const id = this.slots[y][x];

        return this.items.get(id)!;
    }
}