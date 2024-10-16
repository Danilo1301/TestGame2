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

        this.fpsText = this.add.text(5, 240, "FPS_TEXT");
        this.fpsText.setFontFamily('Arial');
        this.fpsText.setFontSize(20);
        this.fpsText.setColor('#FFFFFF');
        this.fpsText.setStroke('#000000', 4);

        this.layerHud.add(this.fpsText);

        setInterval(() => {
            this.fpsText.setText(`${this.game.loop.actualFps.toFixed(2)} FPS`);
        }, 500);
    }

    public update(time: number, delta: number)
    {
        Gameface.Instance.preUpdate(delta);
        Gameface.Instance.update(delta);
        Gameface.Instance.postUpdate(delta);
    }
}