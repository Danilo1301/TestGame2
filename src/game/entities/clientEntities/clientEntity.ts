import THREE, { AnimationActionLoopStyles, BufferGeometry, LoopOnce, LoopRepeat } from "three";
import { Entity } from "../entity";
import { BaseObject } from "../../../shared/baseObject";
import { WorldText } from "../../worldText";
import { ThreeScene } from "../../scenes/threeScene";
import { CollisionShapeType } from "../entityCollision";
import { ammoQuaternionToThree } from "../../../shared/utils";
import { gltfModels } from "../../../shared/constants/assets";
import { ThreeModel, ThreeModelManager } from "../../threeModelManager";
import { Quaternion_Forward } from "../../../shared/ammo/quaterion";
import { AnimationManager } from "./animationManager";

export class ClientEntity extends BaseObject {
    public entity: Entity;

    public worldText = new WorldText("ENTITY");
    
    public threeGroup?: THREE.Group;
    public gltfModel?: ThreeModel;
    public modelOffset = new Ammo.btVector3(0, 0, 0);

    public animationManager = new AnimationManager(this);

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

        if(this.gltfModel)
        {
            this.gltfModel.mixer?.update(delta / 1000);
        }
    }

    public postUpdate(delta: number)
    {
        
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

        this.threeGroup.position.set(
            position.x(),
            position.y(),
            position.z()
        );
        this.threeGroup.setRotationFromQuaternion(ammoQuaternionToThree(rotation));
        
        //this.threeGroup.setRotationFromEuler(new THREE.Euler(20, 0, 0));

        this.gltfModel?.object.position.set(
            this.modelOffset.x(),
            this.modelOffset.y(),
            this.modelOffset.z()
        );
    }

    private update3DText()
    {
        const position = this.entity.getPosition();

        this.worldText.setTitle(this.entity.displayName);
        this.worldText.set3DPosition(new THREE.Vector3(position.x(), position.y(), position.z()));
        this.worldText.update();
        //this.log("update 3d text");
    }

    public destroy()
    {
    }

    private drawForwardLine()
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
}