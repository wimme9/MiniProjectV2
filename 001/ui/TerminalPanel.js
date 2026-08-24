export default class TerminalPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.inputCode = '';
        this.displayCodeText = null;
        this.statusText = null;
        this.isOpenState = false;
        this.onSuccessCallback = null;
        this.pointerHandler = null;
        this.keyHandler = null;
        this.isProcessing = false;
    }

    isOpen() {
        return this.isOpenState;
    }

    /**
     * เปิดหน้าจอ Terminal สำหรับกรอกรหัสผ่าน 4 หลัก
     * @param {string} correctPasscode - รหัสผ่านที่ถูกต้องของรอบเกมนี้
     * @param {function} onSuccess - Callback เมื่อกรอกรหัสถูกต้อง
     */
    open(correctPasscode, onSuccess = null) {
        if (this.isOpenState) return;
        this.isOpenState = true;
        this.inputCode = '';
        this.onSuccessCallback = onSuccess;
        this.correctPasscode = correctPasscode;
        this.isProcessing = false;

        // 1. Freeze ผู้เล่นและการควบคุม
        if (this.scene.interactions) {
            this.scene.interactions.lock();
        }
        if (this.scene.player && this.scene.player.body) {
            this.scene.player.setVelocity(0, 0);
            this.scene.player.anims.play('idle', true);
        }

        const cx = 640;
        const cy = 360;
        const camZoom = this.scene.cameras.main.zoom || 1.5;
        const panelW = 420;
        const panelH = 490;

        const container = this.scene.add.container(cx, cy)
            .setScrollFactor(0)
            .setDepth(30000)
            .setScale(1 / camZoom);

        // 2. แบ็กดรอปมืดกึ่งโปร่งแสง (เพิ่มอันดับแรกใน Container)
        const backdrop = this.scene.add.rectangle(0, 0, 1280 * camZoom, 720 * camZoom, 0x000000, 0.75);
        container.add(backdrop);

        // 3. กรอบหน้าต่างหลักสไตล์ Dark Research Terminal
        const bgGfx = this.scene.add.graphics();
        const left = -panelW / 2;
        const top = -panelH / 2;

        // พื้นหลัง Terminal
        bgGfx.fillStyle(0x0c1420, 0.98);
        bgGfx.fillRoundedRect(left, top, panelW, panelH, 8);
        bgGfx.lineStyle(2.5, 0x00e5ff, 0.9);
        bgGfx.strokeRoundedRect(left, top, panelW, panelH, 8);
        bgGfx.lineStyle(1, 0x0088ff, 0.4);
        bgGfx.strokeRoundedRect(left + 3, top + 3, panelW - 6, panelH - 6, 6);

        // Title Bar
        bgGfx.fillStyle(0x132035, 1);
        bgGfx.fillRect(left + 4, top + 4, panelW - 8, 38);
        bgGfx.lineStyle(1, 0x00e5ff, 0.5);
        bgGfx.lineBetween(left + 4, top + 42, left + panelW - 4, top + 42);

        container.add(bgGfx);

        // Title Text
        const titleText = this.scene.add.text(0, top + 14, "EXIT SECURITY TERMINAL", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#00e5ff',
            letterSpacing: 2,
            padding: { top: 4, bottom: 4 },
            resolution: 4
        }).setOrigin(0.5, 0);
        if (titleText.texture) titleText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        // Close Button [ ✕ ]
        const closeBtn = this.scene.add.text(panelW / 2 - 28, top + 10, "✕", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ff6b6b',
            padding: { top: 4, bottom: 4 },
            resolution: 4
        });
        if (closeBtn.texture) closeBtn.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        container.add([titleText, closeBtn]);

        // 4. หน้าจอ LCD Display Box
        const lcdBg = this.scene.add.graphics();
        lcdBg.fillStyle(0x040810, 1);
        lcdBg.fillRoundedRect(-160, top + 52, 320, 68, 6);
        lcdBg.lineStyle(1.5, 0x00aaff, 0.8);
        lcdBg.strokeRoundedRect(-160, top + 52, 320, 68, 6);
        container.add(lcdBg);

        // ข้อความสถานะด้านบนของจอ
        this.statusText = this.scene.add.text(0, top + 60, "ENTER PASSCODE", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#8ab4f8',
            padding: { top: 4, bottom: 4 },
            resolution: 4
        }).setOrigin(0.5, 0);
        if (this.statusText.texture) this.statusText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        // รหัสผ่านที่แสดงผล (ซ่อนเป็นเครื่องหมาย * * * *)
        this.displayCodeText = this.scene.add.text(0, top + 82, "_ _ _ _", {
            fontFamily: 'monospace',
            fontSize: '26px',
            fontStyle: 'bold',
            color: '#00e5ff',
            letterSpacing: 8,
            padding: { top: 4, bottom: 4 },
            resolution: 4
        }).setOrigin(0.5, 0);
        if (this.displayCodeText.texture) this.displayCodeText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        container.add([this.statusText, this.displayCodeText]);

        // 5. ปุ่มกดตัวเลข Keypad [1..9, 0, CLEAR, CANCEL, ENTER]
        const buttons = [];
        const btnWidth = 84;
        const btnHeight = 44;
        const startY = top + 168;
        const gapX = 14;
        const gapY = 12;

        const keypadLayout = [
            [
                { val: '1', label: '1', w: btnWidth },
                { val: '2', label: '2', w: btnWidth },
                { val: '3', label: '3', w: btnWidth }
            ],
            [
                { val: '4', label: '4', w: btnWidth },
                { val: '5', label: '5', w: btnWidth },
                { val: '6', label: '6', w: btnWidth }
            ],
            [
                { val: '7', label: '7', w: btnWidth },
                { val: '8', label: '8', w: btnWidth },
                { val: '9', label: '9', w: btnWidth }
            ],
            [
                { val: 'CLEAR', label: 'CLEAR', w: btnWidth },
                { val: '0', label: '0', w: btnWidth },
                { val: 'CANCEL', label: 'CANCEL', w: btnWidth }
            ],
            [
                { val: 'ENTER', label: 'ENTER', w: (btnWidth * 3) + (gapX * 2) }
            ]
        ];

        keypadLayout.forEach((row, rIdx) => {
            row.forEach((item, cIdx) => {
                const curW = item.w;
                let posX = 0;
                if (row.length === 3) {
                    posX = (cIdx - 1) * (btnWidth + gapX);
                } else if (row.length === 1) {
                    posX = 0;
                }

                const posY = startY + (rIdx * (btnHeight + gapY));

                const bGfx = this.scene.add.graphics();
                let isAction = '#ffffff';
                let bgFill = 0x182438;
                let strokeColor = 0x2e486b;

                if (item.val === 'ENTER') {
                    isAction = '#00e5ff';
                    bgFill = 0x0c2d48;
                    strokeColor = 0x00e5ff;
                } else if (item.val === 'CLEAR') {
                    isAction = '#ff7875';
                    bgFill = 0x361616;
                    strokeColor = 0xff4d4f;
                } else if (item.val === 'CANCEL') {
                    isAction = '#cbd5e1';
                    bgFill = 0x1e293b;
                    strokeColor = 0x64748b;
                }

                bGfx.fillStyle(bgFill, 1);
                bGfx.fillRoundedRect(posX - curW / 2, posY - btnHeight / 2, curW, btnHeight, 6);
                bGfx.lineStyle(1.5, strokeColor, 1);
                bGfx.strokeRoundedRect(posX - curW / 2, posY - btnHeight / 2, curW, btnHeight, 6);

                const bText = this.scene.add.text(posX, posY, item.label, {
                    fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
                    fontSize: (item.val === 'ENTER' || item.val === 'CLEAR' || item.val === 'CANCEL') ? '14px' : '20px',
                    fontStyle: 'bold',
                    color: isAction,
                    padding: { top: 4, bottom: 4 },
                    resolution: 4
                }).setOrigin(0.5, 0.5);
                if (bText.texture) bText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

                buttons.push({
                    val: item.val,
                    x: posX,
                    y: posY,
                    w: curW,
                    h: btnHeight
                });

                container.add([bGfx, bText]);
            });
        });

        this.container = container;

        // ตรวจจับคลิกแบบ Screen-Space Hit Detection
        this.pointerHandler = (pointer) => {
            if (!this.isOpenState || this.isProcessing) return;

            // 1. ตรวจจับคลิกปุ่มปิด [ ✕ ]
            const closeLeft = cx + panelW / 2 - 40;
            const closeRight = cx + panelW / 2;
            const closeTop = cy - panelH / 2;
            const closeBottom = cy - panelH / 2 + 40;

            if (pointer.x >= closeLeft && pointer.x <= closeRight && pointer.y >= closeTop && pointer.y <= closeBottom) {
                this.close();
                return;
            }

            // 2. ตรวจจับคลิกปุ่ม Keypad
            for (const btn of buttons) {
                const bLeft = cx + btn.x - btn.w / 2;
                const bRight = cx + btn.x + btn.w / 2;
                const bTop = cy + btn.y - btn.h / 2;
                const bBottom = cy + btn.y + btn.h / 2;

                if (pointer.x >= bLeft && pointer.x <= bRight && pointer.y >= bTop && pointer.y <= bBottom) {
                    this.handleInput(btn.val);
                    return;
                }
            }

            // 3. คลิกพื้นที่ด้านนอกเพื่อปิด
            const winL = cx - panelW / 2;
            const winR = cx + panelW / 2;
            const winT = cy - panelH / 2;
            const winB = cy + panelH / 2;

            if (pointer.x < winL || pointer.x > winR || pointer.y < winT || pointer.y > winB) {
                this.close();
            }
        };

        this.scene.time.delayedCall(100, () => {
            if (this.isOpenState) {
                this.scene.input.on('pointerdown', this.pointerHandler);
            }
        });

        // รองรับการพิมพ์ตัวเลขผ่านแป้นพิมพ์คอมพิวเตอร์
        this.keyHandler = (event) => {
            if (!this.isOpenState || this.isProcessing) return;

            if (event.key >= '0' && event.key <= '9') {
                this.handleInput(event.key);
            } else if (event.key === 'Backspace') {
                this.handleInput('CLEAR');
            } else if (event.key === 'Enter') {
                this.handleInput('ENTER');
            } else if (event.key === 'Escape') {
                this.close();
            }
        };
        this.scene.input.keyboard.on('keydown', this.keyHandler);

        // Fade in animation
        container.setAlpha(0);
        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            duration: 150
        });
    }

    /**
     * จัดการค่าที่ผู้เล่นกด
     */
    handleInput(val) {
        if (this.isProcessing) return;

        if (val === 'CLEAR') {
            this.inputCode = '';
            this.updateDisplay();
        } else if (val === 'CANCEL') {
            this.close();
        } else if (val === 'ENTER') {
            this.submitCode();
        } else if (val >= '0' && val <= '9') {
            if (this.inputCode.length < 4) {
                this.inputCode += val;
                this.updateDisplay();
            }
        }
    }

    /**
     * อัปเดตการแสดงผลบนจอ LCD (ซ่อนเป็นเครื่องหมายดอกจัน * * * *)
     */
    updateDisplay() {
        if (!this.displayCodeText) return;

        let stars = '';
        for (let i = 0; i < 4; i++) {
            if (i < this.inputCode.length) {
                stars += '* ';
            } else {
                stars += '_ ';
            }
        }
        this.displayCodeText.setText(stars.trim());
        this.displayCodeText.setColor('#00e5ff');
    }

    /**
     * ตรวจสอบรหัสผ่านที่กรอก
     */
    submitCode() {
        if (this.inputCode.length < 4) {
            this.statusText.setText("PLEASE ENTER 4 DIGITS");
            this.statusText.setColor('#ffaa00');
            return;
        }

        this.isProcessing = true;

        if (this.inputCode === this.correctPasscode) {
            // รหัสผ่านถูกต้อง!
            this.statusText.setText("ACCESS GRANTED");
            this.statusText.setColor('#00ff88');
            this.displayCodeText.setColor('#00ff88');

            this.scene.time.delayedCall(700, () => {
                const cb = this.onSuccessCallback;
                this.close();
                if (cb) cb();
            });
        } else {
            // รหัสผ่านผิดพลาด!
            this.statusText.setText("ACCESS DENIED");
            this.statusText.setColor('#ff4444');
            this.displayCodeText.setColor('#ff4444');

            // สั่นหน้าจอ Terminal เล็กน้อย
            this.scene.tweens.add({
                targets: this.container,
                x: 640 + 8,
                duration: 60,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    this.container.setX(640);
                    this.scene.time.delayedCall(600, () => {
                        this.inputCode = '';
                        this.statusText.setText("ENTER PASSCODE");
                        this.statusText.setColor('#8ab4f8');
                        this.updateDisplay();
                        this.isProcessing = false;
                    });
                }
            });
        }
    }

    /**
     * ปิดหน้าจอ Terminal Panel
     */
    close() {
        if (!this.isOpenState) return;
        this.isOpenState = false;

        if (this.pointerHandler) {
            this.scene.input.off('pointerdown', this.pointerHandler);
            this.pointerHandler = null;
        }
        if (this.keyHandler) {
            this.scene.input.keyboard.off('keydown', this.keyHandler);
            this.keyHandler = null;
        }

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }

        // ปลดล็อกการควบคุมให้ผู้เล่น
        if (this.scene.interactions) {
            this.scene.interactions.unlock();
        }
    }
}
