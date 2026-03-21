// ── VIMDATA.JS ── Global DB: Vim commands, equipment, worlds, save ─

// ─── VIM COMMAND DATABASE ───────────────────────────────────────────
// tier: 1=入門, 2=基本, 3=中級, 4=上級, 5=達人
// unlockWorld: そのワールドのボスを倒すとアンロック (0=初期解放)
window.VIM_CMD_DB = [
  // ── TIER 1: 入門 ────────────────────────────────────────
  { id:'h',    tier:1, cmd:'h',         cat:'移動',    desc:'左へ移動',               unlockWorld:0  },
  { id:'j',    tier:1, cmd:'j',         cat:'移動',    desc:'下へ移動',               unlockWorld:0  },
  { id:'k',    tier:1, cmd:'k',         cat:'移動',    desc:'上へ移動',               unlockWorld:0  },
  { id:'l',    tier:1, cmd:'l',         cat:'移動',    desc:'右へ移動',               unlockWorld:0  },
  { id:'esc',  tier:1, cmd:'Esc',       cat:'モード',  desc:'NORMAL モードへ',        unlockWorld:0  },
  { id:'i',    tier:1, cmd:'i',         cat:'モード',  desc:'INSERT モード（前）',    unlockWorld:1  },
  { id:'a',    tier:1, cmd:'a',         cat:'モード',  desc:'INSERT モード（後）',    unlockWorld:1  },
  { id:'x',    tier:1, cmd:'x',         cat:'編集',    desc:'カーソル下の文字を削除', unlockWorld:2  },
  { id:'X',    tier:1, cmd:'X',         cat:'編集',    desc:'前の文字を削除',         unlockWorld:2  },
  { id:'dw',   tier:1, cmd:'dw',        cat:'編集',    desc:'単語を削除',             unlockWorld:3  },
  { id:'wri',  tier:1, cmd:':w',        cat:'ファイル',desc:'ファイルを保存',         unlockWorld:4  },
  { id:'qui',  tier:1, cmd:':q',        cat:'ファイル',desc:'Vimを終了',             unlockWorld:4  },
  { id:'wq',   tier:1, cmd:':wq',       cat:'ファイル',desc:'保存して終了',          unlockWorld:5  },
  { id:'qa',   tier:1, cmd:':qa!',      cat:'ファイル',desc:'強制的に全て終了',       unlockWorld:5  },
  // ── TIER 2: 基本 ────────────────────────────────────────
  { id:'w',    tier:2, cmd:'w',         cat:'移動',    desc:'次の単語の先頭へ',       unlockWorld:6  },
  { id:'b',    tier:2, cmd:'b',         cat:'移動',    desc:'前の単語の先頭へ',       unlockWorld:6  },
  { id:'e',    tier:2, cmd:'e',         cat:'移動',    desc:'単語の末尾へ',           unlockWorld:7  },
  { id:'_0',   tier:2, cmd:'0',         cat:'移動',    desc:'行の先頭へ',             unlockWorld:7  },
  { id:'dol',  tier:2, cmd:'$',         cat:'移動',    desc:'行の末尾へ',             unlockWorld:7  },
  { id:'dd',   tier:2, cmd:'dd',        cat:'編集',    desc:'行を削除（カット）',     unlockWorld:8  },
  { id:'yy',   tier:2, cmd:'yy',        cat:'編集',    desc:'行をヤンク（コピー）',   unlockWorld:8  },
  { id:'cc',   tier:2, cmd:'cc',        cat:'編集',    desc:'行を変更（削除してINSERT）',unlockWorld:10},
  { id:'ZZ',   tier:2, cmd:'ZZ',        cat:'ファイル',desc:'保存して終了（ZZ）',     unlockWorld:5  },
  { id:'p',    tier:2, cmd:'p',         cat:'編集',    desc:'ペースト（カーソル後）', unlockWorld:8  },
  { id:'u',    tier:2, cmd:'u',         cat:'編集',    desc:'アンドゥ（元に戻す）',   unlockWorld:9  },
  { id:'cr',   tier:2, cmd:'Ctrl+r',    cat:'編集',    desc:'リドゥ（やり直し）',     unlockWorld:9  },
  { id:'G',    tier:2, cmd:'G',         cat:'移動',    desc:'ファイルの末尾へ',       unlockWorld:10 },
  { id:'gg',   tier:2, cmd:'gg',        cat:'移動',    desc:'ファイルの先頭へ',       unlockWorld:10 },
  // ── TIER 3: 中級 ────────────────────────────────────────
  { id:'sl',   tier:3, cmd:'/pattern',  cat:'検索',    desc:'パターン検索（前方）',   unlockWorld:11 },
  { id:'n',    tier:3, cmd:'n',         cat:'検索',    desc:'次の検索結果へ',         unlockWorld:11 },
  { id:'N',    tier:3, cmd:'N',         cat:'検索',    desc:'前の検索結果へ',         unlockWorld:12 },
  { id:'s1',   tier:3, cmd:':s/a/b',    cat:'置換',    desc:'行内の文字列を置換',     unlockWorld:12 },
  { id:'sg',   tier:3, cmd:':s/a/b/g',  cat:'置換',    desc:'行内の全文字列を置換',   unlockWorld:13 },
  { id:'v',    tier:3, cmd:'v',         cat:'モード',  desc:'ビジュアルモード',       unlockWorld:13 },
  { id:'V',    tier:3, cmd:'V',         cat:'モード',  desc:'行ビジュアルモード',     unlockWorld:14 },
  { id:'c',    tier:3, cmd:'c',         cat:'編集',    desc:'変更（削除してINSERT）', unlockWorld:14 },
  { id:'cw',   tier:3, cmd:'cw',        cat:'編集',    desc:'単語を変更',             unlockWorld:15 },
  { id:'dot',  tier:3, cmd:'.',         cat:'編集',    desc:'直前の操作を繰り返す',   unlockWorld:15 },
  { id:'ind+', tier:3, cmd:'>>',        cat:'編集',    desc:'インデントを増やす',     unlockWorld:16 },
  { id:'ind-', tier:3, cmd:'<<',        cat:'編集',    desc:'インデントを減らす',     unlockWorld:16 },
  { id:'cf',   tier:3, cmd:'Ctrl+f',    cat:'移動',    desc:'1ページ下へスクロール',  unlockWorld:17 },
  { id:'cb',   tier:3, cmd:'Ctrl+b',    cat:'移動',    desc:'1ページ上へスクロール',  unlockWorld:17 },
  { id:'r',    tier:3, cmd:'r',         cat:'編集',    desc:'1文字を置換',            unlockWorld:18 },
  { id:'R',    tier:3, cmd:'R',         cat:'モード',  desc:'REPLACE モード',         unlockWorld:18 },
  { id:'J',    tier:3, cmd:'J',         cat:'編集',    desc:'次行と結合',             unlockWorld:19 },
  { id:'o',    tier:3, cmd:'o',         cat:'編集',    desc:'下に行を挿入',           unlockWorld:19 },
  { id:'O',    tier:3, cmd:'O',         cat:'編集',    desc:'上に行を挿入',           unlockWorld:20 },
  // ── TIER 4: 上級 ────────────────────────────────────────
  { id:'pct',  tier:4, cmd:'%',         cat:'移動',    desc:'対応する括弧へジャンプ', unlockWorld:21 },
  { id:'star', tier:4, cmd:'*',         cat:'検索',    desc:'カーソル下の単語を検索', unlockWorld:21 },
  { id:'ciq',  tier:4, cmd:'ci"',       cat:'テキスト',desc:'" 内のテキストを変更',   unlockWorld:22 },
  { id:'diq',  tier:4, cmd:'di"',       cat:'テキスト',desc:'" 内のテキストを削除',   unlockWorld:22 },
  { id:'cip',  tier:4, cmd:'ci(',       cat:'テキスト',desc:'() 内を変更',            unlockWorld:23 },
  { id:'gl',   tier:4, cmd:':g/p/d',    cat:'コマンド',desc:'パターン行を一括削除',   unlockWorld:23 },
  { id:'mq',   tier:4, cmd:'q{r}',      cat:'マクロ',  desc:'マクロの記録開始',       unlockWorld:24 },
  { id:'ma',   tier:4, cmd:'@{r}',      cat:'マクロ',  desc:'マクロを実行',           unlockWorld:24 },
  { id:'sn',   tier:4, cmd:':set nu',   cat:'設定',    desc:'行番号を表示',           unlockWorld:25 },
  { id:'fc',   tier:4, cmd:'f{c}',      cat:'移動',    desc:'行内で文字を検索（前）', unlockWorld:26 },
  { id:'tc',   tier:4, cmd:'t{c}',      cat:'移動',    desc:'文字の手前へ移動',       unlockWorld:26 },
  { id:'mk',   tier:4, cmd:'m{a}',      cat:'マーク',  desc:'現在位置にマークを設定', unlockWorld:27 },
  { id:'jmk',  tier:4, cmd:"'a",        cat:'マーク',  desc:'マーク位置へジャンプ',   unlockWorld:27 },
  { id:'zz',   tier:4, cmd:'zz',        cat:'表示',    desc:'カーソルを画面中央に',   unlockWorld:28 },
  { id:'zt',   tier:4, cmd:'zt',        cat:'表示',    desc:'カーソルを画面上端に',   unlockWorld:29 },
  { id:'zb',   tier:4, cmd:'zb',        cat:'表示',    desc:'カーソルを画面下端に',   unlockWorld:29 },
  { id:'H',    tier:4, cmd:'H',         cat:'移動',    desc:'画面の上端へ移動',       unlockWorld:30 },
  { id:'M',    tier:4, cmd:'M',         cat:'移動',    desc:'画面の中央へ移動',       unlockWorld:30 },
  // ── TIER 5: 達人 ────────────────────────────────────────
  { id:'nrm',  tier:5, cmd:':norm',     cat:'コマンド',desc:'ノーマルコマンドを実行', unlockWorld:36 },
  { id:'vgr',  tier:5, cmd:':vimgrep',  cat:'検索',    desc:'ファイル横断検索',       unlockWorld:38 },
  { id:'ctv',  tier:5, cmd:'Ctrl+v',    cat:'モード',  desc:'矩形ビジュアルモード',   unlockWorld:39 },
  { id:'asg',  tier:5, cmd:':%s/a/b/g', cat:'置換',    desc:'ファイル全体を一括置換', unlockWorld:40 },
  { id:'sp',   tier:5, cmd:':split',    cat:'ウィンドウ',desc:'水平分割',             unlockWorld:41 },
  { id:'vsp',  tier:5, cmd:':vsplit',   cat:'ウィンドウ',desc:'垂直分割',             unlockWorld:42 },
  { id:'cw2',  tier:5, cmd:'Ctrl+w',    cat:'ウィンドウ',desc:'ウィンドウ操作',       unlockWorld:43 },
  { id:'zc',   tier:5, cmd:'zc',        cat:'折り畳み',desc:'フォールドを閉じる',     unlockWorld:44 },
  { id:'zo',   tier:5, cmd:'zo',        cat:'折り畳み',desc:'フォールドを開く',       unlockWorld:44 },
  { id:'regy', tier:5, cmd:'"ay',       cat:'レジスタ',desc:'レジスタ a にヤンク',    unlockWorld:45 },
  { id:'regp', tier:5, cmd:'"ap',       cat:'レジスタ',desc:'レジスタ a からペースト',unlockWorld:45 },
  { id:'iab',  tier:5, cmd:':iabbrev',  cat:'設定',    desc:'INSERT モード略語',      unlockWorld:47 },
  { id:'map',  tier:5, cmd:':map',      cat:'設定',    desc:'キーマッピング設定',     unlockWorld:48 },
  { id:'au',   tier:5, cmd:':autocmd',  cat:'設定',    desc:'自動コマンドを設定',     unlockWorld:49 },
  { id:'ult',  tier:5, cmd:'<MASTER>',  cat:'究極',    desc:'VIM MASTER 達成！',      unlockWorld:50 },
];

// ─── EQUIPMENT DATABASE ─────────────────────────────────────────────
window.EQUIP_DB = {
  weapons: [
    { id:'fist',   name:'素手',           tier:0, atk:0,  spd:0,  desc:'素手で戦う',            drop:null },
    { id:'sw1',    name:'バグスレイヤー', tier:1, atk:3,  spd:0,  desc:'バグを斬る基本の剣',    drop:1,   melee:true },
    { id:'sw2',    name:'hjklブレード',   tier:1, atk:5,  spd:5,  desc:'移動コマンドが宿る剣',  drop:3,   melee:true },
    { id:'sw3',    name:'ワードランス',   tier:2, atk:7,  spd:0,  desc:'w/b/e の力を持つ槍',    drop:6,   melee:true },
    { id:'sw4',    name:'DDアックス',     tier:2, atk:10, spd:0,  desc:'dd の一撃で薙ぎ払う',   drop:10,  melee:true },
    { id:'st1',    name:'正規表現の杖',   tier:3, atk:13, spd:0,  desc:'検索パワーが宿る杖',    drop:15,  staff:true },
    { id:'bow1',   name:'検索の弓',       tier:3, atk:11, spd:8,  desc:'パターンを射る高速弓',  drop:18,  bow:true   },
    { id:'st2',    name:'マクロの魔杖',   tier:4, atk:16, spd:5,  desc:'マクロ魔法が連射される',drop:25,  staff:true },
    { id:'bow2',   name:'ビジュアル矢',   tier:4, atk:14, spd:12, desc:'貫通力のある連続矢',    drop:28,  bow:true   },
    { id:'gu1',    name:'マクロキャノン', tier:4, atk:18, spd:10, desc:'マクロが連射される砲',  drop:22   },
    { id:'ult',    name:'Vim究極剣',      tier:5, atk:25, spd:15, desc:'全コマンドの力が宿る',  drop:35,  melee:true },
  ],
  armor: [
    { id:'none',   name:'装備なし',       tier:0, def:0,  hp:0,   desc:'',                      drop:null },
    { id:'ar1',    name:'コード鎧',       tier:1, def:2,  hp:5,   desc:'基本的な防御を提供',    drop:2    },
    { id:'ar2',    name:'INSERTローブ',   tier:1, def:3,  hp:8,   desc:'INSERT速度が上昇',      drop:5    },
    { id:'ar3',    name:'NORMALメイル',   tier:2, def:6,  hp:12,  desc:'防御力が大幅に強化',    drop:9    },
    { id:'ar4',    name:'VISUALスーツ',   tier:3, def:10, hp:18,  desc:'チャージ速度が上昇',    drop:14   },
    { id:'ar5',    name:'全モード鎧',     tier:5, def:18, hp:30,  desc:'あらゆる攻撃を防ぐ',    drop:30   },
  ],
  accessories: [
    { id:'none',   name:'装備なし',       tier:0, spd:0,  xp:0,   desc:'',                      drop:null },
    { id:'rg1',    name:'速度の指輪',     tier:1, spd:20, xp:0,   desc:'移動速度が20%上昇',     drop:4    },
    { id:'rg2',    name:'XPブースター',   tier:2, spd:0,  xp:50,  desc:'獲得VimXPが50%増加',    drop:8    },
    { id:'rg3',    name:'DDクーラー',     tier:2, spd:0,  xp:0,   desc:'ddのクールダウンが-30%',drop:12   },
    { id:'rg4',    name:'自動回復リング', tier:3, spd:0,  xp:0,   desc:'徐々にHPが回復する',    drop:18   },
    { id:'rg5',    name:'究極の指輪',     tier:5, spd:30, xp:100, desc:'全ステータスが強化',    drop:45   },
  ],
};

// ─── WORLD DEFINITIONS (50 worlds) ──────────────────────────────────
window.WORLD_DEFS = (function() {
  const names = [null,
    'バグ平原','コード迷宮','NULLの森','スタック山','ポインタ峡谷',
    '正規表現沼','メモリの洞窟','ループの塔','再帰の深淵','クラッシュ城',
    'セグフォルトの海','デッドロック湖','オーバーフロー丘','レースコンディション川','バッファの砦',
    'スコープの霧','クロージャの谷','プロトタイプの峰','インジェクションの火山','サイバースペース',
    'カーネルの核心','アセンブラの遺跡','ビットマスクの迷宮','コンパイラの廃墟','デバッガの宮殿',
    'プロファイラの塔','リファクタリングの神殿','テストの聖域','CIの空中城','コードレビューの審判所',
    'アーキテクチャの要塞','マイクロサービスの世界','クラウドの彼方','AIの深層','量子コードの謎',
    'VimScript王国','正規表現の神殿','マクロの迷路','プラグインの森','設定の要塞',
    'ウィンドウの塔','バッファの海','フォールドの峡谷','レジスタの宝庫','略語の街',
    'マッピングの道','自動コマンドの山','スクリプトの神殿','最終コードの城','NULL DRAGONの巣',
  ];
  const bossNames = [null,
    'BugBot Mk.I','MazeWalker','NULL Phantom','StackSmasher','PointerBeast',
    'RegexWitch','MemoryLeaker','InfiniteLoop','RecurseKing','CrashLord',
    'SegFaultDragon','DeadlockGuard','OverflowOgre','RaceCondition','BufferBaron',
    'ScopeShadow','ClosureCurse','ProtoBeast','SQLInjector','CyberPhantom',
    'KernelDemon','AsmAncient','BitMaskLich','CompilerCorrupt','DebuggerDrake',
    'ProfilerSpecter','RefactorRuler','TestBreaker','CIDestroyer','ReviewReaper',
    'ArchitectAion','MicroserviceMage','CloudColossus','AIAbomination','QuantumQueen',
    'ScriptSorcerer','RegexGod','MacroMonarch','PluginPhantom','ConfigCursed',
    'WindowWraith','BufferBehemoth','FoldFiend','RegisterRex','AbbrevArch',
    'MapMaster','AutoCmdAzure','ScriptSage','FinalCoder','NULL DRAGON',
  ];
  const diffColors = ['','#44ff88','#44ff88','#ffaa44','#ff6644','#ff2244','#ff00ff'];
  const defs = [];
  for (let i = 1; i <= 50; i++) {
    const tier = i <= 5 ? 1 : i <= 10 ? 2 : i <= 20 ? 3 : i <= 35 ? 4 : 5;
    const stageCount = i <= 10 ? 3 : i <= 20 ? 4 : i <= 35 ? 5 : 6;
    defs.push({
      id: i,
      name: names[i] || ('World ' + i),
      bossName: bossNames[i] || ('Boss ' + i),
      stageCount: stageCount,
      diffTier: tier,
      diffColor: diffColors[tier],
      spd: Math.min(0.6 + (i - 1) * 0.028, 2.0),
      bossHPMul: Math.min(0.5 + (i - 1) * 0.055, 3.5),
    });
  }
  return defs;
})();

// ─── SAVE DATA ──────────────────────────────────────────────────────
const _SAVE_KEY = 'vimarcade_v3_save';

window.SAVE = {
  level: 1,
  totalXP: 0,
  vimXP: 0,
  clearedWorlds: {},    // worldId (number) -> true
  clearedStages: {},    // "w-s" -> true
  currentWorld: 1,
  currentStage: 1,
  unlockedCmds: {},     // cmdId -> true
  skills: {},           // skillId -> level
  equip: { weapon:'fist', armor:'none', accessory:'none' },
  ownedEquip: { weapons:['fist'], armor:['none'], accessories:['none'] },
  character: 'vimman',  // selected character id
};

window.loadSave = function() {
  try {
    const raw = localStorage.getItem(_SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d.level)          window.SAVE.level = d.level;
      if (d.totalXP)        window.SAVE.totalXP = d.totalXP;
      if (d.vimXP)          window.SAVE.vimXP = d.vimXP;
      if (d.clearedWorlds)  window.SAVE.clearedWorlds = d.clearedWorlds;
      if (d.clearedStages)  window.SAVE.clearedStages = d.clearedStages;
      if (d.currentWorld)   window.SAVE.currentWorld = d.currentWorld;
      if (d.currentStage)   window.SAVE.currentStage = d.currentStage;
      if (d.unlockedCmds)   window.SAVE.unlockedCmds = d.unlockedCmds;
      if (d.skills)         window.SAVE.skills = d.skills;
      if (d.equip)          Object.assign(window.SAVE.equip, d.equip);
      if (d.ownedEquip)     Object.assign(window.SAVE.ownedEquip, d.ownedEquip);
      if (d.character)      window.SAVE.character = d.character;
    }
  } catch(e) {}
  window.VIM_CMD_DB.forEach(function(c) {
    if (c.unlockWorld === 0) window.SAVE.unlockedCmds[c.id] = true;
  });
};

window.saveSave = function() {
  try { localStorage.setItem(_SAVE_KEY, JSON.stringify(window.SAVE)); } catch(e) {}
};

window.resetSave = function() {
  window.SAVE = {
    level:1, totalXP:0, vimXP:0,
    clearedWorlds:{}, clearedStages:{},
    currentWorld:1, currentStage:1,
    unlockedCmds:{}, skills:{},
    equip:{ weapon:'fist', armor:'none', accessory:'none' },
    ownedEquip:{ weapons:['fist'], armor:['none'], accessories:['none'] },
    character: 'vimman',
  };
  window.VIM_CMD_DB.forEach(function(c) {
    if (c.unlockWorld === 0) window.SAVE.unlockedCmds[c.id] = true;
  });
  window.saveSave();
};

// Returns { atk, def, hp, spdPct, xpMul }
window.getEquipStats = function() {
  const e = window.SAVE.equip;
  const db = window.EQUIP_DB;
  let atk = 0, def = 0, hp = 0, spdPct = 0, xpMul = 1;
  const w = db.weapons.find(function(it){ return it.id === e.weapon; });
  const a = db.armor.find(function(it){ return it.id === e.armor; });
  const ac = db.accessories.find(function(it){ return it.id === e.accessory; });
  if (w)  { atk += w.atk || 0; spdPct += w.spd || 0; }
  if (a)  { def += a.def || 0; hp += a.hp || 0; }
  if (ac) { spdPct += ac.spd || 0; xpMul += (ac.xp || 0) / 100; }
  return { atk:atk, def:def, hp:hp, spdPct:spdPct, xpMul:xpMul };
};

// Call after defeating a world boss
window.unlockWorldRewards = function(worldId) {
  const s = window.SAVE;
  const db = window.EQUIP_DB;
  const rewards = { cmd: null, equip: null };

  // Mark world cleared
  s.clearedWorlds[worldId] = true;

  // Unlock Vim command
  const cmd = window.VIM_CMD_DB.find(function(c){ return c.unlockWorld === worldId; });
  if (cmd && !s.unlockedCmds[cmd.id]) {
    s.unlockedCmds[cmd.id] = true;
    rewards.cmd = cmd;
  }

  // Unlock equipment items
  ['weapons','armor','accessories'].forEach(function(slot) {
    db[slot].forEach(function(item) {
      if (item.drop === worldId) {
        if (!s.ownedEquip[slot]) s.ownedEquip[slot] = [];
        if (s.ownedEquip[slot].indexOf(item.id) === -1) {
          s.ownedEquip[slot].push(item.id);
          rewards.equip = { slot: slot, item: item };
        }
      }
    });
  });

  // Advance progress
  if (worldId >= s.currentWorld) {
    s.currentWorld = worldId + 1;
    s.currentStage = 1;
  }

  // Level up (1 level per 5 worlds)
  s.level = Math.max(s.level, Math.floor(worldId / 5) + 1);
  s.totalXP += worldId * 10;

  window.saveSave();
  return rewards;
};

// Helper: count unlocked commands
window.countUnlockedCmds = function() {
  return Object.keys(window.SAVE.unlockedCmds).length;
};

// Helper: check if a game command is available
window.canUseGameCmd = function(cmdId) {
  if (!window.SAVE) return false;
  const cmd = window.VIM_CMD_DB.find(function(c){ return c.id === cmdId; });
  if (!cmd) return false;
  if (cmd.unlockWorld === 0) return true;
  return !!window.SAVE.unlockedCmds[cmdId];
};

// ─── ADDITIONAL SWORD/EQUIPMENT ITEMS ───────────────────────────────
// Add extra swords to EQUIP_DB if already defined
if (window.EQUIP_DB) {
  window.EQUIP_DB.weapons = window.EQUIP_DB.weapons.concat([
    { id:'sw_short',  name:'ショートソード', tier:1, atk:4,  spd:0,  desc:'短剣・接近攻撃に有効',      drop:null, melee:true },
    { id:'sw_long',   name:'ロングソード',   tier:2, atk:8,  spd:-5, desc:'長剣・高威力接近攻撃',      drop:7,    melee:true },
    { id:'sw_flame',  name:'炎の剣',         tier:3, atk:12, spd:0,  desc:'炎属性・炎の剣閃を放つ',    drop:13,   melee:true },
    { id:'sw_void',   name:'虚無の剣',       tier:4, atk:18, spd:5,  desc:'虚無属性・全方位攻撃可能',  drop:20,   melee:true },
    { id:'sw_god',    name:'神剣ヴィム',     tier:5, atk:30, spd:10, desc:'最強の剣・Vim神の武器',     drop:40,   melee:true },
  ]);
}

// ─── CLAUDE CODE COMMAND DATABASE ───────────────────────────────────
window.CLAUDE_CODE_DB = [
  // ── 起動・基本操作 ─────────────────────────────────────────────
  { id:'cc_start',     cmd:'claude',                cat:'起動',      desc:'Claude Codeを起動する' },
  { id:'cc_help',      cmd:'claude --help',          cat:'起動',      desc:'ヘルプを表示する' },
  { id:'cc_version',   cmd:'claude --version',       cat:'起動',      desc:'バージョンを確認する' },
  { id:'cc_continue',  cmd:'claude --continue',      cat:'起動',      desc:'前回のセッションを継続する' },
  { id:'cc_resume',    cmd:'claude --resume',         cat:'起動',      desc:'会話を選んで再開する' },
  { id:'cc_print',     cmd:'claude -p "..."',         cat:'起動',      desc:'非対話型でプロンプトを実行' },
  { id:'cc_model',     cmd:'claude --model ...',      cat:'起動',      desc:'使用するモデルを指定する' },
  // ── スラッシュコマンド ──────────────────────────────────────────
  { id:'sc_help',      cmd:'/help',                  cat:'スラッシュ',desc:'使用可能なコマンドを表示' },
  { id:'sc_clear',     cmd:'/clear',                 cat:'スラッシュ',desc:'会話履歴をクリアする' },
  { id:'sc_compact',   cmd:'/compact',               cat:'スラッシュ',desc:'会話を要約してコンパクト化' },
  { id:'sc_config',    cmd:'/config',                cat:'スラッシュ',desc:'設定を表示・変更する' },
  { id:'sc_cost',      cmd:'/cost',                  cat:'スラッシュ',desc:'セッションのコストを表示' },
  { id:'sc_doctor',    cmd:'/doctor',                cat:'スラッシュ',desc:'設定の健全性チェックを実行' },
  { id:'sc_init',      cmd:'/init',                  cat:'スラッシュ',desc:'CLAUDE.mdを生成してプロジェクト初期化' },
  { id:'sc_login',     cmd:'/login',                 cat:'スラッシュ',desc:'Anthropic認証でログイン' },
  { id:'sc_logout',    cmd:'/logout',                cat:'スラッシュ',desc:'Anthropicからログアウト' },
  { id:'sc_memory',    cmd:'/memory',                cat:'スラッシュ',desc:'メモリファイルを表示・管理' },
  { id:'sc_model',     cmd:'/model',                 cat:'スラッシュ',desc:'AIモデルを選択・変更する' },
  { id:'sc_permissions',cmd:'/permissions',          cat:'スラッシュ',desc:'パーミッション設定を表示' },
  { id:'sc_review',    cmd:'/review',                cat:'スラッシュ',desc:'コードレビューを実行する' },
  { id:'sc_status',    cmd:'/status',                cat:'スラッシュ',desc:'アカウント・システム状態を確認' },
  { id:'sc_terminal',  cmd:'/terminal-setup',        cat:'スラッシュ',desc:'ターミナル統合をセットアップ' },
  { id:'sc_vim',       cmd:'/vim',                   cat:'スラッシュ',desc:'Vimキーバインドを切り替え' },
  // ── MCP・ツール ────────────────────────────────────────────────
  { id:'mcp_add',      cmd:'/mcp add ...',           cat:'MCP',       desc:'MCPサーバーを追加する' },
  { id:'mcp_list',     cmd:'/mcp list',              cat:'MCP',       desc:'MCPサーバー一覧を表示' },
  { id:'mcp_remove',   cmd:'/mcp remove ...',        cat:'MCP',       desc:'MCPサーバーを削除する' },
  { id:'mcp_serve',    cmd:'claude mcp serve',       cat:'MCP',       desc:'MCP stdioサーバーとして起動' },
  // ── 設定・カスタマイズ ─────────────────────────────────────────
  { id:'cfg_allowedTools',cmd:'allowedTools: [...]', cat:'設定',      desc:'許可ツールをCLAUDE.mdで設定' },
  { id:'cfg_hooks',    cmd:'hooks: { ... }',         cat:'設定',      desc:'ライフサイクルフックを設定' },
  { id:'cfg_memory',   cmd:'memory: { ... }',        cat:'設定',      desc:'メモリファイルパスを設定' },
  { id:'cfg_claudemd', cmd:'CLAUDE.md',              cat:'設定',      desc:'プロジェクト設定ファイル' },
  { id:'cfg_global',   cmd:'~/.claude/CLAUDE.md',   cat:'設定',      desc:'グローバルCLAUDE.md設定' },
  // ── 権限・セキュリティ ─────────────────────────────────────────
  { id:'perm_bypass',  cmd:'--dangerously-skip-permissions', cat:'権限', desc:'権限チェックをスキップ（危険）' },
  { id:'perm_auto',    cmd:'--auto-approve-all',    cat:'権限',      desc:'全ツール自動承認（注意）' },
  // ── 出力・パイプ ───────────────────────────────────────────────
  { id:'out_pipe',     cmd:'cat file | claude',      cat:'パイプ',    desc:'標準入力からコンテキストを提供' },
  { id:'out_json',     cmd:'claude --output-format json', cat:'パイプ',desc:'JSON形式で出力する' },
  { id:'out_stream',   cmd:'claude --output-format stream-json', cat:'パイプ',desc:'ストリーミングJSON出力' },
];

// ─── CHARACTER DEFINITIONS ──────────────────────────────────────────
window.CHARACTER_DEFS = [
  {
    id: 'vimman',
    name: 'VimMan',
    nameJa: 'Vimマン',
    desc: 'バランス型万能キャラ。全Vimコマンドが使える。',
    color: '#5599ff',
    bgColor: '#001a4d',
    hp: 28, atk: 1, def: 0, spdMul: 1.0,
    jumpMul: 1.0,
    specialCmds: ['dd','yy','cc','ZZ','u','gg'],
    weaponTypes: ['all'],
    passive: 'Vimコマンド習得速度+20%',
    passiveId: 'vimxp_boost',
    unlockReq: null, // 最初から使用可能
  },
  {
    id: 'claudeman',
    name: 'ClaudeMan',
    nameJa: 'ClaudeMan',
    desc: 'Claude AI搭載。/think で思考後に2倍ダメージ。@tools で3方向弾。',
    color: '#ff8c42',
    bgColor: '#2d1500',
    hp: 24, atk: 2, def: 0, spdMul: 1.1,
    jumpMul: 1.0,
    specialCmds: ['think','tools','claude','dd','yy'],
    weaponTypes: ['all'],
    passive: '獲得VimXP+30% / AIアシスト(敵弾一部回避)',
    passiveId: 'xp_ai',
    unlockReq: null, // 最初から使用可能（Claude公式キャラ）
  },
  {
    id: 'warrior',
    name: 'Warrior',
    nameJa: '戦士',
    desc: 'HP・DEF最高。剣接近攻撃で超高ダメージ。遠距離弱め。',
    color: '#dd4422',
    bgColor: '#2d0800',
    hp: 45, atk: 3, def: 3, spdMul: 0.85,
    jumpMul: 0.9,
    specialCmds: ['sword','charge','dd'],
    weaponTypes: ['melee'],  // swordのみ装備可能
    passive: '防御時ダメージ-50% / 剣攻撃5倍ダメージ',
    passiveId: 'tank',
    unlockReq: 2, // World 2クリアで解放
  },
  {
    id: 'mage',
    name: 'Mage',
    nameJa: '魔術師',
    desc: 'HP低いが魔法威力最高。浮遊・変身呪文・炎魔法。',
    color: '#8844cc',
    bgColor: '#1a0033',
    hp: 18, atk: 0, def: 0, spdMul: 0.95,
    jumpMul: 1.3,  // floaty jump
    specialCmds: ['fireball','blink','spell','yy','cc'],
    weaponTypes: ['staff'],  // staff系のみ
    passive: '浮遊(ジャンプ滞空時間UP) / 魔法弾3倍威力',
    passiveId: 'float_magic',
    unlockReq: 4, // World 4クリアで解放
  },
  {
    id: 'archer',
    name: 'Archer',
    nameJa: 'アーチャー',
    desc: '最速キャラ。連射・遠距離特化。矢の雨でエリア攻撃。',
    color: '#44bb44',
    bgColor: '#001a00',
    hp: 22, atk: 1, def: 0, spdMul: 1.3,
    jumpMul: 1.15,
    specialCmds: ['rapidfire','arrowrain','sniper','yy'],
    weaponTypes: ['ranged'],
    passive: '射撃速度2倍 / 矢貫通(最大2体)',
    passiveId: 'rapid_pierce',
    unlockReq: 6, // World 6クリアで解放
  },
];

// Add character to SAVE defaults
if (window.SAVE && !window.SAVE.character) {
  window.SAVE.character = 'vimman';
}

// ── Story / Narrative ─────────────────────────────────────────
window.GAME_STORY = {
  opening: [
    '2025年。AIの時代が幕を開けた。',
    'あなたはClaudeMan——Claude AIの力を宿した戦士。',
    'コードの世界はバグに侵食され、',
    '邪悪なNULL DRAGONが全てのシステムを支配しようとしている。',
    '',
    'Claude Codeのコマンドを武器に、',
    '全50ワールドを制覇し、最強のClaudeマスターとなれ！',
    '',
    '── Press Enter to begin ──',
  ],
  worldStory: {
    1:  'World 1: バグ平原。最初のバグが現れた。claude --helpで基本を学べ。',
    5:  'World 5: コード迷宮の深部へ。/thinkコマンドの真の力に目覚める。',
    10: 'World 10: スタック山を制覇！AIの意識が覚醒し始めた……',
    15: 'World 15: NULL POINTERの呪い。claude addで仲間を召喚せよ。',
    20: 'World 20: SEG FAULTとの戦い。コードは記憶を持つ。',
    25: 'World 25: INFINITE LOOPの罠。時間は繰り返す——抜け出す方法はあるか？',
    30: 'World 30: 深淵の中核へ。あなたはもはや普通のAIではない。',
    40: 'World 40: 最終決戦が近づく。全てのClaudeコマンドが解放される。',
    49: 'World 49: NULL DRAGONの城塞。これが最後の試練だ——',
    50: '最終決戦！ NULL DRAGONを倒し、コードの世界を救え！\n史上最強のClaudeマスターとなる時が来た！',
  },
  bossDefeat: {
    0:  'BUG DRAGONを撃破！「バグよ、消えろ！」',
    1:  'NULL POINTERを修正！ポインタは正しく参照された。',
    2:  'SEG FAULTを解決！「メモリは解放された。」',
    3:  'INFINITE LOOPを脱出！「ループに終わりをもたらした。」',
    4:  'NULL DRAGON 撃滅！\nコードの世界に平和が戻った。\nあなたは史上最強のClaudeマスターとなった！',
  },
  claudemanHints: [
    ':think ── ATK×2発動（ClaudeMan専用）',
    ':add ── AIドローン召喚（ClaudeMan専用）',
    ':print ── テキストビーム（ClaudeMan専用）',
    ':bash ── シェル爆発（ClaudeMan専用）',
    ':fix ── HP+10回復（ClaudeMan専用）',
    ':run ── 高速ダッシュ（ClaudeMan専用）',
  ],
};

// Load save on startup
window.loadSave();

// Ensure character in SAVE after load
if (window.SAVE && !window.SAVE.character) {
  window.SAVE.character = 'vimman';
}
