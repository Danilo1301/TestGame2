import { Quaternion_Forward } from "../../shared/ammo/quaterion";
import { FormatVector3, Vector3_Clone } from "../../shared/ammo/vector";
import { BaseObject } from "../../shared/baseObject";
import { ammoVector3ToThree } from "../../shared/utils";
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

        console.log("shoot");

        const dir = Quaternion_Forward(this.ped!.lookDir);

        this.shootRay(this.ped!.cameraPosition, dir);

        Ammo.destroy(dir);
    }

    public shootRay(from: Ammo.btVector3, direction: Ammo.btVector3)
    {
        //console.log(`shootRay`);
        console.log(`from ${FormatVector3(from)}`);
        //console.log(`direction ${FormatVector3(direction)}`);

        
        const add = Vector3_Clone(direction);
        add.op_mul(20);
        
        const to = Vector3_Clone(from);
        to.op_add(add);

        console.log(`to ${FormatVector3(to)}`);

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

            const r = Ammo.btRigidBody.prototype.upcast(hitBody)

            const id = (r as any).uniqueId;

            const entity = this.ped!.game.entityFactory.entities.get(id)!;

            console.log(`hit ${entity.id}`)

            const force = new Ammo.btVector3(hitNormal.x(), hitNormal.y(), hitNormal.z());
            force.op_mul(-8000);

            const zero = new Ammo.btVector3(0, 0, 0);

            entity.body.activate();
            entity.body.applyForce(force, zero);

            Ammo.destroy(force);
            Ammo.destroy(zero);
        } else {
            console.log("did not hit anything");
        }

        this.ped!.game.events.emit("weapon_shot", this, ammoVector3ToThree(from), ammoVector3ToThree(to));

        Ammo.destroy(add);
        Ammo.destroy(to);
        Ammo.destroy(rayCallback);
    }

    public shootRay2(from: Ammo.btVector3, to: Ammo.btVector3)
    {
        const rayCallback = new Ammo.ClosestRayResultCallback(from, to);
    
        const world = this.ped!.game.serverScene.physics.physicsWorld;

        // Perform the ray test in the physics world
        world.rayTest(from, to, rayCallback);

        if(rayCallback.hasHit())
        {
            const hitBody = rayCallback.get_m_collisionObject();
            const hitPoint = rayCallback.get_m_hitPointWorld();
            const hitNormal = rayCallback.get_m_hitNormalWorld();

            const r = Ammo.btRigidBody.prototype.upcast(hitBody)

            const id = (r as any).uniqueId;

            const entity = this.ped!.game.entityFactory.entities.get(id)!;

            console.log(`hit ${entity.displayName}`)

            const force = new Ammo.btVector3(hitNormal.x(), hitNormal.y(), hitNormal.z());
            force.op_mul(-100);

            const zero = new Ammo.btVector3(0, 0, 0);

            entity.body.activate();
            entity.body.applyForce(force, zero);

            Ammo.destroy(force);
            Ammo.destroy(zero);

            this.ped!.game.events.emit("weapon_shot_tracer", this, ammoVector3ToThree(to));
        }


        // Clean up
        //Ammo.destroy(rayCallback);

        return rayCallback;
    }
}