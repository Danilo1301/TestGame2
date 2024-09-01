import { CollisionShape, CollisionShape_JSON, CollisionShapeType } from "../gameObject/gameObjectCollision";
import { IPacketData_Models } from "../network/packet";

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
            const name: string = child.name;

            console.log("------ child -----");
            console.log("name", name);

            if(name.includes("Collision"))
            {
                for(const c of child.children)
                {
                    console.log("c", c.name);

                    const box = new CollisionShape(CollisionShapeType.COLLISION_TYPE_BOX);
                    box.color = 0xff0000;
                    box.position.set(c.position.x, c.position.y, c.position.z);
                    box.rotation.set(c.quaternion.x, c.quaternion.y, c.quaternion.z, c.quaternion.w);
                    box.scale.set(c.scale.x, c.scale.y, c.scale.z);
                    box.size.set(2, 2, 2);

                    this.collisions.push(box);

                    console.log(JSON.stringify(box));
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

export class GLTFCollection {
    public gltfs = new Map<string, GLTFData>();

    public fromPacketData(data: IPacketData_Models)
    {
        console.log(data);

        for(const model of data.models)
        {
            const gltfData = new GLTFData();
            gltfData.fromJSON(model);

            this.gltfs.set(gltfData.id, gltfData);
        }
    }

}