import { v4 as uuidv4 } from 'uuid';
import { Game } from '../../game/game/game';
import { Client } from '../client/client';
import { Loaders } from '@enable3d/ammo-on-nodejs';
import path from 'path';
import { Entity, Entity_Info_Basic, Entity_JSON, EntityType } from '../../game/entities/entity';
import { Ped } from '../../game/entities/ped';
import { IPacket, IPacketData, IPacketData_Entities, IPacketData_Entity_Info_Basic, IPacketData_Health, IPacketData_WeaponShot, PACKET_TYPE } from '../../game/network/packet';
import { Box } from '../../game/entities/box';
import { BaseObject } from '../../shared/baseObject';
import { gameSettings } from "../../shared/constants/gameSettings";
import { gltfModels } from "../../shared/constants/assets";
import { GLTFData } from '../../shared/gltf/gltfData';
import { Weapon } from '../../game/weapons/weapon';
import { EntityWatcher } from './entityWatcher';
import { ObjectGroup } from '../../shared/objectWatcher/objectGroup';

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
            console.log("broadcast this weapon_shot")

            this.sendToAll<IPacketData_WeaponShot>(PACKET_TYPE.PACKET_WEAPON_SHOT, {
                hit: [to.x, to.y, to.z],
                byPed: weapon!.ped!.id
            });
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

            this.entityWatcher.check();

            //this.broadcastEntities();
        }
    }

    public broadcastEntityHealth(entity: Entity)
    {
        this.sendToAll<IPacketData_Health>(PACKET_TYPE.PACKET_HEALTH, {
            entityId: entity.id,
            health: entity.health
        });
    }

    public broadcastEntities()
    {
        for(const client of this.clients)
        {
            if(!client.isReady) continue;

            const packetData: IPacketData_Entities = {
                entities: []
            }

            for(const [_id, entity] of this.game.entityFactory.entities)
            {
                let sendFullData = !client.entitiesCreated.includes(entity.id);

                const json = this.getEntityJson(entity, sendFullData);

                if(json)
                {
                    if(sendFullData)
                    {
                        console.log(`sending entity full data of: ${entity.displayName} (${json.fullData?.type})`);
                    }

                    client.entitiesCreated.push(entity.id);

                    packetData.entities.push(json);
                }
            }

            client.send(PACKET_TYPE.PACKET_ENTITIES, packetData);
        }
    }

    public getEntityJson(entity: Entity, getFullData: boolean)
    {
        let canSend = false;
        let entityType: EntityType = EntityType.UNDEFINED;

        for(const pair of this.game.entitiesInformation)
        {
            if(entity instanceof pair[0])
            {
                canSend = true;
                entityType = pair[1];
            }
        }

        if(!canSend) return undefined;

        const data = getFullData ? entity.toFullJSON() : entity.toJSON();

        if(data.fullData)
        {
            data.fullData.type = entityType;
        }
                
        return data;
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
}

/*
const mesh = gltf.scene.children[0] as THREE.Mesh;

                // Convert the mesh to Ammo.js format
                const triangles = convertMeshToTriangles(mesh);
                */