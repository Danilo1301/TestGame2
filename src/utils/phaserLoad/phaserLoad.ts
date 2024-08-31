//import * as NineSlicePlugin from 'phaser3-nineslice'
import { Debug } from "../debug/debug";
import { config } from "../../game/constants/config";
import { enable3d } from "@enable3d/phaser-extension";

enum PreloadState {
    NOT_LOADED,
    LOADING,
    COMPLETED
}

export class PhaserLoad {
    private static _loadState: PreloadState = PreloadState.NOT_LOADED;
    private static _callback?: (phaser: Phaser.Game) => void;
    private static _phaser?: Phaser.Game;

    public static load(callback: (phaser: Phaser.Game) => void) {
        this._callback = callback;
        this.processLoad();
    }

    public static async loadAsync()
    {
        return new Promise<Phaser.Game>((resolve) => {
            this.load((phaser) => {
                resolve(phaser);
            });
        });
    }

    private static processLoad() {
        Debug.log("PhaserLoad", "processLoad", this._loadState);

        if(this._loadState == PreloadState.NOT_LOADED) {
            this._loadState = PreloadState.LOADING;

            const cfg = config;
            cfg.plugins = {
                global: [
                    //NineSlicePlugin.Plugin.DefaultCfg
                ]
            }

            enable3d(() => {
                const game = new Phaser.Game(config);

                this._phaser = game;

                game.events.once('ready', () => {
                    this.processLoad();
                });

                return game;
            }).withPhysics('/assets/ammo/kripken')
            
            return;
        }

        this._loadState = PreloadState.COMPLETED;

        if(!this._phaser) throw "No phaser!";
        if(!this._callback) throw "No callback!";

        this._callback(this._phaser);
        this._callback = undefined;
    }
}