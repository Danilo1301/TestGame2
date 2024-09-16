import Phaser from 'phaser';
import { BaseObject } from "../baseObject";
import { Debug } from "../debug/debug";

export class Input extends BaseObject
{
    public static Instance: Input;
    public static events = new Phaser.Events.EventEmitter();
    public static mousePosition = new Phaser.Math.Vector2();

    public get scene() { return this._scene!; }

    private _scene?: Phaser.Scene;

    private _keysPressed: Map<string, boolean> = new Map<string, boolean>();
    private _mouseDown: boolean = false;

    public get sceneInput() { return this.scene.input; }

    constructor()
    {
        super();

        Input.Instance = this;
    }

    public init(scene: Phaser.Scene)
    {
        this._scene = scene;

        const input = scene.input;
        const keyboard = input.keyboard;
        
        if(!keyboard)
        {
            throw "Keyboard is null!";
        }

        keyboard.on('keydown', (event: KeyboardEvent) => {
            this.onKeyPress(event.key);
        });

        keyboard.on('keyup', (event: KeyboardEvent) => {
            this.onKeyUp(event.key);
        });
        
        input.on('pointerdown', (pointer: PointerEvent) => {

            /*
            const sound = scene.game.sound;

            if(sound instanceof Phaser.Sound.WebAudioSoundManager) {
                if(sound.context.state == 'suspended') {
                    sound.context.resume()
                }
            }
            */

            this.updateMousePosition(pointer)
            this.onPointerDown(pointer);
        });

        input.on('pointerup', (pointer: PointerEvent) => {
            this.updateMousePosition(pointer)
            this.onPointerUp(pointer);
        });

        input.on('pointermove', (pointer: PointerEvent) => {

            //console.log(pointer.movementX)
            //console.log(pointer.movementY)

            //const oldPosition = Input.mousePosition.clone();

            this.updateMousePosition(pointer)

            //const newPosition = Input.mousePosition.clone();

            //const movement = newPosition.subtract(oldPosition);

            Input.events.emit('pointermove', pointer, pointer.movementX, pointer.movementY);
        });
    }

    public updateMousePosition(pointer: PointerEvent)
    {
        Input.mousePosition.x = pointer.x;
        Input.mousePosition.y = pointer.y;
    }

    private onKeyPress(key: string)
    {
        key = key.toUpperCase();

        Debug.log("Input", `key press: ${key}`);

        this._keysPressed.set(key, true);
    }

    private onKeyUp(key: string)
    {
        key = key.toUpperCase();
        
        //Debug.log("Input", `key up: ${key}`);

        this._keysPressed.set(key, false);
    }

    private onPointerDown(pointer: PointerEvent)
    {
        Input.events.emit('pointerdown', pointer);

        if(this._mouseDown) return;

        this._mouseDown = true;
    }

    private onPointerUp(pointer: PointerEvent)
    {
        Input.events.emit('pointerup', pointer);

        if(!this._mouseDown) return;

        this._mouseDown = false;
    }

    public static isKeyDown(key: string)
    {
        if(!Input.Instance) return false;
        if(!Input.Instance._keysPressed.has(key)) return false;

        return Input.Instance._keysPressed.get(key);
    }

    public static isPointInsideRect(pos: Phaser.Math.Vector2, rectPos: Phaser.Math.Vector2, rectSize: Phaser.Math.Vector2)
    {
        if (pos.x >= rectPos.x && pos.x <= rectPos.x + rectSize.x)
        {
            if (pos.y >= rectPos.y && pos.y <= rectPos.y + rectSize.y)
            {
                return true;
            }
        }
    
        return false;
    }
}