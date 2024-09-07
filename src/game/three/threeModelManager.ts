import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface ThreeModel {
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
            object: object
        }

        if(loadAnimation) {
            const mixer = new THREE.AnimationMixer(object);

            if(gltf.animations.length > 0)
            {
                const baseAnim = gltf.animations[1]; // Assuming this is the base animation
                const anim2 = gltf.animations[2];
                const animHead = gltf.animations[0];
            
                // Make animations additive relative to the first frame of the base animation
                const addAnim2 = THREE.AnimationUtils.makeClipAdditive(anim2, 0, baseAnim);
                const addAnimHead = THREE.AnimationUtils.makeClipAdditive(animHead, 0, baseAnim);

                const action1 = mixer.clipAction(baseAnim);
                const action2 = mixer.clipAction(addAnim2);
                const actionHead = mixer.clipAction(addAnimHead);
            
                action1.play();
                action2.play();
                actionHead.play();
            }
           


            console.log(gltf.animations);


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