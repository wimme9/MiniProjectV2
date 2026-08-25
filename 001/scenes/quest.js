export default class QuestManager {
    constructor(scene) {
        this.scene = scene;
        this.currentQuest = null;
        this.completedQuests = [];
        this.isDirectionActive = false;
        this.arrow = null;
        this.questWindow = null;
        this.notificationStack = [];
        this.hudIcon = null;
        this.glowTween = null;
        this.baseIconScale = 1;
        this.windowPointerHandler = null;

        // โหลดเควสต์เริ่มต้น (Quest #1)
        this.initDefaultQuest();
    }

    /**
     * โหลด Assets ที่เกี่ยวข้องกับระบบ Quest
     */
    static preload(scene) {
        scene.load.image('quest_icon_img', 'assets/quest_icon.png');
    }

    initDefaultQuest() {
        this.currentQuest = {
            id: 1,
            title: 'หลบหนีผ่านช่องระบายอากาศ',
            objective: {
                type: 'tile',
                x: 34,
                y: 19
            },
            status: 'current'
        };
    }

    /**
     * สร้าง HUD Icon ที่มุมขวาล่าง
     */
    createHUD(camZoom = 1.5) {
        const cx = 640;
        const cy = 360;

        // วางไว้เหนือ Map Icon
        const hudX = cx + (cx - 36) / camZoom;
        const hudY = cy + (cy - 92) / camZoom;
        this.baseIconScale = (44 / 512) / camZoom;

        this.hudIcon = this.scene.add.image(hudX, hudY, 'quest_icon_img')
            .setScale(this.baseIconScale)
            .setScrollFactor(0)
            .setDepth(15000)
            .setInteractive({ useHandCursor: true });

        this.hudIcon.on('pointerover', () => {
            if (!this.glowTween) {
                this.hudIcon.setScale(this.baseIconScale * 1.15);
                this.hudIcon.setTint(0xffe066);
            }
        });
        this.hudIcon.on('pointerout', () => {
            if (!this.glowTween) {
                this.hudIcon.setScale(this.baseIconScale);
                this.hudIcon.clearTint();
            }
        });
        this.hudIcon.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.stopGlowingHUD();
            this.toggleQuestWindow();
        });

        // คีย์ลัด Q สำหรับเปิด/ปิดหน้าต่างเควสต์
        this.scene.input.keyboard.on('keydown-Q', () => {
            this.stopGlowingHUD();
            this.toggleQuestWindow();
        });
    }

    /**
     * เริ่มการกระพริบเรืองแสงแจ้งเตือนผู้เล่นบน Quest Icon
     */
    startGlowingHUD() {
        if (!this.hudIcon || this.glowTween) return;

        this.hudIcon.setTint(0xffcc00);
        this.glowTween = this.scene.tweens.add({
            targets: this.hudIcon,
            scale: this.baseIconScale * 1.25,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * หยุดการกระพริบเรืองแสงเมื่อผู้เล่นคลิกเปิดดูเควสต์
     */
    stopGlowingHUD() {
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = null;
            if (this.hudIcon) {
                this.hudIcon.setScale(this.baseIconScale);
                this.hudIcon.clearTint();
            }
        }
    }

    /**
     * เพิ่มเควสต์ใหม่และแสดงแถบ Notification แจ้งเตือนทันที
     */
    addQuest(id, title, objective = null, description = '') {
        this.currentQuest = {
            id: id,
            title: title,
            description: description,
            objective: objective || { type: 'none' },
            status: 'current'
        };

        this.showNotification(this.currentQuest, false);
        this.startGlowingHUD();
    }

    /**
     * ทำเควสต์ให้เสร็จสิ้น พร้อมแสดง Notification "ภารกิจสำเร็จ!"
     */
    completeQuest(id, showCompletePopup = true) {
        if (this.currentQuest && this.currentQuest.id === id) {
            const completed = { ...this.currentQuest, status: 'completed' };
            this.completedQuests.push(completed);
            this.currentQuest = null;

            this.hideDirection();

            if (showCompletePopup) {
                this.showNotification(completed, true);
            }
        }
    }

    /**
     * แสดงแผ่นกระดาษแจ้งเตือนเควสต์แบบวางซ้อนเป็นชั้น (Stackable Notification Banner)
     * เมื่อมีทั้งเควสต์สำเร็จและเควสต์ใหม่เกิดขึ้นพร้อมกัน:
     * - เควสต์ที่สำเร็จจะอยู่ด้านบน
     * - เควสต์ใหม่จะอยู่ต่อลงมาด้านล่าง
     */
    showNotification(quest, isCompleted = false) {
        if (!quest) return;

        const headerTitle = isCompleted ? "◆ ภารกิจสำเร็จ! ◆" : "◆ ภารกิจใหม่ ◆";
        const headerColor = isCompleted ? "#2e7d32" : "#d32f2f";
        const tagColor = isCompleted ? 0x2e7d32 : 0x000000;
        const titleStr = `ภารกิจที่ ${quest.id}: ${quest.title}`;

        if (isCompleted) {
            this.playQuestCompletedSound();
        } else {
            this.playQuestAddedSound();
        }

        this.spawnBanner(headerTitle, headerColor, tagColor, titleStr, 4500, false);
    }

    /**
     * เสียงกังวานแจ้งเตือนเมื่อได้รับเควสต์ใหม่ (Web Audio Chime: D5 -> A5)
     */
    playQuestAddedSound() {
        try {
            if (this.scene && this.scene.sound && this.scene.sound.mute) return;
            const ctx = this.scene && this.scene.sound ? this.scene.sound.context : null;
            if (!ctx || ctx.state !== 'running') return;

            const now = ctx.currentTime;
            const notes = [587.33, 880.0];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.08);

                gain.gain.setValueAtTime(0, now + i * 0.08);
                gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.28);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.30);
            });
        } catch (e) {}
    }

    /**
     * เสียงเฉลิมฉลองเมื่อทำเควสต์สำเร็จ (Web Audio Fanfare Chime: C5 -> E5 -> G5 -> C6)
     */
    playQuestCompletedSound() {
        try {
            if (this.scene && this.scene.sound && this.scene.sound.mute) return;
            const ctx = this.scene && this.scene.sound ? this.scene.sound.context : null;
            if (!ctx || ctx.state !== 'running') return;

            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.07);

                gain.gain.setValueAtTime(0, now + i * 0.07);
                gain.gain.linearRampToValueAtTime(0.20, now + i * 0.07 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.07);
                osc.stop(now + i * 0.07 + 0.38);
            });
        } catch (e) {}
    }

    /**
     * แสดงแถบแจ้งเตือนรหัสความปลอดภัยจากสูตรโกง (Cheat Code)
     */
    showSecurityCodeBanner(code) {
        if (!code) return;

        const headerTitle = "◆ SECURITY CODE FOUND ◆";
        const headerColor = "#e65100";
        const tagColor = 0xffaa00;
        const titleStr = `PASSCODE : ${code}`;

        this.spawnBanner(headerTitle, headerColor, tagColor, titleStr, 5500, true);
    }

    /**
     * ตัวสร้างแผ่นกระดาษแจ้งเตือนและจัดเรียง Stackable Banners
     */
    spawnBanner(headerTitle, headerColor, tagColor, contentText, duration = 4500, isMono = false) {
        const cx = 640;
        const cy = 360;
        const camZoom = this.scene.cameras.main.zoom || 1.5;
        const bannerW = 340;
        const bannerH = 76;
        const bannerStep = 86; // ระยะห่างแนวตั้งระหว่างแต่ละแถบการแจ้งเตือน

        const slotIndex = this.notificationStack.length;
        const baseY = cy - (cy - 36) / camZoom;
        const targetScreenY = baseY + (slotIndex * bannerStep) / camZoom;
        const targetScreenX = cx - (cx - 24) / camZoom;
        const offScreenX = cx - (cx + bannerW + 40) / camZoom;

        const container = this.scene.add.container(offScreenX, targetScreenY)
            .setScrollFactor(0)
            .setDepth(25000 + slotIndex)
            .setScale(1 / camZoom);

        // 1. กราฟิกแผ่นกระดาษแทรก
        const paperGfx = this.scene.add.graphics();
        paperGfx.fillStyle(0x000000, 0.35);
        paperGfx.fillRect(4, 4, bannerW, bannerH);
        paperGfx.fillStyle(0xffffff, 1);
        paperGfx.fillRect(0, 0, bannerW, bannerH);
        paperGfx.lineStyle(2.5, 0x000000, 1);
        paperGfx.strokeRect(0, 0, bannerW, bannerH);

        // แถบแท็กด้านซ้าย
        paperGfx.fillStyle(tagColor, 1);
        paperGfx.fillRect(0, 0, 8, bannerH);

        // 2. ข้อความหัวเรื่อง
        const headerText = this.scene.add.text(20, 8, headerTitle, {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: headerColor,
            padding: { top: 8, bottom: 8, left: 4, right: 4 },
            resolution: 4
        });
        if (headerText.texture) headerText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        // 3. ข้อความเนื้อหา
        const bodyText = this.scene.add.text(20, 32, contentText, {
            fontFamily: isMono ? 'monospace' : '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: isMono ? '20px' : '15px',
            fontStyle: 'bold',
            color: '#000000',
            letterSpacing: isMono ? 2 : 0,
            padding: { top: 8, bottom: 8, left: 4, right: 4 },
            resolution: 4
        });
        if (bodyText.texture) bodyText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        container.add([paperGfx, headerText, bodyText]);

        const stackItem = {
            container: container,
            offScreenX: offScreenX
        };
        this.notificationStack.push(stackItem);

        // สไลด์แทรกกระดาษเข้ามาจากด้านซ้าย (หากมีหลายการแจ้งเตือน ให้แถบถัดไปสไลด์ตามหลัง 0.5 วินาที)
        const enterDelay = slotIndex * 500;
        this.scene.tweens.add({
            targets: container,
            x: targetScreenX,
            duration: 400,
            delay: enterDelay,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(duration, () => {
                    this.removeBanner(stackItem);
                });
            }
        });
    }

    /**
     * ดึงแถบกระดาษแจ้งเตือนกลับออกไปทางซ้าย และเลื่อนแถบด้านล่างขึ้นมาแทนที่
     */
    removeBanner(stackItem) {
        if (!stackItem || !stackItem.container) return;
        const idx = this.notificationStack.indexOf(stackItem);
        if (idx !== -1) {
            this.notificationStack.splice(idx, 1);
        }

        // สไลด์ออกไปทางซ้ายแล้วลบ Container
        this.scene.tweens.add({
            targets: stackItem.container,
            x: stackItem.offScreenX,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                if (stackItem.container) {
                    stackItem.container.destroy();
                }
            }
        });

        // เลื่อนแถบแจ้งเตือนที่เหลืออยู่ด้านล่างให้สไลด์ขยับขึ้นมาข้างบนอย่างนุ่มนวล
        const cy = 360;
        const camZoom = this.scene.cameras.main.zoom || 1.5;
        const bannerStep = 86;
        const baseY = cy - (cy - 36) / camZoom;

        this.notificationStack.forEach((item, newSlotIdx) => {
            if (item && item.container) {
                const newY = baseY + (newSlotIdx * bannerStep) / camZoom;
                this.scene.tweens.add({
                    targets: item.container,
                    y: newY,
                    duration: 250,
                    ease: 'Cubic.easeOut'
                });
            }
        });
    }

    /**
     * เปิด/ปิดหน้าต่างระบบเควสต์
     */
    toggleQuestWindow() {
        if (this.scene.scene.isActive('QuestScene')) {
            this.closeQuestWindow();
        } else {
            this.openQuestWindow();
        }
    }

    /**
     * เปิดหน้าต่างแสดงรายละเอียดเควสต์
     */
    openQuestWindow() {
        if (this.scene.scene.isActive('QuestScene')) return;

        this.stopGlowingHUD();
        this.scene.scene.launch('QuestScene', {
            parentSceneKey: this.scene.scene.key,
            questManager: this
        });
    }

    /**
     * ปิดหน้าต่างเควสต์
     */
    closeQuestWindow() {
        if (this.scene.scene.isActive('QuestScene')) {
            this.scene.scene.stop('QuestScene');
            if (this.scene && this.scene.interactions) {
                this.scene.interactions.unlock();
            }
        }
    }

    /**
     * สลับเปิด/ปิดลูกศรนำทาง
     */
    toggleDirection() {
        if (this.isDirectionActive) {
            this.hideDirection();
        } else {
            this.showDirection();
        }
    }

    /**
     * แสดงลูกศรนำทางรอบตัวละคร
     */
    showDirection() {
        if (!this.currentQuest || !this.currentQuest.objective) return;
        this.isDirectionActive = true;

        if (!this.arrow) {
            this.createDirectionArrow();
        }
        if (this.arrow) {
            this.arrow.setVisible(true);
            this.arrow.setAlpha(1);
        }
    }

    /**
     * ซ่อนลูกศรนำทาง
     */
    hideDirection() {
        this.isDirectionActive = false;
        if (this.arrow) {
            this.arrow.setVisible(false);
        }
    }

    /**
     * สร้างลูกศรนำทางชี้เป้าหมายแบบกะทัดรัด คมชัด (Procedural Arrow)
     */
    createDirectionArrow() {
        if (this.arrow) return;

        const container = this.scene.add.container(0, 0).setDepth(20000);
        const gfx = this.scene.add.graphics();

        // เงาขอบนอกสีดำ
        gfx.fillStyle(0x000000, 0.6);
        gfx.beginPath();
        gfx.moveTo(22, 0);
        gfx.lineTo(-11, -10);
        gfx.lineTo(-4, 0);
        gfx.lineTo(-11, 10);
        gfx.closePath();
        gfx.fillPath();

        // หัวลูกศรสีฟ้าไซอันเรืองแสง
        gfx.fillStyle(0x00e5ff, 1);
        gfx.beginPath();
        gfx.moveTo(19, 0);
        gfx.lineTo(-9, -8);
        gfx.lineTo(-3, 0);
        gfx.lineTo(-9, 8);
        gfx.closePath();
        gfx.fillPath();

        // แกนกลางสีขาว
        gfx.fillStyle(0xffffff, 1);
        gfx.beginPath();
        gfx.moveTo(14, 0);
        gfx.lineTo(-5, -4);
        gfx.lineTo(-2, 0);
        gfx.lineTo(-5, 4);
        gfx.closePath();
        gfx.fillPath();

        container.add(gfx);
        container.setScale(0.6);
        container.setVisible(false);
        this.arrow = container;

        // แอนิเมชันกระพริบหายใจของแสงลูกศรแบบกะทัดรัด
        this.scene.tweens.add({
            targets: this.arrow,
            scale: 0.7,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * คำนวณพิกัด World X, Y จาก Objective
     */
    getObjectiveWorldPosition() {
        if (!this.currentQuest || !this.currentQuest.objective || this.currentQuest.objective.type === 'none') return null;
        const obj = this.currentQuest.objective;

        if (obj.type === 'tile') {
            return {
                x: obj.x * 32 + 16,
                y: obj.y * 32 + 16
            };
        } else if (obj.type === 'rect') {
            const centerTileX = (obj.minTileX + obj.maxTileX + 1) / 2;
            const centerTileY = (obj.minTileY + obj.maxTileY + 1) / 2;
            return {
                x: centerTileX * 32,
                y: centerTileY * 32
            };
        } else if (obj.type === 'world') {
            return { x: obj.x, y: obj.y };
        }
        return null;
    }

    /**
     * อัปเดตทิศทางและตำแหน่งของลูกศรรอบตัวละครอย่างต่อเนื่อง พร้อมตรวจสอบ Objective Area
     */
    update() {
        if (!this.scene.player) return;

        // ตรวจสอบการเข้าสู่พื้นที่เป้าหมายของเควสต์แบบพื้นที่สี่เหลี่ยม (เช่น Quest #2 จาก (152, 43) ถึง (171, 50))
        if (this.currentQuest && this.currentQuest.id === 2 && this.currentQuest.objective && this.currentQuest.objective.type === 'rect') {
            const pTileX = this.scene.player.x / 32;
            const pTileY = this.scene.player.y / 32;
            const obj = this.currentQuest.objective;

            if (pTileX >= obj.minTileX && pTileX <= (obj.maxTileX + 1) && pTileY >= obj.minTileY && pTileY <= (obj.maxTileY + 1)) {
                if (this.scene.onReachExitArea) {
                    this.scene.onReachExitArea();
                } else {
                    this.completeQuest(2, true);
                    this.addQuest(3, 'ออกจากที่นี่', { type: 'tile', x: 160, y: 42 });
                }
            }
        }

        if (!this.isDirectionActive || !this.arrow) return;

        const player = this.scene.player;
        const targetPos = this.getObjectiveWorldPosition();
        if (!targetPos) return;

        // คำนวณมุมองศาจากตัวละครไปยังเป้าหมาย
        const angle = Phaser.Math.Angle.Between(player.x, player.y, targetPos.x, targetPos.y);

        // ระยะห่างรอบตัวผู้เล่น (54px)
        const orbitRadius = 54;
        const arrowX = player.x + Math.cos(angle) * orbitRadius;
        const arrowY = player.y + Math.sin(angle) * orbitRadius;

        this.arrow.setPosition(arrowX, arrowY);
        this.arrow.setRotation(angle);
    }
}
