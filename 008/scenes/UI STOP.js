class UISTOP extends Phaser.Scene {
    constructor() {
        super('UISTOP');
    }

    create() {
        // 1. พื้นหลังโปร่งแสง
        let graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7); 
        graphics.fillRect(0, 0, 400, 600);

        // 2. ข้อความ PAUSED
        this.add.text(200, 200, 'PAUSED', {
            fontSize: '50px',
            fill: '#ffffff',
            fontFamily: 'Impact, Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 3. ปุ่ม เล่นต่อ (RESUME)
        let resumeBtn = this.add.text(200, 320, '▶ เล่นต่อ', {
            fontSize: '26px',
            fill: '#00ffcc',
            fontFamily: 'Tahoma, Arial',
            fontStyle: 'bold',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        resumeBtn.on('pointerover', () => resumeBtn.setTint(0xffffff));
        resumeBtn.on('pointerout', () => resumeBtn.clearTint());
        
        resumeBtn.on('pointerdown', () => {
            this.scene.resume('GamesScenes'); // สั่งให้ฉากเกมเดินต่อ
            this.scene.stop(); // สั่งปิดฉากเมนู Pause
        });

        // 🌟 4. ปุ่ม กลับหน้าหลัก (MAIN MENU)
        let menuBtn = this.add.text(200, 400, '🏠 กลับหน้าหลัก', {
            fontSize: '26px',
            fill: '#ffaa00', // ใช้สีส้มเหลืองให้ดูแตกต่าง
            fontFamily: 'Tahoma, Arial',
            fontStyle: 'bold',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setTint(0xffffff));
        menuBtn.on('pointerout', () => menuBtn.clearTint());
        
        menuBtn.on('pointerdown', () => {
            // ดึงข้อมูลฉาก GamesScenes มาเพื่อสั่งหยุดเพลงก่อน
            let gameScene = this.scene.get('GamesScenes');
            if (gameScene.bgMusic) {
                gameScene.bgMusic.stop(); // ปิดเพลงประกอบเกม
            }
            
            // ปิดฉากปัจจุบันและฉากเกม แล้วสลับไปหน้า UI_Screen
            this.scene.stop('GamesScenes'); 
            this.scene.start('UI_Screen');  
            this.scene.stop();              
        });
    }
}