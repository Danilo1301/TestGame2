import THREE from "three";
import { Entity } from "../entity";
import { GameScene } from "../../scenes/gameScene";
import { Gameface } from "../../gameface/gameface";
import { ClientEntity } from "./clientEntity";
import { BaseObject } from "../../../utils/baseObject";
import { Ped } from "../ped";
import { ClientPed } from "./clientPed";

export class ClientEntityManager extends BaseObject {
    public gameScene: GameScene;

    public clientEntities = new Map<Entity, ClientEntity>();

    constructor(gameScene: GameScene)
    {
        super();
        this.gameScene = gameScene;
    }

    public preUpdate(delta: number)
    {
        for(const clientEntity of this.clientEntities.values())
        {
            clientEntity.preUpdate(delta);
        }
    }

    public update(delta: number)
    {
        const entities = Gameface.Instance.game.entityFactory.entities.values();

        for(const entity of entities)
        {
            if(!this.clientEntities.has(entity))
            {
                this.log("create ClientEntity...");

                let clientEntity: ClientEntity | undefined;
                if(entity instanceof Ped)
                {
                    clientEntity = new ClientPed(entity);
                } else {
                    clientEntity = new ClientEntity(entity);
                }

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

            const clientGameObject = this.clientEntities.get(entity)!;
            clientGameObject.destroy();
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
}