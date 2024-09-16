import { AssetLoad } from "../../utils/assetLoad/assetLoad";
import { BaseObject } from "../../utils/baseObject";
import { Input } from "../../utils/input/input";
import { PhaserLoad } from "../../utils/phaserLoad/phaserLoad";
import { MainScene } from "../scenes/mainScene";
import { SceneManager } from "./sceneManager";
import { GameScene } from "../scenes/gameScene/gameScene";
import { Game } from "../game/game";
import { Network } from "../network/network";
import { ThreeScene } from "../three/threeScene";
import { IPacketData_Models, PACKET_TYPE } from "../network/packet";
import { GameObject } from "../gameObject/gameObject";
import { Ped } from "../entities/ped";
import { getIsMobile } from "../constants/config";
import { initAmmoExtension } from "../../utils/utils";
import { Vehicle } from "../entities/vehicle";

export class Gameface extends BaseObject
{
    public static Instance: Gameface;
    public static isLowPerformance: boolean = true;

    public playerId: string = "";
    public player?: Ped;
    public vehicle?: Vehicle;

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

        initAmmoExtension();

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

        this.network.connect(async () => {
            console.log("conectado");

            this.network.send(PACKET_TYPE.PACKET_REQUEST_MODELS, {});

            const models = await this.network.waitForPacket<IPacketData_Models>(PACKET_TYPE.PACKET_MODELS);

            Gameface.Instance.game.gltfCollection.fromPacketData(models);

            this.game.serverScene.create();

            this.vehicle = this.game.gameObjectFactory.spawnVehicle();
            //this.player.setPosition(0, 0, 5);
        });
    }

    public update(delta: number)
    {
        this.game.update(delta);
        this.network.update(delta);
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