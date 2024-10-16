import { Quaternion_Forward } from "../../shared/ammo/quaterion";
import { FormatVector3, Vector3_Clone } from "../../shared/ammo/vector";
import { BaseObject } from "../../shared/baseObject";
import { ammoVector3ToThree } from "../../shared/utils";
import { Entity } from "../entities/entity";
import { Ped } from "../entities/ped";
import { Game } from "../game/game";

export interface WeaponData {
    id: number
    anim: string
}

export class Weapon extends BaseObject {

    public weaponData: WeaponData;

    public ped?: Ped;

    private _lastTimeShot: number = 0;

    constructor(weaponData: WeaponData)
    {
        super();
        this.weaponData = weaponData;
    }

    public canShoot()
    {
        const now = performance.now();
        if(now - this._lastTimeShot >= 300) return true;
        return false;
    }

    public shootFromPed()
    {
        // const from = this.ped!.getHeadAimPosition();

        // const dir = Quaternion_Forward(this.ped!.lookDir);

        // this.shoot(from, dir);

        // Ammo.destroy(dir);
        // Ammo.destroy(from);
    }

    public shoot()
    {
        const now = performance.now();

        this._lastTimeShot = now;

        //console.log("shoot");

        const dir = Quaternion_Forward(this.ped!.lookDir);

        this.shootDirection(this.ped!.cameraPosition, dir);

        Ammo.destroy(dir);
    }

    public shootDirection(from: Ammo.btVector3, direction: Ammo.btVector3)
    {
        this.shootDirectionEx(from, direction, true);
    }

    public shootDirectionEx(from: Ammo.btVector3, direction: Ammo.btVector3, dealDamage: boolean)
    {
        const add = Vector3_Clone(direction);
        add.op_mul(20);
        
        const to = Vector3_Clone(from);
        to.op_add(add);
        
        this.shootEx(from, to, dealDamage);

        Ammo.destroy(to);
        Ammo.destroy(add);
    }

    public shootEx(from: Ammo.btVector3, to: Ammo.btVector3, dealDamage: boolean)
    {
        let bulletHitPosition = ammoVector3ToThree(to);
        let entityHit: Entity | undefined;
        
        // ray

        const rayCallback = new Ammo.ClosestRayResultCallback(from, to);
    
        const world = this.ped!.game.serverScene.physics.physicsWorld;

        // Perform the ray test in the physics world
        world.rayTest(from, to, rayCallback);

        if(rayCallback.hasHit())
        {
            const hitBody = rayCallback.get_m_collisionObject();
            const hitPoint = rayCallback.get_m_hitPointWorld();
            const hitNormal = rayCallback.get_m_hitNormalWorld();

            bulletHitPosition = ammoVector3ToThree(hitPoint);

            //console.log(`\nweapon hit`);
            //console.log(`body: `, hitBody);

            const r = Ammo.btRigidBody.prototype.upcast(hitBody)

            //console.log(`rigidBody: `, r);

            if(r)
            {
                const id = (r as any).uniqueId;

                const entity = this.ped!.game.entityFactory.entities.get(id)!;
                
                entityHit = entity;

                console.log(`weapon hit ${entity.id}`)

                if(dealDamage && !entity.invincible)
                {
                    if(entity.game.isServer)
                    {
                        this.processWeaponDamage(entity);
                    }

                    const force = new Ammo.btVector3(hitNormal.x(), hitNormal.y(), hitNormal.z());
                    force.op_mul(-8000);

                    const zero = new Ammo.btVector3(0, 0, 0);

                    entity.body.activate();
                    entity.body.applyForce(force, zero);

                    Ammo.destroy(force);
                    Ammo.destroy(zero);
                }
            } else {
                console.log("weapon hit an entity with unknown body")
            }
        } else {
            console.log("weapon did not hit anything");
        }

        this.ped!.game.events.emit("weapon_shot", this, ammoVector3ToThree(from), bulletHitPosition, entityHit);

        Ammo.destroy(rayCallback);
    }

    public processWeaponDamage(entity: Entity)
    {
        entity.health -= 22;

        if(entity.health <= 0)
        {
            entity.setPosition(0, 3, 0);
            entity.health = 100;
        }
    }
}