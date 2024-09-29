import { BaseObject } from '../../utils/baseObject';
import { loadAmmo } from '../../utils/loadAmmo';
import socketio from 'socket.io';
import { Server } from '../server/server';
import { ServerClock } from '@enable3d/ammo-on-nodejs';
import { Client } from '../client/client';
import { MemoryDetector } from '../../game/game/memoryDetector';

interface MasterServerStartOptions {
    ammo: any
    io: socketio.Server
    assetsPath: string
}

export class MasterServer extends BaseObject
{
    public static Instance: MasterServer;

    public options!: MasterServerStartOptions;
    public memoryDetector = new MemoryDetector();

    private _servers = new Map<string, Server>([]); 

    constructor() {
        super();
        MasterServer.Instance = this;
    }

    public async start(options: MasterServerStartOptions)
    {
        this.log(`start`);

        this.options = options;

        this.log("assetsPath: " + options.assetsPath)

        this.log(`loading ammo...`);
        await loadAmmo(options.ammo);
        this.log(`ammo loaded!`);

        const io = options.io;

        io.on('connection', socket => {
            this.log("socket " + socket.id + " connected");

            socket.on('disconnect', () => {
                this.log("socket " + socket.id + " disconnected");
                this.onSocketDisconnect(socket);
            });
            
            this.onSocketConnect(socket);
        });

        const server = this.createServer();
        server.assetsPath = this.options.assetsPath;
        await server.loadModels();
        server.game.init();
        server.game.serverScene.create();
        server.game.serverScene.createServerScene();

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
        this.memoryDetector.beginDetect();

        for(const server of this.getServers()) server.preUpdate(delta);
    }

    public update(delta: number)
    {
        for(const server of this.getServers()) server.update(delta);
    }
    
    public postUpdate(delta: number)
    {
        this.memoryDetector.finishDetect();

        for(const server of this.getServers()) server.postUpdate(delta);
    }

    public createServer()
    {
        const server = new Server();
        this._servers.set(server.id, server);
        
        return server;
    }

    public getServers()
    {
        return Array.from(this._servers.values());
    }

    private onSocketConnect(socket: socketio.Socket)
    {
        const client = new Client(socket);

        client.onConnect();
    }

    private onSocketDisconnect(socket: socketio.Socket)
    {

    }
}