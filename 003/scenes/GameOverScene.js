class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.isNewHighScore = data.isNewHighScore || false;
        this.isWin = data.isWin || false;
        this.highScore = HighScore.get();
    }

    preload() {
        this.load.image('background', 'assets/images/bg.png');
        this.load.image('star', 'assets/images/goldstar.png');
        this.load.image('bomb', 'assets/images/bomb.png');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const fontFamily = 'Sarabun, Tahoma, sans-serif';

        // พื้นหลัง (มืดลงเล็กน้อยเพื่อบรรยากาศจบเกม)
        this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5);

        // หัวข้อ: ชนะหรือแพ้
        const titleLabel = this.isWin ? 'YOU WIN!' : 'GAME OVER';
        const titleColor = this.isWin ? '#00ff88' : '#ff3333';
        const titleStroke = this.isWin ? '#003d1f' : '#550000';

        const gameOverText = this.add.text(W / 2, 160, titleLabel, {
            fontSize: '68px',
            fontFamily: fontFamily,
            fontStyle: 'bold',
            fill: titleColor,
            stroke: titleStroke,
            strokeThickness: 8,
            shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 6, fill: true }
        }).setOrigin(0.5);

        gameOverText.setScale(0.7);
        this.tweens.add({
            targets: gameOverText,
            scale: 1,
            duration: 500,
            ease: 'Back.Out'
        });

        // ไอคอนตกแต่งซ้าย-ขวา: ดาวถ้าชนะ ระเบิดถ้าแพ้
        const decorKey = this.isWin ? 'star' : 'bomb';
        this.add.image(W / 2 - 240, 165, decorKey).setScale(1.3).setAlpha(0.85);
        this.add.image(W / 2 + 240, 165, decorKey).setScale(1.3).setAlpha(0.85);

        // กรอบคะแนนสุดท้าย
        this.add.rectangle(W / 2, 300, 400, 155, 0x000000, 0.55)
            .setStrokeStyle(2, 0xffe600, 0.9);

        this.add.image(W / 2 - 145, 285, 'star').setScale(1.1);
        this.add.image(W / 2 + 145, 285, 'star').setScale(1.1);

        this.add.text(W / 2, 253, 'FINAL SCORE', {
            fontSize: '18px',
            fontFamily: fontFamily,
            fill: '#0ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(W / 2, 290, `${this.finalScore}`, {
            fontSize: '40px',
            fontFamily: fontFamily,
            fill: '#ffe600',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // เส้นคั่นและ High Score
        this.add.text(W / 2, 335, `HIGH SCORE: ${this.highScore}`, {
            fontSize: '17px',
            fontFamily: fontFamily,
            fill: '#ffffff'
        }).setOrigin(0.5);

        // ป้าย "ทำสถิติใหม่" ถ้าเพิ่งทำ High Score ใหม่
        if (this.isNewHighScore) {
            const badge = this.add.text(W / 2, 365, '★ NEW HIGH SCORE! ★', {
                fontSize: '20px',
                fontFamily: fontFamily,
                fontStyle: 'bold',
                fill: '#00ff88',
                stroke: '#003d1f',
                strokeThickness: 5
            }).setOrigin(0.5);

            this.tweens.add({
                targets: badge,
                scale: { from: 0.85, to: 1.1 },
                duration: 450,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // ปุ่มเล่นใหม่
        this.createButton(W / 2, 440, 'เล่นใหม่ (Restart)', () => {
            this.scene.start('GameScene');
        });

        // ปุ่มกลับหน้าแรก
        this.createButton(W / 2, 505, 'กลับหน้าแรก (Main Menu)', () => {
            this.scene.start('TitleScene');
        });

        this.add.text(W / 2, 565, 'หรือกด SPACE เพื่อเล่นใหม่', {
            fontSize: '15px',
            fontFamily: fontFamily,
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }

    createButton(x, y, label, callback) {
        const fontFamily = 'Sarabun, Tahoma, sans-serif';
        const btn = this.add.text(x, y, label, {
            fontSize: '22px',
            fontFamily: fontFamily,
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
