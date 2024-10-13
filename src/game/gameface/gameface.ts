import THREE from "three";
import Phaser from "phaser";
import { BaseObject } from "../../shared/baseObject";
import { PhaserLoad } from "../../shared/phaserLoad"
import { SceneManager } from "./sceneManager";
import { MainScene } from "../scenes/mainScene";
import { PreloadScene } from "../scenes/preloadScene";
import { LoadScene } from "../scenes/loadScene";
import { ThreeScene } from "../scenes/threeScene";
import { MemoryDetect } from "../../shared/memoryDetect";
import { Game } from "../game/game";
import { GameScene } from "../scenes/gameScene";
import { Ped } from "../entities/ped";
import { Input } from "../input";
import { Weapon } from "../weapons/weapon";
import { Network } from "../network/network";
import { IPacketData_Models, IPacketData_WeaponShot, PACKET_TYPE } from "../network/packet";
import { Entity } from "../entities/entity";
import { getIsMobile } from "../../shared/utils";

export class Gameface extends BaseObject
{
    public static Instance: Gameface;
    
    public get sceneManager() { return this._sceneManager; }
    public get phaser() { return this._phaser!; }
    public get game() { return this._game!; }
    public get input() { return this._input; }
    public get network() { return this._network; }

    public player?: Ped;
    public playerId: string = "";

    private _sceneManager = new SceneManager(this);
    private _phaser?: Phaser.Game;
    private _memoryDetect = new MemoryDetect();
    private _game = new Game();
    private _input = new Input();
    private _network = new Network();
    
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

        this.sceneManager.startScene(PreloadScene);

        await PreloadScene.Instance.waitForStart();

        const loadScene = this.sceneManager.startScene(LoadScene) as LoadScene;

        loadScene.setPath(`/assets/`);
        loadScene.addImage("test1", "test1.png");
        loadScene.addImage("test2", "test1.png");
        loadScene.addImage("test3", "test1.png");
        loadScene.addImage("test4", "test1.png");
        loadScene.addImage("crosshair_shotgun", "crosshair/shotgun.png");
        loadScene.addAudio("shot_m4", "weapons/m4/shot.wav");

        //this.load.image("crosshair_shotgun", "crosshair/shotgun.png");
        //this.load.audio("shot_m4", "weapons/m4/shot.wav");

        loadScene.addAudio("testwav1", "weapons/m4/shot.wav");
        loadScene.addTask("task_wait_1_second", async () => {
            return new Promise<void>(resolve => {
                setTimeout(() => {
                    resolve();
                }, 0);
            })
        });
        //loadScene.addAtlas("test2", "test2");

        await loadScene.loadAll();
        
        this.sceneManager.startScene(MainScene);
        this.sceneManager.startScene(ThreeScene); 

        this.input.init(MainScene.Instance);

        this.sceneManager.startScene(GameScene);

        this.game.init();

        this.game.events.on("weapon_shot", (weapon: Weapon, from: THREE.Vector3, to: THREE.Vector3, entity: Entity | undefined) => {
            GameScene.Instance.clientEntityManager.onWeaponShot(weapon, from, to);

            const ped = weapon!.ped!;

            console.log(entity);

            if(ped == this.player)
            {
                this.network.send<IPacketData_WeaponShot>(PACKET_TYPE.PACKET_WEAPON_SHOT, {
                    hit: [to.x, to.y, to.z],
                    byPed: this.player.id,
                    hitEntity: entity?.id
                });
            }
        });

        Input.events.on("pointerup", () => {

            if(getIsMobile())
            {
                if(!this.isFullscreen()) this.enterFullscreen();
            } else {
                MainScene.Instance.input.mouse?.requestPointerLock();
            }
            
        });
            
        this.network.connect(async () => {
            this.log("conectado");

            this.network.send(PACKET_TYPE.PACKET_REQUEST_MODELS, {});

            this.log("waiting for models");

            const models = await this.network.waitForPacket<IPacketData_Models>(PACKET_TYPE.PACKET_MODELS);

            Gameface.Instance.game.gltfCollection.fromPacketData(models);
            
            this.game.create();
            this.game.serverScene.createLocalScene();

            //this.network.send(PACKET_TYPE.PACKET_CLIENT_READY, {});
            
            const ped = this.game.entityFactory.spawnPed(0, 5, 0);
            this.player = ped;

            const box = this.game.entityFactory.spawnBox(5, 5, 0);

            const npc = this.game.entityFactory.spawnPed(0, 5, 0);
            npc.inputZ = 0.01;   
            
            (window as any)["npc"] = npc;

            setInterval(() => {
                npc.lookAtEntity(box);
            }, 500);
        });
    }

    public preUpdate(delta: number)
    {
        const gameScene = GameScene.Instance as GameScene | undefined;

        this._memoryDetect.preUpdate();
        
        //ThreeScene.Instance.clearDebugObjects();
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
        this.network.update(delta);
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