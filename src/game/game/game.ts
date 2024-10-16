import Phaser from "phaser";
import { AmmoUtils } from "../../shared/ammo/ammoUtils";
import { BaseObject } from "../../shared/baseObject";
import { EntityFactory } from "../entities/entityFactory";
import { ServerScene } from "../scenes/serverScene";
import { Weapons } from "../weapons/weapons";
import { GLTFCollection } from "../../shared/gltf/gltfCollection";
import { Entity, EntityType } from "../entities/entity";
import { Ped } from "../entities/ped";
import { Box } from "../entities/box";
import { Vector3_DistanceTo } from "../../shared/ammo/vector";
import { Vehicle } from "../entities/vehicle";
import { Bike } from "../entities/bike";
import { Ball } from "../entities/ball";

export class Game extends BaseObject
{
    public isServer: boolean = false;

    public events = new Phaser.Events.EventEmitter();

    public get serverScene() { return this._serverScene; };
    public get ammoUtils() { return this._ammoUtils; };
    public get entityFactory() { return this._entityFactory; };
    public get weapons() { return this._weapons; }
    public get gltfCollection() { return this._gltfCollection; }
    public get entitiesInformation() { return this._entitiesInformation; }

    private _serverScene = new ServerScene(this);
    private _ammoUtils = new AmmoUtils();
    private _entityFactory = new EntityFactory(this);
    private _weapons = new Weapons();
    private _gltfCollection = new GLTFCollection();
    private _entitiesInformation = new Map<typeof Entity, EntityType>();

    constructor()
    {
        super();
    }

    public init()
    {
        this._entitiesInformation.set(Ped, EntityType.PED);
        this._entitiesInformation.set(Box, EntityType.BOX);
        this._entitiesInformation.set(Ball, EntityType.BALL);
        this._entitiesInformation.set(Bike, EntityType.BIKE);
        this._entitiesInformation.set(Vehicle, EntityType.VEHICLE);

        this.weapons.init();
        this.serverScene.init();
        this.ammoUtils.physicsWorld = this.serverScene.physics.physicsWorld;
    }

    public create()
    {
        this.serverScene.create();

        if(this.isServer)
        {
            this.serverScene.createServerScene();

        } else {
            this.serverScene.createLocalScene();
        }
    }

    public preUpdate(delta: number)
    {
    }

    public update(delta: number)
    {
        for(const entity of this.entityFactory.entities.values()) entity.update(delta);
        
        this.serverScene.update(delta);

        for(const entity of this.entityFactory.entities.values())
        {
            const position = entity.getPosition();
            const zero = new Ammo.btVector3(0, 2, -20);

            if(Vector3_DistanceTo(position, zero) > this.serverScene.groundSize)
            {
                console.log(`${entity.displayName} is too far from spawn`);

                entity.setPosition(zero.x(), zero.y(), zero.z());
            }

            Ammo.destroy(zero);
        }
    }

    public postUpdate(delta: number)
    {
    }
}