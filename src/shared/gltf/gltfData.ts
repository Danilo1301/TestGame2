import { CollisionShape, CollisionShape_JSON, CollisionShapeType, convertMeshToTriangles } from "../../game/entities/entityCollision";

export interface GLTFData_JSON {
    id: string
    collisions: CollisionShape_JSON[];
}

export class GLTFData {
    public id: string = "";
    public gltf: any
    public collisions: CollisionShape[] = [];

    public resolveCollisions()
    {
        this.collisions = [];

        const gltf = this.gltf;
        const children = gltf.scene.children;

        for(const child of children)
        {
            const childName: string = child.name;

            console.log("------ child -----");
            console.log("childName", childName);

            if(childName.includes("Collision") || childName.includes("collision"))
            {
                for(const c of child.children)
                {
                    const collisionName: string = c.name;

                    console.log("collisionName=", collisionName);

                    const shape = new CollisionShape(CollisionShapeType.COLLISION_TYPE_BOX);
                    shape.name = collisionName;
                    shape.color = 0x0000ff;
                    shape.position.set(c.position.x, c.position.y, c.position.z);
                    shape.rotation.set(c.quaternion.x, c.quaternion.y, c.quaternion.z, c.quaternion.w);
                    shape.scale.set(c.scale.x, c.scale.y, c.scale.z);

                    if(collisionName.startsWith("mesh") || collisionName.startsWith("bone_"))
                    {
                        shape.type = CollisionShapeType.COLLISION_TYPE_MESH;

                        const threeMesh = c as THREE.Mesh;
                        shape.triangles = convertMeshToTriangles(threeMesh);
                    } else {
                        shape.type = CollisionShapeType.COLLISION_TYPE_BOX;
                      
                        shape.size.set(2, 2, 2);
                    }

                    this.collisions.push(shape);
                }
            }

            //console.log("child", child);
        }
    }

    public toJSON()
    {
        const json: GLTFData_JSON = {
            id: this.id,
            collisions: this.collisions.map(collision => collision.toJSON())
        }

        return json;
    }

    public fromJSON(json: GLTFData_JSON)
    {
        this.id = json.id;

        for(const collision of json.collisions)
        {
            const collisionShape = new CollisionShape(collision.type);
            collisionShape.fromJSON(collision);
            this.collisions.push(collisionShape);
        }
    }
}