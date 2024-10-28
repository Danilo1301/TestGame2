import { Gameface } from "../../../game/gameface/gameface";
import { Inventory } from "../inventory";
import { ClientInventory } from "./clientInventory";
import { ClientSlot } from "./clientSlot";

export class ClientInventoryManager
{
    public static isInventoryOpen: boolean = false;
    public static clientInventories: ClientInventory[] = [];
    public static inventory: Inventory;

    public static isDragging: boolean = false;
    public static hoveringSlot?: ClientSlot;
    public static dragFromSlot?: ClientSlot;

    public static startDrag()
    {
        this.isDragging = true;
        this.dragFromSlot = this.hoveringSlot;
    }

    public static stopDrag()
    {
        this.isDragging = false;

        if(this.hoveringSlot && this.dragFromSlot)
        {
            console.log("drag from:", this.dragFromSlot);
            console.log("drag to:", this.hoveringSlot);

            const fromX = this.dragFromSlot.ix;
            const fromY = this.dragFromSlot.iy;

            const toX = this.hoveringSlot.ix;
            const toY = this.hoveringSlot.iy;

            this.dragFromSlot.slotGroup.moveItem(fromX, fromY, this.hoveringSlot.slotGroup, toX, toY);
        }

        this.dragFromSlot = undefined;
    }
    
    public static init()
    {
        const game = Gameface.Instance.game;

        this.inventory = game.inventoryManager.createPlayerInventory();
    }

    public static createInventory(inventory: Inventory, x: number, y: number)
    {
        const clientInventory = new ClientInventory(inventory, x, y);
        this.clientInventories.push(clientInventory);
    }

    public static removeAllIventories()
    {
        for(const clientInventory of this.clientInventories)
        {
            clientInventory.destroy();
        }
        this.clientInventories = [];
    }
}