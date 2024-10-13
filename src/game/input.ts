import Phaser from 'phaser';
import { BaseObject } from '../shared/baseObject';
import { Debug } from '../shared/debug';
import { getIsMobile } from '../shared/utils';

class Pointer {

    public input: Phaser.Input.InputPlugin;
    public id: number;
    public wasActive: boolean = false;
    public position = new Phaser.Math.Vector2(0, 0);

    constructor(input: Phaser.Input.InputPlugin, id: number)
    {
        this.input = input;
        this.id = id;
    }

    public getPointer()
    {
        let pointer: Phaser.Input.Pointer | undefined;

        if(this.id == 1)
        {
            if(getIsMobile())
            {
                pointer = this.input.pointer1;
            } else {
                pointer = this.input.activePointer;
            }
        }   
        if(this.id == 2) pointer = this.input.pointer2;
        if(this.id == 3) pointer = this.input.pointer3;

        if(!pointer) throw `Pointer ${this.id} didnt detect its pointer`;

        return pointer;
    }

    public isActive()
    {
        const pointer = this.getPointer();
        return pointer.isDown;
    }

    public getPointerPosition()
    {
        const pointer = this.getPointer();
        return new Phaser.Math.Vector2(pointer.x, pointer.y);
    }

    public onDown()
    {
        this.wasActive = true;

        this.updatePosition();

        const position = this.position;
        
        console.log(`[pointer ${this.id}] is down at ${position.x}, ${position.y}`);
    }

    public onUp()
    {
        this.wasActive = false;

        this.updatePosition();

        const position = this.position;

        console.log(`[pointer ${this.id}] is up at ${position.x}, ${position.y}`);
    }

    public updatePosition()
    {
        const position = this.getPointerPosition();
        this.position.set(position.x, position.y);
    }
}

export class Input extends BaseObject
{
    public static Instance: Input;
    public static events = new Phaser.Events.EventEmitter();
    public static mousePosition = new Phaser.Math.Vector2();
    public static previousPointerThatWentUp = 0;
    public static previousPointerThatWentDown = 0;

    public get scene() { return this._scene!; }

    private _scene?: Phaser.Scene;

    private _keysPressed: Map<string, boolean> = new Map<string, boolean>();
    private _keysJustDown: string[] = [];
    private _keysJustUp: string[] = [];
    private _mouseDown: boolean = false;
    private _mouse2Down: boolean = false;

    private _pointers = new Map<number, Pointer>();

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
        
        this._pointers.set(1, new Pointer(input, 1));
        this._pointers.set(2, new Pointer(input, 2));
        this._pointers.set(3, new Pointer(input, 3));

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

            //console.log(`pointermove`);

            /*
            const input = this.scene.input;

            let pointer1 = input.activePointer.isDown ? input.activePointer : undefined;
            if(input.pointer1?.isDown) pointer1 = input.pointer1;


            console.log("1: ", pointer1?.x, pointer1?.y);
            console.log("2: ", input.pointer2?.x, input.pointer2?.y);
            console.log("3: ", input.pointer3?.x, input.pointer3?.y);
            */

            //const oldPosition = Input.mousePosition.clone();

            this.updateMousePosition(pointer);
            this.checkPointerMove();

            //const newPosition = Input.mousePosition.clone();

            //const movement = newPosition.subtract(oldPosition);

            if(!getIsMobile())
            {
                Input.events.emit('pointermove', this._pointers.get(1), pointer.movementX, pointer.movementY);
            }

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
        console.log(`pointer down`);

        for(const pointer of this._pointers.values())
        {
            if(pointer.isActive() && !pointer.wasActive)
            {
                pointer.onDown();
            }

            console.log(pointer.id, pointer.isActive());
        }

        if(pointer.button == 2)
        {
            this._mouse2Down = true;
        } else {
            this._mouseDown = true;
        }

        Input.events.emit('pointerdown', pointer, Input.previousPointerThatWentDown);
    }

    private onPointerUp(pointer: PointerEvent)
    {
        console.log(`pointer up`);
       
        for(const pointer of this._pointers.values())
        {
            if(!pointer.isActive() && pointer.wasActive)
            {
                pointer.onUp();
            }
            console.log(pointer.id, pointer.isActive());
        }

        if(pointer.button == 2)
        {
            this._mouse2Down = false;
        } else {
            this._mouseDown = false;
        }

        Input.events.emit('pointerup', pointer, Input.previousPointerThatWentUp);
    }

    public checkPointerMove()
    {
        for(const pointer of this._pointers.values())
        {
            if(!pointer.isActive()) continue;

            const prevPos = pointer.position;
            const newPos = pointer.getPointerPosition();
            const diff = newPos.subtract(prevPos);

            //console.log(`was: `, prevPos);
            //console.log(`is: `, newPos);
            //console.log(`diff: `, diff);

            if(diff.length() > 0)
            {
                console.log(`[pointer ${pointer.id}] moved ${diff.x.toFixed(1)}, ${diff.y.toFixed(2)}`);

                Input.events.emit('pointermove', pointer, diff.x, diff.y);
            }

            pointer.updatePosition();
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