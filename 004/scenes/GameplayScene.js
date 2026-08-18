export class GameplayScene extends Phaser.Scene {

    constructor() {

        super({
            key: 'GameplayScene'
        });

        // =====================================================
        // GAME VARIABLES
        // =====================================================

        this.score = 0;
        this.hearts = 3;
        this.timeLeft = 60;

        this.gameEnded = false;

        this.bgm = null;
        this.gameTimer = null;
        this.spawnTimer = null;

        this.itemsGroup = null;

        this.heartIcons = [];

        this.warningActive = false;

        this.cursors = null;
        this.keyA = null;
        this.keyD = null;
        this.keyESC = null;

        // =====================================================
        // SOUND
        // =====================================================

        this.soundButton = null;

        // false = เปิดเสียง
        // true  = ปิดเสียง
        this.musicMuted = false;
    }


    // =========================================================
    // PRELOAD
    // =========================================================

    preload() {

        // =====================================================
        // GAME DATA
        // =====================================================

        this.load.json(
            'gameData',
            'data/gamedata.json'
        );


        // =====================================================
        // PLAYER
        // =====================================================

        this.load.image(
            'player',
            'asset/takla_player.png'
        );


        // =====================================================
        // FRUITS
        // =====================================================

        this.load.image(
            'fruit1',
            'asset/1.png'
        );

        this.load.image(
            'fruit2',
            'asset/2.png'
        );

        this.load.image(
            'fruit3',
            'asset/3.png'
        );


        // =====================================================
        // SPECIAL ITEMS
        // =====================================================

        this.load.image(
            'bonus',
            'asset/bonus.png'
        );

        this.load.image(
            'bomb',
            'asset/bomb.png'
        );


        // =====================================================
        // UI
        // =====================================================

        this.load.image(
            'heart',
            'asset/heart (2).png'
        );

        this.load.image(
            'pauseBtn',
            'asset/pausebutton.png'
        );


        // =====================================================
        // AUDIO
        // =====================================================

        this.load.audio(
            'collectSound',
            'asset/correct_answer.mp3'
        );

        this.load.audio(
            'bgm',
            'asset/game sound.mp3'
        );

        this.load.audio(
            'winSound',
            'asset/winning.mp3'
        );

        this.load.audio(
            'bombSound',
            'asset/bomb.mp3'
        );
    }


    // =========================================================
    // CREATE
    // =========================================================

    create() {

        const {
            width,
            height
        } = this.scale;


        // =====================================================
        // RESET GAME STATE
        // =====================================================

        this.gameEnded = false;

        this.score = 0;

        this.warningActive = false;

        this.soundButton = null;


        // =====================================================
        // SOUND STATE
        // =====================================================

        if (
            this.registry.has('musicMuted')
        ) {

            this.musicMuted =
                this.registry.get(
                    'musicMuted'
                );

        }

        else {

            this.musicMuted = false;

            this.registry.set(
                'musicMuted',
                false
            );

        }


        // =====================================================
        // LOAD GAME CONFIG
        // =====================================================

        this.gameConfig =
            this.cache.json.get(
                'gameData'
            );


        if (
            !this.gameConfig
        ) {

            console.error(
                'ไม่พบ gamedata.json'
            );

            return;
        }


        // =====================================================
        // INITIAL VALUES
        // =====================================================

        this.hearts =
            Number(
                this.gameConfig.initialHearts
            ) || 3;


        this.timeLeft =
            Number(
                this.gameConfig.gameDuration
            ) || 60;


        // =====================================================
        // BACKGROUND
        // =====================================================

        this.createBackground();


        // =====================================================
        // UI
        // =====================================================

        this.createTopUI();


        // =====================================================
        // PLAYER
        // =====================================================

        this.player =
            this.physics.add.sprite(

                width / 2,

                height - 105,

                'player'

            );


        this.player.setCollideWorldBounds(
            true
        );


        this.player.setScale(
            0.1
        );


        this.player.setDepth(
            10
        );


        // =====================================================
        // PLAYER SHADOW
        // =====================================================

        this.playerShadow =
            this.add.ellipse(

                width / 2,

                height - 60,

                100,

                20,

                0x000000,

                0.25

            );


        this.playerShadow.setDepth(
            5
        );


        // =====================================================
        // KEYBOARD
        // =====================================================

        this.cursors =
            this.input.keyboard.createCursorKeys();


        this.keyA =
            this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.A
            );


        this.keyD =
            this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.D
            );


        this.keyESC =
            this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.ESC
            );


        // =====================================================
        // ESC PAUSE
        // =====================================================

        this.input.keyboard.on(
            'keydown-ESC',
            () => {

                if (
                    !this.gameEnded
                ) {

                    this.pauseGame();

                }

            }
        );


        // =====================================================
        // ITEMS GROUP
        // =====================================================

        this.itemsGroup =
            this.physics.add.group();


        // =====================================================
        // SPAWN TIMER
        // ของตกถี่ขึ้น
        // เดิม 850ms
        // ใหม่ 700ms
        // =====================================================

        this.spawnTimer =
            this.time.addEvent({

                delay: 700,

                callback:
                    this.spawnItem,

                callbackScope:
                    this,

                loop:
                    true

            });


        // =====================================================
        // GAME TIMER
        // =====================================================

        this.gameTimer =
            this.time.addEvent({

                delay: 1000,

                callback:
                    this.updateGameTimer,

                callbackScope:
                    this,

                loop:
                    true

            });


        // =====================================================
        // COLLISION
        // =====================================================

        this.physics.add.overlap(

            this.player,

            this.itemsGroup,

            this.collectItem,

            null,

            this

        );


        // =====================================================
        // BACKGROUND MUSIC
        // =====================================================

        this.createBGM();


        // =====================================================
        // SCREEN FADE
        // =====================================================

        this.cameras.main.fadeIn(
            500,
            7,
            11,
            24
        );

    }


    // =========================================================
    // CREATE BGM
    // =========================================================

    createBGM() {

        if (
            this.bgm
        ) {

            if (
                this.bgm.isPlaying
            ) {

                this.bgm.stop();

            }

            this.bgm.destroy();

            this.bgm = null;

        }


        this.bgm =
            this.sound.add(
                'bgm',
                {
                    loop: true,
                    volume: 0.35
                }
            );


        if (
            this.musicMuted
        ) {

            this.bgm.setMute(
                true
            );

            return;

        }


        this.bgm.setMute(
            false
        );


        if (
            !this.bgm.isPlaying
        ) {

            this.bgm.play();

        }


        this.input.once(
            'pointerdown',
            () => {

                if (
                    !this.musicMuted &&
                    this.bgm &&
                    !this.bgm.isPlaying
                ) {

                    this.bgm.play();

                }

            }
        );

    }


    // =========================================================
    // BACKGROUND
    // =========================================================

    createBackground() {

        const {
            width,
            height
        } = this.scale;


        // =====================================================
        // BASE
        // =====================================================

        this.add.rectangle(

            width / 2,
            height / 2,

            width,
            height,

            0x070b18

        )
        .setDepth(-20);


        // =====================================================
        // LARGE GLOW
        // =====================================================

        const glow1 =
            this.add.circle(

                width * 0.20,
                height * 0.25,

                300,

                0x243b80,
                0.13

            );


        glow1.setDepth(
            -19
        );


        const glow2 =
            this.add.circle(

                width * 0.80,
                height * 0.65,

                330,

                0x5b214f,
                0.12

            );


        glow2.setDepth(
            -19
        );


        this.tweens.add({

            targets:
                glow1,

            x:
                width * 0.30,

            y:
                height * 0.32,

            scale:
                1.15,

            duration:
                5000,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        this.tweens.add({

            targets:
                glow2,

            x:
                width * 0.70,

            y:
                height * 0.60,

            scale:
                1.18,

            duration:
                6000,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        // =====================================================
        // STARS
        // =====================================================

        for (
            let i = 0;
            i < 35;
            i++
        ) {

            const x =
                Phaser.Math.Between(
                    0,
                    width
                );


            const y =
                Phaser.Math.Between(
                    90,
                    height
                );


            const star =
                this.add.circle(

                    x,
                    y,

                    Phaser.Math.Between(
                        1,
                        2
                    ),

                    0xffffff,

                    Phaser.Math.FloatBetween(
                        0.15,
                        0.60
                    )

                );


            star.setDepth(
                -18
            );


            this.tweens.add({

                targets:
                    star,

                alpha:
                    0.05,

                scale:
                    0.3,

                duration:
                    Phaser.Math.Between(
                        1000,
                        2400
                    ),

                yoyo:
                    true,

                repeat:
                    -1,

                delay:
                    Phaser.Math.Between(
                        0,
                        1500
                    )

            });

        }


        // =====================================================
        // FLOOR GLOW
        // =====================================================

        const floorGlow =
            this.add.rectangle(

                width / 2,

                height - 42,

                width,

                4,

                0x38bdf8,

                0.30

            );


        floorGlow.setDepth(
            1
        );


        this.tweens.add({

            targets:
                floorGlow,

            alpha:
                0.10,

            duration:
                1200,

            yoyo:
                true,

            repeat:
                -1

        });

    }


    // =========================================================
    // TOP UI
    // =========================================================

    createTopUI() {

        const {
            width
        } = this.scale;


        // =====================================================
        // TOP BAR
        // =====================================================

        const topBar =
            this.add.rectangle(

                width / 2,

                55,

                width - 40,

                72,

                0x0f172a,

                0.92

            );


        topBar.setStrokeStyle(
            2,
            0x334155
        );


        topBar.setDepth(
            20
        );


        // =====================================================
        // SCORE PANEL
        // =====================================================

        const scorePanel =
            this.add.rectangle(

                125,

                55,

                190,

                52,

                0x111827,

                1

            );


        scorePanel.setStrokeStyle(
            2,
            0x38bdf8
        );


        scorePanel.setDepth(
            21
        );


        this.scoreText =
            this.add.text(

                125,
                55,

                'SCORE  0',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '22px',

                    fontStyle:
                        'bold',

                    color:
                        '#ffffff',

                    stroke:
                        '#0f172a',

                    strokeThickness:
                        3,

                    shadow: {

                        offsetX: 0,
                        offsetY: 0,

                        color:
                            '#38bdf8',

                        blur:
                            8,

                        fill:
                            true

                    },

                    align:
                        'center',

                    fixedWidth:
                        175

                }

            )
            .setOrigin(0.5);


        this.scoreText.setDepth(
            22
        );


        // =====================================================
        // TIMER PANEL
        // =====================================================

        const timerPanel =
            this.add.rectangle(

                width / 2,

                55,

                180,

                52,

                0x111827,

                1

            );


        timerPanel.setStrokeStyle(
            2,
            0x22c55e
        );


        timerPanel.setDepth(
            21
        );


        this.timerPanel =
            timerPanel;


        this.timerText =
            this.add.text(

                width / 2,

                55,

                `TIME  ${this.timeLeft}`,

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '22px',

                    fontStyle:
                        'bold',

                    color:
                        '#ffffff',

                    align:
                        'center'

                }

            )
            .setOrigin(0.5);


        this.timerText.setDepth(
            22
        );


        // =====================================================
        // HP PANEL
        // =====================================================

        const hpPanel =
            this.add.rectangle(

                width - 180,

                55,

                250,

                52,

                0x111827,

                1

            );


        hpPanel.setStrokeStyle(
            2,
            0xef4444
        );


        hpPanel.setDepth(
            21
        );


        this.hpPanel =
            hpPanel;


        // =====================================================
        // HP LABEL
        // =====================================================

        this.hpLabel =
            this.add.text(

                width - 270,

                55,

                'HP',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '18px',

                    fontStyle:
                        'bold',

                    color:
                        '#fca5a5'

                }

            )
            .setOrigin(0.5);


        this.hpLabel.setDepth(
            22
        );


        this.heartIcons = [];


        this.updateHeartsUI();


        // =====================================================
        // PAUSE BUTTON
        // =====================================================

        const pauseButton =
            this.add.image(

                width - 38,

                120,

                'pauseBtn'

            )
            .setInteractive({
                useHandCursor: true
            })
            .setScale(
                0.065
            );


        pauseButton.setDepth(
            30
        );


        this.pauseButton =
            pauseButton;


        pauseButton.on(
            'pointerover',
            () => {

                this.tweens.add({

                    targets:
                        pauseButton,

                    scale:
                        0.075,

                    duration:
                        100

                });

            }
        );


        pauseButton.on(
            'pointerout',
            () => {

                this.tweens.add({

                    targets:
                        pauseButton,

                    scale:
                        0.065,

                    duration:
                        100

                });

            }
        );


        pauseButton.on(
            'pointerdown',
            () => {

                this.pauseGame();

            }
        );


        // =====================================================
        // SOUND BUTTON
        // =====================================================

        const soundButton =
            this.add.text(

                width - 120,

                120,

                this.musicMuted
                    ? '🔇'
                    : '🔊',

                {

                    fontFamily:
                        'Arial',

                    fontSize:
                        '24px',

                    backgroundColor:
                        '#111827',

                    padding: {

                        left: 7,
                        right: 7,
                        top: 5,
                        bottom: 5

                    }

                }

            )
            .setOrigin(0.5)
            .setInteractive({
                useHandCursor: true
            });


        soundButton.setDepth(
            30
        );


        this.soundButton =
            soundButton;


        soundButton.on(
            'pointerover',
            () => {

                this.tweens.add({

                    targets:
                        soundButton,

                    scale:
                        1.12,

                    duration:
                        100,

                    ease:
                        'Back.easeOut'

                });

            }
        );


        soundButton.on(
            'pointerout',
            () => {

                this.tweens.add({

                    targets:
                        soundButton,

                    scale:
                        1,

                    duration:
                        100

                });

            }
        );


        soundButton.on(
            'pointerdown',
            () => {

                this.toggleSound();

            }
        );


        // =====================================================
        // INSTRUCTION
        // =====================================================

        this.controlText =
            this.add.text(

                this.scale.width / 2,

                112,

                '← →   /   A D   เพื่อเคลื่อนที่',

                {

                    fontFamily:
                        'Arial',

                    fontSize:
                        '13px',

                    fontStyle:
                        'bold',

                    color:
                        '#64748b'

                }

            )
            .setOrigin(0.5);


        this.controlText.setDepth(
            20
        );

    }


    // =========================================================
    // TOGGLE SOUND
    // =========================================================

    toggleSound() {

        this.musicMuted =
            !this.musicMuted;


        this.registry.set(
            'musicMuted',
            this.musicMuted
        );


        if (
            this.bgm
        ) {

            this.bgm.setMute(
                this.musicMuted
            );

        }


        this.sound.mute =
            this.musicMuted;


        if (
            this.soundButton
        ) {

            this.soundButton.setText(

                this.musicMuted
                    ? '🔇'
                    : '🔊'

            );

        }


        if (
            !this.musicMuted
        ) {

            if (
                this.bgm &&
                !this.bgm.isPlaying
            ) {

                this.bgm.play();

            }

        }

    }


    // =========================================================
    // UPDATE
    // =========================================================

    update() {

        if (
            this.gameEnded
        ) {

            return;

        }


        if (
            !this.player ||
            !this.player.active
        ) {

            return;

        }


        let moving = false;


        // =====================================================
        // MOVE LEFT
        // ความเร็วเพิ่มจาก 600 → 800
        // =====================================================

        if (
            this.cursors.left.isDown ||
            this.keyA.isDown
        ) {

            this.player.setVelocityX(
                -800
            );

            moving = true;

        }


        // =====================================================
        // MOVE RIGHT
        // ความเร็วเพิ่มจาก 600 → 800
        // =====================================================

        else if (
            this.cursors.right.isDown ||
            this.keyD.isDown
        ) {

            this.player.setVelocityX(
                800
            );

            moving = true;

        }


        // =====================================================
        // STOP
        // =====================================================

        else {

            this.player.setVelocityX(
                0
            );

        }


        // =====================================================
        // PLAYER TILT
        // =====================================================

        const targetAngle =
            moving

                ? Phaser.Math.Clamp(

                    this.player.body.velocity.x /
                    800 *
                    7,

                    -7,
                    7

                )

                : 0;


        this.player.angle =
            Phaser.Math.Linear(

                this.player.angle,

                targetAngle,

                0.15

            );


        // =====================================================
        // PLAYER SHADOW
        // =====================================================

        if (
            this.playerShadow
        ) {

            this.playerShadow.x =
                this.player.x;


            const shadowScale =
                1 -
                (
                    this.player.y /
                    this.scale.height
                ) *
                0.15;


            this.playerShadow.scaleX =
                shadowScale;

        }

    }


    // =========================================================
    // UPDATE TIMER
    // =========================================================

    updateGameTimer() {

        if (
            this.gameEnded
        ) {

            return;

        }


        this.timeLeft--;


        if (
            this.timeLeft < 0
        ) {

            this.timeLeft = 0;

        }


        this.timerText.setText(
            `TIME  ${this.timeLeft}`
        );


        // =====================================================
        // LAST 10 SECONDS
        // =====================================================

        if (
            this.timeLeft <= 10 &&
            this.timeLeft > 0
        ) {

            this.timerPanel.setStrokeStyle(
                2,
                0xf59e0b
            );


            this.timerText.setColor(
                '#fbbf24'
            );


            if (
                !this.warningActive
            ) {

                this.warningActive = true;


                this.tweens.add({

                    targets:
                        this.timerText,

                    scale:
                        1.08,

                    duration:
                        300,

                    yoyo:
                        true,

                    repeat:
                        -1,

                    ease:
                        'Sine.easeInOut'

                });

            }

        }


        // =====================================================
        // TIME = 0
        // =====================================================

        if (
            this.timeLeft <= 0
        ) {

            this.timeLeft = 0;


            this.timerText.setText(
                'TIME  0'
            );


            this.tweens.killTweensOf(
                this.timerText
            );


            this.timerText.setScale(
                1
            );


            this.warningActive = false;


            this.endGame(
                true
            );

        }

    }


    // =========================================================
    // SPAWN ITEM
    // =========================================================

    spawnItem() {

        if (
            this.gameEnded
        ) {

            return;

        }


        if (
            !this.itemsGroup
        ) {

            return;

        }


        const width =
            this.scale.width;


        const x =
            Phaser.Math.Between(
                70,
                width - 70
            );


        let selectedType;


        const roll =
            Phaser.Math.Between(
                1,
                100
            );


        // =====================================================
        // ITEM DROP RATE
        //
        // BONUS = 5%
        // BOMB  = 30%
        // FRUIT = 65%
        // =====================================================

        if (
            roll <= 5
        ) {

            selectedType =
                'bonus';

        }

        else if (
            roll <= 35
        ) {

            selectedType =
                'bomb';

        }

        else {

            const fruitPool = [

                'fruit1',
                'fruit1',
                'fruit1',

                'fruit2',
                'fruit2',

                'fruit3'

            ];


            selectedType =
                Phaser.Math.RND.pick(
                    fruitPool
                );

        }


        // =====================================================
        // CREATE ITEM
        // =====================================================

        const item =
            this.itemsGroup.create(

                x,

                -70,

                selectedType

            );


        if (
            !item
        ) {

            return;

        }


        item.setData(
            'type',
            selectedType
        );


        item.setDepth(
            8
        );


        item.setScale(
            0.10
        );


        // =====================================================
        // FALLING SPEED
        // =====================================================
        //
        // ผลไม้เร็วขึ้น
        // Bomb เร็วกว่าเล็กน้อย
        // =====================================================

        if (
            selectedType === 'bomb'
        ) {

            item.setVelocityY(

                Phaser.Math.Between(
                    450,
                    650
                )

            );

        }

        else {

            item.setVelocityY(

                Phaser.Math.Between(
                    400,
                    600
                )

            );

        }


        // =====================================================
        // ROTATION
        // =====================================================

        item.setAngularVelocity(

            Phaser.Math.Between(
                -100,
                100
            )

        );


        // =====================================================
        // AUTO DESTROY
        // =====================================================

        item.checkWorldBounds =
            true;

        item.outOfBoundsKill =
            true;

    }


    // =========================================================
    // COLLECT ITEM
    // =========================================================

    collectItem(
        player,
        item
    ) {

        if (
            this.gameEnded
        ) {

            return;

        }


        if (
            !item ||
            !item.active
        ) {

            return;

        }


        const type =
            item.getData(
                'type'
            );


        const x =
            item.x;


        const y =
            item.y;


        // =====================================================
        // REMOVE ITEM
        // =====================================================

        item.destroy();


        // =====================================================
        // BOMB
        // =====================================================

        if (
            type === 'bomb'
        ) {

            if (
                !this.musicMuted
            ) {

                this.sound.play(
                    'bombSound',
                    {
                        volume: 0.60
                    }
                );

            }


            const bombConfig =
                this.gameConfig &&
                this.gameConfig.items &&
                this.gameConfig.items.bomb
                    ? this.gameConfig.items.bomb
                    : {};


            const penalty =
                Number(
                    bombConfig.penalty
                ) || 30;


            const damage =
                Number(
                    bombConfig.damage
                ) || 1;


            // =================================================
            // ลดคะแนน
            // =================================================

            this.score =
                Math.max(

                    0,

                    this.score -
                    penalty

                );


            // =================================================
            // ลด HP
            // =================================================

            this.hearts -=
                damage;


            if (
                this.hearts < 0
            ) {

                this.hearts = 0;

            }


            this.updateScoreUI();

            this.updateHeartsUI();


            // =================================================
            // BOMB EFFECT
            // =================================================

            this.showBombEffect(
                x,
                y
            );


            // =================================================
            // HP = 0
            // =================================================

            if (
                this.hearts <= 0
            ) {

                this.hearts = 0;

                this.updateHeartsUI();

                this.endGame(
                    false
                );

                return;

            }

        }


        // =====================================================
        // FRUIT / BONUS
        // =====================================================

        else {

            let points = 10;


            if (
                type === 'fruit2'
            ) {

                points = 20;

            }

            else if (
                type === 'fruit3'
            ) {

                points = 30;

            }

            else if (
                type === 'bonus'
            ) {

                points = 50;

            }


            this.score +=
                points;


            // =================================================
            // COLLECT SOUND
            // =================================================

            if (
                !this.musicMuted
            ) {

                this.sound.play(

                    'collectSound',

                    {
                        volume:
                            0.35
                    }

                );

            }


            // =================================================
            // SCORE EFFECT
            // =================================================

            this.showScoreEffect(

                x,
                y,

                points

            );

        }


        this.updateScoreUI();

    }


    // =========================================================
    // UPDATE SCORE UI
    // =========================================================

    updateScoreUI() {

        if (
            !this.scoreText
        ) {

            return;

        }


        this.scoreText.setText(
            `SCORE  ${this.score}`
        );


        if (
            this.score >= 10000
        ) {

            this.scoreText.setFontSize(
                17
            );

        }

        else if (
            this.score >= 1000
        ) {

            this.scoreText.setFontSize(
                19
            );

        }

        else {

            this.scoreText.setFontSize(
                22
            );

        }


        this.tweens.killTweensOf(
            this.scoreText
        );


        this.scoreText.setScale(
            1.08
        );


        this.tweens.add({

            targets:
                this.scoreText,

            scale:
                1,

            duration:
                180,

            ease:
                'Back.easeOut'

        });

    }


    // =========================================================
    // UPDATE HEART UI
    // =========================================================

    updateHeartsUI() {

        if (
            !this.hpPanel
        ) {

            return;

        }


        this.heartIcons.forEach(
            icon => {

                if (
                    icon &&
                    icon.active
                ) {

                    icon.destroy();

                }

            }
        );


        this.heartIcons = [];


        const {
            width
        } = this.scale;


        const startX =
            width - 205;


        const spacing =
            42;


        for (
            let i = 0;
            i < this.hearts;
            i++
        ) {

            const icon =
                this.add.image(

                    startX +
                    i * spacing,

                    55,

                    'heart'

                );


            icon.setScale(
                0.047
            );


            icon.setDepth(
                22
            );


            this.heartIcons.push(
                icon
            );

        }


        if (
            this.hearts <= 0
        ) {

            this.hpLabel.setColor(
                '#ef4444'
            );

        }

        else {

            this.hpLabel.setColor(
                '#fca5a5'
            );

        }

    }


    // =========================================================
    // SCORE EFFECT
    // =========================================================

    showScoreEffect(
        x,
        y,
        points
    ) {

        const text =
            this.add.text(

                x,
                y,

                `+${points}`,

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '20px',

                    fontStyle:
                        'bold',

                    color:
                        '#facc15',

                    stroke:
                        '#422006',

                    strokeThickness:
                        4,

                    shadow: {

                        offsetX: 0,
                        offsetY: 0,

                        color:
                            '#f59e0b',

                        blur:
                            8,

                        fill:
                            true

                    }

                }

            )
            .setOrigin(0.5);


        text.setDepth(
            50
        );


        this.tweens.add({

            targets:
                text,

            y:
                y - 55,

            alpha:
                0,

            scale:
                1.25,

            duration:
                650,

            ease:
                'Quad.easeOut',

            onComplete: () => {

                text.destroy();

            }

        });

    }


    // =========================================================
    // BOMB EFFECT
    // =========================================================

    showBombEffect(
        x,
        y
    ) {

        // =====================================================
        // RED EXPLOSION
        // =====================================================

        const explosion =
            this.add.circle(

                x,
                y,

                20,

                0xef4444,

                0.65

            );


        explosion.setDepth(
            45
        );


        this.tweens.add({

            targets:
                explosion,

            scale:
                4,

            alpha:
                0,

            duration:
                450,

            ease:
                'Quad.easeOut',

            onComplete: () => {

                explosion.destroy();

            }

        });


        // =====================================================
        // DAMAGE TEXT
        // =====================================================

        const damageText =
            this.add.text(

                x,

                y,

                '-30  ❤️ -1',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '21px',

                    fontStyle:
                        'bold',

                    color:
                        '#ef4444',

                    stroke:
                        '#450a0a',

                    strokeThickness:
                        4

                }

            )
            .setOrigin(0.5);


        damageText.setDepth(
            50
        );


        this.tweens.add({

            targets:
                damageText,

            y:
                y - 65,

            alpha:
                0,

            duration:
                700,

            ease:
                'Quad.easeOut',

            onComplete: () => {

                damageText.destroy();

            }

        });


        // =====================================================
        // SCREEN SHAKE
        // =====================================================

        this.cameras.main.shake(
            180,
            0.004
        );


        // =====================================================
        // FLASH
        // =====================================================

        this.cameras.main.flash(
            180,
            255,
            50,
            50
        );

    }


    // =========================================================
    // PAUSE GAME
    // =========================================================

    pauseGame() {

        if (
            this.gameEnded
        ) {

            return;

        }


        if (
            this.scene.isActive(
                'PauseScene'
            )
        ) {

            return;

        }


        if (
            this.player &&
            this.player.body
        ) {

            this.player.setVelocity(
                0,
                0
            );

        }


        this.scene.pause();


        this.scene.launch(
            'PauseScene'
        );

    }


    // =========================================================
    // END GAME
    // =========================================================

    endGame(isWin) {

        // =====================================================
        // PREVENT DOUBLE END GAME
        // =====================================================

        if (
            this.gameEnded
        ) {

            return;

        }


        this.gameEnded = true;


        // =====================================================
        // STOP TIMERS
        // =====================================================

        if (
            this.gameTimer
        ) {

            this.gameTimer.remove(
                false
            );

            this.gameTimer = null;

        }


        if (
            this.spawnTimer
        ) {

            this.spawnTimer.remove(
                false
            );

            this.spawnTimer = null;

        }


        // =====================================================
        // STOP PLAYER
        // =====================================================

        if (
            this.player &&
            this.player.body
        ) {

            this.player.setVelocity(
                0,
                0
            );

        }


        // =====================================================
        // STOP ITEMS
        // =====================================================

        if (
            this.itemsGroup
        ) {

            this.itemsGroup.clear(
                true,
                true
            );

        }


        // =====================================================
        // STOP BGM
        // =====================================================

        if (
            this.bgm
        ) {

            this.bgm.stop();

        }


        // =====================================================
        // CURRENT SCORE
        // =====================================================

        const currentScore =
            Number(
                this.score
            ) || 0;


        // =====================================================
        // GET PREVIOUS ROUND SCORE
        //
        // คะแนนของรอบที่แล้ว
        // ถ้ายังไม่เคยเล่น = 0
        // =====================================================

        const previousScore =
            Number(
                this.registry.get(
                    'dropping_previous_score'
                )
            ) || 0;


        // =====================================================
        // CHECK NEW HIGH SCORE
        //
        // รอบนี้ต้องมากกว่ารอบก่อน
        // จึงถือว่าเป็น NEW HIGH SCORE
        // =====================================================

        const isNewHighScore =
            currentScore >
            previousScore;


        // =====================================================
        // GET OLD HIGH SCORE
        // =====================================================

        const oldHighScore =
            Number(
                this.registry.get(
                    'dropping_high_score'
                )
            ) || 0;


        // =====================================================
        // CALCULATE NEW HIGH SCORE
        // =====================================================

        const newHighScore =
            Math.max(
                oldHighScore,
                currentScore
            );


        // =====================================================
        // SAVE HIGH SCORE
        // =====================================================

        this.registry.set(
            'dropping_high_score',
            newHighScore
        );


        // =====================================================
        // SAVE CURRENT SCORE
        //
        // รอบนี้จะกลายเป็น "รอบก่อน"
        // สำหรับการเล่นครั้งถัดไป
        // =====================================================

        this.registry.set(
            'dropping_previous_score',
            currentScore
        );


        // =====================================================
        // SAVE CURRENT SCORE
        // =====================================================

        this.registry.set(
            'dropping_current_score',
            currentScore
        );


        // =====================================================
        // SAVE NEW HIGH SCORE STATUS
        // =====================================================

        this.registry.set(
            'dropping_is_new_high_score',
            isNewHighScore
        );


        // =====================================================
        // SAVE RESULT
        // =====================================================

        this.registry.set(

            'dropping_result',

            {

                score:
                    currentScore,

                previousScore:
                    previousScore,

                highScore:
                    newHighScore,

                isNewHighScore:
                    isNewHighScore,

                isWin:
                    isWin

            }

        );


        // =====================================================
        // WIN SOUND
        // =====================================================

        if (
            isWin &&
            !this.musicMuted
        ) {

            this.sound.play(

                'winSound',

                {
                    volume:
                        0.50
                }

            );

        }


        // =====================================================
        // END EFFECT
        // =====================================================

        this.cameras.main.fadeOut(

            350,

            7,
            11,
            24,

            () => {

                // =============================================
                // SEND DATA TO VITORY SCENE
                // =============================================

                this.scene.start(

                    'VitoryScene',

                    {

                        score:
                            currentScore,

                        previousScore:
                            previousScore,

                        highScore:
                            newHighScore,

                        isNewHighScore:
                            isNewHighScore,

                        isWin:
                            isWin

                    }

                );

            }

        );

    }

}