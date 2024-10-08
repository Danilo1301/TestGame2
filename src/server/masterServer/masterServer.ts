import socketio from 'socket.io';

import { BaseObject } from '../../shared/baseObject';
import { ServerClock } from '@enable3d/ammo-on-nodejs';

interface MasterServerStartOptions {
    ammo: any
    io: socketio.Server
    assetsPath: string
}

export class MasterServer extends BaseObject
{
    public static Instance: MasterServer;

    public options!: MasterServerStartOptions;

    constructor() {
        super();
        MasterServer.Instance = this;
    }

    public async start(options: MasterServerStartOptions)
    {
        this.log(`start`);

        this.options = options;

        this.log("assetsPath: " + options.assetsPath)

        this.startClock();
    }

    private startClock()
    {
        const clock = new ServerClock(40);

        // for debugging you disable high accuracy
        // high accuracy uses much more cpu power
        if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()

        clock.onTick(delta => {

            delta *= 1000;

            this.preUpdate(delta);
            this.update(delta);
            this.postUpdate(delta);
        });
    }

    public preUpdate(delta: number)
    {
        //console.log("pre epdate")
    }

    public update(delta: number)
    {
    }
    
    public postUpdate(delta: number)
    {
    }
}