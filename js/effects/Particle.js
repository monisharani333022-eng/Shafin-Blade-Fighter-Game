// Particle.js — Sparks, dust, damage numbers, projectiles
class Particle {
  constructor(x, y, vx, vy, color, size, life, type) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color; this.size = size;
    this.maxLife = life; this.life = life;
    this.type = type || 'spark';
    this.alpha = 1;
    this.text = '';
  }
  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
    if (this.type === 'spark')  { this.vy += 820 * dt; this.size = Math.max(0.5, this.size - dt * 3); }
    if (this.type === 'flame')  { this.vy -= 140 * dt; this.size += dt * 8; }
    if (this.type === 'ring')   { this.size += dt * 130; }
    if (this.type === 'dust')   { this.vx *= 0.92; this.size += dt * 14; }
    if (this.type === 'dmgtext'){ this.vy -= 90 * dt; }
  }
  render(ctx) {
    ctx.save(); ctx.globalAlpha = this.alpha;
    if (this.type === 'spark') {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
    } else if (this.type === 'ring') {
      ctx.strokeStyle = this.color; ctx.lineWidth = 2;
      ctx.shadowColor = this.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.stroke();
    } else if (this.type === 'dust') {
      ctx.fillStyle = 'rgba(200,180,140,' + (this.alpha * 0.35) + ')';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
    } else if (this.type === 'dmgtext') {
      ctx.font = '900 ' + this.size + 'px Teko, Orbitron, sans-serif';
      ctx.fillStyle = this.color; ctx.textAlign = 'center';
      ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
      ctx.fillText(this.text, this.x, this.y);
    } else if (this.type === 'flame') {
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      g.addColorStop(0, 'rgba(255,255,180,' + this.alpha + ')');
      g.addColorStop(0.5, this.color.replace(')', ',' + this.alpha + ')').replace('rgb','rgba'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

class ParticleManager {
  constructor() { this.particles = []; this.projectiles = []; }

  clear() { this.particles = []; this.projectiles = []; }

  // ── Factories ─────────────────────────────────────────────────
  createHitSparks(x, y, color, count) {
    for (let i = 0; i < (count || 14); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 260;
      const p = new Particle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed,
                             color, 3 + Math.random()*3, 0.35 + Math.random()*0.25, 'spark');
      this.particles.push(p);
    }
    // Shockwave ring
    const ring = new Particle(x, y, 0, 0, color, 8, 0.25, 'ring');
    this.particles.push(ring);
  }

  showDamageText(x, y, text, color) {
    const p = new Particle(x, y, (Math.random()-0.5)*40, -60, color, 32, 0.85, 'dmgtext');
    p.text = text;
    this.particles.push(p);
  }

  createDust(x, y, count) {
    for (let i = 0; i < (count || 6); i++) {
      const p = new Particle(x + (Math.random()-0.5)*30, y,
                             (Math.random()-0.5)*60, -30 - Math.random()*40,
                             '#c8b88a', 6 + Math.random()*8, 0.3 + Math.random()*0.2, 'dust');
      this.particles.push(p);
    }
  }

  addProjectile(owner, x, y, dir, type) {
    this.projectiles.push({ owner, x, y, dir, type,
      vx: dir * (type === 'lightning' ? 1100 : 750),
      life: 1.4, hit: false });
  }

  // ── Update / Render ───────────────────────────────────────────
  update(dt) {
    this.particles = this.particles.filter(p => { p.update(dt); return p.life > 0; });

    this.projectiles.forEach(proj => {
      proj.x += proj.vx * dt;
      proj.life -= dt;
    });
    this.projectiles = this.projectiles.filter(p => p.life > 0 && !p.hit);
  }

  render(ctx) {
    this.particles.forEach(p => p.render(ctx));

    // Render projectiles
    this.projectiles.forEach(proj => {
      ctx.save(); ctx.globalAlpha = 0.9;
      const col = proj.type === 'void'      ? '#9b59b6'
               :  proj.type === 'lightning'  ? '#00d2ff'
               :  proj.type === 'shockwave'  ? '#00e676'
               :                               '#ffd700';
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(proj.x, proj.y, 14, 0, Math.PI*2); ctx.fill();
      // Inner core
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(proj.x, proj.y, 5, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });
  }

  // Return projectiles so FightScene can test hits
  getProjectiles() { return this.projectiles; }
}

window.particleManager = new ParticleManager();