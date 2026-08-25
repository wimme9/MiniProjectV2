import MainMenuScene from "./scenes/MainMenuScene.js";
import GameplayScene from "./scenes/GameplayScene.js";
import PC from "./scenes/PC.js";
import MapScene from "./scenes/map.js";
import QuestScene from "./scenes/QuestScene.js";
import NoteScene from "./scenes/NoteScene.js";
import VictoryScene from "./scenes/VictoryScene.js";
import GameOverScene from "./scenes/GameOverScene.js";
import DevNoticeScene from "./scenes/DevNoticeScene.js";

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a1a',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 0 }, 
            debug: false 
        }
    },
    dom: {
        createContainer: true
    },
    scene: [ MainMenuScene, GameplayScene, PC, MapScene, QuestScene, NoteScene, VictoryScene, GameOverScene, DevNoticeScene ]
};

const game = new Phaser.Game(config);