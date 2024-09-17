import socketio from 'socket.io';
import Phaser from 'phaser';
import path from "path"
import { Server } from "../server/server";
import { User } from "../user/user";
import { BaseObject } from '../../utils/baseObject';
import { Client } from '../client/client';
import { loadAmmo } from '../../utils/loadAmmo';
import { Loaders, ServerClock } from "@enable3d/ammo-on-nodejs";
import { gltfModels } from '../../game/constants/assets';
import { GLTFCollection, GLTFData } from '../../game/game/gltfCollection';

export class MasterServer extends BaseObject
{
    public static Instance: MasterServer;

    private _servers = new Map<string, Server>([]); 
    private _users = new Map<string, User>([]); 
    private _io: socketio.Server;

    constructor(io: socketio.Server) {
        super();
        MasterServer.Instance = this;
        
        this._io = io;
    }

    public async start()
    {
        console.log(`waiting for ammo...`);
        await loadAmmo();
        console.log(`ammo loaded!`);

        const io = this._io;

        io.on('connection', socket => {
            this.onSocketConnect(socket);
        });

        const server = this.createServer();
        await server.loadModels();
        server.game.init();
        server.game.serverScene.create();
        server.game.serverScene.createServerScene();

        //server.game.startClock();
        const clock = new ServerClock()

        // for debugging you disable high accuracy
        // high accuracy uses much more cpu power
        if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()

        clock.onTick(delta => this.update(delta))
    }

    public update(delta: number)
    {
        for(const server of this.getServers())
        {
            server.update(delta);
        }
    }

    private onSocketConnect(socket: socketio.Socket)
    {
        console.log("socket connected");

        const client = new Client(socket);

        this.onClientConnect(client);
    }

    public onClientConnect(client: Client)
    {
        /*
        const server = this.createServer(`${client.username}'s server`);
        server.start();
        client.setMainServer(server);
        */
        client.onConnect();
    }

    public getServers()
    {
        return Array.from(this._servers.values());
    }

    public createServer()
    {
        const server = new Server();
        this._servers.set(server.id, server);
        
        return server;
    }
}