import { Debug } from "../utils/debug/debug";
import { Gameface } from "./gameface/gameface";

Debug.log("index", "index");

const _window: any = window;

async function main()
{
    Debug.log("index", "main");

    //console.log(`waiting for ammo...`); // WHY AM I LOADING AMMO TWICE? THATS WHY IT WAS NOT WORKING OMG
    //await loadAmmo();
    
    const gameface = new Gameface();
    
    //tests
    _window["gameface"] = gameface;

    await gameface.start();

    Debug.log("index", "game started");
}

window.addEventListener('load', () => main());

//tests
_window["Debug"] = Debug;