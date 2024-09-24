import THREE from "three";
import { Entity } from "../entity";
import { ThreeScene } from "../../three/threeScene";
import { DebugText } from "../../../utils/debug/debugText";
import { ThreeModel, ThreeModelManager } from "../../three/threeModelManager";
import { CollisionShapeType } from "../entityCollision";
import { ammoQuaternionToThree, ammoVector3ToThree } from "../../../utils/utils";
import { GameScene } from "../../scenes/gameScene";
import { Vector3_DistanceTo } from "../../../utils/ammo/vector";
import { Quaternion_Forward } from "../../../utils/ammo/quaterion";
import { gltfModels } from "../../constants/assets";

export class ClientEntity {
    public entity: Entity;

    public threeGroup?: THREE.Group;
    public threeObjects: THREE.Object3D[] = [];

    public gltfModel?: ThreeModel;
    //public object3d?: ExtendedObject3D;
    public debugText: DebugText;
    

    constructor(entity: Entity)
    {
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

    public update(delta: number)
    {
        if(this.entity.collision.needToUpdateBody)
        {
            this.entity.collision.needToUpdateBody = false;
            this.createCollisionModels();
        }

        if(!this.threeGroup) return;

        const body = this.entity.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();
        const rotation = transform.getRotation();

        this.threeGroup.position.set(position.x(), position.y(), position.z());
        this.threeGroup.setRotationFromQuaternion(ammoQuaternionToThree(rotation));
        
        //this.threeGroup.setRotationFromEuler(new THREE.Euler(20, 0, 0));

        const debugTextPosition = ammoVector3ToThree(position);

        this.gltfModel?.mixer?.update(delta / 1000);

        //console.log(this.gameObject.displayName, debugTextPosition);

        const cameraPosition = GameScene.Instance.camera.position;
        const distanceFromGameObject = Vector3_DistanceTo(position, cameraPosition);

        this.debugText.set3DPosition(debugTextPosition);
        this.debugText.update();
        this.debugText.visible = distanceFromGameObject < 100.0;

        //

        const forward = Quaternion_Forward(rotation);

        const start = new THREE.Vector3(position.x(), position.y(), position.z());

        const end = start.clone();
        end.x += forward.x();
        end.y += forward.y();
        end.z += forward.z();

        ThreeScene.Instance.drawLine(start, end, 0x0000ff);

        Ammo.destroy(forward);
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