import { Gameface } from "../../gameface/gameface";
import { ThreeScene } from "../../three/threeScene";
import { ClientGameObject } from "../../gameObject/clientGameObject";
import { GameObject } from "../../gameObject/gameObject";

export class GameScene extends Phaser.Scene
{
    public static Instance: GameScene;

    public gameObjects = new Map<GameObject, ClientGameObject>();

    constructor()
    {
        super({});

        GameScene.Instance = this;
    }

    public async create()
    {
        
    }

    public update(time: number, delta: number)
    {
        Gameface.Instance.update(delta / 1000);

        const game = Gameface.Instance.game;

        for(const gameObject of game.gameObjects)
        {
            if(!this.gameObjects.has(gameObject))
            {
                const clientGameObject = new ClientGameObject(gameObject);
                this.gameObjects.set(gameObject, clientGameObject);
                clientGameObject.create();
            }
        }

        for(const gameObject of this.gameObjects.values())
        {
            gameObject.update();
        }
    }
}