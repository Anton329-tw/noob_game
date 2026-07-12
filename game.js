// NooB vs Pirates - Game JavaScript

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM UI Elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const hpFill = document.getElementById('hpFill');
const hpValue = document.getElementById('hpValue');
const killsCount = document.getElementById('killsCount');
const finalKills = document.getElementById('finalKills');
const finalTime = document.getElementById('finalTime');
const damageOverlay = document.getElementById('damageOverlay');

// Key bindings indicators in HUD
const keyW = document.getElementById('hudKeyW');
const keyA = document.getElementById('hudKeyA');
const keyS = document.getElementById('hudKeyS');
const keyD = document.getElementById('hudKeyD');

// Background Image
const bgImage = new Image();
bgImage.src = 'village_bg.png';
let bgLoaded = false;
bgImage.onload = () => {
  bgLoaded = true;
};

// Chapter 2 Background Image [NEW]
const bgImage2 = new Image();
bgImage2.src = 'harbor_bg.png';
let bg2Loaded = false;
bgImage2.onload = () => {
  bg2Loaded = true;
};

// Chapter 3 Background Image [NEW]
const bgImage3 = new Image();
bgImage3.src = 'city_bg.png';
let bg3Loaded = false;
bgImage3.onload = () => {
  bg3Loaded = true;
};
// Chapter 4 Background Image [NEW]
const bgImage4 = new Image();
bgImage4.src = 'dojo_bg.png';
let bg4Loaded = false;
bgImage4.onload = () => {
  bg4Loaded = true;
};

// Chapter 5 Background Image [NEW]
const bgImage5 = new Image();
bgImage5.src = 'restaurant_bg.png';
let bg5Loaded = false;
bgImage5.onload = () => {
  bg5Loaded = true;
};

// Pause variables [NEW]
let isPaused = false;
let pauseStartTime = 0;

// Game Settings & Constants
const GRAVITY = 0.55;
const GROUND_Y = 480;
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;

// Game State Variables
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let startTime = 0;
let gameTime = 0;
let lastSpawnTime = 0;
const spawnInterval = 6000; // 6 seconds (was 10s)
let piratesSpawnedCount = 0; // Tracks number of pirates spawned for Boss counting
let chapter = 1;
let chapterStartScore = 0;
let stageBossSpawned = false;

// AoE Attack properties [NEW]
let aoeTimer = 30; // Starts ready (30 seconds)
let aoeEffect = {
  active: false,
  x: 0,
  y: 0,
  radius: 0,
  maxRadius: 250,
  speed: 10
};

// Inputs Object
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  h: false,
  f: false,
  rightClick: false
};
let mouse = { x: 0, y: 0 };

// Particle System
let particles = [];
let playerProjectiles = []; // [NEW]
let enemyProjectiles = [];  // [NEW]
let poisonMists = [];       // [NEW]
// Floating Text (Damage numbers, level ups, etc.)
let textPopups = [];
let delayedPipes = []; // [NEW]

// Platforms Configuration
// One-way platforms that the player can jump through from bottom and land on top
const platforms = [
  { x: 120, y: 360, width: 220, height: 16, color: '#4a3f35', label: '村莊木棚' },
  { x: 684, y: 360, width: 220, height: 16, color: '#4a3f35', label: '哨站露台' }
];

// Screen Shake Effect
let shakeIntensity = 0;
let shakeDecay = 0.9;

// Player Object (NooB)
const player = {
  character: 'noob', // 'noob', 'anton', 'laige' [NEW]
  name: 'NooB',
  baseDamage: 10,    // Base damage [NEW]
  x: 512,
  y: GROUND_Y - 54,
  vx: 0,
  vy: 0,
  width: 32,
  height: 54,
  normalHeight: 54,
  crouchHeight: 28,
  speed: 0.35,          // Slower player acceleration (was 0.6)
  maxSpeed: 3.2,         // Slower player max speed (was 5.5)
  crouchMaxSpeed: 1.6,   // Slower player crouch max speed (was 2.5)
  jumpForce: -13.5,
  isCrouching: false,
  wantsToStand: false,
  crouchTimer: 0,
  parryBroken: false,
  facing: 1, // 1 for right, -1 for left
  hp: 80,
  maxHp: 80,
  invincibleFrames: 0,
  attackCooldown: 0,
  attackMaxCooldown: 30, // 0.5s cooldown at 60fps (was 18)
  attackRange: 75,
  isAttacking: false,
  attackAngle: 0,
  attackTime: 0,
  attackDuration: 10, // frames
  
  // Parry attributes
  isParrying: false,
  
  // Energy attributes [NEW]
  energy: 50,
  maxEnergy: 50,
  
  // Healing attributes [NEW]
  isHealing: false,
  healProgress: 0, // reaches 480 (8 seconds)
  
  // Buff multipliers [NEW]
  attackMultiplier: 1.0,
  damageReduction: 0.0,
  speedBuff: 1.0,
  aoeBonusDamage: 0, // [NEW]
  
  // Double Jump & Custom Upgrades [NEW]
  doubleJumpUnlocked: false,
  jumpCount: 0,
  wPressed: false,
  healAmount: 20,
  
  // Milkshake attributes [NEW]
  milkshakeUnlocked: false,
  milkshakeCooldown: 0,
  milkshakeActiveTimer: 0,
  
  // Dash attributes [NEW]
  dashActiveTimer: 0,
  dashDirection: 1
};

// Pirates Array
let pirates = [];

// Classes definitions

class Pirate {
  constructor(x, y, isBoss = false, isStageBoss = false) {
    this.x = x;
    this.y = y;
    this.isBoss = isBoss;
    this.isStageBoss = isStageBoss;
    this.vx = 0;
    this.vy = 0;
    this.poisonDuration = 0; // Poison status duration in frames [NEW]
    this.lastPoisonTickTime = 0; // Last tick of status damage [NEW]
    this.freezeDuration = 0; // Freeze status duration in frames [NEW]
    
    this.isRanged = false; // Default melee [NEW]
    
    if (this.isStageBoss) {
      this.width = 58;
      this.height = 92;
      
      // Stage Boss HP based on Chapter [NEW]
      if (chapter >= 4) {
        this.hp = 175;
        this.maxHp = 175;
      } else {
        this.hp = 150;
        this.maxHp = 150;
      }
      
      this.speed = 0.45; // Stage Boss moves slower
      
      // Stage Boss damage based on Chapter [NEW]
      if (chapter === 2) {
        this.attackDamage = 20;
      } else if (chapter === 3) {
        this.attackDamage = 22;
      } else if (chapter === 5) {
        this.attackDamage = 200; // Chef Stage Boss attack is 200
      } else if (chapter >= 4) {
        this.attackDamage = 25;
      } else {
        this.attackDamage = 20; // Chapter 1
      }
      
      this.attackRange = 70;
      this.attackMaxCooldown = 60; // 1 second cooldown at 60fps
    } else if (this.isBoss) {
      this.width = 46;
      this.height = 72;
      
      // Mini Boss HP based on Chapter [NEW]
      if (chapter >= 4) {
        this.hp = 125;
        this.maxHp = 125;
      } else {
        this.hp = 100;
        this.maxHp = 100;
      }
      
      this.speed = 0.55; // Boss walks slower
      
      // Mini Boss damage based on Chapter [NEW]
      if (chapter === 2) {
        this.attackDamage = 12;
      } else if (chapter === 3) {
        this.attackDamage = 15;
      } else if (chapter === 5) {
        this.attackDamage = 150; // Chef Mini Boss attack is 150
      } else if (chapter >= 4) {
        this.attackDamage = 18;
      } else {
        this.attackDamage = 15; // Chapter 1
      }
      
      this.attackRange = 56;
      this.attackMaxCooldown = 80;
    } else {
      this.width = 34;
      this.height = 54;
      
      this.isRanged = Math.random() < 0.4 && chapter >= 3; // 40% Ranged pirate in Chapter 3+ [NEW]
      
      // Normal Pirate and Ranged Pirate HP based on Chapter [NEW]
      if (chapter === 5) {
        this.hp = this.isRanged ? 60 : 65; // Chef ranged HP 60, normal HP 65
        this.maxHp = this.isRanged ? 60 : 65;
      } else if (chapter >= 4) {
        this.hp = 50;
        this.maxHp = 50;
      } else {
        this.hp = 40;
        this.maxHp = 40;
      }
      
      if (this.isRanged) {
        this.speed = 0.5 + Math.random() * 0.25;
        this.attackDamage = 4; // Ranged attack is 4
        this.attackRange = 320;
        this.attackMaxCooldown = 120; // 2 seconds
      } else {
        this.speed = 0.65 + Math.random() * 0.35; // Slower pirate speed
        
        // Ordinary Pirate damage based on Chapter [NEW]
        if (chapter === 2) {
          this.attackDamage = 7;
        } else if (chapter === 3) {
          this.attackDamage = 8;
        } else if (chapter >= 4) {
          this.attackDamage = 9; // Chapter 4+
        } else {
          this.attackDamage = 5; // Chapter 1
        }
        
        this.attackRange = 42;
        this.attackMaxCooldown = 60;
      }
    }
    
    this.isGrounded = false;
    this.facing = 1;
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.attackDuration = 12;
    this.attackTime = 0;
    this.hitFlashFrames = 0;
    this.jumpCooldown = 0;
  }

  update() {
    // Poison status tick logic [NEW]
    if (this.poisonDuration > 0) {
      this.poisonDuration--;
      
      const now = Date.now();
      if (now - this.lastPoisonTickTime >= 1000) {
        this.lastPoisonTickTime = now;
        
        // Deal 5 poison tick damage
        this.hp -= 5;
        this.hitFlashFrames = 8;
        
        const pirCenterX = this.x + this.width / 2;
        const pirCenterY = this.y + this.height / 2;
        
        // Spawn small green poison particles
        createHitParticles(pirCenterX, pirCenterY, '#06d6a0');
        createTextPopup(pirCenterX, this.y - 15, '-5', '#06d6a0');
        
        // Check death
        if (this.hp <= 0) {
          score++;
          const killsCount = document.getElementById('killsCount');
          if (killsCount) killsCount.innerText = score.toString();
          createDust(pirCenterX, this.y + this.height, 'rgba(255,255,255,0.4)', 15);
          createTextPopup(pirCenterX, this.y - 35, '擊殺! 💀', '#ff9f1c');
          
          if (this.isStageBoss) {
            triggerChapterClear();
          } else {
            shakeScreen(5);
          }
        }
      }
    }

    // Gravity
    this.vy += GRAVITY;
    this.y += this.vy;
    this.x += this.vx;

    // Freeze status slowdown [NEW]
    if (this.freezeDuration > 0) {
      this.freezeDuration--;
      if (this.hitFlashFrames <= 0) {
        this.vx *= 0.5; // Slow down movement speed by half (50%)
      }
    }

    // Hit boundaries & platforms
    this.isGrounded = false;
    
    // Ground collision (only register when landing or stationary, preventing jump cancel)
    if (this.vy >= 0 && this.y + this.height >= GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.isGrounded = true;
    }

    // Platform collision
    for (let plat of platforms) {
      // Check collision only when falling down
      if (this.vy >= 0 &&
          this.x + this.width > plat.x &&
          this.x < plat.x + plat.width &&
          this.y + this.height >= plat.y &&
          this.y + this.height - this.vy <= plat.y + 8) {
        this.y = plat.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // Jump cooldown reduction
    if (this.jumpCooldown > 0) this.jumpCooldown--;

    // Move AI towards Player
    if (gameState === 'playing') {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      
      // Facing/vx AI pathing logic (Climbing scaffolds step-by-step to reach player on high cloud)
      if (this.hitFlashFrames > 0) {
        this.vx *= 0.85;
      } else {
        if (this.isRanged) {
          // Ranged kiting movement logic [NEW]
          const distToPlayer = Math.abs(dx);
          
          // Climb check
          const playerOnHighPlat = player.y + player.height <= 250;
          if (playerOnHighPlat && this.y + this.height >= GROUND_Y - 5) {
            const targetPlatX = this.x < 512 ? 230 : 794;
            const dxToPlat = targetPlatX - this.x;
            if (dxToPlat > 5) { this.facing = 1; this.vx = this.speed; }
            else if (dxToPlat < -5) { this.facing = -1; this.vx = -this.speed; }
            else {
              this.vx = 0;
              if (this.isGrounded && this.jumpCooldown === 0) {
                this.vy = -12.2; this.isGrounded = false; this.jumpCooldown = 90;
                createDust(this.x + this.width/2, this.y + this.height, '#fff', 5);
              }
            }
          } else if (playerOnHighPlat && this.y + this.height >= 340 && this.y + this.height <= 370) {
            const dxToCenter = 512 - this.x;
            if (dxToCenter > 5) { this.facing = 1; this.vx = this.speed; }
            else if (dxToCenter < -5) { this.facing = -1; this.vx = -this.speed; }
            else { this.vx = 0; }
            if (this.isGrounded && Math.abs(512 - this.x) < 140 && this.jumpCooldown === 0) {
              this.vy = -12.2; this.isGrounded = false; this.jumpCooldown = 90;
              createDust(this.x + this.width/2, this.y + this.height, '#fff', 5);
            }
          } else {
            // Horizontal kiting
            if (distToPlayer < 180) {
              this.facing = dx >= 0 ? -1 : 1;
              this.vx = this.facing * this.speed;
            } else if (distToPlayer > 260) {
              this.facing = dx >= 0 ? 1 : -1;
              this.vx = this.facing * this.speed;
            } else {
              this.vx *= 0.85;
              this.facing = dx >= 0 ? 1 : -1;
            }
          }
        } else {
          // Standard Melee pursue logic
          // Check if player is on the highest platform (y = 240)
          const playerOnHighPlat = player.y + player.height <= 250;
          
          if (playerOnHighPlat) {
            // If pirate is on the ground, walk to Left (x = 230) or Right (x = 794) platform centers
            if (this.y + this.height >= GROUND_Y - 5) {
              const targetPlatX = this.x < 512 ? 230 : 794;
              const dxToPlat = targetPlatX - this.x;
              
              if (dxToPlat > 5) {
                this.facing = 1;
                this.vx = this.speed;
              } else if (dxToPlat < -5) {
                this.facing = -1;
                this.vx = -this.speed;
              } else {
                this.vx = 0;
                // Jump onto the lower platform
                if (this.isGrounded && this.jumpCooldown === 0) {
                  this.vy = -12.2;
                  this.isGrounded = false;
                  this.jumpCooldown = 90;
                  createDust(this.x + this.width/2, this.y + this.height, '#fff', 5);
                }
              }
            }
            // If pirate is on lower platforms (y = 360)
            else if (this.y + this.height >= 340 && this.y + this.height <= 370) {
              // Walk towards center platform center (x = 512)
              const dxToCenter = 512 - this.x;
              
              if (dxToCenter > 5) {
                this.facing = 1;
                this.vx = this.speed;
              } else if (dxToCenter < -5) {
                this.facing = -1;
                this.vx = -this.speed;
              } else {
                this.vx = 0;
              }
              
              // Jump onto highest platform if close to center
              if (this.isGrounded && Math.abs(512 - this.x) < 140 && this.jumpCooldown === 0) {
                this.vy = -12.2;
                this.isGrounded = false;
                this.jumpCooldown = 90;
                createDust(this.x + this.width/2, this.y + this.height, '#fff', 5);
              }
            }
            // Default direct chase player if already on highest platform or intermediate
            else {
              if (dx > 5) {
                this.facing = 1;
                this.vx = this.speed;
              } else if (dx < -5) {
                this.facing = -1;
                this.vx = -this.speed;
              } else {
                this.vx = 0;
              }
            }
          } 
          else {
            // Standard chase AI (player is not on highest platform)
            if (dx > 5) {
              this.facing = 1;
              this.vx = this.speed;
            } else if (dx < -5) {
              this.facing = -1;
              this.vx = -this.speed;
            } else {
              this.vx = 0;
            }
          }
        }
      }

      // Jump AI
      const playerOnHighPlat = player.y + player.height <= 250;
      const isPlayerHigher = dy < -45;
      const horizontalDist = Math.abs(dx);
      
      if (this.isGrounded && this.jumpCooldown === 0 && this.hitFlashFrames === 0 && !playerOnHighPlat) {
        // Option 1: Jump to reach player above
        if (isPlayerHigher && horizontalDist < 180 && Math.random() < 0.02) {
          this.vy = -11.5;
          this.isGrounded = false;
          this.jumpCooldown = 90; // cooldown for AI jump
          createDust(this.x + this.width/2, this.y + this.height, '#fff', 5);
        }
        // Option 2: Random small jump when chasing horizontally to look active
        else if (!isPlayerHigher && horizontalDist > 200 && Math.random() < 0.005) {
          this.vy = -8;
          this.isGrounded = false;
          this.jumpCooldown = 60;
          createDust(this.x + this.width/2, this.y + this.height, '#fff', 3);
        }
      }

      // Attack AI
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.attackRange && this.attackCooldown === 0 && !this.isAttacking && this.hitFlashFrames === 0) {
        this.startAttack();
      }
    } else {
      this.vx = 0;
    }

    // Cooldown reductions
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hitFlashFrames > 0) this.hitFlashFrames--;

    // Attack animation tick
    if (this.isAttacking) {
      this.attackTime++;
      // Attack trigger frame (halfway through animation)
      if (this.attackTime === Math.floor(this.attackDuration / 2)) {
        this.executeAttack();
      }
      if (this.attackTime >= this.attackDuration) {
        this.isAttacking = false;
        this.attackCooldown = this.attackMaxCooldown;
      }
    }
  }

  startAttack() {
    this.isAttacking = true;
    this.attackTime = 0;
    this.vx = 0; // stop moving while attacking
  }

  executeAttack() {
    // If ranged shooter pirate, fire laser bullet [NEW]
    if (this.isRanged) {
      const dx = (player.x + player.width/2) - (this.x + this.width/2);
      const dy = (player.y + player.height/2) - (this.y - 12);
      const angle = Math.atan2(dy, dx);
      
      enemyProjectiles.push({
        x: this.x + this.width/2,
        y: this.y - 12,
        vx: Math.cos(angle) * 7.5,
        vy: Math.sin(angle) * 7.5,
        radius: chapter >= 5 ? 4.5 : 3.5,
        color: chapter >= 5 ? '#ef476f' : '#ff0055', // ketchup red or cyber laser bullet
        damage: this.attackDamage,
        life: 180,
        isSauce: chapter >= 5
      });
      return;
    }

    const dx = (player.x + player.width/2) - (this.x + this.width/2);
    const dy = (player.y + player.height/2) - (this.y + this.height/2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.attackRange + 10) {
      // Check if player is crouched
      const playerYCenter = player.y + player.height/2;
      const pirateYCenter = this.y + this.height/2;
      
      // Hit success, pass 'this' pirate for parry calculations
      damagePlayer(this.attackDamage, this);
      
      // Knockback player (only if player is not parrying)
      if (!player.isParrying) {
        const knockDir = dx > 0 ? 1 : -1;
        player.vx = knockDir * 6;
        player.vy = -3.5;
        
        // Hit particles
        createHitParticles(player.x + player.width/2, player.y + player.height/2, '#ef476f');
        shakeScreen(4);
      }
    }
  }

  draw() {
    ctx.save();

    // Flash white/red when hit
    if (this.hitFlashFrames > 0) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff3333';
      if (this.hitFlashFrames % 2 === 0) {
        ctx.filter = 'brightness(2) saturate(0.5)';
      }
    } else {
      let isStatusGlow = false;
      if (this.poisonDuration > 0 && this.freezeDuration > 0) {
        // Cyan-green pulsing glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = (Math.floor(Date.now() / 250) % 2 === 0) ? '#06d6a0' : '#00b4d8';
        isStatusGlow = true;
      } else if (this.poisonDuration > 0) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#06d6a0'; // green
        isStatusGlow = true;
      } else if (this.freezeDuration > 0) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00b4d8'; // cyan
        isStatusGlow = true;
      }
      
      if (isStatusGlow) {
        // Particle spawning
        if (Math.random() < 0.08) {
          if (this.poisonDuration > 0 && (this.freezeDuration <= 0 || Math.random() < 0.5)) {
            // Green bubble
            createParticle(
              this.x + Math.random() * this.width,
              this.y + Math.random() * this.height,
              (Math.random() - 0.5) * 0.5,
              -0.5 - Math.random() * 0.5,
              '#06d6a0', 1 + Math.random() * 1.5, 20 + Math.random() * 20, 'spark'
            );
          } else {
            // Cyan snowflake
            createParticle(
              this.x + Math.random() * this.width,
              this.y + Math.random() * this.height,
              (Math.random() - 0.5) * 0.3,
              -0.2 - Math.random() * 0.3,
              '#caf0f8', 1.5 + Math.random() * 1.5, 15 + Math.random() * 15, 'spark'
            );
          }
        }
      }
    }

    // Translate to center for easier facing flip
    ctx.translate(this.x + this.width/2, this.y + this.height/2);
    ctx.scale(this.facing, 1);
    if (this.isStageBoss) {
      ctx.scale(1.75, 1.75); // Scale the Stage Boss up
    } else if (this.isBoss) {
      ctx.scale(1.35, 1.35); // Scale the Boss up
    }

    // DRAW PIRATE SPRITE VECTOR-STYLE
    
    // Shadow underneath
    // Pirate coloring based on Chapter
    let legColor = '#222';
    let torsoColor = '#b7094c';
    let headSkinColor = '#fbc4b2';
    let bandanaColor = '#b7094c';
    let swordColor = '#e5e5e5';
    
    if (chapter >= 5) {
      // Chapter 5: Chef Pirates (White chef jacket, gray pants, steel cleaver/knife) [NEW]
      legColor = '#475569';
      torsoColor = '#f8fafc';
      headSkinColor = '#fbc4b2';
      bandanaColor = '#ef476f'; // red chef scarf
      swordColor = '#cbd5e1'; // metallic knife
    } else if (chapter === 4) {
      // Chapter 4: Ninja Pirates (Obsidian and dark purple/crimson) [NEW]
      legColor = '#11071c';
      torsoColor = '#180e29';
      headSkinColor = '#180e29'; // Ninja mask
      bandanaColor = '#d90429'; // Crimson bandana
      swordColor = '#d90429'; // Glowing red katana
    } else if (chapter === 3) {
      // Chapter 3: Cyborg Pirates (Obsidian steel clothes, chrome skin, cyan weapons) [NEW]
      legColor = '#334155';
      torsoColor = '#1e293b';
      headSkinColor = '#cbd5e1';
      bandanaColor = '#0f172a';
      swordColor = '#00f5d4';
    } else if (chapter === 2) {
      // Chapter 2: Ghost Pirates
      legColor = '#10002b';
      torsoColor = '#3c096c';
      headSkinColor = '#80ffdb';
      bandanaColor = '#5a189a';
      swordColor = '#70e000';
    }

    ctx.fillStyle = (chapter === 2) ? 'rgba(112, 224, 0, 0.15)' : 
                    (chapter === 3) ? 'rgba(0, 245, 212, 0.15)' : 
                    (chapter >= 4) ? 'rgba(217, 4, 41, 0.15)' : 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, this.height/2 - 2, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Boots (Moving animation)
    ctx.fillStyle = legColor;
    let legOffset = 0;
    if (Math.abs(this.vx) > 0 && this.isGrounded) {
      legOffset = Math.sin(Date.now() * 0.015) * 6;
    }
    // Left Leg
    ctx.fillRect(-10, 10, 6, 17 + legOffset);
    // Right Leg
    ctx.fillRect(4, 10, 6, 17 - legOffset);

    // Torso
    ctx.fillStyle = torsoColor;
    ctx.fillRect(-12, -15, 24, 26);
    
    // Sash / Belt
    ctx.fillStyle = (chapter === 2) ? '#5a189a' : (chapter === 3) ? '#00f5d4' : (chapter === 4) ? '#d90429' : (chapter >= 5) ? '#ef476f' : '#e9c46a';
    ctx.fillRect(-13, 3, 26, 4);
    
    if (chapter >= 5) {
      // Draw white chef apron front
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-9, 4, 18, 12);
      ctx.fillStyle = '#ef476f'; // red bow string tie at bottom
      ctx.fillRect(-2, 16, 4, 2);
    } else {
      ctx.fillStyle = '#111'; // Belt buckle
      ctx.fillRect(-4, 2, 8, 6);
    }

    // Head & Bandana drawing
    if (chapter >= 5) {
      // Head skin
      ctx.fillStyle = headSkinColor;
      ctx.beginPath();
      ctx.arc(0, -25, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye patch
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(3, -26, 3, 0, Math.PI*2); // eye patch circle
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(-7, -29);
      ctx.lineTo(8, -23);
      ctx.stroke();

      // Red neck scarf
      ctx.fillStyle = '#ef476f';
      ctx.fillRect(-10, -17, 20, 3);
      ctx.beginPath();
      ctx.moveTo(-8, -17);
      ctx.lineTo(-14, -19);
      ctx.lineTo(-11, -15);
      ctx.closePath();
      ctx.fill();

      // White Chef Hat (Toque blanche)
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      
      // Hat base
      ctx.fillRect(-9, -38, 18, 5);
      ctx.strokeRect(-9, -38, 18, 5);
      
      // Fluffy top bulb
      ctx.beginPath();
      ctx.arc(-4, -43, 7, 0, Math.PI * 2);
      ctx.arc(4, -43, 7, 0, Math.PI * 2);
      ctx.arc(0, -48, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (chapter === 4) {
      // Draw Ninja Hood Mask
      ctx.fillStyle = '#180e29';
      ctx.beginPath();
      ctx.arc(0, -25, 10.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Mask face slit
      ctx.fillStyle = '#fbc4b2'; // visible eyes skin area
      ctx.fillRect(-6, -27, 12, 4);
      
      // Glowing red ninja eyes inside slit
      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(-2, -25, 1.2, 0, Math.PI * 2);
      ctx.arc(3, -25, 1.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Ninja head band tie at back
      ctx.fillStyle = '#d90429';
      ctx.beginPath();
      ctx.moveTo(-9, -25);
      ctx.lineTo(-17, -27);
      ctx.lineTo(-14, -22);
      ctx.closePath();
      ctx.fill();
    } else {
      // Head
      ctx.fillStyle = headSkinColor;
      ctx.beginPath();
      ctx.arc(0, -25, 10, 0, Math.PI * 2);
      ctx.fill();

      // Eye Patch / Cyber eye
      if (chapter >= 3) {
        // Cyber eye
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(3, -26, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(3, -26, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(3, -26, 3, 0, Math.PI*2); // eye patch circle
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(-7, -29);
        ctx.lineTo(8, -23);
        ctx.stroke();
      }

      // Bandana
      ctx.fillStyle = bandanaColor;
      ctx.beginPath();
      ctx.arc(0, -29, 10.5, Math.PI, 0); // top cap
      ctx.fill();
      // Bandana knot tails
      ctx.beginPath();
      ctx.moveTo(-9, -27);
      ctx.lineTo(-15, -29);
      ctx.lineTo(-12, -24);
      ctx.closePath();
      ctx.fill();
    }

    // Cutlass Sword in hand (drawn when attacking or idle)
    ctx.save();
    ctx.translate(-8, -4);
    
    // Attack swinging rotation
    if (this.isAttacking) {
      const swingProgress = this.attackTime / this.attackDuration;
      const angle = -Math.PI / 4 + swingProgress * Math.PI;
      ctx.rotate(-angle);
    } else {
      ctx.rotate(-Math.PI / 6);
    }
    
    if (this.isRanged) {
      if (chapter >= 5) {
        // Red Ketchup squeeze bottle! [NEW]
        ctx.fillStyle = '#ef476f'; // red bottle body
        ctx.fillRect(-3, -6, 8, 10); // main bottle
        ctx.fillStyle = '#ffd166'; // yellow tip/nozzle
        ctx.fillRect(5, -4, 4, 3); // nozzle
        
        // Flash if firing
        if (this.isAttacking && this.attackTime < 4) {
          ctx.save();
          ctx.fillStyle = 'rgba(239, 71, 111, 0.95)';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ef476f';
          ctx.beginPath();
          ctx.arc(10, -2.5, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Draw Laser Pistol [NEW]
        ctx.fillStyle = '#475569';
        ctx.fillRect(-2, -6, 10, 3);
        ctx.fillRect(-2, -3, 3, 6);
        ctx.fillStyle = '#00f5d4'; // neon cyan nozzle
        ctx.fillRect(8, -6, 2, 3);
        
        // Gun muzzle flash if firing
        if (this.isAttacking && this.attackTime < 4) {
          ctx.save();
          ctx.fillStyle = 'rgba(0, 245, 212, 0.95)';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#00f5d4';
          ctx.beginPath();
          ctx.arc(12, -4.5, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    } else {
      // Draw Sword / Cleaver
      ctx.strokeStyle = swordColor;
      ctx.lineCap = 'round';
      
      if (chapter === 2) {
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#70e000';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -20, -10, -28); // curved cutlass
        ctx.stroke();
      } else if (chapter === 3) {
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f5d4';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -20, -10, -28); // curved cutlass
        ctx.stroke();
      } else if (chapter === 4) {
        // Ninja Katana (Straight sword, neon red glow) [NEW]
        ctx.lineWidth = 3.0;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#d90429';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, -28); // straight katana
        ctx.stroke();
      } else if (chapter >= 5) {
        // Chef Kitchen Cleaver/Knife (菜刀) [NEW]
        ctx.fillStyle = '#94a3b8'; // steel blade
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(-14, -26, 12, 18);
        ctx.fill();
        ctx.stroke();
        
        // Shiny blade edge highlight
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-13, -25);
        ctx.lineTo(-13, -9);
        ctx.stroke();
        
        // Wooden handle
        ctx.strokeStyle = '#854d0e'; // brown handle
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-5, -8);
        ctx.stroke();
      } else {
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-15, -20, -10, -28); // curved cutlass
        ctx.stroke();
      }
    }
    
    // Hilt (golden guard) - Skip for cleaver
    if (chapter < 5 || this.isRanged) {
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI, true);
      ctx.stroke();
    }
    
    ctx.restore();

    ctx.restore(); // end pirate translation

    // DRAW PIRATE HEALTH BAR (Sleek overhead element)
    const showBar = this.isStageBoss || this.isBoss || this.hp < this.maxHp;
    if (showBar) {
      const barW = this.isStageBoss ? 64 : (this.isBoss ? 48 : 32);
      const barH = this.isStageBoss ? 8 : (this.isBoss ? 6 : 4);
      const barX = this.x + this.width/2 - barW/2;
      const barY = this.y - (this.isStageBoss ? 22 : (this.isBoss ? 16 : 10));
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      
      const fillW = (this.hp / this.maxHp) * barW;
      ctx.fillStyle = this.isStageBoss ? '#9d4edd' : (this.isBoss ? '#ffd166' : '#ef476f');
      ctx.fillRect(barX, barY, fillW, barH);

      // Draw Boss Label
      if (this.isStageBoss) {
        ctx.save();
        ctx.font = '800 11px "Outfit", Arial';
        ctx.fillStyle = '#9d4edd';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#9d4edd';
        ctx.fillText('👑 關卡魔王 👑', this.x + this.width/2, barY - 6);
        ctx.restore();
      } else if (this.isBoss) {
        ctx.save();
        ctx.font = '800 11px "Outfit", Arial';
        ctx.fillStyle = '#ffd166';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#ffd166';
        ctx.fillText('★ BOSS ★', this.x + this.width/2, barY - 5);
        ctx.restore();
      }
    }

    // DRAW PIRATE ATTACK SLASH EFFECT
    if (this.isAttacking) {
      const swingProgress = this.attackTime / this.attackDuration;
      if (swingProgress > 0.2 && swingProgress < 0.8) {
        ctx.save();
        const strokeColor = this.isStageBoss ? 'rgba(157, 78, 221, 0.7)' : (this.isBoss ? 'rgba(255, 209, 102, 0.65)' : 'rgba(239, 71, 111, 0.45)');
        const glowColor = this.isStageBoss ? '#9d4edd' : (this.isBoss ? '#ffd166' : '#ef476f');
        const slashRadius = this.isStageBoss ? 60 : (this.isBoss ? 46 : 32);
        
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = this.isStageBoss ? 8 : (this.isBoss ? 6 : 4);
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = glowColor;
        
        ctx.beginPath();
        // Draw sweep arc based on pirate direction
        const arcCenterX = this.x + this.width/2 + this.facing * (this.isStageBoss ? 30 : (this.isBoss ? 24 : 18));
        const arcCenterY = this.y + this.height/2;
        
        if (this.facing === 1) {
          ctx.arc(arcCenterX, arcCenterY, slashRadius, -Math.PI/3, Math.PI/3);
        } else {
          ctx.arc(arcCenterX, arcCenterY, slashRadius, Math.PI - Math.PI/3, Math.PI + Math.PI/3);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// Particle Helper Functions

function createParticle(x, y, vx, vy, color, size, life, type = 'spark') {
  particles.push({
    x, y, vx, vy, color, size,
    life, maxLife: life, type
  });
}

function createHitParticles(x, y, color) {
  // Exploding blood/spark particles
  const count = 12 + Math.random() * 8;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    const size = 2 + Math.random() * 3;
    const life = 20 + Math.random() * 20;
    createParticle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 1, // slight float up
      color,
      size,
      life,
      color === '#ef476f' ? 'blood' : 'spark'
    );
  }
}

function createDust(x, y, color = '#ffffff', count = 4) {
  for (let i = 0; i < count; i++) {
    const vx = (Math.random() - 0.5) * 1.5;
    const vy = -Math.random() * 0.8;
    const size = 3 + Math.random() * 5;
    const life = 15 + Math.random() * 15;
    createParticle(x, y, vx, vy, 'rgba(255,255,255,0.15)', size, life, 'dust');
  }
}

function createSwordSlashParticles(x, y, angle) {
  // Spark particles emitted along the sword arc
  const count = 6;
  let pColor = '#90e0ef';
  if (player.character === 'noob') {
    pColor = '#cbd5e1';
  } else if (player.character === 'anton') {
    pColor = '#ff4d6d';
  } else if (player.character === 'laige') {
    pColor = '#4ad66d';
  } else if (player.character === 'amber') {
    pColor = '#b5179e'; // Amber's purple hook color
  }
  
  for (let i = 0; i < count; i++) {
    const spreadAngle = angle + (Math.random() - 0.5) * 0.6;
    const speed = 3 + Math.random() * 4;
    const life = 10 + Math.random() * 10;
    const size = 1.5 + Math.random() * 2;
    createParticle(
      x, y,
      Math.cos(spreadAngle) * speed,
      Math.sin(spreadAngle) * speed,
      pColor,
      size,
      life,
      'spark'
    );
  }
}

function createTextPopup(x, y, text, color = '#fff') {
  textPopups.push({
    x, y, text, color,
    vy: -1.2,
    life: 45,
    maxLife: 45
  });
}

function shakeScreen(amt) {
  shakeIntensity = Math.min(shakeIntensity + amt, 15);
}

// Game Functions

function spawnPirate() {
  if (gameState !== 'playing') return;
  
  // 20th pirate of the chapter is the Stage Boss
  const killsInThisChapter = score - chapterStartScore;
  const isStageBoss = (killsInThisChapter === 19 && !stageBossSpawned);
  
  // Do not spawn other pirates if Stage Boss is alive
  if (stageBossSpawned && !isStageBoss) return;
  
  // Choose random edge (left or right)
  const spawnLeft = Math.random() < 0.5;
  const x = spawnLeft ? -60 : CANVAS_WIDTH + 20;
  
  // Pirates spawn at random heights: either ground, or platform heights
  const spawnType = Math.random();
  let y = GROUND_Y - 54;
  
  if (spawnType < 0.25) {
    // Spawn left platform
    y = platforms[0].y - 54;
  } else if (spawnType < 0.5) {
    // Spawn right platform
    y = platforms[1].y - 54;
  }
  
  const txtX = spawnLeft ? 50 : CANVAS_WIDTH - 120;
  
  if (isStageBoss) {
    stageBossSpawned = true;
    const spawnedY = y - 38; // Stage Boss height is 92 (standard is 54). Diff is 38.
    pirates.push(new Pirate(x, spawnedY, false, true));
    
    createTextPopup(txtX, GROUND_Y - 80, '😈 關卡魔王出現！請全力迎擊！', '#9d4edd');
    shakeScreen(8);
  } else {
    piratesSpawnedCount++;
    const isBoss = (piratesSpawnedCount % 5 === 0);
    
    // Adjust starting Y since Boss is taller
    let spawnedY = y;
    if (isBoss) {
      spawnedY = y - 18;
    }
    
    pirates.push(new Pirate(x, spawnedY, isBoss, false));
    
    if (isBoss) {
      createTextPopup(txtX, GROUND_Y - 80, '👑 首領海盜 BOSS 出現！', '#ffd166');
      shakeScreen(5);
    } else {
      createTextPopup(txtX, GROUND_Y - 80, '⚠️ 海盜來襲！', '#ef476f');
      shakeScreen(2);
    }
  }
}

function damagePlayer(amount, sourcePirate = null) {
  if (gameState !== 'playing') return;
  
  // Active Parry Block Logic (negates major damage, player takes no damage, stuns pirate)
  if (player.isParrying) {
    createHitParticles(player.x + player.width/2, player.y + player.height/2, '#ffd166'); // Golden sparks
    createTextPopup(player.x + player.width/2, player.y - 30, '⚡ 招架成功!', '#ffd166');
    shakeScreen(4);
    
    // Knock back, stun the pirate, but no damage deals
    if (sourcePirate) {
      sourcePirate.vx = -sourcePirate.facing * 7;
      sourcePirate.vy = -3;
      sourcePirate.hitFlashFrames = 15;
      sourcePirate.attackCooldown = 90; // Stun pirate for 1.5s
      createTextPopup(sourcePirate.x + sourcePirate.width/2, sourcePirate.y - 15, '暈眩 💫', '#ffd166');
    }
    
    if (player.hp <= 0) {
      endGame();
    }
    return;
  }
  
  if (player.invincibleFrames > 0) return;
  
  // Getting hit interrupts healing channel [NEW]
  if (player.isHealing) {
    player.isHealing = false;
    player.healProgress = 0;
    createTextPopup(player.x + player.width/2, player.y - 20, '治療中斷! 💥', '#ef476f');
  }
  
  // Apply defense buff damage reduction
  let finalDamage = amount;
  if (player.damageReduction > 0) {
    finalDamage = Math.round(amount * (1 - player.damageReduction));
  }
  
  player.hp = Math.max(player.hp - finalDamage, 0);
  player.invincibleFrames = 50; // ~0.8 seconds at 60fps
  
  // HUD update
  updateHpUI();
  
  // Impact Visuals
  damageOverlay.classList.remove('flash');
  void damageOverlay.offsetWidth; // trigger reflow
  damageOverlay.classList.add('flash');
  
  createTextPopup(player.x + player.width/2, player.y - 20, `-${finalDamage} HP`, '#ef476f');
  
  if (player.hp <= 0) {
    endGame();
  }
}

function updateHpUI() {
  const hpPct = (player.hp / player.maxHp) * 100;
  hpFill.style.width = `${hpPct}%`;
  hpValue.innerText = `${player.hp} / ${player.maxHp}`;
  
  // Color code hp fill based on danger level
  if (hpPct <= 25) {
    hpFill.style.background = 'linear-gradient(90deg, #d90429, #ef233c)';
  } else if (hpPct <= 50) {
    hpFill.style.background = 'linear-gradient(90deg, #f77f00, #fcbf49)';
  } else {
    hpFill.style.background = 'linear-gradient(90deg, #ef476f, #ff6b8b)';
  }
}

function resetGame(isRetry = false) {
  // Configure stats based on selected character [NEW]
  if (!isRetry) {
    player.attackRange = 75; // Reset default attack range [NEW]
    
    if (player.character === 'noob') {
      player.maxHp = 80; // NooB HP changed to 80 [NEW]
      player.hp = 80;
      player.baseDamage = 20; // Falling Steel Pipe damage 20
      player.attackMaxCooldown = 135; // 2.25s
    } else if (player.character === 'anton') {
      player.maxHp = 60; // Anton HP changed to 60 [NEW]
      player.hp = 60;
      player.baseDamage = 10;
      player.attackMaxCooldown = 90; // 1.5s
    } else if (player.character === 'laige') {
      player.maxHp = 200; // Laige HP changed to 200 [NEW]
      player.hp = 200;
      player.baseDamage = 10;
      player.attackMaxCooldown = 30; // 0.5s
      player.attackRange = 105; // Laige's sword Qi has longer range! [NEW]
    } else if (player.character === 'zhongtu') {
      player.maxHp = 100;
      player.hp = 100;
      player.baseDamage = 15;
      player.attackMaxCooldown = 75; // 1.25s
    } else if (player.character === 'bge') {
      player.maxHp = 100; // B哥 HP is 100 [NEW]
      player.hp = 100;
      player.baseDamage = 15; // 15 damage per second [NEW]
      player.attackMaxCooldown = 180; // 3.0s (180 frames) [NEW]
    } else if (player.character === 'amber') {
      player.maxHp = 100; // Amber HP is 100 [NEW]
      player.hp = 100;
      player.baseDamage = 15; // Melee hook damage 15 [NEW]
      player.attackMaxCooldown = 60; // 1.0s (60 frames) [NEW]
      player.attackRange = 115; // Amber's hook has longer range! [NEW]
    } else if (player.character === 'xiaobing') {
      player.maxHp = 80; // Xiaobing HP is 80 [NEW]
      player.hp = 80;
      player.baseDamage = 6; // Icicle projectile damage 6 [NEW]
      player.attackMaxCooldown = 72; // 1.2s (72 frames) [NEW]
    }
    
    // Reset buffs
    player.attackMultiplier = 1.0;
    player.damageReduction = 0.0;
    player.speedBuff = 1.0;
    player.aoeBonusDamage = 0; // [NEW]
    
    // Reset Double Jump & upgrades [NEW]
    player.doubleJumpUnlocked = false;
    player.maxEnergy = 50;
    player.healAmount = 20;
    player.jumpForce = -13.5; // Reset jump force [NEW]
    
    // Reset Milkshake attributes [NEW]
    player.milkshakeUnlocked = false;
    player.milkshakeCooldown = 0;
    player.milkshakeActiveTimer = 0;
    
    // Reset Chapter and Boss Stats
    chapter = 1;
    chapterStartScore = 0;
    score = 0;
  } else {
    // If it is a retry:
    player.hp = player.maxHp;
    score = chapterStartScore;
  }
  
  player.x = CANVAS_WIDTH / 2 - player.width / 2;
  player.y = GROUND_Y - player.height;
  player.vx = 0;
  player.vy = 0;
  player.isCrouching = false;
  player.wantsToStand = false;
  player.crouchTimer = 0;
  player.parryBroken = false;
  player.height = player.normalHeight;
  player.invincibleFrames = 0;
  player.attackCooldown = 0;
  player.isAttacking = false;
  player.isParrying = false;
  
  // Reset healing and energy stats [NEW]
  player.energy = player.maxEnergy; // Use maxEnergy since it could be buffed!
  player.isHealing = false;
  player.healProgress = 0;
  
  player.jumpCount = 0;
  player.wPressed = false;
  
  // Reset milkshake cooldown/active state on retry/reset
  player.milkshakeCooldown = 0;
  player.milkshakeActiveTimer = 0;
  
  // Reset Dash attributes [NEW]
  player.dashActiveTimer = 0;
  player.dashDirection = 1;
  
  // Reset AoE stats [NEW]
  aoeTimer = 30;
  aoeEffect.active = false;
  
  // Reset Chapter and Boss Stats
  const chapterNumber = document.getElementById('chapterNumber');
  if (chapterNumber) {
    chapterNumber.innerText = chapter.toString();
  }
  stageBossSpawned = false;
  
  // Reset Boss Spawn Counter
  piratesSpawnedCount = 0;
  
  // Clear lists
  pirates = [];
  particles = [];
  playerProjectiles = []; // Clear projectiles [NEW]
  enemyProjectiles = [];  // Clear enemy projectiles [NEW]
  poisonMists = [];       // Clear poison mists [NEW]
  textPopups = [];
  delayedPipes = []; // [NEW]
  
  // Reset HUD
  killsCount.innerText = score.toString();
  updateHpUI();
  
  const milkshakeNotificationElement = document.getElementById('milkshakeNotification');
  if (milkshakeNotificationElement) {
    if (player.milkshakeUnlocked) {
      milkshakeNotificationElement.classList.remove('hidden');
    } else {
      milkshakeNotificationElement.classList.add('hidden');
    }
  }
  
  // Timers
  startTime = Date.now();
  gameTime = 0;
  lastSpawnTime = Date.now();
  
  // Reset keyboard state to prevent sticking keys
  Object.keys(keys).forEach(k => keys[k] = false);
  updateKeysUI();

  // Spawn initial pirate immediately so the player doesn't wait 10s
  spawnPirate();
}

function startGame(isRetry = false) {
  // Config character name [NEW]
  if (player.character === 'noob') {
    player.name = 'NooB';
  } else if (player.character === 'anton') {
    player.name = '安東';
  } else if (player.character === 'laige') {
    player.name = '來哥';
  } else if (player.character === 'zhongtu') {
    player.name = '重土';
  } else if (player.character === 'bge') {
    player.name = 'B哥';
  } else if (player.character === 'amber') {
    player.name = '安柏';
  } else if (player.character === 'xiaobing') {
    player.name = '小冰';
  }
  
  // Set HUD name
  const hudPlayerName = document.getElementById('hudPlayerName');
  if (hudPlayerName) {
    hudPlayerName.innerText = player.name;
  }
  
  // Set HUD chapter
  const chapterNumber = document.getElementById('chapterNumber');
  if (chapterNumber) {
    chapterNumber.innerText = isRetry ? chapter.toString() : '1';
  }
  
  gameState = 'playing';
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  resetGame(isRetry);
}

function endGame() {
  gameState = 'gameover';
  gameOverScreen.classList.remove('hidden');
  
  // Calculate survive time
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  finalKills.innerText = score;
  finalTime.innerText = `${elapsed} 秒`;
  
  // Screen shake death burst
  shakeScreen(12);
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 8;
    createParticle(
      player.x + player.width/2, player.y + player.height/2,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      '#00b4d8', 4 + Math.random() * 4, 30 + Math.random() * 30, 'spark'
    );
  }
}

// Attack logic (Triggered by Mouse Down on Canvas)
function performPlayerAttack(e) {
  if (gameState !== 'playing' || player.attackCooldown > 0 || player.isParrying) return;
  
  // Calculate mouse position relative to canvas coordinate system
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;
  
  // Character center
  const pCenterX = player.x + player.width/2;
  const pCenterY = player.y + player.height/2;
  
  // Get vector angle to mouse click
  const dx = clickX - pCenterX;
  const dy = clickY - pCenterY;
  player.attackAngle = Math.atan2(dy, dx);
  
  // Set facing direction based on click
  player.facing = dx >= 0 ? 1 : -1;
  
  // Start attack state
  player.isAttacking = true;
  player.attackTime = 0;
  player.attackCooldown = player.attackMaxCooldown;
  
  // Ranged falling steel pipe attack for NooB [NEW]
  if (player.character === 'noob') {
    const damage = Math.round(player.baseDamage * player.attackMultiplier);
    delayedPipes.push({
      targetX: clickX,
      targetY: GROUND_Y, // Always target the ground
      delayFrames: 60, // 1 second delay
      damage: damage
    });
    
    createTextPopup(pCenterX, pCenterY - 20, '🏗️ 鋼管預備...', '#94a3b8');
    shakeScreen(1.0);
    return; // Skip standard close range melee swing
  }
  
  // Ranged poison mist attack for B哥 [NEW]
  if (player.character === 'bge') {
    const mistDamage = Math.round(player.baseDamage * player.attackMultiplier);
    poisonMists.push({
      x: player.x + (player.facing > 0 ? player.width : 0),
      y: player.y + player.height / 2 - 5,
      vx: player.facing * 4.0,
      vy: 0,
      radius: 15,
      maxRadius: 55, // Small area
      life: 240, // 4 seconds (240 frames at 60fps) [NEW]
      damage: mistDamage,
      color: '#06d6a0' // neon toxic green
    });
    
    // Throw toxic dust particles
    createHitParticles(pCenterX, pCenterY, '#06d6a0');
    shakeScreen(0.5);
    return; // Skip standard close range melee swing
  }
  
  // Ranged gun attack for Anton [NEW]
  if (player.character === 'anton') {
    const angle = player.attackAngle;
    playerProjectiles.push({
      x: pCenterX,
      y: pCenterY,
      vx: Math.cos(angle) * 12,
      vy: Math.sin(angle) * 12,
      radius: 4,
      color: '#ff4d6d',
      damage: Math.round(player.baseDamage * player.attackMultiplier),
      life: 120
    });
    
    // Muzzle flash particles
    createHitParticles(pCenterX + Math.cos(angle) * 18, pCenterY + Math.sin(angle) * 18, '#ff4d6d');
    shakeScreen(1.0);
    return; // Skip standard close range melee swing collision detection
  }
  
  // Ranged stone throw attack for Zhongtu [NEW]
  if (player.character === 'zhongtu') {
    const angle = player.attackAngle;
    playerProjectiles.push({
      x: pCenterX,
      y: pCenterY,
      vx: Math.cos(angle) * 9.5,
      vy: Math.sin(angle) * 9.5 - 2.5, // Slight upward arc boost
      radius: 6,
      color: '#c2a67a', // Earth/stone color
      damage: Math.round(player.baseDamage * player.attackMultiplier),
      life: 180, // longer life because of slow arc
      gravity: 0.22, // parabolic gravity
      isStone: true
    });
    
    // Throw dust particles
    createHitParticles(pCenterX, pCenterY, '#c2a67a');
    shakeScreen(0.5);
    return; // Skip standard close range melee swing
  }
  
  // Ranged icicle attack for Xiaobing [NEW]
  if (player.character === 'xiaobing') {
    const angle = player.attackAngle;
    playerProjectiles.push({
      x: pCenterX,
      y: pCenterY,
      vx: Math.cos(angle) * 11,
      vy: Math.sin(angle) * 11,
      radius: 5,
      color: '#90e0ef', // Icicle ice blue
      damage: Math.round(player.baseDamage * player.attackMultiplier),
      life: 120,
      isIcicle: true // flag to identify ice projectiles
    });
    
    // Ice flash particles
    createHitParticles(pCenterX, pCenterY, '#90e0ef');
    shakeScreen(0.5);
    return; // Skip standard close range melee swing
  }
  
  // Emit slash dust/sparks
  const spawnDist = 28;
  const slashX = pCenterX + Math.cos(player.attackAngle) * spawnDist;
  const slashY = pCenterY + Math.sin(player.attackAngle) * spawnDist;
  createSwordSlashParticles(slashX, slashY, player.attackAngle);
  
  // Attack Hit Detection
  // Check all pirates inside the slash sector radius
  let hitsRegistered = 0;
  
  for (let pirate of pirates) {
    const pirCenterX = pirate.x + pirate.width/2;
    const pirCenterY = pirate.y + pirate.height/2;
    
    const pDx = pirCenterX - pCenterX;
    const pDy = pirCenterY - pCenterY;
    const dist = Math.sqrt(pDx * pDx + pDy * pDy);
    
    // Check if within slash range
    if (dist <= player.attackRange) {
      // Check if angle is within front sector (approx 120 degrees arc)
      const targetAngle = Math.atan2(pDy, pDx);
      // Normalized angle difference
      let diffAngle = targetAngle - player.attackAngle;
      while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
      while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
      
      if (Math.abs(diffAngle) < Math.PI / 2.3) {
        // Register hit! Apply attackMultiplier buff
        const damage = Math.round(player.baseDamage * player.attackMultiplier);
        pirate.hp -= damage;
        pirate.hitFlashFrames = 10;
        hitsRegistered++;
        
        // Knockback pirate in the direction of the slash (hitFlashFrames allows it to slide)
        let knockSpeed = 4.0; // Slashed back slightly
        let knockbackY = -1.8;
        
        if (player.character === 'amber') {
          // Hooks knockback further! [NEW]
          knockSpeed = 9.5;
          knockbackY = -3.5;
          
          // Apply poison status effect (lasts 4 seconds = 240 frames) [NEW]
          pirate.poisonDuration = 240;
          if (!pirate.lastPoisonTickTime) {
            pirate.lastPoisonTickTime = Date.now();
          }
        }
        
        pirate.vx = Math.cos(player.attackAngle) * knockSpeed;
        pirate.vy = knockbackY; // slight pop up
        pirate.jumpCooldown = 40; // stun AI jump momentarily
        
        // Character specific hits [NEW]
        let pColor = '#90e0ef';
        let popupText = `-${damage}`;
        if (player.character === 'noob') {
          pColor = '#cbd5e1'; // Silver (Steel)
          popupText = `⚙️ -${damage}`;
        } else if (player.character === 'anton') {
          pColor = '#ff4d6d'; // Pink laser
          popupText = `⚡ -${damage}`;
        } else if (player.character === 'laige') {
          pColor = '#4ad66d'; // Green sword Qi
          popupText = `🍃 -${damage}`;
        } else if (player.character === 'amber') {
          pColor = '#b5179e'; // Purple hook
          popupText = `🪝 -${damage}`;
        }
        
        createHitParticles(pirCenterX, pirCenterY, pColor);
        createTextPopup(pirCenterX, pirate.y - 15, popupText, pColor);
        
        // Check pirate death
        if (pirate.hp <= 0) {
          score++;
          killsCount.innerText = score;
          createDust(pirCenterX, pirate.y + pirate.height, 'rgba(255,255,255,0.4)', 15);
          createTextPopup(pirCenterX, pirate.y - 35, '擊殺! 💀', '#ff9f1c');
          
          if (pirate.isStageBoss) {
            triggerChapterClear();
          } else {
            shakeScreen(5);
          }
        } else {
          shakeScreen(2.5);
        }
      }
    }
  }
  
  // Clean up dead pirates
  pirates = pirates.filter(p => p.hp > 0);
}

// Input Handlers

window.addEventListener('keydown', (e) => {
  // ESC key for Pausing [NEW]
  if (e.key === 'Escape') {
    if (gameState === 'playing') {
      isPaused = !isPaused;
      const pauseScreen = document.getElementById('pauseScreen');
      if (pauseScreen) {
        if (isPaused) {
          pauseStartTime = Date.now();
          pauseScreen.classList.remove('hidden');
        } else {
          const pausedMs = Date.now() - pauseStartTime;
          startTime += pausedMs;
          lastSpawnTime += pausedMs;
          pauseScreen.classList.add('hidden');
        }
      }
    }
    return; // Block other inputs during pause toggle
  }
  
  // If game is paused, block key actions
  if (isPaused && gameState === 'playing') return;

  const key = e.key.toLowerCase();
  
  // R key for Milkshake [NEW]
  if (key === 'r') {
    if (gameState === 'dialogue_red_hat') {
      player.milkshakeUnlocked = true;
      dialogueScreen.classList.add('hidden');
      
      gameState = 'buff_selection';
      buffScreen.classList.remove('hidden');
      
      createTextPopup(player.x + player.width/2, player.y - 40, '🥤 獲得能量奶昔！', '#ff4d6d');
      shakeScreen(5);
      return;
    }
    
    if (gameState === 'playing' && player.milkshakeUnlocked) {
      if (player.milkshakeCooldown === 0) {
        player.milkshakeActiveTimer = 600; // 10 seconds at 60fps
        player.milkshakeCooldown = 3600;   // 60 seconds at 60fps
        
        createTextPopup(player.x + player.width/2, player.y - 40, '🥤 能量無限啟動！', '#ff4d6d');
        shakeScreen(4);
        
        // Spawn active burst particles
        for (let i = 0; i < 20; i++) {
          createParticle(
            player.x + player.width/2 + (Math.random() - 0.5)*30,
            player.y + player.height/2 + (Math.random() - 0.5)*40,
            (Math.random() - 0.5)*3,
            -Math.random()*3 - 1,
            '#ff4d6d', 2.5 + Math.random()*3, 30 + Math.random()*30, 'spark'
          );
        }
      }
    }
  }
  
  // Q key for Dash [NEW]
  if (key === 'q') {
    if (gameState === 'playing' && player.dashActiveTimer === 0) {
      if (player.energy >= 20) {
        player.energy -= 20;
        player.dashActiveTimer = 12; // 12 frames of dash
        player.dashDirection = player.facing;
        createTextPopup(player.x + player.width/2, player.y - 20, '衝刺! 💨', '#00b4d8');
        shakeScreen(3);
        if (player.isCrouching) {
          player.wantsToStand = true;
          exitCrouch();
          if (!player.isCrouching) {
            player.wantsToStand = false;
            player.crouchTimer = 0;
          }
        }
        
        // Spawn dash start smoke particles
        for (let i = 0; i < 8; i++) {
          createParticle(
            player.x + player.width/2,
            player.y + player.height - 10,
            -player.facing * (1 + Math.random() * 3),
            (Math.random() - 0.5) * 2,
            'rgba(255,255,255,0.6)',
            3 + Math.random() * 2,
            15 + Math.random() * 15,
            'smoke'
          );
        }
      } else {
        if (Math.random() < 0.15) { // throttle spamming
          createTextPopup(player.x + player.width/2, player.y - 20, '能量不足 ⚡', '#ffd166');
        }
      }
    }
  }
  
  if (key === 'w' || key === 'arrowup') keys.w = true;
  if (key === 'a' || key === 'arrowleft') keys.a = true;
  if (key === 's' || key === 'arrowdown') {
    if (e.repeat) return;
    keys.s = true;
    if (!player.isCrouching) {
      enterCrouch();
    }
    player.crouchTimer = 30; // 30 frames at 60fps = 0.5s
    player.wantsToStand = false;
  }
  if (key === 'd' || key === 'arrowright') keys.d = true;
  
  // Heal key binding [NEW]
  if (key === 'h') {
    keys.h = true;
    if (player.character !== 'laige') {
      createTextPopup(player.x + player.width/2, player.y - 20, `${player.name}無法進行治療 ❌`, '#ff4d6d');
    } else if (!player.isHealing && player.hp < player.maxHp) {
      player.isHealing = true;
      player.healProgress = 0;
      createTextPopup(player.x + player.width/2, player.y - 20, '開始治療 💖', '#4ad66d');
    }
  }
  // AoE key binding [NEW]
  if (key === 'f') {
    keys.f = true;
    if (aoeTimer >= 30) {
      performPlayerAoe();
    }
  }
  
  updateKeysUI();
});

window.addEventListener('keyup', (e) => {
  if (isPaused && gameState === 'playing') return;
  
  const key = e.key.toLowerCase();
  
  if (key === 'w' || key === 'arrowup') keys.w = false;
  if (key === 'a' || key === 'arrowleft') keys.a = false;
  if (key === 's' || key === 'arrowdown') {
    keys.s = false;
  }
  if (key === 'd' || key === 'arrowright') keys.d = false;
  if (key === 'h') keys.h = false;
  if (key === 'f') keys.f = false;
  
  updateKeysUI();
});

canvas.addEventListener('mousedown', (e) => {
  if (isPaused && gameState === 'playing') return;
  
  if (e.button === 0) { // Left click
    performPlayerAttack(e);
  } else if (e.button === 2) { // Right click
    keys.rightClick = true; // Hold parry
  }
});

// Release held parry globally so it doesn't get stuck
window.addEventListener('mouseup', (e) => {
  if (e.button === 2) {
    keys.rightClick = false;
  }
});

// Avoid canvas mouse context menu
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Buttons listeners
startBtn.addEventListener('click', () => startGame(false));
retryBtn.addEventListener('click', () => startGame(true));

// Buff button listeners [NEW]
const buffScreen = document.getElementById('buffScreen');
const chapterClearText = document.getElementById('chapterClearText');
const buffAttackBtn = document.getElementById('buffAttackBtn');
const buffDefenseBtn = document.getElementById('buffDefenseBtn');
const buffSpeedBtn = document.getElementById('buffSpeedBtn');
const dialogueScreen = document.getElementById('dialogueScreen'); // [NEW]
const milkshakeNotification = document.getElementById('milkshakeNotification'); // [NEW]

buffAttackBtn.addEventListener('click', () => applyBuff('attack'));
buffDefenseBtn.addEventListener('click', () => applyBuff('defense'));
buffSpeedBtn.addEventListener('click', () => applyBuff('speed'));

// Character selection cards listeners [NEW]
const charNoob = document.getElementById('charNoob');
const charAnton = document.getElementById('charAnton');
const charLaige = document.getElementById('charLaige');
const charZhongtu = document.getElementById('charZhongtu'); // [NEW]
const charBge = document.getElementById('charBge'); // [NEW]
const charAmber = document.getElementById('charAmber'); // [NEW]
const charXiaobing = document.getElementById('charXiaobing'); // [NEW]

charNoob.addEventListener('click', () => selectCharacter('noob'));
charAnton.addEventListener('click', () => selectCharacter('anton'));
charLaige.addEventListener('click', () => selectCharacter('laige'));
charZhongtu.addEventListener('click', () => selectCharacter('zhongtu')); // [NEW]
charBge.addEventListener('click', () => selectCharacter('bge')); // [NEW]
charAmber.addEventListener('click', () => selectCharacter('amber')); // [NEW]
charXiaobing.addEventListener('click', () => selectCharacter('xiaobing')); // [NEW]

function selectCharacter(char) {
  player.character = char;
  
  charNoob.classList.remove('active');
  charAnton.classList.remove('active');
  charLaige.classList.remove('active');
  charZhongtu.classList.remove('active'); // [NEW]
  charBge.classList.remove('active'); // [NEW]
  charAmber.classList.remove('active'); // [NEW]
  charXiaobing.classList.remove('active'); // [NEW]
  
  charNoob.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  charAnton.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  charLaige.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  charZhongtu.style.borderColor = 'rgba(255, 255, 255, 0.1)'; // [NEW]
  charBge.style.borderColor = 'rgba(255, 255, 255, 0.1)'; // [NEW]
  charAmber.style.borderColor = 'rgba(255, 255, 255, 0.1)'; // [NEW]
  charXiaobing.style.borderColor = 'rgba(255, 255, 255, 0.1)'; // [NEW]
  
  charNoob.style.boxShadow = 'none';
  charAnton.style.boxShadow = 'none';
  charLaige.style.boxShadow = 'none';
  charZhongtu.style.boxShadow = 'none'; // [NEW]
  charBge.style.boxShadow = 'none'; // [NEW]
  charAmber.style.boxShadow = 'none'; // [NEW]
  charXiaobing.style.boxShadow = 'none'; // [NEW]
  
  if (char === 'noob') {
    charNoob.classList.add('active');
    charNoob.style.borderColor = '#ffd166';
    charNoob.style.boxShadow = '0 0 20px rgba(255, 209, 102, 0.35)';
  } else if (char === 'anton') {
    charAnton.classList.add('active');
    charAnton.style.borderColor = '#ff4d6d';
    charAnton.style.boxShadow = '0 0 20px rgba(255, 77, 109, 0.35)';
  } else if (char === 'laige') {
    charLaige.classList.add('active');
    charLaige.style.borderColor = '#4ad66d';
    charLaige.style.boxShadow = '0 0 20px rgba(74, 214, 109, 0.35)';
  } else if (char === 'zhongtu') {
    charZhongtu.classList.add('active');
    charZhongtu.style.borderColor = '#c2a67a';
    charZhongtu.style.boxShadow = '0 0 20px rgba(194, 166, 122, 0.35)';
  } else if (char === 'bge') {
    charBge.classList.add('active');
    charBge.style.borderColor = '#2ec4b6';
    charBge.style.boxShadow = '0 0 20px rgba(46, 196, 182, 0.35)';
  } else if (char === 'amber') {
    charAmber.classList.add('active');
    charAmber.style.borderColor = '#b5179e';
    charAmber.style.boxShadow = '0 0 20px rgba(181, 23, 158, 0.35)';
  } else if (char === 'xiaobing') {
    charXiaobing.classList.add('active');
    charXiaobing.style.borderColor = '#00b4d8';
    charXiaobing.style.boxShadow = '0 0 20px rgba(0, 180, 216, 0.35)';
  }
}

function updateKeysUI() {
  if (keys.w) keyW.classList.add('active'); else keyW.classList.remove('active');
  if (keys.a) keyA.classList.add('active'); else keyA.classList.remove('active');
  if (player.isCrouching) keyS.classList.add('active'); else keyS.classList.remove('active');
  if (keys.d) keyD.classList.add('active'); else keyD.classList.remove('active');
}

function enterCrouch() {
  player.isCrouching = true;
  player.height = player.crouchHeight;
  player.y += (player.normalHeight - player.crouchHeight); // shift player down
  
  // Spawn slight dust when sliding down
  if (player.isGrounded) {
    createDust(player.x + player.width/2, player.y + player.height, '#fff', 3);
  }
}

function exitCrouch() {
  if (!player.isCrouching) return;
  
  // Collision Check: Ensure player has space above before standing up
  // Check if player would collide with platforms if they stood up
  let canStand = true;
  const targetY = player.y - (player.normalHeight - player.crouchHeight);
  
  for (let plat of platforms) {
    if (player.x + player.width > plat.x &&
        player.x < plat.x + plat.width &&
        targetY < plat.y + plat.height &&
        player.y + player.crouchHeight > plat.y) {
      // There is a platform ceiling right above. Cannot stand!
      canStand = false;
      break;
    }
  }
  
  if (canStand) {
    player.isCrouching = false;
    player.height = player.normalHeight;
    player.y = targetY; // shift player back up
  } else {
    // Keep crouched. It will try to stand up next frame keys.s is released and clearance is made
    // (We handle this inside the main loop update)
  }
}

// Spawn interval configuration based on Chapter [NEW]
function getSpawnInterval() {
  if (chapter === 4) return 3500;   // Chapter 4: 3.5 seconds
  if (chapter >= 5) return 3000;    // Chapter 5: 3.0 seconds [NEW]
  return 6000;                      // Other chapters: 6 seconds
}

// Physics & Collision Update Loops

function updatePlayer() {
  // Apply gravity
  player.vy += GRAVITY;
  player.y += player.vy;
  
  // Horizontal movement acceleration (Slow down while healing, Speed buff applied)
  let speedMultiplier = 1.0;
  if (player.isHealing) {
    speedMultiplier = 0.4; // 60% speed reduction while channel healing
  }
  const currentMaxSpeed = (player.isCrouching ? player.crouchMaxSpeed : player.maxSpeed) * speedMultiplier * player.speedBuff;
  const currentAccel = player.speed * speedMultiplier * player.speedBuff;
  
  if (keys.a) {
    player.vx -= currentAccel;
    player.facing = -1;
  }
  if (keys.d) {
    player.vx += currentAccel;
    player.facing = 1;
  }
  
  // Apply friction
  player.vx *= 0.85;
  
  // Clamp speed
  if (player.vx > currentMaxSpeed) player.vx = currentMaxSpeed;
  if (player.vx < -currentMaxSpeed) player.vx = -currentMaxSpeed;
  
  // Dash override [NEW]
  if (player.dashActiveTimer > 0) {
    player.dashActiveTimer--;
    player.vx = player.dashDirection * 16;
    
    // Trailing spark/wind particles
    if (Math.random() < 0.5) {
      createParticle(
        player.x + (player.dashDirection > 0 ? 0 : player.width),
        player.y + player.height/2 + (Math.random() - 0.5) * 20,
        -player.dashDirection * (1 + Math.random() * 2),
        (Math.random() - 0.5) * 1,
        'rgba(0, 180, 216, 0.5)',
        2 + Math.random() * 2,
        10 + Math.random() * 10,
        'spark'
      );
    }
  }
  
  player.x += player.vx;
  
  // Handle crouch timer tick and auto-standing up [NEW]
  if (player.isCrouching) {
    if (player.crouchTimer > 0 && !player.wantsToStand) {
      player.crouchTimer--;
      if (player.crouchTimer === 0) {
        player.wantsToStand = true;
      }
    }
    
    if (player.wantsToStand) {
      exitCrouch();
      if (!player.isCrouching) {
        player.wantsToStand = false;
        player.crouchTimer = 0;
      }
    }
  }

  // Reset jump count when grounded
  if (player.isGrounded) {
    player.jumpCount = 0;
  }

  // Jumping (W Key Jump) - Costs 10 Energy, supports single pulse double jump [NEW]
  const wJustPressed = keys.w && !player.wPressed;
  player.wPressed = keys.w; // update state
  
  if (wJustPressed) {
    const canJump = player.isGrounded || (player.doubleJumpUnlocked && player.jumpCount < 2);
    if (canJump) {
      if (player.energy >= 10) {
        player.energy -= 10;
        if (player.isCrouching) {
          player.wantsToStand = true;
          exitCrouch();
          if (!player.isCrouching) {
            player.wantsToStand = false;
            player.crouchTimer = 0;
          }
        }
        player.vy = player.jumpForce;
        player.isGrounded = false;
        player.jumpCount++;
        
        // Spawn jump dust
        createDust(player.x + player.width/2, player.y + player.height, '#fff', 6);
        if (player.jumpCount > 1) {
          createTextPopup(player.x + player.width/2, player.y - 20, '二段跳! 🚀', '#00b4d8');
        }
      } else {
        // Not enough energy to jump
        if (Math.random() < 0.05) { // Throttle spamming popup
          createTextPopup(player.x + player.width/2, player.y - 20, '能量不足 ⚡', '#ffd166');
        }
      }
    }
  }

  // Boundaries checking (Canvas edges)
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }
  if (player.x + player.width > CANVAS_WIDTH) {
    player.x = CANVAS_WIDTH - player.width;
    player.vx = 0;
  }

  // Land on Ground (vy >= 0 check allows W jump upward movement)
  player.isGrounded = false;
  if (player.vy >= 0 && player.y + player.height >= GROUND_Y) {
    player.y = GROUND_Y - player.height;
    player.vy = 0;
    player.isGrounded = true;
  }

  // One-way Platform landing collision
  for (let plat of platforms) {
    // Check if player feet pass the platform top edge downwards
    if (player.vy >= 0 &&
        player.x + player.width > plat.x &&
        player.x < plat.x + plat.width &&
        player.y + player.height >= plat.y &&
        player.y + player.height - player.vy <= plat.y + 8) {
      
      player.y = plat.y - player.height;
      player.vy = 0;
      player.isGrounded = true;
    }
  }

  // Running dust particles
  if (Math.abs(player.vx) > 1.5 && player.isGrounded && Math.random() < 0.25) {
    createDust(player.x + player.width/2, player.y + player.height, '#ffffff', 1);
  }

  // Energy regeneration: 5 per second (5/60 per frame) [NEW]
  player.energy = Math.min(player.energy + 5 / 60, player.maxEnergy);
  
  // Milkshake infinite energy buff handler [NEW]
  if (player.milkshakeActiveTimer > 0) {
    player.milkshakeActiveTimer--;
    player.energy = player.maxEnergy;
    // Spawn fancy sparkly pink trail
    if (Math.random() < 0.35) {
      createParticle(
        player.x + player.width/2 + (Math.random() - 0.5) * player.width,
        player.y + player.height/2 + (Math.random() - 0.5) * player.height,
        (Math.random() - 0.5) * 1.5,
        -Math.random() * 2 - 1,
        '#ff4d6d',
        2 + Math.random() * 2.5,
        25 + Math.random() * 25,
        'spark'
      );
    }
  }
  
  // Decr Milkshake cooldown [NEW]
  if (player.milkshakeCooldown > 0) {
    player.milkshakeCooldown--;
  }
  
  // Update Energy Bar HUD
  const energyFill = document.getElementById('energyFill');
  const energyValue = document.getElementById('energyValue');
  if (energyFill && energyValue) {
    const energyPct = (player.energy / player.maxEnergy) * 100;
    energyFill.style.width = `${energyPct}%`;
    energyValue.innerText = `${Math.floor(player.energy)} / ${player.maxEnergy}`;
  }

  // AoE timer updates: 30 seconds cooldown [NEW]
  if (aoeTimer < 30) {
    aoeTimer = Math.min(aoeTimer + 1/60, 30);
  }
  
  // Update AoE Alert Banner [NEW]
  const aoeNotification = document.getElementById('aoeNotification');
  if (aoeNotification) {
    if (aoeTimer >= 30) {
      aoeNotification.classList.remove('hidden');
      aoeNotification.style.opacity = '1';
      aoeNotification.style.borderColor = '#ffd166';
      aoeNotification.style.animation = 'aoe-glow 1.5s infinite alternate';
      aoeNotification.querySelector('span').innerHTML = '💥 範圍攻擊就緒 (按 F 釋放)';
      aoeNotification.querySelector('span').style.color = '#ffd166';
    } else {
      const remainingSec = Math.ceil(30 - aoeTimer);
      aoeNotification.classList.remove('hidden');
      aoeNotification.style.opacity = '0.65';
      aoeNotification.style.borderColor = 'rgba(255,255,255,0.2)';
      aoeNotification.style.animation = 'none';
      aoeNotification.style.boxShadow = 'none';
      aoeNotification.querySelector('span').innerHTML = `⏳ 範圍攻擊冷卻中 (${remainingSec}秒)`;
      aoeNotification.querySelector('span').style.color = '#adb5bd';
    }
  }
  
  // Show/Hide and update Milkshake notification [NEW]
  const milkshakeNotificationElement = document.getElementById('milkshakeNotification');
  if (milkshakeNotificationElement) {
    if (!player.milkshakeUnlocked) {
      milkshakeNotificationElement.classList.add('hidden');
    } else {
      milkshakeNotificationElement.classList.remove('hidden');
      if (player.milkshakeActiveTimer > 0) {
        // Active infinite energy state
        const remainingActiveSec = Math.ceil(player.milkshakeActiveTimer / 60);
        milkshakeNotificationElement.style.opacity = '1';
        milkshakeNotificationElement.style.borderColor = '#ff4d6d';
        milkshakeNotificationElement.style.animation = 'milkshake-glow 0.5s infinite alternate';
        milkshakeNotificationElement.querySelector('span').innerHTML = `⚡ 能量無限中 (${remainingActiveSec}秒)`;
        milkshakeNotificationElement.querySelector('span').style.color = '#ff4d6d';
      } else if (player.milkshakeCooldown > 0) {
        // Cooldown state
        const remainingCooldownSec = Math.ceil(player.milkshakeCooldown / 60);
        milkshakeNotificationElement.style.opacity = '0.65';
        milkshakeNotificationElement.style.borderColor = 'rgba(255,255,255,0.2)';
        milkshakeNotificationElement.style.animation = 'none';
        milkshakeNotificationElement.style.boxShadow = 'none';
        milkshakeNotificationElement.querySelector('span').innerHTML = `⏳ 能量奶昔冷卻中 (${remainingCooldownSec}秒)`;
        milkshakeNotificationElement.querySelector('span').style.color = '#adb5bd';
      } else {
        // Ready state
        milkshakeNotificationElement.style.opacity = '1';
        milkshakeNotificationElement.style.borderColor = '#ff4d6d';
        milkshakeNotificationElement.style.animation = 'milkshake-glow 1.5s infinite alternate';
        milkshakeNotificationElement.querySelector('span').innerHTML = '🥤 能量奶昔就緒 (按 R 釋放)';
        milkshakeNotificationElement.querySelector('span').style.color = '#ff4d6d';
      }
    }
  }

  // Healing channel tick: 8 seconds (480 frames) [NEW]
  if (player.isHealing) {
    player.healProgress++;
    if (player.healProgress >= 480) { // Completed 8s
      player.hp = Math.min(player.hp + player.healAmount, player.maxHp);
      player.isHealing = false;
      player.healProgress = 0;
      updateHpUI();
      
      // Heal success burst particles
      for (let i = 0; i < 15; i++) {
        createParticle(
          player.x + player.width/2 + (Math.random() - 0.5)*30,
          player.y + player.height/2 + (Math.random() - 0.5)*40,
          (Math.random() - 0.5)*2,
          -Math.random()*2 - 0.5,
          '#4ad66d', 2.5 + Math.random()*3, 30 + Math.random()*20, 'spark'
        );
      }
      createTextPopup(player.x + player.width/2, player.y - 20, `+${player.healAmount} HP 💖`, '#4ad66d');
    }
  }

  // Tick cooldowns
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.invincibleFrames > 0) player.invincibleFrames--;

  // Player attack animation update
  if (player.isAttacking) {
    player.attackTime++;
    if (player.attackTime >= player.attackDuration) {
      player.isAttacking = false;
    }
  }

  // Parry Broken Recovery Check [NEW]
  if (player.parryBroken && player.energy >= 20) {
    player.parryBroken = false;
    createTextPopup(player.x + player.width/2, player.y - 20, '⚡ 招架已就緒!', '#ffd166');
  }

  // Held Parry state update [NEW] - Cannot parry while healing, requires energy and not broken
  if (keys.rightClick && !player.isAttacking && !player.isHealing && !player.parryBroken) {
    player.isParrying = true;
    
    // Deduct 10 energy per second (10/60 per frame at 60fps)
    player.energy = Math.max(0, player.energy - 10 / 60);
    
    // Check if energy dropped below 5
    if (player.energy < 5) {
      player.parryBroken = true;
      player.isParrying = false;
      createTextPopup(player.x + player.width/2, player.y - 20, '⚡ 招架力竭! ❌', '#ff4d6d');
    }
    
    // Spawn subtle shield sparkles
    if (Math.random() < 0.15 && player.isParrying) {
      createParticle(
        player.x + player.width/2 + (Math.random() - 0.5)*32,
        player.y + player.height/2 + (Math.random() - 0.5)*40,
        (Math.random() - 0.5)*0.8,
        (Math.random() - 0.5)*0.8,
        '#ffd166', 1.5 + Math.random()*2, 12, 'spark'
      );
    }
  } else {
    player.isParrying = false;
  }
}

// Rendering Logic

function drawPlayer() {
  ctx.save();

  // Invincibility frame blinking effect
  if (player.invincibleFrames > 0) {
    if (Math.floor(player.invincibleFrames / 3) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }
  }

  // Translation to player center for rotation/facing
  ctx.translate(player.x + player.width/2, player.y + player.height/2);
  ctx.scale(player.facing, 1);

  // DRAW NOOB HERO SPRITE (Sleek vector graphics)
  
  // Shadow on the ground/platform (only when near floor)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, player.height/2 - 2, player.width/2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (running bounce)
  ctx.fillStyle = '#1e293b'; // dark blue pants/legs
  let legOffset = 0;
  if (Math.abs(player.vx) > 0.5 && player.isGrounded) {
    legOffset = Math.sin(Date.now() * 0.018) * 6;
  }
  // Left Leg
  ctx.fillRect(-8, player.height/2 - 16, 5, 16 + legOffset);
  // Right Leg
  ctx.fillRect(3, player.height/2 - 16, 5, 16 - legOffset);

  // Torso / Body (Blue Ninja tunic)
  ctx.fillStyle = '#0077b6'; // Primary blue
  ctx.fillRect(-player.width/2 + 2, -player.height/2 + 18, player.width - 4, player.height - 30);
  
  // Belt (Gold)
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-player.width/2 + 1, player.height/2 - 20, player.width - 2, 4);

  // DRAW PLAYER HEAD (Character specific styles) [NEW]
  if (player.character === 'noob') {
    // NooB: Bald head (光頭)
    ctx.fillStyle = '#ffdfd3'; // Peach skin tone
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    // Shiny reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-3, -player.height/2 + 8, 3, 1.5, Math.PI/4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes (Expressive rectangles)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, -player.height/2 + 9, 3, 5); // left eye
    ctx.fillRect(7, -player.height/2 + 9, 3, 5); // right eye
  } else if (player.character === 'anton') {
    // Anton: Spiky yellow hair (尖刺頭)
    ctx.fillStyle = '#ffd166'; // Cool yellow spikes
    ctx.beginPath();
    ctx.moveTo(-10, -player.height/2 + 12);
    ctx.lineTo(-14, -player.height/2 - 2);
    ctx.lineTo(-5, -player.height/2 + 8);
    ctx.lineTo(-3, -player.height/2 - 6);
    ctx.lineTo(2, -player.height/2 + 8);
    ctx.lineTo(6, -player.height/2 - 6);
    ctx.lineTo(7, -player.height/2 + 8);
    ctx.lineTo(13, -player.height/2 - 2);
    ctx.lineTo(10, -player.height/2 + 12);
    ctx.closePath();
    ctx.fill();
    
    // Skin face
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, -player.height/2 + 9, 3, 5); // left eye
    ctx.fillRect(6, -player.height/2 + 9, 3, 5); // right eye
  } else if (player.character === 'laige') {
    // Lai-Ge: Bearded uncle (鬍子大叔)
    ctx.fillStyle = '#1e1b4b'; // Dark blue cap
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 10.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Skin face
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    
    // Beard (鬍子)
    ctx.fillStyle = '#451a03'; // Dark brown beard
    ctx.beginPath();
    ctx.fillRect(-6, -player.height/2 + 14, 12, 3); // mustache
    ctx.arc(0, -player.height/2 + 16, 7, 0, Math.PI); // jaw beard
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, -player.height/2 + 9, 3, 5); // left eye
    ctx.fillRect(6, -player.height/2 + 9, 3, 5); // right eye
  } else if (player.character === 'zhongtu') {
    // Zhongtu: Conical Bamboo Hat (斗笠)
    // Skin face
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, -player.height/2 + 9, 3, 5); // left eye
    ctx.fillRect(6, -player.height/2 + 9, 3, 5); // right eye
    
    // Conical Bamboo Hat (斗笠)
    ctx.fillStyle = '#e5c158'; // Straw yellow
    ctx.strokeStyle = '#8b5a2b'; // Straw brown border
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, -player.height/2 + 8); // left tip
    ctx.lineTo(0, -player.height/2 - 4);  // top peak
    ctx.lineTo(16, -player.height/2 + 8);  // right tip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (player.character === 'bge') {
    // B哥: Flat head (平頭) [NEW]
    // Skin face
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    
    // Flat top black hair (平頭)
    ctx.fillStyle = '#1e293b'; // black hair
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 9.5, Math.PI, 0); // top cap hair
    ctx.fill();
    ctx.fillRect(-8, -player.height/2 + 2.5, 16, 2.5); // flat cut top
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, -player.height/2 + 9, 3, 5); // left eye
    ctx.fillRect(6, -player.height/2 + 9, 3, 5); // right eye
  } else if (player.character === 'amber') {
    // Amber: Girl with red cap and long pinkish-brown hair [NEW]
    
    // Hair back (hanging down)
    ctx.fillStyle = '#b56576';
    ctx.fillRect(-11, -player.height/2 + 10, 22, 22);
    
    // Face skin
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair sides
    ctx.fillStyle = '#b56576';
    ctx.fillRect(-10, -player.height/2 + 10, 3, 14);
    ctx.fillRect(7, -player.height/2 + 10, 3, 14);
    
    // Red Cap (紅帽)
    ctx.fillStyle = '#e63946'; // red cap
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 6, 9.5, Math.PI, 0);
    ctx.fill();
    // Cap brim
    ctx.fillStyle = '#d62828';
    ctx.fillRect(-11, -player.height/2 + 5, 22, 3);
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, -player.height/2 + 9, 3, 5); // left eye
    ctx.fillRect(6, -player.height/2 + 9, 3, 5); // right eye
    
    // Blush
    ctx.fillStyle = 'rgba(255, 182, 193, 0.7)';
    ctx.fillRect(-1, -player.height/2 + 13, 2, 2);
    ctx.fillRect(5, -player.height/2 + 13, 2, 2);
  } else if (player.character === 'xiaobing') {
    // Xiaobing: Girl with ice-blue long hair and light blue cap [NEW]
    
    // Hair back (hanging down)
    ctx.fillStyle = '#90e0ef'; // ice-blue long hair
    ctx.fillRect(-11, -player.height/2 + 10, 22, 22);
    
    // Face skin
    ctx.fillStyle = '#ffdfd3';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 12, 9, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair sides
    ctx.fillStyle = '#90e0ef';
    ctx.fillRect(-10, -player.height/2 + 10, 3, 14);
    ctx.fillRect(7, -player.height/2 + 10, 3, 14);
    
    // Ice Crown / Band
    ctx.fillStyle = '#00b4d8';
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 6, 9.5, Math.PI, 0);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2, -player.height/2 + 9, 3, 5); // left eye
    ctx.fillRect(6, -player.height/2 + 9, 3, 5); // right eye
    
    // Blush (light ice tint)
    ctx.fillStyle = 'rgba(144, 224, 239, 0.7)';
    ctx.fillRect(-1, -player.height/2 + 13, 2, 2);
    ctx.fillRect(5, -player.height/2 + 13, 2, 2);
  }

  // Weapon
  ctx.save();
  ctx.translate(6, 6);
  
  // If attacking, rotate weapon
  if (player.isAttacking) {
    const swingProgress = player.attackTime / player.attackDuration;
    const angle = -Math.PI / 3 + swingProgress * (Math.PI * 1.1);
    ctx.rotate(angle);
  } else {
    // Idle weapon angle
    ctx.rotate(Math.PI / 4);
  }
  
  // Draw character-specific weapon in hand [NEW]
  if (player.character === 'noob') {
    // Heavy Steel Mace
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -17);
    ctx.stroke();
    // Mace head
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, -17, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (player.character === 'anton') {
    // Laser Gun (Pistol)
    ctx.fillStyle = '#475569'; // steel metal gun body
    ctx.fillRect(-2, -6, 12, 4); // barrel
    ctx.fillRect(-2, -2, 4, 8); // grip
    ctx.fillStyle = '#ff4d6d'; // laser nozzle accent
    ctx.fillRect(10, -6, 2, 4);
    
    // Muzzle flash when firing!
    if (player.isAttacking && player.attackTime < 4) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 77, 109, 0.95)';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(14, -4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (player.character === 'laige') {
    // Jade Sword (Green)
    ctx.strokeStyle = '#059669'; // Jade green
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -20);
    ctx.stroke();
    // Gold crossguard
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(3, 0);
    ctx.stroke();
  } else if (player.character === 'zhongtu') {
    // Heavy Earth Hammer (重土之錘)
    ctx.strokeStyle = '#78909c'; // Stone gray shaft
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();
    // Hammer block head
    ctx.fillStyle = '#455a64'; // Dark stone gray
    ctx.fillRect(-6, -22, 12, 6);
  } else if (player.character === 'bge') {
    // Toxic spray bottle / flask (毒氣罐) [NEW]
    ctx.strokeStyle = '#475569'; // steel handle/bottle
    ctx.fillStyle = '#06d6a0'; // glowing green toxic liquid
    ctx.lineWidth = 1;
    
    // Bottle body
    ctx.beginPath();
    ctx.rect(-5, -14, 10, 14);
    ctx.fill();
    ctx.stroke();
    
    // Nozzle / Spray tip
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-2, -18, 4, 4);
    
    // Green nozzle flash if attacking
    if (player.isAttacking && player.attackTime < 5) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 214, 160, 0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#06d6a0';
      ctx.beginPath();
      ctx.arc(0, -21, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (player.character === 'amber') {
    // Amber: Purple hook (紫色的鉤子) [NEW]
    ctx.strokeStyle = '#7209b7'; // Dark purple handle
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -12);
    ctx.stroke();
    
    // Hook curve
    ctx.strokeStyle = '#b5179e'; // Neon purple hook tip
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(3, -12, 4, Math.PI, Math.PI * 0.25, true);
    ctx.stroke();
  } else if (player.character === 'xiaobing') {
    // Xiaobing: Ice wand (冰之法杖) [NEW]
    ctx.strokeStyle = '#00b4d8'; // Cyan shaft
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -16);
    ctx.stroke();
    
    // Gem head
    ctx.fillStyle = '#caf0f8'; // White-blue ice gem
    ctx.beginPath();
    ctx.arc(0, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00b4d8';
    ctx.stroke();
  }
  
  ctx.restore();

  // Scarf / Headband (Glowing blue trail, swings back)
  ctx.fillStyle = '#00b4d8';
  ctx.beginPath();
  ctx.arc(0, -player.height/2 + 6, 10.5, Math.PI, 0); // blue cap bandana
  ctx.fill();
  
  // Headband tails (swaying physics effect based on vx & vy)
  ctx.save();
  ctx.translate(-8, -player.height/2 + 7);
  // Calculate swing based on player's velocity
  const swing = (player.vx * 0.05) - (player.vy * 0.02) + Math.sin(Date.now() * 0.008) * 0.15;
  ctx.rotate(swing);
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-14, 2, -18, 12);
  ctx.lineTo(-12, 11);
  ctx.quadraticCurveTo(-8, 3, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  
  ctx.restore(); // end player transforms

  // Draw Player Attack Slash Swing Arc (Sleek light sweep)
  if (player.isAttacking) {
    const swingProgress = player.attackTime / player.attackDuration;
    if (swingProgress > 0.15 && swingProgress < 0.85) {
      ctx.save();
      
      let arcColor = 'rgba(144, 224, 239, 0.55)';
      let arcGlow = '#00b4d8';
      let arcWidth = 5;
      
      if (player.character === 'noob') {
        arcColor = 'rgba(203, 213, 225, 0.65)'; // Steel silver
        arcGlow = '#94a3b8';
        arcWidth = 6.5;
      } else if (player.character === 'anton') {
        arcColor = 'rgba(255, 77, 109, 0.7)'; // Laser pink/magenta
        arcGlow = '#ff4d6d';
        arcWidth = 4.5;
      } else if (player.character === 'laige') {
        arcColor = 'rgba(74, 214, 109, 0.65)'; // Sword Qi green
        arcGlow = '#4ad66d';
        arcWidth = 5.5;
      } else if (player.character === 'amber') {
        arcColor = 'rgba(181, 23, 158, 0.7)'; // Neon purple
        arcGlow = '#b5179e';
        arcWidth = 6.0;
      }
      
      ctx.strokeStyle = arcColor;
      ctx.lineWidth = arcWidth;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 15;
      ctx.shadowColor = arcGlow;
      
      ctx.beginPath();
      // Draw dynamic slice sweep arc based on computed angle
      const arcCenterX = player.x + player.width/2;
      const arcCenterY = player.y + player.height/2;
      
      const startArcAngle = player.attackAngle - Math.PI / 3;
      const endArcAngle = player.attackAngle + Math.PI / 3;
      
      ctx.arc(arcCenterX, arcCenterY, player.attackRange - 12, startArcAngle, endArcAngle);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw Parry Shield Effect (gold shield bubble)
  if (player.isParrying) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd166';
    
    // Shield size pulse
    const shieldRadius = 24 + Math.sin(Date.now() * 0.035) * 3;
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Shield outer ring
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, shieldRadius + 6, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
    ctx.fill();
    ctx.restore();
  }

  // Draw Healing Progress Bar above player's head (8 seconds = 480 frames)
  if (player.isHealing) {
    ctx.save();
    const barW = 36;
    const barH = 5;
    const barX = player.x + player.width/2 - barW/2;
    const barY = player.y - 12;
    
    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    
    // Fill progress
    const progressFill = (player.healProgress / 480) * barW;
    ctx.fillStyle = '#4ad66d'; // Green heal bar
    ctx.fillRect(barX, barY, progressFill, barH);
    ctx.restore();
  }
}

// Perform Area of Effect (AoE) Attack [NEW]
function performPlayerAoe() {
  aoeTimer = 0;
  
  // Set shockwave visual properties
  aoeEffect.active = true;
  aoeEffect.x = player.x + player.width / 2;
  aoeEffect.y = player.y + player.height / 2;
  aoeEffect.radius = 10;
  
  shakeScreen(10); // Heavy camera shake
  
  // Visual explosion popup [NEW]
  let popupTxt = '⚡ 範圍衝擊波 💥';
  let color = '#ffd166';
  
  if (player.character === 'noob') {
    popupTxt = '⚙️ 鋼鐵重壓 💥';
    color = '#cbd5e1';
  } else if (player.character === 'anton') {
    popupTxt = '📡 雷射終結波 ⚡';
    color = '#ff4d6d';
  } else if (player.character === 'laige') {
    popupTxt = '⚔️ 萬劍齊發 🍃';
    color = '#4ad66d';
  } else if (player.character === 'zhongtu') {
    popupTxt = '🪨 裂地重擊 ⛰️';
    color = '#c2a67a';
  }
  
  createTextPopup(player.x + player.width/2, player.y - 30, popupTxt, color);
  
  // Shockwave sparks at player center
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;
    createParticle(
      aoeEffect.x, aoeEffect.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed - 1,
      color, 2 + Math.random() * 3, 20 + Math.random() * 15, 'spark'
    );
  }

  // Damage all pirates in range
  for (let pirate of pirates) {
    const pDx = (pirate.x + pirate.width/2) - aoeEffect.x;
    const pDy = (pirate.y + pirate.height/2) - aoeEffect.y;
    const dist = Math.sqrt(pDx * pDx + pDy * pDy);
    
    if (dist <= aoeEffect.maxRadius) {
      pirate.hp -= 20; // 20 AoE damage
      pirate.hitFlashFrames = 15;
      
      // Heavy knockback away from shockwave origin
      const knockDir = pDx >= 0 ? 1 : -1;
      pirate.vx = knockDir * 8.5;
      pirate.vy = -3.2;
      pirate.jumpCooldown = 60; // pause AI jumps
      
      createHitParticles(pirate.x + pirate.width/2, pirate.y + pirate.height/2, '#ffd166');
      createTextPopup(pirate.x + pirate.width/2, pirate.y - 15, '-20 AoE 💥', '#ffd166');
      
      // Pirate dies
      if (pirate.hp <= 0) {
        score++;
        killsCount.innerText = score;
        createDust(pirate.x + pirate.width/2, pirate.y + pirate.height, 'rgba(255,255,255,0.4)', 15);
        createTextPopup(pirate.x + pirate.width/2, pirate.y - 35, '擊殺! 💀', '#ff9f1c');
        
        if (pirate.isStageBoss) {
          triggerChapterClear();
        }
      }
    }
  }
  
  // Clean up dead pirates
  pirates = pirates.filter(p => p.hp > 0);
}

// Anton laser projectiles mechanics [NEW]
function updatePlayerProjectiles() {
  // Update delayed steel pipes countdown [NEW]
  for (let i = delayedPipes.length - 1; i >= 0; i--) {
    const pipe = delayedPipes[i];
    pipe.delayFrames--;
    if (pipe.delayFrames <= 0) {
      // Spawn falling steel pipe!
      playerProjectiles.push({
        x: pipe.targetX,
        y: pipe.targetY - 500, // start high above target
        targetY: pipe.targetY,
        vx: 0,
        vy: 18, // falls down fast
        radius: 12,
        color: '#94a3b8',
        damage: pipe.damage,
        life: 60, // short life since it just falls
        isPipe: true,
        hitPirates: [] // Keep track of already hit pirate references to avoid multi-hitting
      });
      delayedPipes.splice(i, 1);
    }
  }

  for (let proj of playerProjectiles) {
    if (proj.gravity) {
      proj.vy += proj.gravity;
    }
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;
    
    // Custom logic for falling steel pipe [NEW]
    if (proj.isPipe) {
      if (!proj.hitPirates) {
        proj.hitPirates = [];
      }
      
      // Check collision with pirates during descent (including those on platforms/clouds)
      for (let pirate of pirates) {
        if (proj.hitPirates.includes(pirate)) continue;
        
        const pDx = (pirate.x + pirate.width/2) - proj.x;
        const pDy = (pirate.y + pirate.height/2) - proj.y;
        const dist = Math.sqrt(pDx*pDx + pDy*pDy);
        
        // If it touches a pirate, deal damage but do NOT explode!
        if (dist < Math.max(pirate.width, pirate.height)/2 + proj.radius) {
          pirate.hp -= proj.damage;
          pirate.hitFlashFrames = 10;
          // Side knockback
          const knockDir = (pirate.x + pirate.width/2) >= proj.x ? 1 : -1;
          pirate.vx = knockDir * 3.5;
          pirate.vy = -1.5;
          pirate.jumpCooldown = 30;
          
          proj.hitPirates.push(pirate);
          
          createHitParticles(proj.x, proj.y, '#cbd5e1');
          createTextPopup(pirate.x + pirate.width/2, pirate.y - 15, `🔩 -${proj.damage}`, '#cbd5e1');
          
          if (pirate.hp <= 0) {
            score++;
            killsCount.innerText = score;
            createDust(pirate.x + pirate.width/2, pirate.y + pirate.height, 'rgba(255,255,255,0.4)', 15);
            createTextPopup(pirate.x + pirate.width/2, pirate.y - 35, '擊殺! 💀', '#ff9f1c');
            
            if (pirate.isStageBoss) {
              triggerChapterClear();
            } else {
              shakeScreen(3);
            }
          }
        }
      }
      
      // It only explodes when it reaches or exceeds targetY (the ground level)
      if (proj.y >= proj.targetY) {
        // Explode pipe on the floor! Deal AoE damage to pirates nearby on the floor (within 55px radius) that were not already hit
        for (let pirate of pirates) {
          if (proj.hitPirates.includes(pirate)) continue;
          
          const pDx = (pirate.x + pirate.width/2) - proj.x;
          const pDy = (pirate.y + pirate.height/2) - proj.targetY;
          const dist = Math.sqrt(pDx*pDx + pDy*pDy);
          
          if (dist <= 55) {
            pirate.hp -= proj.damage;
            pirate.hitFlashFrames = 10;
            const knockDir = (pirate.x + pirate.width/2) >= proj.x ? 1 : -1;
            pirate.vx = knockDir * 4.5;
            pirate.vy = -3.2;
            pirate.jumpCooldown = 45;
            
            createHitParticles(pirate.x + pirate.width/2, pirate.y + pirate.height/2, '#cbd5e1');
            createTextPopup(pirate.x + pirate.width/2, pirate.y - 15, `🔩 -${proj.damage}`, '#cbd5e1');
            
            if (pirate.hp <= 0) {
              score++;
              killsCount.innerText = score;
              createDust(pirate.x + pirate.width/2, pirate.y + pirate.height, 'rgba(255,255,255,0.4)', 15);
              createTextPopup(pirate.x + pirate.width/2, pirate.y - 35, '擊殺! 💀', '#ff9f1c');
              
              if (pirate.isStageBoss) {
                triggerChapterClear();
              } else {
                shakeScreen(3);
              }
            }
          }
        }
        
        // Explode pipe spark particles
        for (let i = 0; i < 18; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 6;
          createParticle(
            proj.x, proj.targetY,
            Math.cos(angle) * speed, Math.sin(angle) * speed - 1,
            '#94a3b8', 2.5 + Math.random() * 3, 20 + Math.random() * 20, 'spark'
          );
        }
        shakeScreen(4.5);
        proj.life = 0; // destroy projectile
      }
      continue; // Skip standard linear hit detection
    }
    
    // Check hit with pirates
    for (let pirate of pirates) {
      const pDx = (pirate.x + pirate.width/2) - proj.x;
      const pDy = (pirate.y + pirate.height/2) - proj.y;
      const dist = Math.sqrt(pDx*pDx + pDy*pDy);
      
      if (dist < Math.max(pirate.width, pirate.height)/2 + proj.radius) {
        // Hit pirate!
        pirate.hp -= proj.damage;
        pirate.hitFlashFrames = 10;
        
        // Apply freeze status if hit by an icicle [NEW]
        if (proj.isIcicle) {
          pirate.freezeDuration = 240; // 4 seconds (240 frames)
        }
        
        // Small knockback
        const hitAngle = Math.atan2(proj.vy, proj.vx);
        pirate.vx = Math.cos(hitAngle) * 3.5;
        pirate.vy = -1.2;
        pirate.jumpCooldown = 30;
        
        createHitParticles(proj.x, proj.y, proj.color);
        
        if (proj.isIcicle) {
          createTextPopup(pirate.x + pirate.width/2, pirate.y - 15, `❄️ -${proj.damage}`, '#90e0ef');
        } else {
          createTextPopup(pirate.x + pirate.width/2, pirate.y - 15, `⚡ -${proj.damage}`, proj.color);
        }
        
        proj.life = 0; // destroy projectile
        
        if (pirate.hp <= 0) {
          score++;
          killsCount.innerText = score;
          createDust(pirate.x + pirate.width/2, pirate.y + pirate.height, 'rgba(255,255,255,0.4)', 15);
          createTextPopup(pirate.x + pirate.width/2, pirate.y - 35, '擊殺! 💀', '#ff9f1c');
          
          if (pirate.isStageBoss) {
            triggerChapterClear();
          } else {
            shakeScreen(3);
          }
        }
        break;
      }
    }
  }
  
  // Filter active projectiles
  playerProjectiles = playerProjectiles.filter(p => p.life > 0);
  
  // Filter dead pirates [NEW]
  pirates = pirates.filter(p => p.hp > 0);
}

function updatePoisonMists() {
  for (let mist of poisonMists) {
    mist.x += mist.vx;
    mist.y += mist.vy;
    
    // Decelerate
    mist.vx *= 0.92;
    mist.vy *= 0.92;
    
    // Expand mist radius slightly
    if (mist.radius < mist.maxRadius) {
      mist.radius += 0.45;
    }
    
    // Decrement life
    mist.life--;
    
    // Damage detection: every 1 second in mist, deal 10 damage
    for (let pirate of pirates) {
      const pirCenterX = pirate.x + pirate.width / 2;
      const pirCenterY = pirate.y + pirate.height / 2;
      const dx = pirCenterX - mist.x;
      const dy = pirCenterY - mist.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // If pirate overlaps with the mist cloud
      if (dist < (pirate.width / 2 + mist.radius)) {
        // Apply or refresh poison status (lasts 4 seconds = 240 frames) [NEW]
        pirate.poisonDuration = 240;
        if (!pirate.lastPoisonTickTime) {
          pirate.lastPoisonTickTime = Date.now();
        }
        
        const now = Date.now();
        if (!pirate.lastPoisonTime || now - pirate.lastPoisonTime >= 1000) {
          pirate.lastPoisonTime = now;
          
          const damage = mist.damage;
          pirate.hp -= damage;
          
          // Visuals
          pirate.hitFlashFrames = 8;
          createHitParticles(pirCenterX, pirCenterY, '#06d6a0'); // toxic green particles
          createTextPopup(pirCenterX, pirate.y - 15, `-${damage}`, '#06d6a0');
          
          // Check pirate death
          if (pirate.hp <= 0) {
            score++;
            killsCount.innerText = score;
            createDust(pirCenterX, pirate.y + pirate.height, 'rgba(255,255,255,0.4)', 15);
            createTextPopup(pirCenterX, pirate.y - 35, '擊殺! 💀', '#ff9f1c');
            
            if (pirate.isStageBoss) {
              triggerChapterClear();
            } else {
              shakeScreen(5);
            }
          } else {
            shakeScreen(1.0);
          }
        }
      }
    }
  }
  
  // Filter active poison mists
  poisonMists = poisonMists.filter(m => m.life > 0);
  
  // Filter dead pirates
  pirates = pirates.filter(p => p.hp > 0);
}

function drawPoisonMists() {
  for (let mist of poisonMists) {
    ctx.save();
    
    // Set opacity based on life left
    const maxAlpha = 0.38;
    let alpha = maxAlpha;
    if (mist.life < 30) {
      alpha = (mist.life / 30) * maxAlpha;
    }
    
    // Draw the main mist area with multiple overlapping offset circles
    ctx.fillStyle = `rgba(6, 214, 160, ${alpha})`; // toxic green
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#06d6a0';
    
    const numPuffs = 5;
    for (let i = 0; i < numPuffs; i++) {
      const angle = (i / numPuffs) * Math.PI * 2 + (Date.now() * 0.002);
      const dist = (mist.radius * 0.25) * Math.sin(Date.now() * 0.001 + i);
      const puffX = mist.x + Math.cos(angle) * dist;
      const puffY = mist.y + Math.sin(angle) * dist;
      const puffRadius = mist.radius * (0.8 + 0.2 * Math.sin(Date.now() * 0.003 + i));
      
      ctx.beginPath();
      ctx.arc(puffX, puffY, puffRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw purple core puff for toxic look
    ctx.fillStyle = `rgba(138, 43, 226, ${alpha * 0.9})`; // purple core
    ctx.beginPath();
    ctx.arc(mist.x, mist.y, mist.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

function drawPlayerProjectiles() {
  for (let proj of playerProjectiles) {
    ctx.save();
    
    if (proj.isPipe) {
      // Draw falling steel pipe cylinder! [NEW]
      const grad = ctx.createLinearGradient(proj.x - 7, proj.y, proj.x + 7, proj.y);
      grad.addColorStop(0, '#475569');
      grad.addColorStop(0.5, '#e2e8f0');
      grad.addColorStop(1, '#475569');
      
      ctx.fillStyle = grad;
      ctx.fillRect(proj.x - 7, proj.y - 25, 14, 50);
      
      // Joint caps
      ctx.fillStyle = '#64748b';
      ctx.fillRect(proj.x - 9, proj.y - 28, 18, 4);
      ctx.fillRect(proj.x - 9, proj.y + 24, 18, 4);
    } else if (proj.isIcicle) {
      // Draw a sharp icicle cone shape pointing in movement direction! [NEW]
      ctx.fillStyle = '#caf0f8'; // bright ice core
      ctx.strokeStyle = '#00b4d8'; // ice blue border
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00b4d8';
      
      ctx.save();
      ctx.translate(proj.x, proj.y);
      const angle = Math.atan2(proj.vy, proj.vx);
      ctx.rotate(angle);
      
      ctx.beginPath();
      ctx.moveTo(10, 0); // front tip
      ctx.lineTo(-10, -4);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    } else {
      ctx.fillStyle = proj.color;
      ctx.shadowBlur = proj.isStone ? 4 : 10;
      ctx.shadowColor = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      
      if (proj.isStone) {
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        
        // Draw stone texture crack
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.moveTo(proj.x - 2, proj.y - 1);
        ctx.lineTo(proj.x + 2, proj.y + 1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// Enemy projectiles mechanics [NEW]
function updateEnemyProjectiles() {
  for (let proj of enemyProjectiles) {
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;
    
    // Check collision with player
    const pDx = (player.x + player.width/2) - proj.x;
    const pDy = (player.y + player.height/2) - proj.y;
    const dist = Math.sqrt(pDx*pDx + pDy*pDy);
    
    if (dist < player.width/2 + proj.radius) {
      if (player.isCrouching) {
        // Dodged! [NEW]
        if (Math.random() < 0.25) { // throttle dodge popups
          createTextPopup(player.x + player.width/2, player.y - 30, '閃避 ⚡', '#cbd5e1');
        }
        createHitParticles(proj.x, proj.y, 'rgba(255,255,255,0.4)');
        proj.life = 0; // destroy projectile
      } else {
        // Hit player!
        damagePlayer(proj.damage);
        createHitParticles(proj.x, proj.y, proj.color);
        proj.life = 0; // destroy projectile
      }
    }
  }
  
  // Filter active projectiles
  enemyProjectiles = enemyProjectiles.filter(p => p.life > 0);
}

function drawEnemyProjectiles() {
  for (let proj of enemyProjectiles) {
    ctx.save();
    ctx.fillStyle = proj.color;
    ctx.shadowBlur = proj.isSauce ? 3 : 8;
    ctx.shadowColor = proj.color;
    ctx.beginPath();
    if (proj.isSauce) {
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw small shine highlight to make it look wet/sauce-like
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(proj.x - 1.5, proj.y - 1.5, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Chapter Clear Trigger [NEW]
function triggerChapterClear() {
  if (chapterClearText) {
    chapterClearText.innerText = `你已成功通過第 ${chapter} 章`;
  }
  
  // Set up buff labels beforehand, regardless of dialogue or direct transition
  if (chapter === 2) {
    // Buff labels for Chapter 2 ending [NEW]
    buffAttackBtn.querySelector('span').innerText = '⚔️ 攻擊加成 (普通攻擊傷害 +5)';
    buffDefenseBtn.querySelector('span').innerText = '💖 血量加成 (血量上限 +25)';
    buffSpeedBtn.querySelector('span').innerText = '💥 範圍攻擊加成 (範圍攻擊傷害 +10)';
  } else if (chapter === 3) {
    // Buff labels for Chapter 3 ending [NEW]
    buffAttackBtn.querySelector('span').innerText = '🚀 二段跳 (解鎖空中的二次跳躍)';
    buffDefenseBtn.querySelector('span').innerText = '⚡ 能量加成 (能量上限 +50)';
    buffSpeedBtn.querySelector('span').innerText = '💖 補血加成 (一次補血量改為 30)';
  } else if (chapter === 4) {
    // Buff labels for Chapter 4 ending [NEW]
    buffAttackBtn.querySelector('span').innerText = '⚔️ 攻擊加成 (攻擊乘以 1.5 倍)';
    buffDefenseBtn.querySelector('span').innerText = '💖 防禦加成 (生命值加 20)';
    buffSpeedBtn.querySelector('span').innerText = '🦘 跳躍加成 (跳躍力提升)';
  } else {
    // Buff labels for other Chapters
    buffAttackBtn.querySelector('span').innerText = '⚔️ 攻擊加成 (攻擊傷害 x 1.25)';
    buffDefenseBtn.querySelector('span').innerText = '🛡️ 防禦加成 (受到傷害 - 25%)';
    buffSpeedBtn.querySelector('span').innerText = '⚡ 速度加成 (移動速度 + 25%)';
  }

  // Visual explosion
  shakeScreen(15);
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    createParticle(
      player.x + player.width/2, player.y + player.height/2,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      '#4ad66d', 3 + Math.random() * 4, 30 + Math.random() * 30, 'spark'
    );
  }

  if (chapter === 2) {
    // Show Dialogue Screen with the Red Hat Girl instead of buff screen! [NEW]
    gameState = 'dialogue_red_hat';
    dialogueScreen.classList.remove('hidden');
  } else {
    gameState = 'buff_selection';
    buffScreen.classList.remove('hidden');
  }
}

// Apply selected buff and start next chapter [NEW]
function applyBuff(type) {
  if (gameState !== 'buff_selection') return;
  
  if (chapter === 2) {
    // Buff applications for Chapter 2 [NEW]
    if (type === 'attack') {
      player.baseDamage += 5;
      createTextPopup(player.x + player.width/2, player.y - 40, '普通攻擊傷害 +5! ⚔️', '#ff9f1c');
    } else if (type === 'defense') {
      player.maxHp += 25;
      player.hp = player.maxHp; // Heal to full/max
      createTextPopup(player.x + player.width/2, player.y - 40, '血量上限 +25! 💖', '#ef476f');
    } else if (type === 'speed') {
      player.aoeBonusDamage = (player.aoeBonusDamage || 0) + 10;
      createTextPopup(player.x + player.width/2, player.y - 40, '範圍攻擊傷害 +10! 💥', '#4ad66d');
    }
  } else if (chapter === 3) {
    // Buff applications for Chapter 3 [NEW]
    if (type === 'attack') {
      player.doubleJumpUnlocked = true;
      createTextPopup(player.x + player.width/2, player.y - 40, '解鎖二段跳! 🚀', '#00b4d8');
    } else if (type === 'defense') {
      player.maxEnergy += 50;
      player.energy = player.maxEnergy; // refill
      createTextPopup(player.x + player.width/2, player.y - 40, '能量上限 +50! ⚡', '#ffd166');
    } else if (type === 'speed') {
      player.healAmount = 30;
      createTextPopup(player.x + player.width/2, player.y - 40, '一次補血量提高至 30! 💖', '#4ad66d');
    }
  } else if (chapter === 4) {
    // Buff applications for Chapter 4 [NEW]
    if (type === 'attack') {
      player.attackMultiplier *= 1.5;
      createTextPopup(player.x + player.width/2, player.y - 40, '攻擊傷害 x 1.5! ⚔️', '#ff9f1c');
    } else if (type === 'defense') {
      player.maxHp += 20;
      player.hp = Math.min(player.maxHp, player.hp + 20); // Add 20 HP
      createTextPopup(player.x + player.width/2, player.y - 40, '生命值加 20! 💖', '#ef476f');
    } else if (type === 'speed') {
      player.jumpForce -= 2.0; // Jump force goes from -13.5 to -15.5
      createTextPopup(player.x + player.width/2, player.y - 40, '跳躍力提升! 🦘', '#4ad66d');
    }
  } else {
    // Normal Chapter 1/5+ Buff applications
    if (type === 'attack') {
      player.attackMultiplier *= 1.25;
      createTextPopup(player.x + player.width/2, player.y - 40, '攻擊傷害 x 1.25! ⚔️', '#ff9f1c');
    } else if (type === 'defense') {
      player.damageReduction += 0.25;
      createTextPopup(player.x + player.width/2, player.y - 40, '防禦傷害 -25%! 🛡️', '#00b4d8');
    } else if (type === 'speed') {
      player.speedBuff += 0.25;
      createTextPopup(player.x + player.width/2, player.y - 40, '移動速度 +25%! ⚡', '#4ad66d');
    }
  }
  
  // Start next chapter
  chapter++;
  const chapterNumber = document.getElementById('chapterNumber');
  if (chapterNumber) {
    chapterNumber.innerText = chapter;
  }
  
  gameState = 'playing';
  buffScreen.classList.add('hidden');
  
  // Reset Stage Boss and spawning states
  stageBossSpawned = false;
  chapterStartScore = score;
  
  // Clean up entities
  pirates = [];
  particles = [];
  playerProjectiles = [];
  enemyProjectiles = []; // [NEW]
  poisonMists = []; // [NEW]
  textPopups = [];
  
  // Restore player health as chapter reward
  player.hp = player.maxHp;
  updateHpUI();
  
  lastSpawnTime = Date.now();
  
  // Spawn initial pirate of new chapter
  spawnPirate();
}

function drawBackground() {
  if (chapter >= 5) {
    // Restaurant Background [NEW]
    if (bg5Loaded) {
      ctx.drawImage(bgImage5, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      const dinerGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      dinerGrad.addColorStop(0, '#100c1e');
      dinerGrad.addColorStop(0.6, '#1a102f');
      dinerGrad.addColorStop(1, '#2f153a');
      ctx.fillStyle = dinerGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  } else if (chapter === 4) {
    // If Chapter 4, draw Dojo Background [NEW]
    if (bg4Loaded) {
      ctx.drawImage(bgImage4, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#100c14');
      skyGrad.addColorStop(0.6, '#29181d');
      skyGrad.addColorStop(1, '#4d2024');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw wooden columns
      ctx.fillStyle = '#1c0f0d';
      ctx.fillRect(40, 0, 20, GROUND_Y);
      ctx.fillRect(964, 0, 20, GROUND_Y);
    }
  } else if (chapter === 3) {
    // City Background
    if (bg3Loaded) {
      ctx.drawImage(bgImage3, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#0f051d');
      skyGrad.addColorStop(0.5, '#240046');
      skyGrad.addColorStop(1, '#3c096c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#10002b';
      ctx.fillRect(100, 150, 80, GROUND_Y - 150);
      ctx.fillRect(400, 100, 100, GROUND_Y - 100);
      ctx.fillRect(750, 200, 90, GROUND_Y - 200);
    }
  } else if (chapter === 2) {
    // Harbor Background
    if (bg2Loaded) {
      ctx.drawImage(bgImage2, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Harbor sea fallback gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#020205');
      skyGrad.addColorStop(0.5, '#0d1b2a');
      skyGrad.addColorStop(1, '#1b263b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw simple sea waves
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, GROUND_Y - 40, CANVAS_WIDTH, 40);
    }
  } else {
    // Chapter 1: Village Background
    if (bgLoaded) {
      ctx.drawImage(bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Beautiful stylized fallback gradient (if image fails to load)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#0a0915');
      skyGrad.addColorStop(0.6, '#18122B');
      skyGrad.addColorStop(1, '#393053');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw simple mountains silhouettes in back
      ctx.fillStyle = '#161224';
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(200, 220);
      ctx.lineTo(450, 480);
      ctx.lineTo(700, 260);
      ctx.lineTo(1024, 480);
      ctx.closePath();
      ctx.fill();

      // Draw little yellow window rects
      ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
      ctx.fillRect(150, 400, 16, 20);
      ctx.fillRect(800, 420, 16, 20);
    }
  }

  // Draw Ground (Blends with village path)
  ctx.fillStyle = '#161920'; // Dark ground path
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  
  // Ground neon border path (village barrier)
  ctx.strokeStyle = 'rgba(0, 180, 216, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
  ctx.stroke();
}

function drawPlatforms() {
  for (let plat of platforms) {
    ctx.save();
    
    // Cloud drop glow/shadow
    ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
    ctx.shadowBlur = 10;
    
    // Create soft cloud vertical gradient
    const grad = ctx.createLinearGradient(plat.x, plat.y - 12, plat.x, plat.y + plat.height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.65, '#f1f5f9');
    grad.addColorStop(1, '#cbd5e1'); // light sky gray bottom
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    const rBase = 16;
    // Left cloud bump cap
    ctx.arc(plat.x + rBase, plat.y + plat.height/2, rBase, Math.PI/2, Math.PI * 1.5);
    
    // Dynamic middle cloud bumps
    const numBumps = Math.floor(plat.width / 26);
    for (let i = 0; i < numBumps; i++) {
      const cx = plat.x + rBase + i * (plat.width - rBase*2) / (numBumps - 1);
      const cy = plat.y - 2 - (i % 2 === 0 ? 5 : 10);
      const r = 16 + (i % 2 === 0 ? 3 : 7);
      ctx.arc(cx, cy, r, Math.PI, 0);
    }
    
    // Right cloud bump cap
    ctx.arc(plat.x + plat.width - rBase, plat.y + plat.height/2, rBase, Math.PI * 1.5, Math.PI/2);
    ctx.closePath();
    ctx.fill();
    
    // Highlight top reflection curve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    ctx.restore();
  }
}

function drawParticles() {
  for (let p of particles) {
    ctx.save();
    
    if (p.type === 'spark') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 5;
      ctx.shadowColor = p.color;
      
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
      ctx.stroke();
    } 
    else if (p.type === 'blood') {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    } 
    else if (p.type === 'dust') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      // Dust grows in size as it fades
      const currentSize = p.size * (1.5 - p.life / p.maxLife);
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function updateParticles() {
  for (let p of particles) {
    p.life--;
    
    // Physics
    if (p.type === 'blood') {
      p.vy += GRAVITY * 0.7; // blood affected by gravity
    }
    
    p.x += p.vx;
    p.y += p.vy;
    
    // Friction for dust
    if (p.type === 'dust') {
      p.vx *= 0.95;
      p.vy *= 0.95;
    }
  }
  
  // Filter out dead particles
  particles = particles.filter(p => p.life > 0);
}

function drawTextPopups() {
  ctx.save();
  ctx.font = '800 14px "Outfit", Arial';
  ctx.textAlign = 'center';
  
  for (let tp of textPopups) {
    const alpha = tp.life / tp.maxLife;
    ctx.fillStyle = tp.color;
    ctx.globalAlpha = alpha;
    // outline text
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(tp.text, tp.x, tp.y);
    ctx.fillText(tp.text, tp.x, tp.y);
  }
  
  ctx.restore();
}

function updateTextPopups() {
  for (let tp of textPopups) {
    tp.life--;
    tp.y += tp.vy; // float upwards
  }
  textPopups = textPopups.filter(tp => tp.life > 0);
}

// Primary Game Loop (requestAnimationFrame)

function loop() {
  // Clear screen
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Screen shaking calculations
  ctx.save();
  if (shakeIntensity > 0.1) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
    shakeIntensity *= shakeDecay;
  }
  
  // Update Mechanics (if playing and not paused) [NEW]
  if (gameState === 'playing' && !isPaused) {
    // Timer checks
    gameTime = Date.now() - startTime;
    
    // Check Spawning with dynamic spawn interval [NEW]
    if (Date.now() - lastSpawnTime >= getSpawnInterval()) {
      spawnPirate();
      lastSpawnTime = Date.now();
    }
    
    // Entity calculations
    updatePlayer();
    
    for (let pirate of pirates) {
      pirate.update();
    }
    
    // Filter dead pirates immediately [NEW]
    pirates = pirates.filter(p => p.hp > 0);
    
    // Update player projectiles [NEW]
    updatePlayerProjectiles();
    
    // Update B哥 poison mists [NEW]
    updatePoisonMists();
    
    // Update enemy projectiles [NEW]
    updateEnemyProjectiles();
    
    // Update AoE expanding circle radius [NEW]
    if (aoeEffect.active) {
      aoeEffect.radius += aoeEffect.speed;
      if (aoeEffect.radius >= aoeEffect.maxRadius) {
        aoeEffect.active = false;
      }
    }
    
    updateParticles();
    updateTextPopups();
  }
  
  // RENDER GRAPHICS
  drawBackground();
  drawPlatforms();
  
  // Draw delayed pipe warning indicators [NEW]
  for (let pipe of delayedPipes) {
    ctx.save();
    
    // Vertical indicator dotted line
    ctx.strokeStyle = 'rgba(239, 71, 111, 0.45)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pipe.targetX, 0);
    ctx.lineTo(pipe.targetX, GROUND_Y);
    ctx.stroke();
    
    // Warn indicator circle on target location
    const pct = pipe.delayFrames / 60; // 0 to 1
    ctx.strokeStyle = '#ef476f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pipe.targetX, pipe.targetY, 12 + pct * 24, 0, Math.PI * 2);
    ctx.stroke();
    
    // Blinking crosshair hairs
    ctx.strokeStyle = '#ef476f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pipe.targetX - 8, pipe.targetY);
    ctx.lineTo(pipe.targetX + 8, pipe.targetY);
    ctx.moveTo(pipe.targetX, pipe.targetY - 8);
    ctx.lineTo(pipe.targetX, pipe.targetY + 8);
    ctx.stroke();
    
    // Text popup above crosshair
    ctx.fillStyle = '#ef476f';
    ctx.font = 'bold 11px Outfit, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠️ PIPE INBOUND (${Math.max(0, Math.ceil(pipe.delayFrames/6)/10).toFixed(1)}s)`, pipe.targetX, pipe.targetY - 20);
    
    ctx.restore();
  }
  
  drawParticles();
  
  // Draw AoE shockwave overlay based on character [NEW]
  if (aoeEffect.active) {
    ctx.save();
    
    let colorHex = '#ffd166';
    let rgb = '255, 183, 3';
    
    if (player.character === 'noob') {
      colorHex = '#94a3b8';
      rgb = '203, 213, 225';
    } else if (player.character === 'anton') {
      colorHex = '#ff4d6d';
      rgb = '255, 77, 109';
    } else if (player.character === 'laige') {
      colorHex = '#4ad66d';
      rgb = '74, 214, 109';
    } else if (player.character === 'zhongtu') {
      colorHex = '#c2a67a';
      rgb = '194, 166, 122';
    }
    
    ctx.strokeStyle = `rgba(${rgb}, ${1 - aoeEffect.radius / aoeEffect.maxRadius})`;
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = colorHex;
    ctx.beginPath();
    ctx.arc(aoeEffect.x, aoeEffect.y, aoeEffect.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = `rgba(${rgb}, ${0.12 * (1 - aoeEffect.radius / aoeEffect.maxRadius)})`;
    ctx.fill();
    ctx.restore();
  }
  
  // Draw enemies
  for (let pirate of pirates) {
    pirate.draw();
  }
  
  // Draw player projectiles [NEW]
  drawPlayerProjectiles();
  
  // Draw B哥 poison mists [NEW]
  drawPoisonMists();
  
  // Draw enemy projectiles [NEW]
  drawEnemyProjectiles();
  
  // Draw player
  if (gameState !== 'gameover' || player.hp > 0) {
    drawPlayer();
  }
  
  drawTextPopups();
  
  ctx.restore(); // restore screen shake transforms
  
  requestAnimationFrame(loop);
}

// Start Game Loop
requestAnimationFrame(loop);
