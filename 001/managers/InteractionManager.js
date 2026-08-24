import DialogueBox from '../ui/DialogueBox.js';

export default class InteractionManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.dialogue = new DialogueBox(scene);
        this.interactables = [];
        this._isCustomLocked = false;

        // ดักจับคลิกซ้าย (LMB)
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.handlePointerDown();
            }
        });
    }

    /**
     * เพิ่มจุด Interactable
     * @param {Object} config - { x, y, radius, onInteract or message }
     */
    add(config) {
        this.interactables.push({
            x: config.x,
            y: config.y,
            radius: config.radius || 80,
            message: config.message || null,
            onInteract: config.onInteract || null
        });
    }

    handlePointerDown() {
        // ถ้าหน้าต่างเควสต์ หรือ หน้าต่างอ่านโน้ต หรือ แผนที่ กำลังเปิดอยู่ ไม่ให้ตรวจจับ interact ใดๆ
        if (this.scene.scene && (this.scene.scene.isActive('QuestScene') || this.scene.scene.isActive('NoteScene') || this.scene.scene.isActive('MapScene') || this.scene.scene.isActive('PCScene'))) {
            return;
        }

        // ถ้ากล่องข้อความเปิดอยู่ -> คลิกเพื่อไปต่อ หรือ ปิด
        if (this.dialogue.isOpen()) {
            this.dialogue.advance();
            return;
        }

        // ถ้าอยู่ในสถานะถูกล็อก (เช่น เปิดหน้าจอ PC) ไม่ให้ตรวจจับ interact อื่น
        if (this.isLocked()) {
            return;
        }

        // หา Object ที่อยู่ใกล้ผู้เล่นที่สุดในระยะ
        let closestItem = null;
        let minDistance = Infinity;

        for (const item of this.interactables) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                item.x, item.y
            );

            if (distance <= item.radius && distance < minDistance) {
                minDistance = distance;
                closestItem = item;
            }
        }

        if (closestItem) {
            if (closestItem.message) {
                this.dialogue.show(closestItem.message);
            } else if (closestItem.onInteract) {
                closestItem.onInteract();
            }
        }
    }

    /**
     * ล็อกการควบคุมและการโต้ตอบของผู้เล่น
     */
    lock() {
        this._isCustomLocked = true;
    }

    /**
     * ปลดล็อกการควบคุม
     */
    unlock() {
        this._isCustomLocked = false;
    }

    // ตรวจสอบว่าระบบกำลังล็อกตัวละครอยู่หรือไม่
    isLocked() {
        return this._isCustomLocked || this.dialogue.isOpen();
    }
}