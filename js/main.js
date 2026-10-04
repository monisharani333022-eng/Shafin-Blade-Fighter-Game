// Bootstrap and PWA Registration
window.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for offline PWA on Android and Desktop
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('Shafin Blade Fighter PWA Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.log('Service Worker registration skipped:', err);
    });
  }

  // Start Game Engine
  window.game = new Game();
  window.game.start();

  // First interaction unlock for Web Audio
  const unlockAudio = () => {
    window.soundManager.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
});