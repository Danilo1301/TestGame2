import { Quaternion_Difference } from "../../utils/ammo/quaterion";
import { Input } from "../../utils/input/input";
import { FormatQuaternion, FormatVector3, Vector3_Subtract } from "../game/ammoUtils";
import { Game } from "../game/game";
import { GameObject } from "../gameObject/gameObject";
import { GameObjectSync } from "../gameObject/gameObjectSync";
import { Entity } from "./entity";
import { Ped } from "./ped";
import { Wheel } from "./wheel";

export class Vehicle extends Entity {

    public force: number = 20;

    public chassisHeight: number = 2.0;

    public darGrau: boolean = false; //melhor variavel

    public frontWheelContraints: Ammo.btGeneric6DofSpringConstraint[] = [];
    public backWheelConstraints: Ammo.btHingeConstraint[] = [];
    public wheels: Wheel[] = [];

    public pedDriving?: Ped;

    public init()
    {
        super.init();

        this.sync.onSetGameObjectPosition = (x: number, y: number, z:number) => {
            this.setVehiclePosition(x, y, z);
            return false;
        };

        this.sync.onSetGameObjectRotation = (x: number, y: number, z: number, w: number) => {
            this.setVehicleRotation(x, y, z, w);
            return false;
        };
    }

    public update(delta: number)
    {
        super.update(delta);

        //if(Input.getKey("SHIFT")) this.darGrau = true;

        if(this.inputX != 0 || this.inputY != 0 || this.inputZ != 0)
        {
            this.activateVehicleBodies();
        }

        const velocity = this.force * this.inputZ * (this.darGrau ? 5 : 1);

        this.setBackWheelsVelocity(velocity);

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
    }

    public activateVehicleBodies()
    {
        for(const wheel of this.wheels)
        {
            if(!wheel.body.isActive()) wheel.body.activate();
        }

        this.activateBody();
    }

    public steerWheels(angle: number)
    {
        const steerAngle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, angle));

        for(const constraint of this.frontWheelContraints)
        {
            constraint.setAngularLowerLimit(new Ammo.btVector3(-Math.PI, steerAngle, 0));
            constraint.setAngularUpperLimit(new Ammo.btVector3(Math.PI, steerAngle, 0));
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
            constraint.enableAngularMotor(true, velocity, this.darGrau ? 200 : 20);
        }
    }

    public setupVehicleBoke(game: Game, isBike: boolean)
    {
        const gameObjectFactory = game.gameObjectFactory;
        const chassis = this;
        const world = game.serverScene.physics.physicsWorld;
        
        //chassis.body.setAngularFactor(new Ammo.btVector3(1, 1, 0))

        const createWheel = (x: number, z: number, canSteer: boolean) => {
            const wheelOptions = {radius: 0.5, depth: 0.35, mass: 100};
            const wheelY = -this.chassisHeight/2;

            const wheel = gameObjectFactory.spawnWheel2(x, z, wheelOptions)
            wheel.displayName += `${canSteer ? "F" : "B"}`;
            wheel.setPosition(x, wheelY, z);
            wheel.offsetFromChassis.setValue(x, wheelY, z);

            this.wheels.push(wheel);

            const pivotWheel = new Ammo.btVector3(0, 0, 0);  // Wheels' local pivot

            if(canSteer)
            {
                // Pivot point on chassis and wheel (these are the points where the bodies are connected)
                const pivotChassis1 = new Ammo.btVector3(x, wheelY, -2);  // Front wheel offset

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
                    chassis.body, 
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
                
                world.addConstraint(frontWheelConstraint, true);

                this.frontWheelContraints.push(frontWheelConstraint);
            } else {
                const pivotChassis2 = new Ammo.btVector3(x, wheelY, 2); // Rear wheel offset

                const hingeAxis = new Ammo.btVector3(1, 0, 0);  // Forward/backward rotation axis
            
                // Create hinge constraint for rear wheel
                const rearWheelHinge = new Ammo.btHingeConstraint(
                    chassis.body,
                    wheel.body,
                    pivotChassis2,   // Chassis pivot
                    pivotWheel,      // Wheel pivot
                    hingeAxis,       // Rotation axis for chassis
                    hingeAxis        // Rotation axis for wheel
                );

                // Step 4: Add constraints and bodies to the world
                world.addConstraint(rearWheelHinge, true);

                this.backWheelConstraints.push(rearWheelHinge);

                   // Enable motor for rear wheel
            }
        };

        const wheelZ = 2;

        if(isBike)
        {
            createWheel(0, -wheelZ, true);

            createWheel(0, wheelZ, false);
        } else {
            const wheelX = 1.5;

            createWheel(wheelX, -wheelZ, true);
            createWheel(-wheelX, -wheelZ, true);

            createWheel(wheelX, wheelZ, false);
            createWheel(-wheelX, wheelZ, false);
        }
    }

    public setVehiclePosition(x: number, y: number, z: number)
    {
        const vehiclePosition = this.body.getWorldTransform().getOrigin();

        for(const wheel of this.wheels)
        {
            const wheelPosition = wheel.body.getWorldTransform().getOrigin();
            
            const diff = Vector3_Subtract(wheelPosition, vehiclePosition);

            wheel.setPosition(x + diff.x(), y + diff.y(), z + diff.z());
        }

        this.setPosition(x, y, z);
    }

    public setVehicleRotation(x: number, y: number, z: number, w: number)
    {
        //const prevRotation = this.getRotation();

        this.setRotation(x, y, z, w);

        //const newRotation = new Ammo.btQuaternion(x, y, z, w);

        //const diff = Quaternion_Difference(prevRotation, newRotation);

        for(const wheel of this.wheels)
        {
            const wheelOffset = wheel.offsetFromChassis;
            const transformedPosition = this.transformFromObjectSpace(this.body, wheelOffset);
            wheel.setPosition(transformedPosition.x(), transformedPosition.y(), transformedPosition.z());

            //const wheelRotation = wheel.getRotation();
            //wheelRotation.op_mulq(diff);
            //wheel.setRotation(wheelRotation.x(), wheelRotation.w(), wheelRotation.z(), wheelRotation.w());
        }
    }
}
