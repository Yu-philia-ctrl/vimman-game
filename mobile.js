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

  // ── Privacy / Terms モーダル ───────────────────────────────────
  function showLegalModal(title, html) {
    const modal = document.getElementById('legal-modal');
    if (!modal) return;
    document.getElementById('legal-modal-title').textContent = title;
    document.getElementById('legal-modal-body').innerHTML = html;
    modal.style.display = 'flex';
    modal.addEventListener('click', function handler(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.removeEventListener('click', handler);
      }
    });
  }

  function initFooterLinks() {
    const privacy = document.getElementById('footer-privacy');
    const terms   = document.getElementById('footer-terms');
    const PRIVACY_HTML = `
      <p style="margin-bottom:12px;">VIM ARCADE（以下「本サービス」）は、ユーザーのプライバシーを尊重します。</p>
      <p style="font-weight:700;color:#5599ff;margin:10px 0 4px;">収集するデータ</p>
      <ul style="padding-left:18px;line-height:2;">
        <li>ゲームプレイデータ（進行状況・スコア）— ブラウザの localStorage に保存</li>
        <li>広告配信のため Google AdSense を使用（Cookie を利用する場合があります）</li>
      </ul>
      <p style="font-weight:700;color:#5599ff;margin:10px 0 4px;">収集しないデータ</p>
      <ul style="padding-left:18px;line-height:2;">
        <li>氏名・住所などの個人を特定できる情報</li>
        <li>クレジットカード情報</li>
      </ul>
      <p style="font-weight:700;color:#5599ff;margin:10px 0 4px;">第三者への提供</p>
      <p>収集したデータを第三者に販売・提供することはありません。</p>
      <p style="margin-top:12px;color:#446688;">お問い合わせ: <a href="mailto:contact@vimarcade.dev" style="color:#88aaff;">contact@vimarcade.dev</a></p>`;
    const TERMS_HTML = `
      <p style="margin-bottom:12px;">VIM ARCADE をご利用いただく前に、以下の利用規約をお読みください。</p>
      <p style="font-weight:700;color:#5599ff;margin:10px 0 4px;">利用許可</p>
      <ul style="padding-left:18px;line-height:2;">
        <li>個人・教育目的での無料利用を許可します</li>
        <li>著作権表示を維持する範囲での非商業的な共有を許可します</li>
      </ul>
      <p style="font-weight:700;color:#5599ff;margin:10px 0 4px;">禁止事項</p>
      <ul style="padding-left:18px;line-height:2;">
        <li>商業利用・再配布</li>
        <li>リバースエンジニアリング</li>
        <li>不正アクセス・サーバー攻撃</li>
      </ul>
      <p style="font-weight:700;color:#5599ff;margin:10px 0 4px;">免責事項</p>
      <p>サービスは予告なく変更・終了する場合があります。本サービスの利用により生じた損害について、開発者は責任を負いません。</p>`;
    if (privacy) privacy.addEventListener('click', function(e) {
      e.preventDefault();
      showLegalModal('🔒 プライバシーポリシー', PRIVACY_HTML);
    });
    if (terms) terms.addEventListener('click', function(e) {
      e.preventDefault();
      showLegalModal('📋 利用規約', TERMS_HTML);
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
