import { Debug } from "./debug";

export class BaseObject
{
    public log(...args: any[])
    {
        const allArgs: any = [`${this.constructor.name}`].concat(args);

        Debug.log.apply(this, allArgs);
    }

    public logColor(color: string, ...args: any[])
    {
        const allArgs: any = [`${this.constructor.name}`, color].concat(args);

        Debug.logColor.apply(this, allArgs);
    }
}