export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // โหลดสไปร์ทชีตดาบรวม (ปรับ frameWidth และ frameHeight ให้ตรงกับขนาดพิกเซลจริงของดาบแต่ละช่องในไฟล์ภาพ)
        this.load.spritesheet('sword_sheet', 'Image/File.png', { 
            frameWidth: 32,   // <-- ปรับขนาดความกว้างของดาบ 1 ช่อง (เช่น 32 หรือ 64)
            frameHeight: 32   // <-- ปรับขนาดความสูงของดาบ 1 ช่อง (เช่น 32 หรือ 64)
        });

        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    }

    // ==================== [ Web Audio API Sound System ] ====================
    playSynthSound(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';

            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'click') {
                osc.type = 'sine';
                filter.frequency.setValueAtTime(1000, now);
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

                gainNode.gain.setValueAtTime(0.06, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc.start(now);
                osc.stop(now + 0.12);
            }
        } catch (e) {
            console.log("Audio Context prevented or not supported", e);
        }
    }

    // ==================== [ Ambient Background Music ] ====================
    startBackgroundMusic() {
        if (this.bgmPlaying) return;
        this.bgmPlaying = true;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            if (!window.sharedAudioCtx || window.sharedAudioCtx.state === 'closed') {
                window.sharedAudioCtx = new AudioContext();
            }
            this.bgmCtx = window.sharedAudioCtx;

            const notes = [220.00, 246.94, 293.66, 329.63, 392.00]; // โทนเสียงต่ำขลังๆ สไตล์ญี่ปุ่น
            
            this.bgmTimer = this.time.addEvent({
                delay: 1100,
                loop: true,
                callback: () => {
                    if (!this.bgmCtx || this.bgmCtx.state === 'closed') return;
                    if (this.bgmCtx.state === 'suspended') {
                        this.bgmCtx.resume();
                    }

                    const osc = this.bgmCtx.createOscillator();
                    const gainNode = this.bgmCtx.createGain();
                    const filter = this.bgmCtx.createBiquadFilter();

                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(400, this.bgmCtx.currentTime);

                    osc.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.bgmCtx.destination);

                    const randomNote = Phaser.Utils.Array.GetRandom(notes);
                    const now = this.bgmCtx.currentTime;

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(randomNote, now);

                    gainNode.gain.setValueAtTime(0.001, now);
                    gainNode.gain.linearRampToValueAtTime(0.015, now + 0.4);
                    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

                    osc.start(now);
                    osc.stop(now + 2.5);
                }
            });
        } catch (e) {
            console.log("BGM Error:", e);
        }
    }

    create() {
        // แก้ไขภาพดาบให้คมชัด ไม่เบลอเวลาขยายใหญ่
        if (this.textures.exists('sword_sheet')) {
            this.textures.get('sword_sheet').setFilter(Phaser.Textures.FilterMode.NEAREST);
        }

        this.startBackgroundMusic();

        // พื้นหลังสีดำเข้มอมแดงเลือดหมูอ่อนๆ ให้ฟีลสนามรบ/ห้องดาบ
        this.add.rectangle(640, 360, 1280, 720, 0x0a0505);

        // แสงออร่าด้านหลัง (Blood Red & Gold Glow)
        const nebula1 = this.add.graphics();
        nebula1.fillStyle(0x8b0000, 0.18); // แสงเลือดหมู
        nebula1.fillCircle(350, 220, 380);
        
        const nebula2 = this.add.graphics();
        nebula2.fillStyle(0xd4af37, 0.1); // แสงทองโบราณ
        nebula2.fillCircle(930, 480, 400);

        // สร้างประกายไฟ/ละอองเรืองแสงแทนดวงดาว
        const sparkGraphics = this.add.graphics();
        sparkGraphics.fillStyle(0xffd700, 1);
        sparkGraphics.fillCircle(2, 2, 2);
        sparkGraphics.generateTexture('goldSpark', 4, 4);
        sparkGraphics.destroy();

        this.add.particles(640, 360, 'goldSpark', {
            x: { min: 0, max: 1280 },
            y: { min: 0, max: 720 },
            lifespan: { min: 3000, max: 6000 },
            scale: { start: 0.3, end: 1.5 },
            alpha: { start: 0.1, end: 0.8 },
            quantity: 2,
            frequency: 100
        });

        // เส้นขอบฮอไรซอนสไตล์เจแปนนิส (ภูเขา/เงาบรรยากาศ)
        const horizon = this.add.graphics();
        horizon.fillStyle(0x380404, 0.3);
        horizon.fillCircle(640, 1200, 850);
        horizon.fillStyle(0xd4af37, 0.15);
        horizon.fillCircle(640, 1200, 825);
        horizon.fillStyle(0x050202, 1);
        horizon.fillCircle(640, 1200, 810);

        // วงแหวนตราสัญลักษณ์ซามูไรตรงกลาง
        const gateContainer = this.add.container(640, 210);

        const coreBeam = this.add.graphics();
        coreBeam.fillStyle(0xff4500, 0.8);
        coreBeam.fillCircle(0, 0, 35);
        coreBeam.fillStyle(0xffd700, 0.95);
        coreBeam.fillCircle(0, 0, 18);

        const innerRing = this.add.graphics();
        innerRing.lineStyle(4, 0xff4500, 0.9);
        innerRing.strokeCircle(0, 0, 75);
        innerRing.lineStyle(2, 0xffd700, 0.8);
        innerRing.strokeCircle(0, 0, 65);

        const midRing = this.add.graphics();
        midRing.lineStyle(6, 0x8b0000, 0.8);
        midRing.strokeCircle(0, 0, 120);
        midRing.lineStyle(2, 0xd4af37, 0.9);
        midRing.strokeCircle(0, 0, 132);

        for (let i = 0; i < 4; i++) {
            const rad = (i * 90) * (Math.PI / 180);
            midRing.fillStyle(0xffd700, 1);
            midRing.fillRect(Math.cos(rad) * 120 - 6, Math.sin(rad) * 120 - 6, 12, 12);
        }

        const outerRing = this.add.graphics();
        outerRing.lineStyle(8, 0x4a0000, 0.6);
        outerRing.strokeCircle(0, 0, 170);
        outerRing.lineStyle(2, 0xff4500, 0.9);
        outerRing.strokeCircle(0, 0, 182);

        const spikes = this.add.graphics();
        spikes.lineStyle(4, 0xd4af37, 0.9);
        spikes.beginPath();
        spikes.moveTo(-182, 0); spikes.lineTo(-240, -30); spikes.lineTo(-210, 0); spikes.lineTo(-240, 30); spikes.closePath();
        spikes.moveTo(182, 0); spikes.lineTo(240, -30); spikes.lineTo(210, 0); spikes.lineTo(240, 30); spikes.closePath();
        spikes.strokePath();

        gateContainer.add([spikes, outerRing, midRing, innerRing, coreBeam]);

        gateContainer.setScale(0);
        gateContainer.setAlpha(0);
        this.tweens.add({
            targets: gateContainer,
            scale: 1,
            alpha: 1,
            duration: 800,
            ease: 'Back.out'
        });

        this.tweens.add({ targets: innerRing, angle: 360, duration: 7000, loop: -1 });
        this.tweens.add({ targets: midRing, angle: -360, duration: 14000, loop: -1 });
        this.tweens.add({ targets: outerRing, angle: 360, duration: 24000, loop: -1 });
        
        this.tweens.add({
            targets: coreBeam,
            scale: { from: 0.85, to: 1.15 },
            alpha: { from: 0.7, to: 1 },
            duration: 1200,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: gateContainer,
            y: 218,
            duration: 3500,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut',
            delay: 800
        });

        const cardW = 150;
        const cardH = 225;

        // ดึงสเปรต์ชีตดาบมาประดับซ้าย-ขวา
        const leftCard = this.add.image(200, 400, 'sword_sheet', 5)
            .setDisplaySize(cardW, cardH)
            .setAlpha(0)
            .setAngle(-18);

        const rightCard = this.add.image(1080, 400, 'sword_sheet', 4)
            .setDisplaySize(cardW, cardH)
            .setAlpha(0)
            .setAngle(18);

        this.tweens.add({
            targets: leftCard,
            x: 200,
            alpha: 0.6,
            duration: 1000,
            ease: 'Power2',
            delay: 300
        });

        this.tweens.add({
            targets: rightCard,
            x: 1080,
            alpha: 0.6,
            duration: 1000,
            ease: 'Power2',
            delay: 300
        });

        this.tweens.add({
            targets: [leftCard, rightCard],
            y: '+=12',
            duration: 3000,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut',
            delay: 1300
        });

        // หัวข้อเกมธีมดาบซามูไร
        const titleText = this.add.text(640, -100, 'BLADE RUSH', {
            fontSize: '84px',
            fill: '#ffffff',
            fontFamily: '"Prompt", sans-serif',
            fontStyle: 'bold',
            stroke: '#8b0000',
            strokeThickness: 10,
            shadow: { color: '#ff4500', blur: 25, fill: true }
        }).setOrigin(0.5);

        const subTitleText = this.add.text(640, -50, '❖ SAMURAI & KATANA FORGE ❖', {
            fontSize: '20px',
            fill: '#ffd700',
            fontFamily: '"Prompt", sans-serif',
            fontStyle: 'bold',
            shadow: { color: '#ff4500', blur: 12, fill: true }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: titleText,
            y: 165,
            duration: 700,
            ease: 'Bounce.out',
            delay: 200
        });

        this.tweens.add({
            targets: subTitleText,
            y: 235,
            duration: 700,
            ease: 'Back.out',
            delay: 400
        });

        // ปุ่มกดสไตล์ดาบซามูไร (โทน แดง-ทอง)
        this.btnStart = this.createKatanaButton(640, 820, '⚔️ START BATTLE', 0x8b0000, 0xffd700, () => {
            this.playSynthSound('click');
            this.startGame();
        });
        this.btnHowTo = this.createKatanaButton(640, 905, '📜 SWORD CODEX / GUIDE', 0x1a0505, 0xff4500, () => {
            this.playSynthSound('click');
            this.showHowToPlayModal();
        });

        this.tweens.add({
            targets: this.btnStart,
            y: 420,
            duration: 800,
            ease: 'Back.out',
            delay: 500
        });

        this.tweens.add({
            targets: this.btnHowTo,
            y: 505,
            duration: 800,
            ease: 'Back.out',
            delay: 650
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.playSynthSound('click');
            this.startGame();
        });
    }

    createKatanaButton(x, y, label, bgColor, strokeColor, callback) {
        const btnContainer = this.add.container(x, y);
        
        const btnBg = this.add.graphics();
        btnBg.fillStyle(bgColor, 0.95);
        btnBg.fillRoundedRect(-170, -28, 340, 56, 6);
        btnBg.lineStyle(2, strokeColor, 1);
        btnBg.strokeRoundedRect(-170, -28, 340, 56, 6);

        btnBg.lineStyle(3, 0xffd700, 0.8);
        btnBg.lineBetween(-170, -18, -170, -28);
        btnBg.lineBetween(-170, -28, -150, -28);
        btnBg.lineBetween(170, 18, 170, 28);
        btnBg.lineBetween(170, 28, 150, 28);

        const btnText = this.add.text(0, 0, label, {
            fontSize: '19px',
            fill: '#ffffff',
            fontFamily: '"Prompt", sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btnContainer.add([btnBg, btnText]);
        btnContainer.setSize(340, 56);
        btnContainer.setInteractive({ useHandCursor: true });

        btnContainer.on('pointerover', () => {
            btnContainer.setScale(1.04);
            btnBg.fillStyle(strokeColor, 0.3);
        });
        btnContainer.on('pointerout', () => {
            btnContainer.setScale(1.0);
            btnBg.fillStyle(bgColor, 0.95);
        });
        btnContainer.on('pointerdown', callback);

        return btnContainer;
    }

    showHowToPlayModal() {
        this.btnStart.setVisible(false);
        this.btnHowTo.setVisible(false);

        const modalContainer = this.add.container(640, 360);
        modalContainer.setDepth(50);
        
        const overlay = this.add.rectangle(0, 0, 1280, 720, 0x030101, 0);
        
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x0f0505, 0.98);
        modalBg.fillRoundedRect(-480, -285, 960, 570, 12);
        modalBg.lineStyle(3, 0xd4af37, 1);
        modalBg.strokeRoundedRect(-480, -285, 960, 570, 12);

        const title = this.add.text(0, -242, '❖ SWORD CODEX & BATTLE MANUAL ❖', {
            fontSize: '24px', 
            fill: '#ffd700', 
            fontFamily: '"Prompt", sans-serif', 
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const controlHeader = this.add.text(-440, -195, '⚔️ Samurai Controls', {
            fontSize: '16px', 
            fill: '#ff4500', 
            fontFamily: '"Prompt", sans-serif', 
            fontStyle: 'bold'
        });
        const controlLine1 = this.add.text(-440, -160, '• Move: Arrow Keys or [W][A][S][D]', { fontSize: '13.5px', fill: '#f1f5f9', fontFamily: '"Prompt", sans-serif' });
        const controlLine2 = this.add.text(-440, -130, '• Pause: Press [P] or [ESC]', { fontSize: '13.5px', fill: '#f1f5f9', fontFamily: '"Prompt", sans-serif' });
        const controlLine3 = this.add.text(-440, -100, '• Battle Duration: 60 Seconds', { fontSize: '13.5px', fill: '#f1f5f9', fontFamily: '"Prompt", sans-serif' });

        const vLine = this.add.graphics();
        vLine.lineStyle(1, 0x380404, 1);
        vLine.lineBetween(0, -200, 0, -50);

        const scoreHeader = this.add.text(40, -195, '⚡ Katana Power & Rarity', {
            fontSize: '16px', 
            fill: '#ff4500', 
            fontFamily: '"Prompt", sans-serif', 
            fontStyle: 'bold'
        });
        const scoreLine1 = this.add.text(40, -160, '• Sword 1: +10 | Sword 2: +25 | Sword 3: +50', { fontSize: '13.5px', fill: '#f1f5f9', fontFamily: '"Prompt", sans-serif' });
        const scoreLine2 = this.add.text(40, -130, '• Sword 4: +100 | Sword 5: +200 | Sword 6: +300!', { fontSize: '13.5px', fill: '#f1f5f9', fontFamily: '"Prompt", sans-serif' });
        const scoreLine3 = this.add.text(40, -100, '✨ BLADE FRENZY: Continuous collection grants bonus score!', { fontSize: '13.5px', fill: '#f1f5f9', fontFamily: '"Prompt", sans-serif' });

        const hLine = this.add.graphics();
        hLine.lineStyle(1, 0x380404, 1);
        hLine.lineBetween(-440, -35, 440, -35);

        const cardHeader = this.add.text(0, -15, '— Legendary Katana Collection (Click to Inspect) —', {
            fontSize: '14.5px', 
            fill: '#ffd700', 
            fontFamily: '"Prompt", sans-serif', 
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const cardData = [
            { name: 'Sword 1', score: '+10', frame: 0, x: -400 },
            { name: 'Sword 2', score: '+25', frame: 1, x: -240 },
            { name: 'Sword 3', score: '+50', frame: 2, x: -80 },
            { name: 'Sword 4', score: '+100', frame: 3, x: 80 },
            { name: 'Sword 5', score: '+200', frame: 4, x: 240 },
            { name: 'Sword 6', score: '+300', frame: 5, x: 400 }
        ];

        const cardGraphicsGroup = [];
        cardData.forEach(card => {
            const cardImg = this.add.image(card.x, 60, 'sword_sheet', card.frame);
            cardImg.setDisplaySize(58, 87);
            cardImg.setInteractive({ useHandCursor: true });

            const cardTxt = this.add.text(card.x, 125, `${card.name}\n${card.score}`, {
                fontSize: '13px', 
                fill: '#ffffff', 
                align: 'center', 
                fontFamily: '"Prompt", sans-serif', 
                fontStyle: 'bold'
            }).setOrigin(0.5);

            cardImg.on('pointerover', () => cardImg.setDisplaySize(66, 99));
            cardImg.on('pointerout', () => cardImg.setDisplaySize(58, 87));
            cardImg.on('pointerdown', () => {
                this.playSynthSound('click');
                this.zoomCardPreview('sword_sheet', card.frame, card.name, card.score);
            });

            cardGraphicsGroup.push(cardImg, cardTxt);
        });

        const closeBtn = this.add.text(0, 240, '[ Click to Close Codex ]', {
            fontSize: '15px', 
            fill: '#94a3b8', 
            fontFamily: '"Prompt", sans-serif', 
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        modalContainer.add([
            overlay, modalBg, title, 
            controlHeader, controlLine1, controlLine2, controlLine3,
            vLine, scoreHeader, scoreLine1, scoreLine2, scoreLine3,
            hLine, cardHeader, 
            ...cardGraphicsGroup, 
            closeBtn
        ]);

        modalContainer.setScale(0.5);
        modalContainer.setAlpha(0);

        this.tweens.add({
            targets: modalContainer,
            scale: 1,
            alpha: 1,
            duration: 350,
            ease: 'Back.out'
        });

        this.tweens.add({
            targets: overlay,
            alpha: 0.9,
            duration: 300
        });

        overlay.setInteractive();

        const closeModal = () => {
            this.playSynthSound('click');
            this.tweens.add({
                targets: modalContainer,
                scale: 0.6,
                alpha: 0,
                duration: 250,
                ease: 'Power2',
                onComplete: () => {
                    modalContainer.destroy();
                    this.btnStart.setVisible(true);
                    this.btnHowTo.setVisible(true);
                }
            });
        };

        closeBtn.on('pointerdown', closeModal);
        overlay.on('pointerdown', closeModal);
    }

    zoomCardPreview(key, frame, name, score) {
        const zoomContainer = this.add.container(640, 360);
        zoomContainer.setDepth(100);

        const zoomOverlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.92);
        zoomOverlay.setInteractive();

        const zoomBg = this.add.graphics();
        zoomBg.fillStyle(0x0f0505, 0.95);
        zoomBg.fillRoundedRect(-200, -250, 400, 500, 16);
        zoomBg.lineStyle(3, 0xd4af37, 1);
        zoomBg.strokeRoundedRect(-200, -250, 400, 500, 16);

        const bigCardImg = this.add.image(0, -30, key, frame);
        bigCardImg.setDisplaySize(220, 220);

        const cardTitle = this.add.text(0, 165, `${name} (${score} pts)`, {
            fontSize: '22px', 
            fill: '#ffd700', 
            fontFamily: '"Prompt", sans-serif', 
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const tipText = this.add.text(0, 210, '[ Click to Close Inspection ]', {
            fontSize: '13px', 
            fill: '#94a3b8', 
            fontFamily: '"Prompt", sans-serif'
        }).setOrigin(0.5);

        zoomContainer.add([zoomOverlay, zoomBg, bigCardImg, cardTitle, tipText]);

        zoomContainer.setScale(0.7);
        zoomContainer.setAlpha(0);
        this.tweens.add({
            targets: zoomContainer,
            scale: 1,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });

        zoomOverlay.on('pointerdown', () => {
            this.playSynthSound('click');
            this.tweens.add({
                targets: zoomContainer,
                scale: 0.8,
                alpha: 0,
                duration: 150,
                onComplete: () => zoomContainer.destroy()
            });
        });
    }

    startGame() {
        if (this.bgmTimer) this.bgmTimer.remove();

        const flash = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0);
        flash.setDepth(200);

        this.tweens.add({
            targets: flash,
            alpha: 1,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('GameplayScene');
                });
            }
        });
    }
}