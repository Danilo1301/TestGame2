import { v4 as uuidv4 } from 'uuid';
import { Game } from '../../game/game/game';
import { Client } from '../client/client';
import { Loaders } from '@enable3d/ammo-on-nodejs';
import path from 'path';
import { Entity, Entity_Info_Basic, EntityType } from '../../game/entities/entity';
import { Ped } from '../../game/entities/ped';
import { IPacket, IPacketData, IPacketData_ChatMessage, IPacketData_Entity_Info_Basic, IPacketData_Entity_Teleported, IPacketData_Inventory, IPacketData_WeaponShot, PACKET_TYPE } from '../../game/network/packet';
import { Box } from '../../game/entities/box';
import { BaseObject } from '../../shared/baseObject';
import { gameSettings } from "../../shared/constants/gameSettings";
import { gltfModels } from "../../shared/constants/assets";
import { GLTFData } from '../../shared/gltf/gltfData';
import { Weapon } from '../../game/weapons/weapon';
import { EntityWatcher } from './entityWatcher';
import { ObjectGroup } from '../../shared/objectWatcher/objectGroup';
import { Inventory } from '../../shared/inventory/inventory';
import { SlotGroup_JSON } from '../../shared/inventory/slotGroup';

export class Server extends BaseObject
{
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get game() { return this._game; }
    public get entityWatcher() { return this._entityWatcher; }

    public clients: Client[] = [];
    public assetsPath: string = "";

    private _id: string = uuidv4();
    private _name: string = "Server";
    private _game = new Game();
    private _entityWatcher = new EntityWatcher(this._game);

    private _lastSentData: number = performance.now();

    constructor()
    {
        super();
        this.game.isServer = true;

        this.game.events.on("weapon_shot", (weapon: Weapon, from: THREE.Vector3, to: THREE.Vector3) => {
            //console.log("broadcast this weapon_shot")

            this.sendToAll<IPacketData_WeaponShot>(PACKET_TYPE.PACKET_WEAPON_SHOT, {
                hit: [to.x, to.y, to.z],
                byPed: weapon!.ped!.id
            });
        });

        this.game.events.on("updated_inventory", (inventory: Inventory) => {
            this.sendInventoryUpdated(inventory);
        });

        
        this.game.events.on("entity_teleported", (entity: Entity) => {
            
            console.log("game: entity_teleported");

            const info: Entity_Info_Basic = {
                id: entity.id,
                type: this.entityWatcher.getEntityType(entity)
            }

            const position = entity.getPosition();

            info.position = {x: position.x(), y: position.y(), z: position.z()};

            this.sendToAll<IPacketData_Entity_Teleported>(PACKET_TYPE.PACKET_ENTITY_TELEPORTED, info);
        });

        this.game.events.on("entity_died", (entity: Entity, byEntity: Entity | undefined) => {
            
            if(entity instanceof Ped)
            {
                if(byEntity instanceof Ped)
                {
                    this.sendServerMessage(`${entity.nickname} foi morto por ${byEntity.nickname}`);
                }
            }
        });

        this.entityWatcher.onEntityInfoChange = (entity: Entity, info: Entity_Info_Basic) =>
        {   
            //console.log("[info changed]", entity.displayName, info);

            this.sendToAll<IPacketData_Entity_Info_Basic>(PACKET_TYPE.PACKET_ENTITY_INFO_BASIC, info);
        }
    }

    public preUpdate(delta: number)
    {
        this.game.preUpdate(delta);
    }

    public update(delta: number)
    {
        this.game.update(delta);

        this.processSendData();
    }

    public postUpdate(delta: number)
    {
        this.game.postUpdate(delta);

    }

    public sendToAll<T extends IPacketData>(packetType: PACKET_TYPE, data: T)
    {
        for(const client of this.clients)
        {
            if(!client.isReady) continue;

            client.send(packetType, data);
        }
    }

    public sendInventoryUpdated(inventory: Inventory)
    {
        for(const client of this.clients)
        {
            if(inventory.id == client.inventory?.id)
            {
                console.log("sending inventory data " + inventory.id + " to " + client.nickname)

                console.log(inventory.toJSON());

                client.send<IPacketData_Inventory>(PACKET_TYPE.PACKET_INVENTORY, {
                    inventory: inventory.toJSON()
                });
            }
        }
    }

    private processSendData()
    {
        const now = performance.now();

        if(now - this._lastSentData > gameSettings.serverSendDataInterval)
        {
            this._lastSentData = now;

            //this.log("sending data");

            for(const [id, entity] of this.game.entityFactory.entities)
            {
                if(!this.entityWatcher.hasEntity(entity))
                {
                    this.entityWatcher.addEntity(entity);
                }
            }
            for(const [entity, data] of this.entityWatcher.entities)
            {
                if(!this.game.entityFactory.entities.has(entity.id))
                {
                    this.entityWatcher.removeEntity(entity);
                }
            }

            this.entityWatcher.check();
        }
    }

    public async loadModels()
    {
        const gltfCollection = this.game.gltfCollection;

        const GLTFLoader = new Loaders.GLTFLoader()
        const assetsPath = this.assetsPath;

        for(const asset of gltfModels)
        {
            const gltfPath = path.resolve(assetsPath, asset.path);

            this.log(`Loading model ${asset.key} from ${gltfPath}`);

            await new Promise<void>((resolve) => {
                GLTFLoader.load(gltfPath).then((gltf: any) => {

                    const gltfData = new GLTFData();
                    gltfData.id = asset.key;
                    gltfData.gltf = gltf;
    
                    gltfCollection.gltfs.set(gltfData.id, gltfData);
    
                    gltfData.resolveCollisions();

                    resolve();
                });
            });
        }
    }

    public processMessage(client: Client, content: string)
    {
        const nickname = client.nickname;

        this.sendToAll<IPacketData_ChatMessage>(PACKET_TYPE.PACKET_CHAT_MESSAGE, {
            message: `<span style="color: white;">${nickname}: ${content}</span>`
        });

        if(content.startsWith("/test"))
        {
            const inventory = client.inventory!;
            
            const m4 = this.game.itemManager.makeItem("m4");
            inventory.addItemToAnySlot(m4);
            
            const ak = this.game.itemManager.makeItem("ak");
            inventory.addItemToAnySlot(ak);

            this.sendServerMessage("you received a M4 and AK");
        }
    }

    public giveStarterItems(client: Client)
    {
        const inventory = client.inventory!;
        const slotGroup = inventory.slotGroups[1];
        
        const pickaxe = this.game.itemManager.makeItem("pickaxe");
        slotGroup.addItemToAnySlot(pickaxe);

        const m4 = this.game.itemManager.makeItem("m4");
        slotGroup.addItemToAnySlot(m4);
        
        const ak = this.game.itemManager.makeItem("ak");
        slotGroup.addItemToAnySlot(ak);
    }

    public sendServerMessage(message: string)
    {
        this.sendMessage("gold", `[Server] ${message}`);
    }

    public sendMessage(color: string, message: string)
    {
        this.sendToAll<IPacketData_ChatMessage>(PACKET_TYPE.PACKET_CHAT_MESSAGE, {
            message: `<span style="color: ${color};">${message}</span>`
        });
    }
}

/*
const mesh = gltf.scene.children[0] as THREE.Mesh;

                // Convert the mesh to Ammo.js format
                const triangles = convertMeshToTriangles(mesh);
                */