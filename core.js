// ── CORE.JS ── Shared canvas, input, Vim state, settings ──────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = 800;
const H = 600;

const keys = {}, prevKeys = {};

let vimMode         = 'NORMAL';
let cmdBuffer       = '';
let cmdInput        = '';
let cmdTimer        = 0;
let modeFlash       = '-- NORMAL --  Welcome to VIM ARCADE';
let modeFlashTimer  = 180;
let screenFlash     = 0;
let chargeLevel     = 0;
let insertAutoShoot = 0;

// ── Game settings (persisted to localStorage) ─────────────────
const gameSettings = (function() {
  const DEFAULTS = {
    showCmdPanel:   true,
    showInputDisp:  true,
    showKbd:        true,
    showHints:      true,
  };
  let s = Object.assign({}, DEFAULTS);
  try {
    const saved = JSON.parse(localStorage.getItem('vimarcade_settings') || '{}');
    Object.assign(s, saved);
  } catch(e) {}

  function save() {
    try { localStorage.setItem('vimarcade_settings', JSON.stringify(s)); } catch(e) {}
  }
  function get(k)    { return s[k]; }
  function set(k, v) { s[k] = v; save(); applyToUI(); }
  function applyToUI() {
    const chkCmd   = document.getElementById('chk-cmdpanel');
    const chkInput = document.getElementById('chk-inputdisp');
    const chkKbd   = document.getElementById('chk-kbd');
    const chkHints = document.getElementById('chk-hints');
    const kbdEl    = document.getElementById('kbd-display');
    if (chkCmd)   chkCmd.checked   = s.showCmdPanel;
    if (chkInput) chkInput.checked = s.showInputDisp;
    if (chkKbd)   chkKbd.checked   = s.showKbd;
    if (chkHints) chkHints.checked = s.showHints;
    if (kbdEl)    kbdEl.classList.toggle('hidden', !s.showKbd);
  }
  return { get: get, set: set, applyToUI: applyToUI };
})();
// expose globally for vimman.js
window.gameSettings = gameSettings;

// ── Keyboard visualizer ────────────────────────────────────────
function _updateKbdKey(code, pressed) {
  const el = document.querySelector('[data-code="' + code + '"]');
  if (el) el.classList.toggle('active', pressed);
}

// ── Input helpers ─────────────────────────────────────────────
function updateInput() {
  Object.assign(prevKeys, keys);
  if (cmdTimer > 0) { cmdTimer--; } else { cmdBuffer = ''; }
  if (modeFlashTimer > 0) modeFlashTimer--;
  if (insertAutoShoot > 0) insertAutoShoot--;
  if (screenFlash > 0) screenFlash--;
  if (vimMode === 'VISUAL') chargeLevel = Math.min(100, chargeLevel + 1);
}

function pressed(k)     { return !!keys[k]; }
function justPressed(k) { return !!keys[k] && !prevKeys[k]; }

function isLeft()  { return vimMode !== 'COMMAND' && (pressed('ArrowLeft')  || pressed('KeyH')); }
function isRight() { return vimMode !== 'COMMAND' && (pressed('ArrowRight') || pressed('KeyL')); }
function isUp()    { return vimMode !== 'COMMAND' && (pressed('ArrowUp')    || pressed('KeyK')); }
function isDown()  { return vimMode !== 'COMMAND' && (pressed('ArrowDown')  || pressed('KeyJ')); }

function isJump() {
  if (vimMode === 'COMMAND') return false;
  return justPressed('KeyK') || justPressed('Space') || justPressed('ArrowUp');
}
function isShoot() {
  if (vimMode === 'COMMAND') return false;
  if (vimMode === 'INSERT') {
    if (insertAutoShoot <= 0) { insertAutoShoot = 10; return true; }
    return false;
  }
  return justPressed('KeyX');
}
function isEnter() { return justPressed('Enter'); }

function addFlash(msg) { modeFlash = msg; modeFlashTimer = 180; }

function setMode(m) {
  vimMode = m;
  if (m === 'NORMAL')       modeFlash = '-- NORMAL --';
  else if (m === 'INSERT')  modeFlash = '-- INSERT --';
  else if (m === 'VISUAL')  modeFlash = '-- VISUAL -- (charge up, Esc/d=fire)';
  else if (m === 'COMMAND') modeFlash = ':';
  modeFlashTimer = 120;
  if (m !== 'VISUAL')  chargeLevel = 0;
  if (m !== 'COMMAND') cmdInput = '';
  if (m === 'INSERT')  insertAutoShoot = 15;
}

// ── Game registry ─────────────────────────────────────────────
const _gameModules = {};
function registerGame(name, mod) { _gameModules[name] = mod; }

// ── Vim statusline ────────────────────────────────────────────
function drawVimStatusline() {
  const SY = H - 28;
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,20,0.88)';
  ctx.fillRect(0, SY, W, 28);

  const modeColor = vimMode === 'INSERT'  ? '#aaff44'
                  : vimMode === 'VISUAL'  ? '#cc88ff'
                  : vimMode === 'COMMAND' ? '#ffcc44'
                  : '#5588ff';
  ctx.fillStyle = modeColor;
  ctx.fillRect(0, SY, 4, 28);

  if (vimMode === 'COMMAND') {
    ctx.fillStyle = '#ffee88';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(':' + cmdInput + (Math.floor(Date.now() / 300) % 2 === 0 ? '█' : ''), 10, SY + 18);
  } else {
    if (modeFlashTimer > 0) {
      const alpha = Math.min(1, modeFlashTimer / 30);
      ctx.fillStyle = vimMode === 'INSERT' ? `rgba(170,255,68,${alpha})`
                    : vimMode === 'VISUAL' ? `rgba(200,136,255,${alpha})`
                    : `rgba(120,160,255,${alpha})`;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(modeFlash, 10, SY + 17);
    }
    if (cmdBuffer.length > 0) {
      ctx.fillStyle = '#ffff88';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(cmdBuffer, W - 10, SY + 17);
    }
  }
}

// ── Canvas focus ──────────────────────────────────────────────
canvas.setAttribute('tabindex', '0');
canvas.style.outline = 'none';
canvas.addEventListener('click', function() { canvas.focus(); });
window.addEventListener('load', function() {
  canvas.focus();
  gameSettings.applyToUI();
  _initToolbar();
});

// ── Toolbar button wiring ─────────────────────────────────────
function _initToolbar() {
  // Home button
  const btnHome = document.getElementById('btn-home');
  if (btnHome) {
    btnHome.addEventListener('click', function() {
      setMode('NORMAL');
      if (typeof switchGame === 'function') switchGame('menu');
      canvas.focus();
    });
  }

  // Settings button
  const btnSettings = document.getElementById('btn-settings');
  const settingsPanel = document.getElementById('settings-panel');
  if (btnSettings && settingsPanel) {
    btnSettings.addEventListener('click', function() {
      settingsPanel.classList.toggle('hidden');
      canvas.focus();
    });
    document.getElementById('btn-close-settings').addEventListener('click', function() {
      settingsPanel.classList.add('hidden');
      canvas.focus();
    });
    // Close on backdrop click
    settingsPanel.addEventListener('click', function(e) {
      if (e.target === settingsPanel) { settingsPanel.classList.add('hidden'); canvas.focus(); }
    });
  }

  // Keyboard toggle button
  const btnKbd = document.getElementById('btn-kbd-toggle');
  const kbdEl  = document.getElementById('kbd-display');
  if (btnKbd && kbdEl) {
    btnKbd.addEventListener('click', function() {
      const v = !gameSettings.get('showKbd');
      gameSettings.set('showKbd', v);
      btnKbd.classList.toggle('active', v);
      canvas.focus();
    });
    btnKbd.classList.toggle('active', gameSettings.get('showKbd'));
  }

  // Settings checkboxes
  function wireChk(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function() {
      gameSettings.set(key, el.checked);
      canvas.focus();
    });
  }
  wireChk('chk-cmdpanel',  'showCmdPanel');
  wireChk('chk-inputdisp', 'showInputDisp');
  wireChk('chk-kbd',       'showKbd');
  wireChk('chk-hints',     'showHints');

  // Reset XP
  const btnResetXP = document.getElementById('btn-reset-xp');
  if (btnResetXP) {
    btnResetXP.addEventListener('click', function() {
      if (confirm('VimXPとスキルとセーブデータをリセットしますか？')) {
        try { localStorage.removeItem('vimarcade_save'); localStorage.removeItem('vimarcade_v3_save'); } catch(e) {}
        if (window.resetSave) window.resetSave();
        location.reload();
      }
    });
  }
}

// ── Keydown listener ──────────────────────────────────────────
window.addEventListener('keydown', function(e) {
  const GC = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
    'KeyH','KeyJ','KeyK','KeyL','KeyX','KeyW','KeyB','KeyS','KeyR','KeyU',
    'KeyI','KeyV','KeyA','KeyG','KeyF','KeyN','KeyP','KeyZ','KeyD','KeyY','KeyC',
    'Semicolon','Slash','Escape','Backspace','Enter',
    'Digit0','Digit1','Digit2','Digit3','Digit4','Digit5']);
  if (GC.has(e.code) || vimMode === 'COMMAND') e.preventDefault();
  keys[e.code] = true;

  // Update keyboard visualizer
  _updateKbdKey(e.code, true);
  // Also highlight Shift key when shift is held
  if (e.shiftKey) _updateKbdKey('ShiftLeft', true);

  // Dispatch to active game's key handler first
  if (window._vimKeyHandler) window._vimKeyHandler(e);

  // Global COMMAND mode handler
  if (vimMode === 'COMMAND') {
    _handleCommandKey(e);
    return;
  }

  // Global Escape
  if (e.code === 'Escape') {
    setMode('NORMAL');
    return;
  }

  // Mode switches (in NORMAL)
  if (vimMode === 'NORMAL') {
    if (e.code === 'Semicolon' && e.shiftKey) { setMode('COMMAND'); return; }
    if (e.code === 'KeyI' || e.code === 'KeyA') { setMode('INSERT'); return; }
    if (e.code === 'KeyV') { setMode('VISUAL'); return; }
  }
});

window.addEventListener('keyup', function(e) {
  keys[e.code] = false;
  _updateKbdKey(e.code, false);
  if (!e.shiftKey) _updateKbdKey('ShiftLeft', false);
  if (vimMode === 'INSERT' && insertAutoShoot <= 0) insertAutoShoot = 8;
});

function _handleCommandKey(e) {
  if (e.code === 'Escape')    { setMode('NORMAL'); return; }
  if (e.code === 'Enter')     {
    if (window._cmdLineHandler) window._cmdLineHandler(cmdInput);
    setMode('NORMAL');
    return;
  }
  if (e.code === 'Backspace') { cmdInput = cmdInput.slice(0, -1); return; }
  // Skip ':' so entering command mode doesn't prepend a colon to cmdInput
  if (e.key.length === 1 && e.key !== ':') cmdInput += e.key;
}
