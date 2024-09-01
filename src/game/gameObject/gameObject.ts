import { ExtendedObject3D } from "@enable3d/ammo-on-nodejs";
import { BaseObject } from "../../utils/baseObject";
import { Debug } from "../../utils/debug/debug";
import THREE from "three";
import { GameObjectCollision } from "./gameObjectCollision";
import { ammoVector3ToThree } from "../../utils/utils";

export class GameObject extends BaseObject
{
    public model?: string = undefined;
    public collision: GameObjectCollision = new GameObjectCollision();

    constructor()
    {
        super();
    }

    public getPosition()
    {
        const body = this.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

        return ammoVector3ToThree(position);
    }

    public getInfoText()
    {
        const position = this.getPosition();

        return `y: ${position.y}`;
    }
}