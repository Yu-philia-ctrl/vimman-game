// ── SNAKE.JS ── VimSnake game ────────────────────────────────

const snakeGame = (function() {
  const COLS = 21, ROWS = 14;
  const CELL = 22;
  const OX = 5, OY = 40;  // offset into canvas

  let snake, dir, nextDir, score, level, speed, dead, wrapMode;
  let speedBoostTimer = 0;
  let food = [];
  let frameCount = 0;
  let blinkTimer = 0;
  let cmdBuf = '';
  let cmdTime = 0;

  function spawnFood() {
    const types = [0, 0, 0, 1, 2]; // mostly bugs
    const t = types[Math.floor(Math.random() * types.length)];
    let x, y, onSnake;
    let tries = 0;
    do {
      x = Math.floor(Math.random() * COLS);
      y = Math.floor(Math.random() * ROWS);
      onSnake = snake.some(function(s) { return s.x===x && s.y===y; });
      tries++;
    } while (onSnake && tries < 200);
    food.push({ x: x, y: y, type: t });
  }

  function init() {
    snake = [{x:10,y:7},{x:9,y:7},{x:8,y:7}];
    dir = {x:1,y:0};
    nextDir = {x:1,y:0};
    score = 0; level = 1; speed = 10; dead = false; wrapMode = false;
    speedBoostTimer = 0; frameCount = 0; blinkTimer = 0;
    food = [];
    spawnFood(); spawnFood(); spawnFood();
    cmdBuf = ''; cmdTime = 0;
    window._cmdLineHandler = handleCmdLine;
    addFlash('VimSnake  -- h/j/k/l:Turn  dd:Trim  yy:Speed  :set wrap');
  }

  function handleCmdLine(cmd) {
    const c = cmd.trim();
    if (c === 'set wrap')   { wrapMode = true;  addFlash(':set wrap  -- wrap mode ON'); }
    else if (c === 'set nowrap') { wrapMode = false; addFlash(':set nowrap  -- wrap mode OFF'); }
    else addFlash('E492: Not an editor command: ' + c);
  }

  function moveSnake() {
    if (dead) return;
    dir = { x: nextDir.x, y: nextDir.y };
    const head = snake[0];
    let nx = head.x + dir.x;
    let ny = head.y + dir.y;

    // Wall collision
    if (wrapMode) {
      nx = (nx + COLS) % COLS;
      ny = (ny + ROWS) % ROWS;
    } else {
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) { dead = true; return; }
    }

    // Self collision
    for (let i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === nx && snake[i].y === ny) { dead = true; return; }
    }

    snake.unshift({x: nx, y: ny});

    // Check food
    let ate = false;
    for (let i = food.length-1; i >= 0; i--) {
      const f = food[i];
      if (f.x === nx && f.y === ny) {
        if (f.type === 0) {
          // Bug: +10, grow
          score += 10;
          ate = true;
        } else if (f.type === 1) {
          // Coffee: +20, speed boost, no grow
          score += 20;
          speedBoostTimer = 300;
          addFlash('☕ Coffee! Speed boost 300f!');
        } else if (f.type === 2) {
          // Package: +30, grow +2
          score += 30;
          ate = true;
          snake.push({ x: snake[snake.length-1].x, y: snake[snake.length-1].y });
        }
        food.splice(i, 1);
        spawnFood();
        break;
      }
    }
    if (!ate) snake.pop();

    // Level up
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      level = newLevel;
      speed = Math.max(4, 10 - level);
      addFlash('Level ' + level + '!  Speed increased');
    }
  }

  function update() {
    if (justPressed('Escape')) { switchGame('menu'); return; }
    if (dead) {
      blinkTimer++;
      if (isEnter()) init();
      return;
    }

    // Direction input (no 180 reversal)
    if (justPressed('KeyH') || justPressed('ArrowLeft'))  { if (dir.x !== 1)  nextDir = {x:-1,y:0}; }
    if (justPressed('KeyL') || justPressed('ArrowRight')) { if (dir.x !== -1) nextDir = {x:1,y:0}; }
    if (justPressed('KeyK') || justPressed('ArrowUp'))    { if (dir.y !== 1)  nextDir = {x:0,y:-1}; }
    if (justPressed('KeyJ') || justPressed('ArrowDown'))  { if (dir.y !== -1) nextDir = {x:0,y:1}; }

    if (speedBoostTimer > 0) speedBoostTimer--;

    const effectiveSpeed = speedBoostTimer > 0 ? Math.max(2, Math.floor(speed/2)) : speed;
    frameCount++;
    if (frameCount >= effectiveSpeed) {
      frameCount = 0;
      moveSnake();
    }

    // Command timer
    if (cmdTime > 0) cmdTime--;
    else cmdBuf = '';
  }

  function onKey(e) {
    if (vimMode !== 'NORMAL') return;
    if (dead) return;

    // Handle dd
    if (e.code === 'KeyD') {
      cmdBuf += 'd'; cmdTime = 25;
      if (cmdBuf.endsWith('dd')) {
        cmdBuf = '';
        // Remove last 5 segments (min length 1)
        const remove = Math.min(5, snake.length - 1);
        snake.splice(snake.length - remove, remove);
        score = Math.max(0, score - 20);
        addFlash('dd  -- Tail trimmed! (-5 segments, -20 pts)');
      }
    }
    // Handle yy
    if (e.code === 'KeyY') {
      cmdBuf += 'y'; cmdTime = 25;
      if (cmdBuf.endsWith('yy')) {
        cmdBuf = '';
        speedBoostTimer = 300;
        addFlash('yy  -- YANK! Speed boost 300f');
      }
    }
    // gg teleport
    if (e.code === 'KeyG') {
      cmdBuf += 'g'; cmdTime = 25;
      if (cmdBuf.endsWith('gg')) {
        cmdBuf = '';
        snake[0] = { x: 0, y: 0 };
        addFlash('gg  -- GOTO TOP! Teleport to (0,0)');
      }
    }
    // : for command mode
    if (e.code === 'Semicolon' && e.shiftKey) {
      window._cmdLineHandler = handleCmdLine;
    }
  }

  function draw() {
    // Black bg
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // Faint grid
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(OX + c*CELL, OY);
      ctx.lineTo(OX + c*CELL, OY + ROWS*CELL);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(OX, OY + r*CELL);
      ctx.lineTo(OX + COLS*CELL, OY + r*CELL);
      ctx.stroke();
    }

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, OY);
    ctx.fillStyle = '#44ffee';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VimSnake', 8, 24);
    ctx.fillStyle = '#88aaff';
    ctx.fillText('LOC:' + score, 110, 24);
    ctx.fillText('Lv:' + level, 210, 24);
    if (wrapMode) {
      ctx.fillStyle = '#ffaa44';
      ctx.fillText('[WRAP]', 270, 24);
    }
    if (speedBoostTimer > 0) {
      ctx.fillStyle = '#44ffee';
      ctx.fillText('[BOOST!]', 340, 24);
    }

    // Food
    food.forEach(function(f) {
      const fx = OX + f.x*CELL, fy = OY + f.y*CELL;
      if (f.type === 0) {
        // Bug: red pixel bug
        ctx.fillStyle = '#cc2200';
        ctx.fillRect(fx+8, fy+7, 6, 8);   // body
        ctx.fillRect(fx+7, fy+8, 8, 6);
        ctx.fillStyle = '#ff4422';
        ctx.fillRect(fx+6, fy+9, 3, 2);   // legs left
        ctx.fillRect(fx+13, fy+9, 3, 2);  // legs right
        ctx.fillRect(fx+6, fy+11, 3, 2);
        ctx.fillRect(fx+13, fy+11, 3, 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(fx+9, fy+8, 2, 2);   // eyes
        ctx.fillRect(fx+11, fy+8, 2, 2);
      } else if (f.type === 1) {
        // Coffee cup
        ctx.fillStyle = '#884422';
        ctx.fillRect(fx+7, fy+8, 8, 9);   // cup
        ctx.fillStyle = '#6b3311';
        ctx.fillRect(fx+7, fy+8, 8, 3);   // top
        ctx.fillStyle = '#ffcc88';
        ctx.fillRect(fx+8, fy+9, 6, 1);   // steam line
        ctx.fillStyle = '#884422';
        ctx.fillRect(fx+15, fy+10, 3, 4); // handle
      } else {
        // Package (npm): green box
        ctx.fillStyle = '#228822';
        ctx.fillRect(fx+5, fy+5, 12, 12);
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(fx+5, fy+5, 12, 3);
        ctx.fillStyle = '#115511';
        ctx.fillRect(fx+10, fy+5, 2, 12);
        ctx.fillStyle = '#88ff88';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('npm', fx+11, fy+14);
      }
    });

    // Snake
    snake.forEach(function(seg, i) {
      const sx = OX + seg.x*CELL + 1, sy = OY + seg.y*CELL + 1;
      const sz = CELL - 2;
      if (i === 0) {
        // Head
        ctx.fillStyle = '#44ffee';
        ctx.fillRect(sx, sy, sz, sz);
        // Eyes (depend on direction)
        ctx.fillStyle = '#000000';
        if (dir.x === 1)       { ctx.fillRect(sx+sz-5, sy+3, 3, 3); ctx.fillRect(sx+sz-5, sy+sz-6, 3, 3); }
        else if (dir.x === -1) { ctx.fillRect(sx+2, sy+3, 3, 3);    ctx.fillRect(sx+2, sy+sz-6, 3, 3); }
        else if (dir.y === -1) { ctx.fillRect(sx+3, sy+2, 3, 3);    ctx.fillRect(sx+sz-6, sy+2, 3, 3); }
        else                   { ctx.fillRect(sx+3, sy+sz-5, 3, 3); ctx.fillRect(sx+sz-6, sy+sz-5, 3, 3); }
      } else {
        // Body: gradient from teal to dark
        const ratio = i / snake.length;
        const g = Math.floor(170 - ratio * 100);
        const b = Math.floor(170 - ratio * 100);
        ctx.fillStyle = 'rgb(34,' + g + ',' + b + ')';
        ctx.fillRect(sx, sy, sz, sz);
      }
    });

    // Death overlay
    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(OX, OY, COLS*CELL, ROWS*CELL);
      ctx.save();
      ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#ff2200';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Segmentation fault', W/2, OY + ROWS*CELL/2 - 20);
      ctx.restore();
      ctx.fillStyle = '#aaaacc';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LOC: ' + score + '  Level: ' + level, W/2, OY + ROWS*CELL/2 + 10);
      blinkTimer++;
      if (Math.floor(blinkTimer/30)%2===0) {
        ctx.fillStyle = '#ffaa44';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('Enter: retry   Esc: menu', W/2, OY + ROWS*CELL/2 + 36);
      }
    }

    drawVimStatusline();
  }

  return { init: init, update: update, draw: draw, onKey: onKey };
})();

registerGame('snake', snakeGame);
