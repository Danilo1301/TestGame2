import { Debug } from "../shared/debug";
import { Gameface } from "./gameface/gameface";
import { GameScene } from "./scenes/gameScene";

Debug.log("index", "index");

async function main()
{
    Debug.log("index", "main");

    //console.log(`waiting for ammo...`); // WHY AM I LOADING AMMO TWICE? THATS WHY IT WAS NOT WORKING OMG
    //await loadAmmo();
    
    const gameface = new Gameface();

    (window as any).gameface = gameface;
    (window as any).GameScene = GameScene;

    await gameface.start();
}

window.addEventListener('load', () => main());