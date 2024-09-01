import { ExtendedObject3D, Scene3D } from '@enable3d/phaser-extension';
import { Gameface } from '../gameface/gameface';
import THREE from 'three';

export class ThreeScene extends Scene3D
{
    public static Instance: ThreeScene;

    public box!: ExtendedObject3D;

    constructor() {
        super({ key: 'ThreeScene' });

        ThreeScene.Instance = this;
    }

    public init()
    {
        this.accessThirdDimension();
    }

    public create()
    {
        this.third.warpSpeed("-ground");

        const camera = this.third.camera as THREE.PerspectiveCamera;

        camera.fov = 60;
        camera.position.set(0, 10, 10);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        /*
        var camera = ThreeScene.Instance.third.camera;
        camera.fov = 60;
        camera.position.set(0, 3, 8);
        camera.lookAt(0, 0, 2.5);
        camera.updateProjectionMatrix();
        */

        /*
        const box = this.third.physics.add.box({x: 0, y: 5});
        ThreeScene.addPhaser3DObject(box);
        this.box = box;

        this.third.add.box({x: 0, y: 2});
        */
    }

    public update()
    {
        
    }

    public static projectToScreen(position: THREE.Vector3)
    {
        const scene = ThreeScene.Instance;

        const size = Gameface.Instance.getGameSize();

        const vector = position.clone().project(scene.third.camera);
        const widthHalf = size.x / 2;
        const heightHalf = size.y / 2;
        
        const screenPosition = new THREE.Vector2(
            (vector.x * widthHalf) + widthHalf,
            -(vector.y * heightHalf) + heightHalf
        );

        return screenPosition;
    }
}