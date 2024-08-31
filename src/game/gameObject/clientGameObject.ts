import { ExtendedObject3D } from "@enable3d/phaser-extension";
import { ThreeScene } from "../three/threeScene";
import { GameObject } from "./gameObject";
import { DebugText } from "../../utils/debug/debugText";
import { ammoQuaternionToThree, ammoVector3ToThree } from "../../utils/utils"
import THREE from "three";

export class ClientGameObject {
    public gameObject: GameObject;


    public threeGroup?: THREE.Group;
    //public object3d?: ExtendedObject3D;
    public debugText: DebugText;

    constructor(gameObject: GameObject)
    {
        this.gameObject = gameObject;
        this.debugText = new DebugText("GameObject");
    }

    public create()
    {
        const threeScene = ThreeScene.Instance;

        const box1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        const box2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        box2.position.set(0, 2, 0);

        const group = new THREE.Group();
        group.add(box1);
        group.add(box2);
        this.threeGroup = group;

        threeScene.third.add.existing(group);

        /*
        this.object3d = threeScene.third.add.box({
            x: 0, y: 0
        });
        */

        this.debugText.createDebugText();
    }

    public update()
    {
        if(!this.threeGroup) return;

        const body = this.gameObject.body;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();
        const rotation = transform.getRotation();

        this.threeGroup.position.set(position.x(), position.y(), position.z());
        this.threeGroup.setRotationFromQuaternion(ammoQuaternionToThree(rotation));
        //this.threeGroup.setRotationFromEuler(new THREE.Euler(20, 0, 0));

        this.debugText.set3DPosition(ammoVector3ToThree(position));
        this.debugText.update();
    }
}