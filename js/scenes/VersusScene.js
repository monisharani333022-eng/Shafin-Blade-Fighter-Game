// Dynamic 5-Fighter 2D Versus Face-Off Scene
class VersusScene {
  constructor(game) {
    this.game = game;
    this.timer = 0;

    this.fighters = {
      shafin: { name: 'SHAFIN', title: 'SPEED FIGHTER', color: '#ffd700', card: './assets/images/shafin_card.png' },
      nafis: { name: 'NAFIS', title: 'POWER FIGHTER', color: '#ff2233', card: './assets/images/nafis_card.png' },
      tamim: { name: 'TAMIM', title: 'THE SHADOW', color: '#9b59b6', card: './assets/images/tamim_card.png' },
      hamza: { name: 'HAMZA', title: 'THE WARRIOR', color: '#00e676', card: './assets/images/hamza_card.png' },
      aavon: { name: 'AAVON', title: 'THE STRIKER', color: '#00d2ff', card: './assets/images/aavon_card.png' }
    };

    this.cardImages = {};
    for (let id in this.fighters) {
      const img = new Image();
      img.src = this.fighters[id].card;
      this.cardImages[id] = img;
    }

    this.vsBadge = new Image();
    this.vsBadge.src = './assets/images/vs_badge.png';
  }

  enter() {
    this.timer = 0;
    window.soundManager.init();
    window.soundManager.playPunch(true);
    window.inputManager.showTouchControls(false);

    setTimeout(() => {
      window.soundManager.speak('ROUND ONE! FIGHT!');
    }, 400);
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= 2.2) {
      this.game.changeScene('fight');
    }
  }

  handleClick() {
    if (this.timer > 0.4) {
      this.game.changeScene('fight');
    }
  }

  render(ctx) {
    const w = 1280;
    const h = 720;

    ctx.fillStyle = '#060408';
    ctx.fillRect(0, 0, w, h);

    const p1 = this.fighters[this.game.p1Fighter] || this.fighters.shafin;
    const p2 = this.fighters[this.game.p2Fighter] || this.fighters.nafis;

    // Left Fighter (P1)
    const p1Offset = Math.max(0, (1 - this.timer * 3) * 600);
    ctx.save();
    ctx.translate(-p1Offset, 0);

    ctx.fillStyle = '#14121a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.55, 0);
    ctx.lineTo(w * 0.45, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    const p1Img = this.cardImages[this.game.p1Fighter];
    if (p1Img && p1Img.complete) {
      ctx.drawImage(p1Img, 60, 60, 420, 600);
    }

    ctx.font = '900 64px Teko, Orbitron, sans-serif';
    ctx.fillStyle = p1.color;
    ctx.shadowColor = p1.color;
    ctx.shadowBlur = 20;
    ctx.fillText(p1.name, 80, h - 80);
    ctx.font = '700 20px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p1.title, 85, h - 48);
    ctx.restore();

    // Right Fighter (P2)
    const p2Offset = Math.max(0, (1 - this.timer * 3) * 600);
    ctx.save();
    ctx.translate(p2Offset, 0);

    ctx.fillStyle = '#181014';
    ctx.beginPath();
    ctx.moveTo(w * 0.55, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(w * 0.45, h);
    ctx.closePath();
    ctx.fill();

    const p2Img = this.cardImages[this.game.p2Fighter];
    if (p2Img && p2Img.complete) {
      ctx.drawImage(p2Img, w - 480, 60, 420, 600);
    }

    ctx.font = '900 64px Teko, Orbitron, sans-serif';
    ctx.fillStyle = p2.color;
    ctx.shadowColor = p2.color;
    ctx.shadowBlur = 20;
    ctx.textAlign = 'right';
    ctx.fillText(p2.name, w - 80, h - 80);
    ctx.font = '700 20px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p2.title, w - 85, h - 48);
    ctx.restore();

    // Center VS Slam
    ctx.save();
    const slamScale = Math.max(1.0, 3.5 - this.timer * 6);
    ctx.translate(w / 2, h / 2);
    ctx.scale(slamScale, slamScale);
    if (this.vsBadge.complete && this.vsBadge.naturalWidth > 0) {
      ctx.drawImage(this.vsBadge, -100, -100, 200, 200);
    } else {
      ctx.font = '900 90px Teko, Orbitron, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 30;
      ctx.textAlign = 'center';
      ctx.fillText('VS', 0, 30);
    }
    ctx.restore();

    // Round 1 - FIGHT!
    if (this.timer > 0.8) {
      ctx.save();
      ctx.font = '900 56px Teko, Orbitron, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 25;
      ctx.textAlign = 'center';
      ctx.fillText('ROUND 1', w / 2, h / 2 + 150);
      ctx.font = '900 42px Teko, Orbitron, sans-serif';
      ctx.fillStyle = '#ff3300';
      ctx.fillText('FIGHT !', w / 2, h / 2 + 195);
      ctx.restore();
    }
  }
}

window.VersusScene = VersusScene;