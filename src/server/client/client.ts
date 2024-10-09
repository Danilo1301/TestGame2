import socketio, { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from "../../shared/baseObject"
import { IPacket, IPacketData, IPacketData_Models, PACKET_TYPE } from "../../game/network/packet";
import { MasterServer } from '../masterServer/masterServer';

export class Client extends BaseObject
{
    public get id() { return this._id; }
    public get socket() { return this._socket; }
    //public get user() { return this._user!; }

    private _id: string = uuidv4();
    private _socket: socketio.Socket;
    //private _user?: User;

    //private _server?: Server;
    //private _player?: Ped;

    constructor(socket: socketio.Socket)
    {
        super();

        this._socket = socket;

        socket.on('p', (packet: IPacket) => {
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

        if(packet.type == PACKET_TYPE.PACKET_REQUEST_MODELS)
        {
            const server = MasterServer.Instance.getServers()[0];

            const data: IPacketData_Models = {
                models: []
            }

            for(const gltf of server.game.gltfCollection.gltfs.values())
            {
                data.models.push(gltf.toJSON());
            }

            this.send(PACKET_TYPE.PACKET_MODELS, data);
        }
    }

    public onConnect()
    {
        this.log(`on connect`);
    }
}