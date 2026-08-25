// Game.js
import MenuScene from './Scene/MenuScene.js';
import GameplayScene from './Scene/GameplayScene.js';
import PauseScene from './Scene/PauseScene.js';
import VictoryScene from './Scene/VictoryScene.js';
import DefeatScene from './Scene/DefeatScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    // 💡 ตั้งค่าสเกลหน้าจอให้คมชัดตามความละเอียดของอุปกรณ์
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        resolution: window.devicePixelRatio || 2
    },
    // 💡 ปิด pixelArt และเปิด antialias เพื่อให้รูปการ์ดและตัวหนังสือไม่แตกเป็นเหลี่ยม
    render: {
        antialias: true,
        antialiasGL: true,
        pixelArt: false
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // <--- 📌 เปลี่ยนเป็น true เพื่อเปิดฮิตบ็อกซ์
        }
    },
    scene: [ MenuScene, GameplayScene, PauseScene, VictoryScene, DefeatScene ]
};

const game = new Phaser.Game(config);