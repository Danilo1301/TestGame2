import { ExtendedObject3D } from "@enable3d/phaser-extension";
import { ThreeScene } from "../three/threeScene";
import { GameObject } from "./gameObject";
import { DebugText } from "../../utils/debug/debugText";
import { ammoQuaternionToThree, ammoVector3ToThree } from "../../utils/utils"
import THREE from "three";
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ThreeModelManager } from "../three/threeModelManager";
import { CollisionShapeType } from "./gameObjectCollision";
import { gltfModels } from "../constants/assets";
import { Ped } from "../entities/ped";

export class ClientGameObject {
    public gameObject: GameObject;

    public threeGroup?: THREE.Group;
    //public object3d?: ExtendedObject3D;
    public debugText: DebugText;

    constructor(gameObject: GameObject)
    {
        this.gameObject = gameObject;
        this.debugText = new DebugText("GameObject");
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

        if(this.gameObject.model) this.loadModel();
    }

    public createCollisionModels()
    {
        if(!this.threeGroup) return;

        const shapes = this.gameObject.collision.shapes;

        var i = 0;
        for(const shape of shapes)
        {
            if(shape.type == CollisionShapeType.COLLISION_TYPE_BOX)
            {
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(shape.size.x, shape.size.y, shape.size.z),
                    new THREE.MeshBasicMaterial({ color: shape.color })
                );                
                box.position.set(shape.position.x, shape.position.y, shape.position.z);
                box.rotation.setFromQuaternion(shape.rotation);
                box.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
        
                this.threeGroup.add(box);
            }
            i++;
        }
    }

    public async loadModel()
    {
        for(const m of gltfModels)
        {
            if(m.key != this.gameObject.model) continue;

            await ThreeModelManager.load(m.key, "/assets/" + m.path)
            const model = ThreeModelManager.getThreeModel(m.key, false);

            this.threeGroup?.add(model.object);
        }
    }

    public update()
    {
        if(this.gameObject.collision.needToUpdateBody)
        {
            this.gameObject.collision.needToUpdateBody = false;
            this.createCollisionModels();
        }

        if(!this.threeGroup) return;

        const body = this.gameObject.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();
        const rotation = transform.getRotation();

        this.threeGroup.position.set(position.x(), position.y(), position.z());
        this.threeGroup.setRotationFromQuaternion(ammoQuaternionToThree(rotation));
        //this.threeGroup.setRotationFromEuler(new THREE.Euler(20, 0, 0));

        const debugTextPosition = ammoVector3ToThree(position);

        if(this.gameObject instanceof Ped)
        {
            debugTextPosition.y += 2.3;
            this.debugText.setTitle("Player");
        }

        this.debugText.set3DPosition(debugTextPosition);
        this.debugText.update();
    }
}