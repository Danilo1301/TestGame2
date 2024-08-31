import Phaser from "phaser";

export const gameSize: Phaser.Math.Vector2 = new Phaser.Math.Vector2(900, 600);

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

