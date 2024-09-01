import { v4 as uuidv4 } from 'uuid';
import path from "path"
import { Game } from '../game/game';
import { Loaders } from "@enable3d/ammo-on-nodejs";
import { gltfModels } from '../../game/constants/assets';
import { GLTFCollection, GLTFData } from '../../game/game/gltfCollection';

export class Server
{
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get game() { return this._game; }

    private _id: string = uuidv4();
    private _name: string = "Server";
    private _game: Game;

    constructor()
    {
        this._game = new Game();
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