import { Ped } from "../ped";
import { ClientEntity } from "./clientEntity";
import { Quaternion_Forward } from "../../../shared/ammo/quaterion";
import THREE from "three";
import { ThreeScene } from "../../scenes/threeScene";
import { threeVector3ToAmmo } from "../../../shared/utils";
import { Input } from "../../input";
import { Gameface } from "../../gameface/gameface";
import { WeaponItem } from "../weaponItem";

export class ClientPed extends ClientEntity
{
    public get ped() { return this.entity as Ped; }

    private _prevEquipedWeapon: number = -1;
    private _weaponItem?: WeaponItem;

    public create()
    {
        super.create();

        const height = 1.5;
        const calsuleRoundHeight = 0.2;

        //this.modelOffset.setY(-height/2 - calsuleRoundHeight);
    }

    public _mainAnimI = 0;
    public _subAnimI = 0;

    public update(delta: number)
    {
        super.update(delta);

        //this.updateHeadBone();

        this.drawLookDirLine();
        this.drawInputDirLine();

        this.updateWalkAnimations();
        this.updateWeaponItem();
        this.updatePlayerInput();

        //this.updateStupid();

    }

    private updateHeadBone()
    {
        const object = this.gltfModel?.object;

        if(!object) return;

        const skeletonobj = object.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh | undefined;

        if(!skeletonobj) return;

        const skeleton = skeletonobj.skeleton;

        for(const bone of skeleton.bones)
        {
            if(bone.name.includes("head"))
            {
                const lookDir = this.ped.lookDir;

                const forward = Quaternion_Forward(lookDir);

                this.setBoneFacingDirection(bone, new THREE.Vector3(forward.x(), forward.y(), forward.z()))

                Ammo.destroy(forward);
            }
        }
    }

    private updateWalkAnimations()
    {
        if(!this.gltfModel) return;

        const inputDir = this.ped.getInputDir();
            
        let animName = "idle";

        if(this._weaponItem) animName += `_m4`;

        if(inputDir.length() > 0)
        {
            animName = "walk";

            if(this._weaponItem) animName += `_m4`;
        }

        if(!this.animationManager.isPlayingAnim(animName))
            this.animationManager.playAnimationLoop(animName);

        //weapon

        let currentWeaponId = -1;
        const weapon = this.ped.weapon;

        if(weapon)
        {
            currentWeaponId = weapon.weaponData.id;
        }

        if(currentWeaponId != this._prevEquipedWeapon)
        {
            this._prevEquipedWeapon = currentWeaponId;

            if(weapon)
            {
                this._weaponItem = this.ped.game.entityFactory.spawnWeaponItem(weapon);
            }
        }

        if(this.ped.aiming)
        {
            if(!this.animationManager.isPlayingAnim("aim_m4"))
            {
                this.animationManager.playSubAnimationAndStop("aim_m4");
            }
        } else {
            if(this.animationManager.isPlayingAnim("aim_m4"))
            {
                this.animationManager.stopSubAnimation();
            }
        }
    }

    private updateWeaponItem()
    {
        if(!this._weaponItem) return;

        const weaponItem = this._weaponItem;

        const bone = this.getBone("item_R");

        if(!bone) return;
        
        const boneWorldPosition = new THREE.Vector3(0, 0, 0);
        bone.getWorldPosition(boneWorldPosition);

        const boneWorldQuaternion = new THREE.Quaternion();
        bone.getWorldQuaternion(boneWorldQuaternion);

        weaponItem.setPosition(boneWorldPosition.x, boneWorldPosition.y, boneWorldPosition.z);
        weaponItem.setRotation(boneWorldQuaternion.x, boneWorldQuaternion.y, boneWorldQuaternion.z, boneWorldQuaternion.w);
        
    }

    private updatePlayerInput()
    {
        if(!this.gltfModel) return;
        
        const ped = Gameface.Instance.player;

        if(ped != this.ped) return;

        if(Input.getKeyDown("1"))
        {
            if(ped.weapon)
            {
                ped.equipWeapon(-1);
            } else {
                ped.equipWeapon(1);
            }
        }

        if(Input.getKeyDown("2") && this.entity == Gameface.Instance.player)
        {
            const ped = Gameface.Instance.player;

            ped.equipWeapon(1);

            ped.game.entityFactory.spawnEmptyEntity(0, 5, 0);
        }

        if(Input.getKeyDown("Z"))
        {
            this._mainAnimI++;

            if(this._mainAnimI == 1)
            {
                this.animationManager.playAnimationLoop("walk");
            }
            if(this._mainAnimI == 2)
            {
                this.animationManager.playAnimationLoop("idle");
            }
            if(this._mainAnimI == 3)
            {
                this._mainAnimI = 0;
                this.animationManager.stopMainAnimation();
            }
        }

        if(Input.getKeyDown("X"))
        {
            this._subAnimI++;

            if(this._subAnimI == 1)
            {
                this.animationManager.playSubAnimationAndStop("aim_m4");
            }
            if(this._subAnimI == 2)
            {
                this.animationManager.playSubAnimationLoop("equip_m4");
            }
            if(this._subAnimI == 3)
            {
                this.animationManager.playSubAnimationLoop("aim_m4");
            }
            if(this._subAnimI == 4)
            {
                this._subAnimI = 0;
                this.animationManager.stopSubAnimation();
            }
        }
    }

    private drawLookDirLine()
    {
        const position = this.ped.cameraPosition;

        const lookDir = this.ped.lookDir;

        const forward = Quaternion_Forward(lookDir);

        const start = new THREE.Vector3(position.x(), position.y(), position.z());

        const end = start.clone();
        end.x += forward.x();
        end.y += forward.y();
        end.z += forward.z();

        ThreeScene.Instance.drawLine(start, end, 0xffff00);

        Ammo.destroy(forward);
    }

    private drawInputDirLine()
    {
        const inputDir = this.ped.getInputDir();
        const position = this.ped.getPosition();
        
        const vec = inputDir;
        const start = new THREE.Vector3(position.x(), position.y(), position.z());

        const end = start.clone();
        end.x += vec.x;
        end.y += vec.y;
        end.z += vec.z;

        ThreeScene.Instance.drawLine(start, end, 0xffff00);
    }
}