export class VitoryScene extends Phaser.Scene {

    constructor() {

        super({
            key: 'VitoryScene'
        });

    }


    // =========================================================
    // INIT
    // =========================================================

    init(data) {

        this.finalScore =
            Number(data?.score) || 0;

        this.previousScore =
            Number(data?.previousScore) || 0;

        this.highScore =
            Number(data?.highScore) || 0;

        this.isNewHighScore =
            data?.isNewHighScore ?? false;

        this.isWin =
            data?.isWin ?? true;

    }


    // =========================================================
    // CREATE
    // =========================================================

    create(data) {

        const {
            width,
            height
        } = this.scale;


        // =====================================================
        // GET DATA
        // =====================================================

        const score =
            Number(
                data?.score ??
                this.finalScore
            ) || 0;


        const highScore =
            Number(
                data?.highScore ??
                this.highScore
            ) || 0;


        const isNewHighScore =
            data?.isNewHighScore ??
            this.isNewHighScore;


        const isWin =
            data?.isWin ??
            this.isWin;


        // =====================================================
        // BACKGROUND
        // =====================================================

        this.add.rectangle(

            width / 2,
            height / 2,

            width,
            height,

            0x111827

        );


        // =====================================================
        // TITLE
        // =====================================================

        const titleText =
            isWin
                ? 'YOU WIN!'
                : 'GAME OVER';


        const titleColor =
            isWin
                ? '#10b981'
                : '#ef4444';


        const title =
            this.add.text(

                width / 2,

                height * 0.20,

                titleText,

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '42px',

                    fontStyle:
                        'bold',

                    color:
                        titleColor,

                    stroke:
                        '#000000',

                    strokeThickness:
                        5,

                    align:
                        'center',

                    wordWrap: {

                        width:
                            width - 80

                    }

                }

            )
            .setOrigin(0.5);


        title.setDepth(10);


        // =====================================================
        // TITLE ANIMATION
        // =====================================================

        this.tweens.add({

            targets:
                title,

            scale:
                1.05,

            duration:
                500,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                'Sine.easeInOut'

        });


        // =====================================================
        // SCORE BOX
        // =====================================================

        const scoreBox =
            this.add.rectangle(

                width / 2,

                height * 0.40,

                width - 60,

                105,

                0x1f2937

            );


        scoreBox.setStrokeStyle(

            3,

            isWin
                ? 0x10b981
                : 0xef4444

        );


        scoreBox.setDepth(5);


        // =====================================================
        // SCORE TEXT
        // =====================================================

        const scoreText =
            this.add.text(

                width / 2,

                height * 0.40,

                `คะแนนที่ทำได้: ${score}`,

                {

                    fontFamily:
                        'Arial, sans-serif',

                    fontSize:
                        '28px',

                    fontStyle:
                        'bold',

                    color:
                        '#ffffff',

                    stroke:
                        '#000000',

                    strokeThickness:
                        3,

                    align:
                        'center',

                    wordWrap: {

                        width:
                            width - 80

                    }

                }

            )
            .setOrigin(0.5);


        scoreText.setDepth(10);


        // =====================================================
        // HIGH SCORE
        // =====================================================

        const highScoreText =
            this.add.text(

                width / 2,

                height * 0.58,

                `คะแนนสูงสุด: ${highScore} คะแนน`,

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '22px',

                    fontStyle:
                        'bold',

                    color:
                        '#fbbf24',

                    stroke:
                        '#000000',

                    strokeThickness:
                        3,

                    align:
                        'center'

                }

            )
            .setOrigin(0.5);


        highScoreText.setDepth(10);


        // =====================================================
        // NEW HIGH SCORE
        // =====================================================

        if (isNewHighScore) {

            const newHighScoreText =
                this.add.text(

                    width / 2,

                    height * 0.68,

                    '★ NEW HIGH SCORE! ★',

                    {

                        fontFamily:
                            'Arial Black, Arial',

                        fontSize:
                            '22px',

                        fontStyle:
                            'bold',

                        color:
                            '#fbbf24',

                        stroke:
                            '#78350f',

                        strokeThickness:
                            4,

                        align:
                            'center'

                    }

                )
                .setOrigin(0.5);


            newHighScoreText.setDepth(10);


            // =================================================
            // NEW HIGH SCORE ANIMATION
            // =================================================

            this.tweens.add({

                targets:
                    newHighScoreText,

                scale:
                    1.08,

                alpha:
                    0.75,

                duration:
                    450,

                yoyo:
                    true,

                repeat:
                    -1,

                ease:
                    'Sine.easeInOut'

            });

        }


        // =====================================================
        // PLAY AGAIN BUTTON
        // =====================================================

        const restartBtn =
            this.add.rectangle(

                width / 2,

                height * 0.80,

                260,

                55,

                0x10b981

            )
            .setInteractive({

                useHandCursor:
                    true

            });


        restartBtn.setDepth(5);


        const restartText =
            this.add.text(

                width / 2,

                height * 0.80,

                'PLAY AGAIN',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '20px',

                    fontStyle:
                        'bold',

                    color:
                        '#ffffff',

                    align:
                        'center'

                }

            )
            .setOrigin(0.5);


        restartText.setDepth(10);


        // =====================================================
        // PLAY AGAIN HOVER
        // =====================================================

        restartBtn.on(

            'pointerover',

            () => {

                restartBtn.setFillStyle(
                    0x059669
                );

                restartText.setScale(
                    1.05
                );

            }

        );


        restartBtn.on(

            'pointerout',

            () => {

                restartBtn.setFillStyle(
                    0x10b981
                );

                restartText.setScale(
                    1
                );

            }

        );


        // =====================================================
        // PLAY AGAIN CLICK
        // =====================================================

        restartBtn.on(

            'pointerdown',

            () => {

                this.scene.start(
                    'GameplayScene'
                );

            }

        );


        // =====================================================
        // MAIN MENU BUTTON
        // =====================================================

        const homeBtn =
            this.add.rectangle(

                width / 2,

                height * 0.92,

                260,

                55,

                0x374151

            )
            .setInteractive({

                useHandCursor:
                    true

            });


        homeBtn.setDepth(5);


        const homeText =
            this.add.text(

                width / 2,

                height * 0.92,

                'MAIN MENU',

                {

                    fontFamily:
                        'Arial Black, Arial',

                    fontSize:
                        '20px',

                    fontStyle:
                        'bold',

                    color:
                        '#ffffff',

                    align:
                        'center'

                }

            )
            .setOrigin(0.5);


        homeText.setDepth(10);


        // =====================================================
        // MAIN MENU HOVER
        // =====================================================

        homeBtn.on(

            'pointerover',

            () => {

                homeBtn.setFillStyle(
                    0x4b5563
                );

                homeText.setScale(
                    1.05
                );

            }

        );


        homeBtn.on(

            'pointerout',

            () => {

                homeBtn.setFillStyle(
                    0x374151
                );

                homeText.setScale(
                    1
                );

            }

        );


        // =====================================================
        // MAIN MENU CLICK
        // =====================================================

        homeBtn.on(

            'pointerdown',

            () => {

                this.scene.start(
                    'MenuScene'
                );

            }

        );


        // =====================================================
        // FADE IN
        // =====================================================

        this.cameras.main.fadeIn(

            400,

            17,
            24,
            39

        );

    }

}