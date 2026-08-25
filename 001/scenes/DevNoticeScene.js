/**
 * DevNoticeScene - Message From Developer Screen
 * Displays project notice before entering the lab zone
 */

export default class DevNoticeScene extends Phaser.Scene {
    constructor() {
        super('DevNoticeScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(600, 0, 0, 0);

        const width = this.scale.width || 1280;
        const height = this.scale.height || 720;
        const cx = width / 2;
        const cy = height / 2;

        const contentContainer = this.add.container(0, 0);

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
        contentContainer.add(header);

        // เส้นคั่นหัวข้อ
        const line = this.add.graphics();
        line.lineStyle(2, 0x00d2d3, 0.75);
        line.lineBetween(cx - 260, cy - 110, cx + 260, cy - 110);
        contentContainer.add(line);

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
        contentContainer.add(msgText);

        // คำแนะนำการไปต่อ
        const promptText = this.add.text(cx, cy + 155, '▼ [ คลิกที่หน้าจอหรือกดปุ่มใดๆ เพื่อเข้าสู่ห้องแล็บ ]', {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#a0aec0',
            letterSpacing: 2
        }).setOrigin(0.5);
        contentContainer.add(promptText);

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

        // ดักจับการคลิกหรือกดปุ่มใดๆ เพื่อเข้าสู่ห้องแล็บ
        let hasProceeded = false;
        const proceedToLab = () => {
            if (hasProceeded) return;
            hasProceeded = true;

            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameplayScene', {
                    mapKey: 'lab_zone_a1',
                    spawnX: 53 * 32 + 16,
                    spawnY: 72 * 32 + 16
                });
            });
        };

        // รอ 500ms หลัง Fade In ก่อนรับการคลิก เพื่อป้องกันคลิกค้างจากการกระทำก่อนหน้า
        this.time.delayedCall(500, () => {
            this.input.once('pointerdown', proceedToLab);
            this.input.keyboard.once('keydown', proceedToLab);
        });
    }
}
