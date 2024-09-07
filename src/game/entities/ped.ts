import { Entity } from "./entity";

export class Ped extends Entity {
    public speed: number = 200;

    public init()
    {
        const body = this.collision.body!;

        body.setAngularFactor(new Ammo.btVector3(0, 0, 0))
    }

    public update(delta: number)
    {
        super.update(delta);

        const force = new Ammo.btVector3(0, 0, 0);      
        
        force.setX(this.inputX * this.speed);
        force.setY(this.inputY * this.speed * 2);
        force.setZ(this.inputZ * this.speed);

        const body = this.collision.body!;

        if(force.length() > 0)
        {
            if(!body.isActive() && force.length() > 0)
            {
                body.activate();
            }
        
            body.applyForce(force, new Ammo.btVector3(0, 0, 0));
        }

        //this.setRotation(0, 0, 0, 1);
    }
}