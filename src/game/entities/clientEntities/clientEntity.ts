import THREE, { AnimationActionLoopStyles, BufferGeometry, LoopOnce, LoopRepeat } from "three";
import { Entity } from "../entity";
import { BaseObject } from "../../../shared/baseObject";
import { WorldText } from "../../worldText";
import { HealthBar } from "../../healthBar";
import { THREELine, ThreeScene } from "../../scenes/threeScene";
import { CollisionShapeType } from "../entityCollision";
import { ammoQuaternionToThree } from "../../../shared/utils";
import { gltfModels } from "../../../shared/constants/assets";
import { ThreeModel, ThreeModelManager } from "../../threeModelManager";
import { Quaternion_Forward } from "../../../shared/ammo/quaterion";
import { AnimationManager } from "./animationManager";
import { Input } from "../../input";
import { gameSettings } from "../../../shared/constants/gameSettings";

export class ClientEntity extends BaseObject {
    public entity: Entity;

    public worldText = new WorldText("ENTITY");
    public healthBar = new HealthBar();
    
    public threeGroup?: THREE.Group;
    public gltfModel?: ThreeModel;
    public modelOffset = new Ammo.btVector3(0, 0, 0);

    public animationManager = new AnimationManager(this);

    private _forwardLine?: THREELine;

    constructor(entity: Entity)
    {
        super();
        this.entity = entity;
    }

    public create()
    {
        if(!this.threeGroup) {
            this.threeGroup = new THREE.Group();
            this.threeGroup.clear();
            ThreeScene.Instance.third.add.existing(this.threeGroup);
        }

        if(gameSettings.showCollisions)
            this.createCollisionModels();

        if(this.entity.modelName != undefined) this.createGLTFModel();
    }

    public createCollisionModels()
    {
        if(!this.threeGroup) return;

        //if(!this.entity.drawCollision) return;

        const shapes = this.entity.collision.shapes;

        this.log("create collision models for " + this.entity.id)

        for(var i = 0; i < shapes.length; i++)
        {
            const shape = shapes[i];

            const material = new THREE.MeshBasicMaterial({ color: shape.color, opacity: 0.3, transparent: true });

            let geometry: BufferGeometry | undefined;

            if(shape.type == CollisionShapeType.COLLISION_TYPE_BOX)
            {
                geometry = new THREE.BoxGeometry(shape.size.x, shape.size.y, shape.size.z)
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_CAPSULE)
            {
                geometry = new THREE.CapsuleGeometry(shape.size.x, shape.size.y);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_CYLINDER)
            {
                geometry = new THREE.CylinderGeometry(shape.radius, shape.radius, shape.depth);    
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_SPHERE)
            {
                geometry = new THREE.SphereGeometry(shape.size.x);
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
                
                geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

                const indices = new Uint16Array(indicesArr);
                geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            }

            if(!geometry)
            {
                throw "Geometry not found";
            }
        
            const mesh = new THREE.Mesh(
                geometry,
                material
            );            

            mesh.name = shape.name;
            mesh.position.set(shape.position.x, shape.position.y, shape.position.z);
            mesh.rotation.setFromQuaternion(shape.rotation);
            mesh.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
    
            this.threeGroup.add(mesh);
        }
    }

    public async createGLTFModel()
    {
        for(const m of gltfModels)
        {
            if(m.key != this.entity.modelName) continue;

            await ThreeModelManager.load(m.key, "/assets/" + m.path)
            const model = ThreeModelManager.getThreeModel(m.key, true);

            this.gltfModel = model;

            const object = model.object;

            this.threeGroup!.add(object);

            break;
        }
    }

    public preUpdate(delta: number)
    {
        this.update3DText();
    }

    public update(delta: number)
    {
        this.updateThreeGroup(delta);
        this.drawForwardLine();
        // //this.updateSpineBone();

        if(this.gltfModel)
        {
             this.gltfModel.mixer?.update(delta / 1000);
        }
    }

    private updateThreeGroup(delta: number)
    {
        if(!this.threeGroup) return;

        const position = this.entity.getPosition();
        const rotation = this.entity.getRotation();

        this.threeGroup.position.set(
            position.x(),
            position.y(),
            position.z()
        );
        this.threeGroup.setRotationFromQuaternion(ammoQuaternionToThree(rotation));

        this.gltfModel?.object.position.set(
            this.modelOffset.x(),
            this.modelOffset.y(),
            this.modelOffset.z()
        );
    }

    private updateSpineBone()
    {
        const object = this.gltfModel?.object;

        if(!object) return;

        const skeletonobj = object.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh | undefined;

        if(!skeletonobj) return;

        const skeleton = skeletonobj.skeleton;

        for(const bone of skeleton.bones)
        {
            const boneName = "bone_" + bone.name;

            if(bone.name.includes("spine"))
            {
                if(!(window as any)["_prevQuat"])
                {
                    const prevQuat = bone.quaternion.clone();
                    (window as any)["_prevQuat"] = prevQuat;
                }
        
                if(Input.getKey("H"))
                {
                    this.setBoneFacingDirection(bone, new THREE.Vector3(0, 1, 1))
                } else {
                    bone.quaternion.copy((window as any)["_prevQuat"]);
                }
            }
        }
    }

    public postUpdate(delta: number)
    {
        
    }

    private update3DText()
    {
        const position = this.entity.getPosition();

        this.worldText.visible = gameSettings.showDebugWorldTexts;

        this.worldText.setTitle(this.entity.displayName);
        this.worldText.set3DPosition(new THREE.Vector3(position.x(), position.y(), position.z()));
        this.worldText.update();

        this.healthBar.health = this.entity.health;
        this.healthBar.set3DPosition(new THREE.Vector3(position.x(), position.y() + 2, position.z()));
        this.healthBar.update();
        //this.log("update 3d text");
    }

    public destroy()
    {
        this.threeGroup?.clear();
    }

    private drawForwardLine()
    {
        const position = this.entity.getPosition();
        const rotation = this.entity.getRotation();

        const forward = Quaternion_Forward(rotation);

        const start = new THREE.Vector3(position.x(), position.y(), position.z());

        const end = start.clone();
        end.x += forward.x();
        end.y += forward.y();
        end.z += forward.z();

        if(!this._forwardLine)
        {
            this._forwardLine = ThreeScene.Instance.createLine(start, end, 0x0000ff);
        } else {
            this._forwardLine.setPosition(start, end);
        }

        Ammo.destroy(forward);
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

    public setBoneFacingDirection(bone: THREE.Bone, targetDirection: THREE.Vector3)
    {
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
}