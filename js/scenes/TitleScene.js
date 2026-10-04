// Title & Mode Selection Scene
class TitleScene {
  constructor(game) {
    this.game = game;
    this.banner = new Image();
    this.banner.src = './assets/images/title_banner.jpg';
    this.bannerLoaded = false;
    this.banner.onload = () => { this.bannerLoaded = true; };

    this.selectedMode = 0; // 0: VS CPU, 1: 2 PLAYERS, 2: PRACTICE
    this.modes = [
      { id: 'cpu', label: '1P VS CPU', desc: 'Single player battle against smart AI' },
      { id: 'pvp', label: '2 PLAYERS', desc: 'Local 2-player battle on same device' },
      { id: 'practice', label: 'TRAINING', desc: 'Practice combos with infinite health' }
    ];

    this.animTimer = 0;
  }

  enter() {
    this.animTimer = 0;
    window.inputManager.showTouchControls(false);
  }

  update(dt) {
    this.animTimer += dt;
    const input = window.inputManager.getPlayerState(1);

    if (window.inputManager.isKeyJustPressed('ArrowUp') || window.inputManager.isKeyJustPressed('KeyW')) {
      this.selectedMode = (this.selectedMode - 1 + this.modes.length) % this.modes.length;
      window.soundManager.playPunch(false);
    }
    if (window.inputManager.isKeyJustPressed('ArrowDown') || window.inputManager.isKeyJustPressed('KeyS')) {
      this.selectedMode = (this.selectedMode + 1) % this.modes.length;
      window.soundManager.playPunch(false);
    }
    if (window.inputManager.isKeyJustPressed('Enter') || window.inputManager.isKeyJustPressed('Space') || input.justPressed.punch) {
      this.startGame();
    }
  }

  startGame() {
    window.soundManager.init();
    window.soundManager.playBladeSlash(true);
    this.game.mode = this.modes[this.selectedMode].id;
    this.game.changeScene('select');
  }

  handleClick(clickX, clickY) {
    // Check mode buttons
    const btnW = 320;
    const btnH = 50;
    const startX = 640 - btnW / 2;
    const startY = 440;

    for (let i = 0; i < this.modes.length; i++) {
      const y = startY + i * 65;
      if (clickX >= startX && clickX <= startX + btnW && clickY >= y && clickY <= y + btnH) {
        this.selectedMode = i;
        this.startGame();
        return;
      }
    }
  }

  render(ctx) {
    const w = 1280;
    const h = 720;

    // Dark cyber backdrop
    ctx.fillStyle = '#06040a';
    ctx.fillRect(0, 0, w, h);

    // Title banner image
    if (this.bannerLoaded) {
      ctx.drawImage(this.banner, 0, 0, w, h);
      // Dark overlay at bottom for menu legibility
      const grad = ctx.createLinearGradient(0, 360, 0, h);
      grad.addColorStop(0, 'rgba(6, 4, 10, 0.4)');
      grad.addColorStop(1, 'rgba(6, 4, 10, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 360, w, h - 360);
    }

    // Dynamic Title Glow
    const pulse = 1.0 + Math.sin(this.animTimer * 4) * 0.05;
    ctx.save();
    ctx.translate(w / 2, 210);
    ctx.scale(pulse, pulse);
    ctx.textAlign = 'center';

    ctx.font = '900 68px Teko, Orbitron, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 25;
    ctx.fillText('SHAFIN BLADE FIGHTER', 0, 0);

    ctx.font = '700 22px Orbitron, sans-serif';
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.fillText('— ULTIMATE SHOWDOWN —', 0, 40);
    ctx.restore();

    // Mode Buttons
    const btnW = 320;
    const btnH = 50;
    const startX = w / 2 - btnW / 2;
    const startY = 440;

    for (let i = 0; i < this.modes.length; i++) {
      const mode = this.modes[i];
      const y = startY + i * 65;
      const isSelected = this.selectedMode === i;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = 'linear-gradient(135deg, #ffd700, #ff8800)';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255, 200, 0, 0.85)';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
      } else {
        ctx.fillStyle = 'rgba(25, 20, 35, 0.8)';
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
        ctx.lineWidth = 1;
      }

      // Rounded button box
      ctx.beginPath();
      ctx.roundRect(startX, y, btnW, btnH, 8);
      ctx.fill();
      ctx.stroke();

      // Button text
      ctx.font = '700 20px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(mode.label, w / 2, y + 33);

      ctx.restore();
    }

    // Controls prompt at bottom
    ctx.font = '14px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK / TAP TO PLAY • DESKTOP: WASD + JKL / ARROWS • MOBILE: TOUCH D-PAD', w / 2, h - 30);
  }
}

window.TitleScene = TitleScene;