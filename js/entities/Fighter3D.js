// Fighter3D.js — Complete Combat Physics, States & Procedural Animations
class Fighter3D {
  constructor(name, scene, startX, dir, color, facePath) {
    this.name       = name;
    this.scene      = scene;
    this.dir        = dir;
    this.themeColor = color !== undefined ? color : 0xffd700;
    this.facePath   = facePath;

    this.root = new THREE.Group();
    this.root.position.set(startX, 0, 0);
    this.scene.add(this.root);

    // ── HP & Meter ──────────────────────────────────────────────
    this.maxHp = 1000;
    this.hp    = 1000;
    this.redHp = 1000;
    this.meter = 0;

    // ── Physics ─────────────────────────────────────────────────
    this.vx           = 0;
    this.vy           = 0;
    this.targetVx     = 0;
    this.walkSpeed    = 4.5;
    this.friction     = 16.0;
    this.accel        = 32.0;
    this.jumpForce    = 11.0;
    this.gravity      = 26.0;
    this.isGrounded   = true;

    // ── Combat State ─────────────────────────────────────────────
    // States: IDLE, WALK, CROUCH, JUMP, ATTACK, BLOCK,
    //         HITSTUN, KNOCKDOWN, GETUP, SPECIAL, SUPER, VICTORY, DEFEAT
    this.state              = 'IDLE';
    this.stateTimer         = 0;
    this.animTime           = 0;
    this.isCrouching        = false;
    this.isBlocking         = false;
    this.hitStun            = 0;          // frames
    this.invulTimer         = 0;          // seconds
    this.currentAttackData  = null;
    this.hasHitCurrentAttack = false;
    this.comboCount         = 0;
    this.comboTimer         = 0;
    this.knockdownTimer     = 0;
    this.getupTimer         = 0;
    this.hitFlashTimer      = 0;

    this.buildMesh();
  }

  // ═══════════════════════════════════════════════════════════════
  //  MESH CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════
  buildMesh() {
    const loader = new THREE.TextureLoader();
    this.faceTexture = loader.load(this.facePath || '');

    this.skinMat   = new THREE.MeshStandardMaterial({ color: 0xdfa070, roughness: 0.6 });
    this.faceMat   = new THREE.MeshStandardMaterial({ map: this.faceTexture, roughness: 0.5 });
    this.suitMat   = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.45, metalness: 0.4 });
    this.accentMat = new THREE.MeshStandardMaterial({
      color: this.themeColor, roughness: 0.3, metalness: 0.85,
      emissive: this.themeColor, emissiveIntensity: 0.3
    });
    this.bootMat   = new THREE.MeshStandardMaterial({ color: 0x080809, roughness: 0.7 });

    // Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.35;
    this.root.add(this.pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.32, 0.42), this.suitMat);
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.09, 0.44), this.accentMat);
    this.pelvis.add(belt);

    // Torso
    this.torso = new THREE.Group();
    this.torso.position.y = 0.22;
    this.pelvis.add(this.torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.72, 0.46), this.suitMat);
    chest.position.y = 0.36;
    chest.castShadow = true;
    this.torso.add(chest);

    const emblem = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), this.accentMat);
    emblem.position.set(0, 0.42, 0.24);
    this.torso.add(emblem);

    // Neck + Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.82;
    this.torso.add(this.neck);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.18, 8), this.skinMat);
    neckMesh.position.y = 0.09;
    this.neck.add(neckMesh);

    // Head — face texture on front (+Z) face only
    const headMats = [
      this.suitMat, this.suitMat,  // left, right sides
      this.skinMat, this.suitMat,  // top, bottom
      this.faceMat,                // FRONT — player face!
      this.suitMat                 // back
    ];
    this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.56, 0.50), headMats);
    this.headMesh.position.y = 0.30;
    this.headMesh.castShadow = true;
    this.neck.add(this.headMesh);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.54), this.suitMat);
    hair.position.y = 0.60;
    this.neck.add(hair);

    // Arms
    this.leftArm  = this.buildArm(true);
    this.rightArm = this.buildArm(false);
    this.torso.add(this.leftArm);
    this.torso.add(this.rightArm);

    // Legs
    this.leftLeg  = this.buildLeg(true);
    this.rightLeg = this.buildLeg(false);
    this.pelvis.add(this.leftLeg);
    this.pelvis.add(this.rightLeg);

    this.root.scale.set(1.2, 1.2, 1.2);
  }

  buildArm(isLeft) {
    const arm  = new THREE.Group();
    const side = isLeft ? 1 : -1;
    arm.position.set(side * 0.50, 0.62, 0);

    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), this.accentMat);
    arm.add(shoulder);

    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.09, 0.42, 8), this.suitMat);
    bicep.position.y = -0.23;
    bicep.castShadow = true;
    arm.add(bicep);

    const forearm = new THREE.Group();
    forearm.position.y = -0.44;
    arm.add(forearm);

    const gauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.095, 0.40, 8), this.accentMat);
    gauntlet.position.y = -0.20;
    gauntlet.castShadow = true;
    forearm.add(gauntlet);

    arm.forearm = forearm;
    return arm;
  }

  buildLeg(isLeft) {
    const leg  = new THREE.Group();
    const side = isLeft ? 1 : -1;
    leg.position.set(side * 0.21, -0.16, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.115, 0.52, 8), this.suitMat);
    thigh.position.y = -0.26;
    thigh.castShadow = true;
    leg.add(thigh);

    const shin = new THREE.Group();
    shin.position.y = -0.52;
    leg.add(shin);

    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.52, 8), this.bootMat);
    calf.position.y = -0.26;
    calf.castShadow = true;
    shin.add(calf);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.17, 0.44), this.bootMat);
    foot.position.set(0, -0.54, 0.11);
    foot.castShadow = true;
    shin.add(foot);

    leg.shin = shin;
    return leg;
  }

  // ═══════════════════════════════════════════════════════════════
  //  COMBAT API
  // ═══════════════════════════════════════════════════════════════
  takeDamage(amount, isBlocked) {
    if (this.invulTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = 0.12;
    if (this.hp <= 0 && this.state !== 'DEFEAT') {
      this._triggerKO();
    }
  }

  _triggerKO() {
    this.state     = 'DEFEAT';
    this.stateTimer = 0;
    this.vy        = 8.0;
    this.vx        = -this.dir * 5.0;
    this.isGrounded = false;
    this.currentAttackData = null;
    if (window.soundManager) window.soundManager.playKO();
    if (navigator.vibrate) navigator.vibrate([40, 20, 100, 20, 40]);
  }

  triggerKnockdown(pushVx) {
    if (this.state === 'DEFEAT') return;
    this.state      = 'KNOCKDOWN';
    this.stateTimer = 0;
    this.knockdownTimer = 0;
    this.vy         = 6.0;
    this.vx         = pushVx;
    this.isGrounded = false;
    this.currentAttackData = null;
    this.hitStun    = 0;
    if (navigator.vibrate) navigator.vibrate(30);
  }

  buildMeter(amt) { this.meter = Math.min(100, this.meter + amt); }

  // ═══════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════
  update(dt, input, opponent) {
    this.animTime   += dt;
    this.stateTimer += dt;
    if (this.invulTimer > 0) this.invulTimer -= dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Smooth delayed HP drain (red bar)
    if (this.redHp > this.hp) {
      this.redHp -= (this.redHp - this.hp) * 5 * dt + 18 * dt;
      if (this.redHp < this.hp) this.redHp = this.hp;
    }

    // Combo window timeout
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    // Auto face opponent during neutral states
    if (opponent && (this.state === 'IDLE' || this.state === 'WALK' ||
        this.state === 'CROUCH' || this.state === 'BLOCK')) {
      this.dir = opponent.root.position.x > this.root.position.x ? 1 : -1;
    }
    this.root.rotation.y = this.dir === 1 ? Math.PI / 2 : -Math.PI / 2;

    // Hit flash visual
    const flash = this.hitFlashTimer > 0;
    this.suitMat.emissive   = flash ? new THREE.Color(1, 0.2, 0.2) : new THREE.Color(0, 0, 0);
    this.suitMat.emissiveIntensity = flash ? 1.2 : 0;

    // ── State machine ───────────────────────────────────────────
    if (this.state === 'DEFEAT' || this.state === 'VICTORY') {
      this._physics(dt); this._animate(dt); return;
    }

    if (this.state === 'KNOCKDOWN') {
      this.knockdownTimer += dt;
      this._physics(dt); this._animate(dt);
      if (this.isGrounded && this.knockdownTimer > 0.85) {
        this.state = 'GETUP'; this.stateTimer = 0; this.getupTimer = 0;
        this.invulTimer = 0.65;
      }
      return;
    }

    if (this.state === 'GETUP') {
      this.getupTimer += dt;
      this._physics(dt); this._animate(dt);
      if (this.getupTimer > 0.55) { this.state = 'IDLE'; this.root.rotation.x = 0; }
      return;
    }

    if (this.hitStun > 0) {
      this.hitStun--;
      this.state = 'HITSTUN';
      this._physics(dt); this._animate(dt); return;
    } else if (this.state === 'HITSTUN') {
      this.state = 'IDLE';
    }

    if (this.state === 'ATTACK' || this.state === 'SPECIAL' || this.state === 'SUPER') {
      this._updateAttackTimer(dt);
      this._physics(dt); this._animate(dt); return;
    }

    // ── Grounded Controls ───────────────────────────────────────
    if (this.isGrounded) {
      // Block
      if (input.block) {
        this.state = 'BLOCK'; this.isBlocking = true; this.targetVx = 0;
        this._physics(dt); this._animate(dt); return;
      } else {
        this.isBlocking = false;
      }

      // Attacks (priority order)
      if (input.justPressed && input.justPressed.super && this.meter >= 100) {
        this.startSuper(opponent); return;
      }
      if (input.justPressed && input.justPressed.special) {
        this.startSpecial(input.down ? 2 : 1, opponent); return;
      }
      if (input.justPressed && input.justPressed.blade) {
        this.startAttack('blade'); return;
      }
      if (input.justPressed && input.justPressed.punch) {
        this.startAttack('punch'); return;
      }
      if (input.justPressed && input.justPressed.kick) {
        this.startAttack('kick'); return;
      }

      // Jump
      if (input.up) {
        this.vy = this.jumpForce; this.isGrounded = false; this.state = 'JUMP';
        this.vx = input.left ? -this.walkSpeed : input.right ? this.walkSpeed : 0;
        if (window.particleManager)
          window.particleManager.createDust(this.root.position.x * 60 + 640, 560, 8);
        return;
      }

      // Crouch
      if (input.down) {
        this.state = 'CROUCH'; this.isCrouching = true; this.targetVx = 0;
        this._physics(dt); this._animate(dt); return;
      } else { this.isCrouching = false; }

      // Walk
      if (input.left)       { this.targetVx = -this.walkSpeed; this.state = 'WALK'; }
      else if (input.right) { this.targetVx =  this.walkSpeed; this.state = 'WALK'; }
      else                  { this.targetVx = 0; this.state = 'IDLE'; }

    } else {
      // Air attack
      if (input.justPressed && (input.justPressed.punch || input.justPressed.blade || input.justPressed.kick)) {
        this.startAttack('punch');
      }
    }

    this._physics(dt); this._animate(dt);
  }

  // ═══════════════════════════════════════════════════════════════
  //  PHYSICS
  // ═══════════════════════════════════════════════════════════════
  _physics(dt) {
    const canAccel = this.isGrounded &&
      this.state !== 'HITSTUN' && this.state !== 'KNOCKDOWN' && this.state !== 'BLOCK';

    if (canAccel) {
      if (this.targetVx !== 0) {
        this.vx += (this.targetVx - this.vx) * this.accel * dt;
      } else {
        this.vx += (0 - this.vx) * this.friction * dt;
        if (Math.abs(this.vx) < 0.04) this.vx = 0;
      }
    }

    if (!this.isGrounded) this.vy -= this.gravity * dt;

    this.root.position.x += this.vx * dt;
    this.root.position.y += this.vy * dt;

    if (this.root.position.y <= 0) {
      this.root.position.y = 0; this.vy = 0;
      if (!this.isGrounded) {
        this.isGrounded = true;
        if (this.state === 'JUMP') this.state = 'IDLE';
        if (window.particleManager)
          window.particleManager.createDust(this.root.position.x * 60 + 640, 556, 4);
      }
    }
    this.root.position.x = Math.max(-8.5, Math.min(8.5, this.root.position.x));
  }

  // ═══════════════════════════════════════════════════════════════
  //  ATTACK MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  startAttack(type) {
    this.state = 'ATTACK'; this.stateTimer = 0; this.hasHitCurrentAttack = false;
    switch (type) {
      case 'punch':
        this.currentAttackData = { type:'punch', damage:55, hitStun:18, reach:2.15,
          hitboxStart:0.07, hitboxEnd:0.18, duration:0.28, isHeavy:false, knockback:1.8 };
        this.vx = this.dir * 1.6;
        break;
      case 'blade':
        this.currentAttackData = { type:'blade', damage:105, hitStun:28, reach:2.75,
          hitboxStart:0.13, hitboxEnd:0.30, duration:0.44, isBlade:true,
          isHeavy:true, knockback:3.8, causesKnockdown:true };
        this.vx = this.dir * 2.8;
        break;
      case 'kick':
        this.currentAttackData = { type:'kick', damage:78, hitStun:23, reach:2.45,
          hitboxStart:0.10, hitboxEnd:0.24, duration:0.36, isHeavy:false, knockback:2.4 };
        this.vx = this.dir * 2.2;
        break;
    }
  }

  _updateAttackTimer(dt) {
    const atk = this.currentAttackData;
    if (!atk) { this.state = 'IDLE'; return; }
    if (this.stateTimer >= atk.duration) {
      this.state = this.isGrounded ? 'IDLE' : 'JUMP';
      this.currentAttackData = null;
    }
  }

  startSpecial(skillNum, opponent) {}
  startSuper(opponent) {}

  // ═══════════════════════════════════════════════════════════════
  //  PROCEDURAL SKELETAL ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  _animate(dt) {
    const t = this.animTime;
    const state = this.state;
    const p = this.stateTimer;

    // Reset skeleton roll
    if (state !== 'KNOCKDOWN' && state !== 'GETUP' && state !== 'DEFEAT') {
      this.root.rotation.x = 0;
    }

    if (state === 'IDLE') {
      this.pelvis.position.y     = 1.35 + Math.sin(t * 4.2) * 0.05;
      this.torso.rotation.x      = Math.sin(t * 4.2) * 0.04;
      this.torso.rotation.y      = 0.15;
      this.rightArm.rotation.x   = -0.95 + Math.sin(t * 4.2) * 0.05;
      this.rightArm.rotation.z   = -0.22;
      this.rightArm.forearm.rotation.x = -1.1;
      this.leftArm.rotation.x    = -0.60 + Math.sin(t * 4.2) * 0.05;
      this.leftArm.rotation.z    = 0.30;
      this.leftArm.forearm.rotation.x = -0.90;
      this.leftLeg.rotation.x    = -0.15;
      this.rightLeg.rotation.x   = 0.15;
      this.leftLeg.shin.rotation.x  = 0.15;
      this.rightLeg.shin.rotation.x = 0.10;

    } else if (state === 'WALK') {
      const w = t * 10;
      this.pelvis.position.y     = 1.35 + Math.abs(Math.sin(w)) * 0.09;
      this.leftLeg.rotation.x    = Math.sin(w) * 0.65;
      this.rightLeg.rotation.x   = -Math.sin(w) * 0.65;
      this.leftLeg.shin.rotation.x  = Math.max(0, -Math.sin(w) * 0.65);
      this.rightLeg.shin.rotation.x = Math.max(0, Math.sin(w) * 0.65);
      this.leftArm.rotation.x    = -Math.sin(w) * 0.5 - 0.45;
      this.rightArm.rotation.x   = Math.sin(w) * 0.5 - 0.45;
      this.torso.rotation.y      = 0;

    } else if (state === 'CROUCH') {
      this.pelvis.position.y     = 0.98;
      this.torso.rotation.x      = 0.30;
      this.leftLeg.rotation.x    = -0.92;
      this.rightLeg.rotation.x   = -0.92;
      this.leftLeg.shin.rotation.x  = 1.32;
      this.rightLeg.shin.rotation.x = 1.32;

    } else if (state === 'JUMP') {
      this.pelvis.position.y     = 1.35;
      this.leftLeg.rotation.x    = 0.55;
      this.rightLeg.rotation.x   = 0.55;
      this.leftLeg.shin.rotation.x  = 0.80;
      this.rightLeg.shin.rotation.x = 0.80;
      this.leftArm.rotation.x    = -1.2;
      this.rightArm.rotation.x   = -1.2;

    } else if (state === 'BLOCK') {
      this.pelvis.position.y     = 1.28;
      this.torso.rotation.x      = 0.18;
      this.rightArm.rotation.x   = -1.55;
      this.rightArm.rotation.z   = -0.50;
      this.rightArm.forearm.rotation.x = -0.40;
      this.leftArm.rotation.x    = -1.55;
      this.leftArm.rotation.z    = 0.50;
      this.leftArm.forearm.rotation.x = -0.40;

    } else if (state === 'ATTACK') {
      this._animAttack();

    } else if (state === 'HITSTUN') {
      this.torso.rotation.x      = -0.50;
      this.neck.rotation.x       = -0.38;
      this.rightArm.rotation.x   = -0.18;
      this.leftArm.rotation.x    = -0.18;
      this.pelvis.position.y     = 1.32;

    } else if (state === 'KNOCKDOWN') {
      this.root.rotation.x       = -Math.PI / 2;
      this.pelvis.position.y     = 0.30;
      this.torso.rotation.x      = 0;
      this.leftLeg.rotation.x    = 0;
      this.rightLeg.rotation.x   = 0;

    } else if (state === 'GETUP') {
      const prog = Math.min(this.getupTimer / 0.55, 1.0);
      this.root.rotation.x       = -Math.PI / 2 * (1 - prog);
      this.pelvis.position.y     = 0.30 + prog * 1.05;

    } else if (state === 'VICTORY') {
      this.root.rotation.x       = 0;
      this.pelvis.position.y     = 1.35;
      this.torso.rotation.x      = 0;
      this.torso.rotation.y      = 0;
      this.rightArm.rotation.x   = -2.6 + Math.sin(t * 5) * 0.15;
      this.leftArm.rotation.x    = -0.60;

    } else if (state === 'DEFEAT') {
      this.root.rotation.x       = -Math.PI / 2;
      this.pelvis.position.y     = 0.30;
    }
  }

  _animAttack() {
    const atk  = this.currentAttackData;
    if (!atk)  return;
    const prog = this.stateTimer / atk.duration;

    if (atk.type === 'punch') {
      const r = Math.sin(prog * Math.PI);
      this.rightArm.rotation.x          = -1.65 * r;
      this.rightArm.forearm.rotation.x  = -0.12 * r;
      this.torso.rotation.y             = 0.40 * r;
    } else if (atk.type === 'blade') {
      const s = Math.sin(prog * Math.PI);
      this.rightArm.rotation.x          = -2.35 + s * 2.0;
      this.rightArm.rotation.y          = -s * 1.35;
      this.torso.rotation.x             = s * 0.38;
    } else if (atk.type === 'kick') {
      const k = Math.sin(prog * Math.PI);
      this.rightLeg.rotation.x          = -1.9 * k;
      this.rightLeg.shin.rotation.x     = -0.28;
      this.torso.rotation.x             = -0.48 * k;
    }
  }
}

window.Fighter3D = Fighter3D;