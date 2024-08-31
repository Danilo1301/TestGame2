import { Asset, AssetLoad, AssetType, LoadState } from "../../utils/assetLoad/assetLoad"
import { AudioManager } from "../../utils/audioManager/audioManager";

interface LoadAsset {
    text: string
    asset: Asset
    taskFn?: () => Promise<void>
}

export class LoadScene extends Phaser.Scene
{
    public static Instance: LoadScene;
    
    private _loadAssets: LoadAsset[] = [];

    constructor()
    {
        super({});

        LoadScene.Instance = this;
    }

    public async create()
    {
        const self = this;
        const load = this.load;

        load.setPath(AssetLoad.getAssetsUrl());
        load.on('filecomplete', function(key: string, type: any, data: any) {
            const asset = AssetLoad.getAssetByKey(key);

            if(!asset) return;

            asset.loadState = LoadState.LOADED;

            console.log("filecomplete", asset);
        });
    }

    public update(time: number, delta: number)
    {
        
    }

    public loadAsset(asset: Asset)
    {
        console.log(`[loader] add load image '${asset.key}'`);

        const loadAsset: LoadAsset = {
            text: `Loading image ${asset.key}`,
            asset: asset
        }
        this._loadAssets.push(loadAsset);
    }

    public async startLoadingAssets()
    {
        return new Promise<void>((resolve) => {

            const load = this.load;

            for (const loadAsset of this._loadAssets)
            {
                const key = loadAsset.asset.key;
                const path = loadAsset.asset.path;

                loadAsset.asset.loadState = LoadState.LOADING;

                if(loadAsset.asset.type == AssetType.IMAGE) load.image(key, path);
                if(loadAsset.asset.type == AssetType.AUDIO) load.audio(key, path);
            }

            load.once('complete', async () => {

                console.log("load completed");
                console.log("loading audios...");
                
                await AudioManager.loadAllAudios();

                resolve();
            });
            load.start();
        });
    }
}