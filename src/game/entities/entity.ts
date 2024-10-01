import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from "../../utils/baseObject";
import { EntityCollision } from './entityCollision';
import { Game } from '../game/game';
import { EntitySync } from './entitySync';
import { Vector3_DistanceTo } from '../../utils/ammo/vector';
import { Quaternion_Clone, Quaternion_Forward, Quaternion_Right, Quaternion_Up } from '../../utils/ammo/quaterion';

export interface EntityData_JSON {}

export enum EntityType {
    UNDEFINED,
    PED,
    BOX,
    VEHICLE,
    BIKE
}

export interface Entity_JSON {
    id: string
    type: EntityType
    position: number[]
    rotation: number[]
    velocity: number[]
    input: number[]
    data?: EntityData_JSON
}

export class Entity extends BaseObject
{
    public id: string = uuidv4();
    public game!: Game;
    public model?: string;
    public displayName: string = "Entity";
    public collision: EntityCollision = new EntityCollision();
    public drawCollision: boolean = true;
    public sync = new EntitySync(this);
    public destroyed: boolean = false;

    public inputX: number = 0;
    public inputY: number = 0;
    public inputZ: number = 0;

    public get body() { return this.collision.body!; }

    private _position = new Ammo.btVector3(0, 0, 0);
    private _rotation = new Ammo.btQuaternion(0, 0, 0, 1);
    
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
    }

    public init()
    {
        
    }

    public update(delta: number)
    {
        this.sync.update(delta);

        if(this.game.isServer)
        {
            //this.processRandomAssForce();

            this.processTeleportBackToSpawn();
        }
    }

    public processRandomAssForce()
    {
        const force = new Ammo.btVector3(-10, 0, 0)
        const zero = new Ammo.btVector3(0, 0, 0)

        this.collision.body!.applyForce(force, zero);
        
        Ammo.destroy(force);
        Ammo.destroy(zero);
    }

    public processTeleportBackToSpawn()
    {
        const body = this.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

        const spawnPos = new Ammo.btVector3(0, 2, 0);

        const distanceFromSpawn = Vector3_DistanceTo(position, spawnPos);

        if(distanceFromSpawn > 70)
        {
            this.setPosition(spawnPos.x(), spawnPos.y(), spawnPos.z());
            this.setVelocity(0, 0, 0);
            this.log("teleported to spawn");
        }

        Ammo.destroy(spawnPos);
    }

    public destroy()
    {
        
    }

    public getPosition()
    {
        if(!this.collision.body)
        {
            return this._position;
        }

        const body = this.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

        return position;
    }

    public setPosition(x: number, y: number, z: number)
    {
        if(!this.collision.body)
        {
            this._position.setValue(x, y, z);
            return;
        }

        const body = this.collision.body!;

        const origin = new Ammo.btVector3(x, y, z);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(origin);

        body.getWorldTransform().setOrigin(transform.getOrigin());
        //body.getMotionState().setWorldTransform(transform); //DOESNT WORK WTF

        Ammo.destroy(origin);
        Ammo.destroy(transform);
    }

    public setVelocity(x: number, y: number, z: number)
    {
        const body = this.collision.body!;
        const velocity = new Ammo.btVector3(x, y, z);
        body.setLinearVelocity(velocity);
        Ammo.destroy(velocity);
    }

    public getRotation()
    {
        if(!this.collision.body)
        {
            return this._rotation;
        }

        const body = this.collision.body!;
        const transform = body.getWorldTransform();
        const rotation = transform.getRotation();

        return rotation;
    }

    public setRotation(x: number, y: number, z: number, w: number)
    {
        if(!this.collision.body)
        {
            this._rotation.setValue(x, y, z, w);
            return
        }

        const body = this.collision.body!;

        const quat = new Ammo.btQuaternion(x, y, z, w)

        //const transform = new Ammo.btTransform();
        //transform.setIdentity();
        //transform.setOrigin(new Ammo.btVector3(0, 0, 10));

        //body.getWorldTransform().setOrigin(transform.getOrigin());
        body.getWorldTransform().setRotation(quat);
        //body.getMotionState().setWorldTransform(transform); //DOESNT WORK WTF

        Ammo.destroy(quat);
    }

    public activateBody()
    {
        if(!this.collision.body!.isActive())
        {
            this.collision.body!.activate();
        }
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

        Ammo.destroy(forward);
        Ammo.destroy(right);
        Ammo.destroy(up);

        return new Ammo.btVector3(result.x, result.y, result.z);
    }
    
    public toJSON()
    {
        const body = this.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();
        const rotation = transform.getRotation();
        const velocity = body.getLinearVelocity();

        const json: Entity_JSON = {
            id: this.id,
            type: EntityType.UNDEFINED,
            position: [position.x(), position.y(), position.z()],
            rotation: [rotation.x(), rotation.y(), rotation.z(), rotation.w()],
            velocity: [velocity.x(), velocity.y(), velocity.z()],
            input: [this.inputX, this.inputY, this.inputZ]
        }
        
        return json;
    }
}