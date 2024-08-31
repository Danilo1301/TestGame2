import { Button } from "../../utils/ui/button";
import { Options } from "../../utils/ui/options";
import { MainScene } from "../scenes/mainScene";

export class Hud
{
    public static addButton(text: string, x: number, y: number, width: number, height: number, texture: string)
    {
        const scene = this.getScene();
        const button = new Button(scene, text, x, y, width, height, texture);
        this.addToHudLayer(button.container);
        return button;
    }

    public static addOptions(displaySize: number)
    {
        const scene = this.getScene();
        const options = new Options(scene, displaySize);
        this.addToHudLayer(options.container);
        return options;
    }

    public static getScene()
    {
        return MainScene.Instance;
    }

    public static addToHudLayer(gameObject: Phaser.GameObjects.GameObject)
    {
        MainScene.Instance.layerHud.add(gameObject);
    }
}