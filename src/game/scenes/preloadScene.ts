import { Gameface } from "../gameface/gameface";

export class PreloadScene extends Phaser.Scene
{
    public static Instance: PreloadScene;

    public onStart?: Function;
    public created: boolean = false;

    constructor()
    {
        super({});
        PreloadScene.Instance = this;
    }

    public preload()
    {
        this.load.setPath("/assets/");
        //this.load.image("crosshair_shotgun", "crosshair/shotgun.png");
        //this.load.audio("shot_m4", "weapons/m4/shot.wav");
    }
    
    public async create()
    {
        this.created = true;
        this.onStart?.();
        this.onStart = undefined;
    }

    public async waitForStart()
    {
        console.log(`preloading...`);

        if(this.created) return;

        return new Promise<void>(resolve => {
            this.onStart = () => {
                console.log(`preload complete`);
                resolve();
            }
        });
    }
}