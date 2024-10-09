import socketio from 'socket.io';
import { BaseObject } from '../../shared/baseObject';
import { ServerClock } from '@enable3d/ammo-on-nodejs';
import { Client } from "../client/client";
import { Server } from "../server/server";
import { loadAmmo } from "../../shared/ammo/loadAmmo";

interface MasterServerStartOptions {
    ammo: any
    io: socketio.Server
    assetsPath: string
}

export class MasterServer extends BaseObject
{
    public static Instance: MasterServer;

    public options!: MasterServerStartOptions;

    private _servers = new Map<string, Server>([]); 

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
        server.game.serverScene.createServerScene();

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
    }

    private onSocketDisconnect(socket: socketio.Socket)
    {
        this.log("socket " + socket.id + " disconnected");
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