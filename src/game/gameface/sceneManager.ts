import { BaseObject } from "../../shared/baseObject";
import { Gameface } from "./gameface";

export class SceneManager extends BaseObject
{
    public get phaser() { return this._gameface.phaser; };

    private _gameface: Gameface;

    constructor(gameface: Gameface)
    {
        super();

        this._gameface = gameface;
    }

    public startScene(scene: typeof Phaser.Scene)
    {
        const phaser = this.phaser;
        const key = scene.name;

        if(this.hasSceneStarted(scene))
        {
            this.removeScene(scene);
        }

        this.log("start scene: " + key);

        const s = phaser.scene.add(key, scene, true);

        this._gameface.updateScenesOrder();

        return s;
    }

    public removeScene(scene: typeof Phaser.Scene)
    {
        const phaser = this.phaser;
        const key = scene.name;

        this.log("removeScene", key);

        if(this.hasSceneStarted(scene))
        {
            const s = phaser.scene.keys[key];
            s.scene.remove();
        }
    }

    public hasSceneStarted(scene: typeof Phaser.Scene)
    {
        const phaser = this.phaser;
        return phaser.scene.keys[scene.name];
    }
}