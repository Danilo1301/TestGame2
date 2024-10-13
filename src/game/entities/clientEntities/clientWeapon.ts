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

    public onShoot()
    {
        /*

        const cameraPos = GameScene.Instance.camera.getCameraPosition();
        const quat = this.weaponItem.weapon.ped!.lookDir;

        const position = this.entity.getPosition();

        const camStart = ammoVector3ToThree(cameraPos);
        const start = ammoVector3ToThree(position);

        const dir = Quaternion_Forward(quat);
        const dir_t = ammoVector3ToThree(dir);
        const add = dir_t.clone();
        add.multiplyScalar(20);

        const end = start.clone();
        end.add(add);

        this.tracers.push({
            start: camStart,
            end: end,
            lifetime: 2000,
            color: 0x00ff00
        });

        Ammo.destroy(cameraPos);
        //Ammo.destroy(cameraQuat);
        Ammo.destroy(dir);

        const rayFrom = threeVector3ToAmmo(camStart);
        const rayTo = threeVector3ToAmmo(end);

        const rayCallback = this.weaponItem.weapon.shootRay(rayFrom, rayTo)
        // Check if the ray hit anything

        if (rayCallback.hasHit()) {
            const hitPoint = rayCallback.get_m_hitPointWorld();
            const hitNormal = rayCallback.get_m_hitNormalWorld();
            const hitBody = rayCallback.get_m_collisionObject();

            console.log("Ray hit something!");
            console.log("Hit point:", hitPoint.x(), hitPoint.y(), hitPoint.z());
            console.log("Hit normal:", hitNormal.x(), hitNormal.y(), hitNormal.z());
            console.log("Hit body:", hitBody);

            this.tracers.push({
                start: start,
                end: ammoVector3ToThree(hitPoint),
                lifetime: 2000,
                color: 0xff0000
            });
        } else {
            console.log("Ray did not hit anything.");
        }

        Ammo.destroy(rayCallback);


        Ammo.destroy(rayFrom);
        Ammo.destroy(rayTo);
        */
    }
}