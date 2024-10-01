import THREE from "three";
import { threeQuaternionToAmmo, threeVector3ToAmmo } from "../../utils/utils";
import { GLTFData } from "../../utils/gltf/gltfData";

export class Triangle {
    public v0: Ammo.btVector3;
    public v1: Ammo.btVector3;
    public v2: Ammo.btVector3;

    constructor(v0: Ammo.btVector3, v1: Ammo.btVector3, v2: Ammo.btVector3)
    {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    }

    public toJSON()
    {
        const json: number[][] = [];

        json.push(this.vector3ToArray(this.v0))
        json.push(this.vector3ToArray(this.v1))
        json.push(this.vector3ToArray(this.v2))

        return json;
    }

    public fromJSON(json: number[][])
    {
        this.arrayToVector3(json[0], this.v0);
        this.arrayToVector3(json[1], this.v1);
        this.arrayToVector3(json[2], this.v2);
    }

    public vector3ToArray(v: Ammo.btVector3)
    {
        return [v.x(), v.y(), v.z()];
    }

    public arrayToVector3(array: number[], v: Ammo.btVector3)
    {
        v.setValue(array[0], array[1], array[2]);
    }
}

export interface CollisionShape_JSON {
    name: string
    type: CollisionShapeType
    position: number[]
    scale: number[]
    size: number[]
    rotation: number[]
    color: number,
    triangles?: number[][][]
}

export enum CollisionShapeType {
    COLLISION_TYPE_BOX,
    COLLISION_TYPE_CAPSULE,
    COLLISION_TYPE_MESH,
    COLLISION_TYPE_CYLINDER,
    COLLISION_TYPE_SPHERE,
}

export class CollisionShape {
    public name: string = "";
    public type: CollisionShapeType = CollisionShapeType.COLLISION_TYPE_BOX;
    public position = new THREE.Vector3();
    public scale = new THREE.Vector3(1, 1, 1);
    public size = new THREE.Vector3(1, 1, 1);
    public rotation = new THREE.Quaternion();
    public color: number = 0xffffff;
    public triangles: Triangle[] = [];
    public radius = 1;
    public depth = 1;

    constructor(type: CollisionShapeType)
    {
        this.type = type;
    }

    public toJSON()
    {
        const json: CollisionShape_JSON = {
            name: this.name,
            type: this.type,
            position: [this.position.x, this.position.y, this.position.z],
            scale: [this.scale.x, this.scale.y, this.scale.z],
            size: [this.size.x, this.size.y, this.size.z],
            rotation: [this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.w],
            color: this.color,
            triangles: this.triangles.map(triangle => triangle.toJSON())
        }
        return json;
    }

    public fromJSON(json: CollisionShape_JSON)
    {
        this.name = json.name;
        this.type = json.type;
        this.position.set(json.position[0], json.position[1], json.position[2]);
        this.scale.set(json.scale[0], json.scale[1], json.scale[2]);
        this.size.set(json.size[0], json.size[1], json.size[2]);
        this.rotation.set(json.rotation[0], json.rotation[1], json.rotation[2], json.rotation[3]);
        this.color = json.color;

        this.triangles = [];
        if(json.triangles)
        {
            for(const jsonTriangle of json.triangles)
            {
                const v0 = new Ammo.btVector3();
                const v1 = new Ammo.btVector3();
                const v2 = new Ammo.btVector3();
                const triangle = new Triangle(v0, v1, v2);
                triangle.fromJSON(jsonTriangle);
                this.triangles.push(triangle);
            }
        }
    }
}

export interface MakeBodyOptions {
    mass?: number
    position?: THREE.Vector3;
}

export class EntityCollision {

    public body?: Ammo.btRigidBody;
    public compoundShape?: Ammo.btCompoundShape;
    public shapes: CollisionShape[] = [];
    public needToUpdateBody: boolean = false;

    public getShapeByName(name: string)
    {
        for(const shape of this.shapes)
        {
            if(shape.name == name)
            {
                return shape
            }
        }
        return undefined;
    }

    public addBox(position: THREE.Vector3, size: THREE.Vector3)
    {
        const shape = new CollisionShape(CollisionShapeType.COLLISION_TYPE_BOX);
        shape.position = position;
        shape.size = size;

        this.shapes.push(shape);

        return shape;
    }

    public addSphere(position: THREE.Vector3, size: number)
    {
        const shape = new CollisionShape(CollisionShapeType.COLLISION_TYPE_SPHERE);
        shape.position = position;
        shape.size = new THREE.Vector3(size, size, size);

        this.shapes.push(shape);

        return shape;
    }

    public addCylinder(position: THREE.Vector3, radius: number, depth: number)
    {
        const shape = new CollisionShape(CollisionShapeType.COLLISION_TYPE_CYLINDER);
        shape.position = position;
        shape.radius = radius;
        shape.depth = depth;

        this.shapes.push(shape);

        return shape;
    }

    public addCapsule(position: THREE.Vector3, radius: number, height: number)
    {
        const shape = new CollisionShape(CollisionShapeType.COLLISION_TYPE_CAPSULE);
        shape.position = position;
        shape.size = new THREE.Vector3(radius, height, 0);

        this.shapes.push(shape);

        return shape;
    }

    public makeBody(options: MakeBodyOptions)
    {
        console.log(`Making body`);

        const shapes = this.shapes;

        // Create an empty compound shape
        const compoundShape = new Ammo.btCompoundShape();
        this.compoundShape = compoundShape;
    
        for(const shape of shapes)
        {
            const size = shape.size;

            const shapeTransform = new Ammo.btTransform();
            shapeTransform.setIdentity();
            shapeTransform.setOrigin(new Ammo.btVector3(shape.position.x, shape.position.y, shape.position.z));
            shapeTransform.setRotation(threeQuaternionToAmmo(shape.rotation));

            if(shape.type == CollisionShapeType.COLLISION_TYPE_BOX)
            {
                console.log(`Add box`);

                const box = new Ammo.btBoxShape(new Ammo.btVector3(size.x/2, size.y/2, size.z/2));
                box.setLocalScaling(new Ammo.btVector3(shape.scale.x, shape.scale.y, shape.scale.z));

                compoundShape.addChildShape(shapeTransform, box);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_CAPSULE)
            {
                console.log(`Add capsule`);

                const box = new Ammo.btCapsuleShape(size.x, size.y);
                box.setLocalScaling(new Ammo.btVector3(shape.scale.x, shape.scale.y, shape.scale.z));

                compoundShape.addChildShape(shapeTransform, box);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_CYLINDER)
            {
                console.log(`Add COLLISION_TYPE_CYLINDER`);

                const box = new Ammo.btCylinderShape(new Ammo.btVector3(shape.radius, shape.depth, shape.radius));
                box.setLocalScaling(new Ammo.btVector3(shape.scale.x, shape.scale.y, shape.scale.z));

                compoundShape.addChildShape(shapeTransform, box);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_SPHERE)
            {
                console.log(`Add COLLISION_TYPE_SPHERE`);

                const box = new Ammo.btSphereShape(size.x);
                box.setLocalScaling(new Ammo.btVector3(shape.scale.x, shape.scale.y, shape.scale.z));

                compoundShape.addChildShape(shapeTransform, box);
            }

            if(shape.type == CollisionShapeType.COLLISION_TYPE_MESH)
            {
                console.log(`Add mesh`);

                const ammoTriangleMesh = new Ammo.btTriangleMesh();

                for(const triangle of shape.triangles)
                {
                    ammoTriangleMesh.addTriangle(triangle.v0, triangle.v1, triangle.v2, true);
                }

                ammoTriangleMesh.setScaling(new Ammo.btVector3(shape.scale.x, shape.scale.y, shape.scale.z));

                const collisionShape = new Ammo.btBvhTriangleMeshShape(ammoTriangleMesh, true);

                compoundShape.addChildShape(shapeTransform, collisionShape);
            }
        }
    
        let position = new Ammo.btVector3(0, 0, 0);
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
    }
    
    public createCollisionsFromGLTF(gltf: GLTFData, options: MakeBodyOptions)
    {
        for(const collision of gltf.collisions)
        {
            this.shapes.push(collision);
        }

        //console.log(this.shapes);

        //const box = gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 1, 10));
        //box.color = 0x00ff00;
        this.makeBody(options);
    }
}

export function convertMeshToTriangles(mesh: THREE.Mesh)
{
    // Get geometry data
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positions = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : [];

    const triangles: Triangle[] = [];

    // Create a new Ammo.js triangle mesh
    //const ammoTriangleMesh = new Ammo.btTriangleMesh();

    // Add triangles to the triangle mesh
    for (let i = 0; i < indices.length; i += 3)
    {
        const v0 = new Ammo.btVector3(positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]);
        const v1 = new Ammo.btVector3(positions[indices[i + 1] * 3], positions[indices[i + 1] * 3 + 1], positions[indices[i + 1] * 3 + 2]);
        const v2 = new Ammo.btVector3(positions[indices[i + 2] * 3], positions[indices[i + 2] * 3 + 1], positions[indices[i + 2] * 3 + 2]);
        
        const triangle = new Triangle(v0, v1, v2);

        triangles.push(triangle);

        //ammoTriangleMesh.addTriangle(v0, v1, v2, true);
    }

    // Create a collision shape from the triangle mesh
    //const collisionShape = new Ammo.btBvhTriangleMeshShape(ammoTriangleMesh, true);

    // Clean up temporary Ammo objects
    //Ammo.destroy(ammoTriangleMesh);

    return triangles;
}