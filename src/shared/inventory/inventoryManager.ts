import { Game } from "../../game/game/game";
import { Inventory } from "./inventory";

export class InventoryManager
{
    public game: Game;
    public inventories = new Map<string, Inventory>();

    constructor(game: Game)
    {
        this.game = game;
    }

    public init()
    {
        const inventory = this.createInventory();
        inventory.addSlotGroup(4, 3);

        const equipSlotGroup = inventory.addSlotGroup(4, 1);
        equipSlotGroup.offset.set(0, 430);

        setInterval(() => {
            inventory.events.emit("updated_inventory");
        }, 2000);
        
        const inventory2 = this.createInventory();
        inventory2.addSlotGroup(3, 10);
    }

    public test()
    {
        const inventory = Array.from(this.inventories.values())[0];

        const slotGroup = inventory.slotGroups[0];

        slotGroup.print();

        const m4 = this.game.itemManager.makeItem("m4");
        const ak = this.game.itemManager.makeItem("ak");

        slotGroup.addItemToSlot(m4, 2, 2);
        slotGroup.addItemToSlot(ak, 3, 2);

        slotGroup.print();
    }

    public test2()
    {
        const inventory = Array.from(this.inventories.values())[0];
        const slotGroup = inventory.slotGroups[0];

        slotGroup.moveItem(3, 2, slotGroup, 0, 0);

        slotGroup.print();
    }

    public createInventory()
    {
        console.log(`[InventoryManager] Create inventory`);

        const inventory = new Inventory(this);

        this.inventories.set(inventory.id, inventory);

        return inventory;
    }

    public createPlayerInventory()
    {
        const inventory = this.createInventory();
        inventory.addSlotGroup(4, 3);

        const equipSlotGroup = inventory.addSlotGroup(4, 1);
        equipSlotGroup.offset.set(0, 430);

        return inventory;
    }

    public setInventoryId(inventory: Inventory, id: string)
    {
        this.inventories.delete(inventory.id);
        inventory.id = id;
        this.inventories.set(id, inventory);
    }
}