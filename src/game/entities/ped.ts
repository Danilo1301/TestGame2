import THREE from "three";
import { FormatQuaternion, Quaternion_Clone, Quaternion_Multiply_Vector3, Quaternion_ToEuler } from "../../utils/ammo/quaterion";
import { FormatVector3, getTurnDirection, rotateVectorAroundY, Vector3_CrossVectors, Vector3_DistanceTo, Vector3_Lerp_MinMovement } from "../../utils/ammo/vector";
import { Entity, EntityData_JSON } from "./entity";
import { Vehicle } from "./vehicle";
import { ammoVector3ToThree, threeVector3ToAmmo } from "../../utils/utils";

export interface PedData_JSON extends EntityData_JSON {
    lookDir: number[]
}

export interface PedNameTag_JSON {
    nickname: string;
    nicknameColor: string;
    tag: string;
    tagColor: string;
}

export class Ped extends Entity {
    public speed: number = 2000;

    public lookDir = new Ammo.btQuaternion(0, 0, 0, 1);

    public onVehicle?: Vehicle;

    public nickname: string = "Ped";
    public nicknameColor: string = "#ff0000";
    public tag: string = "Disconnected";
    public tagColor: string = "#cccccc";

    public targetDirection = new Ammo.btVector3(0, 0, 1);

    public init()
    {
        super.init();

        const body = this.collision.body!;

        const DISABLE_DEACTIVATION = 4;

        body.setAngularFactor(new Ammo.btVector3(0, 0, 0))
        body.setFriction(2.0);
        body.setActivationState(DISABLE_DEACTIVATION);
    }

    public update(delta: number)
    {
        super.update(delta);

        const vehicle = this.onVehicle;

        if(vehicle)
        {
            vehicle.inputX = this.inputX;
            vehicle.inputY = this.inputY;
            vehicle.inputZ = this.inputZ;
        } else {
            this.updateInputMovement(delta);
        }
    }

    private updateInputMovement(delta: number)
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

        movementDir.normalize();

        if(movementDir.length() > 0)
        {
            //console.log(movementDir);
        }

        this.targetDirection.setValue(movementDir.x, 0, movementDir.z);

        //

        const forward = this.forward;

        const currentDirection = ammoVector3ToThree(forward);
        const targetDirection = ammoVector3ToThree(this.targetDirection);
        
        const angle = currentDirection.angleTo(targetDirection);

        const dir = getTurnDirection(currentDirection, targetDirection);

        if(movementDir.length() > 0)
        {

            console.log(angle);

            console.log("current:", currentDirection);
            console.log("target:", targetDirection);
        }

        let rotateSpeed = 0.18;
        let rotateAngle = 0;
        if(dir == "left") rotateAngle = -rotateSpeed;
        if(dir == "right") rotateAngle = rotateSpeed;

        if(angle < 0.1) rotateAngle = 0;

        const newDirection = rotateVectorAroundY(currentDirection, rotateAngle);

        //const newDirection = Vector3_Lerp_MinMovement(currentDirection, targetDirection, 0.1, 0.2);
        //newDirection.lerp(targetDirection, delta * 10);
        newDirection.normalize();

        if(movementDir.length() > 0)
        {

            //console.log(forward.x());
            //console.log(currentDirection.x + " -> " + targetDirection.x + " = " + newDirection.x);
        }
        
        const newDirection_a = threeVector3ToAmmo(newDirection);
        //console.log(newDirection)
        //console.log(FormatVector3(newDirection_a))

        // -------------

        
        //console.log(FormatQuaternion(currentQuaternion));

        // Step 2: Get the current forward direction (assuming the forward axis is Z-axis in local space)
        const forwardDirection = new Ammo.btVector3(0, 0, 1);

        // Step 3: Calculate the cross product to get the axis of rotation
        const rotationAxis = Vector3_CrossVectors(forwardDirection, newDirection_a);
        rotationAxis.normalize();

        if(Number.isNaN(rotationAxis.x()))
        {
            //console.log(currentDirection)
            //console.log(newDirection)
            //console.log(FormatVector3(rotationAxis));
        } else {

            const dotProduct = forwardDirection.dot(newDirection_a);
            const angle = Math.acos(dotProduct); // Angle in radians

            const currentQuaternion = Quaternion_Clone(this.getRotation());
            currentQuaternion.setRotation(rotationAxis, angle);

            this.setRotation(currentQuaternion.x(), currentQuaternion.y(), currentQuaternion.z(), currentQuaternion.w())
        }

        // ---------------

        const body = this.collision.body!;

        const currentVelocity = body.getLinearVelocity();

        const velocity = new Ammo.btVector3(
            newDirection_a.x() * 200 * delta,
            currentVelocity.y(),
            newDirection_a.z() * 200 * delta
        );

        if(movementDir.x != 0 && movementDir.z != 0)
        {
            body.setLinearVelocity(velocity);
        }


        /*
        const force = new Ammo.btVector3(0, 0, 0);

        force.setX(newDirection_a.x() * 10000 * delta);
        force.setY(inputUp * 100000 * delta);
        force.setZ(newDirection_a.z() * 10000 * delta);

        const body = this.collision.body!;

        if(force.length() > 0)
        {
            if(!body.isActive() && force.length() > 0)
            {
                body.activate();
            }
        
            body.applyForce(force, new Ammo.btVector3(0, 0, 0));
        }
        Ammo.destroy(force);
        */



        /*

        let forward = this.inputZ;

        let right = this.inputX;

        const movementDir = {
            x: Math.sin(pitch) * forward,
            y: 0,
            z: Math.cos(pitch) * forward
        }

    
        
        movementDir.x += -Math.cos(pitch) * right;
        movementDir.z += Math.sin(pitch) * right;

        movementDir.y += this.inputY;

        //

        //destroy
        const targetDirection = new Ammo.btVector3(movementDir.x, 0, movementDir.z);
        targetDirection.normalize();

        if(targetDirection.length() > 0)
        {

            //destroy
            const currentQuaternion = Quaternion_Clone(this.getRotation());

            //console.log(FormatQuaternion(currentQuaternion));

            // Step 2: Get the current forward direction (assuming the forward axis is Z-axis in local space)
            const forwardDirection = new Ammo.btVector3(0, 0, 1);

            // Step 3: Calculate the cross product to get the axis of rotation
            const rotationAxis = Vector3_CrossVectors(forwardDirection, targetDirection);
            rotationAxis.normalize();

            const dotProduct = forwardDirection.dot(targetDirection);
            const angle = Math.acos(dotProduct); // Angle in radians

            //console.log(FormatVector3(rotationAxis));
            //console.log(angle)

            if(!Number.isNaN(angle))
            {
                currentQuaternion.setRotation(rotationAxis, angle);
            }


            this.setRotation(currentQuaternion.x(), currentQuaternion.y(), currentQuaternion.z(), currentQuaternion.w())
        }

        //


        force.setX(movementDir.x * this.speed * delta);
        force.setY(movementDir.y * 10000 * delta);
        force.setZ(movementDir.z * this.speed * delta);

        const body = this.collision.body!;

        if(force.length() > 0)
        {
            if(!body.isActive() && force.length() > 0)
            {
                body.activate();
            }
        
            body.applyForce(force, new Ammo.btVector3(0, 0, 0));
        }

        Ammo.destroy(force);
        */
    }

    public enterVehicle(vehicle: Vehicle)
    {
        if(vehicle.pedDriving) return;

        this.onVehicle = vehicle;
        this.onVehicle.pedDriving = this;
    }

    public leaveVehicle()
    {
        if(!this.onVehicle) return;

        const vehiclePos = this.onVehicle.getPosition();

        this.onVehicle.inputX = 0;
        this.onVehicle.inputY = 0;
        this.onVehicle.inputZ = 0;

        this.onVehicle.pedDriving = undefined;
        this.onVehicle = undefined;

        this.setPosition(vehiclePos.x(), vehiclePos.y() + 3, vehiclePos.z());
    }
    
    public getClosestVehicle()
    {
        let closestVehicle: Vehicle | undefined;
        let closestDistance = Infinity;

        const pedPosition = this.getPosition();

        for(const gameObject of this.game.entityFactory.entities.values())
        {
            if(gameObject instanceof Vehicle)
            {
                const distance = Vector3_DistanceTo(gameObject.getPosition(), pedPosition);

                if(distance < closestDistance)
                {
                    closestDistance = distance;
                    closestVehicle = gameObject;
                }
            }
        }

        return closestVehicle;
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