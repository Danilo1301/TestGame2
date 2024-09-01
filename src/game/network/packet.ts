import { GLTFData_JSON } from "../game/gltfCollection"

export enum PACKET_TYPE {
    PACKET_REQUEST_MODELS,
    PACKET_MODELS,
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

export interface IPacketData_Models {
    models: GLTFData_JSON[]
}