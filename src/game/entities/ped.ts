import { Quaternion_ToEuler } from "../../utils/ammo/quaterion";
import { Vector3_DistanceTo } from "../../utils/ammo/vector";
import { Entity, EntityData_JSON } from "./entity";
import { Vehicle } from "./vehicle";

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

    public init()
    {
        super.init();

        const body = this.collision.body!;

        const DISABLE_DEACTIVATION = 4;

        body.setAngularFactor(new Ammo.btVector3(0, 0, 0))
        body.setFriction(0.5);
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
        const force = new Ammo.btVector3(0, 0, 0);      
        
        //console.log(this.inputX, this.inputZ)

        const quat = this.lookDir;
        const euler = Quaternion_ToEuler(quat);

        const pitch = euler.y();

        Ammo.destroy(euler);

        let forward = this.inputZ;

        let right = this.inputX;

        const movementDir = {
            x: Math.sin(pitch) * forward,
            y: 0,
            z: Math.cos(pitch) * forward
        }

        movementDir.x += -Math.cos(pitch) * right;
        movementDir.z += Math.sin(pitch) * right;

        force.setX(movementDir.x * this.speed * delta);
        force.setY(movementDir.y * this.speed * 2 * delta);
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