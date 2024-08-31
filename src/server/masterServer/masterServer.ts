import socketio from 'socket.io';
import Phaser from 'phaser';
import { Server } from "../../game/server/server";
import { User } from "../user/user";
import { BaseObject } from '../../utils/baseObject';
import { IPacket } from '../../game/network/packet';
import { Client } from '../client/client';
import { loadAmmo } from '../../utils/loadAmmo';

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
        server.game.serverScene.init();
        server.game.startClock();
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