import THREE from "three";
import { ClientEntity } from "./clientEntity";
import { ThreeScene } from "../../three/threeScene";
import { Ped } from "../ped";
import { Quaternion_Forward } from "../../../utils/ammo/quaterion";

export class ClientPed extends ClientEntity {
    
    public get ped() { return this.entity as Ped; }

    public create()
    {
        super.create();
    }

    public update(delta: number)
    {
        super.update(delta);

        const body = this.entity.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

        const lookDir = this.ped.lookDir;

        const forward = Quaternion_Forward(lookDir);

        const start = new THREE.Vector3(position.x(), position.y(), position.z());

        const end = start.clone();
        end.x += forward.x();
        end.y += forward.y();
        end.z += forward.z();

        ThreeScene.Instance.drawLine(start, end, 0xff0000);

        Ammo.destroy(forward);
    }
}