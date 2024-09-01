import { CollisionShape } from "../gameObject/gameObjectCollision"

interface GLTFCollision {
    shapes: CollisionShape[]
}

export class GLTFCollisions {
    public static collisions = new Map<string, GLTFCollision>();

    public static createCollision(id: string)
    {
        const collision: GLTFCollision = {
            shapes: []
        };

        this.collisions.set(id, collision);

        return collision;
    }
}