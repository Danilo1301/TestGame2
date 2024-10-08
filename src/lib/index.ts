import { BaseObject } from "../shared/baseObject";
import { Debug } from "../shared/debug";
import { MasterServer } from "../server/masterServer/masterServer";
import * as Phaser from "phaser"
import THREE from "three";

Debug.useColor = false;

class GameLib extends BaseObject {

    public get Debug() { return Debug; }
    public get Phaser() { return Phaser};
    public get THREE() { return THREE};

    public load()
    {
        this.log("load");
        this.log(this.Phaser ? "Phaser is defined!" : "Phaser is not defined");
        this.log(this.THREE ? "THREE is defined!" : "THREE is not defined");
    }

    public createMasterServer()
    {
        this.log("creating master server");

        const masterServer = new MasterServer();
        return masterServer;
    }
}

const gameLib = new GameLib();

(globalThis as any).loadGameLib = () => {
    gameLib.load();
    return gameLib;
}