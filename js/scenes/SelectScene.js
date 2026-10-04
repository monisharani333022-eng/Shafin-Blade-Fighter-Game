// Expanded 5-Fighter Character Select Scene
class SelectScene {
  constructor(game) {
    this.game = game;

    this.fighters = [
      { id: 'shafin', name: 'SHAFIN', title: 'SPEED FIGHTER', color: '#ffd700', card: './assets/images/shafin_card.png', avatar: './assets/images/shafin_avatar.png', atk: 75, def: 60, spd: 95, skl: 80 },
      { id: 'nafis', name: 'NAFIS', title: 'POWER FIGHTER', color: '#ff2233', card: './assets/images/nafis_card.png', avatar: './assets/images/nafis_avatar.png', atk: 90, def: 95, spd: 55, skl: 70 },
      { id: 'tamim', name: 'TAMIM', title: 'THE SHADOW', color: '#9b59b6', card: './assets/images/tamim_card.png', avatar: './assets/images/tamim_avatar.png', atk: 75, def: 70, spd: 85, skl: 100 },
      { id: 'hamza', name: 'HAMZA', title: 'THE WARRIOR', color: '#00e676', card: './assets/images/hamza_card.png', avatar: './assets/images/hamza_avatar.png', atk: 95, def: 85, spd: 80, skl: 90 },
      { id: 'aavon', name: 'AAVON', title: 'THE STRIKER', color: '#00d2ff', card: './assets/images/aavon_card.png', avatar: './assets/images/aavon_avatar.png', atk: 85, def: 75, spd: 100, skl: 85 }
    ];

    this.p1Index = 0; // default Shafin
    this.p2Index = 1; // default Nafis
    this.selectingP2 = false;
    this.animTime = 0;

    // Preload card & avatar images
    this.images = {};
    this.fighters.forEach(f => {
      const c = new Image(); c.src = f.card; this.images[f.id + '_card'] = c;
      const a = new Image(); a.src = f.avatar; this.images[f.id + '_avatar'] = a;
    });

    this.vsBadge = new Image();
    this.vsBadge.src = './assets/images/vs_badge.png';
  }

  enter() {
    this.animTime = 0;
    this.selectingP2 = false;
    if (window.threeEngine) window.threeEngine.hide3D();
    window.inputManager.showTouchControls(false);
    window.soundManager.speak('CHOOSE YOUR FIGHTER!');
  }

  update(dt) {
    this.animTime += dt;

    if (window.inputManager.isKeyJustPressed('KeyA') || window.inputManager.isKeyJustPressed('ArrowLeft')) {
      if (this.game.mode === 'pvp' && this.selectingP2) {
        this.p2Index = (this.p2Index - 1 + this.fighters.length) % this.fighters.length;
      } else {
        this.p1Index = (this.p1Index - 1 + this.fighters.length) % this.fighters.length;
      }
      window.soundManager.playPunch(false);
    }
    if (window.inputManager.isKeyJustPressed('KeyD') || window.inputManager.isKeyJustPressed('ArrowRight')) {
      if (this.game.mode === 'pvp' && this.selectingP2) {
        this.p2Index = (this.p2Index + 1) % this.fighters.length;
      } else {
        this.p1Index = (this.p1Index + 1) % this.fighters.length;
      }
      window.soundManager.playPunch(false);
    }

    if (window.inputManager.isKeyJustPressed('Enter') || window.inputManager.isKeyJustPressed('Space')) {
      if (this.game.mode === 'pvp' && !this.selectingP2) {
        this.selectingP2 = true;
        window.soundManager.speak('PLAYER 2 CHOOSE!');
      } else {
        this.startFight();
      }
    }

    if (window.inputManager.isKeyJustPressed('Escape')) {
      this.game.changeScene('title');
    }
  }

  startFight() {
    window.soundManager.playBladeSlash(true);
    this.game.p1Fighter = this.fighters[this.p1Index].id;
    this.game.p2Fighter = this.fighters[this.p2Index].id;
    this.game.changeScene('versus');
  }

  handleClick(clickX, clickY) {
    // 1. Bottom Roster Cards Selection
    const rosterY = 560;
    const rosterW = 100;
    const rosterH = 100;
    const startX = 640 - (this.fighters.length * 115) / 2;

    for (let i = 0; i < this.fighters.length; i++) {
      const rx = startX + i * 115;
      if (clickX >= rx && clickX <= rx + rosterW && clickY >= rosterY && clickY <= rosterY + rosterH) {
        if (this.game.mode === 'pvp' && this.selectingP2) {
          this.p2Index = i;
        } else {
          this.p1Index = i;
          if (this.game.mode === 'cpu') {
            // Pick different CPU opponent automatically
            this.p2Index = (i + 1) % this.fighters.length;
          }
        }
        window.soundManager.playPunch(false);
        return;
      }
    }

    // 2. Back Button
    if (clickX >= 40 && clickX <= 160 && clickY >= 650 && clickY <= 700) {
      this.game.changeScene('title');
      return;
    }

    // 3. FIGHT Button
    if (clickX >= 1060 && clickX <= 1240 && clickY >= 640 && clickY <= 700) {
      this.startFight();
      return;
    }
  }

  render(ctx) {
    const w = 1280;
    const h = 720;

    // Dark cyberpunk arena background
    ctx.fillStyle = '#08060f';
    ctx.fillRect(0, 0, w, h);

    // Subtle dark city vignette
    const bgGrad = ctx.createRadialGradient(w / 2, 280, 50, w / 2, 280, 650);
    bgGrad.addColorStop(0, 'rgba(30, 20, 45, 0.6)');
    bgGrad.addColorStop(1, 'rgba(6, 4, 10, 0.98)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Header: "SELECT YOUR FIGHTER"
    ctx.save();
    ctx.font = '900 38px Teko, Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
    ctx.fillText('SELECT YOUR FIGHTER', 50, 50);

    ctx.font = '700 18px Orbitron, sans-serif';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'right';
    const statusText = this.game.mode === 'pvp' ? (this.selectingP2 ? 'PLAYER 2 SELECTING' : 'PLAYER 1 SELECTING') : '1P VS CPU';
    ctx.fillText(statusText, w - 50, 48);
    ctx.restore();

    const p1 = this.fighters[this.p1Index];
    const p2 = this.fighters[this.p2Index];

    // Left Fighter Display (P1)
    this.renderFighterDisplay(ctx, p1, 70, 80, true);

    // Right Fighter Display (P2)
    this.renderFighterDisplay(ctx, p2, w - 450, 80, false);

    // Center VS Badge
    const vsPulse = 1.0 + Math.sin(this.animTime * 6) * 0.06;
    ctx.save();
    ctx.translate(w / 2, 280);
    ctx.scale(vsPulse, vsPulse);
    if (this.vsBadge.complete && this.vsBadge.naturalWidth > 0) {
      ctx.drawImage(this.vsBadge, -60, -60, 120, 120);
    } else {
      ctx.font = '900 64px Teko, Orbitron, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 20;
      ctx.textAlign = 'center';
      ctx.fillText('VS', 0, 20);
    }
    ctx.restore();

    // Bottom 5-Fighter Roster Bar
    const rosterY = 545;
    const rosterW = 95;
    const rosterH = 95;
    const startX = w / 2 - (this.fighters.length * 110) / 2;

    for (let i = 0; i < this.fighters.length; i++) {
      const f = this.fighters[i];
      const rx = startX + i * 110;
      const isP1 = i === this.p1Index;
      const isP2 = i === this.p2Index;

      ctx.save();
      // Selection highlight box
      if (isP1 || isP2) {
        ctx.strokeStyle = isP1 ? '#ffd700' : '#ff2233';
        ctx.lineWidth = 3;
        ctx.shadowColor = isP1 ? '#ffd700' : '#ff2233';
        ctx.shadowBlur = 15;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
      }

      ctx.fillStyle = 'rgba(15, 15, 25, 0.9)';
      ctx.beginPath();
      ctx.roundRect(rx, rosterY, rosterW, rosterH, 8);
      ctx.fill();
      ctx.stroke();

      // Avatar image
      const av = this.images[f.id + '_avatar'];
      if (av && av.complete) {
        ctx.drawImage(av, rx + 4, rosterY + 4, rosterW - 8, rosterH - 24);
      }

      // Name label
      ctx.font = '700 11px Orbitron, sans-serif';
      ctx.fillStyle = f.color;
      ctx.textAlign = 'center';
      ctx.fillText(f.name, rx + rosterW / 2, rosterY + rosterH - 7);

      // P1 / P2 Badge
      if (isP1) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(rx + 4, rosterY + 4, 28, 16);
        ctx.fillStyle = '#000';
        ctx.font = '900 10px Orbitron, sans-serif';
        ctx.fillText('P1', rx + 18, rosterY + 16);
      }
      if (isP2) {
        ctx.fillStyle = '#ff2233';
        ctx.fillRect(rx + rosterW - 32, rosterY + 4, 28, 16);
        ctx.fillStyle = '#fff';
        ctx.font = '900 10px Orbitron, sans-serif';
        ctx.fillText(this.game.mode === 'pvp' ? 'P2' : 'CPU', rx + rosterW - 18, rosterY + 16);
      }

      ctx.restore();
    }

    // Bottom Navigation Buttons
    // BACK
    ctx.save();
    ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(40, 650, 120, 48, 6);
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 16px Orbitron, sans-serif';
    ctx.fillStyle = '#ccc';
    ctx.textAlign = 'center';
    ctx.fillText('BACK', 100, 680);

    // FIGHT BUTTON
    const fPulse = 1.0 + Math.sin(this.animTime * 8) * 0.05;
    ctx.translate(1150, 674);
    ctx.scale(fPulse, fPulse);
    ctx.fillStyle = '#d63031';
    ctx.strokeStyle = '#ff7675';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(-80, -24, 160, 48, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 26px Teko, Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText('FIGHT !', 0, 7);
    ctx.restore();
  }

  renderFighterDisplay(ctx, fighter, x, y, isLeft) {
    ctx.save();
    // Card Portrait with clearly visible face
    const cardImg = this.images[fighter.id + '_card'];
    if (cardImg && cardImg.complete) {
      ctx.save();
      ctx.shadowColor = fighter.color;
      ctx.shadowBlur = 25;
      ctx.drawImage(cardImg, x, y, 220, 330);
      ctx.restore();
    }

    // Name & Title
    const textX = isLeft ? x + 240 : x - 20;
    ctx.textAlign = isLeft ? 'left' : 'right';

    ctx.font = '900 48px Teko, Orbitron, sans-serif';
    ctx.fillStyle = fighter.color;
    ctx.shadowColor = fighter.color;
    ctx.shadowBlur = 15;
    ctx.fillText(fighter.name, textX, y + 45);

    ctx.font = '700 16px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillText(fighter.title, textX, y + 75);

    // Animated Stats Bars (Power, Speed, Defense, Skill)
    const stats = [
      { label: 'POWER', val: fighter.atk },
      { label: 'SPEED', val: fighter.spd },
      { label: 'DEFENSE', val: fighter.def },
      { label: 'SKILL', val: fighter.skl }
    ];

    const barStartX = isLeft ? textX : textX - 160;
    for (let s = 0; s < stats.length; s++) {
      const sy = y + 120 + s * 38;
      ctx.font = '700 11px Orbitron, sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.textAlign = isLeft ? 'left' : 'right';
      ctx.fillText(stats[s].label, isLeft ? barStartX : barStartX + 160, sy - 6);

      // Bar BG
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(barStartX, sy, 160, 10);

      // Bar Fill
      ctx.fillStyle = fighter.color;
      ctx.fillRect(barStartX, sy, 160 * (stats[s].val / 100), 10);
    }

    ctx.restore();
  }
}

window.SelectScene = SelectScene;