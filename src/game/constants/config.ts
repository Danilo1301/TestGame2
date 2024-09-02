import Phaser from "phaser";

import { isMobile } from "../../utils/utils";

export const gameSettings = {
    clientSendDataInterval: 50,
    serverSendDataInterval: 50
}

export const getIsMobile = () => {
    if(location.href.includes("#mobile")) return true;
    return isMobile.any() != null;
};

export const gameSize: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1280, 720);

export const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    transparent: true,
    width: gameSize.x,
    height: gameSize.y,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameSize.x,
        height: gameSize.y
    },
    scene: [],
    audio: {
        disableWebAudio: false
    }
}

