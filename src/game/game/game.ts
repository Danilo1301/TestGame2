import { ServerClock } from "@enable3d/ammo-on-nodejs";
import { AmmoUtils } from "../../utils/ammo/ammoUtils";
import { BaseObject } from "../../utils/baseObject";
import { ServerScene } from "../scenes/serverScene";
import { EntityFactory } from "../entities/entityFactory";
import { GLTFCollection } from "../../utils/gltf/gltfCollection";
import { MemoryDetector } from "./memoryDetector";
import { Weapons } from "../weapons/weapons";

export class Game extends BaseObject
{
    public isServer: boolean = false;
    public serverScene: ServerScene;
    public entityFactory: EntityFactory;
    public ammoUtils: AmmoUtils;
    public gltfCollection = new GLTFCollection();
    public weapons = new Weapons();

    constructor()
    {
        super()

        this.serverScene = new ServerScene(this);
        this.entityFactory = new EntityFactory(this);
        this.ammoUtils = new AmmoUtils();
    }

    public init()
    {
        this.weapons.init();

        this.serverScene.init();
        this.ammoUtils.physicsWorld = this.serverScene.physics.physicsWorld;
    }

    public preUpdate(delta: number)
    {
    }

    public update(delta: number)
    {
        //this.log("update game entities");

        for(const entity of this.entityFactory.entities.values()) entity.update(delta);
        
        this.serverScene.update(delta);
    }

    public postUpdate(delta: number)
    {
    }
}