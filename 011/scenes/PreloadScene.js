// ============================================================
// PreloadScene.js
// หน้าที่: โหลด Assets และสร้าง Animation
// ============================================================

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.gameData = this.registry.get("gameData");
    const frameSizes = this.registry.get("frameSizes");
    const { spritesheets, images, sounds } = this.gameData.assets;

    this.drawLoadingBar();

    Object.keys(spritesheets).forEach((key) => {
      this.load.spritesheet(key, encodeURI(spritesheets[key]), frameSizes[key]);
    });

    Object.keys(images).forEach((key) => {
      this.load.image(key, encodeURI(images[key]));
    });

    Object.keys(sounds).forEach((key) => {
      this.load.audio(key, encodeURI(sounds[key]));
    });

    this.load.on("loaderror", (file) => {
      console.warn(`โหลดไฟล์ไม่สำเร็จ: ${file.key} (${file.url})`);
    });
  }

  create() {
    this.createSpritesheetAnimations();
    this.scene.start("MenuScene");
  }

  drawLoadingBar() {
    const { width, height } = this.sys.game.config;
    const box = this.add.graphics();
    const bar = this.add.graphics();
    box.fillStyle(0xffffff, 0.2);
    box.fillRect(width / 2 - 150, height / 2 - 20, 300, 30);

    this.load.on("progress", (value) => {
      bar.clear();
      bar.fillStyle(0x4caf50, 1);
      bar.fillRect(width / 2 - 145, height / 2 - 15, 290 * value, 20);
    });

    this.load.on("complete", () => {
      bar.destroy();
      box.destroy();
    });
  }

  // [แก้ - ข้อ 3] สร้าง animation โดยอ่านค่า fps จาก game-data.json แทนการฝังเลขในโค้ด
  // ให้ปรับความเร็วแอนิเมชันได้จากไฟล์ data อย่างเดียว ไม่ต้องแก้ logic
  createSpritesheetAnimations() {
    const cfg = this.gameData.config;
    const frameSizes = this.registry.get("frameSizes");

    Object.keys(frameSizes).forEach((key) => {
      const fps = (key === "bin") ? cfg.binAnimFps : cfg.itemAnimFps;

      this.anims.create({
        key: key + "_anim",
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
        frameRate: fps,
        repeat: -1,
      });
    });
  }
}