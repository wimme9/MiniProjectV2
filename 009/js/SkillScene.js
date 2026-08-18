export default class SkillScene extends Phaser.Scene {
    constructor() {
        super('SkillScene');
    }

    init(data) {
        // รับข้อมูลมาจากหน้า Gameplay
        this.gameplay = data.gameplay;
        this.availableSkills = data.availableSkills;
    }

    create() {
        this.input.setDefaultCursor('default'); // เอาเมาส์ลูกศรปกติกลับมา

        let darkScreen = this.add.graphics();
        darkScreen.fillStyle(0x000000, 0.85);
        darkScreen.fillRect(0, 0, 800, 600);

        // สร้าง Container ไว้กึ่งกลางจอ
        this.uiContainer = this.add.container(400, 300);

        let titleText = this.add.text(0, -200, 'LEVEL UP! CHOOSE A SKILL', { 
            fontSize: '40px', fill: '#ffff00', fontStyle: 'bold', fontFamily: 'Tahoma, sans-serif'
        }).setOrigin(0.5);
        this.uiContainer.add(titleText);

        // สร้างรูปภาพประกายแสงเตรียมไว้ตอนกดยืนยัน
        if (!this.textures.exists('spark')) {
            let g = this.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 4);
            g.generateTexture('spark', 8, 8);
            g.destroy();
        }

        // ==========================================
        // 🌟 ระบบเติมการ์ดให้เต็ม 3 ใบ (กันการ์ดขาดตอนเลเวลท้ายๆ)
        // ==========================================
        let pool = [...this.availableSkills];

        // กำหนดสกิลที่จะเอามาเสียบแทน (ไม่เอาปืน) 
        // ID 9 = เพิ่มเลือด (Vitality), ID 6 = เพิ่มดาเมจ (Brutal Force)
        let extraSkills = [9, 6]; 
        let extraIndex = 0;
        
        while (pool.length < 3) {
            let skillToFill = extraSkills[extraIndex % extraSkills.length];
            // เช็คว่าในหน้าจอมีการ์ดใบนี้โชว์อยู่แล้วหรือยัง (จะได้ไม่ขึ้นการ์ดซ้ำ 2 ใบติด)
            if (!pool.includes(skillToFill)) {
                pool.push(skillToFill);
            } else {
                pool.push(extraSkills[(extraIndex + 1) % extraSkills.length]);
            }
            extraIndex++;
        }

        // 🎲 สุ่มสกิล 3 อย่างมาแสดงผล
        let shuffled = Phaser.Utils.Array.Shuffle(pool); 
        let selectedSkills = shuffled.slice(0, 3);

        let startX = -240; 
        let spacing = 240; 

        // ตัวแปรเก็บค่าสกิลที่ถูกเลือก
        this.selectedSkillId = null;
        this.selectedCard = null;
        this.allCards = []; 

        // ==========================================
        // สร้างปุ่ม "ตกลง" (ซ่อนสถานะเป็นสีเทาไว้ก่อน)
        // ==========================================
        this.confirmBtn = this.add.text(0, 220, 'ตกลง (CONFIRM)', {
            fontFamily: 'Tahoma, sans-serif', fontSize: '28px', fill: '#888888', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { top: 10, bottom: 10, left: 30, right: 30 }
        }).setOrigin(0.5).setInteractive();
        this.uiContainer.add(this.confirmBtn);

        // สร้างการ์ดสกิล
        selectedSkills.forEach((skillId, index) => {
            let cardImage = 'skill_' + skillId;
            
            let card = this.add.image(startX + (index * spacing), 10, cardImage).setScale(0.45).setInteractive();
            this.uiContainer.add(card);
            this.allCards.push(card); 
            
            // เอฟเฟกต์เด้งตอนเอาเมาส์ชี้
            card.on('pointerover', () => { 
                if (this.selectedCard !== card) {
                    card.setScale(0.5); 
                    card.setTint(0x00ff00); 
                }
            });
            card.on('pointerout', () => { 
                if (this.selectedCard !== card) {
                    card.setScale(0.45); 
                    card.clearTint(); 
                }
            });
            
            // เมื่อคลิกการ์ด (แค่ไฮไลต์สีทอง เตรียมยืนยัน)
            card.on('pointerdown', () => {
                this.allCards.forEach(c => {
                    c.setScale(0.45);
                    c.clearTint();
                });

                this.selectedSkillId = skillId;
                this.selectedCard = card;

                card.setTint(0xffaa00);
                card.setScale(0.55);

                // ปลดล็อกปุ่ม "ตกลง" ให้เป็นสีเขียว
                this.confirmBtn.setFill('#ffffff');
                this.confirmBtn.setBackgroundColor('#00aa00');
            });
        });

        // ==========================================
        // ตั้งค่าการกดปุ่ม "ตกลง"
        // ==========================================
        this.confirmBtn.on('pointerover', () => {
            if (this.selectedSkillId !== null) this.confirmBtn.setScale(1.1);
        });
        this.confirmBtn.on('pointerout', () => {
            this.confirmBtn.setScale(1.0);
        });
        
        this.confirmBtn.on('pointerdown', () => {
            if (this.selectedSkillId !== null) {
                this.executeSelection();
            }
        });

        // แอนิเมชันเปิดหน้าต่างเด้งดึ๋งๆ
        this.uiContainer.setScale(0); 
        this.tweens.add({
            targets: this.uiContainer,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });
    }

    // ฟังก์ชันยิงพลุและส่งข้อมูลกลับไปหน้า Gameplay
    executeSelection() {
        this.input.enabled = false; 
        
        let emitter = this.add.particles(this.uiContainer.x + this.selectedCard.x, this.uiContainer.y + this.selectedCard.y, 'spark', {
            speed: { min: 200, max: 500 }, 
            angle: { min: 0, max: 360 }, 
            scale: { start: 1.5, end: 0 }, 
            alpha: { start: 1, end: 0 },
            lifespan: 800, 
            gravityY: 500, 
            tint: [ 0xffff00, 0xffaa00, 0xffffff ], 
            emitting: false 
        });
        emitter.explode(50); 

        this.tweens.add({
            targets: this.uiContainer,
            scale: 0,
            duration: 400,
            ease: 'Back.easeIn',
            delay: 400, 
            onComplete: () => {
                this.gameplay.applySkill(this.selectedSkillId); 
                
                this.scene.stop();
                this.gameplay.scene.resume();
                
                this.gameplay.input.setDefaultCursor('none'); 
                if (this.gameplay.crosshair) this.gameplay.crosshair.setVisible(true);
            }
        });
    }
}