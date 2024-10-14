import socketio from 'socket.io';
import { BaseObject } from '../../shared/baseObject';
import { ServerClock } from '@enable3d/ammo-on-nodejs';
import { Client } from "../client/client";
import { Server } from "../server/server";
import { loadAmmo } from "../../shared/ammo/loadAmmo";
import { MemoryDetect } from "../../shared/memoryDetect";

interface MasterServerStartOptions {
    ammo: any
    io: socketio.Server
    assetsPath: string
}

export class MasterServer extends BaseObject
{
    public static Instance: MasterServer;

    public options!: MasterServerStartOptions;
    public memoryDetector = new MemoryDetect();

    private _servers = new Map<string, Server>([]); 
    private _clients = new Map<socketio.Socket, Client>([]); 

    constructor() {
        super();
        MasterServer.Instance = this;
    }

    public async start(options: MasterServerStartOptions)
    {
        this.log(`start`);

        this.options = options;

        this.log(`loading ammo...`);
        await loadAmmo(options.ammo);
        this.log(`ammo loaded!`);
        
        this.log("assetsPath: " + options.assetsPath)

        const server = this.createServer();
        server.assetsPath = this.options.assetsPath;
        await server.loadModels();
        server.game.init();
        server.game.create();

        this.startClock();

        const io = options.io;

        io.on('connection', socket => {
            socket.on('disconnect', () => {
                this.onSocketDisconnect(socket);
            });
            this.onSocketConnect(socket);
        });
    }

    private onSocketConnect(socket: socketio.Socket)
    {
        this.log("socket " + socket.id + " connected");

        const client = new Client(socket);
        client.onConnect();

        this._clients.set(socket, client);
    }

    private onSocketDisconnect(socket: socketio.Socket)
    {
        this.log("socket " + socket.id + " disconnected");

        const client = this._clients.get(socket)!;
        client.onDisconnect();
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

    private _lastUpdated: number = performance.now();

    private startClock()
    {
        const clock = new ServerClock(40);

        // for debugging you disable high accuracy
        // high accuracy uses much more cpu power
        if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()

            
        clock.onTick(delta => {
            delta *= 1000;

            //delta = 16; //why

            const now = performance.now();
            const timeDiff = now - this._lastUpdated;
            this._lastUpdated = now;

            this.preUpdate(delta);
            this.update(delta);
            this.postUpdate(delta);
        });
    }

    public preUpdate(delta: number)
    {
        this.memoryDetector.preUpdate();

        for(const server of this.getServers()) server.preUpdate(delta);
    }

    public update(delta: number)
    {
        for(const server of this.getServers()) server.update(delta);
    }
    
    public postUpdate(delta: number)
    {
        for(const server of this.getServers()) server.postUpdate(delta);

        this.memoryDetector.postUpdate();
    }
}