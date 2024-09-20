import socketio, { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from '../../utils/baseObject';
import { User } from '../user/user';
import { MasterServer } from '../masterServer/masterServer';
import { Server } from '../server/server';
import { IPacket, IPacketData, IPacketData_ClientData, IPacketData_EnterLeaveVehicle, IPacketData_JoinedServer, IPacketData_Models, PACKET_TYPE } from '../../game/network/packet';
import { Ped, PedData_JSON } from '../../game/entities/ped';
import { Vehicle } from '../../game/entities/vehicle';
import { Entity_JSON, EntityData_JSON, EntityType } from '../../game/entities/entity';

export class Client extends BaseObject
{
    public get id() { return this._id; }
    public get socket() { return this._socket; }
    public get user() { return this._user!; }

    private _id: string = uuidv4();
    private _socket: socketio.Socket;
    private _user?: User;

    private _server?: Server;
    private _player?: Ped;

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

        //this.log(`sent packet '${packet.type}'`);
    }

    public onReceivePacket(packet: IPacket)
    {
        //this.log(`reiceved packet '${packet.type}'`);

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

        if(packet.type == PACKET_TYPE.PACKET_CLIENT_DATA)
        {
            const player = this._player;

            const data = packet.data as IPacketData_ClientData;

            //console.log(data.player.type)

            if(player)
            {
                if(data.player.type == EntityType.PED)
                {
                    const pedData = data.player.data as PedData_JSON;

                    const position = data.player.position;
                    const input = data.player.input;
    
                    player.inputX = input[0];
                    player.inputY = input[1];
                    player.inputZ = input[2];
                    player.lookDir.setValue(pedData.lookDir[0], pedData.lookDir[1], pedData.lookDir[2], pedData.lookDir[3]);
                    
                    console.log(position)

                    player.setPosition(position[0], position[1], position[2]);
                }
                
                const vehicle = player.onVehicle;

                if(vehicle)
                {
                    if(data.player.type == EntityType.VEHICLE)
                    {
                        //const vehicleData = data.player.data as Entity_JSON;
    
                        console.log(data.player);

                        const position = data.player.position;
                        const rotation = data.player.rotation;
                        const input = data.player.input;
        
                        player.inputX = input[0];
                        player.inputY = input[1];
                        player.inputZ = input[2];
                        
                        vehicle.setVehiclePosition(position[0], position[1], position[2]);
                        vehicle.setVehicleRotation(rotation[0], rotation[1], rotation[2], rotation[3]);
                    }
                }

                
            }
        }

        if(packet.type == PACKET_TYPE.PACKET_ENTER_LEAVE_VEHICLE)
        {
            const data = packet.data as IPacketData_EnterLeaveVehicle;
            const vehicleId = data.vehicleId;

            const player = this._player;
            const vehicle = this._server!.game.entityFactory.entities.get(vehicleId) as Vehicle | undefined;

            if(player && vehicle)
                {
                if(!player.onVehicle)
                {
                    player.enterVehicle(vehicle);
                } else {
                    player.leaveVehicle();
                }
            }
        }
    }

    public onConnect()
    {
        const server = MasterServer.Instance.getServers()[0];
        this.joinServer(server);
    }

    public joinServer(server: Server)
    {
        this.log("joining server " + server.id);

        this._server = server;
        this._server.clients.push(this);

        const player = server.game.entityFactory.spawnPed(0, 5, 0);
        this._player = player;

        this.send<IPacketData_JoinedServer>(PACKET_TYPE.PACKET_JOINED_SERVER, {
            playerId: player.id,
            serverId: server.id
        });
    }
}