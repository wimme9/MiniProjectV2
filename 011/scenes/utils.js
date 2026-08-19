// ============================================================
// utils.js
// ฟังก์ชันช่วยเหลือ: เช็คเสียง + สร้างปุ่ม 3D โค้งมนสุดสวยงาม
// ============================================================

function playSoundSafe(scene, key, config) {
  if (scene.cache.audio.exists(key)) {
    scene.sound.play(key, config);
  } else {
    console.warn(`เล่นเสียงไม่ได้ (ไม่พบใน cache): ${key}`);
  }
}

// สร้างปุ่มสไตล์ 3D โค้งมน มีชั้นเงา และเอฟเฟกต์กด
function create3DButton(scene, x, y, width, height, text, onClick, options = {}) {
  const topColor = options.topColor || 0x4caf50;
  const bottomColor = options.bottomColor || 0x2e7d32;
  const textColor = options.textColor || '#ffffff';
  const fontSize = options.fontSize || '26px';
  const radius = options.radius || 22;

  const container = scene.add.container(x, y);

  // ชั้นเงา / ฐานปุ่มด้านล่าง (สร้างมิติ 3D)
  const bottomBg = scene.add.graphics();
  bottomBg.fillStyle(bottomColor, 1);
  bottomBg.fillRoundedRect(-width / 2, -height / 2 + 6, width, height, radius);

  // ชั้นหน้าปุ่มด้านบน
  const topBg = scene.add.graphics();
  topBg.fillStyle(topColor, 1);
  topBg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  topBg.lineStyle(3, 0xffffff, 0.9);
  topBg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);

  // ข้อความบนปุ่ม
  const btnText = scene.add.text(0, -2, text, {
    fontSize: fontSize,
    fontFamily: "'Kanit', sans-serif",
    fontStyle: 'bold',
    color: textColor
  }).setOrigin(0.5);

  // [แก้บั๊ก] ตัวรับการคลิก - เดิมสร้างด้วยพิกัดโลก (x, y) แยกจาก container
  // ทำให้เวลา container.destroy() ตัว hitZone นี้ไม่ถูกลบไปด้วย (ค้างอยู่บนจอ
  // มองไม่เห็นแต่ยังบังการคลิกของ UI อื่นที่อยู่ตำแหน่งเดียวกัน)
  // แก้โดยสร้างที่พิกัด local (0, 0) แล้ว container.add() ให้เป็นลูกจริงๆ
  // ผูกวงจรชีวิตเข้ากับ container ไปเลย ปิดพร้อมกันเสมอ
  const hitZone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });

  container.add([bottomBg, topBg, btnText, hitZone]);

  hitZone.on('pointerdown', () => {
    playSoundSafe(scene, 'click');
    // เอฟเฟกต์ปุ่มกดลง
    topBg.y = 4;
    btnText.y = 2;
    scene.time.delayedCall(100, () => {
      topBg.y = 0;
      btnText.y = -2;
      onClick();
    });
  });

  hitZone.on('pointerover', () => {
    topBg.clear();
    topBg.fillStyle(options.hoverColor || 0x66bb6a, 1);
    topBg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    topBg.lineStyle(3, 0xffffff, 1);
    topBg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  });

  hitZone.on('pointerout', () => {
    topBg.clear();
    topBg.fillStyle(topColor, 1);
    topBg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    topBg.lineStyle(3, 0xffffff, 0.9);
    topBg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  });

  return container;
}