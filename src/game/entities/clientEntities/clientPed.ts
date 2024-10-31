import THREE from "three";
import { Ped } from "../ped";
import { ClientEntity } from "./clientEntity";
import { Quaternion_Forward } from "../../../shared/ammo/quaterion";
import { THREELine, ThreeScene } from "../../scenes/threeScene";
import { threeVector3ToAmmo } from "../../../shared/utils";
import { Input } from "../../input";
import { Gameface } from "../../gameface/gameface";
import { WeaponItem } from "../weaponItem";
import { WorldText } from "../../worldText";
import { HandItem } from "../handItem";
import { MeleeWeapon } from "../../weapons/meleeWeapon";
import { MeleeWeaponItem } from "../meleeWeaponItem";

export class ClientPed extends ClientEntity
{
    public get ped() { return this.entity as Ped; }

    public nickNameWorldText = new WorldText(this.ped.nickname);

    private _prevItemOnHand: string = "";

    private _handItem?: HandItem;

    private _lookDirLine?: THREELine;
    private _inputDirLine?: THREELine;

    private _isAiming: boolean = false;

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

        this.updateItemOnHand();
        this.updateWalkAnimations();
        this.updatePlayerInput();
        

        //this.updateStupid();

    }

    private updateItemOnHand()
    {
        if(this._prevItemOnHand != this.ped.itemOnHand)
        {
            this._prevItemOnHand = this.ped.itemOnHand;

            const itemManager = this.ped.game.itemManager;
            const itemData = itemManager.getItemData(this.ped.itemOnHand);

            if(!itemData)
            {
                console.error("Item not found");

                this._handItem = undefined;

                return;
            }

            let handItem: HandItem | undefined;

            if(itemData.weaponId != undefined)
            {
                const weapons = this.ped.game.weapons;

                if(weapons.getWeaponData(itemData.id))
                {
                    handItem = this.ped.game.entityFactory.spawnHandItem(WeaponItem, itemData);
                    (handItem as WeaponItem).weapon = this.ped.weapon!;
                }

                if(weapons.getMeleeWeaponData(itemData.id))
                {
                    handItem = this.ped.game.entityFactory.spawnHandItem(MeleeWeaponItem, itemData);
                    (handItem as MeleeWeaponItem).meleeWeapon = this.ped.meleeWeapon!;
                }
            }

            if(!handItem) handItem = this.ped.game.entityFactory.spawnHandItem(HandItem, itemData);
            
            handItem.itemData = itemData;

            this._handItem = handItem;
        }

        // place handItem on hand

        if(!this._handItem) return;

        const handItem = this._handItem;

        const bone = this.getBone("item_R");

        if(!bone) return;
        
        const boneWorldPosition = new THREE.Vector3(0, 0, 0);
        bone.getWorldPosition(boneWorldPosition);

        const boneWorldQuaternion = new THREE.Quaternion();
        bone.getWorldQuaternion(boneWorldQuaternion);

        handItem.setPosition(boneWorldPosition.x, boneWorldPosition.y, boneWorldPosition.z);
        handItem.setRotation(boneWorldQuaternion.x, boneWorldQuaternion.y, boneWorldQuaternion.z, boneWorldQuaternion.w);
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

        const handItem = this._handItem;

        if(handItem)
        {
            if(handItem instanceof WeaponItem)
            {
                animName += `_m4`;
            } else {
                if(handItem.itemData.animIdle != undefined) animName = handItem.itemData.animIdle;
            }
        }

        if(inputDir.length() > 0)
        {
            animName = "walk";

            if(handItem)
            {
                if(handItem instanceof WeaponItem)
                {
                    animName += `_m4`;
                } else {
                    animName += `_m4`;
                }
            }
        }

        if(!this.animationManager.isPlayingAnim(animName))
            this.animationManager.playAnimationLoop(animName);

        //weapon

        if(this.ped.aiming)
        {
            if(handItem instanceof WeaponItem)
            {
                this._isAiming = true;

                let aimAnim = "aim_m4";

                if(!this.animationManager.isPlayingAnim(aimAnim))
                {
                    this.animationManager.playSubAnimationAndStop(aimAnim);
                }
            }
            
        } else {
            if(this._isAiming)
            {
                this._isAiming = false;
                this.animationManager.stopSubAnimation();
            }
        }
    }

    private updatePlayerInput()
    {
        if(!this.gltfModel) return;
        
        const ped = Gameface.Instance.player;

        if(ped != this.ped) return;

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