import { GLTFData_JSON } from "../../shared/gltf/gltfData"
import { Inventory_JSON } from "../../shared/inventory/inventory"
import { SlotGroup_JSON } from "../../shared/inventory/slotGroup"
import { Entity_Info_Basic, EntityType } from "../entities/entity"

export enum PACKET_TYPE {
    PACKET_REQUEST_INITIAL_INFO,
    PACKET_INITIAL_INFO,

    PACKET_CLIENT_READY,
    PACKET_ENTITIES,
    PACKET_CLIENT_DATA,
    PACKET_ENTER_LEAVE_VEHICLE,
    PACKET_WEAPON_SHOT,
    PACKET_HEALTH,

    // entity sync
    PACKET_ENTITY_INFO_BASIC,
    PACKET_CLIENT_INFO,
    PACKET_ENTITY_TELEPORTED,

    PACKET_CHAT_MESSAGE,

    PACKET_INVENTORY,
    PACKET_INVENTORY_ITEM_MOVE
}

// ################## PacketData ##################

export interface IPacketData {
    
}

export interface IPacketData_RequestInitialInfo {
    nickname: string
}

export interface IPacketData_InitialInfo {
    models: GLTFData_JSON[]
    playerId: string
    serverId: string
    inventoryId: string
}

export interface IPacketData_ClientReady {
}

export interface IPacketData_Entity_Info_Basic extends Entity_Info_Basic {}

export interface IPacketData_Entity_Teleported extends IPacketData_Entity_Info_Basic {}

export interface IPacketData_WeaponShot {
    hit: number[]
    byPed: string
    hitEntity?: string
}

export interface IPacketData_ChatMessage {
    message: string
}

export interface IPacketData_Inventory {
    inventory: Inventory_JSON
}

export interface IPacketData_InventoryItemMove {
    fromInventory: string
    fromSlotGroup: number
    fromX: number
    fromY: number

    toInventory: string
    toSlotGroup: number
    toX: number
    toY: number
}

export interface IPacketData_EnterLeaveVehicle {
    vehicleId: string
}

// ################## Packet ##################

export interface IPacket {
    type: PACKET_TYPE
    data: IPacketData
}