import { Button } from "../../utils/ui/button";
import { Gameface } from "../gameface/gameface";

export class MainScene extends Phaser.Scene
{
    public static Instance: MainScene;
    
    public layerNormal!: Phaser.GameObjects.Layer;
    public layerHud!: Phaser.GameObjects.Layer;

    public fpsText!: Phaser.GameObjects.Text;

    public onStart?: Function;

    constructor()
    {
        super({});

        MainScene.Instance = this;
    }

    public async create()
    {
        this.layerNormal = this.add.layer();
        this.layerNormal.setDepth(0);

        this.layerHud = this.add.layer();
        this.layerHud.setDepth(10000);

        this.fpsText = this.add.text(5, 5, "0 FPS", { font: '16px Arial', color: '#000000' });
        this.layerHud.add(this.fpsText);
    }

    public update(time: number, delta: number)
    {
        this.fpsText.setText(`${this.game.loop.actualFps.toFixed(2)} FPS`);
    }

    public createPlayButton()
    {
        const gameSize = Gameface.Instance.getGameSize();
        const button = new Button(this, "Play", gameSize.x/2, gameSize.y/2, 200, 50, "button");
        button.onClick = () => {  
            button.destroy();
            this.onStart?.();
        };
    }
}