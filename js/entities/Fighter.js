// Base Fighter Class - High Performance 2D Fighting Game Entity
class Fighter {
  constructor(name, x, y, dir, color = '#ffd700') {
    this.name = name;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dir = dir; // 1: facing right, -1: facing left
    this.width = 90;
    this.height = 230;
    this.themeColor = color;

    // Combat Stats
    this.maxHp = 1000;
    this.hp = 1000;
    this.redHp = 1000; // delayed health bar damage
    this.meter = 0; // 0 to 100%
    this.roundsWon = 0;

    // Movement speeds
    this.walkSpeed = 300;
    this.dashSpeed = 650;
    this.jumpForce = 850;

    // State machine
    this.state = 'IDLE'; // IDLE, WALK, CROUCH, JUMP, ATTACK, BLOCK, HITSTUN, KNOCKDOWN, GETUP, VICTORY, DEFEAT
    this.stateTimer = 0;
    this.isGrounded = true;
    this.isCrouching = false;
    this.isBlocking = false;
    this.hitStun = 0;
    this.invulnerableTimer = 0;

    // Combat Hitboxes
    this.activeHitbox = null;
    this.currentAttackData = null;
    this.hasHitCurrentAttack = false;
    this.comboCount = 0;
    this.comboTimer = 0;

    // Animation visual parameters
    this.animTime = 0;
    this.sprite = null;
    this.spriteLoaded = false;
    this.avatar = null;

    // Super glow effect
    this.superActive = false;
    this.superTimer = 0;
  }

  loadSprite(spritePath, avatarPath) {
    this.sprite = new Image();
    this.sprite.src = spritePath;
    this.sprite.onload = () => { this.spriteLoaded = true; };

    this.avatar = new Image();
    this.avatar.src = avatarPath;
  }

  getHurtbox() {
    const crouchH = this.isCrouching ? 150 : this.height;
    const yOff = this.isCrouching ? 80 : 0;
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height + yOff,
      width: this.width,
      height: crouchH
    };
  }

  buildMeter(amount) {
    this.meter = Math.min(100, this.meter + amount);
  }

  takeDamage(amount, isBlocked = false) {
    if (this.invulnerableTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0 && this.state !== 'DEFEAT') {
      this.triggerDefeat();
    }
  }

  triggerDefeat() {
    this.state = 'DEFEAT';
    this.stateTimer = 0;
    this.vx = -this.dir * 220;
    this.vy = -350;
    this.isGrounded = false;
    window.soundManager.playKO();
  }

  update(dt, input, opponent) {
    this.animTime += dt;
    this.stateTimer += dt;

    // Red HP decay animation
    if (this.redHp > this.hp) {
      this.redHp -= (this.redHp - this.hp) * 4 * dt + 15 * dt;
      if (this.redHp < this.hp) this.redHp = this.hp;
    }

    // Invulnerability decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Combo timer decay
    if (this.comboCount > 0) {
      this.comboTimer += dt;
      if (this.comboTimer > 1.2) {
        this.comboCount = 0;
        this.comboTimer = 0;
      }
    }

    // Face opponent when idle or walking
    if (opponent && (this.state === 'IDLE' || this.state === 'WALK' || this.state === 'CROUCH')) {
      this.dir = opponent.x > this.x ? 1 : -1;
    }

    // Handle HitStun state
    if (this.hitStun > 0) {
      this.hitStun--;
      this.state = 'HITSTUN';
      this.activeHitbox = null;
      this.applyPhysics(dt);
      return;
    } else if (this.state === 'HITSTUN') {
      this.state = 'IDLE';
    }

    if (this.state === 'DEFEAT' || this.state === 'VICTORY') {
      this.applyPhysics(dt);
      return;
    }

    // Attack state machine
    if (this.state === 'ATTACK' || this.state === 'SPECIAL' || this.state === 'SUPER') {
      this.updateAttack(dt);
      this.applyPhysics(dt);
      return;
    }

    // Reset hitbox if not attacking
    this.activeHitbox = null;

    // Ground movement & inputs
    if (this.isGrounded) {
      this.vx = 0;

      // Check Block
      if (input.block) {
        this.state = 'BLOCK';
        this.isBlocking = true;
        this.applyPhysics(dt);
        return;
      } else {
        this.isBlocking = false;
      }

      // Check Attacks
      if (input.justPressed.super && this.meter >= 100) {
        this.startSuper(opponent);
        return;
      }
      if (input.justPressed.special) {
        this.startSpecial(input.down ? 2 : 1, opponent);
        return;
      }
      if (input.justPressed.blade) {
        this.startAttack('blade');
        return;
      }
      if (input.justPressed.punch) {
        this.startAttack('punch');
        return;
      }
      if (input.justPressed.kick) {
        this.startAttack('kick');
        return;
      }

      // Jump
      if (input.up) {
        this.vy = -this.jumpForce;
        this.isGrounded = false;
        this.state = 'JUMP';
        window.particleManager.createDust(this.x, this.y, 8);
        return;
      }

      // Crouch
      if (input.down) {
        this.state = 'CROUCH';
        this.isCrouching = true;
        this.applyPhysics(dt);
        return;
      } else {
        this.isCrouching = false;
      }

      // Walk Left/Right
      if (input.left) {
        this.vx = -this.walkSpeed;
        this.state = 'WALK';
      } else if (input.right) {
        this.vx = this.walkSpeed;
        this.state = 'WALK';
      } else {
        this.state = 'IDLE';
      }
    } else {
      // In-Air
      if (input.justPressed.blade || input.justPressed.punch || input.justPressed.kick) {
        this.startAirAttack();
      }
    }

    this.applyPhysics(dt);
  }

  applyPhysics(dt) {
    const physics = window.physicsEngine;

    // Apply gravity
    if (!this.isGrounded) {
      this.vy += physics.gravity * dt;
    }

    // Update positions
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Apply ground limit
    if (this.y >= physics.groundY) {
      this.y = physics.groundY;
      this.vy = 0;
      if (!this.isGrounded) {
        this.isGrounded = true;
        window.particleManager.createDust(this.x, this.y, 6);
        if (this.state === 'JUMP') {
          this.state = 'IDLE';
        }
      }
    }

    // Apply horizontal stage bounds
    this.x = Math.max(physics.stageMinX, Math.min(physics.stageMaxX, this.x));
  }

  startAttack(type) {
    this.state = 'ATTACK';
    this.stateTimer = 0;
    this.hasHitCurrentAttack = false;

    if (type === 'punch') {
      this.currentAttackData = {
        damage: 45,
        hitStun: 18,
        knockbackX: 200,
        meterGain: 6,
        isHeavy: false,
        duration: 0.28,
        hitboxStart: 0.08,
        hitboxEnd: 0.18,
        hitboxOffset: { x: 55, y: -165, w: 60, h: 45 }
      };
      this.vx = this.dir * 100;
    } else if (type === 'blade') {
      this.currentAttackData = {
        damage: 85,
        hitStun: 24,
        knockbackX: 320,
        meterGain: 10,
        isBlade: true,
        isHeavy: true,
        duration: 0.42,
        hitboxStart: 0.12,
        hitboxEnd: 0.28,
        hitboxOffset: { x: 75, y: -170, w: 90, h: 60 }
      };
      this.vx = this.dir * 180;
    } else if (type === 'kick') {
      this.currentAttackData = {
        damage: 65,
        hitStun: 22,
        knockbackX: 280,
        meterGain: 8,
        isHeavy: false,
        duration: 0.35,
        hitboxStart: 0.1,
        hitboxEnd: 0.24,
        hitboxOffset: { x: 70, y: -100, w: 75, h: 50 }
      };
      this.vx = this.dir * 140;
    }
  }

  startAirAttack() {
    this.state = 'ATTACK';
    this.stateTimer = 0;
    this.hasHitCurrentAttack = false;
    this.currentAttackData = {
      damage: 75,
      hitStun: 22,
      knockbackX: 240,
      launchY: 100,
      meterGain: 8,
      duration: 0.35,
      hitboxStart: 0.05,
      hitboxEnd: 0.25,
      hitboxOffset: { x: 60, y: -120, w: 70, h: 70 }
    };
  }

  updateAttack(dt) {
    const atk = this.currentAttackData;
    if (!atk) {
      this.state = 'IDLE';
      return;
    }

    // Spawn / expire attack hitbox during active window
    if (this.stateTimer >= atk.hitboxStart && this.stateTimer <= atk.hitboxEnd) {
      const box = atk.hitboxOffset;
      this.activeHitbox = {
        x: this.dir === 1 ? this.x + box.x - box.w / 2 : this.x - box.x - box.w / 2,
        y: this.y + box.y,
        width: box.w,
        height: box.h
      };
    } else {
      this.activeHitbox = null;
    }

    // End attack
    if (this.stateTimer >= atk.duration) {
      this.state = this.isGrounded ? 'IDLE' : 'JUMP';
      this.activeHitbox = null;
      this.currentAttackData = null;
    }
  }

  // To be customized by Shafin & Nafis subclasses
  startSpecial(skillNum, opponent) {}
  startSuper(opponent) {}

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Floor contact shadow
    ctx.save();
    ctx.scale(1, 0.25);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Facing direction flip
    if (this.dir === -1) {
      ctx.scale(-1, 1);
    }

    // Idle breathing & movement bobbing
    let bobY = 0;
    let tiltAngle = 0;
    if (this.state === 'IDLE') {
      bobY = Math.sin(this.animTime * 5) * 4;
    } else if (this.state === 'WALK') {
      bobY = Math.abs(Math.sin(this.animTime * 10)) * 8;
      tiltAngle = 0.06;
    } else if (this.state === 'CROUCH') {
      bobY = 40;
    } else if (this.state === 'ATTACK') {
      tiltAngle = 0.12;
      bobY = 5;
    } else if (this.state === 'HITSTUN') {
      tiltAngle = -0.15;
      bobY = -5;
    } else if (this.state === 'DEFEAT') {
      tiltAngle = -0.65;
      bobY = 70;
    }

    ctx.rotate(tiltAngle);

    // Draw Character Sprite with Sharp Facial Clarity
    if (this.spriteLoaded && this.sprite) {
      const renderW = 200;
      const renderH = 260;
      const drawX = -renderW / 2;
      const drawY = -renderH + bobY;

      // Glow effect during Super or Attacks
      if (this.superActive) {
        ctx.shadowColor = this.themeColor;
        ctx.shadowBlur = 25;
      }

      ctx.drawImage(this.sprite, drawX, drawY, renderW, renderH);

      // Hitstun white flash
      if (this.state === 'HITSTUN') {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(drawX, drawY, renderW, renderH);
        ctx.restore();
      }
    } else {
      // Clean fallback vector body
      ctx.fillStyle = this.themeColor;
      ctx.fillRect(-25, -200 + bobY, 50, 180);
    }

    // Render custom fighter visual effects (e.g. blade glow for Shafin, fire for Nafis)
    this.renderCustomEffects(ctx, bobY);

    ctx.restore();
  }

  renderCustomEffects(ctx, bobY) {}
}

window.Fighter = Fighter;