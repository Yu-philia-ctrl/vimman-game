// ── MAIN.JS ── Must be loaded LAST ──────────────────────────

let currentGame = 'menu';
// _gameModules and registerGame are defined in core.js

function switchGame(name) {
  vimMode = 'NORMAL';
  cmdBuffer = '';
  cmdInput = '';
  currentGame = name;
  if (name === 'menu') {
    menuModule.init();
    // Restore home BGM — AudioContext is already running at this point
    if (window.GameAudio) window.GameAudio.playBGM('home');
  } else if (_gameModules[name]) {
    // Show interstitial ad between game transitions
    if (window.showInterstitial) window.showInterstitial();
    _gameModules[name].init();
  }
}

// Wire up the vim key handler to dispatch to active game
window._vimKeyHandler = function(e) {
  const mod = currentGame === 'menu' ? menuModule : _gameModules[currentGame];
  if (mod && mod.onKey) mod.onKey(e);
};

// Wire up canvas click to dispatch to active game module
canvas.addEventListener('click', function(e) {
  const mod = currentGame === 'menu' ? null : _gameModules[currentGame];
  if (mod && mod.onClick) {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (W / rect.width);
    const cy = (e.clientY - rect.top)  * (H / rect.height);
    mod.onClick(cx, cy);
  }
});

function gameLoop() {
  // NOTE: updateInput() MUST be at END so justPressed() works correctly.
  // (prevKeys must reflect the *previous* frame when update() checks keys)
  ctx.clearRect(0, 0, W, H);

  const mod = currentGame === 'menu' ? menuModule : _gameModules[currentGame];
  if (mod) { mod.update(); mod.draw(); }

  if (screenFlash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (screenFlash / 20) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  updateInput(); // ← MUST be last: copies keys→prevKeys after all checks
  requestAnimationFrame(gameLoop);
}

// Init audio (Web Audio API requires user gesture before playback)
if (window.GameAudio) {
  window.GameAudio.init();
  var _audioUnlocked = false;
  function _unlockAudio() {
    if (_audioUnlocked) return;
    _audioUnlocked = true;
    window.GameAudio.resume();
    // Small delay to let AudioContext.resume() settle, then start BGM
    setTimeout(function() {
      if (currentGame === 'menu') window.GameAudio.playBGM('home');
    }, 150);
  }
  document.addEventListener('click',   _unlockAudio);
  document.addEventListener('keydown',  _unlockAudio);
  document.addEventListener('touchstart', _unlockAudio);
}

menuModule.init();
requestAnimationFrame(gameLoop);
