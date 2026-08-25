export default class MapScene extends Phaser.Scene {
    constructor() {
        super('MapScene');
    }

    init(data) {
        this.parentSceneKey = data?.parentSceneKey || 'GameplayScene';
        this.isHolding = false;
    }

    preload() {
        this.load.image('game_map_img', 'assets/map.png');
    }

    create() {
        const cx = 640;
        const cy = 360;

        // 1. ล็อกการเคลื่อนที่และการโต้ตอบในฉากหลัก
        const parentScene = this.scene.get(this.parentSceneKey);
        if (parentScene && parentScene.interactions) {
            parentScene.interactions.lock();
        }

        // 2. พื้นหลังมืดมิดและเบลอฉากหลัง (Dimmed & Blurred effect)
        const backdrop = this.add.rectangle(cx, cy, 1280, 720, 0x000000, 0.78)
            .setInteractive();

        // 3. รูปภาพแผนที่ (Map Image)
        const mapImg = this.add.image(cx, cy, 'game_map_img')
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });

        // คำนวณ Base Scale ให้แผนที่พอดีกับหน้าจออย่างสวยงาม
        const maxDisplayW = 980;
        const maxDisplayH = 580;
        const baseScale = Math.min(maxDisplayW / mapImg.width, maxDisplayH / mapImg.height, 0.95);
        mapImg.setScale(baseScale);
        mapImg.baseScale = baseScale;
        mapImg.targetScale = baseScale;
        mapImg.targetX = cx;
        mapImg.targetY = cy;

        // กรอบแสงเรืองรอบแผนที่
        const mapBorder = this.add.graphics();
        const updateBorder = () => {
            mapBorder.clear();
            const w = mapImg.displayWidth;
            const h = mapImg.displayHeight;
            const x = mapImg.x - w / 2;
            const y = mapImg.y - h / 2;

            mapBorder.lineStyle(4, 0x00d4ff, 0.6);
            mapBorder.strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, 6);
            mapBorder.lineStyle(10, 0x0088ff, 0.2);
            mapBorder.strokeRoundedRect(x - 6, y - 6, w + 12, h + 12, 10);
        };
        updateBorder();

        // 4. ปุ่มปิด [X] ที่มุมขวาบน
        const closeBtn = this.add.text(1240, 24, "[ ✕ Close ]", {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#ff6b6b',
            backgroundColor: '#1a1f26',
            padding: { x: 10, y: 6 }
        }).setOrigin(1, 0).setDepth(30000).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => {
            closeBtn.setBackgroundColor('#d13438');
            closeBtn.setColor('#ffffff');
        });
        closeBtn.on('pointerout', () => {
            closeBtn.setBackgroundColor('#1a1f26');
            closeBtn.setColor('#ff6b6b');
        });
        closeBtn.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            if (this.scene.get('GameplayScene') && typeof this.scene.get('GameplayScene').playButtonClickSound === 'function') {
                this.scene.get('GameplayScene').playButtonClickSound();
            }
            this.closeMap();
        });

        // ข้อความแนะนำการใช้งาน
        const hintText = this.add.text(cx, 695, "กดค้างที่แผนที่เพื่อซูมขยายและเลื่อนตามเมาส์ | ปล่อยคลิกเพื่อกลับสู่ขนาดปกติ | กด [ ✕ ] หรือ ESC เพื่อปิด", {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#a0c8f0',
            backgroundColor: '#0c121d',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5).setDepth(30000);

        // 5. ระบบซูมและเลื่อนตาม Cursor เมื่อคลิกค้าง (Click & Hold to Zoom and Move)
        const zoomFactor = 2.2;
        const targetZoomScale = baseScale * zoomFactor;

        this.isHolding = false;
        this.currentScale = baseScale;
        this.mapImg = mapImg;
        this.updateBorder = updateBorder;

        mapImg.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.isHolding = true;

            // คำนวณจุดกึ่งกลางการซูมให้เลื่อนตามตำแหน่ง Cursor
            this.updateTargetPosition(pointer.x, pointer.y, cx, cy, baseScale, targetZoomScale);

            // Tween ซูมเข้าอย่างนุ่มนวล
            this.tweens.killTweensOf(this);
            this.tweens.add({
                targets: this,
                currentScale: targetZoomScale,
                duration: 250,
                ease: 'Cubic.easeOut',
                onUpdate: () => {
                    mapImg.setScale(this.currentScale);
                    updateBorder();
                }
            });
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isHolding) {
                this.updateTargetPosition(pointer.x, pointer.y, cx, cy, baseScale, targetZoomScale);
            }
        });

        const releaseHold = () => {
            if (!this.isHolding) return;
            this.isHolding = false;

            // คืนค่าตำแหน่งและขนาดเดิมอย่างนุ่มนวล
            this.tweens.killTweensOf(this);
            this.tweens.add({
                targets: this,
                currentScale: baseScale,
                duration: 250,
                ease: 'Cubic.easeOut',
                onUpdate: () => {
                    mapImg.setScale(this.currentScale);
                    updateBorder();
                }
            });

            this.tweens.add({
                targets: mapImg,
                x: cx,
                y: cy,
                duration: 250,
                ease: 'Cubic.easeOut',
                onUpdate: () => {
                    updateBorder();
                }
            });
        };

        this.input.on('pointerup', releaseHold);
        mapImg.on('pointerupoutside', releaseHold);

        // คลิกพื้นที่สีดำด้านนอกเพื่อปิดแผนที่
        backdrop.on('pointerdown', (pointer) => {
            if (this.isHolding) return;
            const w = mapImg.displayWidth;
            const h = mapImg.displayHeight;
            const left = mapImg.x - w / 2;
            const right = mapImg.x + w / 2;
            const top = mapImg.y - h / 2;
            const bottom = mapImg.y + h / 2;

            if (pointer.x < left || pointer.x > right || pointer.y < top || pointer.y > bottom) {
                this.closeMap();
            }
        });

        // รองรับปุ่ม ESC และปุ่ม M เพื่อปิด
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.once('down', () => {
            this.closeMap();
        });

        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this.mKey.once('down', () => {
            this.closeMap();
        });

        // Effect Fade in เมื่อเปิดแผนที่
        this.cameras.main.fadeIn(200, 0, 0, 0);
    }

    /**
     * คำนวณตำแหน่ง Pan ของแผนที่ตามเคอร์เซอร์เมื่อกำลังซูมขยาย
     */
    updateTargetPosition(pointerX, pointerY, cx, cy, baseScale, zoomScale) {
        const panRatio = 1.3;
        const offsetX = (cx - pointerX) * panRatio;
        const offsetY = (cy - pointerY) * panRatio;

        const maxPanX = (this.mapImg.width * zoomScale - 1200) / 2;
        const maxPanY = (this.mapImg.height * zoomScale - 650) / 2;

        const targetX = Phaser.Math.Clamp(cx + offsetX, cx - Math.max(0, maxPanX), cx + Math.max(0, maxPanX));
        const targetY = Phaser.Math.Clamp(cy + offsetY, cy - Math.max(0, maxPanY), cy + Math.max(0, maxPanY));

        this.tweens.add({
            targets: this.mapImg,
            x: targetX,
            y: targetY,
            duration: 100,
            ease: 'Linear',
            onUpdate: () => {
                if (this.updateBorder) this.updateBorder();
            }
        });
    }

    /**
     * ปิด Map Scene และปลดล็อกการควบคุมใน GameplayScene
     */
    closeMap() {
        const parentScene = this.scene.get(this.parentSceneKey);
        if (parentScene && parentScene.interactions) {
            parentScene.interactions.unlock();
        }

        this.cameras.main.fadeOut(150, 0, 0, 0);
        this.time.delayedCall(150, () => {
            this.scene.stop();
        });
    }
}
