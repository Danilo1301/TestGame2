export class Debug {
    public static useColor: boolean = true;

    public static log(tag: string, ...args: any[]) {

        let tagStr = tag;

        if(args.length == 0)
        {
            tagStr = "Debug";
            args = [tag];
        }

        if(!Debug.useColor) {
            console.log.apply(this, [`[${tag}]`].concat(args));
            return;
        }
        console.log.apply(this, [`%c${tagStr}`, "color: #0058B2"].concat(args));
    }
}