// Shafin - The Speed Fighter
class Shafin extends Fighter {
  constructor(x, y, dir) {
    super('SHAFIN', x, y, dir, '#ffd700');
    this.subtitle = 'SPEED FIGHTER';
    this.walkSpeed = 340;
    this.dashSpeed = 750;
    this.loadSprite('./assets/images/shafin_cutout.png', './assets/images/shafin_avatar.png');

    // Multi-hit flurry counter for super
    this.superFlurryHits = 0;
  }

  startSpecial(skillNum, opponent) {
    if (skillNum === 1) {
      // Skill 1: Dash Blade Flurry
      this.state = 'SPECIAL';
      this.stateTimer = 0;
      this.hasHitCurrentAttack = false;
      this.vx = this.dir * 600;

      this.currentAttackData = {
        name: 'Dash Blade Flurry',
        damage: 105,
        hitStun: 28,
        knockbackX: 380,
        meterGain: 12,
        isBlade: true,
        isHeavy: true,
        duration: 0.45,
        hitboxStart: 0.1,
        hitboxEnd: 0.35,
        hitboxOffset: { x: 80, y: -160, w: 100, h: 70 }
      };

      window.soundManager.playBladeSlash(true);
      window.particleManager.createHitSparks(this.x + this.dir * 40, this.y - 120, '#ffd700', 16);
    } else {
      // Skill 2: Blade Crescent Wave (Projectile)
      this.state = 'SPECIAL';
      this.stateTimer = 0;
      this.hasHitCurrentAttack = true; // projectile deals damage

      this.currentAttackData = {
        name: 'Blade Crescent Wave',
        damage: 0, // projectile handles it
        duration: 0.4,
        hitboxStart: 0.5,
        hitboxEnd: 0.5
      };

      window.soundManager.playBladeSlash(false);
      // Spawn flying crescent projectile
      setTimeout(() => {
        window.particleManager.addProjectile(this, this.x + this.dir * 50, this.y - 140, this.dir, 'crescent');
      }, 100);
    }
  }

  startSuper(opponent) {
    this.meter = 0;
    this.state = 'SUPER';
    this.stateTimer = 0;
    this.superActive = true;
    this.superFlurryHits = 0;

    window.soundManager.playSuper();
    window.soundManager.speak('GOLDEN TEMPEST!');

    this.currentAttackData = {
      name: 'Golden Tempest Blades',
      damage: 32, // multi-hit (10 hits = 320 damage)
      hitStun: 35,
      knockbackX: 180,
      meterGain: 0,
      isBlade: true,
      isHeavy: true,
      unblockable: true,
      duration: 1.6,
      hitboxStart: 0.15,
      hitboxEnd: 1.4,
      hitboxOffset: { x: 75, y: -160, w: 120, h: 90 }
    };
  }

  updateAttack(dt) {
    super.updateAttack(dt);

    // Multi-hit logic during Super
    if (this.state === 'SUPER') {
      this.vx = this.dir * 250;
      // Spawn periodic hits during super window
      if (this.stateTimer > 0.2 && this.stateTimer < 1.3 && Math.random() < 0.35) {
        this.hasHitCurrentAttack = false; // allow next hit
        window.particleManager.createHitSparks(this.x + this.dir * 60, this.y - 140, '#ffe033', 8);
        window.soundManager.playBladeSlash(false);
      }
      if (this.stateTimer >= 1.5) {
        this.superActive = false;
      }
    }
  }

  renderCustomEffects(ctx, bobY) {
    // Golden blade glow and spark particles around hands
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    // Glowing golden energy sparkles
    const time = this.animTime * 8;
    const gX = 45 + Math.sin(time) * 4;
    const gY = -120 + bobY + Math.cos(time) * 4;

    ctx.fillStyle = '#fff9a6';
    ctx.beginPath();
    ctx.arc(gX, gY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Trailing golden speed blur during dash or special
    if (this.state === 'SPECIAL' || this.superActive) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-40, -140 + bobY);
      ctx.lineTo(80, -140 + bobY);
      ctx.stroke();
    }

    ctx.restore();
  }
}

window.Shafin = Shafin;