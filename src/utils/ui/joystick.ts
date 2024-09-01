import { Gameface } from "../../game/gameface/gameface";
import { Hud } from "../../game/hud/hud";
import { MainScene } from "../../game/scenes/mainScene";
import { Input } from "../input/input";

export class Joystick {

    public isMoving: boolean = false;

    public container!: Phaser.GameObjects.Container;
    public indicator!: Phaser.GameObjects.Graphics;

    public angle: number = 0;
    public intensity: number = 1;
    public inputX: number = 0.0;
    public inputY: number = 0.0;

    public create()
    {
        const scene = MainScene.Instance;

        const container = scene.add.container();
        Hud.addToHudLayer(container);
        this.container = container;

        const image = scene.add.image(0, 0, "button");
        container.add(image);

        const graphics = scene.add.graphics();
        graphics.fillStyle(0x000000);
        graphics.fillCircle(0, 0, 100);
        container.add(graphics);

        const indicator = scene.add.graphics();
        indicator.fillStyle(0x7D7D7D);
        indicator.fillCircle(0, 0, 40);
        Hud.addToHudLayer(indicator);
        this.indicator = indicator;

        const gameSize = Gameface.Instance.getGameSize();

        container.setPosition(150, gameSize.y - 150);

        Input.events.on("pointerdown", (pointer: any) => {

            const mousePosition = Input.mousePosition;

            const position = new Phaser.Math.Vector2(container.x, container.y);
            const distance = position.distance(mousePosition);

            console.log(distance)

            if(distance < 100)
            {
                this.isMoving = true;
            }
        });

        Input.events.on("pointerup", (pointer: any) => {
            if(this.isMoving)
            {
                this.isMoving = false;
            }
        });
    }

    public update()
    {
        this.indicator.setVisible(this.isMoving);

        if(this.isMoving)
        {
            const mousePosition = Input.mousePosition;

            const position = new Phaser.Math.Vector2(this.container.x, this.container.y);
            const distance = position.distance(mousePosition);

            this.indicator.setPosition(mousePosition.x, mousePosition.y);

            const angle = Phaser.Math.Angle.BetweenPoints(position, mousePosition);

            this.angle = angle;
            this.intensity = Math.min(distance, 100) / 100;

            this.inputX = Math.cos(angle);
            this.inputY = Math.sin(angle);

            if(distance > 120)
            {

            }
        }
    }
}