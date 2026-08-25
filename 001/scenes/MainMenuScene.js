/**
 * MainMenuScene - Intro Splash & Main Menu
 * 1. Initial State: Black screen with pulsing/breathing "PRESS ANY KEY TO START" (unlocks AudioContext).
 * 2. Main Menu: Background artwork (assets/main_menu.jfif), horror trailer music (sound/apalonbeats-horror-horror-trailer-576252.mp3) on loop.
 * 3. Stylish START button that transitions to the Break Room scene.
 */

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    preload() {
        this.load.image('main_menu_bg', 'assets/main_menu.jfif');
        this.load.audio('main_menu_music', 'sound/apalonbeats-horror-horror-trailer-576252.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        const width = this.scale.width || 1280;
        const height = this.scale.height || 720;
        const cx = width / 2;
        const cy = height / 2;

        this.bgMusic = null;
        this.hasStarted = false;

        // ==========================================
        // 1. SPLASH SCREEN: "PRESS ANY KEY TO START"
        // ==========================================
        this.splashContainer = this.add.container(cx, cy);

        const pressKeyText = this.add.text(0, 0, 'PRESS ANY KEY TO START', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '26px',
            fontStyle: 'bold',
            color: '#e0e0e0',
            letterSpacing: 4,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.splashContainer.add(pressKeyText);

        // Breathing / Pulsing animation
        this.tweens.add({
            targets: pressKeyText,
            alpha: 0.2,
            scale: 1.04,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ดักจับการกดปุ่มใดๆ หรือการคลิกบนหน้าจอเพื่อเริ่ม
        const startIntro = () => {
            if (this.hasStarted) return;
            this.hasStarted = true;

            // ปลดล็อค AudioContext ทันที
            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }

            // เฟดหน้าจอ Splash ออกแล้วเปิดหน้าต่างชี้แจงโปรเจกต์ (Disclaimer Screen)
            this.tweens.add({
                targets: this.splashContainer,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    this.splashContainer.destroy();
                    this.showDevDisclaimer(cx, cy, width, height);
                }
            });
        };

        this.input.keyboard.once('keydown', startIntro);
        this.input.once('pointerdown', startIntro);
    }

    // ==========================================
    // 2. DISCLAIMER / DEV MESSAGE SCREEN
    // ==========================================
    showDevDisclaimer(cx, cy, width, height) {
        const disclaimerContainer = this.add.container(0, 0);
        disclaimerContainer.setAlpha(0);

        // หัวข้อ
        const header = this.add.text(cx, cy - 140, 'MESSAGE FROM DEVELOPER', {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '26px',
            fontStyle: 'bold',
            color: '#00d2d3',
            letterSpacing: 3,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        disclaimerContainer.add(header);

        // เส้นคั่นหัวข้อ
        const line = this.add.graphics();
        line.lineStyle(2, 0x00d2d3, 0.75);
        line.lineBetween(cx - 260, cy - 110, cx + 260, cy - 110);
        disclaimerContainer.add(line);

        // ข้อความภาษาไทย
        const thaiMessage = "เกมนี้เป็นส่วนหนึ่งของมินิโปรเจกต์ในชั้นเรียน\nฉันพยายามอย่างเต็มที่เพื่อให้เกมทำงานได้อย่างสมบูรณ์ที่สุด\nอาจมีบั๊กหรือข้อผิดพลาดเกิดขึ้นบ้าง\nแต่ฉันรับประกันว่าคุณจะสามารถเล่นจบเกมนี้ได้อย่างแน่นอน!";

        const msgText = this.add.text(cx, cy - 10, thaiMessage, {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#f1f5f9',
            align: 'center',
            lineSpacing: 18,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        disclaimerContainer.add(msgText);

        // คำแนะนำการไปต่อ
        const promptText = this.add.text(cx, cy + 155, '▼ [ คลิกที่หน้าจอหรือกดปุ่มใดๆ เพื่อเข้าสู่หน้าเมนูหลัก ]', {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#a0aec0',
            letterSpacing: 2
        }).setOrigin(0.5);
        disclaimerContainer.add(promptText);

        // อนิเมชั่นกระพริบคำแนะนำ
        this.tweens.add({
            targets: promptText,
            alpha: 0.3,
            scale: 1.03,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // เฟดหน้าจอ Disclaimer ขึ้นมา
        this.tweens.add({
            targets: disclaimerContainer,
            alpha: 1.0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                // รอ 300ms ก่อนเริ่มรับการคลิก เพื่อป้องกันคลิกทะลุจากหน้าก่อนหน้า
                this.time.delayedCall(300, () => {
                    let hasProceeded = false;
                    const proceedToMenu = () => {
                        if (hasProceeded) return;
                        hasProceeded = true;

                        this.tweens.add({
                            targets: disclaimerContainer,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => {
                                disclaimerContainer.destroy();
                                this.showMainMenu(cx, cy, width, height);
                            }
                        });
                    };

                    this.input.once('pointerdown', proceedToMenu);
                    this.input.keyboard.once('keydown', proceedToMenu);
                });
            }
        });
    }

    // ==========================================
    // 3. MAIN MENU SCREEN
    // ==========================================
    showMainMenu(cx, cy, width, height) {
        // 1. ภาพพื้นหลัง assets/main_menu.jfif พร้อมอนิเมชั่น Zoom ช้าๆ
        if (this.textures.exists('main_menu_bg')) {
            const bg = this.add.image(cx, cy, 'main_menu_bg');
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            const maxScale = Math.max(scaleX, scaleY);
            bg.setScale(maxScale);
            bg.setAlpha(0);

            this.tweens.add({
                targets: bg,
                alpha: 1.0,
                duration: 900,
                ease: 'Power2'
            });

            this.tweens.add({
                targets: bg,
                scale: maxScale * 1.05,
                duration: 12000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Dark Vignette Gradient Overlay
        const vignetteGfx = this.add.graphics();
        vignetteGfx.fillGradientStyle(0x000000, 0x000000, 0x110505, 0x110505, 0.4, 0.4, 0.85, 0.85);
        vignetteGfx.fillRect(0, 0, width, height);
        vignetteGfx.setAlpha(0);
        this.tweens.add({ targets: vignetteGfx, alpha: 1, duration: 800 });

        // 2. เล่นเพลงสยองขวัญ Trailer บนลูป
        try {
            if (this.cache.audio.exists('main_menu_music')) {
                this.bgMusic = this.sound.add('main_menu_music', { volume: 0.75, loop: true });
                this.bgMusic.play();
            }
        } catch (e) {}

        // 3. ชื่อเกม "ROTTING ALIVE"
        const titleContainer = this.add.container(cx, 175);
        titleContainer.setAlpha(0);

        const titleShadow = this.add.text(0, 4, 'ROTTING ALIVE', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#000000',
            letterSpacing: 6
        }).setOrigin(0.5);

        const titleText = this.add.text(0, 0, 'ROTTING ALIVE', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#e74c3c',
            letterSpacing: 6,
            stroke: '#2c0b0e',
            strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 24, stroke: true, fill: true }
        }).setOrigin(0.5);

        const subtitleText = this.add.text(0, 52, 'SURVIVE THE INFESTED FACILITY', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#a4b0be',
            letterSpacing: 8
        }).setOrigin(0.5);

        titleContainer.add([titleShadow, titleText, subtitleText]);

        this.tweens.add({
            targets: titleContainer,
            alpha: 1,
            y: 195,
            duration: 1000,
            ease: 'Power2'
        });

        // 4. ปุ่ม START สไตล์พรีเมียม
        this.time.delayedCall(500, () => {
            this.createStartButton(cx, cy + 155);
        });
    }

    createStartButton(x, y) {
        const btnW = 280;
        const btnH = 56;

        const btnContainer = this.add.container(x, y);
        btnContainer.setAlpha(0);

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x0f172a, 0.88);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
        btnBg.lineStyle(2, 0xe74c3c, 0.9);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);

        const btnText = this.add.text(0, 0, 'START GAME', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffffff',
            letterSpacing: 3,
            shadow: { offsetX: 0, offsetY: 2, color: '#e74c3c', blur: 10, fill: true }
        }).setOrigin(0.5);

        const hitZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ cursor: 'pointer' });

        // Hover Effects
        hitZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xe74c3c, 1.0);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
            btnBg.lineStyle(2.5, 0xffffff, 1.0);
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);

            this.tweens.add({
                targets: btnContainer,
                scale: 1.06,
                duration: 150,
                ease: 'Sine.easeInOut'
            });
        });

        hitZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x0f172a, 0.88);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
            btnBg.lineStyle(2, 0xe74c3c, 0.9);
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);

            this.tweens.add({
                targets: btnContainer,
                scale: 1.0,
                duration: 150,
                ease: 'Sine.easeInOut'
            });
        });

        // Click / Transition to Break Room
        hitZone.on('pointerdown', () => {
            this.playButtonClickSound();
            if (this.bgMusic) {
                this.bgMusic.stop();
                this.bgMusic.destroy();
                this.bgMusic = null;
            }
            this.sound.stopAll();

            // เสียงคลิกเริ่มต้น
            this.cameras.main.flash(300, 255, 255, 255);
            this.cameras.main.fadeOut(500, 0, 0, 0);

            this.cameras.main.once('camerafadeoutcomplete', () => {
                // เริ่มต้นที่ Break Room
                this.game.registry.set('collectedNoteIds', []);
                this.game.registry.set('collectedNotesCount', 0);
                this.game.registry.set('labStartTime', null);
                this.game.registry.set('restartCount', 0);
                this.scene.start('GameplayScene', { mapKey: 'break_room' });
            });
        });

        btnContainer.add([btnBg, btnText, hitZone]);

        this.tweens.add({
            targets: btnContainer,
            alpha: 1,
            duration: 600,
            ease: 'Power2'
        });
    }

    playButtonClickSound() {
        try {
            if (this.sound && this.sound.mute) return;
            const ctx = this.sound ? this.sound.context : null;
            if (!ctx || ctx.state !== 'running') return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.03);
            osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.07);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {}
    }

    shutdown() {
        if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic.destroy();
            this.bgMusic = null;
        }
        this.sound.stopAll();
    }
}
