import { GLTFData_JSON } from "../game/gltfCollection"
import { GameObject_JSON } from "../gameObject/gameObject"

export enum PACKET_TYPE {
    PACKET_REQUEST_MODELS,
    PACKET_MODELS,
    PACKET_JOINED_SERVER,
    PACKET_GAME_OBJECTS,
    PACKET_CLIENT_DATA
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

export interface IPacketData_GameObjects {
    gameObjects: GameObject_JSON[]
}

export interface IPacketData_ClientData {
    player: GameObject_JSON
}