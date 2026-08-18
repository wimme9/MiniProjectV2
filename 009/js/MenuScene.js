export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        // โหลดรูปภาพพื้นหลัง UI เมนูของคุณ
        this.load.image('main_bg', 'img/Main.png'); 
        
        // 🌟 โหลดเสียง BGM แนวน่ากลัวสำหรับหน้าแรก 🌟
        this.load.audio('snd_horror_bg', 'sound/horror_sound_bg.mp3'); 
    }

    create() {
        // 🌟 เช็คสถานะไฟล์เสียง เพื่อให้เล่นต่อเนียนๆ ถ้าย้ายมาจากหน้าเนื้อเรื่อง/วิธีเล่น
        let existingBgSound = this.sound.get('snd_horror_bg');
        
        if (!existingBgSound) {
            this.sndMenuBg = this.sound.add('snd_horror_bg', { volume: 5, loop: true });
            this.sndMenuBg.play();
        } else if (!existingBgSound.isPlaying) {
            this.sndMenuBg = existingBgSound;
            this.sndMenuBg.play();
        } else {
            this.sndMenuBg = existingBgSound; 
        }

        // 1. แสดงรูปภาพพื้นหลัง UI หลักของเกม
        let bg = this.add.image(420, 280, 'main_bg');
        bg.setDisplaySize(800, 600); // ปรับขนาดให้พอดีกับจอเกม 800x600

        // 🌟 ใส่ชื่อเกม
        this.add.text(400, 60, 'ฝ่านรกดงซอมบี้', { 
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '40px', 
            fill: '#00ff00', 
            fontStyle: 'bold', 
            stroke: '#000000', 
            strokeThickness: 5,
            padding: { top: 15, bottom: 15 } 
        }).setOrigin(0.5);

        // ==========================================
        // 2. สร้าง HTML Input (Login & Password) 
        // ==========================================
        this.loginInput = document.createElement('input');
        this.loginInput.type = 'text';
        this.loginInput.placeholder = 'LOGIN';
        this.setinputStyle(this.loginInput, 135, 180);
        
        // 🌟 ดักจับการพิมพ์ บังคับให้ใส่ได้แค่ "ตัวเลข" เท่านั้น
        this.loginInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        this.passwordInput = document.createElement('input');
        this.passwordInput.type = 'password';
        this.passwordInput.placeholder = 'PASSWORD';
        this.setinputStyle(this.passwordInput, 135, 250);
        
        // 🌟 ดักจับการพิมพ์ บังคับให้ใส่ได้แค่ "ตัวเลข" เท่านั้น
        this.passwordInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        document.body.appendChild(this.loginInput);
        document.body.appendChild(this.passwordInput);

        // ==========================================
        // 3. สร้างปุ่ม PLAY 
        // ==========================================
        let playBtn = this.add.text(220, 415, 'PLAY', {
            fontSize: '30px',
            fill: '#0a0c06',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            padding: { top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive();

        playBtn.on('pointerover', () => {
            playBtn.setScale(1.15); 
            playBtn.setTint(0x00ff00); 
        });
        playBtn.on('pointerout', () => {
            playBtn.setScale(1.0); 
            playBtn.clearTint();
        });
        playBtn.on('pointerdown', () => {
            this.handleLoginCheck();
        });

        // ==========================================
        // 4. สร้างปุ่ม "เนื้อเรื่อง" และ "วิธีเล่น" 
        // ==========================================
        let storyBtn = this.add.text(300, 535, 'เนื้อเรื่อง', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '20px', 
            fill: '#ffffff', 
            fontStyle: 'bold',
            padding: { top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive();

        let howToPlayBtn = this.add.text(505, 535, 'วิธีเล่น', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '20px', 
            fill: '#ffffff', 
            fontStyle: 'bold',
            padding: { top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive();

        [storyBtn, howToPlayBtn].forEach(btn => {
            btn.on('pointerover', () => {
                btn.setScale(1.1);
                btn.setTint(0x00ff00); 
            });
            btn.on('pointerout', () => {
                btn.setScale(1.0);
                btn.clearTint();
            });
        });

        storyBtn.on('pointerdown', () => {
            this.scene.start('StoryScene');
        });

        howToPlayBtn.on('pointerdown', () => {
            this.scene.start('HowToPlayScene');
        });

        // ==========================================
        // 5. ข้อความเตือน (Alert Text) ซ่อนไว้ก่อน
        // ==========================================
        this.warningText = this.add.text(400, 150, '', {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '28px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { top: 15, bottom: 15, left: 15, right: 15 }, 
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(100);
        this.warningText.setVisible(false);

        // จัดการลบ HTML Input ทิ้งเมื่อเปลี่ยนฉาก
        this.events.on('shutdown', () => {
            if (this.loginInput && this.loginInput.parentNode) {
                this.loginInput.remove();
            }
            if (this.passwordInput && this.passwordInput.parentNode) {
                this.passwordInput.remove();
            }
        });
    }

    setinputStyle(input, x, y) {
        input.style.position = 'absolute';
        let canvas = document.querySelector('canvas');
        let rect = canvas ? canvas.getBoundingClientRect() : { left: 100, top: 100, width: 800, height: 600 };
        
        input.style.left = `${rect.left + (x / 800) * rect.width}px`;
        input.style.top = `${rect.top + (y / 600) * rect.height}px`;
        input.style.width = '140px';
        input.style.height = '30px';
        input.style.background = '#222';
        input.style.color = '#adff2f';
        input.style.border = '2px solid #555';
        input.style.padding = '2px 8px';
        input.style.fontFamily = 'monospace';
        input.style.fontSize = '14px';
        input.style.zIndex = '10';
    }

    // 🌟 ฟังก์ชันตรวจสอบ ID / PASS แบบระบุค่า
    handleLoginCheck() {
        let user = this.loginInput.value.trim();
        let pass = this.passwordInput.value.trim();

        // เช็คว่าไอดีและรหัสผ่านตรงกับฐานข้อมูลจำลองหรือไม่
        if (user === '123' && pass === '098') {
            // ถ้ารหัสถูก กรอบเป็นสีปกติ
            this.loginInput.style.border = '2px solid #555';
            this.passwordInput.style.border = '2px solid #555';
            
            // หยุดเพลงเมนู
            if (this.sndMenuBg && this.sndMenuBg.isPlaying) {
                this.sndMenuBg.stop();
            }

            console.log("Login สำเร็จ! กำลังเข้าเกม...");
            this.scene.start('GameplayScene'); 

        } else {
            // ถ้ารหัสผิด ให้กรอบกลายเป็นสีแดง
            this.loginInput.style.border = '2px solid #ff0000';
            this.passwordInput.style.border = '2px solid #ff0000';

            // แสดงข้อความแจ้งเตือนรหัสผิด
            this.warningText.setText('⚠️ รหัสหรือชื่อไม่ถูกต้อง ให้ใส่ใหม่!');
            this.warningText.setVisible(true);
            this.warningText.setScale(0.5);

            // แอนิเมชันเด้งเตือน
            this.tweens.add({
                targets: this.warningText,
                scale: 1.2,
                duration: 200,
                yoyo: true,
                hold: 1500, // โชว์ค้างไว้ 1.5 วินาทีให้ผู้เล่นอ่านทัน
                onComplete: () => {
                    this.warningText.setVisible(false);
                }
            });
        }
    }
}