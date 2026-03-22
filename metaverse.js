// ── METAVERSE.JS ── VIM ARCADE 仮想空間 ─────────────────────────────
(function () {
  'use strict';

  // World canvas resolution
  var W = 400, H = 300;

  // ── Zone layout ────────────────────────────────────────────────────
  var ZONES = [
    { x:0,   y:0,   w:200, h:150, bg:'#061a10', grid:'#0d3320', accent:'#1a6644',
      title:'⚔ VIM 道場', sub:'極めよ — The Vim Way', deco:['📖','⌨','🗡'] },
    { x:200, y:0,   w:200, h:150, bg:'#12100a', grid:'#251e0a', accent:'#5a4a10',
      title:'🏯 入口広場', sub:'ようこそ VIM ARCADE', deco:['🌟','🎮','✨'] },
    { x:0,   y:150, w:200, h:150, bg:'#060e1a', grid:'#0d1e33', accent:'#1a3a6a',
      title:'🐧 Linux 区', sub:'コマンドの聖地', deco:['💻','🐚','⚡'] },
    { x:200, y:150, w:200, h:150, bg:'#120818', grid:'#1e0e2a', accent:'#3a1a6a',
      title:'🕹 アーケード', sub:'遊び場 — Play Zone', deco:['👾','🎯','🏆'] },
  ];

  // Decorative props per zone
  var PROPS = [
    [{x:30,y:60,icon:'📖'},{x:80,y:100,icon:'⌨'},{x:150,y:70,icon:'🗡'}],
    [{x:230,y:50,icon:'🌟'},{x:350,y:90,icon:'🎮'},{x:280,y:110,icon:'✨'}],
    [{x:40,y:200,icon:'💻'},{x:120,y:250,icon:'🐚'},{x:170,y:220,icon:'⚡'}],
    [{x:240,y:200,icon:'👾'},{x:320,y:250,icon:'🎯'},{x:370,y:220,icon:'🏆'}],
  ];

  var AVATAR_COLORS = ['#4d96ff','#69db7c','#ff6b6b','#ffd43b','#cc5de8','#ff922b','#74c0fc','#ff8787','#20c997','#f06595'];

  function hashColor(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  // ── State ──────────────────────────────────────────────────────────
  var canvas, ctx;
  var myUid = null, myName = null, myColor = null;
  var myX = 300, myY = 75;   // spawn in 入口広場
  var myMsg = '', myMsgAt = 0;
  var focused = false, chatMode = false, chatDraft = '';
  var keys = {};
  var frame = 0;
  var users = {};   // uid → {name,x,y,color,msg,msgAt,ts}

  // Firebase
  var db = null, myRef = null, usersRef = null, lastPush = 0;

  // ── Init ───────────────────────────────────────────────────────────
  function init() {
    canvas = document.getElementById('metaverse-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width  = W;
    canvas.height = H;

    canvas.addEventListener('click',   onCanvasClick);
    canvas.addEventListener('blur',    function() { focused = false; });
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('keyup',   function(e) { keys[e.code] = false; });
    canvas.setAttribute('tabindex', '0');

    // Wire join/leave buttons
    var joinBtn   = document.getElementById('meta-join-btn');
    var nameInput = document.getElementById('meta-name-input');
    var leaveBtn  = document.getElementById('meta-leave-btn');
    if (joinBtn)   joinBtn.addEventListener('click', function() { doJoin(nameInput ? nameInput.value : ''); });
    if (nameInput) nameInput.addEventListener('keydown', function(e) { if (e.key==='Enter') doJoin(nameInput.value); });
    if (leaveBtn)  leaveBtn.addEventListener('click', doLeave);

    // Update online badge periodically
    setInterval(updateOnlineBadge, 3000);

    waitFirebase(0);
    requestAnimationFrame(tick);
  }

  function waitFirebase(n) {
    if (n > 20) return;
    if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
      return setTimeout(function() { waitFirebase(n + 1); }, 500);
    }
    try {
      db = firebase.database();
      usersRef = db.ref('vimarcade-meta/users');
      usersRef.on('value', function(snap) { users = snap.val() || {}; updateOnlineBadge(); });
    } catch(e) { db = null; }
  }

  // ── Input ──────────────────────────────────────────────────────────
  function onCanvasClick() { focused = true; canvas.focus(); }

  function onKeyDown(e) {
    if (chatMode) {
      if (e.key === 'Escape')    { chatMode = false; chatDraft = ''; }
      else if (e.key === 'Enter'){ var m = chatDraft.trim(); if (m && myUid) sendChat(m); chatMode = false; chatDraft = ''; }
      else if (e.key === 'Backspace') chatDraft = chatDraft.slice(0, -1);
      else if (e.key.length === 1 && chatDraft.length < 32) chatDraft += e.key;
      e.preventDefault();
      return;
    }
    if (!focused) return;
    if (e.key === 'Enter') { chatMode = true; e.preventDefault(); return; }
    keys[e.code] = true;
    if (e.key.startsWith('Arrow')) e.preventDefault();
  }

  // ── Game loop ──────────────────────────────────────────────────────
  function tick() {
    requestAnimationFrame(tick);
    frame++;

    if (myUid && !chatMode) {
      var spd = 2.2, moved = false;
      if (keys['ArrowUp']   || keys['KeyW']) { myY = Math.max(8,   myY - spd); moved = true; }
      if (keys['ArrowDown'] || keys['KeyS']) { myY = Math.min(H-8, myY + spd); moved = true; }
      if (keys['ArrowLeft'] || keys['KeyA']) { myX = Math.max(8,   myX - spd); moved = true; }
      if (keys['ArrowRight']|| keys['KeyD']) { myX = Math.min(W-8, myX + spd); moved = true; }
      if (moved && Date.now() - lastPush > 80) { pushPos(); lastPush = Date.now(); }
    }

    draw();
  }

  // ── Draw ───────────────────────────────────────────────────────────
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Zones
    for (var i = 0; i < ZONES.length; i++) {
      var z = ZONES[i];
      ctx.fillStyle = z.bg;
      ctx.fillRect(z.x, z.y, z.w, z.h);
      // Grid lines
      ctx.strokeStyle = z.grid;
      ctx.lineWidth = 0.5;
      for (var gx = z.x; gx <= z.x + z.w; gx += 24) {
        ctx.beginPath(); ctx.moveTo(gx, z.y); ctx.lineTo(gx, z.y + z.h); ctx.stroke();
      }
      for (var gy = z.y; gy <= z.y + z.h; gy += 24) {
        ctx.beginPath(); ctx.moveTo(z.x, gy); ctx.lineTo(z.x + z.w, gy); ctx.stroke();
      }
      // Zone border accent
      ctx.strokeStyle = z.accent + '55';
      ctx.lineWidth = 1;
      ctx.strokeRect(z.x + 1, z.y + 1, z.w - 2, z.h - 2);
      // Zone title
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = z.accent + 'dd';
      ctx.fillText(z.title, z.x + z.w / 2, z.y + 18);
      ctx.font = '8px monospace';
      ctx.fillStyle = z.accent + '88';
      ctx.fillText(z.sub, z.x + z.w / 2, z.y + 30);
    }

    // Decorative props (subtle, animated)
    ctx.font = '13px serif';
    ctx.textAlign = 'center';
    for (var pi = 0; pi < PROPS.length; pi++) {
      for (var pj = 0; pj < PROPS[pi].length; pj++) {
        var p = PROPS[pi][pj];
        var alpha = 0.2 + 0.08 * Math.sin(frame * 0.02 + pi * 1.3 + pj);
        ctx.globalAlpha = alpha;
        ctx.fillText(p.icon, p.x, p.y);
      }
    }
    ctx.globalAlpha = 1;

    // Zone dividers (dashed neon lines)
    ctx.strokeStyle = '#1a3a5a';
    ctx.lineWidth   = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(200, 0);   ctx.lineTo(200, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,   150); ctx.lineTo(W, 150); ctx.stroke();
    ctx.setLineDash([]);

    // Remote users
    var now = Date.now();
    for (var uid in users) {
      if (uid === myUid) continue;
      var u = users[uid];
      if (!u || now - (u.ts || 0) > 30000) continue;
      drawAvatar(u.x, u.y, u.name || '?', u.color || '#4d96ff', u.msg || '', u.msgAt || 0, false);
    }

    // Local avatar
    if (myUid) drawAvatar(myX, myY, myName, myColor, myMsg, myMsgAt, true);

    // Chat input bar
    if (chatMode) {
      ctx.fillStyle = 'rgba(0,4,24,0.9)';
      ctx.fillRect(0, H - 30, W, 30);
      ctx.strokeStyle = '#4d96ff44';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, H - 30, W, 30);
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#88aaff';
      ctx.fillText('💬 ' + chatDraft + (frame % 40 < 20 ? '▌' : ' '), 8, H - 10);
    }

    // Not-joined overlay
    if (!myUid) {
      ctx.fillStyle = 'rgba(0,4,20,0.80)';
      ctx.fillRect(0, 0, W, H);
      // Animated title
      var pulse = 0.85 + 0.15 * Math.sin(frame * 0.04);
      ctx.globalAlpha = pulse;
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#4d96ff';
      ctx.fillText('🌐 VIM ARCADE', W / 2, H / 2 - 32);
      ctx.globalAlpha = 1;
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#aaccff';
      ctx.fillText('メタバース仮想空間', W / 2, H / 2 - 10);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#556677';
      ctx.fillText('下のフォームから参加してください', W / 2, H / 2 + 10);
      ctx.fillStyle = '#334455';
      ctx.fillText('4つのゾーンを自由に移動・チャット可能', W / 2, H / 2 + 24);
    }

    // Hint bar (joined but unfocused)
    if (myUid && !focused && !chatMode) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, H - 18, W, 18);
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#445566';
      ctx.fillText('クリックでフォーカス  WASD/矢印 移動  Enter チャット', W / 2, H - 5);
    }
  }

  function drawAvatar(x, y, name, color, msg, msgAt, isMe) {
    x = Math.round(x); y = Math.round(y);
    var R = isMe ? 11 : 9;
    var showBubble = msg && (Date.now() - msgAt < 5000);

    ctx.save();

    // Glow for local user
    if (isMe) {
      ctx.shadowColor = color;
      ctx.shadowBlur  = 14;
    }

    // Circle
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (isMe) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Initial
    ctx.textAlign = 'center';
    ctx.font = 'bold ' + (isMe ? 11 : 10) + 'px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.charAt(0).toUpperCase(), x, y + 4);

    // Name tag
    ctx.font = '7px monospace';
    ctx.fillStyle = isMe ? '#ccffcc' : '#9bb8cc';
    ctx.fillText(name.slice(0, 12), x, y + R + 10);

    // Speech bubble
    if (showBubble) {
      var txt = msg.slice(0, 22);
      ctx.font = '8px monospace';
      var tw  = ctx.measureText(txt).width;
      var bw  = tw + 14, bh = 16;
      var bx  = Math.max(2, Math.min(W - bw - 2, x - bw / 2));
      var by  = Math.max(2, y - R - bh - 6);
      ctx.fillStyle   = 'rgba(230,245,255,0.96)';
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1;
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
      }
      ctx.fillStyle  = '#111';
      ctx.textAlign  = 'left';
      ctx.fillText(txt, bx + 6, by + 11);
      ctx.textAlign  = 'center';
    }
  }

  // ── Firebase ops ───────────────────────────────────────────────────
  function pushPos() {
    if (myRef) myRef.update({ x: Math.round(myX), y: Math.round(myY), ts: Date.now() });
  }

  function sendChat(msg) {
    myMsg = msg; myMsgAt = Date.now();
    if (myRef) myRef.update({ msg: msg, msgAt: myMsgAt, ts: Date.now() });
  }

  function updateOnlineBadge() {
    var badge = document.getElementById('meta-online-badge');
    if (!badge) return;
    var now = Date.now(), count = 0;
    for (var uid in users) {
      if (users[uid] && now - (users[uid].ts || 0) < 30000) count++;
    }
    badge.textContent = '● ' + count + ' 人オンライン';
    badge.style.color = count > 0 ? '#69db7c' : '#445566';
  }

  // ── Join / Leave ───────────────────────────────────────────────────
  function doJoin(name) {
    name = (name || '').trim().slice(0, 16);
    if (!name) return;
    myName  = name;
    myUid   = 'u' + Date.now() + Math.random().toString(36).slice(2, 7);
    myColor = hashColor(myUid);
    myX     = 210 + Math.random() * 120;
    myY     =  30 + Math.random() * 80;

    if (db && usersRef) {
      myRef = usersRef.child(myUid);
      myRef.set({ name: myName, x: Math.round(myX), y: Math.round(myY),
                  color: myColor, msg: '', msgAt: 0, ts: Date.now() });
      myRef.onDisconnect().remove();
    }

    var joinForm  = document.getElementById('meta-join-form');
    var statusBar = document.getElementById('meta-status');
    var uLabel    = document.getElementById('meta-username-label');
    if (joinForm)  joinForm.style.display  = 'none';
    if (statusBar) statusBar.style.display = 'flex';
    if (uLabel)    uLabel.textContent = '👤 ' + myName;

    focused = true;
    canvas.focus();
    updateOnlineBadge();
  }

  function doLeave() {
    if (myRef) myRef.remove();
    myUid = null; myName = null; myRef = null;
    var joinForm  = document.getElementById('meta-join-form');
    var statusBar = document.getElementById('meta-status');
    if (joinForm)  joinForm.style.display  = 'flex';
    if (statusBar) statusBar.style.display = 'none';
    updateOnlineBadge();
  }

  window.addEventListener('beforeunload', function() { if (myRef) myRef.remove(); });

  // ── Bootstrap ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
