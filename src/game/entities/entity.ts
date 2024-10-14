import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from "../../shared/baseObject";
import { Game } from "../game/game";
import { FormatVector3 } from '../../shared/ammo/vector';
import { EntityCollision } from "./entityCollision";
import { Quaternion_Clone, Quaternion_Forward, Quaternion_Right } from '../../shared/ammo/quaterion';
import { EntitySync } from './entitySync';

export interface EntityData_JSON {
}

export interface EntityFullData_JSON {
    type: EntityType
    nickname: string
    nicknameColor: number
}

export enum EntityType {
    UNDEFINED,
    PED,
    BOX,
    VEHICLE,
    BIKE
}

export interface Entity_JSON {
    id: string
    position: number[]
    rotation: number[]
    velocity: number[]
    input: number[]
    data?: EntityData_JSON
    fullData?: EntityFullData_JSON
}

export class Entity extends BaseObject
{
    public id: string = uuidv4();
    public game!: Game;
    public destroyed: boolean = false;
    public collision: EntityCollision = new EntityCollision(this);
    public sync = new EntitySync(this);
    public modelName?: string;
    public displayName: string = "entity";

    public inputX: number = 0;
    public inputY: number = 0;
    public inputZ: number = 0;

    public invincible: boolean = false;
    public health: number = 100.0;

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
    
    public initCollision()
    {
        
    }

    public init()
    {

    }

    public setModel(name: string)
    {
        this.modelName = name;
    }

    public update(delta: number)
    {
        //this.log(`${FormatVector3(this.getPosition())}`);

        this.sync.update(delta);
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

    public getRotation()
    {
        if(!this.collision.body) {
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

    public setId(id: string)
    {
        this.id = id;
        this.collision.setBodyId(id);
    }

    public destroy()
    {
        if(this.destroyed) return;

        this.destroyed = true;


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
            position: [position.x(), position.y(), position.z()],
            rotation: [rotation.x(), rotation.y(), rotation.z(), rotation.w()],
            velocity: [velocity.x(), velocity.y(), velocity.z()],
            input: [this.inputX, this.inputY, this.inputZ]
        }
        
        return json;
    }

    public toFullJSON()
    {
        const json = this.toJSON();

        json.fullData = {
            type: EntityType.UNDEFINED,
            nickname: "Nickname",
            nicknameColor: 0xffffff
        };

        return json;
    }
}