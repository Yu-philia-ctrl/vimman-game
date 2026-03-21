// ── INVADERS.JS ── VimInvaders game ─────────────────────────

const invadersGame = (function() {
  const INVADER_COLS = 8, INVADER_ROWS = 4;
  const INV_W = 40, INV_H = 28;
  const INV_SPACING_X = 52, INV_SPACING_Y = 44;
  const INV_START_X = 16, INV_START_Y = 52;

  const ROW_LABELS = [
    ['NULL','VOID','GOTO','BUG!','LEAK','LOOP','NaN!','ERR!'],
    ['SEGF','DEAD','RACE','HANG','HEAP','CORE','DUMP','BLOW'],
    ['CRIT','FAIL','DOWN','STOP','SLOW','LAG!','TOUT','DROP'],
    ['0x00','0xFF','0xDE','0xAD','0xBE','0xEF','0xCA','0xFE'],
  ];

  let invaders, groupX, groupY, groupDir, groupSpeed, groupDropAmt;
  let player, score, lives, wave;
  let playerBullets, enemyBullets;
  let barriers;
  let shieldActive, shieldTimer, shieldUsed;
  let shootTimer;
  let blinkTimer;
  let dead, waveClear;
  let waveClearTimer;
  let animFrame, animTimer;
  let burstCount, burstTimer;
  let cmdBuf, cmdTime;

  // 20 twinkle stars
  const STARS = [];
  for (let i = 0; i < 20; i++) {
    STARS.push({ x: Math.random()*512, y: Math.random()*480, phase: Math.random()*Math.PI*2 });
  }

  function makeBarrier(bx, by) {
    // 9x6 pixel grid of blocks (each block 8x6 px)
    const blocks = [];
    // Classic bunker shape: rows 0-5, cols 0-8; skip bottom-middle for arch
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 9; c++) {
        // Arch cutout: rows 4-5, cols 3-5
        if (r >= 4 && c >= 3 && c <= 5) continue;
        blocks.push({ r: r, c: c, hp: 3 });
      }
    }
    return { x: bx, y: by, blocks: blocks };
  }

  function init() {
    invaders = [];
    for (let r = 0; r < INVADER_ROWS; r++) {
      for (let c = 0; c < INVADER_COLS; c++) {
        invaders.push({ r: r, c: c, alive: true, label: ROW_LABELS[r][c] });
      }
    }
    groupX = 0; groupY = 0; groupDir = 1; groupSpeed = 0.4; groupDropAmt = 12;
    player = { x: W/2 - 16, y: H - 60, w: 32, h: 20 };
    score = 0; lives = 3; wave = 1;
    playerBullets = []; enemyBullets = [];
    barriers = [
      makeBarrier(40,  H-120),
      makeBarrier(150, H-120),
      makeBarrier(300, H-120),
      makeBarrier(410, H-120),
    ];
    shieldActive = false; shieldTimer = 0; shieldUsed = false;
    shootTimer = 0; blinkTimer = 0; dead = false; waveClear = false; waveClearTimer = 0;
    animFrame = 0; animTimer = 0;
    burstCount = 0; burstTimer = 0;
    cmdBuf = ''; cmdTime = 0;
    window._cmdLineHandler = handleCmdLine;
    addFlash('VimInvaders  -- h/l:Move  x:Shoot  w:Burst  dd:Bomb  :q!:Shield');
  }

  function handleCmdLine(cmd) {
    const c = cmd.trim();
    if (c === 'q!') {
      if (!shieldUsed) {
        shieldActive = true; shieldTimer = 300; shieldUsed = true;
        addFlash(':q!  -- SHIELD activated! 300f protection (once per wave)');
      } else {
        addFlash(':q!  -- Shield already used this wave');
      }
    } else {
      addFlash('E492: Not an editor command: ' + c);
    }
  }

  function aliveCount() {
    return invaders.filter(function(inv) { return inv.alive; }).length;
  }

  function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  }

  function update() {
    if (justPressed('Escape')) { switchGame('menu'); return; }
    if (dead) {
      blinkTimer++;
      if (isEnter()) init();
      return;
    }
    if (waveClear) {
      waveClearTimer++;
      if (waveClearTimer > 120) {
        wave++;
        groupSpeed = 0.4 + wave * 0.15;
        shieldUsed = false; shieldActive = false;
        invaders.forEach(function(inv) { inv.alive = true; });
        groupX = 0; groupY = 0; groupDir = 1;
        playerBullets = []; enemyBullets = [];
        waveClear = false; waveClearTimer = 0;
        addFlash('Wave ' + wave + '  -- git commit -m "Fixed more bugs"');
      }
      return;
    }

    if (cmdTime > 0) cmdTime--;
    else cmdBuf = '';

    // Shield timer
    if (shieldTimer > 0) shieldTimer--;
    else shieldActive = false;

    // Player movement
    if (isLeft())  player.x = Math.max(0, player.x - 4);
    if (isRight()) player.x = Math.min(W - player.w, player.x + 4);

    // Player shoot
    if (shootTimer > 0) shootTimer--;
    if (isShoot() && shootTimer <= 0 && playerBullets.length < 4) {
      playerBullets.push({ x: player.x + player.w/2 - 1, y: player.y, w: 2, h: 8, dead: false });
      shootTimer = 12;
    }

    // Burst: w key fires 3 shots quickly
    if (burstCount > 0) {
      burstTimer--;
      if (burstTimer <= 0 && playerBullets.length < 6) {
        playerBullets.push({ x: player.x + player.w/2 - 1, y: player.y, w: 2, h: 8, dead: false });
        burstCount--;
        burstTimer = 6;
      }
    }

    // Move invader group
    const alive = invaders.filter(function(inv) { return inv.alive; });
    if (alive.length === 0) { waveClear = true; return; }

    // Find leftmost and rightmost column of alive invaders
    const minC = Math.min.apply(null, alive.map(function(inv) { return inv.c; }));
    const maxC = Math.max.apply(null, alive.map(function(inv) { return inv.c; }));
    const left  = INV_START_X + groupX + minC * INV_SPACING_X;
    const right = INV_START_X + groupX + maxC * INV_SPACING_X + INV_W;
    const speedMod = 1 + (32 - alive.length) * 0.04;

    groupX += groupDir * groupSpeed * speedMod;
    if (groupDir > 0 && right >= W - 4) {
      groupDir = -1; groupY += groupDropAmt;
    } else if (groupDir < 0 && left <= 4) {
      groupDir = 1; groupY += groupDropAmt;
    }

    // Animate invaders
    animTimer++;
    if (animTimer >= 30) { animTimer = 0; animFrame = 1 - animFrame; }

    // Enemy shoots
    shootTimer = Math.max(0, shootTimer - 0);
    if (Math.random() < 1/120 && enemyBullets.length < 8) {
      // Random alive invader shoots
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      const sx = INV_START_X + groupX + shooter.c * INV_SPACING_X + INV_W/2 - 1;
      const sy = INV_START_Y + groupY + shooter.r * INV_SPACING_Y + INV_H;
      enemyBullets.push({ x: sx, y: sy, w: 3, h: 8, vx: 0, vy: 3, dead: false });
    }

    // Update player bullets
    for (let i = playerBullets.length-1; i >= 0; i--) {
      const b = playerBullets[i];
      b.y -= 8;
      if (b.y < 0) { b.dead = true; }
      if (b.dead) { playerBullets.splice(i, 1); continue; }
      // vs invaders
      for (const inv of invaders) {
        if (!inv.alive) continue;
        const ix = INV_START_X + groupX + inv.c * INV_SPACING_X;
        const iy = INV_START_Y + groupY + inv.r * INV_SPACING_Y;
        if (rectOverlap(b.x, b.y, b.w, b.h, ix, iy, INV_W, INV_H)) {
          inv.alive = false; b.dead = true;
          const rowScore = [30,20,20,10,10][inv.r] || 10;
          score += rowScore * wave;
          screenFlash = 2;
          break;
        }
      }
      // vs barriers
      for (const bar of barriers) {
        for (let bi = bar.blocks.length-1; bi >= 0; bi--) {
          const blk = bar.blocks[bi];
          const bx2 = bar.x + blk.c*8, by2 = bar.y + blk.r*6;
          if (rectOverlap(b.x, b.y, b.w, b.h, bx2, by2, 8, 6)) {
            blk.hp--;
            if (blk.hp <= 0) bar.blocks.splice(bi, 1);
            b.dead = true; break;
          }
        }
      }
    }
    playerBullets = playerBullets.filter(function(b) { return !b.dead; });

    // Update enemy bullets
    for (let i = enemyBullets.length-1; i >= 0; i--) {
      const b = enemyBullets[i];
      b.x += b.vx; b.y += b.vy;
      if (b.y > H) { b.dead = true; }
      if (b.dead) { enemyBullets.splice(i, 1); continue; }
      // vs player
      if (rectOverlap(b.x, b.y, b.w, b.h, player.x, player.y, player.w, player.h)) {
        if (shieldActive) {
          b.dead = true;
          shieldActive = false; shieldTimer = 0;
          addFlash('Shield absorbed a hit!');
        } else {
          b.dead = true;
          lives--;
          screenFlash = 8;
          if (lives <= 0) dead = true;
          else addFlash('Hit! ' + lives + ' lives remain');
        }
      }
      // vs barriers
      for (const bar of barriers) {
        for (let bi = bar.blocks.length-1; bi >= 0; bi--) {
          const blk = bar.blocks[bi];
          const bx2 = bar.x + blk.c*8, by2 = bar.y + blk.r*6;
          if (rectOverlap(b.x, b.y, b.w, b.h, bx2, by2, 8, 6)) {
            blk.hp--;
            if (blk.hp <= 0) bar.blocks.splice(bi, 1);
            b.dead = true; break;
          }
        }
      }
    }
    enemyBullets = enemyBullets.filter(function(b) { return !b.dead; });

    // Invaders reach bottom
    const maxR = Math.max.apply(null, alive.map(function(inv) { return inv.r; }));
    const bottomY = INV_START_Y + groupY + maxR*INV_SPACING_Y + INV_H;
    if (bottomY >= player.y - 10) {
      lives = 0; dead = true;
    }
  }

  function onKey(e) {
    if (vimMode !== 'NORMAL') return;
    if (dead || waveClear) return;

    // w: burst 3 shots
    if (e.code === 'KeyW') {
      burstCount = 3; burstTimer = 0;
    }

    // dd: kill all alive invaders
    if (e.code === 'KeyD') {
      cmdBuf += 'd'; cmdTime = 25;
      if (cmdBuf.endsWith('dd')) {
        cmdBuf = '';
        const cnt = aliveCount();
        invaders.forEach(function(inv) { inv.alive = false; });
        score += cnt * 50;
        screenFlash = 15;
        addFlash('dd  -- NUKE SCREEN! ' + cnt + ' bugs deleted  +' + (cnt*50) + ' LOC');
      }
    }
    // gg: teleport to center
    if (e.code === 'KeyG') {
      cmdBuf += 'g'; cmdTime = 25;
      if (cmdBuf.endsWith('gg')) {
        cmdBuf = '';
        player.x = W/2 - player.w/2;
        addFlash('gg  -- GOTO LINE START! Teleport to center');
      }
    }
    // : for command
    if (e.code === 'Semicolon' && e.shiftKey) {
      window._cmdLineHandler = handleCmdLine;
    }
  }

  function drawInvader(x, y, row, label) {
    const f = animFrame;
    if (row <= 1) {
      // Crab-like error shape
      ctx.fillStyle = row === 0 ? '#ff4444' : '#ff6622';
      // Body
      ctx.fillRect(x+8, y+8, 24, 14);
      // Head bumps
      ctx.fillRect(x+10, y+4, 6, 6);
      ctx.fillRect(x+24, y+4, 6, 6);
      // Claws (alternate frames)
      if (f === 0) {
        ctx.fillRect(x, y+10, 8, 6);
        ctx.fillRect(x+32, y+10, 8, 6);
      } else {
        ctx.fillRect(x+2, y+14, 8, 6);
        ctx.fillRect(x+30, y+14, 8, 6);
      }
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x+12, y+10, 4, 4);
      ctx.fillRect(x+24, y+10, 4, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x+13, y+11, 2, 2);
      ctx.fillRect(x+25, y+11, 2, 2);
      // Antennae
      ctx.fillStyle = row === 0 ? '#ff4444' : '#ff6622';
      ctx.fillRect(x+12, y+1, 3, 4);
      ctx.fillRect(x+25, y+1, 3, 4);
    } else {
      // Spider-like bug shape
      ctx.fillStyle = row === 2 ? '#aa44ff' : '#cc88ff';
      // Body
      ctx.fillRect(x+10, y+6, 20, 16);
      // Legs (alternate frames)
      if (f === 0) {
        ctx.fillRect(x+2,  y+8,  8, 3);
        ctx.fillRect(x+30, y+8,  8, 3);
        ctx.fillRect(x+2,  y+14, 8, 3);
        ctx.fillRect(x+30, y+14, 8, 3);
      } else {
        ctx.fillRect(x+2,  y+10, 8, 3);
        ctx.fillRect(x+30, y+10, 8, 3);
        ctx.fillRect(x+2,  y+16, 8, 3);
        ctx.fillRect(x+30, y+16, 8, 3);
      }
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x+13, y+10, 4, 4);
      ctx.fillRect(x+23, y+10, 4, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x+14, y+11, 2, 2);
      ctx.fillRect(x+24, y+11, 2, 2);
    }
    // Label
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + INV_W/2, y + INV_H + 8);
  }

  function drawPlayer(px, py) {
    // Green cannon
    ctx.fillStyle = '#22bb22';
    ctx.fillRect(px, py+8, 32, 12);
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(px+12, py, 8, 12);
    ctx.fillStyle = '#116611';
    ctx.fillRect(px+2, py+8, 28, 4);
    // Wheels
    ctx.fillStyle = '#116611';
    ctx.fillRect(px, py+18, 32, 4);
    ctx.fillRect(px+2, py+16, 4, 6);
    ctx.fillRect(px+26, py+16, 4, 6);
  }

  function draw() {
    // Black bg
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // Twinkle stars
    const t = Date.now() * 0.001;
    STARS.forEach(function(s) {
      ctx.globalAlpha = 0.4 + 0.6*Math.abs(Math.sin(t + s.phase));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;

    // HUD top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, 38);
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
    ctx.fillText('VimInvaders', 8, 22);
    ctx.fillStyle = '#88aaff';
    ctx.fillText('LOC:' + String(score).padStart(6,'0'), 120, 22);
    ctx.fillStyle = '#aaffaa';
    ctx.fillText('LIFE:' + lives, 280, 22);
    ctx.fillStyle = '#ffaa44';
    ctx.fillText('WAVE:' + wave, 360, 22);
    if (shieldActive) {
      ctx.fillStyle = '#4488ff';
      ctx.fillText('[:q! SHIELD ' + shieldTimer + ']', 430, 22);
    }

    // Barriers
    barriers.forEach(function(bar) {
      bar.blocks.forEach(function(blk) {
        const hpColor = blk.hp >= 3 ? '#44cc44' : blk.hp === 2 ? '#88cc22' : '#cc8822';
        ctx.fillStyle = hpColor;
        ctx.fillRect(bar.x + blk.c*8, bar.y + blk.r*6, 7, 5);
      });
    });

    // Invaders
    invaders.forEach(function(inv) {
      if (!inv.alive) return;
      const ix = INV_START_X + groupX + inv.c * INV_SPACING_X;
      const iy = INV_START_Y + groupY + inv.r * INV_SPACING_Y;
      drawInvader(ix, iy, inv.r, inv.label);
    });

    // Player
    drawPlayer(player.x, player.y);

    // Shield glow
    if (shieldActive) {
      ctx.save();
      ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 20;
      ctx.strokeStyle = 'rgba(68,136,255,0.7)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x + player.w/2, player.y + player.h/2, 26, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // Player bullets (yellow 2x8)
    ctx.fillStyle = '#ffee00';
    playerBullets.forEach(function(b) { ctx.fillRect(b.x, b.y, b.w, b.h); });

    // Enemy bullets (red 3x8)
    ctx.fillStyle = '#ff2200';
    enemyBullets.forEach(function(b) { ctx.fillRect(b.x, b.y, b.w, b.h); });

    // Wave clear overlay
    if (waveClear) {
      ctx.fillStyle = 'rgba(0,20,0,0.7)';
      ctx.fillRect(80, H/2-40, 352, 80);
      ctx.save(); ctx.shadowColor = '#44ff88'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#44ff88'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
      const killed = 32 - aliveCount();
      ctx.fillText("git commit -m 'Fixed " + killed + " bugs'", W/2, H/2 - 8);
      ctx.restore();
      ctx.fillStyle = '#88ffaa'; ctx.font = '13px monospace'; ctx.textAlign = 'center';
      ctx.fillText('Wave ' + (wave+1) + ' incoming...', W/2, H/2 + 18);
    }

    // Game over
    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 24;
      ctx.fillStyle = '#ff2200'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
      ctx.fillText('SYSTEM HALT', W/2, H/2 - 40); ctx.restore();
      ctx.fillStyle = '#888888'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
      ctx.fillText('LOC committed: ' + score, W/2, H/2);
      ctx.fillText('Wave reached: ' + wave, W/2, H/2 + 22);
      blinkTimer++;
      if (Math.floor(blinkTimer/30)%2===0) {
        ctx.fillStyle = '#ffaa44'; ctx.font = 'bold 13px monospace';
        ctx.fillText('Enter: retry   Esc: menu', W/2, H/2 + 54);
      }
    }

    drawVimStatusline();
  }

  return { init: init, update: update, draw: draw, onKey: onKey };
})();

registerGame('invaders', invadersGame);
