export enum PACKET_TYPE {
    PACKET_JOINED_SERVER
}

export interface IPacketData {
    
}

export interface IPacket {
    type: PACKET_TYPE
    data: IPacketData
}

export interface IPacketData_JoinedServer {
    playerId: string
    serverId: string
}