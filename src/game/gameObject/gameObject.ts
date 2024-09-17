import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from "../../utils/baseObject";
import THREE from "three";
import { GameObjectCollision } from "./gameObjectCollision";
import { ammoQuaternionToThree, ammoVector3ToThree } from "../../utils/utils";
import { GameObjectSync } from './gameObjectSync';
import { Quaternion_Clone, Quaternion_Forward, Quaternion_Multiply_Vector3, Quaternion_Right, Quaternion_Up } from '../../utils/ammo/quaterion';
import { Game } from '../game/game';

export interface EntityData_JSON {
    
}

export enum GameObjectType {
    UNDEFINED,
    PED,
    VEHICLE,
    BIKE
}

export interface GameObject_JSON {
    id: string
    type: GameObjectType
    position: number[]
    rotation: number[]
    velocity: number[]
    input: number[]
    data?: EntityData_JSON
}

export class GameObject extends BaseObject
{
    public id: string = uuidv4();
    public displayName: string = "GameObject";
    public tag: string = "";

    public get body() { return this.collision.body!; }
    
    public model?: string = undefined;
    public collision: GameObjectCollision = new GameObjectCollision();
    public sync = new GameObjectSync();

    public inputX: number = 0;
    public inputY: number = 0;
    public inputZ: number = 0;
    public angle: number = 0;

    public destroyed: boolean = false;
    public drawCollision: boolean = true;

    public game!: Game;

    public get forward() {
        const rotation = Quaternion_Clone(this.getRotation());
        const forward = Quaternion_Forward(rotation);
        Ammo.destroy(rotation);
        return forward;
    };

    public get right() {
        const rotation = Quaternion_Clone(this.getRotation());
        const right = Quaternion_Right(rotation);
        Ammo.destroy(rotation);
        return right;
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
        const rotation = this.getRotation();

        const json: GameObject_JSON = {
            id: this.id,
            type: GameObjectType.UNDEFINED,
            position: [position.x, position.y, position.z],
            rotation: [rotation.x(), rotation.y(), rotation.z(), rotation.w()],
            velocity: [velocity.x, velocity.y, velocity.z],
            input: [this.inputX, this.inputY, this.inputZ]
        }
        
        return json;
    }

    public destroy()
    {
        this.destroyed = true;
    }

    public transformFromObjectSpace(body: Ammo.btRigidBody, offset: Ammo.btVector3)
    {
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();
        const rotation = transform.getRotation();

        const result = {x: 0, y: 0, z: 0}

        result.x = position.x();
        result.y = position.y();
        result.z = position.z();

        const forward = Quaternion_Forward(rotation);
        const right = Quaternion_Right(rotation);
        const up = Quaternion_Up(rotation);

        forward.normalize();
        right.normalize();
        up.normalize();

        const translate = {x: 0, y: 0, z: 0};
        translate.x = forward.x() * offset.z();
        translate.y = forward.y() * offset.z();
        translate.z = forward.z() * offset.z();

        translate.x += right.x() * offset.x();
        translate.y += right.y() * offset.x();
        translate.z += right.z() * offset.x();

        translate.x += up.x() * offset.y();
        translate.y += up.y() * offset.y();
        translate.z += up.z() * offset.y();

        result.x += translate.x;
        result.y += translate.y;
        result.z += translate.z;

        //result.op_add(offset);

        return new Ammo.btVector3(result.x, result.y, result.z);
    }
}