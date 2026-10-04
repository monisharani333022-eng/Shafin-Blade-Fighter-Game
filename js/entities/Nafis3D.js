// Nafis3D.js — Power Fighter (Crimson/Black, Flame Fists)
class Nafis3D extends Fighter3D {
  constructor(scene, startX, dir) {
    super('NAFIS', scene, startX, dir, 0xff2233, './assets/images/nafis_avatar.png');
    this.subtitle  = 'POWER FIGHTER';
    this.walkSpeed = 3.8;
    this._addFlameFists();
  }

  _addFlameFists() {
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xff4400, roughness: 0.2, metalness: 0.1,
      emissive: 0xff2200, emissiveIntensity: 0.8, transparent: true, opacity: 0.85
    });
    const addFist = (arm) => {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), flameMat);
      orb.position.y = -0.42;
      arm.forearm.add(orb);
    };
    addFist(this.rightArm); addFist(this.leftArm);
  }

  startSpecial(skillNum, opponent) {
    this.state = 'SPECIAL'; this.stateTimer = 0; this.hasHitCurrentAttack = false;
    if (skillNum === 1) {
      this.currentAttackData = { type:'punch', damage:130, hitStun:32, reach:2.6,
        hitboxStart:0.10, hitboxEnd:0.32, duration:0.50, isFire:true,
        isHeavy:true, knockback:4.5, causesKnockdown:true };
      this.vx = this.dir * 6.0;
      if (window.soundManager) window.soundManager.playFireball();
    } else {
      this.currentAttackData = { type:'punch', damage:0, hitStun:0, reach:0,
        hitboxStart:99, hitboxEnd:99, duration:0.42, isHeavy:false, knockback:0 };
      this.hasHitCurrentAttack = true;
      if (window.soundManager) window.soundManager.playFireball();
      setTimeout(() => {
        if (window.particleManager)
          window.particleManager.addProjectile(this, this.root.position.x*60+640+this.dir*60, 475, this.dir, 'flame');
      }, 100);
    }
  }

  startSuper(opponent) {
    this.meter = 0; this.state = 'SUPER'; this.stateTimer = 0;
    if (window.soundManager) { window.soundManager.playSuper(); window.soundManager.speak('LION BEAST INFERNO!'); }
    if (window.threeEngine) {
      window.threeEngine.cinematicMode = true;
      setTimeout(() => { if (window.threeEngine) window.threeEngine.cinematicMode = false; }, 1600);
    }
    this.currentAttackData = { type:'punch', damage:355, hitStun:50, reach:3.5,
      hitboxStart:0.12, hitboxEnd:1.15, duration:1.5, isFire:true,
      isHeavy:true, knockback:6.0, causesKnockdown:true };
    setTimeout(() => {
      if (window.particleManager)
        window.particleManager.createHitSparks(this.root.position.x*60+640, 445, '#ff3300', 55);
    }, 200);
    if (navigator.vibrate) navigator.vibrate([80, 20, 120, 20, 80]);
  }
}
window.Nafis3D = Nafis3D;