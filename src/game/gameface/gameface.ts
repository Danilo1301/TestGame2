import { AssetLoad } from "../../utils/assetLoad/assetLoad";
import { BaseObject } from "../../utils/baseObject";
import { Input } from "../../utils/input/input";
import { PhaserLoad } from "../../utils/phaserLoad/phaserLoad";
import { MainScene } from "../scenes/mainScene";
import { SceneManager } from "./sceneManager";
import { GameScene } from "../scenes/gameScene";
import { Game } from "../game/game";
import { Network } from "../network/network";
import { ThreeScene } from "../three/threeScene";
import { IPacketData_Models, PACKET_TYPE } from "../network/packet";
import { getIsMobile } from "../constants/config";
import THREE from "three";
import { Entity } from "../entities/entity";
import { Quaternion_Clone } from "../../utils/ammo/quaterion";
import { Ped } from "../entities/ped";

export class Gameface extends BaseObject
{
    public static Instance: Gameface;
    public static isLowPerformance: boolean = true;

    public player?: Ped;
    public playerId: string = "";

    public get phaser() { return this._phaser!; }
    public get sceneManager() { return this._sceneManager; }
    public get game() { return this._game; }
    public get input() { return this._input; }
    public get network() { return this._network; }

    private _phaser?: Phaser.Game;
    private _sceneManager: SceneManager;
    private _game: Game;
    private _input: Input;
    private _network: Network;
    
    constructor()
    {
        super();

        Gameface.Instance = this;

        this._sceneManager = new SceneManager(this);
        this._game = new Game();
        this._input = new Input();
        this._network = new Network();
    }

    public async start()
    {
        this.log("start");

        this._phaser = await PhaserLoad.loadAsync();

        this.log(this.phaser);

        this.sceneManager.startScene(MainScene);
        this.sceneManager.startScene(ThreeScene);

        this.input.init(MainScene.Instance);

        AssetLoad.addAssets();
        await AssetLoad.load();

        MainScene.Instance.createPlayButton();
        
        Input.events.on("pointerdown", () => {
            if(getIsMobile())
            {
                this.enterFullscreen();
            }

            MainScene.Instance.input.mouse?.requestPointerLock();
        });

        await this.fuckingWaitForFirstClick();

        this.sceneManager.startScene(GameScene);

        this.game.init();

        (window as any).Ammo = Ammo;
        (window as any).THREE = THREE;

        this.network.connect(async () => {
            this.log("conectado");

            this.network.send(PACKET_TYPE.PACKET_REQUEST_MODELS, {});

            this.log("waiting for models");

            const models = await this.network.waitForPacket<IPacketData_Models>(PACKET_TYPE.PACKET_MODELS);

            Gameface.Instance.game.gltfCollection.fromPacketData(models);
            
            this.game.serverScene.create();

            //const bike = this.game.entityFactory.spawnVehicle(0, 0, 0);

            //const player = this.game.entityFactory.spawnPed(0, 5, 0);
            //this.player = player;

        });
    }

    public update(delta: number)
    {
        ThreeScene.Instance.clearDebugObjects();
        this.game.update(delta);
        this.network.update(delta);
    }

    public postUpdate(delta: number)
    {
        this.input.postUpdate();
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
        if(GameScene.Instance) GameScene.Instance.scene.bringToTop();
        if(MainScene.Instance) MainScene.Instance.scene.bringToTop();
    }

    public async fuckingWaitForFirstClick()
    {
        const scene = MainScene.Instance;

        return new Promise<void>((resolve) => {
            scene.onStart = () => resolve();
        });
    }

    public getGameSize()
    {
        const scale = this.phaser.scale;
        const gameSize = new Phaser.Math.Vector2(scale.width, scale.height);
        return gameSize;
    }
}