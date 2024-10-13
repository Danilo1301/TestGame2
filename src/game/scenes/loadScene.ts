import { Gameface } from "../gameface/gameface";
import { AudioManager } from "../audioManager"

export enum LoadState {
    NOT_LOADED,
    LOADING,
    LOADED,
    ERROR
}

export enum AssetType {
    IMAGE,
    AUDIO,
    FONT,
    ATLAS,
    TASK
}

export interface Asset {
    key: string
    path: string
    loadState: LoadState
    type: AssetType

    taskFunction?: Function
}

export class LoadScene extends Phaser.Scene
{
    public static Instance: LoadScene;

    private _assets: Asset[] = [];
    
    private _onLoaderComplete?: Function;

    constructor()
    {
        super({});
        LoadScene.Instance = this;
    }

    public async create()
    {
        console.log("created");

        this.load.on('filecomplete', (key: string, type: any, data: any) => {
            console.log(`[loadScene] filecomplete: ${key}`, type, data);

            const asset = this.getAssetByKey(key)!;

            asset.loadState = LoadState.LOADED;

            this.printProgress();
        });

        this.load.on('loaderror', (event: any) => {
            const key = event.key;

            console.error(`[loadScene] loaderror: ${key}`, event);

            const asset = this.getAssetByKey(key)!;

            asset.loadState = LoadState.ERROR;
        });

        this.load.on('complete', async () => {
            console.log(`[loadScene] loader completed`);

            this._onLoaderComplete?.();
            this._onLoaderComplete = undefined;
        });
    }

    public printProgress()
    {
        const loaded = this.getLoadedAssets().length;
        const total = this._assets.length;

        const percentage = loaded/total*100;

        console.log(`[loadScene] progress: ${percentage.toFixed(0)}% ${loaded}/${total}`);
    }

    public setPath(path: string)
    {
        console.log(`[loadScene] setPath: ${path}`);

        this.load.setPath(path);
    }

    public addImage(key: string, path: string)
    {
        console.log(`[loadScene] addImage '${key}' (${path})`);

        const asset = this.createAsset(key, path, AssetType.IMAGE);
    }

    public addAudio(key: string, path: string)
    {
        console.log(`[loadScene] addAudio '${key}' (${path})`);

        const asset = this.createAsset(key, path, AssetType.AUDIO);
    }

    public addTask(key: string, fn: Function)
    {
        console.log(`[loadScene] addTask '${key}'`);

        const asset = this.createAsset(key, "", AssetType.TASK);
        asset.taskFunction = fn;
    }

    public addAtlas(key: string, path: string)
    {
        console.log(`[loadScene] addAtlas '${key}' (${path})`);

        const asset = this.createAsset(key, path, AssetType.ATLAS);
    }

    private createAsset(key: string, path: string, type: AssetType)
    {
        if(this.getAssetByKey(key) != undefined)
        {
            throw `LoadAsset: An asset with key ${key} is already created!`;
        }

        const asset: Asset = {
            key: key,
            path: path,
            loadState: LoadState.NOT_LOADED,
            type: type
        }
        this._assets.push(asset);
        return asset;
    }

    public getAssetByKey(key: string)
    {
        for(const asset of this._assets)
        {
            if(asset.key == key) return asset;
        }
        return undefined;
    }

    public getNotLoadedAssets()
    {
        const assets: Asset[] = [];

        for(const asset of this._assets)
        {
            if(asset.loadState == LoadState.LOADED) continue;
            if(asset.loadState == LoadState.ERROR) continue;

            assets.push(asset);
        }
        return assets;
    }

    public getLoadedAssets()
    {
        const assets: Asset[] = [];

        for(const asset of this._assets)
        {
            if(asset.loadState == LoadState.NOT_LOADED) continue;
            if(asset.loadState == LoadState.LOADING) continue;

            assets.push(asset);
        }
        return assets;
    }

    private async loadAllPhaserFiles()
    {
        return new Promise<void>(resolve => {

            const assets = this.getNotLoadedAssets();

            for(const asset of assets)
            {
                if(asset.type == AssetType.TASK) continue;
                if(asset.type == AssetType.AUDIO) continue;

                console.log(`[loadScene] preparing to load ${asset.key}`);

                asset.loadState = LoadState.LOADING;

                switch(asset.type)
                {
                    case AssetType.IMAGE:
                        this.load.image(asset.key, asset.path);
                        break;
                    default:
                        console.error(`Could not load asset type ${asset.type}`);
                        continue;
                }
            }

            this._onLoaderComplete = () => {
                resolve();
            }
    
            this.load.start();
        });
    }

    private async loadAllTasks()
    {
        const assets = this.getNotLoadedAssets();

        for (const asset of assets)
        {
            if(asset.type != AssetType.TASK)
            {
                //throw `LoadScene: Asset ${asset.key} is not a task!`
                continue;
            }
            
            asset.loadState = LoadState.LOADING;

            console.log(`[loadScene] awaiting task ${asset.key}`);

            if(asset.taskFunction)
                await asset.taskFunction();

            console.log(`[loadScene] task ${asset.key} finished`);

            asset.loadState = LoadState.LOADED;

            this.printProgress();
        }
    }

    private async loadAllAudios()
    {
        const assets = this.getNotLoadedAssets();

        for (const asset of assets)
        {
            if(asset.type != AssetType.AUDIO)
            {
                //throw `LoadScene: Asset ${asset.key} is not a audio!`
                continue;
            }
            
            asset.loadState = LoadState.LOADING;

            await AudioManager.addAndLoadAudio(asset.key, asset.path);

            asset.loadState = LoadState.LOADED;

            this.printProgress();
        }
    }

    public async loadAll()
    {
        console.log(`[loadScene] loadAll`);

        console.log(`[loadScene] loading files using phaser load`);

        await this.loadAllPhaserFiles();

        await this.loadAllTasks();

        await this.loadAllAudios();

        console.log(`[loadScene] everything has been loaded sucessfuly`);

        this._assets = [];
    }
}