/**
 * GameOverScene - Game Over Screen
 * Features:
 * - Background artwork: assets/game_over.jfif
 * - Looping game over music: sound/game-over.mp3
 * - 3 Buttons:
 *   1. CONTINUE: Continue exactly where died with flickering invulnerability & dialogue ("!!!", "อะไรน่ะ?! ... ฉันฝันไปเหรอ?")
 *   2. RESTART LEVEL: Restart the lab zone directly (skip break room)
 *   3. RETURN TO MAIN MENU: Return to the break room / beginning
 */

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.deathX = data.deathX ?? (53 * 32 + 16);
        this.deathY = data.deathY ?? (72 * 32 + 16);
        this.mapKey = data.mapKey || 'lab_zone_a1';
        this.bgMusic = null;
    }

    preload() {
        this.load.image('game_over_bg', 'assets/game_over.jfif');
        this.load.audio('game_over_music', 'sound/game-over.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(600, 0, 0, 0);

        const width = this.scale.width || 1280;
        const height = this.scale.height || 720;
        const cx = width / 2;
        const cy = height / 2;

        // 1. ภาพพื้นหลัง Game Over พร้อม Vignette Overlay
        if (this.textures.exists('game_over_bg')) {
            const bg = this.add.image(cx, cy, 'game_over_bg');
            const scaleX = width / bg.width;
            const scaleY = height / bg.height;
            const maxScale = Math.max(scaleX, scaleY);
            bg.setScale(maxScale);
            bg.setAlpha(0.85);

            // เอฟเฟกต์ซูมช้าๆ อย่างนุ่มนวล
            this.tweens.add({
                targets: bg,
                scale: maxScale * 1.04,
                duration: 9000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Dark Blood Vignette Gradient
        const darkGfx = this.add.graphics();
        darkGfx.fillGradientStyle(0x000000, 0x000000, 0x220000, 0x220000, 0.4, 0.4, 0.85, 0.85);
        darkGfx.fillRect(0, 0, width, height);

        // 2. เล่นเพลง Game Over แบบวนลูป
        try {
            if (this.cache.audio.exists('game_over_music')) {
                this.bgMusic = this.sound.add('game_over_music', { volume: 0.75, loop: true });
                this.bgMusic.play();
            }
        } catch (e) {}

        // 3. หัวข้อ GAME OVER
        const titleText = this.add.text(cx, 160, 'YOU DIED', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '56px',
            fontStyle: 'bold',
            color: '#ff4757',
            stroke: '#000000',
            strokeThickness: 9,
            shadow: { offsetX: 0, offsetY: 4, color: '#ff0000', blur: 20, stroke: true, fill: true }
        }).setOrigin(0.5).setAlpha(0).setScale(0.85);

        this.tweens.add({
            targets: titleText,
            alpha: 1,
            scale: 1,
            duration: 800,
            ease: 'Power2'
        });

        // 4. กล่องเมนูปุ่มตัวเลือก 3 ปุ่ม
        this.time.delayedCall(400, () => {
            this.createMenuButtons(cx, cy);
        });
    }

    createMenuButtons(cx, cy) {
        const btnContainer = this.add.container(cx, cy + 90);
        btnContainer.setAlpha(0);

        const buttons = [
            {
                text: 'CONTINUE',
                subText: '(ตื่นขึ้นมาตรงจุดที่ตาย)',
                color: 0x2ed573,
                hoverColor: 0x10ac84,
                textColor: '#ffffff',
                action: () => {
                    this.stopMusicAndTransition(() => {
                        this.scene.start('GameplayScene', {
                            mapKey: this.mapKey,
                            spawnX: this.deathX,
                            spawnY: this.deathY,
                            isContinueRevive: true
                        });
                    });
                }
            },
            {
                text: 'RESTART LEVEL',
                subText: '(เริ่มห้องแล็บใหม่ - รีเซ็ตเวลา)',
                color: 0xffa502,
                hoverColor: 0xe67e22,
                textColor: '#ffffff',
                action: () => {
                    this.stopMusicAndTransition(() => {
                        this.game.registry.set('labStartTime', Date.now());
                        this.game.registry.set('hasPlayedLabDialogue', false);
                        this.game.registry.set('hasMetSurvivorEvent', false);
                        this.game.registry.set('hasInspectedTerminal', false);
                        this.game.registry.set('hasVisitedSmallOfficeDoorBefore', false);
                        this.game.registry.set('hasVisitedMainOfficeDoorBefore', false);
                        this.game.registry.set('hasDiscoveredPasscode', false);
                        this.game.registry.set('savedQuestState', null);
                        this.scene.start('GameplayScene', {
                            mapKey: 'lab_zone_a1',
                            spawnX: 53 * 32 + 16,
                            spawnY: 72 * 32 + 16
                        });
                    });
                }
            },
            {
                text: 'RETURN TO MAIN MENU',
                subText: '(กลับไปหน้าเมนูหลัก)',
                color: 0x57606f,
                hoverColor: 0x2f3542,
                textColor: '#c8d6e5',
                action: () => {
                    this.stopMusicAndTransition(() => {
                        this.game.registry.set('hasMetSurvivorEvent', false);
                        this.game.registry.set('hasPlayedLabDialogue', false);
                        this.game.registry.set('hasInspectedTerminal', false);
                        this.game.registry.set('hasVisitedSmallOfficeDoorBefore', false);
                        this.game.registry.set('hasVisitedMainOfficeDoorBefore', false);
                        this.game.registry.set('hasDiscoveredPasscode', false);
                        this.game.registry.set('savedQuestState', null);
                        this.game.registry.set('labStartTime', null);
                        this.scene.start('MainMenuScene');
                    });
                }
            }
        ];

        const btnW = 380;
        const btnH = 50;
        const spacing = 68;
        const startY = -((buttons.length - 1) * spacing) / 2;

        buttons.forEach((btnInfo, idx) => {
            const bY = startY + idx * spacing;

            const bgGfx = this.add.graphics();
            bgGfx.fillStyle(0x0f172a, 0.85);
            bgGfx.fillRoundedRect(-btnW / 2, bY - btnH / 2, btnW, btnH, 8);
            bgGfx.lineStyle(1.5, btnInfo.color, 0.85);
            bgGfx.strokeRoundedRect(-btnW / 2, bY - btnH / 2, btnW, btnH, 8);

            const label = this.add.text(-btnW / 2 + 25, bY, btnInfo.text, {
                fontFamily: 'Sarabun, sans-serif',
                fontSize: '20px',
                fontStyle: 'bold',
                color: btnInfo.textColor
            }).setOrigin(0, 0.5);

            const subLabel = this.add.text(btnW / 2 - 20, bY, btnInfo.subText, {
                fontFamily: 'Sarabun, sans-serif',
                fontSize: '13px',
                color: '#a4b0be'
            }).setOrigin(1, 0.5);

            const hitZone = this.add.zone(0, bY, btnW, btnH).setInteractive({ cursor: 'pointer' });

            hitZone.on('pointerover', () => {
                bgGfx.clear();
                bgGfx.fillStyle(btnInfo.hoverColor, 0.95);
                bgGfx.fillRoundedRect(-btnW / 2, bY - btnH / 2, btnW, btnH, 8);
                bgGfx.lineStyle(2, 0xffffff, 1.0);
                bgGfx.strokeRoundedRect(-btnW / 2, bY - btnH / 2, btnW, btnH, 8);
            });

            hitZone.on('pointerout', () => {
                bgGfx.clear();
                bgGfx.fillStyle(0x0f172a, 0.85);
                bgGfx.fillRoundedRect(-btnW / 2, bY - btnH / 2, btnW, btnH, 8);
                bgGfx.lineStyle(1.5, btnInfo.color, 0.85);
                bgGfx.strokeRoundedRect(-btnW / 2, bY - btnH / 2, btnW, btnH, 8);
            });

            hitZone.on('pointerdown', () => {
                this.playButtonClickSound();
                btnInfo.action();
            });

            btnContainer.add([bgGfx, label, subLabel, hitZone]);
        });

        this.tweens.add({
            targets: btnContainer,
            alpha: 1,
            duration: 600,
            ease: 'Power2'
        });
    }

    stopMusicAndTransition(callback) {
        if (this.bgMusic) {
            this.bgMusic.stop();
        }
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', callback);
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
}
