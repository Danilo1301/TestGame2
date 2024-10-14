import THREE from "three";
import { Entity } from "../entity";
import { Gameface } from "../../gameface/gameface";
import { ClientEntity } from "./clientEntity";
import { BaseObject } from "../../../shared/baseObject";
import { GameScene } from "../../scenes/gameScene";
import { Ped } from "../ped";
import { ClientPed } from "./clientPed";
import { ClientWeapon } from "./clientWeapon";
import { Weapon } from "../../weapons/weapon";
import { WeaponItem } from "../weaponItem";
import { ammoVector3ToThree } from "../../../shared/utils";
import { THREEVector3_GetDirectionBetweenVectors, THREEVector_GetDistanceFromDirection } from "../../../shared/three/vector";
import { AudioManager } from "../../audioManager";
import { gameSettings } from "../../../shared/constants/gameSettings";


export class ClientEntityManager extends BaseObject {
    public gameScene: GameScene;

    public clientEntities = new Map<Entity, ClientEntity>();

    public entitiesClassMap = new Map<typeof Entity, typeof ClientEntity>();

    constructor(gameScene: GameScene)
    {
        super();
        this.gameScene = gameScene;

        this.entitiesClassMap.set(Ped, ClientPed);
        this.entitiesClassMap.set(WeaponItem, ClientWeapon);
    }

    public preUpdate(delta: number)
    {
        for(const clientEntity of this.clientEntities.values())
        {
            clientEntity.preUpdate(delta);
        }
    }

    public createClientEntityByType(entity: Entity)
    {
        let clientEntity: ClientEntity | undefined;

        console.log(entity, entity instanceof Ped)

        for(const t of this.entitiesClassMap)
        {
            const ec = t[0];
            const cc = t[1];

            if(entity instanceof ec)
            {
                console.log("create ped client")

                clientEntity = new cc(entity);
                break;
            }
        }

        if(!clientEntity) clientEntity = new ClientEntity(entity);

        return clientEntity;
    }

    public update(delta: number)
    {
        const entities = Gameface.Instance.game.entityFactory.entities.values();

        for(const entity of entities)
        {
            if(!this.clientEntities.has(entity))
            {
                this.log("create ClientEntity...");

                const clientEntity = this.createClientEntityByType(entity);
                this.clientEntities.set(entity, clientEntity);
                clientEntity.create();
            }
        }

        const destroyedEntities: Entity[] = [];
        for(const clientEntity of this.clientEntities.values())
        {
            if(clientEntity.entity.destroyed)
            {
                destroyedEntities.push(clientEntity.entity);
                continue;
            }
            clientEntity.update(delta);
        }
        for(const entity of destroyedEntities)
        {
            this.log("destroying ClientEntity...");

            const clientEntity = this.clientEntities.get(entity)!;
            clientEntity.destroy();
            this.clientEntities.delete(entity);
        }
    }

    public postUpdate(delta: number)
    {
        for(const clientEntity of this.clientEntities.values())
        {
            clientEntity.postUpdate(delta);
        }
    }

    public onWeaponShot(weapon: Weapon, from: THREE.Vector3, to: THREE.Vector3)
    {
        const cameraPosition = GameScene.Instance.camera.position;

        const cameraPosition_t = ammoVector3ToThree(cameraPosition);
        const distance = cameraPosition_t.distanceTo(from);

        let vol = Math.max(10-distance, 0)/10;
        if(vol <= 0) vol = 0.01;

        var audio = AudioManager.createAudio('shot_m4');
        audio.volume = 0.1 * vol;
        audio.play();
    
        for(const [entity, clientEntity] of this.clientEntities)
        {
            if(!(clientEntity instanceof ClientWeapon)) continue;

            const clientWeapon = clientEntity;

            if(clientWeapon.weaponItem.weapon != weapon) continue;

            if(gameSettings.showRedTracer)
                clientWeapon.addTracer(from, to, 0xff0000);

            const weaponPosition = ammoVector3ToThree(clientWeapon.weaponItem.getPosition()); 

            //const dir = THREEVector3_GetDirectionBetweenVectors(weaponPosition, to);
            clientWeapon.shoot(weaponPosition, to);

        }
    }
}