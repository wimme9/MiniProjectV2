export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.finalScore = data.finalScore || 0;
    }

    create() {
        // --- 1. Dim Overlay Background (ปรับเป็นโทนสีดำเข้มอมแดงเลือดหมู) ---[cite: 7]
        this.add.rectangle(640, 360, 1280, 720, 0x0a0505, 0.9);

        // --- 2. ละอองประกายไฟ/เกล็ดดาบ (Gold Spark Particles) ---[cite: 7]
        const starGfx = this.add.graphics();
        starGfx.fillStyle(0xffd700, 1);
        starGfx.fillCircle(2, 2, 2);
        starGfx.generateTexture('goldSpark_victory', 4, 4);
        starGfx.destroy();

        this.add.particles(640, 0, 'goldSpark_victory', {
            x: { min: 0, max: 1280 },
            speedY: { min: 50, max: 200 },
            speedX: { min: -30, max: 30 },
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 0.1, end: 0.8 },
            tint: [0xd4af37, 0xff4500, 0x8b0000, 0xffd700],
            lifespan: 5000,
            quantity: 2
        });

        // --- 3. Panel Box พร้อมอนิเมชันเด้งขึ้นมาตอนเปิดฉาก (โทนเหล็กกล้า/เลือดหมู) ---[cite: 7]
        const panelContainer = this.add.container(640, 360);
        
        const panel = this.add.graphics();
        panel.fillStyle(0x120808, 0.95);
        panel.fillRoundedRect(-250, -230, 500, 460, 20);
        panel.lineStyle(3, 0x8b0000, 0.9);
        panel.strokeRoundedRect(-250, -230, 500, 460, 20);

        const panelGlow = this.add.graphics();
        panelGlow.lineStyle(1, 0xd4af37, 0.6);
        panelGlow.strokeRoundedRect(-246, -226, 492, 452, 16);

        panelContainer.add([panel, panelGlow]);

        panelContainer.setScale(0.8);
        panelContainer.setAlpha(0);
        this.tweens.add({
            targets: panelContainer,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: 'Back.out'
        });

        // --- 4. ข้อความหัวข้อและคะแนน (โทนสีทองและเพลิงซามูไร) ---[cite: 7]
        const titleText = this.add.text(640, 195, '⚔️ VICTORY ⚔️', {
            fontSize: '42px',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: titleText,
            scale: { from: 1, to: 1.05 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(640, 275, 'YOUR FINAL SCORE', {
            fontSize: '18px', fill: '#d4af37', fontStyle: 'bold'
        }).setOrigin(0.5);

        const scoreText = this.add.text(640, 330, `${this.finalScore}`, {
            fontSize: '56px',
            fill: '#ff4500',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: scoreText,
            scale: { from: 0.95, to: 1.05 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- 5. ปุ่มกด (PLAY AGAIN / MAIN MENU) ---[cite: 7]
        this.createButton(640, 435, 'PLAY AGAIN', 0x8b0000, 0xd4af37, () => {
            this.scene.start('GameplayScene');
        });

        this.createButton(640, 515, 'MAIN MENU', 0x1a0505, 0xff4500, () => {
            this.scene.start('MenuScene');
        });
    }

    createButton(x, y, label, baseColor, strokeColor, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(baseColor, 1);
        bg.fillRoundedRect(-140, -25, 280, 50, 12);
        bg.lineStyle(2, strokeColor, 0.8);
        bg.strokeRoundedRect(-140, -25, 280, 50, 12);

        const txt = this.add.text(0, 0, label, {
            fontSize: '18px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        container.add([bg, txt]);
        container.setSize(280, 50);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scale: 1.06,
                duration: 150,
                ease: 'Power1'
            });
            bg.clear();
            bg.fillStyle(strokeColor, 1);
            bg.fillRoundedRect(-140, -25, 280, 50, 12);
            bg.lineStyle(2, 0xffffff, 1);
            bg.strokeRoundedRect(-140, -25, 280, 50, 12);
            txt.setFill('#0a0505');
        });

        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scale: 1.0,
                duration: 150,
                ease: 'Power1'
            });
            bg.clear();
            bg.fillStyle(baseColor, 1);
            bg.fillRoundedRect(-140, -25, 280, 50, 12);
            bg.lineStyle(2, strokeColor, 0.8);
            bg.strokeRoundedRect(-140, -25, 280, 50, 12);
            txt.setFill('#ffffff');
        });

        container.on('pointerdown', callback);
    }
}