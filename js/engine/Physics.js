// 2D Fighting Game Physics, Collisions & Hit Resolution
class PhysicsEngine {
  constructor() {
    this.groundY = 560;
    this.stageMinX = 100;
    this.stageMaxX = 1180;
    this.gravity = 1900;
  }

  // AABB bounding box collision test
  checkAABB(r1, r2) {
    if (!r1 || !r2) return false;
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  // Push fighters apart so they do not overlap
  resolveFighterOverlap(f1, f2) {
    const pushBoxWidth = 80;
    const dist = Math.abs(f1.x - f2.x);
    if (dist < pushBoxWidth) {
      const overlap = pushBoxWidth - dist;
      if (f1.x < f2.x) {
        f1.x = Math.max(this.stageMinX, f1.x - overlap * 0.5);
        f2.x = Math.min(this.stageMaxX, f2.x + overlap * 0.5);
      } else {
        f1.x = Math.min(this.stageMaxX, f1.x + overlap * 0.5);
        f2.x = Math.max(this.stageMinX, f2.x - overlap * 0.5);
      }
    }
  }

  // Check attack hitboxes against opponent hurtboxes
  checkCombatHits(attacker, defender, camera) {
    if (!attacker.activeHitbox || attacker.hasHitCurrentAttack) return;

    const defenderHurtbox = defender.getHurtbox();
    if (this.checkAABB(attacker.activeHitbox, defenderHurtbox)) {
      attacker.hasHitCurrentAttack = true;
      const attack = attacker.currentAttackData;

      // Check if defender is blocking
      const isFacingAttacker = (defender.dir === 1 && attacker.x > defender.x) || (defender.dir === -1 && attacker.x < defender.x);
      const isBlocked = defender.isBlocking && isFacingAttacker && !attack.unblockable;

      if (isBlocked) {
        // Blocked attack
        const chipDamage = Math.max(2, Math.floor(attack.damage * 0.15));
        defender.takeDamage(chipDamage, true);
        defender.hitStun = 12;
        defender.vx = attacker.dir * 180;

        window.soundManager.playBlock();
        window.particleManager.createHitSparks(
          (attacker.activeHitbox.x + defenderHurtbox.x + defenderHurtbox.width) / 2,
          attacker.activeHitbox.y + attacker.activeHitbox.height / 2,
          '#ffffff',
          8
        );
        camera.shake(0.12, 3);
      } else {
        // Clean hit!
        attacker.comboCount++;
        const scaling = Math.max(0.4, 1.0 - (attacker.comboCount - 1) * 0.1);
        const damage = Math.floor(attack.damage * scaling);

        defender.takeDamage(damage, false);
        defender.hitStun = attack.hitStun || 20;

        // Knockback velocity
        defender.vx = attacker.dir * (attack.knockbackX || 280);
        if (attack.launchY) {
          defender.vy = -attack.launchY;
          defender.isGrounded = false;
        }

        // Meter build
        attacker.buildMeter(attack.meterGain || 8);
        defender.buildMeter(Math.floor(attack.meterGain * 0.6) || 5);

        // Sound & FX
        if (attack.isBlade) {
          window.soundManager.playBladeSlash(attack.isHeavy);
        } else if (attack.isFire) {
          window.soundManager.playFireball();
        } else {
          window.soundManager.playPunch(attack.isHeavy);
        }

        const hitX = (attacker.activeHitbox.x + defenderHurtbox.x + defenderHurtbox.width) / 2;
        const hitY = attacker.activeHitbox.y + attacker.activeHitbox.height / 2;

        window.particleManager.createHitSparks(
          hitX, hitY,
          attacker.themeColor,
          attack.isHeavy ? 24 : 14
        );

        window.particleManager.showDamageText(hitX, hitY, `${damage}`, attacker.themeColor);

        // Camera impact
        camera.shake(attack.isHeavy ? 0.35 : 0.18, attack.isHeavy ? 10 : 5);
        camera.hitStop(attack.isHeavy ? 5 : 3);
      }
    }
  }

  // Check projectile hits
  checkProjectileHits(defender, camera) {
    const projectiles = window.particleManager.projectiles;
    const defenderHurtbox = defender.getHurtbox();

    for (const proj of projectiles) {
      if (!proj.active || proj.owner === defender) continue;

      if (this.checkAABB(proj.getHitbox(), defenderHurtbox)) {
        proj.active = false;

        const isFacingProj = (defender.dir === 1 && proj.x > defender.x) || (defender.dir === -1 && proj.x < defender.x);
        const isBlocked = defender.isBlocking && isFacingProj;

        if (isBlocked) {
          const chip = Math.floor(proj.damage * 0.18);
          defender.takeDamage(chip, true);
          defender.hitStun = 14;
          defender.vx = proj.dir * 150;
          window.soundManager.playBlock();
        } else {
          defender.takeDamage(proj.damage, false);
          defender.hitStun = 24;
          defender.vx = proj.dir * 320;
          if (proj.type === 'crescent') {
            window.soundManager.playBladeSlash(true);
            window.particleManager.createHitSparks(proj.x, proj.y, '#ffd700', 20);
          } else {
            window.soundManager.playFireball();
            window.particleManager.createFlames(proj.x, proj.y, 25);
          }
          camera.shake(0.3, 8);
          camera.hitStop(4);
        }
      }
    }
  }
}

window.physicsEngine = new PhysicsEngine();