// Dynamic Camera with Screen Shake, Zoom & Slow-Motion Hit Stops
class Camera {
  constructor(canvasWidth = 1280, canvasHeight = 720) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.zoom = 1.0;
    this.targetZoom = 1.0;

    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    this.timeScale = 1.0;
    this.freezeFrames = 0;
  }

  shake(duration = 0.25, intensity = 8) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  hitStop(frames = 4) {
    this.freezeFrames = frames;
  }

  slowMotion(scale = 0.25, duration = 1.5) {
    this.timeScale = scale;
    setTimeout(() => {
      this.timeScale = 1.0;
    }, duration * 1000);
  }

  update(dt, p1, p2) {
    // Check freeze frames
    if (this.freezeFrames > 0) {
      this.freezeFrames--;
      return true; // indicates frame is frozen
    }

    // Screen Shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const decay = Math.max(0, this.shakeDuration);
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity * (decay + 0.5);
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity * (decay + 0.5);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    if (!p1 || !p2) return false;

    // Track midpoint between fighters
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    // Constrain camera bounds
    this.targetX = Math.max(480, Math.min(800, midX));
    this.targetY = 360;

    // Dynamic zoom based on distance
    const dist = Math.abs(p1.x - p2.x);
    if (dist < 320) {
      this.targetZoom = 1.12; // zoom in on close combat
    } else if (dist > 750) {
      this.targetZoom = 0.92; // zoom out when far apart
    } else {
      this.targetZoom = 1.0;
    }

    // Smooth lerp
    this.x += (this.targetX - this.x) * 6 * dt;
    this.y += (this.targetY - this.y) * 6 * dt;
    this.zoom += (this.targetZoom - this.zoom) * 5 * dt;

    return false;
  }

  apply(ctx) {
    ctx.save();
    // Center of canvas
    ctx.translate(this.width / 2 + this.shakeOffsetX, this.height / 2 + this.shakeOffsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx) {
    ctx.restore();
  }
}

window.Camera = Camera;