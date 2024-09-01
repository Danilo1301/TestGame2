import { Entity } from "./entity";

export class Ped extends Entity {
    public inputX: number = 0;
    public inputZ: number = 0;

    public speed: number = 5;

    public enableAI()
    {

    }

    public update(delta: number)
    {
        super.update(delta);

        const force = new Ammo.btVector3(0, 0, 0);      
        
        force.setX(this.inputX * this.speed);
        force.setZ(this.inputZ * this.speed);

        const body = this.collision.body!;

        if(!body.isActive() && force.length() > 0)
        {
            body.activate();
        }

        body.applyForce(force, new Ammo.btVector3(0, 0, 0));
    }
}