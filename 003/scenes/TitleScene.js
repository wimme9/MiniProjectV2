class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload() {
        this.load.image('background', 'assets/images/bg.png');
        this.load.image('star', 'assets/images/goldstar.png');
        this.load.image('bomb', 'assets/images/bomb.png');
        this.load.image('hp', 'assets/images/hp.png');
        this.load.spritesheet('player_idle', 'assets/images/playeridle.png', {
            frameWidth: 48,
            frameHeight: 48
        });
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const fontFamily = 'Sarabun, Tahoma, sans-serif';

        // พื้นหลัง
        this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.15);

        // หัวข้อเกม
        const title = this.add.text(W / 2, 95, 'STAR COLLECTOR', {
            fontSize: '58px',
            fontFamily: fontFamily,
            fontStyle: 'bold',
            fill: '#ffe600',
            stroke: '#7a4b00',
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 6, fill: true }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            y: 85,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ตัวละครเดโมเดินโชว์ (ตกแต่ง)
        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
        }
        const demoPlayer = this.add.sprite(W / 2, 170, 'player_idle', 0).setScale(2.6);
        demoPlayer.play('idle');
        this.tweens.add({
            targets: demoPlayer,
            x: { from: W / 2 - 70, to: W / 2 + 70 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                demoPlayer.setFlipX(tween.data[0].current > tween.data[0].previous);
            }
        });

        // ป้าย High Score มุมขวาบน
        this.add.text(W - 20, 16, `HIGH SCORE: ${HighScore.get()}`, {
            fontSize: '16px',
            fontFamily: fontFamily,
            fill: '#ffe600',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0);

        // กรอบคำแนะนำวิธีเล่น
        this.add.rectangle(W / 2, 400, 640, 290, 0x000000, 0.55)
            .setStrokeStyle(2, 0x00ffff, 0.5);

        this.add.text(W / 2, 280, '★ วิธีเล่น (How to Play) ★', {
            fontSize: '25px',
            fontFamily: fontFamily,
            fill: '#0ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(W / 2, 315, '⬅ ➡  ลูกศร หรือ  A / D  : เคลื่อนที่ซ้าย-ขวา', {
            fontSize: '18px',
            fontFamily: fontFamily,
            fill: '#fff'
        }).setOrigin(0.5);

        // ดาว
        this.add.image(W / 2 - 210, 360, 'star').setScale(1.1);
        this.add.text(W / 2 - 175, 360, '= เก็บดาว ได้ +10 คะแนน', {
            fontSize: '17px',
            fontFamily: fontFamily,
            fill: '#fff'
        }).setOrigin(0, 0.5);

        // ระเบิด
        this.add.image(W / 2 - 210, 400, 'bomb').setScale(1.1);
        this.add.text(W / 2 - 175, 400, '= โดนระเบิด เสีย HP และ -15 คะแนน', {
            fontSize: '17px',
            fontFamily: fontFamily,
            fill: '#fff'
        }).setOrigin(0, 0.5);

        // HP
        this.add.image(W / 2 - 210, 440, 'hp').setScale(0.95);
        this.add.text(W / 2 - 175, 440, '= พลังชีวิต (HP) หมดแล้วจบเกม', {
            fontSize: '17px',
            fontFamily: fontFamily,
            fill: '#fff'
        }).setOrigin(0, 0.5);

        // Pause
        this.add.text(W / 2, 480, '⏸  กด P หรือ ESC เพื่อหยุดเกมชั่วคราว', {
            fontSize: '17px',
            fontFamily: fontFamily,
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(W / 2, 515, 'อยู่รอดให้ครบเวลา และเก็บคะแนนให้ได้มากที่สุด!', {
            fontSize: '16px',
            fontFamily: fontFamily,
            fill: '#ff0',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // ข้อความเริ่มเกม (กระพริบ)
        const startText = this.add.text(W / 2, 585, 'กด SPACE หรือคลิก เพื่อเริ่มเกม', {
            fontSize: '23px',
            fontFamily: fontFamily,
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}
