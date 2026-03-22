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
  } else if (_gameModules[name]) {
    _gameModules[name].init();
  }
}

// Wire up the vim key handler to dispatch to active game
window._vimKeyHandler = function(e) {
  const mod = currentGame === 'menu' ? menuModule : _gameModules[currentGame];
  if (mod && mod.onKey) mod.onKey(e);
};

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

// Init audio (resumes on user interaction per browser policy)
if (window.GameAudio) {
  window.GameAudio.init();
  document.addEventListener('click',  function(){ window.GameAudio.resume(); });
  document.addEventListener('keydown', function(){ window.GameAudio.resume(); });
}

menuModule.init();
requestAnimationFrame(gameLoop);
