import { BaseObject } from "../shared/baseObject";
import { MainScene } from "./scenes/mainScene";
import { ThreeScene } from "./scenes/threeScene";

export class HealthBar extends BaseObject
{
    public health: number = 100;
    public maxHealth: number = 100;
    public rect?: Phaser.GameObjects.Rectangle;
    public position: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    public visible: boolean = true;

    constructor()
    {
        super();
    }    

    public create()
    {
        if(this.rect) return;

        const scene = MainScene.Instance;

        const rect = scene.add.rectangle(0, 0, 200, 20, 0xff0000);
        this.rect = rect;
    }

    public update()
    {
        const text = this.rect;

        if(!text) this.create();
        if(!text) return;

        text.setPosition(this.position.x, this.position.y);
        text.setVisible(this.visible);

        if(this.health == this.maxHealth)
        {
            text.setVisible(false);
        }

        const s = this.health/this.maxHealth;

        text.setScale(s, 1);
    }

    public set3DPosition(position: THREE.Vector3)
    {
        const screenPosition = ThreeScene.projectToScreen(position);
        this.position.x = screenPosition.x;
        this.position.y = screenPosition.y;
    }


    public destroy()
    {
        if(this.rect)
        {
            this.rect.destroy();
            this.rect = undefined;
        }
    }
}