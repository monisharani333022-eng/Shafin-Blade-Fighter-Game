class Tamim3D extends Fighter3D {
  constructor(scene, startX, dir) {
    super('TAMIM', scene, startX, dir, 0x9b59b6, './assets/images/tamim_avatar.png');
    this.subtitle = 'THE SHADOW'; this.walkSpeed = 4.8;
    const orb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16),
      new THREE.MeshStandardMaterial({ color:0x9b59b6, emissive:0x8e44ad, emissiveIntensity:0.9, transparent:true, opacity:0.8 }));
    this.rightArm.forearm.add(orb);
  }
  startSpecial(skillNum, opponent) {
    this.state = 'SPECIAL'; this.stateTimer = 0; this.hasHitCurrentAttack = false;
    if (skillNum === 1) {
      if (opponent) this.root.position.x = opponent.root.position.x - this.dir * 1.7;
      this.currentAttackData = { type:'blade', damage:118, hitStun:28, reach:2.3,
        hitboxStart:0.05, hitboxEnd:0.32, duration:0.46, isBlade:true,
        isHeavy:true, knockback:3.0, causesKnockdown:false };
      if (window.soundManager) window.soundManager.playBladeSlash(true);
      if (window.particleManager) window.particleManager.createHitSparks(this.root.position.x*60+640, 470, '#9b59b6', 22);
    } else {
      this.currentAttackData = { type:'punch', damage:0, hitStun:0, reach:0, hitboxStart:99, hitboxEnd:99, duration:0.38, isHeavy:false, knockback:0 };
      this.hasHitCurrentAttack = true;
      if (window.soundManager) window.soundManager.playBladeSlash(false);
      setTimeout(() => { if (window.particleManager) window.particleManager.addProjectile(this, this.root.position.x*60+640+this.dir*60, 465, this.dir, 'void'); }, 80);
    }
  }
  startSuper(opponent) {
    this.meter = 0; this.state = 'SUPER'; this.stateTimer = 0;
    if (window.soundManager) { window.soundManager.playSuper(); window.soundManager.speak('ECLIPSE DOMAIN!'); }
    if (window.threeEngine) { window.threeEngine.cinematicMode = true; setTimeout(() => { if (window.threeEngine) window.threeEngine.cinematicMode = false; }, 1600); }
    this.currentAttackData = { type:'blade', damage:330, hitStun:44, reach:3.2, hitboxStart:0.15, hitboxEnd:1.1, duration:1.5, isBlade:true, isHeavy:true, knockback:5.0, causesKnockdown:true };
    setTimeout(() => { if (window.particleManager) window.particleManager.createHitSparks(this.root.position.x*60+640, 450, '#9b59b6', 48); }, 250);
    if (navigator.vibrate) navigator.vibrate([60,20,100,20,60]);
  }
}
window.Tamim3D = Tamim3D;