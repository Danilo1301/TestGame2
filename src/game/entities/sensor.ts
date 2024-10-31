import { Entity } from "./entity";

export class Sensor extends Entity
{
    public update(delta: number)
    {
        super.update(delta);

        // const physicsWorld = this.game.serverScene.physics.physicsWorld;

        // const dispatcher = physicsWorld.getDispatcher();
        // const numManifolds = dispatcher.getNumManifolds();

        // for (let i = 0; i < numManifolds; i++) {
        //     const manifold = dispatcher.getManifoldByIndexInternal(i);
        //     const body0 = manifold.getBody0();
        //     const body1 = manifold.getBody1();

        //     const idA = (body0 as any).uniqueId;
        //     const idB = (body0 as any).uniqueId;

        //     const upA = body0.getUserPointer();
        //     const upB = body1.getUserPointer();

        //     console.log(idA, upA);
        //     console.log(idB, upB);

        // }
    }
}