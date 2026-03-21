// ── COMMUNITY.JS ── Real-time chat + leaderboard (Firebase) ──────────

(function() {
  'use strict';

  // ── Firebase config ─────────────────────────────────────────────
  // Replace with your actual Firebase project config from Firebase Console
  const FIREBASE_CONFIG = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId:         "YOUR_PROJECT",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
  };

  const CHAT_PATH   = 'vimarcade/chat';
  const LB_PATH     = 'vimarcade/leaderboard';
  const TIPS_PATH   = 'vimarcade/tips';
  const ONLINE_PATH = 'vimarcade/online';
  const MAX_MSGS    = 80;

  let db           = null;
  let currentUser  = null;    // { name, uid, color }
  let onlineRef    = null;
  let chatRef      = null;
  let lbRef        = null;
  let tipsRef      = null;
  let currentTab   = 'chat';
  let lbLoaded     = false;
  let tipsLoaded   = false;

  // ── Color palette for user avatars ──────────────────────────────
  const USER_COLORS = [
    '#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b',
    '#cc5de8','#20c997','#f06595','#74c0fc','#a9e34b',
  ];
  function nameToColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return USER_COLORS[Math.abs(h) % USER_COLORS.length];
  }

  // ── UID generation (persist in localStorage) ────────────────────
  function getOrCreateUID() {
    let uid = localStorage.getItem('vimarcade_uid');
    if (!uid) {
      uid = 'u' + Date.now() + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('vimarcade_uid', uid);
    }
    return uid;
  }

  // ── Safe firebase init ──────────────────────────────────────────
  function initFirebase() {
    if (typeof firebase === 'undefined') return false;
    // Prevent double-init
    if (firebase.apps && firebase.apps.length > 0) {
      db = firebase.database();
      return true;
    }
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      return true;
    } catch(e) {
      console.warn('[Community] Firebase init failed:', e.message);
      return false;
    }
  }

  // ── DOM refs ─────────────────────────────────────────────────────
  let elSection, elBody, elToggleBtn,
      elGuestBar, elUserBar, elNameInput, elJoinBtn,
      elUserLabel, elOnlineCount, elLeaveBtn,
      elMsgBox, elMsgInput, elSendBtn,
      elLbList, elMyScoreRow, elMyScoreVal, elSubmitScoreBtn,
      elTipInput, elTipBtn, elTipsList;

  function grabEls() {
    elSection       = document.getElementById('community-section');
    elBody          = document.getElementById('community-body');
    elToggleBtn     = document.getElementById('btn-community-toggle');
    elGuestBar      = document.getElementById('comm-guest-bar');
    elUserBar       = document.getElementById('comm-user-bar');
    elNameInput     = document.getElementById('comm-name-input');
    elJoinBtn       = document.getElementById('btn-comm-join');
    elUserLabel     = document.getElementById('comm-user-label');
    elOnlineCount   = document.getElementById('comm-online-count');
    elLeaveBtn      = document.getElementById('btn-comm-leave');
    elMsgBox        = document.getElementById('comm-messages');
    elMsgInput      = document.getElementById('comm-msg-input');
    elSendBtn       = document.getElementById('btn-comm-send');
    elLbList        = document.getElementById('comm-lb-list');
    elMyScoreRow    = document.getElementById('comm-my-score-row');
    elMyScoreVal    = document.getElementById('comm-my-score-val');
    elSubmitScoreBtn= document.getElementById('btn-submit-score');
    elTipInput      = document.getElementById('comm-tip-input');
    elTipBtn        = document.getElementById('btn-submit-tip');
    elTipsList      = document.querySelector('.comm-tips-list');
  }

  // ── Toggle collapse ──────────────────────────────────────────────
  function initToggle() {
    if (!elToggleBtn || !elBody) return;
    elToggleBtn.addEventListener('click', function() {
      const open = !elBody.classList.contains('hidden');
      elBody.classList.toggle('hidden', open);
      elToggleBtn.textContent = open ? '開く ▼' : '折りたたむ ▲';
    });
  }

  // ── Tab switching ────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.comm-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        const t = tab.getAttribute('data-tab');
        document.querySelectorAll('.comm-tab').forEach(function(b) { b.classList.remove('active'); });
        tab.classList.add('active');
        document.querySelectorAll('.comm-panel').forEach(function(p) { p.classList.add('hidden'); });
        const panel = document.getElementById('comm-panel-' + t);
        if (panel) panel.classList.remove('hidden');
        currentTab = t;
        if (t === 'leaderboard' && !lbLoaded) loadLeaderboard();
        if (t === 'tips' && !tipsLoaded) loadTips();
      });
    });
  }

  // ── Join community ───────────────────────────────────────────────
  function joinCommunity(name) {
    const uid   = getOrCreateUID();
    const color = nameToColor(name);
    currentUser = { name: name, uid: uid, color: color };
    localStorage.setItem('vimarcade_username', name);

    elGuestBar.classList.add('hidden');
    elUserBar.classList.remove('hidden');
    elUserLabel.innerHTML = '<span style="color:' + color + '">■</span> ' + escHtml(name);
    elMsgInput.disabled  = false;
    elSendBtn.disabled   = false;
    elTipInput.disabled  = false;
    elTipBtn.disabled    = false;

    // Register online presence
    if (db) {
      onlineRef = db.ref(ONLINE_PATH + '/' + uid);
      onlineRef.set({ name: name, color: color, ts: Date.now() });
      onlineRef.onDisconnect().remove();
      // Watch online count
      db.ref(ONLINE_PATH).on('value', function(snap) {
        const cnt = snap.numChildren();
        if (elOnlineCount) elOnlineCount.textContent = '● ' + cnt + ' オンライン';
      });
    } else {
      if (elOnlineCount) elOnlineCount.textContent = '● 1 オンライン';
    }

    // Subscribe to chat
    subscribeChat();
    checkMyScore();
  }

  function leaveCommunity() {
    if (onlineRef) { onlineRef.remove(); onlineRef = null; }
    if (chatRef)   { chatRef.off(); chatRef = null; }
    currentUser = null;
    elGuestBar.classList.remove('hidden');
    elUserBar.classList.add('hidden');
    elMsgInput.disabled  = true;
    elSendBtn.disabled   = true;
    elTipInput.disabled  = true;
    elTipBtn.disabled    = true;
    if (elMsgBox) elMsgBox.innerHTML = '';
  }

  // ── Chat ─────────────────────────────────────────────────────────
  function subscribeChat() {
    if (!db) {
      // Offline demo mode
      appendMsg({ name: '🤖 System', color: '#aaa', text: 'Firebase未設定 — オフラインモード', ts: Date.now(), system: true });
      return;
    }
    chatRef = db.ref(CHAT_PATH).limitToLast(MAX_MSGS);
    chatRef.on('child_added', function(snap) {
      const msg = snap.val();
      if (msg) appendMsg(msg);
    });
  }

  function appendMsg(msg) {
    if (!elMsgBox) return;
    const div = document.createElement('div');
    div.className = 'comm-msg' + (msg.system ? ' comm-msg-system' : '');
    const time = new Date(msg.ts || Date.now()).toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' });
    div.innerHTML =
      '<span class="comm-msg-time">' + time + '</span>' +
      '<span class="comm-msg-name" style="color:' + (msg.color || '#aaa') + '">' + escHtml(msg.name) + '</span>' +
      '<span class="comm-msg-text">' + escHtml(msg.text) + '</span>';
    elMsgBox.appendChild(div);
    // Keep max msgs in DOM
    while (elMsgBox.children.length > MAX_MSGS) elMsgBox.removeChild(elMsgBox.firstChild);
    elMsgBox.scrollTop = elMsgBox.scrollHeight;
  }

  function sendMsg() {
    if (!currentUser) return;
    const text = (elMsgInput.value || '').trim();
    if (!text) return;
    elMsgInput.value = '';

    const msg = { name: currentUser.name, color: currentUser.color, text: text, ts: Date.now() };

    if (db) {
      db.ref(CHAT_PATH).push(msg);
    } else {
      appendMsg(msg);
    }
  }

  // ── Leaderboard ──────────────────────────────────────────────────
  function loadLeaderboard() {
    lbLoaded = true;
    if (!db) {
      renderLeaderboard([]);
      return;
    }
    lbRef = db.ref(LB_PATH).orderByChild('score').limitToLast(20);
    lbRef.on('value', function(snap) {
      const rows = [];
      snap.forEach(function(child) { rows.push(child.val()); });
      rows.sort(function(a, b) { return b.score - a.score; });
      renderLeaderboard(rows);
    });
  }

  function renderLeaderboard(rows) {
    if (!elLbList) return;
    if (rows.length === 0) {
      elLbList.innerHTML = '<div class="comm-lb-loading">まだエントリーがありません。最初に登録しましょう！</div>';
      return;
    }
    elLbList.innerHTML = rows.slice(0, 20).map(function(r, i) {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
      const isMe = currentUser && r.uid === currentUser.uid;
      return '<div class="comm-lb-row' + (isMe ? ' comm-lb-me' : '') + '">' +
        '<span class="lb-rank">' + medal + '</span>' +
        '<span class="lb-name" style="color:' + (r.color || '#aaa') + '">' + escHtml(r.name) + '</span>' +
        '<span class="lb-score">' + (r.score || 0).toLocaleString() + '</span>' +
        '<span class="lb-char">' + escHtml(r.charName || '?') + '</span>' +
        '</div>';
    }).join('');
  }

  function checkMyScore() {
    if (!currentUser || !elMyScoreRow) return;
    // Get current game score from window.SAVE if available
    const save = (window.SAVE && typeof window.SAVE.getScore === 'function') ? window.SAVE.getScore() : null;
    const rawSave = localStorage.getItem('vimarcade_v3_save');
    let score = 0, charName = '?';
    if (rawSave) {
      try {
        const s = JSON.parse(rawSave);
        score    = s.totalScore || s.score || 0;
        charName = s.charId || s.character || '?';
      } catch(e) {}
    }
    if (score > 0) {
      elMyScoreRow.classList.remove('hidden');
      if (elMyScoreVal) elMyScoreVal.textContent = 'あなたのスコア: ' + score.toLocaleString();
      if (elSubmitScoreBtn) {
        elSubmitScoreBtn._score    = score;
        elSubmitScoreBtn._charName = charName;
      }
    }
  }

  function submitScore(score, charName) {
    if (!currentUser) return;
    const entry = {
      uid:      currentUser.uid,
      name:     currentUser.name,
      color:    currentUser.color,
      score:    score,
      charName: charName,
      ts:       Date.now()
    };
    if (db) {
      db.ref(LB_PATH + '/' + currentUser.uid).set(entry);
    }
    if (elMyScoreRow) elMyScoreRow.classList.add('hidden');
  }

  // ── Tips ─────────────────────────────────────────────────────────
  function loadTips() {
    tipsLoaded = true;
    if (!db) return;
    tipsRef = db.ref(TIPS_PATH).limitToLast(30);
    tipsRef.on('child_added', function(snap) {
      const tip = snap.val();
      if (tip && elTipsList) {
        const div = document.createElement('div');
        div.className = 'comm-tip-item comm-tip-user';
        div.innerHTML =
          '<span style="color:' + (tip.color || '#aaa') + '">' + escHtml(tip.name) + ':</span> ' +
          escHtml(tip.text);
        elTipsList.appendChild(div);
      }
    });
  }

  function submitTip() {
    if (!currentUser) return;
    const text = (elTipInput.value || '').trim();
    if (!text) return;
    elTipInput.value = '';
    const tip = { name: currentUser.name, color: currentUser.color, text: text, ts: Date.now() };
    if (db) {
      db.ref(TIPS_PATH).push(tip);
    } else {
      if (elTipsList) {
        const div = document.createElement('div');
        div.className = 'comm-tip-item comm-tip-user';
        div.innerHTML = '<span style="color:' + tip.color + '">' + escHtml(tip.name) + ':</span> ' + escHtml(tip.text);
        elTipsList.appendChild(div);
      }
    }
  }

  // ── XSS safe escape ──────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Init ─────────────────────────────────────────────────────────
  window.addEventListener('load', function() {
    grabEls();
    if (!elSection) return;

    initFirebase();
    initToggle();
    initTabs();

    // Restore username
    const savedName = localStorage.getItem('vimarcade_username');
    if (savedName && elNameInput) elNameInput.value = savedName;

    // Join button
    if (elJoinBtn) {
      elJoinBtn.addEventListener('click', function() {
        const name = (elNameInput ? elNameInput.value : '').trim();
        if (!name) { elNameInput && elNameInput.focus(); return; }
        joinCommunity(name);
      });
    }
    if (elNameInput) {
      elNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') elJoinBtn && elJoinBtn.click();
      });
    }

    // Leave button
    if (elLeaveBtn) {
      elLeaveBtn.addEventListener('click', leaveCommunity);
    }

    // Send message
    if (elSendBtn) {
      elSendBtn.addEventListener('click', sendMsg);
    }
    if (elMsgInput) {
      elMsgInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendMsg();
      });
    }

    // Submit score
    if (elSubmitScoreBtn) {
      elSubmitScoreBtn.addEventListener('click', function() {
        submitScore(elSubmitScoreBtn._score || 0, elSubmitScoreBtn._charName || '?');
      });
    }

    // Submit tip
    if (elTipBtn) {
      elTipBtn.addEventListener('click', submitTip);
    }
    if (elTipInput) {
      elTipInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') submitTip();
      });
    }

    // Auto-join if saved name
    if (savedName) {
      joinCommunity(savedName);
    }
  });

})();
