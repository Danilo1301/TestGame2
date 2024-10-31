import { Gameface } from "../../../game/gameface/gameface";
import { Inventory } from "../inventory";
import { ClientInventoryManager } from "./clientInventoryManager";

export class PlayerInventory
{
    public static isOpen: boolean = false;
    public static inventory: Inventory;

    public static toggle()
    {
        if(!this.isOpen)
        {
            this.open();
        } else {
            this.close();
        }
    }

    public static open()
    {
        this.isOpen = true;

        ClientInventoryManager.createInventory(this.inventory, 0, 0);

        Gameface.Instance.setPointerLocked(false);
    }

    public static close()
    {
        this.isOpen = false;

        ClientInventoryManager.removeAllIventories();

        Gameface.Instance.setPointerLocked(true);
    }

    public static createPlayerInventory(id: string)
    {
        const game = Gameface.Instance.game;
        const inventory = game.inventoryManager.createPlayerInventory();
        game.inventoryManager.setInventoryId(inventory, id);
        this.inventory = inventory;
        return inventory;
    }
}