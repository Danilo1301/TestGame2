import { InventoryManager } from "./inventoryManager";
import { Item } from "./item/item";
import { SlotGroup, SlotGroup_JSON } from "./slotGroup";
import { v4 as uuidv4 } from 'uuid';

export interface Inventory_JSON {
    id: string
    slotGroups: SlotGroup_JSON[]
}

export class Inventory
{
    public id: string = uuidv4();
    public inventoryManager: InventoryManager;
    public slotGroups: SlotGroup[] = [];
    public events = new Phaser.Events.EventEmitter();

    constructor(inventoryManager: InventoryManager)
    {
        this.inventoryManager = inventoryManager;

        this.events.on("item_moved", (slotGroup: SlotGroup, x: number, y: number, toSlotGroup: SlotGroup, toX: number, toY: number) => {
        
            if(toSlotGroup.inventory != slotGroup.inventory)
            {
                toSlotGroup.inventory.events.emit("item_moved", this, x, y, toSlotGroup, toX, toY);
            }

            this.events.emit("updated_inventory");
        });

        this.events.on("item_added", () => {
            this.events.emit("updated_inventory");
        });

        this.events.on("updated_inventory", () => {
            this.inventoryManager.game.events.emit("updated_inventory", this);
        });
    }

    public addSlotGroup(sx: number, sy: number)
    {
        const slotGroup = new SlotGroup(this, sx, sy);

        this.slotGroups.push(slotGroup);

        return slotGroup;
    }

    public addItemToAnySlot(item: Item)
    {
        let toSlotGroup: SlotGroup | undefined = undefined; 
        let x = -1;
        let y = -1;

        for(const slotGroup of this.slotGroups)
        {
            var slot = slotGroup.getEmptySlot()

            if(slot == undefined) continue;
            
            toSlotGroup = slotGroup;
            x = slot.x;
            y = slot.y;

            break;
        }

        if(!toSlotGroup)
        {
            console.warn("No more space in this inventory");
            return false;
        }

        toSlotGroup.addItemToSlot(item, x, y);

        return true;
    }

    public toJSON()
    {
        const json: Inventory_JSON = {
            id: this.id,
            slotGroups: this.slotGroups.map(slotGroup => slotGroup.toJSON())
        }
        return json;
    }

    public fromJSON(json: Inventory_JSON)
    {
        const itemManager = this.inventoryManager.game.itemManager;

        var i = 0;
        for(const slotGroup_json of json.slotGroups)
        {
            const slotGroup = this.slotGroups[i];

            slotGroup.slots = slotGroup_json.slots;
            slotGroup.items.clear();

            for(const item_json of slotGroup_json.items)
            {
                console.log(item_json);

                const item = itemManager.makeItem(item_json.item.itemData);
                item.fromJSON(item_json.item);

                slotGroup.addItemToItemsMap(item_json.id, item);
            }

            i++;
        }

        this.events.emit("updated_inventory");
    }
}