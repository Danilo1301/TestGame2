import THREE, { Quaternion } from "three";
import { ClientEntity } from "./clientEntity";
import { ThreeScene } from "../../three/threeScene";
import { Ped } from "../ped";
import { FormatQuaternion, Quaternion_Difference, Quaternion_Forward, Quaternion_ToEuler, Quaternion_ToEuler_2 } from "../../../utils/ammo/quaterion";
import { ammoVector3ToThree, threeQuaternionToAmmo, threeVector3ToAmmo } from "../../../utils/utils";
import { FormatVector3, getTurnDirectionSignal, rotateVectorAroundY, vectorToQuaternion } from "../../../utils/ammo/vector";
import { rotateQuaternion, THREEQuaternion_Difference } from "../../../utils/three/quaternion";
import { Input } from "../../../utils/input/input";
import { Gameface } from "../../gameface/gameface";
import { WeaponItem } from "../weaponItem";

export class ClientPed extends ClientEntity {
    
    public get ped() { return this.entity as Ped; }

    public weaponItem?: WeaponItem;

    private _prevEquipedWeapon: number = -1;

    public create()
    {
        super.create();
    }

    public update(delta: number)
    {
        super.update(delta);

        this.drawLookDirLine();

        const velocity = this.entity.body.getLinearVelocity();
        const isMoving = Math.abs(velocity.x()) > 0.1 || Math.abs(velocity.z()) > 0.1;

        if(isMoving)
        {
            if(this.animationManager.baseAnimName != "walk_m4")
            {
                this.animationManager.stopAnimation();
                this.animationManager.playAnimationLoop("walk_m4");
            }

            if(this.animationManager.baseAction)
            {
                //this.animationManager.baseAction.weight = Math.min(velocity.length() * 0.5, 1);
            }

        } else {
            if(this.animationManager.baseAnimName != "idle_m4")
            {
                this.animationManager.stopAnimation();
                this.animationManager.playAnimationLoop("idle_m4");
            }
        }
        if(Input.getKeyDown("B") && this.entity == Gameface.Instance.player)
        {
            this.animationManager.playSubAnimationAndStop("action1");
        }

        if(Input.getKeyDown("1") && this.entity == Gameface.Instance.player)
        {
            const ped = Gameface.Instance.player;

            
            ped.equipWeapon(0);
            
            this.weaponItem = ped.game.entityFactory.spawnWeaponItem(ped.weapon!);

            ped.game.entityFactory.removeEntityCollision(this.weaponItem);
        }

        if(Input.getKeyDown("2") && this.entity == Gameface.Instance.player)
        {
            const ped = Gameface.Instance.player;

            ped.equipWeapon(1);
        }

        if(this.entity == Gameface.Instance.player)
        {
            const ped = this.ped;

            const weapon = ped.weapon;

            if(weapon)
            {
                if(weapon.weaponData.id != this._prevEquipedWeapon)
                {
                    this._prevEquipedWeapon = weapon.weaponData.id;

                    this.animationManager.playSubAnimation("equip_m4");
                }
            }
        }

        if(this.weaponItem)
        {
            const bone = this.getBone("Item_R");

            if(bone)
            {
                const boneWorldPosition = new THREE.Vector3();
                bone.getWorldPosition(boneWorldPosition);

                const boneWorldQuaternion = new THREE.Quaternion();
                bone.getWorldQuaternion(boneWorldQuaternion);

                this.weaponItem.setPosition(boneWorldPosition.x, boneWorldPosition.y, boneWorldPosition.z);
                this.weaponItem.setRotation(boneWorldQuaternion.x, boneWorldQuaternion.y, boneWorldQuaternion.z, boneWorldQuaternion.w);

            }
        }
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

