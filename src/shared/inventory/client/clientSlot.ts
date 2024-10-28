import { InventoryItem } from "../inventoryItem";
import { MainScene } from "../../../game/scenes/mainScene";
import { ItemData } from "../item/itemData";
import { ClientInventory } from "./clientInventory";
import { SlotGroup } from "../slotGroup";
import { ClientInventoryManager } from "./clientInventoryManager";

export class ClientSlot
{
    public slotGroup: SlotGroup;
    public ix: number;
    public iy: number;

    public div: HTMLDivElement;

    public itemImage?: HTMLDivElement;
    private _prevItemId: string = "";

    public pointerOver: boolean = false;
    public pointerDown: boolean = false;

    constructor(slotGroup: SlotGroup, ix: number, iy: number, x: number, y: number, size: Phaser.Math.Vector2)
    {
        this.slotGroup = slotGroup;
        this.ix = ix;
        this.iy = iy;

        const scene = MainScene.Instance;

        const div = document.createElement('div');
        div.classList.add("grid-item");
        div.style.width = size.x + "px";
        div.style.height = size.y + "px";
        //div.style.backgroundColor = "rgba(255, 255, 255)";
        this.div = div;
        
        div.addEventListener('pointerover', () => {
            this.pointerOver = true;

            ClientInventoryManager.hoveringSlot = this;

            this.updateDiv();
        });

        div.addEventListener('pointerout', () => {
            this.pointerOver = false;

            if(ClientInventoryManager.hoveringSlot == this) ClientInventoryManager.hoveringSlot = undefined;

            this.updateDiv();
        });

        div.addEventListener('pointerdown', () => {
            this.pointerDown = true;
            this.updateDiv();

            console.log(this.getInventoryItem()?.item.itemData.image)
        });

        document.addEventListener('pointerup', () => {
            this.pointerDown = false;
            //this.updateDiv();

            console.log('pointerup')

            if(ClientInventoryManager.isDragging)
            {
                ClientInventoryManager.stopDrag();
                console.log("stop drag");
            }
        });

        div.addEventListener('pointermove', () => {
            console.log('move');

            if(this.pointerDown)
            {
                if(!ClientInventoryManager.isDragging)
                {
                    ClientInventoryManager.startDrag();
                    console.log("started drag");
                }
            }
        });
        
        //const divElm = scene.add.dom(400, 300, div);

        this.updateDiv();
    }

    private getInventoryItem()
    {
        return this.slotGroup.getItemInSlot(this.ix, this.iy);
    }

    private createItemImage()
    {
        const inventoryItem = this.getInventoryItem();

        let needDelete = false;

        if(!inventoryItem) needDelete = true;

        if(inventoryItem)
        {
            if(inventoryItem.item.id != this._prevItemId) needDelete = true;
        }

        if(needDelete)
        {
            if(this.itemImage)
            {
                this.itemImage.remove();
                this.itemImage = undefined;
                this._prevItemId = "";
            }
        }

        if(!inventoryItem) return;

        if(this.itemImage) return;

        const itemImage = document.createElement('img');
        itemImage.src = "/assets/" + inventoryItem.item.itemData.image;
        itemImage.style.width = "100%";
        itemImage.style.height = "100%";
        itemImage.draggable = false;
        //itemImage.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
        this.itemImage = itemImage;

        this.div.appendChild(itemImage);

        this._prevItemId = inventoryItem.item.id;
    }

    public updateDiv()
    {
        this.createItemImage();

        const div = this.div;

        if(this.pointerOver)
        {   
            div.style.backgroundColor = 'lightcoral'; // Muda a cor como exemplo
        } else {
            div.style.backgroundColor = 'white'; // Muda a cor como exemplo
        }
    }
}