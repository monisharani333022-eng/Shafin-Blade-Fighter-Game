// Professional Mobile & Desktop Input Manager with Virtual Analog Joystick & Multi-Touch
class InputManager {
  constructor() {
    this.keys = {};
    this.prevKeys = {};

    this.touchState = {
      up: false, down: false, left: false, right: false,
      punch: false, blade: false, kick: false, block: false,
      special: false, super: false
    };
    this.prevTouchState = { ...this.touchState };

    this.touchEnabled = true;
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };

    this.initKeyboard();
    this.initTouchJoystick();
    this.initActionButtons();

    // Auto-enable touch controls on mobile or touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024) {
      this.showTouchControls(true);
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  initTouchJoystick() {
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    const base = document.getElementById('joystick-base');
    if (!zone || !knob || !base) return;

    const resetJoystick = () => {
      this.joystickActive = false;
      this.joystickTouchId = null;
      this.touchState.up = false;
      this.touchState.down = false;
      this.touchState.left = false;
      this.touchState.right = false;
      knob.style.transform = 'translate(0px, 0px)';
      knob.classList.remove('active');
    };

    const handleJoystickMove = (clientX, clientY) => {
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const maxDist = rect.width * 0.42;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      knob.classList.add('active');

      // Deadzone threshold
      const threshold = 18;
      this.touchState.left = dx < -threshold;
      this.touchState.right = dx > threshold;
      this.touchState.up = dy < -threshold;
      this.touchState.down = dy > threshold;
    };

    // Touch events
    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystickActive) return;
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;
      this.joystickActive = true;
      handleJoystickMove(touch.clientX, touch.clientY);
      if (navigator.vibrate) navigator.vibrate(10);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.joystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          handleJoystickMove(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (!this.joystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          resetJoystick();
          break;
        }
      }
    });

    window.addEventListener('touchcancel', (e) => {
      if (!this.joystickActive) return;
      resetJoystick();
    });

    // Mouse support for testing joystick on desktop
    let isMouseDown = false;
    zone.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      handleJoystickMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) handleJoystickMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        resetJoystick();
      }
    });
  }

  initActionButtons() {
    const bindBtn = (selector, actionKey) => {
      const el = document.querySelector(selector);
      if (!el) return;

      const onStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.touchState[actionKey] = true;
        el.classList.add('active');
        if (navigator.vibrate) navigator.vibrate(20);
      };

      const onEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.touchState[actionKey] = false;
        el.classList.remove('active');
      };

      el.addEventListener('touchstart', onStart, { passive: false });
      el.addEventListener('touchend', onEnd, { passive: false });
      el.addEventListener('touchcancel', onEnd, { passive: false });

      el.addEventListener('mousedown', onStart);
      el.addEventListener('mouseup', onEnd);
      el.addEventListener('mouseleave', onEnd);
    };

    bindBtn('.btn-punch', 'punch');
    bindBtn('.btn-blade', 'blade');
    bindBtn('.btn-kick', 'kick');
    bindBtn('.btn-block', 'block');
    bindBtn('.btn-special', 'special');
    bindBtn('.btn-super', 'super');
  }

  showTouchControls(show) {
    this.touchEnabled = show;
    const el = document.getElementById('touch-controls');
    if (el) {
      el.style.display = show ? 'flex' : 'none';
    }
  }

  toggleTouchControls() {
    this.showTouchControls(!this.touchEnabled);
    return this.touchEnabled;
  }

  update() {
    this.prevKeys = { ...this.keys };
    this.prevTouchState = { ...this.touchState };
  }

  isKeyJustPressed(code) {
    return !!this.keys[code] && !this.prevKeys[code];
  }

  isTouchJustPressed(key) {
    return !!this.touchState[key] && !this.prevTouchState[key];
  }

  getPlayerState(playerNum = 1) {
    let gpState = { up: false, down: false, left: false, right: false, punch: false, blade: false, kick: false, block: false, special: false, super: false };
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[playerNum - 1];
    if (gp) {
      const threshold = 0.35;
      gpState.left = gp.axes[0] < -threshold || gp.buttons[14]?.pressed;
      gpState.right = gp.axes[0] > threshold || gp.buttons[15]?.pressed;
      gpState.up = gp.axes[1] < -threshold || gp.buttons[12]?.pressed;
      gpState.down = gp.axes[1] > threshold || gp.buttons[13]?.pressed;
      gpState.punch = !!gp.buttons[2]?.pressed;
      gpState.blade = !!gp.buttons[3]?.pressed;
      gpState.kick = !!gp.buttons[0]?.pressed;
      gpState.block = !!gp.buttons[4]?.pressed || !!gp.buttons[6]?.pressed;
      gpState.special = !!gp.buttons[5]?.pressed;
      gpState.super = !!gp.buttons[7]?.pressed;
    }

    if (playerNum === 1) {
      const up = !!this.keys['KeyW'] || this.touchState.up || gpState.up;
      const down = !!this.keys['KeyS'] || this.touchState.down || gpState.down;
      const left = !!this.keys['KeyA'] || this.touchState.left || gpState.left;
      const right = !!this.keys['KeyD'] || this.touchState.right || gpState.right;

      const punch = !!this.keys['KeyJ'] || this.touchState.punch || gpState.punch;
      const blade = !!this.keys['KeyK'] || this.touchState.blade || gpState.blade;
      const kick = !!this.keys['KeyL'] || this.touchState.kick || gpState.kick;
      const block = !!this.keys['KeyU'] || this.touchState.block || gpState.block;
      const special = !!this.keys['KeyI'] || this.touchState.special || gpState.special;
      const superMove = !!this.keys['KeyO'] || this.touchState.super || gpState.super;

      const punchJust = this.isKeyJustPressed('KeyJ') || this.isTouchJustPressed('punch');
      const bladeJust = this.isKeyJustPressed('KeyK') || this.isTouchJustPressed('blade');
      const kickJust = this.isKeyJustPressed('KeyL') || this.isTouchJustPressed('kick');
      const specialJust = this.isKeyJustPressed('KeyI') || this.isTouchJustPressed('special');
      const superJust = this.isKeyJustPressed('KeyO') || this.isTouchJustPressed('super');

      return {
        up, down, left, right,
        punch, blade, kick, block, special, super: superMove,
        justPressed: {
          punch: punchJust,
          blade: bladeJust,
          kick: kickJust,
          special: specialJust,
          super: superJust
        }
      };
    } else {
      const up = !!this.keys['ArrowUp'] || gpState.up;
      const down = !!this.keys['ArrowDown'] || gpState.down;
      const left = !!this.keys['ArrowLeft'] || gpState.left;
      const right = !!this.keys['ArrowRight'] || gpState.right;

      const punch = !!this.keys['Numpad1'] || !!this.keys['Digit7'] || gpState.punch;
      const blade = !!this.keys['Numpad2'] || !!this.keys['Digit8'] || gpState.blade;
      const kick = !!this.keys['Numpad3'] || !!this.keys['Digit9'] || gpState.kick;
      const block = !!this.keys['Numpad4'] || !!this.keys['Digit0'] || gpState.block;
      const special = !!this.keys['Numpad5'] || !!this.keys['Minus'] || gpState.special;
      const superMove = !!this.keys['Numpad6'] || !!this.keys['Equal'] || gpState.super;

      const punchJust = this.isKeyJustPressed('Numpad1') || this.isKeyJustPressed('Digit7');
      const bladeJust = this.isKeyJustPressed('Numpad2') || this.isKeyJustPressed('Digit8');
      const kickJust = this.isKeyJustPressed('Numpad3') || this.isKeyJustPressed('Digit9');
      const specialJust = this.isKeyJustPressed('Numpad5') || this.isKeyJustPressed('Minus');
      const superJust = this.isKeyJustPressed('Numpad6') || this.isKeyJustPressed('Equal');

      return {
        up, down, left, right,
        punch, blade, kick, block, special, super: superMove,
        justPressed: {
          punch: punchJust,
          blade: bladeJust,
          kick: kickJust,
          special: specialJust,
          super: superJust
        }
      };
    }
  }
}

window.inputManager = new InputManager();