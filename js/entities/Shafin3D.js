// Shafin3D.js — Speed Fighter (Gold/Black, Dual Blade Daggers)
class Shafin3D extends Fighter3D {
  constructor(scene, startX, dir) {
    super('SHAFIN', scene, startX, dir, 0xffd700, './assets/images/shafin_avatar.png');
    this.subtitle  = 'SPEED FIGHTER';
    this.walkSpeed = 5.0;
    this._addBlades();
  }

  _addBlades() {
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, metalness: 0.95, roughness: 0.05,
      emissive: 0xffa500, emissiveIntensity: 0.5
    });
    const createBlade = () => {
      const g = new THREE.Group();
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.14, 8), this.accentMat);
      hilt.position.y = -0.07;
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.02), bladeMat);
      edge.position.y = 0.23;
      g.add(hilt); g.add(edge);
      return g;
    };
    this.rightArm.forearm.add(createBlade());
    const b2 = createBlade();
    b2.rotation.z = Math.PI;
    this.leftArm.forearm.add(b2);
  }

  startSpecial(skillNum, opponent) {
    this.state = 'SPECIAL'; this.stateTimer = 0; this.hasHitCurrentAttack = false;
    if (skillNum === 1) {
      // Dash Blade Flurry — teleport close then slash
      if (opponent) {
        this.root.position.x = opponent.root.position.x - this.dir * 1.8;
      }
      this.currentAttackData = { type:'blade', damage:115, hitStun:28, reach:2.3,
        hitboxStart:0.05, hitboxEnd:0.35, duration:0.45, isBlade:true,
        isHeavy:true, knockback:3.2, causesKnockdown:false };
      if (window.soundManager) window.soundManager.playBladeSlash(true);
      if (window.particleManager)
        window.particleManager.createHitSparks(this.root.position.x*60+640, 470, '#ffd700', 22);
    } else {
      // Crescent Wave projectile
      this.currentAttackData = { type:'punch', damage:0, hitStun:0, reach:0,
        hitboxStart:99, hitboxEnd:99, duration:0.40, isHeavy:false, knockback:0 };
      this.hasHitCurrentAttack = true;
      if (window.soundManager) window.soundManager.playBladeSlash(false);
      setTimeout(() => {
        if (window.particleManager)
          window.particleManager.addProjectile(this, this.root.position.x*60+640+this.dir*60, 465, this.dir, 'blade');
      }, 80);
    }
  }

  startSuper(opponent) {
    this.meter = 0; this.state = 'SUPER'; this.stateTimer = 0;
    if (window.soundManager) { window.soundManager.playSuper(); window.soundManager.speak('GOLDEN TEMPEST!'); }
    if (window.threeEngine) {
      window.threeEngine.cinematicMode = true;
      setTimeout(() => { if (window.threeEngine) window.threeEngine.cinematicMode = false; }, 1600);
    }
    this.currentAttackData = { type:'blade', damage:340, hitStun:45, reach:3.2,
      hitboxStart:0.15, hitboxEnd:1.10, duration:1.5, isBlade:true,
      isHeavy:true, knockback:5.0, causesKnockdown:true };
    setTimeout(() => {
      if (window.particleManager)
        window.particleManager.createHitSparks(this.root.position.x*60+640, 450, '#ffd700', 50);
    }, 250);
    if (navigator.vibrate) navigator.vibrate([60, 20, 100, 20, 60]);
  }
}
window.Shafin3D = Shafin3D;