import { AmmoUtils } from "../../shared/ammo/ammoUtils";
import { BaseObject } from "../../shared/baseObject";
import { EntityFactory } from "../entities/entityFactory";
import { ServerScene } from "../scenes/serverScene";
import { Weapons } from "../weapons/weapons";

export class Game extends BaseObject
{
    public isServer: boolean = false;

    public events = new Phaser.Events.EventEmitter();

    public get serverScene() { return this._serverScene; };
    public get ammoUtils() { return this._ammoUtils; };
    public get entityFactory() { return this._entityFactory; };
    public get weapons() { return this._weapons; }

    private _serverScene = new ServerScene(this);
    private _ammoUtils = new AmmoUtils();
    private _entityFactory = new EntityFactory(this);
    private _weapons = new Weapons();

    constructor()
    {
        super()
    }

    public init()
    {
        this.weapons.init();
        this.serverScene.init();
        this.ammoUtils.physicsWorld = this.serverScene.physics.physicsWorld;
    }

    public create()
    {
        this.serverScene.create();
    }

    public preUpdate(delta: number)
    {
    }

    public update(delta: number)
    {
        for(const entity of this.entityFactory.entities.values()) entity.update(delta);
        
        this.serverScene.update(delta);
    }

    public postUpdate(delta: number)
    {
    }
}