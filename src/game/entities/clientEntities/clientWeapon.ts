import { Quaternion_Forward } from "../../../shared/ammo/quaterion";
import { THREEVector_GetDistanceFromDirection } from "../../../shared/three/vector";
import { ammoVector3ToThree, threeVector3ToAmmo } from "../../../shared/utils";
import { GameScene } from "../../scenes/gameScene";
import { ThreeScene } from "../../scenes/threeScene";
import { WeaponItem } from "../weaponItem";
import { ClientEntity } from "./clientEntity";

interface GunTracer {
    start: THREE.Vector3
    end: THREE.Vector3
    lifetime: number
    color: number
}

export class ClientWeapon extends ClientEntity
{
    public get weaponItem() { return this.entity as WeaponItem; }

    public tracers: GunTracer[] = [];

    public create()
    {
        super.create();
    }

    public update(delta: number)
    {
        super.update(delta);

        for(const tracer of this.tracers)
        {
            tracer.lifetime -= delta;
            if(tracer.lifetime <= 0)
            {
                continue;
            }
            
            //ThreeScene.Instance.drawLine(tracer.start, tracer.end, tracer.color);
        }
    }

    public addTracer(from: THREE.Vector3, to: THREE.Vector3, color: number)
    {   
        const line = ThreeScene.Instance.createLine(from, to, color);

        setTimeout(() => {
            ThreeScene.Instance.removeLine(line);
        }, 2000);
    }

    public shoot(from: THREE.Vector3, to: THREE.Vector3)
    {
        this.addTracer(from, to, 0xffff00);
    }
}