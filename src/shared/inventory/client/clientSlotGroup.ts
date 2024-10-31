import { InventoryItem } from "../inventoryItem";
import { MainScene } from "../../../game/scenes/mainScene";
import { SlotGroup } from "../slotGroup";
import { ClientSlot } from "./clientSlot";

export class ClientSlotGroup
{
    public clientSlots: ClientSlot[] = [];

    public divElm: Phaser.GameObjects.DOMElement;

    constructor(slotGroup: SlotGroup, x: number, y: number)
    {
        const scene = MainScene.Instance;

        const sy = slotGroup.slots.length;
        const sx = slotGroup.slots[0].length;

        const div = document.createElement('div');
        div.innerHTML = "";
        div.style.width = "400px";
        div.style.height = "400px";
        div.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        
        const divContainer = document.createElement('div');
        divContainer.innerHTML = "";
        divContainer.classList.add("grid-container");
        divContainer.style.gridTemplateColumns = `repeat(${sx}, 1fr)`; /* 3 colunas de tamanho igual */
        divContainer.style.gridTemplateRows = `repeat(${sy}, auto)`;   /* 2 linhas */
        divContainer.style.width = "auto";
        divContainer.style.height = "100%";
        divContainer.style.backgroundColor = "rgba(0, 0, 255, 0.5)";
        divContainer.style.overflowY = "auto";

        div.appendChild(divContainer);
        
        const divElm = scene.add.dom(x, y, div);
        divElm.setOrigin(0);
        this.divElm = divElm;

        const slotSize = new Phaser.Math.Vector2(64, 64);
        
        for(var iy = 0; iy < sy; iy++)
        {
            for(var ix = 0; ix < sx; ix++)
            {
                const x = ix * (slotSize.x + 4);
                const y = iy * (slotSize.y + 4);

                const clientSlot = new ClientSlot(slotGroup, ix, iy, x, y, slotSize);

                divContainer.appendChild(clientSlot.div);

                this.clientSlots.push(clientSlot);
            }
        }
    }

    public destroy()
    {
        this.divElm.destroy();
    }
}