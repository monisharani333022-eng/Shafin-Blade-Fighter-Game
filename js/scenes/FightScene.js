// FightScene.js — Complete Combat Loop (24 Core Gameplay Features)
class FightScene {
  constructor(game) {
    this.game = game;
    this.three = null;
    this.p1 = null;
    this.p2 = null;
    this.ai  = null;

    // Round/Match state
    this.roundTime      = 99;
    this.currentRound   = 1;
    this.p1RoundWins    = 0;
    this.p2RoundWins    = 0;
    this.roundOver      = false;
    this.matchOver      = false;
    this.roundOverTimer = 0;
    this.introTimer     = 1.5;
    this.koSlowTimer    = 0;   // slow-motion after KO
    this.koPhase        = '';  // '' | 'slowmo' | 'done'

    // Preload avatars
    this.avatars = {};
    ['shafin','nafis','tamim','hamza','aavon'].forEach(id => {
      const img = new Image();
      img.src = `./assets/images/${id}_avatar.png`;
      this.avatars[id] = img;
    });
  }

  // ─── Scene Lifecycle ──────────────────────────────────────────
  enter() {
    this.p1RoundWins  = 0;
    this.p2RoundWins  = 0;
    this.currentRound = 1;
    this.matchOver    = false;
    this.koPhase      = '';

    if (!window.threeEngine) {
      window.threeEngine = new ThreeEngine('game-container');
    }
    this.three = window.threeEngine;
    this.three.show3D();

    this._setupRound();
    window.soundManager.startBGM();
    window.inputManager.showTouchControls(true);
  }

  _createFighter(id, scene, startX, dir) {
    switch (id) {
      case 'shafin': return new Shafin3D(scene, startX, dir);
      case 'nafis':  return new Nafis3D(scene, startX, dir);
      case 'tamim':  return new Tamim3D(scene, startX, dir);
      case 'hamza':  return new Hamza3D(scene, startX, dir);
      case 'aavon':  return new Aavon3D(scene, startX, dir);
      default:       return new Shafin3D(scene, startX, dir);
    }
  }

  _setupRound() {
    this.roundTime      = 99;
    this.roundOver      = false;
    this.roundOverTimer = 0;
    this.introTimer     = 1.5;
    this.koPhase        = '';
    this.koSlowTimer    = 0;

    if (this.p1 && this.p1.root) this.three.scene.remove(this.p1.root);
    if (this.p2 && this.p2.root) this.three.scene.remove(this.p2.root);

    this.p1 = this._createFighter(this.game.p1Fighter || 'shafin', this.three.scene, -3.2,  1);
    this.p2 = this._createFighter(this.game.p2Fighter || 'nafis',  this.three.scene,  3.2, -1);

    this.ai = this.game.mode === 'cpu' ? new FighterAI('NORMAL') : null;

    if (window.particleManager) window.particleManager.clear();
    window.soundManager.speak('ROUND ' + this.currentRound + '! FIGHT!');
  }

  // ─── Main Update ──────────────────────────────────────────────
  update(dt) {
    // KO slow-motion phase
    if (this.koPhase === 'slowmo') {
      dt *= 0.20;
      this.koSlowTimer -= dt * 5; // counts in real seconds
      if (this.koSlowTimer <= 0) {
        this.koPhase = 'done';
        this.roundOverTimer = 0;
      }
    }

    // Intro freeze
    if (this.introTimer > 0) {
      this.introTimer -= dt;
      if (this.three) this.three.update(dt, this.p1 ? this.p1.root : null, this.p2 ? this.p2.root : null);
      return;
    }

    // Practice mode: refill HP
    if (this.game.mode === 'practice') {
      if (this.p1.hp < 300) { this.p1.hp = 1000; this.p1.redHp = 1000; }
      if (this.p2.hp < 300) { this.p2.hp = 1000; this.p2.redHp = 1000; }
    }

    // Round countdown
    if (!this.roundOver && this.game.mode !== 'practice') {
      this.roundTime -= dt;
      if (this.roundTime <= 0) { this.roundTime = 0; this._handleTimeout(); }
    }

    // Read input
    const p1Input = window.inputManager.getPlayerState(1);
    const p2Input = this.ai
      ? this.ai.update(dt, this.p2, this.p1)
      : window.inputManager.getPlayerState(2);

    // Update fighters
    if (!this.roundOver || this.koPhase === 'slowmo') {
      this.p1.update(dt, p1Input, this.p2);
      this.p2.update(dt, p2Input, this.p1);
    } else {
      // Still animate bodies after round ends
      this.p1.update(dt, { up:false, down:false, left:false, right:false,
        block:false, justPressed:{} }, this.p2);
      this.p2.update(dt, { up:false, down:false, left:false, right:false,
        block:false, justPressed:{} }, this.p1);
    }

    // Separation push (prevent overlap)
    this._separateFighters();

    // Hit detection both ways
    this._checkHit(this.p1, this.p2);
    this._checkHit(this.p2, this.p1);

    // 3D scene / camera
    if (this.three) this.three.update(dt, this.p1.root, this.p2.root);
    if (window.particleManager) window.particleManager.update(dt);

    // Update input frame state
    window.inputManager.update();

    // KO detection
    if (!this.roundOver && (this.p1.hp <= 0 || this.p2.hp <= 0)) {
      this.roundOver = true;
      this.koPhase   = 'slowmo';
      this.koSlowTimer = 1.2;
      if (this.three) this.three.shake(1.2, 0.8);
      if (navigator.vibrate) navigator.vibrate([80, 30, 120]);
      const winner = this.p1.hp > 0 ? this.p1 : this.p2;
      winner.state = 'VICTORY';
    }

    // Round over countdown
    if (this.roundOver && this.koPhase === 'done') {
      this.roundOverTimer += dt;
      if (this.roundOverTimer > 2.6) this._resolveRoundEnd();
    }
  }

  // ─── Hit Detection ────────────────────────────────────────────
  _checkHit(attacker, defender) {
    const atk = attacker.currentAttackData;
    if (!atk || attacker.hasHitCurrentAttack) return;

    // Only active during hitbox window
    if (attacker.stateTimer < atk.hitboxStart || attacker.stateTimer > atk.hitboxEnd) return;

    const dist = Math.abs(attacker.root.position.x - defender.root.position.x);
    if (dist > atk.reach) return;

    attacker.hasHitCurrentAttack = true;

    // Block check
    const isFacingBlock =
      (defender.dir === 1  && attacker.root.position.x > defender.root.position.x) ||
      (defender.dir === -1 && attacker.root.position.x < defender.root.position.x);

    if (defender.isBlocking && isFacingBlock && defender.isGrounded) {
      // ── Blocked ──
      const chip = Math.max(1, Math.floor(atk.damage * 0.12));
      defender.takeDamage(chip, true);
      defender.hitStun = 10;
      defender.vx      = attacker.dir * 1.2;
      defender.buildMeter(4);
      attacker.buildMeter(3);
      if (window.soundManager) window.soundManager.playBlock();
      if (this.three) this.three.shake(0.12, 0.12);
      const sx = defender.root.position.x * 60 + 640;
      if (window.particleManager) window.particleManager.createHitSparks(sx, 480, '#88aaff', 10);
      if (navigator.vibrate) navigator.vibrate(12);
    } else {
      // ── Clean hit ──
      attacker.comboCount++;
      attacker.comboTimer = 2.0;
      const scaling = Math.max(0.40, 1.0 - (attacker.comboCount - 1) * 0.10);
      const dmg     = Math.max(1, Math.floor(atk.damage * scaling));

      defender.takeDamage(dmg, false);
      defender.hitStun = atk.hitStun;
      defender.buildMeter(6);
      attacker.buildMeter(10);

      // Knockback
      defender.vx = attacker.dir * atk.knockback;
      if (!defender.isGrounded) defender.vy = Math.max(defender.vy, 2.5);

      // Knockdown for heavy hits
      if (atk.causesKnockdown && defender.isGrounded && defender.state !== 'DEFEAT') {
        defender.triggerKnockdown(attacker.dir * atk.knockback * 1.2);
      }

      // Sounds
      if (window.soundManager) {
        if (atk.isBlade)     window.soundManager.playBladeSlash(atk.isHeavy);
        else if (atk.isFire) window.soundManager.playFireball();
        else                 window.soundManager.playPunch(atk.isHeavy);
      }

      // Particles & damage numbers
      const sx = defender.root.position.x * 60 + 640;
      const sy = 460 - defender.root.position.y * 30;
      const hex = '#' + attacker.themeColor.toString(16).padStart(6, '0');
      if (window.particleManager) {
        window.particleManager.createHitSparks(sx, sy, hex, atk.isHeavy ? 24 : 14);
        window.particleManager.showDamageText(sx, sy, '' + dmg, hex);
      }

      // Camera shake
      if (this.three) this.three.shake(atk.isHeavy ? 0.45 : 0.18, atk.isHeavy ? 0.40 : 0.18);

      // Haptic
      if (navigator.vibrate) navigator.vibrate(atk.isHeavy ? [30, 10, 30] : 15);
    }
  }

  // ─── Separation ───────────────────────────────────────────────
  _separateFighters() {
    const minDist = 1.45;
    const dx = this.p1.root.position.x - this.p2.root.position.x;
    const dist = Math.abs(dx);
    if (dist < minDist) {
      const push = (minDist - dist) * 0.5;
      if (dx < 0) { this.p1.root.position.x -= push; this.p2.root.position.x += push; }
      else        { this.p1.root.position.x += push; this.p2.root.position.x -= push; }
    }
  }

  // ─── Round Logic ─────────────────────────────────────────────
  _handleTimeout() {
    this.roundOver      = true;
    this.koPhase        = 'done';
    this.roundOverTimer = 0;
    // Whoever has more HP wins; drain the loser to 0 for visuals
    if (this.p1.hp >= this.p2.hp) {
      this.p2.hp = 0;
    } else {
      this.p1.hp = 0;
    }
    const winner = this.p1.hp >= this.p2.hp ? this.p1 : this.p2;
    winner.state = 'VICTORY';
  }

  _resolveRoundEnd() {
    if (this.p1.hp > this.p2.hp) this.p1RoundWins++;
    else                          this.p2RoundWins++;

    if (this.p1RoundWins >= 2 || this.p2RoundWins >= 2) {
      this.game.winner = this.p1RoundWins >= 2 ? this.p1 : this.p2;
      this.game.loser  = this.p1RoundWins >= 2 ? this.p2 : this.p1;
      this.three.hide3D();
      this.game.changeScene('victory');
    } else {
      this.currentRound++;
      this._setupRound();
    }
  }

  // ─── Render (2D HUD over WebGL) ───────────────────────────────
  render(ctx) {
    if (window.particleManager) window.particleManager.render(ctx);
    this._renderHUD(ctx);
    this._renderAnnouncements(ctx);
  }

  _renderHUD(ctx) {
    if (!this.p1 || !this.p2) return;
    const W = 1280, H = 720;
    const barW = 420, barH = 28, topY = 38;
    const p1c = '#' + this.p1.themeColor.toString(16).padStart(6,'0');
    const p2c = '#' + this.p2.themeColor.toString(16).padStart(6,'0');

    ctx.save();

    // ── P1 HP bar ──
    // Background
    ctx.fillStyle = 'rgba(10,10,16,0.88)';
    ctx.fillRect(100, topY, barW, barH);
    // Red delayed bar
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(100 + barW * (1 - this.p1.redHp / this.p1.maxHp), topY,
                 barW * (this.p1.redHp / this.p1.maxHp), barH);
    // Live HP
    const g1 = ctx.createLinearGradient(100, 0, 100 + barW, 0);
    g1.addColorStop(0, p1c); g1.addColorStop(1, '#ffcc00');
    ctx.fillStyle = g1;
    ctx.fillRect(100 + barW * (1 - this.p1.hp / this.p1.maxHp), topY,
                 barW * (this.p1.hp / this.p1.maxHp), barH);
    ctx.strokeStyle = p1c; ctx.lineWidth = 2;
    ctx.strokeRect(100, topY, barW, barH);

    // P1 Avatar
    ctx.save();
    ctx.strokeStyle = p1c; ctx.lineWidth = 3;
    ctx.strokeRect(30, 24, 62, 62);
    const av1 = this.avatars[this.game.p1Fighter];
    if (av1 && av1.complete && av1.naturalWidth) ctx.drawImage(av1, 30, 24, 62, 62);
    ctx.restore();

    // P1 Name
    ctx.font = '900 22px Teko, Orbitron, sans-serif';
    ctx.fillStyle = p1c; ctx.textAlign = 'left';
    ctx.fillText(this.p1.name, 100, topY - 5);

    // P1 round dots
    for (let r = 0; r < 2; r++) {
      ctx.beginPath();
      ctx.arc(112 + r * 24, topY + barH + 11, 7, 0, Math.PI * 2);
      ctx.fillStyle = r < this.p1RoundWins ? p1c : 'rgba(255,255,255,0.18)';
      ctx.fill(); ctx.strokeStyle = p1c; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // ── P2 HP bar ──
    const p2x = W - 100 - barW;
    ctx.fillStyle = 'rgba(10,10,16,0.88)';
    ctx.fillRect(p2x, topY, barW, barH);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(p2x, topY, barW * (this.p2.redHp / this.p2.maxHp), barH);
    const g2 = ctx.createLinearGradient(p2x, 0, p2x + barW, 0);
    g2.addColorStop(0, '#ff3355'); g2.addColorStop(1, p2c);
    ctx.fillStyle = g2;
    ctx.fillRect(p2x, topY, barW * (this.p2.hp / this.p2.maxHp), barH);
    ctx.strokeStyle = p2c; ctx.lineWidth = 2;
    ctx.strokeRect(p2x, topY, barW, barH);

    // P2 Avatar
    ctx.save();
    ctx.strokeStyle = p2c; ctx.lineWidth = 3;
    ctx.strokeRect(W - 92, 24, 62, 62);
    const av2 = this.avatars[this.game.p2Fighter];
    if (av2 && av2.complete && av2.naturalWidth) ctx.drawImage(av2, W - 92, 24, 62, 62);
    ctx.restore();

    // P2 Name
    ctx.font = '900 22px Teko, Orbitron, sans-serif';
    ctx.fillStyle = p2c; ctx.textAlign = 'right';
    ctx.fillText(this.p2.name, W - 100, topY - 5);

    // P2 round dots
    for (let r = 0; r < 2; r++) {
      ctx.beginPath();
      ctx.arc(W - 112 - r * 24, topY + barH + 11, 7, 0, Math.PI * 2);
      ctx.fillStyle = r < this.p2RoundWins ? p2c : 'rgba(255,255,255,0.18)';
      ctx.fill(); ctx.strokeStyle = p2c; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // ── Timer ──
    ctx.fillStyle = 'rgba(8,8,14,0.92)';
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(W/2-38, 18, 76, 58, 8); ctx.fill(); ctx.stroke();
    ctx.font = '900 40px Teko, Orbitron, sans-serif';
    ctx.fillStyle = this.roundTime <= 10 ? '#ff3300' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('' + Math.ceil(this.roundTime), W/2, 63);

    // ── Super Meters ──
    const mW = 240, mH = 14, mY = H - 32;
    // P1
    ctx.fillStyle = 'rgba(10,10,18,0.85)';
    ctx.fillRect(40, mY, mW, mH);
    ctx.fillStyle = this.p1.meter >= 100 ? p1c : '#00aaff';
    ctx.fillRect(40, mY, mW * (this.p1.meter / 100), mH);
    ctx.strokeStyle = this.p1.meter >= 100 ? p1c : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5; ctx.strokeRect(40, mY, mW, mH);
    ctx.font = '700 11px Orbitron, sans-serif';
    ctx.fillStyle = this.p1.meter >= 100 ? p1c : '#ccc';
    ctx.textAlign = 'left';
    ctx.fillText(this.p1.meter >= 100 ? 'SUPER READY! [EX]' : 'SUPER: ' + Math.floor(this.p1.meter) + '%', 40, mY - 4);

    // P2
    const m2x = W - 40 - mW;
    ctx.fillStyle = 'rgba(10,10,18,0.85)';
    ctx.fillRect(m2x, mY, mW, mH);
    ctx.fillStyle = this.p2.meter >= 100 ? p2c : '#dd44ff';
    ctx.fillRect(m2x + mW * (1 - this.p2.meter / 100), mY, mW * (this.p2.meter / 100), mH);
    ctx.strokeStyle = this.p2.meter >= 100 ? p2c : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5; ctx.strokeRect(m2x, mY, mW, mH);
    ctx.font = '700 11px Orbitron, sans-serif';
    ctx.fillStyle = this.p2.meter >= 100 ? p2c : '#ccc';
    ctx.textAlign = 'right';
    ctx.fillText(this.p2.meter >= 100 ? 'SUPER READY!' : 'SUPER: ' + Math.floor(this.p2.meter) + '%', W - 40, mY - 4);

    // ── Combo counters ──
    if (this.p1.comboCount > 1) {
      ctx.font = '900 40px Teko, Orbitron, sans-serif';
      ctx.fillStyle = p1c; ctx.shadowColor = p1c; ctx.shadowBlur = 10;
      ctx.textAlign = 'left';
      ctx.fillText(this.p1.comboCount + ' HIT COMBO!', 40, 170);
      ctx.shadowBlur = 0;
    }
    if (this.p2.comboCount > 1) {
      ctx.font = '900 40px Teko, Orbitron, sans-serif';
      ctx.fillStyle = p2c; ctx.shadowColor = p2c; ctx.shadowBlur = 10;
      ctx.textAlign = 'right';
      ctx.fillText(this.p2.comboCount + ' HIT COMBO!', W - 40, 170);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  _renderAnnouncements(ctx) {
    const W = 1280, H = 720;
    ctx.save(); ctx.textAlign = 'center';

    if (this.introTimer > 0) {
      ctx.font = '900 78px Teko, Orbitron, sans-serif';
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 28;
      if (this.introTimer > 0.65) {
        ctx.fillText('ROUND ' + this.currentRound, W/2, H/2 - 18);
      } else {
        ctx.fillStyle = '#ff2200'; ctx.shadowColor = '#ff0000';
        ctx.fillText('FIGHT!', W/2, H/2 - 18);
      }
    }

    if (this.roundOver) {
      ctx.font = '900 110px Teko, Orbitron, sans-serif';
      ctx.fillStyle = '#ff1800'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 30;
      ctx.fillText('K . O .', W/2, H/2 + 10);

      if (this.roundOverTimer > 0.5) {
        const wName = (this.p1.hp >= this.p2.hp ? this.p1.name : this.p2.name);
        ctx.font = '700 30px Orbitron, sans-serif';
        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#000'; ctx.shadowBlur = 8;
        ctx.fillText(wName + ' WINS THE ROUND!', W/2, H/2 + 65);
      }
    }

    ctx.restore();
  }

  handleClick(x, y) {
    if (this.roundOver && this.roundOverTimer > 1.5) this._resolveRoundEnd();
  }
}

window.FightScene = FightScene;