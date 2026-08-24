export default class NoteScene extends Phaser.Scene {
    constructor() {
        super('NoteScene');
    }

    init(data) {
        this.parentSceneKey = data?.parentSceneKey || 'GameplayScene';
        this.note = data?.note || {
            title: "บันทึก",
            body: "ไม่มีข้อความ"
        };
    }

    create() {
        const cx = 640;
        const cy = 360;
        const winW = 620;
        const winH = 460;
        const left = cx - winW / 2;
        const top = cy - winH / 2;

        // 1. Freeze ผู้เล่นในฉากหลักขณะอ่านบันทึก
        const parentScene = this.scene.get(this.parentSceneKey);
        if (parentScene && parentScene.interactions) {
            parentScene.interactions.lock();
        }
        if (parentScene && parentScene.player && parentScene.player.body) {
            parentScene.player.setVelocity(0, 0);
            parentScene.player.anims.play('idle', true);
        }

        // 2. แบ็กดรอปมืดกึ่งโปร่งแสง (คลิกพื้นที่ด้านนอกเพื่อปิด)
        const backdrop = this.add.rectangle(cx, cy, 1280, 720, 0x000000, 0.65)
            .setInteractive();

        backdrop.on('pointerdown', () => {
            this.closeNote();
        });

        // 3. กรอบกระดาษโน้ตสีขาว ขอบสีดำ
        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(0xffffff, 1);
        bgGfx.fillRect(left, top, winW, winH);
        bgGfx.lineStyle(3, 0x000000, 1);
        bgGfx.strokeRect(left, top, winW, winH);

        // เส้นแบ่งใต้หัวข้อ (จัดให้อยู่ภายในกรอบพอดี ไม่ล้น)
        bgGfx.lineStyle(1.5, 0x333333, 1);
        bgGfx.lineBetween(left + 24, top + 54, left + winW - 24, top + 54);

        // ตัวกั้นคลิกไม่ให้ทะลุไปโดน backdrop
        const winBlocker = this.add.rectangle(cx, cy, winW, winH, 0x000000, 0.001)
            .setInteractive();
        winBlocker.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
        });

        // 4. หัวข้อ Note (คมชัด อ่านง่าย)
        this.add.text(cx, top + 16, this.note.title, {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#000000',
            align: 'center',
            resolution: 2
        }).setOrigin(0.5, 0);

        // 5. ปุ่มปิด [ ✕ ] มุมขวาบน
        const closeBtnBox = this.add.rectangle(left + winW - 32, top + 27, 36, 36, 0xffffff)
            .setStrokeStyle(1.5, 0x000000)
            .setInteractive({ useHandCursor: true });

        const closeBtnText = this.add.text(closeBtnBox.x, closeBtnBox.y, "✕", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#000000',
            resolution: 2
        }).setOrigin(0.5);

        closeBtnBox.on('pointerover', () => {
            closeBtnBox.setFillStyle(0xe11d48);
            closeBtnText.setColor('#ffffff');
        });
        closeBtnBox.on('pointerout', () => {
            closeBtnBox.setFillStyle(0xffffff);
            closeBtnText.setColor('#000000');
        });
        closeBtnBox.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            if (this.scene.get('GameplayScene') && typeof this.scene.get('GameplayScene').playButtonClickSound === 'function') {
                this.scene.get('GameplayScene').playButtonClickSound();
            }
            this.closeNote();
        });

        // 6. เนื้อหาข้อความในโน้ต (ตัวหนังสือขนาด 18px คมชัด ชัดเจน อ่านสบายตา)
        this.add.text(left + 32, top + 74, this.note.body, {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '18px',
            color: '#1a1a1a',
            wordWrap: { width: winW - 64, useAdvancedWrap: true },
            lineSpacing: 10,
            resolution: 2
        });

        // 7. คีย์ลัด ESC / Space / E เพื่อปิด
        this.input.keyboard.on('keydown-ESC', () => this.closeNote());
        this.input.keyboard.on('keydown-SPACE', () => this.closeNote());
        this.input.keyboard.on('keydown-E', () => this.closeNote());
    }

    closeNote() {
        const parentScene = this.scene.get(this.parentSceneKey);
        if (parentScene && parentScene.interactions) {
            parentScene.interactions.unlock();
        }
        this.scene.stop('NoteScene');
    }
}
