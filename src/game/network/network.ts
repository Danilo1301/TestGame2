import { io, Socket } from "socket.io-client";
import { BaseObject } from "../../utils/baseObject";
import { IPacket, IPacketData, IPacketData_ClientData, IPacketData_Entities, IPacketData_JoinedServer, PACKET_TYPE } from "./packet";
import { SyncHelper } from "./syncHelper";
import { gameSettings } from "../constants/gameSettings";
import { Gameface } from "../gameface/gameface";
import { EntityType } from "../entities/entity";

class PacketListener {
    public functions = new Map<PACKET_TYPE, Function[]>();

    public emitReceivedPacketEvent(packet: IPacket)
    {
        if(!this.functions.has(packet.type)) return;

        const fns = this.functions.get(packet.type)!;

        for(const fn of fns)
        {
            fn(packet.data);
        }

        this.functions.delete(packet.type);

        console.log(`[PacketListener] There are ${0} functions listening for packet ${packet.type}`);
    }

    public listen(type: PACKET_TYPE, callback: Function)
    {
        if(!this.functions.has(type))
        {
            this.functions.set(type, []);
        }

        const fns = this.functions.get(type)!;
        
        fns.push(callback);

        console.log(`[PacketListener] There are ${fns.length} functions listening for packet ${type}`);
    }
}

export class Network extends BaseObject
{
    public get socket() { return this._socket; }

    private _socket!: Socket;
    private _onConnectCallback?: Function;
    private _packetListener = new PacketListener();
    private _lastSentData = performance.now();

    constructor() {
        super();
        this.initSocket();
    }

    private initSocket()
    {
        this._socket = io(this.getAddress(), {
            autoConnect: false,
            reconnection: false
        });

        this._socket.once('connect', () => {
            this._onConnectCallback?.();
        })

        this._socket.on('p', (packet: IPacket) => {
            this.onReceivePacket(packet);
        })

        this.log(`address: (${this.getAddress()})`)
    }

    public send<T extends IPacketData>(packetType: PACKET_TYPE, data: T)
    {
        const packet: IPacket = {
            type: packetType,
            data: data
        }
        this._socket.emit('p', packet);
        //this.log(`sent packet '${packet.type}'`);
    }

    public onReceivePacket(packet: IPacket)
    {
        //this.log(`reiceved packet ${packet.type}`)

        this._packetListener.emitReceivedPacketEvent(packet);

        if(packet.type == PACKET_TYPE.PACKET_JOINED_SERVER)
        {
            const data = packet.data as IPacketData_JoinedServer;

            Gameface.Instance.playerId = data.playerId;

            console.log(data);
        }
            
        if(packet.type == PACKET_TYPE.PACKET_ENTITIES)
        {
            const data = packet.data as IPacketData_Entities;

            SyncHelper.onReceiveEntitiesPacket(data);
        }
    }

    public waitForPacket<T>(type: PACKET_TYPE)
    {
        return new Promise<T>((resolve) => {

            this._packetListener.listen(type, (data: T) => {
                
                resolve(data);
            });

        });
    }

    public connect(callback?: Function)
    {
        if(this.socket.connected) {
            callback?.();
            return; 
        }

        this._onConnectCallback = callback;
        this._socket.connect();
    }

    public getAddress()
    {
        return `${location.protocol}//${location.host}`;
    }

    public update(delta: number)
    {
        const now = performance.now();

        if(now - this._lastSentData > gameSettings.clientSendDataInterval)
        {
            this._lastSentData = now;
            this.sendPlayerData();
        }
    }

    public sendPlayerData()
    {
        const player = Gameface.Instance.player;

        if(!player) return;

        const vehicle = player.onVehicle;

        if(vehicle)
        {
            const json = vehicle.toJSON();
            json.type = EntityType.VEHICLE;

            this.send<IPacketData_ClientData>(PACKET_TYPE.PACKET_CLIENT_DATA, {
                player: json
            });
            return;
        } 

        const json = player.toJSON();
        json.type = EntityType.PED;

        this.send<IPacketData_ClientData>(PACKET_TYPE.PACKET_CLIENT_DATA, {
            player: json
        });
    }
}