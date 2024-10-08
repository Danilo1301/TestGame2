import { BaseObject } from "../shared/baseObject";
import { MainScene } from "./scenes/mainScene";
import { ThreeScene } from "./scenes/threeScene";

export class WorldText extends BaseObject
{
    public lines: Map<string, string> = new Map<string, string>();
    public text?: Phaser.GameObjects.Text;
    public position: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    public visible: boolean = true;

    constructor(title: string)
    {
        super();
        this.setTitle(title);
    }    

    public create()
    {
        if(this.text) return;

        const scene = MainScene.Instance;

        const text = scene.add.text(0, 0, 'WorldText');
        text.setFontFamily('Arial');
        text.setFontSize(20);
        text.setColor('#FFFFFF');
        text.setOrigin(0.5, 0);
        text.setStroke('#000000', 4);
        text.setPosition(0, 0);
        this.text = text;
        scene.layerHud.add(this.text);
    }

    public update()
    {
        const text = this.text;

        if(!text) this.create();
        if(!text) return;

        let str = "";
        for(const v of this.lines.values())
        {
            str += `${v}\n`;
        }

        text.setText(str);
        text.setPosition(this.position.x, this.position.y);
        text.setVisible(this.visible);
    }

    public set3DPosition(position: THREE.Vector3)
    {
        const screenPosition = ThreeScene.projectToScreen(position);
        this.position.x = screenPosition.x;
        this.position.y = screenPosition.y;
    }

    public setLine(key: string, text: string)
    {
        this.lines.set(key, text);
    }

    public setTitle(text: string)
    {
        this.setLine("title", text);
    }

    public destroy()
    {
        if(this.text)
        {
            this.text.destroy();
            this.text = undefined;
        }
    }
}