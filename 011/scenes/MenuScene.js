// ============================================================
// MenuScene.js
// หน้าแรก: โลโก้, ปุ่มเริ่มเกม 3D, ปุ่มวิธีเล่น, ปุ่มประเภทขยะ, ปุ่มเปิด-ปิดเสียง
// ============================================================

class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.gameData = this.registry.get("gameData");
    const { width, height } = this.sys.game.config;
    const text = this.gameData.text;

    // พื้นหลังเต็มจอ
    this.add.image(width / 2, height / 2, "titleArt").setDisplaySize(width, height);

    // การ์ดรองหลังปุ่มทรงโค้งมน
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x000000, 0.45);
    cardBg.fillRoundedRect(width / 2 - 165, 630, 330, 300, 28);
    cardBg.lineStyle(3, 0xffffff, 0.5);
    cardBg.strokeRoundedRect(width / 2 - 165, 630, 330, 300, 28);

    // ปุ่มเริ่มเกม (3D Green)
    create3DButton(this, width / 2, 700, 270, 68, text.startButton, () => {
      this.scene.start("GameScene");
    }, {
      topColor: 0x4caf50,
      bottomColor: 0x2e7d32,
      hoverColor: 0x66bb6a
    });

    // ปุ่มวิธีเล่น (3D Orange)
    create3DButton(this, width / 2, 780, 270, 68, text.howToPlayButton, () => {
      this.showHowToPlay();
    }, {
      topColor: 0xff9800,
      bottomColor: 0xe65100,
      hoverColor: 0xffa726
    });

    // ปุ่มประเภทขยะ (3D Blue) - เปิดโมดัลแนะนำขยะแต่ละชนิดและคะแนน
    create3DButton(this, width / 2, 860, 270, 68, text.wasteGuideButton, () => {
      this.showWasteGuide();
    }, {
      topColor: 0x29b6f6,
      bottomColor: 0x0277bd,
      hoverColor: 0x4fc3f7
    });

    this.createMuteToggle();
    this.playBgmIfNeeded();
  }

  playBgmIfNeeded() {
    if (!this.sound.get("bgm")) {
      playSoundSafe(this, "bgm", { loop: true, volume: 0.5 });
    }
  }

  createMuteToggle() {
    const { width } = this.sys.game.config;
    const x = width - 45;
    const y = 45;

    const getTextureKey = () => (this.sound.mute ? "btnSoundOn" : "btnSoundOff");

    this.muteBtn = this.add.image(x, y, getTextureKey())
      .setDisplaySize(52, 52)
      .setInteractive({ useHandCursor: true });

    this.muteBtn.on("pointerdown", () => {
      this.sound.mute = !this.sound.mute;
      this.muteBtn.setTexture(getTextureKey());

      if (!this.sound.mute) {
        playSoundSafe(this, "click");
      }
    });
  }

  // [แก้บั๊ก] ขยายกรอบจาก 400 -> 480 เพราะข้อความ "PC: กด A/D หรือลูกศรซ้าย-ขวา หรือคลิกลากด้วยเมาส์"
  // ยาวเกินกรอบเดิมจนล้นซ้าย-ขวา และเพิ่ม wordWrap กันไว้ล่วงหน้า
  // เผื่อข้อความยาวขึ้นอีกในอนาคตจะตัดบรรทัดอัตโนมัติแทนที่จะล้นออกนอกกรอบ
  showHowToPlay() {
    const { width, height } = this.sys.game.config;
    const text = this.gameData.text;

    const modalW = 480; // เดิม 400
    const modalH = 460; // เดิม 440 - ขยายรับข้อความที่อาจยาวขึ้น

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setInteractive();

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0xffffff, 0.98);
    modalBg.fillRoundedRect(width / 2 - modalW / 2, height / 2 - modalH / 2, modalW, modalH, 24);

    const title = this.add.text(width / 2, height / 2 - modalH / 2 + 60, text.howToPlayTitle, {
      fontSize: "32px",
      fontFamily: "'Kanit', sans-serif",
      fontStyle: "bold",
      color: "#2e7d32"
    }).setOrigin(0.5);

    const body = this.add.text(width / 2, height / 2 - 10, text.howToPlayText, {
      fontSize: "22px",
      fontFamily: "'Kanit', sans-serif",
      color: "#333333",
      align: "center",
      lineSpacing: 10,
      wordWrap: { width: modalW - 60 } // เว้นขอบซ้ายขวาข้างละ 30px ป้องกันข้อความชนกรอบ
    }).setOrigin(0.5);

    const closeBtnContainer = create3DButton(this, width / 2, height / 2 + modalH / 2 - 60, 180, 56, text.closeButton, () => {
      overlay.destroy();
      modalBg.destroy();
      title.destroy();
      body.destroy();
      closeBtnContainer.destroy();
    }, {
      topColor: 0xf44336,
      bottomColor: 0xc62828,
      hoverColor: 0xef5350,
      fontSize: "24px"
    });
  }

  // โมดัลแนะนำขยะแต่ละชนิด: รีไซเคิล (พร้อมคะแนน, ข้อความสีเขียว) และขยะอันตราย (พร้อมเตือน -1 หัวใจ, ข้อความสีแดง)
  // ขนาดโมดัลคำนวณอัตโนมัติจากจำนวนไอเทม เพื่อให้มีระยะห่างพอเสมอไม่ว่าจะเพิ่ม/ลดไอเทมในอนาคต
  showWasteGuide() {
    const { width, height } = this.sys.game.config;
    const text = this.gameData.text;
    const collectibles = this.gameData.collectibles;
    const hazards = this.gameData.hazards;

    const cols = 2;
    const rowH = 175;
    const titleAreaH = 70;
    const sectionLabelH = 34;
    const sectionGapH = 34;
    const bottomPaddingH = 110;

    const collectibleRows = Math.ceil(collectibles.length / cols);
    const hazardRows = Math.ceil(hazards.length / cols);

    const modalW = 460;
    const modalH = titleAreaH
      + sectionLabelH + collectibleRows * rowH
      + sectionGapH
      + sectionLabelH + hazardRows * rowH
      + bottomPaddingH;

    const modalX = width / 2;
    const modalY = height / 2;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setInteractive();

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0xffffff, 0.98);
    modalBg.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 24);

    const elements = [overlay, modalBg];

    const title = this.add.text(modalX, modalY - modalH / 2 + 36, text.wasteGuideTitle, {
      fontSize: "28px",
      fontFamily: "'Kanit', sans-serif",
      fontStyle: "bold",
      color: "#2e7d32"
    }).setOrigin(0.5);
    elements.push(title);

    let cursorY = modalY - modalH / 2 + titleAreaH;

    // --- ส่วนขยะรีไซเคิล (ข้อความสีเขียว) ---
    const collectibleLabel = this.add.text(modalX, cursorY, text.collectibleSectionLabel, {
      fontSize: "18px",
      fontFamily: "'Kanit', sans-serif",
      fontStyle: "bold",
      color: "#2e7d32"
    }).setOrigin(0.5);
    elements.push(collectibleLabel);
    cursorY += sectionLabelH;

    cursorY = this.layoutWasteGrid(collectibles, modalX, cursorY, rowH, elements, false);
    cursorY += sectionGapH;

    // --- ส่วนขยะอันตราย (ข้อความสีแดง) ---
    const hazardLabel = this.add.text(modalX, cursorY, text.hazardSectionLabel, {
      fontSize: "18px",
      fontFamily: "'Kanit', sans-serif",
      fontStyle: "bold",
      color: "#c62828"
    }).setOrigin(0.5);
    elements.push(hazardLabel);
    cursorY += sectionLabelH;

    this.layoutWasteGrid(hazards, modalX, cursorY, rowH, elements, true);

    const closeBtnContainer = create3DButton(this, modalX, modalY + modalH / 2 - 55, 180, 56, text.closeButton, () => {
      elements.forEach((el) => el.destroy());
      closeBtnContainer.destroy();
    }, {
      topColor: 0xf44336,
      bottomColor: 0xc62828,
      hoverColor: 0xef5350,
      fontSize: "22px"
    });
  }

  // จัดวางกริดไอเทม 2 คอลัมน์: ไอคอน + ชื่อ + ป้ายคะแนน สีตามหมวด (เขียว=เก็บได้, แดง=อันตราย)
  // ถ้าแถวสุดท้ายเหลือไอเทมเดียว จะจัดให้อยู่กึ่งกลางแทนชิดซ้าย
  // คืนค่า cursorY ถัดไป (ตำแหน่ง Y หลังจากวางกริดนี้เสร็จ)
  layoutWasteGrid(items, centerX, startY, rowH, elements, isHazard) {
    const cols = 2;
    const colW = 190;
    const colXs = [centerX - colW / 2, centerX + colW / 2];
    const totalRows = Math.ceil(items.length / cols);
    const labelColor = isHazard ? "#c62828" : "#2e7d32";

    items.forEach((itemDef, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const isLastRow = row === totalRows - 1;
      const itemsInLastRow = items.length - (totalRows - 1) * cols;

      const cellX = (isLastRow && itemsInLastRow === 1) ? centerX : colXs[col];
      const cellY = startY + row * rowH + rowH / 2;

      const icon = this.add.image(cellX, cellY - 55, itemDef.spriteKey).setScale(0.26);
      elements.push(icon);

      const label = this.add.text(cellX, cellY + 30, itemDef.label, {
        fontSize: "15px",
        fontFamily: "'Kanit', sans-serif",
        fontStyle: "bold",
        color: labelColor,
        align: "center",
        wordWrap: { width: 175 }
      }).setOrigin(0.5);
      elements.push(label);

      const badgeText = isHazard ? "-1 ❤️" : `+${itemDef.points}`;
      const badge = this.add.text(cellX, cellY + 58, badgeText, {
        fontSize: "17px",
        fontFamily: "'Kanit', sans-serif",
        fontStyle: "bold",
        color: labelColor
      }).setOrigin(0.5);
      elements.push(badge);
    });

    return startY + totalRows * rowH;
  }
}