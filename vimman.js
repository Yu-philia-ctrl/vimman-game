// ── VIMMAN.JS ── VimMan Platformer (full rewrite) ────────────

const vimmanGame = (function() {

  // ── Constants ──────────────────────────────────────────────
  const TILE = 32, ROWS = 15, COLS = 64;
  const GRAVITY = 0.55, MAX_FALL = 14;
  const PLAYER_SPEED = 3.5, PLAYER_JUMP = -11.5, BULLET_SPEED = 9;
  const BOSS_ARENA_START = 46; // Boss arena left boundary col (expanded: 18 tiles wide)

  // ── Skills/Equipment system (delegates to SAVE) ───────────────
  const SKILLS = [
    { id:'speed',   name:'w-Speed+',    desc:'+50% dash speed',           cost:3,  maxLv:3 },
    { id:'health',  name:'MaxHP+',      desc:'+8 max HP per level',       cost:3,  maxLv:3 },
    { id:'power',   name:'Power+',      desc:'+1 bullet damage',          cost:4,  maxLv:3 },
    { id:'ddcool',  name:'dd Haste',    desc:'-20 dd cooldown per level', cost:4,  maxLv:3 },
    { id:'autofire',name:'INSERT Rate', desc:'faster INSERT auto-fire',   cost:5,  maxLv:2 },
    { id:'shield',  name:'ZZ-Shield',   desc:'ZZ grants temp shield',     cost:6,  maxLv:1 },
    { id:'spread',  name:'Spread Shot', desc:'cc fires 3-way shot',       cost:8,  maxLv:1 },
    { id:'yyheal',  name:'yy+ Heal',    desc:'+4 extra HP per yy',        cost:5,  maxLv:2 },
  ];
  let equipCursor = 0;

  // Delegate to global SAVE
  function skillLv(id) {
    return (window.SAVE && window.SAVE.skills && window.SAVE.skills[id]) || 0;
  }
  function getVimXP()   { return window.SAVE ? window.SAVE.vimXP : 0; }
  function addVimXP(n) {
    if (!window.SAVE) return;
    const mul = window.getEquipStats ? window.getEquipStats().xpMul : 1;
    const cd = getCharDef();
    // ClaudeMan passive: XP +30%
    const charMul = (cd.passiveId === 'xp_ai') ? 1.3 : 1.0;
    const total = Math.round(n * mul * charMul);
    window.SAVE.vimXP += total;
    window.SAVE.totalXP = (window.SAVE.totalXP || 0) + total;
  }
  function getMaxHP() {
    const charDef = getCharDef();
    const base = (charDef.hp || 28) + skillLv('health') * 8;
    const bonus = window.getEquipStats ? window.getEquipStats().hp : 0;
    return base + bonus;
  }
  function getBulletDmg() {
    const base = 1 + skillLv('power');
    const equipBonus = window.getEquipStats ? Math.floor(window.getEquipStats().atk / 4) : 0;
    const charBonus  = (vm_player && vm_player.atkBonus) ? Math.floor(vm_player.atkBonus / 2) : 0;
    const cid = vm_player ? vm_player.charId : 'vimman';
    const specialMul = (charSpecialActive > 0 && (cid==='claudeman' || cid==='warrior' || cid==='swordsman')) ? (cid==='claudeman' ? 2.0 : 1.5) : 1.0;
    return (base + equipBonus + charBonus) * specialMul;
  }
  function getMeleeDmg() {
    const equipBonus = window.getEquipStats ? window.getEquipStats().atk : 0;
    const charBonus  = (vm_player && vm_player.atkBonus) ? vm_player.atkBonus : 0;
    const base = 4 + skillLv('power') * 2 + equipBonus + charBonus;
    const cid = vm_player ? vm_player.charId : 'vimman';
    // Warrior passive: sword damage x5; Swordsman: x3
    const charMul = (cid === 'warrior') ? 5 : (cid === 'swordsman') ? 3 : 1;
    const baseResult = base * charMul;
    const specialMul = (charSpecialActive > 0 && (cid==='claudeman' || cid==='warrior' || cid==='swordsman')) ? (cid==='claudeman' ? 2.0 : 1.5) : 1.0;
    return baseResult * specialMul;
  }
  function getDDCool()  { return Math.max(20, 60 - skillLv('ddcool') * 20); }
  function getDashMult() {
    const base = 2.5 + skillLv('speed') * 0.5;
    const bonus = window.getEquipStats ? window.getEquipStats().spdPct / 100 : 0;
    return base + bonus;
  }

  function loadProgress() {
    if (window.loadSave) window.loadSave();
  }
  function saveProgress() {
    if (window.saveSave) window.saveSave();
  }
  function initSkills() {
    loadProgress();
  }

  // ── Character helpers ──────────────────────────────────────
  function getCharDef() {
    const id = (window.SAVE && window.SAVE.character) || 'vimman';
    const defs = window.CHARACTER_DEFS || [];
    return defs.find(function(d){ return d.id === id; }) ||
           { id:'vimman', hp:28, atk:1, def:0, spdMul:1.0, jumpMul:1.0 };
  }
  function isMeleeEquipped() {
    if (!window.SAVE || !window.EQUIP_DB) return false;
    const wid = window.SAVE.equip && window.SAVE.equip.weapon;
    if (!wid) return false;
    const all = (window.EQUIP_DB.weapons || []);
    const w = all.find(function(x){ return x.id === wid; });
    return !!(w && w.melee);
  }
  function weaponCategory() {
    if (!window.SAVE || !window.EQUIP_DB) return 'gun';
    const wid = window.SAVE.equip && window.SAVE.equip.weapon;
    if (!wid || wid === 'fist') return 'fist';
    const all = window.EQUIP_DB.weapons || [];
    const w = all.find(function(x){ return x.id === wid; });
    if (!w) return 'gun';
    if (w.melee) return 'melee';
    if (w.staff) return 'staff';
    if (w.bow)   return 'bow';
    // fallback: name pattern matching
    if (w.id && (w.id.indexOf('staff') !== -1 || w.id.indexOf('st') === 0)) return 'staff';
    if (w.id && (w.id.indexOf('bow') !== -1 || w.id.indexOf('arrow') !== -1)) return 'bow';
    return 'gun';
  }

  // ── World/Stage system ─────────────────────────────────────────
  // currentDef is built by makeWorldStageDef
  let worldNum = 1, stageInWorld = 1;
  let worldSelectCursor = 0, worldSelectScroll = 0;
  let rewardData = null; // { cmd, equip } from boss defeat

  function makeWorldStageDef(wid, sid) {
    const worlds = window.WORLD_DEFS;
    if (!worlds || !worlds[wid - 1]) {
      return { name:'W'+wid+'-'+sid, worldId:wid, stageId:sid, worldName:'???',
               bossName:'???', isBoss:false, diff:'EASY', color:'#44ff88',
               spd:1.0, mets:[8,20,35], bees:[], tanks:[], bossHPMul:0, desc:'' };
    }
    const world = worlds[wid - 1];
    const isBoss = (sid === world.stageCount);
    const spd = Math.min(world.spd * (1 + (sid - 1) * 0.08), 2.5);

    // Deterministic enemy placement
    const seed = wid * 37 + sid * 7;
    const metCount = Math.min(2 + Math.floor(wid * 0.35) + sid, 10);
    const beeCount = wid >= 4 ? Math.min(Math.floor((wid - 2) * 0.3) + (sid > 2 ? 1 : 0), 5) : 0;
    const tankCount = wid >= 7 ? Math.min(Math.floor((wid - 5) * 0.2) + (sid > 3 ? 1 : 0), 4) : 0;

    function pseudoRandCols(s, count, lo, hi) {
      const cols = [];
      for (let i = 0; i < count; i++) {
        const v = lo + Math.abs((s * (i + 1) * 1234567) % (hi - lo + 1));
        cols.push(Math.min(hi, Math.max(lo, Math.floor(v))));
      }
      return cols;
    }

    const metCols = pseudoRandCols(seed, metCount, 5, 52);
    const beeDef = [];
    for (let i = 0; i < beeCount; i++) {
      const col = 8 + Math.floor(Math.abs((seed * (i + 3) * 891) % 42));
      const row = 3 + (i % 5);
      beeDef.push([col, row]);
    }
    const tankCols = pseudoRandCols(seed + 100, tankCount, 15, 50);

    const diffNames = ['','EASY','EASY','NORMAL','NORMAL','HARD'];
    return {
      name: 'World ' + wid + '-' + sid,
      worldId: wid, stageId: sid,
      worldName: world.name,
      bossName: world.bossName,
      isBoss: isBoss,
      diff: diffNames[Math.min(world.diffTier, 5)],
      color: world.diffColor,
      desc: world.name + ' ' + (isBoss ? '⚡BOSS STAGE' : 'Stage ' + sid + '/' + world.stageCount),
      spd: spd,
      mets: metCols,
      bees: beeDef,
      tanks: tankCols,
      bossHPMul: isBoss ? world.bossHPMul : 0,
      _mapVariant: pickMapVariant(wid, sid),
      _bossType: isBoss ? (wid === 50 ? 4 : wid <= 10 ? 0 : wid <= 20 ? 1 : wid <= 30 ? 2 : 3) : 0,
    };
  }

  // Current stage definition (set before initStage)
  let currentStageDef = null;

  // Legacy compat — kept for old refs
  const STAGE_DEFS = [
    { name:'Stage 1', diff:'EASY',   color:'#44ff88', desc:'', spd:0.8,
      mets:[8,20,35,48], bees:[], tanks:[], bossHPMul:0.5 },
  ];

  // ── Map (mutable, rebuilt per stage) ────────────────────────
  let VM_MAP = [];
  for (let _mr = 0; _mr < 15; _mr++) VM_MAP.push(new Array(64).fill(0));

  // ── Map variant definitions ───────────────────────────────
  // Each variant: platforms [[c0,c1,row],...], pits [[c0,c1],...], tileName, bgColors
  const MAP_VARIANTS = [
    { // 0: バグ平原 — flat, gentle intro
      tileName: 'バグ平原', bgTop:'#000022', bgBot:'#001144',
      tileHi:'#2244aa', tileDark:'#112266', tileShadow:'#0a1833', tileEdge:'#0d1d55', tileMid:'#1a3377',
      platforms: [[4,7,11],[10,13,9],[16,19,11],[22,25,8],[28,31,10],[34,37,12],[40,43,9],[46,49,11],[51,54,10]],
      steps:     [[2,3,13],[20,21,13],[45,46,13]],
      pits: [],
      gimmick: 'none',
    },
    { // 1: コード迷宮 — multi-level dense platforms
      tileName: 'コード迷宮', bgTop:'#001a00', bgBot:'#003300',
      tileHi:'#44aa44', tileDark:'#113311', tileShadow:'#0a1f0a', tileEdge:'#0d2a0d', tileMid:'#226622',
      platforms: [[3,6,10],[3,6,6],[8,11,12],[8,11,8],[13,16,10],[13,16,5],[18,22,8],[18,22,12],
                  [24,27,6],[24,27,10],[29,33,8],[29,33,12],[35,38,10],[35,38,6],[40,44,8],[40,44,12],
                  [46,50,6],[46,50,10],[52,55,8]],
      steps:     [[1,2,13]],
      pits: [],
      gimmick: 'none',
    },
    { // 2: ポインタ峡谷 — gaps in floor, must jump over pits
      tileName: 'ポインタ峡谷', bgTop:'#110011', bgBot:'#330033',
      tileHi:'#cc55aa', tileDark:'#331133', tileShadow:'#1a0a1a', tileEdge:'#220d22', tileMid:'#662244',
      platforms: [[4,8,10],[12,15,8],[19,23,11],[27,30,9],[35,38,10],[42,46,8],[50,53,11]],
      steps:     [[2,3,13],[18,19,13],[33,34,13],[48,49,13]],
      pits:      [[9,11],[24,26],[39,41]], // gaps in floor
      gimmick: 'windy',
    },
    { // 3: スタック山 — tall stacked platforms, lots of vertical
      tileName: 'スタック山', bgTop:'#110800', bgBot:'#332200',
      tileHi:'#cc8833', tileDark:'#331a00', tileShadow:'#1a0e00', tileEdge:'#221200', tileMid:'#664411',
      platforms: [[3,6,12],[3,6,9],[3,6,6],[3,6,3],
                  [9,12,11],[9,12,8],[9,12,5],
                  [15,19,10],[15,19,7],[15,19,4],
                  [22,25,12],[22,25,9],[22,25,6],[22,25,3],
                  [28,31,11],[28,31,8],[28,31,5],
                  [34,38,10],[34,38,7],[34,38,4],
                  [41,45,12],[41,45,9],[41,45,6],
                  [48,52,10],[48,52,7],[48,52,4]],
      steps:     [[1,2,13],[13,14,13],[26,27,13],[39,40,13]],
      pits: [],
      gimmick: 'none',
      hazards: [[5,13],[6,13],[19,13],[20,13],[37,13],[38,13]],
    },
    { // 4: NULLの森 — irregular organic-feeling platforms with wide gaps
      tileName: 'NULLの森', bgTop:'#000a00', bgBot:'#001a00',
      tileHi:'#55cc55', tileDark:'#112211', tileShadow:'#0a160a', tileEdge:'#0d1b0d', tileMid:'#336633',
      platforms: [[4,5,9],[7,9,7],[11,14,10],[14,16,6],[18,21,8],[21,23,5],
                  [26,28,10],[28,31,7],[31,34,11],[35,37,8],[38,40,5],
                  [42,44,9],[44,47,12],[47,49,7],[50,53,9],[53,55,11]],
      steps:     [[2,3,13],[24,25,13],[40,41,13]],
      pits:      [[5,6],[16,17],[32,33],[48,49]],
      gimmick: 'dark',
    },
    { // 5: クラッシュ城 — castle battlements, regular notched pattern
      tileName: 'クラッシュ城', bgTop:'#0a0010', bgBot:'#1a0030',
      tileHi:'#7755cc', tileDark:'#221144', tileShadow:'#130a26', tileEdge:'#190d33', tileMid:'#443388',
      platforms: [[3,4,8],[6,7,8],[9,10,8],[12,13,8],[15,16,8],[18,19,8],[21,22,8],
                  [3,7,5],[9,13,5],[15,19,5],[21,25,5],
                  [27,28,8],[30,31,8],[33,34,8],[36,37,8],[39,40,8],[42,43,8],[45,46,8],
                  [27,31,11],[33,37,11],[39,43,11],[45,49,11],
                  [3,25,2],[27,53,2]],
      steps:     [[1,2,13],[26,27,13]],
      pits: [],
      gimmick: 'none',
      hazards: [[4,12],[7,12],[22,12],[30,12],[36,12],[44,12]],
    },
    { // 6: ループの塔 — repeating loop-like patterns
      tileName: 'ループの塔', bgTop:'#000a15', bgBot:'#00152a',
      tileHi:'#3399cc', tileDark:'#0a1f33', tileShadow:'#061319', tileEdge:'#081922', tileMid:'#1a4466',
      platforms: [[2,5,12],[7,10,10],[12,15,8],[17,20,6],[22,25,4],
                  [27,30,6],[32,35,8],[37,40,10],[42,45,12],
                  [2,5,7],[7,10,5],[12,15,3],[17,20,7],[22,25,9],
                  [27,30,11],[32,35,9],[37,40,7],[42,45,5],[48,52,9],[48,52,4]],
      steps:     [[1,2,13],[25,26,13],[46,47,13]],
      pits:      [[5,6],[20,21],[35,36]],
      gimmick: 'icy',
    },
    { // 7: 再帰の深淵 — overlapping nested structure, hardest
      tileName: '再帰の深淵', bgTop:'#080000', bgBot:'#1a0000',
      tileHi:'#cc3333', tileDark:'#331111', tileShadow:'#190a0a', tileEdge:'#220d0d', tileMid:'#662222',
      platforms: [[2,3,12],[5,7,10],[9,12,7],[14,18,5],[20,24,3],
                  [26,30,5],[32,35,8],[37,39,10],[41,43,12],
                  [4,6,3],[9,11,12],[15,17,10],[21,23,7],[27,29,4],
                  [33,36,3],[39,41,6],[44,47,9],[49,52,12],[49,52,7],[49,52,3]],
      steps:     [[1,2,13],[25,26,13]],
      pits:      [[7,8],[19,20],[31,32],[42,43]],
      gimmick: 'lava',
      hazards: [[8,13],[9,13],[20,13],[21,13],[32,13],[33,13],[43,13],[44,13]],
    },
  ];

  // Build the VM_MAP for a given variant index
  function buildMap(variantIdx, bossType) {
    bossType = bossType || 0;
    const v = MAP_VARIANTS[variantIdx % MAP_VARIANTS.length];
    // Reset
    for (let r = 0; r < 15; r++)
      for (let c = 0; c < 64; c++)
        VM_MAP[r][c] = 0;

    // Full floor
    for (let c = 0; c < 64; c++) VM_MAP[14][c] = 1;

    // Pits — remove floor sections
    (v.pits || []).forEach(function(p) {
      for (let c = p[0]; c <= p[1]; c++) VM_MAP[14][c] = 0;
    });

    // Platforms
    (v.platforms || []).forEach(function(p) {
      for (let c = p[0]; c <= p[1]; c++) VM_MAP[p[2]][c] = 1;
    });

    // Steps
    (v.steps || []).forEach(function(s) {
      for (let c = s[0]; c <= s[1]; c++) VM_MAP[s[2]][c] = 1;
    });

    // Hazard (spike) tiles
    (v.hazards || []).forEach(function(h) {
      VM_MAP[h[1]][h[0]] = 2;
    });

    // ── Boss arena — wide room: cols BOSS_ARENA_START … 63 ────────
    const AS = BOSS_ARENA_START;
    // Clear the entire arena area (overrides any stage platforms here)
    for (let r = 0; r < ROWS; r++)
      for (let c = AS; c < COLS; c++) VM_MAP[r][c] = 0;
    // Ceiling
    for (let c = AS; c < COLS; c++) VM_MAP[0][c] = 1;
    // Right wall
    for (let r = 0; r < ROWS; r++) VM_MAP[r][COLS-1] = 1;
    // Left wall with doorway (rows 12-13 open)
    for (let r = 0; r <= 11; r++) VM_MAP[r][AS-1] = 1;
    // Floor
    for (let c = AS; c < COLS-1; c++) VM_MAP[14][c] = 1;
    // Per-boss-type platform layout
    const ARENA_LAYOUTS = [
      { // 0 BugDragon — 2 elevated platforms
        plats:[[1,6,10],[9,14,7]], pits:[] },
      { // 1 NullPointer — 3 staggered thin platforms
        plats:[[0,4,11],[5,9,8],[10,15,5]], pits:[] },
      { // 2 SegFault — staircase + center pillar
        plats:[[0,3,12],[3,6,10],[6,9,8],[7,9,5],[9,12,10],[12,16,12]], pits:[] },
      { // 3 InfiniteLoop — floating islands + pits in floor
        plats:[[0,3,10],[4,7,6],[8,12,10],[2,5,3],[9,13,3]], pits:[[2,5],[7,9],[11,14]] },
      { // 4 NULL DRAGON — minimal ledges, void between
        plats:[[0,2,9],[6,10,5],[14,16,9],[3,4,3],[11,12,3]], pits:[[1,3],[5,7],[8,10],[12,14]] },
    ];
    const layout = ARENA_LAYOUTS[bossType % ARENA_LAYOUTS.length] || ARENA_LAYOUTS[0];
    // Apply pits (remove floor sections inside arena)
    (layout.pits || []).forEach(function(p) {
      for (let c = AS+p[0]; c <= AS+p[1] && c < COLS-1; c++) VM_MAP[14][c] = 0;
    });
    // Apply platforms (relative offset from AS)
    (layout.plats || []).forEach(function(p) {
      for (let c = AS+p[0]; c <= AS+p[1] && c < COLS-1; c++) VM_MAP[p[2]][c] = 1;
    });
  }

  // Pick a map variant based on world/stage
  function pickMapVariant(wid, sid) {
    // Worlds 1-5: variants 0-2 (easy)
    // Worlds 6-15: variants 0-4
    // Worlds 16-30: variants 0-6
    // Worlds 31-50: all variants
    const available = wid <= 5 ? 3 : wid <= 15 ? 5 : wid <= 30 ? 7 : MAP_VARIANTS.length;
    const seed = (wid * 17 + sid * 5) % available;
    // Boss stages get a specific variant for dramatic feel
    const world = window.WORLD_DEFS ? window.WORLD_DEFS[wid - 1] : null;
    if (world && sid === world.stageCount) {
      return (wid % MAP_VARIANTS.length); // deterministic per world
    }
    return seed;
  }

  // Current map tile colors (for drawBackground / drawTiles)
  function getMapColors() {
    const idx = (currentStageDef && currentStageDef._mapVariant !== undefined)
      ? currentStageDef._mapVariant % MAP_VARIANTS.length : 0;
    const v = MAP_VARIANTS[idx];
    return {
      bgTop:      v.bgTop,
      bgBot:      v.bgBot,
      tileHi:     v.tileHi,
      tileDark:   v.tileDark,
      tileShadow: v.tileShadow,
      tileEdge:   v.tileEdge,
      tileMid:    v.tileMid,
    };
  }

  // (Old STAGE_DEFS removed — world system uses makeWorldStageDef())

  // ── Module state ──────────────────────────────────────────
  let state = 'worldselect';  // 'worldselect'|'stageselect'|'stageintro'|'gameplay'|'stageclear'|'reward'|'gameover'|'equipment'|'pause'
  let score = 0, lives = 3, stageNum = 0;
  let vm_player, vm_enemies, vm_bullets, vm_boss, vm_bossTriggered;
  let vm_particles = [], vm_cameraX = 0;
  let stageIntroTimer = 0, stageEndTimer = 0, blinkTimer = 0;
  let selectCursor = 0, specialCD = 0, undoActive = 0, yankHealCD = 0;
  let shieldActive = 0;
  let pauseCursor = 0;
  // New state variables for gameplay overhaul
  let xHoldTimer = 0;         // frames x key held — for charge shot
  let sComboCount = 0;        // sword combo counter
  let sComboTimer = 0;        // time window for combo
  let charSpecialCD = 0;      // character special cooldown
  let charSpecialActive = 0;  // special aura timer
  let bossWarnTimer = 0;      // boss telegraph display timer
  let bossWarnMsg = '';        // message to show
  let movingPlatforms = [];   // moving platform objects
  let stageGimmick = 'none';  // current stage gimmick
  let gimmickTimer = 0;       // gimmick effect timer
  let screenFlashColor = '#ffffff'; // flash color
  let familiarShootTimer = 0; // mage familiar shoot timer
  let ddLaserTimer = 0;       // dd laser beam duration
  let ddLaserDir   = 1;       // dd laser direction
  // Key display
  let recentKeys = [];

  const STARS = [];
  for (let i = 0; i < 40; i++)
    STARS.push({ x: Math.random()*512, y: Math.random()*336, r: Math.random()<0.3?2:1 });

  // ── Tile helpers ──────────────────────────────────────────
  function tileAt(wx, wy) {
    const col = Math.floor(wx/TILE), row = Math.floor(wy/TILE);
    if (row<0||row>=ROWS||col<0||col>=COLS) return 0;
    return VM_MAP[row][col];
  }
  function isSolid(wx, wy) { return tileAt(wx,wy)===1; }
  function resolveX(obj) {
    const mg=1;
    if (obj.vx > 0) {
      const rx = obj.x+obj.w;
      if (isSolid(rx, obj.y+mg)||isSolid(rx, obj.y+obj.h-mg)) {
        obj.x = Math.floor(rx/TILE)*TILE - obj.w; obj.vx=0;
      }
    } else if (obj.vx < 0) {
      if (isSolid(obj.x, obj.y+mg)||isSolid(obj.x, obj.y+obj.h-mg)) {
        obj.x = Math.floor(obj.x/TILE)*TILE + TILE; obj.vx=0;
      }
    }
  }
  function resolveY(obj) {
    const mg=1;
    if (obj.vy > 0) {
      const by=obj.y+obj.h;
      if (isSolid(obj.x+mg, by)||isSolid(obj.x+obj.w-mg, by)) {
        obj.y = Math.floor(by/TILE)*TILE - obj.h; obj.vy=0; obj.onGround=true;
      }
    } else if (obj.vy < 0) {
      if (isSolid(obj.x+mg, obj.y)||isSolid(obj.x+obj.w-mg, obj.y)) {
        obj.y = Math.floor(obj.y/TILE)*TILE + TILE; obj.vy=0;
      }
    }
  }
  function overlaps(a,b) {
    return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
  }

  // ── Particles ─────────────────────────────────────────────
  function spawnExplosion(cx, cy, count, col) {
    for (let i=0; i<(count||5); i++) {
      vm_particles.push({
        x:cx, y:cy,
        vx:(Math.random()-0.5)*5, vy:Math.random()*-4-1,
        life:40+(Math.random()*20|0), maxLife:60,
        color: col || (Math.random()<0.5?'#ffaa00':'#ffdd44'),
        size:3+(Math.random()*4|0)
      });
    }
  }
  function updateParticles() {
    for (let i=vm_particles.length-1;i>=0;i--) {
      const p=vm_particles[i];
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life--;
      if (p.life<=0) vm_particles.splice(i,1);
    }
  }
  function drawParticles() {
    vm_particles.forEach(function(p) {
      ctx.globalAlpha = p.life/p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  // ── Bullets ───────────────────────────────────────────────
  function Bullet(x,y,vx,vy,fromPlayer) {
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.fromPlayer=fromPlayer; this.dead=false;
    this.w=8; this.h=6;
  }
  Bullet.prototype.update = function() {
    // Homing behavior
    if (this.isHoming && vm_enemies && vm_enemies.length > 0) {
      let nearest = null, nearDist = 400;
      vm_enemies.forEach(function(e) {
        if (e.dead) return;
        const d = Math.sqrt((e.x-this.x)*(e.x-this.x)+(e.y-this.y)*(e.y-this.y));
        if (d < nearDist) { nearDist = d; nearest = e; }
      }.bind(this));
      if (!nearest && vm_boss && !vm_boss.dead) nearest = vm_boss;
      if (nearest) {
        const dx = (nearest.x+nearest.w/2) - this.x;
        const dy = (nearest.y+nearest.h/2) - this.y;
        const d = Math.sqrt(dx*dx+dy*dy) || 1;
        this.vx += dx/d * 0.6;
        this.vy += dy/d * 0.6;
        const speed = Math.sqrt(this.vx*this.vx+this.vy*this.vy);
        if (speed > BULLET_SPEED * 0.5) {
          this.vx = this.vx/speed * BULLET_SPEED * 0.5;
          this.vy = this.vy/speed * BULLET_SPEED * 0.5;
        }
      }
    }
    this.x+=this.vx; this.y+=this.vy;
    if (this.x<-32||this.x>COLS*TILE+32||this.y<-32||this.y>ROWS*TILE+32) { this.dead=true; return; }
    if (isSolid(this.x+this.w/2, this.y+this.h/2)) this.dead=true;
  };
  Bullet.prototype.draw = function() {
    if (this.fromPlayer) {
      if (this.isMagic) {
        // Magic orb — glowing circle
        ctx.fillStyle='#dd88ff'; ctx.fillRect(this.x,this.y,this.w,this.h);
        ctx.fillStyle='#ffffff'; ctx.fillRect(this.x+3,this.y+3,6,6);
        ctx.fillStyle='#aa44ff'; ctx.fillRect(this.x+5,this.y+5,4,4);
      } else if (this.isCode) {
        // ClaudeMan code-fragment — orange glow with { } symbols
        ctx.fillStyle='#ff8800'; ctx.fillRect(this.x,this.y,this.w,this.h);
        ctx.fillStyle='#ffcc44'; ctx.fillRect(this.x+1,this.y+1,this.w-2,this.h-2);
        ctx.fillStyle='#ffffff'; ctx.font='bold 7px monospace'; ctx.textAlign='center';
        ctx.fillText('{}', this.x+this.w/2, this.y+this.h-1);
      } else if (this.isSlash) {
        // Swordsman slash wave — golden crescent
        ctx.save();
        ctx.fillStyle='#ffcc44'; ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle='#ffffff'; ctx.fillRect(this.x+2, this.y+2, this.w-4, this.h-4);
        ctx.fillStyle='#ffaa00'; ctx.fillRect(this.x+4, this.y+4, this.w-8, this.h-8);
        ctx.strokeStyle='rgba(255,220,50,0.9)'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(this.x+this.w/2, this.y+this.h/2, this.w*0.6, -0.7, 0.7); ctx.stroke();
        ctx.restore();
      } else if (this.isPierce) {
        // Arrow — long thin
        ctx.fillStyle='#88cc44'; ctx.fillRect(this.x,this.y,this.w,this.h);
        ctx.fillStyle='#ccff66'; ctx.fillRect(this.x,this.y,4,this.h);
        ctx.fillStyle='#ffcc00'; ctx.fillRect(this.x+this.w-4,this.y-1,4,6);
      } else {
        ctx.fillStyle='#ffee00'; ctx.fillRect(this.x,this.y,this.w,this.h);
        ctx.fillStyle='#ffffff'; ctx.fillRect(this.x+1,this.y+1,3,2);
      }
    } else {
      ctx.fillStyle='#ff2200'; ctx.fillRect(this.x,this.y,this.w,this.h);
      ctx.fillStyle='#ff8866'; ctx.fillRect(this.x+1,this.y+1,3,3);
    }
  };

  function BigBullet(x,y,vx) {
    Bullet.call(this,x,y,vx,0,true);
    this.w=22; this.h=16; this.isBig=true;
  }
  BigBullet.prototype = Object.create(Bullet.prototype);
  BigBullet.prototype.draw = function() {
    ctx.fillStyle='#00ffee'; ctx.fillRect(this.x,this.y,this.w,this.h);
    ctx.fillStyle='#ffffff'; ctx.fillRect(this.x+2,this.y+2,12,8);
    ctx.fillStyle='#88ffff'; ctx.fillRect(this.x+4,this.y+5,8,4);
  };

  // ── Sword slash state ─────────────────────────────────────
  let swordSlashTimer = 0;

  // ── Player ────────────────────────────────────────────────
  function VimPlayer(x,y) {
    this.x=x; this.y=y; this.w=20; this.h=28;
    this.vx=0; this.vy=0; this.onGround=false; this.facing=1;
    this.health=getMaxHP(); this.maxHealth=getMaxHP();
    this.invTimer=0; this.shootTimer=0; this.isShooting=false;
    this.animFrame=0; this.animTimer=0;
    this.dead=false; this.deathTimer=120;
    this.canDoubleJump=false;   // kk double jump
    this.djParticleTimer=0;
    // Character stats snapshot
    const cd = getCharDef();
    this.charId    = cd.id;
    this.spdMul    = cd.spdMul  || 1.0;
    this.jumpMul   = cd.jumpMul || 1.0;
    this.atkBonus  = cd.atk     || 0;
    this.defBonus  = cd.def     || 0;
  }
  VimPlayer.prototype.update = function() {
    if (this.dead) { this.deathTimer--; return; }
    if (this.invTimer>0) this.invTimer--;
    if (this.shootTimer>0) this.shootTimer--;
    if (this.djParticleTimer>0) this.djParticleTimer--;
    if (swordSlashTimer>0) swordSlashTimer--;
    const spd = PLAYER_SPEED * this.spdMul * getDashMult() / 2.5; // getDashMult baseline 2.5
    if (stageGimmick === 'icy') {
      this.vx *= 0.94; // momentum decay
      if (isLeft())  { this.vx = Math.max(this.vx - spd*0.3, -spd); this.facing=-1; }
      if (isRight()) { this.vx = Math.min(this.vx + spd*0.3, spd);  this.facing= 1; }
    } else {
      this.vx=0;
      if (isLeft())  { this.vx=-spd; this.facing=-1; }
      if (isRight()) { this.vx= spd; this.facing= 1; }
    }

    // ── Jump / Double Jump (kk) ──────────────────────────
    if (isJump()) {
      if (this.onGround) {
        // First jump from ground
        this.vy = PLAYER_JUMP * this.jumpMul;
        this.onGround = false;
        this.canDoubleJump = true;  // unlocks double jump
      } else if (this.canDoubleJump) {
        // Second jump in air (kk)
        this.vy = PLAYER_JUMP * this.jumpMul * 0.9;
        this.canDoubleJump = false;
        this.djParticleTimer = 6;
        spawnExplosion(this.x+this.w/2, this.y+this.h, 6, '#88aaff');
        addFlash('kk -- DOUBLE JUMP!');
      }
    }

    this.isShooting=false;
    // Archer passive: shoot twice as fast
    const shootRate = (this.charId==='archer') ? 7 : 15;
    if (isShoot() && this.shootTimer<=0) { this.isShooting=true; this.shootTimer=shootRate; }
    if (this.vx!==0 && this.onGround) {
      this.animTimer++;
      if (this.animTimer>=8) { this.animTimer=0; this.animFrame=(this.animFrame+1)%3; }
    } else { this.animFrame=0; this.animTimer=0; }
    // Mage passive: floaty jump (lower gravity)
    const gravMul = (this.charId==='mage') ? 0.65 : 1.0;
    this.vy += GRAVITY * gravMul;
    if (this.vy>MAX_FALL) this.vy=MAX_FALL;
    const wasOnGround = this.onGround;
    this.onGround=false;
    this.x+=this.vx; resolveX(this);
    this.y+=this.vy; resolveY(this);
    if (this.onGround && !wasOnGround) {
      // Just landed — restore double jump
      this.canDoubleJump = false;
    }
    if (this.x<0) { this.x=0; this.vx=0; }
    if (this.x+this.w>COLS*TILE) { this.x=COLS*TILE-this.w; this.vx=0; }
  };
  VimPlayer.prototype.takeDamage = function(n) {
    if (this.invTimer>0) return;
    if (shieldActive>0) { shieldActive=0; addFlash('Shield absorbed the hit!'); return; }
    const defBonus = (this.defBonus || 0) + (window.getEquipStats ? Math.floor(window.getEquipStats().def / 4) : 0);
    const dmg = Math.max(1, n - defBonus);
    this.health-=dmg; this.invTimer=120; this.vy=-4;
    if (this.health<=0) { this.health=0; this.dead=true; }
  };
  // ── Character sprite draw helpers ─────────────────────────
  function _drawPlayerCommon(p) {
    // shared aura effects regardless of character sprite
    if (!p.onGround && p.canDoubleJump) {
      ctx.globalAlpha=0.4+0.2*Math.sin(Date.now()*0.02);
      ctx.fillStyle='#88aaff';
      ctx.fillRect(p.x-3, p.y+p.h-4, p.w+6, 4);
      ctx.globalAlpha=1;
    }
    if (p.djParticleTimer>0) {
      ctx.globalAlpha=p.djParticleTimer/6*0.7;
      ctx.fillStyle='#aaccff';
      ctx.fillRect(p.x-6, p.y+p.h-2, p.w+12, 6);
      ctx.globalAlpha=1;
    }
    if (shieldActive>0) {
      ctx.save();
      ctx.strokeStyle='rgba(0,200,255,'+(0.5+0.5*Math.sin(Date.now()*0.01))+')';
      ctx.lineWidth=3; ctx.beginPath();
      ctx.arc(p.x+p.w/2, p.y+p.h/2, 22, 0, Math.PI*2);
      ctx.stroke(); ctx.restore();
    }
    if (vimMode==='VISUAL' && chargeLevel>10) {
      const g=Math.floor(chargeLevel*2.5);
      ctx.save();
      ctx.shadowColor='rgb('+g+',255,255)'; ctx.shadowBlur=8+chargeLevel/5;
      ctx.fillStyle='rgba(0,255,255,'+(chargeLevel/300)+')';
      ctx.fillRect(p.x-6,p.y-6,p.w+12,p.h+12);
      ctx.restore();
    }
  }

  // VimMan (blue megaman style)
  function _drawVimMan(cx, frame, shooting) {
    ctx.fillStyle='#1a3aff';
    if (frame===-1)     ctx.fillRect(-7,18,14,10);
    else if (frame===1) { ctx.fillRect(-7,18,6,10); ctx.fillRect(2,16,6,12); }
    else if (frame===2) { ctx.fillRect(-7,16,6,12); ctx.fillRect(2,18,6,10); }
    else                { ctx.fillRect(-7,18,6,10); ctx.fillRect(2,18,6,10); }
    ctx.fillStyle='#2255ff'; ctx.fillRect(-8,8,16,12);
    ctx.fillStyle='#5599ff';
    if (shooting) {
      ctx.fillRect(5,11,10,6);
      if (swordSlashTimer<=0) {
        ctx.fillStyle='#ffffff'; ctx.fillRect(14,10,4,8);
        ctx.fillStyle='#ffff44'; ctx.fillRect(15,11,3,6);
      }
    } else ctx.fillRect(5,11,7,6);
    ctx.fillStyle='#2255ff'; ctx.fillRect(-12,11,5,5);
    ctx.fillStyle='#55aaff'; ctx.fillRect(-8,-4,16,14);
    ctx.fillStyle='#1a3aff'; ctx.fillRect(-8,-4,16,5);
    ctx.fillStyle='#ffffff'; ctx.fillRect(1,0,6,5);
    ctx.fillStyle='#000033'; ctx.fillRect(4,1,2,3);
  }

  // ClaudeMan (Claude AI — coral/orange, official Claude color scheme)
  // Claude's brand: coral-orange (#CC785C / #DA7756), cream face, warm brown hair
  function _drawClaudeMan(cx, frame, shooting) {
    // Legs — warm brown
    ctx.fillStyle='#7a3e28';
    if (frame===-1)     ctx.fillRect(-6,18,12,10);
    else if (frame===1) { ctx.fillRect(-6,18,5,10); ctx.fillRect(2,16,5,12); }
    else if (frame===2) { ctx.fillRect(-6,16,5,12); ctx.fillRect(2,18,5,10); }
    else                { ctx.fillRect(-6,18,5,10); ctx.fillRect(2,18,5,10); }
    // Body — Claude coral-orange
    ctx.fillStyle='#cc785c'; ctx.fillRect(-8,5,16,15);
    ctx.fillStyle='#da8870'; ctx.fillRect(-6,7,12,11);
    // Chest — Claude "A" shape (triangle + crossbar = Anthropic logo simplified)
    ctx.fillStyle='#ffffff';
    ctx.fillRect(-3,9,6,1);   // crossbar
    ctx.fillRect(-3,9,2,6);   // left stroke
    ctx.fillRect(1,9,2,6);    // right stroke
    ctx.fillRect(-1,9,2,2);   // top bridge
    // Left arm
    ctx.fillStyle='#aa6248'; ctx.fillRect(-13,8,6,8);
    // Right arm / tool emitter
    if (shooting) {
      ctx.fillStyle='#cc785c'; ctx.fillRect(5,9,10,6);
      ctx.fillStyle='#ffe8b0'; ctx.fillRect(14,7,6,10); // bright shot glow
      ctx.fillStyle='#ffcc44'; ctx.fillRect(15,9,4,6);
    } else {
      ctx.fillStyle='#aa6248'; ctx.fillRect(5,9,7,6);
    }
    // Head — cream/warm skin (Claude's face color)
    ctx.fillStyle='#f5c9a0'; ctx.fillRect(-8,-5,16,15);
    // Hair — warm brown
    ctx.fillStyle='#7a3e28'; ctx.fillRect(-8,-5,16,6);
    ctx.fillRect(-9,-3,3,8);   // side hair left
    // Eyes — warm brown
    ctx.fillStyle='#ffffff'; ctx.fillRect(-5,1,4,4); ctx.fillRect(2,1,4,4);
    ctx.fillStyle='#5a3018'; ctx.fillRect(-4,2,2,2); ctx.fillRect(3,2,2,2);
    // Claude orange glow halo (subtle)
    ctx.globalAlpha = 0.18 + 0.1*Math.sin(Date.now()*0.005);
    ctx.fillStyle='#ff9955';
    ctx.fillRect(-10,-7,20,22);
    ctx.globalAlpha = 1;
  }

  // Warrior (red armored fighter with sword)
  function _drawWarrior(cx, frame, slashing) {
    // Legs — armored
    ctx.fillStyle='#882222';
    if (frame===-1)     ctx.fillRect(-8,17,16,11);
    else if (frame===1) { ctx.fillRect(-8,17,7,11); ctx.fillRect(2,15,7,13); }
    else if (frame===2) { ctx.fillRect(-8,15,7,13); ctx.fillRect(2,17,7,11); }
    else                { ctx.fillRect(-8,17,7,11); ctx.fillRect(2,17,7,11); }
    // Leg trim
    ctx.fillStyle='#cc4444'; ctx.fillRect(-8,17,16,3);
    // Body (armored, wider)
    ctx.fillStyle='#cc2222'; ctx.fillRect(-9,5,18,14);
    ctx.fillStyle='#ff4444'; ctx.fillRect(-7,7,14,10);
    // Chest plate cross
    ctx.fillStyle='#ffaaaa'; ctx.fillRect(-2,8,4,8); ctx.fillRect(-6,11,12,3);
    // Shield arm
    ctx.fillStyle='#886622'; ctx.fillRect(-14,8,7,10);
    ctx.fillStyle='#ffcc44'; ctx.fillRect(-14,8,4,10);
    // Sword arm
    if (slashing) {
      ctx.fillStyle='#cccccc'; ctx.fillRect(5,2,5,20);
      ctx.fillStyle='#ffff88'; ctx.fillRect(6,0,3,4);
      ctx.fillStyle='#8888ff'; ctx.fillRect(4,17,8,4);
    } else {
      ctx.fillStyle='#888888'; ctx.fillRect(5,8,5,14);
      ctx.fillStyle='#ffff88'; ctx.fillRect(5,7,5,3);
      ctx.fillStyle='#8888ff'; ctx.fillRect(4,18,8,3);
    }
    // Head
    ctx.fillStyle='#cc2222'; ctx.fillRect(-8,-6,16,14);
    ctx.fillStyle='#ff4444'; ctx.fillRect(-7,-4,14,10);
    // Helmet visor
    ctx.fillStyle='#cc6600'; ctx.fillRect(-7,-6,14,5);
    ctx.fillStyle='#ffaa00'; ctx.fillRect(-7,-6,14,3);
    // Eyes
    ctx.fillStyle='#ff0000'; ctx.fillRect(-4,0,3,3); ctx.fillRect(2,0,3,3);
  }

  // Mage (purple robe caster)
  function _drawMage(cx, frame, casting) {
    // Robe (wide bottom)
    ctx.fillStyle='#330055';
    if (frame===-1)     ctx.fillRect(-7,15,14,13);
    else if (frame===1) { ctx.fillRect(-7,15,6,13); ctx.fillRect(1,15,6,11); }
    else if (frame===2) { ctx.fillRect(-7,15,6,11); ctx.fillRect(1,15,6,13); }
    else                { ctx.fillRect(-7,15,14,13); }
    ctx.fillStyle='#6600aa'; ctx.fillRect(-8,5,16,13);
    ctx.fillStyle='#8822cc'; ctx.fillRect(-6,7,12,9);
    // Rune on chest
    ctx.fillStyle='#ffaaff'; ctx.fillRect(-2,9,4,5);
    ctx.fillStyle='#6600aa'; ctx.fillRect(-1,10,2,3);
    // Left sleeve
    ctx.fillStyle='#6600aa'; ctx.fillRect(-13,7,6,7);
    ctx.fillStyle='#440088'; ctx.fillRect(-14,11,4,4);
    // Staff arm
    if (casting) {
      ctx.fillStyle='#884400'; ctx.fillRect(4,5,4,18);
      ctx.fillStyle='#ffaaff'; ctx.fillRect(3,2,6,6);
      ctx.fillStyle='#ffffff'; ctx.fillRect(5,3,2,4);
      // Magic orb glow
      ctx.fillStyle='rgba(255,100,255,0.8)'; ctx.fillRect(1,0,8,8);
      ctx.fillStyle='#ffffff'; ctx.fillRect(4,2,2,2);
    } else {
      ctx.fillStyle='#884400'; ctx.fillRect(5,5,3,18);
      ctx.fillStyle='#aa66ff'; ctx.fillRect(4,3,5,5);
    }
    // Head
    ctx.fillStyle='#8822cc'; ctx.fillRect(-7,-3,14,10);
    ctx.fillStyle='#aa44ff'; ctx.fillRect(-6,-1,12,7);
    // Pointed hat
    ctx.fillStyle='#330055'; ctx.fillRect(-6,-9,12,8);
    ctx.fillStyle='#6600aa'; ctx.fillRect(-4,-12,8,5);
    ctx.fillStyle='#8822cc'; ctx.fillRect(-2,-14,4,4);
    // Eyes
    ctx.fillStyle='#ffffff'; ctx.fillRect(-4,1,3,3); ctx.fillRect(2,1,3,3);
    ctx.fillStyle='#aa00ff'; ctx.fillRect(-3,2,2,2); ctx.fillRect(3,2,2,2);
  }

  // Archer (green nimble ranger with bow)
  function _drawArcher(cx, frame, shooting) {
    // Legs — slim
    ctx.fillStyle='#224422';
    if (frame===-1)     ctx.fillRect(-5,18,10,10);
    else if (frame===1) { ctx.fillRect(-5,18,4,10); ctx.fillRect(2,16,4,12); }
    else if (frame===2) { ctx.fillRect(-5,16,4,12); ctx.fillRect(2,18,4,10); }
    else                { ctx.fillRect(-5,18,4,10); ctx.fillRect(2,18,4,10); }
    // Body (slim tunic)
    ctx.fillStyle='#336633'; ctx.fillRect(-6,6,12,14);
    ctx.fillStyle='#44aa44'; ctx.fillRect(-5,8,10,10);
    // Hood/cloak accent
    ctx.fillStyle='#228822'; ctx.fillRect(-6,6,12,5);
    // Bow arm (left)
    ctx.fillStyle='#884400'; ctx.fillRect(-13,6,4,15);
    ctx.strokeStyle='#cc8800'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-13,6); ctx.lineTo(-12,21); ctx.stroke();
    // String (taut when shooting)
    if (shooting) {
      ctx.strokeStyle='#ffeecc'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(-11,6); ctx.lineTo(0,12); ctx.lineTo(-11,21); ctx.stroke();
      // Arrow in flight
      ctx.fillStyle='#cc8800'; ctx.fillRect(0,11,14,2);
      ctx.fillStyle='#ffcc44'; ctx.fillRect(13,10,3,4);
    } else {
      ctx.strokeStyle='#884400'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(-11,6); ctx.lineTo(-11,21); ctx.stroke();
    }
    // Right arm
    ctx.fillStyle='#336633'; ctx.fillRect(4,9,4,8);
    // Head
    ctx.fillStyle='#44aa44'; ctx.fillRect(-6,-3,12,11);
    ctx.fillStyle='#66cc66'; ctx.fillRect(-5,-1,10,7);
    // Hood
    ctx.fillStyle='#228822'; ctx.fillRect(-7,-5,14,6);
    // Eyes
    ctx.fillStyle='#ffffff'; ctx.fillRect(-4,1,3,3); ctx.fillRect(2,1,3,3);
    ctx.fillStyle='#004400'; ctx.fillRect(-3,2,2,2); ctx.fillRect(3,2,2,2);
    // Feather on hood
    ctx.fillStyle='#aaffaa'; ctx.fillRect(-1,-7,3,5);
  }

  // Swordsman (gold/black katana fighter)
  function _drawSwordsman(cx, frame, slashing) {
    // Legs — fast stance
    ctx.fillStyle='#2a1800';
    if (frame===-1)     ctx.fillRect(-7,18,14,10);
    else if (frame===1) { ctx.fillRect(-7,18,6,10); ctx.fillRect(2,16,6,12); }
    else if (frame===2) { ctx.fillRect(-7,16,6,12); ctx.fillRect(2,18,6,10); }
    else                { ctx.fillRect(-7,18,6,10); ctx.fillRect(2,18,6,10); }
    // Hakama trim
    ctx.fillStyle='#ffcc44'; ctx.fillRect(-7,18,14,3);
    // Body — dark gi
    ctx.fillStyle='#1a1000'; ctx.fillRect(-8,5,16,15);
    ctx.fillStyle='#2a2000'; ctx.fillRect(-6,7,12,11);
    // Chest sash
    ctx.fillStyle='#ffaa00'; ctx.fillRect(-1,7,2,11);
    // Left arm
    ctx.fillStyle='#1a1000'; ctx.fillRect(-13,7,6,7);
    // Sword arm / katana
    if (slashing) {
      // Slashing: sword extended diagonally
      ctx.fillStyle='#888888'; ctx.fillRect(4,-4,4,28);     // blade
      ctx.fillStyle='#eeeeee'; ctx.fillRect(5,-4,2,28);     // shine
      ctx.fillStyle='#ffff44'; ctx.fillRect(4,-6,4,4);      // tip glow
      ctx.fillStyle='#8b4513'; ctx.fillRect(3,20,6,4);      // tsuba
      // Slash arc
      ctx.save();
      ctx.strokeStyle='rgba(255,230,50,0.85)';
      ctx.lineWidth=3; ctx.beginPath();
      ctx.arc(6, 8, 26, -1.0, 0.6); ctx.stroke();
      ctx.restore();
    } else {
      // At rest: sword held diagonally
      ctx.fillStyle='#888888'; ctx.fillRect(4,2,4,22);
      ctx.fillStyle='#eeeeee'; ctx.fillRect(5,2,2,22);
      ctx.fillStyle='#ffcc44'; ctx.fillRect(4,1,4,3);
      ctx.fillStyle='#8b4513'; ctx.fillRect(3,20,6,4);
    }
    // Head — with headband
    ctx.fillStyle='#ffdd99'; ctx.fillRect(-7,-5,14,13);
    ctx.fillStyle='#1a1000'; ctx.fillRect(-7,-5,14,5); // hair top
    ctx.fillStyle='#ffaa00'; ctx.fillRect(-8,-3,16,3); // headband
    // Eyes — focused
    ctx.fillStyle='#ffffff'; ctx.fillRect(-4,1,3,3); ctx.fillRect(2,1,3,3);
    ctx.fillStyle='#cc6600'; ctx.fillRect(-3,2,2,2); ctx.fillRect(3,2,2,2);
  }

  VimPlayer.prototype.draw = function() {
    if (this.dead) return;
    if (this.invTimer>0 && Math.floor(this.invTimer/4)%2===0) return;
    _drawPlayerCommon(this);

    ctx.save();
    const cx=this.x+this.w/2;
    ctx.translate(cx,this.y);
    if (this.facing===-1) ctx.scale(-1,1);
    const shooting=this.shootTimer>0;
    const slashing=swordSlashTimer>0;
    const frame=!this.onGround?-1:this.animFrame;

    const cid = this.charId || 'vimman';
    if      (cid==='claudeman')  _drawClaudeMan(cx, frame, shooting);
    else if (cid==='warrior')    _drawWarrior(cx, frame, slashing);
    else if (cid==='mage')       _drawMage(cx, frame, shooting);
    else if (cid==='archer')     _drawArcher(cx, frame, shooting);
    else if (cid==='swordsman')  _drawSwordsman(cx, frame, slashing);
    else                         _drawVimMan(cx, frame, shooting);

    // Sword slash arc overlay (VimMan / ClaudeMan only — Swordsman has built-in arc)
    if (slashing && (cid==='vimman'||cid==='claudeman')) {
      ctx.strokeStyle='rgba(255,220,50,'+(swordSlashTimer/12)+')';
      ctx.lineWidth=4; ctx.beginPath();
      ctx.arc(8, 12, 22, -0.8, 0.8);
      ctx.stroke();
    }
    // Swordsman special aura
    if (cid==='swordsman' && charSpecialActive > 0) {
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(Date.now() * 0.015);
      ctx.fillStyle = '#ffcc44';
      ctx.fillRect(-12, -8, 24, 36);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  // ── Met ───────────────────────────────────────────────────
  function Met(x,y,spd) {
    this.type=0; this.x=x; this.y=y; this.w=24; this.h=24;
    this.spd=spd||1; this.vx=-1.5*this.spd; this.vy=0; this.onGround=false;
    this.health=3; this.dead=false; this.state=0;
    this.stateTimer=60+(Math.random()*60|0); this.invTimer=0;
  }
  Met.prototype.update = function(player) {
    if (this.dead) return;
    if (this.invTimer>0) this.invTimer--;
    this.stateTimer--;
    if (this.stateTimer<=0) {
      this.state=this.state===0?1:0;
      this.stateTimer=this.state===1?90:60+(Math.random()*60|0);
    }
    this.vx=this.state===1?0:(player.x<this.x?-1.5:1.5)*this.spd;
    this.vy+=GRAVITY; if (this.vy>MAX_FALL) this.vy=MAX_FALL;
    this.onGround=false;
    this.x+=this.vx; resolveX(this);
    this.y+=this.vy; resolveY(this);
  };
  Met.prototype.takeDamage = function(n) {
    if (this.invTimer>0) return;
    this.health-=n; this.invTimer=10;
    if (this.health<=0) { this.dead=true; spawnExplosion(this.x+this.w/2,this.y+this.h/2,6); }
  };
  Met.prototype.draw = function() {
    if (this.dead) return;
    if (this.invTimer>0 && Math.floor(this.invTimer/2)%2===0) return;
    if (this.state===1) {
      ctx.fillStyle='#884400'; ctx.fillRect(this.x+2,this.y+10,20,14);
      ctx.fillStyle='#cc6600'; ctx.fillRect(this.x+4,this.y+8,16,6);
    } else {
      ctx.fillStyle='#cc3300'; ctx.fillRect(this.x+4,this.y+12,16,12);
      ctx.fillStyle='#884400'; ctx.fillRect(this.x+2,this.y+2,20,14);
      ctx.fillStyle='#cc6600'; ctx.fillRect(this.x+4,this.y,16,6);
      ctx.fillStyle='#ffffff'; ctx.fillRect(this.x+8,this.y+8,8,6);
      ctx.fillStyle='#000000'; ctx.fillRect(this.x+12,this.y+9,3,4);
    }
  };

  // ── Bee ───────────────────────────────────────────────────
  function Bee(x,y,spd) {
    this.type=1; this.x=x; this.y=y; this.startY=y; this.w=20; this.h=20;
    this.spd=spd||1; this.vx=-1.5*this.spd; this.vy=0; this.onGround=false;
    this.health=2; this.dead=false; this.angle=0;
    this.shootTimer=40+(Math.random()*40|0); this.invTimer=0;
  }
  Bee.prototype.update = function(player, bullets) {
    if (this.dead) return;
    if (this.invTimer>0) this.invTimer--;
    this.angle+=0.08;
    this.y=this.startY+Math.sin(this.angle)*40;
    this.vx=(player.x<this.x?-1.5:1.5)*this.spd;
    this.x+=this.vx;
    this.shootTimer--;
    const dx=player.x-this.x, dy=player.y-this.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if (this.shootTimer<=0 && dist<200) {
      this.shootTimer=80;
      const nx=dx/dist, ny=dy/dist;
      bullets.push(new Bullet(this.x+this.w/2-4,this.y+this.h/2-4,nx*4,ny*4,false));
    }
  };
  Bee.prototype.takeDamage = function(n) {
    if (this.invTimer>0) return;
    this.health-=n; this.invTimer=10;
    if (this.health<=0) { this.dead=true; spawnExplosion(this.x+this.w/2,this.y+this.h/2,6); }
  };
  Bee.prototype.draw = function() {
    if (this.dead) return;
    if (this.invTimer>0 && Math.floor(this.invTimer/2)%2===0) return;
    ctx.globalAlpha=0.5; ctx.fillStyle='#aaddff';
    ctx.fillRect(this.x-10,this.y+4,10,12); ctx.fillRect(this.x+this.w,this.y+4,10,12);
    ctx.globalAlpha=1;
    ctx.fillStyle='#ddcc00'; ctx.fillRect(this.x,this.y+4,this.w,this.h-4);
    ctx.fillStyle='#333300'; ctx.fillRect(this.x,this.y+8,this.w,3); ctx.fillRect(this.x,this.y+14,this.w,3);
    ctx.fillStyle='#ddcc00'; ctx.fillRect(this.x+2,this.y,16,8);
    ctx.fillStyle='#000000'; ctx.fillRect(this.x+6,this.y+2,4,4); ctx.fillRect(this.x+12,this.y+2,4,4);
  };

  // ── Tank ──────────────────────────────────────────────────
  function Tank(x,y,spd) {
    this.type=2; this.x=x; this.y=y; this.w=24; this.h=24;
    this.spd=spd||1; this.vx=0; this.vy=0; this.onGround=false;
    this.health=4; this.dead=false;
    this.shootTimer=45+(Math.random()*45|0); this.invTimer=0;
  }
  Tank.prototype.update = function(player, bullets) {
    if (this.dead) return;
    if (this.invTimer>0) this.invTimer--;
    this.vy+=GRAVITY; if (this.vy>MAX_FALL) this.vy=MAX_FALL;
    this.onGround=false;
    this.y+=this.vy; resolveY(this);
    this.shootTimer--;
    const dx=player.x-this.x, dist=Math.abs(dx);
    if (this.shootTimer<=0 && dist<300) {
      this.shootTimer=90;
      const dir=dx<0?-1:1;
      bullets.push(new Bullet(this.x+(dir>0?this.w:-8),this.y+8,dir*BULLET_SPEED*0.8*this.spd,0,false));
    }
  };
  Tank.prototype.takeDamage = function(n) {
    if (this.invTimer>0) return;
    this.health-=n; this.invTimer=10;
    if (this.health<=0) { this.dead=true; spawnExplosion(this.x+this.w/2,this.y+this.h/2,8); }
  };
  Tank.prototype.draw = function() {
    if (this.dead) return;
    if (this.invTimer>0 && Math.floor(this.invTimer/2)%2===0) return;
    ctx.fillStyle='#cc2200'; ctx.fillRect(this.x,this.y,this.w,this.h);
    ctx.fillStyle='#882200'; ctx.fillRect(this.x+4,this.y+4,16,16);
    ctx.fillStyle='#888888'; ctx.fillRect(this.x+this.w,this.y+8,10,8);
    ctx.fillStyle='#555555'; ctx.fillRect(this.x-2,this.y+this.h-6,this.w+4,6);
  };

  // ── Boss system ────────────────────────────────────────────
  // bossType: 0=BugDragon 1=NullPointer 2=SegFault 3=InfiniteLoop 4=CoreDump(final)
  const BOSS_DEFS = [
    { name:'BUG DRAGON',    color:'#dd44dd', color2:'#ff88ff', eyeCol:'#ffcc00', bg:'#220022' },
    { name:'NULL POINTER',  color:'#00ccff', color2:'#88ffff', eyeCol:'#ff4400', bg:'#001a22' },
    { name:'SEG FAULT',     color:'#ff4400', color2:'#ff8844', eyeCol:'#ffffff', bg:'#220800' },
    { name:'INFINITE LOOP', color:'#44ff44', color2:'#88ff88', eyeCol:'#ff00ff', bg:'#002200' },
    { name:'NULL DRAGON',   color:'#ff0044', color2:'#ff88aa', eyeCol:'#ffff00', bg:'#1a0008' },
  ];

  function VimBoss(hpMul, bossType) {
    this.type = bossType || 0;
    const def = BOSS_DEFS[this.type];
    const base = Math.round(28*(hpMul||1));
    // Spawn in center of expanded arena
    this.x=(BOSS_ARENA_START+8)*TILE; this.y=8*TILE; this.w=56; this.h=64;
    this.vx=0; this.vy=0; this.onGround=false;
    this.health=base; this.maxHealth=base;
    this.dead=false; this.deathTimer=180; this.invTimer=0;
    this.jumpTimer=90; this.shootTimer=60; this.facing=-1;
    this.phase=1;
    // type-specific state
    this.dashTimer=0; this.dashCD=0;     // type 1 NullPointer dash
    this.splitDone=false;                // type 2 SegFault split
    this.orbitAngle=0;                   // type 3 orbit ring
    this.minionTimer=0;                  // type 3 spawn
    this.beamTimer=0; this.beamActive=0; // type 4 beam
    this.patternTimer=0; this.pattern=0; // type 4 pattern cycling
    // Phase 3 state
    this.telegraphTimer = 0;
    this.telegraphMsg = '';
    this.lastPhase = 1;
    this.stompQueued = false;
    this.teleCD = 0;
    this.laserCD = 0;
    this.laserActive = 0;
    this.slowCD = 0;
    this.missileCD = 0;
  }
  VimBoss.prototype.update = function(player, bullets) {
    if (this.dead) { this.deathTimer--; return; }
    if (this.invTimer>0) this.invTimer--;
    this.phase = this.health < this.maxHealth * 0.25 ? 3 : this.health < this.maxHealth * 0.5 ? 2 : 1;
    // Phase transition detection
    if (this.phase > this.lastPhase) {
      this.lastPhase = this.phase;
      const msgs = ['', 'PHASE 2! 速度UP!', 'ENRAGE!! 最終形態!!'];
      addFlash('⚠ ' + (BOSS_DEFS[this.type]||{}).name + ' ── ' + (msgs[this.phase-1]||'PHASE '+this.phase+'!'));
      spawnExplosion(this.x+this.w/2, this.y+this.h/2, 20, (BOSS_DEFS[this.type]||{}).color||'#ffffff');
      this.invTimer = 30;
      bossWarnTimer = 80;
      bossWarnMsg = '⚠ PHASE ' + this.phase + ' !! ⚠';
      screenFlash = 15;
    }
    this.facing = player.x < this.x ? -1 : 1;
    const bx = this.x + this.w/2, by2 = this.y + this.h/2;
    const px = player.x + player.w/2, py = player.y + player.h/2;
    const dx = px - bx, dy = py - by2;
    const dist = Math.sqrt(dx*dx+dy*dy)||1;
    const spd = (this.phase===2 ? 5.5 : 4) * (1 + this.type * 0.15);

    if (this.type === 0) {
      // BugDragon: jump & 3-way aimed shots
      this.jumpTimer--;
      if (this.jumpTimer<=0 && this.onGround) {
        this.jumpTimer = this.phase===3 ? 40 : this.phase===2 ? 55 : 80;
        this.vy = PLAYER_JUMP * (this.phase===3 ? 1.1 : 0.85);
        this.vx = dx > 0 ? (this.phase===3 ? 4 : 2.2) : -(this.phase===3 ? 4 : 2.2);
        if (this.phase === 3) this.stompQueued = true;
      }
      if (this.phase === 3 && this.stompQueued && this.onGround && this.vy === 0 && this.jumpTimer > 0) {
        this.stompQueued = false;
        screenFlash = 8;
        addFlash('⚠ BUG DRAGON ── STOMP WAVE!!');
        for (let i = 0; i < 6; i++) {
          const b3 = new Bullet(this.x+this.w/2, this.y+this.h-8, (i%2===0?1:-1)*(2+i*1.5), 0, false);
          bullets.push(b3);
        }
      }
      this.shootTimer--;
      if (this.shootTimer<=0) {
        this.shootTimer = this.phase===3 ? 25 : this.phase===2 ? 35 : 55;
        const nx=dx/dist, ny=dy/dist;
        bullets.push(new Bullet(bx-4,by2-4,nx*spd,ny*spd,false));
        const spreadAngles = this.phase===3 ? [-0.6,-0.3,0.3,0.6] : this.phase===2 ? [-0.5,0.5] : [-0.35,0.35];
        for (const sp of spreadAngles) {
          const a=Math.atan2(dy,dx)+sp;
          bullets.push(new Bullet(bx-4,by2-4,Math.cos(a)*spd,Math.sin(a)*spd,false));
        }
      }
    } else if (this.type === 1) {
      // NullPointer: fast horizontal dash + burst
      this.dashCD--;
      if (this.dashCD<=0) {
        this.dashCD = this.phase===3 ? 50 : this.phase===2 ? 70 : 100;
        this.dashTimer = 12;
        this.vx = dx > 0 ? 7 : -7;
        this.vy = -4;
        addFlash('NULL POINTER -- DASH!');
      }
      if (this.dashTimer > 0) {
        this.dashTimer--;
        if (this.dashTimer === 6) {
          const burstCount = this.phase===3 ? 8 : 6;
          for (let i=0;i<burstCount;i++) {
            const a = Math.PI*2*i/burstCount;
            bullets.push(new Bullet(bx-4,by2-4,Math.cos(a)*(spd*0.8),Math.sin(a)*(spd*0.8),false));
          }
        }
      } else {
        this.vx *= 0.85; // decelerate
      }
      // Phase 3: teleport
      if (this.phase === 3) {
        this.teleCD--;
        if (this.teleCD <= 0) {
          this.teleCD = 120;
          this.x = player.x + (Math.random() > 0.5 ? 80 : -80 - this.w);
          this.x = Math.max(BOSS_ARENA_START*TILE, Math.min((COLS-1)*TILE-this.w, this.x));
          this.y = player.y - 20;
          addFlash('⚠ NULL POINTER ── TELEPORT!!');
          spawnExplosion(this.x+this.w/2, this.y+this.h/2, 8, '#00ccff');
          screenFlash = 6;
          for (let i=0;i<8;i++) {
            const a=Math.PI*2*i/8;
            bullets.push(new Bullet(this.x+this.w/2, this.y+this.h/2, Math.cos(a)*spd, Math.sin(a)*spd, false));
          }
        }
      }
      this.shootTimer--;
      if (this.shootTimer<=0) {
        this.shootTimer = this.phase===3 ? 20 : this.phase===2 ? 30 : 50;
        const nx=dx/dist, ny=dy/dist;
        for (const sp of [-0.25, 0, 0.25]) {
          const a=Math.atan2(dy,dx)+sp;
          bullets.push(new Bullet(bx-4,by2-4,Math.cos(a)*spd,Math.sin(a)*spd,false));
        }
      }
    } else if (this.type === 2) {
      // SegFault: phase 2 splits into 2 smaller versions
      this.jumpTimer--;
      if (this.jumpTimer<=0 && this.onGround) {
        this.jumpTimer = 60;
        this.vy = PLAYER_JUMP * 1.0;
        this.vx = dx > 0 ? 3.5 : -3.5;
      }
      this.shootTimer--;
      if (this.shootTimer<=0) {
        this.shootTimer = this.phase===3 ? 18 : this.phase===2 ? 25 : 45;
        const spreadCount = this.phase===3 ? 7 : 5;
        for (let i=-(Math.floor(spreadCount/2));i<=Math.floor(spreadCount/2);i++) {
          const a=Math.atan2(dy,dx)+(i*0.3);
          bullets.push(new Bullet(bx-4,by2-4,Math.cos(a)*spd,Math.sin(a)*spd,false));
        }
      }
      // spawn clone at 50% HP (once)
      if (this.phase>=2 && !this.splitDone) {
        this.splitDone = true;
        spawnExplosion(bx,by2,12,'#ff4400');
        addFlash('SEG FAULT -- SPLIT!  コピー出現!');
        vm_enemies.push(new SegClone(this.x - 60, this.y, this.maxHealth * 0.2, this.type));
      }
      // Phase 3: laser sweep
      if (this.phase === 3) {
        this.laserCD--;
        if (this.laserCD <= 0) {
          this.laserCD = 150;
          this.laserActive = 40;
          addFlash('⚠ SEG FAULT ── LASER SWEEP!!');
          bossWarnTimer = 30;
          bossWarnMsg = '⚠ LASER !! JUMP!';
          screenFlash = 10;
        }
        if (this.laserActive > 0) {
          this.laserActive--;
          if (this.laserActive % 4 === 0) {
            const lh = player.y + player.h/2;
            bullets.push(Object.assign(new Bullet(BOSS_ARENA_START*TILE, lh, 6, 0, false), {isLaser:true, w:24, h:6}));
            bullets.push(Object.assign(new Bullet((COLS-2)*TILE, lh, -6, 0, false), {isLaser:true, w:24, h:6}));
          }
        }
      }
    } else if (this.type === 3) {
      // InfiniteLoop: orbiting bullet ring + minion spam
      this.orbitAngle += this.phase===3 ? 0.08 : this.phase===2 ? 0.06 : 0.04;
      this.minionTimer--;
      if (this.minionTimer<=0) {
        this.minionTimer = this.phase===3 ? 60 : this.phase===2 ? 90 : 150;
        const spd2 = 1 + Math.random();
        vm_enemies.push(new Met(this.x + (Math.random()-0.5)*60, this.y, spd2));
        addFlash('INFINITE LOOP -- SPAWN!');
      }
      this.shootTimer--;
      if (this.shootTimer<=0) {
        const orbitCount = this.phase===3 ? 8 : 4;
        this.shootTimer = this.phase===3 ? 14 : this.phase===2 ? 18 : 30;
        for (let i=0;i<orbitCount;i++) {
          const a=this.orbitAngle+Math.PI*2*i/orbitCount;
          bullets.push(new Bullet(bx-4,by2-4,Math.cos(a)*spd*(this.phase===3?0.8:0.7),Math.sin(a)*spd*(this.phase===3?0.8:0.7),false));
        }
      }
      // Phase 3: time slow warning
      if (this.phase === 3) {
        this.slowCD--;
        if (this.slowCD <= 0) {
          this.slowCD = 200;
          addFlash('⚠ INFINITE LOOP ── TIME WARP!! 動きが遅くなる...');
          bossWarnTimer = 60;
          bossWarnMsg = '⚠ TIME SLOW !!';
        }
      }
      // slow float movement
      this.vx = Math.sin(Date.now()*0.001)*1.5*(this.phase>=2?1.5:1);
      this.vy += GRAVITY*0.3; // lighter gravity for floating
    } else {
      // type 4: CoreDump / NULL DRAGON — cycles between all patterns
      this.patternTimer--;
      if (this.patternTimer<=0) {
        this.patternTimer = this.phase===3 ? 80 : this.phase===2 ? 100 : 140;
        this.pattern = (this.pattern+1) % 3;
        addFlash('NULL DRAGON -- ' + ['CHARGE!','METEOR!','VOID BEAM!'][this.pattern]);
      }
      if (this.pattern===0) {
        // charge at player
        this.vx += (dx/dist)*0.4; this.vx=Math.max(-6,Math.min(6,this.vx));
        this.vy += (dy/dist)*0.2;
      } else if (this.pattern===1) {
        // meteor rain
        this.shootTimer--;
        if (this.shootTimer<=0) {
          this.shootTimer=this.phase===3?5:8;
          const mx=(BOSS_ARENA_START+Math.random()*14)*TILE, my=TILE;
          bullets.push(new Bullet(mx,my,0,spd*0.9,false));
        }
        this.jumpTimer--;
        if (this.jumpTimer<=0&&this.onGround){this.jumpTimer=50;this.vy=PLAYER_JUMP;}
      } else {
        // void beam — rapid aimed shots
        this.shootTimer--;
        if (this.shootTimer<=0) {
          this.shootTimer=this.phase===3?6:10;
          const nx=dx/dist, ny=dy/dist;
          bullets.push(new Bullet(bx-4,by2-4,nx*spd,ny*spd,false));
          bullets.push(new Bullet(bx-4,by2-4,nx*spd*1.3,ny*spd*1.3+1,false));
        }
      }
      // Phase 3: homing missiles + all patterns active
      if (this.phase === 3) {
        this.missileCD--;
        if (this.missileCD <= 0) {
          this.missileCD = 90;
          const m = new Bullet(bx-4, by2-4, dx > 0 ? -2 : 2, -3, false);
          m.isHoming = true; m.w = 8; m.h = 8;
          bullets.push(m);
          addFlash('⚠ NULL DRAGON ── MISSILE!!');
          screenFlash = 5;
        }
      }
    }

    this.vy += GRAVITY * (this.type===3 ? 0.4 : 1);
    if (this.vy>MAX_FALL) this.vy=MAX_FALL;
    this.onGround=false;
    this.x+=this.vx; resolveX(this);
    this.y+=this.vy; resolveY(this);
    const aL=BOSS_ARENA_START*TILE, aR=(COLS-1)*TILE-this.w;
    if (this.x<aL){this.x=aL;this.vx=Math.abs(this.vx);}
    if (this.x>aR){this.x=aR;this.vx=-Math.abs(this.vx);}
    if (this.y<TILE){this.y=TILE;this.vy=0;}
  };
  VimBoss.prototype.takeDamage = function(n) {
    if (this.invTimer>0) return;
    this.health-=n; this.invTimer=30;
    if (this.health<=0) { this.health=0; this.dead=true; spawnExplosion(this.x+this.w/2,this.y+this.h/2,20); }
  };
  VimBoss.prototype.draw = function() {
    if (this.dead && this.deathTimer<=0) return;
    if (this.invTimer>0 && Math.floor(this.invTimer/4)%2===0) return;
    const def = BOSS_DEFS[this.type];
    const x=this.x, y=this.y, BW=this.w, BH=this.h;
    const pc = this.phase===2 ? def.color2 : def.color;
    ctx.save();
    if (this.dead) ctx.globalAlpha=0.5+0.5*Math.sin(this.deathTimer*0.3);
    if (this.facing===1) { ctx.translate(x+BW/2,y); ctx.scale(-1,1); ctx.translate(-(x+BW/2),-y); }

    // Phase 2 aura
    if (this.phase===2) {
      ctx.fillStyle='rgba(255,80,80,0.18)';
      ctx.fillRect(x-6,y-6,BW+12,BH+12);
    }
    // Body
    ctx.fillStyle='#441133';
    ctx.fillRect(x+4,y+BH-14,16,14); ctx.fillRect(x+BW-20,y+BH-14,16,14); // legs
    ctx.fillStyle=pc; ctx.fillRect(x,y+16,BW,BH-30);
    ctx.fillStyle=def.color2; ctx.fillRect(x,y+20,BW,4); ctx.fillRect(x,y+34,BW,4);
    ctx.fillStyle=pc; ctx.fillRect(x+4,y,BW-8,20);
    // Type-specific head details
    if (this.type===1) { // NullPointer — angular visor
      ctx.fillStyle='#002233'; ctx.fillRect(x+4,y,BW-8,20);
      ctx.fillStyle='#00ffff'; ctx.fillRect(x+4,y,BW-8,4);
    } else if (this.type===2) { // SegFault — cracked body
      ctx.strokeStyle='#ff8800'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+10,y+10); ctx.lineTo(x+22,y+30); ctx.lineTo(x+15,y+44); ctx.stroke();
    } else if (this.type===3) { // InfiniteLoop — glowing ring
      ctx.strokeStyle=def.color; ctx.lineWidth=3;
      ctx.globalAlpha=(0.4+0.3*Math.sin(this.orbitAngle*5));
      ctx.beginPath(); ctx.arc(x+BW/2,y+BH/2,BH*0.7,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=this.dead?0.5+0.5*Math.sin(this.deathTimer*0.3):1;
    } else if (this.type===4) { // CoreDump — multiple eyes
      ctx.fillStyle=def.eyeCol;
      ctx.fillRect(x+4,y+7,8,6); ctx.fillRect(x+BW-12,y+7,8,6);
      ctx.fillRect(x+BW/2-4,y+3,8,5);
    }
    // Eyes
    ctx.fillStyle=def.eyeCol;
    ctx.fillRect(x+8,y+7,10,8); ctx.fillRect(x+BW-18,y+7,10,8);
    ctx.fillStyle='#000000';
    ctx.fillRect(x+10,y+9,4,5); ctx.fillRect(x+BW-14,y+9,4,5);
    // HP bar over boss
    const hpPct = this.health/this.maxHealth;
    ctx.fillStyle='#330011'; ctx.fillRect(x,y-10,BW,6);
    ctx.fillStyle=hpPct>0.5?'#ff4444':hpPct>0.25?'#ff8800':'#ff0000';
    ctx.fillRect(x,y-10,BW*hpPct,6);
    // Boss name
    ctx.fillStyle=def.color; ctx.font='bold 8px monospace'; ctx.textAlign='center';
    ctx.fillText(def.name, x+BW/2, y-13);
    ctx.globalAlpha=1; ctx.restore();
  };

  // SegClone — mini version spawned by SegFault boss
  function SegClone(x,y,hp,type) {
    this.type=type; this.x=x; this.y=y; this.w=28; this.h=34;
    this.vx=(Math.random()-0.5)*3; this.vy=0; this.onGround=false;
    this.health=hp; this.maxHealth=hp; this.dead=false; this.invTimer=0;
    this.shootTimer=30+(Math.random()*20|0);
  }
  SegClone.prototype.update = function(player, bullets) {
    if (this.dead) return;
    if (this.invTimer>0) this.invTimer--;
    this.vx = player.x < this.x ? -2 : 2;
    this.vy += GRAVITY; if (this.vy>MAX_FALL) this.vy=MAX_FALL;
    this.onGround=false;
    this.x+=this.vx; resolveX(this);
    this.y+=this.vy; resolveY(this);
    this.shootTimer--;
    if (this.shootTimer<=0 && Math.abs(player.x-this.x)<300) {
      this.shootTimer=50;
      const dx=player.x-this.x, dy=player.y-this.y;
      const d=Math.sqrt(dx*dx+dy*dy)||1;
      bullets.push(new Bullet(this.x+14,this.y+17,dx/d*5,dy/d*5,false));
    }
    const aL=BOSS_ARENA_START*TILE, aR=(COLS-1)*TILE-this.w;
    if(this.x<aL)this.x=aL; if(this.x>aR)this.x=aR;
  };
  SegClone.prototype.takeDamage = function(n) {
    if (this.invTimer>0) return;
    this.health-=n; this.invTimer=10;
    if (this.health<=0) { this.dead=true; spawnExplosion(this.x+14,this.y+17,6,'#ff4400'); }
  };
  SegClone.prototype.draw = function() {
    if (this.dead) return;
    if (this.invTimer>0 && Math.floor(this.invTimer/2)%2===0) return;
    ctx.fillStyle='#cc3300'; ctx.fillRect(this.x,this.y,this.w,this.h);
    ctx.fillStyle='#ff6622'; ctx.fillRect(this.x+4,this.y+4,this.w-8,this.h-8);
    ctx.fillStyle='#ffffff'; ctx.fillRect(this.x+6,this.y+8,6,5); ctx.fillRect(this.x+16,this.y+8,6,5);
    const hpPct=this.health/this.maxHealth;
    ctx.fillStyle='#330011'; ctx.fillRect(this.x,this.y-6,this.w,4);
    ctx.fillStyle='#ff4400'; ctx.fillRect(this.x,this.y-6,this.w*hpPct,4);
  };

  // ── Init stage ────────────────────────────────────────────
  function initStage() {
    // Use currentStageDef if set, else fall back
    const def = currentStageDef || makeWorldStageDef(worldNum, stageInWorld);
    if (!currentStageDef) currentStageDef = def;

    // Build the map for this stage's variant
    buildMap(
      def._mapVariant !== undefined ? def._mapVariant : pickMapVariant(def.worldId || worldNum, def.stageId || stageInWorld),
      def._bossType || 0
    );

    // Set stage gimmick and moving platforms
    const vIdx = def._mapVariant !== undefined ? def._mapVariant % MAP_VARIANTS.length : 0;
    stageGimmick = MAP_VARIANTS[vIdx].gimmick || 'none';
    gimmickTimer = 0;
    movingPlatforms = [];
    if (vIdx === 1 || vIdx === 5) {
      movingPlatforms.push({ x:20*TILE, y:6*TILE, w:3*TILE, h:TILE/2, vx:1.2, minX:18*TILE, maxX:26*TILE });
      movingPlatforms.push({ x:35*TILE, y:8*TILE, w:3*TILE, h:TILE/2, vx:-1.0, minX:30*TILE, maxX:40*TILE });
    }
    if (vIdx === 6 || vIdx === 7) {
      movingPlatforms.push({ x:10*TILE, y:9*TILE, w:4*TILE, h:TILE/2, vx:1.5, minX:8*TILE, maxX:20*TILE });
      movingPlatforms.push({ x:30*TILE, y:7*TILE, w:3*TILE, h:TILE/2, vx:-1.3, minX:25*TILE, maxX:38*TILE });
      movingPlatforms.push({ x:45*TILE, y:5*TILE, w:3*TILE, h:TILE/2, vx:1.0, minX:42*TILE, maxX:52*TILE });
    }

    vm_player=new VimPlayer(2*TILE, 13*TILE);
    vm_bullets=[]; vm_particles=[]; vm_enemies=[];
    vm_boss=null; vm_bossTriggered=false;
    vm_cameraX=0; stageIntroTimer=120; blinkTimer=0;
    specialCD=0; undoActive=0; yankHealCD=0; shieldActive=0; swordSlashTimer=0;
    xHoldTimer=0; sComboCount=0; sComboTimer=0;
    charSpecialCD=0; charSpecialActive=0;
    ddLaserTimer=0; ddLaserDir=1;
    bossWarnTimer=0; bossWarnMsg='';
    familiarShootTimer=0;

    const spd=def.spd;
    def.mets.forEach(function(c)  { vm_enemies.push(new Met(c*TILE, 13*TILE-24, spd)); });
    def.bees.forEach(function(d)  { vm_enemies.push(new Bee(d[0]*TILE, d[1]*TILE, spd)); });
    def.tanks.forEach(function(c) { vm_enemies.push(new Tank(c*TILE, 7*TILE, spd)); });
    // Only spawn boss if isBoss (last stage of world)
    if (def.bossHPMul > 0) vm_boss = new VimBoss(def.bossHPMul, def._bossType || 0);
    else vm_boss = new VimBoss(0.3, 0); // weak dummy boss for non-boss stages
  }

  // ── Special moves ─────────────────────────────────────────
  function execDD() {
    if (!vm_player||vm_player.dead||specialCD>0) return;
    if (window.canUseGameCmd && !window.canUseGameCmd('dd')) {
      addFlash('dd はまだアンロックされていません  (World 8ボスを倒せ)'); return;
    }
    // dd = DELETE LINE — fire a persistent laser from the player's position
    ddLaserTimer = 90;  // ~1.5 seconds
    ddLaserDir   = vm_player.facing;
    specialCD    = getDDCool();
    screenFlash  = 8;
    addFlash('dd -- DELETE LINE! レーザー発射！ (1.5秒持続)');
    addVimXP(2);
  }
  function execYY() {
    if (!vm_player||vm_player.dead||yankHealCD>0) return;
    if (window.canUseGameCmd && !window.canUseGameCmd('yy')) {
      addFlash('yy はまだアンロックされていません  (World 8ボスを倒せ)'); return;
    }
    const heal=6+skillLv('yyheal')*4;
    vm_player.health=Math.min(vm_player.maxHealth, vm_player.health+heal);
    yankHealCD=120; score+=50;
    spawnExplosion(vm_player.x+vm_player.w/2,vm_player.y,3,'#44ff88');
    addFlash('yy -- YANK! +'+heal+' HP');
  }
  function execGG() {
    if (!vm_player||vm_player.dead) return;
    vm_player.x=2*TILE; vm_player.y=13*TILE; vm_player.vx=0; vm_player.vy=0; vm_cameraX=0;
    addFlash('gg -- GOTO TOP  (git checkout HEAD~∞)');
  }
  function execCC() {
    if (!vm_player||vm_player.dead||specialCD>0) return;
    if (window.canUseGameCmd && !window.canUseGameCmd('cc')) {
      addFlash('cc はまだアンロックされていません  (World 10ボスを倒せ)'); return;
    }
    if (skillLv('spread')>0) {
      // 3-way spread
      for (const ang of [-0.25, 0, 0.25]) {
        const bx=vm_player.facing===1?vm_player.x+vm_player.w:vm_player.x-24;
        const vx=Math.cos(ang)*BULLET_SPEED*0.8*vm_player.facing;
        const vy=Math.sin(ang)*BULLET_SPEED*0.8;
        vm_bullets.push(new BigBullet(bx,vm_player.y+8, vx));
        vm_bullets[vm_bullets.length-1].vy=vy;
      }
      addFlash('cc -- SPREAD SHOT! 3-way');
    } else {
      const bx=vm_player.facing===1?vm_player.x+vm_player.w:vm_player.x-24;
      vm_bullets.push(new BigBullet(bx,vm_player.y+8,vm_player.facing*BULLET_SPEED*0.8));
      addFlash('cc -- CHANGE CHANGE! Big bullet');
    }
    specialCD=45; score+=10;
  }
  function execZZ() {
    if (!vm_player||vm_player.dead) return;
    if (window.canUseGameCmd && !window.canUseGameCmd('ZZ')) {
      addFlash('ZZ はまだアンロックされていません  (World 5ボスを倒せ)'); return;
    }
    if (skillLv('shield')>0) {
      shieldActive=180;
      addFlash('ZZ -- SHIELD ACTIVE! (180f)');
    } else {
      lives=Math.min(lives+1,9); screenFlash=5; score+=100;
      addFlash('ZZ -- +1 BRANCH saved');
    }
  }
  function execUndo() {
    if (!vm_player||vm_player.dead||undoActive>0) return;
    if (window.canUseGameCmd && !window.canUseGameCmd('u')) {
      addFlash('u はまだアンロックされていません  (World 9ボスを倒せ)'); return;
    }
    undoActive=90; vm_player.invTimer=Math.max(vm_player.invTimer,90);
    spawnExplosion(vm_player.x+vm_player.w/2,vm_player.y+vm_player.h/2,4,'#5599ff');
    addFlash('u -- UNDO! 90f invincibility');
  }
  function execWDash(dir) {
    if (!vm_player||vm_player.dead) return;
    const spd = PLAYER_SPEED * (vm_player.spdMul || 1.0) * getDashMult();
    vm_player.vx=dir*spd; vm_player.facing=dir;
    addFlash((dir>0?'w':'b')+' -- WORD DASH x'+getDashMult().toFixed(1));
  }

  // Weapon special attack — varies by weapon category
  function weaponSpecial() {
    if (!vm_player || vm_player.dead) return;
    const cat = weaponCategory();
    const cid = vm_player.charId || 'vimman';

    if (cat === 'melee') {
      // Sword combo: sComboCount tracks hit count
      if (sComboTimer > 0 && sComboCount >= 1) {
        sComboCount++;
        sComboTimer = 28;
        if (sComboCount === 3) {
          // SLAM — wide AOE
          sComboCount = 0;
          if (swordSlashTimer > 0) return;
          swordSlashTimer = 25;
          const dmg = getMeleeDmg() * 2;
          const hitMinX = vm_player.x - 32;
          const hitMaxX = vm_player.x + vm_player.w + 32;
          let hit = 0;
          vm_enemies.forEach(function(e) {
            if (!e.dead && e.x+e.w > hitMinX && e.x < hitMaxX) {
              e.takeDamage(dmg); hit++;
              e.vx = (e.x > vm_player.x ? 6 : -6);
              spawnExplosion(e.x+e.w/2, e.y+e.h/2, 8, '#ffcc44');
            }
          });
          if (vm_boss && !vm_boss.dead && vm_boss.x+vm_boss.w > hitMinX && vm_boss.x < hitMaxX) {
            vm_boss.takeDamage(dmg); hit++;
            spawnExplosion(vm_boss.x+vm_boss.w/2, vm_boss.y+vm_boss.h/2, 10, '#ffcc44');
          }
          screenFlash = 8;
          addFlash('⚔⚔⚔ SLAM!! ' + dmg + ' CRIT DMG' + (hit > 0 ? ' x' + hit + ' HIT!' : ''));
          if (hit > 0) addVimXP(hit * 3);
          return;
        } else {
          // Normal slash with combo damage boost
          if (swordSlashTimer > 0) return;
          swordSlashTimer = 16;
          const dmg = getMeleeDmg() * (sComboCount === 2 ? 1.5 : 1);
          const reach = 52;
          const hitX = vm_player.facing > 0 ? vm_player.x + vm_player.w : vm_player.x - reach;
          let hit = 0;
          vm_enemies.forEach(function(e) {
            if (!e.dead && e.x+e.w > hitX && e.x < hitX + reach) {
              e.takeDamage(dmg); hit++;
              spawnExplosion(e.x+e.w/2, e.y+e.h/2, 5, '#ffcc44');
            }
          });
          if (vm_boss && !vm_boss.dead && vm_boss.x+vm_boss.w > hitX && vm_boss.x < hitX + reach) {
            vm_boss.takeDamage(dmg); hit++;
            spawnExplosion(vm_boss.x+vm_boss.w/2, vm_boss.y+vm_boss.h/2, 5, '#ffcc44');
          }
          screenFlash = 4;
          addFlash('⚔⚔ Combo x' + sComboCount + '!  ' + Math.floor(dmg) + ' dmg' + (hit > 0 ? ' HIT!' : ''));
          if (hit > 0) addVimXP(hit);
          return;
        }
      }
      // First hit
      if (swordSlashTimer > 0) return;
      sComboCount = 1;
      sComboTimer = 28;
      swordSlashTimer = 16;
      const dmg1 = getMeleeDmg();
      const reach1 = 52;
      const hitX1 = vm_player.facing > 0 ? vm_player.x + vm_player.w : vm_player.x - reach1;
      let hit1 = 0;
      vm_enemies.forEach(function(e) {
        if (!e.dead && e.x+e.w > hitX1 && e.x < hitX1 + reach1) {
          e.takeDamage(dmg1); hit1++;
          spawnExplosion(e.x+e.w/2, e.y+e.h/2, 5, '#ffcc44');
        }
      });
      if (vm_boss && !vm_boss.dead && vm_boss.x+vm_boss.w > hitX1 && vm_boss.x < hitX1 + reach1) {
        vm_boss.takeDamage(dmg1); hit1++;
        spawnExplosion(vm_boss.x+vm_boss.w/2, vm_boss.y+vm_boss.h/2, 5, '#ffcc44');
      }
      screenFlash = 4;
      addFlash('⚔ Sword! ' + dmg1 + ' dmg' + (hit1 > 0 ? ' HIT!  (s again for COMBO!)' : ' (miss)'));
      if (hit1 > 0) addVimXP(hit1);

    } else if (cat === 'staff') {
      // Staff AOE — magic circle burst around player
      if (swordSlashTimer > 0) return;
      swordSlashTimer = 30;
      const dmg = getMeleeDmg() * 2;
      const cx = vm_player.x + vm_player.w/2;
      const cy = vm_player.y + vm_player.h/2;
      const range = 80;
      let hit = 0;
      vm_enemies.forEach(function(e) {
        const ex = e.x + e.w/2, ey = e.y + e.h/2;
        const dist = Math.sqrt((ex-cx)*(ex-cx)+(ey-cy)*(ey-cy));
        if (!e.dead && dist < range) {
          e.takeDamage(dmg); hit++;
          spawnExplosion(ex, ey, 6, '#dd88ff');
        }
      });
      if (vm_boss && !vm_boss.dead) {
        const bx = vm_boss.x+vm_boss.w/2, by = vm_boss.y+vm_boss.h/2;
        if (Math.sqrt((bx-cx)*(bx-cx)+(by-cy)*(by-cy)) < range+20) {
          vm_boss.takeDamage(dmg); hit++;
          spawnExplosion(bx, by, 8, '#dd88ff');
        }
      }
      for (let i=0;i<12;i++) {
        const a = Math.PI*2*i/12;
        vm_particles.push({x:cx+Math.cos(a)*range,y:cy+Math.sin(a)*range,vx:Math.cos(a)*2,vy:Math.sin(a)*2-2,life:40,maxLife:40,color:'#dd88ff',size:5});
      }
      spawnExplosion(cx, cy, 10, '#aa44ff');
      screenFlash = 6;
      addFlash('✨ Magic Burst! AOE ' + dmg + ' dmg' + (hit > 0 ? ' x' + hit + ' HIT!' : ' (miss)'));
      if (hit > 0) addVimXP(hit * 2);

    } else if (cat === 'bow') {
      // Arrow Rain — arrows fall from above
      if (swordSlashTimer > 0) return;
      swordSlashTimer = 35;
      addFlash('🏹 Arrow Rain!  x8連続矢！');
      screenFlash = 4;
      for (let i = 0; i < 8; i++) {
        setTimeout(function() {
          if (!vm_player || vm_player.dead) return;
          const rainX = vm_player.x + (Math.random() - 0.5) * 160;
          const arr = new Bullet(rainX, 0, 0, BULLET_SPEED * 0.9, true);
          arr.w = 4; arr.h = 18; arr.isPierce = true; arr.pierceLeft = 3; arr.isRainArrow = true;
          vm_bullets.push(arr);
        }, i * 60);
      }

    } else if (cid === 'swordsman') {
      // Swordsman without melee weapon: powerful unarmed slash wave
      if (swordSlashTimer > 0) return;
      swordSlashTimer = 22;
      const dmgSW = getMeleeDmg() * 0.8;
      const hitXSW = vm_player.facing > 0 ? vm_player.x + vm_player.w : vm_player.x - 48;
      let hSW = 0;
      vm_enemies.forEach(function(e) {
        if (!e.dead && e.x+e.w > hitXSW && e.x < hitXSW + 48) {
          e.takeDamage(dmgSW); hSW++;
          spawnExplosion(e.x+e.w/2, e.y+e.h/2, 4, '#ffcc44');
        }
      });
      if (vm_boss && !vm_boss.dead && vm_boss.x+vm_boss.w > hitXSW && vm_boss.x < hitXSW + 48) {
        vm_boss.takeDamage(dmgSW); hSW++;
      }
      // Fire a slash wave projectile
      const bxSW = vm_player.facing > 0 ? vm_player.x + vm_player.w : vm_player.x - 20;
      const wave = new Bullet(bxSW, vm_player.y+8, vm_player.facing*BULLET_SPEED*0.75, 0, true);
      wave.w=22; wave.h=12; wave.isSlash=true; wave.dmgMul=2; wave.isPierce=true; wave.pierceLeft=3;
      vm_bullets.push(wave);
      screenFlash = 5;
      addFlash('⚔ 斬撃波！ ' + Math.floor(dmgSW) + ' dmg + 斬撃飛ばし！' + (hSW > 0 ? ' HIT x'+hSW : ''));
      if (hSW > 0) addVimXP(hSW * 2);
    } else {
      // No weapon — Warrior fist slam, else hint
      if (cid === 'warrior') {
        if (swordSlashTimer > 0) return;
        swordSlashTimer = 20;
        const dmg2 = getMeleeDmg() * 0.7;
        const hitX2 = vm_player.facing > 0 ? vm_player.x + vm_player.w : vm_player.x - 44;
        let h2 = 0;
        vm_enemies.forEach(function(e) {
          if (!e.dead && e.x+e.w > hitX2 && e.x < hitX2 + 44) {
            e.takeDamage(dmg2); h2++;
            spawnExplosion(e.x+e.w/2, e.y+e.h/2, 3, '#ffaa00');
          }
        });
        if (vm_boss && !vm_boss.dead && vm_boss.x+vm_boss.w > hitX2 && vm_boss.x < hitX2 + 44) {
          vm_boss.takeDamage(dmg2); h2++;
        }
        screenFlash = 4;
        addFlash('👊 アームカノン！ ' + Math.floor(dmg2) + ' dmg' + (h2 > 0 ? ' HIT!' : ''));
        if (h2 > 0) addVimXP(h2);
      } else {
        addFlash('s = 武器スペシャル。装備してください (HOME > キャラ > 武器)');
      }
    }
  }

  function charSpecial() {
    if (!vm_player || vm_player.dead) return;
    if (charSpecialCD > 0) {
      addFlash('キャラ特殊技 クールダウン中... ' + Math.ceil(charSpecialCD/60) + 's');
      return;
    }
    const cid = vm_player.charId || 'vimman';

    if (cid === 'claudeman') {
      charSpecialCD = 300;
      charSpecialActive = 240;
      screenFlash = 10;
      addFlash('/think ── THINKING... ATK×2 for 4s!  AI MODE ON');
      spawnExplosion(vm_player.x+vm_player.w/2, vm_player.y+vm_player.h/2, 15, '#ff8800');
      for (let i=0;i<8;i++) {
        const a=Math.PI*2*i/8;
        vm_particles.push({x:vm_player.x+vm_player.w/2+Math.cos(a)*20,y:vm_player.y+vm_player.h/2+Math.sin(a)*20,vx:Math.cos(a)*3,vy:Math.sin(a)*3-2,life:50,maxLife:50,color:'#ff8800',size:6});
      }
    } else if (cid === 'warrior') {
      charSpecialCD = 360;
      charSpecialActive = 300;
      vm_player.invTimer = 60;
      screenFlash = 12;
      addFlash('🔥 BERSERKER RAGE!! ATK×1.5 + 無敵1秒！ 5秒間');
      spawnExplosion(vm_player.x+vm_player.w/2, vm_player.y+vm_player.h/2, 20, '#ff2200');
    } else if (cid === 'mage') {
      charSpecialCD = 360;
      charSpecialActive = 300;
      familiarShootTimer = 0;
      screenFlash = 8;
      addFlash('✨ ファミリア召喚！ 5秒間 自動追尾魔法弾！');
      for (let i=0;i<10;i++) {
        const a=Math.PI*2*i/10;
        vm_particles.push({x:vm_player.x+vm_player.w/2+Math.cos(a)*30,y:vm_player.y+vm_player.h/2+Math.sin(a)*30,vx:Math.cos(a)*2,vy:Math.sin(a)*2,life:60,maxLife:60,color:'#aa44ff',size:5});
      }
    } else if (cid === 'archer') {
      charSpecialCD = 240;
      screenFlash = 5;
      addFlash('🏹🏹🏹 ARROW STORM!! 全方向矢！');
      for (let i=0;i<12;i++) {
        const a = Math.PI*2*i/12;
        const arr = new Bullet(vm_player.x+vm_player.w/2, vm_player.y+vm_player.h/2, Math.cos(a)*BULLET_SPEED, Math.sin(a)*BULLET_SPEED, true);
        arr.w=12; arr.h=4; arr.isPierce=true; arr.pierceLeft=4;
        vm_bullets.push(arr);
      }
      addVimXP(3);
    } else if (cid === 'swordsman') {
      // Swordsman: Iaijutsu — instant quick-draw, massive slash wave + invuln dash
      charSpecialCD = 300;
      charSpecialActive = 180;
      swordSlashTimer = 30;
      screenFlash = 14;
      vm_player.invTimer = 30;
      // Fire three powerful slash waves in a fan
      const bxSS = vm_player.facing > 0 ? vm_player.x + vm_player.w : vm_player.x - 24;
      for (const ang of [-0.25, 0, 0.25]) {
        const vxW = Math.cos(ang) * BULLET_SPEED * vm_player.facing;
        const vyW = Math.sin(ang) * BULLET_SPEED;
        const w = new Bullet(bxSS, vm_player.y + vm_player.h/2, vxW, vyW, true);
        w.w=28; w.h=14; w.isSlash=true; w.dmgMul=4; w.isPierce=true; w.pierceLeft=5;
        vm_bullets.push(w);
      }
      addFlash('⚔⚔⚔ 居合！ IAIJUTSU! ATK×1.5 3連斬撃波！');
      spawnExplosion(vm_player.x+vm_player.w/2, vm_player.y+vm_player.h/2, 18, '#ffcc44');
      addVimXP(5);
    } else {
      // VimMan: dash combo
      charSpecialCD = 200;
      vm_player.x += vm_player.facing * 80;
      vm_player.invTimer = 20;
      screenFlash = 5;
      addFlash('⚡ VIM DASH!  w×3連続！');
      spawnExplosion(vm_player.x - vm_player.facing*80, vm_player.y+vm_player.h/2, 8, '#5599ff');
    }
  }

  function fireChargeShot() {
    if (!vm_player || vm_player.dead) return;
    const cid = vm_player.charId || 'vimman';
    const bx = vm_player.facing===1 ? vm_player.x+vm_player.w : vm_player.x-22;
    const spd = BULLET_SPEED;

    if (cid === 'mage') {
      const orb = new Bullet(bx, vm_player.y+6, vm_player.facing*spd*0.4, 0, true);
      orb.w=18; orb.h=18; orb.isMagic=true; orb.dmgMul=5; orb.isHoming=true;
      vm_bullets.push(orb);
      addFlash('✨ CHARGE: ホーミングオーブ！ 5x dmg!');
    } else if (cid === 'archer') {
      const arr = new Bullet(bx, vm_player.y+12, vm_player.facing*spd*1.5, 0, true);
      arr.w=24; arr.h=6; arr.isPierce=true; arr.pierceLeft=99; arr.dmgMul=3;
      vm_bullets.push(arr);
      addFlash('🏹 CHARGE: 貫通矢！ 3x dmg 全貫通！');
    } else if (cid === 'warrior') {
      const p = new Bullet(bx, vm_player.y+14, vm_player.facing*spd*0.8, 0, true);
      p.w=20; p.h=16; p.dmgMul=4; p.isBig=true;
      vm_bullets.push(p);
      addFlash('👊 CHARGE: 衝撃波！ 4x dmg!');
    } else if (cid === 'claudeman') {
      for (let sp of [-0.3, 0, 0.3]) {
        const a = sp + (vm_player.facing > 0 ? 0 : Math.PI);
        const b2 = new Bullet(bx, vm_player.y+10, Math.cos(a)*spd, Math.sin(a)*spd, true);
        b2.dmgMul=2; b2.w=10; b2.h=8;
        vm_bullets.push(b2);
      }
      addFlash('🤖 CHARGE: AI 3-way shot! 2x dmg each!');
    } else if (cid === 'swordsman') {
      // Swordsman: giant slash wave
      swordSlashTimer = 35;
      const sw = new Bullet(bx, vm_player.y+2, vm_player.facing*spd*0.7, 0, true);
      sw.w=36; sw.h=24; sw.isSlash=true; sw.dmgMul=6; sw.isPierce=true; sw.pierceLeft=8;
      vm_bullets.push(sw);
      screenFlash = 10;
      addFlash('⚔ CHARGE: 覇王斬！ 超巨大斬撃波 6x dmg 全貫通！');
    } else {
      const bb = new BigBullet(bx, vm_player.y+8, vm_player.facing*spd*0.9);
      bb.dmgMul=3;
      vm_bullets.push(bb);
      addFlash('💥 CHARGE: MEGA SHOT! 3x dmg!');
    }
    screenFlash = 6;
    addVimXP(1);
    vm_player.shootTimer = 20;
  }
  function execVS() {
    let killed=0;
    vm_enemies.forEach(function(e) {
      if (!e.dead&&e.x>vm_cameraX-32&&e.x<vm_cameraX+512+32) {
        e.health=0; e.dead=true; spawnExplosion(e.x+e.w/2,e.y+e.h/2,8); killed++; score+=300;
      }
    });
    screenFlash=15; addVimXP(killed*3);
    addFlash(':vs -- VERTICAL SPLIT! '+killed+' bugs obliterated');
  }
  function handleCmdLine(cmd) {
    const c=cmd.trim();
    if (c==='w') {
      saveProgress(); lives=Math.min(lives+1,9); screenFlash=8; score+=200;
      addFlash(':w  -- Written! Progress saved. +1 BRANCH');
    }
    else if (c==='q') {
      saveProgress(); addFlash(':q  -- Progress saved. Returning to menu...');
      setTimeout(function() { switchGame('menu'); }, 800);
    }
    else if (c==='q!') {
      addFlash(':q!  -- Quit without saving (segfault)');
      setTimeout(function() { switchGame('menu'); }, 800);
    }
    else if (c==='wq'||c==='x') {
      // :wq = write & quit → save position + return to HOME (Vim-style)
      saveProgress();
      addFlash(':wq  -- Written! 進捗を保存してHOMEへ戻ります...');
      setTimeout(function() { switchGame('menu'); }, 800);
    }
    else if (c==='vs'||c==='sp')  execVS();
    else if (c==='help')          addFlash(vm_player&&vm_player.charId==='claudeman'?':help  ClaudeMan commands: think=ATK×2  add=召喚  print=ビーム  bash=爆発  fix=回復  run=高速':':help  h/l:Move  k:Jump  x:Shoot  dd:Nuke  yy:+HP  gg:Top  cc:BigShot  ZZ:Shield/Life  u:Undo  w/b:Dash  :w=save  :wq=clear  :q=menu');
    // ── ClaudeMan exclusive Claude Code commands ─────────────
    else if ((c==='think'||c==='claude think') && vm_player&&vm_player.charId==='claudeman') {
      charSpecialCD=300; charSpecialActive=240; screenFlash=10;
      addFlash('/think ── 深考モード発動！ ATK×2 (4秒間)');
      spawnExplosion(vm_player.x+vm_player.w/2,vm_player.y+vm_player.h/2,15,'#ff8800');
    }
    else if ((c==='add'||c==='claude add') && vm_player&&vm_player.charId==='claudeman') {
      // Summon a helper drone that auto-fires
      charSpecialActive=300; familiarShootTimer=0;
      addFlash('claude add ── AIドローン召喚！ 自動追尾ショット (5秒)');
      screenFlash=8;
    }
    else if ((c==='print'||c==='claude --print') && vm_player&&vm_player.charId==='claudeman') {
      // Horizontal text beam through all enemies
      if (shieldActive>0){addFlash('クールダウン中...');return;}
      shieldActive=60;
      const beamY=vm_player.y+vm_player.h/2;
      for(let c2=0;c2<COLS;c2++){
        const bb=new Bullet(c2*TILE,beamY,vm_player.facing*BULLET_SPEED,0,true);
        bb.w=TILE; bb.h=4; bb.isPierce=true; bb.pierceLeft=99; bb.dmgMul=2; bb.isLaser=true;
        vm_bullets.push(bb);
      }
      screenFlash=12;
      addFlash('claude --print ── テキストビーム!! 全貫通2×dmg');
    }
    else if ((c==='bash'||c==='run bash') && vm_player&&vm_player.charId==='claudeman') {
      // Shell explosion — kills all on-screen enemies
      execVS();
      addFlash('bash ── シェル爆発!! 全バグ消去！');
    }
    else if ((c==='fix'||c==='claude fix') && vm_player&&vm_player.charId==='claudeman') {
      // Repair / heal
      if(!vm_player.dead){vm_player.health=Math.min(vm_player.maxHealth,vm_player.health+10);}
      addFlash('claude fix ── AIデバッグ完了。HP+10回復！');
      screenFlash=5;
    }
    else if ((c==='run'||c==='claude run') && vm_player&&vm_player.charId==='claudeman') {
      // Speed burst
      vm_player.vx=vm_player.facing*PLAYER_SPEED*5;
      vm_player.invTimer=30;
      addFlash('claude run ── コード実行！ 高速ダッシュ + 無敵1秒');
      screenFlash=6;
    }
    else if (c==='dd')            execDD();
    else if (c==='skills'||c==='equip') { state='equipment'; }
    else if (c==='menu')          { saveProgress(); switchGame('menu'); }
    else addFlash('E492: Not an editor command: '+c+'  (try :help)');
  }

  // ── Camera ────────────────────────────────────────────────
  function updateCamera() {
    let targetX;
    if (vm_bossTriggered) targetX=BOSS_ARENA_START*TILE;
    else targetX=vm_player.x-512/2+vm_player.w/2;
    const maxCamX=COLS*TILE-512;
    targetX=Math.max(0,Math.min(maxCamX,targetX));
    vm_cameraX+=(targetX-vm_cameraX)*0.12;
  }

  // ── Drawing helpers ───────────────────────────────────────
  function drawBackground() {
    ctx.globalAlpha=1; // safety reset
    const mc = getMapColors();
    const grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, mc.bgTop); grad.addColorStop(1, mc.bgBot);
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffffff';
    STARS.forEach(function(s) {
      ctx.globalAlpha=0.5+0.3*Math.sin(Date.now()*0.001+s.x*0.01);
      ctx.fillRect(((s.x-vm_cameraX*0.15)%W+W)%W, s.y, s.r, s.r);
    });
    ctx.globalAlpha=1;
  }

  function drawTiles() {
    // NOTE: called inside ctx.translate(-vm_cameraX, 0), so use WORLD coords directly.
    const startCol=Math.max(0,Math.floor(vm_cameraX/TILE));
    const endCol=Math.min(COLS-1,Math.ceil((vm_cameraX+512)/TILE));
    for (let r=0;r<ROWS;r++) {
      for (let c=startCol;c<=endCol;c++) {
        const t=VM_MAP[r][c];
        if (!t) continue;
        const wx=c*TILE, wy=r*TILE;   // world coords — translate handles camera
        if (t===1) {
          const mc2 = getMapColors();
          // Parse tileHi hex to derive base/shadow colors dynamically
          ctx.fillStyle=mc2.tileDark||'#112266'; ctx.fillRect(wx,wy,TILE,TILE);
          ctx.fillStyle=mc2.tileHi;             ctx.fillRect(wx,wy,TILE,4);
          ctx.fillStyle=mc2.tileShadow||'#0a1833'; ctx.fillRect(wx,wy+TILE-4,TILE,4);
          ctx.fillStyle=mc2.tileEdge||'#0d1d55';
          ctx.fillRect(wx,wy,1,TILE); ctx.fillRect(wx,wy,TILE,1);
          ctx.fillStyle=mc2.tileMid||'#1a3377'; ctx.fillRect(wx+1,wy+4,TILE-2,TILE-8);
        }
      }
    }
    // Goal marker — also world coords
    if (!vm_bossTriggered) {
      const gx=(BOSS_ARENA_START-2)*TILE, gy=12*TILE;
      ctx.fillStyle='rgba(0,255,136,0.12)';
      ctx.fillRect(gx, gy, TILE*2, TILE*2);
      ctx.strokeStyle='#00ff88'; ctx.lineWidth=2;
      ctx.strokeRect(gx, gy, TILE*2, TILE*2);
      ctx.fillStyle='#00ff88'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
      ctx.fillText('BOSS', gx+TILE, gy+TILE+4);
    }
  }

  // ── Key display ───────────────────────────────────────────
  function drawKeyDisplay() {
    if (!window.gameSettings || !window.gameSettings.get('showInputDisp')) return;
    const kx=W-140, ky=H-62, kw=132, kh=36;
    ctx.fillStyle='rgba(0,0,20,0.75)';
    ctx.fillRect(kx,ky,kw,kh);
    ctx.strokeStyle='#334466'; ctx.lineWidth=1;
    ctx.strokeRect(kx,ky,kw,kh);
    ctx.fillStyle='#445566'; ctx.font='9px monospace'; ctx.textAlign='left';
    ctx.fillText('INPUT:', kx+4, ky+10);
    const show=recentKeys.slice(-5);
    show.forEach(function(k,i) {
      const age=show.length-1-i;
      const alpha=1-age*0.18;
      ctx.globalAlpha=Math.max(0.1,alpha);
      ctx.fillStyle=age===0?'#ffff44':'#88aaff';
      ctx.font=age===0?'bold 13px monospace':'11px monospace';
      ctx.textAlign='left';
      ctx.fillText(k, kx+4+i*24, ky+28);
    });
    ctx.globalAlpha=1;
  }

  // ── Command reference panel ────────────────────────────────
  function drawCommandRef() {
    if (!window.gameSettings || !window.gameSettings.get('showCmdPanel')) return;
    const px=4, py=24, pw=170, ph=214;
    ctx.fillStyle='rgba(0,0,20,0.85)';
    ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#334477'; ctx.lineWidth=1;
    ctx.strokeRect(px,py,pw,ph);
    const isClaudeMan = vm_player && vm_player.charId === 'claudeman';
    ctx.fillStyle=isClaudeMan?'#ff8800':'#5588ff'; ctx.font='bold 10px monospace'; ctx.textAlign='left';
    ctx.fillText(isClaudeMan?'── CLAUDE CODE ──':'── VIM COMMANDS ──', px+6, py+14);
    const cmds = isClaudeMan ? [
      ['h/l',     'Move left/right'],
      ['k',       'Jump  (kk=2重ジャンプ)'],
      ['x',       'Code Shot {}'],
      ['ss',      '/think ATK×2 (4s)'],
      [':think',  'THINK MODE (ATK×2)'],
      [':add',    'AIドローン召喚'],
      [':print',  'テキストビーム'],
      [':bash',   'シェル爆発(全消去)'],
      [':fix',    'HP+10回復'],
      [':run',    '高速ダッシュ'],
      ['dd',      'DELETE (全敵消去)'],
      ['yy',      'YANK (HP回復)'],
      ['cc',      'CHANGE (大弾)'],
      [':wq',     'ステージクリア'],
    ] : [
      ['h/l',      'Move left/right'],
      ['k/Space',  'Jump'],
      ['kk',       'Double Jump!'],
      ['x',        'Shoot'],
      ['w/b',      'Dash forward/back'],
      ['dd',       'Nuke screen (DELETE)'],
      ['yy',       'Heal +HP (YANK)'],
      ['gg',       'Teleport to start'],
      ['cc',       'Big bullet (CHANGE)'],
      ['ZZ',       'Extra life / Shield'],
      ['u',        'Invincibility (UNDO)'],
      [':w',       'Write — +1 LIFE'],
      [':wq',      'Save+Quit — CLEAR!'],
      [':vs',      'Nuke — SPLIT'],
      [':skills',  'Equipment screen'],
    ];
    cmds.forEach(function(row,i) {
      ctx.fillStyle='#ffee44'; ctx.font='bold 9px monospace';
      ctx.fillText(row[0], px+6, py+28+i*12);
      ctx.fillStyle='#99aacc'; ctx.font='9px monospace';
      ctx.fillText(row[1], px+50, py+28+i*12);
    });
  }

  function drawHUD() {
    // HP bar (vertical, left side)
    const barH=100, barX=8, barY=(H-barH)/2-20;
    ctx.fillStyle='#88aaff'; ctx.font='bold 9px monospace'; ctx.textAlign='center';
    ctx.fillText('HP', barX+8, barY-6);
    ctx.fillStyle='#111'; ctx.fillRect(barX,barY,16,barH);
    ctx.strokeStyle='#334477'; ctx.lineWidth=1; ctx.strokeRect(barX,barY,16,barH);
    const pct=vm_player?vm_player.health/vm_player.maxHealth:0;
    const fillH=barH*pct;
    ctx.fillStyle=pct>0.5?'#00dd44':pct>0.25?'#ffaa00':'#ff2200';
    ctx.fillRect(barX+2, barY+barH-fillH, 12, fillH);
    // Charge bar (VISUAL mode)
    if (vimMode==='VISUAL') {
      const cx2=barX+20, cy2=barY;
      ctx.fillStyle='#111'; ctx.fillRect(cx2,cy2,8,barH);
      ctx.strokeStyle='#00ffff'; ctx.strokeRect(cx2,cy2,8,barH);
      const ch=barH*chargeLevel/100;
      ctx.fillStyle='hsl('+(180-chargeLevel*1.8)+',100%,60%)';
      ctx.fillRect(cx2+1, cy2+barH-ch, 6, ch);
    }
    // Boss HP bar (right side)
    if (vm_bossTriggered&&vm_boss&&!vm_boss.dead) {
      const bx=W-24;
      const bdef=BOSS_DEFS[vm_boss.type||0];
      ctx.fillStyle=bdef.color; ctx.font='bold 7px monospace'; ctx.textAlign='center';
      ctx.fillText('BOSS', bx+8, barY-6);
      ctx.fillStyle='#111'; ctx.fillRect(bx,barY,16,barH);
      ctx.strokeStyle='#774433'; ctx.strokeRect(bx,barY,16,barH);
      const bfH=barH*(vm_boss.health/vm_boss.maxHealth);
      ctx.fillStyle=vm_boss.phase===3?'#ff0000':vm_boss.phase===2?bdef.color2:bdef.color;
      ctx.fillRect(bx+2, barY+barH-bfH, 12, bfH);
      // Phase indicator
      ctx.fillStyle=vm_boss.phase===3?'#ff0000':vm_boss.phase===2?'#ffaa00':'#44ff88';
      ctx.font='bold 7px monospace'; ctx.textAlign='center';
      ctx.fillText('P'+vm_boss.phase, bx+8, barY+barH+10);
    }
    // Boss warning message
    if (bossWarnTimer > 0) {
      bossWarnTimer--;
      const alpha = Math.min(1, bossWarnTimer / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bossWarnMsg, W/2, H/2 - 40);
      ctx.globalAlpha = 1;
    }
    // Charge shot bar
    if (xHoldTimer > 0) {
      const chargePct = Math.min(1, xHoldTimer / 40);
      const barW = 80;
      const bx2 = W/2 - barW/2;
      const by3 = H - 50;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx2-2, by3-2, barW+4, 12);
      const col = chargePct >= 1 ? '#ffff00' : 'hsl('+(chargePct*60)+',100%,60%)';
      ctx.fillStyle = col;
      ctx.fillRect(bx2, by3, barW * chargePct, 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(chargePct >= 1 ? '★ CHARGE READY! ★' : 'CHARGE: ' + Math.floor(chargePct*100) + '%', W/2, by3 - 2);
    }
    // Combo display
    if (sComboCount > 0 && sComboTimer > 0) {
      ctx.fillStyle = sComboCount >= 2 ? '#ff4400' : '#ffcc00';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('COMBO: ' + sComboCount + (sComboCount >= 2 ? ' s=SLAM!!' : ' s=COMBO!'), 36, 56);
    }
    // Top bar
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(0,0,W,22);
    // Character icon + name in top-left
    const charDef = getCharDef();
    ctx.fillStyle=charDef.color||'#5599ff'; ctx.font='bold 9px monospace'; ctx.textAlign='left';
    ctx.fillText(charDef.name||'VimMan', 6, 14);
    ctx.fillStyle='#88aaff'; ctx.font='bold 11px monospace';
    ctx.fillText(' '+String(score).padStart(6,'0'), 60, 15);
    ctx.textAlign='right'; ctx.fillStyle='#aaffaa';
    ctx.fillText('LIFE:'+lives, W-8, 15);
    ctx.fillStyle='#ffdd44'; ctx.textAlign='center';
    ctx.fillText('XP:'+getVimXP(), W/2, 15);
    if (vm_bossTriggered&&vm_boss&&!vm_boss.dead) {
      const bdef=BOSS_DEFS[vm_boss.type||0];
      const lgtm=Math.floor(100-(vm_boss.health/vm_boss.maxHealth*100));
      ctx.fillStyle=vm_boss.phase===2?bdef.color2:bdef.color;
      ctx.fillText(bdef.name+' '+lgtm+'%'+(vm_boss.phase===2?' !!':''), W/2, 15);
    }
    // Equipment indicator (below top bar)
    if (window.SAVE) {
      const weq = window.SAVE.equip && window.SAVE.equip.weapon;
      const wdb = window.EQUIP_DB && window.EQUIP_DB.weapons;
      const witem = wdb && wdb.find(function(w){ return w.id===weq; });
      if (witem && witem.id !== 'fist') {
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,22,W,12);
        ctx.fillStyle='#ffaa44'; ctx.font='8px monospace'; ctx.textAlign='left';
        ctx.fillText('⚔ '+witem.name+(witem.melee?' [MELEE]':' [RANGED]')+' ATK+'+(witem.atk||0), 36, 31);
        const aeq = window.SAVE.equip.armor;
        const adb = window.EQUIP_DB && window.EQUIP_DB.armor;
        const aitem = adb && adb.find(function(a){ return a.id===aeq; });
        if (aitem && aitem.id !== 'none') {
          ctx.fillStyle='#88ccff';
          ctx.fillText('  🛡 '+aitem.name+' DEF+'+(aitem.def||0), 200, 31);
        }
      }
    }
    // VimXP cooldown indicators
    const cdY=H-70;
    const cdItems=[
      {label:'dd', cd:specialCD, max:getDDCool()},
      {label:'yy', cd:yankHealCD, max:120},
    ];
    cdItems.forEach(function(item,i) {
      const cx=W/2-40+i*60, cy=cdY;
      ctx.fillStyle='rgba(0,0,20,0.7)'; ctx.fillRect(cx,cy,50,14);
      ctx.fillStyle=item.cd>0?'#555577':'#44ff88';
      ctx.font='bold 9px monospace'; ctx.textAlign='left';
      ctx.fillText(item.label+':'+(item.cd>0?Math.ceil(item.cd/60*10)/10+'s':'RDY'), cx+3, cy+11);
    });
    // Stage indicator
    const def = currentStageDef || makeWorldStageDef(worldNum, stageInWorld);
    ctx.fillStyle=(def.color||'#44ff88')+'88'; ctx.font='9px monospace'; ctx.textAlign='left';
    ctx.fillText(def.name+' ['+def.diff+'] '+(def.isBoss?'⚡BOSS':''), 36, 28);

    // HOME button hint (top-right of HUD)
    ctx.fillStyle='rgba(20,30,60,0.8)'; ctx.fillRect(W-90, 0, 90, 22);
    ctx.fillStyle='#445577'; ctx.font='9px monospace'; ctx.textAlign='right';
    ctx.fillText('ESC=pause  :q=menu', W-4, 14);

    if (window.gameSettings && window.gameSettings.get('showHints') && !vm_bossTriggered) {
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,H-70,W,12);
      ctx.fillStyle='#334455'; ctx.font='9px monospace'; ctx.textAlign='center';
      ctx.fillText(':wq=ステージクリア  :w=セーブ  :skills=装備  :q=メニューへ', W/2, H-61);
    }

    drawKeyDisplay();
    drawCommandRef();
    drawVimStatusline();
  }

  // ── Pause menu ────────────────────────────────────────────
  const PAUSE_ITEMS = ['Resume', 'Equipment/Skills', 'Toggle Cmd Panel', 'Toggle Input Disp', 'Back to Menu'];
  function drawPauseMenu() {
    ctx.globalAlpha=0.7; ctx.fillStyle='#000011'; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1;
    ctx.save(); ctx.shadowColor='#ffffff'; ctx.shadowBlur=16;
    ctx.fillStyle='#ffffff'; ctx.font='bold 22px monospace'; ctx.textAlign='center';
    ctx.fillText('── PAUSED ──', W/2, 80); ctx.restore();
    ctx.fillStyle='#888899'; ctx.font='11px monospace'; ctx.textAlign='center';
    ctx.fillText('VimXP: '+getVimXP()+'  LOC: '+String(score).padStart(7,'0'), W/2, 104);
    PAUSE_ITEMS.forEach(function(item, i) {
      const y=140+i*52;
      const sel=(pauseCursor===i);
      ctx.fillStyle=sel?'rgba(40,80,140,0.6)':'rgba(10,10,40,0.4)';
      ctx.fillRect(100, y, 312, 40);
      if (sel) { ctx.strokeStyle='#5599ff'; ctx.lineWidth=1; ctx.strokeRect(100,y,312,40); }
      ctx.fillStyle=sel?'#ffffff':'#667788';
      ctx.font=sel?'bold 14px monospace':'13px monospace'; ctx.textAlign='center';
      // Show toggle state
      let label=item;
      if (item==='Toggle Cmd Panel')  label='Cmd Panel: ['+(window.gameSettings&&window.gameSettings.get('showCmdPanel')?'ON ':'OFF')+']';
      if (item==='Toggle Input Disp') label='Input Disp: ['+(window.gameSettings&&window.gameSettings.get('showInputDisp')?'ON ':'OFF')+']';
      ctx.fillText((sel?'▶ ':' ')+label, W/2, y+25);
    });
    ctx.fillStyle='#334455'; ctx.font='10px monospace'; ctx.textAlign='center';
    ctx.fillText('j/k: Navigate   Enter: Select   Esc: Resume', W/2, H-30);
    drawVimStatusline();
  }

  function updatePauseMenu() {
    if (justPressed('KeyJ')||justPressed('ArrowDown')) pauseCursor=(pauseCursor+1)%PAUSE_ITEMS.length;
    if (justPressed('KeyK')||justPressed('ArrowUp'))   pauseCursor=(pauseCursor-1+PAUSE_ITEMS.length)%PAUSE_ITEMS.length;
    if (justPressed('Escape')) { state='gameplay'; return; }
    if (isEnter()||justPressed('KeyL')) {
      const item=PAUSE_ITEMS[pauseCursor];
      if (item==='Resume')            { state='gameplay'; }
      else if (item==='Equipment/Skills') { state='equipment'; }
      else if (item==='Toggle Cmd Panel') {
        if (window.gameSettings) window.gameSettings.set('showCmdPanel', !window.gameSettings.get('showCmdPanel'));
      }
      else if (item==='Toggle Input Disp') {
        if (window.gameSettings) window.gameSettings.set('showInputDisp', !window.gameSettings.get('showInputDisp'));
      }
      else if (item==='Back to Menu') { saveProgress(); state='worldselect'; }
    }
  }

  // ── World Select screen ────────────────────────────────────
  function drawWorldSelect() {
    ctx.globalAlpha=1;
    const grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#000022'); grad.addColorStop(1,'#000044');
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
    STARS.forEach(function(s) {
      ctx.fillStyle='#ffffff'; ctx.globalAlpha=0.4+0.3*Math.sin(Date.now()*0.001+s.x);
      ctx.fillRect(s.x,s.y,s.r,s.r);
    });
    ctx.globalAlpha=1;

    // Title
    ctx.save(); ctx.shadowColor='#5599ff'; ctx.shadowBlur=20;
    ctx.fillStyle='#5599ff'; ctx.font='bold 26px monospace'; ctx.textAlign='center';
    ctx.fillText('VimMan RPG', W/2, 30); ctx.restore();
    ctx.fillStyle='#88aacc'; ctx.font='10px monospace'; ctx.textAlign='center';
    ctx.fillText('バグの帝王「NULL DRAGON」を倒し、VIM MASTERへの道を開け！', W/2, 48);

    // Player stats
    const clearedCount = window.SAVE ? Object.keys(window.SAVE.clearedWorlds||{}).length : 0;
    const lv = window.SAVE ? window.SAVE.level : 1;
    ctx.fillStyle='#ffdd44'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
    ctx.fillText('Lv.'+lv+'  VimXP:'+getVimXP()+'  ワールド制覇:'+clearedCount+'/50  Commands:'+
      (window.countUnlockedCmds?window.countUnlockedCmds():0)+'/'+(window.VIM_CMD_DB?window.VIM_CMD_DB.length:0),
      W/2, 64);

    // World grid: 10 worlds visible, scroll
    const maxWorld = window.SAVE ? Math.min(window.SAVE.currentWorld, 50) : 1;
    const visibleCount = 8;
    const scrollOffset = worldSelectScroll;
    const worldsToShow = [];
    for (let w = 1; w <= 50; w++) worldsToShow.push(w);
    const visible = worldsToShow.slice(scrollOffset, scrollOffset + visibleCount);

    const rowH = 50;
    visible.forEach(function(wid, vi) {
      const y = 76 + vi * rowH;
      const world = window.WORLD_DEFS ? window.WORLD_DEFS[wid - 1] : null;
      const isCleared = window.SAVE && window.SAVE.clearedWorlds[wid];
      const isLocked = wid > maxWorld;
      const isSel = (worldSelectCursor === scrollOffset + vi);
      const color = world ? world.diffColor : '#445566';

      ctx.fillStyle = isSel ? 'rgba(40,80,160,0.7)' : (isLocked ? 'rgba(5,5,20,0.4)' : 'rgba(10,20,50,0.5)');
      ctx.fillRect(8, y, W - 16, rowH - 4);
      if (isSel) {
        ctx.strokeStyle = isLocked ? '#334455' : color;
        ctx.lineWidth = 1;
        ctx.strokeRect(8, y, W - 16, rowH - 4);
      }

      // World number + name
      ctx.fillStyle = isLocked ? '#334455' : (isSel ? color : color + '99');
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      const lockIcon = isLocked ? '🔒' : (isCleared ? '✓' : '▶');
      const wname = world ? world.name : 'World '+wid;
      ctx.fillText(lockIcon+' W'+wid+' '+wname, 18, y + 17);

      if (!isLocked && world) {
        ctx.fillStyle = '#556677';
        ctx.font = '9px monospace';
        ctx.fillText('ボス: '+world.bossName+'  Stages: '+world.stageCount+'  難易度: Tier '+world.diffTier, 18, y + 30);
        // Reward preview
        const cmdR = window.VIM_CMD_DB ? window.VIM_CMD_DB.find(function(c){ return c.unlockWorld===wid; }) : null;
        if (cmdR) {
          const isUnlocked = window.SAVE && window.SAVE.unlockedCmds[cmdR.id];
          ctx.fillStyle = isUnlocked ? '#44ff88' : '#445566';
          ctx.font = '9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText((isUnlocked?'🔓':'🔒')+' '+cmdR.cmd, W - 12, y + 17);
        }
      }
    });

    // Scroll indicator
    if (50 > visibleCount) {
      ctx.fillStyle = '#223344';
      ctx.fillRect(W - 6, 76, 4, visibleCount * rowH);
      const thumbH = Math.max(16, (visibleCount / 50) * visibleCount * rowH);
      const thumbY = 76 + (scrollOffset / (50 - visibleCount)) * (visibleCount * rowH - thumbH);
      ctx.fillStyle = '#445577';
      ctx.fillRect(W - 6, thumbY, 4, thumbH);
    }

    ctx.fillStyle = '#445566'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('j/k: ワールド選択  Enter: ステージ選択  Esc: ホームへ  s: スキル画面', W/2, H-20);
    drawVimStatusline();
  }

  // ── Stage Select (within a world) ─────────────────────────
  function drawStageSelect() {
    ctx.globalAlpha=1;
    ctx.fillStyle='#000022'; ctx.fillRect(0,0,W,H);
    STARS.forEach(function(s) {
      ctx.fillStyle='#ffffff'; ctx.globalAlpha=0.3+0.2*Math.sin(Date.now()*0.001+s.x);
      ctx.fillRect(s.x,s.y,s.r,s.r);
    });
    ctx.globalAlpha=1;

    const world = window.WORLD_DEFS ? window.WORLD_DEFS[worldNum - 1] : null;
    const wname = world ? world.name : 'World '+worldNum;
    const color = world ? world.diffColor : '#44ff88';

    ctx.save(); ctx.shadowColor=color; ctx.shadowBlur=16;
    ctx.fillStyle=color; ctx.font='bold 20px monospace'; ctx.textAlign='center';
    ctx.fillText('World '+worldNum+': '+wname, W/2, 30); ctx.restore();
    ctx.fillStyle='#aaaacc'; ctx.font='11px monospace'; ctx.textAlign='center';
    ctx.fillText('Boss: '+(world?world.bossName:'???'), W/2, 50);

    const stageCount = world ? world.stageCount : 3;
    for (let sid = 1; sid <= stageCount; sid++) {
      const y = 62 + (sid - 1) * 58;
      const def = makeWorldStageDef(worldNum, sid);
      const isSel = (selectCursor === sid - 1);
      const isCleared = window.SAVE && window.SAVE.clearedStages[worldNum+'-'+sid];
      const isLocked = (sid > 1 && !(window.SAVE && window.SAVE.clearedStages[worldNum+'-'+(sid-1)]));

      ctx.fillStyle = isSel ? 'rgba(40,80,160,0.7)' : (isLocked ? 'rgba(5,5,20,0.5)' : 'rgba(10,20,50,0.5)');
      ctx.fillRect(10, y, W - 20, 52);
      if (isSel) {
        ctx.strokeStyle = def.isBoss ? '#ff4444' : color;
        ctx.lineWidth = 1;
        ctx.strokeRect(10, y, W - 20, 52);
      }

      // Stage name
      const stageIcon = isLocked ? '🔒' : (isCleared ? '✓' : (isSel ? '►' : '•'));
      ctx.fillStyle = isLocked ? '#334455' : (isSel ? (def.isBoss ? '#ff8844' : color) : color + '99');
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      const stageLabel = 'Stage ' + worldNum + '-' + sid + (def.isBoss ? '  ⚡BOSS: '+def.bossName : '');
      ctx.fillText(stageIcon + ' ' + stageLabel, 20, y + 18);

      if (!isLocked) {
        ctx.fillStyle = '#667788';
        ctx.font = '9px monospace';
        ctx.fillText('敵: Mets×'+def.mets.length+' Bees×'+def.bees.length+' Tanks×'+def.tanks.length+'  速度:'+def.spd.toFixed(1)+'x', 20, y + 32);
        if (def.isBoss) {
          const cmdR = window.VIM_CMD_DB ? window.VIM_CMD_DB.find(function(c){ return c.unlockWorld===worldNum; }) : null;
          if (cmdR) {
            const isUnlocked = window.SAVE && window.SAVE.unlockedCmds[cmdR.id];
            ctx.fillStyle = isUnlocked ? '#44ff88' : '#ffaa44';
            ctx.font = '9px monospace';
            ctx.fillText('報酬: '+(isUnlocked?'🔓':'🔒')+' '+cmdR.cmd+' 「'+cmdR.desc+'」', 20, y + 44);
          }
        }
        ctx.fillStyle = isSel ? '#aaaaff' : '#334455';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(isSel ? '▶ PLAY' : '', W - 16, y + 28);
      }
    }

    ctx.fillStyle='#445566'; ctx.font='10px monospace'; ctx.textAlign='center';
    ctx.fillText('j/k: ステージ選択  Enter: プレイ  h/Esc: ワールド選択', W/2, H - 20);
    drawVimStatusline();
  }

  // ── Equipment/Skills screen ───────────────────────────────
  function drawEquipmentScreen() {
    ctx.globalAlpha=1;
    ctx.fillStyle='#000011'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.shadowColor='#ffdd44'; ctx.shadowBlur=16;
    ctx.fillStyle='#ffdd44'; ctx.font='bold 20px monospace'; ctx.textAlign='center';
    ctx.fillText('── EQUIPMENT / SKILLS ──', W/2, 28); ctx.restore();
    ctx.fillStyle='#88aaff'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
    ctx.fillText('VimXP: '+getVimXP(), W/2, 46);

    SKILLS.forEach(function(sk,i) {
      const y=60+i*48;
      const lv=skillLv(sk.id);
      const sel=(equipCursor===i);
      const canUp=(lv<sk.maxLv && getVimXP()>=sk.cost);
      ctx.fillStyle=sel?'rgba(40,80,140,0.6)':'rgba(10,10,40,0.4)';
      ctx.fillRect(20,y,472,42);
      if (sel) { ctx.strokeStyle=canUp?'#ffdd44':'#555577'; ctx.lineWidth=1; ctx.strokeRect(20,y,472,42); }
      // Level dots
      ctx.fillStyle='#334455'; ctx.font='bold 11px monospace'; ctx.textAlign='left';
      let lvStr='';
      for (let l=0;l<sk.maxLv;l++) lvStr+=l<lv?'●':'○';
      ctx.fillStyle=lv>0?'#44ff88':'#666688';
      ctx.fillText(sk.name+' '+lvStr, 34, y+16);
      ctx.fillStyle='#9999bb'; ctx.font='10px monospace';
      ctx.fillText(sk.desc, 34, y+32);
      ctx.fillStyle='#ffdd44'; ctx.textAlign='right';
      if (lv<sk.maxLv) {
        ctx.fillStyle=canUp?'#ffdd44':'#555566';
        ctx.fillText('Cost: '+sk.cost+' XP  (have:'+getVimXP()+')', W-30, y+16);
        ctx.fillStyle='#aaaacc'; ctx.font='9px monospace';
        ctx.fillText(lv===0?'[Lv.0]':'Lv '+lv+'/'+sk.maxLv, W-30, y+30);
      } else {
        ctx.fillStyle='#44ff88';
        ctx.fillText('MAX', W-30, y+22);
      }
    });
    ctx.fillStyle='#445566'; ctx.font='11px monospace'; ctx.textAlign='center';
    ctx.fillText('j/k: Navigate   Enter/x: Upgrade   Esc: Back', W/2, H-36);
    drawVimStatusline();
  }

  // ── Stage intro ───────────────────────────────────────────
  function drawStageIntro() {
    const def = currentStageDef || makeWorldStageDef(worldNum, stageInWorld);
    const t=120-stageIntroTimer;
    const vis=Math.floor(t/8);
    const lines=[
      '$ git checkout -b feature/world-'+worldNum+'-stage-'+stageInWorld,
      "Switched to new branch 'W"+worldNum+"-S"+stageInWorld+"'",
      '','$ vim '+def.worldName+'.c','',
      '  1  // World: '+worldNum+' '+def.worldName+(def.isBoss?' ⚡BOSS STAGE':''),
      '  2  // Enemies: Mets×'+def.mets.length+' Bees×'+def.bees.length+' Tanks×'+def.tanks.length,
      '  3  // Difficulty: '+def.diff+'  Speed: '+def.spd.toFixed(1)+'x',
      def.isBoss?'  4  // ⚡ BOSS: '+def.bossName+' HP×'+def.bossHPMul.toFixed(1):'  4  // (Boss in next stage)',
      '','-- NORMAL --     :help for commands   :wq=clear   :q=menu',
    ];
    ctx.font='bold 12px monospace'; ctx.textAlign='left';
    lines.slice(0,vis).forEach(function(l,i) {
      ctx.fillStyle=l.startsWith('$')?'#ffee44':l.includes('//')?'#ff8844':l.startsWith('--')?'#5588ff':'#aaffaa';
      ctx.fillText(l, 24, 100+i*20);
    });
    if (t>lines.length*8+10) {
      ctx.fillStyle='#ffffff'; ctx.font='bold 28px monospace'; ctx.textAlign='center';
      ctx.fillText('── START ──', W/2, H-60);
    }
  }

  // ── Game over / Stage clear ────────────────────────────────
  function drawGameOver() {
    ctx.globalAlpha=1; ctx.fillStyle='#000000'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.shadowColor='#ff0000'; ctx.shadowBlur=24;
    ctx.fillStyle='#ff2200'; ctx.font='bold 36px monospace'; ctx.textAlign='center';
    ctx.fillText('Segmentation fault', W/2, H/2-50); ctx.restore();
    ctx.fillStyle='#ff6644'; ctx.font='bold 18px monospace'; ctx.textAlign='center';
    ctx.fillText('(core dumped)', W/2, H/2-14);
    ctx.fillStyle='#888888'; ctx.font='12px monospace';
    ctx.fillText('LOC committed: '+String(score).padStart(7,'0'), W/2, H/2+20);
    ctx.fillText('VimXP total: '+getVimXP(), W/2, H/2+38);
    blinkTimer++;
    if (Math.floor(blinkTimer/30)%2===0) {
      ctx.fillStyle='#ffaa44'; ctx.font='bold 13px monospace'; ctx.textAlign='center';
      ctx.fillText('Enter: retry   Esc: menu', W/2, H-24);
    }
  }

  function drawStageClear() {
    ctx.globalAlpha=1; ctx.fillStyle='#000011'; ctx.fillRect(0,0,W,H);
    const def = currentStageDef || makeWorldStageDef(worldNum, stageInWorld);
    const isBossStage = def.isBoss;
    ctx.save(); ctx.shadowColor=isBossStage?'#ffaa00':'#44ff88'; ctx.shadowBlur=24;
    ctx.fillStyle=isBossStage?'#ffdd44':'#44ff88'; ctx.font='bold 28px monospace'; ctx.textAlign='center';
    ctx.fillText(isBossStage?'⚡ BOSS 撃破！':'PR MERGED! ✓', W/2, 44); ctx.restore();
    ctx.fillStyle='#aaaacc'; ctx.font='12px monospace'; ctx.textAlign='center';
    ctx.fillText('World '+worldNum+'-'+stageInWorld+'  '+def.worldName, W/2, 66);

    const bonusXP = 5 + worldNum * 2 + (isBossStage ? worldNum * 3 : 0);
    const lines=[
      '$ git push origin W'+worldNum+'-S'+stageInWorld,
      '$ gh pr merge --squash',
      '✓  PR merged  ✓  Branch deleted','',
      'LOC committed:  '+String(score).padStart(7,'0'),
      'LIFE remaining: '+lives,
      'VimXP earned:   +'+bonusXP+(isBossStage?' (BOSS BONUS!)':''),
    ];
    ctx.font='11px monospace'; ctx.textAlign='left';
    lines.forEach(function(l,i) {
      ctx.fillStyle=l.startsWith('$')?'#ffee44':l.startsWith('✓')?'#44ff88':l.startsWith('BOSS')?'#ffaa00':'#aaaacc';
      ctx.fillText(l, 40, 100+i*18);
    });

    if (isBossStage && rewardData) {
      ctx.fillStyle='#ffdd44'; ctx.font='bold 13px monospace'; ctx.textAlign='center';
      ctx.fillText('── ボス報酬 ──', W/2, 232);
      if (rewardData.cmd) {
        ctx.fillStyle='#44ff88'; ctx.font='bold 12px monospace';
        ctx.fillText('🔓 コマンド習得: '+rewardData.cmd.cmd+' 「'+rewardData.cmd.desc+'」', W/2, 252);
      }
      if (rewardData.equip) {
        ctx.fillStyle='#ffaa44'; ctx.font='bold 12px monospace';
        ctx.fillText('🎁 装備入手: '+rewardData.equip.item.name+' ('+rewardData.equip.item.desc+')', W/2, 272);
      }
    }

    blinkTimer++;
    if (Math.floor(blinkTimer/30)%2===0) {
      ctx.fillStyle='#ffffff'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
      ctx.fillText('Enter: '+(isBossStage?'次のワールドへ':'次のステージへ')+'   Esc: ワールド選択', W/2, H-18);
    }
  }

  // ── Boss reward screen ────────────────────────────────────
  function drawRewardScreen() {
    ctx.globalAlpha=1;
    ctx.fillStyle='#000008'; ctx.fillRect(0,0,W,H);
    // Animated glow
    const t = Date.now() * 0.002;
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.1 * Math.sin(t);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save(); ctx.shadowColor='#ffaa00'; ctx.shadowBlur=30;
    ctx.fillStyle='#ffdd44'; ctx.font='bold 28px monospace'; ctx.textAlign='center';
    ctx.fillText('⚡ ボス撃破！', W/2, 60); ctx.restore();

    // Boss defeat story text
    const storyDb = window.GAME_STORY && window.GAME_STORY.bossDefeat;
    const bossTypeNow = currentStageDef ? (currentStageDef._bossType||0) : 0;
    const defeatMsg = storyDb ? (storyDb[bossTypeNow] || storyDb[0]) : '';
    if (defeatMsg) {
      ctx.fillStyle='rgba(40,10,0,0.7)'; ctx.fillRect(10,64,W-20,44);
      ctx.strokeStyle='#ff8844'; ctx.lineWidth=1; ctx.strokeRect(10,64,W-20,44);
      ctx.fillStyle='#ffcc88'; ctx.font='10px monospace'; ctx.textAlign='center';
      const lines=defeatMsg.split('\n');
      lines.forEach(function(l,i){ ctx.fillText(l,W/2,78+i*14); });
    }
    // World story milestone
    const worldStoryDb = window.GAME_STORY && window.GAME_STORY.worldStory;
    const milestoneText = worldStoryDb && (worldStoryDb[worldNum] || '');

    if (rewardData) {
      ctx.fillStyle='#ff8844'; ctx.font='bold 14px monospace'; ctx.textAlign='center';
      ctx.fillText('World '+worldNum+' ボス: '+(window.WORLD_DEFS?window.WORLD_DEFS[worldNum-1].bossName:'???')+' 撃破！', W/2, milestoneText?118:90);

      // Milestone story text
      if (milestoneText) {
        ctx.fillStyle='rgba(0,20,40,0.8)'; ctx.fillRect(10,132,W-20,36);
        ctx.strokeStyle='#44aaff'; ctx.lineWidth=1; ctx.strokeRect(10,132,W-20,36);
        ctx.fillStyle='#88ccff'; ctx.font='9px monospace'; ctx.textAlign='center';
        ctx.fillText(milestoneText, W/2, 144); ctx.fillText('── Story milestone ──', W/2, 160);
      }
      // Command reward
      if (rewardData.cmd) {
        ctx.fillStyle='rgba(0,40,0,0.7)';
        ctx.fillRect(20, milestoneText?178:110, W-40, 80);
        ctx.strokeStyle='#44ff88'; ctx.lineWidth=2;
        ctx.strokeRect(20, 110, W-40, 80);
        ctx.fillStyle='#44ff88'; ctx.font='bold 13px monospace'; ctx.textAlign='center';
        ctx.fillText('🔓 コマンド習得！', W/2, 132);
        ctx.fillStyle='#ffee44'; ctx.font='bold 22px monospace';
        ctx.fillText(rewardData.cmd.cmd, W/2, 162);
        ctx.fillStyle='#88ccaa'; ctx.font='11px monospace';
        ctx.fillText(rewardData.cmd.desc+' ['+rewardData.cmd.cat+']', W/2, 182);
      }

      // Equipment reward
      if (rewardData.equip) {
        const ey = rewardData.cmd ? 210 : 130;
        ctx.fillStyle='rgba(40,20,0,0.7)';
        ctx.fillRect(20, ey, W-40, 80);
        ctx.strokeStyle='#ffaa44'; ctx.lineWidth=2;
        ctx.strokeRect(20, ey, W-40, 80);
        ctx.fillStyle='#ffaa44'; ctx.font='bold 13px monospace'; ctx.textAlign='center';
        ctx.fillText('🎁 装備入手！', W/2, ey+22);
        ctx.fillStyle='#ffdd88'; ctx.font='bold 18px monospace';
        ctx.fillText(rewardData.equip.item.name, W/2, ey+50);
        ctx.fillStyle='#aa8866'; ctx.font='11px monospace';
        ctx.fillText(rewardData.equip.item.desc, W/2, ey+68);
      }

      if (!rewardData.cmd && !rewardData.equip) {
        ctx.fillStyle='#556677'; ctx.font='12px monospace'; ctx.textAlign='center';
        ctx.fillText('(このワールドは既にクリア済みです)', W/2, 200);
      }
    }

    blinkTimer++;
    if (Math.floor(blinkTimer/30)%2===0) {
      ctx.fillStyle='#ffffff'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
      ctx.fillText('Enter: 次のワールドへ   Esc: ワールド選択', W/2, H-18);
    }
    drawVimStatusline();
  }

  // ── Gameplay update ───────────────────────────────────────
  function updateGameplay() {
    if (stageIntroTimer>0) { stageIntroTimer--; return; }
    if (specialCD>0) specialCD--;
    if (undoActive>0) undoActive--;
    if (yankHealCD>0) yankHealCD--;
    if (shieldActive>0) shieldActive--;
    if (charSpecialCD>0) charSpecialCD--;
    if (charSpecialActive>0) charSpecialActive--;
    if (sComboTimer>0) {
      sComboTimer--;
      if (sComboTimer<=0) sComboCount=0;
    }
    // dd laser damage
    if (ddLaserTimer > 0) {
      ddLaserTimer--;
      if (ddLaserTimer % 5 === 0 && vm_player && !vm_player.dead) {
        const laserDmg = Math.max(1, getBulletDmg() * 0.8);
        const laserYc  = vm_player.y + vm_player.h/2;
        const laserX0  = vm_player.x + (ddLaserDir > 0 ? vm_player.w : 0);
        vm_enemies.forEach(function(e) {
          if (e.dead) return;
          const inX = ddLaserDir > 0
            ? (e.x+e.w > laserX0 && e.x < laserX0 + 800)
            : (e.x+e.w > laserX0 - 800 && e.x < laserX0);
          if (inX && e.y+e.h > laserYc - 8 && e.y < laserYc + 8) {
            e.takeDamage(laserDmg);
            spawnExplosion(e.x+e.w/2, e.y+e.h/2, 2, '#ff4444');
            addVimXP(1);
          }
        });
        if (vm_boss && !vm_boss.dead) {
          const inBX = ddLaserDir > 0
            ? (vm_boss.x+vm_boss.w > laserX0)
            : (vm_boss.x < laserX0);
          if (inBX && vm_boss.y+vm_boss.h > laserYc-8 && vm_boss.y < laserYc+8) {
            vm_boss.takeDamage(laserDmg);
          }
        }
      }
    }

    // Update moving platforms
    movingPlatforms.forEach(function(p) {
      p.x += p.vx;
      if (p.x <= p.minX || p.x + p.w >= p.maxX) p.vx = -p.vx;
      if (vm_player && !vm_player.dead) {
        const onPlat = vm_player.x + vm_player.w > p.x && vm_player.x < p.x + p.w &&
                       Math.abs((vm_player.y + vm_player.h) - p.y) < 6;
        if (onPlat) {
          vm_player.x += p.vx;
          vm_player.onGround = true;
        }
      }
    });

    vm_player.update();
    updateCamera();

    vm_bullets.forEach(function(b) { b.update(); });
    vm_bullets=vm_bullets.filter(function(b) { return !b.dead; });

    vm_enemies.forEach(function(e) {
      if (e instanceof Bee||e instanceof Tank||e instanceof SegClone) e.update(vm_player,vm_bullets);
      else e.update(vm_player);
    });

    if (vm_player.isShooting&&!vm_player.dead) {
      const bx=vm_player.facing===1?vm_player.x+vm_player.w:vm_player.x-8;
      const cid=vm_player.charId||'vimman';
      if (cid==='mage') {
        // Mage: large slow magic orb, 3x damage
        const orb=new Bullet(bx,vm_player.y+10,vm_player.facing*BULLET_SPEED*0.55,0,true);
        orb.w=14; orb.h=14; orb.isMagic=true; orb.dmgMul=3;
        vm_bullets.push(orb);
      } else if (cid==='archer') {
        // Archer: fast thin arrow, pierce up to 2 enemies
        const arr=new Bullet(bx,vm_player.y+14,vm_player.facing*BULLET_SPEED*1.3,0,true);
        arr.w=16; arr.h=4; arr.isPierce=true; arr.pierceLeft=2;
        vm_bullets.push(arr);
      } else if (cid==='warrior') {
        // Warrior: x key = melee punch (short range shockwave)
        if (swordSlashTimer <= 0) {
          swordSlashTimer = 18;
          const dmgW = getMeleeDmg() * 0.5;
          const hitXW = vm_player.facing > 0 ? vm_player.x + vm_player.w : vm_player.x - 36;
          vm_enemies.forEach(function(e) {
            if (!e.dead && e.x+e.w > hitXW && e.x < hitXW+36) {
              e.takeDamage(dmgW);
              spawnExplosion(e.x+e.w/2, e.y+e.h/2, 3, '#ffaa00');
            }
          });
          if (vm_boss && !vm_boss.dead && vm_boss.x+vm_boss.w > hitXW && vm_boss.x < hitXW+36) {
            vm_boss.takeDamage(dmgW);
          }
        }
      } else if (cid==='swordsman') {
        // Swordsman: x key = mini slash wave (travels forward)
        const sw = new Bullet(bx, vm_player.y+10, vm_player.facing*BULLET_SPEED*0.8, 0, true);
        sw.w=18; sw.h=10; sw.isSlash=true; sw.dmgMul=1.5; sw.isPierce=true; sw.pierceLeft=2;
        vm_bullets.push(sw);
      } else if (cid==='claudeman') {
        // ClaudeMan: code-fragment bullet (orange glow, claude-themed)
        const cb=new Bullet(bx,vm_player.y+12,vm_player.facing*BULLET_SPEED*1.1,0,true);
        cb.w=10; cb.h=8; cb.isCode=true; cb.dmgMul=1;
        vm_bullets.push(cb);
      } else {
        vm_bullets.push(new Bullet(bx, vm_player.y+12, vm_player.facing*BULLET_SPEED, 0, true));
      }
    }

    // Charge shot tracking
    if (isShoot()) {
      xHoldTimer++;
    } else {
      if (xHoldTimer >= 40 && !vm_player.dead) {
        fireChargeShot();
      }
      xHoldTimer = 0;
    }

    // Mage familiar auto-shoots at nearest enemy
    if (charSpecialActive > 0 && vm_player && vm_player.charId === 'mage') {
      familiarShootTimer--;
      if (familiarShootTimer <= 0) {
        familiarShootTimer = 35;
        let target = null, minDist = 350;
        vm_enemies.forEach(function(e) {
          if (e.dead) return;
          const d = Math.abs(e.x - vm_player.x) + Math.abs(e.y - vm_player.y);
          if (d < minDist) { minDist = d; target = e; }
        });
        if (!target && vm_boss && !vm_boss.dead) target = vm_boss;
        if (target) {
          const dx2 = (target.x+target.w/2) - (vm_player.x+vm_player.w/2);
          const dy2 = (target.y+target.h/2) - (vm_player.y+vm_player.h/2);
          const d2 = Math.sqrt(dx2*dx2+dy2*dy2)||1;
          const o = new Bullet(vm_player.x+vm_player.w/2, vm_player.y, dx2/d2*BULLET_SPEED*0.9, dy2/d2*BULLET_SPEED*0.9, true);
          o.w=8; o.h=8; o.isMagic=true; o.dmgMul=2;
          vm_bullets.push(o);
        }
      }
    }

    if (!vm_bossTriggered&&vm_player.x>(BOSS_ARENA_START-2)*TILE) {
      vm_bossTriggered=true;
      const btDef = BOSS_DEFS[vm_boss ? (vm_boss.type||0) : 0];
      addFlash('BOSS: ' + (btDef ? btDef.name : 'UNKNOWN') + ' が現れた！');
    }
    if (vm_bossTriggered&&vm_boss&&!vm_boss.dead) {
      vm_boss.update(vm_player,vm_bullets);
    } else if (vm_bossTriggered&&vm_boss&&vm_boss.dead) {
      vm_boss.deathTimer--;
    }

    // Stage gimmick effects
    if (stageGimmick === 'lava') {
      gimmickTimer++;
      if (gimmickTimer % 180 === 90) {
        const fireX = vm_player ? vm_player.x : 0;
        for (let i = 0; i < 5; i++) {
          vm_bullets.push(Object.assign(new Bullet(fireX + (i-2)*20, 14*TILE, 0, -6, false), { isLava: true }));
        }
        addFlash('🔥 溶岩噴出！');
        screenFlash = 4;
      }
    }
    if (stageGimmick === 'windy' && vm_player) {
      vm_player.vx += 0.15 * (1 + (currentStageDef ? (currentStageDef.worldId || 1) * 0.03 : 0));
    }

    if (!vm_player.dead) {
      if (vm_player.y>ROWS*TILE) vm_player.takeDamage(10);
      // Hazard tile (spike) collision
      if (vm_player.onGround) {
        const pCol = Math.floor((vm_player.x + vm_player.w/2) / TILE);
        const pRow = Math.floor((vm_player.y + vm_player.h) / TILE);
        if (pRow >= 0 && pRow < ROWS && pCol >= 0 && pCol < COLS && VM_MAP[pRow] && VM_MAP[pRow][pCol] === 2) {
          vm_player.takeDamage(2);
          vm_player.vy = PLAYER_JUMP * 0.5;
          addFlash('⚠ スパイク！');
        }
      }
      for (let i=vm_bullets.length-1;i>=0;i--) {
        const b=vm_bullets[i];
        if (!b.fromPlayer&&overlaps(b,vm_player)) {
          // ClaudeMan AI passive: 20% chance to auto-dodge (reflect) incoming bullets
          if (vm_player.charId==='claudeman' && Math.random()<0.20) {
            b.fromPlayer=true; b.vx=-b.vx; b.vy=-b.vy;
            addFlash('🤖 AI DODGE!');
          } else {
            vm_player.takeDamage(2); b.dead=true;
          }
        }
      }
      vm_enemies.forEach(function(e) {
        if (!e.dead&&overlaps(e,vm_player)) vm_player.takeDamage(3);
      });
      if (vm_bossTriggered&&vm_boss&&!vm_boss.dead&&overlaps(vm_boss,vm_player)) vm_player.takeDamage(4);
    }

    for (let i=vm_bullets.length-1;i>=0;i--) {
      const b=vm_bullets[i];
      if (!b.fromPlayer) continue;
      const dmg=getBulletDmg()*(b.isBig?3:1)*(b.dmgMul||1);
      vm_enemies.forEach(function(e) {
        if (!e.dead&&!b.dead&&overlaps(b,e)) {
          e.takeDamage(dmg); score+=100; addVimXP(1);
          if (b.isPierce) { b.pierceLeft=(b.pierceLeft||0)-1; if(b.pierceLeft<=0) b.dead=true; }
          else if (!b.isBig) b.dead=true;
        }
      });
      if (vm_bossTriggered&&vm_boss&&!vm_boss.dead&&!b.dead&&overlaps(b,vm_boss)) {
        vm_boss.takeDamage(dmg); b.dead=true; score+=50; addVimXP(1);
        spawnExplosion(b.x,b.y,3);
      }
    }

    updateParticles();

    if (vm_bossTriggered&&vm_boss&&vm_boss.dead&&vm_boss.deathTimer<=0) {
      const def = currentStageDef || makeWorldStageDef(worldNum, stageInWorld);
      const bonusXP = 5 + worldNum * 2 + (def.isBoss ? worldNum * 3 : 0);
      addVimXP(bonusXP);
      // Mark stage cleared
      if (window.SAVE) {
        window.SAVE.clearedStages[worldNum+'-'+stageInWorld] = true;
      }
      // Boss reward
      if (def.isBoss && window.unlockWorldRewards) {
        rewardData = window.unlockWorldRewards(worldNum);
      } else {
        rewardData = null;
      }
      saveProgress();
      score+=5000;
      state='stageclear'; blinkTimer=0;
    }
    if (vm_player.dead&&vm_player.deathTimer<=0) {
      lives--;
      if (lives<=0) { state='gameover'; blinkTimer=0; }
      else { initStage(); state='stageintro'; }
    }
  }

  function drawGameplay() {
    ctx.globalAlpha=1;
    drawBackground();
    ctx.save();
    ctx.translate(-vm_cameraX, 0);
    drawTiles();
    // Draw spike tiles
    for (let r = 0; r < ROWS; r++) {
      for (let c = Math.max(0,Math.floor(vm_cameraX/TILE)); c < Math.min(COLS, Math.ceil((vm_cameraX+512)/TILE)); c++) {
        if (VM_MAP[r] && VM_MAP[r][c] === 2) {
          const wx = c*TILE, wy = r*TILE;
          ctx.fillStyle = '#555555';
          ctx.fillRect(wx, wy+TILE-6, TILE, 6);
          ctx.fillStyle = '#ff2200';
          for (let si=0;si<4;si++) ctx.fillRect(wx+4+si*8, wy+TILE-12, 4, 6);
        }
      }
    }
    // Draw moving platforms
    movingPlatforms.forEach(function(p) {
      ctx.fillStyle = '#ffcc44';
      ctx.fillRect(p.x, p.y, p.w, TILE/2);
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(p.x, p.y, p.w, 4);
    });
    vm_enemies.forEach(function(e) { e.draw(); });
    if (vm_bossTriggered&&vm_boss) vm_boss.draw();
    vm_bullets.forEach(function(b) { b.draw(); });
    drawParticles();
    if (vm_player) vm_player.draw();
    // dd laser beam (world coords)
    if (ddLaserTimer > 0 && vm_player && !vm_player.dead) {
      const alpha = Math.min(1, ddLaserTimer / 25) * (0.7 + 0.3 * Math.sin(Date.now() * 0.03));
      const laserYw = vm_player.y + vm_player.h/2;
      const laserXw = vm_player.x + (ddLaserDir > 0 ? vm_player.w : 0);
      const laserW  = ddLaserDir > 0 ? 2048 : -2048;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff4422';
      ctx.fillRect(laserXw, laserYw - 5, laserW, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(laserXw, laserYw - 2, laserW, 4);
      ctx.globalAlpha = 1; ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha=1;
    // Gimmick visual effects
    if (stageGimmick === 'dark' && vm_player) {
      const pc = {x: vm_player.x + vm_player.w/2 - vm_cameraX, y: vm_player.y + vm_player.h/2};
      const rad = ctx.createRadialGradient(pc.x, pc.y, 40, pc.x, pc.y, 200);
      rad.addColorStop(0, 'rgba(0,0,0,0)');
      rad.addColorStop(1, 'rgba(0,0,0,0.88)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, W, H);
    }
    if (stageGimmick === 'icy') {
      ctx.fillStyle = 'rgba(100,180,255,0.08)';
      ctx.fillRect(0, 0, W, H);
    }
    if (stageGimmick === 'windy') {
      gimmickTimer++;
      if (Math.floor(gimmickTimer / 3) % 2 === 0) {
        ctx.fillStyle = 'rgba(200,220,255,0.15)';
        for (let wi = 0; wi < 5; wi++) {
          const wx2 = ((gimmickTimer * 3 + wi * 100) % W);
          ctx.fillRect(wx2, 20 + wi * 40, 30, 2);
        }
      }
    }
    // Character special active aura
    if (charSpecialActive > 0 && vm_player && !vm_player.dead) {
      const cid = vm_player.charId || 'vimman';
      const auraColor = cid==='claudeman'  ? 'rgba(255,140,0,0.22)'  :
                        cid==='warrior'    ? 'rgba(255,30,0,0.18)'   :
                        cid==='mage'       ? 'rgba(170,68,255,0.22)' :
                        cid==='swordsman'  ? 'rgba(255,200,0,0.18)'  : 'rgba(68,255,68,0.15)';
      ctx.fillStyle = auraColor;
      ctx.fillRect(0, 0, W, H);
      const sLabel = cid==='claudeman'  ? '/think ACTIVE  ATK×2' :
                     cid==='warrior'    ? 'BERSERK!!  ATK×1.5' :
                     cid==='mage'       ? 'ファミリア召喚中' :
                     cid==='swordsman'  ? '居合・居合斬！ ATK×1.5' : '';
      if (sLabel) {
        const sc = cid==='claudeman'?'#ff8800':cid==='warrior'?'#ff4400':cid==='swordsman'?'#ffcc44':'#aa44ff';
        ctx.fillStyle = sc;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(sLabel + ' (' + Math.ceil(charSpecialActive/60) + 's)', 36, 44);
      }
    }
    drawHUD();
    if (stageIntroTimer>0) drawStageIntro();
  }

  // ── Public interface ──────────────────────────────────────
  function _startStage(wid, sid) {
    worldNum = wid || 1; stageInWorld = sid || 1;
    selectCursor = stageInWorld - 1;
    currentStageDef = makeWorldStageDef(worldNum, stageInWorld);
    initStage(); state='stageintro';
  }

  // ── Canvas mouse click handler ────────────────────────────
  function _onCanvasClick(e) {
    if (state !== 'stageselect') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    if (state === 'stageselect') {
      // Click stage rows in stage select screen
      const world = window.WORLD_DEFS ? window.WORLD_DEFS[worldNum-1] : null;
      const stageCount = world ? world.stageCount : 3;
      for (let sid = 1; sid <= stageCount; sid++) {
        const ry = 62 + (sid - 1) * 58;
        if (mx >= 10 && mx <= W-10 && my >= ry && my <= ry + 52) {
          selectCursor = sid - 1;
          // Double-click or explicit play button area
          if (mx >= W - 100 && my >= ry + 15 && my <= ry + 45) {
            const isLocked = sid > 1 && !(window.SAVE && window.SAVE.clearedStages[worldNum+'-'+(sid-1)]);
            if (!isLocked) {
              stageInWorld = sid;
              currentStageDef = makeWorldStageDef(worldNum, stageInWorld);
              initStage(); state='stageintro';
            }
          }
        }
      }
    } else if (state === 'worldselect') {
      // Click world rows
      for (let vi = 0; vi < 8; vi++) {
        const ry = 76 + vi * 50;
        if (mx >= 8 && mx <= W-8 && my >= ry && my <= ry + 46) {
          const wid = worldSelectScroll + vi + 1;
          worldSelectCursor = worldSelectScroll + vi;
          const maxWorld = window.SAVE ? Math.min(window.SAVE.currentWorld, 50) : 1;
          if (wid <= maxWorld) { worldNum = wid; selectCursor = 0; state = 'stageselect'; }
        }
      }
    }
    canvas.focus();
  }

  // ── Opening story screen ──────────────────────────────────
  let storyPage = 0;
  function drawStoryScreen() {
    ctx.fillStyle='#000008'; ctx.fillRect(0,0,W,H);
    const t=Date.now()*0.001;
    // Starfield
    STARS.forEach(function(s){
      ctx.globalAlpha=0.4+0.3*Math.sin(t+s.x*0.1);
      ctx.fillStyle='#ffffff'; ctx.fillRect(s.x%W,s.y,s.r,s.r);
    });
    ctx.globalAlpha=1;
    ctx.save(); ctx.shadowColor='#ff8800'; ctx.shadowBlur=20;
    ctx.fillStyle='#ffaa44'; ctx.font='bold 16px monospace'; ctx.textAlign='center';
    ctx.fillText('⚡ CLAUDE MASTER QUEST ⚡', W/2, 32); ctx.restore();
    ctx.fillStyle='rgba(0,0,40,0.7)'; ctx.fillRect(16,44,W-32,H-80);
    ctx.strokeStyle='#ff8800'; ctx.lineWidth=1; ctx.strokeRect(16,44,W-32,H-80);
    const story = (window.GAME_STORY && window.GAME_STORY.opening) || [];
    story.forEach(function(line,i){
      const alpha = Math.max(0, Math.min(1, (t*2 - i*0.4)));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = line.startsWith('あなた') ? '#ffcc44' : line.startsWith('Claude') ? '#ff8800' : '#ccddff';
      ctx.font = (i===0||i===6) ? 'bold 11px monospace' : '10px monospace';
      ctx.textAlign='center';
      ctx.fillText(line, W/2, 62+i*18);
    });
    ctx.globalAlpha=1;
    if (Math.floor(t*2)%2===0) {
      ctx.fillStyle='#88aaff'; ctx.font='10px monospace'; ctx.textAlign='center';
      ctx.fillText('Enter / タップ: ゲーム開始', W/2, H-20);
    }
    drawVimStatusline();
  }

  function init() {
    loadProgress(); // Load SAVE data
    // Show opening story on first launch
    const firstLaunch = !window.SAVE || !(window.SAVE.totalXP > 0);
    state = firstLaunch ? 'story' : 'worldselect';
    score=0; lives=3; selectCursor=0; equipCursor=0; pauseCursor=0;
    // Restore cursor to current world
    if (window.SAVE) {
      worldNum = window.SAVE.currentWorld || 1;
      stageInWorld = window.SAVE.currentStage || 1;
      worldSelectCursor = worldNum - 1;
      worldSelectScroll = Math.max(0, worldSelectCursor - 4);
    }
    rewardData = null;
    currentStageDef = null;
    recentKeys=[];
    window._cmdLineHandler=handleCmdLine;
    addFlash(firstLaunch ? 'Claude Master Quest — Enter でストーリー開始！' : 'VimMan RPG  j/k:ワールド選択  Enter:ステージ選択  s:スキル  Esc:ホーム');
    canvas.removeEventListener('click', _onCanvasClick);
    canvas.addEventListener('click', _onCanvasClick);
  }

  function update() {
    // ── Opening Story ─────────────────────────────────────
    if (state==='story') {
      if (isEnter()||justPressed('Space')) { state='worldselect'; }
      if (justPressed('Escape')) { state='worldselect'; }
      return;
    }
    // ── World Select ──────────────────────────────────────
    if (state==='worldselect') {
      const maxWorld = window.SAVE ? Math.min(window.SAVE.currentWorld, 50) : 1;
      const totalWorlds = 50;
      if (justPressed('KeyJ')||justPressed('ArrowDown')) {
        worldSelectCursor = Math.min(worldSelectCursor+1, totalWorlds-1);
        if (worldSelectCursor >= worldSelectScroll+8) worldSelectScroll = worldSelectCursor-7;
      }
      if (justPressed('KeyK')||justPressed('ArrowUp')) {
        worldSelectCursor = Math.max(worldSelectCursor-1, 0);
        if (worldSelectCursor < worldSelectScroll) worldSelectScroll = worldSelectCursor;
      }
      if (isEnter()||justPressed('KeyL')) {
        const wid = worldSelectCursor + 1;
        if (wid <= maxWorld) {
          worldNum = wid; selectCursor = 0;
          state = 'stageselect';
        } else {
          addFlash('World '+wid+' はまだロックされています！ 前のワールドをクリアしてください。');
        }
      }
      if (justPressed('KeyS')) { state='equipment'; equipCursor=0; }
      if (justPressed('Escape')) { saveProgress(); switchGame('menu'); }
    }
    // ── Stage Select ──────────────────────────────────────
    else if (state==='stageselect') {
      const world = window.WORLD_DEFS ? window.WORLD_DEFS[worldNum-1] : null;
      const stageCount = world ? world.stageCount : 3;
      if (justPressed('KeyJ')||justPressed('ArrowDown')) selectCursor=Math.min(selectCursor+1, stageCount-1);
      if (justPressed('KeyK')||justPressed('ArrowUp'))   selectCursor=Math.max(selectCursor-1, 0);
      if (isEnter()||justPressed('KeyL')) {
        const sid = selectCursor + 1;
        // Check if locked (require prev stage cleared)
        const isLocked = sid > 1 && !(window.SAVE && window.SAVE.clearedStages[worldNum+'-'+(sid-1)]);
        if (!isLocked) {
          stageInWorld = sid;
          currentStageDef = makeWorldStageDef(worldNum, stageInWorld);
          initStage(); state='stageintro';
        } else {
          addFlash('Stage '+worldNum+'-'+sid+' はロック中！前のステージをクリアしてください。');
        }
      }
      if (justPressed('KeyS')) { state='equipment'; equipCursor=0; }
      if (justPressed('KeyH')||justPressed('Escape')) { state='worldselect'; }
    }
    // ── Equipment / Skills ────────────────────────────────
    else if (state==='equipment') {
      if (justPressed('KeyJ')||justPressed('ArrowDown')) equipCursor=(equipCursor+1)%SKILLS.length;
      if (justPressed('KeyK')||justPressed('ArrowUp'))   equipCursor=(equipCursor-1+SKILLS.length)%SKILLS.length;
      if (isEnter()||justPressed('KeyX')) {
        const sk=SKILLS[equipCursor];
        const lv = skillLv(sk.id);
        if (lv < sk.maxLv && getVimXP() >= sk.cost) {
          if (!window.SAVE.skills) window.SAVE.skills = {};
          window.SAVE.vimXP -= sk.cost;
          window.SAVE.skills[sk.id] = (window.SAVE.skills[sk.id] || 0) + 1;
          saveProgress();
          addFlash(sk.name+' Lv'+window.SAVE.skills[sk.id]+'にアップグレード！ [saved]');
        } else if (lv >= sk.maxLv) {
          addFlash(sk.name+' は既にMAXです！');
        } else {
          addFlash('VimXP不足！ 必要:'+sk.cost+' 現在:'+getVimXP());
        }
      }
      if (justPressed('Escape')) { state = vm_player ? 'pause' : 'worldselect'; }
    }
    else if (state==='pause') updatePauseMenu();
    else if (state==='stageintro') {
      stageIntroTimer--;
      if (stageIntroTimer<=0) state='gameplay';
    }
    else if (state==='gameplay') updateGameplay();
    else if (state==='stageclear') {
      blinkTimer++;
      if (isEnter()) {
        const def = currentStageDef || makeWorldStageDef(worldNum, stageInWorld);
        score=0;
        if (def.isBoss) {
          // Boss defeated - show reward screen
          state='reward'; blinkTimer=0;
        } else {
          // Normal stage - advance to next stage or world select
          const world = window.WORLD_DEFS ? window.WORLD_DEFS[worldNum-1] : null;
          const stageCount = world ? world.stageCount : 3;
          if (stageInWorld < stageCount) {
            stageInWorld++;
            currentStageDef = makeWorldStageDef(worldNum, stageInWorld);
            selectCursor = stageInWorld - 1;
          }
          state='stageselect';
        }
      }
      if (justPressed('Escape')) { saveProgress(); state='worldselect'; }
    }
    else if (state==='reward') {
      blinkTimer++;
      if (isEnter()||justPressed('Escape')) {
        score=0; lives=3;
        // Advance to next world
        const nextW = Math.min(worldNum + 1, 50);
        worldSelectCursor = nextW - 1;
        worldSelectScroll = Math.max(0, worldSelectCursor - 4);
        state='worldselect';
      }
    }
    else if (state==='gameover') {
      blinkTimer++;
      if (isEnter()) { score=0; lives=3; state='stageselect'; }
      if (justPressed('Escape')) { saveProgress(); state='worldselect'; }
    }
  }

  function draw() {
    ctx.globalAlpha=1;
    if (state==='story')        drawStoryScreen();
    else if (state==='worldselect')  drawWorldSelect();
    else if (state==='stageselect') drawStageSelect();
    else if (state==='equipment') drawEquipmentScreen();
    else if (state==='pause')   { drawGameplay(); drawPauseMenu(); }
    else if (state==='stageintro') { drawBackground(); drawStageIntro(); drawVimStatusline(); }
    else if (state==='gameplay')  drawGameplay();
    else if (state==='stageclear') drawStageClear();
    else if (state==='reward')    drawRewardScreen();
    else if (state==='gameover')  drawGameOver();
    ctx.globalAlpha=1;
  }

  function onKey(e) {
    // Record for key display
    const displayKey = e.shiftKey&&e.key.length===1 ? e.key.toUpperCase()
      : e.code==='Space'?'SPC':e.code==='Escape'?'ESC':e.code==='Enter'?'CR'
      : e.code==='Backspace'?'BS':e.key.length===1?e.key
      : e.code.replace('Key','').replace('Arrow','').replace('Digit','');
    if (displayKey) { recentKeys.push(displayKey); if (recentKeys.length>8) recentKeys.shift(); }

    if (state==='equipment') return;
    if (state==='pause') return; // pause handled in updatePauseMenu
    // ESC during gameplay → open pause menu (before NORMAL check so it works in any vim mode)
    if (state==='gameplay' && e.code==='Escape' && vimMode==='NORMAL') {
      state='pause'; pauseCursor=0; return;
    }
    if (state!=='gameplay') return;
    if (vimMode!=='NORMAL') return;
    if (!vm_player||vm_player.dead) return;

    const k=e.key;
    cmdBuffer+=k; cmdTimer=25;

    if (cmdBuffer.endsWith('dd'))  { execDD(); cmdBuffer=''; return; }
    if (cmdBuffer.endsWith('yy'))  { execYY(); cmdBuffer=''; return; }
    if (cmdBuffer.endsWith('gg'))  { execGG(); cmdBuffer=''; return; }
    if (cmdBuffer.endsWith('cc'))  { execCC(); cmdBuffer=''; return; }
    if (cmdBuffer.endsWith('ZZ'))  { execZZ(); cmdBuffer=''; return; }
    if (cmdBuffer.endsWith('ss'))  { charSpecial(); cmdBuffer=''; return; }
    if (cmdBuffer.length>4) cmdBuffer=cmdBuffer.slice(-2);

    if (e.code==='KeyU'&&!e.ctrlKey) { execUndo(); cmdBuffer=''; return; }
    if (e.code==='KeyW'&&!e.ctrlKey) { execWDash(1); cmdBuffer=''; return; }
    if (e.code==='KeyB'&&!e.ctrlKey) { execWDash(-1); cmdBuffer=''; return; }
    if (e.code==='KeyS'&&!e.ctrlKey) { weaponSpecial(); cmdBuffer=''; return; }

    if (e.code==='Semicolon'&&e.shiftKey) {
      setMode('COMMAND');
      window._cmdLineHandler=handleCmdLine;
    }
  }

  initSkills();
  return { init:init, update:update, draw:draw, onKey:onKey };
})();

registerGame('vimman', vimmanGame);
