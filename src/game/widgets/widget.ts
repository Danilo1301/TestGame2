import { Input } from "../input";

export class Widget
{
    public image: Phaser.GameObjects.Image;
    public pointerDown: boolean = false;

    public onClick?: Function;
    public onPointerDown?: Function;
    public onPointerUp?: Function;

    public pointerId: number = 0;

    public scale: number = 0.5;

    constructor(image: Phaser.GameObjects.Image)
    {
        this.image = image;

        image.setOrigin(0.5);
        image.setScale(this.scale);

        image.setInteractive();

        Input.events.on("pointerdown", (pointer: PointerEvent, pointerId: number) => {

            const pointerPosition = Input.Instance.getPointer(pointerId)!.position;
            const position = new Phaser.Math.Vector2(this.image.x, this.image.y);

            const distance = position.distance(pointerPosition);

            if(distance > 80) return;

            if(!this.pointerDown)
            {
                this.pointerId = pointerId;
                this.pointerDown = true;
                this.evOnPointerDown();
            }
        });

        Input.events.on("pointerup", (pointer: PointerEvent, pointerId: number) => {

            if(pointerId != this.pointerId) return;

            if(this.pointerDown)
            {
                pointerId = 0;
                this.pointerDown = false;
                this.evOnPointerUp();
            }
        });
    }

    public update()
    {

    }

    private evOnPointerDown()
    {
        this.image.setTint(0x0);

        this.onPointerDown?.();
        this.onClick?.();
    }

    private evOnPointerUp()
    {
        this.image.setTint(0xFFFFFF);

        this.onPointerUp?.();
    }
}