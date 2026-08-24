export default class PC extends Phaser.Scene {
    constructor() {
        super('PCScene');
    }

    init(data) {
        this.parentSceneKey = data?.parentSceneKey || 'GameplayScene';
        this.activeWindows = [];

        // กำหนดขนาดหน้าจอมอนิเตอร์ PC ที่ย่อลงเพื่อให้เห็นบรรยากาศด้านหลัง
        this.monW = 920;
        this.monH = 518;
    }

    preload() {
        this.load.spritesheet('pc_startup', 'sprite/pc_startup.png', { frameWidth: 1281, frameHeight: 721 });
        this.load.image('pc_wallpaper', 'assets/093.png');
        this.load.spritesheet('pc_icons', 'sprite/WinIcons_48.png', { frameWidth: 48, frameHeight: 48 });

        // Assets รูปภาพ 3 ไฟล์
        this.load.image('asset2_img1', 'assets_2/img1.jpg');
        this.load.image('asset2_img2', 'assets_2/img2.jpg');
        this.load.image('asset2_img3', 'assets_2/img3.png');
    }

    create() {
        this.activeWindows = [];

        const cx = 640;
        const cy = 360;
        const monW = this.monW;
        const monH = this.monH;

        // 1. พื้นหลังโปร่งแสงแบบมืดสลัว (ทำให้มองเห็นฉากห้องแล็บด้านหลัง)
        const backdrop = this.add.rectangle(cx, cy, 1280, 720, 0x000000, 0.72)
            .setInteractive();

        // 2. ออร่าแสงเรืองรอบหน้าจอมอนิเตอร์
        const aura = this.add.graphics();
        aura.lineStyle(6, 0x00d4ff, 0.4);
        aura.strokeRoundedRect(cx - (monW / 2) - 8, cy - (monH / 2) - 8, monW + 16, monH + 16, 12);
        aura.lineStyle(16, 0x0088ff, 0.18);
        aura.strokeRoundedRect(cx - (monW / 2) - 12, cy - (monH / 2) - 12, monW + 24, monH + 24, 16);

        this.tweens.add({
            targets: aura,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. กรอบมอนิเตอร์ PC
        const bezel = this.add.graphics();
        bezel.fillStyle(0x14181f, 1);
        bezel.fillRoundedRect(cx - (monW / 2) - 8, cy - (monH / 2) - 8, monW + 16, monH + 16, 8);
        bezel.lineStyle(2, 0x2e3744, 1);
        bezel.strokeRoundedRect(cx - (monW / 2) - 8, cy - (monH / 2) - 8, monW + 16, monH + 16, 8);

        // ไฟ LED แสดงสถานะเครื่อง
        const led = this.add.circle(cx + (monW / 2) - 18, cy + (monH / 2) + 2, 4, 0x00ff88, 1);

        // ปุ่ม Exit บนมุมขวาของมอนิเตอร์
        const exitBtn = this.add.text(cx + (monW / 2) - 8, cy - (monH / 2) - 18, "[ ✕ Exit ]", {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ff6b6b',
            backgroundColor: '#1a1f26',
            padding: { x: 8, y: 3 }
        }).setOrigin(1, 1).setDepth(30000).setInteractive({ useHandCursor: true });

        exitBtn.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.closePC();
        });

        // ข้อความคำแนะนำ
        const hintText = this.add.text(cx, cy + (monH / 2) + 24, "คลิกเพื่อข้าม | คลิกพื้นที่ด้านนอก หรือกด [ ✕ Exit ] / ESC เพื่อปิด", {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#8ab4f8'
        }).setOrigin(0.5).setDepth(30000);

        // 4. แอนิเมชันเปิดเครื่อง PC (17 เฟรม / ~7 วินาที)
        if (!this.anims.exists('anim_pc_startup')) {
            this.anims.create({
                key: 'anim_pc_startup',
                frames: this.anims.generateFrameNumbers('pc_startup', { start: 0, end: 16 }),
                frameRate: 2.43,
                repeat: 0
            });
        }

        const startupSprite = this.add.sprite(cx, cy, 'pc_startup', 0)
            .setDisplaySize(monW, monH);

        let isStartupFinished = false;
        const finishStartup = () => {
            if (isStartupFinished) return;
            isStartupFinished = true;

            this.input.off('pointerdown', handleSkip);
            this.input.keyboard.off('keydown', handleSkip);

            startupSprite.anims.stop();
            startupSprite.setVisible(false);
            hintText.setText("คลิกพื้นที่ด้านนอก หรือกด [ ✕ Exit ] / ESC เพื่อปิด");

            this.showDesktop(cx, cy, monW, monH);
        };

        const handleSkip = () => {
            if (!isStartupFinished) {
                finishStartup();
            }
        };

        startupSprite.anims.play('anim_pc_startup');
        startupSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finishStartup);

        // ดักจับคลิกหรือกดปุ่มเพื่อข้าม Startup ทันที
        this.time.delayedCall(80, () => {
            if (!isStartupFinished) {
                this.input.on('pointerdown', handleSkip);
                this.input.keyboard.once('keydown', handleSkip);
            }
        });

        // ตรวจจับการคลิกออกนอกจอมอนิเตอร์เพื่อปิด PC เมื่ออยู่หน้า Desktop
        backdrop.on('pointerdown', (pointer) => {
            if (!isStartupFinished) return;

            const left = cx - (monW / 2) - 8;
            const right = cx + (monW / 2) + 8;
            const top = cy - (monH / 2) - 8;
            const bottom = cy + (monH / 2) + 8;

            if (pointer.x < left || pointer.x > right || pointer.y < top || pointer.y > bottom) {
                this.closePC();
            }
        });

        // รองรับปุ่ม ESC เพื่อปิด PC
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.once('down', () => {
            this.closePC();
        });
    }

    /**
     * แสดงหน้าจอ Desktop พร้อม Wallpaper 093.png และไอคอน WinIcons_48.png ตามพิกัด JSON ดั้งเดิม
     */
    showDesktop(cx, cy, monW, monH) {
        // 1. Wallpaper 093.png
        this.add.image(cx, cy, 'pc_wallpaper').setDisplaySize(monW, monH);

        // 2. คำนวณ Scale และ Offset ให้ไอคอนเรียงตรงตาม Grid Base 48x48
        const scale = monW / (26 * 48); // สเกลของไอคอนบนหน้าจอมอนิเตอร์
        const screenLeft = cx - (monW / 2);
        const screenTop = cy - (monH / 2);

        const getTileX = (gx) => screenLeft + ((gx + 13) * 48 * scale) + (24 * scale);
        const getTileY = (gy) => screenTop + ((gy + 7) * 48 * scale) + (24 * scale);

        // รายการไอคอนทั้งหมดตามพิกัดและ Frame ID ใน WinIcons_48.png จาก pc_scene.json
        const iconList = [
            // ไอคอน 210 (Key / Security Passcode)
            { gx: -11, gy: -4, frame: 210, action: 'passcode' },

            // ไอคอน 199 (Folders)
            { gx: -11, gy: -2, frame: 199, action: 'toast', text: 'ไม่มีอะไรน่าสนใจ' },
            { gx: -9,  gy: -2, frame: 199, action: 'toast', text: 'ไม่มีอะไรน่าสนใจ' },
            { gx: -11, gy: 0,  frame: 199, action: 'toast', text: 'ไม่มีอะไรน่าสนใจ' },
            { gx: -9,  gy: 0,  frame: 199, action: 'toast', text: 'ไม่มีอะไรน่าสนใจ' },
            { gx: -11, gy: 2,  frame: 199, action: 'toast', text: 'ไม่มีอะไรน่าสนใจ' },

            // ไอคอน 327 (Photo Icons) - ผูกไฟล์รูปภาพ 3 ไฟล์
            { gx: 3, gy: -5, frame: 327, media: { type: 'image', key: 'asset2_img1', title: 'Image Viewer - img1.png' } },
            { gx: 5, gy: -5, frame: 327, media: { type: 'image', key: 'asset2_img2', title: 'Image Viewer - img2.png' } },
            { gx: 5, gy: -3, frame: 327, media: { type: 'image', key: 'asset2_img3', title: 'Image Viewer - img3.png' } },

            // ไอคอน 324 (Video Icons) - ผูกไฟล์วิดีโอ 4 ไฟล์
            { gx: 7, gy: -5, frame: 324, media: { type: 'video', src: 'assets_2/Rickroll (Meme Template).mp4', title: 'Media Player - rickroll.mp4' } },
            { gx: 7, gy: -3, frame: 324, media: { type: 'video', src: 'assets_2/My name is Jeff_720p.mp4', title: 'Media Player - my name is jeff.mp4' } },
            { gx: 9, gy: -5, frame: 324, media: { type: 'video', src: 'assets_2/dog with butterfly on its nose_720p.mp4', title: 'Media Player - dog with butterfly.mp4' } },
            { gx: 9, gy: -3, frame: 324, media: { type: 'video', src: 'assets_2/Free Taco Vine.mp4', title: 'Media Player - free taco.mp4' } },

            // ไอคอน 34 (Document/Folder Icons)
            { gx: -7, gy: 4, frame: 34, action: 'toast', text: 'ไม่มีอะไรน่าสนใจ' },
            { gx: -5, gy: 4, frame: 34, action: 'toast', text: 'ไม่มีอะไรน่าสนใจ' },

            // ไอคอน 226 (Power / Shutdown)
            { gx: -11, gy: 6, frame: 226, action: 'shutdown' },

            // ไอคอน 308 (Trash/Bin)
            { gx: 9, gy: 3, frame: 308, action: 'toast', text: 'ว้าว ถังขยะ' }
        ];

        iconList.forEach(item => {
            const posX = getTileX(item.gx);
            const posY = getTileY(item.gy);

            const iconSprite = this.add.sprite(posX, posY, 'pc_icons', item.frame)
                .setScale(scale)
                .setInteractive({ useHandCursor: true });

            iconSprite.on('pointerover', () => {
                iconSprite.setTint(0x88ccff);
            });
            iconSprite.on('pointerout', () => {
                iconSprite.clearTint();
            });
            iconSprite.on('pointerdown', (pointer, lx, ly, event) => {
                if (event && event.stopPropagation) event.stopPropagation();

                if (item.action === 'passcode') {
                    this.openPasscodeWindow(cx, cy, monW, monH);
                } else if (item.action === 'toast') {
                    this.showToast(item.text, posX, posY);
                } else if (item.action === 'shutdown') {
                    this.closePC();
                } else if (item.media) {
                    if (item.media.type === 'image' || item.media.type === 'video') {
                        this.openMediaWindow(item.media, cx, cy, monW, monH);
                    }
                }
            });
        });

        // เลเยอร์แสงสะท้อนหน้าจอมอนิเตอร์
        const crtOverlay = this.add.graphics();
        crtOverlay.fillStyle(0x00e0ff, 0.02);
        crtOverlay.fillRect(screenLeft, screenTop, monW, monH);
    }

    /**
     * แสดงข้อความ Toast ลอยขึ้นแล้วค่อยๆ จางหายไป
     */
    showToast(text, x, y) {
        if (this.currentToast) {
            this.currentToast.destroy();
            this.currentToast = null;
        }

        const toastText = this.add.text(x, y - 20, text, {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#f8fafc',
            backgroundColor: '#0f172a',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5, 0.5).setDepth(35000);

        this.currentToast = toastText;

        this.tweens.add({
            targets: toastText,
            y: y - 45,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: () => {
                if (this.currentToast === toastText) {
                    toastText.destroy();
                    this.currentToast = null;
                }
            }
        });
    }

    /**
     * ปิดหน้าต่างที่กำลังเปิดอยู่ทั้งหมด (จำกัดให้เปิดได้ทีละ 1 หน้าต่างเท่านั้น)
     */
    closeAllActiveWindows() {
        if (!this.activeWindows) return;
        const list = [...this.activeWindows];
        list.forEach(w => this.closeMediaWindow(w));
        this.activeWindows = [];
    }

    /**
     * เปิดหน้าต่างแสดงรหัสผ่านทางออกฉุกเฉิน (Icon 210)
     */
    openPasscodeWindow(cx, cy, monW, monH) {
        this.closeAllActiveWindows();

        // บันทึกสถานะว่าผู้เล่นค้นพบรหัสผ่านแล้ว
        this.game.registry.set('hasDiscoveredPasscode', true);
        const passcode = this.game.registry.get('exitPasscode') || '8492';

        // อัปเดตเควสต์ที่ 11 ให้สำเร็จ และกลับไปที่เควสต์ที่ 3: ออกจากที่นี่
        const gameplayScene = this.scene.get('GameplayScene');
        if (gameplayScene && gameplayScene.quest) {
            if (gameplayScene.quest.currentQuest && gameplayScene.quest.currentQuest.id === 11) {
                gameplayScene.quest.completeQuest(11, true);
                gameplayScene.quest.addQuest(3, 'ออกจากที่นี่', { type: 'tile', x: 160, y: 42 });
            }
        }

        const screenLeft = (cx || 640) - ((monW || this.monW) / 2);
        const screenTop = (cy || 360) - ((monH || this.monH) / 2);
        const monRight = (cx || 640) + ((monW || this.monH) / 2);
        const monBottom = (cy || 360) + ((monH || this.monH) / 2);

        const winW = 440;
        const winH = 260;
        let winX = screenLeft + (monW - winW) / 2;
        let winY = screenTop + (monH - winH) / 2;

        const win = this.add.container(winX, winY).setDepth(25000);
        win.winW = winW;
        win.winH = winH;

        // 1. กราฟิกกรอบหน้าต่าง Retro Windows
        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(0x0f172a, 0.96);
        bgGfx.fillRoundedRect(0, 0, winW, winH, 4);
        bgGfx.lineStyle(1.5, 0x38bdf8, 1);
        bgGfx.strokeRoundedRect(0, 0, winW, winH, 4);

        // แถบ Title Bar
        bgGfx.fillStyle(0x1e293b, 1);
        bgGfx.fillRect(1, 1, winW - 2, 26);

        const titleText = this.add.text(10, 6, "DNPB Security Protocol - Main Exit Key", {
            fontSize: '11px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#38bdf8'
        });

        // Title Bar Drag (เว้นระยะขวาไม่ให้บังปุ่ม [X])
        const titleBarZone = this.add.rectangle((winW - 40) / 2, 13, winW - 40, 26, 0x000000, 0.001)
            .setInteractive({ draggable: true, useHandCursor: true });

        titleBarZone.on('drag', (pointer, dragX, dragY) => {
            win.x = Phaser.Math.Clamp(win.x + (dragX - (winW - 40) / 2), screenLeft + 4, monRight - winW - 4);
            win.y = Phaser.Math.Clamp(win.y + (dragY - 13), screenTop + 4, monBottom - winH - 4);
        });

        // 2. ปุ่มปิด [X] (วางหลัง TitleBar เพื่อให้รับคลิกได้ 100%)
        const closeBtn = this.add.text(winW - 24, 4, "✕", {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#d13438',
            padding: { x: 6, y: 2 }
        }).setInteractive({ useHandCursor: true }).setDepth(10);

        closeBtn.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.closeMediaWindow(win);
        });

        // 3. เนื้อหาภายในหน้าต่าง
        const headerText = this.add.text(winW / 2, 48, "FACILITY EMERGENCY SECURITY OVERRIDE", {
            fontFamily: 'monospace',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#94a3b8'
        }).setOrigin(0.5, 0);

        const descText = this.add.text(winW / 2, 74, "รหัสผ่านปลดล็อกประตูทางออกฉุกเฉิน:", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '14px',
            color: '#cbd5e1'
        }).setOrigin(0.5, 0);

        // กล่องแสดงรหัสผ่านขนาดใหญ่
        const codeBox = this.add.graphics();
        codeBox.fillStyle(0x1e293b, 1);
        codeBox.fillRoundedRect(winW / 2 - 110, 108, 220, 56, 6);
        codeBox.lineStyle(2, 0x38bdf8, 1);
        codeBox.strokeRoundedRect(winW / 2 - 110, 108, 220, 56, 6);

        const codeText = this.add.text(winW / 2, 136, passcode, {
            fontFamily: 'monospace, "Courier New"',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#38bdf8',
            letterSpacing: 10
        }).setOrigin(0.5, 0.5);

        const noteText = this.add.text(winW / 2, 195, "✓ บันทึกรหัสผ่านลงในหน้าต่างภารกิจ (Quest) แล้ว", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '13px',
            color: '#4ade80'
        }).setOrigin(0.5, 0);

        win.add([bgGfx, titleText, titleBarZone, closeBtn, headerText, descText, codeBox, codeText, noteText]);
        this.activeWindows.push(win);
    }

    /**
     * คำนวณตำแหน่งจริงของ HTML5 Video Element ให้ตรงกับ Retro Window
     */
    updateVideoPosition(win) {
        if (!win || !win.videoElement) return;

        const canvas = this.game.canvas;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / 1280;
        const scaleY = rect.height / 720;

        const contentTop = 26;
        const contentLeft = 4;
        const contentW = win.winW - 8;
        const contentH = win.winH - contentTop - 4;

        const actualX = rect.left + (win.x + contentLeft) * scaleX;
        const actualY = rect.top + (win.y + contentTop) * scaleY;
        const actualW = contentW * scaleX;
        const actualH = contentH * scaleY;

        win.videoElement.style.left = `${actualX}px`;
        win.videoElement.style.top = `${actualY}px`;
        win.videoElement.style.width = `${actualW}px`;
        win.videoElement.style.height = `${actualH}px`;
    }

    /**
     * เปิดหน้าต่าง Image Viewer หรือ Video Player แบบ Retro Draggable/Resizable (จำกัด 1 หน้าต่างพร้อมกัน)
     */
    openMediaWindow(mediaConfig, cx, cy, monW, monH) {
        this.closeAllActiveWindows();
        if (!this.activeWindows) this.activeWindows = [];

        const screenLeft = (cx || 640) - ((monW || this.monW) / 2);
        const screenTop = (cy || 360) - ((monH || this.monH) / 2);
        const monRight = (cx || 640) + ((monW || this.monH) / 2);
        const monBottom = (cy || 360) + ((monH || this.monH) / 2);

        let winW = mediaConfig.type === 'video' ? 440 : 380;
        let winH = mediaConfig.type === 'video' ? 330 : 280;

        const cascade = (this.activeWindows.length * 25) % 100;
        let winX = screenLeft + 60 + cascade;
        let winY = screenTop + 40 + cascade;

        winX = Phaser.Math.Clamp(winX, screenLeft + 4, monRight - winW - 4);
        winY = Phaser.Math.Clamp(winY, screenTop + 4, monBottom - winH - 4);

        const win = this.add.container(winX, winY).setDepth(20000 + this.activeWindows.length);
        win.winW = winW;
        win.winH = winH;
        win.mediaConfig = mediaConfig;

        // 1. กราฟิกกรอบหน้าต่าง Retro Windows
        const bgGfx = this.add.graphics();
        const titleText = this.add.text(10, 5, mediaConfig.title, {
            fontSize: '11px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        });

        // 2. ปุ่มปิด [X]
        const closeBtn = this.add.text(winW - 20, 4, "✕", {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#d13438',
            padding: { x: 5, y: 1 }
        }).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.closeMediaWindow(win);
        });

        // 3. Title Bar สำหรับลากย้ายหน้าต่าง (Draggable)
        const titleBarZone = this.add.rectangle(winW / 2, 13, winW, 26, 0x000000, 0.001)
            .setInteractive({ draggable: true, useHandCursor: true });

        titleBarZone.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.bringWindowToFront(win);
            win.dragStartX = pointer.x - win.x;
            win.dragStartY = pointer.y - win.y;
        });

        titleBarZone.on('drag', (pointer) => {
            win.x = Phaser.Math.Clamp(pointer.x - win.dragStartX, screenLeft + 2, monRight - win.winW - 2);
            win.y = Phaser.Math.Clamp(pointer.y - win.dragStartY, screenTop + 2, monBottom - win.winH - 2);
            this.updateVideoPosition(win);
        });

        // 4. ปุ่มจับมุมขวาล่างสำหรับย่อ/ขยาย (Resizable)
        const resizeHandle = this.add.text(winW - 16, winH - 16, "⋰", {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#555555'
        }).setInteractive({ draggable: true, useHandCursor: true });

        resizeHandle.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.bringWindowToFront(win);
            win.resizeStartW = win.winW;
            win.resizeStartH = win.winH;
            win.resizePointerX = pointer.x;
            win.resizePointerY = pointer.y;
        });

        resizeHandle.on('drag', (pointer) => {
            const newW = Phaser.Math.Clamp(win.resizeStartW + (pointer.x - win.resizePointerX), 240, monRight - win.x - 4);
            const newH = Phaser.Math.Clamp(win.resizeStartH + (pointer.y - win.resizePointerY), 180, monBottom - win.y - 4);
            win.winW = newW;
            win.winH = newH;
            redraw(newW, newH);
            this.updateVideoPosition(win);
        });

        // 5. คอนเทนต์แสดงผล (รูปภาพ หรือ วิดีโอ HTML5)
        let imageSprite = null;
        let videoElement = null;

        if (mediaConfig.type === 'image') {
            imageSprite = this.add.image(winW / 2, 26 + (winH - 32) / 2, mediaConfig.key)
                .setOrigin(0.5, 0.5);
            win.add([bgGfx, imageSprite, titleBarZone, titleText, closeBtn, resizeHandle]);
        } else if (mediaConfig.type === 'video') {
            // สร้าง Native HTML5 Video Element แสดงผลวิดีโอ 100% เล่นได้แน่นอน
            videoElement = document.createElement('video');
            videoElement.src = mediaConfig.src;
            videoElement.controls = true;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.style.position = 'fixed';
            videoElement.style.zIndex = '999999';
            videoElement.style.backgroundColor = '#000000';
            videoElement.style.objectFit = 'contain';
            videoElement.style.borderRadius = '2px';

            document.body.appendChild(videoElement);
            win.videoElement = videoElement;

            videoElement.play().catch(() => {
                videoElement.muted = true;
                videoElement.play();
            });

            videoElement.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.bringWindowToFront(win);
            });

            win.add([bgGfx, titleBarZone, titleText, closeBtn, resizeHandle]);
        }

        // ฟังก์ชันวาดกราฟิกหน้าต่าง
        const redraw = (w, h) => {
            bgGfx.clear();

            // พื้นหลังและขอบหน้าต่าง
            bgGfx.fillStyle(0xece9d8, 1);
            bgGfx.fillRect(0, 0, w, h);
            bgGfx.lineStyle(1, 0xffffff, 1);
            bgGfx.strokeRect(0, 0, w, h);
            bgGfx.lineStyle(1, 0x707070, 1);
            bgGfx.strokeRect(1, 1, w - 2, h - 2);

            // Title Bar
            bgGfx.fillStyle(0x0a246a, 1);
            bgGfx.fillRect(3, 3, w - 6, 22);

            // ปรับตำแหน่งปุ่ม
            titleBarZone.setPosition(w / 2, 13);
            titleBarZone.setSize(w, 26);
            closeBtn.setPosition(w - 20, 4);
            resizeHandle.setPosition(w - 16, h - 16);

            // พื้นที่แสดงผล
            const contentTop = 26;
            const contentW = w - 8;
            const contentH = h - contentTop - 4;

            bgGfx.fillStyle(0x000000, 1);
            bgGfx.fillRect(4, contentTop, contentW, contentH);

            if (imageSprite) {
                const imgScale = Math.min(contentW / imageSprite.width, contentH / imageSprite.height);
                imageSprite.setScale(imgScale);
                imageSprite.setPosition(4 + contentW / 2, contentTop + contentH / 2);
            }
        };

        win.redraw = redraw;
        redraw(winW, winH);
        this.updateVideoPosition(win);

        // คลิกส่วนใดของหน้าต่างจะนำขึ้นมาด้านบน
        const winHit = this.add.rectangle(winW / 2, winH / 2, winW, winH, 0x000000, 0.001)
            .setInteractive();
        winHit.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.bringWindowToFront(win);
        });
        win.addAt(winHit, 0);

        this.activeWindows.push(win);
        this.bringWindowToFront(win);
    }

    bringWindowToFront(win) {
        if (!win) return;
        this.children.bringToTop(win);

        if (this.activeWindows) {
            this.activeWindows.forEach(w => {
                if (w.videoElement) {
                    w.videoElement.style.zIndex = (w === win) ? '1000000' : '999998';
                }
            });
        }
    }

    closeMediaWindow(win) {
        if (!win) return;

        if (win.videoElement) {
            try {
                win.videoElement.pause();
                win.videoElement.src = '';
                win.videoElement.remove();
            } catch (e) {}
            win.videoElement = null;
        }

        if (this.activeWindows) {
            this.activeWindows.forEach((w, idx) => {
                if (w === win) {
                    this.activeWindows.splice(idx, 1);
                }
            });
        }

        win.destroy();
    }

    /**
     * ปิด PC Scene และกลับสู่เกมหลัก
     */
    closePC() {
        if (this.activeWindows) {
            this.activeWindows.forEach(win => {
                if (win.videoElement) {
                    try {
                        win.videoElement.pause();
                        win.videoElement.src = '';
                        win.videoElement.remove();
                    } catch (e) {}
                    win.videoElement = null;
                }
            });
            this.activeWindows = [];
        }

        const parentScene = this.scene.get(this.parentSceneKey);
        if (parentScene && parentScene.interactions) {
            parentScene.interactions.unlock();
        }

        this.scene.stop();
    }
}
