import { io, Socket } from "socket.io-client";
import { BaseObject } from "../../utils/baseObject";
import { IPacket, PACKET_TYPE } from "./packet";

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
    public static SERVER_ADDRESS: string = "https://testgame2.glitch.me";

    public get socket() { return this._socket; }

    private _socket!: Socket;
    private _onConnectCallback?: Function;
    private _packetListener = new PacketListener();

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

    public send(type: PACKET_TYPE, data: any) {
        const packet: IPacket = {
            type: type,
            data: data
        }
        this._socket.emit('p', packet);
        this.log(`sent packet '${packet.type}'`);
    }

    public onReceivePacket(packet: IPacket)
    {
        this.log(`reiceved packet ${packet.type}`)

        this._packetListener.emitReceivedPacketEvent(packet);
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
        if(location.host.includes('localhost') || location.host.includes(':')) return `${location.protocol}//${location.host}/`;
        return `${Network.SERVER_ADDRESS}`;
    }
}