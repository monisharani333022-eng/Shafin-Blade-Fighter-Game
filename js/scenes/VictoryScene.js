// VictoryScene.js — Win / Lose screen with Rematch & Menu
class VictoryScene {
  constructor(game) {
    this.game   = game;
    this.timer  = 0;
    this.cards  = {};
    ['shafin','nafis','tamim','hamza','aavon'].forEach(id => {
      const img = new Image(); img.src = `./assets/images/${id}_card.png`;
      this.cards[id] = img;
    });
  }

  enter() {
    this.timer = 0;
    window.soundManager.init();
    window.soundManager.stopBGM();
    window.inputManager.showTouchControls(false);
    const wName = this.game.winner ? this.game.winner.name : 'FIGHTER';
    setTimeout(() => window.soundManager.speak(wName + ' WINS!'), 400);
  }

  update(dt) { this.timer += dt; }

  render(ctx) {
    const W = 1280, H = 720;
    ctx.fillStyle = '#07050c'; ctx.fillRect(0, 0, W, H);

    // Radial glow
    const grd = ctx.createRadialGradient(W/2, H/2, 60, W/2, H/2, 700);
    grd.addColorStop(0, 'rgba(255,180,0,0.14)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // Winner card
    const wId = this.game.p1RoundWins >= 2 ? this.game.p1Fighter : this.game.p2Fighter;
    const lId = this.game.p1RoundWins >= 2 ? this.game.p2Fighter : this.game.p1Fighter;
    const wCard = this.cards[wId];
    const lCard = this.cards[lId];

    // Loser card dimmed left
    if (lCard && lCard.complete) {
      ctx.save(); ctx.globalAlpha = 0.35; ctx.filter = 'grayscale(80%)';
      ctx.drawImage(lCard, 60, 80, 280, 420); ctx.restore();
    }

    // Winner card bright right-center
    const wobble = Math.sin(this.timer * 4) * 4;
    if (wCard && wCard.complete) {
      ctx.save(); ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 40;
      ctx.drawImage(wCard, W/2 - 100, 55 + wobble, 320, 480);
      ctx.restore();
    }

    // WINNER banner
    ctx.save();
    ctx.font = '900 90px Teko, Orbitron, sans-serif';
    ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 22;
    ctx.fillText('WINNER!', W/2 + 60, 58);

    ctx.font = '700 34px Teko, Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 8;
    const wn = this.game.winner ? this.game.winner.name : '';
    ctx.fillText(wn, W/2 + 60, 100);
    ctx.restore();

    // Rounds won
    ctx.save();
    ctx.font = '700 18px Orbitron, sans-serif';
    ctx.fillStyle = '#aaa'; ctx.textAlign = 'center';
    ctx.fillText('ROUNDS WON: ' + Math.max(this.game.p1RoundWins, this.game.p2RoundWins) + ' / 2', W/2 + 60, 130);
    ctx.restore();

    // Buttons
    if (this.timer > 0.8) {
      this._drawBtn(ctx, W/2 + 60, 570, 220, 56, 'REMATCH', '#d63031', '#ffffff');
      this._drawBtn(ctx, W/2 + 60, 644, 220, 48, 'MAIN MENU', 'rgba(30,25,40,0.9)', '#aaa');
    }
  }

  _drawBtn(ctx, cx, cy, w, h, label, bg, fg) {
    ctx.save();
    ctx.fillStyle = bg;
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.shadowColor = '#000'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.roundRect(cx - w/2, cy - h/2, w, h, 10);
    ctx.fill(); ctx.stroke();
    ctx.font = '900 22px Teko, Orbitron, sans-serif';
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.shadowBlur = 0;
    ctx.fillText(label, cx, cy + 8);
    ctx.restore();
  }

  handleClick(x, y) {
    if (this.timer < 0.8) return;
    const W = 1280;
    const cx = W/2 + 60;

    // Rematch
    if (x >= cx - 110 && x <= cx + 110 && y >= 542 && y <= 598) {
      window.soundManager.init();
      window.soundManager.playPunch(false);
      this.game.changeScene('fight');
      return;
    }
    // Main Menu
    if (x >= cx - 110 && x <= cx + 110 && y >= 620 && y <= 668) {
      window.soundManager.init();
      this.game.changeScene('title');
    }
  }
}

window.VictoryScene = VictoryScene;