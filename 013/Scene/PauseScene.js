export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    // ==================== [ ระบบสร้างเสียงด้วยโค้ด (Web Audio API) ] ====================
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
                // เสียงคลิกปุ่มตัวเลือก: เสียงใสสั้นๆ นุ่มนวล
                osc.type = 'sine';
                filter.frequency.setValueAtTime(1000, now);
                osc.frequency.setValueAtTime(440, now); // A4
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // ไป A5

                gainNode.gain.setValueAtTime(0.06, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc.start(now);
                osc.stop(now + 0.12);
            }
        } catch (e) {
            console.log("Audio Context prevented or not supported", e);
        }
    }
    // ===================================================================================

    create() {
        // --- 1. Dim Overlay Background (ปรับเป็นโทนสีดำเข้มอมแดงเลือดหมู) ---[cite: 5]
        this.add.rectangle(640, 360, 1280, 720, 0x0a0505, 0.85);

        // --- 2. Panel Window (กล่องเมนูหยุดเกมสไตล์ซามูไร/เหล็กกล้าและทอง) ---[cite: 5]
        const panel = this.add.graphics();
        panel.fillStyle(0x120808, 0.95);
        panel.fillRoundedRect(440, 140, 400, 440, 20);
        panel.lineStyle(3, 0x8b0000, 0.9);
        panel.strokeRoundedRect(440, 140, 400, 440, 20);

        // เส้นเรืองแสงชั้นในเพิ่มมิติ (โทนสีทอง)[cite: 5]
        const panelGlow = this.add.graphics();
        panelGlow.lineStyle(1, 0xd4af37, 0.6);
        panelGlow.strokeRoundedRect(444, 144, 392, 432, 16);

        // --- 3. หัวข้อ PAUSED ---[cite: 5]
        this.add.text(640, 205, 'GAME PAUSED', {
            fontSize: '36px',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // --- 4. ปุ่มเมนูต่างๆ พร้อมปรับสีธีมซามูไรและใส่เสียงคลิก ---[cite: 5]
        // 1. Resume Button
        this.createButton(640, 290, 'RESUME', 0x8b0000, 0xd4af37, () => {
            this.playSynthSound('click');
            this.resumeGame();
        });

        // 2. Restart Button
        this.createButton(640, 370, 'RESTART', 0x4a0000, 0xff4500, () => {
            this.playSynthSound('click');
            this.scene.stop('GameplayScene');
            this.scene.start('GameplayScene');
        });

        // 3. Main Menu Button
        this.createButton(640, 450, 'MAIN MENU', 0x1a0505, 0xd4af37, () => {
            this.playSynthSound('click');
            this.scene.stop('GameplayScene');
            this.scene.start('MenuScene');
        });

        this.input.keyboard.on('keydown-P', () => {
            this.playSynthSound('click');
            this.resumeGame();
        }, this);
        this.input.keyboard.on('keydown-ESC', () => {
            this.playSynthSound('click');
            this.resumeGame();
        }, this);
    }

    createButton(x, y, label, baseColor, strokeColor, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(baseColor, 1);
        bg.fillRoundedRect(-120, -22, 240, 44, 10);
        bg.lineStyle(2, strokeColor, 0.8);
        bg.strokeRoundedRect(-120, -22, 240, 44, 10);

        const txt = this.add.text(0, 0, label, {
            fontSize: '18px', 
            fill: '#ffffff', 
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        container.add([bg, txt]);
        container.setSize(240, 44);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            container.setScale(1.05);
            bg.clear();
            bg.fillStyle(strokeColor, 1);
            bg.fillRoundedRect(-120, -22, 240, 44, 10);
            bg.lineStyle(2, 0xffffff, 1);
            bg.strokeRoundedRect(-120, -22, 240, 44, 10);
            txt.setFill('#0a0505');
        });

        container.on('pointerout', () => {
            container.setScale(1.0);
            bg.clear();
            bg.fillStyle(baseColor, 1);
            bg.fillRoundedRect(-120, -22, 240, 44, 10);
            bg.lineStyle(2, strokeColor, 0.8);
            bg.strokeRoundedRect(-120, -22, 240, 44, 10);
            txt.setFill('#ffffff');
        });

        container.on('pointerdown', callback);
    }

    resumeGame() {
        this.scene.stop();
        this.scene.resume('GameplayScene');
    }
}