// ============================================================
//  MEGA MAN – Browser Edition
//  Canvas 2D, no external assets
// ============================================================

// ── MAP (15 rows × 64 cols) ──────────────────────────────────
// 0=air  1=solid  2=spike
const MAP = (function () {
  const R = 15, C = 64;
  const m = [];
  for (let r = 0; r < R; r++) {
    m.push(new Array(C).fill(0));
  }

  // Ground row 14 – solid cols 0-52, gap 53-55, solid 56-63
  for (let c = 0; c <= 52; c++) m[14][c] = 1;
  for (let c = 56; c <= 63; c++) m[14][c] = 1;

  // Spikes row 13 cols 53-55
  for (let c = 53; c <= 55; c++) m[13][c] = 2;

  // Boss room ceiling row 0 cols 56-63
  for (let c = 56; c <= 63; c++) m[0][c] = 1;

  // Boss room walls col 56 rows 0-14, col 63 rows 0-14
  for (let r = 0; r <= 14; r++) {
    m[r][56] = 1;
  }

  // Floating platforms scattered through main level
  // Platform A: row 11, cols 4-7
  for (let c = 4; c <= 7; c++) m[11][c] = 1;
  // Platform B: row 9, cols 10-13
  for (let c = 10; c <= 13; c++) m[9][c] = 1;
  // Platform C: row 11, cols 16-19
  for (let c = 16; c <= 19; c++) m[11][c] = 1;
  // Platform D: row 8, cols 22-25
  for (let c = 22; c <= 25; c++) m[8][c] = 1;
  // Platform E: row 10, cols 28-31
  for (let c = 28; c <= 31; c++) m[10][c] = 1;
  // Platform F: row 12, cols 34-37
  for (let c = 34; c <= 37; c++) m[12][c] = 1;
  // Platform G: row 9, cols 40-43
  for (let c = 40; c <= 43; c++) m[9][c] = 1;
  // Platform H: row 11, cols 46-49
  for (let c = 46; c <= 49; c++) m[11][c] = 1;
  // Platform I: row 10, cols 52-55 (over the spike gap approach)
  for (let c = 51; c <= 52; c++) m[10][c] = 1;

  // Some elevated blocks for visual depth
  // Row 13 cols 2-3 (small step)
  m[13][2] = 1; m[13][3] = 1;
  // Row 13 cols 20-21
  m[13][20] = 1; m[13][21] = 1;
  // Row 13 cols 45-46
  m[13][45] = 1; m[13][46] = 1;

  return m;
})();

// ── CONSTANTS ────────────────────────────────────────────────
const CANVAS_W = 512;
const CANVAS_H = 480;
const TILE = 32;
const ROWS = MAP.length;       // 15
const COLS = MAP[0].length;    // 64

const GRAVITY    = 0.55;
const MAX_FALL   = 14;
const PLAYER_SPEED = 3.5;
const PLAYER_JUMP  = -11.5;
const BULLET_SPEED = 9;

// ── CANVAS SETUP ─────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── VIM INPUT SYSTEM ─────────────────────────────────────────
const keys = {}, prevKeys = {};

// Vim state
let vimMode        = 'NORMAL';  // NORMAL | INSERT | VISUAL | COMMAND
let cmdBuffer      = '';
let cmdInput       = '';
let cmdTimer       = 0;
let modeFlash      = '-- NORMAL --  :help for commands';
let modeFlashTimer = 180;
let chargeLevel    = 0;
let insertAutoShoot= 0;
let specialCD      = 0;
let undoActive     = 0;
let yankHealCD     = 0;
let screenFlash    = 0;
let highlightAll   = false;

function updateInput() {
  Object.assign(prevKeys, keys);
  if (cmdTimer > 0) { cmdTimer--; } else { cmdBuffer = ''; }
  if (modeFlashTimer > 0) modeFlashTimer--;
  if (specialCD > 0) specialCD--;
  if (undoActive > 0) undoActive--;
  if (yankHealCD > 0) yankHealCD--;
  if (insertAutoShoot > 0) insertAutoShoot--;
  if (screenFlash > 0) screenFlash--;
  if (vimMode === 'VISUAL') chargeLevel = Math.min(100, chargeLevel + 1);
}

function pressed(k)     { return !!keys[k]; }
function justPressed(k) { return !!keys[k] && !prevKeys[k]; }
function isEnter()      { return justPressed('Enter'); }

function isLeft()  { return vimMode !== 'COMMAND' && (pressed('ArrowLeft')  || pressed('KeyH')); }
function isRight() { return vimMode !== 'COMMAND' && (pressed('ArrowRight') || pressed('KeyL')); }
function isJump()  { return vimMode !== 'COMMAND' && (justPressed('KeyK') || justPressed('Space') || justPressed('ArrowUp')); }
function isDown()  { return vimMode !== 'COMMAND' && (pressed('KeyJ') || pressed('ArrowDown')); }
function isShoot() {
  if (vimMode === 'COMMAND') return false;
  if (vimMode === 'INSERT') { if (insertAutoShoot <= 0) { insertAutoShoot = 10; return true; } return false; }
  return justPressed('KeyX');
}

function setMode(m) {
  vimMode = m;
  modeFlash = m === 'NORMAL' ? '-- NORMAL --' : m === 'INSERT' ? '-- INSERT --' : m === 'VISUAL' ? '-- VISUAL -- (charge↑, d/Esc=fire)' : ':';
  modeFlashTimer = 120;
  if (m !== 'VISUAL')  chargeLevel = 0;
  if (m !== 'COMMAND') cmdInput    = '';
  if (m === 'INSERT')  insertAutoShoot = 15;
}
function addFlash(msg) { modeFlash = msg; modeFlashTimer = 180; }

window.addEventListener('keydown', e => {
  const GC = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
    'KeyH','KeyJ','KeyK','KeyL','KeyX','KeyW','KeyB','KeyS','KeyR','KeyU',
    'KeyI','KeyV','KeyA','KeyG','KeyF','KeyN','KeyP','KeyZ','KeyD','KeyY','KeyC',
    'Semicolon','Slash','Escape','Backspace','Enter','Digit0','Digit4']);
  if (GC.has(e.code) || vimMode === 'COMMAND') e.preventDefault();
  keys[e.code] = true;

  if (vimMode === 'COMMAND') { handleCommandKey(e); return; }

  if (e.code === 'Escape') {
    if (vimMode === 'VISUAL') execChargeShot();
    else setMode('NORMAL');
    return;
  }

  if (vimMode === 'NORMAL') {
    if (e.code === 'Semicolon' && e.shiftKey) { setMode('COMMAND'); return; }
    if (e.code === 'KeyI' || e.code === 'KeyA') { setMode('INSERT'); return; }
    if (e.code === 'KeyR' && e.shiftKey)  { setMode('INSERT'); insertAutoShoot = 5; addFlash('-- REPLACE MODE -- (rapid fire)'); return; }
    if (e.code === 'KeyV')                { setMode('VISUAL'); return; }

    if (e.code === 'KeyG' && e.shiftKey)        { execGotoEnd();       return; }
    if (e.code === 'KeyU' && !e.ctrlKey)        { execUndo();          return; }
    if (e.code === 'KeyW' && !e.ctrlKey)        { execWordDash(1);     return; }
    if (e.code === 'KeyB' && !e.ctrlKey)        { execWordDash(-1);    return; }
    if (e.code === 'KeyF' || e.code === 'KeyN') { execFindEnemy();     return; }
    if (e.code === 'KeyS' && !e.shiftKey)       { execSubstitute();    return; }
    if (e.code === 'KeyP' && !e.shiftKey)       { execPaste();         return; }
    if (e.code === 'Digit0')                    { execGotoLineStart(); return; }
    if (e.code === 'Digit4' && e.shiftKey)      { execGotoLineEnd();   return; }
    if (e.ctrlKey) {
      if (e.code === 'KeyF') { execCtrlF(); return; }
      if (e.code === 'KeyB') { execCtrlB(); return; }
      if (e.code === 'KeyU') { execCtrlU(); return; }
      if (e.code === 'KeyD') { execCtrlD(); return; }
    }

    const k = e.key;
    cmdBuffer += k; cmdTimer = 25;
    if (cmdBuffer.endsWith('dd'))   { execDD(); cmdBuffer = ''; return; }
    if (cmdBuffer.endsWith('yy'))   { execYY(); cmdBuffer = ''; return; }
    if (cmdBuffer.endsWith('gg'))   { execGG(); cmdBuffer = ''; return; }
    if (cmdBuffer.endsWith('cc'))   { execCC(); cmdBuffer = ''; return; }
    if (cmdBuffer.endsWith('dw'))   { execDW(); cmdBuffer = ''; return; }
    if (cmdBuffer.endsWith('ZZ'))   { execZZ(); cmdBuffer = ''; return; }
    if (cmdBuffer.match(/ci.$/))    { execCI(); cmdBuffer = ''; return; }
    if (cmdBuffer.length > 4) cmdBuffer = cmdBuffer.slice(-2);
  }

  if (vimMode === 'VISUAL' && (e.code === 'KeyD' || e.code === 'Enter')) execChargeShot();
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (vimMode === 'INSERT' && insertAutoShoot <= 0) insertAutoShoot = 8;
});

function handleCommandKey(e) {
  if (e.code === 'Escape')    { setMode('NORMAL'); return; }
  if (e.code === 'Enter')     { executeCommandLine(cmdInput); setMode('NORMAL'); return; }
  if (e.code === 'Backspace') { cmdInput = cmdInput.slice(0, -1); return; }
  if (e.key.length === 1)     cmdInput += e.key;
}

function executeCommandLine(cmd) {
  const c = cmd.trim();
  if (c === 'w')                                execCmdWrite();
  else if (c === 'q' || c === 'q!')             execCmdQuit();
  else if (c === 'wq' || c === 'x')            execCmdWQ();
  else if (c === 'vs' || c === 'sp')           execCmdSplit();
  else if (c === 'set hls')                    { highlightAll = true;  addFlash(':set hlsearch  -- BUGS HIGHLIGHTED'); }
  else if (c === 'noh')                        { highlightAll = false; addFlash(':noh  -- highlight cleared'); }
  else if (c.match(/^(set )?health=\d+$/))     { const v = +c.split('=')[1]; if (player) player.health = Math.min(player.maxHealth, v); addFlash(':set health=' + (player ? player.health : '?') + '  -- BUFFER REFILLED'); }
  else if (c === 'help')                       addFlash(':help  h/l:Move  k:Jump  x:Shoot  dd:Nuke  yy:+HP  gg:Top  G:End  u:Undo  w/b:Dash  s:JumpShoot  p:BothWay  v:Charge  :w:+BRANCH');
  else if (c === 'dd')                         execDD();
  else                                         addFlash('E492: Not an editor command: ' + c);
}

// ── SPECIAL MOVES ─────────────────────────────────────────────
function execUndo() {
  if (undoActive > 0 || !player || player.dead) return;
  undoActive = 90; player.invTimer = Math.max(player.invTimer, 90);
  spawnExplosion(player.x + player.w/2, player.y + player.h/2, 4);
  addFlash('u  ── UNDO!  90f invincibility (git revert HEAD)');  score += 10;
}
function execWordDash(dir) {
  if (!player || player.dead) return;
  player.vx = dir * PLAYER_SPEED * 2.5; player.facing = dir;
  spawnExplosion(player.x + player.w/2, player.y + player.h, 2);
  addFlash((dir > 0 ? 'w' : 'b') + '  ── ' + (dir > 0 ? 'WORD' : 'BACK') + ' DASH  x2.5 speed');
}
function execFindEnemy() {
  if (!player || player.dead) return;
  const alive = enemies.filter(e => !e.dead);
  if (!alive.length) { addFlash('f  ── Pattern not found  (no bugs remain!)'); return; }
  const near = alive.reduce((a, b) => Math.abs(a.x - player.x) < Math.abs(b.x - player.x) ? a : b);
  player.x = Math.max(0, near.x - 40);
  addFlash('f  ── /NullPtrException  FOUND BUG at col:' + Math.floor(near.x / TILE)); score += 5;
}
function execGotoLineStart() {
  if (!player || player.dead) return;
  player.x = cameraX + 32;
  addFlash('0  ── GOTO LINE START  (col 0)');
}
function execGotoLineEnd() {
  if (!player || player.dead) return;
  player.x = Math.min(cameraX + CANVAS_W - player.w - 40, COLS * TILE - player.w);
  addFlash('$  ── GOTO LINE END  (EOL)');
}
function execGotoEnd() {
  if (!player || player.dead) return;
  player.x = 50 * TILE; player.y = 12 * TILE;
  addFlash('G  ── GOTO EOF  (jumped to end of codebase)'); score += 20;
}
function execSubstitute() {
  if (!player || player.dead || specialCD > 0) return;
  if (player.onGround) player.vy = PLAYER_JUMP;
  player.isShooting = true; player.shootTimer = 1; specialCD = 10;
  addFlash('s  ── SUBSTITUTE!  jump+shoot combo');
}
function execPaste() {
  if (!player || player.dead || specialCD > 0) return;
  const by = player.y + 12;
  bullets.push(new Bullet(player.x + player.w, by,  BULLET_SPEED, 0, true));
  bullets.push(new Bullet(player.x - 8,        by, -BULLET_SPEED, 0, true));
  specialCD = 20; score += 5;
  addFlash('p  ── PASTE!  shoot both directions');
}
function execCtrlF() {
  if (!player || player.dead) return;
  player.vx = PLAYER_SPEED * 3; player.facing = 1;
  addFlash('^F  ── PAGE FORWARD!  speed burst →');
}
function execCtrlB() {
  if (!player || player.dead) return;
  player.vx = -PLAYER_SPEED * 3; player.facing = -1;
  addFlash('^B  ── PAGE BACK!  ← burst');
}
function execCtrlU() {
  if (!player || player.dead) return;
  if (player.onGround) player.vy = PLAYER_JUMP * 1.3;
  addFlash('^U  ── HALF PAGE UP!  SUPER JUMP');
}
function execCtrlD() {
  if (!player || player.dead) return;
  player.vy = MAX_FALL;
  addFlash('^D  ── HALF PAGE DOWN!  ground pound');
}
function execDD() {
  if (!player || player.dead || specialCD > 0) return;
  let killed = 0;
  enemies.forEach(e => {
    if (!e.dead && e.x > cameraX - 32 && e.x < cameraX + CANVAS_W + 32) {
      e.health = 0; e.dead = true;
      spawnExplosion(e.x + e.w/2, e.y + e.h/2, 6);
      killed++; score += 200;
    }
  });
  specialCD = 60; screenFlash = 8;
  addFlash('dd  ── DELETE LINE!  ' + killed + ' bugs nuked (git rm -f)');
}
function execYY() {
  if (!player || player.dead || yankHealCD > 0) return;
  player.health = Math.min(player.maxHealth, player.health + 6);
  yankHealCD = 120; score += 50;
  spawnExplosion(player.x + player.w/2, player.y, 3);
  addFlash('yy  ── YANK!  +6 HP yanked into buffer');
}
function execGG() {
  if (!player || player.dead) return;
  player.x = 2 * TILE; player.y = 12 * TILE; player.vx = 0; player.vy = 0; cameraX = 0;
  addFlash('gg  ── GOTO TOP  (git checkout HEAD~∞)'); score += 10;
}
function execCC() {
  if (!player || player.dead || specialCD > 0) return;
  const bx = player.facing === 1 ? player.x + player.w : player.x - 24;
  bullets.push(new BigBullet(bx, player.y + 8, player.facing * BULLET_SPEED * 0.8));
  specialCD = 45; score += 10;
  addFlash('cc  ── CHANGE CHANGE!  charge shot fired');
}
function execDW() {
  if (!player || player.dead || specialCD > 0) return;
  player.vx = player.facing * PLAYER_SPEED * 4;
  player.invTimer = Math.max(player.invTimer, 20);
  specialCD = 30; score += 15;
  addFlash('dw  ── DELETE WORD!  dash attack');
}
function execZZ() {
  if (!player || player.dead) return;
  lives = Math.min(lives + 1, 9); screenFlash = 5; score += 100;
  addFlash('ZZ  ── Quick write!  +1 BRANCH  (life saved)');
}
function execChargeShot() {
  if (!player || player.dead) return;
  const power = chargeLevel; chargeLevel = 0; setMode('NORMAL');
  if (power < 20) { addFlash('-- VISUAL --  need more charge! hold v longer'); return; }
  const count = Math.floor(power / 20);
  const bx = player.facing === 1 ? player.x + player.w : player.x - 8;
  for (let i = 0; i < count; i++)
    bullets.push(new Bullet(bx, player.y + 2 + i * 7, player.facing * BULLET_SPEED, 0, true));
  specialCD = 30; score += count * 10;
  addFlash('-- VISUAL --  CHARGE SHOT x' + count + '!  (visual block delete)');
}
function execCI() {
  if (!player || player.dead || specialCD > 0) return;
  const cx = player.x + player.w/2, cy = player.y + player.h/2;
  [[1,0],[-1,0],[0,-1],[0,1]].forEach(([dx,dy]) =>
    bullets.push(new Bullet(cx - 4, cy - 3, dx * BULLET_SPEED, dy * BULLET_SPEED * 0.7, true)));
  specialCD = 40; score += 20;
  addFlash('ci{  ── CHANGE INNER!  4-way shot');
}
function execCmdWrite() {
  lives = Math.min(lives + 1, 9); screenFlash = 8; score += 200;
  addFlash(':w  ── Written!  +1 BRANCH  (git stash save)');
}
function execCmdQuit() {
  addFlash(':q  ── Segmentation fault (core dumped)');
  if (player) { player.health = 0; player.dead = true; }
}
function execCmdWQ() {
  addFlash(':wq  ── git push origin main  -- PR MERGED!');
  gameState = 'stageclear'; stageEndTimer = 0; score += 1000;
}
function execCmdSplit() {
  let killed = 0;
  enemies.forEach(e => {
    if (!e.dead && e.x > cameraX - 32 && e.x < cameraX + CANVAS_W + 32) {
      e.health = 0; e.dead = true;
      spawnExplosion(e.x + e.w/2, e.y + e.h/2, 8);
      killed++; score += 300;
    }
  });
  screenFlash = 15;
  addFlash(':vs  ── VERTICAL SPLIT!  ' + killed + ' bugs obliterated');
}

// ── TILE HELPERS ─────────────────────────────────────────────
function tileAt(wx, wy) {
  const col = Math.floor(wx / TILE);
  const row = Math.floor(wy / TILE);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 0;
  return MAP[row][col];
}

function isSolid(wx, wy) {
  return tileAt(wx, wy) === 1;
}

function resolveX(obj) {
  const margin = 1;
  if (obj.vx > 0) {
    const rx = obj.x + obj.w;
    if (isSolid(rx, obj.y + margin) || isSolid(rx, obj.y + obj.h - margin)) {
      obj.x = Math.floor(rx / TILE) * TILE - obj.w;
      obj.vx = 0;
    }
  } else if (obj.vx < 0) {
    if (isSolid(obj.x, obj.y + margin) || isSolid(obj.x, obj.y + obj.h - margin)) {
      obj.x = Math.floor(obj.x / TILE) * TILE + TILE;
      obj.vx = 0;
    }
  }
}

function resolveY(obj) {
  const margin = 1;
  if (obj.vy > 0) {
    const by = obj.y + obj.h;
    if (isSolid(obj.x + margin, by) || isSolid(obj.x + obj.w - margin, by)) {
      obj.y = Math.floor(by / TILE) * TILE - obj.h;
      obj.vy = 0;
      obj.onGround = true;
    }
  } else if (obj.vy < 0) {
    if (isSolid(obj.x + margin, obj.y) || isSolid(obj.x + obj.w - margin, obj.y)) {
      obj.y = Math.floor(obj.y / TILE) * TILE + TILE;
      obj.vy = 0;
    }
  }
}

// ── COLLISION ────────────────────────────────────────────────
function overlaps(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// ── PARTICLES ────────────────────────────────────────────────
let particles = [];

function spawnExplosion(cx, cy, count = 5) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * -4 - 1,
      life: 40 + Math.random() * 20 | 0,
      maxLife: 60,
      color: Math.random() < 0.5 ? '#ffaa00' : '#ffdd44',
      size: 3 + Math.random() * 4 | 0
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.15;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

// ── BULLET ───────────────────────────────────────────────────
class Bullet {
  constructor(x, y, vx, vy, fromPlayer) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.fromPlayer = fromPlayer;
    this.dead = false;
    if (fromPlayer) {
      this.w = 8; this.h = 6;
    } else {
      this.w = 8; this.h = 8;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Off screen
    if (this.x < -32 || this.x > COLS * TILE + 32 ||
        this.y < -32 || this.y > ROWS * TILE + 32) {
      this.dead = true;
      return;
    }
    // Hits solid tile
    if (isSolid(this.x + this.w / 2, this.y + this.h / 2)) {
      this.dead = true;
    }
  }

  draw() {
    if (this.fromPlayer) {
      // Yellow plasma bolt
      ctx.fillStyle = '#ffee00';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x + 1, this.y + 1, 3, 2);
    } else {
      // Red enemy bullet
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#ff8866';
      ctx.fillRect(this.x + 1, this.y + 1, 3, 3);
    }
  }
}

// ── BIG BULLET ───────────────────────────────────────────────
class BigBullet extends Bullet {
  constructor(x, y, vx) {
    super(x, y, vx, 0, true);
    this.w = 22; this.h = 16;
  }
  draw() {
    ctx.fillStyle = '#00ffee';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 2, this.y + 2, 12, 8);
    ctx.fillStyle = '#88ffff';
    ctx.fillRect(this.x + 4, this.y + 5, 8, 4);
  }
}

// ── PLAYER ───────────────────────────────────────────────────
class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 20; this.h = 28;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.facing = 1; // 1=right -1=left
    this.health    = 28;
    this.maxHealth = 28;
    this.invTimer  = 0;
    this.shootTimer = 0;
    this.isShooting = false;
    this.animFrame = 0;
    this.animTimer = 0;
    this.dead = false;
    this.deathTimer = 120;
  }

  update() {
    if (this.dead) {
      this.deathTimer--;
      return;
    }

    if (this.invTimer  > 0) this.invTimer--;
    if (this.shootTimer > 0) this.shootTimer--;

    // Horizontal movement
    this.vx = 0;
    if (isLeft())  { this.vx = -PLAYER_SPEED; this.facing = -1; }
    if (isRight()) { this.vx =  PLAYER_SPEED; this.facing =  1; }

    // Jump
    if (isJump() && this.onGround) {
      this.vy = PLAYER_JUMP;
      this.onGround = false;
    }

    // Shoot
    this.isShooting = false;
    if (isShoot() && this.shootTimer <= 0) {
      this.isShooting = true;
      this.shootTimer = 15;
    }

    // Animation
    if (this.vx !== 0 && this.onGround) {
      this.animTimer++;
      if (this.animTimer >= 8) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 3; }
    } else {
      this.animFrame = 0; this.animTimer = 0;
    }

    // Fast fall (j / ArrowDown)
    if (isDown() && !this.onGround) this.vy = Math.min(this.vy + 3, MAX_FALL);

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    // Move + collide
    this.onGround = false;
    this.x += this.vx;
    resolveX(this);
    this.y += this.vy;
    resolveY(this);

    // Clamp to level width
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > COLS * TILE) { this.x = COLS * TILE - this.w; this.vx = 0; }
  }

  takeDamage(n) {
    if (this.invTimer > 0) return;
    this.health -= n;
    this.invTimer = 120;
    this.vy = -4;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
    }
  }

  draw() {
    if (this.dead) return;
    if (this.invTimer > 0 && Math.floor(this.invTimer / 4) % 2 === 0) return;

    // VISUAL mode charge glow
    if (vimMode === 'VISUAL' && chargeLevel > 10) {
      const g = Math.floor(chargeLevel * 2.5);
      ctx.save();
      ctx.shadowColor = `rgb(${g},255,255)`;
      ctx.shadowBlur  = 8 + chargeLevel / 5;
      ctx.fillStyle   = `rgba(0,255,255,${chargeLevel / 300})`;
      ctx.fillRect(this.x - 6, this.y - 6, this.w + 12, this.h + 12);
      ctx.restore();
    }

    ctx.save();
    // Flip for facing direction
    const cx = this.x + this.w / 2;
    ctx.translate(cx, this.y);
    if (this.facing === -1) ctx.scale(-1, 1);

    const shooting = this.shootTimer > 0;
    const inAir = !this.onGround;
    const frame = inAir ? -1 : this.animFrame;

    // Legs
    ctx.fillStyle = '#1a3aff';
    if (frame === -1) {
      // Jumping: legs together
      ctx.fillRect(-7, 18, 14, 10);
    } else if (frame === 1) {
      // Step right
      ctx.fillRect(-7, 18, 6, 10);
      ctx.fillRect(2, 16, 6, 12);
    } else if (frame === 2) {
      // Step left
      ctx.fillRect(-7, 16, 6, 12);
      ctx.fillRect(2, 18, 6, 10);
    } else {
      // Stand
      ctx.fillRect(-7, 18, 6, 10);
      ctx.fillRect(2, 18, 6, 10);
    }

    // Body
    ctx.fillStyle = '#2255ff';
    ctx.fillRect(-8, 8, 16, 12);

    // Arm cannon (right side always after flip)
    ctx.fillStyle = '#5599ff';
    if (shooting) {
      ctx.fillRect(5, 11, 10, 6);
      // Muzzle flash
      if (this.shootTimer > 8) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 10, 4, 8);
        ctx.fillStyle = '#ffff44';
        ctx.fillRect(15, 11, 3, 6);
      }
    } else {
      ctx.fillRect(5, 11, 7, 6);
    }

    // Left arm stub
    ctx.fillStyle = '#2255ff';
    ctx.fillRect(-12, 11, 5, 5);

    // Head
    ctx.fillStyle = '#55aaff';
    ctx.fillRect(-8, -4, 16, 14);

    // Helmet top (darker strip)
    ctx.fillStyle = '#1a3aff';
    ctx.fillRect(-8, -4, 16, 5);

    // Eye white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 0, 6, 5);
    // Pupil
    ctx.fillStyle = '#000033';
    ctx.fillRect(4, 1, 2, 3);

    ctx.restore();
  }
}

// ── MET ENEMY (type 0) ────────────────────────────────────────
class Met {
  constructor(x, y) {
    this.type = 0;
    this.x = x; this.y = y;
    this.w = 24; this.h = 24;
    this.vx = -1.5; this.vy = 0;
    this.onGround = false;
    this.health = 3;
    this.dead = false;
    this.state = 0; // 0=walk 1=hide
    this.stateTimer = 60 + Math.random() * 60 | 0;
    this.invTimer = 0;
  }

  update(player) {
    if (this.dead) return;
    if (this.invTimer > 0) this.invTimer--;

    this.stateTimer--;
    if (this.stateTimer <= 0) {
      if (this.state === 0) {
        this.state = 1;
        this.stateTimer = 90;
      } else {
        this.state = 0;
        this.stateTimer = 60 + Math.random() * 60 | 0;
      }
    }

    if (this.state === 1) {
      this.vx = 0;
    } else {
      // Walk toward player
      this.vx = player.x < this.x ? -1.5 : 1.5;
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    this.onGround = false;
    this.x += this.vx;
    resolveX(this);
    // Turn at walls
    if (this.vx !== 0) {
      const nextX = this.x + (this.vx > 0 ? this.w + 1 : -1);
      if (isSolid(nextX, this.y + this.h - 4) === false && this.onGround) {
        this.vx = -this.vx;
      }
    }
    this.y += this.vy;
    resolveY(this);
  }

  takeDamage(n) {
    if (this.invTimer > 0) return;
    this.health -= n;
    this.invTimer = 10;
    if (this.health <= 0) {
      this.dead = true;
      spawnExplosion(this.x + this.w / 2, this.y + this.h / 2, 6);
    }
  }

  draw() {
    if (this.dead) return;
    if (this.invTimer > 0 && Math.floor(this.invTimer / 2) % 2 === 0) return;

    if (this.state === 1) {
      // Hiding: just helmet
      ctx.fillStyle = '#884400';
      ctx.fillRect(this.x + 2, this.y + 10, 20, 14);
      ctx.fillStyle = '#cc6600';
      ctx.fillRect(this.x + 4, this.y + 8, 16, 6);
    } else {
      // Body
      ctx.fillStyle = '#cc3300';
      ctx.fillRect(this.x + 4, this.y + 12, 16, 12);
      // Helmet
      ctx.fillStyle = '#884400';
      ctx.fillRect(this.x + 2, this.y + 2, 20, 14);
      ctx.fillStyle = '#cc6600';
      ctx.fillRect(this.x + 4, this.y, 16, 6);
      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x + 8, this.y + 8, 8, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(this.x + 12, this.y + 9, 3, 4);
    }
  }
}

// ── BEE ENEMY (type 1) ───────────────────────────────────────
class Bee {
  constructor(x, y) {
    this.type = 1;
    this.x = x; this.y = y;
    this.startY = y;
    this.w = 20; this.h = 20;
    this.vx = -1.5; this.vy = 0;
    this.onGround = false;
    this.health = 2;
    this.dead = false;
    this.angle = 0;
    this.shootTimer = 40 + Math.random() * 40 | 0;
    this.invTimer = 0;
  }

  update(player, bullets) {
    if (this.dead) return;
    if (this.invTimer > 0) this.invTimer--;

    this.angle += 0.08;
    this.y = this.startY + Math.sin(this.angle) * 40;

    // Move toward player horizontally
    this.vx = player.x < this.x ? -1.5 : 1.5;
    this.x += this.vx;

    // Shoot at player
    this.shootTimer--;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (this.shootTimer <= 0 && dist < 200) {
      this.shootTimer = 80;
      const spd = 4;
      const nx = dx / dist;
      const ny = dy / dist;
      bullets.push(new Bullet(this.x + this.w / 2 - 4, this.y + this.h / 2 - 4,
                               nx * spd, ny * spd, false));
    }
  }

  takeDamage(n) {
    if (this.invTimer > 0) return;
    this.health -= n;
    this.invTimer = 10;
    if (this.health <= 0) {
      this.dead = true;
      spawnExplosion(this.x + this.w / 2, this.y + this.h / 2, 6);
    }
  }

  draw() {
    if (this.dead) return;
    if (this.invTimer > 0 && Math.floor(this.invTimer / 2) % 2 === 0) return;

    // Wings
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#aaddff';
    ctx.fillRect(this.x - 10, this.y + 4, 10, 12);
    ctx.fillRect(this.x + this.w, this.y + 4, 10, 12);
    ctx.globalAlpha = 1;

    // Body
    ctx.fillStyle = '#ddcc00';
    ctx.fillRect(this.x, this.y + 4, this.w, this.h - 4);
    // Stripes
    ctx.fillStyle = '#333300';
    ctx.fillRect(this.x, this.y + 8, this.w, 3);
    ctx.fillRect(this.x, this.y + 14, this.w, 3);
    // Head
    ctx.fillStyle = '#ddcc00';
    ctx.fillRect(this.x + 2, this.y, 16, 8);
    // Eye
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.x + 6, this.y + 2, 4, 4);
    ctx.fillRect(this.x + 12, this.y + 2, 4, 4);
  }
}

// ── TANK ENEMY (type 2) ──────────────────────────────────────
class Tank {
  constructor(x, y) {
    this.type = 2;
    this.x = x; this.y = y;
    this.w = 24; this.h = 24;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.health = 4;
    this.dead = false;
    this.shootTimer = 45 + Math.random() * 45 | 0;
    this.invTimer = 0;
  }

  update(player, bullets) {
    if (this.dead) return;
    if (this.invTimer > 0) this.invTimer--;

    // Gravity (land on ground)
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.onGround = false;
    this.y += this.vy;
    resolveY(this);

    // Shoot
    this.shootTimer--;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (this.shootTimer <= 0 && dist < 300) {
      this.shootTimer = 90;
      const dir = dx < 0 ? -1 : 1;
      bullets.push(new Bullet(this.x + (dir > 0 ? this.w : -8), this.y + 8,
                               dir * BULLET_SPEED * 0.8, 0, false));
    }
  }

  takeDamage(n) {
    if (this.invTimer > 0) return;
    this.health -= n;
    this.invTimer = 10;
    if (this.health <= 0) {
      this.dead = true;
      spawnExplosion(this.x + this.w / 2, this.y + this.h / 2, 8);
    }
  }

  draw() {
    if (this.dead) return;
    if (this.invTimer > 0 && Math.floor(this.invTimer / 2) % 2 === 0) return;

    // Body
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // Core
    ctx.fillStyle = '#882200';
    ctx.fillRect(this.x + 4, this.y + 4, 16, 16);
    // Cannon
    ctx.fillStyle = '#888888';
    ctx.fillRect(this.x + this.w, this.y + 8, 10, 8);
    // Tread
    ctx.fillStyle = '#555555';
    ctx.fillRect(this.x - 2, this.y + this.h - 6, this.w + 4, 6);
  }
}

// ── BOSS ─────────────────────────────────────────────────────
class Boss {
  constructor() {
    this.x = 61 * TILE - 24;
    this.y = 10 * TILE;
    this.w = 48; this.h = 56;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.health = 28;
    this.maxHealth = 28;
    this.dead = false;
    this.deathTimer = 180;
    this.invTimer = 0;
    this.jumpTimer = 90;
    this.shootTimer = 60;
    this.facing = -1; // faces player (left by default)
  }

  update(player, bullets) {
    if (this.dead) {
      this.deathTimer--;
      return;
    }
    if (this.invTimer > 0) this.invTimer--;

    // Face player
    this.facing = player.x < this.x ? -1 : 1;

    // Jump toward player
    this.jumpTimer--;
    if (this.jumpTimer <= 0 && this.onGround) {
      this.jumpTimer = 90;
      this.vy = PLAYER_JUMP * 0.8;
      this.vx = player.x < this.x ? -2.5 : 2.5;
      this.onGround = false;
    }

    // Shoot spread
    this.shootTimer--;
    if (this.shootTimer <= 0) {
      this.shootTimer = 60;
      const dx = player.x + player.w / 2 - (this.x + this.w / 2);
      const dy = player.y + player.h / 2 - (this.y + this.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const spd = 4;
      // Center shot
      bullets.push(new Bullet(this.x + this.w / 2 - 4, this.y + this.h / 2 - 4,
                               nx * spd, ny * spd, false));
      // Spread ±1.5 radians... no, spread in angle
      const baseAngle = Math.atan2(dy, dx);
      for (const spread of [-1.5, 1.5]) {
        const a = baseAngle + spread * 0.35;
        bullets.push(new Bullet(this.x + this.w / 2 - 4, this.y + this.h / 2 - 4,
                                 Math.cos(a) * spd, Math.sin(a) * spd, false));
      }
    }

    // Gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    this.onGround = false;
    this.x += this.vx;
    resolveX(this);
    this.y += this.vy;
    resolveY(this);

    // Constrain to boss arena (cols 57-62 roughly, col 56 is wall)
    const arenaLeft  = 57 * TILE;
    const arenaRight = 63 * TILE - this.w;
    if (this.x < arenaLeft)  { this.x = arenaLeft;  this.vx = 0; }
    if (this.x > arenaRight) { this.x = arenaRight; this.vx = 0; }
    // Ceiling constraint (row 0 solid)
    if (this.y < TILE) { this.y = TILE; this.vy = 0; }
  }

  takeDamage(n) {
    if (this.invTimer > 0) return;
    this.health -= n;
    this.invTimer = 30;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      spawnExplosion(this.x + this.w / 2, this.y + this.h / 2, 20);
    }
  }

  draw() {
    if (this.invTimer > 0 && Math.floor(this.invTimer / 4) % 2 === 0) return;

    const x = this.x, y = this.y;
    const W = this.w, H = this.h;

    ctx.save();
    if (this.facing === 1) {
      ctx.translate(x + W / 2, y);
      ctx.scale(-1, 1);
      ctx.translate(-(x + W / 2), -y);
    }

    // Death flash
    if (this.dead) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.deathTimer * 0.3);
    }

    // Legs
    ctx.fillStyle = '#aa22aa';
    ctx.fillRect(x + 4,  y + H - 14, 16, 14);
    ctx.fillRect(x + W - 20, y + H - 14, 16, 14);

    // Body
    ctx.fillStyle = '#dd44dd';
    ctx.fillRect(x, y + 16, W, H - 30);

    // Armor strips
    ctx.fillStyle = '#ff88ff';
    ctx.fillRect(x, y + 20, W, 4);
    ctx.fillRect(x, y + 34, W, 4);

    // Head
    ctx.fillStyle = '#dd44dd';
    ctx.fillRect(x + 4, y, W - 8, 20);

    // Helmet trim
    ctx.fillStyle = '#ff44ff';
    ctx.fillRect(x + 4, y, W - 8, 5);

    // Eyes (angry)
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(x + 8,  y + 7, 10, 8);
    ctx.fillRect(x + W - 18, y + 7, 10, 8);
    // Pupils
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 10, y + 9, 4, 5);
    ctx.fillRect(x + W - 14, y + 9, 4, 5);
    // Angry eyebrows
    ctx.fillStyle = '#220022';
    ctx.fillRect(x + 7,  y + 5, 12, 3);
    ctx.fillRect(x + W - 19, y + 5, 12, 3);

    // Mouth
    ctx.fillStyle = '#660066';
    ctx.fillRect(x + 12, y + 14, W - 24, 3);

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ── GAME STATE ───────────────────────────────────────────────
let gameState = 'title';
let score     = 0;
let lives     = 3;

let player    = null;
let enemies   = [];
let bullets   = [];
let boss      = null;
let bossTriggered = false;

let cameraX   = 0;
let stageIntroTimer = 120;
let stageEndTimer   = 0;
let blinkTimer      = 0;

// ── INIT STAGE ───────────────────────────────────────────────
function initStage() {
  player   = new Player(2 * TILE, 12 * TILE);
  bullets  = [];
  particles = [];
  enemies  = [];
  boss     = null;
  bossTriggered = false;
  cameraX  = 0;
  stageIntroTimer = 120;
  blinkTimer = 0;

  // Met enemies at row 13
  const metCols = [8, 18, 31, 44, 50];
  metCols.forEach(c => enemies.push(new Met(c * TILE, 13 * TILE - 24)));

  // Bee enemies
  const beeDefs = [[14, 6], [27, 4], [40, 5]];
  beeDefs.forEach(([c, r]) => enemies.push(new Bee(c * TILE, r * TILE)));

  // Tank enemies at row 12 (they fall to platforms)
  const tankCols = [22, 35, 48];
  tankCols.forEach(c => enemies.push(new Tank(c * TILE, 7 * TILE)));

  boss = new Boss();
}

// ── BACKGROUND STARS ─────────────────────────────────────────
const STARS = [];
for (let i = 0; i < 40; i++) {
  STARS.push({
    x: Math.random() * CANVAS_W,
    y: Math.random() * CANVAS_H * 0.7,
    r: Math.random() < 0.3 ? 2 : 1
  });
}

// ── DRAW BACKGROUND ──────────────────────────────────────────
function drawBackground() {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#000022');
  grad.addColorStop(1, '#001144');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars (parallax at 0.2)
  ctx.fillStyle = '#ffffff';
  STARS.forEach(s => {
    ctx.fillRect(
      ((s.x - cameraX * 0.2) % CANVAS_W + CANVAS_W) % CANVAS_W,
      s.y, s.r, s.r
    );
  });
}

// ── DRAW TILES ───────────────────────────────────────────────
function drawTiles() {
  const startCol = Math.max(0, Math.floor(cameraX / TILE));
  const endCol   = Math.min(COLS - 1, Math.ceil((cameraX + CANVAS_W) / TILE));

  for (let r = 0; r < ROWS; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const t = MAP[r][c];
      const sx = c * TILE - cameraX;
      const sy = r * TILE;

      if (t === 1) {
        // Base
        ctx.fillStyle = '#112266';
        ctx.fillRect(sx, sy, TILE, TILE);
        // Top highlight
        ctx.fillStyle = '#2244aa';
        ctx.fillRect(sx, sy, TILE, 4);
        // Bottom shadow
        ctx.fillStyle = '#0a1833';
        ctx.fillRect(sx, sy + TILE - 4, TILE, 4);
        // Grid seam
        ctx.fillStyle = '#0d1d55';
        ctx.fillRect(sx, sy, 1, TILE);
        ctx.fillRect(sx, sy, TILE, 1);
      } else if (t === 2) {
        // Spike background
        ctx.fillStyle = '#331100';
        ctx.fillRect(sx, sy, TILE, TILE);
        // 4 triangular spikes
        const sw = TILE / 4;
        ctx.fillStyle = '#ffaa00';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(sx + i * sw,       sy + TILE);
          ctx.lineTo(sx + i * sw + sw,  sy + TILE);
          ctx.lineTo(sx + i * sw + sw / 2, sy + 4);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
}

// ── HUD ──────────────────────────────────────────────────────
function drawHUD() {
  const barH = 100, barX = 8, barY = (CANVAS_H - barH) / 2 - 20;

  // "BUF" label (buffer = player HP)
  ctx.fillStyle = '#88aaff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
  ctx.fillText('BUF', barX + 8, barY - 6);
  ctx.fillStyle = '#111'; ctx.fillRect(barX, barY, 16, barH);
  ctx.strokeStyle = '#334477'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, 16, barH);
  const pct = player ? player.health / player.maxHealth : 0;
  const fillH = barH * pct;
  const hpColor = pct > 0.5 ? '#00dd44' : pct > 0.25 ? '#ffaa00' : '#ff2200';
  ctx.fillStyle = hpColor;
  ctx.fillRect(barX + 2, barY + barH - fillH, 12, fillH);

  // VISUAL charge bar
  if (vimMode === 'VISUAL') {
    const cx = barX + 20, cy = barY;
    ctx.fillStyle = '#111'; ctx.fillRect(cx, cy, 8, barH);
    ctx.strokeStyle = '#00ffff'; ctx.strokeRect(cx, cy, 8, barH);
    const ch = barH * chargeLevel / 100;
    ctx.fillStyle = `hsl(${180 - chargeLevel * 1.8},100%,60%)`;
    ctx.fillRect(cx + 1, cy + barH - ch, 6, ch);
    ctx.fillStyle = '#00ffff'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
    ctx.fillText('CHG', cx + 4, cy - 4);
  }

  // Boss: "LGTM" bar
  if (bossTriggered && boss && !boss.dead) {
    const bx = CANVAS_W - 24;
    ctx.fillStyle = '#ff8888'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('BUG', bx + 8, barY - 6);
    ctx.fillStyle = '#111'; ctx.fillRect(bx, barY, 16, barH);
    ctx.strokeStyle = '#774433'; ctx.strokeRect(bx, barY, 16, barH);
    const bfillH = barH * (boss.health / boss.maxHealth);
    ctx.fillStyle = '#dd2200';
    ctx.fillRect(bx + 2, barY + barH - bfillH, 12, bfillH);
  }

  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, CANVAS_W, 22);
  ctx.fillStyle = '#88aaff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
  ctx.fillText('LOC: ' + String(score).padStart(7,'0'), 36, 15);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#aaffaa';
  ctx.fillText('BRANCH:' + lives, CANVAS_W - 8, 15);
  if (bossTriggered && boss && !boss.dead) {
    ctx.fillStyle = '#ff8888'; ctx.textAlign = 'center';
    const lgtm = Math.floor(100 - (boss.health / boss.maxHealth * 100));
    ctx.fillText('LGTM:' + lgtm + '%', CANVAS_W/2, 15);
  }

  // Vim statusline (bottom)
  drawVimStatusline();
}

function drawVimStatusline() {
  const SY = CANVAS_H - 28;
  ctx.fillStyle = 'rgba(0,0,20,0.85)'; ctx.fillRect(0, SY, CANVAS_W, 28);

  // Mode indicator color
  const modeColor = vimMode === 'INSERT'  ? '#aaff44'
                  : vimMode === 'VISUAL'  ? '#cc88ff'
                  : vimMode === 'COMMAND' ? '#ffcc44'
                  : '#5588ff';

  // Left: mode box
  ctx.fillStyle = modeColor; ctx.fillRect(0, SY, 4, 28);

  if (vimMode === 'COMMAND') {
    // Command input line
    ctx.fillStyle = '#ffee88'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
    ctx.fillText(':' + cmdInput + (Math.floor(Date.now()/300)%2===0?'█':''), 10, SY + 18);
  } else {
    // Flash message
    if (modeFlashTimer > 0) {
      const alpha = Math.min(1, modeFlashTimer / 30);
      ctx.fillStyle = `rgba(${vimMode==='INSERT'?'170,255,68':vimMode==='VISUAL'?'200,136,255':'120,160,255'},${alpha})`;
      ctx.font = '12px monospace'; ctx.textAlign = 'left';
      ctx.fillText(modeFlash, 10, SY + 17);
    }
    // Command buffer (right side)
    if (cmdBuffer.length > 0) {
      ctx.fillStyle = '#ffff88'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'right';
      ctx.fillText(cmdBuffer, CANVAS_W - 10, SY + 17);
    }
  }

  // Right: col indicator style
  ctx.fillStyle = modeColor; ctx.font = '10px monospace'; ctx.textAlign = 'right';
  if (player) ctx.fillText('Col:' + Math.floor(player.x / TILE), CANVAS_W - 60, SY + 26);
}

// ── TITLE SCREEN ─────────────────────────────────────────────
function drawTitle() {
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#000022');
  grad.addColorStop(1, '#001155');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars
  ctx.fillStyle = '#ffffff';
  STARS.forEach(s => { ctx.fillRect(s.x, s.y, s.r, s.r); });

  // MEGA MAN title with glow
  ctx.save();
  ctx.shadowColor = '#ff8800';
  ctx.shadowBlur  = 20;
  ctx.fillStyle = '#ffdd00';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MEGA MAN', CANVAS_W / 2, 90);
  ctx.restore();

  // Japanese subtitle
  ctx.fillStyle = '#88ccff';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ロックマン', CANVAS_W / 2, 122);

  // Small pixel Mega Man drawing
  const px = CANVAS_W / 2 - 16, py = 150;
  // Legs
  ctx.fillStyle = '#1a3aff';
  ctx.fillRect(px + 4, py + 28, 8, 10);
  ctx.fillRect(px + 16, py + 28, 8, 10);
  // Body
  ctx.fillStyle = '#2255ff';
  ctx.fillRect(px, py + 14, 28, 16);
  // Arm
  ctx.fillStyle = '#5599ff';
  ctx.fillRect(px + 28, py + 18, 10, 6);
  ctx.fillRect(px - 8, py + 18, 8, 5);
  // Head
  ctx.fillStyle = '#55aaff';
  ctx.fillRect(px + 2, py, 24, 16);
  ctx.fillStyle = '#1a3aff';
  ctx.fillRect(px + 2, py, 24, 5);
  // Eye
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px + 16, py + 6, 8, 6);
  ctx.fillStyle = '#000033';
  ctx.fillRect(px + 20, py + 7, 3, 4);

  // Vim subtitle
  ctx.fillStyle = '#44ff88';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('── VIM EDITION ── IT Gamification Mode', CANVAS_W / 2, 200);

  // Vim controls grid
  const controls = [
    ['h/l', 'Move  ←→'],['k / Space', 'Jump'],['j', 'Fast Fall'],['x', 'Shoot'],
    ['w / b', 'Dash fwd/back'],['s', 'Jump+Shoot'],['p', 'BothWay Shot'],
    ['v', 'Charge Shot'],['u', 'Undo (Invincible)'],
    ['dd', 'Nuke Screen'],['yy', '+6 HP Heal'],['gg', 'Go to Start'],
    ['G', 'Go to End'],['cc', 'Big Shot'],['dw', 'Dash Attack'],
    ['ZZ', '+1 Life'],['ci{', '4-Way Shot'],
    [':w', '+1 BRANCH'],  [':vs', 'Split Screen Nuke'],[':wq', 'Skip to Clear'],
    ['^u', 'Super Jump'],['^d', 'Ground Pound'],
  ];
  ctx.font = '10px monospace';
  const cols = 3, rows = Math.ceil(controls.length / cols);
  const colW = 168, startX = 20, startY = 220;
  controls.forEach(([key, desc], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * colW, y = startY + row * 13;
    ctx.fillStyle = '#ffee44'; ctx.textAlign = 'left';
    ctx.fillText(key, x, y);
    ctx.fillStyle = '#aaaacc';
    ctx.fillText(' : ' + desc, x + 32, y);
  });

  blinkTimer++;
  if (Math.floor(blinkTimer / 30) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER  or  :wq  to  git checkout feature/level-1', CANVAS_W / 2, CANVAS_H - 14);
  }
}

// ── STAGE INTRO ──────────────────────────────────────────────
function drawStageIntro() {
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#44ff88'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
  const lines = [
    '$ git checkout -b feature/level-1',
    "Switched to a new branch 'feature/level-1'",
    '',
    '$ vim codebase.c',
    '',
    '  1  // WARNING: 11 critical bugs detected',
    '  2  // Boss: ProductionIncident active',
    '  3  // Status: CRITICAL',
    '',
    '-- NORMAL --                      :help for Vim commands',
  ];
  const t = 120 - stageIntroTimer;
  const visible = Math.floor(t / 10);
  lines.slice(0, visible).forEach((l, i) => {
    ctx.fillStyle = l.startsWith('$') ? '#ffee44' : l.includes('WARNING') ? '#ff8844' : l.includes('--') ? '#5588ff' : '#aaffaa';
    ctx.fillText(l, 24, 100 + i * 20);
  });
  if (t > lines.length * 10 + 10) {
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center';
    ctx.fillText('── START ──', CANVAS_W / 2, CANVAS_H - 60);
  }
}

// ── GAME OVER ────────────────────────────────────────────────
function drawGameOver() {
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.save();
  ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 24;
  ctx.fillStyle = '#ff2200'; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center';
  ctx.fillText('Segmentation fault', CANVAS_W / 2, CANVAS_H / 2 - 50);
  ctx.restore();
  ctx.fillStyle = '#ff6644'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
  ctx.fillText('(core dumped)', CANVAS_W / 2, CANVAS_H / 2 - 14);
  ctx.fillStyle = '#888888'; ctx.font = '12px monospace';
  ctx.fillText('LOC committed: ' + String(score).padStart(7,'0'), CANVAS_W/2, CANVAS_H/2 + 20);
  ctx.fillText("try:  vim debug.log  or  gdb ./megaman core", CANVAS_W/2, CANVAS_H/2 + 40);
  blinkTimer++;
  if (Math.floor(blinkTimer / 30) % 2 === 0) {
    ctx.fillStyle = '#ffaa44'; ctx.font = 'bold 13px monospace';
    ctx.fillText('ENTER  ──  git reset --hard  (retry)', CANVAS_W / 2, CANVAS_H - 24);
  }
}

// ── STAGE CLEAR ──────────────────────────────────────────────
function drawStageClear() {
  ctx.fillStyle = '#000011'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.save();
  ctx.shadowColor = '#44ff88'; ctx.shadowBlur = 24;
  ctx.fillStyle = '#44ff88'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
  ctx.fillText('PR MERGED! ✓', CANVAS_W / 2, 100);
  ctx.restore();
  const lines = [
    '$ git push origin feature/level-1',
    'Enumerating objects: 11 bugs fixed',
    'Writing objects: 100% (28/28)',
    '',
    '$ gh pr merge --squash',
    '✓  Pull request #1337 merged',
    '✓  Branch deleted',
    '',
    'Bugs eliminated:  11 / 11',
    'LOC committed:  ' + String(score).padStart(7,'0'),
    'Branches remaining:  ' + lives,
    '',
    '-- INSERT -- (you are a 10x Vimer)',
  ];
  ctx.font = '12px monospace'; ctx.textAlign = 'left';
  lines.forEach((l, i) => {
    ctx.fillStyle = l.startsWith('$') ? '#ffee44' : l.startsWith('✓') ? '#44ff88' : l.startsWith('--') ? '#5588ff' : '#aaaacc';
    ctx.fillText(l, 40, 160 + i * 17);
  });
  blinkTimer++;
  if (Math.floor(blinkTimer / 30) % 2 === 0) {
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText('ENTER  ──  git checkout main  (play again)', CANVAS_W / 2, CANVAS_H - 18);
  }
}

// ── CAMERA ───────────────────────────────────────────────────
function updateCamera() {
  let targetX;
  if (bossTriggered) {
    // Lock to boss room
    targetX = 56 * TILE - (CANVAS_W - 8 * TILE) / 2;
  } else {
    targetX = player.x - CANVAS_W / 2 + player.w / 2;
  }
  const maxCamX = COLS * TILE - CANVAS_W;
  targetX = Math.max(0, Math.min(maxCamX, targetX));
  cameraX += (targetX - cameraX) * 0.12;
}

// ── MAIN GAMEPLAY UPDATE ─────────────────────────────────────
function updateGameplay() {
  // Stage intro
  if (stageIntroTimer > 0) {
    stageIntroTimer--;
    return;
  }

  player.update();

  // Camera
  updateCamera();

  // Bullets
  bullets.forEach(b => b.update());
  bullets = bullets.filter(b => !b.dead);

  // Enemies
  enemies.forEach(e => {
    if (e instanceof Bee) e.update(player, bullets);
    else if (e instanceof Tank) e.update(player, bullets);
    else e.update(player);
  });

  // Spawn player bullet
  if (!player.dead && player.isShooting) {
    const bx = player.facing === 1
      ? player.x + player.w
      : player.x - 8;
    const by = player.y + 12;
    bullets.push(new Bullet(bx, by, player.facing * BULLET_SPEED, 0, true));
  }

  // Boss trigger
  if (!bossTriggered && player.x > 55 * TILE) {
    bossTriggered = true;
  }

  // Boss update
  if (bossTriggered && boss && !boss.dead) {
    boss.update(player, bullets);
  } else if (bossTriggered && boss && boss.dead) {
    boss.deathTimer--;
  }

  // ── Collision checks ───────────────────────────────────────

  if (!player.dead) {
    // Spike tile
    const spikeTile = tileAt(player.x + player.w / 2, player.y + player.h - 1);
    if (spikeTile === 2) {
      player.takeDamage(28);
    }

    // Fall into void
    if (player.y > ROWS * TILE) {
      player.takeDamage(28);
    }

    // Enemy bullets vs player
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.fromPlayer && overlaps(b, player)) {
        player.takeDamage(2);
        b.dead = true;
      }
    }

    // Enemy contact vs player
    enemies.forEach(e => {
      if (!e.dead && overlaps(e, player)) {
        player.takeDamage(3);
      }
    });

    // Boss contact
    if (bossTriggered && boss && !boss.dead && overlaps(boss, player)) {
      player.takeDamage(4);
    }
  }

  // Player bullets vs enemies
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b.fromPlayer) continue;
    const dmg = (b instanceof BigBullet) ? 3 : 1;
    // vs enemies
    enemies.forEach(e => {
      if (!e.dead && !b.dead && overlaps(b, e)) {
        e.takeDamage(dmg);
        if (!(b instanceof BigBullet)) b.dead = true;
        score += 100;
      }
    });
    // vs boss
    if (bossTriggered && boss && !boss.dead && !b.dead && overlaps(b, boss)) {
      boss.takeDamage(dmg);
      b.dead = true;
      score += 50;
      spawnExplosion(b.x, b.y, 3);
    }
  }

  // Particles
  updateParticles();

  // ── State transitions ──────────────────────────────────────

  // Boss dead
  if (bossTriggered && boss && boss.dead && boss.deathTimer <= 0) {
    score += 5000;
    gameState = 'stageclear';
    blinkTimer = 0;
    return;
  }

  // Player dead
  if (player.dead && player.deathTimer <= 0) {
    lives--;
    if (lives <= 0) {
      gameState = 'gameover';
      blinkTimer = 0;
    } else {
      initStage();
      gameState = 'gameplay';
    }
  }
}

// ── GAMEPLAY RENDER ──────────────────────────────────────────
function drawGameplay() {
  drawBackground();
  drawTiles();

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Enemies (with optional hlsearch highlight)
  if (highlightAll) {
    enemies.forEach(e => {
      if (!e.dead) {
        ctx.save();
        ctx.strokeStyle = '#ffff44'; ctx.lineWidth = 2;
        ctx.strokeRect(e.x - 2, e.y - 2, e.w + 4, e.h + 4);
        ctx.restore();
      }
    });
  }
  enemies.forEach(e => e.draw());

  // Boss
  if (bossTriggered && boss) boss.draw();

  // Bullets
  bullets.forEach(b => b.draw());

  // Particles
  drawParticles();

  // Player
  if (player) player.draw();

  ctx.restore();

  drawHUD();

  // Screen flash
  if (screenFlash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (screenFlash / 15) + ')';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Stage intro overlay
  if (stageIntroTimer > 0) {
    drawStageIntro();
  }
}

// ── MAIN LOOP ────────────────────────────────────────────────
function gameLoop() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  switch (gameState) {
    case 'title':
      drawTitle();
      if (isEnter()) {
        score = 0;
        lives = 3;
        initStage();
        gameState = 'gameplay';
      }
      break;

    case 'gameplay':
      updateGameplay();
      drawGameplay();
      break;

    case 'stageclear':
      drawStageClear();
      if (isEnter()) {
        score = 0;
        lives = 3;
        initStage();
        gameState = 'gameplay';
      }
      break;

    case 'gameover':
      drawGameOver();
      if (isEnter()) {
        score = 0;
        lives = 3;
        blinkTimer = 0;
        gameState = 'title';
      }
      break;
  }

  updateInput();
  requestAnimationFrame(gameLoop);
}

// ── START ────────────────────────────────────────────────────
requestAnimationFrame(gameLoop);
