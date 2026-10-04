// Sound Manager — Pure Web Audio API synthesis (no external files)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmInterval = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stopBGM();
    return this.isMuted;
  }

  // ── Helpers ─────────────────────────────────────────────────
  _osc(type, freq, gain, duration, freqEnd) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(now); o.stop(now + duration);
  }

  _noise(gain, duration, cutoff) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const sr  = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * duration, sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filt); filt.connect(g); g.connect(this.ctx.destination);
    src.start(now);
  }

  // ── Sound Effects ────────────────────────────────────────────
  playPunch(heavy = false) {
    this.init();
    this._osc('triangle', heavy ? 200 : 280, heavy ? 0.60 : 0.38, heavy ? 0.18 : 0.10, 28);
    this._noise(heavy ? 0.45 : 0.25, 0.06, heavy ? 700 : 1800);
  }

  playBladeSlash(heavy = false) {
    this.init();
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(heavy ? 900 : 1400, now);
    o.frequency.exponentialRampToValueAtTime(heavy ? 200 : 400, now + 0.22);
    g.gain.setValueAtTime(heavy ? 0.55 : 0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = heavy ? 800 : 1200;
    o.connect(filt); filt.connect(g); g.connect(this.ctx.destination);
    o.start(now); o.stop(now + 0.22);
    this._noise(heavy ? 0.5 : 0.3, 0.15, 3500);
  }

  playKick(heavy = false) {
    this.init();
    this._osc('triangle', heavy ? 160 : 220, heavy ? 0.55 : 0.35, heavy ? 0.22 : 0.14, 30);
    this._noise(0.3, 0.08, 1200);
  }

  playBlock() {
    this.init();
    this._osc('square', 420, 0.28, 0.12, 180);
    this._noise(0.35, 0.06, 2500);
  }

  playFireball() {
    this.init();
    this._osc('sawtooth', 320, 0.5, 0.28, 80);
    this._noise(0.4, 0.18, 1800);
  }

  playKO() {
    this.init();
    const now = this.ctx.currentTime;
    // Deep boom
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, now);
    o.frequency.exponentialRampToValueAtTime(18, now + 0.5);
    g.gain.setValueAtTime(0.9, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(now); o.stop(now + 0.55);
    this._noise(0.7, 0.4, 600);
    // Second crack
    setTimeout(() => { if (!this.isMuted) this._osc('sawtooth', 180, 0.6, 0.25, 30); }, 80);
  }

  playSuper() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.06, 0.12].forEach((off, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200 + i * 60, now + off);
      o.frequency.exponentialRampToValueAtTime(800, now + off + 0.4);
      g.gain.setValueAtTime(0.4, now + off);
      g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.4);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(now + off); o.stop(now + off + 0.4);
    });
    this._noise(0.6, 0.35, 4000);
  }

  speak(text) {
    if (this.isMuted) return;
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85; u.pitch = 0.85; u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch(e) {}
  }

  // ── Background Music ─────────────────────────────────────────
  startBGM() {
    if (this.isMuted || this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;
    this.bgmStep = 0;
    const BPM = 132;
    const stepMs = (60 / BPM / 2) * 1000;

    const bassNotes = [55, 55, 65, 55, 49, 49, 58, 49];
    let step = 0;

    this.bgmInterval = setInterval(() => {
      if (this.isMuted) return;
      const freq = bassNotes[step % bassNotes.length];
      this._osc('sawtooth', freq, 0.09, 0.18, freq * 0.9);
      if (step % 4 === 0) this._osc('square', 180, 0.06, 0.08, 100);
      if (step % 2 === 1) this._noise(0.06, 0.05, 800);
      step++;
    }, stepMs);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; }
  }
}

window.soundManager = new SoundManager();