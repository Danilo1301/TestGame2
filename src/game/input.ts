import Phaser from 'phaser';
import { BaseObject } from '../shared/baseObject';
import { Debug } from '../shared/debug';

export class Input extends BaseObject
{
    public static Instance: Input;
    public static events = new Phaser.Events.EventEmitter();
    public static mousePosition = new Phaser.Math.Vector2();

    public get scene() { return this._scene!; }

    private _scene?: Phaser.Scene;

    private _keysPressed: Map<string, boolean> = new Map<string, boolean>();
    private _keysJustDown: string[] = [];
    private _keysJustUp: string[] = [];
    private _mouseDown: boolean = false;
    private _mouse2Down: boolean = false;

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

    public postUpdate()
    {
        this._keysJustDown = [];
        this._keysJustUp = [];
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
        this._keysJustDown.push(key);

        Input.events.emit('keydown', key);
    }

    private onKeyUp(key: string)
    {
        key = key.toUpperCase();
        
        //Debug.log("Input", `key up: ${key}`);

        this._keysPressed.set(key, false);
        this._keysJustUp.push(key);

        Input.events.emit('keyup', key);
    }

    private onPointerDown(pointer: PointerEvent)
    {
        Input.events.emit('pointerdown', pointer);

        if(pointer.button == 2)
        {
            this._mouse2Down = true;
        } else {
            this._mouseDown = true;
        }
    }

    private onPointerUp(pointer: PointerEvent)
    {
        Input.events.emit('pointerup', pointer);

        if(pointer.button == 2)
        {
            this._mouse2Down = false;
        } else {
            this._mouseDown = false;
        }
    }

    public static getKey(key: string)
    {
        if(!Input.Instance) return false;
        if(!Input.Instance._keysPressed.has(key)) return false;

        return Input.Instance._keysPressed.get(key);
    }

    public static getKeyDown(key: string)
    {
        return Input.Instance._keysJustDown.includes(key);
    }

    public static getKeyUp(key: string)
    {
        return Input.Instance._keysJustUp.includes(key);
    }

    public static isMouseDown()
    {
        return Input.Instance._mouseDown;
    }

    public static isMouse2Down()
    {
        return Input.Instance._mouse2Down;
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