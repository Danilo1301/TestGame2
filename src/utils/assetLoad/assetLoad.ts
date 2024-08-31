import * as Phaser from "phaser"
import { MainScene } from "../../game/scenes/mainScene";
import { Gameface } from "../../game/gameface/gameface";
import { LoadScene } from "../../game/scenes/loadScene";
import { Debug } from "../debug/debug";
import { audioAssets, imageAssets } from "../../game/constants/assets";
import { AudioManager } from "../audioManager/audioManager";

export enum LoadState {
    NOT_LOADED,
    LOADING,
    LOADED
}

export enum AssetType {
    IMAGE,
    AUDIO,
    FONT,
    TASK
}

export interface Asset {
    key: string
    path: string
    loadState: LoadState
    type: AssetType
}

export class AssetLoad
{
    private static _assets = new Phaser.Structs.Map<string, Asset>([]);

    public static addImage(key: string, path: string)
    {
        console.log(`Add asset to load: ${key} (${path})`);

        const asset: Asset = {
            key: key,
            path: path,
            loadState: LoadState.NOT_LOADED,
            type: AssetType.IMAGE
        }

        this._assets.set(key, asset);
    }
    
    public static addAudio(key: string, path: string)
    {
        console.log(`Add asset to load: ${key} (${path})`);

        const asset: Asset = {
            key: key,
            path: path,
            loadState: LoadState.NOT_LOADED,
            type: AssetType.AUDIO
        }

        this._assets.set(key, asset);
    }

    public static addAssets()
    {
        for(const asset of imageAssets)
        {
            this.addImage(asset.key, asset.path);
        }

        
        for(const asset of audioAssets)
        {
            this.addAudio(asset.key, asset.path);
            AudioManager.addAudio(asset.key, asset.path);
        }
    
    }

    public static async load()
    {
        Debug.log("AssetLoad", "Loading assets...");

        const scene = Gameface.Instance.sceneManager.startScene(LoadScene) as LoadScene; 

        for(const asset of this._assets.values())
        {
            scene.loadAsset(asset);
        }

        await scene.startLoadingAssets();

        Gameface.Instance.sceneManager.removeScene(LoadScene);

        Debug.log("AssetLoad", "Assets loaded!");
    }

    public static getAssetsUrl() {
        const serverAddress = "https://guitargame.glitch.me";

        if(location.host.includes('localhost') || location.host.includes(':')) {
            return `${location.protocol}//${location.host}/assets/`;
        } 

        return `${serverAddress}/assets/`;
    }

    public static getAssetByKey(key: string)
    {
        for(const asset of this._assets.values())
        {
            if(asset.key == key) return asset;
        }
        return undefined;
    }
}