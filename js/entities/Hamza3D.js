class Hamza3D extends Fighter3D {
  constructor(scene, startX, dir) {
    super('HAMZA', scene, startX, dir, 0x00e676, './assets/images/hamza_avatar.png');
    this.subtitle = 'THE WARRIOR'; this.walkSpeed = 4.0;
    const gMat = new THREE.MeshStandardMaterial({ color:0x00e676, metalness:0.7, emissive:0x00c853, emissiveIntensity:0.7 });
    [this.rightArm.forearm, this.leftArm.forearm].forEach(f => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.36, 0.26), gMat); g.position.y = -0.22; f.add(g);
    });
  }
  startSpecial(skillNum, opponent) {
    this.state = 'SPECIAL'; this.stateTimer = 0; this.hasHitCurrentAttack = false;
    if (skillNum === 1) {
      this.currentAttackData = { type:'punch', damage:132, hitStun:32, reach:2.7, hitboxStart:0.08, hitboxEnd:0.35, duration:0.50, isHeavy:true, knockback:4.8, causesKnockdown:true };
      this.vx = this.dir * 5.5;
      if (window.soundManager) window.soundManager.playPunch(true);
    } else {
      this.currentAttackData = { type:'punch', damage:0, hitStun:0, reach:0, hitboxStart:99, hitboxEnd:99, duration:0.42, isHeavy:false, knockback:0 };
      this.hasHitCurrentAttack = true;
      if (window.soundManager) window.soundManager.playPunch(true);
      setTimeout(() => { if (window.particleManager) window.particleManager.addProjectile(this, this.root.position.x*60+640+this.dir*60, 475, this.dir, 'shockwave'); }, 100);
    }
  }
  startSuper(opponent) {
    this.meter = 0; this.state = 'SUPER'; this.stateTimer = 0;
    if (window.soundManager) { window.soundManager.playSuper(); window.soundManager.speak('TITAN WRATH!'); }
    if (window.threeEngine) { window.threeEngine.cinematicMode = true; setTimeout(() => { if (window.threeEngine) window.threeEngine.cinematicMode = false; }, 1600); }
    this.currentAttackData = { type:'punch', damage:348, hitStun:50, reach:3.5, hitboxStart:0.12, hitboxEnd:1.1, duration:1.5, isHeavy:true, knockback:6.0, causesKnockdown:true };
    setTimeout(() => { if (window.particleManager) window.particleManager.createHitSparks(this.root.position.x*60+640, 445, '#00e676', 52); }, 220);
    if (navigator.vibrate) navigator.vibrate([80,20,120,20,80]);
  }
}
window.Hamza3D = Hamza3D;