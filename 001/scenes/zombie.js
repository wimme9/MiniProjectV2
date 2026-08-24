/**
 * Zombie System & AI Pathfinding Manager with Noise-based Detection & Aggression
 * Supports Zombie 1 & Zombie 2 types with idle, walk, and attack animation cycles,
 * sound hearing calculation, circular detection alert icon meter, chasing, and close-quarters attack.
 */

// Helper functions for bulletproof math and array operations
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// จุดเดินที่กำหนดสำหรับแต่ละโซน
export const ZONE_WALK_PATHS = {
    dataRoom: [
        { x: 37, y: 10 }, { x: 40, y: 10 }, { x: 40, y: 21 }, { x: 40, y: 30 }, { x: 36, y: 30 },
        { x: 50, y: 30 }, { x: 51, y: 21 }, { x: 50, y: 10 }, { x: 58, y: 10 }, { x: 58, y: 21 }, { x: 57, y: 30 }
    ],
    office: [
        { x: 12, y: 13 }, { x: 13, y: 21 }, { x: 11, y: 30 }, { x: 23, y: 31 }, { x: 24, y: 22 },
        { x: 25, y: 11 }, { x: 29, y: 11 }, { x: 19, y: 16 }, { x: 19, y: 23 }, { x: 24, y: 35 }
    ],
    hallway: [
        { x: 36, y: 47 }, { x: 35, y: 61 }, { x: 35, y: 93 }, { x: 36, y: 116 }, { x: 59, y: 116 },
        { x: 86, y: 116 }, { x: 87, y: 106 }, { x: 86, y: 98 }, { x: 103, y: 98 }, { x: 112, y: 100 },
        { x: 111, y: 110 }, { x: 111, y: 116 }, { x: 98, y: 116 }, { x: 117, y: 100 }, { x: 117, y: 82 },
        { x: 117, y: 72 }, { x: 135, y: 71 }, { x: 156, y: 72 }, { x: 116, y: 88 }, { x: 165, y: 81 },
        { x: 166, y: 93 }, { x: 133, y: 100 }, { x: 156, y: 100 }, { x: 161, y: 58 }, { x: 137, y: 58 },
        { x: 122, y: 58 }, { x: 117, y: 66 }, { x: 118, y: 46 }, { x: 99, y: 46 }, { x: 80, y: 46 },
        { x: 72, y: 46 }, { x: 53, y: 46 }, { x: 72, y: 32 }, { x: 72, y: 58 }, { x: 72, y: 72 },
        { x: 48, y: 72 }, { x: 83, y: 73 }
    ],
    lab: [
        { x: 48, y: 82 }, { x: 48, y: 89 }, { x: 59, y: 80 }, { x: 60, y: 94 }, { x: 59, y: 85 },
        { x: 66, y: 85 }, { x: 59, y: 95 }, { x: 47, y: 93 }, { x: 44, y: 106 }, { x: 53, y: 108 },
        { x: 65, y: 108 }, { x: 65, y: 97 }, { x: 74, y: 96 }, { x: 68, y: 104 }, { x: 69, y: 96 },
        { x: 77, y: 108 }, { x: 82, y: 106 }, { x: 80, y: 98 }
    ],
    cafeteria: [
        { x: 93, y: 66 }, { x: 99, y: 66 }, { x: 106, y: 66 }, { x: 108, y: 75 }, { x: 101, y: 75 },
        { x: 95, y: 71 }, { x: 93, y: 78 }, { x: 100, y: 79 }, { x: 108, y: 80 }, { x: 107, y: 88 },
        { x: 99, y: 85 }, { x: 93, y: 87 }, { x: 92, y: 92 }, { x: 100, y: 92 }, { x: 107, y: 91 }
    ],
    kitchen: [
        { x: 92, y: 56 }, { x: 92, y: 59 }, { x: 100, y: 59 }, { x: 98, y: 56 }, { x: 105, y: 55 },
        { x: 110, y: 55 }, { x: 110, y: 60 }, { x: 105, y: 59 }
    ],
    infirmary: [
        { x: 126, y: 81 }, { x: 124, y: 91 }, { x: 136, y: 91 }, { x: 126, y: 87 }, { x: 137, y: 87 },
        { x: 137, y: 92 }, { x: 146, y: 92 }, { x: 130, y: 88 }
    ]
};

export class Zombie {
    constructor(scene, gridX, gridY, type = 1, collisionGrid = null, zoneKey = 'hallway') {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.spawnGridX = gridX;
        this.spawnGridY = gridY;
        this.type = type; // 1 or 2
        this.collisionGrid = collisionGrid;
        this.zoneKey = zoneKey;
        this.zoneSpots = ZONE_WALK_PATHS[zoneKey] || ZONE_WALK_PATHS.hallway;

        const worldX = gridX * 32 + 16;
        const worldY = (gridY + 1) * 32;

        const initialFrame = (type === 1) ? 0 : 40;
        this.sprite = scene.physics.add.sprite(worldX, worldY, 'zombie', initialFrame);
        this.sprite.setScale(0.90);
        this.sprite.body.setSize(26, 22);
        this.sprite.body.setOffset(51, 104);
        this.sprite.body.setCollideWorldBounds(true);

        // ลงทะเบียน Y-sorting อัตโนมัติ
        if (typeof this.scene.registerYSort === 'function') {
            this.scene.registerYSort(this.sprite, true);
        }

        // สร้างไอคอนตกใจและวงกลมตรวจจับบนหัวซอมบี้
        this.alertIcon = scene.add.image(worldX, worldY - 50, 'alert_triangle_icon');
        this.alertIcon.setDisplaySize(18, 18);
        this.alertIcon.setDepth(15600);
        this.alertIcon.setVisible(false);

        this.alertRingGfx = scene.add.graphics();
        this.alertRingGfx.setDepth(15500);

        this.detectionMeter = 0.0; // 0.0 -> 1.0

        this.animPrefix = `zombie${this.type}`;
        this.speed = randInt(58, 70); // ความเร็วเดินลาดตระเวนปกติ
        this.chaseSpeed = 92; // ความเร็วขณะวิ่งไล่ตามเสียงผู้เล่น

        this.state = 'IDLE'; // IDLE, WALK, CHASE, ATTACK
        this.stateTimer = 0;
        this.idleDuration = randInt(3000, 7000);

        this.path = [];
        this.currentWaypointIndex = 0;
        this.stuckTimer = 0;
        this.repathTimer = 0;
        this.attackCooldown = 0;
        this.lastX = this.sprite.x;
        this.lastY = this.sprite.y;
        this.recentSpots = [{ x: gridX, y: gridY }];

        this.playAnim('idle');
    }

    playAnim(name) {
        if (!this.sprite || !this.sprite.active || !this.sprite.anims) return;
        const key = `${this.animPrefix}_${name}`;
        if (this.scene.anims.exists(key) && this.sprite.anims.currentAnim?.key !== key) {
            this.sprite.anims.play(key, true);
        }
    }

    update(time, delta, player = null, playerNoise = 0.35, isHoldingBreath = false) {
        if (!this.sprite || !this.sprite.active || !this.sprite.body) {
            this.cleanVisuals();
            return;
        }

        const dt = (delta !== undefined) ? delta : 16.6;
        this.stateTimer += dt;
        this.repathTimer += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // 1. ตรวจสอบว่าซอมบี้ตัวนี้อยู่ในหน้าจอของผู้เล่นหรือไม่ (On-Screen Detection Only)
        const cam = this.scene.cameras.main;
        const vw = cam ? cam.worldView : null;
        const isZombieOnScreen = vw ? (
            this.sprite.x >= vw.x - 30 &&
            this.sprite.x <= vw.x + vw.width + 30 &&
            this.sprite.y >= vw.y - 30 &&
            this.sprite.y <= vw.y + vw.height + 30
        ) : true;

        // 2. คำนวณระยะห่างระหว่างซอมบี้กับผู้เล่น
        const hasPlayer = (player && player.body && player.active);
        const distToPlayer = hasPlayer ? Math.hypot(player.x - this.sprite.x, player.y - this.sprite.y) : 99999;

        // 3. ตรวจสอบว่ามีประตูปิดกั้นอยู่ระหว่างซอมบี้กับผู้เล่นหรือไม่ (Door Invincible Shield)
        const isBlockedByClosedDoor = hasPlayer && this.isLineBlockedByClosedDoor(
            { x: this.sprite.x, y: this.sprite.y },
            { x: player.x, y: player.y }
        );

        // 4. คำนวณรัศมีการได้ยิน (ลดระยะการได้ยินขณะเดินลงอย่างมาก เพื่อให้ผู้เล่นเดินย่องหลบได้ง่ายขึ้น)
        let hearingRadius = 0;
        if (isZombieOnScreen && !isHoldingBreath && playerNoise > 0.05 && !isBlockedByClosedDoor) {
            // สูตรใหม่: วิ่ง (1.0) -> ~380px (~12 ช่อง), เหนื่อยหอบ (0.8) -> ~227px (~7 ช่อง), เดิน (0.6) -> ~118px (~3.6 ช่อง), ยืนหายใจ (0.35) -> ~34px (~1 ช่อง)
            hearingRadius = 380 * Math.pow(playerNoise, 2.3);
        }

        const canHearPlayer = (distToPlayer <= hearingRadius) && !isBlockedByClosedDoor;

        // 5. การจัดการ State Machine และการตรวจจับ
        if (this.state === 'ATTACK') {
            this.sprite.setVelocity(0, 0);
            this.playAnim('attack');

            if (hasPlayer) {
                this.sprite.setFlipX(player.x < this.sprite.x);
            }

            if (this.stateTimer >= 600) {
                if (hasPlayer && distToPlayer <= 38 && !isHoldingBreath && !isBlockedByClosedDoor) {
                    this.stateTimer = 0;
                } else {
                    this.state = (canHearPlayer && !isHoldingBreath) ? 'CHASE' : 'COOLDOWN';
                    this.stateTimer = 0;
                }
            }
        } else if (this.state === 'CHASE') {
            // ขณะกำลังไล่ล่า: วงกลมจะเต็ม 100% (สีแดง) ตลอดเวลา
            this.detectionMeter = 1.0;

            // ตรวจสอบระยะประชิดเพื่อโจมตี (ห้ามโจมตีทะลุประตูที่ปิดอยู่เด็ดขาด)
            if (distToPlayer <= 36 && !isHoldingBreath && !isBlockedByClosedDoor) {
                this.state = 'ATTACK';
                this.stateTimer = 0;
                this.sprite.setVelocity(0, 0);
                this.playAnim('attack');

                if (typeof this.scene.triggerPlayerDeath === 'function') {
                    this.scene.triggerPlayerDeath();
                }
                return;
            }

            // ตรวจสอบเงื่อนไขการหลบหนีของผู้เล่น (กลั้นหายใจ หรือมีประตูปิดกั้น หรือวิ่งหนีออกนอกระยะ)
            const hasPlayerEscaped = isHoldingBreath || isBlockedByClosedDoor || distToPlayer > 480 || (!isZombieOnScreen && distToPlayer > 360);
            if (hasPlayerEscaped) {
                // หลุดจากการไล่ล่า -> เข้าสู่สถานะ Cooldown (หยุดอยู่กับที่ตรงจุดเดิม และวงกลมค่อยๆ ลดลง)
                this.state = 'COOLDOWN';
                this.sprite.setVelocity(0, 0);
                this.playAnim('idle');
                this.path = [];
            } else {
                // คำนวณเส้นทางวิ่งไล่ล่าผู้เล่นอย่างต่อเนื่องทุกๆ 240ms
                if (this.repathTimer >= 240 && hasPlayer) {
                    this.repathTimer = 0;
                    const curTileX = Math.floor(this.sprite.x / 32);
                    const curTileY = Math.floor((this.sprite.y - 10) / 32);
                    const pTileX = Math.floor(player.x / 32);
                    const pTileY = Math.floor((player.y - 10) / 32);

                    if (this.collisionGrid) {
                        const chasePath = this.collisionGrid.findPath(curTileX, curTileY, pTileX, pTileY, 1500);
                        if (chasePath && chasePath.length > 1) {
                            this.path = chasePath;
                            this.currentWaypointIndex = 1;
                        }
                    }
                }

                this.handleWalking(dt, this.chaseSpeed);
            }
        } else if (this.state === 'COOLDOWN') {
            // ซอมบี้หยุดอยู่กับที่ตรงจุดเดิม มองหาผู้เล่น
            this.sprite.setVelocity(0, 0);
            this.playAnim('idle');

            // วงกลมค่อยๆ ลดระดับลงเรื่อยๆ
            this.detectionMeter = Math.max(0, this.detectionMeter - (dt / 1000) * 0.45);

            // หากผู้เล่นสร้างเสียงดังอีกครั้งก่อนที่วงกลมจะหมด -> กลับไปไล่ล่าทันที
            if (canHearPlayer) {
                this.state = 'CHASE';
                this.detectionMeter = 1.0;
                this.repathTimer = 999;
            } else if (this.detectionMeter <= 0) {
                // วงกลมหมดแล้ว -> เดินกลับไปยังห้องหรือจุดเกิดของตัวเอง (Spawn Room)
                this.returnToSpawnPoint();
            }
        } else if (this.state === 'RETURN_TO_SPAWN') {
            // เดินกลับไปยังห้องเกิด
            this.handleWalking(dt, this.speed);
            const curTileX = Math.floor(this.sprite.x / 32);
            const curTileY = Math.floor((this.sprite.y - 10) / 32);
            if (Math.hypot(curTileX - this.spawnGridX, curTileY - this.spawnGridY) <= 1.5 || this.currentWaypointIndex >= this.path.length) {
                this.finishWalking();
            }
        } else {
            // สถานะปกติ (IDLE / WALK)
            if (canHearPlayer) {
                // ได้ยินเสียง -> เกจวงกลมเพิ่มขึ้นอย่างรวดเร็ว
                this.detectionMeter = Math.min(1.0, this.detectionMeter + (dt / 1000) * 2.2);
                if (this.detectionMeter >= 1.0) {
                    this.state = 'CHASE';
                    this.repathTimer = 999;
                } else {
                    // กำลังสงสัย -> หยุดฟัง
                    this.sprite.setVelocity(0, 0);
                    this.playAnim('idle');
                }
            } else if (this.detectionMeter > 0) {
                // เสียงเงียบไปก่อนเกจเต็ม -> ค่อยๆ ลดเกจลงและหยุดฟัง
                this.detectionMeter = Math.max(0, this.detectionMeter - (dt / 1000) * 0.45);
                this.sprite.setVelocity(0, 0);
                this.playAnim('idle');
            } else if (this.state === 'IDLE') {
                this.sprite.setVelocity(0, 0);
                this.playAnim('idle');

                if (this.stateTimer >= this.idleDuration) {
                    this.pickNewDestination();
                }
            } else if (this.state === 'WALK') {
                this.handleWalking(dt, this.speed);
            }
        }

        // 5. วาดไอคอนเตือนและวงกลมตรวจจับบนหัวซอมบี้
        this.renderDetectionIndicator();
    }

    returnToSpawnPoint() {
        this.stateTimer = 0;
        this.detectionMeter = 0;
        const curTileX = Math.floor(this.sprite.x / 32);
        const curTileY = Math.floor((this.sprite.y - 10) / 32);

        if (this.collisionGrid) {
            const path = this.collisionGrid.findPath(curTileX, curTileY, this.spawnGridX, this.spawnGridY, 2000);
            if (path && path.length > 1) {
                this.path = path;
                this.currentWaypointIndex = 1;
                this.state = 'RETURN_TO_SPAWN';
                this.stuckTimer = 0;
                this.lastX = this.sprite.x;
                this.lastY = this.sprite.y;
                this.playAnim('walk');
                return;
            }
        }
        this.state = 'IDLE';
        this.idleDuration = randInt(2500, 5000);
        this.path = [];
    }

    isLineBlockedByClosedDoor(p1, p2) {
        if (!this.scene || !this.scene.animatedDoors) return false;
        const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y), maxY = Math.max(p1.y, p2.y);

        for (let i = 0; i < this.scene.animatedDoors.length; i++) {
            const door = this.scene.animatedDoors[i];
            if (door && !door.isOpen) {
                const dW = door.tsWidth || 64;
                const dH = door.tsHeight || 64;
                const dLeft = door.worldX;
                const dRight = door.worldX + dW;
                const dTop = door.worldY - dH;
                const dBottom = door.worldY;

                // ตรวจสอบว่าเส้นตรงระหว่างซอมบี้กับผู้เล่นตัดผ่านประตูที่ปิดอยู่หรือไม่
                if (maxX >= dLeft && minX <= dRight && maxY >= dTop && minY <= dBottom) {
                    return true;
                }
            }
        }
        return false;
    }

    renderDetectionIndicator() {
        if (!this.alertRingGfx || !this.alertIcon) return;

        this.alertRingGfx.clear();
        if (this.detectionMeter > 0.02) {
            const headX = this.sprite.x;
            const headY = this.sprite.y - 50;

            // วงกลมพื้นหลังสีดำขุ่น
            this.alertRingGfx.lineStyle(3, 0x000000, 0.7);
            this.alertRingGfx.strokeCircle(headX, headY, 14);

            // วงกลม Progress Arc (สีส้ม -> แดงเมื่อเต็ม)
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (Math.PI * 2 * this.detectionMeter);
            const ringColor = (this.detectionMeter >= 1.0) ? 0xff3838 : 0xff9f1a;
            this.alertRingGfx.lineStyle(3, ringColor, 0.95);
            this.alertRingGfx.beginPath();
            this.alertRingGfx.arc(headX, headY, 14, startAngle, endAngle, false);
            this.alertRingGfx.strokePath();

            this.alertIcon.setPosition(headX, headY);
            this.alertIcon.setVisible(true);
        } else {
            this.alertIcon.setVisible(false);
        }
    }

    cleanVisuals() {
        if (this.alertRingGfx) {
            this.alertRingGfx.clear();
            this.alertRingGfx.destroy();
        }
        if (this.alertIcon) {
            this.alertIcon.destroy();
        }
    }

    pickNewDestination() {
        this.stateTimer = 0;
        this.idleDuration = randInt(3000, 7000);

        if (!this.collisionGrid || !this.zoneSpots || this.zoneSpots.length === 0) {
            this.state = 'IDLE';
            return;
        }

        const currentTileX = Math.floor(this.sprite.x / 32);
        const currentTileY = Math.floor((this.sprite.y - 10) / 32);

        const scored = this.zoneSpots.map(s => {
            const d = Math.hypot(s.x - currentTileX, s.y - currentTileY);
            const isRecent = this.recentSpots.some(r => r.x === s.x && r.y === s.y);
            return { spot: s, dist: d, isRecent };
        });

        let candidates = scored.filter(s => s.dist >= 2 && !s.isRecent);
        if (candidates.length === 0) {
            candidates = scored.filter(s => s.dist >= 2);
        }

        if (candidates.length === 0) {
            this.state = 'IDLE';
            return;
        }

        candidates.sort((a, b) => a.dist - b.dist);

        let selectedPool = [];
        if (candidates.length >= 4) {
            selectedPool = candidates.slice(1, Math.min(5, candidates.length));
        } else if (candidates.length >= 2) {
            selectedPool = candidates.slice(1);
        } else {
            selectedPool = candidates;
        }

        const chosen = randItem(selectedPool)?.spot || candidates[0].spot;
        const foundPath = this.collisionGrid.findPath(currentTileX, currentTileY, chosen.x, chosen.y);

        if (foundPath && foundPath.length > 1) {
            this.path = foundPath;
            this.currentWaypointIndex = 1;
            this.state = 'WALK';
            this.stuckTimer = 0;
            this.lastX = this.sprite.x;
            this.lastY = this.sprite.y;
            this.playAnim('walk');

            this.recentSpots.push(chosen);
            if (this.recentSpots.length > 3) {
                this.recentSpots.shift();
            }
        } else {
            this.state = 'IDLE';
        }
    }

    handleWalking(delta, moveSpeed = this.speed) {
        if (!this.path || this.currentWaypointIndex >= this.path.length) {
            this.finishWalking();
            return;
        }

        const targetNode = this.path[this.currentWaypointIndex];
        const targetWorldX = targetNode.x * 32 + 16;
        const targetWorldY = (targetNode.y + 1) * 32;

        const distance = Math.hypot(targetWorldX - this.sprite.x, targetWorldY - this.sprite.y);

        if (distance < 12) {
            this.currentWaypointIndex++;
            if (this.currentWaypointIndex >= this.path.length) {
                this.finishWalking();
                return;
            }
        } else {
            const angle = Math.atan2(targetWorldY - this.sprite.y, targetWorldX - this.sprite.x);
            const vx = Math.cos(angle) * moveSpeed;
            const vy = Math.sin(angle) * moveSpeed;

            this.sprite.setVelocity(vx, vy);

            if (vx < -5) {
                this.sprite.setFlipX(true);
            } else if (vx > 5) {
                this.sprite.setFlipX(false);
            }

            this.playAnim('walk');

            const movedDist = Math.hypot(this.sprite.x - this.lastX, this.sprite.y - this.lastY);
            if (movedDist < 0.6) {
                this.stuckTimer += delta;
                if (this.stuckTimer > 280) {
                    // หากติดขัดกับมุมหรือสิ่งกีดขวาง: ข้ามไปยัง Waypoint ถัดไปและรักษาสถานะเดินหลบมุมให้นานขึ้น
                    if (this.path && this.currentWaypointIndex < this.path.length - 1) {
                        this.currentWaypointIndex++;
                        this.stuckTimer = 0;
                        this.unstuckDuration = 1800; // รักษาสถานะเดินหลบมุมอย่างต่อเนื่อง 1.8 วินาที
                    } else if (this.stuckTimer > 850) {
                        this.stuckTimer = 0;
                        if (this.state === 'CHASE') {
                            this.repathTimer = 999;
                        } else {
                            this.finishWalking();
                        }
                    }
                }
            } else {
                this.stuckTimer = 0;
                this.lastX = this.sprite.x;
                this.lastY = this.sprite.y;
            }
        }
    }

    finishWalking() {
        if (this.sprite && this.sprite.body) {
            this.sprite.setVelocity(0, 0);
        }
        this.state = 'IDLE';
        this.stateTimer = 0;
        this.idleDuration = randInt(3000, 7000);
        this.path = [];
        this.playAnim('idle');
    }
}

/**
 * Zombie Manager - จัดการสร้างและอัปเดตซอมบี้ 15 ตัวตามจุดที่กำหนด
 */
export default class ZombieManager {
    static preload(scene) {
        if (!scene.textures.exists('zombie')) {
            scene.load.spritesheet('zombie', 'sprite/zombie.png', {
                frameWidth: 128,
                frameHeight: 128
            });
        }
    }

    constructor(scene, map) {
        this.scene = scene;
        this.map = map;
        this.zombies = [];
        this.zombieGroup = scene.physics.add.group();

        this.createAnimations();
        this.collisionGrid = this.buildCollisionGrid(scene, map);
        this.spawnZombiesFromPools();

        // เพิ่มการชนกันระหว่างซอมบี้กับกำแพง (Wall) และประตูที่ปิดอยู่ (solidObjects)
        if (scene.collisionLayers && scene.collisionLayers.length > 0) {
            scene.collisionLayers.forEach(layer => {
                const lName = (layer.layer && layer.layer.name) || layer.name || '';
                if (lName === 'Wall' || lName.toLowerCase().includes('wall')) {
                    scene.physics.add.collider(this.zombieGroup, layer);
                }
            });
        }
        if (scene.solidObjects) {
            scene.physics.add.collider(this.zombieGroup, scene.solidObjects);
        }
    }

    createAnimations() {
        if (this.scene.anims.exists('zombie1_idle')) return;

        // Zombie 1
        this.scene.anims.create({
            key: 'zombie1_idle',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 0, end: 5 }),
            frameRate: 6,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'zombie1_walk',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 10, end: 19 }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'zombie1_attack',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 20, end: 24 }),
            frameRate: 10,
            repeat: 0
        });

        // Zombie 2
        this.scene.anims.create({
            key: 'zombie2_idle',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 40, end: 45 }),
            frameRate: 6,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'zombie2_walk',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 50, end: 59 }),
            frameRate: 8,
            repeat: -1
        });
        this.scene.anims.create({
            key: 'zombie2_attack',
            frames: this.scene.anims.generateFrameNumbers('zombie', { start: 30, end: 34 }),
            frameRate: 10,
            repeat: 0
        });
    }

    buildCollisionGrid(scene, map) {
        const rawMapData = scene.cache?.tilemap?.get('lab_zone_a1')?.data || map;
        const width = rawMapData?.width || 176;
        const height = rawMapData?.height || 134;
        const grid = new Uint8Array(width * height);

        // ให้เฉพาะกำแพง (Wall) เท่านั้นที่เป็นสิ่งกีดขวาง (เฟอร์นิเจอร์และของตกแต่งสามารถเดินทะลุได้)
        const collisionLayerNames = ['Wall'];
        const rawLayers = (rawMapData?.layers || []).filter(l => collisionLayerNames.includes(l.name));

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                // ห้ามเข้าห้องออฟฟิศย่อย (Small office: Grid 92-107, 100-112)
                if (x >= 92 && x <= 107 && y >= 100 && y <= 112) {
                    grid[idx] = 1;
                    continue;
                }
                for (const l of rawLayers) {
                    if (l.data && l.data[idx] !== 0) {
                        grid[idx] = 1;
                        break;
                    }
                }
            }
        }

        return {
            width,
            height,
            isBlocked: (x, y) => {
                if (x < 0 || x >= width || y < 0 || y >= height) return true;
                return grid[y * width + x] === 1;
            },
            findPath: (startX, startY, endX, endY, maxSearch = 2000) => {
                if (startX === endX && startY === endY) return [];
                if (endX < 0 || endX >= width || endY < 0 || endY >= height || grid[endY * width + endX] === 1) return [];

                const openSet = [{ x: startX, y: startY, cost: 0, priority: 0 }];
                const cameFrom = new Map();
                const costSoFar = new Map();

                const startKey = startY * width + startX;
                const endKey = endY * width + endX;
                costSoFar.set(startKey, 0);

                let iterations = 0;
                while (openSet.length > 0 && iterations++ < maxSearch) {
                    openSet.sort((a, b) => a.priority - b.priority);
                    const current = openSet.shift();
                    const curKey = current.y * width + current.x;

                    if (curKey === endKey) {
                        const path = [];
                        let temp = curKey;
                        let guard = 0;
                        while (temp !== undefined && guard++ < 500) {
                            const tx = temp % width;
                            const ty = Math.floor(temp / width);
                            path.unshift({ x: tx, y: ty });
                            if (temp === startKey) break;
                            temp = cameFrom.get(temp);
                        }
                        return path;
                    }

                    const neighbors = [
                        { x: current.x, y: current.y - 1 },
                        { x: current.x, y: current.y + 1 },
                        { x: current.x - 1, y: current.y },
                        { x: current.x + 1, y: current.y }
                    ];

                    for (const next of neighbors) {
                        if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height || grid[next.y * width + next.x] === 1) continue;

                        const nextKey = next.y * width + next.x;
                        const newCost = costSoFar.get(curKey) + 1;

                        if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)) {
                            costSoFar.set(nextKey, newCost);
                            const h = Math.abs(endX - next.x) + Math.abs(endY - next.y);
                            openSet.push({ x: next.x, y: next.y, cost: newCost, priority: newCost + h });
                            cameFrom.set(nextKey, curKey);
                        }
                    }
                }
                return [];
            }
        };
    }

    spawnZombiesFromPools() {
        const spotPools = {
            dataRoom: {
                count: 2,
                spots: [{ x: 58, y: 11 }, { x: 58, y: 29 }, { x: 41, y: 12 }, { x: 41, y: 30 }]
            },
            office: {
                count: 2,
                spots: [{ x: 13, y: 16 }, { x: 11, y: 28 }, { x: 24, y: 23 }, { x: 27, y: 13 }]
            },
            hallway: {
                count: 4,
                spots: [
                    { x: 42, y: 46 }, { x: 35, y: 64 }, { x: 35, y: 96 }, { x: 48, y: 116 },
                    { x: 86, y: 110 }, { x: 108, y: 100 }, { x: 91, y: 46 }, { x: 113, y: 46 },
                    { x: 117, y: 78 }, { x: 138, y: 58 }, { x: 159, y: 66 }, { x: 164, y: 90 }
                ]
            },
            lab: {
                count: 3,
                spots: [{ x: 48, y: 85 }, { x: 60, y: 93 }, { x: 71, y: 107 }, { x: 78, y: 99 }, { x: 60, y: 104 }, { x: 59, y: 80 }]
            },
            cafeteria: {
                count: 2,
                spots: [{ x: 96, y: 71 }, { x: 99, y: 89 }, { x: 107, y: 68 }, { x: 101, y: 78 }]
            },
            kitchen: {
                count: 1,
                spots: [{ x: 96, y: 60 }, { x: 103, y: 55 }, { x: 108, y: 60 }]
            },
            infirmary: {
                count: 1,
                spots: [{ x: 130, y: 87 }, { x: 135, y: 92 }, { x: 145, y: 92 }]
            }
        };

        const chosenSpawns = [];
        for (const zoneKey in spotPools) {
            const pool = spotPools[zoneKey];
            const shuffled = shuffleArray(pool.spots);
            const selected = shuffled.slice(0, pool.count);
            selected.forEach(s => chosenSpawns.push({ ...s, zoneKey }));
        }

        chosenSpawns.forEach((sp, idx) => {
            try {
                const type = (idx % 2 === 0) ? 1 : 2;
                const zombie = new Zombie(this.scene, sp.x, sp.y, type, this.collisionGrid, sp.zoneKey);
                this.zombies.push(zombie);
                this.zombieGroup.add(zombie.sprite);
            } catch (err) {
                console.warn('Error spawning zombie at', sp, err);
            }
        });
    }

    update(time, delta, player = null, playerNoise = 0.35, isHoldingBreath = false) {
        let isAnyZombieAlerted = false;
        for (let i = 0; i < this.zombies.length; i++) {
            if (this.zombies[i]) {
                this.zombies[i].update(time, delta, player, playerNoise, isHoldingBreath);
                if (this.zombies[i].detectionMeter >= 1.0 || this.zombies[i].state === 'CHASE') {
                    isAnyZombieAlerted = true;
                }
            }
        }

        // แสดงกรอบสีแดงเตือนภัยรอบจอเมื่อมีซอมบี้ตรวจจับพบผู้เล่น
        if (this.scene && typeof this.scene.setDangerVignette === 'function') {
            this.scene.setDangerVignette(isAnyZombieAlerted);
        }
    }
}
