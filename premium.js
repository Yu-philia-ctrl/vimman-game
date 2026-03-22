/**
 * VIM ARCADE — Premium / VIP Code System
 * Handles code generation (admin), redemption (user), and premium status checks.
 * All data stored in localStorage; integrated with GameAuth user records.
 */
window.GamePremium = (function () {
  'use strict';

  var CODES_KEY   = 'vimarcade_premium_codes';
  var USERS_KEY   = 'vimarcade_users';
  var SESSION_KEY = 'vimarcade_session';

  /* ── Storage helpers ──────────────────────────────────────── */
  function _getCodes() {
    try { return JSON.parse(localStorage.getItem(CODES_KEY) || '{}'); } catch(e) { return {}; }
  }
  function _saveCodes(c) { localStorage.setItem(CODES_KEY, JSON.stringify(c)); }

  function _getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch(e) { return []; }
  }
  function _saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  /* ── Code string generator ───────────────────────────────── */
  function _rnd() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return chars[Math.floor(Math.random() * chars.length)];
  }
  function _newCodeStr(prefix) {
    var s = prefix || 'VIM';
    for (var g = 0; g < 3; g++) {
      s += '-';
      for (var i = 0; i < 4; i++) s += _rnd();
    }
    return s; // e.g. VIM-AB3D-XY7K-QPW2
  }

  /* ── Generate a new code (admin only) ───────────────────── */
  function generateCode(type) {
    if (!window.GameAuth || !window.GameAuth.isAdmin()) return null;
    var admin = window.GameAuth.getCurrentUser();
    var codes = _getCodes();
    // avoid collision
    var code;
    do { code = _newCodeStr(type === 'sponsor' ? 'SPO' : 'VIM'); } while (codes[code]);
    codes[code] = {
      type:      type || 'premium',
      createdAt: new Date().toISOString(),
      createdBy: admin ? admin.username : 'admin',
      usedBy:    null,
      usedAt:    null,
      revoked:   false,
    };
    _saveCodes(codes);
    return code;
  }

  /* ── Batch generate n codes (admin) ─────────────────────── */
  function generateCodes(n, type) {
    var results = [];
    for (var i = 0; i < (n || 1); i++) {
      var c = generateCode(type);
      if (c) results.push(c);
    }
    return results;
  }

  /* ── Redeem a code (current logged-in user) ─────────────── */
  function redeemCode(rawCode) {
    var code = (rawCode || '').toUpperCase().replace(/\s/g, '');
    if (!code) return { ok: false, msg: 'コードを入力してください。' };
    if (!window.GameAuth || !window.GameAuth.isLoggedIn())
      return { ok: false, msg: 'ログインが必要です。' };

    var codes = _getCodes();
    var entry = codes[code];
    if (!entry)         return { ok: false, msg: '無効なコードです。' };
    if (entry.revoked)  return { ok: false, msg: 'このコードは無効化されました。' };
    if (entry.usedBy)   return { ok: false, msg: 'このコードは既に使用されています。' };

    var user = window.GameAuth.getCurrentUser();
    if (user.isPremium) return { ok: false, msg: '既にプレミアム解放済みです！' };

    // Mark code used
    entry.usedBy = user.username;
    entry.usedAt = new Date().toISOString();
    _saveCodes(codes);

    // Grant premium to user record
    _grantToUser(user.id, entry.type, code);

    return { ok: true, msg: 'プレミアムキャラクターが解放されました！', type: entry.type };
  }

  /* ── Internal: write premium flag into user record ───────── */
  function _grantToUser(userId, type, code) {
    var users = _getUsers();
    var idx = users.findIndex(function (u) { return u.id === userId; });
    if (idx < 0) return;
    users[idx].isPremium        = true;
    users[idx].premiumType      = type || 'premium';
    users[idx].premiumGrantedAt = new Date().toISOString();
    if (code) users[idx].premiumCode = code;
    _saveUsers(users);
    // refresh cached session so isPremium() reads correctly immediately
    try {
      var sess = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (sess && sess.userId === userId) {
        sess.isPremium = true;
        localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      }
    } catch(e) {}
  }

  /* ── Check premium for current user ─────────────────────── */
  function isPremium() {
    if (!window.GameAuth || !window.GameAuth.isLoggedIn()) return false;
    var user = window.GameAuth.getCurrentUser();
    if (!user) return false;
    if (user.isAdmin) return true; // admins always have full access
    return !!user.isPremium;
  }

  /* ── Admin: manually grant/revoke premium ───────────────── */
  function grantPremium(userId) {
    if (!window.GameAuth || !window.GameAuth.isAdmin()) return false;
    _grantToUser(userId, 'manual', null);
    return true;
  }

  function revokePremium(userId) {
    if (!window.GameAuth || !window.GameAuth.isAdmin()) return false;
    var users = _getUsers();
    var idx = users.findIndex(function (u) { return u.id === userId; });
    if (idx < 0) return false;
    users[idx].isPremium        = false;
    users[idx].premiumType      = null;
    users[idx].premiumGrantedAt = null;
    users[idx].premiumCode      = null;
    _saveUsers(users);
    return true;
  }

  /* ── Admin: revoke a specific code ──────────────────────── */
  function revokeCode(code) {
    if (!window.GameAuth || !window.GameAuth.isAdmin()) return false;
    var codes = _getCodes();
    if (!codes[code]) return false;
    codes[code].revoked = true;
    _saveCodes(codes);
    return true;
  }

  /* ── Admin: list all codes ───────────────────────────────── */
  function getAllCodes() {
    if (!window.GameAuth || !window.GameAuth.isAdmin()) return [];
    var codes = _getCodes();
    return Object.keys(codes).map(function (k) {
      return Object.assign({ code: k }, codes[k]);
    }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  }

  /* ── Stats summary (admin dashboard) ────────────────────── */
  function getStats() {
    var codes = _getCodes();
    var all   = Object.values(codes);
    return {
      total:     all.length,
      used:      all.filter(function (c) { return !!c.usedBy; }).length,
      available: all.filter(function (c) { return !c.usedBy && !c.revoked; }).length,
      revoked:   all.filter(function (c) { return c.revoked; }).length,
    };
  }

  return {
    generateCode:  generateCode,
    generateCodes: generateCodes,
    redeemCode:    redeemCode,
    isPremium:     isPremium,
    grantPremium:  grantPremium,
    revokePremium: revokePremium,
    revokeCode:    revokeCode,
    getAllCodes:    getAllCodes,
    getStats:      getStats,
  };
})();
