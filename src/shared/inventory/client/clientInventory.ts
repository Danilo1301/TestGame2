import { MainScene } from "../../../game/scenes/mainScene";
import { Inventory } from "../inventory";
import { ClientSlot } from "./clientSlot";
import { ClientSlotGroup } from "./clientSlotGroup";

export class ClientInventory
{
    public inventory: Inventory;
    public clientSlotGroups: ClientSlotGroup[] = [];

    public onUpdatedInventory: Function;

    constructor(inventory: Inventory, x: number, y: number)
    {
        this.inventory = inventory;

        const scene = MainScene.Instance;

        for(const slotGroup of inventory.slotGroups)
        {
            const position = new Phaser.Math.Vector2(x, y);
            position.add(slotGroup.offset);

            const clientSlotGroup = new ClientSlotGroup(slotGroup, position.x, position.y);

            this.clientSlotGroups.push(clientSlotGroup);
        }

        // events

        this.onUpdatedInventory = () => {
            console.log("it got updated");

            for(const clientSlotGroup of this.clientSlotGroups)
            {
                for(const clientSlot of clientSlotGroup.clientSlots)
                {
                    clientSlot.updateDiv();
                }
            }
        };

        inventory.events.on("updated_inventory", this.onUpdatedInventory);
    }

    public destroy()
    {
        for(const clientSlotGroup of this.clientSlotGroups)
        {
            clientSlotGroup.destroy();
        }

        this.clientSlotGroups = [];

        this.inventory.events.removeListener("updated_inventory", this.onUpdatedInventory);
    }
}