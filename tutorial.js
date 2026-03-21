// ── TUTORIAL.JS ── Interactive Vim tutorial game ─────────────

const tutorialGame = (function() {
  // Step definitions
  const STEPS = [
    { title: 'Step 1: Move',    color: '#44ff88', lines: ['Use  h  to move LEFT', 'Use  l  to move RIGHT', 'Reach the green checkpoint →'], goal: 'reach_x', targetX: 380 },
    { title: 'Step 2: Jump',    color: '#5599ff', lines: ['Use  k  or  Space  to JUMP', 'Land on the platform above', 'Platforms are the solid blocks'], goal: 'reach_y', targetY: 260 },
    { title: 'Step 3: Shoot',   color: '#ffee44', lines: ['Press  x  to SHOOT', 'Kill the enemy (red mob)', 'Aim by facing toward it with h/l'], goal: 'kill_enemy' },
    { title: 'Step 4: Dash',    color: '#ff8844', lines: ['Press  w  for a WORD DASH', 'Dash forward at high speed', 'Reach the far checkpoint →'], goal: 'reach_x', targetX: 420 },
    { title: 'Step 5: dd Nuke', color: '#ff4444', lines: ['Type  dd  to NUKE the screen', 'Kills all visible enemies at once', 'Like  :git rm -f  for bugs'], goal: 'dd_kill' },
    { title: 'Step 6: yy Heal', color: '#aaffaa', lines: ['Type  yy  to YANK (heal)', 'Restores +6 HP from the buffer', 'Keep yanking your health up!'], goal: 'yy_heal' },
    { title: 'Step 7: INSERT',  color: '#cc88ff', lines: ['Press  i  to enter INSERT mode', 'In INSERT mode you auto-shoot!', 'Kill 2 enemies while inserting'], goal: 'insert_kill', killNeeded: 2 },
    { title: 'Step 8: COMMAND', color: '#ffcc44', lines: ['Press  :  (Shift+;) for COMMAND mode', 'Type  help  then press Enter', 'Like running :help in real Vim!'], goal: 'command_help' },
  ];

  let step        = 0;
  let playerX     = 80;
  let playerY     = 360;
  let vx          = 0;
  let vy          = 0;
  let onGround    = false;
  let facing      = 1;
  let health      = 28;
  let shootTimer  = 0;
  let isShooting  = false;
  let animFrame   = 0;
  let animTimer   = 0;
  let invTimer    = 0;
  let stepEnemies = [];
  let stepBullets = [];
  let stepParticles = [];
  let passed      = false;
  let passTimer   = 0;
  let killCount   = 0;
  let totalKills  = 0;
  let arrowBlink  = 0;
  let yankDone    = false;
  let cmdDone     = false;
  let dashDone    = false;
  let ddDone      = false;
  let insertKills = 0;
  let insertMode  = false;
  let specialCD   = 0;
  let yankCD      = 0;

  // Platform definitions for play area (y offset 200)
  const PLAY_Y = 200;
  const GROUND_Y = 420;    // ground in canvas coords
  const TILE = 32;
  const GRAVITY = 0.55;
  const MAX_FALL = 14;
  const PLAYER_SPEED = 3.5;
  const PLAYER_JUMP = -11.5;
  const BULLET_SPEED = 9;

  // Fixed platforms
  const PLATFORMS = [
    { x: 0,   y: GROUND_Y, w: 512, h: 32 },   // ground
    { x: 80,  y: 340,      w: 96,  h: 16 },    // low platform
    { x: 240, y: 300,      w: 96,  h: 16 },    // mid platform
    { x: 360, y: 260,      w: 96,  h: 16 },    // high platform
  ];

  function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function resolvePlayer() {
    // Check platforms
    for (let p of PLATFORMS) {
      // Floor collision
      if (vy >= 0) {
        const feet = playerY + 28;
        if (rectOverlap(playerX, feet - 4, 20, 8, p.x, p.y, p.w, p.h) &&
            playerY + 28 - vy <= p.y + 2) {
          playerY = p.y - 28;
          vy = 0;
          onGround = true;
        }
      }
      // Ceiling
      if (vy < 0) {
        if (rectOverlap(playerX, playerY, 20, 8, p.x, p.y, p.w, p.h)) {
          playerY = p.y + p.h;
          vy = 0;
        }
      }
      // Wall left/right
      if (vy >= -2) {
        if (rectOverlap(playerX, playerY + 4, 20, 20, p.x, p.y, p.w, p.h)) {
          if (vx > 0) playerX = p.x - 20;
          else if (vx < 0) playerX = p.x + p.w;
          vx = 0;
        }
      }
    }
    // Clamp
    if (playerX < 0) playerX = 0;
    if (playerX > 492) playerX = 492;
    if (playerY > 500) {
      playerY = GROUND_Y - 28;
      vy = 0;
      onGround = true;
    }
  }

  function spawnParticle(x, y) {
    for (let i = 0; i < 5; i++) {
      stepParticles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * -4 - 1,
        life: 40 + (Math.random() * 20 | 0),
        maxLife: 60,
        color: Math.random() < 0.5 ? '#ffaa00' : '#ffdd44',
        size: 3 + (Math.random() * 3 | 0)
      });
    }
  }

  function resetStep() {
    playerX = 80;
    playerY = GROUND_Y - 28;
    vx = 0; vy = 0;
    onGround = false;
    facing = 1;
    passed = false;
    passTimer = 0;
    stepBullets = [];
    stepParticles = [];
    dashDone = false;
    ddDone = false;
    yankDone = false;
    cmdDone = false;
    insertKills = 0;
    insertMode = false;
    killCount = 0;
    stepEnemies = [];
    specialCD = 0;
    yankCD = 0;

    if (step === 2) {
      // Shoot step: one enemy at x=340
      stepEnemies.push({ x: 340, y: GROUND_Y - 26, w: 24, h: 24, health: 3, dead: false, invTimer: 0, vx: -0.5 });
    } else if (step === 4) {
      // dd step: 3 enemies spread out
      stepEnemies.push({ x: 200, y: GROUND_Y - 26, w: 24, h: 24, health: 3, dead: false, invTimer: 0, vx: 0.5 });
      stepEnemies.push({ x: 300, y: GROUND_Y - 26, w: 24, h: 24, health: 3, dead: false, invTimer: 0, vx: -0.5 });
      stepEnemies.push({ x: 400, y: GROUND_Y - 26, w: 24, h: 24, health: 3, dead: false, invTimer: 0, vx: 0.7 });
    } else if (step === 6) {
      // INSERT step: 2 enemies
      stepEnemies.push({ x: 260, y: GROUND_Y - 26, w: 24, h: 24, health: 3, dead: false, invTimer: 0, vx: -0.6 });
      stepEnemies.push({ x: 380, y: GROUND_Y - 26, w: 24, h: 24, health: 3, dead: false, invTimer: 0, vx: 0.5 });
    }
  }

  function init() {
    step = 0;
    health = 28;
    totalKills = 0;
    resetStep();
    setMode('NORMAL');
    addFlash('VimTutorial  -- Learn Vim controls step by step');
    window._cmdLineHandler = handleCmd;
  }

  function handleCmd(cmd) {
    if (step === 7 && cmd.trim() === 'help') {
      cmdDone = true;
      addFlash(':help  -- Great! You know the Vim command line!');
    } else {
      addFlash('E492: Not an editor command: ' + cmd.trim());
    }
  }

  function update() {
    if (justPressed('Escape')) {
      switchGame('menu');
      return;
    }

    if (passed) {
      passTimer++;
      if (passTimer > 90) {
        if (step < STEPS.length - 1) {
          step++;
          resetStep();
        } else {
          // All done, back to menu after a moment
          addFlash('Tutorial Complete! You are a Vimer!');
          switchGame('menu');
        }
      }
      return;
    }

    if (specialCD > 0) specialCD--;
    if (yankCD > 0) yankCD--;
    if (shootTimer > 0) shootTimer--;
    if (invTimer > 0) invTimer--;
    arrowBlink++;

    // Player movement
    vx = 0;
    if (isLeft())  { vx = -PLAYER_SPEED; facing = -1; }
    if (isRight()) { vx =  PLAYER_SPEED; facing =  1; }

    // Jump
    if (isJump() && onGround) {
      vy = PLAYER_JUMP;
      onGround = false;
    }

    // Gravity
    vy += GRAVITY;
    if (vy > MAX_FALL) vy = MAX_FALL;

    // Fast fall
    if (isDown() && !onGround) vy = Math.min(vy + 3, MAX_FALL);

    onGround = false;
    playerX += vx;
    playerY += vy;
    resolvePlayer();

    // Shooting
    isShooting = false;
    if (isShoot() && shootTimer <= 0) {
      isShooting = true;
      shootTimer = 15;
      const bx = facing === 1 ? playerX + 20 : playerX - 8;
      const by = playerY + 12;
      stepBullets.push({ x: bx, y: by, vx: facing * BULLET_SPEED, vy: 0, dead: false, w: 8, h: 6 });
    }

    // Update bullets
    for (let i = stepBullets.length - 1; i >= 0; i--) {
      const b = stepBullets[i];
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < -20 || b.x > 540) b.dead = true;
      if (b.dead) { stepBullets.splice(i, 1); continue; }
      // Check vs enemies
      for (let e of stepEnemies) {
        if (!e.dead && rectOverlap(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
          if (e.invTimer <= 0) {
            e.health--;
            e.invTimer = 10;
            if (e.health <= 0) {
              e.dead = true;
              spawnParticle(e.x + 12, e.y + 12);
              killCount++;
              totalKills++;
              if (step === 6) insertKills++;
            }
          }
          b.dead = true;
          break;
        }
      }
    }

    // Update enemies
    for (let e of stepEnemies) {
      if (e.dead) continue;
      if (e.invTimer > 0) e.invTimer--;
      e.x += e.vx;
      if (e.x < 20 || e.x > 470) e.vx = -e.vx;
      // Bounce enemy off player
      if (invTimer <= 0 && rectOverlap(playerX, playerY, 20, 28, e.x, e.y, e.w, e.h)) {
        health -= 3;
        invTimer = 90;
        vy = -4;
        if (health < 0) health = 0;
      }
    }

    // Update particles
    for (let i = stepParticles.length - 1; i >= 0; i--) {
      const p = stepParticles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
      if (p.life <= 0) stepParticles.splice(i, 1);
    }

    // ── Check step completion ─────────────────────────────────
    const s = STEPS[step];
    if (s.goal === 'reach_x' && playerX >= s.targetX) passed = true;
    if (s.goal === 'reach_y' && playerY <= s.targetY) passed = true;
    if (s.goal === 'kill_enemy' && killCount >= 1) passed = true;
    if (s.goal === 'dd_kill' && ddDone) passed = true;
    if (s.goal === 'yy_heal' && yankDone) passed = true;
    if (s.goal === 'insert_kill' && insertKills >= 2) passed = true;
    if (s.goal === 'command_help' && cmdDone) passed = true;
  }

  function onKey(e) {
    if (passed) return;
    if (vimMode !== 'NORMAL') return;

    // Handle w dash
    if (step === 3 && e.code === 'KeyW') {
      vx = PLAYER_SPEED * 2.5;
      facing = 1;
      addFlash('w  -- WORD DASH!');
      dashDone = true;
    }

    // Handle dd
    if (e.code === 'KeyD') {
      cmdBuffer += 'd';
      cmdTimer = 25;
      if (cmdBuffer.endsWith('dd')) {
        cmdBuffer = '';
        if (step === 4) {
          stepEnemies.forEach(function(e2) {
            if (!e2.dead) { e2.dead = true; spawnParticle(e2.x + 12, e2.y + 12); totalKills++; }
          });
          ddDone = true;
          screenFlash = 8;
          addFlash('dd  -- DELETE LINE! Nuked all bugs!');
        }
      }
    }

    // Handle yy
    if (e.code === 'KeyY') {
      cmdBuffer += 'y';
      cmdTimer = 25;
      if (cmdBuffer.endsWith('yy')) {
        cmdBuffer = '';
        if (step === 5 && yankCD <= 0) {
          health = Math.min(28, health + 6);
          yankCD = 120;
          yankDone = true;
          addFlash('yy  -- YANK! +6 HP restored');
          spawnParticle(playerX + 10, playerY);
        }
      }
    }

    // INSERT mode tracking
    if (e.code === 'KeyI' || e.code === 'KeyA') {
      if (step === 6) insertMode = true;
    }
  }

  function draw() {
    // Dark bg with faint code-like grid lines
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, W, H);

    // Faint grid
    ctx.strokeStyle = '#111122';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // ── Top panel (y=0..200): step info ──────────────────────
    ctx.fillStyle = 'rgba(0,0,30,0.7)';
    ctx.fillRect(0, 0, W, 200);

    const s = STEPS[step];
    // Step title
    ctx.fillStyle = s.color;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(s.title, 16, 32);

    // Instruction lines
    ctx.fillStyle = '#aabbcc';
    ctx.font = '13px monospace';
    s.lines.forEach(function(line, i) {
      ctx.fillText(line, 16, 60 + i * 20);
    });

    // Progress dots ■■■□□□□□
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    let dots = '';
    for (let i = 0; i < STEPS.length; i++) {
      dots += i <= step ? '■' : '□';
    }
    ctx.fillStyle = '#556677';
    ctx.fillText(dots, W - 16, 32);

    // Step number
    ctx.fillStyle = '#445566';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(step + 1 + '/' + STEPS.length, W - 16, 48);

    // Health bar
    ctx.fillStyle = '#333355';
    ctx.fillRect(16, 170, 150, 14);
    const hpPct = health / 28;
    ctx.fillStyle = hpPct > 0.5 ? '#00dd44' : hpPct > 0.25 ? '#ffaa00' : '#ff2200';
    ctx.fillRect(16, 170, Math.floor(150 * hpPct), 14);
    ctx.fillStyle = '#88aaff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP: ' + health + '/28', 18, 182);

    // ── Play area (y=200..452) ────────────────────────────────
    // Clip to play area visually
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 200, W, H - 200 - 28);
    ctx.clip();

    // Draw platforms
    PLATFORMS.forEach(function(p) {
      ctx.fillStyle = '#112266';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#2244aa';
      ctx.fillRect(p.x, p.y, p.w, 4);
      ctx.fillStyle = '#0a1833';
      ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
    });

    // Step-specific checkpoints / goals
    if (s.goal === 'reach_x') {
      // Green checkpoint flag
      const cx = s.targetX;
      ctx.fillStyle = (Math.floor(arrowBlink / 10) % 2 === 0) ? '#44ff88' : '#22cc66';
      ctx.fillRect(cx, GROUND_Y - 40, 6, 40);
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(cx + 6, GROUND_Y - 40, 20, 14);
      ctx.fillStyle = '#222244';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('GOAL', cx + 7, GROUND_Y - 30);
    }

    if (s.goal === 'reach_y') {
      // Arrow pointing up to the high platform
      const tx = 360 + 48;
      const ty = 260;
      ctx.fillStyle = (Math.floor(arrowBlink / 10) % 2 === 0) ? '#5599ff' : '#3366cc';
      ctx.fillRect(tx - 3, ty, 6, 30);
      ctx.beginPath();
      ctx.moveTo(tx - 10, ty + 5);
      ctx.lineTo(tx + 10, ty + 5);
      ctx.lineTo(tx, ty - 8);
      ctx.closePath();
      ctx.fill();
    }

    // Draw particles
    stepParticles.forEach(function(p) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Draw enemies
    stepEnemies.forEach(function(e) {
      if (e.dead) return;
      if (e.invTimer > 0 && Math.floor(e.invTimer / 2) % 2 === 0) return;
      // Met-style enemy
      ctx.fillStyle = '#cc3300';
      ctx.fillRect(e.x + 4, e.y + 12, 16, 12);
      ctx.fillStyle = '#884400';
      ctx.fillRect(e.x + 2, e.y + 2, 20, 14);
      ctx.fillStyle = '#cc6600';
      ctx.fillRect(e.x + 4, e.y, 16, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(e.x + 8, e.y + 8, 8, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(e.x + 12, e.y + 9, 3, 4);
      // Health dots above
      for (let h2 = 0; h2 < e.health; h2++) {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(e.x + 4 + h2 * 7, e.y - 8, 5, 4);
      }
    });

    // Draw bullets
    stepBullets.forEach(function(b) {
      ctx.fillStyle = '#ffee00';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x + 1, b.y + 1, 3, 2);
    });

    // Draw player
    if (invTimer <= 0 || Math.floor(invTimer / 4) % 2 !== 0) {
      _drawPlayer();
    }

    // Animated arrow pointing to objective
    _drawObjectiveArrow(s);

    ctx.restore();

    // TASK COMPLETE flash
    if (passed) {
      const alpha = Math.min(1, passTimer / 20);
      ctx.fillStyle = 'rgba(0,30,0,' + (0.7 * alpha) + ')';
      ctx.fillRect(100, 190, 312, 60);
      ctx.strokeStyle = '#44ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, 190, 312, 60);
      ctx.fillStyle = '#44ff88';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TASK COMPLETE! ✓', W / 2, 228);
      if (step < STEPS.length - 1) {
        ctx.fillStyle = '#aaffaa';
        ctx.font = '12px monospace';
        ctx.fillText('Next step loading...', W / 2, 246);
      }
    }

    drawVimStatusline();
  }

  function _drawPlayer() {
    ctx.save();
    const cx = playerX + 10;
    ctx.translate(cx, playerY);
    if (facing === -1) ctx.scale(-1, 1);

    const shooting = shootTimer > 0;

    // Legs
    ctx.fillStyle = '#1a3aff';
    if (!onGround) {
      ctx.fillRect(-7, 18, 14, 10);
    } else if (vx !== 0) {
      if (animFrame === 1) {
        ctx.fillRect(-7, 18, 6, 10);
        ctx.fillRect(2, 16, 6, 12);
      } else if (animFrame === 2) {
        ctx.fillRect(-7, 16, 6, 12);
        ctx.fillRect(2, 18, 6, 10);
      } else {
        ctx.fillRect(-7, 18, 6, 10);
        ctx.fillRect(2, 18, 6, 10);
      }
    } else {
      ctx.fillRect(-7, 18, 6, 10);
      ctx.fillRect(2, 18, 6, 10);
    }

    // Body
    ctx.fillStyle = '#2255ff';
    ctx.fillRect(-8, 8, 16, 12);

    // Arm cannon
    ctx.fillStyle = '#5599ff';
    if (shooting) {
      ctx.fillRect(5, 11, 10, 6);
      if (shootTimer > 8) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 10, 4, 8);
        ctx.fillStyle = '#ffff44';
        ctx.fillRect(15, 11, 3, 6);
      }
    } else {
      ctx.fillRect(5, 11, 7, 6);
    }
    ctx.fillStyle = '#2255ff';
    ctx.fillRect(-12, 11, 5, 5);

    // Head
    ctx.fillStyle = '#55aaff';
    ctx.fillRect(-8, -4, 16, 14);
    ctx.fillStyle = '#1a3aff';
    ctx.fillRect(-8, -4, 16, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 0, 6, 5);
    ctx.fillStyle = '#000033';
    ctx.fillRect(4, 1, 2, 3);

    ctx.restore();

    // Update anim
    if (vx !== 0 && onGround) {
      animTimer++;
      if (animTimer >= 8) { animTimer = 0; animFrame = (animFrame + 1) % 3; }
    } else {
      animFrame = 0; animTimer = 0;
    }
  }

  function _drawObjectiveArrow(s) {
    if (passed) return;
    const blink = Math.floor(arrowBlink / 15) % 2 === 0;
    if (!blink) return;

    if (s.goal === 'reach_x') {
      // Arrow pointing right from player toward goal
      const ax = Math.min(playerX + 40, s.targetX - 20);
      const ay = playerY - 20;
      ctx.fillStyle = '#44ff88';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('→', ax, ay);
    } else if (s.goal === 'reach_y') {
      // Arrow pointing up
      ctx.fillStyle = '#5599ff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('↑', playerX + 10, playerY - 10);
    } else if (s.goal === 'kill_enemy') {
      // Arrow pointing at first alive enemy
      const alive = stepEnemies.filter(function(e) { return !e.dead; });
      if (alive.length > 0) {
        const target = alive[0];
        const dx = target.x + 12 - (playerX + 10);
        ctx.fillStyle = '#ffee44';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(dx > 0 ? '→' : '←', playerX + 10, playerY - 12);
      }
    }
  }

  return {
    init: init,
    update: update,
    draw: draw,
    onKey: onKey
  };
})();

registerGame('tutorial', tutorialGame);
