import { MainScene } from "../../game/scenes/mainScene";
import { ThreeScene } from "../../game/three/threeScene";

export class DebugText {
    public lines: Map<string, string> = new Map<string, string>();
    public text?: Phaser.GameObjects.Text;
    public position: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    
    constructor(title: string)
    {
        this.setLine("title", title);
    }

    public createDebugText()
    {
        const scene = MainScene.Instance;

        this.text = scene.add.text(0, 0, 'DEBUG_TEXT', { font: '16px Arial', color: '#ffff00' });
        //this.text.setOrigin(0.5, 0);
        scene.layerHud.add(this.text);
    }

    public setLine(key: string, text: string)
    {
        this.lines.set(key, text);
    }

    public set3DPosition(position: THREE.Vector3)
    {
        const screenPosition = ThreeScene.projectToScreen(position);
        this.position.x = screenPosition.x;
        this.position.y = screenPosition.y;
    }

    public update()
    {
        const text = this.text;

        if(text)
        {
            let str = "";
            for(const v of this.lines.values())
            {
                str += `${v}\n`;
            }

            //text.setText(`${this.name} (${screenPosition.x}, ${screenPosition.y})`);
            text.setText(str);
            text.setPosition(this.position.x, this.position.y);
            //text.setPosition(400, 300);
        }
        
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