export default class QuestScene extends Phaser.Scene {
    constructor() {
        super('QuestScene');
    }

    init(data) {
        this.parentSceneKey = data?.parentSceneKey || 'GameplayScene';
        this.questManager = data?.questManager || null;
    }

    create() {
        const cx = 640;
        const cy = 360;
        const winW = 460;
        const winH = 500;
        const left = cx - winW / 2;
        const top = cy - winH / 2;

        // 1. Freeze ผู้เล่นในฉากหลักขณะเปิดดูหน้าต่างเควสต์
        const parentScene = this.scene.get(this.parentSceneKey);
        if (parentScene && parentScene.interactions) {
            parentScene.interactions.lock();
        }
        if (parentScene && parentScene.player && parentScene.player.body) {
            parentScene.player.setVelocity(0, 0);
            parentScene.player.anims.play('idle', true);
        }

        // 2. แบ็กดรอปมืดกึ่งโปร่งแสง (คลิกพื้นที่ด้านนอกเพื่อปิด)
        const backdrop = this.add.rectangle(cx, cy, 1280, 720, 0x000000, 0.6)
            .setInteractive();

        backdrop.on('pointerdown', () => {
            this.closeQuest();
        });

        // 3. กล่องหน้าต่างเควสต์สีขาว ขอบดำ (ป้องกันการคลิกทะลุ)
        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(0xffffff, 1);
        bgGfx.fillRect(left, top, winW, winH);
        bgGfx.lineStyle(3, 0x000000, 1);
        bgGfx.strokeRect(left, top, winW, winH);

        // เส้นคั่นระหว่าง ภารกิจปัจจุบัน กับ ภารกิจที่สำเร็จแล้ว
        bgGfx.lineStyle(1.5, 0x000000, 1);
        bgGfx.lineBetween(left + 16, top + 214, left + winW - 16, top + 214);

        const winBlocker = this.add.rectangle(cx, cy, winW, winH, 0x000000, 0.001)
            .setInteractive();
        winBlocker.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
        });

        // 4. หัวข้อ "ภารกิจ" (QUEST)
        const titleText = this.add.text(cx, top + 14, "ภารกิจ", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#000000',
            padding: { top: 4, bottom: 4, left: 6, right: 6 },
            resolution: 2
        }).setOrigin(0.5, 0);

        // ปุ่มปิด [ ✕ ] บนขวา
        const closeBtn = this.add.text(left + winW - 36, top + 12, "✕", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#000000',
            padding: { top: 4, bottom: 4, left: 6, right: 6 },
            resolution: 2
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => closeBtn.setColor('#e11d48'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#000000'));
        closeBtn.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            if (this.scene.get('GameplayScene') && typeof this.scene.get('GameplayScene').playButtonClickSound === 'function') {
                this.scene.get('GameplayScene').playButtonClickSound();
            }
            this.closeQuest();
        });

        // 5. ส่วน ภารกิจปัจจุบัน (CURRENT QUEST)
        this.add.text(left + 24, top + 48, "ภารกิจปัจจุบัน", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#000000',
            resolution: 2
        });

        const curQuest = this.questManager ? this.questManager.currentQuest : null;
        let btnY = top + 168;

        if (curQuest) {
            this.add.text(left + 24, top + 74, `ภารกิจที่ ${curQuest.id}: ${curQuest.title}`, {
                fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                fontSize: '15px',
                fontStyle: 'bold',
                color: '#111827',
                wordWrap: { width: 400, useAdvancedWrap: true },
                resolution: 2
            });

            const hasDiscoveredPasscode = this.game.registry.get('hasDiscoveredPasscode');
            if (hasDiscoveredPasscode) {
                const passcode = this.game.registry.get('exitPasscode') || '8492';
                const codeBoxY = top + 104;

                const codeBox = this.add.graphics();
                codeBox.fillStyle(0xffffff, 1);
                codeBox.fillRoundedRect(left + 24, codeBoxY, winW - 48, 42, 4);
                codeBox.lineStyle(1.5, 0x000000, 1);
                codeBox.strokeRoundedRect(left + 24, codeBoxY, winW - 48, 42, 4);

                this.add.text(left + 36, codeBoxY + 6, "PASSCODE / รหัสผ่าน:", {
                    fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                    fontSize: '11px',
                    fontStyle: 'bold',
                    color: '#475569',
                    resolution: 2
                });

                this.add.text(left + winW - 40, codeBoxY + 21, passcode, {
                    fontFamily: 'monospace, "Courier New", Courier',
                    fontSize: '20px',
                    fontStyle: 'bold',
                    color: '#000000',
                    letterSpacing: 6,
                    resolution: 2
                }).setOrigin(1, 0.5);

                btnY = top + 166;
            } else if (curQuest.description) {
                this.add.text(left + 24, top + 102, curQuest.description, {
                    fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                    fontSize: '13px',
                    color: '#475569',
                    wordWrap: { width: 400, useAdvancedWrap: true },
                    lineSpacing: 3,
                    resolution: 2
                });
            }

            // ปุ่ม [ แสดงทิศทาง ] / [ ซ่อนทิศทาง ]
            const hasObjective = curQuest.objective && curQuest.objective.type !== 'none';
            if (hasObjective) {
                const isDirActive = this.questManager ? this.questManager.isDirectionActive : false;
                const btnLabel = isDirActive ? "[ ซ่อนทิศทาง ]" : "[ แสดงทิศทาง ]";

                const navBtnGfx = this.add.graphics();
                const drawNavBtn = (isHover) => {
                    navBtnGfx.clear();
                    navBtnGfx.fillStyle(isHover ? 0xf1f5f9 : 0xffffff, 1);
                    navBtnGfx.fillRoundedRect(cx - 95, btnY, 190, 32, 4);
                    navBtnGfx.lineStyle(1.5, 0x000000, 1);
                    navBtnGfx.strokeRoundedRect(cx - 95, btnY, 190, 32, 4);
                };
                drawNavBtn(false);

                const navBtnText = this.add.text(cx, btnY + 16, btnLabel, {
                    fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                    fontSize: '13px',
                    fontStyle: 'bold',
                    color: '#000000',
                    resolution: 2
                }).setOrigin(0.5, 0.5);

                const navHit = this.add.rectangle(cx, btnY + 16, 190, 32, 0x000000, 0.001)
                    .setInteractive({ useHandCursor: true });

                navHit.on('pointerover', () => drawNavBtn(true));
                navHit.on('pointerout', () => drawNavBtn(false));
                navHit.on('pointerdown', (pointer, lx, ly, event) => {
                    if (event && event.stopPropagation) event.stopPropagation();
                    if (this.questManager) {
                        this.questManager.toggleDirection();
                    }
                    this.closeQuest();
                });
            }
        } else {
            this.add.text(left + 24, top + 90, "ไม่มี", {
                fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                fontSize: '14px',
                color: '#666666',
                resolution: 2
            });
        }

        // 6. ส่วน ภารกิจที่สำเร็จแล้ว (COMPLETED QUESTS) พร้อมระบบ Scroll
        this.add.text(left + 24, top + 224, "ภารกิจที่สำเร็จแล้ว", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#000000',
            resolution: 2
        });

        const completedQuests = this.questManager ? this.questManager.completedQuests : [];
        const viewY = top + 252;
        const viewH = winH - 266;
        const maxVisible = 6;
        let scrollIndex = 0;
        const maxScrollIndex = Math.max(0, completedQuests.length - maxVisible);

        const listContainer = this.add.container(0, 0);
        const scrollbarGfx = this.add.graphics();

        const renderCompletedList = () => {
            listContainer.removeAll(true);
            scrollbarGfx.clear();

            if (completedQuests.length === 0) {
                const noneText = this.add.text(left + 24, viewY, "ไม่มี", {
                    fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                    fontSize: '14px',
                    color: '#888888',
                    resolution: 2
                });
                listContainer.add(noneText);
                return;
            }

            const visibleQuests = completedQuests.slice(scrollIndex, scrollIndex + maxVisible);
            visibleQuests.forEach((cq, idx) => {
                const itemY = viewY + (idx * 26);
                const itemText = this.add.text(left + 24, itemY, `✓ ภารกิจที่ ${cq.id}: ${cq.title}`, {
                    fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                    fontSize: '13px',
                    color: '#888888',
                    resolution: 2
                });

                const strikeLine = this.add.graphics();
                strikeLine.lineStyle(1.5, 0x888888, 1);
                strikeLine.lineBetween(left + 22, itemY + 11, left + 22 + itemText.width + 4, itemY + 11);

                listContainer.add([itemText, strikeLine]);
            });

            if (maxScrollIndex > 0) {
                scrollbarGfx.fillStyle(0xf1f5f9, 1);
                scrollbarGfx.fillRoundedRect(left + winW - 16, viewY, 6, viewH, 3);

                const thumbH = Math.max(30, (maxVisible / completedQuests.length) * viewH);
                const thumbY = viewY + (scrollIndex / maxScrollIndex) * (viewH - thumbH);
                scrollbarGfx.fillStyle(0x94a3b8, 1);
                scrollbarGfx.fillRoundedRect(left + winW - 16, thumbY, 6, thumbH, 3);
            }
        };

        renderCompletedList();

        this.input.on('wheel', (pointer, deltaX, deltaY) => {
            if (maxScrollIndex <= 0) return;
            const newIndex = Phaser.Math.Clamp(scrollIndex + (deltaY > 0 ? 1 : -1), 0, maxScrollIndex);
            if (newIndex !== scrollIndex) {
                scrollIndex = newIndex;
                renderCompletedList();
            }
        });

        // 7. คีย์ลัด ESC หรือ Q เพื่อปิดหน้าต่าง
        this.input.keyboard.on('keydown-ESC', () => this.closeQuest());
        this.input.keyboard.on('keydown-Q', () => this.closeQuest());
    }

    closeQuest() {
        const parentScene = this.scene.get(this.parentSceneKey);
        if (parentScene && parentScene.interactions) {
            parentScene.interactions.unlock();
        }
        this.scene.stop();
    }
}
