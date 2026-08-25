export default class DialogueBox {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.messages = [];
        this.currentIndex = 0;
        this.onCompleteCallback = null;
        this.speaker = null;
        this.isChoosing = false;
        this.choiceButtons = [];

        this.camWidth = 1280;
        this.camHeight = 720;
        this.maxBoxWidth = 820;
        this.minBoxWidth = 360;
        this.paddingX = 28;
        this.paddingTop = 20;
        this.paddingBottom = 32;
        this.textMaxWidth = this.maxBoxWidth - (this.paddingX * 2);
        this.bottomMargin = 48;

        // กล่องพื้นหลังแบบปรับขนาดอัตโนมัติ (Dynamic Background Panel)
        this.box = scene.add.rectangle(this.camWidth / 2, 540, 780, 100, 0xffffff)
            .setStrokeStyle(3, 0x000000)
            .setScrollFactor(0)
            .setDepth(25000)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        // ป้ายชื่อผู้พูด (Speaker Name Badge) บนหัวกล่องข้อความ
        this.nameTagBg = scene.add.rectangle(0, 0, 100, 26, 0x111827)
            .setStrokeStyle(2, 0x000000)
            .setScrollFactor(0)
            .setDepth(25002)
            .setVisible(false);

        this.nameTagText = scene.add.text(0, 0, '', {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#00e5ff',
            padding: { top: 4, bottom: 4, left: 6, right: 6 },
            resolution: 4
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(25003)
        .setVisible(false);

        if (this.nameTagText.texture) {
            this.nameTagText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }

        // ข้อความบทสนทนา (รองรับการตัดบรรทัดภาษาไทยแบบ Advanced Wrap + High DPI)
        this.text = scene.add.text(0, 0, '', {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#000000',
            wordWrap: { width: this.textMaxWidth, useAdvancedWrap: true },
            padding: { top: 12, bottom: 12, left: 6, right: 6 },
            lineSpacing: 8,
            resolution: 4
        })
        .setScrollFactor(0)
        .setDepth(25001)
        .setVisible(false);

        if (this.text.texture) {
            this.text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }

        // คำแนะนำกดไปต่อ / ปิด (จัดวางมุมล่างขวาของกล่องไดนามิกเสมอ)
        this.prompt = scene.add.text(0, 0, '▼ [คลิกเพื่อไปต่อ]', {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#555555',
            padding: { top: 6, bottom: 6, left: 4, right: 4 },
            resolution: 4
        })
        .setOrigin(1, 1)
        .setScrollFactor(0)
        .setDepth(25001)
        .setVisible(false);

        if (this.prompt.texture) {
            this.prompt.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        }

        // คลิกที่ตัวกล่องข้อความเพื่อเลื่อนไปข้อความถัดไป
        this.box.on('pointerdown', (pointer, lx, ly, event) => {
            if (this.isChoosing || (this.scene && this.scene.isPausedForSettings)) return;
            if (event && event.stopPropagation) event.stopPropagation();
            this.advance();
        });
    }

    advance() {
        if (!this.isActive || this.isChoosing || (this.scene && this.scene.isPausedForSettings)) return;
        if (this.scene && typeof this.scene.playButtonClickSound === 'function') {
            this.scene.playButtonClickSound();
        }
        this.currentIndex++;
        if (this.currentIndex < this.messages.length) {
            this.displayCurrent(true);
        } else {
            this.close();
        }
    }

    /**
     * แสดงข้อความเดี่ยวแบบไดนามิก
     */
    show(message, onComplete = null, speaker = null) {
        this.showSequence([message], onComplete, speaker);
    }

    /**
     * แสดงชุดข้อความต่อเนื่องหลายตอน (ปรับขนาดกล่องตามความยาวข้อความแต่ละตอนอย่างนุ่มนวล)
     */
    showSequence(messages, onComplete = null, speaker = null) {
        this.clearChoices();
        if (!messages || messages.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        this.messages = Array.isArray(messages) ? messages : [messages];
        this.currentIndex = 0;
        this.onCompleteCallback = onComplete;
        this.speaker = speaker;
        this.isActive = true;
        this.isChoosing = false;

        this.displayCurrent(false);
    }

    /**
     * แสดงตัวเลือกตอบคำถาม (Interactive Choice Options)
     */
    showChoices(question, options, onSelectCallback, speaker = null) {
        this.clearChoices();
        this.speaker = speaker;
        this.isActive = true;
        this.isChoosing = true;
        this.messages = [question];
        this.currentIndex = 0;

        // คำนวณขนาดกล่องเพื่อบรรจุคำถามและตัวเลือกทั้งหมด
        this.text.setText(question);
        this.text.updateText();

        const measuredTextW = this.text.width;
        const measuredTextH = this.text.height;
        const optionGap = 10;
        const optionH = 38;
        const totalOptionsH = options.length * (optionH + optionGap);

        const targetBoxW = Math.min(
            this.maxBoxWidth,
            Math.max(480, measuredTextW + (this.paddingX * 2))
        );
        const targetBoxH = Math.max(130, measuredTextH + totalOptionsH + this.paddingTop + 24);

        const camZoom = (this.scene.cameras && this.scene.cameras.main && this.scene.cameras.main.zoom) ? this.scene.cameras.main.zoom : 1.5;
        const cx = 640;
        const cy = 360;
        const bottomCameraY = cy + (cy - 36) / camZoom;
        const targetCenterX = cx;
        const targetCenterY = bottomCameraY - (targetBoxH / 2);

        const targetTextX = targetCenterX - (targetBoxW / 2) + this.paddingX;
        const targetTextY = targetCenterY - (targetBoxH / 2) + this.paddingTop;

        this.box.setSize(targetBoxW, targetBoxH);
        this.box.setPosition(targetCenterX, targetCenterY);
        this.text.setPosition(targetTextX, targetTextY);

        this.box.setVisible(true);
        this.text.setVisible(true);
        this.prompt.setVisible(false);

        // จัดตำแหน่งป้ายชื่อผู้พูด
        if (this.speaker) {
            this.nameTagText.setText(this.speaker);
            this.nameTagText.updateText();
            const tagW = Math.max(90, this.nameTagText.width + 20);
            const tagH = 26;
            const tagX = targetCenterX - (targetBoxW / 2) + (tagW / 2) + 12;
            const tagY = targetCenterY - (targetBoxH / 2);

            this.nameTagBg.setSize(tagW, tagH);
            this.nameTagBg.setPosition(tagX, tagY);
            this.nameTagText.setPosition(tagX, tagY);
            this.nameTagBg.setVisible(true);
            this.nameTagText.setVisible(true);
        } else {
            this.nameTagBg.setVisible(false);
            this.nameTagText.setVisible(false);
        }

        // สร้างปุ่มตัวเลือกแต่ละข้อ
        const btnStartY = targetTextY + measuredTextH + 16;
        const btnW = targetBoxW - (this.paddingX * 2);

        options.forEach((optStr, idx) => {
            const btnY = btnStartY + (idx * (optionH + optionGap));

            const btnBg = this.scene.add.rectangle(targetCenterX, btnY + optionH / 2, btnW, optionH, 0xf1f5f9)
                .setStrokeStyle(2, 0x334155)
                .setScrollFactor(0)
                .setDepth(25002)
                .setInteractive({ useHandCursor: true });

            const btnText = this.scene.add.text(targetCenterX, btnY + optionH / 2, `[ ${idx + 1}. ${optStr} ]`, {
                fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                fontSize: '15px',
                fontStyle: 'bold',
                color: '#0f172a',
                padding: { top: 4, bottom: 4 },
                resolution: 4
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(25003);

            if (btnText.texture) {
                btnText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
            }

            btnBg.on('pointerover', () => {
                btnBg.setFillStyle(0x0284c7);
                btnBg.setStrokeStyle(2, 0x00e5ff);
                btnText.setColor('#ffffff');
            });

            btnBg.on('pointerout', () => {
                btnBg.setFillStyle(0xf1f5f9);
                btnBg.setStrokeStyle(2, 0x334155);
                btnText.setColor('#0f172a');
            });

            btnBg.on('pointerdown', (pointer, lx, ly, event) => {
                if (event && event.stopPropagation) event.stopPropagation();
                if (this.scene && typeof this.scene.playButtonClickSound === 'function') {
                    this.scene.playButtonClickSound();
                }
                this.clearChoices();
                if (onSelectCallback) {
                    onSelectCallback(idx);
                }
            });

            this.choiceButtons.push(btnBg, btnText);
        });
    }

    clearChoices() {
        this.isChoosing = false;
        if (this.choiceButtons && this.choiceButtons.length > 0) {
            this.choiceButtons.forEach(btn => btn.destroy());
            this.choiceButtons = [];
        }
    }

    /**
     * คำนวณขนาดและแสดงผลข้อความปัจจุบัน
     * @param {boolean} isTransition - เป็นการเปลี่ยนท่อนข้อความถัดไปหรือไม่ (เพื่อเล่น Animation ปรับขนาด)
     */
    displayCurrent(isTransition = false) {
        if (this.currentIndex < this.messages.length) {
            const rawMessage = this.messages[this.currentIndex];
            const isLast = this.currentIndex === this.messages.length - 1;

            // 1. ตั้งค่าข้อความและสั่งให้ Phaser ประมวลผลขนาด Text Bounding Box จริง
            this.text.setText(rawMessage);
            this.text.updateText();

            const measuredTextW = this.text.width;
            const measuredTextH = this.text.height;

            // 2. คำนวณขนาดกล่องไดนามิก (Box Dimensions) ตามเนื้อหาข้อความ
            const targetBoxW = Math.min(
                this.maxBoxWidth,
                Math.max(this.minBoxWidth, measuredTextW + (this.paddingX * 2))
            );
            const targetBoxH = Math.max(85, measuredTextH + this.paddingTop + this.paddingBottom);

            // 3. ตำแหน่งกึ่งกลางของกล่อง (คำนวณชดเชย Camera Zoom 1.5x ให้อยู่เหนือขอบล่างของหน้าจอ 36px พอดี)
            const camZoom = (this.scene.cameras && this.scene.cameras.main && this.scene.cameras.main.zoom) ? this.scene.cameras.main.zoom : 1.5;
            const cx = 640;
            const cy = 360;
            const bottomCameraY = cy + (cy - 36) / camZoom;
            const targetCenterX = cx;
            const targetCenterY = bottomCameraY - (targetBoxH / 2);

            // 4. ตำแหน่งพิกัดข้อความและปุ่ม Prompt ภายในกล่อง
            const targetTextX = targetCenterX - (targetBoxW / 2) + this.paddingX;
            const targetTextY = targetCenterY - (targetBoxH / 2) + this.paddingTop;
            const targetPromptX = targetCenterX + (targetBoxW / 2) - this.paddingX;
            const targetPromptY = targetCenterY + (targetBoxH / 2) - 12;

            this.prompt.setText(isLast ? '▼ [คลิกเพื่อปิด]' : '▼ [คลิกเพื่อไปต่อ]');

            // 5. ปรับขนาดและตำแหน่งของกล่องให้ตรงกับข้อความใหม่ทันที
            this.box.setSize(targetBoxW, targetBoxH);
            this.box.setPosition(targetCenterX, targetCenterY);
            this.text.setPosition(targetTextX, targetTextY);
            this.prompt.setPosition(targetPromptX, targetPromptY);

            this.box.setVisible(true);
            this.text.setVisible(true);
            this.prompt.setVisible(true);

            // 6. จัดตำแหน่งป้ายชื่อผู้พูด
            if (this.speaker) {
                this.nameTagText.setText(this.speaker);
                this.nameTagText.updateText();
                const tagW = Math.max(90, this.nameTagText.width + 20);
                const tagH = 26;
                const tagX = targetCenterX - (targetBoxW / 2) + (tagW / 2) + 12;
                const tagY = targetCenterY - (targetBoxH / 2);

                this.nameTagBg.setSize(tagW, tagH);
                this.nameTagBg.setPosition(tagX, tagY);
                this.nameTagText.setPosition(tagX, tagY);
                this.nameTagBg.setVisible(true);
                this.nameTagText.setVisible(true);
            } else {
                this.nameTagBg.setVisible(false);
                this.nameTagText.setVisible(false);
            }

            if (isTransition) {
                // เอฟเฟกต์เฟดข้อความใหม่อย่างนุ่มนวล
                this.text.setAlpha(0.2);
                this.scene.tweens.add({
                    targets: this.text,
                    alpha: 1,
                    duration: 100,
                    ease: 'Linear'
                });
            } else {
                this.text.setAlpha(1);
                // Pop-in effect ตอนเปิดกล่องครั้งแรก
                this.box.setScale(0.97);
                this.scene.tweens.add({
                    targets: this.box,
                    scale: 1,
                    duration: 140,
                    ease: 'Back.easeOut'
                });
            }
        } else {
            this.hide();
        }
    }

    /**
     * เลื่อนไปข้อความถัดไป หรือปิดเมื่อถึงข้อความสุดท้าย
     */
    advance() {
        if (!this.isActive || this.isChoosing) return;

        this.currentIndex++;
        if (this.currentIndex < this.messages.length) {
            this.displayCurrent(true);
        } else {
            this.hide();
        }
    }

    hide() {
        if (!this.isActive) return;

        this.clearChoices();
        this.isActive = false;
        this.box.setVisible(false);
        this.text.setVisible(false);
        this.prompt.setVisible(false);
        this.nameTagBg.setVisible(false);
        this.nameTagText.setVisible(false);

        const callback = this.onCompleteCallback;
        this.onCompleteCallback = null;
        this.messages = [];
        this.currentIndex = 0;
        this.speaker = null;

        if (callback) {
            callback();
        }
    }

    isOpen() {
        return this.isActive;
    }
}