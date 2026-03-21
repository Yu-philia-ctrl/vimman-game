// ── MENU.JS ── VIM ARCADE HOME Screen (HOME / CHARACTER / CODEX) ──

const menuModule = (function() {

  // Pre-generate stars
  const STARS = [];
  for (let i = 0; i < 40; i++)
    STARS.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()<0.3?2:1 });

  // ── State ─────────────────────────────────────────────────────────
  let tab = 'home';  // 'home' | 'character' | 'codex' | 'claudecode'

  // HOME tab
  const HOME_ITEMS = ['continue', 'newgame', 'stageselect', 'snake', 'invaders', 'tetris', 'tutorial', 'codex', 'character', 'community'];
  let homeCursor = 0;

  // CHARACTER tab
  const CHAR_SECTIONS = ['equip_weapon', 'equip_armor', 'equip_accessory', 'skills'];
  let charCursor = 0;
  let charSubState = 'main'; // 'main' | 'charselect' | 'weapon_pick' | 'armor_pick' | 'accessory_pick'
  let charPickCursor = 0;
  let charSelectCursor = 0;

  // Skills in character screen (same as in vimman.js but managed here)
  const MENU_SKILLS = [
    { id:'speed',    name:'w-Speed+',     desc:'+50% ダッシュ速度',       cost:3, maxLv:3 },
    { id:'health',   name:'MaxHP+',       desc:'+8 最大HP/レベル',         cost:3, maxLv:3 },
    { id:'power',    name:'Power+',       desc:'+1 弾丸ダメージ',          cost:4, maxLv:3 },
    { id:'ddcool',   name:'dd Haste',     desc:'-20 ddクールダウン/Lv',    cost:4, maxLv:3 },
    { id:'autofire', name:'INSERT Rate',  desc:'INSERT自動射撃が早くなる', cost:5, maxLv:2 },
    { id:'shield',   name:'ZZ-Shield',    desc:'ZZでシールドを展開する',   cost:6, maxLv:1 },
    { id:'spread',   name:'Spread Shot',  desc:'ccで3方向弾を発射する',    cost:8, maxLv:1 },
    { id:'yyheal',   name:'yy+ Heal',     desc:'+4 HP/yy ヒール/レベル',   cost:5, maxLv:2 },
  ];
  let skillCursor = 0;

  // CODEX tab — Vim commands
  const CODEX_CATS = ['全て','移動','編集','モード','検索','置換','ファイル','コマンド','テキスト','マクロ','マーク','表示','設定','ウィンドウ','折り畳み','レジスタ','究極'];
  let codexCatIdx = 0;
  let codexScroll = 0;
  let codexCursor = 0;

  // ClaudeCode CODEX tab
  const CLAUDE_CATS = ['全て','起動','スラッシュ','MCP','設定','権限','パイプ'];
  let claudeCatIdx = 0;
  let claudeScroll = 0;
  let claudeCursor = 0;

  // ── Helper: skill level ───────────────────────────────────────────
  function skLv(id) { return (window.SAVE && window.SAVE.skills && window.SAVE.skills[id]) || 0; }
  function totalSkillLevels() {
    return MENU_SKILLS.reduce(function(s,sk){ return s + skLv(sk.id); }, 0);
  }

  // ── Helper: equipment name ────────────────────────────────────────
  function equipName(slot) {
    if (!window.EQUIP_DB || !window.SAVE) return '???';
    const id = window.SAVE.equip[slot];
    const db = slot === 'weapon' ? window.EQUIP_DB.weapons
             : slot === 'armor'  ? window.EQUIP_DB.armor
             : window.EQUIP_DB.accessories;
    const item = db.find(function(e){ return e.id === id; });
    return item ? item.name : '???';
  }
  function equipItem(slot) {
    if (!window.EQUIP_DB || !window.SAVE) return null;
    const id = window.SAVE.equip[slot];
    const db = slot === 'weapon' ? window.EQUIP_DB.weapons
             : slot === 'armor'  ? window.EQUIP_DB.armor
             : window.EQUIP_DB.accessories;
    return db.find(function(e){ return e.id === id; }) || null;
  }
  function ownedItems(slot) {
    if (!window.SAVE || !window.EQUIP_DB) return [];
    const owned = window.SAVE.ownedEquip[slot === 'weapon' ? 'weapons' : slot === 'armor' ? 'armor' : 'accessories'] || [];
    const db = slot === 'weapon' ? window.EQUIP_DB.weapons
             : slot === 'armor'  ? window.EQUIP_DB.armor
             : window.EQUIP_DB.accessories;
    return db.filter(function(it){ return owned.indexOf(it.id) !== -1; });
  }

  // ── Helper: tier color ────────────────────────────────────────────
  const TIER_COLORS = ['','#44ff88','#88aaff','#ffaa44','#ff6644','#ff00ff'];
  const TIER_NAMES  = ['','★☆☆☆☆','★★☆☆☆','★★★☆☆','★★★★☆','★★★★★'];

  // ── CODEX filtered commands ───────────────────────────────────────
  function getFilteredCmds() {
    const cat = CODEX_CATS[codexCatIdx];
    const db = window.VIM_CMD_DB || [];
    if (cat === '全て') return db;
    return db.filter(function(c){ return c.cat === cat; });
  }

  // ── Background / Stars ────────────────────────────────────────────
  function drawStarBg() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#000011');
    grad.addColorStop(1, '#000033');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    STARS.forEach(function(s) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() * 0.001 + s.x * 0.01);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    ctx.globalAlpha = 1;
  }

  // ── Draw tab bar ──────────────────────────────────────────────────
  function drawTabBar() {
    const tabs = [
      { id:'home',        label:'🏠HOME'       },
      { id:'character',   label:'⚔CHAR'        },
      { id:'codex',       label:'📖VIM'         },
      { id:'claudecode',  label:'🤖CLAUDE'      },
    ];
    const tw = W / tabs.length;
    tabs.forEach(function(t, i) {
      const isActive = (tab === t.id);
      ctx.fillStyle = isActive ? 'rgba(50,100,200,0.7)' : 'rgba(10,10,40,0.6)';
      ctx.fillRect(i * tw, 32, tw, 22);
      if (isActive) {
        ctx.strokeStyle = '#5599ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(i * tw, 32, tw, 22);
      }
      ctx.fillStyle = isActive ? '#ffffff' : '#445566';
      ctx.font = isActive ? 'bold 10px monospace' : '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.label, i * tw + tw / 2, 47);
    });
    // Tab hint
    ctx.fillStyle = '#223344';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1:HOME  2:キャラ  3:VIM CODEX  4:CLAUDE CODE', W / 2, 62);
  }

  // ── Draw header (title + progress) ───────────────────────────────
  function drawHeader() {
    // Title
    ctx.save();
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = '#ffee44';
    ctx.font        = 'bold 26px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('VIM ARCADE', W / 2, 22);
    ctx.restore();

    // Progress bar (command unlock)
    const total = window.VIM_CMD_DB ? window.VIM_CMD_DB.length : 1;
    const unlocked = window.countUnlockedCmds ? window.countUnlockedCmds() : 0;
    const pct = unlocked / total;
    const barX = 10, barY = 24, barW = W - 20, barH = 6;
    ctx.fillStyle = '#111122';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#5599ff';
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.strokeStyle = '#224466';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#445566';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Commands: ' + unlocked + '/' + total, W - 8, barY - 1);
  }

  // ─────────────────────────────────────────────────────────────────
  // ── HOME TAB ─────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  // HOME menu items: indexes into HOME_ITEMS
  // 0=continue, 1=newgame, 2=stageselect, 3=snake, 4=invaders, 5=tetris, 6=tutorial, 7=codex, 8=character
  const HOME_CURSOR_MAX = 9;

  function drawHome() {
    drawStarBg();
    drawHeader();
    drawTabBar();

    const s = window.SAVE;
    const lv = s ? s.level : 1;
    const xp = s ? s.vimXP : 0;
    const world = s ? s.currentWorld : 1;
    const stage = s ? s.currentStage : 1;
    const clearedCount = s ? Object.keys(s.clearedWorlds).length : 0;

    // ── Main Quest: VimMan ──────────────────────────────────────
    const mqY = 68;
    ctx.fillStyle = 'rgba(0,20,60,0.85)';
    ctx.fillRect(8, mqY, W - 16, 148);
    ctx.strokeStyle = '#2255aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, mqY, W - 16, 148);

    // Section title
    ctx.fillStyle = '#5599ff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('◉ MAIN QUEST', 18, mqY + 14);
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('VimMan RPG', 120, mqY + 14);

    // Story line
    ctx.fillStyle = '#88aacc';
    ctx.font = '10px monospace';
    ctx.fillText('バグの帝王「NULL DRAGON」を倒し、VIM MASTERへの道を開け！', 18, mqY + 30);

    // Progress line
    ctx.fillStyle = '#44ff88';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('Lv.' + lv + '  VimXP:' + xp + '  ワールド制覇:' + clearedCount + '/50', 18, mqY + 46);

    // VimMan menu buttons
    const vmButtons = [
      { id:'continue',    label:'► CONTINUE', sub: 'World ' + Math.min(world,50) + '-' + stage, color:'#44ff88' },
      { id:'newgame',     label:'  NEW GAME',  sub: '最初からスタート',                          color:'#ffaa44' },
      { id:'stageselect', label:'  STAGE SELECT', sub: 'ワールド選択',                          color:'#88aaff' },
    ];
    vmButtons.forEach(function(btn, i) {
      const by = mqY + 58 + i * 30;
      const isSel = (homeCursor === i);
      ctx.fillStyle = isSel ? 'rgba(40,80,160,0.7)' : 'rgba(10,20,50,0.5)';
      ctx.fillRect(14, by, W - 28, 26);
      if (isSel) {
        ctx.strokeStyle = btn.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(14, by, W - 28, 26);
      }
      ctx.fillStyle = isSel ? btn.color : btn.color + '88';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(btn.label, 24, by + 17);
      ctx.fillStyle = '#556677';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(btn.sub, W - 20, by + 17);
    });

    // ── Sub Games ────────────────────────────────────────────────
    const sgY = mqY + 156;
    ctx.fillStyle = '#445566';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('── SUB GAMES ─────────────────────────────────', 12, sgY);

    const subGames = [
      { id:'snake',    label:'VimSnake',    color:'#00ffee', cursor:3 },
      { id:'invaders', label:'VimInvaders', color:'#ff4444', cursor:4 },
      { id:'tetris',   label:'VimTetris',   color:'#cc44ff', cursor:5 },
      { id:'tutorial', label:'Tutorial',    color:'#44ff88', cursor:6 },
    ];
    const sgBW = (W - 24) / 4;
    subGames.forEach(function(sg, i) {
      const bx = 12 + i * sgBW;
      const by2 = sgY + 8;
      const isSel = (homeCursor === sg.cursor);
      ctx.fillStyle = isSel ? 'rgba(40,80,140,0.7)' : 'rgba(10,10,40,0.5)';
      ctx.fillRect(bx, by2, sgBW - 4, 32);
      if (isSel) {
        ctx.strokeStyle = sg.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by2, sgBW - 4, 32);
      }
      ctx.fillStyle = isSel ? sg.color : sg.color + '88';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sg.label, bx + (sgBW - 4) / 2, by2 + 20);
    });

    // ── Codex / Character / Community shortcuts ───────────────────
    const shortY = sgY + 48;
    const shortcuts = [
      { id:'codex',     label:'📖 Vim CODEX',  color:'#ffaa44', cursor:7 },
      { id:'character', label:'⚔ キャラ装備',  color:'#ff88ff', cursor:8 },
      { id:'community', label:'🌐 コミュニティ', color:'#4d96ff', cursor:9 },
    ];
    const shBW = Math.floor((W - 24) / 3);
    shortcuts.forEach(function(sh, i) {
      const bx = 12 + i * shBW;
      const bw = shBW - 4;
      const isSel = (homeCursor === sh.cursor);
      ctx.fillStyle = isSel ? 'rgba(60,30,80,0.7)' : 'rgba(20,10,40,0.5)';
      ctx.fillRect(bx, shortY, bw, 28);
      if (isSel) {
        ctx.strokeStyle = sh.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, shortY, bw, 28);
      }
      ctx.fillStyle = isSel ? sh.color : sh.color + '88';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sh.label, bx + bw / 2, shortY + 18);
    });

    // ── Character Roster ─────────────────────────────────────────
    const crY = shortY + 36;
    ctx.fillStyle = 'rgba(0,0,20,0.7)';
    ctx.fillRect(8, crY, W - 16, 96);
    ctx.strokeStyle = '#223355';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, crY, W - 16, 96);
    ctx.fillStyle = '#5577aa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('── キャラクター一覧 ──', 16, crY + 12);
    ctx.fillStyle = '#334455';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('2キーでキャラ画面', W - 14, crY + 12);

    const chars = window.CHARACTER_DEFS || [];
    const clearedCount2 = s ? Object.keys(s.clearedWorlds).length : 0;
    const curCharId = (s && s.character) || 'vimman';
    const crCardW = Math.floor((W - 20) / Math.min(chars.length, 6));
    chars.slice(0, 6).forEach(function(ch, i) {
      const cx = 12 + i * crCardW;
      const cy = crY + 18;
      const cw = crCardW - 4;
      const ch2 = 72;
      const isActive = (curCharId === ch.id);
      const isLocked = ch.unlockReq !== null && clearedCount2 < ch.unlockReq;
      const isPremium = (ch.id === 'warrior' || ch.id === 'mage' || ch.id === 'archer');

      ctx.fillStyle = isActive ? 'rgba(20,60,30,0.85)' : (isLocked ? 'rgba(20,10,10,0.6)' : 'rgba(10,15,40,0.7)');
      ctx.fillRect(cx, cy, cw, ch2);
      ctx.strokeStyle = isActive ? '#44ff88' : (isLocked ? '#553322' : '#224466');
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cw, ch2);

      // Portrait
      if (isLocked) {
        ctx.fillStyle = '#445566';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', cx + cw / 2, cy + 32);
      } else {
        _drawCharPortrait(ch.id, cx + cw / 2, cy + 30, 1.1);
      }

      // Name
      ctx.fillStyle = isActive ? '#44ff88' : (isLocked ? '#556677' : '#aaccdd');
      ctx.font = isActive ? 'bold 8px monospace' : '8px monospace';
      ctx.textAlign = 'center';
      const shortName = (ch.name || ch.id).split(' ')[0].slice(0, 7);
      ctx.fillText(shortName, cx + cw / 2, cy + 52);

      // Status badge
      if (isActive) {
        ctx.fillStyle = '#44ff88';
        ctx.font = '7px monospace';
        ctx.fillText('▶使用中', cx + cw / 2, cy + 62);
      } else if (isLocked && isPremium) {
        ctx.fillStyle = '#ffaa44';
        ctx.font = '7px monospace';
        ctx.fillText('💎World' + ch.unlockReq, cx + cw / 2, cy + 62);
      } else if (isLocked) {
        ctx.fillStyle = '#886644';
        ctx.font = '7px monospace';
        ctx.fillText('W' + ch.unlockReq + '制覇', cx + cw / 2, cy + 62);
      } else {
        // Stats mini
        ctx.fillStyle = '#556688';
        ctx.font = '7px monospace';
        ctx.fillText('HP' + ch.hp + ' ATK' + ch.atk, cx + cw / 2, cy + 62);
      }

      // FREE / PREMIUM tag
      if (isPremium) {
        ctx.fillStyle = 'rgba(200,120,0,0.8)';
        ctx.fillRect(cx, cy, cw, 10);
        ctx.fillStyle = '#ffdd88';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('UNLOCK', cx + cw / 2, cy + 8);
      } else {
        ctx.fillStyle = 'rgba(0,80,0,0.7)';
        ctx.fillRect(cx, cy, cw, 10);
        ctx.fillStyle = '#88ff88';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FREE', cx + cw / 2, cy + 8);
      }
    });

    // ── Bottom hint ───────────────────────────────────────────────
    ctx.fillStyle = '#334455';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('j/k:移動  Enter:決定  2:キャラ  3:CODEX  4:Claude  5:コミュニティ', W / 2, H - 36);

    drawVimStatusline();
  }

  function updateHome() {
    if (justPressed('KeyJ') || justPressed('ArrowDown'))
      homeCursor = (homeCursor + 1) % (HOME_CURSOR_MAX + 1);
    if (justPressed('KeyK') || justPressed('ArrowUp'))
      homeCursor = (homeCursor - 1 + HOME_CURSOR_MAX + 1) % (HOME_CURSOR_MAX + 1);

    if (isEnter() || justPressed('KeyL')) {
      const item = HOME_ITEMS[homeCursor];
      if (item === 'continue') {
        // Go to VimMan with current world
        switchGame('vimman');
      } else if (item === 'newgame') {
        if (confirm('ニューゲームを開始しますか？\n（セーブデータはリセットされます）')) {
          if (window.resetSave) window.resetSave();
          switchGame('vimman');
        }
      } else if (item === 'stageselect') {
        // Go to VimMan stage select
        switchGame('vimman');
      } else if (item === 'snake') {
        switchGame('snake');
      } else if (item === 'invaders') {
        switchGame('invaders');
      } else if (item === 'tetris') {
        switchGame('tetris');
      } else if (item === 'tutorial') {
        switchGame('tutorial');
      } else if (item === 'codex') {
        tab = 'codex'; codexScroll = 0; codexCursor = 0;
      } else if (item === 'character') {
        tab = 'character'; charCursor = 0; charSubState = 'main';
      } else if (item === 'community') {
        const sec = document.getElementById('community-section');
        if (sec) { sec.scrollIntoView({ behavior: 'smooth' }); }
        // Also expand community body if collapsed
        const body = document.getElementById('community-body');
        const btn  = document.getElementById('btn-community-toggle');
        if (body && body.classList.contains('hidden')) {
          body.classList.remove('hidden');
          if (btn) btn.textContent = '折りたたむ ▲';
        }
      }
    }

    // Quick tab switch
    if (justPressed('Digit1')) { tab = 'home'; }
    if (justPressed('Digit2')) { tab = 'character'; charSubState = 'main'; charCursor = 0; }
    if (justPressed('Digit3')) { tab = 'codex'; codexScroll = 0; codexCursor = 0; }
    if (justPressed('Digit4')) { tab = 'claudecode'; claudeScroll = 0; claudeCursor = 0; }
    if (justPressed('Digit5')) {
      const sec = document.getElementById('community-section');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // ── CHARACTER TAB ────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  // Character portraits for menu (simple pixel art per character)
  // Map weapon id prefix to visual type
  function _weaponVisualType(weapId) {
    if (!weapId || weapId === 'fist') return null;
    if (weapId.startsWith('sw') || weapId === 'ult') return 'sword';
    if (weapId.startsWith('st'))  return 'staff';
    if (weapId.startsWith('bow')) return 'bow';
    if (weapId.startsWith('gu'))  return 'gun';
    return null;
  }

  // Draw weapon/armor overlay on top of character portrait
  function _drawEquipOverlay(weaponId, armorId) {
    const wt = _weaponVisualType(weaponId);
    // Weapon
    if (wt === 'sword') {
      ctx.fillStyle = '#cccccc'; ctx.fillRect(7, -14, 3, 22); // blade
      ctx.fillStyle = '#eeeeee'; ctx.fillRect(8, -14, 1, 22); // shine
      ctx.fillStyle = '#cc8800'; ctx.fillRect(5, -2, 7, 3);   // crossguard
      ctx.fillStyle = '#885500'; ctx.fillRect(7, 8, 3, 5);    // hilt
    } else if (wt === 'staff') {
      ctx.fillStyle = '#884400'; ctx.fillRect(8, -18, 3, 30); // pole
      ctx.fillStyle = '#aa44ff'; ctx.fillRect(6, -20, 7, 6);  // orb base
      ctx.fillStyle = '#cc88ff';
      ctx.beginPath(); ctx.arc(9, -22, 5, 0, Math.PI*2); ctx.fill(); // orb
      ctx.fillStyle = 'rgba(200,100,255,0.5)';
      ctx.beginPath(); ctx.arc(9, -22, 7, 0, Math.PI*2); ctx.fill(); // glow
    } else if (wt === 'bow') {
      ctx.strokeStyle = '#886633'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-12, 0, 14, -Math.PI*0.6, Math.PI*0.6); ctx.stroke(); // bow arc
      ctx.strokeStyle = '#eeeecc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-12, 8); ctx.stroke(); // string
      ctx.fillStyle = '#ffcc44'; ctx.fillRect(-14, -1, 16, 2); // arrow
    } else if (wt === 'gun') {
      ctx.fillStyle = '#555555'; ctx.fillRect(6, 0, 14, 5);  // barrel
      ctx.fillStyle = '#333333'; ctx.fillRect(8, 5, 8, 5);   // body
      ctx.fillStyle = '#ff4422'; ctx.fillRect(18, 1, 3, 3);  // muzzle flash
    }
    // Armor tint overlay (translucent color on body)
    if (armorId && armorId !== 'none') {
      const arColors = { ar1:'rgba(80,120,80,0.25)', ar2:'rgba(60,80,160,0.25)', ar3:'rgba(140,80,20,0.25)', ar4:'rgba(80,30,120,0.25)', ar5:'rgba(180,20,20,0.3)' };
      const ac = arColors[armorId];
      if (ac) {
        ctx.fillStyle = ac;
        ctx.fillRect(-8, -4, 16, 14); // body tint
      }
    }
  }

  function _drawCharPortrait(charId, cx, cy, scale) {
    const s = scale || 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    // Current equipment (if on character screen show player's equip)
    const _eq = window.SAVE && window.SAVE.equip;
    const _activeCharId = (window.SAVE && window.SAVE.character) || 'vimman';
    const _showEquip = (charId === _activeCharId) && _eq;
    if (charId === 'claudeman') {
      // Claude coral-orange official colors
      ctx.fillStyle='#7a3e28'; ctx.fillRect(-6,5,12,11);
      ctx.fillStyle='#cc785c'; ctx.fillRect(-7,-2,14,9);
      ctx.fillStyle='#f5c9a0'; ctx.fillRect(-6,-10,12,11);
      ctx.fillStyle='#7a3e28'; ctx.fillRect(-6,-10,12,4);
      // Claude "A" logo
      ctx.fillStyle='#ffffff'; ctx.fillRect(-2,0,4,1); ctx.fillRect(-2,-1,1,5); ctx.fillRect(1,-1,1,5);
      ctx.fillStyle='#5a3018'; ctx.fillRect(-3,1,2,2); ctx.fillRect(2,1,2,2);
    } else if (charId === 'warrior') {
      ctx.fillStyle='#cc2222'; ctx.fillRect(-8,4,16,13);
      ctx.fillStyle='#ff4444'; ctx.fillRect(-7,-8,14,14);
      ctx.fillStyle='#cc6600'; ctx.fillRect(-7,-10,14,4);
      ctx.fillStyle='#888888'; ctx.fillRect(5,-2,4,14);
      ctx.fillStyle='#ff0000'; ctx.fillRect(-3,0,3,3); ctx.fillRect(1,0,3,3);
    } else if (charId === 'mage') {
      ctx.fillStyle='#330055'; ctx.fillRect(-7,5,14,12);
      ctx.fillStyle='#8822cc'; ctx.fillRect(-6,-8,12,14);
      ctx.fillStyle='#330055'; ctx.fillRect(-6,-14,12,8);
      ctx.fillStyle='#aa44ff'; ctx.fillRect(-4,-12,8,4);
      ctx.fillStyle='#884400'; ctx.fillRect(4,3,3,15);
      ctx.fillStyle='#ffaaff'; ctx.fillRect(2,-2,7,6);
      ctx.fillStyle='#ffffff'; ctx.fillRect(-3,0,3,3); ctx.fillRect(1,0,3,3);
    } else if (charId === 'archer') {
      ctx.fillStyle='#336633'; ctx.fillRect(-6,4,12,13);
      ctx.fillStyle='#44aa44'; ctx.fillRect(-5,-8,10,14);
      ctx.fillStyle='#228822'; ctx.fillRect(-5,-10,10,5);
      ctx.fillStyle='#884400'; ctx.fillRect(-10,4,4,14);
      ctx.fillStyle='#ffffff'; ctx.fillRect(-3,0,3,3); ctx.fillRect(1,0,3,3);
      ctx.fillStyle='#004400'; ctx.fillRect(-2,1,2,2); ctx.fillRect(2,1,2,2);
    } else if (charId === 'swordsman') {
      // Swordsman — gold/black katana fighter
      ctx.fillStyle='#2a1800'; ctx.fillRect(-6,4,12,12);
      ctx.fillStyle='#1a1000'; ctx.fillRect(-7,-2,14,9);
      ctx.fillStyle='#ffaa00'; ctx.fillRect(-7,-2,14,2); // headband
      ctx.fillStyle='#ffdd99'; ctx.fillRect(-6,-10,12,10);
      ctx.fillStyle='#1a1000'; ctx.fillRect(-6,-10,12,4);
      ctx.fillStyle='#ffffff'; ctx.fillRect(-3,-5,3,3); ctx.fillRect(1,-5,3,3);
      ctx.fillStyle='#cc6600'; ctx.fillRect(-2,-4,2,2); ctx.fillRect(2,-4,2,2);
      // Sword
      ctx.fillStyle='#888888'; ctx.fillRect(5,-8,3,20);
      ctx.fillStyle='#eeeeee'; ctx.fillRect(6,-8,1,20);
      ctx.fillStyle='#ffff44'; ctx.fillRect(5,-10,3,3);
    } else {
      // vimman (default)
      ctx.fillStyle='#2255ff'; ctx.fillRect(-8,4,16,12);
      ctx.fillStyle='#55aaff'; ctx.fillRect(-7,-8,14,14);
      ctx.fillStyle='#1a3aff'; ctx.fillRect(-7,-9,14,5);
      ctx.fillStyle='#ffffff'; ctx.fillRect(0,-5,5,4);
      ctx.fillStyle='#000033'; ctx.fillRect(2,-4,2,2);
      ctx.fillStyle='#5599ff'; ctx.fillRect(6,6,8,5);
    }
    // Draw equipment overlay for active character
    if (_showEquip) {
      _drawEquipOverlay(_eq.weapon, _eq.armor);
    }
    ctx.restore();
  }

  function drawCharSelectScreen() {
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('── キャラクター選択 ──', W / 2, 80);

    const chars = window.CHARACTER_DEFS || [];
    const clearedWorlds = (window.SAVE && window.SAVE.clearedWorlds) ? Object.keys(window.SAVE.clearedWorlds).length : 0;
    const curCharId = (window.SAVE && window.SAVE.character) || 'vimman';

    chars.forEach(function(ch, i) {
      const row = Math.floor(i / 2), col = i % 2;
      const bx = 10 + col * (W / 2 - 8);
      const by = 90 + row * 86;
      const bw = W / 2 - 18;
      const bh = 80;
      const isActive = (curCharId === ch.id);
      const isSel = (charSelectCursor === i);
      const isLocked = ch.unlockReq !== null && clearedWorlds < ch.unlockReq;

      ctx.fillStyle = isSel ? 'rgba(50,90,180,0.8)' : (isActive ? 'rgba(20,60,30,0.7)' : 'rgba(10,10,40,0.5)');
      ctx.fillRect(bx, by, bw, bh);
      if (isSel) {
        ctx.strokeStyle = isLocked ? '#774422' : (isActive ? '#44ff88' : '#5599ff');
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
      } else if (isActive) {
        ctx.strokeStyle = '#44ff88';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
      }

      // Portrait
      const portCx = bx + 28;
      const portCy = by + 44;
      if (isLocked) {
        ctx.fillStyle = '#445566';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', portCx, portCy + 8);
      } else {
        _drawCharPortrait(ch.id, portCx, portCy, 1.5);
      }

      // Name
      ctx.fillStyle = isLocked ? '#445566' : (isActive ? '#44ff88' : '#ffffff');
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(ch.name || ch.id, bx + 52, by + 16);

      if (isActive) {
        ctx.fillStyle = '#44ff88';
        ctx.font = '8px monospace';
        ctx.fillText('▶ 選択中', bx + 52, by + 28);
      } else if (isLocked) {
        ctx.fillStyle = '#cc6622';
        ctx.font = '8px monospace';
        ctx.fillText('World ' + ch.unlockReq + ' 制覇で解放', bx + 52, by + 28);
      }

      if (!isLocked) {
        // Stats
        ctx.fillStyle = '#88aacc';
        ctx.font = '8px monospace';
        ctx.fillText('HP:' + ch.hp + ' ATK:' + ch.atk + ' DEF:' + ch.def, bx + 52, by + 42);
        ctx.fillStyle = '#aaccaa';
        ctx.fillText('SPD:' + Math.round(ch.spdMul * 100) + '% JMP:' + Math.round(ch.jumpMul * 100) + '%', bx + 52, by + 54);
      }
    });

    ctx.fillStyle = '#334455';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('j/k: 選択  Enter: このキャラで決定  Esc: キャラ画面へ', W / 2, H - 36);
    drawVimStatusline();
  }

  function drawCharacter() {
    drawStarBg();
    drawHeader();
    drawTabBar();

    if (charSubState === 'charselect') {
      drawCharSelectScreen();
      return;
    }
    if (charSubState !== 'main') {
      drawEquipPicker(charSubState.replace('_pick', ''));
      return;
    }

    const s = window.SAVE;
    const stats = window.getEquipStats ? window.getEquipStats() : { atk:0, def:0, hp:0, spdPct:0 };
    const chars = window.CHARACTER_DEFS || [];
    const curCharId = (s && s.character) || 'vimman';
    const curChar = chars.find(function(c){ return c.id === curCharId; }) || { id:'vimman', hp:28, atk:1, def:0, name:'VimMaster' };
    const baseHP = (curChar.hp || 28) + (s && s.skills && s.skills.health ? s.skills.health * 8 : 0) + stats.hp;
    const atk = (curChar.atk || 1) + (s && s.skills && s.skills.power ? s.skills.power : 0) + stats.atk;

    // ── Character select button ───────────────────────────────────
    const csBtnY = 68;
    const isCsBtnSel = (charCursor === -1);
    ctx.fillStyle = isCsBtnSel ? 'rgba(50,100,20,0.9)' : 'rgba(30,60,10,0.7)';
    ctx.fillRect(8, csBtnY, W - 16, 26);
    ctx.strokeStyle = isCsBtnSel ? '#88ff44' : '#44ff88';
    ctx.lineWidth = isCsBtnSel ? 2 : 1;
    ctx.strokeRect(8, csBtnY, W - 16, 26);
    ctx.fillStyle = isCsBtnSel ? '#aaffaa' : '#44ff88';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚔ キャラクター変更  [Enter/l で選択画面へ]', 18, csBtnY + 17);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('▶ ' + (curChar.name || curCharId), W - 16, csBtnY + 17);

    // ── Character stats panel ─────────────────────────────────────
    const spY = csBtnY + 32;
    ctx.fillStyle = 'rgba(0,10,30,0.85)';
    ctx.fillRect(8, spY, 200, 94);
    ctx.strokeStyle = '#224466';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, spY, 200, 94);

    // Character portrait
    _drawCharPortrait(curCharId, 48, spY + 50, 1.6);

    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(curChar.name || curCharId, 90, spY + 16);
    ctx.fillStyle = '#44ff88';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('Lv.' + (s ? s.level : 1), 90, spY + 30);
    ctx.fillStyle = '#88aaff';
    ctx.font = '10px monospace';
    ctx.fillText('MaxHP: ' + baseHP, 90, spY + 46);
    ctx.fillText('ATK:   ' + atk, 90, spY + 58);
    ctx.fillText('DEF:   ' + ((curChar.def||0) + stats.def), 90, spY + 70);
    ctx.fillStyle = '#ffdd44';
    ctx.fillText('VimXP: ' + (s ? s.vimXP : 0), 90, spY + 84);

    // ── Equipment slots ───────────────────────────────────────────
    const eqY = spY + 100;
    ctx.fillStyle = '#445566';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('── EQUIPMENT ──────────────────────────────', 12, eqY);

    const slots = [
      { key:'weapon',    label:'WEAPON   ', cursor:0 },
      { key:'armor',     label:'ARMOR    ', cursor:1 },
      { key:'accessory', label:'ACCESSORY', cursor:2 },
    ];
    slots.forEach(function(sl, i) {
      const by = eqY + 10 + i * 32;
      const isSel = (charCursor === sl.cursor);
      const item = equipItem(sl.key);
      const tierColor = item ? (TIER_COLORS[item.tier] || '#aaaacc') : '#445566';
      ctx.fillStyle = isSel ? 'rgba(40,80,160,0.7)' : 'rgba(10,20,50,0.5)';
      ctx.fillRect(12, by, W - 24, 28);
      if (isSel) {
        ctx.strokeStyle = tierColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(12, by, W - 24, 28);
      }
      ctx.fillStyle = '#556677';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(sl.label, 18, by + 11);
      ctx.fillStyle = isSel ? tierColor : tierColor + '99';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(equipName(sl.key), 100, by + 11);
      if (item) {
        ctx.fillStyle = '#556677';
        ctx.font = '9px monospace';
        ctx.fillText(item.desc, 100, by + 22);
      }
      ctx.fillStyle = isSel ? '#aaaaff' : '#334455';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(isSel ? 'Enter:変更' : '', W - 16, by + 17);
    });

    // ── Skills section ────────────────────────────────────────────
    const skY = eqY + 110;
    ctx.fillStyle = '#445566';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('── SKILLS  (VimXP:' + (s ? s.vimXP : 0) + ') ──────────────────', 12, skY);

    // Show 5 skills (scroll if needed)
    const skStart = Math.max(0, charCursor - 3 - 2);  // small scroll
    const visSkills = MENU_SKILLS.slice(skStart, skStart + 4);
    visSkills.forEach(function(sk, vi) {
      const i = skStart + vi;
      const by = skY + 10 + vi * 34;
      const lv = skLv(sk.id);
      const isSel = (charCursor === i + 3);
      const canUp = (lv < sk.maxLv && s && s.vimXP >= sk.cost);
      ctx.fillStyle = isSel ? 'rgba(40,80,140,0.6)' : 'rgba(10,10,40,0.4)';
      ctx.fillRect(12, by, W - 24, 30);
      if (isSel) {
        ctx.strokeStyle = canUp ? '#ffdd44' : '#445566';
        ctx.lineWidth = 1;
        ctx.strokeRect(12, by, W - 24, 30);
      }
      let dots = '';
      for (let d = 0; d < sk.maxLv; d++) dots += d < lv ? '●' : '○';
      ctx.fillStyle = lv > 0 ? '#44ff88' : '#556677';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(sk.name + ' ' + dots, 20, by + 13);
      ctx.fillStyle = '#778899';
      ctx.font = '9px monospace';
      ctx.fillText(sk.desc, 20, by + 24);
      ctx.fillStyle = canUp ? '#ffdd44' : '#445566';
      ctx.textAlign = 'right';
      ctx.font = '9px monospace';
      ctx.fillText(lv >= sk.maxLv ? 'MAX' : 'Cost:' + sk.cost + 'XP', W - 18, by + 17);
    });

    // Bottom hint
    ctx.fillStyle = '#334455';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('j/k: 移動  Enter/l: 装備変更/スキルUP  c: キャラ変更  h: HOME', W / 2, H - 36);
    drawVimStatusline();
  }

  function drawEquipPicker(slot) {
    ctx.fillStyle = 'rgba(0,0,20,0.92)';
    ctx.fillRect(0, 0, W, H);
    const slotLabel = slot === 'weapon' ? 'WEAPON' : slot === 'armor' ? 'ARMOR' : 'ACCESSORY';
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('── ' + slotLabel + ' 選択 ──', W / 2, 80);

    const items = ownedItems(slot);
    items.forEach(function(item, i) {
      const by = 100 + i * 40;
      const isSel = (charPickCursor === i);
      const tierColor = TIER_COLORS[item.tier] || '#aaaacc';
      const isEquipped = (window.SAVE.equip[slot] === item.id);
      ctx.fillStyle = isSel ? 'rgba(40,80,160,0.8)' : 'rgba(10,10,40,0.5)';
      ctx.fillRect(40, by, W - 80, 36);
      if (isSel) {
        ctx.strokeStyle = tierColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(40, by, W - 80, 36);
      }
      ctx.fillStyle = isSel ? tierColor : tierColor + '88';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText((isEquipped ? '▶ ' : '  ') + item.name, 52, by + 15);
      ctx.fillStyle = '#778899';
      ctx.font = '9px monospace';
      ctx.fillText(item.desc, 52, by + 28);
      // Stats
      const statStr = [];
      if (item.atk) statStr.push('ATK+' + item.atk);
      if (item.def) statStr.push('DEF+' + item.def);
      if (item.hp)  statStr.push('HP+' + item.hp);
      if (item.spd) statStr.push('SPD+' + item.spd + '%');
      if (item.xp)  statStr.push('XP+' + item.xp + '%');
      ctx.fillStyle = '#ffaa44';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(statStr.join(' '), W - 48, by + 15);
    });

    ctx.fillStyle = '#334455';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('j/k: 選択  Enter: 装備  Esc: キャンセル', W / 2, H - 36);
    drawVimStatusline();
  }

  function _drawPlayerPixel(cx, cy) {
    // Simple pixel art of the player character
    ctx.fillStyle = '#2255ff';
    ctx.fillRect(cx - 8, cy, 16, 12);
    ctx.fillStyle = '#5599ff';
    ctx.fillRect(cx - 8, cy, 16, 5);
    ctx.fillStyle = '#55aaff';
    ctx.fillRect(cx - 7, cy - 14, 14, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy - 10, 5, 5);
    ctx.fillStyle = '#000033';
    ctx.fillRect(cx + 2, cy - 9, 2, 3);
    ctx.fillStyle = '#2255ff';
    ctx.fillRect(cx - 6, cy + 12, 5, 10);
    ctx.fillRect(cx + 1, cy + 12, 5, 10);
  }

  function updateCharacter() {
    if (charSubState === 'charselect') {
      // Character selection screen
      const chars = window.CHARACTER_DEFS || [];
      if (justPressed('KeyJ') || justPressed('ArrowDown'))
        charSelectCursor = (charSelectCursor + 1) % Math.max(chars.length, 1);
      if (justPressed('KeyK') || justPressed('ArrowUp'))
        charSelectCursor = (charSelectCursor - 1 + Math.max(chars.length, 1)) % Math.max(chars.length, 1);
      if (isEnter() || justPressed('KeyL')) {
        const ch = chars[charSelectCursor];
        if (ch) {
          const clearedWorlds = window.SAVE ? Object.keys(window.SAVE.clearedWorlds).length : 0;
          const locked = ch.unlockReq !== null && clearedWorlds < ch.unlockReq;
          if (locked) {
            addFlash('World ' + ch.unlockReq + ' を制覇するとアンロックされます！');
          } else {
            window.SAVE.character = ch.id;
            window.saveSave();
            addFlash((ch.name || ch.id) + ' を選択しました！');
            charSubState = 'main';
          }
        }
      }
      if (justPressed('Escape') || justPressed('KeyH')) {
        charSubState = 'main';
      }
      return;
    }

    if (charSubState !== 'main') {
      // Equipment picker
      const slot = charSubState.replace('_pick', '');
      const items = ownedItems(slot);
      if (justPressed('KeyJ') || justPressed('ArrowDown'))
        charPickCursor = (charPickCursor + 1) % Math.max(items.length, 1);
      if (justPressed('KeyK') || justPressed('ArrowUp'))
        charPickCursor = (charPickCursor - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
      if (isEnter() || justPressed('KeyL')) {
        if (items[charPickCursor]) {
          window.SAVE.equip[slot] = items[charPickCursor].id;
          window.saveSave();
          addFlash(items[charPickCursor].name + ' を装備しました！');
        }
        charSubState = 'main';
      }
      if (justPressed('Escape') || justPressed('KeyH')) {
        charSubState = 'main';
      }
      return;
    }

    // charCursor: -1 = character select button, 0-2 = equip, 3+ = skills
    const totalItems = 3 + MENU_SKILLS.length;
    if (justPressed('KeyJ') || justPressed('ArrowDown'))
      charCursor = Math.min(charCursor + 1, totalItems - 1);
    if (justPressed('KeyK') || justPressed('ArrowUp'))
      charCursor = Math.max(charCursor - 1, -1);

    function openCharSelect() {
      charSubState = 'charselect';
      const chars = window.CHARACTER_DEFS || [];
      const curId = (window.SAVE && window.SAVE.character) || 'vimman';
      charSelectCursor = Math.max(0, chars.findIndex(function(c){ return c.id === curId; }));
    }

    if (charCursor === -1 && (isEnter() || justPressed('KeyL'))) {
      openCharSelect();
      return;
    }

    if (isEnter() || justPressed('KeyL')) {
      if (charCursor < 3) {
        // Equipment slot
        const slot = ['weapon', 'armor', 'accessory'][charCursor];
        charSubState = slot + '_pick';
        charPickCursor = 0;
        const items = ownedItems(slot);
        const equipped = window.SAVE.equip[slot];
        charPickCursor = Math.max(0, items.findIndex(function(it){ return it.id === equipped; }));
      } else {
        // Skill upgrade
        const sk = MENU_SKILLS[charCursor - 3];
        if (sk) {
          const lv = skLv(sk.id);
          if (lv < sk.maxLv && window.SAVE.vimXP >= sk.cost) {
            window.SAVE.vimXP -= sk.cost;
            if (!window.SAVE.skills) window.SAVE.skills = {};
            window.SAVE.skills[sk.id] = (window.SAVE.skills[sk.id] || 0) + 1;
            window.saveSave();
            addFlash(sk.name + ' Lv' + window.SAVE.skills[sk.id] + ' にアップグレードしました！');
          } else if (lv >= sk.maxLv) {
            addFlash(sk.name + ' は既に MAX です！');
          } else {
            addFlash('VimXP が足りません！ 必要: ' + sk.cost + '  現在: ' + window.SAVE.vimXP);
          }
        }
      }
    }

    // c key = open character select (shortcut)
    if (justPressed('KeyC')) openCharSelect();

    if (justPressed('Escape') || justPressed('KeyH')) {
      tab = 'home';
    }
    if (justPressed('Digit1')) tab = 'home';
    if (justPressed('Digit2')) { /* stay */ }
    if (justPressed('Digit3')) { tab = 'codex'; codexScroll = 0; codexCursor = 0; }
    if (justPressed('Digit4')) { tab = 'claudecode'; claudeScroll = 0; claudeCursor = 0; }
  }

  // ─────────────────────────────────────────────────────────────────
  // ── CODEX TAB ────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  function drawCodex() {
    drawStarBg();
    drawHeader();
    drawTabBar();

    const unlocked = window.countUnlockedCmds ? window.countUnlockedCmds() : 0;
    const total = window.VIM_CMD_DB ? window.VIM_CMD_DB.length : 1;

    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VIM COMMAND CODEX', 12, 80);
    ctx.fillStyle = '#44ff88';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(unlocked + ' / ' + total + ' 解放', W - 12, 80);

    // Category filter bar
    const catBarY = 86;
    const visibleCats = CODEX_CATS.slice(0, 8);
    const catW = (W - 16) / visibleCats.length;
    visibleCats.forEach(function(cat, i) {
      const isSel = (codexCatIdx === i);
      ctx.fillStyle = isSel ? 'rgba(50,80,160,0.8)' : 'rgba(10,10,40,0.5)';
      ctx.fillRect(8 + i * catW, catBarY, catW - 2, 18);
      if (isSel) {
        ctx.strokeStyle = '#5599ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(8 + i * catW, catBarY, catW - 2, 18);
      }
      ctx.fillStyle = isSel ? '#ffffff' : '#445566';
      ctx.font = isSel ? 'bold 8px monospace' : '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cat, 8 + i * catW + (catW - 2) / 2, catBarY + 12);
    });

    // Command list
    const listY = catBarY + 24;
    const listH = H - listY - 30;
    const rowH = 28;
    const maxVisible = Math.floor(listH / rowH);

    const filtered = getFilteredCmds();
    const displayCmds = filtered.slice(codexScroll, codexScroll + maxVisible);

    // Clipping rect for list area
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, listY, W, listH);
    ctx.clip();

    displayCmds.forEach(function(cmd, vi) {
      const i = codexScroll + vi;
      const by = listY + vi * rowH;
      const isUnlocked = window.SAVE && window.SAVE.unlockedCmds[cmd.id];
      const isSel = (codexCursor === i);
      const tierColor = TIER_COLORS[cmd.tier] || '#aaaacc';

      ctx.fillStyle = isSel ? 'rgba(40,70,140,0.7)' : (isUnlocked ? 'rgba(10,20,50,0.5)' : 'rgba(5,5,20,0.4)');
      ctx.fillRect(6, by + 2, W - 12, rowH - 2);
      if (isSel) {
        ctx.strokeStyle = isUnlocked ? tierColor : '#445566';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, by + 2, W - 12, rowH - 2);
      }

      if (isUnlocked) {
        // Lock/unlock icon
        ctx.fillStyle = '#44ff88';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('🔓', 10, by + 16);
        // Command
        ctx.fillStyle = tierColor;
        ctx.font = 'bold 11px monospace';
        ctx.fillText(cmd.cmd, 30, by + 15);
        // Category
        ctx.fillStyle = '#446688';
        ctx.font = '8px monospace';
        ctx.fillText('[' + cmd.cat + ']', 110, by + 15);
        // Description
        ctx.fillStyle = '#99aacc';
        ctx.font = '9px monospace';
        ctx.fillText(cmd.desc, 30, by + 25);
        // Tier stars
        ctx.fillStyle = tierColor;
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(TIER_NAMES[cmd.tier], W - 8, by + 15);
      } else {
        // Locked
        ctx.fillStyle = '#445566';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('🔒', 10, by + 16);
        ctx.fillStyle = '#334455';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('???', 30, by + 15);
        ctx.fillStyle = '#334455';
        ctx.font = '9px monospace';
        const wo = cmd.unlockWorld;
        ctx.fillText('World ' + wo + ' ボスを倒すとアンロック', 52, by + 15);
        ctx.fillStyle = '#223344';
        ctx.font = '8px monospace';
        ctx.fillText('[Tier ' + cmd.tier + ']', 52, by + 25);
      }
    });

    ctx.restore();

    // Scroll indicator
    if (filtered.length > maxVisible) {
      const sbX = W - 6;
      const sbH = listH;
      const sbY = listY;
      ctx.fillStyle = '#111122';
      ctx.fillRect(sbX, sbY, 4, sbH);
      const thumbH = Math.max(20, (maxVisible / filtered.length) * sbH);
      const thumbY = sbY + (codexScroll / Math.max(1, filtered.length - maxVisible)) * (sbH - thumbH);
      ctx.fillStyle = '#445577';
      ctx.fillRect(sbX, thumbY, 4, thumbH);
    }

    // Bottom hint
    ctx.fillStyle = '#334455';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('j/k: スクロール  h/l: カテゴリ  h/Esc: HOME', W / 2, H - 36);
    drawVimStatusline();
  }

  function updateCodex() {
    const filtered = getFilteredCmds();
    const maxVisible = 14; // approx
    const maxScroll = Math.max(0, filtered.length - maxVisible);

    if (justPressed('KeyJ') || justPressed('ArrowDown')) {
      codexCursor = (codexCursor + 1) % Math.max(filtered.length, 1);
      if (codexCursor >= codexScroll + maxVisible) codexScroll = codexCursor - maxVisible + 1;
      if (codexCursor < codexScroll) codexScroll = codexCursor;
    }
    if (justPressed('KeyK') || justPressed('ArrowUp')) {
      codexCursor = (codexCursor - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1);
      if (codexCursor < codexScroll) codexScroll = codexCursor;
      if (codexCursor >= codexScroll + maxVisible) codexScroll = codexCursor - maxVisible + 1;
    }
    // Category navigation
    if (justPressed('KeyL') || justPressed('ArrowRight')) {
      codexCatIdx = (codexCatIdx + 1) % CODEX_CATS.length;
      codexScroll = 0; codexCursor = 0;
    }
    if (justPressed('KeyH') || justPressed('ArrowLeft')) {
      if (codexCatIdx > 0) {
        codexCatIdx = (codexCatIdx - 1 + CODEX_CATS.length) % CODEX_CATS.length;
        codexScroll = 0; codexCursor = 0;
      } else {
        tab = 'home';
        return;
      }
    }
    if (justPressed('Escape')) {
      tab = 'home';
    }
    if (justPressed('Digit1')) tab = 'home';
    if (justPressed('Digit2')) { tab = 'character'; charSubState = 'main'; }
    if (justPressed('Digit3')) { /* stay */ }
    if (justPressed('Digit4')) { tab = 'claudecode'; claudeScroll = 0; claudeCursor = 0; }
  }

  // ─────────────────────────────────────────────────────────────────
  // ── CLAUDE CODE TAB ──────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  function getFilteredClaudeCmds() {
    const cat = CLAUDE_CATS[claudeCatIdx];
    const db = window.CLAUDE_CODE_DB || [];
    if (cat === '全て') return db;
    return db.filter(function(c){ return c.cat === cat; });
  }

  function drawClaudeCode() {
    drawStarBg();
    drawHeader();
    drawTabBar();

    // Header
    ctx.save();
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🤖 CLAUDE CODE COMMAND REFERENCE', 12, 80);
    ctx.restore();
    ctx.fillStyle = '#aa66ff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Claude Code CLI コマンド一覧', W - 12, 80);

    // Category filter bar
    const catBarY = 86;
    const catW = (W - 16) / CLAUDE_CATS.length;
    CLAUDE_CATS.forEach(function(cat, i) {
      const isSel = (claudeCatIdx === i);
      ctx.fillStyle = isSel ? 'rgba(100,50,160,0.8)' : 'rgba(30,10,50,0.5)';
      ctx.fillRect(8 + i * catW, catBarY, catW - 2, 18);
      if (isSel) {
        ctx.strokeStyle = '#aa66ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(8 + i * catW, catBarY, catW - 2, 18);
      }
      ctx.fillStyle = isSel ? '#ffffff' : '#664488';
      ctx.font = isSel ? 'bold 8px monospace' : '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cat, 8 + i * catW + (catW - 2) / 2, catBarY + 12);
    });

    // Command list
    const listY = catBarY + 24;
    const listH = H - listY - 30;
    const rowH = 30;
    const maxVisible = Math.floor(listH / rowH);

    const filtered = getFilteredClaudeCmds();
    const displayCmds = filtered.slice(claudeScroll, claudeScroll + maxVisible);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, listY, W, listH);
    ctx.clip();

    displayCmds.forEach(function(cmd, vi) {
      const i = claudeScroll + vi;
      const by = listY + vi * rowH;
      const isSel = (claudeCursor === i);

      ctx.fillStyle = isSel ? 'rgba(80,30,120,0.8)' : 'rgba(20,5,40,0.5)';
      ctx.fillRect(6, by + 2, W - 12, rowH - 2);
      if (isSel) {
        ctx.strokeStyle = '#aa66ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, by + 2, W - 12, rowH - 2);
      }

      // Category badge
      ctx.fillStyle = '#553377';
      ctx.fillRect(8, by + 6, 38, 14);
      ctx.fillStyle = '#cc99ff';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cmd.cat, 27, by + 16);

      // Command
      ctx.fillStyle = isSel ? '#ff8800' : '#ffaa44';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cmd.cmd, 52, by + 15);

      // Description
      ctx.fillStyle = '#99aacc';
      ctx.font = '9px monospace';
      ctx.fillText(cmd.desc, 52, by + 26);
    });

    ctx.restore();

    // Scroll indicator
    if (filtered.length > maxVisible) {
      const sbX = W - 6;
      const sbH = listH;
      const sbY = listY;
      ctx.fillStyle = '#1a0030';
      ctx.fillRect(sbX, sbY, 4, sbH);
      const thumbH = Math.max(20, (maxVisible / filtered.length) * sbH);
      const thumbY = sbY + (claudeScroll / Math.max(1, filtered.length - maxVisible)) * (sbH - thumbH);
      ctx.fillStyle = '#664488';
      ctx.fillRect(sbX, thumbY, 4, thumbH);
    }

    // Bottom hint
    ctx.fillStyle = '#554466';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('j/k: スクロール  h/l: カテゴリ  1-4: タブ切替', W / 2, H - 36);
    drawVimStatusline();
  }

  function updateClaudeCode() {
    const filtered = getFilteredClaudeCmds();
    const maxVisible = Math.floor((H - 140) / 30);
    const maxScroll = Math.max(0, filtered.length - maxVisible);

    if (justPressed('KeyJ') || justPressed('ArrowDown')) {
      claudeCursor = (claudeCursor + 1) % Math.max(filtered.length, 1);
      if (claudeCursor >= claudeScroll + maxVisible) claudeScroll = claudeCursor - maxVisible + 1;
      if (claudeCursor < claudeScroll) claudeScroll = claudeCursor;
    }
    if (justPressed('KeyK') || justPressed('ArrowUp')) {
      claudeCursor = (claudeCursor - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1);
      if (claudeCursor < claudeScroll) claudeScroll = claudeCursor;
      if (claudeCursor >= claudeScroll + maxVisible) claudeScroll = claudeCursor - maxVisible + 1;
    }
    // Category navigation
    if (justPressed('KeyL') || justPressed('ArrowRight')) {
      claudeCatIdx = (claudeCatIdx + 1) % CLAUDE_CATS.length;
      claudeScroll = 0; claudeCursor = 0;
    }
    if (justPressed('KeyH') || justPressed('ArrowLeft')) {
      if (claudeCatIdx > 0) {
        claudeCatIdx = (claudeCatIdx - 1 + CLAUDE_CATS.length) % CLAUDE_CATS.length;
        claudeScroll = 0; claudeCursor = 0;
      } else {
        tab = 'codex'; return;
      }
    }
    if (justPressed('Escape')) { tab = 'home'; }
    if (justPressed('Digit1')) tab = 'home';
    if (justPressed('Digit2')) { tab = 'character'; charSubState = 'main'; }
    if (justPressed('Digit3')) { tab = 'codex'; codexScroll = 0; codexCursor = 0; }
    if (justPressed('Digit4')) { /* stay */ }
  }

  // ─────────────────────────────────────────────────────────────────
  // ── Public interface ─────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  function init() {
    tab = 'home';
    homeCursor = 0;
    charCursor = 0;
    charSubState = 'main';
    codexScroll = 0;
    codexCursor = 0;
    codexCatIdx = 0;
    claudeScroll = 0;
    claudeCursor = 0;
    claudeCatIdx = 0;
    window._cmdLineHandler = null;
    if (window.loadSave) window.loadSave();
    addFlash('VIM ARCADE HOME  j/k:移動  Enter:決定  2:キャラ  3:VIM CODEX  4:CLAUDE CODE');
  }

  function update() {
    if (tab === 'home')            updateHome();
    else if (tab === 'character')  updateCharacter();
    else if (tab === 'codex')      updateCodex();
    else if (tab === 'claudecode') updateClaudeCode();

    // Global tab shortcuts (only apply if not already handled per-tab)
    if (tab !== 'home'      && justPressed('Digit1')) tab = 'home';
    if (tab !== 'character' && justPressed('Digit2')) { tab = 'character'; charSubState = 'main'; charCursor = 0; }
    if (tab !== 'codex'     && justPressed('Digit3')) { tab = 'codex'; codexScroll = 0; codexCursor = 0; }
    if (tab !== 'claudecode'&& justPressed('Digit4')) { tab = 'claudecode'; claudeScroll = 0; claudeCursor = 0; }
  }

  function draw() {
    ctx.globalAlpha = 1;
    if (tab === 'home')            drawHome();
    else if (tab === 'character')  drawCharacter();
    else if (tab === 'codex')      drawCodex();
    else if (tab === 'claudecode') drawClaudeCode();
    ctx.globalAlpha = 1;
  }

  function onKey(e) {
    // no additional handling needed
  }

  return { init:init, update:update, draw:draw, onKey:onKey };
})();
