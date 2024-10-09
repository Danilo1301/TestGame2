import { GLTFData_JSON } from "../../shared/gltf/gltfData"
import { Entity_JSON } from "../entities/entity"

export enum PACKET_TYPE {
    PACKET_REQUEST_MODELS,
    PACKET_MODELS,
    PACKET_JOINED_SERVER,
    PACKET_ENTITIES,
    PACKET_CLIENT_DATA,
    PACKET_ENTER_LEAVE_VEHICLE
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

export interface IPacketData_EnterLeaveVehicle {
    vehicleId: string
}
export interface IPacketData_Models {
    models: GLTFData_JSON[]
}

export interface IPacketData_Entities {
    entities: Entity_JSON[]
}

export interface IPacketData_ClientData {
    player: Entity_JSON
}