class ObjectValue {
    public id: string
    public value: any
    public fn: Function
    public changed: boolean = false;

    public minDifference: number = 0;

    constructor(id: string, fn: Function)
    {
        this.id = id;
        this.fn = fn;
        this.value = fn();
    }

    public setMinDifference(min: number)
    {
        this.minDifference = min;
        return this;
    }
}

export class ObjectGroup {
    public id: string;
    public values = new Map<string, ObjectValue>();
    public onChange?: Function;

    public setAsChangedAll: boolean = false;

    constructor(id: string)
    {
        this.id = id;
    }

    public watch(id: string, fn: Function)
    {
        const objectValue = new ObjectValue(id, fn);
       
        this.values.set(id, objectValue);

        console.log(`[ObjectGroup] watching ${id}, initial valaue: ${objectValue.value}`);

        return objectValue;
    }

    public check()
    {
        let someValueChanged = false;

        for(const objectValue of this.values.values())
        {
            objectValue.changed = false;

            const prevValue = objectValue.value;

            const newValue = objectValue.fn();

            let canChange = false;

            if(newValue != prevValue)
            {
                if(typeof newValue === "number")
                {
                    let diff = Math.abs(newValue - prevValue);

                    if(diff >= objectValue.minDifference)
                    {
                        canChange = true;
                    }
                } else {
                    canChange = true;
                }
            }
            
            if(this.setAsChangedAll) canChange = true;

            if(canChange)
            {
                //console.log(`[ObjectGroup] ${objectValue.id} changed from ${prevValue} to ${newValue}`);

                objectValue.value = newValue;

                objectValue.changed = true;
                someValueChanged = true;
            }
        }

        if(someValueChanged)
        {
            this.onChange?.();
        }

        this.setAsChangedAll = false;
    }

    public hasValueChanged(id: string)
    {
        return this.values.get(id)!.changed;
    }

    public getValue(id: string)
    {
        return this.values.get(id)!.value;
    }
}