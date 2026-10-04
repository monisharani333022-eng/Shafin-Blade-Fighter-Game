// Master Game Engine Loop & State Router
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual internal resolution (16:9 1280x720 standard HD)
    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.lastTime = 0;
    this.mode = 'cpu'; // cpu, pvp, practice
    this.p1Fighter = 'shafin';
    this.p2Fighter = 'nafis';
    this.winner = null;
    this.loser = null;

    // Scenes
    this.scenes = {
      title: new TitleScene(this),
      select: new SelectScene(this),
      versus: new VersusScene(this),
      fight: new FightScene(this),
      victory: new VictoryScene(this)
    };
    this.currentScene = this.scenes.title;

    this.initEvents();
  }

  changeScene(name) {
    if (this.scenes[name]) {
      this.currentScene = this.scenes[name];
      this.currentScene.enter();
    }
  }

  initEvents() {
    // Canvas click / tap translation
    const handlePointer = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      if (this.currentScene && this.currentScene.handleClick) {
        this.currentScene.handleClick(x, y);
      }
    };

    this.canvas.addEventListener('click', (e) => {
      handlePointer(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // UI Buttons
    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const muted = window.soundManager.toggleMute();
        btnMute.textContent = muted ? 'UNMUTE' : 'MUTE';
      });
    }

    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    const btnMoves = document.getElementById('btn-moves');
    const modalMoves = document.getElementById('modal-moves');
    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnMoves && modalMoves) {
      btnMoves.addEventListener('click', () => {
        modalMoves.style.display = 'flex';
      });
    }
    if (btnCloseModal && modalMoves) {
      btnCloseModal.addEventListener('click', () => {
        modalMoves.style.display = 'none';
      });
    }
  }

  start() {
    this.currentScene.enter();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    // Update
    if (this.currentScene) {
      this.currentScene.update(dt);
    }
    window.inputManager.update();

    // Render
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.currentScene) {
      this.currentScene.render(this.ctx);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.Game = Game;