import { ServerClock } from "@enable3d/ammo-on-nodejs";
import { BaseObject } from "../../utils/baseObject";

export class MemoryDetector extends BaseObject {
    private _prevAA: number = 0;
    private _prevHighestAA: number = 0;
    private _aa: number = 0;
    private _prevAAs: number[] = [];
    
    public beginDetect()
    {
        //this._prevAA = this.getAA();
    }

    public finishDetect()
    {
        const aa = this.getAA();
        const diff = aa - this._prevAA;

        if(diff > 200)
        {
            //console.log(this._prevAAs);

            if(!this.isAARepeating(aa, 3))
            {
                this.log(`Possible memory leak detected! (aa: ${this._prevAA} -> ${aa}, ${diff})`);
            }

            this._prevAA = aa;


            this._prevAAs.push(aa);
            if(this._prevAAs.length > 20) this._prevAAs.splice(0, 1);
        }
        if(diff < 0)
        {
            this._prevAA = aa;
        }

        if(aa > this._prevHighestAA)
        {
            this._prevHighestAA = aa;
            //this.log(`Possible memory leak detected! (aa: ${this._prevAA} -> ${aa}, ${diff})`);
        }
    }

    public isAARepeating(aa: number, amountOfRepetitions: number)
    {
        let repeats = 0;
        for(const _aa of this._prevAAs)
        {
            if(_aa == aa) repeats++;
        }

        return repeats >= amountOfRepetitions;
    }

    public getAA()
    {
        const vec = new Ammo.btVector3(0, 0, 0);
        let aa = (vec as any).aa;
        if(aa == undefined) aa = (vec as any).kB;
        Ammo.destroy(vec);

        this._aa = aa;

        return aa;
    }
}