// ============================================================
// GameOverScene.js
// หน้าสรุปผล / เล่นอีกครั้ง: ปรับเงื่อนไขดาว + แสดงเกณฑ์ดาว + สถิติสูงสุด
// ============================================================

const ECO_CATCHER_HIGH_SCORE_KEY = "ecoCatcherHighScore";

class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.score = data.score || 0;
    this.isWin = data.isWin !== undefined ? data.isWin : false; // true = ชนะ (เวลาหมด), false = แพ้ (หัวใจหมด)
  }

  create() {
    this.gameData = this.registry.get("gameData");
    const { width, height } = this.sys.game.config;
    const text = this.gameData.text;

    // [ใหม่ - ข้อ 9] อ่านค่าสถิติสูงสุดเดิมจาก localStorage แล้วอัปเดตถ้าคะแนนรอบนี้สูงกว่า
    const storedHighScore = parseInt(localStorage.getItem(ECO_CATCHER_HIGH_SCORE_KEY) || "0", 10);
    this.isNewHighScore = this.score > storedHighScore;
    this.highScore = this.isNewHighScore ? this.score : storedHighScore;
    if (this.isNewHighScore) {
      localStorage.setItem(ECO_CATCHER_HIGH_SCORE_KEY, String(this.score));
    }

    // พื้นหลัง
    this.add.image(width / 2, height / 2, "background").setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45);

    // ขนาดการ์ด Pop-up [ขยายสูงขึ้นเพื่อรองรับบรรทัดสถิติสูงสุด]
    const cardW = 440;
    const cardH = 600;
    const cardX = width / 2;
    const cardY = height / 2;

    // การ์ดทรงโค้งมน
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0xffffff, 0.98);
    cardBg.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 32);
    cardBg.lineStyle(4, 0x4caf50, 0.8);
    cardBg.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 32);

    // หัวข้อ (ชนะ / แพ้)
    const titleText = this.isWin ? text.gameOverWinTitle : text.gameOverLoseTitle;
    const titleColor = this.isWin ? "#2e7d32" : "#c62828";

    this.add.text(cardX, cardY - 250, titleText, {
      fontSize: "36px",
      fontFamily: "'Kanit', sans-serif",
      fontStyle: "bold",
      color: titleColor
    }).setOrigin(0.5);

    // คำนวณจำนวนดาวที่ได้
    const starCount = this.calculateStars(this.score);
    this.drawStars(cardX, cardY - 180, starCount);

    this.add.text(cardX, cardY - 125, "⭐ เกณฑ์ดาว: 150+ (1ดาว) | 500+ (2ดาว) | 1000+ (3ดาว)", {
      fontSize: "16px",
      fontFamily: "'Kanit', sans-serif",
      color: "#666666"
    }).setOrigin(0.5);

    // แสดงคะแนนผู้เล่น
    this.add.text(cardX, cardY - 75, "คะแนนของคุณ", {
      fontSize: "20px",
      fontFamily: "'Kanit', sans-serif",
      color: "#555555"
    }).setOrigin(0.5);

    this.add.text(cardX, cardY - 25, `${this.score}`, {
      fontSize: "48px",
      fontFamily: "'Kanit', sans-serif",
      fontStyle: "bold",
      color: "#2e7d32"
    }).setOrigin(0.5);

    // [ใหม่ - ข้อ 9] แสดงสถิติสูงสุด + ป้ายสถิติใหม่ (ถ้ามี)
    this.add.text(cardX, cardY + 30, `${text.highScoreLabel}: ${this.highScore}`, {
      fontSize: "18px",
      fontFamily: "'Kanit', sans-serif",
      color: "#555555"
    }).setOrigin(0.5);

    if (this.isNewHighScore) {
      const badge = this.add.text(cardX, cardY + 58, text.newHighScoreText, {
        fontSize: "16px",
        fontFamily: "'Kanit', sans-serif",
        fontStyle: "bold",
        color: "#ff9800"
      }).setOrigin(0.5);

      this.tweens.add({ targets: badge, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
    }

    // ปุ่ม 3D "เล่นอีกครั้ง"
    create3DButton(this, cardX, cardY + 140, 270, 64, text.replayButton, () => {
      this.scene.start("GameScene");
    }, {
      topColor: 0x4caf50,
      bottomColor: 0x2e7d32,
      hoverColor: 0x66bb6a,
      fontSize: "26px"
    });

    // ปุ่ม 3D "กลับหน้าแรก"
    create3DButton(this, cardX, cardY + 220, 270, 64, text.homeButton, () => {
      this.scene.start("MenuScene");
    }, {
      topColor: 0xff9800,
      bottomColor: 0xe65100,
      hoverColor: 0xffa726,
      fontSize: "26px"
    });
  }

  // หากแพ้ (isWin == false หรือ HP หมด) จะได้ 0 ดาวทันที
  calculateStars(score) {
    if (!this.isWin) return 0;

    const grading = this.gameData.grading;
    for (let i = 0; i < grading.length; i++) {
      if (score >= grading[i].minScore) {
        return grading[i].stars;
      }
    }
    return 0;
  }

  // วาดดาว 3 ดวง (ถ้า starCount = 0 จะเป็นดาวว่างทั้งหมด)
  drawStars(centerX, y, starCount) {
    const spacing = 75;
    const startX = centerX - spacing;
    for (let i = 0; i < 3; i++) {
      const key = i < starCount ? "starFull" : "starEmpty";
      const star = this.add.image(startX + i * spacing, y, key).setScale(0.45);
      if (i < starCount) {
        this.tweens.add({
          targets: star,
          scale: 0.5,
          duration: 300,
          yoyo: true,
          delay: i * 150
        });
      }
    }
  }
}