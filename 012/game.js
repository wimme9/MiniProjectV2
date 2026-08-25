/* ============================================================
   TINY RUNNER - main game script
   ทุกค่าที่ปรับแต่งได้ (ความเร็ว, คะแนน, สไปรต์, HP ฯลฯ) อยู่ใน data.json
   ============================================================ */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const VW = canvas.width;
const VH = canvas.height;

const menuScreen = document.getElementById('menu-screen');
const hud = document.getElementById('hud');
const gameoverScreen = document.getElementById('gameover-screen');
const startBtn = document.getElementById('startBtn');
const replayBtn = document.getElementById('replayBtn');
const scoreValueEl = document.getElementById('scoreValue');
const hpDisplayEl = document.getElementById('hpDisplay');
const buffDisplayEl = document.getElementById('buffDisplay');
const finalScoreEl = document.getElementById('finalScore');
const finalHighScoreEl = document.getElementById('finalHighScore');
const menuHighScoreEl = document.getElementById('menuHighScore');
const muteBtn = document.getElementById('muteBtn');

const HIGH_SCORE_KEY = 'tinyRunnerHighScore';
const MUTE_KEY = 'tinyRunnerMuted';

let CONFIG = null;
let images = {};           // id -> HTMLImageElement (or null for pit)
let sfxAudio = {};         // id -> HTMLAudioElement (or null if missing)
let bgmAudio = null;
let isMuted = localStorage.getItem(MUTE_KEY) === '1';
let state = 'LOADING';     // LOADING | MENU | PLAYING | GAMEOVER
let lastTime = 0;

/* ---------- runtime game state (reset each play) ---------- */
let player, world, entities, score, hp, distancePx, elapsed;
let buffs = {}; // { magnet: secondsLeft, shoe: secondsLeft }
let invincibleTimer = 0;

/* ============================================================
   LOAD CONFIG + ASSETS
   ============================================================ */
async function init() {
  const res = await fetch('data.json');
  CONFIG = await res.json();

  const toLoad = [];
  if (CONFIG.background.image) toLoad.push(['bg', CONFIG.background.image]);
  toLoad.push(['player', CONFIG.player.sprite]);
  CONFIG.obstacles.forEach(o => { if (o.image) toLoad.push([o.id, o.image]); });
  CONFIG.collectibles.forEach(c => { if (c.image) toLoad.push([c.id, c.image]); });

  await Promise.all(toLoad.map(([id, src]) => loadImage(id, src)));

  await loadAudioAssets();
  updateMuteButton();

  menuHighScoreEl.textContent = getHighScore();
  goToMenu();
  requestAnimationFrame(loop);
}

function loadAudioAssets() {
  const a = CONFIG.audio;
  if (!a) return Promise.resolve();

  const jobs = [];

  if (a.bgm) {
    bgmAudio = new Audio(a.bgm);
    bgmAudio.loop = true;
    bgmAudio.volume = a.bgmVolume ?? 0.5;
    bgmAudio.muted = isMuted;
    bgmAudio.onerror = () => { console.warn('ไม่พบไฟล์เพลง:', a.bgm); bgmAudio = null; };
    console.log('กำลังโหลดเพลง:', a.bgm, '(isMuted =', isMuted, ')');
  }

  Object.entries(a.sfx || {}).forEach(([id, src]) => {
    jobs.push(new Promise((resolve) => {
      const audio = new Audio(src);
      audio.volume = a.sfxVolume ?? 0.7;
      audio.oncanplaythrough = () => { sfxAudio[id] = audio; console.log('โหลดเสียงสำเร็จ:', id, src); resolve(); };
      audio.onerror = () => { console.warn('ไม่พบไฟล์เสียง:', src); sfxAudio[id] = null; resolve(); };
    }));
  });

  return Promise.all(jobs);
}

function playSfx(id) {
  const base = sfxAudio[id];
  if (!base || isMuted) return;
  const node = base.cloneNode(); // clone เพื่อให้เล่นซ้อนกันได้ (เช่น เก็บเหรียญรัวๆ)
  node.volume = base.volume;
  node.play().catch((err) => console.warn('เล่นเสียง sfx ไม่ได้ (' + id + '):', err.message));
}

function playBgm() {
  if (!bgmAudio) { console.warn('ไม่มี bgmAudio (ไฟล์เพลงโหลดไม่สำเร็จ)'); return; }
  bgmAudio.currentTime = 0;
  bgmAudio.muted = isMuted;
  bgmAudio.play().catch((err) => console.warn('เล่นเพลง bgm ไม่ได้:', err.message));
}

function stopBgm() {
  if (!bgmAudio) return;
  bgmAudio.pause();
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem(MUTE_KEY, isMuted ? '1' : '0');
  if (bgmAudio) bgmAudio.muted = isMuted;
  updateMuteButton();
}

function updateMuteButton() {
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
}

function loadImage(id, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images[id] = img; resolve(); };
    img.onerror = () => {
      console.warn('ไม่พบรูปภาพ (จะวาดเป็นกล่องสีแทน):', src);
      images[id] = null;
      resolve();
    };
    img.src = src;
  });
}

/* ============================================================
   SCENE SWITCHING
   ============================================================ */
function goToMenu() {
  state = 'MENU';
  menuScreen.classList.remove('hidden');
  hud.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
}

function startGame() {
  state = 'PLAYING';
  menuScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  resetGame();
  playBgm();
}

function endGame() {
  state = 'GAMEOVER';
  hud.classList.add('hidden');
  stopBgm();
  playSfx('gameover');
  const finalScore = Math.floor(score);
  const hi = Math.max(finalScore, getHighScore());
  setHighScore(hi);
  finalScoreEl.textContent = finalScore;
  finalHighScoreEl.textContent = hi;
  gameoverScreen.classList.remove('hidden');
}

function getHighScore() {
  return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
}
function setHighScore(v) {
  localStorage.setItem(HIGH_SCORE_KEY, String(v));
}

/* ============================================================
   RESET / NEW RUN
   ============================================================ */
function resetGame() {
  const p = CONFIG.player;
  const groundY = CONFIG.ground.y;

  player = {
    x: p.startX,
    y: groundY - p.drawHeight,
    vy: 0,
    w: p.drawWidth,
    h: p.drawHeight,
    onGround: true,
    action: 'run',      // run | jump | slide
    slideTimer: 0,
    animFrame: 0,
    animTimer: 0
  };

  world = { speed: CONFIG.speed.base, bgOffset: 0 };
  entities = [];
  score = 0;
  hp = CONFIG.hp.max;
  distancePx = 0;
  elapsed = 0;
  buffs = { magnet: 0, shoe: 0 };
  invincibleTimer = 0;
  spawnTimerPx = 400; // ดีเลย์เล็กน้อยก่อนวัตถุชิ้นแรกจะเกิด

  updateHUD();
}

/* ============================================================
   INPUT
   ============================================================ */
window.addEventListener('keydown', (e) => {
  if (state !== 'PLAYING') return;
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    tryJump();
  } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    e.preventDefault();
    trySlide();
  }
});

// touch support: tap upper half = jump, lower half = slide
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'PLAYING') return;
  const rect = canvas.getBoundingClientRect();
  const relY = (e.clientY - rect.top) / rect.height;
  if (relY < 0.5) tryJump(); else trySlide();
});

startBtn.addEventListener('click', startGame);
replayBtn.addEventListener('click', startGame);
muteBtn.addEventListener('click', toggleMute);

function tryJump() {
  if (player.onGround && player.action !== 'slide') {
    player.vy = CONFIG.player.jumpVelocity;
    player.onGround = false;
    player.action = 'jump';
    playSfx('jump');
  }
}

function trySlide() {
  if (player.onGround && player.action !== 'jump') {
    player.action = 'slide';
    player.slideTimer = CONFIG.player.slideDuration;
  }
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
function loop(t) {
  const dt = Math.min((t - lastTime) / 1000, 1 / 30) || 0;
  lastTime = t;

  if (state === 'PLAYING') {
    update(dt);
  }
  render();

  requestAnimationFrame(loop);
}

/* ============================================================
   UPDATE
   ============================================================ */
let spawnTimerPx = 0; // นับถอยหลังระยะทาง (px) จนกว่าจะสร้างวัตถุถัดไป

function update(dt) {
  elapsed += dt;

  // difficulty ramp
  const sp = CONFIG.speed;
  world.speed = Math.min(sp.base + sp.increasePerSecond * elapsed, sp.maxSpeed);
  let effectiveSpeed = world.speed;
  if (buffs.shoe > 0) effectiveSpeed *= CONFIG.powerups.shoe.speedMultiplier;

  world.bgOffset = (world.bgOffset + effectiveSpeed * dt) % VW;
  distancePx += effectiveSpeed * dt;

  updatePlayerPhysics(dt);
  updateBuffs(dt);
  updateEntities(dt, effectiveSpeed);

  spawnTimerPx -= effectiveSpeed * dt;
  if (spawnTimerPx <= 0) {
    spawnEntity();
    const s = CONFIG.spawn;
    spawnTimerPx = s.minGapPx + Math.random() * (s.maxGapPx - s.minGapPx);
  }

  checkCollisions();
  updateScoreFromDistance();

  if (invincibleTimer > 0) invincibleTimer -= dt;

  updateHUD();

  if (elapsed >= CONFIG.meta.timeLimit) {
    endGame();
  }
}

function updatePlayerPhysics(dt) {
  const p = CONFIG.player;
  const groundY = CONFIG.ground.y;

  if (!player.onGround) {
    player.vy += p.gravity * dt;
    player.y += player.vy * dt;
    if (player.y >= groundY - player.h) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.onGround = true;
      player.action = 'run';
    }
  }

  if (player.action === 'slide') {
    player.slideTimer -= dt;
    if (player.slideTimer <= 0) {
      player.action = 'run';
    }
  }

  // animation
  const anim = p.animations[player.action] || p.animations.run;
  player.animTimer += dt;
  const frameDuration = 1 / anim.fps;
  if (player.animTimer >= frameDuration) {
    player.animTimer = 0;
    player.animFrame = (player.animFrame + 1) % anim.frames;
  }
}

function updateBuffs(dt) {
  ['magnet', 'shoe'].forEach(k => {
    if (buffs[k] > 0) {
      buffs[k] -= dt;
      if (buffs[k] < 0) buffs[k] = 0;
    }
  });
}

function updateEntities(dt, effectiveSpeed) {
  const magnetCfg = CONFIG.powerups.magnet;

  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];

    // magnet pulls nearby coins toward player
    if (buffs.magnet > 0 && e.kind === 'collectible' && e.def.type === 'coin') {
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;
      const dx = px - ex, dy = py - ey;
      const dist = Math.hypot(dx, dy);
      if (dist < magnetCfg.pullRadius) {
        e.x += (dx / dist) * magnetCfg.pullSpeed * dt;
        e.y += (dy / dist) * magnetCfg.pullSpeed * dt;
      } else {
        e.x -= effectiveSpeed * dt;
      }
    } else {
      e.x -= effectiveSpeed * dt;
    }

    if (e.x + e.w < -50) entities.splice(i, 1);
  }
}

function pickWeighted(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [key, w] of entries) {
    if (roll < w) return key;
    roll -= w;
  }
  return entries[entries.length - 1][0];
}

function spawnEntity() {
  const s = CONFIG.spawn;
  const groundY = CONFIG.ground.y;
  const spawnX = VW + 40;

  const roll = Math.random();
  if (roll < s.obstacleChance) {
    const def = CONFIG.obstacles[Math.floor(Math.random() * CONFIG.obstacles.length)];

    // FIX: สิ่งกีดขวางติดพื้นแบบบาง (lowToGround เช่นหลุม) ต้องมี hitbox ที่ "ทับ"
    // กับกล่องชนของตัวละครจริง เพราะกล่องชนของตัวละคร (getPlayerHitbox) จะมีขอบล่าง
    // สูงกว่าเส้นพื้นเล็กน้อยเสมอ (หักด้วย hitboxInset ทั้งท่าวิ่ง/สไลด์) ถ้าตั้ง top ของ
    // หลุมไว้ที่ groundY พอดีแบบเดิม สองกล่องจะ "แตะกันพอดี" แต่ไม่ทับกัน -> aabb() ใช้ >
    // แบบเข้ม เลยไม่นับว่าชน จึงต้องขยับขอบบนของหลุมให้สูงขึ้นมาทับซ้อนกับตัวละครเสมอ
    const isLowToGround = !!def.lowToGround;
    const inset = CONFIG.player.hitboxInset;
    const overlapBuffer = inset + 2; // เผื่อชนแน่นอนทั้งท่าวิ่งและสไลด์
    const hitY = isLowToGround ? (groundY - overlapBuffer) : groundY - def.groundOffset - def.height;
    const hitH = isLowToGround ? (VH - hitY) : def.height;

    entities.push({
      kind: 'obstacle',
      def,
      x: spawnX,
      y: hitY,
      w: def.width,
      h: hitH
    });
  } else {
    const typeId = pickWeighted(s.collectibleWeights);
    const def = CONFIG.collectibles.find(c => c.id === typeId) || CONFIG.collectibles[0];
    const above = s.collectibleHeightsAboveGround[
      Math.floor(Math.random() * s.collectibleHeightsAboveGround.length)
    ];

    if (def.id === 'coin' && Math.random() < s.coinRowChance) {
      // spawn a short trail of coins together instead of a single one
      for (let i = 0; i < s.coinRowCount; i++) {
        entities.push(makeCollectible(def, spawnX + i * s.coinRowSpacingPx, groundY - above - def.height));
      }
    } else {
      entities.push(makeCollectible(def, spawnX, groundY - above - def.height));
    }
  }
}

function makeCollectible(def, x, y) {
  return { kind: 'collectible', def, x, y, w: def.width, h: def.height, collected: false };
}

function getPlayerHitbox() {
  const p = CONFIG.player;
  const inset = p.hitboxInset;
  let h = player.h - inset * 2;
  let y = player.y + inset;
  if (player.action === 'slide') {
    h = player.h * p.slideHeightRatio;
    y = player.y + (player.h - h);
  }
  return { x: player.x + inset, y, w: player.w - inset * 2, h };
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function checkCollisions() {
  const hitbox = getPlayerHitbox();

  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    if (!aabb(hitbox, e)) continue;

    if (e.kind === 'collectible') {
      if (e.collected) continue;
      e.collected = true;
      applyCollectible(e.def);
      entities.splice(i, 1);
    } else if (e.kind === 'obstacle') {
      if (e.def.instantDeath) {
        hp = 0;
        entities.splice(i, 1);
        playSfx('hit');
        endGame();
        return;
      }
      if (invincibleTimer <= 0) {
        hp -= e.def.hpDamage;
        invincibleTimer = CONFIG.hp.invincibleAfterHitSeconds;
        entities.splice(i, 1);
        playSfx('hit');
        if (hp <= 0) {
          hp = 0;
          endGame();
          return;
        }
      }
    }
  }
}

function applyCollectible(def) {
  const sc = CONFIG.scoring;
  if (def.type === 'coin') { score += sc.coin; playSfx('coin'); }
  else if (def.type === 'gem') { score += sc.gem; playSfx('gem'); }
  else if (def.type === 'powerup_magnet') { buffs.magnet = CONFIG.powerups.magnet.durationSeconds; playSfx('coin'); }
  else if (def.type === 'powerup_shoe') { buffs.shoe = CONFIG.powerups.shoe.durationSeconds; playSfx('coin'); }
}

let lastMeterMilestone = 0;
function updateScoreFromDistance() {
  const meters = distancePx / CONFIG.scoring.pixelsPerMeter;
  const milestone = Math.floor(meters / 100);
  if (milestone > lastMeterMilestone) {
    lastMeterMilestone = milestone;
    score += CONFIG.scoring.per100Meters;
  }
}

/* ============================================================
   HUD
   ============================================================ */
function updateHUD() {
  scoreValueEl.textContent = Math.floor(score);
  hpDisplayEl.textContent = '❤️'.repeat(Math.max(hp, 0)) + '🖤'.repeat(Math.max(CONFIG.hp.max - hp, 0));

  buffDisplayEl.innerHTML = '';
  if (buffs.magnet > 0) buffDisplayEl.appendChild(buffPill(`แม่เหล็ก ${buffs.magnet.toFixed(1)}s`));
  if (buffs.shoe > 0) buffDisplayEl.appendChild(buffPill(`ความเร็ว ${buffs.shoe.toFixed(1)}s`));
}

function buffPill(text) {
  const d = document.createElement('div');
  d.className = 'buff-pill';
  d.textContent = text;
  return d;
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  ctx.clearRect(0, 0, VW, VH);

  if (state === 'LOADING') {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('กำลังโหลด...', VW / 2, VH / 2);
    return;
  }

  drawBackground();

  if (state === 'PLAYING' || state === 'GAMEOVER') {
    drawGround();
    entities.forEach(drawEntity);
    drawPlayer();
  }
}

function drawBackground() {
  const bg = images.bg;
  const offset = world ? world.bgOffset : 0;
  if (bg) {
    const scale = VH / bg.height;
    const w = bg.width * scale;
    let x = -offset * (w / VW) % w;
    for (let dx = x - w; dx < VW; dx += w) {
      ctx.drawImage(bg, dx, 0, w, VH);
    }
  } else {
    ctx.fillStyle = '#4fa8d8';
    ctx.fillRect(0, 0, VW, VH);
  }
}

function drawGround() {
  const g = CONFIG.ground;
  ctx.fillStyle = '#6d4c2f';
  ctx.fillRect(0, g.y, VW, VH - g.y);
  ctx.fillStyle = '#3e7d32';
  ctx.fillRect(0, g.y, VW, g.height);
}

function drawEntity(e) {
  const img = images[e.def.id];
  if (e.kind === 'obstacle' && e.def.id === 'pit') {
    // pit: draw as dark gap in the ground
    ctx.fillStyle = '#0d0f1a';
    ctx.fillRect(e.x, CONFIG.ground.y, e.w, VH - CONFIG.ground.y);
    return;
  }
  if (img) {
    ctx.drawImage(img, e.x, e.y, e.w, e.h);
  } else {
    ctx.fillStyle = e.kind === 'obstacle' ? '#d84315' : '#ffd54f';
    ctx.fillRect(e.x, e.y, e.w, e.h);
  }
}

function drawPlayer() {
  if (invincibleTimer > 0 && Math.floor(invincibleTimer * 10) % 2 === 0) return; // blink

  const img = images.player;
  const p = CONFIG.player;
  const anim = p.animations[player.action] || p.animations.run;

  if (img) {
    const frameIndex = anim.startFrame + (player.animFrame % anim.frames);
    const col = frameIndex % p.sheetColumns;
    const row = Math.floor(frameIndex / p.sheetColumns);
    const sx = col * p.frameWidth;
    const sy = row * p.frameHeight;
    
    // วาดด้วยขนาดปกติเสมอ ไม่บีบภาพสไปรต์ให้บี้
    const dw = player.w;
    const dh = player.h;
    
    // คำนวณตำแหน่ง Y ให้ขอบล่างของภาพแตะพื้นพอดี
    let dy = player.y;
    if (player.action === 'slide') {
      // ตอนสไลด์ให้ตำแหน่งอ้างอิงตรงกับกล่องชนสไลด์
      dy = player.y + (player.h - player.h * p.slideHeightRatio);
    }
    
    // ชดเชยระยะลอย (ถ้าตั้ง visualFootPaddingRatio ไว้)
    dy += (p.visualFootPaddingRatio || 0) * dh;

    ctx.drawImage(img, sx, sy, p.frameWidth, p.frameHeight, player.x, dy, dw, dh);
  } else {
    ctx.fillStyle = '#ffffff';
    let h = player.h, y = player.y;
    if (player.action === 'slide') { h = player.h * p.slideHeightRatio; y = player.y + (player.h - h); }
    ctx.fillRect(player.x, y, player.w, h);
  }
}
/* ============================================================
   GO
   ============================================================ */
init();
