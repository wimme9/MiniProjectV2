export class MenuScene extends Phaser.Scene {

    constructor() {
        super({ key: 'MenuScene' });

        this.floatingObjects = [];
    }


    // =========================================================
    // CREATE
    // =========================================================

    create() {

        const { width, height } = this.scale;


        // =====================================================
        // 0. SESSION STATISTICS
        // =====================================================
        // ใช้ Phaser Registry แทน localStorage
        //
        // ดังนั้น:
        // Refresh เว็บ       → ค่าเริ่มใหม่เป็น 0
        // เล่นเกมใหม่        → High Score เดิมยังอยู่
        // ปิดเว็บ/เปิดใหม่   → ค่าเป็น 0
        // =====================================================

        if (
            this.registry.get('dropping_high_score') === undefined
        ) {

            this.registry.set(
                'dropping_high_score',
                0
            );

        }


        if (
            this.registry.get('dropping_last_score') === undefined
        ) {

            this.registry.set(
                'dropping_last_score',
                0
            );

        }


        // =====================================================
        // 1. BACKGROUND
        // =====================================================

        this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x070b18
        );


        // =====================================================
        // 2. BACKGROUND GLOW
        // =====================================================

        const glow1 = this.add.circle(
            width * 0.18,
            height * 0.25,
            300,
            0x243b80,
            0.18
        );


        const glow2 = this.add.circle(
            width * 0.82,
            height * 0.70,
            350,
            0x5b214f,
            0.15
        );


        const glow3 = this.add.circle(
            width * 0.50,
            height * 0.50,
            260,
            0x0e7490,
            0.06
        );


        // =====================================================
        // BACKGROUND GLOW ANIMATION
        // =====================================================

        this.tweens.add({

            targets: glow1,

            x: width * 0.35,
            y: height * 0.38,

            scale: 1.15,

            duration: 5000,

            yoyo: true,
            repeat: -1,

            ease: 'Sine.easeInOut'

        });


        this.tweens.add({

            targets: glow2,

            x: width * 0.65,
            y: height * 0.58,

            scale: 1.20,

            duration: 6000,

            yoyo: true,
            repeat: -1,

            ease: 'Sine.easeInOut'

        });


        this.tweens.add({

            targets: glow3,

            scale: 1.25,

            alpha: 0.12,

            duration: 3500,

            yoyo: true,
            repeat: -1,

            ease: 'Sine.easeInOut'

        });


        // =====================================================
        // 3. PARTICLES / STARS
        // =====================================================

        for (let i = 0; i < 45; i++) {

            const x =
                Phaser.Math.Between(
                    0,
                    width
                );

            const y =
                Phaser.Math.Between(
                    0,
                    height
                );


            const star =
                this.add.circle(

                    x,
                    y,

                    Phaser.Math.Between(
                        1,
                        3
                    ),

                    0xffffff,

                    Phaser.Math.FloatBetween(
                        0.20,
                        0.75
                    )

                );


            this.tweens.add({

                targets: star,

                alpha: 0.08,

                scale: 0.25,

                duration:
                    Phaser.Math.Between(
                        1200,
                        2800
                    ),

                yoyo: true,

                repeat: -1,

                delay:
                    Phaser.Math.Between(
                        0,
                        1800
                    ),

                ease: 'Sine.easeInOut'

            });

        }


        // =====================================================
        // 4. FLOATING FRUIT / HAZARDS
        // =====================================================

        const floatingItems = [

            {
                emoji: '🍓',
                x: 100,
                y: 150,
                size: 55
            },

            {
                emoji: '🍍',
                x: width - 110,
                y: 170,
                size: 55
            },

            {
                emoji: '🍇',
                x: 120,
                y: height - 150,
                size: 52
            },

            {
                emoji: '🍎',
                x: width - 120,
                y: height - 170,
                size: 50
            },

            {
                emoji: '💣',
                x: width - 270,
                y: 130,
                size: 48
            },

            {
                emoji: '🍓',
                x: 270,
                y: height - 100,
                size: 42
            }

        ];


        floatingItems.forEach(
            (item, index) => {

                const obj =
                    this.add.text(

                        item.x,
                        item.y,

                        item.emoji,

                        {
                            fontSize:
                                `${item.size}px`
                        }

                    )
                    .setOrigin(0.5);


                this.floatingObjects.push(
                    obj
                );


                // ลอยขึ้นลง
                this.tweens.add({

                    targets: obj,

                    y:
                        item.y -
                        Phaser.Math.Between(
                            15,
                            35
                        ),

                    angle:
                        Phaser.Math.Between(
                            -8,
                            8
                        ),

                    duration:
                        Phaser.Math.Between(
                            1800,
                            3000
                        ),

                    yoyo: true,

                    repeat: -1,

                    ease:
                        'Sine.easeInOut',

                    delay:
                        index * 250

                });

            }
        );


        // =====================================================
        // 5. TITLE GLOW
        // =====================================================

        const titleGlow =
            this.add.text(

                width / 2,
                height * 0.135,

                'DROPPING GAME',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '64px',

                    fontStyle:
                        'bold',

                    color:
                        '#ffffff',

                    stroke:
                        '#ff4d9d',

                    strokeThickness:
                        10,

                    shadow: {

                        offsetX: 0,
                        offsetY: 0,

                        color:
                            '#ff4d9d',

                        blur:
                            25,

                        fill:
                            true

                    }

                }

            )
            .setOrigin(0.5);


        // =====================================================
        // 6. MAIN TITLE
        // =====================================================

        const title =
            this.add.text(

                width / 2,
                height * 0.135,

                'DROPPING GAME',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '60px',

                    fontStyle:
                        'bold',

                    color:
                        '#ffffff',

                    stroke:
                        '#172554',

                    strokeThickness:
                        5,

                    shadow: {

                        offsetX: 0,
                        offsetY: 5,

                        color:
                            '#000000',

                        blur:
                            10,

                        fill:
                            true

                    }

                }

            )
            .setOrigin(0.5);


        // =====================================================
        // TITLE ANIMATION
        // =====================================================

        this.tweens.add({

            targets:
                titleGlow,

            alpha:
                0.30,

            scale:
                1.04,

            duration:
                1300,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        this.tweens.add({

            targets:
                title,

            scale:
                1.015,

            duration:
                1300,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        // =====================================================
        // 7. SUBTITLE
        // =====================================================

        this.add.text(

            width / 2,
            height * 0.215,

            '🍓  CATCH THE FRUIT  •  AVOID THE BOMBS  💣',

            {

                fontFamily:
                    'Arial',

                fontSize:
                    '16px',

                fontStyle:
                    'bold',

                color:
                    '#67e8f9',

                shadow: {

                    offsetX: 0,
                    offsetY: 0,

                    color:
                        '#22d3ee',

                    blur:
                        10,

                    fill:
                        true

                }

            }

        )
        .setOrigin(0.5);


        // =====================================================
        // 8. CENTER DISPLAY
        // =====================================================

        const panelGlow =
            this.add.rectangle(

                width / 2,
                height * 0.405,

                565,
                185,

                0x38bdf8,

                0.035

            );


        panelGlow.setStrokeStyle(
            2,
            0x38bdf8,
            0.25
        );


        const panel =
            this.add.rectangle(

                width / 2,
                height * 0.405,

                540,
                165,

                0x111827,

                0.94

            );


        panel.setStrokeStyle(
            2,
            0x334155
        );


        // =====================================================
        // PANEL ANIMATION
        // =====================================================

        this.tweens.add({

            targets:
                panelGlow,

            alpha:
                0.35,

            scaleX:
                1.02,

            scaleY:
                1.03,

            duration:
                1600,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        // =====================================================
        // 9. BASKET
        // =====================================================

        const basket =
            this.add.text(

                width / 2,
                height * 0.425,

                '🧺',

                {
                    fontSize:
                        '70px'
                }

            )
            .setOrigin(0.5);


        this.tweens.add({

            targets:
                basket,

            y:
                height * 0.405,

            duration:
                1100,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        // =====================================================
        // 10. FALLING STRAWBERRY
        // =====================================================
        // แก้ปัญหาวาร์ป:
        // ไม่เปลี่ยน X ตอน onRepeat
        // ใช้ Tween จบรอบแล้วค่อยเริ่มใหม่
        // =====================================================

        const fallingFruit =
            this.add.text(

                width / 2 - 120,
                height * 0.28,

                '🍓',

                {
                    fontSize:
                        '35px'
                }

            )
            .setOrigin(0.5);


        const fruitStartY =
            height * 0.28;


        const fruitEndY =
            height * 0.395;


        const dropFruit = () => {

            if (
                !fallingFruit.active
            ) {
                return;
            }


            const startX =
                width / 2 +
                Phaser.Math.Between(
                    -150,
                    150
                );


            const targetX =
                width / 2 +
                Phaser.Math.Between(
                    -170,
                    170
                );


            fallingFruit.setPosition(
                startX,
                fruitStartY
            );


            fallingFruit.setAlpha(
                1
            );


            this.tweens.add({

                targets:
                    fallingFruit,

                x:
                    targetX,

                y:
                    fruitEndY,

                duration:
                    950,

                ease:
                    'Quad.easeIn',

                onComplete: () => {

                    this.tweens.add({

                        targets:
                            fallingFruit,

                        alpha:
                            0,

                        duration:
                            180,

                        onComplete: () => {

                            this.time.delayedCall(
                                180,
                                () => {

                                    dropFruit();

                                }
                            );

                        }

                    });

                }

            });

        };


        dropFruit();


        // =====================================================
        // 11. BOMB
        // =====================================================

        const bomb =
            this.add.text(

                width / 2 + 150,
                height * 0.325,

                '💣',

                {
                    fontSize:
                        '35px'
                }

            )
            .setOrigin(0.5);


        // หมุน
        this.tweens.add({

            targets:
                bomb,

            angle:
                360,

            duration:
                3500,

            repeat:
                -1,

            ease:
                'Linear'

        });


        // ลอยขึ้นลง
        this.tweens.add({

            targets:
                bomb,

            y:
                height * 0.325 - 8,

            duration:
                900,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        // =====================================================
        // 12. START GAME BUTTON
        // =====================================================

        const startButton =
            this.add.rectangle(

                width / 2,
                height * 0.615,

                330,
                70,

                0x10b981

            )
            .setInteractive({
                useHandCursor: true
            })
            .setStrokeStyle(
                3,
                0x6ee7b7
            );


        const startText =
            this.add.text(

                width / 2,
                height * 0.615,

                '▶  START GAME',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '25px',

                    fontStyle:
                        'bold',

                    color:
                        '#ffffff',

                    shadow: {

                        offsetX: 0,
                        offsetY: 3,

                        color:
                            '#064e3b',

                        blur:
                            5,

                        fill:
                            true

                    }

                }

            )
            .setOrigin(0.5);


        // =====================================================
        // START BUTTON PULSE
        // =====================================================

        this.tweens.add({

            targets: [
                startButton,
                startText
            ],

            scaleX:
                1.025,

            scaleY:
                1.025,

            duration:
                900,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        // =====================================================
        // START BUTTON HOVER
        // =====================================================

        startButton.on(
            'pointerover',
            () => {

                startButton.setFillStyle(
                    0x22c55e
                );


                startButton.setStrokeStyle(
                    3,
                    0xd1fae5
                );


                this.tweens.add({

                    targets: [
                        startButton,
                        startText
                    ],

                    scaleX:
                        1.08,

                    scaleY:
                        1.08,

                    duration:
                        150,

                    ease:
                        'Back.easeOut'

                });

            }
        );


        startButton.on(
            'pointerout',
            () => {

                startButton.setFillStyle(
                    0x10b981
                );


                startButton.setStrokeStyle(
                    3,
                    0x6ee7b7
                );


                this.tweens.add({

                    targets: [
                        startButton,
                        startText
                    ],

                    scaleX:
                        1,

                    scaleY:
                        1,

                    duration:
                        150

                });

            }
        );


        // =====================================================
        // START BUTTON CLICK
        // =====================================================

        startButton.on(
            'pointerdown',
            () => {

                this.cameras.main.flash(
                    180,
                    255,
                    255,
                    255
                );


                this.tweens.add({

                    targets: [
                        startButton,
                        startText
                    ],

                    scaleX:
                        0.90,

                    scaleY:
                        0.90,

                    duration:
                        100,

                    yoyo:
                        true,

                    onComplete: () => {

                        this.scene.start(
                            'GameplayScene'
                        );

                    }

                });

            }
        );


        // =====================================================
        // 13. HOW TO PLAY
        // =====================================================

        const howButton =
            this.add.text(

                width / 2,
                height * 0.715,

                '📖  HOW TO PLAY',

                {

                    fontFamily:
                        'Arial',

                    fontSize:
                        '18px',

                    fontStyle:
                        'bold',

                    color:
                        '#facc15',

                    shadow: {

                        offsetX: 0,
                        offsetY: 0,

                        color:
                            '#facc15',

                        blur:
                            8,

                        fill:
                            true

                    }

                }

            )
            .setOrigin(0.5)
            .setInteractive({
                useHandCursor: true
            });


        howButton.on(
            'pointerover',
            () => {

                howButton.setColor(
                    '#ffffff'
                );


                this.tweens.add({

                    targets:
                        howButton,

                    scale:
                        1.08,

                    duration:
                        120,

                    ease:
                        'Back.easeOut'

                });

            }
        );


        howButton.on(
            'pointerout',
            () => {

                howButton.setColor(
                    '#facc15'
                );


                this.tweens.add({

                    targets:
                        howButton,

                    scale:
                        1,

                    duration:
                        120

                });

            }
        );


        howButton.on(
            'pointerdown',
            () => {

                this.showHowToPlay();

            }
        );


        // =====================================================
        // 14. HIGH SCORE
        // =====================================================
        // ไม่ใช้ localStorage
        //
        // จึงไม่ดึงคะแนนเก่าจากการเปิดเว็บครั้งก่อน
        // =====================================================

        const highScore =
            this.registry.get(
                'dropping_high_score'
            ) || 0;


        const highScoreText =
            this.add.text(

                width / 2,
                height * 0.805,

                `🏆  HIGH SCORE   ${highScore}`,

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '19px',

                    fontStyle:
                        'bold',

                    color:
                        '#fbbf24',

                    shadow: {

                        offsetX: 0,
                        offsetY: 0,

                        color:
                            '#f59e0b',

                        blur:
                            10,

                        fill:
                            true

                    }

                }

            )
            .setOrigin(0.5);


        // High Score Glow
        this.tweens.add({

            targets:
                highScoreText,

            alpha:
                0.72,

            duration:
                1200,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        // =====================================================
        // 15. CONTROL INFO
        // =====================================================

        this.add.text(

            width / 2,
            height * 0.895,

            '←  A / D  →     •     60 SECONDS     •     ARCADE MODE',

            {

                fontFamily:
                    'Arial',

                fontSize:
                    '13px',

                color:
                    '#94a3b8',

                fontStyle:
                    'bold'

            }

        )
        .setOrigin(0.5);


        // =====================================================
        // 16. BOTTOM DESCRIPTION
        // =====================================================

        this.add.text(

            width / 2,
            height * 0.945,

            '🍓 Catch fruits  •  💣 Avoid bombs  •  🏆 Beat your record',

            {

                fontFamily:
                    'Arial',

                fontSize:
                    '12px',

                color:
                    '#475569'

            }

        )
        .setOrigin(0.5);


        // =====================================================
        // 17. SCREEN FADE IN
        // =====================================================

        this.cameras.main.fadeIn(
            700,
            7,
            11,
            24
        );

    }


    // =========================================================
    // HOW TO PLAY POPUP
    // =========================================================

    showHowToPlay() {

        const {
            width,
            height
        } = this.scale;


        // =====================================================
        // OVERLAY
        // =====================================================

        const overlay =
            this.add.rectangle(

                width / 2,
                height / 2,

                width,
                height,

                0x000000,

                0.80

            )
            .setInteractive();


        // =====================================================
        // POPUP SHADOW
        // =====================================================

        const popupShadow =
            this.add.rectangle(

                width / 2 + 6,
                height / 2 + 8,

                620,
                500,

                0x000000,

                0.45

            );


        // =====================================================
        // POPUP
        // =====================================================

        const popup =
            this.add.rectangle(

                width / 2,
                height / 2,

                600,
                490,

                0x111827,

                1

            );


        popup.setStrokeStyle(
            3,
            0x38bdf8
        );


        // =====================================================
        // INNER BORDER
        // =====================================================

        const popupInner =
            this.add.rectangle(

                width / 2,
                height / 2,

                575,
                465,

                0x000000,

                0

            );


        popupInner.setStrokeStyle(
            1,
            0x334155
        );


        // =====================================================
        // TITLE
        // =====================================================

        const title =
            this.add.text(

                width / 2,
                height * 0.225,

                '📖  HOW TO PLAY',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '30px',

                    fontStyle:
                        'bold',

                    color:
                        '#67e8f9',

                    shadow: {

                        offsetX: 0,
                        offsetY: 0,

                        color:
                            '#22d3ee',

                        blur:
                            15,

                        fill:
                            true

                    }

                }

            )
            .setOrigin(0.5);
// =====================================================
// INSTRUCTIONS
// =====================================================

const instructions =
    this.add.text(

        width / 2,

        // ขยับข้อความลงจากเดิม
        height * 0.485,

        '← / →  หรือ  A / D\n' +
        'เคลื่อนที่ตะกร้าไปทางซ้ายและขวา\n\n' +

        '🍓  ผลไม้ 1        +10 คะแนน\n' +
        '🍍  ผลไม้ 2        +20 คะแนน\n' +
        '🍇  ผลไม้ 3        +30 คะแนน\n' +
        '🧺  BONUS         +50 คะแนน\n' +
        '💣  ระเบิด         -30 คะแนน  •  -1 HP\n\n' +

        '❤️  HP เริ่มต้น: 3\n' +
        '⏱️  เวลาเล่น: 60 วินาที',

        {

            fontFamily:
                'Arial',

            fontSize:
                '17px',

            fontStyle:
                'bold',

            color:
                '#e2e8f0',

            align:
                'left',

            // เพิ่มระยะห่างระหว่างบรรทัด
            lineSpacing:
                10,

            shadow: {

                offsetX: 0,
                offsetY: 2,

                color:
                    '#000000',

                blur:
                    4,

                fill:
                    true

            }

        }

    )
    .setOrigin(0.5);

        // =====================================================
        // CLOSE BUTTON
        // =====================================================

        const closeButton =
            this.add.rectangle(

                width / 2,
                height * 0.755,

                170,
                52,

                0xef4444

            )
            .setInteractive({
                useHandCursor: true
            })
            .setStrokeStyle(
                2,
                0xfca5a5
            );


        const closeText =
            this.add.text(

                width / 2,
                height * 0.755,

                '✕  CLOSE',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '17px',

                    color:
                        '#ffffff'

                }

            )
            .setOrigin(0.5);


        // =====================================================
        // CLOSE HOVER
        // =====================================================

        closeButton.on(
            'pointerover',
            () => {

                closeButton.setFillStyle(
                    0xdc2626
                );


                closeButton.setStrokeStyle(
                    2,
                    0xfecaca
                );


                closeText.setScale(
                    1.05
                );

            }
        );


        closeButton.on(
            'pointerout',
            () => {

                closeButton.setFillStyle(
                    0xef4444
                );


                closeButton.setStrokeStyle(
                    2,
                    0xfca5a5
                );


                closeText.setScale(
                    1
                );

            }
        );


        // =====================================================
        // CLOSE CLICK
        // =====================================================

        closeButton.on(
            'pointerdown',
            () => {

                overlay.destroy();

                popupShadow.destroy();

                popup.destroy();

                popupInner.destroy();

                title.destroy();

                instructions.destroy();

                closeButton.destroy();

                closeText.destroy();

            }
        );


        // =====================================================
        // POPUP INITIAL STATE
        // =====================================================

        popup.setScale(
            0.8
        );

        popupShadow.setScale(
            0.8
        );

        popupInner.setScale(
            0.8
        );


        title.setAlpha(
            0
        );

        instructions.setAlpha(
            0
        );

        closeButton.setAlpha(
            0
        );

        closeText.setAlpha(
            0
        );


        // =====================================================
        // POPUP SCALE ANIMATION
        // =====================================================

        this.tweens.add({

            targets: [
                popup,
                popupShadow,
                popupInner
            ],

            scale:
                1,

            duration:
                300,

            ease:
                'Back.easeOut'

        });


        // =====================================================
        // POPUP FADE
        // =====================================================

        this.tweens.add({

            targets: [
                title,
                instructions,
                closeButton,
                closeText
            ],

            alpha:
                1,

            duration:
                300

        });

    }

}