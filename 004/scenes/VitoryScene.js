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
            Number(data.score) || 0;

        this.isWin =
            data.isWin ?? true;

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
            Number(data?.score ?? this.finalScore) || 0;

        const isWin =
            data?.isWin ?? this.isWin;


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

                height * 0.23,

                titleText,

                {

                    fontFamily:
                        'Arial Black, Arial',

                    // ลดจาก 48px
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

                    // ป้องกันข้อความชนขอบ
                    wordWrap: {

                        width:
                            width - 80

                    }

                }

            )
            .setOrigin(0.5);


        title.setDepth(
            10
        );


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
        // SCORE LABEL
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
                        '26px',

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


        scoreText.setDepth(
            10
        );


        // =====================================================
        // LAST SCORE
        // =====================================================

        const lastScore =
            localStorage.getItem(
                'dropping_last_score'
            ) || 0;


        const lastScoreText =
            this.add.text(

                width / 2,

                height * 0.49,

                `สถิติรอบก่อน: ${lastScore} คะแนน`,

                {

                    fontFamily:
                        'Arial, sans-serif',

                    fontSize:
                        '20px',

                    fontStyle:
                        'bold',

                    color:
                        '#fbbf24',

                    stroke:
                        '#000000',

                    strokeThickness:
                        2,

                    align:
                        'center',

                    wordWrap: {

                        width:
                            width - 100

                    }

                }

            )
            .setOrigin(0.5);


        lastScoreText.setDepth(
            10
        );


        // =====================================================
        // PLAY AGAIN BUTTON
        // =====================================================

        const restartBtn =
            this.add.rectangle(

                width / 2,

                height * 0.63,

                260,

                55,

                0x10b981

            )
            .setInteractive({

                useHandCursor:
                    true

            });


        restartBtn.setDepth(
            5
        );


        const restartText =
            this.add.text(

                width / 2,

                height * 0.63,

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


        restartText.setDepth(
            10
        );


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

                height * 0.75,

                260,

                55,

                0x374151

            )
            .setInteractive({

                useHandCursor:
                    true

            });


        homeBtn.setDepth(
            5
        );


        const homeText =
            this.add.text(

                width / 2,

                height * 0.75,

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


        homeText.setDepth(
            10
        );


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