import { v4 as uuidv4 } from 'uuid';
import { Game } from '../../game/game/game';
import { Client } from '../client/client';
import { Loaders } from '@enable3d/ammo-on-nodejs';
import path from 'path';
import { Entity, EntityType } from '../../game/entities/entity';
import { Ped } from '../../game/entities/ped';
import { IPacketData_Entities, PACKET_TYPE } from '../../game/network/packet';
import { Box } from '../../game/entities/box';
import { BaseObject } from '../../shared/baseObject';
import { gameSettings } from "../../shared/constants/gameSettings";
import { gltfModels } from "../../shared/constants/assets";
import { GLTFData } from '../../shared/gltf/gltfData';

export class Server extends BaseObject
{
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get game() { return this._game; }

    public clients: Client[] = [];
    public assetsPath: string = "";

    private _id: string = uuidv4();
    private _name: string = "Server";
    private _game: Game;

    private _lastSentData: number = performance.now();

    constructor()
    {
        super();
        this._game = new Game();
        this._game.isServer = true;
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

    private processSendData()
    {
        const now = performance.now();

        if(now - this._lastSentData > gameSettings.serverSendDataInterval)
        {
            this._lastSentData = now;

            //this.log("sending data");

            this.sendData();
        }
    }

    public sendData()
    {
        const data: IPacketData_Entities = {
            entities: []
        }

        for(const entity of this.game.entityFactory.entities.values())
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

            //console.log(entity.displayName, canSend)

            if(canSend)
            {
                const json = entity.toJSON();
                json.type = entityType;
                
                data.entities.push(json);
            }
        }

        for(const client of this.clients)
        {
            client.send(PACKET_TYPE.PACKET_ENTITIES, data);
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
}

/*
const mesh = gltf.scene.children[0] as THREE.Mesh;

                // Convert the mesh to Ammo.js format
                const triangles = convertMeshToTriangles(mesh);
                */