// ============================================================
// GameScene.js
// หน้าเล่นเกมหลัก: ปรับขยายสเกลถังสารเคมี drum_chemical
// ============================================================

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.gameData = this.registry.get("gameData");
    const cfg = this.gameData.config;
    const { width, height } = this.sys.game.config;

    this.score = 0;
    this.hp = cfg.startHP;
    this.timeLeft = cfg.gameDuration;
    this.spawnInterval = cfg.spawnIntervalStart;
    this.isPaused = false;
    this.isGameOver = false;
    this.warningPlayed = false;
    this.warningPlayedSecond = false;

    this.combo = 0;
    this.comboMultiplier = 1;
    this.comboResetEvent = null;

    this.add.image(width / 2, height / 2, "background").setDisplaySize(width, height);

    this.createPlayer();
    this.createHUD();
    this.createComboUI();
    this.createPauseButton();
    this.createSoundToggle();
    this.createControls();

    this.fallingGroup = this.physics.add.group();
    this.physics.add.overlap(this.player, this.fallingGroup, this.handleCollision, null, this);

    this.spawnTimerEvent = this.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnItem,
      callbackScope: this,
      loop: true
    });

    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true
    });
  }

  createPlayer() {
    const { width, height } = this.sys.game.config;
    this.player = this.physics.add.sprite(width / 2, height - 110, "bin");
    this.player.setCollideWorldBounds(true);
    this.player.body.allowGravity = false;
    this.player.setScale(0.55);
    this.player.play("bin_anim");

    const hitboxWidth = this.player.width * 0.45;
    const hitboxHeight = this.player.height * 0.25;
    this.player.body.setSize(hitboxWidth, hitboxHeight);
    this.player.body.setOffset((this.player.width - hitboxWidth) / 2, this.player.height * 0.15);
  }

  createControls() {
    const { width } = this.sys.game.config;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey("A");
    this.keyD = this.input.keyboard.addKey("D");

    this.input.on("pointermove", (pointer) => {
      if (!pointer.isDown || this.isPaused || this.isGameOver) return;
      this.player.x = Phaser.Math.Clamp(pointer.x, 50, width - 50);
    });
    this.input.on("pointerdown", (pointer) => {
      if (this.isPaused || this.isGameOver) return;
      if (pointer.y < 150 && pointer.x > width - 100) return;
      this.player.x = Phaser.Math.Clamp(pointer.x, 50, width - 50);
    });
  }

  createHUD() {
    const { width } = this.sys.game.config;

    // --- 1. Panel เวลา ---
    const timeBg = this.add.graphics();
    timeBg.fillStyle(0xffffff, 0.95);
    timeBg.fillRoundedRect(15, 15, 140, 44, 22);
    timeBg.lineStyle(3, 0x4caf50, 1);
    timeBg.strokeRoundedRect(15, 15, 140, 44, 22);
    timeBg.setDepth(100);

    this.add.image(36, 37, "clockIcon").setScale(0.22).setDepth(100);
    this.timerText = this.add.text(60, 37, `${this.timeLeft}s`, {
      fontSize: "22px",
      fontFamily: "'Kanit', sans-serif",
      color: "#2e7d32",
      fontStyle: "bold"
    }).setOrigin(0, 0.5).setDepth(100);

    // --- 2. Panel คะแนน ---
    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0xffffff, 0.95);
    scoreBg.fillRoundedRect(15, 68, 140, 44, 22);
    scoreBg.lineStyle(3, 0x4caf50, 1);
    scoreBg.strokeRoundedRect(15, 68, 140, 44, 22);
    scoreBg.setDepth(100);

    this.add.image(36, 90, "recycleIcon").setScale(0.22).setDepth(100);
    this.scoreText = this.add.text(60, 90, `${this.score}`, {
      fontSize: "22px",
      fontFamily: "'Kanit', sans-serif",
      color: "#2e7d32",
      fontStyle: "bold"
    }).setOrigin(0, 0.5).setDepth(100);

    // --- 3. Panel หัวใจ ---
    // [แก้ - ข้อ 5] ลดสเกลไอคอนหัวใจจาก 0.35 -> 0.22 ให้เท่าไอคอนนาฬิกา/รีไซเคิล
    // และลดระยะห่างต่อดวงจาก 38 -> 26 ให้สมส่วนกับขนาดใหม่
    const heartScale = 0.22;
    const heartSpacing = 26;
    const heartsPanelWidth = heartSpacing * this.hp + 22;
    const heartsPanelX = width - heartsPanelWidth - 15;

    const heartBg = this.add.graphics();
    heartBg.fillStyle(0xffffff, 0.95);
    heartBg.fillRoundedRect(heartsPanelX, 15, heartsPanelWidth, 44, 22);
    heartBg.lineStyle(3, 0xff6b81, 1);
    heartBg.strokeRoundedRect(heartsPanelX, 15, heartsPanelWidth, 44, 22);
    heartBg.setDepth(100);

    this.hearts = [];
    for (let i = 0; i < this.hp; i++) {
      const heart = this.add.image(heartsPanelX + 20 + i * heartSpacing, 37, "heartIcon").setScale(heartScale).setDepth(100);
      this.hearts.push(heart);
    }
  }

  createComboUI() {
    const { width } = this.sys.game.config;
    this.comboText = this.add.text(width / 2, 50, "", {
      fontSize: "26px",
      fontFamily: "'Kanit', sans-serif",
      fontStyle: "bold",
      color: "#ff9800",
      stroke: "#ffffff",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
  }

  createPauseButton() {
    const { width } = this.sys.game.config;
    const y = 125;

    const btnBg = this.add.circle(width - 38, y, 22, 0xffffff, 0.95)
      .setStrokeStyle(3, 0x4caf50)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);

    this.add.text(width - 38, y, "⏸", { fontSize: "20px", color: "#2e7d32" }).setOrigin(0.5).setDepth(100);

    btnBg.on("pointerdown", () => {
      playSoundSafe(this, "click");
      this.time.delayedCall(80, () => this.togglePause());
    });
    btnBg.on("pointerover", () => btnBg.setFillStyle(0xe8f5e9, 1));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0xffffff, 0.95));
  }

  // [ใหม่ - ข้อ 2] ปุ่มเปิด-ปิดเสียงในหน้าเล่นเกม วางไว้ใต้ปุ่ม Pause
  // ใช้ texture เดียวกับ MenuScene (btnSoundOn/btnSoundOff) และผูกกับ this.sound.mute
  // ตัวเดียวกับที่ MenuScene ใช้ ดังนั้นสถานะเปิด-ปิดจะซิงค์กันข้ามฉากโดยอัตโนมัติ
  createSoundToggle() {
    const { width } = this.sys.game.config;
    const x = width - 38;
    const y = 182; // ใต้ปุ่ม Pause (y=125, รัศมี 22) เว้นระยะพอไม่ให้ชนกัน

    const getTextureKey = () => (this.sound.mute ? "btnSoundOn" : "btnSoundOff");

    this.soundToggleBtn = this.add.image(x, y, getTextureKey())
      .setDisplaySize(44, 44)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);

    this.soundToggleBtn.on("pointerdown", () => {
      this.sound.mute = !this.sound.mute;
      this.soundToggleBtn.setTexture(getTextureKey());

      if (!this.sound.mute) {
        playSoundSafe(this, "click");
      }
    });
  }

  spawnItem() {
    if (this.isPaused || this.isGameOver) return;
    const cfg = this.gameData.config;
    const { width } = this.sys.game.config;

    const isHazard = Math.random() < cfg.hazardChance;
    const pool = isHazard ? this.gameData.hazards : this.gameData.collectibles;
    const itemDef = Phaser.Utils.Array.GetRandom(pool);

    const x = Phaser.Math.Between(50, width - 50);
    const item = this.fallingGroup.create(x, -50, itemDef.spriteKey);
    item.setDepth(10); // ตั้งค่า Layer ให้ของตกลงมาอยู่หลัง UI ทั้งหมด
    item.play(itemDef.spriteKey + "_anim");

    // [แก้ - ข้อ 4] หักลบ gravity ต่อไอเทมตามค่า config เพื่อลดความเร็วตกลงมาเล็กน้อย
    // (บวกลบจาก world gravity โดยไม่ต้องแก้ physics config หลักตอนสร้าง Phaser.Game)
    item.body.setGravityY(cfg.itemFallGravityOffset || 0);

    // 🎯 [ปรับแต่งสเกลขนาดไอเทม]
    let itemScale = 0.32;
    const key = itemDef.spriteKey.toLowerCase();

    if (key.includes("drum") || key.includes("chemical")) {
      itemScale = 0.48; // 🎯 ถังสารเคมี: ปรับให้ใหญ่ขึ้นเด่นชัด
    } else if (key.includes("poison")) {
      itemScale = 0.25; // ขวดพิษ: ขนาดเล็ก
    } else if (key.includes("bottle")) {
      itemScale = 0.28; // ขวดอื่นๆ: ขนาดปานกลาง
    } else if (key.includes("paper") || key.includes("box")) {
      itemScale = 0.42; // ลังกระดาษ: ขนาดใหญ่
    } else {
      itemScale = 0.32; // กระป๋อง
    }

    item.setScale(itemScale);

    // คำนวณ Hitbox ตามขนาดสเกลใหม่
    const itemHitWidth = item.width * 0.4;
    const itemHitHeight = item.height * 0.4;
    item.body.setSize(itemHitWidth, itemHitHeight);
    item.body.setOffset((item.width - itemHitWidth) / 2, (item.height - itemHitHeight) / 2);

    item.itemType = isHazard ? "hazard" : "collectible";
    item.itemDef = itemDef;
  }

  update() {
    if (this.isPaused || this.isGameOver) return;

    const cfg = this.gameData.config;
    let vx = 0;
    if (this.cursors.left.isDown || this.keyA.isDown) vx = -cfg.playerSpeed;
    else if (this.cursors.right.isDown || this.keyD.isDown) vx = cfg.playerSpeed;
    this.player.setVelocityX(vx);

    this.cleanupFallingItems();
  }

  cleanupFallingItems() {
    const { height } = this.sys.game.config;
    const items = this.fallingGroup.getChildren();

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item && item.active && item.y > height + 60) {
        item.destroy();
      }
    }
  }

  handleCollision(player, item) {
    if (this.isGameOver || !item.active) return;

    if (item.itemType === "collectible") {
      this.registerCombo();

      const points = item.itemDef.points * this.comboMultiplier;
      this.score += points;
      this.scoreText.setText(`${this.score}`);
      playSoundSafe(this, "getRecycle");

      const scoreLabel = this.comboMultiplier > 1 ? `+${points} (x${this.comboMultiplier})` : `+${points}`;
      this.showFloatingScore(item.x, item.y, scoreLabel, "#2e7d32");
    } else {
      this.resetCombo();
      this.hp -= item.itemDef.damage;
      playSoundSafe(this, "hitPoison");
      this.flashRed();
      this.updateHearts();
      if (this.hp <= 0) {
        this.endGame(false);
      }
    }
    item.destroy();
  }

  showFloatingScore(x, y, message, color) {
    const floatText = this.add.text(x, y, message, {
      fontSize: "24px",
      fontFamily: "'Kanit', sans-serif",
      fontStyle: "bold",
      color: color,
      stroke: "#ffffff",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: floatText,
      y: y - 70,
      alpha: 0,
      duration: 700,
      ease: "Cubic.Out",
      onComplete: () => floatText.destroy()
    });
  }

  registerCombo() {
    const comboCfg = this.gameData.config.combo;
    this.combo++;

    const newMultiplier = Math.min(comboCfg.maxMultiplier, 1 + Math.floor(this.combo / comboCfg.comboPerLevel));
    if (newMultiplier !== this.comboMultiplier) {
      this.comboMultiplier = newMultiplier;
      this.pulseComboText();
    }

    if (this.comboMultiplier > 1) {
      this.comboText.setText(`COMBO x${this.comboMultiplier}!`).setAlpha(1);
    }

    if (this.comboResetEvent) this.comboResetEvent.remove(false);
    this.comboResetEvent = this.time.delayedCall(comboCfg.windowMs, () => this.resetCombo());
  }

  resetCombo() {
    this.combo = 0;
    this.comboMultiplier = 1;
    if (this.comboResetEvent) {
      this.comboResetEvent.remove(false);
      this.comboResetEvent = null;
    }
    if (this.comboText) this.comboText.setAlpha(0);
  }

  pulseComboText() {
    this.tweens.add({
      targets: this.comboText,
      scale: { from: 1.4, to: 1 },
      duration: 250,
      ease: "Back.Out"
    });
  }

  updateHearts() {
    this.hearts.forEach((heart, i) => {
      if (i >= this.hp) heart.setTint(0xaaaaaa).setAlpha(0.3);
    });
  }

  flashRed() {
    const { width, height } = this.sys.game.config;
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0.35);
    this.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() });
  }

  tickTimer() {
    if (this.isPaused || this.isGameOver) return;
    const cfg = this.gameData.config;

    this.timeLeft--;
    this.timerText.setText(`${this.timeLeft}s`);

    if (this.timeLeft <= cfg.timeWarningAt && this.timeLeft > 0) {
      this.timerText.setColor("#ff0000");
      this.tweens.add({ targets: this.timerText, scale: 1.25, duration: 200, yoyo: true });

      if (!this.warningPlayed) {
        this.warningPlayed = true;
        playSoundSafe(this, "timeWarning");
      }

      if (this.timeLeft === cfg.timeWarningAt - 3 && !this.warningPlayedSecond) {
        this.warningPlayedSecond = true;
        playSoundSafe(this, "timeWarning");
      }
    }

    this.spawnInterval = Math.max(cfg.spawnIntervalMin, this.spawnInterval * cfg.spawnIntervalDecreaseRate);
    this.spawnTimerEvent.delay = this.spawnInterval;

    if (this.timeLeft <= 0) {
      this.endGame(true);
    }
  }

  togglePause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.anims.pauseAll();
      this.tweens.pauseAll();
      this.sound.pauseAll();
      this.spawnTimerEvent.paused = true;
      this.countdownEvent.paused = true;
      if (this.comboResetEvent) this.comboResetEvent.paused = true;
      this.showPauseOverlay();
    } else {
      this.physics.resume();
      this.anims.resumeAll();
      this.tweens.resumeAll();
      this.sound.resumeAll();
      this.spawnTimerEvent.paused = false;
      this.countdownEvent.paused = false;
      if (this.comboResetEvent) this.comboResetEvent.paused = false;
      this.hidePauseOverlay();
    }
  }

  showPauseOverlay() {
    const { width, height } = this.sys.game.config;
    const text = this.gameData.text;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65).setDepth(200);
    const label = this.add.text(width / 2, height / 2 - 110, text.pausedText, {
      fontSize: "36px",
      fontFamily: "'Kanit', sans-serif",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(200);

    const resumeBtn = create3DButton(this, width / 2, height / 2, 220, 60, text.resumeButton, () => this.togglePause(), {
      topColor: 0x4caf50, bottomColor: 0x2e7d32, fontSize: "24px"
    });
    if (resumeBtn.setDepth) resumeBtn.setDepth(200);

    const quitBtn = create3DButton(this, width / 2, height / 2 + 85, 220, 60, text.quitButton, () => {
      this.sound.resumeAll();
      this.anims.resumeAll();
      this.scene.start("MenuScene");
    }, {
      topColor: 0xf44336, bottomColor: 0xc62828, fontSize: "24px"
    });
    if (quitBtn.setDepth) quitBtn.setDepth(200);

    this.pauseOverlayElements = [overlay, label, resumeBtn, quitBtn];
  }

  hidePauseOverlay() {
    if (!this.pauseOverlayElements) return;
    this.pauseOverlayElements.forEach((el) => el.destroy());
    this.pauseOverlayElements = null;
  }

  endGame(isWin) {
    this.isGameOver = true;
    this.spawnTimerEvent.remove();
    this.countdownEvent.remove();
    if (this.comboResetEvent) this.comboResetEvent.remove(false);
    this.physics.pause();
    playSoundSafe(this, isWin ? "win" : "lose");

    this.time.delayedCall(800, () => {
      this.scene.start("GameOverScene", { score: this.score, isWin: isWin });
    });
  }
}