import THREE, { AnimationActionLoopStyles, LoopOnce } from "three";
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

    private _baseAction?: THREE.AnimationAction;

    constructor(clientEntity: ClientEntity)
    {
        super();
        
        this.clientEntity = clientEntity;
    }

    public playAnimation(name: string)
    {
        this.playAnimationLoop(name, LoopOnce, 1);
    }

    public playAnimationLoop(name: string, loop: AnimationActionLoopStyles, repetitions: number)
    {
        const baseClip = this.getAnimationClipByName(name);

        if(!baseClip) return;

        if(this._baseAction)
        {
            this.stopAnimation();
        }

        const clip = this.cloneClip(baseClip);

        console.log("play animation " + clip.name);

        const mixer = this.clientEntity.gltfModel!.mixer!;

        const baseAction = mixer.clipAction(clip);
        baseAction.setLoop(loop, repetitions)
        baseAction.play();

        this._baseAction = baseAction        
    }

    public stopAnimation()
    {
        if(this._baseAction)
        {
            this._baseAction.stop();
            this._baseAction = undefined;
        }
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

        if(Input.getKeyDown("B"))
        {
            this.animationManager.playAnimation("action1");
        }
    }

    private updateThreeGroup(delta: number)
    {
        if(!this.threeGroup) return;

        const body = this.entity.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();
        const rotation = transform.getRotation();

        this.threeGroup.position.set(position.x(), position.y(), position.z());
        this.threeGroup.setRotationFromQuaternion(ammoQuaternionToThree(rotation));
        
        //this.threeGroup.setRotationFromEuler(new THREE.Euler(20, 0, 0));
    }

    private drawForwardAxis(delta: number)
    {
        const body = this.entity.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();
        const rotation = transform.getRotation();

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

        const body = this.entity.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

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