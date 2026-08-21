class GamesScenes extends Phaser.Scene {
    constructor() {
        super('GamesScenes');

        this.isGameOver = false;
        this.isKnockedBack = false; 
        this.isInvincible = false;  

        this.hp = 100;
        this.maxHp = 100;
        this.hpBarGraphics = null;
        this.hpBg = null; 

        this.score = 0;
        this.scoreText = null;

        this.garbageGroup = null;
        this.carGroup = null;
        this.coinGroup = null;
        
        this.spawnGarbageEvent = null;
        this.spawnCarEvent = null;
        this.spawnCoinEvent = null;

        this.road = null;
        this.player = null;
        this.cursors = null;
        this.wasd = null;
        this.playerSpeed = 160;
        
        this.bgMusic = null; 
    }

    preload() {
        this.load.spritesheet('player_idle', 'Asset/idle.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('player_run', 'Asset/run.png', { frameWidth: 128, frameHeight: 128 });
        this.load.image('garbage', 'Asset/garbage.png');
        this.load.image('car', 'Asset/car.png');
        this.load.image('coin', 'Asset/Coin.png');
        
        this.load.audio('coin_sfx', 'sound/Sound_coins.mp3');
        this.load.audio('trash_sfx', 'sound/Sound_trash.mp3');
        this.load.audio('crash_sfx', 'sound/Sound_of_ a_collision.mp3'); 
        this.load.audio('gameover_sfx', 'sound/Sound_gameover.mp3');    
        this.load.audio('bgm', 'sound/Background_music.mp3');           
    }

    create() {
        this.isGameOver = false;
        this.hp = 100;
        this.score = 0;
        this.isInvincible = false;
        this.isKnockedBack = false;

        if (this.cache.audio.exists('bgm')) {
            this.bgMusic = this.sound.add('bgm', { volume: 0.3, loop: true });
            this.bgMusic.play();
        }

        let smokeGraphics = this.make.graphics({ add: false });
        smokeGraphics.fillStyle(0xcccccc, 1);
        smokeGraphics.fillCircle(5, 5, 5);
        smokeGraphics.generateTexture('smoke_particle', 10, 10);

        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x3e8948); 
        graphics.fillRect(0, 0, 400, 200);
        graphics.fillStyle(0x2c3e50); 
        graphics.fillRect(40, 0, 320, 200);
        graphics.fillStyle(0xdddddd);
        graphics.fillRect(40, 0, 5, 200);
        graphics.fillRect(355, 0, 5, 200);
        graphics.fillStyle(0xffcc00);
        graphics.fillRect(195, 25, 10, 100); 
        graphics.generateTexture('road_bg', 400, 200);
        
        this.road = this.add.tileSprite(200, 300, 400, 600, 'road_bg').setDepth(0);

        this.garbageGroup = this.physics.add.group();
        this.carGroup = this.physics.add.group();
        this.coinGroup = this.physics.add.group();

        this.spawnGarbageEvent = this.time.addEvent({ delay: 1500, callback: this.spawnGarbage, callbackScope: this, loop: true });
        this.spawnCarEvent = this.time.addEvent({ delay: 1000, callback: this.spawnCar, callbackScope: this, loop: true });
        this.spawnCoinEvent = this.time.addEvent({ delay: 3000, callback: this.spawnCoin, callbackScope: this, loop: true });

        this.player = this.physics.add.sprite(200, 500, 'player_idle').setDepth(20);
        this.player.setScale(1.5);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(30, 50);
        this.player.body.setOffset(49, 39);

        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 9 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 9 }), frameRate: 15, repeat: -1 });
        this.player.play('idle');

        this.physics.add.overlap(this.player, this.garbageGroup, this.collectGarbage, null, this);
        this.physics.add.overlap(this.player, this.carGroup, this.hitCar, null, this);
        this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.hpBg = this.add.graphics().setDepth(100);
        this.hpBg.fillStyle(0x000000, 0.6);
        this.hpBg.fillRect(10, 10, 120, 24);
        this.hpBg.lineStyle(3, 0xffffff, 0.8);
        this.hpBg.strokeRect(10, 10, 120, 24);

        this.hpBarGraphics = this.add.graphics().setDepth(100);
        this.updateHealthBar();

        this.scoreText = this.add.text(385, 12, 'SCORE: 0', {
            fontSize: '22px', 
            fill: '#ffffff', 
            fontFamily: 'Arial', 
            fontStyle: 'bold',
            stroke: '#000000',     
            strokeThickness: 4,    
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, stroke: true, fill: true } 
        }).setOrigin(1, 0).setDepth(100);

        let pauseBtn = this.add.text(10, 45, '⏸ PAUSE', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        }).setDepth(100).setInteractive({ useHandCursor: true });

        pauseBtn.on('pointerover', () => pauseBtn.setTint(0xaaaaaa));
        pauseBtn.on('pointerout', () => pauseBtn.clearTint());
        
        pauseBtn.on('pointerdown', () => {
            if (!this.isGameOver) {
                if (this.bgMusic) this.bgMusic.pause(); 
                this.scene.pause();           
                this.scene.launch('UISTOP');  
            }
        });
        
        this.events.on('resume', () => {
            if (this.bgMusic) this.bgMusic.resume();
        });
    }

    update() {
        if (this.isGameOver) return;

        let roadSpeed = 2 + Math.min(this.score / 50, 4);
        this.road.tilePositionY -= roadSpeed;

        this.carGroup.getChildren().forEach((car) => {
            if (car.active && car.isDrifting) {
                car.x += car.driftSpeed;
                if (car.x < 60 || car.x > 340) {
                    car.driftSpeed *= -1;
                }
            }
        });

        if (!this.isKnockedBack) { 
            this.player.setVelocity(0);
            let isMoving = false;

            if (this.wasd.left.isDown || this.cursors.left.isDown) {
                this.player.setVelocityX(-this.playerSpeed);
                this.player.setFlipX(true);
                isMoving = true;
            } else if (this.wasd.right.isDown || this.cursors.right.isDown) {
                this.player.setVelocityX(this.playerSpeed);
                this.player.setFlipX(false);
                isMoving = true;
            }

            if (this.wasd.up.isDown || this.cursors.up.isDown) {
                this.player.setVelocityY(-this.playerSpeed);
                isMoving = true;
            } else if (this.wasd.down.isDown || this.cursors.down.isDown) {
                this.player.setVelocityY(this.playerSpeed);
                isMoving = true;
            }

            if (isMoving) {
                if (this.player.anims.currentAnim.key !== 'run') this.player.play('run');
            } else {
                if (this.player.anims.currentAnim.key !== 'idle') this.player.play('idle');
            }
        }

        this.cleanupGroup(this.garbageGroup);
        this.cleanupGroup(this.carGroup);
        this.cleanupGroup(this.coinGroup);
    }

    cleanupGroup(group) {
        group.getChildren().forEach((item) => {
            if (item.active && item.y > 650) {
                if (item.smokeEmitter) item.smokeEmitter.destroy(); 
                item.destroy(); 
            }
        });
    }

    spawnGarbage() {
        let randomX = Phaser.Math.Between(50, 350);
        let item = this.garbageGroup.create(randomX, -50, 'garbage').setDepth(10); 
        item.setScale(0.08);
        item.body.setSize(item.width * 0.3, item.height * 0.3);
        item.body.setOffset((item.width - item.body.width) / 2, (item.height - item.body.height) / 2);
        
        let garbageSpeed = 150 + Math.min(this.score * 1.5, 150);
        item.setVelocityY(garbageSpeed);
    }

    spawnCar() {
        let randomX = Phaser.Math.Between(60, 340);
        let item = this.carGroup.create(randomX, -50, 'car').setDepth(20); 
        item.setScale(0.12);
        item.setFlipY(true);
        item.body.setSize(item.width * 0.2, item.height * 0.4);
        item.body.setOffset((item.width - item.body.width) / 2, (item.height - item.body.height) / 2);
        
        const carColors = [0xff0000, 0x0044ff, 0x00ff00, 0xffff00, 0x9900ff, 0x00ffff, 0xffffff];
        let randomColor = Phaser.Math.RND.pick(carColors);
        item.setTint(randomColor);

        let baseSpeed = Phaser.Math.Between(180, 320);
        let bonusSpeed = Math.min(this.score * 2, 200);
        item.setVelocityY(baseSpeed + bonusSpeed);

        let specialRoll = Phaser.Math.Between(1, 100);

        if (this.score >= 80 && specialRoll <= 35) {
            item.isDrifting = true;
            item.driftSpeed = Phaser.Math.RND.pick([-2.5, 2.5]); 
            item.setTint(0xff00ff); 
        } 
        else if (this.score >= 40 && specialRoll <= 60) {
            this.tweens.add({
                targets: item,
                angle: 360,          
                duration: 800,       
                repeat: -1           
            });
            item.setTint(0xff9900); 
        } 
        else {
            this.tweens.add({
                targets: item,
                angle: { from: -2, to: 2 },
                duration: 80,
                yoyo: true,
                repeat: -1
            });
        }

        let emitter = this.add.particles(0, 0, 'smoke_particle', {
            speed: { min: 20, max: 60 },
            angle: { min: 250, max: 290 }, 
            scale: { start: 1, end: 0 },   
            alpha: { start: 0.5, end: 0 }, 
            lifespan: 400,
            frequency: 50                  
        }).setDepth(19);                   

        emitter.startFollow(item, 0, -(item.displayHeight / 2) + 5);
        item.smokeEmitter = emitter; 
    }

    spawnCoin() {
        let randomX = Phaser.Math.Between(50, 350);
        let item = this.coinGroup.create(randomX, -50, 'coin').setDepth(10);
        item.setScale(0.08);
        item.body.setSize(item.width * 0.3, item.height * 0.3);
        item.body.setOffset((item.width - item.body.width) / 2, (item.height - item.body.height) / 2);
        item.setVelocityY(180);

        // 🌟 เพิ่มแอนิเมชันให้เหรียญหมุนติ้วๆ ตลอดเวลาที่ไหลลงมา
        this.tweens.add({
            targets: item,
            angle: 360,        // หมุนครบ 1 รอบ (360 องศา)
            duration: 1000,    // ใช้เวลา 1 วินาทีต่อ 1 รอบ
            repeat: -1,        // วนลูปไม่รู้จบ
            ease: 'Linear'     // หมุนด้วยความเร็วคงที่ สมูทๆ
        });
    }

    showFloatingText(x, y, message, color) {
        let floatText = this.add.text(x, y, message, {
            fontSize: '24px',
            fill: color,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(50); 

        this.tweens.add({
            targets: floatText,
            y: y - 60, 
            alpha: 0,  
            duration: 800, 
            ease: 'Cubic.easeOut',
            onComplete: () => {
                floatText.destroy(); 
            }
        });
    }

    playCollectEffect(item) {
        item.body.enable = false;
        item.setVelocityY(0);

        this.tweens.add({
            targets: item,
            scaleX: 0,           
            scaleY: 0,           
            angle: 720, // หมุนเร็วๆ 2 รอบตอนเก็บ        
            alpha: 0,            
            duration: 300,       
            ease: 'Back.easeIn', 
            onComplete: () => {
                item.destroy();  
            }
        });
    }

    collectGarbage(player, item) {
        if (this.cache.audio.exists('trash_sfx')) {
            this.sound.play('trash_sfx', { volume: 0.8 });
        }
        
        this.playCollectEffect(item);
        this.showFloatingText(item.x, item.y, '+10', '#ffffff');
        this.score += 10;
        this.scoreText.setText('SCORE: ' + this.score);
    }

    collectCoin(player, item) {
        if (this.cache.audio.exists('coin_sfx')) {
            this.sound.play('coin_sfx', { volume: 0.8 }); 
        }

        this.playCollectEffect(item);
        this.showFloatingText(item.x, item.y, '+20', '#ffd700');
        this.score += 20;
        this.scoreText.setText('SCORE: ' + this.score);
    }

    hitCar(player, car) {
        if (this.isInvincible || this.isGameOver) return;

        if (this.cache.audio.exists('crash_sfx')) {
            this.sound.play('crash_sfx', { volume: 0.9 });
        }

        this.showFloatingText(player.x, player.y - 30, '-5', '#ff0000');

        let bounceDirectionX = (this.player.x - car.x) * 3;

        car.disableBody(true, true); 
        if (car.smokeEmitter) {
            car.smokeEmitter.stop();
            car.smokeEmitter.destroy(); 
        }
        
        this.score -= 5;
        if (this.score < 0) this.score = 0;
        this.scoreText.setText('SCORE: ' + this.score);

        this.hp -= 20;
        if (this.hp < 0) this.hp = 0;
        this.updateHealthBar();

        if (this.hp <= 0) {
            this.gameOver();
            return;
        }

        this.isKnockedBack = true;
        this.isInvincible = true;

        this.player.setTint(0xff0000); 
        this.player.anims.stop();
        this.player.setVelocity(bounceDirectionX, 250);

        this.time.delayedCall(300, () => {
            if (!this.isGameOver) {
                this.isKnockedBack = false;
                this.player.clearTint();
                this.player.setVelocity(0);
                this.player.play('idle');

                this.tweens.add({
                    targets: this.player,
                    alpha: 0.3,
                    ease: 'Linear',
                    duration: 150,
                    yoyo: true,
                    repeat: 5
                });
            }
        });

        this.time.delayedCall(2000, () => {
            if (!this.isGameOver) {
                this.isInvincible = false;
                this.player.alpha = 1;
            }
        });
    }

    updateHealthBar() {
        this.hpBarGraphics.clear();
        
        let color = 0x00ff00; 
        if (this.hp <= 30) {
            color = 0xff0000; 
        } else if (this.hp <= 60) {
            color = 0xffff00; 
        }

        let width = (this.hp / this.maxHp) * 114; 
        this.hpBarGraphics.fillStyle(color, 1);
        this.hpBarGraphics.fillRect(13, 13, width, 18);
    }

    gameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.alpha = 1;
        this.player.anims.stop();
        
        if (this.spawnGarbageEvent) this.spawnGarbageEvent.remove();
        if (this.spawnCarEvent) this.spawnCarEvent.remove();
        if (this.spawnCoinEvent) this.spawnCoinEvent.remove();

        this.carGroup.getChildren().forEach(car => {
            if (car.active && car.smokeEmitter) car.smokeEmitter.stop();
        });

        if (this.bgMusic) this.bgMusic.stop();
        
        if (this.cache.audio.exists('gameover_sfx')) {
            this.sound.play('gameover_sfx', { volume: 1.0 });
        }

        this.scene.start('ScenesGameOver', { score: this.score });
    }
}