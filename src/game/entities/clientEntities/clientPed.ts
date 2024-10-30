import { Ped } from "../ped";
import { ClientEntity } from "./clientEntity";
import { Quaternion_Forward } from "../../../shared/ammo/quaterion";
import THREE from "three";
import { THREELine, ThreeScene } from "../../scenes/threeScene";
import { threeVector3ToAmmo } from "../../../shared/utils";
import { Input } from "../../input";
import { Gameface } from "../../gameface/gameface";
import { WeaponItem } from "../weaponItem";
import { WorldText } from "../../worldText";

export class ClientPed extends ClientEntity
{
    public get ped() { return this.entity as Ped; }

    public nickNameWorldText = new WorldText(this.ped.nickname);

    private _prevEquipedWeapon: string = "";
    private _weaponItem?: WeaponItem;

    private _lookDirLine?: THREELine;
    private _inputDirLine?: THREELine;

    public create()
    {
        super.create();

        const height = 1.5;
        const calsuleRoundHeight = 0.2;

        //this.modelOffset.setY(-height/2 - calsuleRoundHeight);
    }

    public _mainAnimI = 0;
    public _subAnimI = 0;

    public update3DText()
    {
        super.update3DText();

        const position = this.entity.getPosition();

        this.nickNameWorldText.setTitle(this.ped.nickname);
        this.nickNameWorldText.set3DPosition(new THREE.Vector3(position.x(), position.y() + 2, position.z()));
        this.nickNameWorldText.position.y -= 40;
        this.nickNameWorldText.update();
    }

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

        let currentWeaponId = "";
        const weapon = this.ped.weapon;

        if(weapon)
        {
            currentWeaponId = weapon.weaponData.id;
        }

        if(currentWeaponId != this._prevEquipedWeapon)
        {
            this._prevEquipedWeapon = currentWeaponId;

            this.animationManager.playSubAnimationOnce("equip_m4");
            
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
            ped.equipWeapon("m4");
        }

        if(Input.getKeyDown("2") && this.entity == Gameface.Instance.player)
        {
            const ped = Gameface.Instance.player;

            ped.equipWeapon("ak");
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
        const pedPosition = this.ped.getPosition();
        const position = this.ped.cameraPosition;

        const lookDir = this.ped.lookDir;

        const forward = Quaternion_Forward(lookDir);

        const start = new THREE.Vector3(0, 0, 0);

        const end = start.clone();
        end.x += forward.x();
        end.y += forward.y();
        end.z += forward.z();

        if(!this._lookDirLine)
        {
            this._lookDirLine = ThreeScene.Instance.createLine(start, end, 0xffff00);
        }
        this._lookDirLine.setPosition(start, end);
        this._lookDirLine.line.position.set(position.x(), position.y() + 1, position.z());

        Ammo.destroy(forward);
    }

    private drawInputDirLine()
    {
        const inputDir = this.ped.getInputDir();
        const position = this.ped.getPosition();
        
        const vec = inputDir;
        const start = new THREE.Vector3(0, 0, 0);

        const end = start.clone();
        end.x += vec.x;
        end.y += vec.y;
        end.z += vec.z;

        if(!this._inputDirLine)
        {
            this._inputDirLine = ThreeScene.Instance.createLine(start, end, 0xffff00);
        }
        this._inputDirLine.setPosition(start, end);
        this._inputDirLine.line.position.set(position.x(), position.y() + 0.1, position.z());
    }
}