import THREE, { Quaternion } from "three";
import { ClientEntity } from "./clientEntity";
import { ThreeScene } from "../../three/threeScene";
import { Ped } from "../ped";
import { FormatQuaternion, Quaternion_Difference, Quaternion_Forward, Quaternion_ToEuler, Quaternion_ToEuler_2 } from "../../../utils/ammo/quaterion";
import { ammoVector3ToThree, threeQuaternionToAmmo, threeVector3ToAmmo } from "../../../utils/utils";
import { FormatVector3, getTurnDirectionSignal, rotateVectorAroundY, vectorToQuaternion } from "../../../utils/ammo/vector";
import { rotateQuaternion, THREEQuaternion_Difference } from "../../../utils/three/quaternion";
import { Input } from "../../../utils/input/input";

export class ClientPed extends ClientEntity {
    
    public get ped() { return this.entity as Ped; }

    public create()
    {
        super.create();
    }

    public update(delta: number)
    {
        super.update(delta);

        this.drawLookDirLine();
    }

    private drawLookDirLine()
    {
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

