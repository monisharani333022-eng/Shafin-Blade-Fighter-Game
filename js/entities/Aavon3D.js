class Aavon3D extends Fighter3D {
  constructor(scene, startX, dir) {
    super('AAVON', scene, startX, dir, 0x00d2ff, './assets/images/aavon_avatar.png');
    this.subtitle = 'THE STRIKER'; this.walkSpeed = 5.2;
    const vMat = new THREE.MeshStandardMaterial({ color:0x00e5ff, metalness:0.8, emissive:0x00b0ff, emissiveIntensity:0.85 });
    [this.rightArm.forearm, this.leftArm.forearm].forEach(f => {
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.06), vMat);
        s.position.set((Math.random()-0.5)*0.12, -0.22, (Math.random()-0.5)*0.12);
        s.rotation.set(Math.random()*0.5, Math.random()*0.5, Math.random()*0.5);
        f.add(s);
      }
    });
  }
  startSpecial(skillNum, opponent) {
    this.state = 'SPECIAL'; this.stateTimer = 0; this.hasHitCurrentAttack = false;
    if (skillNum === 1) {
      this.currentAttackData = { type:'punch', damage:112, hitStun:26, reach:2.5, hitboxStart:0.06, hitboxEnd:0.28, duration:0.42, isHeavy:true, knockback:3.2, causesKnockdown:false };
      this.vx = this.dir * 8.0;
      if (window.soundManager) window.soundManager.playBladeSlash(false);
    } else {
      this.currentAttackData = { type:'punch', damage:0, hitStun:0, reach:0, hitboxStart:99, hitboxEnd:99, duration:0.36, isHeavy:false, knockback:0 };
      this.hasHitCurrentAttack = true;
      if (window.soundManager) window.soundManager.playBladeSlash(true);
      setTimeout(() => { if (window.particleManager) window.particleManager.addProjectile(this, this.root.position.x*60+640+this.dir*60, 468, this.dir, 'lightning'); }, 80);
    }
  }
  startSuper(opponent) {
    this.meter = 0; this.state = 'SUPER'; this.stateTimer = 0;
    if (window.soundManager) { window.soundManager.playSuper(); window.soundManager.speak('LIGHTNING OVERDRIVE!'); }
    if (window.threeEngine) { window.threeEngine.cinematicMode = true; setTimeout(() => { if (window.threeEngine) window.threeEngine.cinematicMode = false; }, 1500); }
    this.currentAttackData = { type:'punch', damage:338, hitStun:46, reach:3.4, hitboxStart:0.12, hitboxEnd:1.05, duration:1.5, isHeavy:true, knockback:5.5, causesKnockdown:true };
    setTimeout(() => { if (window.particleManager) window.particleManager.createHitSparks(this.root.position.x*60+640, 455, '#00d2ff', 50); }, 230);
    if (navigator.vibrate) navigator.vibrate([60,20,100,20,60]);
  }
}
window.Aavon3D = Aavon3D;