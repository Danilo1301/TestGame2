import { BaseObject } from "../shared/baseObject";
import { MainScene } from "../game/scenes/mainScene";
import { Gameface } from "./gameface/gameface";
import { Input } from "./input";

export class Joystick extends BaseObject
{
    public static Instance: Joystick;

    public isMoving: boolean = false;

    public container?: Phaser.GameObjects.Container;
    public indicator?: Phaser.GameObjects.Graphics;

    public angle: number = 0;
    public intensity: number = 1;
    public inputRight: number = 0.0;
    public inputForward: number = 0.0;

    public pointerId: number = 0;

    constructor()
    {
        super();
        Joystick.Instance = this;
    }

    public create()
    {
        const scene = MainScene.Instance;
        const layerHud = scene.layerHud;

        const container = scene.add.container();
        this.container = container;
        layerHud.add(container);

        const image = scene.add.image(0, 0, "button");
        container.add(image);

        const graphics = scene.add.graphics();
        graphics.fillStyle(0x000000);
        graphics.fillCircle(0, 0, 100);
        container.add(graphics);

        const indicator = scene.add.graphics();
        indicator.fillStyle(0x7D7D7D);
        indicator.fillCircle(0, 0, 40);
        this.indicator = indicator;
        layerHud.add(indicator);

        const gameSize = Gameface.Instance.getGameSize();
        container.setPosition(150, gameSize.y - 150);

        this.setupEvents();
    }

    private setupEvents()
    {
        const container = this.container!;

        Input.events.on("pointerdown", (pointer: PointerEvent, pointerId: number) => {

            const mousePosition = Input.mousePosition;

            const position = new Phaser.Math.Vector2(container.x, container.y);
            const distance = position.distance(mousePosition);

            console.log(distance)

            if(distance < 100 && !this.isMoving)
            {
                this.isMoving = true;
                this.pointerId = pointerId;
            }
        });

        Input.events.on("pointerup", (pointer: PointerEvent, pointerId: number) => {
            if(this.isMoving && pointerId == this.pointerId)
            {
                this.isMoving = false;
                this.pointerId = 0;
            }
        });
    }

    public update()
    {
        this.indicator?.setVisible(this.isMoving);

        if(this.isMoving)
        {
            const pointer = Input.Instance.getPointer(this.pointerId)!;

            const pointerPosition = pointer.getPointerPosition();

            const position = new Phaser.Math.Vector2(this.container!.x, this.container!.y);
            const distance = position.distance(pointerPosition);

            this.indicator?.setPosition(pointerPosition.x, pointerPosition.y);

            const angle = Phaser.Math.Angle.BetweenPoints(position, pointerPosition);

            this.angle = angle;
            this.intensity = Math.min(distance, 100) / 100;

            this.inputRight = Math.cos(angle);
            this.inputForward = -Math.sin(angle);

            if(distance > 120)
            {

            }
        }
    }

    public static getIsMoving()
    {
        return Joystick.Instance.isMoving;
    }

    public static getPointerId()
    {
        return Joystick.Instance.pointerId;
    }
}