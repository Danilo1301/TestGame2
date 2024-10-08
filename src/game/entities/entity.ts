import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from "../../shared/baseObject";
import { Game } from "../game/game";
import { FormatVector3 } from '../../shared/ammo/vector';
import { EntityCollision } from "./entityCollision";
import { Quaternion_Clone, Quaternion_Forward, Quaternion_Right } from '../../shared/ammo/quaterion';

export class Entity extends BaseObject
{
    public id: string = uuidv4();
    public game!: Game;
    public destroyed: boolean = false;
    public collision: EntityCollision = new EntityCollision();
    public modelName?: string;
    public displayName: string = "entity";

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
}