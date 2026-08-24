import InteractionManager from '../managers/InteractionManager.js';
import PC from './PC.js';
import QuestManager from './quest.js';
import TerminalPanel from '../ui/TerminalPanel.js';
import ZombieManager from './zombie.js';

export default class GameplayScene extends Phaser.Scene {
    constructor() {
        super('GameplayScene');
    }

    init(data) {
        this.currentMapKey = data.mapKey || 'break_room';
        const defaultSpawnX = (this.currentMapKey === 'lab_zone_a1') ? (53 * 32 + 16) : (34.5 * 32 + 16);
        const defaultSpawnY = (this.currentMapKey === 'lab_zone_a1') ? (72 * 32 + 16) : (25 * 32 + 16);
        this.spawnX = data.spawnX ?? defaultSpawnX;
        this.spawnY = data.spawnY ?? defaultSpawnY;
        this.isTransitioning = false;
        this.isVentOpened = false;
        this.isContinueRevive = data.isContinueRevive || false;
        this.isDying = false;

        // สุ่มรหัสผ่าน 4 หลักสำหรับรอบการเล่นนี้ (คงอยู่ตลอดทั้งเกม)
        if (!this.game.registry.get('exitPasscode')) {
            const randomCode = String(Math.floor(1000 + Math.random() * 9000));
            this.game.registry.set('exitPasscode', randomCode);
        }

        // เริ่มต้นจับเวลาลับ (Secret Timer) นับตั้งแต่เข้าสู่ห้องแล็บจนกระทั่งจบเกม
        if (this.currentMapKey === 'lab_zone_a1' && !this.game.registry.get('labStartTime')) {
            this.game.registry.set('labStartTime', Date.now());
        }
    }

    preload() {
        // 1. Player & Zombie Sprite Sheets
        this.load.spritesheet('player', 'sprite/tachyon1.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('zombie', 'sprite/zombie.png', {
            frameWidth: 128,
            frameHeight: 128
        });

        // 2. Tilemaps
        this.load.tilemapTiledJSON('break_room', 'map/break_room2.json');
        this.load.tilemapTiledJSON('lab_zone_a1', 'map/Lab_zone_A1.json');

        // 3. Tilesets & Assets
        this.load.image('room_builder_img', 'tileset/Room_Builder_32x32.png');
        this.load.image('furniture_img', 'tileset/2_LivingRoom_32x32.png');
        this.load.image('hospital_img', 'tileset/19_Hospital_32x32.png');
        this.load.spritesheet('hospital_tiles', 'tileset/19_Hospital_32x32.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('kitchen_img', 'tileset/12_Kitchen_32x32.png');
        this.load.image('bathroom_img', 'tileset/3_Bathroom_32x32.png');
        this.load.image('museum_img', 'tileset/22_Museum_32x32.png');
        this.load.image('jail_img', 'tileset/18_Jail_32x32.png');
        this.load.image('grocery_img', 'tileset/16_Grocery_store_32x32.png');
        this.load.image('fishing_img', 'tileset/9_Fishing_32x32.png');
        this.load.image('classroom_img', 'tileset/5_Classroom_and_library_32x32.png');
        this.load.image('office_img', 'tileset/Modern_Office_Black_Shadow_32x32.png');
        this.load.image('decoration_img', 'assets/decoration.png');
        this.load.image('decoration2_img', 'assets/decoration2.png');
        this.load.image('body_img', 'assets/body.png');
        this.load.image('keycard_img', 'assets/keycard.png');
        this.load.image('supply_box_img', 'assets/supply_box.png');
        this.load.image('opened_vent_img', 'assets/opened_vent2.png');
        this.load.image('vent_cover_img', 'assets/vent_cover.png');
        this.load.image('vent_img', 'assets/vent2.png');
        this.load.image('lab_stuffs_img', 'sprite/lab_tileset_base.png');

        // 4. Animated Spritesheets & Doors
        this.load.spritesheet('Elevartor_Door_1', 'sprite/animated_elevator_door_entrance_2_32x32.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('main_door', 'sprite/animated_elevator_door_entrance_1_32x32.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('door_verti_1', 'sprite/animated_door_vertical_left_1_32x32.png', { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('horizontal_slide_glass_door', 'sprite/animated_door_glass_sliding_32x32.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('vertical_glass_door_right', 'sprite/animated_door_glass_vertical_right_32x32.png', { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('horizontal_glass_door_right', 'sprite/animated_door_glass_right_32x32.png', { frameWidth: 32, frameHeight: 96 });
        this.load.spritesheet('big_32_h_door_no6', 'sprite/animated_door_big_6_32x32.png', { frameWidth: 32, frameHeight: 96 });
        this.load.spritesheet('verti_32_door_right_no3', 'sprite/animated_door_vertical_right_3_32x32.png', { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('verti_32_door_left_no2', 'sprite/animated_door_vertical_left_2_32x32.png', { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('server_box', 'sprite/animated_control_room_server_32x32.png', { frameWidth: 32, frameHeight: 96 });

        // 5. PC, Map & Quest Assets
        this.load.spritesheet('pc_startup', 'sprite/pc_startup.png', { frameWidth: 1281, frameHeight: 721 });
        this.load.image('pc_wallpaper', 'assets/093.png');
        this.load.spritesheet('pc_icons', 'sprite/WinIcons_48.png', { frameWidth: 48, frameHeight: 48 });
        this.load.image('asset2_img1', 'assets_2/img1.jpg');
        this.load.image('asset2_img2', 'assets_2/img2.jpg');
        this.load.image('asset2_img3', 'assets_2/img3.png');
        this.load.image('map_icon_img', 'assets/map_icon.png');
        this.load.image('speaker_icon', 'assets/Speaker_Icon.svg.png');
        this.load.image('alert_triangle_icon', 'assets/exclamation-warning-triangle-icon.png');
        this.load.image('setting_icon', 'assets/setting.png');

        // 6. Background OSTs (game_ost1-3)
        this.load.audio('game_ost1', 'sound/game_ost1.mp3');
        this.load.audio('game_ost2', 'sound/game_ost2.mp3');
        this.load.audio('game_ost3', 'sound/game_ost3.mp3');

        QuestManager.preload(this);
    }

    create() {
        this.cameras.main.resetFX();
        this.cameras.main.fadeIn(600, 0, 0, 0);

        this.createDoorAnimations();
        this.animatedDoors = [];
        this.animatedSprites = [];

        // กรอบเตือนภัยสีแดงรอบจอเมื่อซอมบี้ตรวจพบผู้เล่น
        this.dangerFrameGfx = this.add.graphics();
        this.dangerFrameGfx.setScrollFactor(0);
        this.dangerFrameGfx.setDepth(16500);
        this.dangerFrameGfx.setAlpha(0);
        this.isDangerActive = false;
        this.hasPlayedSpottedSound = false;

        // เริ่มต้นเล่นเพลงประกอบฉาก OST1-3 (วนลูปเพลงละ 5 รอบก่อนเปลี่ยนเพลงถัดไป)
        this.startOSTPlaylist();

        // หยุดเพลงเมื่อ Scene ถูกปิดหรือเปลี่ยนฉาก
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopOSTPlaylist();
        });

        let map = null;
        const collisionLayers = [];
        let ventLayer = null;
        let openedVentLayer = null;

        // วาง Player และลงทะเบียนเข้าสู่ระบบ Y-sorting แบบ Dynamic
        this.player = this.physics.add.sprite(this.spawnX, this.spawnY, 'player', 0);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1.15);
        this.player.body.setSize(22, 24);
        this.player.body.setOffset(21, 38);

        // setup ysortedObjects
        this.ysortedObjects = [];
        this.registerYSort(this.player, true);

        // Setup InteractionManager
        this.interactions = new InteractionManager(this, this.player);

        // หากเป็นการกด Continue ฟื้นคืนชีพขึ้นมาตรงจุดเดิม
        if (this.isContinueRevive) {
            // อนิเมชั่นกระพริบตัวละคร (Flickering invulnerability)
            this.tweens.add({
                targets: this.player,
                alpha: 0.3,
                duration: 120,
                yoyo: true,
                repeat: 9,
                onComplete: () => {
                    if (this.player) this.player.setAlpha(1.0);
                }
            });

            // บทพูดเมื่อฟื้นตื่นขึ้นมา
            this.time.delayedCall(400, () => {
                if (this.interactions) {
                    this.interactions.lock();
                    this.interactions.dialogue.showSequence([
                        "!!!",
                        "อะไรน่ะ?! ... ฉันฝันไปเหรอ?"
                    ], () => {
                        this.interactions.unlock();
                    });
                }
            });
        }

        // กลุ่มวัตถุที่มี Collision (ประตูที่ปิดอยู่, ลิฟต์, เซิร์ฟเวอร์)
        this.solidObjects = this.physics.add.staticGroup();

        try {
            map = this.make.tilemap({ key: this.currentMapKey });

            const ventKey = (this.currentMapKey === 'lab_zone_a1') ? 'opened_vent_img' : 'vent_img';

            // จับคู่ชื่อ Tileset ใน Tiled JSON กับ Image Key ใน Phaser
            const tilesetMappings = [
                { name: 'room_builder', key: 'room_builder_img' },
                { name: 'furniture', key: 'furniture_img' },
                { name: 'Hospital', key: 'hospital_img' },
                { name: 'Kitchen', key: 'kitchen_img' },
                { name: 'Bathroom_1', key: 'bathroom_img' },
                { name: 'Elevartor_Door_1', key: 'Elevartor_Door_1' },
                { name: 'main_door', key: 'main_door' },
                { name: 'door_verti_1', key: 'door_verti_1' },
                { name: 'prop_1', key: 'decoration_img' },
                { name: 'prop_2', key: 'decoration2_img' },
                { name: 'corpse', key: 'body_img' },
                { name: 'keycard', key: 'keycard_img' },
                { name: 'supply_box', key: 'supply_box_img' },
                { name: 'Office', key: 'office_img' },
                { name: 'mesuem', key: 'museum_img' },
                { name: 'jail', key: 'jail_img' },
                { name: 'grocery', key: 'grocery_img' },
                { name: 'fishing', key: 'fishing_img' },
                { name: 'classroom', key: 'classroom_img' },
                { name: 'lab_stuffs', key: 'lab_stuffs_img' },
                { name: 'server_box', key: 'server_box' },
                { name: 'vent', key: ventKey },
                { name: 'opened_vent', key: 'opened_vent_img' },
                { name: 'vent_cover', key: 'vent_cover_img' },
                { name: 'horizontal_slide_glass_door', key: 'horizontal_slide_glass_door' },
                { name: 'vertical_glass_door_right', key: 'vertical_glass_door_right' },
                { name: 'horizontal_glass_door_right', key: 'horizontal_glass_door_right' },
                { name: 'big_32_h_door_no6', key: 'big_32_h_door_no6' },
                { name: 'verti_32_door_right_no3', key: 'verti_32_door_right_no3' },
                { name: 'verti_32_door_left_no2', key: 'verti_32_door_left_no2' }
            ];

            const addedTilesets = [];
            tilesetMappings.forEach(mapping => {
                const ts = map.addTilesetImage(mapping.name, mapping.key);
                if (ts) addedTilesets.push(ts);
            });

            // ตารางกำหนด Depth ตามลำดับชั้น Tiled
            const layerConfigs = {
                'Floor':              { depth: 0,     collide: false },
                'walkable':           { depth: 1,     collide: false },
                'Wall':               { depth: 2,     collide: true },
                'Wall_noclip':        { depth: 3,     collide: true },
                'wall_noclip':        { depth: 3,     collide: true },
                'Bottom_Deco':        { depth: 4,     collide: false },
                'upper_bottom_deco':  { depth: 5,     collide: false },
                'Furniture':          { depth: 6,     collide: true },
                'Deco':               { depth: 10000, collide: false }, // อยู่เหนือ Player
                'deco':               { depth: 10000, collide: false }, // อยู่เหนือ Player
                '2nd_top_deco':       { depth: 10001, collide: false }, // อยู่เหนือ Deco
                '2nd_Top_Deco':       { depth: 10001, collide: false },
                'Deco_withclip':      { depth: 8,     collide: true },
                'blood':              { depth: 10,    collide: false },
                'vent':               { depth: 11,    collide: false },
                'opened_vent':        { depth: 11,    collide: false },
                'Top_Deco':           { depth: 12,    collide: false }, // อยู่ใต้ Player
                'top_deco':           { depth: 12,    collide: false }, // อยู่ใต้ Player
                'Mission_Prop':       { depth: 13,    collide: false },
                'mission_prop':       { depth: 13,    collide: false },
                'Objective_Items':    { depth: 14,    collide: false },
                'objective_items':    { depth: 14,    collide: false }
            };

            const FLIP_H = 0x80000000;
            const FLIP_V = 0x40000000;
            const FLIP_D = 0x20000000;

            // ดึงข้อมูลดิบจาก Tilemap Cache เพื่ออ่านค่า Layer 'animated' และสร้างเป็น Sprite
            const rawMapData = this.cache.tilemap.get(this.currentMapKey)?.data;
            const rawAnimLayer = rawMapData?.layers?.find(l => l.name === 'animated');

            if (rawAnimLayer && rawAnimLayer.data) {
                const rawTilesets = (rawMapData.tilesets || []).slice().reverse();

                rawAnimLayer.data.forEach((rawGid, idx) => {
                    if (!rawGid) return;
                    const cleanGid = rawGid & ~(FLIP_H | FLIP_V | FLIP_D);
                    const flipX = !!(rawGid & FLIP_H);
                    const flipY = !!(rawGid & FLIP_V);

                    const gridX = idx % rawMapData.width;
                    const gridY = Math.floor(idx / rawMapData.width);

                    const ts = rawTilesets.find(t => cleanGid >= t.firstgid);
                    if (!ts) return;

                    const worldX = gridX * 32;
                    const worldY = (gridY + 1) * 32;

                    const sprite = this.add.sprite(worldX, worldY, ts.name, 0);
                    sprite.setOrigin(0, 1);
                    sprite.setFlipX(flipX);
                    sprite.setFlipY(flipY);

                    // คำนวณ Depth ตาม Y-Sorting อัตโนมัติ (worldY คือฐานล่างสุดของ Sprite)
                    this.registerYSort(sprite, false);

                    this.physics.add.existing(sprite, true);

                    // ปรับแต่ง Hitbox ของประตูแต่ละประเภทตามสเปกพร้อมรองรับ flipX/flipY
                    const isHorizontal = ts.name.includes('h_door') || ts.name.includes('horizontal') || ts.name.includes('slide') || ts.name.includes('Elevartor') || ts.name.includes('main_door');

                    if (isHorizontal) {
                        // ประตูแนวนอน: ยาวตาม ts.tilewidth หนา 6px
                        const offY = flipY ? 0 : (ts.tileheight - 14);
                        sprite.body.setSize(ts.tilewidth, 6);
                        sprite.body.setOffset(0, offY);
                    } else {
                        // ประตูแนวตั้ง
                        let baseMinX = 38;
                        let bodyW = 8;
                        let bodyH = 82;

                        if (ts.name === 'vertical_glass_door_right') {
                            baseMinX = 40;
                            bodyW = 6;
                        } else if (ts.name === 'verti_32_door_right_no3') {
                            baseMinX = 18;
                            bodyW = 8;
                        }

                        const offX = flipX ? (ts.tilewidth - (baseMinX + bodyW)) : baseMinX;
                        const offY = flipY ? 0 : 14;

                        sprite.body.setSize(bodyW, bodyH);
                        sprite.body.setOffset(offX, offY);
                    }

                    this.solidObjects.add(sprite);

                    // ลิฟต์: คงที่ไม่มีแอนิเมชัน และมี Collision ชนได้
                    if (ts.name === 'Elevartor_Door_1' || ts.name === 'main_door') {
                        this.animatedSprites.push(sprite);
                    } else if (ts.name === 'server_box') {
                        const randomFrame = Phaser.Math.Between(0, 2);
                        sprite.anims.play({ key: 'anim_server_box', startFrame: randomFrame }, true);
                        sprite.anims.timeScale = Phaser.Math.FloatBetween(0.75, 1.35);
                        this.animatedSprites.push(sprite);
                    } else {
                        // ประตูทั่วไป: เปิด/ปิดด้วยการคลิกซ้ายเมื่อผู้เล่นอยู่ในระยะ
                        const door = {
                            sprite: sprite,
                            gridX: gridX,
                            gridY: gridY,
                            tilesetName: ts.name,
                            openAnim: 'open_' + ts.name,
                            closeAnim: 'close_' + ts.name,
                            isOpen: false,
                            isHorizontal: isHorizontal,
                            worldX: worldX,
                            worldY: worldY,
                            tsWidth: ts.tilewidth,
                            tsHeight: ts.tileheight,
                            centerX: worldX + (ts.tilewidth / 2),
                            centerY: worldY - (ts.tileheight / 2)
                        };
                        this.animatedDoors.push(door);

                        this.interactions.add({
                            x: door.centerX,
                            y: door.centerY,
                            radius: 80,
                            onInteract: () => {
                                this.toggleDoor(door);
                            }
                        });
                    }
                });

                // เชื่อมโยงประตูคู่ / บานเปิดคู่ (เช่น ประตูแนวตั้ง 2 บานที่ flip เข้าหากัน) ให้เปิด-ปิดพร้อมกัน
                this.animatedDoors.forEach(doorA => {
                    if (doorA.pairedGroup) return;
                    const group = [doorA];
                    this.animatedDoors.forEach(doorB => {
                        if (doorA !== doorB) {
                            const dist = Phaser.Math.Distance.Between(doorA.centerX, doorA.centerY, doorB.centerX, doorB.centerY);
                            if (dist <= 100) {
                                group.push(doorB);
                            }
                        }
                    });
                    group.forEach(d => {
                        d.pairedGroup = group;
                    });
                });
            }

            // วาง Server Rack ในห้องควบคุมของแล็บจาก Grid (34, 8) ถึง (58, 8)
            if (this.currentMapKey === 'lab_zone_a1') {
                for (let gx = 34; gx <= 58; gx++) {
                    const worldX = gx * 32;
                    const worldY = (8 + 1) * 32;

                    const server = this.add.sprite(worldX, worldY, 'server_box', Phaser.Math.Between(0, 2));
                    server.setOrigin(0, 1);
                    this.registerYSort(server, false);

                    this.physics.add.existing(server, true);
                    server.body.setSize(32, 28);
                    server.body.setOffset(0, 68);
                    this.solidObjects.add(server);

                    const randomFrame = Phaser.Math.Between(0, 2);
                    server.anims.play({ key: 'anim_server_box', startFrame: randomFrame }, true);
                    server.anims.timeScale = Phaser.Math.FloatBetween(0.75, 1.35);

                    this.animatedSprites.push(server);
                }
            }

            // สร้าง Layer ตามลำดับที่มีอยู่ใน Map JSON (ข้าม layer animated เพราะแปลงเป็น Sprite แล้ว)
            map.layers.forEach(layerData => {
                const layerName = layerData.name;
                if (layerName === 'animated') return;

                const createdLayer = map.createLayer(layerName, addedTilesets, 0, 0);

                if (createdLayer) {
                    const config = layerConfigs[layerName] || { depth: 1, collide: false };
                    createdLayer.setDepth(config.depth);

                    // สร้าง Collision เฉพาะเลเยอร์ที่ตั้งค่า collide: true ไว้เท่านั้น (กันบั๊ก property Tiled ค้าง)
                    if (config.collide) {
                        createdLayer.setCollisionByExclusion([-1]);
                        collisionLayers.push(createdLayer);
                    }

                    if (layerName === 'vent') {
                        ventLayer = createdLayer;
                        ventLayer.setVisible(true);
                    } else if (layerName === 'opened_vent') {
                        openedVentLayer = createdLayer;
                        openedVentLayer.setVisible(false);
                    }
                }
            });

        } catch (error) {
            console.warn('Map initialization error:', error);
        }

        // เก็บ reference เลเยอร์แผนที่สำหรับการชนของซอมบี้และตัวละคร
        this.collisionLayers = collisionLayers;

        // เชื่อมต่อ Collider กับเลเยอร์แผนที่และวัตถุทึบ (ประตูที่ปิด/ลิฟต์/เซิร์ฟเวอร์)
        collisionLayers.forEach(layer => {
            this.physics.add.collider(this.player, layer);
        });
        this.physics.add.collider(this.player, this.solidObjects);

        // ตั้งขอบเขตของกล้องและฟิสิกส์โลก
        const worldWidth = map ? map.widthInPixels : 1280;
        const worldHeight = map ? map.heightInPixels : 720;
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5);

        // Animations
        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1
            });
            this.anims.create({
                key: 'walk',
                frames: this.anims.generateFrameNumbers('player', { start: 16, end: 23 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers('player', { start: 8, end: 13 }),
                frameRate: 12,
                repeat: -1
            });
            this.anims.create({
                key: 'player_down',
                frames: this.anims.generateFrameNumbers('player', { start: 32, end: 36 }),
                frameRate: 8,
                repeat: 0
            });
        }

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // ระบบเสียงฝีเท้า, การกลั้นหายใจ และ Noise / Oxygen HUD
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.isExhausted = false;
        this.isHoldingBreath = false;
        this.currentNoise = 0.35;
        this.targetNoise = 0.35;
        this.stepTimer = 0;
        this.breathSoundTimer = 0;
        this.createNoiseAndStaminaHUD();

        // 6. ปุ่มตั้งค่ามุมขวาบน (Settings / Pause Button)
        this.isPausedForSettings = false;
        this.createSettingsHUD();

        // Interaction จุดต่างๆ ใน Break Room
        if (this.currentMapKey === 'break_room') {
            this.interactions.add({
                x: 33.5 * 32,
                y: 20.5 * 32,
                radius: 85,
                onInteract: () => {
                    if (!this.isVentOpened) {
                        if (ventLayer) ventLayer.setVisible(false);
                        if (openedVentLayer) openedVentLayer.setVisible(true);
                        this.isVentOpened = true;
                        this.interactions.dialogue.show("ฝาตะแกรงหลุดออกแล้ว.. ช่องระบายอากาศนี้มุ่งตรงไปทางห้องแล็บ");
                    } else {
                        this.transitionToLab();
                    }
                }
            });

            this.interactions.add({
                x: 35 * 32,
                y: 30.5 * 32,
                radius: 80,
                message: "มันล็อกไม่ยอมเปิดเลย.. สงสัยจังว่าทำไม"
            });

            // ตู้กดน้ำ/ขนมอัตโนมัติ ที่ Grid (36, 21)
            this.interactions.add({
                x: 36 * 32 + 16,
                y: 21 * 32 + 16,
                radius: 50,
                message: "แหล่งพลังงานหลักตลอด 3 วันที่ผ่านมา.. รู้ไหมว่าน้ำตาลกลูโคสสังเคราะห์กับคาเฟอีนพวกนี้ คือสารตั้งต้นชั้นยอดในการรักษาระดับ ATP ในเซลล์สมองเลยนะ"
            });

            // เครื่องชงกาแฟอัตโนมัติ ที่ Grid (38, 21)
            this.interactions.add({
                x: 38 * 32 + 16,
                y: 21 * 32 + 16,
                radius: 50,
                message: "เครื่องชงกาแฟอัตโนมัติ.. มันก็กลั่นสารสกัดออกมาได้ตามปกติ แต่แปลกชะมัด ไม่เคยเห็นใครมาเติมเมล็ดกาแฟสักครั้ง มันทำงานด้วยหลักการสังเคราะห์โมเลกุลหรือยังไงกัน?"
            });

            this.interactions.add({
                x: 31.5 * 32,
                y: 21 * 32,
                radius: 80,
                message: "เตียงนอนชั่วคราวของฉัน.. ตัวฟองน้ำไม่ได้แย่หรอกนะ แต่ความคิดที่ว่ามีแบคทีเรียจากคนอย่างน้อย 10 คนมาสะสมอยู่บนนี้ มันชวนให้รู้สึกขนลุกเป็นบ้า"
            });
        }

        // Interaction และระบบแสงสว่างใน Lab Zone A1
        if (this.currentMapKey === 'lab_zone_a1') {
            this.createDarkRoomLighting();

            // จุดตรวจจับ / ใช้งาน PC ที่ Grid (94, 108.5) ครอบคลุมทั้งบริเวณโต๊ะและเก้าอี้
            this.interactions.add({
                x: 94 * 32 + 16,
                y: 108.5 * 32,
                radius: 95,
                onInteract: () => {
                    this.interactions.lock();
                    this.scene.launch('PCScene', { parentSceneKey: 'GameplayScene' });
                }
            });

            // จุดตรวจจับ / พูดคุยกับ Survivor (เจมส์) ที่ Grid (80, 43)
            this.interactions.add({
                x: 80 * 32 + 16,
                y: 43 * 32 + 16,
                radius: 90,
                onInteract: () => {
                    this.handleSurvivorInteract();
                }
            });

            // แฟ้มเอกสารสูตรสารเคมีที่ห้องพยาบาล Grid (125, 92)
            this.formulaFolderSprite = this.add.sprite(125 * 32 + 16, 92 * 32 + 16, 'pc_icons', 160)
                .setScale(32 / 48)
                .setOrigin(0.5, 0.5);
            this.registerYSort(this.formulaFolderSprite, false);

            this.tweens.add({
                targets: this.formulaFolderSprite,
                y: 92 * 32 + 16 - 6,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const isQuest6Active = (this.hasCompletedQuest5 || (this.quest && this.quest.currentQuest && (this.quest.currentQuest.id === 6 || String(this.quest.currentQuest.id).startsWith('6'))));
            this.formulaFolderSprite.setVisible(isQuest6Active && !this.hasObtainedFormula);

            this.interactions.add({
                x: 125 * 32 + 16,
                y: 92 * 32 + 16,
                radius: 75,
                onInteract: () => {
                    if (this.hasObtainedFormula) return;
                    if (!this.hasCompletedQuest5 && (!this.quest || !this.quest.currentQuest || this.quest.currentQuest.id !== 6)) {
                        return;
                    }
                    this.handleGrabFormula();
                }
            });

            // ลบ Tile กล่องเสบียงเดิมในเลเยอร์ Objective_Items ออก (ห้ามลบเลเยอร์ Floor เพื่อไม่ให้พื้นแหว่งเป็นสีดำ)
            if (map) {
                map.layers.forEach(layerData => {
                    if (layerData.name === 'Objective_Items' || layerData.name === 'objective_items') {
                        if (layerData.tilemapLayer) {
                            layerData.tilemapLayer.removeTileAt(91, 55);
                            layerData.tilemapLayer.removeTileAt(92, 55);
                        }
                    }
                });
            }

            // สร้าง Sprite กล่องเสบียงเอง ตรงกลางระหว่าง Grid (91, 55) และ (92, 55) พร้อมขยายขนาดให้สวยงาม
            const supplyBoxWorldX = 91.5 * 32 + 16;
            const supplyBoxWorldY = 55 * 32 + 16;

            if (!this.hasSupplyBox && !this.hasDeliveredSupplies) {
                this.supplyBoxSprite = this.add.sprite(supplyBoxWorldX, supplyBoxWorldY, 'supply_box_img')
                    .setScale(42 / 64)
                    .setOrigin(0.5, 0.5);
                this.registerYSort(this.supplyBoxSprite, false);
            }

            // จุดหยิบกล่องเสบียงที่ห้องครัว
            this.interactions.add({
                x: supplyBoxWorldX,
                y: supplyBoxWorldY,
                radius: 80,
                onInteract: () => {
                    if (this.hasSupplyBox || this.hasDeliveredSupplies) return;
                    this.hasSupplyBox = true;
                    if (this.supplyBoxSprite) {
                        this.supplyBoxSprite.destroy();
                        this.supplyBoxSprite = null;
                    }
                    if (map) {
                        map.layers.forEach(layerData => {
                            if (layerData.name === 'Objective_Items' || layerData.name === 'objective_items') {
                                if (layerData.tilemapLayer) {
                                    layerData.tilemapLayer.removeTileAt(91, 55);
                                    layerData.tilemapLayer.removeTileAt(92, 55);
                                }
                            }
                        });
                    }

                    this.interactions.lock();
                    this.player.setVelocity(0, 0);
                    this.player.anims.play('idle', true);

                    this.interactions.dialogue.showSequence([
                        "หนักเป็นบ้า",
                        "นี่กะจะอยู่สักกี่ปีเนี่ย.."
                    ], () => {
                        this.interactions.unlock();
                        if (this.quest && this.quest.currentQuest && this.quest.currentQuest.title.includes('เสบียง')) {
                            this.quest.completeQuest(this.quest.currentQuest.id, true);
                            this.quest.addQuest('6.1', 'นำเสบียงไปให้เจมส์', { type: 'tile', x: 80, y: 43 });
                        }
                    });
                }
            });

            // สร้างปุ่ม UI [ สร้างสารกัดกร่อน ] ไว้ตรงกลางหน้าจอ
            this.createCraftChemicalUI();

            // ลบ Tile ซากศพและคีย์การ์ดเดิมในเลเยอร์ Mission_Prop และ Objective_Items ที่ Grid (11, 9)
            if (map) {
                map.layers.forEach(layerData => {
                    if (layerData.name === 'Mission_Prop' || layerData.name === 'Objective_Items' || layerData.name === 'mission_prop' || layerData.name === 'objective_items') {
                        if (layerData.tilemapLayer) {
                            layerData.tilemapLayer.removeTileAt(11, 9);
                        }
                    }
                });
            }

            // วาง Sprite ซากศพ (body.png) ขนาดเต็ม 64x64 ที่ห้องออฟฟิศ Grid (11, 9)
            this.bodySprite = this.add.sprite(11 * 32 + 16, 9 * 32 + 16, 'body_img')
                .setScale(1.0)
                .setOrigin(0.5, 0.5);
            this.registerYSort(this.bodySprite, false);

            // วาง Sprite คีย์การ์ด (keycard.png) ที่ Grid (11, 9) พร้อมเอฟเฟกต์ประกายแสงเรืองรอง
            if (!this.hasKeycard) {
                this.keycardSprite = this.add.sprite(11 * 32 + 16, 9 * 32 + 16, 'keycard_img')
                    .setScale(26 / 64)
                    .setOrigin(0.5, 0.5);
                this.registerYSort(this.keycardSprite, false);

                this.tweens.add({
                    targets: this.keycardSprite,
                    scale: 32 / 64,
                    alpha: 0.65,
                    duration: 650,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                this.keycardGlow = this.add.circle(11 * 32 + 16, 9 * 32 + 16, 10, 0xffffff, 0.45);
                this.tweens.add({
                    targets: this.keycardGlow,
                    scale: 1.8,
                    alpha: 0.08,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            // จุดหยิบคีย์การ์ดที่ Grid (11, 9)
            this.interactions.add({
                x: 11 * 32 + 16,
                y: 9 * 32 + 16,
                radius: 75,
                onInteract: () => {
                    if (this.hasKeycard) return;
                    this.hasKeycard = true;

                    if (this.keycardSprite) {
                        this.keycardSprite.destroy();
                        this.keycardSprite = null;
                    }
                    if (this.keycardGlow) {
                        this.keycardGlow.destroy();
                        this.keycardGlow = null;
                    }

                    this.interactions.lock();
                    this.player.setVelocity(0, 0);
                    this.player.anims.play('idle', true);

                    if (this.quest) {
                        if (this.quest.currentQuest && this.quest.currentQuest.id === 9) {
                            this.quest.completeQuest(9, true);
                        }
                        // เพิ่ม Quest 10: สำรวจออฟฟิศย่อย (98, 107)
                        this.quest.addQuest(10, 'สำรวจออฟฟิศย่อย', { type: 'tile', x: 98, y: 107 });
                    }

                    const keycardDialogue = [
                        "ในที่สุด กว่าจะได้แกมานี่มันไม่ง่ายเลย",
                        "ต่อไปกลับไปที่ออฟฟิศย่อย"
                    ];

                    this.interactions.dialogue.showSequence(keycardDialogue, () => {
                        if (this.interactions) {
                            this.interactions.unlock();
                        }
                    });
                }
            });

            // จุดตรวจจับ / ใช้งาน Exit Security Terminal ที่ Grid (160, 42)
            this.interactions.add({
                x: 160 * 32 + 16,
                y: 42 * 32 + 16,
                radius: 70,
                onInteract: () => {
                    if (!this.game.registry.get('hasInspectedTerminal')) {
                        this.game.registry.set('hasInspectedTerminal', true);

                        this.interactions.lock();
                        this.player.setVelocity(0, 0);
                        this.player.anims.play('idle', true);

                        const hasVisitedBefore = this.game.registry.get('hasVisitedSmallOfficeDoorBefore') || this.hasVisitedSmallOfficeDoorBefore;
                        const hasVisitedOfficeBefore = this.game.registry.get('hasVisitedMainOfficeDoorBefore') || this.hasVisitedMainOfficeDoorBefore;

                        if (hasVisitedBefore && hasVisitedOfficeBefore) {
                            const terminalDialogue = [
                                "รหัสผ่าน??",
                                "ฉันไม่รู้ว่ารหัสมันคืออะไรนะ ปกติประตูนี้มันก็ไม่เคยล็อกซะด้วยสิ",
                                "ลองไปดูห้องออฟฟิศย่อยดีกว่า",
                                "เป็นห้องของผู้อำนวยการแล็บนี้",
                                "แต่เดี๋ยวก่อน",
                                "มันล็อกอยู่นี่นา",
                                "บ้าจริง มันต้องใช้คีย์การ์ด",
                                "มีแค่นักวิจัยอาวุโสเท่านั้นที่จะมีคีย์การ์ดระดับ ACL4",
                                "พวกเขาอยู่ที่ออฟฟิศทางตะวันตกเฉียงเหนือ",
                                "... มันล็อกแบบปิดตายอยู่",
                                "ไม่ตลกเลยนะ..",
                                "...มันต้องมีทางสิ ... .... จริงด้วย!",
                                "สารละลายโลหะที่แล็บเราเพิ่งคิดค้น",
                                "แต่ฉันต้องการสูตรสารนี่เสียก่อน",
                                "แย่ละ มันอยู่ไหนละเนี่ย"
                            ];

                            this.interactions.dialogue.showSequence(terminalDialogue, () => {
                                this.interactions.unlock();
                                this.hasCompletedQuest5 = true;
                                if (this.quest) {
                                    this.quest.addQuest(4, 'ไปห้องออฟฟิศย่อย', { type: 'tile', x: 97, y: 106 });
                                    this.quest.completeQuest(4, true);
                                    this.quest.addQuest(5, 'ไปห้องออฟฟิศ', { type: 'tile', x: 17, y: 21 });
                                    this.quest.completeQuest(5, true);
                                    this.quest.addQuest(6, 'ค้นหาสูตรสารเคมี', { type: 'none' }, 'สำรวจ โรงอาหาร ห้องทดลอง ห้องน้ำ ห้องพยาบาล เพื่อค้นหาสูตรสารเคมี');
                                    if (this.formulaFolderSprite) {
                                        this.formulaFolderSprite.setVisible(true);
                                    }
                                }
                            });
                        } else if (hasVisitedBefore) {
                            const terminalDialogue = [
                                "รหัสผ่าน??",
                                "ฉันไม่รู้ว่ารหัสมันคืออะไรนะ ปกติประตูนี้มันก็ไม่เคยล็อกซะด้วยสิ",
                                "ลองไปดูห้องออฟฟิศย่อยดีกว่า",
                                "เป็นห้องของผู้อำนวยการแล็บนี้",
                                "แต่เดี๋ยวก่อน",
                                "มันล็อกอยู่นี่นา",
                                "บ้าจริง มันต้องใช้คีย์การ์ด",
                                "มีแค่นักวิจัยอาวุโสเท่านั้นที่จะมีคีย์การ์ดระดับ ACL4",
                                "พวกเขาอยู่ที่ออฟฟิศทางตะวันตกเฉียงเหนือ"
                            ];

                            this.interactions.dialogue.showSequence(terminalDialogue, () => {
                                this.interactions.unlock();
                                // ผู้เล่นเคยไปสำรวจประตูมาแล้ว จึงข้ามการทำเควสต์ 4 และเริ่มเควสต์ 5 ทันที
                                if (this.quest) {
                                    this.quest.addQuest(4, 'ไปห้องออฟฟิศย่อย', { type: 'tile', x: 97, y: 106 });
                                    this.quest.completeQuest(4, true);
                                    this.quest.addQuest(5, 'ไปห้องออฟฟิศ', { type: 'tile', x: 17, y: 21 });
                                }
                            });
                        } else {
                            const terminalDialogue = [
                                "รหัสผ่าน??",
                                "ฉันไม่รู้ว่ารหัสมันคืออะไรนะ ปกติประตูนี้มันก็ไม่เคยล็อกซะด้วยสิ",
                                "ลองไปดูห้องออฟฟิศย่อยดีกว่า",
                                "เป็นห้องของผู้อำนวยการแล็บนี้"
                            ];

                            this.interactions.dialogue.showSequence(terminalDialogue, () => {
                                this.interactions.unlock();
                                // เพิ่มเควสต์ที่ 4: ไปห้องออฟฟิศย่อย
                                if (this.quest) {
                                    this.quest.addQuest(4, 'ไปห้องออฟฟิศย่อย', { type: 'tile', x: 97, y: 106 });
                                }
                            });
                        }
                    } else {
                        const passcode = this.game.registry.get('exitPasscode');
                        this.terminalPanel.open(passcode, () => {
                            // ปลดล็อกสำเร็จเมื่อใส่รหัสผ่านถูกต้อง
                            if (this.quest) {
                                this.quest.completeQuest(3, true);
                            }

                            // คำนวณเวลาที่ใช้ (time to complete)
                            const labStartTime = this.game.registry.get('labStartTime') || Date.now();
                            const completionTimeMs = Date.now() - labStartTime;
                            this.game.registry.set('completionTimeMs', completionTimeMs);

                            if (this.interactions) {
                                this.interactions.lock();
                            }
                            if (this.player && this.player.body) {
                                this.player.setVelocity(0, 0);
                                this.player.anims.play('idle', true);
                            }

                            // เฟดจอดำแล้วเข้าสู่ Victory Scene
                            this.time.delayedCall(600, () => {
                                this.cameras.main.fadeOut(800, 0, 0, 0);
                                this.cameras.main.once('camerafadeoutcomplete', () => {
                                    this.scene.start('VictoryScene', {
                                        collectedNotesCount: (this.game.registry.get('collectedNoteIds') || []).length,
                                        restartCount: this.game.registry.get('restartCount') || 0,
                                        completionTimeMs: completionTimeMs
                                    });
                                });
                            });
                        });
                    }
                }
            });
            // เริ่มต้นระบบเก็บ Note Collectibles ทั้ง 7 ชิ้นในห้องแล็บ
            this.spawnCollectibleNotes();

            // เริ่มต้นระบบซอมบี้ 15 ตัวพร้อมระบบ AI Pathfinding ทั่วทั้งแผนที่
            this.zombieManager = new ZombieManager(this, map);
        }

        // ปุ่มไอคอน Map ที่มุมขวาล่างของหน้าจอ (คำนวณชดเชย Camera Zoom 1.5x ให้แสดงผลสวยงามที่ขอบจอล่างขวา)
        const camZoom = this.cameras.main.zoom || 1.5;
        const cx = 640;
        const cy = 360;
        const hudX = cx + (cx - 36) / camZoom;
        const hudY = cy + (cy - 36) / camZoom;
        const baseIconScale = (44 / 317) / camZoom;

        this.mapIconBtn = this.add.image(hudX, hudY, 'map_icon_img')
            .setScale(baseIconScale)
            .setScrollFactor(0)
            .setDepth(15000)
            .setInteractive({ useHandCursor: true });

        this.mapIconBtn.on('pointerover', () => {
            this.mapIconBtn.setScale(baseIconScale * 1.15);
            this.mapIconBtn.setTint(0x88e0ff);
        });
        this.mapIconBtn.on('pointerout', () => {
            this.mapIconBtn.setScale(baseIconScale);
            this.mapIconBtn.clearTint();
        });
        this.mapIconBtn.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.playButtonClickSound();
            if (!this.scene.isActive('MapScene') && !this.scene.isActive('PCScene')) {
                this.interactions.lock();
                this.scene.launch('MapScene', { parentSceneKey: 'GameplayScene' });
            }
        });

        // คีย์ลัด M สำหรับเปิด/ปิดแผนที่
        this.input.keyboard.on('keydown-M', () => {
            if (this.scene.isActive('MapScene')) {
                this.scene.stop('MapScene');
                this.interactions.unlock();
            } else if (!this.scene.isActive('PCScene') && (!this.interactions.dialogue || !this.interactions.dialogue.isActive)) {
                this.interactions.lock();
                this.scene.launch('MapScene', { parentSceneKey: 'GameplayScene' });
            }
        });

        // Note Collection HUD ที่มุมซ้ายล่างของหน้าจอ (ใช้ Tile #97 จาก 19_Hospital_32x32.png)
        const noteHudX = cx - (cx - 42) / camZoom;
        const noteHudY = cy + (cy - 42) / camZoom;
        const noteIconScale = (56 / 32) / camZoom;

        this.noteHudIcon = this.add.image(noteHudX, noteHudY, 'hospital_tiles', 97)
            .setScale(noteIconScale)
            .setScrollFactor(0)
            .setDepth(15000)
            .setInteractive({ useHandCursor: true });

        const totalNotes = 7;
        const collectedNotes = (this.game.registry.get('collectedNoteIds') || []).length;
        this.noteHudText = this.add.text(noteHudX + (28 / camZoom), noteHudY, `${collectedNotes}/${totalNotes}`, {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: `${Math.round(24 / camZoom)}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            resolution: 2
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(15000);

        // Tooltip แสดงเมื่อ Hover บน Note HUD ("เก็บโน๊ตที่อยู่ตามฉาก")
        this.noteTooltipContainer = this.add.container(noteHudX + (12 / camZoom), noteHudY - (36 / camZoom))
            .setScrollFactor(0)
            .setDepth(20000)
            .setVisible(false);

        const tipText = this.add.text(0, 0, 'เก็บโน๊ตที่อยู่ตามฉาก', {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: `${Math.round(15 / camZoom)}px`,
            fontStyle: 'bold',
            color: '#000000',
            resolution: 2
        }).setOrigin(0.5);

        const tipW = tipText.width + 16;
        const tipH = tipText.height + 8;
        const tipBg = this.add.rectangle(0, 0, tipW, tipH, 0xffffff)
            .setStrokeStyle(1.5, 0x000000);

        this.noteTooltipContainer.add([tipBg, tipText]);

        this.noteHudIcon.on('pointerover', () => {
            const isPopupOpen = (
                this.scene.isActive('MapScene') ||
                this.scene.isActive('PCScene') ||
                this.scene.isActive('QuestScene') ||
                this.scene.isActive('NoteScene') ||
                (this.interactions && this.interactions.dialogue && this.interactions.dialogue.isActive)
            );
            if (!isPopupOpen) {
                this.noteTooltipContainer.setVisible(true);
            }
        });
        this.noteHudIcon.on('pointerout', () => {
            this.noteTooltipContainer.setVisible(false);
        });

        // สร้างและเริ่มต้นระบบ Quest และ Terminal Panel
        this.quest = new QuestManager(this);
        this.quest.createHUD(camZoom);
        this.terminalPanel = new TerminalPanel(this);

        // จัดการเควสต์และบทสนทนาตามฉากปัจจุบัน (พร้อม Tutorial สอนเล่นใน Break Room)
        if (this.currentMapKey === 'break_room') {
            // ล็อกการควบคุมและเริ่มฉากบทสนทนาเปิดเรื่อง + สอนระบบเบื้องต้น
            this.interactions.lock();
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);

            const introDialogue = [
                "นี่ก็ผ่านไปสามวันแล้วสินะ",
                "ฉันได้ยินเสียงกรีดร้องจากข้างนอกเมื่อสามวันก่อนแต่ตอนนี้มันหายไปแล้ว",
                "มันก็หายไปตั้งแต่สามวันที่แล้วๆ หล่ะ",
                "...",
                "ฉันคงอยู่เฉยๆ ไม่ได้แล้วหละต้องหาทางออก!",
                "💡 [คู่มือการเอาชีวิตรอด]:\n• เดิน: ใช้ปุ่ม [W][A][S][D] หรือ [ปุ่มลูกศร]\n• วิ่ง: กด [Spacebar] ค้างไว้พร้อมกับเดิน",
                "💡 [ระบบเสียง & ซอมบี้]:\n• แถบ Noise ด้านล่างจะบอกระดับเสียงที่คุณสร้าง\n• การเดินส่งเสียงเบา แต่การ 'วิ่ง' จะทำให้ซอมบี้ที่อยู่ในจอได้ยินและวิ่งเข้าหาทันที!",
                "💡 [การกลั้นหายใจ]:\n• กด [E] ค้างไว้เพื่อกลั้นหายใจ ตัวละครจะหยุดนิ่งและระดับเสียงจะลดเหลือศูนย์\n• ซอมบี้จะไม่ตรวจพบคุณแม้จะยืนอยู่ใกล้ๆ (แต่ระวังออกซิเจนหมด!)",
                "💡 [การสำรวจ & โต้ตอบ]:\n• คลิก [เมาส์ซ้าย (LMB)] ที่ประตูหรือสิ่งของในระยะเพื่อเปิด/ปิด หรือสำรวจ\n• ประตูที่ปิดอยู่จะช่วยป้องกันคุณจากการโจมตีของซอมบี้ได้ 100%"
            ];

            this.time.delayedCall(400, () => {
                this.interactions.dialogue.showSequence(introDialogue, () => {
                    // หลังจากคลิกบทสนทนาจนครบแล้ว จึงแสดงเควสต์ใหม่และปลดล็อกการควบคุม
                    this.interactions.unlock();
                    if (this.quest && this.quest.currentQuest) {
                        this.quest.showNotification(this.quest.currentQuest, false);
                        this.quest.startGlowingHUD();
                    }
                });
            });
        } else if (this.currentMapKey === 'lab_zone_a1') {
            // เมื่ออยู่ใน Lab: เควสต์ที่ 1 สำเร็จแล้ว และเริ่มต้นเควสต์ที่ 2 ทันที
            if (this.quest) {
                this.quest.completedQuests = [{
                    id: 1,
                    title: 'หลบหนีผ่านช่องระบายอากาศ',
                    status: 'completed'
                }];
                this.quest.currentQuest = {
                    id: 2,
                    title: 'ไปยังทางออก',
                    objective: {
                        type: 'rect',
                        minTileX: 152,
                        maxTileX: 171,
                        minTileY: 43,
                        maxTileY: 50
                    },
                    status: 'current'
                };
            }

            // ตรวจสอบบทสนทนาเมื่อผู้เล่นเข้าห้องแล็บเป็นครั้งแรก
            if (!this.game.registry.get('hasPlayedLabDialogue')) {
                this.game.registry.set('hasPlayedLabDialogue', true);

                this.interactions.lock();
                this.player.setVelocity(0, 0);
                this.player.anims.play('idle', true);

                const labIntroDialogue = [
                    "นี่มันเกิดอะไรขึ้นกันเนี่ย..",
                    "เลือดเต็มไปหมด..",
                    "ไม่รู้ละ ฉันจะต้องออกไปจากที่นี่ก่อน"
                ];

                this.time.delayedCall(400, () => {
                    this.interactions.dialogue.showSequence(labIntroDialogue, () => {
                        this.interactions.unlock();
                        if (this.quest && this.quest.currentQuest) {
                            this.quest.showNotification(this.quest.currentQuest, false);
                            this.quest.startGlowingHUD();
                        }
                    });
                });
            } else if (this.quest && this.quest.currentQuest) {
                this.quest.showNotification(this.quest.currentQuest, false);
            }
        }

        // ระบบสูตรโกง (Cheat Code): ↑ ↑ ↓ ↓ ← → ← → A B ENTER
        this.cheatKeys = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'a', 'b', 'Enter'];
        this.cheatIndex = 0;

        this.input.keyboard.on('keydown', (event) => {
            // ไม่ทำงานหากกำลังเปิดหน้าต่างใดๆ อยู่
            if (
                (this.interactions && this.interactions.dialogue && this.interactions.dialogue.isOpen()) ||
                this.scene.isActive('PCScene') ||
                this.scene.isActive('MapScene') ||
                (this.terminalPanel && this.terminalPanel.isOpen()) ||
                (this.quest && this.quest.questWindow)
            ) {
                this.cheatIndex = 0;
                return;
            }

            const key = event.key;
            const expectedKey = this.cheatKeys[this.cheatIndex];

            if (key.toLowerCase() === expectedKey.toLowerCase()) {
                this.cheatIndex++;
                if (this.cheatIndex === this.cheatKeys.length) {
                    this.cheatIndex = 0;
                    const currentCode = this.game.registry.get('exitPasscode');
                    if (this.quest) {
                        this.quest.showSecurityCodeBanner(currentCode);
                    }
                }
            } else {
                // กดผิดปุ่ม ให้รีเซ็ตลำดับ
                this.cheatIndex = (key.toLowerCase() === this.cheatKeys[0].toLowerCase()) ? 1 : 0;
            }
        });
    }

    createDoorAnimations() {
        // ประตูบานเลื่อน 14 เฟรม (horizontal_slide_glass_door)
        if (!this.anims.exists('open_horizontal_slide_glass_door')) {
            this.anims.create({
                key: 'open_horizontal_slide_glass_door',
                frames: this.anims.generateFrameNumbers('horizontal_slide_glass_door', { frames: [0, 1, 2, 3, 4, 5, 6] }),
                frameRate: 12,
                repeat: 0
            });
        }
        if (!this.anims.exists('close_horizontal_slide_glass_door')) {
            this.anims.create({
                key: 'close_horizontal_slide_glass_door',
                frames: this.anims.generateFrameNumbers('horizontal_slide_glass_door', { frames: [7, 8, 9, 10, 11, 12, 13, 0] }),
                frameRate: 12,
                repeat: 0
            });
        }

        // ประตู 8 เฟรม: เปิดคือ 1->5 (index 0..4), ปิดคือ 6->8 ไป 1 (index 5, 6, 7, 0)
        const eightFrameDoors = [
            'door_verti_1',
            'vertical_glass_door_right',
            'horizontal_glass_door_right',
            'verti_32_door_right_no3',
            'verti_32_door_left_no2'
        ];

        eightFrameDoors.forEach(key => {
            const openKey = 'open_' + key;
            const closeKey = 'close_' + key;

            if (!this.anims.exists(openKey)) {
                this.anims.create({
                    key: openKey,
                    frames: this.anims.generateFrameNumbers(key, { frames: [0, 1, 2, 3, 4] }),
                    frameRate: 10,
                    repeat: 0
                });
            }

            if (!this.anims.exists(closeKey)) {
                this.anims.create({
                    key: closeKey,
                    frames: this.anims.generateFrameNumbers(key, { frames: [5, 6, 7, 0] }),
                    frameRate: 10,
                    repeat: 0
                });
            }
        });

        // ประตู 5 เฟรม: เปิดคือ 0..4, ปิดคือ 4..0
        const fiveFrameDoors = ['big_32_h_door_no6'];
        fiveFrameDoors.forEach(key => {
            const openKey = 'open_' + key;
            const closeKey = 'close_' + key;

            if (!this.anims.exists(openKey)) {
                this.anims.create({
                    key: openKey,
                    frames: this.anims.generateFrameNumbers(key, { frames: [0, 1, 2, 3, 4] }),
                    frameRate: 10,
                    repeat: 0
                });
            }

            if (!this.anims.exists(closeKey)) {
                this.anims.create({
                    key: closeKey,
                    frames: this.anims.generateFrameNumbers(key, { frames: [4, 3, 2, 1, 0] }),
                    frameRate: 10,
                    repeat: 0
                });
            }
        });

        if (!this.anims.exists('anim_server_box')) {
            this.anims.create({
                key: 'anim_server_box',
                frames: this.anims.generateFrameNumbers('server_box', { start: 0, end: 2 }),
                frameRate: 4,
                repeat: -1
            });
        }

        // แอนิเมชันเปิดเครื่อง PC (17 เฟรม / เล่นยาว ~7 วินาที)
        if (!this.anims.exists('anim_pc_startup')) {
            this.anims.create({
                key: 'anim_pc_startup',
                frames: this.anims.generateFrameNumbers('pc_startup', { start: 0, end: 16 }),
                frameRate: 2.43, // 17 เฟรม / 7 วิ = ~2.43 fps
                repeat: 0
            });
        }
    }

    /**
     * สร้างระบบแสงเงาความมืดในห้องมืด และแสงเรืองจากหน้าจอ PC ที่ Grid (94, 108-109)
     */
    createDarkRoomLighting() {
        if (this.currentMapKey !== 'lab_zone_a1') return;

        // ขอบเขตพื้นที่ห้องมืดตามสเปก โดยเริ่มจาก Y = 99 เป็นต้นไป (ไม่ล้ำขึ้นไปที่ Y = 98)
        const darkRects = [
            { x: 93 * 32, y: 99 * 32,  w: 3 * 32, h: 12 * 32 }, // ฝั่งซ้าย (x: 93..95, y: 99..110)
            { x: 96 * 32, y: 101 * 32, w: 1 * 32, h: 10 * 32 }, // ช่องประตู (x: 96, y: 101..110)
            { x: 97 * 32, y: 99 * 32,  w: 5 * 32, h: 12 * 32 }, // กลางห้อง (x: 97..101, y: 99..110)
            { x: 102 * 32, y: 105 * 32, w: 7 * 32, h: 6 * 32 }  // ฝั่งขวา (x: 102..108, y: 105..110)
        ];

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        darkRects.forEach(r => {
            if (r.x < minX) minX = r.x;
            if (r.y < minY) minY = r.y;
            if (r.x + r.w > maxX) maxX = r.x + r.w;
            if (r.y + r.h > maxY) maxY = r.y + r.h;
        });

        const rtW = maxX - minX + 32;
        const rtH = maxY - minY + 32;

        const canvasKey = 'dark_room_light_tex_' + Date.now();
        const canvasTex = this.textures.createCanvas(canvasKey, rtW, rtH);
        const ctx = canvasTex.context;

        // 1. ลงสีความมืดสลัวครอบคลุมทุกเลเยอร์ในห้อง
        ctx.fillStyle = 'rgba(5, 9, 18, 0.84)';
        darkRects.forEach(r => {
            ctx.fillRect(r.x - minX, r.y - minY, r.w, r.h);
        });

        // 2. ตำแหน่งจอ PC ที่ Grid (94, 108.5)
        const pcRelX = (94 * 32 + 16) - minX;
        const pcRelY = (108.5 * 32) - minY;

        // ลบเงาความมืดตรงตำแหน่งจอ PC ด้วย Radial Gradient เพื่อให้สว่างเห็นพื้นและตัวละคร
        ctx.globalCompositeOperation = 'destination-out';
        const gradErase = ctx.createRadialGradient(pcRelX, pcRelY, 10, pcRelX, pcRelY, 135);
        gradErase.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        gradErase.addColorStop(0.35, 'rgba(0, 0, 0, 0.7)');
        gradErase.addColorStop(0.7, 'rgba(0, 0, 0, 0.35)');
        gradErase.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradErase;
        ctx.beginPath();
        ctx.arc(pcRelX, pcRelY, 135, 0, Math.PI * 2);
        ctx.fill();

        // เติมแสงสีฟ้าไซอันเรืองรอบจอ PC และกระจายแสงสลัวออกไปรอบข้าง
        ctx.globalCompositeOperation = 'source-over';
        const gradCyan = ctx.createRadialGradient(pcRelX, pcRelY, 4, pcRelX, pcRelY, 120);
        gradCyan.addColorStop(0, 'rgba(140, 230, 255, 0.45)');
        gradCyan.addColorStop(0.35, 'rgba(90, 190, 255, 0.25)');
        gradCyan.addColorStop(0.75, 'rgba(40, 130, 230, 0.08)');
        gradCyan.addColorStop(1, 'rgba(0, 50, 160, 0)');
        ctx.fillStyle = gradCyan;
        ctx.beginPath();
        ctx.arc(pcRelX, pcRelY, 120, 0, Math.PI * 2);
        ctx.fill();

        canvasTex.refresh();

        const lightImage = this.add.image(minX, minY, canvasKey);
        lightImage.setOrigin(0, 0);
        lightImage.setDepth(15000); // วางไว้เหนือทุกเลเยอร์แผนที่และเฟอร์นิเจอร์

        // เพิ่มการกระพริบหายใจของแสงไฟจอคอมพิวเตอร์อย่างเป็นธรรมชาติ
        this.tweens.add({
            targets: lightImage,
            alpha: 0.94,
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const pcGlow = this.add.circle(94 * 32 + 16, 108.5 * 32, 12, 0x90e8ff, 0.4);
        pcGlow.setDepth(100);
        this.tweens.add({
            targets: pcGlow,
            scale: 1.25,
            alpha: 0.2,
            duration: 1300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    pushPlayerOutOfDoor(door) {
        if (!this.player || !this.player.body) return;

        const pBody = this.player.body;
        const px = this.player.x;
        const py = this.player.y;

        const tsW = door.tsWidth || 64;
        const tsH = door.tsHeight || 64;
        const left = door.worldX;
        const right = door.worldX + tsW;
        const bottom = door.worldY;
        const top = door.worldY - tsH;

        // ตรวจสอบว่าตัวละครยืนทับหรือขวางช่องประตูอยู่หรือไม่
        const isOverlapping = (
            pBody.right >= left - 6 &&
            pBody.left <= right + 6 &&
            pBody.bottom >= top - 6 &&
            pBody.top <= bottom + 6
        );

        if (!isOverlapping) return;

        const isHorizontal = door.isHorizontal !== undefined ? door.isHorizontal : (tsW >= tsH || tsH <= 64);
        let targetX = px;
        let targetY = py;

        if (isHorizontal) {
            // ดันขึ้นหรือลงให้พ้นช่องประตูแนวนอน
            if (py < door.centerY) {
                targetY = top - 14;
            } else {
                targetY = bottom + 16;
            }
        } else {
            // ดันซ้ายหรือขวาให้พ้นช่องประตูแนวตั้ง
            if (px < door.centerX) {
                targetX = left - 18;
            } else {
                targetX = right + 18;
            }
        }

        this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: 120,
            ease: 'Power2'
        });
    }

    /**
     * เปลี่ยนผ่านจากห้อง Break Room ไปยัง Lab Zone A1
     */
    transitionToLab() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
        }

        // Fade out สู่หน้าจอดำ แล้วเริ่มห้องแล็บ Lab Zone A1
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart({
                mapKey: 'lab_zone_a1',
                spawnX: 53 * 32 + 16,
                spawnY: 72 * 32 + 16
            });
        });
    }

    /**
     * ดักจับเมื่อผู้เล่นเดินเข้าสู่พื้นที่ทางออกของเควสต์ที่ 2
     */
    onReachExitArea() {
        if (this.hasReachedExitArea) return;
        this.hasReachedExitArea = true;

        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
        }

        this.interactions.dialogue.show("ให้ตายเถอะ.. นี่มันน่าสยดสยองเกินไปแล้ว..", () => {
            if (this.interactions) {
                this.interactions.unlock();
            }
            if (this.quest) {
                this.quest.completeQuest(2, true);
                this.quest.addQuest(3, 'ออกจากที่นี่', { type: 'tile', x: 160, y: 42 });
            }
        });
    }

    toggleDoor(door) {
        if (!door || !door.sprite) return;

        // 1. ตรวจสอบประตูห้องออฟฟิศย่อยที่ Grid (96, 100) และ (109, 108) ซึ่งถูกล็อกและต้องใช้คีย์การ์ด
        const isOfficeDoor = (
            (door.gridX >= 95 && door.gridX <= 98 && door.gridY >= 99 && door.gridY <= 101) ||
            (door.gridX >= 107 && door.gridX <= 110 && door.gridY >= 107 && door.gridY <= 109)
        );

        if (isOfficeDoor) {
            if (this.hasKeycard) {
                // ได้รับคีย์การ์ด ACL4 แล้ว
                if (!this.hasPlayedKeycardDoorDialogue) {
                    this.hasPlayedKeycardDoorDialogue = true;

                    if (this.interactions) {
                        this.interactions.lock();
                    }
                    if (this.player && this.player.body) {
                        this.player.setVelocity(0, 0);
                        this.player.anims.play('idle', true);
                    }

                    const unlockDialogue = [
                        "ตื่นเต้นชะมัด",
                        "เอาละความฝันและความหวังของทุกคน"
                    ];

                    this.interactions.dialogue.showSequence(unlockDialogue, () => {
                        if (this.interactions) {
                            this.interactions.unlock();
                        }
                        // เปิดประตูทันทีหลังคุยจบ
                        this.executeToggleDoor(door);
                    });
                    return;
                }
                // เปิด-ปิดปกติในครั้งถัดไป
            } else {
                const hasQuest4OrAbove = (this.quest && this.quest.currentQuest && this.quest.currentQuest.id >= 4) ||
                    this.game.registry.get('hasInspectedTerminal') ||
                    (this.quest && this.quest.completedQuests && this.quest.completedQuests.some(q => q.id >= 4));

                if (!hasQuest4OrAbove) {
                    // ผู้เล่นมากดประตูก่อนที่จะเริ่มเควสต์เกี่ยวกับประตูนี้
                    this.game.registry.set('hasVisitedSmallOfficeDoorBefore', true);
                    this.hasVisitedSmallOfficeDoorBefore = true;

                    const earlyDoorDialogue = [
                        "ฉันมาทำอะไรที่นี่เนี้ย ... ฉันก็อยากหาผู้รอดชีวิตอยู่หรอก",
                        "มันล็อกอยู่แหะ",
                        "ช่างมันละกัน"
                    ];

                    this.interactions.dialogue.showSequence(earlyDoorDialogue);
                    return;
                }

                this.officeDoorAttempts = (this.officeDoorAttempts || 0) + 1;

                if (this.officeDoorAttempts === 1) {
                    const hasVisitedOfficeBefore = this.game.registry.get('hasVisitedMainOfficeDoorBefore') || this.hasVisitedMainOfficeDoorBefore;

                    if (hasVisitedOfficeBefore) {
                        const postDoorDialogue = [
                            "บ้าจริง มันต้องใช้คีย์การ์ด",
                            "มีแค่นักวิจัยอาวุโสเท่านั้นที่จะมีคีย์การ์ดระดับ ACL4",
                            "พวกเขาอยู่ที่ออฟฟิศทางตะวันตกเฉียงเหนือ",
                            "... มันล็อกแบบปิดตายอยู่",
                            "ไม่ตลกเลยนะ..",
                            "...มันต้องมีทางสิ ... .... จริงด้วย!",
                            "สารละลายโลหะที่แล็บเราเพิ่งคิดค้น",
                            "แต่ฉันต้องการสูตรสารนี่เสียก่อน",
                            "แย่ละ มันอยู่ไหนละเนี่ย"
                        ];

                        this.interactions.dialogue.showSequence(postDoorDialogue, () => {
                            this.hasCompletedQuest5 = true;
                            if (this.quest) {
                                if (this.quest.currentQuest && this.quest.currentQuest.id === 4) {
                                    this.quest.completeQuest(4, true);
                                }
                                this.quest.addQuest(5, 'ไปห้องออฟฟิศ', { type: 'tile', x: 17, y: 21 });
                                this.quest.completeQuest(5, true);
                                this.quest.addQuest(6, 'ค้นหาสูตรสารเคมี', { type: 'none' }, 'สำรวจ โรงอาหาร ห้องทดลอง ห้องน้ำ ห้องพยาบาล เพื่อค้นหาสูตรสารเคมี');
                                if (this.formulaFolderSprite) {
                                    this.formulaFolderSprite.setVisible(true);
                                }
                            }
                        });
                    } else {
                        const postDoorDialogue = [
                            "บ้าจริง มันต้องใช้คีย์การ์ด",
                            "มีแค่นักวิจัยอาวุโสเท่านั้นที่จะมีคีย์การ์ดระดับ ACL4",
                            "พวกเขาอยู่ที่ออฟฟิศทางตะวันตกเฉียงเหนือ"
                        ];

                        this.interactions.dialogue.showSequence(postDoorDialogue, () => {
                            if (this.quest) {
                                if (this.quest.currentQuest && this.quest.currentQuest.id === 4) {
                                    this.quest.completeQuest(4, true);
                                }
                                // เพิ่มเควสต์ที่ 5: ไปห้องออฟฟิศ (17, 21)
                                this.quest.addQuest(5, 'ไปห้องออฟฟิศ', { type: 'tile', x: 17, y: 21 });
                            }
                        });
                    }
                } else if (this.officeDoorAttempts === 7) {
                    this.interactions.dialogue.show("... นี่เราว่างขนาดมากดประตูเล่นถึง 7 ครั้งเลยเหรอ");
                } else {
                    this.interactions.dialogue.show("ฉันยังไม่มีคีย์การ์ด");
                }
                return;
            }
        }

        // 2. ตรวจสอบประตูห้องออฟฟิศหลักที่ Grid (33, 30), (33, 31), (33, 11)
        const isMainOfficeDoor = (
            door.gridX >= 32 && door.gridX <= 34 &&
            ((door.gridY >= 29 && door.gridY <= 32) || (door.gridY >= 10 && door.gridY <= 12))
        );

        if (isMainOfficeDoor) {
            const pTileX = this.player.x / 32;
            const pTileY = this.player.y / 32;
            const isInsideOffice = (pTileX >= 29 && pTileX <= 32.8 && pTileY >= 8 && pTileY <= 31.8);

            // หากผู้เล่นอยู่ด้านในห้องออฟฟิศ (29, 8) ถึง (32, 31) หรือประตูถูกละลายแล้ว -> เปิดได้ตามปกติ
            if (isInsideOffice || this.hasMeltedOfficeDoor) {
                // เปิด-ปิดปกติ
            } else if (this.hasCraftedChemical) {
                // ผู้เล่นมีสารเคมีกัดกร่อน -> คัตซีนพังประตู
                this.handleMeltOfficeDoor(door);
                return;
            } else {
                const isQuest5Active = (this.quest && this.quest.currentQuest && this.quest.currentQuest.id === 5);
                const isQuestAfter5 = (this.hasCompletedQuest5 || (this.quest && this.quest.completedQuests && this.quest.completedQuests.some(q => q.id >= 5)));

                if (!isQuest5Active && !isQuestAfter5) {
                    // ผู้เล่นมากดประตูออฟฟิศหลักก่อนเริ่มเควสต์ที่ 5
                    this.game.registry.set('hasVisitedMainOfficeDoorBefore', true);
                    this.hasVisitedMainOfficeDoorBefore = true;

                    const earlyMainOfficeDialogue = [
                        "ที่นี่คือห้องออฟฟิศ",
                        "ฉันไม่มีธุระที่นี่",
                        "ลองเปิดดูก็ได้",
                        "...",
                        "มันล็อกแบบปิดตาย",
                        "หวังว่าเราไม่จำเป็นต้องเข้าห้องนี้นะ"
                    ];
                    this.interactions.dialogue.showSequence(earlyMainOfficeDialogue);
                    return;
                }

                if (!this.hasCompletedQuest5) {
                    this.hasCompletedQuest5 = true;
                    if (this.quest) {
                        if (this.quest.currentQuest && this.quest.currentQuest.id === 5) {
                            this.quest.completeQuest(5, true);
                        }
                        // เพิ่มเควสต์ที่ 6: ค้นหาสูตรสารเคมี พร้อมคำอธิบาย
                        this.quest.addQuest(6, 'ค้นหาสูตรสารเคมี', { type: 'none' }, 'สำรวจ โรงอาหาร ห้องทดลอง ห้องน้ำ ห้องพยาบาล เพื่อค้นหาสูตรสารเคมี');
                        if (this.formulaFolderSprite) {
                            this.formulaFolderSprite.setVisible(true);
                        }
                    }

                    const officeDiscoveryDialogue = [
                        "ห๊ะ ...",
                        "ไม่ตลกเลยนะ..",
                        "มันล็อกแบบปิดตาย",
                        "...มันต้องมีทางสิ ... .... จริงด้วย!",
                        "สารละลายโลหะที่แล็บเราเพิ่งคิดค้น",
                        "แต่ฉันต้องการสูตรสารนี่เสียก่อน",
                        "แย่ละ มันอยู่ไหนละเนี่ย"
                    ];
                    this.interactions.dialogue.showSequence(officeDiscoveryDialogue);
                    return;
                } else {
                    this.mainOfficeDoorAttempts = (this.mainOfficeDoorAttempts || 0) + 1;

                    if (this.mainOfficeDoorAttempts === 10 && !this.hasPlayedOfficeSpamDialogue) {
                        this.hasPlayedOfficeSpamDialogue = true;
                        this.interactions.dialogue.show("มันล็อก! เข้าใจไหม! มันล็อกกกกกกกกกกกกกกกกกกกก กดอยู่ได้เดินทางต่อได้แล้วจะได้จบเกมนี่สักที");
                    } else {
                        this.interactions.dialogue.showSequence([
                            "เห้อ ล็อก..",
                            "ต้องสร้างสารละลายโลหะซะก่อน"
                        ]);
                    }
                    return;
                }
            }
        }

        // 3. ตรวจสอบประตูห้องแล็บที่ Grid (48, 76), (49, 76) และ (85, 103)
        const isLabDoor = (
            ((door.gridX >= 47 && door.gridX <= 50) && (door.gridY >= 75 && door.gridY <= 77)) ||
            ((door.gridX >= 84 && door.gridX <= 86) && (door.gridY >= 102 && door.gridY <= 104))
        );

        if (isLabDoor) {
            if (this.hasLabKey) {
                // ได้กุญแจแล้ว เปิด-ปิดประตูได้ปกติ
            } else {
                const isQuest4Completed = this.quest && this.quest.completedQuests.some(q => q.id === 4);

                if (isQuest4Completed) {
                    this.interactions.dialogue.show("นี่ก็ล็อก นู่นก็ล็อก มันจะมีสักประตูไหมที่ไม่ล็อก?!?!");
                } else {
                    this.interactions.dialogue.show("ประตูแล็ปมันล็อกอยู่ดูเเหมือนจะต้องใช้กุญแจ");
                }
                return;
            }
        }

        this.executeToggleDoor(door);
    }

    /**
     * ดำเนินการเปิด/ปิดประตูและจัดการ Collision
     */
    executeToggleDoor(door) {
        if (!door || !door.sprite) return;

        const doorsToToggle = door.pairedGroup || [door];
        const newIsOpen = !door.isOpen;

        doorsToToggle.forEach(d => {
            if (!d || !d.sprite) return;
            d.isOpen = newIsOpen;

            if (newIsOpen) {
                if (d.sprite.body) {
                    d.sprite.body.enable = false;
                }
                d.sprite.anims.play(d.openAnim, true);
            } else {
                // 1. ดันผู้เล่นให้ออกนอกช่องประตูก่อนทันที
                this.pushPlayerOutOfDoor(d);
                // 2. เปิด Collision ทันทีเพื่อกันผู้เล่นรีบวิ่งทะลุขณะกำลังปิด
                if (d.sprite.body) {
                    d.sprite.body.enable = true;
                }
                // 3. เล่นแอนิเมชันปิดประตู
                d.sprite.anims.play(d.closeAnim, true);
            }
        });
    }

    /**
     * คัตซีนกล้องแพนไปหา Survivor ที่ห้อง (80, 43) เมื่อผู้เล่นเดินผ่านพื้นที่ (70, 44) ถึง (90, 48)
     */
    triggerSurvivorCutscene() {
        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
        }

        const survivorWorldX = 80 * 32 + 16;
        const survivorWorldY = 43 * 32 + 16;

        this.cameras.main.stopFollow();
        this.cameras.main.pan(survivorWorldX, survivorWorldY, 800, 'Sine.easeInOut');

        this.time.delayedCall(850, () => {
            this.interactions.dialogue.show("เฮ้ คนตรงนั้นนะ ทางนี้! ทางนี้!", () => {
                this.cameras.main.pan(this.player.x, this.player.y, 650, 'Sine.easeInOut');
                this.time.delayedCall(700, () => {
                    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
                    if (this.interactions) {
                        this.interactions.unlock();
                    }
                });
            }, "Survivor");
        });
    }

    /**
     * ระบบพูดคุยและเลือกตอบกับ Survivor (เจมส์) ที่ห้อง (80, 43)
     */
    handleSurvivorInteract() {
        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
        }

        // 1. หากผู้เล่นเคยส่งเสบียงสำเร็จแล้ว
        if (this.hasDeliveredSupplies) {
            this.interactions.dialogue.show("งั่มๆ หะ? ขอโทษทีตอนนี้กำลังแซ่บอยู่", () => {
                if (this.interactions) this.interactions.unlock();
            }, "Survivor");
            return;
        }

        // 2. หากผู้เล่นมีกล่องเสบียงอยู่ในตัวและนำมาส่งให้เจมส์
        if (this.hasSupplyBox) {
            this.hasDeliveredSupplies = true;
            this.hasSupplyBox = false;
            this.hasLabKey = true;

            const thankDialogue = [
                "ขอบคุณมากๆๆ ทีนี้ฉันก็จะไม่อดตายแล้ว!",
                "นี่กุญแจแล็บที่สัญญาไว้",
                "แล้วเจอกันนะสหาย ><"
            ];

            this.interactions.dialogue.showSequence(thankDialogue, () => {
                if (this.interactions) this.interactions.unlock();
                if (this.quest) {
                    if (this.quest.currentQuest && String(this.quest.currentQuest.id).startsWith('6')) {
                        this.quest.completeQuest(this.quest.currentQuest.id, true);
                    }
                    this.quest.spawnBanner("◆ อัปเดต ◆", "#2e7d32", 0x2e7d32, "ตอนนี้สามารถเข้าห้องแล็บได้แล้ว", 4500);

                    // หากผู้เล่นมีสูตรสารเคมีอยู่แล้ว ให้เริ่ม Quest 7 ทันที
                    if (this.hasObtainedFormula) {
                        this.quest.addQuest(7, 'ไปสร้างสารเคมี', { type: 'tile', x: 55, y: 104 });
                    }
                }
            }, "Survivor");
            return;
        }

        if (!this.survivorState) {
            const firstIntro = [
                "ขอบคุณสวรรค์ ฉันนึกว่าทุกคนกลายเป็นซอมบี้ไปหมดแล้ว..",
                "ฉันชื่อ เจมส์ เป็นนักวิจัยในแล็บ",
                "ตอนนี้ห้องแล็บมันล็อกอยู่ใช่ไหมล่ะ"
            ];

            this.interactions.dialogue.showSequence(firstIntro, () => {
                this.interactions.dialogue.showChoices(
                    "เธออยากได้กุญแจไหม ถ้าอยากได้ฉันก็มีข้อแลกเปลี่ยนจะเสนอ",
                    [
                        "ไม่ล่ะฉันยุ่งอยู่กับการหนีตายจากพวกเวรนี่",
                        "เอาสิ ว่ามา"
                    ],
                    (choiceIndex) => {
                        if (choiceIndex === 0) {
                            // เลือก Option 1: ปฏิเสธ
                            this.survivorState = 'rejected_first';
                            this.interactions.dialogue.show("ห๊ะ... .... โอเค... ขอให้โชคดี :(", () => {
                                if (this.interactions) this.interactions.unlock();
                            }, "Survivor");
                        } else {
                            // เลือก Option 2: ตกลง
                            this.acceptSurvivorDeal();
                        }
                    },
                    "Survivor"
                );
            }, "Survivor");
        } else if (this.survivorState === 'rejected_first') {
            this.interactions.dialogue.showChoices(
                "ว่าไงเพื่อนยากที่เอาชีวิตรอดอยู่ในโลกภายนอก อยากจะเปลี่ยนใจเหรอ ;)",
                [
                    "ปล่าวอะแค่อยากมาดูว่าตายรึยัง",
                    "ใช่แล้ว"
                ],
                (choiceIndex) => {
                    if (choiceIndex === 0) {
                        // เลือก Option 1: ปล่าวอะแค่อยากมาดูว่าตายรึยัง
                        this.interactions.dialogue.show("[ไอ้ **** ไม่ต้องเอากันแล้วกุญจงกุญแจ ไปไหนก็ไป]", () => {
                            if (this.interactions) this.interactions.unlock();
                        }, "Survivor");
                    } else {
                        // เลือก Option 2: ใช่แล้ว (ตกลงรับข้อเสนอ)
                        this.acceptSurvivorDeal();
                    }
                },
                "Survivor"
            );
        } else if (this.survivorState === 'accepted_quest') {
            this.interactions.dialogue.show("กล่องเสบียงอยู่ตรงมุมห้องครัวนะ ได้โปรดรีบเอามาให้ฉันที..", () => {
                if (this.interactions) this.interactions.unlock();
            }, "Survivor");
        }
    }

    /**
     * หยิบแฟ้มเอกสารสูตรสารกัดกร่อนโลหะที่ห้องพยาบาล
     */
    handleGrabFormula() {
        this.hasObtainedFormula = true;
        if (this.formulaFolderSprite) {
            this.formulaFolderSprite.destroy();
            this.formulaFolderSprite = null;
        }

        if (this.quest && this.quest.currentQuest && this.quest.currentQuest.id === 6) {
            this.quest.completeQuest(6, true);
        }

        this.interactions.lock();
        this.player.setVelocity(0, 0);
        this.player.anims.play('idle', true);

        const introLines = [
            "โอ้ นี่มัน..",
            "\"สูตรสารกัดกร่อนโลหะชนิดพิเศษ\""
        ];

        this.interactions.dialogue.showSequence(introLines, () => {
            if (this.hasDeliveredSupplies) {
                // กรณีส่งเสบียงได้กุญแจแล็บแล้ว ให้เริ่ม Quest 7 ทันที
                this.interactions.dialogue.show("เยี่ยมเจอแล้ว! เอาหละตอนนี้ก็มุ่งหน้าไปที่แล็บกันเลย", () => {
                    if (this.interactions) this.interactions.unlock();
                    if (this.quest) {
                        this.quest.addQuest(7, 'ไปสร้างสารเคมี', { type: 'tile', x: 55, y: 104 });
                    }
                });
            } else if (this.survivorState === 'accepted_quest') {
                // กรณีรับเควสต์เจมส์แล้วแต่ยังไม่ได้ส่งเสบียง
                const path1 = [
                    "เยี่ยมเจอแล้ว! แต่เดี๋ยวก่อนแล็บมันล็อกนี่... อ้า! จริงด้วยผู้รอดชีวิตหลังประตูสีฟ้านั่นไง",
                    "ต้องรีบเอาเสบียงบ้าๆ นั้นไปให้แล้วเอากุญแจมาดีกว่า"
                ];
                this.interactions.dialogue.showSequence(path1, () => {
                    if (this.interactions) this.interactions.unlock();
                    if (this.quest) {
                        this.quest.addQuest('6.1', 'ไปหาเสบียงในครัว', { type: 'tile', x: 91, y: 55 });
                    }
                });
            } else {
                // กรณียังไม่ได้รับเควสต์เจมส์
                const path2 = [
                    "เดี๋ยวก่อน ตายละ แล็บมันล็อกอยู่",
                    "... จะเอากุญแจแล็บมายังไง...",
                    "จะให้ฆ่าซอมบี้ทีละตัวมันก็เกินไปหน่อย...",
                    "เดี๋ยวก่อนรู้สึกเหมือนจะมีผู้รอดชีวิตที่จะมีอะไรให้เรา... ลองไปคุยดูดีกว่า"
                ];
                this.interactions.dialogue.showSequence(path2, () => {
                    if (this.interactions) this.interactions.unlock();
                    if (this.quest) {
                        this.quest.addQuest('6.1', 'ไปหาผู้รอดชีวิต', { type: 'tile', x: 80, y: 43 });
                    }
                });
            }
        });
    }

    /**
     * ตอบรับข้อตกลงของ Survivor เพื่อไปหากล่องเสบียงที่ห้องครัว
     */
    acceptSurvivorDeal() {
        this.survivorState = 'accepted_quest';

        const dealDialogue = [
            "เยี่ยม! ฮาฮ่า เยส! อะเหม ขอโทษที ผมไม่ได้กินอะไรมาสามวันแล้ว",
            "คืองี้ มันมีกล่องเสบียงอยู่ตรงมุมห้องครัว คุณช่วยไปเอามันมาให้ผมหน่อยได้ไหม?",
            "ได้โปรดๆๆๆ",
            "ถือว่าตกลงไปเอาเสบียงมาให้แล้วผมจะมอบกุญแจห้องแล็บให้กับคุณ"
        ];

        this.interactions.dialogue.showSequence(dealDialogue, () => {
            if (this.interactions) {
                this.interactions.unlock();
            }
        }, "Survivor");
    }

    /**
     * เปลี่ยนฉากไปยัง Lab Zone A1 ผ่านช่องระบายอากาศ
     */
    transitionToLab() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
        }

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('GameplayScene', {
                mapKey: 'lab_zone_a1',
                spawnX: 53 * 32 + 16,
                spawnY: 72 * 32 + 16
            });
        });
    }

    /**
     * คำนวณค่า Y สำหรับ Depth Sorting โดยอิงจากจุดสัมผัสพื้น (Feet / Base) ของวัตถุ
     * @param {Phaser.GameObjects.GameObject} obj
     * @returns {number}
     */
    getDepthY(obj) {
        if (!obj) return 0;
        // หากมี Arcade Physics Body ให้ใช้ขอบล่างสุดของ Body (เท้าของตัวละคร)
        if (obj.body && obj.body.bottom !== undefined) {
            return obj.body.bottom;
        }
        // หากไม่มี Body ให้คำนวณจาก Origin และความสูงของ Sprite
        const originY = obj.originY !== undefined ? obj.originY : 0.5;
        const displayH = obj.displayHeight || obj.height || 0;
        return obj.y + (1 - originY) * displayH;
    }

    /**
     * ลงทะเบียนวัตถุเข้าสู่ระบบ Y-sorting
     * @param {Phaser.GameObjects.GameObject} obj - วัตถุที่ต้องการกำหนด Depth
     * @param {boolean} isDynamic - true สำหรับวัตถุที่เคลื่อนที่ได้ (Player, NPC, Monster)
     */
    registerYSort(obj, isDynamic = false) {
        if (!obj) return;
        obj.setDepth(this.getDepthY(obj));
        if (isDynamic && !this.ysortedObjects.includes(obj)) {
            this.ysortedObjects.push(obj);
        }
    }

    /**
     * ถอดวัตถุออกจากระบบ Y-sorting
     * @param {Phaser.GameObjects.GameObject} obj
     */
    unregisterYSort(obj) {
        if (!obj) return;
        const idx = this.ysortedObjects.indexOf(obj);
        if (idx !== -1) {
            this.ysortedObjects.splice(idx, 1);
        }
    }

    /**
     * สร้างปุ่ม UI [ สร้างสารกัดกร่อน ] ไว้ด้านล่างตรงกลางจอ (สไตล์กล่องสีขาว เส้นขอบสีดำ ตัวหนังสือสีดำ)
     */
    createCraftChemicalUI() {
        const btnW = 210;
        const btnH = 40;
        const btnY = 480;

        this.craftContainer = this.add.container(640, btnY)
            .setScrollFactor(0)
            .setDepth(20000)
            .setSize(btnW, btnH)
            .setInteractive({ cursor: 'pointer' })
            .setVisible(false);

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xffffff, 1);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
        btnBg.lineStyle(1.5, 0x000000, 1);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);

        const btnText = this.add.text(0, 0, "[ สร้างสารกัดกร่อน ]", {
            fontFamily: '"Sarabun", "Segoe UI", Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#000000',
            padding: { top: 4, bottom: 4, left: 6, right: 6 },
            resolution: 4
        }).setOrigin(0.5, 0.5);
        if (btnText.texture) btnText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

        this.craftContainer.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xf1f5f9, 1);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
            btnBg.lineStyle(2, 0x000000, 1);
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
        });

        this.craftContainer.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xffffff, 1);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
            btnBg.lineStyle(1.5, 0x000000, 1);
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);
        });

        this.craftContainer.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.triggerCraftChemicalCutscene();
        });

        this.craftContainer.add([btnBg, btnText]);
    }

    showCraftButton(visible) {
        if (!this.craftContainer) return;
        if (visible && !this.craftContainer.visible) {
            this.craftContainer.setVisible(true);
            this.craftContainer.setScale(0.9);
            this.tweens.add({ targets: this.craftContainer, scale: 1, duration: 180, ease: 'Back.easeOut' });
        } else if (!visible && this.craftContainer.visible) {
            this.craftContainer.setVisible(false);
        }
    }

    /**
     * คัตซีนใช้สารเคมีกัดกร่อนละลายประตูห้องออฟฟิศหลัก
     */
    handleMeltOfficeDoor(door) {
        if (this.isMeltingDoor) return;
        this.isMeltingDoor = true;
        this.hasMeltedOfficeDoor = true;

        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
        }

        const preDialogue = [
            "เอาหละนะ",
            "ลุยกันเลย!"
        ];

        this.interactions.dialogue.showSequence(preDialogue, () => {
            // โฟกัสกล้องไปที่ประตู
            const targetDoorX = door.sprite ? door.sprite.x : (door.worldX + 16);
            const targetDoorY = door.sprite ? door.sprite.y - 16 : (door.worldY - 16);

            this.cameras.main.stopFollow();
            this.cameras.main.pan(targetDoorX, targetDoorY, 650, 'Sine.easeInOut');

            this.time.delayedCall(700, () => {
                // เอฟเฟกต์ประกายไฟสีขาว (White Sparks / Sizzling Acid Sparkles)
                const sparkGfx = this.add.graphics().setDepth(16000);
                const sparkCount = 36;
                const sparks = [];

                for (let i = 0; i < sparkCount; i++) {
                    sparks.push({
                        x: targetDoorX + Phaser.Math.Between(-20, 20),
                        y: targetDoorY + Phaser.Math.Between(-30, 30),
                        vx: Phaser.Math.FloatBetween(-70, 70),
                        vy: Phaser.Math.FloatBetween(-90, 40),
                        size: Phaser.Math.Between(2, 5),
                        alpha: 1
                    });
                }

                let elapsed = 0;
                const sparkTimer = this.time.addEvent({
                    delay: 25,
                    repeat: 45,
                    callback: () => {
                        elapsed += 25;
                        sparkGfx.clear();

                        // วาดประกายไฟสีขาวและฟ้าสว่างวาบ
                        sparks.forEach(s => {
                            s.x += s.vx * 0.025;
                            s.y += s.vy * 0.025;
                            s.alpha = Math.max(0, 1 - (elapsed / 1150));

                            sparkGfx.fillStyle(0xffffff, s.alpha);
                            sparkGfx.fillCircle(s.x, s.y, s.size);
                            sparkGfx.lineStyle(1, 0x93c5fd, s.alpha * 0.8);
                            sparkGfx.strokeCircle(s.x, s.y, s.size + 1);
                        });

                        // เพิ่มประกายไฟใหม่แบบสุ่ม
                        if (elapsed < 800) {
                            sparkGfx.fillStyle(0xffffff, 0.9);
                            sparkGfx.fillCircle(targetDoorX + Phaser.Math.Between(-16, 16), targetDoorY + Phaser.Math.Between(-24, 24), Phaser.Math.Between(3, 7));
                        }
                    }
                });

                // ค่อยๆ สลายและลบประตูออก
                const doorsToDestroy = door.pairedGroup || [door];
                doorsToDestroy.forEach(d => {
                    if (d.sprite) {
                        if (d.sprite.body) {
                            d.sprite.body.enable = false;
                        }
                        this.tweens.add({
                            targets: d.sprite,
                            alpha: 0,
                            scaleX: 0.1,
                            duration: 950,
                            ease: 'Power2',
                            onComplete: () => {
                                d.sprite.destroy();
                                d.sprite = null;
                            }
                        });
                    }
                    d.isOpen = true;
                });

                this.time.delayedCall(1200, () => {
                    sparkGfx.destroy();

                    // แพนกล้องกลับมาหาตัวละคร
                    this.cameras.main.pan(this.player.x, this.player.y, 550, 'Sine.easeInOut');

                    this.time.delayedCall(600, () => {
                        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

                        this.interactions.dialogue.show("มันได้ผล เอาหละคีย์การ์ดอยู่ไหนกันนะ", () => {
                            this.isMeltingDoor = false;
                            if (this.interactions) {
                                this.interactions.unlock();
                            }
                            if (this.quest) {
                                if (this.quest.currentQuest && this.quest.currentQuest.id === 8) {
                                    this.quest.completeQuest(8, true);
                                }
                                // เพิ่ม Quest 9: ค้นหาคีย์การ์ด (11, 9)
                                this.quest.addQuest(9, 'ค้นหาคีย์การ์ด', { type: 'tile', x: 11, y: 9 });
                            }
                        });
                    });
                });
            });
        });
    }

    /**
     * คัตซีนสร้างสารเคมี พร้อม Transition จอมืด และย้ายตัวละครไป Grid (49, 104)
     */
    triggerCraftChemicalCutscene() {
        if (this.isCraftingTransition || this.hasCraftedChemical) return;
        this.isCraftingTransition = true;
        this.hasCraftedChemical = true;
        this.showCraftButton(false);

        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
        }

        this.cameras.main.fadeOut(750, 0, 0, 0);

        this.time.delayedCall(800, () => {
            // ย้ายตัวละครไปยัง Grid (49, 104)
            this.player.setPosition(49 * 32 + 16, 104 * 32 + 16);
            if (this.player.body) {
                this.player.setVelocity(0, 0);
            }
            this.player.anims.play('idle', true);

            this.cameras.main.fadeIn(750, 0, 0, 0);

            // ยืนค้าง 1 วินาที ก่อนเริ่มบทสนทนา
            this.time.delayedCall(1000, () => {
                const craftDialogues = [
                    "ได้มาแล้ว!",
                    "เอาหละทีนี้ก็ได้เวลาไปพังประตูบ้านั้น"
                ];

                this.interactions.dialogue.showSequence(craftDialogues, () => {
                    this.isCraftingTransition = false;
                    if (this.interactions) {
                        this.interactions.unlock();
                    }
                    if (this.quest) {
                        // ทำ Quest 7 สำเร็จ
                        if (this.quest.currentQuest && this.quest.currentQuest.id === 7) {
                            this.quest.completeQuest(7, true);
                        }
                        // เพิ่ม Quest 8: ไปพังประตูห้องออฟฟิศ (17, 22)
                        this.quest.addQuest(8, 'ไปพังประตูห้องออฟฟิศ', { type: 'tile', x: 17, y: 22 });
                    }
                });
            });
        });
    }

    update(time, delta) {
        if (!this.player || !this.player.body || this.isDying || this.isPausedForSettings) return;

        // อัปเดตระบบ Quest (ตำแหน่งและการหมุนของลูกศรนำทาง)
        if (this.quest) {
            this.quest.update();
        }

        // ตรวจสอบการเดินเข้าช่องระบายอากาศ (Vent) ในห้อง Break Room
        if (this.currentMapKey === 'break_room' && this.isVentOpened && !this.isTransitioning) {
            const pTileX = this.player.x / 32;
            const pTileY = this.player.y / 32;
            if (pTileX >= 32.5 && pTileX <= 35.5 && pTileY >= 19.0 && pTileY <= 22.0) {
                this.transitionToLab();
            }
        }

        // ดักจับเมื่อผู้เล่นเดินผ่านพื้นที่ (70, 44) ถึง (90, 48) ระหว่างทางไปห้องออฟฟิศ
        if (this.currentMapKey === 'lab_zone_a1' && !this.game.registry.get('hasMetSurvivorEvent')) {
            const pTileX = this.player.x / 32;
            const pTileY = this.player.y / 32;
            if (pTileX >= 70 && pTileX <= 91 && pTileY >= 44 && pTileY <= 49) {
                this.game.registry.set('hasMetSurvivorEvent', true);
                this.triggerSurvivorCutscene();
            }
        }

        // ตรวจสอบการเดินเข้าสู่พื้นที่ห้องออฟฟิศย่อย Grid (93, 103) ถึง (105, 110) เพื่อจบ Quest 10 และเริ่ม Quest 11
        if (this.currentMapKey === 'lab_zone_a1' && !this.hasPlayedOfficeEntryDialogue && this.quest && this.quest.currentQuest && this.quest.currentQuest.id === 10) {
            const pTileX = this.player.x / 32;
            const pTileY = this.player.y / 32;
            if (pTileX >= 93 && pTileX <= 105.8 && pTileY >= 103 && pTileY <= 110.8) {
                this.hasPlayedOfficeEntryDialogue = true;

                if (this.interactions) {
                    this.interactions.lock();
                }
                if (this.player && this.player.body) {
                    this.player.setVelocity(0, 0);
                    this.player.anims.play('idle', true);
                }

                const officeEntryDialogues = [
                    "กลิ่นในนี้แย่ชะมัด",
                    "ฉันเคยเข้ามาที่นี้ไม่กี่ครั้ง",
                    "ยังดูน่าเบื่อเหมือนเดิมเลย"
                ];

                this.interactions.dialogue.showSequence(officeEntryDialogues, () => {
                    if (this.interactions) {
                        this.interactions.unlock();
                    }
                    if (this.quest) {
                        this.quest.completeQuest(10, true);
                        this.quest.addQuest(11, 'สำรวจ PC', { type: 'tile', x: 94, y: 109 });
                    }
                });
            }
        }

        // ตรวจสอบพื้นที่สร้างสารเคมีในห้องแล็บ Grid (42, 100) ถึง (66, 110)
        if (this.currentMapKey === 'lab_zone_a1' && !this.hasCraftedChemical && (this.hasObtainedFormula || (this.quest && this.quest.currentQuest && this.quest.currentQuest.id === 7))) {
            const pTileX = this.player.x / 32;
            const pTileY = this.player.y / 32;
            const inLabArea = (pTileX >= 42 && pTileX <= 66 && pTileY >= 100 && pTileY <= 110);

            if (inLabArea && !this.isCraftingTransition && !(this.interactions && this.interactions.dialogue && this.interactions.dialogue.isActive)) {
                this.showCraftButton(true);
            } else {
                this.showCraftButton(false);
            }
        } else if (this.craftContainer && this.craftContainer.visible) {
            this.showCraftButton(false);
        }

        // ซ่อน Map Icon และ Quest Icon เมื่อมีหน้าต่าง Popup กำลังเปิดอยู่
        const isPopupOpen = (
            this.scene.isActive('MapScene') ||
            this.scene.isActive('PCScene') ||
            this.scene.isActive('QuestScene') ||
            this.scene.isActive('NoteScene') ||
            (this.terminalPanel && this.terminalPanel.isOpen()) ||
            (this.interactions && this.interactions.dialogue && this.interactions.dialogue.isActive)
        );

        if (this.mapIconBtn) {
            this.mapIconBtn.setVisible(!isPopupOpen);
        }
        if (this.quest && this.quest.hudIcon) {
            this.quest.hudIcon.setVisible(!isPopupOpen);
        }
        if (this.noteHudIcon) {
            this.noteHudIcon.setVisible(!isPopupOpen);
        }
        if (this.noteHudText) {
            this.noteHudText.setVisible(!isPopupOpen);
        }
        if (this.noiseHudContainer) {
            this.noiseHudContainer.setVisible(!isPopupOpen);
        }
        if (this.noteTooltipContainer && isPopupOpen) {
            this.noteTooltipContainer.setVisible(false);
        }

        // ซ่อนปุ่ม Settings เมื่อมีกล่องบทสนทนา (Dialogue) หรือหน้าต่าง Popup กำลังเปิดอยู่
        if (this.settingHudComponents && this.settingHudComponents.length > 0) {
            const shouldShowSetting = !isPopupOpen && !this.isPausedForSettings && !this.isDying;
            this.settingHudComponents.forEach(comp => {
                if (comp && comp.setVisible) {
                    comp.setVisible(shouldShowSetting);
                }
            });
            if (this.settingHitZone && this.settingHitZone.input) {
                this.settingHitZone.input.enabled = shouldShowSetting;
            }
        }

        // อัปเดตซอมบี้ทุกตัว (AI Pathfinding, Noise Detection & Chasing)
        if (this.zombieManager) {
            this.zombieManager.update(time, delta, this.player, this.currentNoise, this.isHoldingBreath);
        }

        // อัปเดต Depth ตามตำแหน่ง Y ต่อเนื่องสำหรับวัตถุที่เคลื่อนไหว (Player, NPCs, Enemies)
        for (let i = 0; i < this.ysortedObjects.length; i++) {
            const obj = this.ysortedObjects[i];
            if (obj && obj.active) {
                obj.setDepth(this.getDepthY(obj));
            }
        }

        if (this.interactions.isLocked() || this.scene.isActive('QuestScene') || this.scene.isActive('NoteScene')) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
            this.targetNoise = 0.25;
            this.updateNoiseAndStaminaVisuals(delta, time);
            return;
        }

        // 1. ระบบกลั้นหายใจ (Hold E)
        const isPressingE = this.keyE && this.keyE.isDown;
        if (isPressingE && !this.isExhausted) {
            if (!this.isHoldingBreath) {
                this.isHoldingBreath = true;
                this.player.setVelocity(0, 0);
                this.player.anims.pause(); // หยุด Animation บนเฟรมที่กด E
            }
            // ออกซิเจนลดลงเรื่อยๆ (~6 วินาทีหมด)
            this.oxygen = Math.max(0, this.oxygen - (delta / 1000) * 16.5);
            this.targetNoise = 0.0; // เสียงเงียบสนิท

            if (this.oxygen <= 0) {
                // ออกซิเจนหมด: หลุดจากการกลั้นหายใจ และติดสถานะเหนื่อยหอบ
                this.isHoldingBreath = false;
                this.isExhausted = true;
                this.player.anims.resume();
            }
        } else {
            if (this.isHoldingBreath) {
                this.isHoldingBreath = false;
                this.player.anims.resume();
            }
            // ออกซิเจนค่อยๆ ฟื้นฟูกลับมา
            if (this.oxygen < 100) {
                this.oxygen = Math.min(100, this.oxygen + (delta / 1000) * 18.0);
                if (this.oxygen >= 100) {
                    this.isExhausted = false; // ฟื้นตัวเต็มที่ วิ่งได้อีกครั้ง
                }
            }
        }

        // 2. การควบคุมการเคลื่อนที่
        let moveX = 0;
        let moveY = 0;

        if (this.isHoldingBreath) {
            this.player.setVelocity(0, 0);
        } else {
            if (this.cursors.left.isDown || this.wasd.left.isDown) {
                moveX = -1;
                this.player.setFlipX(false);
            } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
                moveX = 1;
                this.player.setFlipX(true);
            }

            if (this.cursors.up.isDown || this.wasd.up.isDown) {
                moveY = -1;
            } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
                moveY = 1;
            }

            const isMoving = (moveX !== 0 || moveY !== 0);
            // เมื่อเหนื่อยหอบ (isExhausted) จะไม่สามารถวิ่งได้
            const isRunning = isMoving && this.cursors.space.isDown && !this.isExhausted;
            const speed = isRunning ? 220 : 110;

            const velocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(speed);
            this.player.setVelocity(velocity.x, velocity.y);

            if (isMoving) {
                this.player.anims.play(isRunning ? 'run' : 'walk', true);
                this.targetNoise = isRunning ? 1.0 : 0.60; // วิ่ง: สีแดง (100%), เดิน: สีเหลือง (60%)

                // เล่นเสียงก้าวเท้าตามจังหวะ
                this.stepTimer += delta;
                const stepInterval = isRunning ? 220 : 360;
                if (this.stepTimer >= stepInterval) {
                    this.stepTimer = 0;
                    this.playFootstepSound(isRunning);
                }
            } else {
                this.player.anims.play('idle', true);
                if (this.isExhausted) {
                    // หายใจหอบเสียงดังกว่าปกติ
                    this.targetNoise = 0.76 + 0.16 * Math.sin(time * 0.008);
                    this.breathSoundTimer += delta;
                    if (this.breathSoundTimer >= 650) {
                        this.breathSoundTimer = 0;
                        this.playBreathingSound(true);
                    }
                } else {
                    // จังหวะหายใจปกติ เกือบแตะสีเหลือง
                    this.targetNoise = 0.32 + 0.10 * Math.sin(time * 0.0035);
                    this.breathSoundTimer += delta;
                    if (this.breathSoundTimer >= 1800) {
                        this.breathSoundTimer = 0;
                        this.playBreathingSound(false);
                    }
                }
            }
        }

        // 3. อัปเดตการแสดงผล Noise Meter และ Oxygen Bar
        this.updateNoiseAndStaminaVisuals(delta, time);
    }

    /**
     * วาง Note Collectibles ทั้ง 7 ชิ้นในห้องแล็บ
     */
    spawnCollectibleNotes() {
        const NOTE_DEFINITIONS = {
            1: {
                id: 1,
                title: "Note #1 — มันเป็นไปได้ยังไง?",
                body: "มันเป็นไปได้ยังไง?\nได้ยินข่าวลือมาว่าแผนกวิจัยชีวภาพประสบความสำเร็จในการสร้างน้ำอมฤตบางอย่างขึ้นมา พวกเขาบอกว่ามันสามารถทำให้หนูที่ตายไปแล้วฟื้นกลับมามีชีวิตได้!"
            },
            2: {
                id: 2,
                title: "Note #2 — เกิดอะไรขึ้นกับชั้นข้างล่าง?",
                body: "เกิดอะไรขึ้นกับชั้นข้างล่างพวกเรา?\nวันนี้ฉันมาทำงานตามปกติ และมีเอกสารที่ต้องนำไปส่งที่ชั้น A2 แต่ลิฟต์กลับใช้งานไม่ได้ และบันไดก็ถูกปิดผนึกเอาไว้\n\nอาจจะมีแก๊สรั่วหรืออะไรทำนองนั้นก็ได้?"
            },
            3: {
                id: 3,
                title: "Note #3 — ฉันได้ยินมัน",
                body: "ฉันได้ยินมัน\nเมื่อวานฉันทำงานล่วงเวลา... ตอนที่กำลังจะไปห้องพัก ฉันได้ยินเสียงเคาะดังมากมาจากบันไดทางทิศเหนือที่ไปยังชั้น A2\n\nตอนที่ฉันเดินไปดู บันไดยังคงถูกปิดผนึกอยู่... และเสียงเคาะก็หายไปแล้ว"
            },
            4: {
                id: 4,
                title: "Note #4 — นี่มันเกิดบ้าอะไรขึ้น?!",
                body: "นี่มันเกิดบ้าอะไรขึ้นวะ?!\n\nแจ้งเตือนฉุกเฉิน มีอะไรบางอย่างคล้ายซอมบี้อยู่ในสถานที่ของเรา! พวกมันกำลังทำร้ายพวกเรา พระเจ้า...\n\nเราพยายามฆ่าพวกมันแล้ว แต่พวกมันมีมากเกินไป!\n\nถ้าใครก็ตามที่อ่านข้อความนี้ [อ่านไม่ออก] ออกไปจากที่นี่ให้เร็วที่สุด!"
            },
            5: {
                id: 5,
                title: "Note #5 — ประตูถูกล็อก",
                body: "ประตูถูกล็อก\n\nพวกเราเหลือกันอยู่ไม่กี่คนแล้ว... ฉันพยายามซ่อนตัวอยู่ในห้องออฟฟิศนี้\n\nฉันได้ยินเสียงทุบประตูอยู่ตลอดเวลา...\n\nฉันขอโทษนะ เพื่อนร่วมงานทุกคน... ทางออกหลักถูกล็อกเอาไว้แล้ว\n\nพวกมันอาจหนีออกไปได้ แต่ฉันเสี่ยงไม่ได้... ฉันจะไม่ปล่อยให้เชื้อแพร่กระจายออกไปจากที่นี่"
            },
            6: {
                id: 6,
                title: "Note #6 — ไวรัสที่มนุษย์สร้างขึ้น",
                body: "ไวรัสที่มนุษย์สร้างขึ้น\n\nพวกมันไม่ได้สร้างน้ำอมฤต...\n\nพวกมันสร้างไวรัสขึ้นมา\n\nแล้วสิ่งที่ฟื้นกลับมา... ไม่ใช่หนูตัวเดิมอีกต่อไป"
            },
            7: {
                id: 7,
                title: "Note #7 — มันจบแล้ว",
                body: "มันจบแล้ว\n\nฉันได้ยินเสียงพวกมันอยู่หน้าประตู\n\nไม่มีที่ให้หนีอีกแล้ว\n\nขอให้พระเจ้าช่วยพวกเราด้วย"
            }
        };

        this.NOTE_DEFINITIONS = NOTE_DEFINITIONS;

        // สุ่มตำแหน่งของ Note 1, 2, 3, 4, 6, 7 โดย Note 5 อยู่ที่ (99, 103) เสมอ
        if (!this.game.registry.get('notesPlacement')) {
            const randomPool = [1, 2, 3, 4, 6, 7];
            Phaser.Utils.Array.Shuffle(randomPool);

            const otherPositions = [
                { x: 64, y: 9 },
                { x: 52, y: 77 },
                { x: 105, y: 77 },
                { x: 65, y: 78 },
                { x: 122, y: 88 },
                { x: 55, y: 102 }
            ];

            const placement = [
                { x: 99, y: 103, noteId: 5 }
            ];

            otherPositions.forEach((pos, idx) => {
                placement.push({ x: pos.x, y: pos.y, noteId: randomPool[idx] });
            });

            this.game.registry.set('notesPlacement', placement);
        }

        const placement = this.game.registry.get('notesPlacement') || [];
        const collectedNoteIds = this.game.registry.get('collectedNoteIds') || [];

        this.noteSprites = [];

        placement.forEach(item => {
            if (collectedNoteIds.includes(item.noteId)) return;

            const worldX = item.x * 32 + 16;
            const worldY = item.y * 32 + 16;

            const sprite = this.add.sprite(worldX, worldY, 'hospital_tiles', 97)
                .setOrigin(0.5, 0.5)
                .setScale(1.0);
            this.registerYSort(sprite, false);

            // เอฟเฟกต์กระพริบเรืองแสงเบาๆ เพื่อให้สังเกตเห็นได้ง่าย
            this.tweens.add({
                targets: sprite,
                alpha: 0.65,
                scale: 1.15,
                duration: 850,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.noteSprites.push(sprite);

            this.interactions.add({
                x: worldX,
                y: worldY,
                radius: 65,
                onInteract: () => {
                    const currentCollected = this.game.registry.get('collectedNoteIds') || [];
                    if (currentCollected.includes(item.noteId)) return;

                    currentCollected.push(item.noteId);
                    this.game.registry.set('collectedNoteIds', currentCollected);
                    this.game.registry.set('collectedNotesCount', currentCollected.length);

                    if (this.noteHudText) {
                        this.noteHudText.setText(`${currentCollected.length}/7`);
                    }

                    sprite.destroy();

                    this.showNoteModal(NOTE_DEFINITIONS[item.noteId]);
                }
            });
        });
    }

    /**
     * แสดงหน้าต่างกระดาษโน้ตสีขาว ขอบดำ ผ่าน NoteScene
     */
    showNoteModal(note) {
        if (!note) return;

        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
        }

        if (!this.scene.isActive('NoteScene')) {
            this.scene.launch('NoteScene', {
                parentSceneKey: 'GameplayScene',
                note: note
            });
        }
    }

    /**
     * สร้าง UI Noise Meter และแถบ Oxygen
     */
    createNoiseAndStaminaHUD() {
        const camZoom = this.cameras.main.zoom || 1.5;
        const cx = 640;
        const cy = 360;

        // วางที่ตำแหน่งกึ่งกลางล่างค่อนไปทางซ้าย: x ~ 460, y ~ 675 ในพิกัดจอ 1280x720
        const hudX = cx + (460 - cx) / camZoom;
        const hudY = cy + (675 - cy) / camZoom;

        this.noiseHudContainer = this.add.container(hudX, hudY);
        this.noiseHudContainer.setScrollFactor(0);
        this.noiseHudContainer.setDepth(16000);

        // 1. ไอคอนลำโพง Speaker_Icon.svg.png
        this.speakerIcon = this.add.image(-95, 0, 'speaker_icon');
        this.speakerIcon.setDisplaySize(26, 26);
        this.speakerIcon.setOrigin(0.5, 0.5);
        this.noiseHudContainer.add(this.speakerIcon);

        // 2. กรอบพื้นหลัง Noise Meter Bar
        this.noiseBgGraphics = this.add.graphics();
        this.noiseBgGraphics.fillStyle(0x11161a, 0.85);
        this.noiseBgGraphics.fillRoundedRect(-75, -8, 160, 16, 4);
        this.noiseBgGraphics.lineStyle(1.5, 0x4a6572, 0.9);
        this.noiseBgGraphics.strokeRoundedRect(-75, -8, 160, 16, 4);
        this.noiseHudContainer.add(this.noiseBgGraphics);

        // 3. กราฟิกแถบ Noise Fill
        this.noiseFillGraphics = this.add.graphics();
        this.noiseHudContainer.add(this.noiseFillGraphics);

        // 4. แถบ Oxygen Bar แสดงใต้ตัวละครใน Game World
        this.oxygenBarGraphics = this.add.graphics();
        this.oxygenBarGraphics.setDepth(15000);
    }

    /**
     * อัปเดตกราฟิก Noise Meter และ Oxygen Bar
     */
    updateNoiseAndStaminaVisuals(delta, time) {
        if (!this.noiseFillGraphics) return;

        // Smooth Lerp ของค่า Noise
        this.currentNoise = Phaser.Math.Linear(this.currentNoise, this.targetNoise, 0.12);
        const clampedNoise = Phaser.Math.Clamp(this.currentNoise, 0, 1);

        // วาดแถบระดับเสียง Noise Meter (เขียว -> เหลือง -> แดง)
        this.noiseFillGraphics.clear();
        const maxBarWidth = 156;
        const currentBarWidth = maxBarWidth * clampedNoise;

        if (currentBarWidth > 1) {
            let r, g, b;
            if (clampedNoise <= 0.5) {
                // เขียว (0.0) -> เหลือง (0.5)
                const t = clampedNoise / 0.5;
                r = Math.floor(46 + (241 - 46) * t);
                g = Math.floor(204 + (196 - 204) * t);
                b = Math.floor(113 + (15 - 113) * t);
            } else {
                // เหลือง (0.5) -> แดง (1.0)
                const t = (clampedNoise - 0.5) / 0.5;
                r = Math.floor(241 + (231 - 241) * t);
                g = Math.floor(196 + (76 - 196) * t);
                b = Math.floor(15 + (60 - 15) * t);
            }
            const color = (r << 16) | (g << 8) | b;

            this.noiseFillGraphics.fillStyle(color, 0.95);
            this.noiseFillGraphics.fillRoundedRect(-73, -6, currentBarWidth, 12, 3);
        }

        // วาดแถบ Oxygen Bar ใต้ตัวละคร (แสดงเฉพาะตอนกลั้นหายใจ หรือกำลังฟื้นฟูออกซิเจน)
        if (this.oxygenBarGraphics && this.player) {
            this.oxygenBarGraphics.clear();

            const showOxygenBar = (this.isHoldingBreath || this.oxygen < 100);
            if (showOxygenBar) {
                const barX = this.player.x - 20;
                const barY = this.player.y + 36;
                const barW = 40;
                const barH = 5;

                // พื้นหลังสีดำขุ่น
                this.oxygenBarGraphics.fillStyle(0x000000, 0.7);
                this.oxygenBarGraphics.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

                // สีของแถบออกซิเจน (ฟ้าสดใสตอนปกติ, แดงตอนเหนื่อยหอบ)
                const fillW = Math.max(0, barW * (this.oxygen / 100));
                const fillColor = this.isExhausted ? 0xff4757 : 0x48dbfb;
                this.oxygenBarGraphics.fillStyle(fillColor, 0.95);
                this.oxygenBarGraphics.fillRect(barX, barY, fillW, barH);
            }
        }
    }

    /**
     * ระบบสร้างเสียงก้าวเท้าเชิงพลวัต (Procedural Web Audio API)
     */
    playFootstepSound(isRunning) {
        try {
            if (this.sound.mute) return;
            const ctx = this.sound.context;
            if (!ctx || ctx.state !== 'running') return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const baseFreq = isRunning ? (115 + Math.random() * 25) : (80 + Math.random() * 20);
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(isRunning ? 0.20 : 0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isRunning ? 0.09 : 0.07));

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {}
    }

    /**
     * ระบบสร้างเสียงลมหายใจเชิงพลวัต (Procedural Web Audio API)
     */
    playBreathingSound(isHeavy) {
        try {
            if (this.sound.mute) return;
            const ctx = this.sound.context;
            if (!ctx || ctx.state !== 'running') return;

            const bufferSize = ctx.sampleRate * 0.25;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = isHeavy ? 650 : 380;
            filter.Q.value = 1.8;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(isHeavy ? 0.16 : 0.045, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isHeavy ? 0.25 : 0.20));

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start();
        } catch (e) {}
    }

    /**
     * แสดง / ซ่อน กรอบสีแดงเตือนภัยรอบหน้าจอเมื่อถูกซอมบี้ตรวจพบ
     */
    setDangerVignette(isActive) {
        if (this.isDangerActive === isActive || !this.dangerFrameGfx) return;
        this.isDangerActive = isActive;

        if (isActive) {
            this.dangerFrameGfx.clear();
            const w = 1280;
            const h = 720;

            // วาดขอบแดงเรืองแสงรอบจอ
            this.dangerFrameGfx.lineStyle(28, 0xff0000, 0.4);
            this.dangerFrameGfx.strokeRect(14, 14, w - 28, h - 28);
            this.dangerFrameGfx.lineStyle(6, 0xff3838, 0.9);
            this.dangerFrameGfx.strokeRect(3, 3, w - 6, h - 6);

            this.tweens.add({
                targets: this.dangerFrameGfx,
                alpha: 1.0,
                duration: 250,
                ease: 'Power2'
            });
        } else {
            this.tweens.add({
                targets: this.dangerFrameGfx,
                alpha: 0.0,
                duration: 450,
                ease: 'Power2'
            });
        }
    }

    /**
     * ทริกเกอร์เหตุการณ์ผู้เล่นถูกโจมตีจนเสียชีวิตและตัดเข้าสู่ Game Over Scene
     */
    triggerPlayerDeath() {
        if (this.isDying) return;
        this.isDying = true;

        // หยุดเพลง OST เมื่อผู้เล่นเสียชีวิต
        this.stopOSTPlaylist();

        // 1. ล็อกการควบคุมและการเคลื่อนที่
        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
        }

        // 2. เล่นอนิเมชั่นล้มลงอย่างชัดเจน (Frames 32-36 ของ tachyon1.png)
        if (this.player && this.anims.exists('player_down')) {
            this.player.anims.play('player_down', true);
        }

        // 3. เอฟเฟกต์กระพริบแดงและกรอบเลือดรอบขอบจอ (ไม่บังตัวละคร)
        this.cameras.main.flash(350, 180, 0, 0);
        this.cameras.main.shake(300, 0.015);

        const bloodBorder = this.add.graphics();
        bloodBorder.fillStyle(0xaa0000, 0.35);
        bloodBorder.fillRect(0, 0, 1280, 720);
        bloodBorder.lineStyle(35, 0x880000, 0.85);
        bloodBorder.strokeRect(17, 17, 1280 - 34, 720 - 34);
        bloodBorder.setScrollFactor(0);
        bloodBorder.setDepth(19000);

        this.tweens.add({
            targets: bloodBorder,
            alpha: 1.0,
            duration: 900,
            ease: 'Power2'
        });

        // 4. เพิ่มจำนวนรอบการตาย
        const currentRestarts = (this.game.registry.get('restartCount') || 0) + 1;
        this.game.registry.set('restartCount', currentRestarts);

        // 5. ให้เวลาแสดงอนิเมชั่นล้มลงจนเสร็จสมบูรณ์ (1.6 วินาที) ก่อนเฟดจอดำเข้าสู่ GameOverScene
        this.time.delayedCall(1600, () => {
            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.stopOSTPlaylist();
                this.scene.start('GameOverScene', {
                    deathX: this.player.x,
                    deathY: this.player.y,
                    mapKey: this.currentMapKey
                });
            });
        });
    }

    /**
     * ระบบเล่นเพลงประกอบ OST1-3 แบบวนลูปเพลงละ 5 รอบก่อนเปลี่ยนเพลง
     */
    startOSTPlaylist() {
        this.stopOSTPlaylist();

        const ostTracks = ['game_ost1', 'game_ost2', 'game_ost3'];
        let currentTrackIdx = 0;
        let playCount = 0;
        const loopsPerTrack = 5;

        const playTrack = () => {
            if (!this.sound) return;
            const trackKey = ostTracks[currentTrackIdx];
            if (!this.cache.audio.exists(trackKey)) return;

            if (this.currentOST) {
                this.currentOST.stop();
                this.currentOST.destroy();
                this.currentOST = null;
            }

            this.currentOST = this.sound.add(trackKey, { volume: 0.40 });
            playCount = 0;

            this.currentOST.on('complete', () => {
                playCount++;
                if (playCount < loopsPerTrack) {
                    if (this.currentOST && !this.isDying) {
                        this.currentOST.play();
                    }
                } else {
                    currentTrackIdx = (currentTrackIdx + 1) % ostTracks.length;
                    playTrack();
                }
            });

            if (!this.isDying) {
                this.currentOST.play();
            }
        };

        playTrack();
    }

    stopOSTPlaylist() {
        if (this.currentOST) {
            this.currentOST.stop();
            this.currentOST.destroy();
            this.currentOST = null;
        }
    }

    /**
     * เสียงคลิกปุ่ม UI สไตล์ Tactile Click สะอาดตาและนุ่มนวล
     */
    playButtonClickSound() {
        try {
            if (this.sound && this.sound.mute) return;
            const ctx = this.sound ? this.sound.context : null;
            if (!ctx || ctx.state !== 'running') return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.03);
            osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.07);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {}
    }

    /**
     * สร้างปุ่มไอคอน Settings ที่มุมขวาบนของหน้าจอ (พื้นหลังสีขาว + ขอบดำ)
     */
    createSettingsHUD() {
        const camZoom = this.cameras.main.zoom || 1.5;
        const cx = 640;
        const cy = 360;

        // วางที่มุมขวาบนในพิกัดหน้าจอ
        const hudX = cx + (cx - 45) / camZoom;
        const hudY = cy - (cy - 45) / camZoom;

        // พื้นหลังปุ่มทรงกลมสีขาวสะอาดตา ขอบดำ
        const btnBg = this.add.graphics();
        btnBg.setScrollFactor(0);
        btnBg.setDepth(20000);
        btnBg.fillStyle(0xffffff, 1.0);
        btnBg.fillCircle(hudX, hudY, 20);
        btnBg.lineStyle(2, 0x000000, 1.0);
        btnBg.strokeCircle(hudX, hudY, 20);

        // ไอคอนรูปฟันเฟือง Setting
        const settingIcon = this.add.image(hudX, hudY, 'setting_icon');
        settingIcon.setDisplaySize(24, 24);
        settingIcon.setOrigin(0.5, 0.5);
        settingIcon.setScrollFactor(0);
        settingIcon.setDepth(20001);

        // Hit zone ดักจับการคลิก
        const hitZone = this.add.zone(hudX, hudY, 44, 44)
            .setScrollFactor(0)
            .setDepth(20002)
            .setInteractive({ useHandCursor: true });

        hitZone.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xf1f5f9, 1.0);
            btnBg.fillCircle(hudX, hudY, 21);
            btnBg.lineStyle(2.5, 0x000000, 1.0);
            btnBg.strokeCircle(hudX, hudY, 21);
            settingIcon.setDisplaySize(26, 26);
        });

        hitZone.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xffffff, 1.0);
            btnBg.fillCircle(hudX, hudY, 20);
            btnBg.lineStyle(2, 0x000000, 1.0);
            btnBg.strokeCircle(hudX, hudY, 20);
            settingIcon.setDisplaySize(24, 24);
        });

        hitZone.on('pointerdown', (pointer, lx, ly, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.playButtonClickSound();
            this.openSettingsMenu();
        });

        this.settingHitZone = hitZone;
        this.settingHudComponents = [btnBg, settingIcon, hitZone];
    }

    /**
     * เปิดเมนูการตั้งค่าและหยุดเกมชั่วคราว (สไตล์ Simple: White BG + Black Border)
     */
    openSettingsMenu() {
        if (this.isPausedForSettings || this.isDying) return;
        this.isPausedForSettings = true;

        if (this.physics && this.physics.world) {
            this.physics.pause();
        }
        if (this.interactions) {
            this.interactions.lock();
        }
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.anims.play('idle', true);
        }

        this.settingsElements = [];

        const cx = 640;
        const cy = 360;
        const menuW = 360;
        const menuH = 280;

        // 1. Backdrop มืดทึบเต็มจอ (ดักจับการคลิกทุกอย่าง ไม่ให้ทะลุไปโดนเกมหรือบทสนทนา)
        this.settingsBackdrop = this.add.rectangle(cx, cy, 1280, 720, 0x000000, 0.65)
            .setScrollFactor(0)
            .setDepth(30000)
            .setInteractive();
        this.settingsElements.push(this.settingsBackdrop);

        // 2. กล่องเมนูสีขาว ขอบดำหนา 3.5px
        const panelBg = this.add.rectangle(cx, cy, menuW, menuH, 0xffffff)
            .setStrokeStyle(3.5, 0x000000)
            .setScrollFactor(0)
            .setDepth(30001);
        this.settingsElements.push(panelBg);

        // 3. หัวข้อ PAUSED / SETTINGS
        const title = this.add.text(cx, cy - menuH / 2 + 35, 'PAUSED / SETTINGS', {
            fontFamily: 'Sarabun, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#000000',
            letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(30002);
        this.settingsElements.push(title);

        // เส้นคั่นใต้หัวข้อ
        const divLine = this.add.graphics();
        divLine.setScrollFactor(0);
        divLine.setDepth(30002);
        divLine.lineStyle(2, 0x000000, 1.0);
        divLine.lineBetween(cx - menuW / 2 + 25, cy - menuH / 2 + 60, cx + menuW / 2 - 25, cy - menuH / 2 + 60);
        this.settingsElements.push(divLine);

        // 4. ปุ่มตัวเลือกทั้ง 3 ปุ่ม (Resume, Restart, Exit To Main Menu)
        const buttons = [
            {
                id: 'resume',
                text: 'RESUME',
                action: () => this.closeSettingsMenu()
            },
            {
                id: 'restart',
                text: 'RESTART',
                action: () => {
                    this.closeSettingsMenu();
                    if (this.currentMapKey === 'lab_zone_a1') {
                        this.game.registry.set('labStartTime', Date.now());
                        this.game.registry.set('hasPlayedLabDialogue', false);
                    }
                    this.scene.restart({
                        mapKey: this.currentMapKey,
                        spawnX: (this.currentMapKey === 'lab_zone_a1') ? (53 * 32 + 16) : (34.5 * 32 + 16),
                        spawnY: (this.currentMapKey === 'lab_zone_a1') ? (72 * 32 + 16) : (25 * 32 + 16)
                    });
                }
            },
            {
                id: 'exit',
                text: 'EXIT TO MAIN MENU',
                action: () => {
                    this.closeSettingsMenu();
                    this.sound.stopAll();
                    this.scene.start('MainMenuScene');
                }
            }
        ];

        const btnW = 290;
        const btnH = 44;
        const startY = cy - menuH / 2 + 98;
        const spacing = 58;

        buttons.forEach((b, idx) => {
            const bY = startY + idx * spacing;

            const btnBg = this.add.rectangle(cx, bY, btnW, btnH, 0xffffff)
                .setStrokeStyle(2, 0x000000)
                .setScrollFactor(0)
                .setDepth(30003)
                .setInteractive({ useHandCursor: true });

            const btnLabel = this.add.text(cx, bY, b.text, {
                fontFamily: 'Sarabun, sans-serif',
                fontSize: '17px',
                fontStyle: 'bold',
                color: '#000000',
                letterSpacing: 1
            }).setOrigin(0.5).setScrollFactor(0).setDepth(30004);

            btnBg.on('pointerover', () => {
                btnBg.setFillStyle(0x000000);
                btnLabel.setColor('#ffffff');
            });

            btnBg.on('pointerout', () => {
                btnBg.setFillStyle(0xffffff);
                btnLabel.setColor('#000000');
            });

            btnBg.on('pointerdown', (pointer, lx, ly, event) => {
                if (event && event.stopPropagation) event.stopPropagation();
                this.playButtonClickSound();
                if (b.id === 'mute') {
                    b.action(btnLabel);
                } else {
                    b.action();
                }
            });

            this.settingsElements.push(btnBg, btnLabel);
        });
    }

    /**
     * ปิดเมนูการตั้งค่าและปลดล็อกเกมกลับสู่สภาวะปกติ
     */
    closeSettingsMenu() {
        if (!this.isPausedForSettings) return;

        if (this.settingsElements && this.settingsElements.length > 0) {
            this.settingsElements.forEach(el => {
                if (el && el.destroy) el.destroy();
            });
            this.settingsElements = [];
        }

        if (this.physics && this.physics.world) {
            this.physics.resume();
        }
        if (this.interactions) {
            this.interactions.unlock();
        }

        this.isPausedForSettings = false;
    }
}