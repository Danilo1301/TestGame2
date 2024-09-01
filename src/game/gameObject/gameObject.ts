import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from "../../utils/baseObject";
import THREE from "three";
import { GameObjectCollision } from "./gameObjectCollision";
import { ammoVector3ToThree } from "../../utils/utils";

export enum GameObjectType {
    PED
}

export interface GameObject_JSON {
    id: string
    type: GameObjectType
    position: number[]
}

export class GameObject extends BaseObject
{
    public id: string = uuidv4();
    public displayName: string = "GameObject";
    
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

    public setPosition(x: number, y: number, z: number)
    {
        const body = this.collision.body!;

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y, z));

        body.getWorldTransform().setOrigin(transform.getOrigin());
        body.getMotionState().setWorldTransform(transform);
    }

    public getInfoText()
    {
        const position = this.getPosition();

        return `y: ${position.y}`;
    }

    public update(delta: number)
    {

    }

    public toJSON()
    {
        const position = this.getPosition();

        const json: GameObject_JSON = {
            id: this.id,
            type: GameObjectType.PED,
            position: [position.x, position.y, position.z]
        }
        
        return json;
    }
}