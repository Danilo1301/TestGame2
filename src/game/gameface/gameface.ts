import THREE from "three";
import Phaser from "phaser";
import { BaseObject } from "../../shared/baseObject";
import { PhaserLoad } from "../../shared/phaserLoad"
import { SceneManager } from "./sceneManager";
import { MainScene } from "../scenes/mainScene";
import { ThreeScene } from "../scenes/threeScene";
import { MemoryDetect } from "../../shared/memoryDetect";
import { Game } from "../game/game";
import { GameScene } from "../scenes/gameScene";
import { Ped } from "../entities/ped";
import { Input } from "../input";
import { Weapon } from "../weapons/weapon";

export class Gameface extends BaseObject
{
    public static Instance: Gameface;
    
    public get sceneManager() { return this._sceneManager; }
    public get phaser() { return this._phaser!; }
    public get game() { return this._game!; }
    public get input() { return this._input; }

    public player?: Ped;

    private _sceneManager = new SceneManager(this);
    private _phaser?: Phaser.Game;
    private _memoryDetect = new MemoryDetect();
    private _game = new Game();
    private _input = new Input();
    
    constructor()
    {
        super();

        Gameface.Instance = this;
    }

    public async start()
    {
        this.log("start");

        this._phaser = await PhaserLoad.loadAsync();

        this.log(this.phaser);

        (window as any).Ammo = Ammo;
        (window as any).THREE = THREE;

        this.sceneManager.startScene(MainScene);
        this.sceneManager.startScene(ThreeScene); 

        this.input.init(MainScene.Instance);

        this.sceneManager.startScene(GameScene);

        this.game.init();
        this.game.create();

        this.game.events.on("weapon_shot", (weapon: Weapon, from: THREE.Vector3, to: THREE.Vector3) => {
            GameScene.Instance.clientEntityManager.onWeaponShot(weapon, from, to);
        });

        const ped = this.game.entityFactory.spawnPed(0, 5, 0);
        this.player = ped;

        Input.events.on("pointerup", () => {
            MainScene.Instance.input.mouse?.requestPointerLock();
        });
    }

    public preUpdate(delta: number)
    {
        const gameScene = GameScene.Instance as GameScene | undefined;

        this._memoryDetect.preUpdate();
        
        ThreeScene.Instance.clearDebugObjects();
        this.game.preUpdate(delta);
        gameScene?.clientEntityManager.preUpdate(delta);
    }

    public update(delta: number)
    {
        //GameScene.Instance.joystick.update();
        //GameScene.Instance.updatePlayerInput(delta);

        
        
        const gameScene = GameScene.Instance as GameScene | undefined;

        gameScene?.updateScene(delta);
        this.game.update(delta);
        //this.network.update(delta);
        gameScene?.clientEntityManager.update(delta);
    }

    public postUpdate(delta: number)
    {
        const gameScene = GameScene.Instance as GameScene | undefined;

        this.input.postUpdate();
        gameScene?.clientEntityManager.postUpdate(delta);

        gameScene?.updateCamera();

        this._memoryDetect.postUpdate();
    }

    public isFullscreen()
    {
        const doc: any = document;

        return doc.fullscreenElement || 
            doc.webkitFullscreenElement || 
            doc.mozFullScreenElement || 
            doc.msFullscreenElement;
    }

    public enterFullscreen()
    {
        var elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }

        const orientation: any = window.screen.orientation;
        orientation.lock("landscape");
    }

    public isPointerLocked()
    {
        return document.pointerLockElement !== null;
    }

    public leaveFullscreen()
    {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }

    public toggleFullscreen()
    {
        if(this.isFullscreen())
        {
            this.leaveFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    public updateScenesOrder()
    {
        
    }

    public getGameSize()
    {
        const scale = this.phaser.scale;
        const gameSize = new Phaser.Math.Vector2(scale.width, scale.height);
        return gameSize;
    }
}