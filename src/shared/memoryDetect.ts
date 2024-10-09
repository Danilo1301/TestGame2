import { BaseObject } from "./baseObject";

export class MemoryDetect extends BaseObject
{
    private _prevHighestId: number = 0;
    private _prevHighestMemory: number = 0;

    private _prevHighestMemoryClear: number = 0;

    private _showMessages: boolean = false;

    public preUpdate()
    {
        const id = this.getID();

        //this.log("id:", id);

        if(id > this._prevHighestId + 200)
        {
            this.log(`Possible leak, id ${this._prevHighestId} -> ${id}`);

            this._prevHighestId = id;
        }

        if(window)
        {
            const s = (window as any).performance.memory.usedJSHeapSize;
            const memoryDiff = s - this._prevHighestMemory;

            if(memoryDiff > 1000)
            {
                //this.log(`Memory increased ${this._prevHighestMemory} -> ${s} (+${memoryDiff})`);
                this._prevHighestMemory = s;
            }
            if(memoryDiff < -3000)
            {
                
                //this.log(`Memory cleared ${this._prevHighestMemory} -> ${s} (${memoryDiff})`);
                this._prevHighestMemory = s;
                
                const memoryClearDiff = s - this._prevHighestMemoryClear;

                if(s > this._prevHighestMemoryClear)
                {
                    if(this._showMessages)
                        this.logColor("#FF0000", `Memory probably leaking ${this._prevHighestMemoryClear} -> ${s} (${memoryClearDiff})`);
                    
                    this._prevHighestMemoryClear = s;
                } else {
                    if(this._showMessages)
                        this.log(`Memory cleared ${this._prevHighestMemoryClear} -> ${s} (${memoryClearDiff})`);

                    if(memoryClearDiff < -500000)
                    {
                        this._prevHighestMemoryClear = s;
                    }
                }

                const w = window as any;
                const perc = w.performance.memory.usedJSHeapSize / w.performance.memory.jsHeapSizeLimit * 100;
                //this.log(perc.toFixed(4) + "%");
            }
        }
    }

    public postUpdate()
    {

    }

    public getID()
    {
        const vec = new Ammo.btVector3(0, 0, 0);
        let id = (vec as any).aa;
        if(id == undefined) id = (vec as any).kB;
        Ammo.destroy(vec);

        return id;
    }
}