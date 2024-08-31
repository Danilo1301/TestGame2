import { Gameface } from "../../game/gameface/gameface";
import { MainScene } from "../../game/scenes/mainScene";
import { AssetLoad, LoadState } from "../assetLoad/assetLoad";

export interface AssetAudio
{
    key: string
    url: string
    audio?: HTMLAudioElement
    loadState: LoadState

}

export class AudioManager
{
    public static assets = new Map<string, AssetAudio>();
    public static onLoadedAllAudios?: Function;
    
    public static get sound() {
        const w: any = window;
        return w["createjs"].Sound as createjs.Sound;
    };

    public static addAudio(key: string, url: string)
    {
        console.log("add audio", url);

        const asset: AssetAudio = {
            key: key,
            url: url,
            audio: undefined,
            loadState: LoadState.LOADING
        }

        this.assets.set(key, asset);
    }

    public static playAudio(key: string)
    {
        return this.playAudioWithVolume(key, 1.0);
    }

    public static playAudioPhaser(key: string)
    {
        MainScene.Instance.sound.play(key);
    }

    public static playAudioWithVolume(key: string, volume: number)
    {
        const asset = this.assets.get(key);
        
        if(!asset) throw "Asset " + key + " not found";

        const audio = asset.audio;

        if(!audio) throw "Audio not found";

        audio.volume = volume;
        audio.play();

        return audio;
    }

    public static async loadAllAudios()
    {
        return new Promise<void>((resolve) => {
            let notLoaded = this.getNotLoadedCount();

            for(const asset of this.assets.values())
            {
                const audio = new Audio(`/assets/${asset.url}`);
                audio.preload = 'auto';

                asset.audio = audio;

                audio.addEventListener('canplaythrough', () => {
                    asset.loadState = LoadState.LOADED;

                    notLoaded = this.getNotLoadedCount();

                    if(notLoaded == 0)
                    {
                        resolve();
                    }
                }, false);
            }
        });
    }

    public static getNotLoadedCount()
    {
        let i = 0;
        for(const asset of this.assets.values())
        {
            if(asset.loadState == LoadState.LOADING) i++;
        }
        return i;
    }
}