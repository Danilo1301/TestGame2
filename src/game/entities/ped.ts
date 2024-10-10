import { Quaternion_BetweenTwoVectors, Quaternion_Clone, Quaternion_Forward, Quaternion_ToEuler, quaternionFromVectors } from '../../shared/ammo/quaterion';
import { FormatVector3, getTurnDirection, rotateVectorAroundY, Vector3_Clone, Vector3_CrossVectors } from '../../shared/ammo/vector';
import { ammoVector3ToThree, threeVector3ToAmmo } from '../../shared/utils';
import { Weapon } from '../weapons/weapon';
import { Entity, EntityData_JSON } from './entity';
import THREE from 'three';

export interface PedData_JSON extends EntityData_JSON {
    lookDir: number[]
}

export class Ped extends Entity
{
    public cameraPosition = new Ammo.btVector3(0, 1, 0);
    public lookDir = new Ammo.btQuaternion(0, 0, 0, 1);
    
    public mouse1: boolean = false;
    public aiming: boolean = false;

    public targetDirection = new Ammo.btVector3(0, 0, 1);

    public controlledByPlayer: boolean = false;

    public weapon?: Weapon;

    public initCollision()
    {
        super.initCollision();

        const height = 1.5;
        const calsuleRoundHeight = 0.2;

        this.collision.addCapsule(new THREE.Vector3(0, height/2 + calsuleRoundHeight, 0), 0.2, height);
    }

    public init()
    {
        super.init();

        const body = this.body;

        const DISABLE_DEACTIVATION = 4;

        body.setAngularFactor(new Ammo.btVector3(0, 0, 0))
        body.setFriction(2.0);
        body.setActivationState(DISABLE_DEACTIVATION);
    }

    public update(delta: number)
    {
        super.update(delta);
        
        const position = this.getPosition();

        if(!this.controlledByPlayer)
            this.cameraPosition.setValue(position.x(), position.y() + 0.8, position.z())

        this.updateInputRotation(delta);
        this.updateMovement(delta);
        this.updateWeapon();
    }

    private updateWeapon()
    {
        const weapon = this.weapon;

        if(!weapon) return;

        if(this.mouse1)
        {
            if(weapon.canShoot())
            {
                weapon.shoot();
            }
        }
    }

    private updateInputRotation(delta: number)
    {
        const inputDir = this.getInputDir();

        if(inputDir.length() > 0)
        {
            this.targetDirection.setValue(inputDir.x, 0, inputDir.z);
        }

        if(this.aiming)
        {
            const lookDir = this.lookDir;
            const lookForward = Quaternion_Forward(lookDir);

            this.targetDirection.setValue(lookForward.x(), 0, lookForward.z());

            Ammo.destroy(lookForward);
        }
        
        const forward = this.forward;

        const currentDirection = ammoVector3ToThree(forward);
        const targetDirection = ammoVector3ToThree(this.targetDirection);

        Ammo.destroy(forward);

        let angle = 0;
        if(targetDirection.length() > 0)
        {
            angle = currentDirection.angleTo(targetDirection);
        }

        //console.log(currentDirection, targetDirection);

        const dir = getTurnDirection(currentDirection, targetDirection);
        
        let rotateSpeed = 0.18;
        let rotateAngle = 0;

        const dirSignal = dir == "left" ? -1 : 1;

        rotateAngle = rotateSpeed * dirSignal;
        if(rotateSpeed > angle) rotateAngle = angle * dirSignal;
    
        if(angle < 0.01) rotateAngle = 0;    

        const newDirection = rotateVectorAroundY(currentDirection, rotateAngle);
        newDirection.normalize();

        const newDirection_a = threeVector3ToAmmo(newDirection);

        const forwardDirection = new Ammo.btVector3(0, 0, 1);

        // Step 3: Calculate the cross product to get the axis of rotation
        const rotationAxis = Vector3_CrossVectors(forwardDirection, newDirection_a);
        rotationAxis.normalize();

        if(Number.isNaN(rotationAxis.x()))
        {
            //console.log(currentDirection)
            //console.log(newDirection)
        } else {
            const dotProduct = forwardDirection.dot(newDirection_a);
            const angle = Math.acos(dotProduct); // Angle in radians

            const currentQuaternion = Quaternion_Clone(this.getRotation());
            currentQuaternion.setRotation(rotationAxis, angle);

            this.setRotation(currentQuaternion.x(), currentQuaternion.y(), currentQuaternion.z(), currentQuaternion.w())

            Ammo.destroy(currentQuaternion);
        }

        Ammo.destroy(rotationAxis);

        Ammo.destroy(newDirection_a);
        Ammo.destroy(forwardDirection); 
    }

    private updateMovement(delta: number)
    {
        const body = this.body;
        
        const movementDir = new Ammo.btVector3(0, 0, 0);

        const forward = this.forward;
        const currentVelocity = body.getLinearVelocity();

        movementDir.setY(currentVelocity.y());

        if(!this.aiming)
        {
            movementDir.setX(forward.x())
            movementDir.setZ(forward.z())
        } else {

            const inputDir = this.getInputDir();

            movementDir.setX(inputDir.x);
            movementDir.setZ(inputDir.z);
        }

        const velocity = new Ammo.btVector3(
            movementDir.x() * 5,
            movementDir.y(),
            movementDir.z() * 5
        );

        Ammo.destroy(forward);

        const inputDir = this.getInputDir();
        if(inputDir.x != 0 && inputDir.z != 0)
        {
            body.setLinearVelocity(velocity);
        }

        Ammo.destroy(velocity);

        if(inputDir.y != 0)
        {
            const force = new Ammo.btVector3(0, inputDir.y * 40 * delta, 0);
            const pos_rel = new Ammo.btVector3(0, 0, 0);

            body.applyForce(force, pos_rel);

            Ammo.destroy(force);
            Ammo.destroy(pos_rel);
        }

        Ammo.destroy(movementDir);
    }

    public lookAt(targetPosition: Ammo.btVector3)
    {
        this.cameraPosition;

        const quat = Quaternion_BetweenTwoVectors(this.cameraPosition, targetPosition);

        this.lookDir.setValue(quat.x(), quat.y(), quat.z(), quat.w());

        Ammo.destroy(quat);
    }

    public equipWeapon(id: number)
    {
        if(id == -1)
        {
            this.weapon = undefined;
            return;
        }

        const weaponData = this.game.weapons.getWeaponData(id);

        if(!weaponData) throw "Weapon ID " + id + " not found";

        const weapon = new Weapon(weaponData);
        weapon.ped = this;

        this.weapon = weapon;
    }

    public getInputDir()
    {
        const quat = this.lookDir;
        const euler = Quaternion_ToEuler(quat);
        const pitch = euler.y();
        Ammo.destroy(euler);

        let inputForward = this.inputZ;
        let inputUp = this.inputY;
        let inputRight = this.inputX;
        
        const movementDir = new THREE.Vector3(
            Math.sin(pitch) * inputForward,
            0,
            Math.cos(pitch) * inputForward
        );

        movementDir.x += -Math.cos(pitch) * inputRight;
        movementDir.z += Math.sin(pitch) * inputRight;

        movementDir.y += inputUp;

        if(movementDir.length() > 0) movementDir.normalize();

        return movementDir;
    }

    public toJSON()
    {
        const data: PedData_JSON = {
            lookDir: [this.lookDir.x(), this.lookDir.y(), this.lookDir.z(), this.lookDir.w()]
        }
        
        const json = super.toJSON();
        json.data = data;

        return json;
    }
}