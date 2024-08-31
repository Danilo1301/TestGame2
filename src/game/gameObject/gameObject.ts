import { ExtendedObject3D } from "@enable3d/ammo-on-nodejs";
import { BaseObject } from "../../utils/baseObject";
import { Debug } from "../../utils/debug/debug";
import THREE from "three";

export class GameObject extends BaseObject
{
    //public object3d: ExtendedObject3D;
    public body: Ammo.btRigidBody;
    public compoundShape: Ammo.btCompoundShape;

    constructor(body: Ammo.btRigidBody, compoundShape: Ammo.btCompoundShape)
    {
        super();

        this.body = body;
        this.compoundShape = compoundShape;
    }

    public printInfo()
    {
        const body = this.body;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

        const rotation = transform.getRotation();

        Debug.log(``, `y=${position.y()}, rot=${rotation.x()} ${rotation.y()} ${rotation.z()}`)
    }

    public getPosition()
    {
        const body = this.body;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

        return new THREE.Vector3(position.x(), position.y(), position.z());
    }
}