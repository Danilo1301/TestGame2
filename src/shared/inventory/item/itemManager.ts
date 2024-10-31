import { Game } from "../../../game/game/game";
import { WeaponData } from "../../../game/weapons/weapon";
import { ItemData } from "./itemData";
import { Item } from "./item";

export class ItemManager
{
    public game: Game;
    public itemsData = new Map<string, ItemData>();

    constructor(game: Game)
    {
        this.game = game;
    }

    public init()
    {
        const m4 = this.createItemData("m4", "items/m4/m4.png");
        m4.model = "m4";
        m4.weaponId = "m4";

        const ak = this.createItemData("ak", "items/ak/ak.png");
        ak.model = "m4";
        ak.weaponId = "ak";

        const wheel = this.createItemData("wheel", "items/wheel/wheel.png");
        wheel.model = "wheel";

        const pickaxe = this.createItemData("pickaxe", "items/pickaxe/pickaxe.png");
        pickaxe.weaponId = "weaponId";
        pickaxe.animIdle = "idle_item";
        pickaxe.animAttack = "attack_pickaxe";
        pickaxe.model = "pickaxe";
    }

    public createItemData(id: string, image: string)
    {
        const itemData: ItemData = {
            id: id,
            name: id,
            image: image
        }

        this.itemsData.set(id, itemData);
        
        return itemData;
    }

    public getItemData(id: string): ItemData | undefined
    {
        return this.itemsData.get(id);
    }

    public makeItem(itemDataId: string)
    {
        const itemData = this.getItemData(itemDataId)!;

        const item = new Item(itemData);

        return item;
    }
}