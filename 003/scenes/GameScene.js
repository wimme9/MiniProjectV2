class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.score = 0;
        this.hp = 3;
        this.gameOver = false;
        this.facingLeft = false; // ใช้เช็คทิศทางล่าสุด ป้องกันอาการ "มูนวอค"/วาปตอนหัน
    }

    preload() {
        this.load.json('gameConfig', 'data/game_config.json');

        this.load.image('background', 'assets/images/bg.png');

        this.load.spritesheet('player_idle', 'assets/images/playeridle.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        this.load.spritesheet('player_run', 'assets/images/playerrun.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        this.load.image('star', 'assets/images/goldstar.png');
        this.load.image('bomb', 'assets/images/bomb.png');
        this.load.image('hp', 'assets/images/hp.png');

        // โหลดไฟล์เสียงจากโฟลเดอร์ assets/audio/
        this.load.audio('bgm', 'assets/audio/song.mp3');
        this.load.audio('collect', 'assets/audio/collector.mp3');
        this.load.audio('hit', 'assets/audio/hit.mp3');
        this.load.audio('gameover_sound', 'assets/audio/gameover.mp3');
    }

    create() {
        const W = this.scale.width;   // 960
        const H = this.scale.height;  // 640

        // พื้นหลัง: ยืดให้เต็มจอเสมอ ไม่ว่าจะปรับขนาดจอเท่าไหร่ (แก้ปัญหาพื้นหลังไม่เต็ม/ผิดสัดส่วน)
        this.add.image(W / 2, H / 2, 'background').setDisplaySize(W, H);

        const configData = this.cache.json.get('gameConfig');
        this.settings = configData.settings;
        this.itemConfigs = configData.objects;

        this.timeLeft = this.settings.time_limit;
        this.hp = this.settings.starting_hp;

        // เล่นเพลงประกอบฉากหลัง (วนลูป, ปรับความดัง 0.5)
        this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
        this.bgm.play();

        // สร้างผู้เล่น (ขยายใหญ่ขึ้นให้มองเห็นชัด)
        this.player = this.physics.add.sprite(W / 2, H - 90, 'player_idle', 0);
        this.player.setCollideWorldBounds(true);
        this.player.body.setAllowGravity(false);
        this.player.setScale(2.4);

        // ปรับกล่องชน (hitbox) ให้เล็กลงตามตัวละครที่มองเห็นจริง
        // (ค่าที่ตั้งเป็นขนาด "ก่อนสเกล" เอนจิ้นจะคูณ scale ให้เองอัตโนมัติ)
        // กล่องชนถูกจัดให้อยู่กึ่งกลางเฟรมพอดี (11 + 26 + 11 = 48) จึงไม่ขยับเวลากลับด้าน (flipX)
        this.player.body.setSize(26, 34);
        this.player.body.setOffset(11, 14);

        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!this.anims.exists('walk')) {
            this.anims.create({
                key: 'walk',
                frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 5 }),
                frameRate: 14,
                repeat: -1
            });
        }

        this.player.anims.play('idle', true);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.input.keyboard.on('keydown-P', () => this.pauseGame());
        this.input.keyboard.on('keydown-ESC', () => this.pauseGame());

        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '26px',
            fontFamily: 'Sarabun, Tahoma, sans-serif',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });

        // กล่องพื้นหลังให้ตัวเวลา เพื่อให้อ่านง่ายขึ้นไม่ว่าพื้นหลังจะสีอะไร
        this.add.rectangle(W / 2, 30, 160, 40, 0x000000, 0.55).setStrokeStyle(2, 0xffe600, 0.8);
        this.timeText = this.add.text(W / 2, 30, `Time: ${this.timeLeft}`, {
            fontSize: '26px',
            fontFamily: 'Sarabun, Tahoma, sans-serif',
            fill: '#ffe600',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(W - 20, 60, '⏸', { fontSize: '36px', fill: '#fff' })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.pauseGame());

        this.hpGroup = this.add.group();
        this.updateHPIcons();

        this.items = this.physics.add.group();

        this.time.addEvent({
            delay: 1000,
            callback: this.spawnItem,
            callbackScope: this,
            loop: true
        });

        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                this.timeText.setText(`Time: ${this.timeLeft}`);
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            },
            callbackScope: this,
            loop: true
        });

        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);
    }

    update() {
        if (this.gameOver) return;

        const goingLeft = this.cursors.left.isDown || this.keyA.isDown;
        const goingRight = this.cursors.right.isDown || this.keyD.isDown;

        if (goingLeft) {
            this.player.setVelocityX(-this.settings.player_speed);
            // สลับทิศ -> บังคับเล่นแอนิเมชันใหม่ตั้งแต่เฟรมแรกเสมอ
            // แก้ปัญหาตัวละครวาป/เดินย้อนแบบมูนวอคตอนกลับทิศกะทันหัน
            if (!this.facingLeft || this.player.anims.currentAnim?.key !== 'walk') {
                this.player.setFlipX(true);
                this.player.anims.play('walk', true);
                this.facingLeft = true;
            }
        } else if (goingRight) {
            this.player.setVelocityX(this.settings.player_speed);
            if (this.facingLeft || this.player.anims.currentAnim?.key !== 'walk') {
                this.player.setFlipX(false);
                this.player.anims.play('walk', true);
                this.facingLeft = false;
            }
        } else {
            this.player.setVelocityX(0);
            if (this.player.anims.currentAnim?.key !== 'idle') {
                this.player.anims.play('idle', true);
            }
        }

        this.items.children.iterate((item) => {
            if (item && item.y > this.scale.height) {
                item.destroy();
            }
        });
    }

    spawnItem() {
        if (this.gameOver) return;

        const chosenConfig = Phaser.Math.RND.pick(this.itemConfigs);
        const x = Phaser.Math.Between(60, this.scale.width - 60);

        const item = this.items.create(x, 0, chosenConfig.id);
        item.setVelocityY(chosenConfig.fall_speed);
        item.setData('config', chosenConfig);

        // ขยายของที่ตกลงมาให้มองเห็นชัดขึ้น
        item.setScale(1.5);

        // ปรับกล่องชนให้กระชับตามรูปจริง (ตัดขอบโปร่งใสออก) — ค่าเป็นขนาดก่อนสเกล
        if (chosenConfig.id === 'bomb') {
            item.body.setSize(36, 48);
            item.body.setOffset(2, 1);
        } else {
            item.body.setSize(38, 38);
            item.body.setOffset(1, 5);
        }
    }

    collectItem(player, item) {
        const config = item.getData('config');
        const x = item.x;
        const y = item.y;

        let pointsText = '';
        let textColor = '#ffff00';

        if (config.type === 'Hazard' || config.id === 'bomb') {
            this.score -= 15;
            this.hp -= config.damage;
            this.updateHPIcons();
            pointsText = '-15';
            textColor = '#ff3333';

            // เล่นเสียงโดนระเบิด
            this.sound.play('hit');

            if (this.hp <= 0) {
                this.endGame();
            }
        } else {
            this.score += 10;
            pointsText = '+10';

            // เล่นเสียงเก็บดาว
            this.sound.play('collect');
        }

        if (this.score < 0) this.score = 0;
        this.scoreText.setText('Score: ' + this.score);

        this.showFloatingText(x, y, pointsText, textColor);

        item.destroy();
    }

    showFloatingText(x, y, message, color) {
        const floatText = this.add.text(x, y, message, {
            fontSize: '22px',
            fontFamily: 'Sarabun, Tahoma, sans-serif',
            fontStyle: 'bold',
            fill: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Sine.easeOut',
            onComplete: () => {
                floatText.destroy();
            }
        });
    }

    updateHPIcons() {
        this.hpGroup.clear(true, true);
        for (let i = 0; i < this.hp; i++) {
            this.hpGroup.create(this.scale.width - 40 - (i * 38), 26, 'hp').setScale(1.0);
        }
    }

    endGame() {
        this.gameOver = true;
        this.physics.pause();
        this.gameTimer.remove();

        // ชนะ = เวลาหมดแบบยังมี HP เหลือ, แพ้ = HP หมดก่อนเวลาจะหมด
        const isWin = this.hp > 0;

        // หยุดเพลงประกอบฉากหลัง
        if (this.bgm) {
            this.bgm.stop();
        }

        // เล่นเสียง Game Over
        this.sound.play('gameover_sound');

        // บันทึก High Score ถ้าคะแนนรอบนี้สูงกว่าเดิม
        const isNewHighScore = HighScore.submit(this.score);

        this.scene.start('GameOverScene', { score: this.score, isNewHighScore: isNewHighScore, isWin: isWin });
    }

    pauseGame() {
        if (this.gameOver) return;
        if (this.bgm) {
            this.bgm.pause(); // หยุดเพลงชั่วคราวตอนกด Pause
        }
        this.scene.pause();
        this.scene.launch('PauseScene');
    }
}
