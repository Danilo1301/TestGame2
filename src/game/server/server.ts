import { v4 as uuidv4 } from 'uuid';
import { Game } from '../game/game';

export class Server
{
    public get id() { return this._id; }
    public get name() { return this._name; }
    public get game() { return this._game; }

    private _id: string = uuidv4();
    private _name: string = "Server";
    private _game: Game;

    constructor()
    {
        this._game = new Game();
    }
}