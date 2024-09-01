import THREE from "three";
import { threeQuaternionToAmmo, threeVector3ToAmmo } from "../../utils/utils";
import { GLTFData } from "../game/gltfCollection";

export interface CollisionShape_JSON {
    type: CollisionShapeType
    position: number[]
    scale: number[]
    size: number[]
    rotation: number[]
    color: number
}

export enum CollisionShapeType {
    COLLISION_TYPE_BOX
}

export class CollisionShape {
    public type: CollisionShapeType = CollisionShapeType.COLLISION_TYPE_BOX;
    public position = new THREE.Vector3();
    public scale = new THREE.Vector3(1, 1, 1);
    public size = new THREE.Vector3(1, 1, 1);
    public rotation = new THREE.Quaternion();
    public color: number = 0xffffff;

    constructor(type: CollisionShapeType)
    {
        this.type = type;
    }

    public toJSON()
    {
        const json: CollisionShape_JSON = {
            type: this.type,
            position: [this.position.x, this.position.y, this.position.z],
            scale: [this.scale.x, this.scale.y, this.scale.z],
            size: [this.size.x, this.size.y, this.size.z],
            rotation: [this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.w],
            color: this.color
        }
        return json;
    }

    public fromJSON(json: CollisionShape_JSON)
    {
        this.type = json.type;
        this.position.set(json.position[0], json.position[1], json.position[2]);
        this.scale.set(json.scale[0], json.scale[1], json.scale[2]);
        this.size.set(json.size[0], json.size[1], json.size[2]);
        this.rotation.set(json.rotation[0], json.rotation[1], json.rotation[2], json.rotation[3]);
        this.color = json.color;
    }
}

export interface MakeBodyOptions {
    mass?: number
    position?: THREE.Vector3;
}

export class GameObjectCollision {

    public body?: Ammo.btRigidBody;
    public shapes: CollisionShape[] = [];
    public needToUpdateBody: boolean = false;

    public addBox(position: THREE.Vector3, size: THREE.Vector3)
    {
        const shape = new CollisionShape(CollisionShapeType.COLLISION_TYPE_BOX);
        shape.position = position;
        shape.size = size;

        this.shapes.push(shape);

        return shape;
    }

    public makeBody(options: MakeBodyOptions)
    {
        console.log(`Making body`);

        const shapes = this.shapes;

        // Create an empty compound shape
        const compoundShape = new Ammo.btCompoundShape();
    
        for(const shape of shapes)
        {
            const shapeTransform = new Ammo.btTransform();
            shapeTransform.setIdentity();
            shapeTransform.setOrigin(new Ammo.btVector3(shape.position.x, shape.position.y, shape.position.z));
            shapeTransform.setRotation(threeQuaternionToAmmo(shape.rotation));

            if(shape.type == CollisionShapeType.COLLISION_TYPE_BOX)
            {
                const size = shape.size;
                const scale = shape.scale;

                const box = new Ammo.btBoxShape(new Ammo.btVector3(size.x/2, size.y/2, size.z/2));

                box.setLocalScaling(new Ammo.btVector3(shape.scale.x, shape.scale.y, shape.scale.z));

                compoundShape.addChildShape(shapeTransform, box);

                console.log(`Add box`);
            }
        }
    
        let position = new Ammo.btVector3();
        if(options.position != undefined) position = threeVector3ToAmmo(options.position);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(position);

        // Create a motion state with the desired initial position and orientation
        const motionState = new Ammo.btDefaultMotionState(transform);
        
        const mass = options.mass != undefined ? options.mass : 1.0;

        // Calculate the inertia for the compound shape
        const localInertia = new Ammo.btVector3(0, 0, 0);
        compoundShape.calculateLocalInertia(mass, localInertia);
    
        // Create the rigid body using the compound shape
        const bodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, compoundShape, localInertia);
        const body = new Ammo.btRigidBody(bodyInfo);

        this.body = body;

        this.needToUpdateBody = true;
    }

    public createCollisionsFromGLTF(gltf: GLTFData, options: MakeBodyOptions)
    {
        for(const collision of gltf.collisions)
        {
            this.shapes.push(collision);
        }

        console.log(this.shapes);

        //const box = gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 1, 10));
        //box.color = 0x00ff00;
        this.makeBody(options);
    }
}