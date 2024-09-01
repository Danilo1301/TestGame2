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
            const clip = gltf.animations[0]
            const anim = mixer.clipAction(clip)

            result.mixer = mixer
            result.clip = clip

            anim.reset()
            anim.play()
        }

        return result;
    }

}