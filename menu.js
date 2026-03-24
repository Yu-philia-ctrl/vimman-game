// ── MENU.JS ── VIM ARCADE HOME Screen (HOME / CHARACTER / CODEX) ──

const menuModule = (function() {

  // Pre-generate stars
  const STARS = [];
  for (let i = 0; i < 40; i++)
    STARS.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()<0.3?2:1 });

  // ── State ─────────────────────────────────────────────────────────
  let tab = 'home';  // 'home' | 'character' | 'codex' | 'claudecode' | 'shell' | 'community'
  let commScroll = 0;

  // HOME tab
  const HOME_ITEMS = ['continue', 'newgame', 'stageselect', 'linuxbattle', 'snake', 'invaders', 'tetris', 'tutorial', 'codex', 'character', 'shell', 'ccaf'];
  // ナビ順: Main Quest 1(0-2) → Main Quest 2(3) → Main Quest 3(11) → サブゲーム(4-10)
  const HOME_NAV_ORDER = [0, 1, 2, 3, 11, 4, 5, 6, 7, 8, 9, 10];
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

  // Shell One-liner CODEX tab
  const SHELL_CATS = ['FS/ストレージ','プロセス','ネットワーク','ログ/テキスト','セキュリティ','アーカイブ','高度テキスト','ネット診断','システム情報','計算/日時'];
  const SHELL_DATA = [
    // FS/ストレージ
    [
      { cmd:'find / -size +1G 2>/dev/null | xargs ls -lh',              desc:'1GB以上ファイル抽出' },
      { cmd:'du -sk * | sort -rn | awk \'{print $2" "$1/1024" MB"}\'',  desc:'ディレクトリ使用量集計' },
      { cmd:'find . -type d -empty | xargs rmdir',                       desc:'空ディレクトリ一括削除' },
      { cmd:'find . -mtime -1 -type f | xargs ls -lt',                  desc:'24h以内の更新ファイル' },
      { cmd:'find . -mtime +30 | xargs ls -lh',                         desc:'30日以上更新なし' },
      { cmd:'find . -type f | sed \'s/^.*\\.//\' | sort | uniq -c',     desc:'拡張子別ファイル数' },
      { cmd:'find . -perm 777 | xargs -r ls -l',                        desc:'誰でも読めるファイル' },
      { cmd:'ls | grep " " | rename \'s/ /_/g\'',                        desc:'スペースをアンダースコアへ' },
      { cmd:'df -h | awk \'$5+0 > 90 {print $0}\'',                     desc:'使用率90%以上パーティション' },
      { cmd:'find . -xdev -type f | cut -d "/" -f2 | sort | uniq -c | sort -nr', desc:'ファイル数多い順' },
    ],
    // プロセス
    [
      { cmd:'ps aux --sort=-%mem | head',                                desc:'メモリ使用トップ10' },
      { cmd:'ps aux --sort=-%cpu | head',                                desc:'CPU使用トップ10' },
      { cmd:'ps -u <user> | wc -l',                                      desc:'指定ユーザーのプロセス数' },
      { cmd:'ps -eo pid,etimes,comm --sort=-etimes | head',              desc:'起動時間が長いプロセス' },
      { cmd:'ps aux | awk \'$8=="Z" {print $2}\'',                       desc:'ゾンビプロセス' },
      { cmd:'pgrep <name> | xargs kill -9',                              desc:'名前指定で強制終了' },
      { cmd:'grep VmSwap /proc/*/status 2>/dev/null | sort -nk 2 -r | head', desc:'スワップ使用プロセス' },
      { cmd:'ps aux | awk \'{sum+=$6} END {print sum/1024" MB"}\'',      desc:'メモリ合計' },
      { cmd:'ps -eLo pid,tid,comm | awk \'{print $1}\' | sort | uniq -c | sort -nr | head', desc:'スレッド数トップ10' },
      { cmd:'ls /proc/*/fd -1 2>/dev/null | awk -F\'/\' \'{print $3}\' | sort | uniq -c | sort -nr | head', desc:'FD数トップ10' },
    ],
    // ネットワーク
    [
      { cmd:'ss -tuln | grep LISTEN',                                    desc:'待機TCPポート' },
      { cmd:'curl -s https://ifconfig.me | xargs echo',                  desc:'グローバルIP' },
      { cmd:'netstat -ant | awk \'$6=="ESTABLISHED"\' | awk -F\':\' \'{print $1}\' | sort | uniq -c | sort -nr', desc:'接続元IP頻度' },
      { cmd:'ss -s | grep "estab" | grep -oE \'estab [0-9]+\' | awk \'{print $2}\'', desc:'接続数' },
      { cmd:'dig +short <domain> | cat',                                 desc:'ドメイン→IP' },
      { cmd:'echo | openssl s_client -connect <host>:443 2>/dev/null | openssl x509 -noout -dates', desc:'SSL証明書期限' },
      { cmd:'ip addr | grep "inet " | awk \'{print $2}\'',               desc:'IP一覧' },
    ],
    // ログ/テキスト
    [
      { cmd:'awk \'$9 == 404\' /var/log/apache2/access.log | wc -l',    desc:'404回数' },
      { cmd:'awk -F\'"\' \'{print $6}\' /var/log/apache2/access.log | sort | uniq -c | sort -nr | head', desc:'アクセス上位IP' },
      { cmd:'tail -f <log> | grep --line-buffered "<err>"',              desc:'リアルタイムエラー検出' },
      { cmd:'cat <csv> | cut -d\',\' -f1,3',                             desc:'CSV抽出' },
      { cmd:'cat <file> | sed \'/^$/d\' | tee <out>',                    desc:'空行削除' },
      { cmd:'sed -n \'11,35p\'',                                          desc:'行抽出 (11-35行)' },
      { cmd:'tr \'[:upper:]\' \'[:lower:]\'',                             desc:'小文字変換' },
      { cmd:'grep -C 2 "<keyword>"',                                     desc:'前後2行表示' },
      { cmd:'sort | uniq -c | sort -nr',                                 desc:'重複行カウント' },
      { cmd:'strings | less',                                            desc:'制御文字除去' },
    ],
    // セキュリティ
    [
      { cmd:'grep "Failed password" /var/log/auth.log | awk \'{print $(NF-3)}\' | sort | uniq', desc:'SSH失敗IP' },
      { cmd:'who | awk \'{print $1" from "$5}\'',                        desc:'ログインユーザー' },
      { cmd:'find / -type d -perm -0002 -ls 2>/dev/null | grep -v "/proc"', desc:'誰でも書けるディレクトリ' },
      { cmd:'sudo getent shadow | awk -F: \'$2=="" {print $1}\'',        desc:'パスワードなしユーザー' },
      { cmd:'find /usr/bin -perm -4000 | xargs ls -l',                  desc:'SUIDバイナリ' },
      { cmd:'grep -f /etc/shells /etc/passwd | cut -d: -f1',            desc:'ログイン可能ユーザー' },
      { cmd:'grep "sudo" /var/log/auth.log | head -n 20',               desc:'sudo履歴' },
      { cmd:'echo -n "<str>" | sha256sum | cut -d\' \' -f1',             desc:'SHA-256' },
      { cmd:'sudo ls -l /proc/*/exe | awk \'{print $11}\'',              desc:'実行プロセス元' },
      { cmd:'cat /etc/passwd | cut -d: -f1 | xargs -I{} groups {}',     desc:'グループ所属' },
    ],
    // アーカイブ
    [
      { cmd:'tar -cvf - <dir> | gzip > file.tar.gz',                    desc:'圧縮' },
      { cmd:'zgrep "<str>" file.gz | head',                             desc:'gz中身確認' },
      { cmd:'find . -name "*.<ext>" -print0 | tar --null -cvf file.tar --files-from=-', desc:'拡張子でtar' },
      { cmd:'zcat file.gz | wc -l',                                      desc:'行数確認' },
      { cmd:'split -b 100M file file_part_',                             desc:'100MB分割' },
      { cmd:'find . -maxdepth 3 | sed \'s/[^/]*\\//|__/g\'',             desc:'ツリー表示' },
      { cmd:'mysqldump -u root <DB> | gzip > db_$(date +%F).sql.gz',    desc:'MySQLバックアップ' },
      { cmd:'rsync -avvn src/ dest/ | grep \'^f\'',                      desc:'rsync差分確認' },
      { cmd:'find . -mtime -1 -type f -print0 | tar --null -czvf file.tar.gz --files-from=-', desc:'24h更新バックアップ' },
      { cmd:'find <dir> -type f -mtime +7 -print0 | xargs -0 rm -f',    desc:'古いファイル削除' },
    ],
    // 高度テキスト
    [
      { cmd:'jq -r \'.id\' data.json | sort -n',                        desc:'JSON id抽出' },
      { cmd:'echo "<str>" | python3 -c "import urllib.parse,sys;print(urllib.parse.unquote(sys.stdin.read()))"', desc:'URLデコード' },
      { cmd:'shuf file | head',                                          desc:'ランダム並び替え' },
      { cmd:'expand -t 4 file | tee out',                                desc:'タブ→スペース変換' },
      { cmd:'sed \'s/[[:space:]]*$//\'',                                  desc:'行末空白削除' },
      { cmd:'grep -oE \'[0-9]+\' file | awk \'{s+=$1} END {print s}\'', desc:'数値合計' },
      { cmd:'comm -12 <(sort f1) <(sort f2)',                            desc:'共通行抽出' },
      { cmd:'awk \'NR%2==1\'',                                            desc:'奇数行のみ' },
      { cmd:'ls | xargs -I{} sh -c \'stat -c %y {}\'',                  desc:'更新日付付与' },
      { cmd:'echo "<str>" | base64 -d',                                  desc:'Base64デコード' },
    ],
    // ネット診断
    [
      { cmd:'ping -c 10 <IP> | grep "packet loss"',                     desc:'パケットロス確認' },
      { cmd:'nmap -sn <net> | grep "Nmap scan report"',                 desc:'ホスト探索' },
      { cmd:'dig ns <domain> +short',                                    desc:'NSレコード取得' },
      { cmd:'curl -I <URL> | grep -i "Server"',                         desc:'Webサーバ種別' },
      { cmd:'curl -s -o /dev/null -w "%{http_code}" <URL>',             desc:'稼働確認(HTTPコード)' },
      { cmd:'host <IP>',                                                 desc:'逆引きDNS' },
      { cmd:'curl -sI <URL> | grep "Content-Type"',                     desc:'Content-Type確認' },
      { cmd:'timeout 2 bash -c "cat < /dev/null > /dev/tcp/<host>/<port>"', desc:'ポート確認' },
      { cmd:'ip neigh show',                                             desc:'MACアドレス一覧' },
      { cmd:'time dig @<DNS> google.com',                                desc:'DNS応答時間' },
    ],
    // システム情報
    [
      { cmd:'grep -c ^processor /proc/cpuinfo',                         desc:'CPUコア数' },
      { cmd:'grep PRETTY_NAME /etc/os-release',                         desc:'OS確認' },
      { cmd:'mount | column -t',                                         desc:'パーティション一覧' },
      { cmd:'dmidecode -s system-serial-number',                        desc:'シリアル番号' },
      { cmd:'echo $PATH | tr \':\' \'\\n\'',                             desc:'PATH一覧' },
      { cmd:'cat /etc/shells',                                           desc:'シェル一覧' },
      { cmd:'lspci | grep -i vga',                                       desc:'GPU情報' },
      { cmd:'lastlog',                                                   desc:'最終ログイン一覧' },
      { cmd:'uname -r',                                                  desc:'カーネルバージョン' },
      { cmd:'locale',                                                    desc:'文字コード設定' },
    ],
    // 計算/日時
    [
      { cmd:'seq 1 93 | paste -sd+ | bc',                                desc:'1〜93の合計' },
      { cmd:'echo "scale=4;<式>" | bc',                                  desc:'小数計算' },
      { cmd:'date -d yesterday',                                          desc:'昨日の日時' },
      { cmd:'date -d @<unix>',                                            desc:'UNIX時間→日時' },
      { cmd:'stat -c %y <file>',                                          desc:'ファイル更新日' },
      { cmd:'watch -n 10 "ls -A | wc -l"',                               desc:'ファイル数監視(10s)' },
      { cmd:'cal',                                                        desc:'カレンダー表示' },
      { cmd:'date +%j',                                                   desc:'年内経過日数' },
      { cmd:'date',                                                       desc:'現在日時' },
      { cmd:'seq $(date +%m) 12 | xargs -I{} cal {}',                    desc:'残り月カレンダー' },
    ],
  ];
  let shellCatIdx  = 0;
  let shellScroll  = 0;
  let shellCursor  = 0;

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
      { id:'home',        label:'🏠HOME'   },
      { id:'character',   label:'⚔CHAR'   },
      { id:'codex',       label:'📖VIM'    },
      { id:'claudecode',  label:'🤖CLAUDE' },
      { id:'shell',       label:'$SHELL'   },
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
  // 0=continue, 1=newgame, 2=stageselect, 3=linuxbattle, 4=snake, 5=invaders, 6=tetris, 7=tutorial, 8=codex, 9=character, 10=shell, 11=ccaf
  const HOME_CURSOR_MAX = 11;

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
    ctx.fillRect(8, mqY, W - 16, 132);
    ctx.strokeStyle = '#2255aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, mqY, W - 16, 132);

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
      { id:'continue',    label:'► CONTINUE',     sub: 'World ' + Math.min(world,50) + '-' + stage, color:'#44ff88' },
      { id:'newgame',     label:'  NEW GAME',      sub: '最初からスタート',                          color:'#ffaa44' },
      { id:'stageselect', label:'  STAGE SELECT',  sub: 'ワールド選択',                            color:'#88aaff' },
    ];
    vmButtons.forEach(function(btn, i) {
      const by = mqY + 50 + i * 26;
      const isSel = (homeCursor === i);
      ctx.fillStyle = isSel ? 'rgba(40,80,160,0.7)' : 'rgba(10,20,50,0.5)';
      ctx.fillRect(14, by, W - 28, 22);
      if (isSel) {
        ctx.strokeStyle = btn.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(14, by, W - 28, 22);
      }
      ctx.fillStyle = isSel ? btn.color : btn.color + '88';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(btn.label, 24, by + 15);
      ctx.fillStyle = '#556677';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(btn.sub, W - 20, by + 15);
    });

    // ── Main Quest 2: Linux Battle ────────────────────────────────
    const lbY = mqY + 134;
    const lbXP  = (window.SAVE && window.SAVE.lb_xp)  || 0;
    const lbLv  = Math.max(1, Math.floor(Math.sqrt(lbXP / 5)));
    const lbCh  = (window.SAVE && window.SAVE.lb_chapter) || 0;
    const lbAreaNames = ['渋谷','新宿','原宿','秋葉原','浅草','上野','お台場','六本木','銀座','東京タワー'];
    ctx.fillStyle = 'rgba(40,10,0,0.85)';
    ctx.fillRect(8, lbY, W - 16, 76);
    ctx.strokeStyle = '#883322';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, lbY, W - 16, 76);
    ctx.fillStyle = '#ff6622';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('◉ MAIN QUEST 2', 18, lbY + 14);
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('Linux Battle', 148, lbY + 14);
    ctx.fillStyle = '#cc8866';
    ctx.font = '10px monospace';
    ctx.fillText('ターミナルを武器に悪意あるプロセスから東京を守れ！', 18, lbY + 30);
    ctx.fillStyle = '#ff9966';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('Lv.' + lbLv + '  LB-XP:' + lbXP + '  エリア:' + (lbAreaNames[Math.min(lbCh,9)] || '-'), 18, lbY + 46);
    const lbSel = (homeCursor === 3);
    ctx.fillStyle = lbSel ? 'rgba(80,30,0,0.8)' : 'rgba(30,10,0,0.5)';
    ctx.fillRect(14, lbY + 48, W - 28, 20);
    if (lbSel) { ctx.strokeStyle = '#ff8844'; ctx.lineWidth = 1; ctx.strokeRect(14, lbY + 48, W - 28, 20); }
    ctx.fillStyle = lbSel ? '#ff8844' : '#aa5522';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(lbSel ? '► LINUX BATTLE START' : '  LINUX BATTLE START', 24, lbY + 62);
    ctx.fillStyle = '#556677';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Chapter ' + (lbCh + 1) + '/10', W - 20, lbY + 62);
    ctx.textAlign = 'left';

    // ── Main Quest 3: CCA-F 試験対策 ──────────────────────────────
    const ccafY = lbY + 80;
    const ccafBest = parseInt(localStorage.getItem('ccaf_best_score') || '0', 10);
    const ccafPassed = ccafBest >= 720;
    ctx.fillStyle = 'rgba(10,5,40,0.88)';
    ctx.fillRect(8, ccafY, W - 16, 68);
    ctx.strokeStyle = '#664488';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, ccafY, W - 16, 68);
    ctx.fillStyle = '#cc88ff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('◉ MAIN QUEST 3', 18, ccafY + 14);
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('CCA-F 試験対策', 164, ccafY + 14);
    ctx.fillStyle = '#9977cc';
    ctx.font = '10px monospace';
    ctx.fillText('Claude Certified Architect Foundation — 5ドメイン全30問', 18, ccafY + 28);
    ctx.fillStyle = ccafPassed ? '#44ff88' : '#aa88cc';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(ccafBest > 0 ? 'ベストスコア: ' + ccafBest + '/1000' + (ccafPassed ? ' ✓合格済' : ' 不合格') : '未挑戦 — スコア720以上で合格', 18, ccafY + 42);
    const ccafSel = (homeCursor === 11);
    ctx.fillStyle = ccafSel ? 'rgba(80,20,120,0.85)' : 'rgba(30,10,60,0.5)';
    ctx.fillRect(14, ccafY + 46, W - 28, 18);
    if (ccafSel) { ctx.strokeStyle = '#cc88ff'; ctx.lineWidth = 1; ctx.strokeRect(14, ccafY + 46, W - 28, 18); }
    ctx.fillStyle = ccafSel ? '#cc88ff' : '#886699';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(ccafSel ? '► CCA-F 試験対策ゲームを開始' : '  CCA-F 試験対策ゲームを開始', 24, ccafY + 59);
    ctx.fillStyle = '#556677'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText('合格ライン 720/1000', W - 20, ccafY + 59);
    ctx.textAlign = 'left';

    // ── Sub Games ────────────────────────────────────────────────
    const sgY = ccafY + 72;
    ctx.fillStyle = '#445566';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('── SUB GAMES ─────────────────────────────────', 12, sgY);

    const subGames = [
      { id:'snake',    label:'VimSnake',    color:'#00ffee', cursor:4 },
      { id:'invaders', label:'VimInvaders', color:'#ff4444', cursor:5 },
      { id:'tetris',   label:'VimTetris',   color:'#cc44ff', cursor:6 },
      { id:'tutorial', label:'Tutorial',    color:'#44ff88', cursor:7 },
    ];
    const sgBW = (W - 24) / 4;
    subGames.forEach(function(sg, i) {
      const bx = 12 + i * sgBW;
      const by2 = sgY + 6;
      const isSel = (homeCursor === sg.cursor);
      ctx.fillStyle = isSel ? 'rgba(40,80,140,0.7)' : 'rgba(10,10,40,0.5)';
      ctx.fillRect(bx, by2, sgBW - 4, 26);
      if (isSel) {
        ctx.strokeStyle = sg.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by2, sgBW - 4, 26);
      }
      ctx.fillStyle = isSel ? sg.color : sg.color + '88';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sg.label, bx + (sgBW - 4) / 2, by2 + 17);
    });

    // ── Codex / Character / Community shortcuts ───────────────────
    const shortY = sgY + 36;
    const shortcuts = [
      { id:'codex',     label:'📖 Vim CODEX',  color:'#ffaa44', cursor:8 },
      { id:'character', label:'⚔ キャラ装備',  color:'#ff88ff', cursor:9 },
      { id:'shell',     label:'$ SHELL100選',  color:'#44ff88', cursor:10 },
    ];
    const shBW = Math.floor((W - 24) / shortcuts.length);
    shortcuts.forEach(function(sh, i) {
      const bx = 12 + i * shBW;
      const bw = shBW - 4;
      const isSel = (homeCursor === sh.cursor);
      ctx.fillStyle = isSel ? 'rgba(60,30,80,0.7)' : 'rgba(20,10,40,0.5)';
      ctx.fillRect(bx, shortY, bw, 24);
      if (isSel) {
        ctx.strokeStyle = sh.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, shortY, bw, 24);
      }
      ctx.fillStyle = isSel ? sh.color : sh.color + '88';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sh.label, bx + bw / 2, shortY + 16);
    });

    // ── Character Roster ─────────────────────────────────────────
    const crY = shortY + 28;
    ctx.fillStyle = 'rgba(0,0,20,0.7)';
    ctx.fillRect(8, crY, W - 16, 84);
    ctx.strokeStyle = '#223355';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, crY, W - 16, 84);
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
      const cy = crY + 12;
      const cw = crCardW - 4;
      const ch2 = 62;
      const isActive = (curCharId === ch.id);
      const isPremiumChar = (ch.id === 'mage' || ch.id === 'berserker');
      const isSponsorChar = (ch.unlockCondition === 'sponsor');
      const isLbChar     = (ch.unlockCondition === 'lb30');
      const hasPremium   = window.GamePremium && window.GamePremium.isPremium();
      const lbChCleared  = (window.SAVE && window.SAVE.lb_chapter) || 0;
      const isLocked = isPremiumChar
        ? !hasPremium
        : isSponsorChar
          ? !hasPremium
          : isLbChar
            ? lbChCleared < 30
            : (ch.unlockReq !== null && clearedCount2 < ch.unlockReq);
      const isPremium = isPremiumChar || isSponsorChar;

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
        ctx.fillText('🔒', cx + cw / 2, cy + 26);
      } else {
        _drawCharPortrait(ch.id, cx + cw / 2, cy + 24, 1.0);
      }

      // Name
      ctx.fillStyle = isActive ? '#44ff88' : (isLocked ? '#556677' : '#aaccdd');
      ctx.font = isActive ? 'bold 8px monospace' : '8px monospace';
      ctx.textAlign = 'center';
      const shortName = (ch.name || ch.id).split(' ')[0].slice(0, 7);
      ctx.fillText(shortName, cx + cw / 2, cy + 44);

      // Status badge
      if (isActive) {
        ctx.fillStyle = '#44ff88';
        ctx.font = '7px monospace';
        ctx.fillText('▶使用中', cx + cw / 2, cy + 54);
      } else if (isLocked && isPremium) {
        ctx.fillStyle = '#ffaa44';
        ctx.font = '7px monospace';
        ctx.fillText('💎PREMIUM', cx + cw / 2, cy + 54);
      } else if (isLocked) {
        ctx.fillStyle = '#886644';
        ctx.font = '7px monospace';
        ctx.fillText('W' + ch.unlockReq + '制覇', cx + cw / 2, cy + 54);
      } else {
        // Stats mini
        ctx.fillStyle = '#556688';
        ctx.font = '7px monospace';
        ctx.fillText('HP' + ch.hp + ' ATK' + ch.atk, cx + cw / 2, cy + 54);
      }

      // FREE / PREMIUM tag
      if (isPremium) {
        ctx.fillStyle = 'rgba(200,120,0,0.8)';
        ctx.fillRect(cx, cy, cw, 10);
        ctx.fillStyle = '#ffdd88';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PREMIUM', cx + cw / 2, cy + 8);
      } else {
        ctx.fillStyle = 'rgba(0,80,0,0.7)';
        ctx.fillRect(cx, cy, cw, 10);
        ctx.fillStyle = '#88ff88';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FREE', cx + cw / 2, cy + 8);
      }
    });

    // ── プレミアムCTAバナー（未解放の場合のみ表示） ───────────────
    const _hasPrem = window.GamePremium && window.GamePremium.isPremium();
    if (!_hasPrem) {
      const bannerY = H - 56;
      ctx.fillStyle = 'rgba(180,100,0,0.18)';
      ctx.fillRect(8, bannerY, W - 16, 18);
      ctx.strokeStyle = 'rgba(255,170,50,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, bannerY, W - 16, 18);
      ctx.fillStyle = '#ffcc55';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💎 Warrior・Mage・Archerを解放 → Support から ¥980  |  既にお持ちの方はVIPコード入力', W / 2, bannerY + 12);
    }

    // ── Bottom hint ───────────────────────────────────────────────
    ctx.fillStyle = '#334455';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('j/k:移動  Enter:決定  2:キャラ  3:VIM  4:Claude  5:SHELL  6:コミュニティ', W / 2, H - 36);

    drawVimStatusline();
  }

  function updateHome() {
    if (justPressed('KeyJ') || justPressed('ArrowDown')) {
      const ni = (HOME_NAV_ORDER.indexOf(homeCursor) + 1) % HOME_NAV_ORDER.length;
      homeCursor = HOME_NAV_ORDER[ni];
    }
    if (justPressed('KeyK') || justPressed('ArrowUp')) {
      const ni = (HOME_NAV_ORDER.indexOf(homeCursor) - 1 + HOME_NAV_ORDER.length) % HOME_NAV_ORDER.length;
      homeCursor = HOME_NAV_ORDER[ni];
    }

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
      } else if (item === 'linuxbattle') {
        switchGame('linuxbattle');
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
      } else if (item === 'shell') {
        tab = 'shell'; shellScroll = 0; shellCursor = 0;
      } else if (item === 'ccaf') {
        switchGame('ccaf');
      }
    }

    // Quick tab switch
    if (justPressed('Digit1')) { tab = 'home'; }
    if (justPressed('Digit2')) { tab = 'character'; charSubState = 'main'; charCursor = 0; }
    if (justPressed('Digit3')) { tab = 'codex'; codexScroll = 0; codexCursor = 0; }
    if (justPressed('Digit4')) { tab = 'claudecode'; claudeScroll = 0; claudeCursor = 0; }
    if (justPressed('Digit5')) { tab = 'shell'; shellScroll = 0; shellCursor = 0; }
    if (justPressed('Digit6')) {
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
    } else if (charId === 'ninja') {
      // Ninja — dark grey with blue scarf, shuriken
      ctx.fillStyle='#1a1a2a'; ctx.fillRect(-7,4,14,13);
      ctx.fillStyle='#2a2a3a'; ctx.fillRect(-6,-8,12,14);
      ctx.fillStyle='#1a1a2a'; ctx.fillRect(-6,-10,12,4);
      ctx.fillStyle='#3366aa'; ctx.fillRect(-8,-3,16,3); // scarf
      ctx.fillStyle='#aabbcc'; ctx.fillRect(-2,-5,4,3);  // eyes visible
      ctx.fillStyle='#88aaff'; ctx.fillRect(-1,-4,2,1); ctx.fillRect(1,-4,2,1);
      // Shuriken (right hand)
      ctx.fillStyle='#888888'; ctx.fillRect(6,-2,5,5);
      ctx.fillStyle='#cccccc'; ctx.fillRect(7,-3,3,7); ctx.fillRect(4,0,9,1);
    } else if (charId === 'hacker') {
      // Hacker — hoodie with green terminal glow
      ctx.fillStyle='#111122'; ctx.fillRect(-7,4,14,13);
      ctx.fillStyle='#1a1a2a'; ctx.fillRect(-6,-8,12,14);
      ctx.fillStyle='#111122'; ctx.fillRect(-7,-10,14,4); // hood
      ctx.fillStyle='#00cc66'; ctx.fillRect(-4,-6,8,2);   // terminal glow on face
      ctx.fillStyle='#00ff88'; ctx.fillRect(-3,-5,2,2); ctx.fillRect(1,-5,2,2); // eyes
      // Laptop / terminal
      ctx.fillStyle='#222233'; ctx.fillRect(5,2,7,5);
      ctx.fillStyle='#00ff44'; ctx.fillRect(6,3,5,3);
      ctx.fillStyle='#00cc33'; ctx.fillRect(7,4,1,1); ctx.fillRect(9,4,1,1);
    } else if (charId === 'monk') {
      // Monk — golden robes, holy aura
      ctx.fillStyle='#aa8800'; ctx.fillRect(-7,4,14,13);
      ctx.fillStyle='#ccaa00'; ctx.fillRect(-6,-8,12,14);
      ctx.fillStyle='#ffdd44'; ctx.fillRect(-6,-12,12,6); // head
      ctx.fillStyle='#ffeeaa'; ctx.fillRect(-4,-10,8,5);  // face
      ctx.fillStyle='#8b6914'; ctx.fillRect(-3,-7,3,2); ctx.fillRect(0,-7,3,2);
      // Staff
      ctx.fillStyle='#884400'; ctx.fillRect(5,-14,3,26);
      ctx.fillStyle='#ffdd00'; ctx.fillRect(3,-15,7,4);
      ctx.fillStyle='#ffffff'; ctx.fillRect(5,-16,3,2);
    } else if (charId === 'berserker') {
      // Berserker — massive blood-red brute
      ctx.fillStyle='#6a0000'; ctx.fillRect(-9,3,18,14);
      ctx.fillStyle='#880000'; ctx.fillRect(-8,-8,16,13);
      ctx.fillStyle='#440000'; ctx.fillRect(-8,-12,16,6); // horned helmet
      ctx.fillStyle='#660000'; ctx.fillRect(-12,-8,4,6); ctx.fillRect(8,-8,4,6); // pauldrons
      ctx.fillStyle='#ff4444'; ctx.fillRect(-4,-6,4,3); ctx.fillRect(0,-6,4,3); // eyes
      ctx.fillStyle='#cc0000'; ctx.fillRect(-2,-5,2,2); ctx.fillRect(2,-5,2,2);
      // Axe
      ctx.fillStyle='#555555'; ctx.fillRect(7,-14,3,26);
      ctx.fillStyle='#888888'; ctx.fillRect(5,-16,8,8);
      ctx.fillStyle='#aaaaaa'; ctx.fillRect(6,-15,6,6);
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
      const _isPrem2   = (ch.id === 'mage' || ch.id === 'berserker' || ch.unlockCondition === 'sponsor');
      const _isLb2     = (ch.unlockCondition === 'lb30');
      const _prem2     = window.GamePremium && window.GamePremium.isPremium();
      const _lbCh2     = (window.SAVE && window.SAVE.lb_chapter) || 0;
      const isPremCh2  = _isPrem2;
      const hasPrem2   = _prem2;
      const isLocked   = _isPrem2 ? !_prem2 : _isLb2 ? _lbCh2 < 30 : (ch.unlockReq !== null && clearedWorlds < ch.unlockReq);

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
      } else if (isLocked && isPremCh2) {
        ctx.fillStyle = '#ffaa44';
        ctx.font = '8px monospace';
        ctx.fillText('💎 プレミアム限定', bx + 52, by + 28);
      } else if (isLocked && ch.unlockCondition === 'lb30') {
        ctx.fillStyle = '#44ff88';
        ctx.font = '8px monospace';
        ctx.fillText('🐧 LB30章クリアで解放', bx + 52, by + 28);
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
          const _isPremCh = (ch.id === 'mage' || ch.id === 'berserker' || ch.unlockCondition === 'sponsor');
          const _isLbCh  = (ch.unlockCondition === 'lb30');
          const _hasPrem = window.GamePremium && window.GamePremium.isPremium();
          const _lbCh    = (window.SAVE && window.SAVE.lb_chapter) || 0;
          const locked   = _isPremCh ? !_hasPrem : _isLbCh ? _lbCh < 30 : (ch.unlockReq !== null && clearedWorlds < ch.unlockReq);
          if (locked && _isPremCh) {
            addFlash('💎 プレミアム限定キャラです。Supportからコードを入力して解放！');
          } else if (locked && _isLbCh) {
            addFlash('🐧 LinuxBattle 30章クリアで解放されます！ 現在: ' + _lbCh + '/30');
          } else if (locked) {
            addFlash('World ' + ch.unlockReq + ' を制覇するとアンロックされます！ 現在: ' + clearedWorlds + '/' + ch.unlockReq);
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
  // ── SHELL ONE-LINER TAB ──────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  function drawShell() {
    drawStarBg();
    drawHeader();
    drawTabBar();

    const catY = 58;
    const catItems = SHELL_CATS;
    const catW = Math.floor((W - 16) / catItems.length);
    catItems.forEach(function(cat, i) {
      const bx = 8 + i * catW;
      const isSel = (shellCatIdx === i);
      ctx.fillStyle = isSel ? 'rgba(20,60,10,0.9)' : 'rgba(10,20,5,0.6)';
      ctx.fillRect(bx, catY, catW - 2, 18);
      if (isSel) { ctx.strokeStyle = '#44ff44'; ctx.lineWidth = 1; ctx.strokeRect(bx, catY, catW - 2, 18); }
      ctx.fillStyle = isSel ? '#44ff44' : '#337733';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      const shortCat = cat.slice(0, 5);
      ctx.fillText(shortCat, bx + (catW - 2) / 2, catY + 12);
    });

    const items = SHELL_DATA[shellCatIdx] || [];
    const listY = catY + 24;
    const rowH  = 36;
    const listH = H - listY - 40;
    const maxVisible = Math.floor(listH / rowH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, listY, W, listH);
    ctx.clip();

    items.slice(shellScroll, shellScroll + maxVisible).forEach(function(item, idx) {
      const i = idx + shellScroll;
      const by = listY + idx * rowH;
      const isSel = (shellCursor === i);

      ctx.fillStyle = isSel ? 'rgba(10,40,10,0.9)' : (idx % 2 === 0 ? 'rgba(5,15,5,0.6)' : 'transparent');
      ctx.fillRect(4, by + 1, W - 8, rowH - 2);
      if (isSel) {
        ctx.strokeStyle = '#44ff44'; ctx.lineWidth = 1;
        ctx.strokeRect(4, by + 1, W - 8, rowH - 2);
      }

      // Line number
      ctx.fillStyle = '#336633';
      ctx.font = '8px monospace'; ctx.textAlign = 'right';
      ctx.fillText((i + 1), 22, by + 14);

      // Command
      ctx.fillStyle = isSel ? '#88ffaa' : '#44cc44';
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
      const cmdStr = item.cmd.length > 54 ? item.cmd.slice(0, 52) + '…' : item.cmd;
      ctx.fillText('$ ' + cmdStr, 26, by + 14);

      // Description
      ctx.fillStyle = '#779977';
      ctx.font = '8px monospace';
      ctx.fillText('# ' + item.desc, 26, by + 27);
    });

    ctx.restore();

    // Scroll indicator
    if (items.length > maxVisible) {
      const sbX = W - 5, sbH = listH;
      const thumbH = Math.max(12, (maxVisible / items.length) * sbH);
      const thumbY = listY + (shellScroll / Math.max(1, items.length - maxVisible)) * (sbH - thumbH);
      ctx.fillStyle = '#1a3a1a'; ctx.fillRect(sbX, listY, 4, sbH);
      ctx.fillStyle = '#44aa44'; ctx.fillRect(sbX, thumbY, 4, thumbH);
    }

    // Terminal preview panel (selected command)
    const selectedItem = items[shellCursor];
    if (selectedItem) {
      const termY = H - 68;
      ctx.fillStyle = 'rgba(0,12,0,0.95)';
      ctx.fillRect(4, termY, W - 8, 40);
      ctx.strokeStyle = '#226622'; ctx.lineWidth = 1;
      ctx.strokeRect(4, termY, W - 8, 40);
      ctx.fillStyle = '#44ff44'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'left';
      ctx.fillText('user@vimarcade:~$ ' + (selectedItem.cmd.length > 50 ? selectedItem.cmd.slice(0,48)+'…' : selectedItem.cmd), 8, termY + 14);
      ctx.fillStyle = '#88ffaa'; ctx.font = '8px monospace';
      ctx.fillText('# ' + selectedItem.desc + '   [Enter:クリップボードにコピー]', 8, termY + 28);
    }

    // Bottom hint
    ctx.fillStyle = '#336633';
    ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('j/k:移動  h/l:カテゴリ  Enter:コピー  :wq=HOME', W / 2, H - 26);

    drawVimStatusline();
  }

  function updateShell() {
    const items = SHELL_DATA[shellCatIdx] || [];
    const maxVisible = Math.floor((H - 82 - 40) / 36);

    if (justPressed('KeyJ') || justPressed('ArrowDown')) {
      shellCursor = Math.min(shellCursor + 1, items.length - 1);
      if (shellCursor >= shellScroll + maxVisible) shellScroll = shellCursor - maxVisible + 1;
    }
    if (justPressed('KeyK') || justPressed('ArrowUp')) {
      shellCursor = Math.max(shellCursor - 1, 0);
      if (shellCursor < shellScroll) shellScroll = shellCursor;
    }
    if (justPressed('KeyL') || justPressed('ArrowRight')) {
      shellCatIdx = (shellCatIdx + 1) % SHELL_CATS.length;
      shellScroll = 0; shellCursor = 0;
    }
    if (justPressed('KeyH') || justPressed('ArrowLeft')) {
      shellCatIdx = (shellCatIdx - 1 + SHELL_CATS.length) % SHELL_CATS.length;
      shellScroll = 0; shellCursor = 0;
    }
    if (isEnter()) {
      const item = items[shellCursor];
      if (item) {
        // Copy to clipboard if available
        if (navigator && navigator.clipboard) {
          navigator.clipboard.writeText(item.cmd).catch(function() {});
        }
        addFlash('$ ' + item.cmd.slice(0, 48));
      }
    }
    if (justPressed('Escape')) { tab = 'home'; }
    if (justPressed('Digit1')) tab = 'home';
    if (justPressed('Digit2')) { tab = 'character'; charSubState = 'main'; charCursor = 0; }
    if (justPressed('Digit3')) { tab = 'codex'; codexScroll = 0; codexCursor = 0; }
    if (justPressed('Digit4')) { tab = 'claudecode'; claudeScroll = 0; claudeCursor = 0; }
    if (justPressed('Digit5')) { /* stay */ }
  }

  // ─────────────────────────────────────────────────────────────────
  // ── COMMUNITY TAB ────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  function updateCommunityTab() {
    if (justPressed('KeyJ') || justPressed('ArrowDown')) commScroll++;
    if (justPressed('KeyK') || justPressed('ArrowUp'))   commScroll = Math.max(0, commScroll - 1);
    if (justPressed('Escape') || justPressed('Digit1'))  tab = 'home';
  }

  function drawCommunityTab() {
    drawStarBg();
    drawHeader();

    // Tab bar
    const tabs = [
      {k:'1', l:'HOME'},
      {k:'2', l:'キャラ'},
      {k:'3', l:'VIM'},
      {k:'4', l:'CLAUDE'},
      {k:'5', l:'SHELL'},
      {k:'6', l:'コミュニティ'},
    ];
    const tw = Math.floor(W / tabs.length);
    tabs.forEach(function(t, i) {
      const active = (i === 5);
      ctx.fillStyle = active ? 'rgba(80,120,220,0.7)' : 'rgba(10,15,40,0.5)';
      ctx.fillRect(i * tw, 18, tw - 1, 18);
      ctx.fillStyle = active ? '#aaccff' : '#334466';
      ctx.font = (active ? 'bold ' : '') + '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.k + ':' + t.l, i * tw + tw / 2, 31);
    });

    const startY = 42;
    ctx.fillStyle = '#aaccff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🌐 VIM ARCADE コミュニティ', W / 2, startY + 14);

    // Leaderboard from community module
    const lbData = (window._communityLB || []);
    const tips    = (window._communityTips || []);

    // Leaderboard box
    const lbBoxY = startY + 28;
    ctx.fillStyle = 'rgba(5,10,30,0.85)';
    ctx.fillRect(8, lbBoxY, W / 2 - 14, 220);
    ctx.strokeStyle = '#2244aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, lbBoxY, W / 2 - 14, 220);
    ctx.fillStyle = '#5599ff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 ランキング', 16, lbBoxY + 14);

    if (lbData.length === 0) {
      ctx.fillStyle = '#334455';
      ctx.font = '9px monospace';
      ctx.fillText('データなし（Firebaseを設定してください）', 16, lbBoxY + 35);
    } else {
      lbData.slice(commScroll, commScroll + 10).forEach(function(entry, i) {
        const ey = lbBoxY + 26 + i * 18;
        const rankColors = ['#ffdd44','#aaaaaa','#cc8844'];
        ctx.fillStyle = rankColors[i + commScroll] || '#556677';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('#' + (i + 1 + commScroll), 14, ey);
        ctx.fillStyle = '#ddeeff';
        ctx.fillText((entry.name || '???').slice(0, 12), 38, ey);
        ctx.fillStyle = '#44ff88';
        ctx.textAlign = 'right';
        ctx.fillText(entry.score || 0, W / 2 - 18, ey);
        ctx.textAlign = 'left';
      });
    }

    // Tips box
    const tipsBoxX = W / 2 + 4;
    const tipsBoxW = W / 2 - 14;
    ctx.fillStyle = 'rgba(5,10,30,0.85)';
    ctx.fillRect(tipsBoxX, lbBoxY, tipsBoxW, 220);
    ctx.strokeStyle = '#224422';
    ctx.lineWidth = 1;
    ctx.strokeRect(tipsBoxX, lbBoxY, tipsBoxW, 220);
    ctx.fillStyle = '#44ff88';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('💬 攻略Tips', tipsBoxX + 8, lbBoxY + 14);

    if (tips.length === 0) {
      ctx.fillStyle = '#334455';
      ctx.font = '9px monospace';
      ctx.fillText('Tipsなし（コミュニティに投稿しよう！）', tipsBoxX + 8, lbBoxY + 35);
    } else {
      tips.slice(commScroll, commScroll + 9).forEach(function(tip, i) {
        const ey = lbBoxY + 26 + i * 21;
        ctx.fillStyle = '#88aacc';
        ctx.font = '8px monospace';
        // word wrap tips at ~35 chars
        var txt = (tip.text || tip).slice(0, 34);
        ctx.fillText(txt, tipsBoxX + 8, ey);
        if (tip.author) {
          ctx.fillStyle = '#445566';
          ctx.fillText('— ' + (tip.author).slice(0, 10), tipsBoxX + 8, ey + 11);
        }
      });
    }

    // Player stats box
    const statY = lbBoxY + 230;
    const myXP = (window.SAVE && window.SAVE.vimXP) || 0;
    const myWorld = (window.SAVE && window.SAVE.clearedWorlds) ? Object.keys(window.SAVE.clearedWorlds).length : 0;
    const myLv  = (window.SAVE && window.SAVE.level) || 1;
    const myChar = (window.SAVE && window.SAVE.character) || 'vimman';
    ctx.fillStyle = 'rgba(10,20,50,0.8)';
    ctx.fillRect(8, statY, W - 16, 52);
    ctx.strokeStyle = '#334466';
    ctx.strokeRect(8, statY, W - 16, 52);
    ctx.fillStyle = '#5599ff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('📊 あなたのステータス', 18, statY + 14);
    ctx.fillStyle = '#aaccdd';
    ctx.font = '9px monospace';
    ctx.fillText('Lv.' + myLv + '  |  VimXP: ' + myXP + '  |  World: ' + myWorld + '/50  |  キャラ: ' + myChar, 18, statY + 28);
    ctx.fillStyle = '#334455';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('j/k: スクロール   Esc/1: HOME   6: このタブ', W / 2, statY + 44);

    drawVimStatusline();
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
    addFlash('VIM ARCADE  1:HOME  2:キャラ  3:VIM  4:CLAUDE  5:SHELL  6:コミュニティ  j/k:移動');
  }

  function update() {
    if (tab === 'home')            updateHome();
    else if (tab === 'character')  updateCharacter();
    else if (tab === 'codex')      updateCodex();
    else if (tab === 'claudecode') updateClaudeCode();
    else if (tab === 'shell')      updateShell();
    else if (tab === 'community')  updateCommunityTab();

    // Global tab shortcuts
    if (tab !== 'home'      && justPressed('Digit1')) tab = 'home';
    if (tab !== 'character' && justPressed('Digit2')) { tab = 'character'; charSubState = 'main'; charCursor = 0; }
    if (tab !== 'codex'     && justPressed('Digit3')) { tab = 'codex'; codexScroll = 0; codexCursor = 0; }
    if (tab !== 'claudecode'&& justPressed('Digit4')) { tab = 'claudecode'; claudeScroll = 0; claudeCursor = 0; }
    if (tab !== 'community' && justPressed('Digit6')) { tab = 'community'; commScroll = 0; }
  }

  function draw() {
    ctx.globalAlpha = 1;
    if (tab === 'home')            drawHome();
    else if (tab === 'character')  drawCharacter();
    else if (tab === 'codex')      drawCodex();
    else if (tab === 'claudecode') drawClaudeCode();
    else if (tab === 'shell')      drawShell();
    else if (tab === 'community')  drawCommunityTab();
    ctx.globalAlpha = 1;
  }

  function onKey(e) {
    // no additional handling needed
  }

  function onClick(cx, cy) {
    if (tab !== 'home') return;
    // Detect click on MAIN QUEST 3 (CCA-F) region
    // ccafY = mqY(68) + lbY_offset(134) + 80 = 282
    const ccafY = 282;
    if (cx >= 8 && cx <= W - 16 && cy >= ccafY && cy <= ccafY + 68) {
      homeCursor = 11;
      switchGame('ccaf');
    }
    // Detect click on MAIN QUEST 2 (Linux Battle) region
    // lbY = 68 + 134 = 202
    const lbY = 202;
    if (cx >= 8 && cx <= W - 16 && cy >= lbY && cy <= lbY + 76) {
      homeCursor = 3;
      switchGame('linuxbattle');
    }
  }

  return { init:init, update:update, draw:draw, onKey:onKey, onClick:onClick };
})();
