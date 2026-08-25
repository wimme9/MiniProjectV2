/**
 * Victory Scene - Mission Complete & Escape Result Screen
 * Features:
 * 1. Whoosh sound effect followed by huge stamp zooming and slamming down to the top with a stamp sound & screen shake.
 * 2. High-energy symphonic victory rock music.
 * 3. Cinematic victory typography: "YOU HAVE ESCAPED!", "LUCKILY FRESH ALIVE".
 * 4. Stats: Notes collected (X/7 = pts), Time restarts, Time to complete (secret lab timer).
 * 5. Interactive replay button.
 */

export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    init(data) {
        this.collectedNotesCount = data.collectedNotesCount ?? (this.game.registry.get('collectedNotesCount') || 0);
        this.restartCount = data.restartCount ?? (this.game.registry.get('restartCount') || 0);
        this.completionTimeMs = data.completionTimeMs ?? 0;
        this.rockMusic = null;
    }

    preload() {
        this.load.image(
            'stamp_mission_complete',
            'assets/pngtree-mission-complete-stamp-rubber-stamp-job-vector-png-image_8730340.png'
        );
        this.load.audio('whoosh_sound', 'sound/dragon-studio-whoosh-effect-382717.mp3');
        this.load.audio('stamp_sound', 'sound/Stamp Sound.mp3');
        this.load.audio('rock_music', 'sound/43084433-symphonic-rock-ident-329612.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#05080d');
        this.cameras.main.fadeIn(400, 0, 0, 0);

        const width = this.scale.width || 1280;
        const height = this.scale.height || 720;
        const cx = width / 2;
        const cy = height / 2;

        // 1. สร้างพื้นหลังบรรยากาศ Dark Sci-Fi พร้อมละอองแสง
        this.createBackgroundEffects(cx, cy, width, height);

        // 2. ลำดับอนิเมชั่น Whoosh -> Stamp Slam Down -> Stamp Sound -> Rock Music -> Stats Reveal
        this.time.delayedCall(300, () => {
            this.playWhooshSound();

            // สร้างรูป Stamp ขนาดใหญ่กลางจอ
            const stamp = this.add.image(cx, cy - 60, 'stamp_mission_complete');
            stamp.setScale(2.2);
            stamp.setAlpha(0.1);
            stamp.setAngle(12);

            // อนิเมชั่นย่อส่วนกระแทกลงมาด้านบน
            this.tweens.add({
                targets: stamp,
                x: cx,
                y: 110,
                scale: 0.42,
                angle: -5,
                alpha: 1.0,
                duration: 550,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // เสียง Stamp กระแทกลงมา + กล้องสั่น
                    this.playStampSound();
                    this.cameras.main.shake(250, 0.012);

                    // เริ่มเล่นเพลง Rock Music
                    this.startRockMusic();

                    // แสดงข้อความและสถิติชัยชนะ
                    this.time.delayedCall(400, () => {
                        this.revealVictoryContent(cx, width);
                    });
                }
            });
        });
    }

    createBackgroundEffects(cx, cy, width, height) {
        // แสงสลัว Vignette Gradient
        const bgGfx = this.add.graphics();
        bgGfx.fillGradientStyle(0x162436, 0x162436, 0x05080d, 0x05080d, 0.6, 0.6, 1.0, 1.0);
        bgGfx.fillRect(0, 0, width, height);

        // เส้นกริดเท่ๆ สไตล์ Retro Terminal
        const gridGfx = this.add.graphics();
        gridGfx.lineStyle(1, 0x00ffff, 0.04);
        for (let x = 0; x < width; x += 40) {
            gridGfx.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 40) {
            gridGfx.lineBetween(0, y, width, y);
        }
    }

    revealVictoryContent(cx, width) {
        // 1. หัวข้อ YOU HAVE ESCAPED!
        const titleText = this.add.text(cx, 225, 'YOU HAVE ESCAPED!', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '44px',
            fontStyle: 'bold',
            color: '#ffd32a',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 4, color: '#ff3f34', blur: 16, stroke: true, fill: true }
        }).setOrigin(0.5).setAlpha(0).setScale(0.8);

        // 2. คำขวัญ LUCKILY FRESH ALIVE
        const subtitleText = this.add.text(cx, 280, 'LUCKILY FRESH ALIVE', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#2ed573',
            letterSpacing: 6,
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [titleText, subtitleText],
            alpha: 1,
            scale: 1,
            duration: 600,
            ease: 'Power2'
        });

        // 3. การ์ดแสดงผลสรุปสถิติ (Stats Box)
        this.time.delayedCall(450, () => {
            this.createStatsCard(cx);
        });
    }

    createStatsCard(cx) {
        const cardY = 440;
        const cardW = 580;
        const cardH = 210;

        const cardContainer = this.add.container(cx, cardY);
        cardContainer.setAlpha(0);

        // กรอบการ์ดสไตล์ Glassmorphism
        const cardGfx = this.add.graphics();
        cardGfx.fillStyle(0x0f172a, 0.85);
        cardGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
        cardGfx.lineStyle(2, 0x00d2d3, 0.7);
        cardGfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
        cardContainer.add(cardGfx);

        // คำนวณเวลาที่ใช้และคะแนน
        const formattedTime = this.formatCompletionTime(this.completionTimeMs);
        const notePts = this.collectedNotesCount * 10;

        // สถิติที่แสดง
        const statLines = [
            { label: 'NOTES COLLECTED', value: `${this.collectedNotesCount} / 7`, sub: `(${notePts} PTS)`, color: '#1dd1a1' },
            { label: 'TIME RESTARTS', value: `${this.restartCount}`, sub: '', color: '#ff6b6b' },
            { label: 'TIME TO COMPLETE', value: formattedTime, sub: '(Lab Escape)', color: '#feca57' }
        ];

        let lineY = -cardH / 2 + 35;
        statLines.forEach(item => {
            const lbl = this.add.text(-cardW / 2 + 35, lineY, item.label, {
                fontFamily: 'Sarabun, sans-serif',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#c8d6e5'
            }).setOrigin(0, 0.5);

            const val = this.add.text(cardW / 2 - 35, lineY, item.value + (item.sub ? `  ${item.sub}` : ''), {
                fontFamily: 'Sarabun, sans-serif',
                fontSize: '20px',
                fontStyle: 'bold',
                color: item.color
            }).setOrigin(1, 0.5);

            cardContainer.add([lbl, val]);
            lineY += 45;
        });

        // 4. ปุ่ม REPLAY / MAIN MENU
        const btnY = cardH / 2 - 28;
        const playBtnBg = this.add.graphics();
        playBtnBg.fillStyle(0x10ac84, 1.0);
        playBtnBg.fillRoundedRect(-120, btnY - 18, 240, 36, 8);
        playBtnBg.lineStyle(1.5, 0x1dd1a1, 1.0);
        playBtnBg.strokeRoundedRect(-120, btnY - 18, 240, 36, 8);

        const playBtnText = this.add.text(0, btnY, 'PLAY AGAIN', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        const playBtnHit = this.add.zone(0, btnY, 240, 36).setInteractive({ cursor: 'pointer' });

        playBtnHit.on('pointerover', () => {
            playBtnBg.clear();
            playBtnBg.fillStyle(0x1dd1a1, 1.0);
            playBtnBg.fillRoundedRect(-120, btnY - 18, 240, 36, 8);
            playBtnBg.lineStyle(2, 0xffffff, 1.0);
            playBtnBg.strokeRoundedRect(-120, btnY - 18, 240, 36, 8);
        });

        playBtnHit.on('pointerout', () => {
            playBtnBg.clear();
            playBtnBg.fillStyle(0x10ac84, 1.0);
            playBtnBg.fillRoundedRect(-120, btnY - 18, 240, 36, 8);
            playBtnBg.lineStyle(1.5, 0x1dd1a1, 1.0);
            playBtnBg.strokeRoundedRect(-120, btnY - 18, 240, 36, 8);
        });

        playBtnHit.on('pointerdown', () => {
            this.stopRockMusic();
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // รีเซ็ตสถานะการเล่นใหม่และเริ่มที่ break room
                this.game.registry.set('collectedNoteIds', []);
                this.game.registry.set('collectedNotesCount', 0);
                this.game.registry.set('labStartTime', null);
                this.scene.start('GameplayScene', { mapKey: 'break_room' });
            });
        });

        cardContainer.add([playBtnBg, playBtnText, playBtnHit]);

        this.tweens.add({
            targets: cardContainer,
            alpha: 1,
            y: cardY,
            duration: 700,
            ease: 'Cubic.easeOut'
        });
    }

    formatCompletionTime(ms) {
        if (!ms || ms <= 0) return '00:00';
        const totalSec = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;
        const mm = (minutes < 10 ? '0' : '') + minutes;
        const ss = (seconds < 10 ? '0' : '') + seconds;
        return `${mm}:${ss}`;
    }

    playWhooshSound() {
        try {
            if (this.cache.audio.exists('whoosh_sound')) {
                this.sound.play('whoosh_sound', { volume: 0.85 });
            }
        } catch (e) {}
    }

    playStampSound() {
        try {
            if (this.cache.audio.exists('stamp_sound')) {
                this.sound.play('stamp_sound', { volume: 1.0 });
            }
        } catch (e) {}
    }

    startRockMusic() {
        try {
            if (this.rockMusic && this.rockMusic.isPlaying) return;
            if (this.cache.audio.exists('rock_music')) {
                this.rockMusic = this.sound.add('rock_music', { volume: 0.75, loop: false });
                this.rockMusic.play();
            }
        } catch (e) {}
    }

    stopRockMusic() {
        try {
            if (this.rockMusic) {
                this.rockMusic.stop();
            }
        } catch (e) {}
    }
}
