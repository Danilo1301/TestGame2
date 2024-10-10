import THREE, { LoopOnce, LoopRepeat } from "three";
import { ClientEntity } from "./clientEntity";
import { BaseObject } from "../../../shared/baseObject";

interface AnimData {
    name: string
    action: THREE.AnimationAction
    repetitions: number
    stopAtEnd: boolean
    role: AnimRole
}

enum AnimRole {
    ANIM_MAIN,
    ANIM_SUB
}

export class AnimationManager extends BaseObject
{
    public clientEntity: ClientEntity;

    public anims: AnimData[] = [];
    public subAnims: AnimData[] = [];

    constructor(clientEntity: ClientEntity)
    {
        super();
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

    public playAnimationLoop(name: string)
    {
        this.playAnimationEx(AnimRole.ANIM_MAIN, name, Infinity);
    }

    public playAnimationEx(role: AnimRole, name: string, repetitions: number)
    {
        const modelClip = this.getAnimationClipByName(name);

        if(!modelClip)
        {
            throw `Could not find animation '${name}'`;
        }

        this.watchActions();

        const clip = this.cloneClip(modelClip);

        const action = this.makeClip(clip, repetitions);
        action.play();

        const animsArr = role == AnimRole.ANIM_MAIN ? this.anims : this.subAnims;

        const anim: AnimData = {
            name: name,
            action: action,
            repetitions: repetitions,
            stopAtEnd: false,
            role: role
        }

        animsArr.push(anim);

        if(animsArr.length >= 2)
        {
            const fadeDuuration = 0.2;

            const prevAnim = animsArr[0];
            const prevAction = prevAnim.action;

            prevAction.fadeOut(fadeDuuration);
            setTimeout(() => {
                prevAction.stop();
            }, fadeDuuration * 1000);
            anim.action.fadeIn(fadeDuuration);

            anim.action.play();

            animsArr.splice(0, 1);
        }

        if(this.anims.length > 0 && this.subAnims.length > 0)
        {
            console.log("make subclip additive")

            const baseAnim = this.anims[this.anims.length-1];

            const baseTime = baseAnim.action.time;
            baseAnim.action.stop();

            const baseModelClip = this.getAnimationClipByName(baseAnim.name)!;
            const baseClip = this.cloneClip(baseModelClip);

            const subClip = this.subAnims[this.subAnims.length-1].action.getClip();

            this.deleteTracksFromClip(baseClip, [
                "upper_arm_L",
                "upper_arm_R",
                "lower_arm_L",
                "lower_arm_R",
                "hand_L",
                "hand_R",
                "item_L",
                "item_R"
            ]);

            THREE.AnimationUtils.makeClipAdditive(baseClip, 0, subClip);

            const baseAction = this.makeClip(baseClip, baseAnim.repetitions);
            baseAnim.action = baseAction;

            baseAnim.action.time = baseTime;
            baseAnim.action.play();
        }

        console.log(role == AnimRole.ANIM_MAIN ? "MAIN" : "SUB", animsArr);

        return anim;
    }

    private _hasSetupEvents: boolean = false;
    private watchActions()
    {
        if(this._hasSetupEvents) return;

        this._hasSetupEvents = true;

        const mixer = this.clientEntity.gltfModel!.mixer!;
            
        const self = this;
        mixer.addEventListener('finished', function (event) {
            const action = event.action;
            
            self.log('an animation finished');

            let anim: AnimData | undefined;
            let role = AnimRole.ANIM_MAIN;

            for(const a of self.anims)
            {
                if(a.action == action)
                {
                    anim = a;
                    break;
                }
            }

            for(const a of self.subAnims)
            {
                if(a.action == action)
                {
                    anim = a;
                    role = AnimRole.ANIM_SUB
                    break;
                }
            }

            if(!anim) throw "An animation finished and its not in anims list";

            self.log('an animation called ' + anim.name + ' finished');

            const stopImidiately = anim.stopAtEnd == true;

            self.stopAnimationEx(role, stopImidiately);
        });
    }

    private deleteTracksFromClip(clip: THREE.AnimationClip, bones: string[])
    {
        const toDelete: THREE.KeyframeTrack[] = [];

        clip.tracks.forEach(track => {

            for(const bone of bones)
            {
                if(track.name.includes(bone))
                {
                    toDelete.push(track);
                    return;
                }
            }
        });

        //console.log(baseClip.tracks.length + " tracks");
        toDelete.forEach(track => {
            clip.tracks.splice(clip.tracks.indexOf(track), 1);
        });
        
        this.log(`${toDelete.length} tracks deleted`);
    }

    public playSubAnimationLoop(name: string)
    {
        this.playAnimationEx(AnimRole.ANIM_SUB, name, Infinity);
    }

    public playSubAnimationAndStop(name: string)
    {
        const anim = this.playAnimationEx(AnimRole.ANIM_SUB, name, 1);
        anim.stopAtEnd = true;
    }

    public stopMainAnimation(stopImidiately: boolean = false)
    {
        this.stopAnimationEx(AnimRole.ANIM_MAIN, stopImidiately);
    }

    public stopSubAnimation(stopImidiately: boolean = false)
    {
        this.stopAnimationEx(AnimRole.ANIM_SUB, stopImidiately);
    }

    public stopAnimationEx(role: AnimRole, stopImidiately: boolean)
    {
        const fadeDuration = 0.2;

        const animsArr = role == AnimRole.ANIM_MAIN ? this.anims : this.subAnims;

        let stopAtEnd = false;

        for(const anim of animsArr)
        {
            this.log(`stopped anim ${anim.name} ${stopImidiately ? "IMEDIATLY" : "AND FADEOUT"}`);
            
            if(anim.stopAtEnd)
            {
                stopAtEnd = true;

                console.log("start again and go to end")

                anim.action.reset();
                anim.action.time = anim.action.getClip().duration;
                //anim.action.fadeIn(0);
                anim.action.paused = true;
                anim.action.play();
                anim.stopAtEnd = false;

                continue;
            }

            if(stopImidiately)
            {
                anim.action.stop();
            } else {
                anim.action.fadeOut(fadeDuration);

                setTimeout(() => {
                    anim.action.stop();
                }, fadeDuration * 1000);
            }
        }

        if(stopAtEnd)
        {
            console.log("anim is stopping at end")
            return;
        }

        animsArr.splice(0, animsArr.length);

        if(role == AnimRole.ANIM_SUB && this.anims.length > 0)
        {
            console.log(`resetting main anim`);

            const baseAnim = this.anims[0];
            const baseTime = baseAnim.action.time;
            const prevAction = baseAnim.action;
            prevAction.fadeOut(0.3);
            setTimeout(() => {
                prevAction.stop();
            }, 300);

            const baseModelClip = this.getAnimationClipByName(baseAnim.name)!;
            const baseClip = this.cloneClip(baseModelClip);

            const baseAction = this.makeClip(baseClip, baseAnim.repetitions);
            baseAnim.action = baseAction;

            baseAnim.action.time = baseTime;
            baseAnim.action.fadeIn(0.3);
            baseAnim.action.play();
        }
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