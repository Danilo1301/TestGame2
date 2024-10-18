import THREE from 'three';
import { Weapon } from '../weapons/weapon';
import { Entity } from './entity';
import { Input } from "../input";
import { Ped } from './ped';
import { Wheel } from './wheel';
import { FormatVector3, Vector3_Subtract } from '../../shared/ammo/vector';
import { FormatQuaternion, Quaternion_Clone, Quaternion_ToEuler } from '../../shared/ammo/quaterion';
import { Axis } from './axis';

export class Vehicle extends Entity
{
    public frontWheelContraints: Ammo.btGeneric6DofSpringConstraint[] = [];
    public backWheelConstraints: Ammo.btHingeConstraint[] = [];

    public darGrau: boolean = false;
    public pedDriving?: Ped;

    public chassisCollisionGroup: number = 0;
    public wheelsCollisionGroup: number = 0;

    public wheels: Wheel[] = [];
    public axis: Axis[] = [];

    constructor()
    {
        super();

        this.customSetPosition = (x: number, y: number, z: number) =>
        {
            const body = this.collision.body!;

            const origin = new Ammo.btVector3(x, y, z);
    
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(origin);
    
            body.getWorldTransform().setOrigin(transform.getOrigin());

            Ammo.destroy(origin);
            Ammo.destroy(transform);

            const setTransformedPosition = (entity: Entity, offset: Ammo.btVector3) =>
            {
                console.log(entity.displayName, FormatVector3(offset))

                const transformedPosition = this.transformFromObjectSpace(this.body, offset);
                
                entity.setPosition(transformedPosition.x(), transformedPosition.y(), transformedPosition.z());
                //entity.setPosition(x, y, z);
                
                Ammo.destroy(transformedPosition);
            }

            for(const wheel of this.wheels)
            {
                setTransformedPosition(wheel, wheel.offsetFromChassis);
            }

            for(const axis of this.axis)
            {
                setTransformedPosition(axis, axis.offsetFromChassis);
            }

            return false;
        }

        this.customSetRotation = (x: number, y: number, z: number, w: number) =>
        {
            return false;

            const body = this.collision.body!;
            const prevRotation = this.getRotation();
            const prevEuler = Quaternion_ToEuler(prevRotation);

            // set chassis rotation

            const quat = new Ammo.btQuaternion(x, y, z, w);
            body.getWorldTransform().setRotation(quat);
            Ammo.destroy(quat);

            //

            const newRotation = this.getRotation();
            const newEuler = Quaternion_ToEuler(newRotation);
            const diffEulerY = newEuler.y() - prevEuler.y();

            // updates position of other bodies
            
            const position = this.getPosition();

            this.customSetPosition!(position.x(), position.y(), position.z());

            const rotateBody = (entity: Entity) =>
            {
                const wheelRotation = entity.getRotation();
                const wheelEuler = Quaternion_ToEuler(wheelRotation);
    
                const newWheelEulerY = wheelEuler.y() + diffEulerY;
    
                const newWheelRotation = new Ammo.btQuaternion(0, 0, 0, 1);
                newWheelRotation.setEulerZYX(wheelEuler.z(), newWheelEulerY, wheelEuler.x());
    
                entity.setRotation(newWheelRotation.x(), newWheelRotation.y(), newWheelRotation.z(), wheelRotation.w());
    
                Ammo.destroy(wheelEuler);
                Ammo.destroy(newWheelRotation);
            }

            for(const wheel of this.wheels)
            {
                rotateBody(wheel);
            }

            for(const axis of this.axis)
            {
                rotateBody(axis);
            }

            Ammo.destroy(prevEuler);
            Ammo.destroy(newEuler);
            
            return false;
        }
    }

    public initCollision()
    {
        super.initCollision();
    }

    public init()
    {
        super.init();

        const DISABLE_DEACTIVATION = 4;

        this.body.setActivationState(DISABLE_DEACTIVATION);
    }

    public update(delta: number)
    {
        super.update(delta);

        //this.inputX = (Input.getKey("A") ? -1 : 0) + (Input.getKey("D") ? 1 : 0);
        //this.inputZ = (Input.getKey("W") ? 1 : 0) + (Input.getKey("S") ? -1 : 0);

        this.darGrau = Input.getKey("SHIFT") == true;

        // front wheels
        if(this.inputX == 0)
        {
            this.steerWheels(0);
        } else if(this.inputX < 0)
        {
            this.steerWheels(-Math.PI / 4);
        } else if(this.inputX > 0)
        {
            this.steerWheels(Math.PI / 4);
        }

        // back wheels
        const force = 3000;
        const velocity = force * this.inputZ;

        this.setBackWheelsVelocity(velocity);

        if(Input.getKey("Y"))
        {
            this.setPosition(10, 0, 0);
            this.setRotation(0, 0, 0, 1);
            this.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0))
        }
        if(Input.getKey("U"))
        {
            const rotation = new Ammo.btQuaternion(0, 0, 0, 1);
            rotation.setEulerZYX(0, Math.PI/2, 0);

            this.setPosition(10, 0, 5);
            this.setRotation(rotation.x(), rotation.y(), rotation.z(), rotation.w());
            this.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0))

            Ammo.destroy(rotation);
        }
    }

    public setupVehicleBody(bike: boolean = false)
    {
        const entityFactory = this.game.entityFactory;
        const physicsWorld = this.game.serverScene.physics.physicsWorld;

        const chassis = this;

        const makeWheel = (x: number, y: number, z: number, axis: Entity, canSteer: boolean) =>
        {
            const GROUP_CHASSIS = this.chassisCollisionGroup;
            const GROUP_WHEELS = this.wheelsCollisionGroup;

            //const MASK_WHEELS = ~GROUP_CHASSIS; 

            const wheel = entityFactory.spawnWheel(
                x, y, z,
                {
                    mass: 50,
                    group: GROUP_WHEELS,
                    mask: -1
                }
            )

            wheel.offsetFromChassis.setValue(x, y, z);
            
            this.wheels.push(wheel);

            wheel.displayName += `${canSteer ? "F" : "B"}`;
            //wheel.offsetFromChassis.setValue(x, wheelY, z);

            //this.wheels.push(wheel);

            const pivotWheel = new Ammo.btVector3(0, 0, 0);  // Wheels' local pivot

            if(canSteer)
            {
                // Pivot point on chassis and wheel (these are the points where the bodies are connected)
                const pivotChassis1 = new Ammo.btVector3(x, 0, 0);  // Front wheel offset

                // Step 2: Create a btGeneric6DofSpringConstraint for the front wheel
                const frameInA = new Ammo.btTransform();  // Frame in chassis coordinate
                const frameInB = new Ammo.btTransform();  // Frame in wheel coordinate
                frameInA.setIdentity();
                frameInB.setIdentity();

                // Set the pivot point and the rotation axis in local frame
                frameInA.setOrigin(pivotChassis1);  // Front wheel offset on chassis
                frameInB.setOrigin(pivotWheel);   
                
                // Create hinge constraint for front wheel
                const frontWheelConstraint = new Ammo.btGeneric6DofSpringConstraint(
                    axis.body, 
                    wheel.body, 
                    frameInA, 
                    frameInB, 
                    true  // Use reference frame A
                );

                // Step 3: Limit the degrees of freedom for steering and wheel rotation
                // Allow rotation around Y-axis for steering
                //frontWheelConstraint.setAngularLowerLimit(new Ammo.btVector3(1, -Math.PI/4, 0));  // Limit steering angle (-45 degrees)
                //frontWheelConstraint.setAngularUpperLimit(new Ammo.btVector3(1, Math.PI/4, 0));   // Limit steering angle (+45 degrees)

                // Limit forward/backward rotation (Z-axis) for the wheel (like a hinge)
                frontWheelConstraint.setLinearLowerLimit(new Ammo.btVector3(0, 0, 0));  // No linear motion allowed
                frontWheelConstraint.setLinearUpperLimit(new Ammo.btVector3(0, 0, 0));  // No linear motion allowed
                
                frontWheelConstraint.setAngularLowerLimit(new Ammo.btVector3(0, 0, 0));  // No linear motion allowed
                frontWheelConstraint.setAngularUpperLimit(new Ammo.btVector3(0, 0, 0));  // No linear motion allowed

                physicsWorld.addConstraint(frontWheelConstraint, true);

                this.frontWheelContraints.push(frontWheelConstraint);
            } else {
                const pivotChassis2 = new Ammo.btVector3(x, 0, 0); // Rear wheel offset

                const hingeAxis = new Ammo.btVector3(1, 0, 0);  // Forward/backward rotation axis
            
                // Create hinge constraint for rear wheel
                const rearWheelHinge = new Ammo.btHingeConstraint(
                    axis.body,
                    wheel.body,
                    pivotChassis2,   // Chassis pivot
                    pivotWheel,      // Wheel pivot
                    hingeAxis,       // Rotation axis for chassis
                    hingeAxis        // Rotation axis for wheel
                );

                // Step 4: Add constraints and bodies to the world
                physicsWorld.addConstraint(rearWheelHinge, true);

                this.backWheelConstraints.push(rearWheelHinge);
            }

            return wheel;
        }

        const makeAxis = (x: number, y: number, z: number) =>
        {
            const axis = entityFactory.spawnAxis(x, y, z);

            axis.offsetFromChassis.setValue(x, y, z);

            this.axis.push(axis);

            const frameInA = new Ammo.btTransform();
            frameInA.setIdentity();
            frameInA.setOrigin(new Ammo.btVector3(x, y, z)); // Attach point on Cube A
        
            const frameInB = new Ammo.btTransform();
            frameInB.setIdentity();
            frameInB.setOrigin(new Ammo.btVector3(0, 0, 0)); // Attach point on Cube B

            const springConstraint = new Ammo.btGeneric6DofSpringConstraint(
                chassis.body, 
                axis.body, 
                frameInA, 
                frameInB,
                true
            );
        
            // Set linear limits
            springConstraint.setLinearLowerLimit(new Ammo.btVector3(0, 0, 0)); // Max compression
            springConstraint.setLinearUpperLimit(new Ammo.btVector3(0, 0, 0));  // Max extension

            //springConstraint.setLinearLowerLimit(new Ammo.btVector3(0, 0, 0)); // Max compression
            //springConstraint.setLinearUpperLimit(new Ammo.btVector3(0, 0, 0));  // Max extension
        
            // angular limits
            springConstraint.setAngularLowerLimit(new Ammo.btVector3(0, 0, 0));
            springConstraint.setAngularUpperLimit(new Ammo.btVector3(0, 0, 0));

            // Enable the spring on the Y axis (acts as a suspension)
            springConstraint.enableSpring(1, true)
            springConstraint.setStiffness(1, 1000.0)
            springConstraint.setDamping(1, 1.0)

            //springConstraint.enableSpring(1, true)
            //springConstraint.setStiffness(1, 1000.0)
            //springConstraint.setDamping(1, 1.0)
        
            physicsWorld.addConstraint(springConstraint);

            return axis;
        }   

        let wheelY = -0.4;

        let wheelZ = bike ? 0.7 : 1.6;

        const axisF = makeAxis(0, wheelY, -wheelZ);
        axisF.displayName += `F`;

        const axisB = makeAxis(0, wheelY, wheelZ);
        axisB.displayName += `B`;

        if(!bike)
        {   
            let wheelX = 1.0;

            const wheelFL = makeWheel(wheelX, wheelY, -wheelZ, axisF, true);
            wheelFL.displayName += `L`;

            const wheelFR = makeWheel(-wheelX, wheelY, -wheelZ, axisF, true);
            wheelFR.displayName += `R`;

            const wheelBL = makeWheel(wheelX, wheelY, wheelZ, axisB, false);
            wheelBL.displayName += `L`;

            const wheelBR = makeWheel(-wheelX, wheelY, wheelZ, axisB, false);
            wheelBR.displayName += `R`;
        } else {
            const wheelF = makeWheel(0.001, wheelY, -wheelZ, axisF, true);

            const wheelB = makeWheel(0, wheelY, wheelZ, axisB, false);
        }

        

        this.steerWheels(0);

    }

    public steerWheels(angle: number)
    {
        const steerAngle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, angle));

        for(const constraint of this.frontWheelContraints)
        {
            const alower = new Ammo.btVector3(-Math.PI, steerAngle, 0);
            const aupper = new Ammo.btVector3(Math.PI, steerAngle, 0);

            constraint.setAngularLowerLimit(alower);
            constraint.setAngularUpperLimit(aupper);

            Ammo.destroy(alower);
            Ammo.destroy(aupper);
        }
    }

    public setBackWheelsVelocity(velocity: number)
    {
        for(const constraint of this.backWheelConstraints)
        {
            if(velocity == 0)
            {
                constraint.enableAngularMotor(false, 0, 0); // ZERO
                continue;
            }

            // 200 dá grau
            // 20 normal
            constraint.enableAngularMotor(true, velocity, this.darGrau ? 100 : 5);
        }
    }

    public toJSON()
    {
        const json = super.toJSON();
        //json.data = data;

        return json;
    }
}