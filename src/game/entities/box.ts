import { Entity } from './entity';
import THREE from 'three';

export class Box extends Entity
{
    public initCollision()
    {
        super.initCollision();
        this.collision.addBox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)); //remove later
    }
}