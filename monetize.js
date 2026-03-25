// ── MONETIZE.JS ── Aggressive-but-legitimate monetization ──────────────
(function () {
  'use strict';

  var PUB = 'ca-pub-3016615146886765';

  // ── Helpers ─────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function ss(k, v) { try { sessionStorage.setItem(k, v); } catch(e) {} }
  function sg(k)    { try { return sessionStorage.getItem(k); } catch(e) { return null; } }
  function ls(k, v) { try { localStorage.setItem(k, v); } catch(e) {} }
  function lg(k)    { try { return localStorage.getItem(k); } catch(e) { return null; } }

  // ── Push fresh AdSense unit into a container ─────────────────────────
  function pushAd(containerId, w, h) {
    var c = $(containerId);
    if (!c) return;
    c.innerHTML = '';
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = 'display:block;width:' + w + 'px;height:' + h + 'px;';
    ins.setAttribute('data-ad-client', PUB);
    ins.setAttribute('data-ad-slot', 'auto');
    c.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
  }

  // ── Inject overlay HTML ──────────────────────────────────────────────
  function buildOverlays() {
    var root = document.createElement('div');
    root.id = 'mn-root';
    root.innerHTML = [
      // ── Interstitial (game events) ──────────────────────────
      '<div id="mn-inter" style="display:none">',
        '<div id="mn-inter-box">',
          '<div id="mn-inter-top">',
            '<span id="mn-skip-timer">3秒後にスキップ</span>',
            '<button id="mn-inter-close" style="display:none" onclick="window._mnCloseInter()">✕ スキップ</button>',
          '</div>',
          '<div id="mn-inter-ad"></div>',
          '<div id="mn-inter-links">',
            '<span style="font-size:11px;color:#5a7a9a;display:block;margin-bottom:8px;">または</span>',
            '<a class="mn-link-btn mn-gold" href="ai-money.html" target="_blank" rel="noopener">📈 AIで副業収益を作る方法を見る</a>',
            '<a class="mn-link-btn mn-tiktok" href="https://lite.tiktok.com/t/ZS9RWM7Yu14kT-H5ekI/" target="_blank" rel="noopener">📱 TikTok Liteをインストール</a>',
          '</div>',
        '</div>',
      '</div>',

      // ── Rewarded XP modal ────────────────────────────────────
      '<div id="mn-reward" style="display:none">',
        '<div id="mn-reward-box">',
          '<div id="mn-reward-top">',
            '<span>📺 広告を視聴中…</span>',
            '<button onclick="window._mnCloseReward()">✕</button>',
          '</div>',
          '<div id="mn-reward-ad"></div>',
          '<div id="mn-reward-bottom">',
            '<span id="mn-reward-timer">あと <strong id="mn-reward-secs">5</strong> 秒</span>',
            '<button id="mn-reward-claim" style="display:none" onclick="window._mnClaimReward()">',
              '✅ +500 XP を受け取る',
            '</button>',
          '</div>',
        '</div>',
      '</div>',

      // ── Exit intent overlay ──────────────────────────────────
      '<div id="mn-exit" style="display:none">',
        '<div id="mn-exit-box">',
          '<button class="mn-x" onclick="window._mnCloseExit()">✕</button>',
          '<div id="mn-exit-ad"></div>',
          '<div id="mn-exit-body">',
            '<p class="mn-exit-head">ちょっと待って</p>',
            '<p class="mn-exit-sub">AIを使えばゲームをしながら副業収益を作る仕組みが構築できます。無料ロードマップを確認してみてください。</p>',
            '<a class="mn-link-btn mn-gold" href="ai-money.html" target="_blank" rel="noopener">📈 無料ロードマップを見る</a>',
            '<a class="mn-link-btn" href="https://temu.com/s/tfR8P5DNNWrkN" target="_blank" rel="noopener" style="border-color:rgba(255,102,0,0.3);color:#ff8844;">🛍 Temuでお得にPC周辺機器を見る</a>',
          '</div>',
        '</div>',
      '</div>',

      // ── Timed toast (bottom-right, 90s) ─────────────────────
      '<div id="mn-toast" style="display:none">',
        '<button class="mn-x" onclick="document.getElementById(\'mn-toast\').style.display=\'none\'">✕</button>',
        '<p class="mn-toast-head">📈 AIで副業を始める</p>',
        '<p class="mn-toast-sub">スキルゼロから月10万円の仕組みを構築する完全ロードマップを無料公開中。</p>',
        '<a href="ai-money.html" target="_blank" rel="noopener" class="mn-link-btn mn-gold" style="font-size:11px;padding:8px 14px;">ロードマップを見る →</a>',
      '</div>',
    ].join('');
    document.body.appendChild(root);
  }

  // ── Inject CSS ───────────────────────────────────────────────────────
  function buildCSS() {
    var s = document.createElement('style');
    s.textContent = [
      // Interstitial overlay
      '#mn-inter{position:fixed;inset:0;background:rgba(0,4,16,0.94);z-index:10000;display:flex;align-items:center;justify-content:center;}',
      '#mn-inter-box{background:#070d1e;border:1px solid rgba(85,153,255,0.2);border-radius:10px;padding:20px;max-width:380px;width:92%;display:flex;flex-direction:column;align-items:center;gap:14px;position:relative;}',
      '#mn-inter-top{width:100%;display:flex;justify-content:flex-end;align-items:center;min-height:28px;}',
      '#mn-skip-timer{font-size:11px;color:#5a7a9a;font-family:monospace;}',
      '#mn-inter-close{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);color:#c8d8f0;font-family:monospace;font-size:11px;padding:5px 12px;border-radius:20px;cursor:pointer;transition:background .15s;}',
      '#mn-inter-close:hover{background:rgba(255,255,255,0.15);}',
      '#mn-inter-ad{width:300px;height:250px;background:#030710;border-radius:6px;overflow:hidden;}',
      '#mn-inter-links{display:flex;flex-direction:column;gap:8px;width:100%;}',

      // Reward modal
      '#mn-reward{position:fixed;inset:0;background:rgba(0,4,16,0.94);z-index:10000;display:flex;align-items:center;justify-content:center;}',
      '#mn-reward-box{background:#070d1e;border:1px solid rgba(68,255,136,0.2);border-radius:10px;padding:18px;max-width:360px;width:92%;display:flex;flex-direction:column;align-items:center;gap:14px;}',
      '#mn-reward-top{width:100%;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;color:#c8d8f0;}',
      '#mn-reward-top button{background:none;border:none;color:#5a7a9a;font-size:18px;cursor:pointer;}',
      '#mn-reward-ad{width:300px;height:250px;background:#030710;border-radius:6px;overflow:hidden;}',
      '#mn-reward-bottom{display:flex;flex-direction:column;align-items:center;gap:8px;}',
      '#mn-reward-timer{font-size:13px;color:#5a7a9a;font-family:monospace;}',
      '#mn-reward-claim{background:linear-gradient(135deg,#00aa44,#44ff88);color:#000;font-family:monospace;font-size:13px;font-weight:900;padding:12px 28px;border:none;border-radius:6px;cursor:pointer;letter-spacing:1px;transition:opacity .15s;}',
      '#mn-reward-claim:hover{opacity:.85;}',

      // Exit intent
      '#mn-exit{position:fixed;inset:0;background:rgba(0,4,16,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;}',
      '#mn-exit-box{background:#070d1e;border:1px solid rgba(255,204,0,0.2);border-radius:10px;padding:24px;max-width:420px;width:100%;display:flex;flex-direction:column;align-items:center;gap:14px;position:relative;}',
      '.mn-x{position:absolute;top:10px;right:12px;background:none;border:none;color:#5a7a9a;font-size:20px;cursor:pointer;line-height:1;}',
      '#mn-exit-ad{width:300px;height:250px;background:#030710;border-radius:6px;overflow:hidden;}',
      '#mn-exit-body{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;text-align:center;}',
      '.mn-exit-head{font-size:17px;font-weight:900;color:#c8d8f0;}',
      '.mn-exit-sub{font-size:12px;color:#5a7a9a;line-height:1.7;max-width:320px;}',

      // Toast (bottom-right)
      '#mn-toast{position:fixed;bottom:24px;right:20px;z-index:9000;background:#070d1e;border:1px solid rgba(255,204,0,0.25);border-radius:10px;padding:16px 18px 14px;max-width:260px;display:flex;flex-direction:column;gap:8px;box-shadow:0 4px 24px rgba(0,0,0,0.5);}',
      '#mn-toast .mn-x{position:absolute;top:8px;right:10px;}',
      '.mn-toast-head{font-size:13px;font-weight:900;color:#c8d8f0;padding-right:20px;}',
      '.mn-toast-sub{font-size:11px;color:#5a7a9a;line-height:1.6;}',

      // Shared link buttons
      '.mn-link-btn{display:block;width:100%;text-align:center;padding:10px 16px;border-radius:6px;font-family:monospace;font-size:12px;font-weight:700;text-decoration:none;border:1px solid rgba(85,153,255,0.25);color:#88aaff;transition:background .15s,border-color .15s;box-sizing:border-box;}',
      '.mn-link-btn:hover{background:rgba(85,153,255,0.1);border-color:rgba(85,153,255,0.4);}',
      '.mn-gold{background:linear-gradient(135deg,#cc8800,#ffcc00)!important;color:#000!important;border:none!important;font-weight:900!important;}',
      '.mn-gold:hover{opacity:.85;background:linear-gradient(135deg,#cc8800,#ffcc00)!important;}',
      '.mn-tiktok{border-color:rgba(255,0,80,0.3)!important;color:#ff6699!important;}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── Interstitial ─────────────────────────────────────────────────────
  var INTER_COOLDOWN = 3 * 60 * 1000;
  var interLastTime  = 0;
  var interCount     = 0;
  var MAX_INTER      = 6;

  window.showInterstitial = function () {
    var now = Date.now();
    if (now - interLastTime < INTER_COOLDOWN) return;
    interCount++;
    if (interCount > MAX_INTER) return;
    // Show every other event (stageclear + gameover happen close together)
    if (interCount % 2 !== 0 && interCount !== 1) return;
    interLastTime = now;
    _openInter();
  };

  function _openInter() {
    var overlay = $('mn-inter');
    if (!overlay) return;
    overlay.style.display = 'flex';
    pushAd('mn-inter-ad', 300, 250);
    // Skip button countdown
    var closeBtn  = $('mn-inter-close');
    var timerSpan = $('mn-skip-timer');
    if (closeBtn)  closeBtn.style.display = 'none';
    if (timerSpan) timerSpan.style.display = 'inline';
    var secs = 3;
    if (timerSpan) timerSpan.textContent = secs + '秒後にスキップ';
    var tick = setInterval(function () {
      secs--;
      if (secs > 0) {
        if (timerSpan) timerSpan.textContent = secs + '秒後にスキップ';
      } else {
        clearInterval(tick);
        if (timerSpan) timerSpan.style.display = 'none';
        if (closeBtn)  closeBtn.style.display = 'flex';
      }
    }, 1000);
  }

  window._mnCloseInter = function () {
    var el = $('mn-inter');
    if (el) el.style.display = 'none';
  };

  // ── Rewarded XP ──────────────────────────────────────────────────────
  var rewardUses    = 0;
  var MAX_REWARD    = 3;
  var rewardPending = false;

  window._openRewardAd = function () {
    if (rewardUses >= MAX_REWARD) {
      alert('本日の上限（' + MAX_REWARD + '回）に達しました。明日また利用できます。');
      return;
    }
    var overlay = $('mn-reward');
    if (!overlay) return;
    overlay.style.display = 'flex';
    pushAd('mn-reward-ad', 300, 250);
    rewardPending = true;
    var secs = 5;
    var secsEl = $('mn-reward-secs');
    var claimBtn = $('mn-reward-claim');
    var timerEl  = $('mn-reward-timer');
    if (claimBtn) claimBtn.style.display = 'none';
    if (timerEl)  timerEl.style.display  = 'block';
    if (secsEl)   secsEl.textContent = secs;
    var tick = setInterval(function () {
      secs--;
      if (secsEl) secsEl.textContent = Math.max(0, secs);
      if (secs <= 0) {
        clearInterval(tick);
        if (timerEl)  timerEl.style.display  = 'none';
        if (claimBtn) claimBtn.style.display = 'block';
      }
    }, 1000);
  };

  window._mnCloseReward = function () {
    var el = $('mn-reward');
    if (el) el.style.display = 'none';
    rewardPending = false;
  };

  window._mnClaimReward = function () {
    if (!rewardPending) return;
    rewardUses++;
    rewardPending = false;
    // Grant XP via window.SAVE
    if (window.SAVE) {
      window.SAVE.vimXP = (window.SAVE.vimXP || 0) + 500;
      if (window.saveSave) try { window.saveSave(); } catch(e) {}
    }
    var el = $('mn-reward');
    if (el) el.style.display = 'none';
    // Update button label
    var remaining = MAX_REWARD - rewardUses;
    var btn = $('mn-reward-btn');
    if (btn) {
      if (remaining <= 0) {
        btn.disabled = true;
        btn.textContent = '本日は上限に達しました';
        btn.style.opacity = '0.4';
      } else {
        btn.textContent = '📺 広告を見て +500 XP（残り' + remaining + '回）';
      }
    }
    // Visual feedback
    var fb = document.createElement('div');
    fb.textContent = '+500 XP !';
    fb.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:32px;font-weight:900;color:#44ff88;font-family:monospace;z-index:10001;pointer-events:none;animation:mnXpPop 1.2s forwards;';
    document.body.appendChild(fb);
    setTimeout(function () { fb.remove(); }, 1200);
  };

  // ── Exit intent ──────────────────────────────────────────────────────
  var exitReady = false;
  setTimeout(function () { exitReady = true; }, 30000); // arm after 30s

  function initExitIntent() {
    document.addEventListener('mouseleave', function (e) {
      if (e.clientY > 5) return;
      if (!exitReady) return;
      if (sg('mn_exit_shown')) return;
      ss('mn_exit_shown', '1');
      _openExit();
    });
  }

  function _openExit() {
    var el = $('mn-exit');
    if (!el) return;
    el.style.display = 'flex';
    pushAd('mn-exit-ad', 300, 250);
  }

  window._mnCloseExit = function () {
    var el = $('mn-exit');
    if (el) el.style.display = 'none';
  };

  // ── Timed toast (90s, once per session) ──────────────────────────────
  function initTimedToast() {
    if (sg('mn_toast_shown')) return;
    setTimeout(function () {
      if (sg('mn_toast_shown')) return;
      ss('mn_toast_shown', '1');
      var el = $('mn-toast');
      if (el) el.style.display = 'flex';
    }, 90000);
  }

  // ── Scroll depth trigger (70%, once per session) ─────────────────────
  function initScrollTrigger() {
    if (sg('mn_scroll_shown')) return;
    window.addEventListener('scroll', function () {
      if (sg('mn_scroll_shown')) return;
      var pct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (pct < 0.7) return;
      ss('mn_scroll_shown', '1');
      // Re-show toast if not already visible
      var t = $('mn-toast');
      if (t && t.style.display === 'none') t.style.display = 'flex';
    });
  }

  // ── Reward button in sidebar ─────────────────────────────────────────
  function injectRewardButton() {
    var target = document.getElementById('ai-money-cta');
    if (!target) return;
    var btn = document.createElement('button');
    btn.id = 'mn-reward-btn';
    btn.onclick = function () { window._openRewardAd(); };
    btn.textContent = '📺 広告を見て +500 XP（残り' + MAX_REWARD + '回）';
    btn.style.cssText = [
      'display:block;width:100%;',
      'background:rgba(68,255,136,0.1);',
      'border:1px solid rgba(68,255,136,0.25);',
      'color:#44ff88;',
      'font-family:monospace;font-size:11px;font-weight:700;',
      'padding:10px;border-radius:6px;cursor:pointer;',
      'letter-spacing:1px;margin-bottom:8px;',
      'transition:background .15s;',
    ].join('');
    btn.addEventListener('mouseover', function () {
      btn.style.background = 'rgba(68,255,136,0.18)';
    });
    btn.addEventListener('mouseout', function () {
      btn.style.background = 'rgba(68,255,136,0.1)';
    });
    target.parentNode.insertBefore(btn, target);
  }

  // ── AdSense auto ads ─────────────────────────────────────────────────
  function enableAutoAds() {
    // Enable Google auto ads (anchor + vignette + in-page)
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({
        google_ad_client: PUB,
        enable_page_level_ads: true,
        overlays: { bottom: true }
      });
    } catch(e) {}
  }

  // ── XP pop animation ─────────────────────────────────────────────────
  function injectKeyframes() {
    var s = document.createElement('style');
    s.textContent = '@keyframes mnXpPop{0%{opacity:1;transform:translate(-50%,-50%) scale(0.8);}50%{opacity:1;transform:translate(-50%,-120%) scale(1.2);}100%{opacity:0;transform:translate(-50%,-180%) scale(1);}}';
    document.head.appendChild(s);
  }

  // ── Init ─────────────────────────────────────────────────────────────
  window.addEventListener('load', function () {
    buildCSS();
    injectKeyframes();
    buildOverlays();
    initExitIntent();
    initTimedToast();
    initScrollTrigger();
    injectRewardButton();
    enableAutoAds();
  });

})();
