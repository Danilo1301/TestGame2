import THREE, { AnimationActionLoopStyles, LoopOnce, LoopRepeat } from "three";
import { Entity } from "../entity";
import { ThreeScene } from "../../three/threeScene";
import { DebugText } from "../../../utils/debug/debugText";
import { ThreeModel, ThreeModelManager } from "../../three/threeModelManager";
import { CollisionShapeType } from "../entityCollision";
import { ammoQuaternionToThree, ammoVector3ToThree, threeQuaternionToAmmo } from "../../../utils/utils";
import { GameScene } from "../../scenes/gameScene";
import { getTurnDirectionSignal, rotateVectorAroundY, Vector3_DistanceTo } from "../../../utils/ammo/vector";
import { Quaternion_Forward, Quaternion_ToEuler } from "../../../utils/ammo/quaterion";
import { gltfModels } from "../../constants/assets";
import { BaseObject } from "../../../utils/baseObject";
import { Input } from "../../../utils/input/input";

export class AnimationManager extends BaseObject {

    public clientEntity: ClientEntity;

    public get isPlayingBaseAction() { return this._baseAction != undefined; };
    public get baseAction() { return this._baseAction; };
    public get baseAnimName() { return this._baseAnimName; };

    public get subAction() { return this._subAction; };
    public get subAnimName() { return this._subAnimName; };

    private _baseAnimName?: string;
    private _baseAction?: THREE.AnimationAction;
    private _baseAnimRepetitions: number = Infinity;

    private _subAnimName?: string;
    private _subAnimStopAtEnd: boolean = false;
    private _subAnimPaused: boolean = false;
    private _subAction?: THREE.AnimationAction;
    private _subActionRepetitions: number = Infinity;

    private _hasSetupEvents: boolean = false;

    constructor(clientEntity: ClientEntity)
    {
        super();
        
        this.clientEntity = clientEntity;
    }

    public playAnimation(name: string)
    {
        this.log(`play animation ${name}`);

        if(!this.clientEntity.loadedGLTFModel)
        {
            console.error("not loaded yet");
            return;
        }

        this._baseAnimName = name;
        this._baseAnimRepetitions = 1;
        this.playBaseAndSubAnimations();
    }

    public stopAnimation()
    {
        if(this._baseAction)
        {
            this._baseAction.stop();
            this._baseAction = undefined;
            this._baseAnimName = undefined;
        }
    }

    public playAnimationLoop(name: string)
    {
        this.log(`play sub animation ${name}`);

        if(!this.clientEntity.loadedGLTFModel)
        {
            console.error("not loaded yet");
            return;
        }

        this._baseAnimName = name;
        this._baseAnimRepetitions = Infinity;
        this.playBaseAndSubAnimations();
    }

    public playSubAnimation(name: string)
    {
        this.log(`play sub animation ${name}`);
        
        if(!this.clientEntity.loadedGLTFModel)
        {
            console.error("not loaded yet");
            return;
        }

        if(this._subAction) this.stopSubAnimation();

        this._subAnimName = name;
        this._subActionRepetitions = 1;
        this._subAnimStopAtEnd = false;
        this.playBaseAndSubAnimations();
    }

    public stopSubAnimation()
    {
        if(this._subAction)
        {
            this._subAction.stop();
            this._subAction = undefined;
            this._subAction = undefined;
            this._subAnimPaused = false;
        }
    }

    public playSubAnimationAndStop(name: string)
    {
        this.log(`play sub animation ${name} and stop`);

        if(this._subAction) this.stopSubAnimation();
        this._subAnimName = name;
        this._subActionRepetitions = 1;
        this._subAnimStopAtEnd = true;
        this.playBaseAndSubAnimations();
    }
    

    private playBaseAndSubAnimations()
    {
        const modelBaseClip = this._baseAnimName != undefined ? this.getAnimationClipByName(this._baseAnimName) : undefined;
        const modelSubClip = this._subAnimName != undefined ? this.getAnimationClipByName(this._subAnimName) : undefined;

        const baseClip = modelBaseClip ? this.cloneClip(modelBaseClip) : undefined;
        const subClip = modelSubClip ? this.cloneClip(modelSubClip) : undefined;

        let baseActionTime = 0;
        if(this._baseAction)
        {
            baseActionTime = this._baseAction.time;
            this._baseAction.stop();
        }
        
        let subActionTime = 0;
        if(this._subAction)
        {
            subActionTime = this._subAction.time;
            this._subAction.stop();
        }

        if(baseClip && subClip)
        {
            const toDelete: THREE.KeyframeTrack[] = [];

            baseClip.tracks.forEach(track => {
                if(track.name.includes("upper_arm_R") || track.name.includes("lower_arm_R")) toDelete.push(track);
                if(track.name.includes("upper_arm_L") || track.name.includes("lower_arm_L")) toDelete.push(track);
            });

            console.log(baseClip.tracks.length + " tracks");
            toDelete.forEach(track => {
                baseClip.tracks.splice(baseClip.tracks.indexOf(track), 1);
            });
            console.log(baseClip.tracks.length + " tracks");
            
            THREE.AnimationUtils.makeClipAdditive(baseClip, 0, subClip);
            
            const baseAction = this.makeClip(baseClip, this._baseAnimRepetitions);
            baseAction.time = baseActionTime;

            const subAction = this.makeClip(subClip, this._subActionRepetitions);
            subAction.time = subActionTime;

            this._baseAction = baseAction;
            this._subAction = subAction;

            if(this._subAnimPaused)
            {
                subAction.paused = true;
                subAction.time = subClip.duration;
            }

            baseAction.play();
            subAction.play();

        } else {

            if(baseClip) {
                const action = this.makeClip(baseClip, this._baseAnimRepetitions);
                action.time = baseActionTime;
                this._baseAction = action;

                action.play();
            }

            if(subClip) {
                const action = this.makeClip(subClip, this._subActionRepetitions);
                action.time = subActionTime;
                this._subAction = action;

                if(this._subAnimPaused)
                {
                    action.paused = true;
                    action.time = subClip.duration;
                }

                action.play();
            }
        }
    }

    private makeClip(clip: THREE.AnimationClip, repetitions: number)
    {
        const mixer = this.clientEntity.gltfModel!.mixer!;

        const loop = repetitions != Infinity ? LoopOnce : LoopRepeat;

        console.log("repetitions", repetitions);
        console.log("loop", loop);

        const action = mixer.clipAction(clip);
        action.setLoop(repetitions != Infinity ? LoopOnce : LoopRepeat, repetitions)

        if(!this._hasSetupEvents)
        {
            this._hasSetupEvents = true;
            
            const self = this;
            mixer.addEventListener('finished', function (event) {
                const eventAction = event.action;
                
                console.log('Animação terminou', eventAction);
    
                if(eventAction == self._subAction)
                {
                    if(self._subAnimStopAtEnd)
                    {
                        self._subAnimPaused = true;
                        self.playBaseAndSubAnimations();
                        return;
                    }

                    self._subAction = undefined;
                    self._subAnimName = undefined;

                    self.playBaseAndSubAnimations();
                }
            });
        }
        
        

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
        
        for(const animation of gltfModel.gltf.animations)
        {
            //console.log(animation.name)
            if(animation.name == name) return animation;
        }
        
        //console.error("no animation found with name " + name);

        return undefined;
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
}

export class ClientEntity extends BaseObject {
    public entity: Entity;

    public get loadedGLTFModel() { return this.gltfModel != undefined; }

    public threeGroup?: THREE.Group;
    public threeObjects: THREE.Object3D[] = [];

    public gltfModel?: ThreeModel;
    //public object3d?: ExtendedObject3D;
    public debugText: DebugText;

    public animationManager = new AnimationManager(this);
    
    constructor(entity: Entity)
    {
        super();

        this.entity = entity;
        this.debugText = new DebugText(entity.displayName);
    }

    public create()
    {
        const threeScene = ThreeScene.Instance;

        if(!this.threeGroup) {
            this.threeGroup = new THREE.Group();

            threeScene.third.add.existing(this.threeGroup);
        }
        this.threeGroup.clear();

        this.createCollisionModels();
        
        this.debugText.createDebugText();

        if(this.entity.model) this.loadModel();
    }

    public preUpdate(delta: number)
    {
        this.update3DText();
    }

    public update(delta: number)
    {
        if(this.entity.collision.needToUpdateBody)
        {
            this.entity.collision.needToUpdateBody = false;
            this.createCollisionModels();
        }

        this.updateThreeGroup(delta);

        if(this.gltfModel?.mixer)
            this.gltfModel.mixer.update(delta / 1000);
        
        this.drawForwardAxis(delta);
    
        this.updateSkeletonCollision(delta);
    }

    private updateThreeGroup(delta: number)
    {
        if(!this.threeGroup) return;

        const position = this.entity.getPosition();

        //const body = this.entity.collision.body!;
        //const transform = body.getWorldTransform();
        //const position = transform.getOrigin();
        //const rotation = transform.getRotation();

        const rotation = this.entity.getRotation();

        this.threeGroup.position.set(position.x(), position.y(), position.z());
        this.threeGroup.setRotationFromQuaternion(ammoQuaternionToThree(rotation));
        
        //this.threeGroup.setRotationFromEuler(new THREE.Euler(20, 0, 0));
    }

    private drawForwardAxis(delta: number)
    {
        const position = this.entity.getPosition();
        const rotation = this.entity.getRotation();

        //const cameraPosition = GameScene.Instance.camera.position;
        //const distanceFromGameObject = Vector3_DistanceTo(position, cameraPosition);

        const forward = Quaternion_Forward(rotation);

        const start = new THREE.Vector3(position.x(), position.y(), position.z());

        const end = start.clone();
        end.x += forward.x();
        end.y += forward.y();
        end.z += forward.z();

        ThreeScene.Instance.drawLine(start, end, 0x0000ff);

        Ammo.destroy(forward);

    }

    public postUpdate(delta: number)
    {
        
    }

    public getBone(name: string)
    {
        const object = this.gltfModel?.object;

        if(!object) return undefined;

        const skeletonobj = object.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh | undefined;

        if(!skeletonobj) return;

        const skeleton = skeletonobj.skeleton;

        for(const bone of skeleton.bones)
        {
            if(bone.name == name) return bone;
        }

        return undefined;
    }

    private updateSkeletonCollision(delta: number)
    {
        const object = this.gltfModel?.object;

        if(!object) return;

        const objectWorldPosition = new THREE.Vector3();
        object.getWorldPosition(objectWorldPosition);

        const objectWorldQuaternion = new THREE.Quaternion();
        object.getWorldQuaternion(objectWorldQuaternion);

        const skeletonobj = object.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh | undefined;

        if(!skeletonobj) return;

        const skeleton = skeletonobj.skeleton;

        for(const bone of skeleton.bones)
        {
            const boneName = "bone_" + bone.name;

            if(bone.name.includes("spine"))
            {
                this.updateSpineBone(bone);
            }

            const collisionShape = this.entity.collision.getShapeByName("bone_" + bone.name);
            
            if(!collisionShape) continue;

            const shapeThree = this.getThreeObjectByName(boneName)!;
                        
            const boneWorldPosition = new THREE.Vector3();
            bone.getWorldPosition(boneWorldPosition);
            const boneWorldQuaternion = new THREE.Quaternion();
            bone.getWorldQuaternion(boneWorldQuaternion);
            const boneWorldQuaternion_a = threeQuaternionToAmmo(boneWorldQuaternion);

            //const boneLocalPosition = bone.position;
            const boneLocalPositionFromObject = boneWorldPosition.clone();
            boneLocalPositionFromObject.sub(objectWorldPosition);
            //const boneLocalPositionFromObject_a = threeVector3ToAmmo(boneLocalPositionFromObject);

            //rotate in y axis
            
            const v1 = new THREE.Vector3(0, 0, 1);

            const objectWorldQuaternion_a = threeQuaternionToAmmo(objectWorldQuaternion);

            const v2_a = Quaternion_Forward(objectWorldQuaternion_a);
            const v2 = ammoVector3ToThree(v2_a);
            const angle = v1.angleTo(v2);
            const signal = getTurnDirectionSignal(v1, v2);

            const newPos = rotateVectorAroundY(boneLocalPositionFromObject, angle * signal);

            shapeThree.position.set(newPos.x, newPos.y, newPos.z);

            //update euler?

            let euler = Quaternion_ToEuler(boneWorldQuaternion_a);

            let newQ = new Ammo.btQuaternion(0, 0, 0, 1);
            newQ.setEulerZYX(euler.z(), euler.y() + (angle * signal), euler.x());

            shapeThree.quaternion.set(newQ.x(), newQ.y(), newQ.z(), newQ.w());

            //draw

            ThreeScene.Instance.drawLine(new THREE.Vector3(0, 0, 0), boneWorldPosition, 0xFFFFFF);
            ThreeScene.Instance.drawLine(new THREE.Vector3(0, 0, 0), objectWorldPosition, 0xFF0000);

            // update collisions

            const collisionShapeIndex = this.entity.collision.shapes.indexOf(collisionShape);
            const compoundShape = this.entity.collision.compoundShape!;

            // Get the child shape (we can't get the transform directly)
            const childShape = compoundShape.getChildShape(collisionShapeIndex);

            // Create a new transform with the updated position
            const origin = new Ammo.btVector3(newPos.x, newPos.y, newPos.z);
            const rotation = new Ammo.btQuaternion(newQ.x(), newQ.y(), newQ.z(), newQ.w());
            const newTransform = new Ammo.btTransform();
            newTransform.setIdentity();
            newTransform.setOrigin(origin); // New position
            newTransform.setRotation(rotation);

            // Remove the child shape (there is no direct remove function, so we recreate the compound shape)
            compoundShape.removeChildShapeByIndex(collisionShapeIndex); 

            // Re-add the child shape with the new transform
            compoundShape.addChildShape(newTransform, childShape);
            
            //clear

            Ammo.destroy(boneWorldQuaternion_a);
            Ammo.destroy(objectWorldQuaternion_a);
            Ammo.destroy(v2_a);
            Ammo.destroy(euler);
            Ammo.destroy(newQ);
            Ammo.destroy(origin);
            Ammo.destroy(rotation);
        }
    }

    private updateSpineBone(bone: THREE.Bone)
    {
        if(!(window as any)["_prevQuat"])
        {
            const prevQuat = bone.quaternion.clone();
            (window as any)["_prevQuat"] = prevQuat;
        }

        if(Input.getKey("G"))
        {
            this.setBoneFacingDirection(bone, new THREE.Vector3(0, 1, 1))
        } else {
            bone.quaternion.copy((window as any)["_prevQuat"]);
        }
    }

    private setBoneFacingDirection(bone: THREE.Bone, targetDirection: THREE.Vector3) {
        // Create a quaternion that represents the desired direction
        const targetQuaternion = new THREE.Quaternion();
        // You can use lookAt or setFromUnitVectors to create a quaternion
        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetDirection.clone().normalize());
    
        // Get the bone's world quaternion
        const boneWorldQuaternion = new THREE.Quaternion();
        bone.getWorldQuaternion(boneWorldQuaternion);
    
        // Get the parent's world quaternion (if any)
        const parentWorldQuaternion = new THREE.Quaternion();
        if (bone.parent) {
            bone.parent.getWorldQuaternion(parentWorldQuaternion);
        } else {
            parentWorldQuaternion.set(0, 0, 0, 1); // No parent, default identity quaternion
        }
    
        // Inverse the parent's world quaternion
        const parentInverseQuaternion = parentWorldQuaternion.conjugate();
    
        // Convert the target quaternion to the bone's local space
        const localTargetQuaternion = parentInverseQuaternion.multiply(targetQuaternion);
    
        // Set the bone's local quaternion to face the target direction
        bone.quaternion.copy(localTargetQuaternion);
    }

    private update3DText()
    {
        //this.log("update 3d text");

        const position = this.entity.getPosition();

        const cameraPosition = GameScene.Instance.camera.position;
        const distanceFromGameObject = Vector3_DistanceTo(position, cameraPosition);

        const debugTextPosition = ammoVector3ToThree(position);

        this.debugText.set3DPosition(debugTextPosition);
        this.debugText.update();
        this.debugText.visible = distanceFromGameObject < 100.0;
    }

    public destroy()
    {
    }

    public getThreeObjectByName(name: string)
    {
        for(const object of this.threeObjects)
        {
            if(object.name == name) return object;
        }

        return undefined;
    }

    public createCollisionModels()
    {
        if(!this.threeGroup) return;

        if(!this.entity.drawCollision) return;

        const shapes = this.entity.collision.shapes;

        console.log("create for " + this.entity.id)

        var i = 0;
        for(const shape of shapes)
        {
            

            if(shape.type == CollisionShapeType.COLLISION_TYPE_BOX)
            {
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(shape.size.x, shape.size.y, shape.size.z),
                    new THREE.MeshBasicMaterial({ color: shape.color, opacity: 0.5, transparent: true })
                );                
                box.position.set(shape.position.x, shape.position.y, shape.position.z);
                box.rotation.setFromQuaternion(shape.rotation);
                box.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
        
                this.threeGroup.add(box);
                this.threeObjects.push(box);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_CAPSULE)
            {
                const box = new THREE.Mesh(
                    new THREE.CapsuleGeometry(shape.size.x, shape.size.y),
                    new THREE.MeshBasicMaterial({ color: shape.color, opacity: 0.5, transparent: true })
                );                
                box.position.set(shape.position.x, shape.position.y, shape.position.z);
                box.rotation.setFromQuaternion(shape.rotation);
                box.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
        
                this.threeGroup.add(box);
                this.threeObjects.push(box);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_CYLINDER)
            {
                const box = new THREE.Mesh(
                    new THREE.CylinderGeometry(shape.radius, shape.radius, shape.depth),
                    new THREE.MeshBasicMaterial({ color: shape.color, opacity: 0.5, transparent: true })
                );                
                box.position.set(shape.position.x, shape.position.y, shape.position.z);
                box.rotation.setFromQuaternion(shape.rotation);
                box.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
        
                this.threeGroup.add(box);
                this.threeObjects.push(box);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_SPHERE)
            {
                const box = new THREE.Mesh(
                    new THREE.SphereGeometry(shape.size.x),
                    new THREE.MeshBasicMaterial({ color: shape.color, opacity: 0.5, transparent: true })
                );                
                box.position.set(shape.position.x, shape.position.y, shape.position.z);
                box.rotation.setFromQuaternion(shape.rotation);
                box.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
        
                this.threeGroup.add(box);
                this.threeObjects.push(box);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_MESH)
            {
                const verticesArr: number[] = [];
                const indicesArr: number[] = [];

                var i = 0;
                for(const triangle of shape.triangles)
                {
                    verticesArr.push(triangle.v0.x())
                    verticesArr.push(triangle.v0.y())
                    verticesArr.push(triangle.v0.z())

                    indicesArr.push(i++)
                    indicesArr.push(i++)
                    indicesArr.push(i++)

                    verticesArr.push(triangle.v1.x())
                    verticesArr.push(triangle.v1.y())
                    verticesArr.push(triangle.v1.z())

                    indicesArr.push(i++)
                    indicesArr.push(i++)
                    indicesArr.push(i++)

                    verticesArr.push(triangle.v2.x())
                    verticesArr.push(triangle.v2.y())
                    verticesArr.push(triangle.v2.z())

                    indicesArr.push(i++)
                    indicesArr.push(i++)
                    indicesArr.push(i++)
                }

                const vertices = new Float32Array(verticesArr);
                
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

                const indices = new Uint16Array(indicesArr);
                geometry.setIndex(new THREE.BufferAttribute(indices, 1));

                // Create a material (you can choose different materials depending on your use case)
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });

                // Create the mesh from the geometry and material
                const mesh = new THREE.Mesh(geometry, material);
                mesh.name = shape.name;

                mesh.position.set(shape.position.x, shape.position.y, shape.position.z);
                mesh.rotation.setFromQuaternion(shape.rotation);
                mesh.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);

                this.threeGroup.add(mesh);
                this.threeObjects.push(mesh);
            }
            i++;
        }
    }

    public async loadModel()
    {
        for(const m of gltfModels)
        {
            if(m.key != this.entity.model) continue;

            await ThreeModelManager.load(m.key, "/assets/" + m.path)
            const model = ThreeModelManager.getThreeModel(m.key, true);

            this.gltfModel = model;

            const object = model.object;

            this.threeGroup!.add(object);

            break;
        }
    }
}