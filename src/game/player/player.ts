import { BaseObject } from "../../utils/baseObject";
import { v4 as uuidv4 } from 'uuid';

export class Player extends BaseObject
{
    public get id() { return this._id; }

    private _id: string = uuidv4();

    constructor()
    {
        super();
    }

    public update()
    {
        
    }

    public updateInputs()
    {
        
    }

    public setPosition(x: number, y: number, z: number)
    {
        
    }
}   