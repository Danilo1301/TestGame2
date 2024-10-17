import THREE from 'three';
import { Weapon } from '../weapons/weapon';
import { Entity } from './entity';
import { Input } from "../input";

export class Vehicle extends Entity
{
    public frontWheelContraints: Ammo.btGeneric6DofSpringConstraint[] = [];
    public backWheelConstraints: Ammo.btHingeConstraint[] = [];

    public darGrau: boolean = false;

    public initCollision()
    {
        super.initCollision();

        this.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 1.5, 3));
    }

    public init()
    {
        super.init();
    }

    public update(delta: number)
    {
        super.update(delta);

        this.inputX = (Input.getKey("A") ? -1 : 0) + (Input.getKey("D") ? 1 : 0);
        this.inputZ = (Input.getKey("W") ? 1 : 0) + (Input.getKey("S") ? -1 : 0);

        this.darGrau = Input.getKey("SHIFT") == true;

        // front wheels
        if(this.inputX == 0)
        {
            this.steerWheels(0);
        } else if(this.inputX < 0)
        {
            this.steerWheels(-Math.PI / 2);
        } else if(this.inputX > 0)
        {
            this.steerWheels(Math.PI / 2);
        }

        // back wheels
        const force = 30;
        const velocity = force * this.inputZ * (this.darGrau ? 5 : 1);

        this.setBackWheelsVelocity(velocity);
    }

    public setupVehicleBody()
    {
        const entityFactory = this.game.entityFactory;
        const physicsWorld = this.game.serverScene.physics.physicsWorld;

        const chassis = this;

        const makeWheel = (x: number, y: number, z: number, axis: Entity, canSteer: boolean) =>
        {
            const wheel = entityFactory.spawnWheel(
                x,
                y,
                z
            )
            
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
            springConstraint.setLinearLowerLimit(new Ammo.btVector3(0, -1, 0)); // Max compression
            springConstraint.setLinearUpperLimit(new Ammo.btVector3(0, 0.2, 0));  // Max extension
        
            springConstraint.setAngularLowerLimit(new Ammo.btVector3(0, 0, 0));
            springConstraint.setAngularUpperLimit(new Ammo.btVector3(0, 0, 0));

            // Enable the spring on the Y axis (acts as a suspension)
            springConstraint.enableSpring(1, true)
            springConstraint.setStiffness(1, 1000.0)
            springConstraint.setDamping(1, 1.0)
            //springConstraint.setDamping(1, 0.1);   // Damping (how fast it settles)
        
            physicsWorld.addConstraint(springConstraint);

            return axis;
        }   

        const axisF = makeAxis(0, -2, 1.5);
        axisF.displayName += `F`;

        const axisB = makeAxis(0, -2, -1.5);
        axisB.displayName += `B`;

        const wheelFL = makeWheel(2, -2, 1.5, axisF, true);
        wheelFL.displayName += `L`;

        const wheelFR = makeWheel(-2, -2, 1.5, axisF, true);
        wheelFR.displayName += `R`;

        const wheelBL = makeWheel(2, -2, -1.5, axisB, false);
        wheelBL.displayName += `L`;

        const wheelBR = makeWheel(-2, -2, -1.5, axisB, false);
        wheelBR.displayName += `R`;

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
            constraint.enableAngularMotor(true, velocity, this.darGrau ? -100 : -10);
        }
    }

    public toJSON()
    {
        const json = super.toJSON();
        //json.data = data;

        return json;
    }
}