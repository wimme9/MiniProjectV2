class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65);

        this.add.text(W / 2, H / 2 - 90, 'PAUSED', {
            fontSize: '54px',
            fontFamily: 'Sarabun, Tahoma, sans-serif',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 40, 'เกมหยุดชั่วคราว', {
            fontSize: '20px',
            fontFamily: 'Sarabun, Tahoma, sans-serif',
            fill: '#0ff'
        }).setOrigin(0.5);

        this.createButton(W / 2, H / 2 + 30, 'เล่นต่อ (Resume)', () => {
            this.resumeGame();
        });

        this.createButton(W / 2, H / 2 + 100, 'กลับหน้าแรก (Main Menu)', () => {
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('TitleScene');
        });

        this.add.text(W / 2, H / 2 + 160, 'กด P หรือ ESC เพื่อเล่นต่อ', {
            fontSize: '16px',
            fontFamily: 'Sarabun, Tahoma, sans-serif',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-P', () => this.resumeGame());
        this.input.keyboard.once('keydown-ESC', () => this.resumeGame());
    }

    resumeGame() {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.bgm) {
            gameScene.bgm.resume();
        }

        this.scene.stop();
        this.scene.resume('GameScene');
    }

    createButton(x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontSize: '22px',
            fontFamily: 'Sarabun, Tahoma, sans-serif',
            fontStyle: 'bold',
            fill: '#ffffff',
            backgroundColor: '#1e88e5',
            padding: { x: 22, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ fill: '#ffe600' }));
        btn.on('pointerout', () => btn.setStyle({ fill: '#ffffff' }));
        btn.on('pointerdown', callback);

        return btn;
    }
}
