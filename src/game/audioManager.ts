import { LoadState } from "../game/scenes/loadScene"

export interface AudioAsset
{
    key: string
    path: string
    audio?: HTMLAudioElement
    loadState: LoadState
}

export class AudioManager
{
    public static audios = new Map<string, AudioAsset>();

    public static async addAndLoadAudio(key: string, path: string)
    {
        console.log(`[AudioManager] load audio ${key} (${path})`);

        const asset: AudioAsset = {
            key: key,
            path: path,
            audio: undefined,
            loadState: LoadState.NOT_LOADED
        }

        this.audios.set(key, asset);

        await this.loadAudio(asset);
    }

    private static loadAudio(asset: AudioAsset)
    {
        return new Promise<void>(resolve => {

            console.log(`[AudioManager] loading audio ${asset.key}`);

            asset.audio = new Audio(`/assets/${asset.path}`);
            asset.loadState = LoadState.LOADING;

            function markAsLoaded()
            {
                if(asset.loadState == LoadState.LOADED)
                {
                    console.warn("O audio já foi carregado, mas foi marcado como carregado novamente!");
                    return;
                }

                asset.loadState = LoadState.LOADED;

                console.log(`Áudio HTML '${asset.path}' carregado!`);

                resolve();
            }

            const audio = asset.audio!;

            audio.addEventListener('progress', () => {
                console.log('Carregando áudio:', audio.readyState); 

                
                if (audio.readyState >= 2)
                {
                    console.log('Áudio pronto para reprodução: readyState = ' + audio.readyState);
                    //markAsLoaded();
                }
                
                markAsLoaded();
            });

            audio.addEventListener('canplaythrough', () => {
                console.log('Áudio pronto para reprodução: canplaythrough');
                markAsLoaded();
            }, false);
        })
    }

    public static play(key: string)
    {
        const audio = this.createAudio(key);

        audio.play();
        
        return audio;
    }

    public static createAudio(key: string)
    {
        const audioAsset = this.audios.get(key)!;

        const audio = new Audio(`/assets/` + audioAsset.path);
        return audio;
    }
}