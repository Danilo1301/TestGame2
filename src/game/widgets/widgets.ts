import { Gameface } from "../gameface/gameface";
import { MainScene } from "../scenes/mainScene";
import { Widget } from "./widget";

export class Widgets
{
    public static widgets = new Map<number, Widget>();

    public static init()
    {
        const aim = this.createWidget(1080, 220, "widget_aim");
        aim.onClick = () => {

            if(!Gameface.Instance.player) return;

            Gameface.Instance.player.aiming = !Gameface.Instance.player.aiming;
        };

        const shoot = this.createWidget(1150, 380, "widget_shoot");
        shoot.onPointerDown = () => {
            if(!Gameface.Instance.player) return;

            Gameface.Instance.player.mouse1 = true;
        };
        shoot.onPointerUp = () => {
            if(!Gameface.Instance.player) return;

            Gameface.Instance.player.mouse1 = false;
        };
        
    }

    public static update()
    {
        for(const [id, widget] of this.widgets)
        {
            widget.update();
        }
    }

    public static getScene()
    {
        return MainScene.Instance;
    }

    public static createWidget(x: number, y: number, texture: string)
    {
        const scene = this.getScene();

        const image = scene.add.image(x, y, texture);

        const widget = new Widget(image);

        let i = 0;
        while(this.widgets.has(i))
        {
            i++;
        }
        console.log(`[Widgets] create widget ${texture} id ${i}`);

        this.widgets.set(i, widget);

        return widget;
    }
}