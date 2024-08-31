import socketio, { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from '../../utils/baseObject';
import { User } from '../user/user';
import { IPacket, IPacketData, IPacketData_JoinedServer, PACKET_TYPE } from '../../game/network/packet';
import { MasterServer } from '../masterServer/masterServer';

export class Client extends BaseObject
{
    public get id() { return this._id; }
    public get socket() { return this._socket; }
    public get user() { return this._user!; }

    private _id: string = uuidv4();
    private _socket: socketio.Socket;
    private _user?: User;

    constructor(socket: socketio.Socket)
    {
        super();

        this._socket = socket;

        socket.on('disconnect', () => {
            console.log("socket disconnected");
        });
        socket.on('p', (packet: IPacket) => {
            console.log("received packet");

            try {
                this.onReceivePacket(packet);
            } catch (error) {
                console.error(error)
            }
        });
    }

    public send<T extends IPacketData>(packetType: PACKET_TYPE, data: T)
    {
        const packet: IPacket = {
            type: packetType,
            data: data
        }
        this.socket.emit('p', packet);

        this.log(`sent packet '${packet.type}'`);
    }

    public onReceivePacket(packet: IPacket)
    {
        this.log(`reiceved packet '${packet.type}'`);
    }

    public onConnect()
    {
        const server = MasterServer.Instance.getServers()[0];

        //const player = server.game.spawnPlayer(0, 3, 0);

        this.send<IPacketData_JoinedServer>(PACKET_TYPE.PACKET_JOINED_SERVER, {
            playerId: "player",
            serverId: server.id
        });
    }
}