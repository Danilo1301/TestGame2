import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from "../../utils/baseObject";
import THREE from "three";
import { GameObjectCollision } from "./gameObjectCollision";
import { ammoQuaternionToThree, ammoVector3ToThree } from "../../utils/utils";
import { GameObjectSync } from './gameObjectSync';
import { Vector3_Forward } from '../../utils/ammo/vector';
import { Quaternion_Multiply_Vector3 } from '../../utils/ammo/quaterion';
import { Game } from '../game/game';

export enum GameObjectType {
    PED
}

export interface GameObject_JSON {
    id: string
    type: GameObjectType
    position: number[]
    velocity: number[]
    input: number[]
}

export class GameObject extends BaseObject
{
    public id: string = uuidv4();
    public displayName: string = "GameObject";

    public get body() { return this.collision.body!; }
    
    public model?: string = undefined;
    public collision: GameObjectCollision = new GameObjectCollision();
    public sync: GameObjectSync = new  GameObjectSync();

    public inputX: number = 0;
    public inputY: number = 0;
    public inputZ: number = 0;
    public angle: number = 0;

    public destroyed: boolean = false;
    public drawCollision: boolean = true;

    public game!: Game;

    public get forward() {
        return Quaternion_Multiply_Vector3(this.getRotation(), Vector3_Forward());
    };

    public get right() {
        return Quaternion_Multiply_Vector3(this.getRotation(), new Ammo.btVector3(1, 0, 0));
    };

    constructor()
    {
        super();
        this.sync.gameObject = this;
    }

    public init()
    {
        
    }

    public getPosition()
    {
        const body = this.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

        return ammoVector3ToThree(position);
    }

    public getRotation()
    {
        const body = this.collision.body!;
        const transform = body.getWorldTransform();
        const rotation = transform.getRotation();

        return rotation;
    }

    public getVelocity()
    {
        const body = this.collision.body!;
        return ammoVector3ToThree(body.getLinearVelocity());
    }

    public setVelocity(x: number, y: number, z: number)
    {
        const body = this.collision.body!;
        body.setLinearVelocity(new Ammo.btVector3(x, y, z));
    }

    public setPosition(x: number, y: number, z: number)
    {
        const body = this.collision.body!;

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y, z));

        body.getWorldTransform().setOrigin(transform.getOrigin());
        //body.getMotionState().setWorldTransform(transform); //DOESNT WORK WTF
    }

    public setRotation(x: number, y: number, z: number, w: number)
    {
        const body = this.collision.body!;

        const quat = new Ammo.btQuaternion(x, y, z, w)

        //const transform = new Ammo.btTransform();
        //transform.setIdentity();
        //transform.setOrigin(new Ammo.btVector3(0, 0, 10));

        //body.getWorldTransform().setOrigin(transform.getOrigin());
        body.getWorldTransform().setRotation(quat);
        //body.getMotionState().setWorldTransform(transform); //DOESNT WORK WTF
    }

    public getInfoText()
    {
        const position = this.getPosition();

        return `y: ${position.y}`;
    }

    public update(delta: number)
    {
        this.sync.update(delta);
    }

    public activateBody()
    {
        if(!this.collision.body!.isActive())
        {
            this.collision.body!.activate();
        }
    }

    public toJSON()
    {
        const position = this.getPosition();
        const velocity = this.getVelocity();

        const json: GameObject_JSON = {
            id: this.id,
            type: GameObjectType.PED,
            position: [position.x, position.y, position.z],
            velocity: [velocity.x, velocity.y, velocity.z],
            input: [this.inputX, this.inputY, this.inputZ]
        }
        
        return json;
    }

    public destroy()
    {
        this.destroyed = true;
    }
}