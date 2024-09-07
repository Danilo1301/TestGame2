import { Scene3D, Types } from "@enable3d/phaser-extension";
import { ServerScene } from "../scenes/serverScene";
import { GameObject } from "../gameObject/gameObject";
import { Player } from "../player/player";
import { Debug } from "../../utils/debug/debug";
import { ServerClock } from "@enable3d/ammo-on-nodejs";
import THREE from "three";
import path from "path"
import { isNode, randomIntFromInterval } from "../../utils/utils";
import { ThreeModelManager } from "../three/threeModelManager";
import { GLTFCollection } from "./gltfCollection";
import { Ped } from "../entities/ped";
import { MakeBodyOptions } from "../gameObject/gameObjectCollision";
import { BaseObject } from "../../utils/baseObject";
import { Bullet } from "../entities/bullet";
import { Vehicle } from "../entities/vehicle";
import { Wheel } from "../entities/wheel";
import { AmmoUtils, FormatVector3 } from "./ammoUtils";
import { Input } from "../../utils/input/input";
import { Quaternion_Multiply_Vector3 } from "../../utils/ammo/quaterion";

const WHEEL_MASS = 100;
const ROTOR_MASS = 500;
const AXIS_MASS = 300;
const VEHICLE_MASS = 300;
const FORCE = 100;

export class Game extends BaseObject
{
    public serverScene: ServerScene;

    public gameObjects = new Map<string, GameObject>();

    public gltfCollection: GLTFCollection = new GLTFCollection();

    public ammoUtils: AmmoUtils;
    
    constructor()
    {
        super()

        this.serverScene = new ServerScene(this);
        this.ammoUtils = new AmmoUtils();
    }

    public init()
    {
        this.serverScene.init();
        this.ammoUtils.physicsWorld = this.serverScene.physics.physicsWorld;
    }

    public update(delta: number)
    {
        this.serverScene.update(delta);

        for(const gameObject of this.gameObjects.values())
        {
            gameObject.update(delta);

            const spawn = new THREE.Vector3(0, 0, 3);

            if(gameObject.getPosition().distanceTo(spawn) > 80)
            {
                const newPos = gameObject.getPosition();

                gameObject.setPosition(spawn.x, spawn.y, spawn.z);
                gameObject.setVelocity(0, 0, 0);
            }
        }
        
    }

    public startClock()
    {
        // clock
        const clock = new ServerClock()

        // for debugging you disable high accuracy
        // high accuracy uses much more cpu power
        if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()

        clock.onTick(delta => this.update(delta))
    }

    public spawnPed()
    {
        this.log(`spawn ped`);

        const ped = new Ped();
        ped.model = "ped";

        const height = 1.5;

        ped.collision.addCapsule(new THREE.Vector3(0, height/2, 0), 0.3, height);

        this.setupGameObject(ped, {mass: 50});

        return ped;
    }

    public spawnVehicle()
    {
        //https://github.com/enable3d/enable3d-website/blob/master/src/examples/car-using-physics-constraints.html

        const physicsWorld = this.serverScene.physics.physicsWorld;

        const gameObject = new Vehicle();
        gameObject.displayName = "Vehicle";

        const vehicleSize = {x: 1.8, y: 3, z: 4.7}

        gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(vehicleSize.x, vehicleSize.y, vehicleSize.z));

        this.setupGameObject(gameObject, {mass: VEHICLE_MASS});

        gameObject.setPosition(0, vehicleSize.y, 0);

        const wheelX = 1.4,
            wheelZ = 2,
            axisZ = 0.2

        // blue wheels
        const wheelBackRight = this.spawnWheel(wheelX, wheelZ)
        const wheelBackLeft = this.spawnWheel(-wheelX, wheelZ)
        const wheelFrontRight = this.spawnWheel(wheelX, -wheelZ) // right front
        const wheelFrontLeft = this.spawnWheel(-wheelX, -wheelZ)

        // red rotors
        const rotorBackRight = this.addRotor(wheelX, wheelZ)
        const rotorBackLeft = this.addRotor(-wheelX, wheelZ)
        const rotorFrontRight = this.addRotor(wheelX, -wheelZ)
        const rotorFrontLeft = this.addRotor(-wheelX, -wheelZ)

        // blue axis
        const axisSize = vehicleSize.x;
        
        const axisBackOne = this.addAxis(wheelZ, axisSize) // the one at the back
        //const axisFrontOne = this.addAxis(-wheelZ + axisZ, 0.04)
        const axisFrontTwo = this.addAxis(-wheelZ - axisZ, axisSize)

        const pivotInA = new Ammo.btVector3(0, 0, 0); // Pivot point in bodyA
        const pivotInB = new Ammo.btVector3(0, 0, 0); // Pivot point in bodyB

        // this part attaches the rotors (small cylinders) to the wheelse (big cylinders)

        const wheelToRotorConstraint = { axisA: { y: 1 }, axisB: { y: 1 } }
        const motorBackLeft = this.ammoUtils.add_constraints_hinge(
            wheelBackLeft.body,
            rotorBackLeft.body,
            wheelToRotorConstraint
        );

        const motorBackRight = this.ammoUtils.add_constraints_hinge(
            wheelBackRight.body,
            rotorBackRight.body,
            wheelToRotorConstraint
        )

        const motorFrontLeft = this.ammoUtils.add_constraints_hinge(
            wheelFrontLeft.body,
            rotorFrontLeft.body,
            wheelToRotorConstraint
        )

        const motorFrontRight = this.ammoUtils.add_constraints_hinge(
            wheelFrontRight.body,
            rotorFrontRight.body,
            wheelToRotorConstraint
        )
        
        const makeDofBetter = (dofConstraint: Ammo.btGeneric6DofConstraint) =>
        {
            // that's the neat part, you don't
        }

        const c1 = this.ammoUtils.add_constraints_lock(rotorBackRight.body, axisBackOne.body)
        const c2 = this.ammoUtils.add_constraints_lock(rotorBackLeft.body, axisBackOne.body)
        
        makeDofBetter(c1);
        makeDofBetter(c2);

        // constraint axis to rotor
        const axisToRotor = (rotorRight: GameObject, rotorLeft: GameObject, axis: GameObject, z: number) => {

            const altura = 2;
            const distancia = wheelX;

            const right = this.ammoUtils.add_constraints_hinge(rotorRight.body, axis.body, {
                pivotA: { y: 0, z: z },
                pivotB: { y: -distancia },
                axisA: { x: altura },
                axisB: { x: altura }
            })
            const left = this.ammoUtils.add_constraints_hinge(rotorLeft.body, axis.body, {
                pivotA: { y: 0, z: z },
                pivotB: { y: distancia },
                axisA: { x: altura },
                axisB: { x: altura }
            })
            return { right, left }
        }
        

        const m0 = axisToRotor(rotorFrontRight, rotorFrontLeft, axisFrontTwo, 0)
        //axisToRotor(rotorFrontRight, rotorFrontLeft, axisFrontOne, 0.4)
            
        const plate = gameObject;

        this.ammoUtils.add_constraints_lock(plate.body, axisBackOne.body)
        this.ammoUtils.add_constraints_lock(plate.body, axisFrontTwo.body)

        const limit = 0.3
        const dofSettings = {
            angularLowerLimit: { x: 0, y: 0, z: 0 },
            angularUpperLimit: { x: 0, y: 0, z: 0 },
            linearLowerLimit: { x: 0, y: -limit, z: -0.1 },
            linearUpperLimit: { x: 0, y: limit, z: 0.1 }
        }
        //this.ammoUtils.add_constraints_dof(plate.body, axisFrontOne.body, { ...dofSettings, offset: { y: 0.9 } })
        //this.ammoUtils.add_constraints_dof(plate.body, axisFrontOne.body, { ...dofSettings, offset: { y: -0.9 } })

        m0.left.enableAngularMotor(true, 0, 2000)
        m0.right.enableAngularMotor(true, 0, 2000)

        let initialForceMult = 0;

        setInterval(() => {
            
            const speed = 50
            const impulse = 0.25;

            const force = FORCE;

            const forward = gameObject.forward;
            const mforce = forward.op_mul(force);
            const wheelTorque = new Ammo.btVector3(mforce.z(), mforce.y(), -mforce.x())
            
            if(Input.isKeyDown("W"))
            {
                if(initialForceMult < 4)
                    initialForceMult += 0.02;


                //const torque = new Ammo.btVector3(-force, 0, 0)

                console.log(FormatVector3(mforce));

                const newTorque = wheelTorque.op_mul(-1 * initialForceMult);

                wheelBackRight.body.applyTorque(newTorque);
                wheelBackLeft.body.applyTorque(newTorque);

            } else if(Input.isKeyDown("S"))
            {
                if(initialForceMult < 4)
                    initialForceMult += 0.02;
                
                const newTorque = wheelTorque.op_mul(1 * initialForceMult);

                wheelBackRight.body.applyTorque(newTorque);
                wheelBackLeft.body.applyTorque(newTorque);

                //motorBackLeft.enableAngularMotor(true, speed, impulse)
                //motorBackRight.enableAngularMotor(true, speed, impulse)
            } else {
                initialForceMult = 0;
                //motorBackLeft.enableAngularMotor(true, 0, impulse)
                //motorBackRight.enableAngularMotor(true, 0, impulse)
            }
            //motorFrontLeft.enableAngularMotor(true, -speed, 0.25)
            //motorFrontRight.enableAngularMotor(true, -speed, 0.25)

            const maxAngle = 0.9

          if (Input.isKeyDown("A")) {
            m0.left.setMotorTarget(-maxAngle, 0.2)
            m0.right.setMotorTarget(-maxAngle, 0.2)
          } else if (Input.isKeyDown("D")) {
            m0.left.setMotorTarget(maxAngle, 0.2)
            m0.right.setMotorTarget(maxAngle, 0.2)
          } else {
            m0.left.setMotorTarget(0, 0.2)
            m0.right.setMotorTarget(0, 0.2)
          }

        }, 0);

        //gameObject.setPosition(10, 1, 0);
        
        return gameObject;
    }

    public spawnWheel(x: number, z: number)
    {
        const gameObject = new Wheel();
        gameObject.displayName = "Wheel";
        gameObject.model = "wheel";

        gameObject.collision.addCylinder(new THREE.Vector3(0, 0, 0), 0.5, 0.5, 0.35);

        this.setupGameObject(gameObject, {mass: WHEEL_MASS});

        gameObject.body.setFriction(3)

        const quat = new THREE.Quaternion(0, 0, 0, 1);
        quat.setFromEuler(new THREE.Euler(0, 0, Math.PI/2))
        gameObject.setRotation(quat.x, quat.y, quat.z, quat.w);

        gameObject.setPosition(x, 1, z);

        return gameObject;
    }

    public addRotor(x: number, z: number)
    {
        const gameObject = new GameObject();
        gameObject.displayName = "rotor";

        gameObject.collision.addCylinder(new THREE.Vector3(0, 0, 0), 0.35, 0.35, 0.4);

        this.setupGameObject(gameObject, {mass: ROTOR_MASS});

        const quat = new THREE.Quaternion(0, 0, 0, 1);
        quat.setFromEuler(new THREE.Euler(0, 0, Math.PI/2))
        gameObject.setRotation(quat.x, quat.y, quat.z, quat.w);

        gameObject.setPosition(x, 1, z);

        return gameObject;
    }

    public addAxis(z: number, size: number, radius: number = 0.06)
    {
        const gameObject = new GameObject();
        gameObject.displayName = "axis";

        const col = gameObject.collision.addCylinder(new THREE.Vector3(0, 0, 0), radius, radius, size);
        col.color = 0x0000ff;

        this.setupGameObject(gameObject, {mass: AXIS_MASS});

        const quat = new THREE.Quaternion(0, 0, 0, 1);
        quat.setFromEuler(new THREE.Euler(0, 0, Math.PI/2))
        gameObject.setRotation(quat.x, quat.y, quat.z, quat.w);

        gameObject.setPosition(0, 1, z);

        return gameObject;
      }


    public spawnBullet()
    {
        this.log(`spawn bullet`);

        const bullet = new Bullet();
        bullet.displayName = "bullet";

        const box = bullet.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2, 0.2, 0.2));
        box.color = 0xffff00;

        this.setupGameObject(bullet, {mass: 1});

        setTimeout(() => {
            this.removeGameObject(bullet);
        }, 2000);

        return bullet;
    }

    public removeGameObject(gameObject: GameObject)
    {
        //possible memory leak
        this.serverScene.physics.physicsWorld.removeRigidBody(gameObject.collision.body!);
        
        this.gameObjects.delete(gameObject.id);

        gameObject.collision.body = undefined;
        gameObject.destroy();
    }

    public spawnNPC()
    {
        const ped = this.spawnPed();

        ped.inputZ = 1;

        setInterval(() => {
        }, 500);
    }

    private setupGameObject(gameObject: GameObject, options: MakeBodyOptions)
    {
        const modelName = gameObject.model;

        if(modelName)
        {
            const gltf = this.gltfCollection.gltfs.get(modelName);

            if(!gltf) throw "GLTF " + modelName + " was not found";

            gameObject.collision.createCollisionsFromGLTF(gltf, options);
        } else {
            gameObject.collision.makeBody(options);
        }

        this.gameObjects.set(gameObject.id, gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        gameObject.init();
    }

    public changeGameObjectId(gameObject: GameObject, id: string)
    {
        this.gameObjects.delete(id);

        gameObject.id = id;

        this.gameObjects.set(id, gameObject);
    }

    public createGround()
    {
        const gameObject = new GameObject();
        gameObject.model = "ground";
        gameObject.displayName = "ground"
        gameObject.drawCollision = true;

        const box = gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(100, 2, 100));
        box.color = 0x00ff00;

        this.setupGameObject(gameObject, {mass: 0, position: new THREE.Vector3(0, -1, 0)});

        return gameObject;
    }

    public createBulding()
    {
        const gameObject = new GameObject();
        gameObject.model = "building";
        gameObject.displayName = "building"

        const modelName = gameObject.model;
        const gltf = this.gltfCollection.gltfs.get(modelName);
        if(!gltf) throw "GLTF " + modelName + " was not found";

        gameObject.collision.createCollisionsFromGLTF(gltf, {mass: 0});

        this.gameObjects.set(gameObject.id, gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        return gameObject;
    }

    public createBox()
    {
        Debug.log("Game", "create box");
        
        const gameObject = new GameObject();
        
        const box1 = gameObject.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));
        box1.color = 0xff0000;
        //box1.rotation = new THREE.Quaternion();
        //box1.rotation.setFromEuler(new THREE.Euler(45, 0, 0));

        //const box2 = gameObject.collision.addBox(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 1, 1));
        //box2.color = 0x0000ff;

        gameObject.collision.makeBody({mass: 1, position: new THREE.Vector3(0, 3, 0)});

        this.gameObjects.set(gameObject.id, gameObject);

        this.serverScene.physics.physicsWorld.addRigidBody(gameObject.collision.body!);

        return gameObject;
    }
}