import { Debug } from "./debug/debug";

export class BaseObject
{
    public log(...args: any[])
    {
        const allArgs: any = [`${this.constructor.name}`].concat(args);

        Debug.log.apply(this, allArgs);
    }
}