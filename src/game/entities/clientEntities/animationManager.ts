import THREE, { LoopOnce, LoopRepeat } from "three";
import { ClientEntity } from "./clientEntity";

interface AnimData {
    name: string
    action: THREE.AnimationAction
    repetitions: number
    stopAtEnd: boolean
}

export class AnimationManager
{
    public clientEntity: ClientEntity;

    public anims: AnimData[] = [];
    public subAnims: AnimData[] = [];

    constructor(clientEntity: ClientEntity)
    {
        this.clientEntity = clientEntity;
    }

    public isPlayingAnim(name: string)
    {
        for(const anim of this.anims)
        {
            if(anim.name == name) return true;
        }

        for(const anim of this.subAnims)
        {
            if(anim.name == name) return true;
        }
    }

    public playAnimOneTime(name: string, isMainAnim: boolean)
    {
        return this.playAnimEx(name, isMainAnim, 1, 0);
    }

    public playAnim(name: string, isMainAnim: boolean)
    {
        return this.playAnimEx(name, isMainAnim, Infinity, 0);
    }

    public playAnimAndHold(name: string, isMainAnim: boolean)
    {
        const anim = this.playAnimOneTime(name, isMainAnim);
        anim.stopAtEnd = true;
    }

    public playAnimEx(name: string, isMainAnim: boolean, repetitions: number, startTime: number)
    {
        const modelClip = this.getAnimationClipByName(name);

        if(!modelClip)
        {
            throw `Could not find anim ${name}`;
        }

        const clip = this.cloneClip(modelClip);

        const anim: AnimData = {
            name: name,
            action: this.makeClip(clip, repetitions),
            repetitions: repetitions,
            stopAtEnd: false
        }

        this.watchActions();

        const arr = isMainAnim ? this.anims : this.subAnims;

        arr.push(anim);

        if(arr.length == 3)
        {
            const prevAnim = arr[0];
            prevAnim.action.stop();
            arr.splice(0, 1);
        }
            
        if(arr.length == 1)
        {
            anim.action.time = startTime;
            anim.action.play();
        }

        if(arr.length >= 2)
        {
            const prevAnim = arr[arr.length-2];
            const duration = 0.2;

            prevAnim.action.fadeOut(duration);

            anim.action
                .reset()
                .setEffectiveTimeScale( 1 )
                .setEffectiveWeight( 1 )
                .fadeIn( duration )
                .play();

            setTimeout(() => {
                if(arr.indexOf(prevAnim) != -1)
                {
                    prevAnim.action.stop();
                    arr.splice(0, 1);
                }
            }, duration * 1000);
        }

        if(this.anims.length > 0 && this.subAnims.length > 0)
        {
            const baseAnim = this.anims[this.anims.length-1];

            const prevTime = baseAnim.action.time;

            baseAnim.action.stop();

            const baseModelClip = this.getAnimationClipByName(baseAnim.name)!;
            const baseClip = this.cloneClip(baseModelClip);
            const subClip = this.subAnims[this.subAnims.length-1].action.getClip();

            const toDelete: THREE.KeyframeTrack[] = [];

            baseClip.tracks.forEach(track => {
                if(track.name.includes("upper_arm_R") || track.name.includes("lower_arm_R")) toDelete.push(track);
                if(track.name.includes("upper_arm_L") || track.name.includes("lower_arm_L")) toDelete.push(track);
                if(track.name.includes("hand_L") || track.name.includes("hand_R")) toDelete.push(track);
            });

            //console.log(baseClip.tracks.length + " tracks");
            toDelete.forEach(track => {
                baseClip.tracks.splice(baseClip.tracks.indexOf(track), 1);
            });
            //console.log(baseClip.tracks.length + " tracks");
            
            THREE.AnimationUtils.makeClipAdditive(baseClip, 0, subClip);

            const baseAction = this.makeClip(baseClip, baseAnim.repetitions);
            baseAnim.action = baseAction;

            baseAction.time = prevTime;
            baseAction.play();
        }

        return anim;
    }

    private _hasSetupEvents = false;

    private watchActions()
    {
        if(this._hasSetupEvents) return;

        this._hasSetupEvents = true;

        const mixer = this.clientEntity.gltfModel!.mixer!;
            
        const self = this;
        mixer.addEventListener('finished', function (event) {
            const action = event.action;
            
            console.log('Animação terminou');

            let finishedAnim: AnimData | undefined;
            let isMainAnim = false;

            for(const anim of self.anims)
            {
                if(anim.action == action)
                {
                    finishedAnim = anim;
                    isMainAnim = true;
                    break;
                }
            }

            for(const anim of self.subAnims)
            {
                if(anim.action == action)
                {
                    finishedAnim = anim;
                    break;
                }
            }

            if(!finishedAnim) throw "An animation finished and its not in anims list";

            self.stopAnim(isMainAnim);
        });
    }

    public stopAnim(mainAnim: boolean)
    {
        const arr = mainAnim ? this.anims : this.subAnims;
        
        if(arr.length == 0)
        {
            console.warn("no animation to stop");
            return;
        }

        const anim = arr[arr.length-1];

        console.log(arr, anim.name, "stopped");

        if(anim.stopAtEnd)
        {
            console.log("start again")

            anim.action.reset();
            anim.action.time = anim.action.getClip().duration;
            anim.action.play();
            anim.action.paused = true;
            anim.stopAtEnd = false;
        } else {
            let fadeTime = 300;
            
            anim.action.fadeOut(fadeTime / 1000);
            setTimeout(() => {
                anim.action.stop();
            }, fadeTime);
            arr.splice(arr.indexOf(anim));
        }

        if(this.subAnims.length == 0 && this.anims.length > 0)
        {
            const mainAnim = this.anims[this.anims.length-1];
            const prevTime = mainAnim.action.time;

            mainAnim.action.fadeOut(0.1);

            this.stopAnim(true);
            this.playAnimEx(mainAnim.name, true, mainAnim.repetitions, prevTime);
        }
    }
    
    public stopImediatly(mainAnim: boolean)
    {
        const arr = mainAnim ? this.anims : this.subAnims;

        for(const anim of arr)
        {
            anim.action.stop();
        }
        arr.splice(0, arr.length);
    }

    public cloneClip(clip: THREE.AnimationClip)
    {
        const clonedTracks = clip.tracks.map(track => {
            // Create a new instance of the KeyframeTrack, passing in the same data
            const clonedTrack = track.clone(); // Deep clone of the track
            return clonedTrack;
        });

        const clonedClip = new THREE.AnimationClip(clip.name, clip.duration, clonedTracks, clip.blendMode);

        return clonedClip;
    }

    private makeClip(clip: THREE.AnimationClip, repetitions: number)
    {
        const mixer = this.clientEntity.gltfModel!.mixer!;

        const loop = repetitions != Infinity ? LoopOnce : LoopRepeat;

        //console.log("repetitions", repetitions);
        //console.log("loop", loop);

        const action = mixer.clipAction(clip);
        action.setLoop(repetitions != Infinity ? LoopOnce : LoopRepeat, repetitions)
        
        return action;
    }
    
    public getAnimationClipByName(name: string)
    {
        const gltfModel = this.clientEntity.gltfModel;

        if(!gltfModel)
        {
            //console.error("no gltf model");
            return undefined;
        }
        
        //console.log(gltfModel.gltf.animations);

        for(const animation of gltfModel.gltf.animations)
        {
            //console.log(animation.name)
            if(animation.name == name) return animation;
        }
        
        //console.error("no animation found with name " + name);

        return undefined;
    }
}