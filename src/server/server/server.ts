import { v4 as uuidv4 } from 'uuid';
import path from "path"
import { Game } from '../../game/game/game';
import { Loaders } from "@enable3d/ammo-on-nodejs";
import { gltfModels } from '../../game/constants/assets';
import { GLTFCollection, GLTFData } from '../../game/game/gltfCollection';
import { Client } from '../client/client';
import { Ped } from '../../game/entities/ped';
import { GameObject, GameObject_JSON, GameObjectType } from '../../game/gameObject/gameObject';
import { IPacketData_GameObjects, PACKET_TYPE } from '../../game/network/packet';
import { gameSettings } from '../../game/constants/config';
import { Triangle } from '../../game/gameObject/gameObjectCollision';
import { Vehicle } from '../../game/entities/vehicle';
import { Bike } from '../../game/entities/bike';

export class Server
{
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get game() { return this._game; }

    public clients: Client[] = [];

    private _id: string = uuidv4();
    private _name: string = "Server";
    private _game: Game;

    private _lastSentData: number = performance.now();

    private _entitiesInformation = new Map<typeof GameObject, GameObjectType>();

    constructor()
    {
        this._game = new Game();

        this._entitiesInformation.set(Ped, GameObjectType.PED);
        this._entitiesInformation.set(Vehicle, GameObjectType.VEHICLE);
        this._entitiesInformation.set(Bike, GameObjectType.BIKE);
    }

    public update(delta: number)
    {
        this.game.update(delta);

        const now = performance.now();

        if(now - this._lastSentData > gameSettings.serverSendDataInterval)
        {
            this._lastSentData = now;

            //console.log("Sending data")

            const data: IPacketData_GameObjects = {
                gameObjects: []
            }

            for(const gameObject of this.game.gameObjects.values())
            {
                let canSend = false;
                let gameObjectType: GameObjectType = GameObjectType.UNDEFINED;
                for(const pair of this._entitiesInformation)
                {
                    if(gameObject instanceof pair[0])
                    {
                        canSend = true;
                        gameObjectType = pair[1];
                    }
                }

                if(canSend)
                {
                    const json = gameObject.toJSON();

                    json.type = gameObjectType;
                    
                    //console.log(json.type)

                    data.gameObjects.push(json);
                }
            }

            for(const client of this.clients)
            {
                client.send(PACKET_TYPE.PACKET_GAME_OBJECTS, data);
            }
        }
    }

    public async loadModels()
    {
        const GLTFLoader = new Loaders.GLTFLoader()
        const assetsPath = path.resolve(__dirname, '../../../public/assets/');

        for(const asset of gltfModels)
        {
            const gltfPath = path.resolve(assetsPath, asset.path);

            console.log(`Loading model ${asset.key} from ${gltfPath}`);

            await new Promise<void>((resolve) => {
                GLTFLoader.load(gltfPath).then((gltf: any) => {

                    const gltfData = new GLTFData();
                    gltfData.id = asset.key;
                    gltfData.gltf = gltf;
    
                    this.game.gltfCollection.gltfs.set(gltfData.id, gltfData);
    
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