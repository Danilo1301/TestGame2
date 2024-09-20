import { ServerClock } from "@enable3d/ammo-on-nodejs";
import { AmmoUtils } from "../../utils/ammo/ammoUtils";
import { BaseObject } from "../../utils/baseObject";
import { ServerScene } from "../scenes/serverScene";
import { EntityFactory } from "../entities/entityFactory";
import { GLTFCollection } from "../../utils/gltf/gltfCollection";

export class Game extends BaseObject
{
    public isServer: boolean = false;
    public serverScene: ServerScene;
    public entityFactory: EntityFactory;
    public ammoUtils: AmmoUtils;
    public gltfCollection = new GLTFCollection();
    
    private _prevAA: number = 0;

    constructor()
    {
        super()

        this.serverScene = new ServerScene(this);
        this.entityFactory = new EntityFactory(this);
        this.ammoUtils = new AmmoUtils();
    }

    public init()
    {
        this.serverScene.init();
        this.ammoUtils.physicsWorld = this.serverScene.physics.physicsWorld;
    }

    public update(delta: number)
    {
        for(const entity of this.entityFactory.entities.values()) entity.update(delta);
        
        this.serverScene.update(delta);

        const vec = new Ammo.btVector3(0, 0, 0);
        const aa = (vec as any).aa;
        Ammo.destroy(vec);

        const diff = aa - this._prevAA;
        if(diff > 1000)
        {
            this.log(`Possible memory leak detected! (aa: ${this._prevAA} -> ${aa}, ${diff})`);
            this._prevAA = aa;
        }
    }

    public startClock()
    {
        // clock
        const clock = new ServerClock()

        // for debugging you disable high accuracy
        // high accuracy uses much more cpu power
        if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()

        clock.onTick(delta => this.update(delta))
    }
}