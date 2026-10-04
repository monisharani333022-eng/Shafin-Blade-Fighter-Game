// FighterAI.js — CPU Opponent with difficulty levels
class FighterAI {
  constructor(difficulty) {
    this.difficulty = difficulty || 'NORMAL';
    this.timer   = 0;
    this.decision = null;
    this.thinkInterval = difficulty === 'EASY' ? 0.60
                       : difficulty === 'HARD' ? 0.20 : 0.38;
    this.actionTimer = 0;
    this.currentAction = null;
  }

  update(dt, self, opponent) {
    this.timer       += dt;
    this.actionTimer += dt;

    const input = {
      up: false, down: false, left: false, right: false,
      punch: false, blade: false, kick: false, block: false,
      special: false, super: false,
      justPressed: { punch:false, blade:false, kick:false,
                     special:false, super:false }
    };

    if (!opponent || !self) return input;

    const dist = Math.abs(self.root.position.x - opponent.root.position.x);
    const onRight = self.root.position.x > opponent.root.position.x;

    // Think: pick a new action every thinkInterval seconds
    if (this.timer >= this.thinkInterval) {
      this.timer = 0;
      const roll = Math.random();
      const hp   = self.hp / self.maxHp;

      if (hp < 0.25) {
        // Low HP — block more or use super
        this.currentAction = roll < 0.35 ? 'block'
                           : roll < 0.50 ? 'super'
                           : roll < 0.70 ? 'retreat'
                           : 'approach';
      } else if (dist > 3.5) {
        this.currentAction = 'approach';
      } else if (dist < 1.8) {
        this.currentAction = roll < 0.15 ? 'block'
                           : roll < 0.45 ? 'punch'
                           : roll < 0.65 ? 'kick'
                           : roll < 0.80 ? 'blade'
                           : roll < 0.90 ? 'special'
                           : 'retreat';
      } else {
        this.currentAction = roll < 0.20 ? 'block'
                           : roll < 0.45 ? 'approach'
                           : roll < 0.60 ? 'punch'
                           : roll < 0.70 ? 'blade'
                           : roll < 0.80 ? 'kick'
                           : 'retreat';
      }
      this.actionTimer = 0;
    }

    // Execute current action
    switch (this.currentAction) {
      case 'approach':
        input.left  = onRight;
        input.right = !onRight;
        break;
      case 'retreat':
        input.left  = !onRight;
        input.right = onRight;
        break;
      case 'block':
        input.block = true;
        break;
      case 'punch':
        if (this.actionTimer < 0.12) input.justPressed.punch = true;
        else input.punch = true;
        break;
      case 'blade':
        if (this.actionTimer < 0.12) input.justPressed.blade = true;
        else input.blade = true;
        break;
      case 'kick':
        if (this.actionTimer < 0.12) input.justPressed.kick = true;
        else input.kick = true;
        break;
      case 'special':
        if (this.actionTimer < 0.12) input.justPressed.special = true;
        break;
      case 'super':
        if (self.meter >= 100 && this.actionTimer < 0.12)
          input.justPressed.super = true;
        break;
    }

    // Random jump to avoid projectiles
    if (Math.random() < 0.008) input.up = true;

    return input;
  }
}

window.FighterAI = FighterAI;