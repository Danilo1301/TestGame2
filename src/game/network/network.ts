import { io, Socket } from "socket.io-client";
import { BaseObject } from "../../utils/baseObject";
import { IPacket } from "./packet";

export class Network extends BaseObject
{
    public static SERVER_ADDRESS: string = "https://testgame2.glitch.me";

    public get socket() { return this._socket; }

    private _socket!: Socket;
    private _onConnectCallback?: Function;

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

    public onReceivePacket(packet: IPacket)
    {
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