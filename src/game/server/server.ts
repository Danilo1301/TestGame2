import { v4 as uuidv4 } from 'uuid';
import path from "path"
import { Game } from '../game/game';
import { Loaders } from "@enable3d/ammo-on-nodejs";
import { gltfModels } from '../../game/constants/assets';
import { GLTFCollection, GLTFData } from '../../game/game/gltfCollection';
import { Client } from '../../server/client/client';
import { Ped } from '../entities/ped';
import { GameObject_JSON } from '../gameObject/gameObject';
import { IPacketData_GameObjects, PACKET_TYPE } from '../network/packet';

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

    constructor()
    {
        this._game = new Game();
    }

    public update(delta: number)
    {
        this.game.update(delta);

        const now = performance.now();

        if(now - this._lastSentData > 200)
        {
            this._lastSentData = now;

            //console.log("Sending data")

            const data: IPacketData_GameObjects = {
                gameObjects: []
            }

            for(const gameObject of this.game.gameObjects.values())
            {
                if(gameObject instanceof Ped)
                {
                    const json = gameObject.toJSON();
                    //console.log(json)

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