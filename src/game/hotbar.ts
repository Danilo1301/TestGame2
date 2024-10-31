import { ClientInventoryManager } from "../shared/inventory/client/clientInventoryManager";
import { PlayerInventory } from "../shared/inventory/client/playerInventory";
import { Item } from "../shared/inventory/item/item";
import { Gameface } from "./gameface/gameface";
import { GameScene } from "./scenes/gameScene";

export class HotbarSlot
{
    public container: Phaser.GameObjects.Container;
    public itemImage?: Phaser.GameObjects.Image;

    private _item?: Item;

    constructor(x: number, y: number)
    {
        const scene = GameScene.Instance;

        this.container = scene.add.container(x, y);

        const bg = scene.add.rectangle(0, 0, 100, 100, 0xff0000);
        this.container.add(bg);
    }

    public setItem(item: Item)
    {
        if(this._item)
        {
            if(this._item.id == item.id)
            {
                return
            } else {
                this.removeItem();
            }
        }

        this._item = item;

        const scene = GameScene.Instance;

        const textureKey = `item_` + item.itemData.id;

        const addImage = () => {
            this.itemImage = scene.add.image(0, 0, textureKey);
            this.itemImage.setDisplaySize(100, 100);
            this.container.add(this.itemImage);
        }

        if(!scene.textures.exists(textureKey))
        {
            const htmlImage = new Image();
            htmlImage.src = '/assets/' + item.itemData.image;
            htmlImage.onload = () => {
                scene.textures.addImage(textureKey, htmlImage);
                addImage();
            };
        } else {
            addImage();
        }
    }

    public removeItem()
    {
        if(!this._item) return;

        this._item = undefined;

        this.itemImage?.destroy();
        this.itemImage = undefined;
    }

    public update()
    {
        
    }
}

export class Hotbar
{
    public static Instance: Hotbar;

    public slots: HotbarSlot[] = [];

    constructor()
    {
        Hotbar.Instance = this;
    }

    public update()
    {
        const inventory = PlayerInventory.inventory;

        if(!inventory) return;

        if(this.slots.length == 0)
        {
            this.createSlots();
        }

        const slotGroup = this.getSlotGroup()!;

        var x = 0;
        for(const slot of this.slots)
        {
            const item = this.getItemInSlot(x);

            if(item) slot.setItem(item);
            else slot.removeItem();

            slot.update();

            x++;
        }
    }

    public getItemInSlot(x: number)
    {
        const slotGroup = this.getSlotGroup()!;
        const inventoryItem = slotGroup.getItemInSlot(x, 0);
        
        if(inventoryItem) return inventoryItem.item;
        return undefined;
    }

    public equipSlot(x: number)
    {
        if(x > this.slots.length - 1) return;

        console.log(`[Hotbar] Equip slot ${x}`);

        const player = Gameface.Instance.player!;
        const item = this.getItemInSlot(x);

        if(item)
        {
            console.log(`[Hotbar] Equip ${item.itemData.id}`);

            player.equipItem(item.itemData.id);
        } else {
            player.equipItem("");
        }
    }

    public getSlotGroup()
    {
        const inventory = PlayerInventory.inventory;

        if(!inventory) return;

        const slotGroup = inventory.slotGroups[1];

        return slotGroup;
    }

    private createSlots()
    {
        const slotGroup = this.getSlotGroup()!;

        var x = Gameface.Instance.getGameSize().x/2;
        var y = Gameface.Instance.getGameSize().y - 75;

        var slotSize = new Phaser.Math.Vector2(100, 100);
        var slotGap = 10;

        x -= ((slotGroup.slots[0].length-1) * (slotSize.x + slotGap)) / 2;

        for(var i = 0; i < slotGroup.slots[0].length; i++)
        {
            const slot = new HotbarSlot(x, y);

            this.slots.push(slot);

            x += slotSize.x + slotGap;
        }
    }
}