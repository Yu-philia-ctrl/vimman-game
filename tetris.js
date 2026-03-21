// ── TETRIS.JS ── VimTetris game ──────────────────────────────

const tetrisGame = (function() {
  const BOARD_W = 10, BOARD_H = 20;
  const CELL = 22;
  const BOARD_X = 80, BOARD_Y = 20;

  // Standard 7 tetrominoes with rotation arrays (each rotation is an array of [row,col] offsets)
  const PIECES = [
    { name:'I', color:'#00ffff', shapes:[[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0]]] },
    { name:'O', color:'#ffff00', shapes:[[[0,0],[0,1],[1,0],[1,1]]] },
    { name:'T', color:'#aa00ff', shapes:[[[0,0],[0,1],[0,2],[1,1]],[[0,0],[1,0],[2,0],[1,1]],[[1,0],[0,1],[1,1],[1,2]],[[0,1],[1,0],[1,1],[2,1]]] },
    { name:'S', color:'#00ff00', shapes:[[[0,1],[0,2],[1,0],[1,1]],[[0,0],[1,0],[1,1],[2,1]]] },
    { name:'Z', color:'#ff2200', shapes:[[[0,0],[0,1],[1,1],[1,2]],[[0,1],[1,0],[1,1],[2,0]]] },
    { name:'J', color:'#2244ff', shapes:[[[0,0],[1,0],[1,1],[1,2]],[[0,0],[0,1],[1,0],[2,0]],[[0,0],[0,1],[0,2],[1,2]],[[0,1],[1,1],[2,0],[2,1]]] },
    { name:'L', color:'#ff8800', shapes:[[[0,2],[1,0],[1,1],[1,2]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[0,2],[1,0]],[[0,0],[0,1],[1,1],[2,1]]] },
  ];

  let board, score, lines, level, fallSpeed, fallTimer;
  let current, currentX, currentY, currentRot;
  let next;
  let dead, blinkTimer;
  let undoStack;
  let flashRows, flashTimer;
  let cmdBuf = '', cmdTime = 0;

  function newBoard() {
    const b = [];
    for (let r = 0; r < BOARD_H; r++) b.push(new Array(BOARD_W).fill(null));
    return b;
  }

  function randomPiece() {
    return Math.floor(Math.random() * PIECES.length);
  }

  function getShape(pieceIdx, rot) {
    const p = PIECES[pieceIdx];
    return p.shapes[rot % p.shapes.length];
  }

  function pieceAt(pieceIdx, rot, px, py) {
    return getShape(pieceIdx, rot).map(function(c) { return [py+c[0], px+c[1]]; });
  }

  function isValid(pieceIdx, rot, px, py) {
    const cells = pieceAt(pieceIdx, rot, px, py);
    for (const c of cells) {
      const r = c[0], col = c[1];
      if (col < 0 || col >= BOARD_W || r >= BOARD_H) return false;
      if (r >= 0 && board[r][col] !== null) return false;
    }
    return true;
  }

  function spawnPiece() {
    current = next !== undefined ? next : randomPiece();
    next = randomPiece();
    currentRot = 0;
    currentX = Math.floor(BOARD_W/2) - 2;
    currentY = 0;
    if (!isValid(current, currentRot, currentX, currentY)) dead = true;
  }

  function placePiece() {
    // Save to undo stack
    const snapshot = board.map(function(row) { return row.slice(); });
    undoStack.push({ board: snapshot, score: score, lines: lines, level: level });
    if (undoStack.length > 3) undoStack.shift();

    const cells = pieceAt(current, currentRot, currentX, currentY);
    cells.forEach(function(c) {
      if (c[0] >= 0) board[c[0]][c[1]] = PIECES[current].color;
    });
    clearLines();
    spawnPiece();
  }

  function ghostY() {
    let gy = currentY;
    while (isValid(current, currentRot, currentX, gy + 1)) gy++;
    return gy;
  }

  function clearLines() {
    const toRemove = [];
    for (let r = BOARD_H-1; r >= 0; r--) {
      if (board[r].every(function(c) { return c !== null; })) toRemove.push(r);
    }
    if (toRemove.length === 0) return;
    flashRows = toRemove;
    flashTimer = 12;
    const n = toRemove.length;
    const pts = [0,100,300,500,800][n] * level;
    score += pts;
    lines += n;
    level = Math.floor(lines/10) + 1;
    fallSpeed = Math.max(8, 48 - level*4);
    toRemove.forEach(function(r) {
      board.splice(r, 1);
      board.unshift(new Array(BOARD_W).fill(null));
    });
    const msgs = ['', 'BUG FIXED!', 'MERGE CONFLICT RESOLVED!', 'LGTM!', 'SHIP IT! 🚀'];
    addFlash(msgs[n] + '  +' + pts + ' LOC');
  }

  function init() {
    board = newBoard();
    score = 0; lines = 0; level = 1; fallSpeed = 48; fallTimer = 0;
    undoStack = []; dead = false; blinkTimer = 0;
    flashRows = []; flashTimer = 0;
    cmdBuf = ''; cmdTime = 0;
    next = randomPiece();
    spawnPiece();
    window._cmdLineHandler = handleCmdLine;
    addFlash('VimTetris  -- h/l:Move  k:Rotate  j:Drop  Space:Hard  u:Undo');
  }

  function handleCmdLine(cmd) {
    const c = cmd.trim();
    if (c === 'dd') {
      // Clear lowest full line
      for (let r = BOARD_H-1; r >= 0; r--) {
        if (board[r].every(function(cell) { return cell !== null; })) {
          board.splice(r, 1);
          board.unshift(new Array(BOARD_W).fill(null));
          score = Math.max(0, score - 50);
          addFlash(':dd  -- Deleted lowest full line  -50 LOC');
          return;
        }
      }
      addFlash(':dd  -- No full lines found');
    } else {
      addFlash('E492: Not an editor command: ' + c);
    }
  }

  function update() {
    if (justPressed('Escape')) { switchGame('menu'); return; }
    if (dead) {
      blinkTimer++;
      if (isEnter()) init();
      return;
    }
    if (flashTimer > 0) { flashTimer--; return; }

    if (cmdTime > 0) cmdTime--;
    else cmdBuf = '';

    // h/l move
    if (justPressed('KeyH') || justPressed('ArrowLeft')) {
      if (isValid(current, currentRot, currentX-1, currentY)) currentX--;
    }
    if (justPressed('KeyL') || justPressed('ArrowRight')) {
      if (isValid(current, currentRot, currentX+1, currentY)) currentX++;
    }
    // k rotate CW
    if (justPressed('KeyK') || justPressed('ArrowUp')) {
      const newRot = (currentRot+1) % PIECES[current].shapes.length;
      if (isValid(current, newRot, currentX, currentY)) currentRot = newRot;
      else if (isValid(current, newRot, currentX+1, currentY)) { currentRot=newRot; currentX++; }
      else if (isValid(current, newRot, currentX-1, currentY)) { currentRot=newRot; currentX--; }
    }
    // j soft drop
    if (pressed('KeyJ') || pressed('ArrowDown')) {
      fallTimer += 2; // triple speed
    }
    // Space hard drop
    if (justPressed('Space')) {
      currentY = ghostY();
      placePiece();
      fallTimer = 0;
      return;
    }

    fallTimer++;
    if (fallTimer >= fallSpeed) {
      fallTimer = 0;
      if (isValid(current, currentRot, currentX, currentY+1)) {
        currentY++;
      } else {
        placePiece();
      }
    }
  }

  function onKey(e) {
    if (vimMode !== 'NORMAL') return;
    if (dead) return;

    // dd: find and clear lowest full line
    if (e.code === 'KeyD') {
      cmdBuf += 'd'; cmdTime = 25;
      if (cmdBuf.endsWith('dd')) {
        cmdBuf = '';
        for (let r = BOARD_H-1; r >= 0; r--) {
          if (board[r].every(function(cell) { return cell !== null; })) {
            board.splice(r, 1);
            board.unshift(new Array(BOARD_W).fill(null));
            score = Math.max(0, score - 50);
            addFlash('dd  -- Bug squashed! Removed lowest full line  -50 LOC');
            return;
          }
        }
        addFlash('dd  -- No full lines to delete');
      }
    }
    // u: undo last placed piece
    if (e.code === 'KeyU' && !e.ctrlKey) {
      if (undoStack.length > 0) {
        const snap = undoStack.pop();
        board = snap.board;
        score = snap.score;
        lines = snap.lines;
        level = snap.level;
        spawnPiece();
        addFlash('u  -- UNDO! Last piece restored (' + undoStack.length + ' undos left)');
      } else {
        addFlash('u  -- Already at oldest change');
      }
    }
    // : command mode
    if (e.code === 'Semicolon' && e.shiftKey) {
      window._cmdLineHandler = handleCmdLine;
    }
  }

  function draw() {
    // Dark bg
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, W, H);

    // Board background
    ctx.fillStyle = '#050510';
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W*CELL, BOARD_H*CELL);

    // Grid lines
    ctx.strokeStyle = '#111133';
    ctx.lineWidth = 1;
    for (let c = 0; c <= BOARD_W; c++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + c*CELL, BOARD_Y);
      ctx.lineTo(BOARD_X + c*CELL, BOARD_Y + BOARD_H*CELL);
      ctx.stroke();
    }
    for (let r = 0; r <= BOARD_H; r++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X, BOARD_Y + r*CELL);
      ctx.lineTo(BOARD_X + BOARD_W*CELL, BOARD_Y + r*CELL);
      ctx.stroke();
    }

    // Board border
    ctx.strokeStyle = '#334477';
    ctx.lineWidth = 2;
    ctx.strokeRect(BOARD_X, BOARD_Y, BOARD_W*CELL, BOARD_H*CELL);

    // Placed cells
    for (let r = 0; r < BOARD_H; r++) {
      for (let c = 0; c < BOARD_W; c++) {
        if (board[r][c]) {
          const flash = flashRows.indexOf(r) >= 0 && flashTimer > 0;
          ctx.fillStyle = flash ? '#ffffff' : board[r][c];
          ctx.fillRect(BOARD_X + c*CELL + 1, BOARD_Y + r*CELL + 1, CELL-2, CELL-2);
          if (!flash) {
            // Subtle bevel
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(BOARD_X + c*CELL + 1, BOARD_Y + r*CELL + 1, CELL-2, 3);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(BOARD_X + c*CELL + 1, BOARD_Y + r*CELL + CELL-4, CELL-2, 3);
          }
        }
      }
    }

    if (!dead) {
      // Ghost piece
      const gy = ghostY();
      const ghostCells = pieceAt(current, currentRot, currentX, gy);
      ctx.fillStyle = PIECES[current].color;
      ctx.globalAlpha = 0.3;
      ghostCells.forEach(function(c) {
        if (c[0] >= 0) ctx.fillRect(BOARD_X + c[1]*CELL + 1, BOARD_Y + c[0]*CELL + 1, CELL-2, CELL-2);
      });
      ctx.globalAlpha = 1;

      // Current piece
      const cells = pieceAt(current, currentRot, currentX, currentY);
      ctx.fillStyle = PIECES[current].color;
      cells.forEach(function(c) {
        if (c[0] >= 0) {
          ctx.fillRect(BOARD_X + c[1]*CELL + 1, BOARD_Y + c[0]*CELL + 1, CELL-2, CELL-2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(BOARD_X + c[1]*CELL + 1, BOARD_Y + c[0]*CELL + 1, CELL-2, 3);
          ctx.fillStyle = PIECES[current].color;
        }
      });
    }

    // Right panel
    const RX = BOARD_X + BOARD_W*CELL + 14;
    ctx.fillStyle = '#334477';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NEXT COMMIT:', RX, BOARD_Y + 18);

    // Next piece preview box
    ctx.fillStyle = '#050515';
    ctx.fillRect(RX, BOARD_Y + 24, 88, 66);
    ctx.strokeStyle = '#334477'; ctx.lineWidth = 1;
    ctx.strokeRect(RX, BOARD_Y + 24, 88, 66);
    if (next !== undefined) {
      const ns = getShape(next, 0);
      const ncol = PIECES[next].color;
      ctx.fillStyle = ncol;
      ns.forEach(function(c) {
        ctx.fillRect(RX + 10 + c[1]*16, BOARD_Y + 34 + c[0]*16, 14, 14);
      });
    }

    ctx.fillStyle = '#88aaff'; ctx.font = 'bold 11px monospace';
    ctx.fillText('LOC:', RX, BOARD_Y + 110);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(score).padStart(7, '0'), RX, BOARD_Y + 124);

    ctx.fillStyle = '#88aaff';
    ctx.fillText('BUGS FIXED:', RX, BOARD_Y + 146);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(lines), RX, BOARD_Y + 160);

    ctx.fillStyle = '#88aaff';
    ctx.fillText('SPRINT:', RX, BOARD_Y + 182);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(level), RX, BOARD_Y + 196);

    ctx.fillStyle = '#88aaff';
    ctx.fillText('UNDO:', RX, BOARD_Y + 218);
    ctx.fillStyle = undoStack.length > 0 ? '#44ff88' : '#556677';
    ctx.fillText(undoStack.length + '/3', RX, BOARD_Y + 232);

    ctx.fillStyle = '#445566'; ctx.font = '10px monospace';
    ctx.fillText('h/l: Move', RX, BOARD_Y + 260);
    ctx.fillText('k: Rotate', RX, BOARD_Y + 272);
    ctx.fillText('j: Soft Drop', RX, BOARD_Y + 284);
    ctx.fillText('Space: Hard', RX, BOARD_Y + 296);
    ctx.fillText('u: Undo', RX, BOARD_Y + 308);
    ctx.fillText('dd: Del line', RX, BOARD_Y + 320);

    // Game over overlay
    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W*CELL, BOARD_H*CELL);
      ctx.save();
      ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff2200'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
      ctx.fillText('Stack Overflow', BOARD_X + BOARD_W*CELL/2, BOARD_Y + BOARD_H*CELL/2 - 20);
      ctx.restore();
      ctx.fillStyle = '#aaaacc'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
      ctx.fillText('LOC: ' + score, BOARD_X + BOARD_W*CELL/2, BOARD_Y + BOARD_H*CELL/2 + 5);
      blinkTimer++;
      if (Math.floor(blinkTimer/30)%2===0) {
        ctx.fillStyle = '#ffaa44'; ctx.font = 'bold 12px monospace';
        ctx.fillText('Enter: retry', BOARD_X + BOARD_W*CELL/2, BOARD_Y + BOARD_H*CELL/2 + 28);
      }
    }

    drawVimStatusline();
  }

  return { init: init, update: update, draw: draw, onKey: onKey };
})();

registerGame('tetris', tetrisGame);
