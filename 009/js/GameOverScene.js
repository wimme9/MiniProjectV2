export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }
    preload() {
        this.load.image('gameover_bg', 'img/gameover.png');
    }
    create() {
        // ฉากหลังดำมืด
        let darkScreen = this.add.graphics();
        darkScreen.fillStyle(0x000000, 0.7);
        darkScreen.fillRect(0, 0, 800, 600);

        let uiContainer = this.add.container(400, 300);

        // โหลดรูปแผ่นป้าย
        let uiBg = this.add.image(0, 0, 'gameover_bg').setScale(0.4);
        uiContainer.add(uiBg);

        // ==========================================
        // 🩸 ข้อความ YOU DIED! + แอนิเมชันเต้นตุบๆ
        // ==========================================
        // 🌟 เพิ่ม fontFamily และ padding กันสระหาย
        let loseText = this.add.text(0, -70, 'แพ้แล้วครับบ!!', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '56px', 
            fill: '#ff0000', 
            fontStyle: 'bold',
            padding: { top: 20, bottom: 20 }
        }).setOrigin(0.5);
        uiContainer.add(loseText);

        // 🌟 เพิ่มแอนิเมชันให้ ขยับตลอดเวลา
        this.tweens.add({
            targets: loseText,
            scale: 1.15,          // ขยายใหญ่ขึ้น 15%
            duration: 800,        // ความเร็ว 0.8 วินาที
            yoyo: true,           // เด้งกลับมาขนาดเดิม
            repeat: -1,           // เล่นซ้ำไปเรื่อยๆ ไม่มีหยุด
            ease: 'Sine.easeInOut'// ทำให้จังหวะขยาย-หดดูนุ่มนวล
        });

        // ==========================================
        // 🔘 ปุ่มกด (ปรับตำแหน่ง Y ดันขึ้นบนแล้ว)
        // ==========================================
        // 🌟 เพิ่ม fontFamily และ padding กันสระหาย
        let btnRestart = this.add.text( -110, 45, 'เริ่มใหม่', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '24px', 
            fill: '#ffffff', 
            fontStyle: 'bold',
            padding: { top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive();

        // 🌟 เพิ่ม fontFamily และ padding กันสระหาย
        let btnMenu = this.add.text(100, 45, 'กลับไปเมนู', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '24px', 
            fill: '#ffffff', 
            fontStyle: 'bold',
            padding: { top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive();

        // เอฟเฟกต์เวลาเอาเมาส์ชี้ปุ่ม
        [btnRestart, btnMenu].forEach(btn => {
            btn.on('pointerover', () => { btn.setScale(1.2); btn.setTint(0x00ff00); });
            btn.on('pointerout', () => { btn.setScale(1.0); btn.clearTint(); });
        });

        // กดปุ่ม RESTART
        btnRestart.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameplayScene');
        });

        // กดปุ่ม MENU
        btnMenu.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('GameplayScene');
            this.scene.start('MenuScene');
        });

        uiContainer.add([btnRestart, btnMenu]);

        // แอนิเมชันหน้าต่างเด้งดึ๋งตอนเปิด
        uiContainer.setScale(0);
        this.tweens.add({
            targets: uiContainer, scale: 1, duration: 600, ease: 'Back.easeOut'
        });
    }
}