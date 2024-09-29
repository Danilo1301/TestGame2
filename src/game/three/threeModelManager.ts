import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface ThreeModel {
    gltf: GLTF,
    object: THREE.Group
    mixer?: THREE.AnimationMixer
    clip?: THREE.AnimationClip
}

export class ThreeModelManager {
    public static _models = new Map<string, GLTF>();

    public static hasLoaded(id: string) {
        return this._models.has(id);
    }

    public static get(id: string) {
        if(!this.hasLoaded(id))
        {
            console.error("Could not find model id " + id);
            return
        }

        const object = this._models.get(id)!;
        return object;
    }

    public static async getOrLoad(id: string, path: string) {
        if(!this.hasLoaded(id))
        {
            await this.load(id, path)
        }

        return this.get(id);
    }

    public static load(id: string, path: string) {
        const onProgress = () => console.log("onProgress")
        const onError = (error: any) => console.log("onError", error)

        const models = this._models;

        console.log(`Loading model ${id}: ${path}`);

        return new Promise<GLTF>(resolve => {
            const loader = new GLTFLoader();
            loader.load(path, function(gltf) {
                
                console.log(`Model ${id} loaded`);

                models.set(id, gltf);
                resolve(gltf)
    
            }, onProgress, onError);
        })
    }

    public static getThreeModel(id: string, loadAnimation?: boolean) {
        const gltf = ThreeModelManager.get(id);

        if(!gltf)
        {
            throw "GLTF " + id + " was not found!";
        }

        //const object = hasLoaded ? gltf.scene.clone() : gltf.scene
        const object = gltf.scene
        //scene.add(object);
        
        const result: ThreeModel = {
            gltf: gltf,
            object: object
        }

        if(loadAnimation) {
            const mixer = new THREE.AnimationMixer(object);

            if(gltf.animations.length > 0)
            {

                console.log(gltf.animations);

                /*
                const walkAnim = gltf.animations[2];
                const armsAnim = gltf.animations[0];

                console.log("additional anim has these tracks:");
                armsAnim.tracks.forEach(track => {
                    console.log(track.name);
                });

                const toDelete: THREE.KeyframeTrack[] = [];

                walkAnim.tracks.forEach(track => {
                    if(track.name.includes("upper_arm_R") || track.name.includes("lower_arm_R"))
                    {
                        toDelete.push(track);
                    }
                });

                console.log(walkAnim.tracks.length + " tracks");
                toDelete.forEach(track => {
                    walkAnim.tracks.splice(walkAnim.tracks.indexOf(track), 1);
                });
                console.log(walkAnim.tracks.length + " tracks");
                
                THREE.AnimationUtils.makeClipAdditive(walkAnim, 0, armsAnim);

                const walkAction = mixer.clipAction(walkAnim);
                const armsAction = mixer.clipAction(armsAnim);
                
                walkAction.play();
                armsAction.play();
                */

            }
           
            


            /*
            if(clip)
            {
                const anim = mixer.clipAction(clip)
                anim.reset()
                anim.play()
            }

            */

            result.mixer = mixer
            //result.clip = clip
        }

        return result;
    }

}