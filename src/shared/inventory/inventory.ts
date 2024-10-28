import { SlotGroup } from "./slotGroup";
import { v4 as uuidv4 } from 'uuid';

export class Inventory
{
    public id: string = uuidv4();
    public slotGroups: SlotGroup[] = [];
    public events = new Phaser.Events.EventEmitter();

    constructor()
    {
        this.events.on("item_moved", () => {
            this.events.emit("updated_inventory");
        });
    }

    public addSlotGroup(sx: number, sy: number)
    {
        const slotGroup = new SlotGroup(this, sx, sy);

        this.slotGroups.push(slotGroup);

        return slotGroup;
    }
}