// ── MOBILE.JS ── Touch controls + responsive scaling ──────────────

(function() {
  'use strict';

  // ── Detect touch device ───────────────────────────────────────
  const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  function initMobile() {
    const mobileControls = document.getElementById('mobile-controls');
    const kbdDisplay     = document.getElementById('kbd-display');
    const canvas         = document.getElementById('gameCanvas');
    if (!mobileControls || !canvas) return;

    if (isTouchDevice) {
      mobileControls.classList.remove('hidden');
      mobileControls.classList.add('visible');
      if (kbdDisplay) kbdDisplay.classList.add('hidden');
    }

    // ── Canvas scaling ────────────────────────────────────────────
    function scaleCanvas() {
      const maxW = Math.min(window.innerWidth - 8, 512);
      const scale = maxW / 512;
      canvas.style.width  = Math.round(512 * scale) + 'px';
      canvas.style.height = Math.round(480 * scale) + 'px';
    }
    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);
    window.addEventListener('orientationchange', function() {
      setTimeout(scaleCanvas, 200);
    });

    // ── Keyboard simulation via touch ─────────────────────────────
    function fireKey(code, type) {
      const codeKeyMap = {
        'Space':' ', 'ArrowLeft':'ArrowLeft', 'ArrowRight':'ArrowRight',
        'ArrowUp':'ArrowUp', 'ArrowDown':'ArrowDown', 'Escape':'Escape',
        'Enter':'Enter', 'KeyX':'x', 'KeyS':'s', 'KeyI':'i', 'KeyV':'v',
        'KeyH':'h', 'KeyJ':'j', 'KeyK':'k', 'KeyL':'l',
      };
      const keyVal = codeKeyMap[code] || code.replace('Key','').toLowerCase();
      const evt = new KeyboardEvent(type, {
        code: code, key: keyVal, bubbles: true, cancelable: true
      });
      window.dispatchEvent(evt);
    }

    // ── Wire single-key buttons ───────────────────────────────────
    const singleBtns = mobileControls.querySelectorAll('[data-key]');
    singleBtns.forEach(function(btn) {
      const code = btn.getAttribute('data-key');

      btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        btn.classList.add('touch-active');
        fireKey(code, 'keydown');
      }, { passive: false });

      btn.addEventListener('touchend', function(e) {
        e.preventDefault();
        btn.classList.remove('touch-active');
        fireKey(code, 'keyup');
      }, { passive: false });

      btn.addEventListener('touchcancel', function() {
        btn.classList.remove('touch-active');
        fireKey(code, 'keyup');
      });
    });

    // ── Wire sequence buttons (dd / yy / ss) ─────────────────────
    const seqBtns = mobileControls.querySelectorAll('[data-key-seq]');
    seqBtns.forEach(function(btn) {
      const seq = btn.getAttribute('data-key-seq');
      btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        btn.classList.add('touch-active');
        for (let i = 0; i < seq.length; i++) {
          const c = seq[i].toUpperCase();
          const code = 'Key' + c;
          setTimeout(function() {
            fireKey(code, 'keydown');
            setTimeout(function() { fireKey(code, 'keyup'); }, 40);
          }, i * 60);
        }
      }, { passive: false });
      btn.addEventListener('touchend', function(e) {
        e.preventDefault();
        btn.classList.remove('touch-active');
      }, { passive: false });
    });

    // ── D-pad left/right: support holding (continuous press) ─────
    const dpadHeld = mobileControls.querySelectorAll('.mc-left, .mc-right');
    dpadHeld.forEach(function(btn) {
      const code = btn.getAttribute('data-key');
      let held = false;
      btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (held) return;
        held = true;
        btn.classList.add('touch-active');
        fireKey(code, 'keydown');
      }, { passive: false });
      function release(e) {
        if (e) e.preventDefault();
        if (!held) return;
        held = false;
        btn.classList.remove('touch-active');
        fireKey(code, 'keyup');
      }
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release);
    });
  }

  // ── Support panel wiring ──────────────────────────────────────
  function initSupport() {
    const btn    = document.getElementById('btn-support');
    const panel  = document.getElementById('support-panel');
    const close  = document.getElementById('btn-close-support');
    const fbtn   = document.getElementById('footer-support-btn');

    function openSupport() {
      if (panel) panel.classList.remove('hidden');
    }
    function closeSupport() {
      if (panel) panel.classList.add('hidden');
    }

    if (btn)   btn.addEventListener('click', openSupport);
    if (fbtn)  fbtn.addEventListener('click', openSupport);
    if (close) close.addEventListener('click', closeSupport);
    if (panel) panel.addEventListener('click', function(e) {
      if (e.target === panel) closeSupport();
    });
  }

  // ── Privacy / Terms stubs ─────────────────────────────────────
  function initFooterLinks() {
    const privacy = document.getElementById('footer-privacy');
    const terms   = document.getElementById('footer-terms');
    if (privacy) privacy.addEventListener('click', function(e) {
      e.preventDefault();
      alert('プライバシーポリシー\n\nVIM ARCADEはゲームプレイデータ（進行状況）をlocalStorageに保存します。個人情報は収集しません。広告配信のためにGoogle AdSenseを使用する場合があります。');
    });
    if (terms) terms.addEventListener('click', function(e) {
      e.preventDefault();
      alert('利用規約\n\nVIM ARCADEは個人・教育目的での無料利用を許可します。商業利用・再配布は禁止します。サービスは予告なく変更・終了する場合があります。');
    });
  }

  // ── Vim reference toggle ──────────────────────────────────────
  function initVimRef() {
    const btn  = document.getElementById('btn-vim-ref-toggle');
    const body = document.getElementById('vim-ref-body');
    const hdr  = document.getElementById('vim-ref-header');
    if (!btn || !body) return;
    function toggle() {
      const open = !body.classList.contains('hidden');
      body.classList.toggle('hidden', open);
      btn.textContent = open ? '開く ▼' : '折りたたむ ▲';
    }
    btn.addEventListener('click', toggle);
    hdr.addEventListener('click', function(e) {
      if (e.target !== btn) toggle();
    });
  }

  window.addEventListener('load', function() {
    initMobile();
    initSupport();
    initFooterLinks();
    initVimRef();
  });

})();
