import THREE from "three";
import { ClientGameObject } from "../gameObject/clientGameObject";
import { DebugText } from "../../utils/debug/debugText";
import { Ped } from "../entities/ped";
import { ThreeScene } from "../three/threeScene";

export class ClientPed extends ClientGameObject {

    public textUsername?: DebugText;
    public textTag?: DebugText;

    public ped!: Ped;
    
    public create()
    {
        super.create();

        this.ped = this.gameObject as Ped;

        this.textUsername = new DebugText("Username");
        this.textUsername.createDebugText();

        this.textTag = new DebugText("Tag");
        this.textTag.createDebugText();
    }

    public update(delta: number)
    {
        super.update(delta);

        //debugTextPosition.y += 2.3;
        //this.debugText.setTitle("Player");

        this.gltfModel?.object?.setRotationFromEuler(new THREE.Euler(0, this.gameObject.angle, 0));

        const position = this.gameObject.getPosition();
        position.y += 2.3;

        const screenPosition = ThreeScene.projectToScreen(position);
        
        if(this.textUsername)
        {
            this.textUsername.setTitle(this.ped.nickname);
            this.textUsername.text?.setColor(this.ped.nicknameColor);
            this.textUsername.position.set(screenPosition.x, screenPosition.y);
            this.textUsername.update();
        }

        if(this.textTag)
        {
            position.y += 0.5;

            this.textTag.setTitle(this.ped.tag);
            this.textTag.text?.setColor(this.ped.tagColor)
            this.textTag.position.set(screenPosition.x, screenPosition.y - 20);
            this.textTag.update();
        }
    }
}