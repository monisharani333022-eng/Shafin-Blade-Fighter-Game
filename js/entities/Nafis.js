// Nafis - The Power Fighter
class Nafis extends Fighter {
  constructor(x, y, dir) {
    super('NAFIS', x, y, dir, '#ff2233');
    this.subtitle = 'POWER FIGHTER';
    this.walkSpeed = 270;
    this.dashSpeed = 580;
    this.loadSprite('./assets/images/nafis_cutout.png', './assets/images/nafis_avatar.png');
  }

  startSpecial(skillNum, opponent) {
    if (skillNum === 1) {
      // Skill 1: Flame Fist Charge
      this.state = 'SPECIAL';
      this.stateTimer = 0;
      this.hasHitCurrentAttack = false;
      this.vx = this.dir * 450;

      this.currentAttackData = {
        name: 'Flame Fist Charge',
        damage: 130,
        hitStun: 30,
        knockbackX: 420,
        meterGain: 14,
        isFire: true,
        isHeavy: true,
        duration: 0.52,
        hitboxStart: 0.12,
        hitboxEnd: 0.38,
        hitboxOffset: { x: 80, y: -150, w: 100, h: 80 }
      };

      window.soundManager.playFireball();
      window.particleManager.createFlames(this.x + this.dir * 50, this.y - 130, 15);
    } else {
      // Skill 2: Iron Guard & Flame Blast (Fire Projectile)
      this.state = 'SPECIAL';
      this.stateTimer = 0;
      this.hasHitCurrentAttack = true;

      this.currentAttackData = {
        name: 'Iron Flame Blast',
        damage: 0, // projectile handles it
        duration: 0.45,
        hitboxStart: 0.5,
        hitboxEnd: 0.5
      };

      window.soundManager.playFireball();
      setTimeout(() => {
        window.particleManager.addProjectile(this, this.x + this.dir * 50, this.y - 130, this.dir, 'fireball');
      }, 120);
    }
  }

  startSuper(opponent) {
    this.meter = 0;
    this.state = 'SUPER';
    this.stateTimer = 0;
    this.superActive = true;

    window.soundManager.playSuper();
    window.soundManager.speak('LION BEAST INFERNO!');

    this.currentAttackData = {
      name: 'Lion Beast Inferno',
      damage: 340,
      hitStun: 45,
      knockbackX: 450,
      launchY: 280,
      meterGain: 0,
      isFire: true,
      isHeavy: true,
      unblockable: true,
      duration: 1.5,
      hitboxStart: 0.25,
      hitboxEnd: 0.85,
      hitboxOffset: { x: 60, y: -180, w: 220, h: 220 }
    };

    // Spawn massive fiery pillar
    setTimeout(() => {
      window.particleManager.createFlames(this.x + this.dir * 80, this.y - 80, 50);
      window.particleManager.createHitSparks(this.x + this.dir * 80, this.y - 120, '#ff3300', 30);
    }, 250);
  }

  updateAttack(dt) {
    super.updateAttack(dt);

    if (this.state === 'SUPER') {
      if (this.stateTimer >= 1.4) {
        this.superActive = false;
      }
    }
  }

  renderCustomEffects(ctx, bobY) {
    // Blazing crimson flames dancing around his fists
    ctx.save();
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 18;

    const time = this.animTime * 9;
    const fX = 40 + Math.sin(time) * 5;
    const fY = -120 + bobY + Math.cos(time) * 4;

    // Outer flame aura
    ctx.fillStyle = 'rgba(255, 60, 0, 0.75)';
    ctx.beginPath();
    ctx.arc(fX, fY, 14 + Math.sin(time) * 3, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#ffea66';
    ctx.beginPath();
    ctx.arc(fX, fY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.Nafis = Nafis;