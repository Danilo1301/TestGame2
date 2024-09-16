import { io, Socket } from "socket.io-client";
import { BaseObject } from "../../utils/baseObject";
import { IPacket, IPacketData, IPacketData_ClientData, IPacketData_GameObjects, IPacketData_JoinedServer, PACKET_TYPE } from "./packet";
import { Gameface } from "../gameface/gameface";
import THREE from "three";
import { Ped } from "../entities/ped";
import { eSyncType } from "../gameObject/gameObjectSync";
import { gameSettings } from "../constants/config";

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

        if(packet.type == PACKET_TYPE.PACKET_GAME_OBJECTS)
        {
            const game = Gameface.Instance.game;

            //console.log(packet);

            const data = packet.data as IPacketData_GameObjects;

            for(const obj of data.gameObjects)
            {
                //console.log(obj);

                if(!game.gameObjects.has(obj.id))
                {
                    const ped = game.gameObjectFactory.spawnPed();
                    game.gameObjectFactory.changeGameObjectId(ped, obj.id);
                }

                const ped = game.gameObjects.get(obj.id);

                if(ped)
                {
                    if(ped.id == Gameface.Instance.playerId)
                    {
                        if(!Gameface.Instance.player)
                        {
                            Gameface.Instance.player = ped as Ped;
                        }
                    } else {
                        ped.sync.syncType = eSyncType.SYNC_DEFAULT;

                        const position = obj.position;
                        const velocity = obj.velocity;

                        //console.log(velocity);

                        ped.sync.setPosition(position[0], position[1], position[2]);
                        ped.sync.setVelocity(velocity[0], velocity[1], velocity[2]);
                    }

                }
                

            }
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

        const json = player.toJSON();

        this.send<IPacketData_ClientData>(PACKET_TYPE.PACKET_CLIENT_DATA, {
            player: json
        });
    }
}