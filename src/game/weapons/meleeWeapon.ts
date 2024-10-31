import { Quaternion_Forward } from "../../shared/ammo/quaterion";
import { FormatVector3, Vector3_Clone } from "../../shared/ammo/vector";
import { BaseObject } from "../../shared/baseObject";
import { ammoVector3ToThree } from "../../shared/utils";
import { Entity } from "../entities/entity";
import { Ped } from "../entities/ped";
import { Game } from "../game/game";
import { BasicWeaponData } from "./weapon";

export interface MeleeWeaponData extends BasicWeaponData {
    attackTime: number
    attackCooldown: number
}

export class MeleeWeapon extends BaseObject {

    public meleeWeaponData: MeleeWeaponData;

    public ped?: Ped;

    private _lastTimeAttack: number = 0;

    constructor(meleeWeaponData: MeleeWeaponData)
    {
        super();
        this.meleeWeaponData = meleeWeaponData;
    }

    public canAttack()
    {
        const now = performance.now();
        if(now - this._lastTimeAttack >= this.meleeWeaponData.attackCooldown) return true;
        return false;
    }

    public attack()
    {
        const now = performance.now();

        this._lastTimeAttack = now;

        this.ped!.game.events.emit("melee_weapon_attack", this);

        console.warn("attack");
    }

    public processWeaponDamage(entity: Entity)
    {
        entity.health -= 22;

        if(entity.health <= 0)
        {
            this.ped!.game.onEntityDeath(entity, undefined, this.meleeWeaponData.id);
        }

        // const force = new Ammo.btVector3(0, 1, 0);
        // force.op_mul(8000);

        // const zero = new Ammo.btVector3(0, 0, 0);

        // entity.body.activate();
        // entity.body.applyForce(force, zero);

        // Ammo.destroy(force);
        // Ammo.destroy(zero);
    }
}