// ── AUTH.JS ── VIM ARCADE User Authentication System ────────────────

window.GameAuth = (function() {
  'use strict';

  // ── 管理者設定 ─────────────────────────────────────────────────
  // OWNER_EMAIL: このメールで登録したアカウントだけ isAdmin フラグが立つ
  const OWNER_EMAIL = 'y02_popsfer_40@icloud.com';

  // ADMIN_SECRET_HASH: 管理者PINのSHA-256ハッシュ（PIN本体はここに書かない）
  // 初回は '' のまま → admin.html のセットアップ画面でハッシュを生成し、ここに貼り付ける
  const ADMIN_SECRET_HASH = '';

  const KEY_USERS   = 'va_users';
  const KEY_SESSION = 'va_session';

  // ── Crypto helpers ─────────────────────────────────────────────
  function generateSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  async function hashPassword(password, salt) {
    try {
      const data = new TextEncoder().encode(password + salt + 'va_secret_2024');
      const buf  = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    } catch(e) {
      // Fallback simple hash (for file:// environments)
      let h = 0;
      const s = password + salt;
      for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h).toString(16).padStart(8,'0') + salt.slice(0,8);
    }
  }

  // ── Storage ────────────────────────────────────────────────────
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(KEY_USERS) || '[]'); }
    catch(e) { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(KEY_SESSION) || 'null'); }
    catch(e) { return null; }
  }

  // ── Public API ─────────────────────────────────────────────────
  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    const users = getUsers();
    return users.find(u => u.id === session.userId) || null;
  }

  function isLoggedIn() { return getCurrentUser() !== null; }
  function isAdmin() {
    const u = getCurrentUser();
    return u && u.isAdmin && u.email.toLowerCase() === OWNER_EMAIL;
  }
  function getOwnerEmail()      { return OWNER_EMAIL; }
  function getAdminSecretHash() { return ADMIN_SECRET_HASH; }

  // PIN文字列をSHA-256ハッシュ化して返す
  async function hashAdminPin(pin) {
    try {
      const data = new TextEncoder().encode(pin + 'va_admin_2024');
      const buf  = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    } catch(e) { return ''; }
  }

  // 入力されたPINがADMIN_SECRET_HASHと一致するか検証
  async function verifyAdminPin(pin) {
    if (!ADMIN_SECRET_HASH) return false; // ハッシュ未設定は常に失敗
    const h = await hashAdminPin(pin);
    return h === ADMIN_SECRET_HASH;
  }

  async function register(username, email, password) {
    username = (username || '').trim();
    email    = (email    || '').trim().toLowerCase();

    if (!username || username.length < 3)
      return { ok: false, error: 'ユーザー名は3文字以上' };
    if (!/^[a-zA-Z0-9_\-ぁ-んァ-ンー一-龯]+$/.test(username))
      return { ok: false, error: 'ユーザー名に使えない文字が含まれています' };
    if (!email || !email.includes('@'))
      return { ok: false, error: '有効なメールアドレスを入力してください' };
    if (!password || password.length < 6)
      return { ok: false, error: 'パスワードは6文字以上' };

    const users = getUsers();

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
      return { ok: false, error: 'そのユーザー名は既に使用されています' };
    if (users.find(u => u.email === email))
      return { ok: false, error: 'そのメールアドレスは既に登録されています' };

    const salt         = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    // 管理者はOWNER_EMAILに一致するアカウントのみ
    const isOwner = email.toLowerCase() === OWNER_EMAIL;

    const user = {
      id:           generateId(),
      username,
      email,
      passwordHash,
      salt,
      createdAt:    new Date().toISOString(),
      lastLogin:    null,
      loginCount:   0,
      isAdmin:      isOwner,
      banned:       false,
      gameSave:     null,
      gameSaveAt:   null,
      note:         '',
    };

    users.push(user);
    saveUsers(users);

    // Auto-login after register
    localStorage.setItem(KEY_SESSION, JSON.stringify({
      userId: user.id, loginAt: Date.now()
    }));

    return { ok: true, user };
  }

  async function login(identifier, password) {
    identifier = (identifier || '').trim().toLowerCase();
    const users = getUsers();
    const user  = users.find(u =>
      u.username.toLowerCase() === identifier || u.email === identifier
    );

    if (!user)        return { ok: false, error: 'ユーザーが見つかりません' };
    if (user.banned)  return { ok: false, error: 'このアカウントはBANされています。管理者にお問い合わせください。' };

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash)
      return { ok: false, error: 'パスワードが間違っています' };

    user.lastLogin  = new Date().toISOString();
    user.loginCount = (user.loginCount || 0) + 1;
    saveUsers(users);

    localStorage.setItem(KEY_SESSION, JSON.stringify({
      userId: user.id, loginAt: Date.now()
    }));

    return { ok: true, user };
  }

  function logout() {
    localStorage.removeItem(KEY_SESSION);
  }

  // ── Game save sync ─────────────────────────────────────────────
  function saveGameData(data) {
    const session = getSession();
    if (!session) return;
    const users = getUsers();
    const user  = users.find(u => u.id === session.userId);
    if (!user) return;
    user.gameSave   = data;
    user.gameSaveAt = new Date().toISOString();
    saveUsers(users);
  }

  function loadGameData() {
    const user = getCurrentUser();
    return user ? user.gameSave : null;
  }

  // ── Admin API ──────────────────────────────────────────────────
  function getAllUsers() {
    if (!isAdmin()) return [];
    return getUsers().map(u => ({
      id:         u.id,
      username:   u.username,
      email:      u.email,
      createdAt:  u.createdAt,
      lastLogin:  u.lastLogin,
      loginCount: u.loginCount || 0,
      isAdmin:    u.isAdmin,
      banned:     u.banned,
      note:       u.note || '',
      gameSave:   u.gameSave,
      gameSaveAt: u.gameSaveAt,
    }));
  }

  function banUser(userId) {
    if (!isAdmin()) return false;
    const users = getUsers();
    const user  = users.find(u => u.id === userId);
    if (!user || user.isAdmin) return false;
    user.banned = !user.banned;
    saveUsers(users);
    return true;
  }

  function deleteUser(userId) {
    if (!isAdmin()) return false;
    let users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || user.isAdmin) return false;
    saveUsers(users.filter(u => u.id !== userId));
    return true;
  }

  function promoteUser(userId) {
    if (!isAdmin()) return false;
    const users = getUsers();
    const user  = users.find(u => u.id === userId);
    if (!user) return false;
    user.isAdmin = !user.isAdmin;
    saveUsers(users);
    return true;
  }

  function setUserNote(userId, note) {
    if (!isAdmin()) return false;
    const users = getUsers();
    const user  = users.find(u => u.id === userId);
    if (!user) return false;
    user.note = note;
    saveUsers(users);
    return true;
  }

  function getStats() {
    if (!isAdmin()) return null;
    const users = getUsers();
    const now   = Date.now();
    const day   = 24 * 60 * 60 * 1000;
    return {
      total:    users.length,
      admins:   users.filter(u => u.isAdmin).length,
      banned:   users.filter(u => u.banned).length,
      activeToday: users.filter(u => u.lastLogin && (now - new Date(u.lastLogin).getTime()) < day).length,
      newThisWeek: users.filter(u => u.createdAt && (now - new Date(u.createdAt).getTime()) < 7*day).length,
      hasSave:  users.filter(u => u.gameSave).length,
    };
  }

  return {
    register, login, logout,
    getCurrentUser, isLoggedIn, isAdmin,
    getOwnerEmail, getAdminSecretHash, hashAdminPin, verifyAdminPin,
    saveGameData, loadGameData,
    getAllUsers, banUser, deleteUser, promoteUser, setUserNote, getStats,
  };
})();
