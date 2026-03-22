// ── LINUXBATTLE.JS ── Terminal Chronicles: Linux Command Battle RPG ──
var linuxBattleGame = (function() {

  // ── Tile constants ──────────────────────────────────────────────
  var TILE=16, MAP_W=80, MAP_H=60;
  var T_ROAD=0,T_BLDG=1,T_GRASS=2,T_WATER=3,T_TALL=4,T_RAIL=5,T_DOOR=6,T_SAND=7,T_SIGN=8,T_TREE=9;

  // ── Story chapters ──────────────────────────────────────────────
  var CHAPTERS = [
    { id:0, area:'渋谷',      title:'Chapter 1: 初めてのターミナル',
      story:['年は20XX年。東京のデジタルインフラが崩壊の危機に瀕していた。','悪意あるプロセス軍団が都市システムを侵食し始めた。','君は新人Linuxエンジニアとして採用された。','「まずは基本を覚えろ。ターミナルは君の剣だ」——師匠 Torvalds'],
      philosophy:'Unix哲学: 一つのことをうまくやれ (Do one thing well)',
      objective:'ls・cat・echo の基本コマンドで BugProcess を撃退せよ',
      unlockCmds:['ls','cat','echo','pwd'], unlockLang:null, color:'#ff6699', bgm:'overworld', tier:1, bossName:'渋谷バグボス' },
    { id:1, area:'新宿',      title:'Chapter 2: パターン検索の戦士',
      story:['渋谷を制した君の前に新たな敵——DaemonBot！','「grepを使え。パターンを見つければ勝てる」','Unixパイプはコマンドをつなぐ最強の武器だ。'],
      philosophy:'Unix哲学: テキストストリームは汎用インターフェースだ',
      objective:'grep・find で DaemonBot のエラーパターンを追跡せよ',
      unlockCmds:['grep','find','wc'], unlockLang:null, color:'#6699ff', bgm:'overworld', tier:1, bossName:'新宿デーモン' },
    { id:2, area:'原宿',      title:'Chapter 3: パーミッションの迷宮',
      story:['原宿のファイルシステムは権限設定が狂っていた。','「chmod 777 は危険だ。最小権限の原則を守れ！」','ls -la で詳細を確認し、適切な権限に修正せよ。'],
      philosophy:'最小権限の原則: 必要最低限のアクセスのみ許可せよ',
      objective:'ls -la・chmod で権限を修正し、PermissionBug を倒せ',
      unlockCmds:['ls_la','chmod','cp','mv'], unlockLang:null, color:'#ff99cc', bgm:'overworld', tier:2, bossName:'原宿パーミッション鬼' },
    { id:3, area:'秋葉原',    title:'Chapter 4: プロセス管理の達人',
      story:['秋葉原の電気街に暴走プロセス軍団が出現！','ps と kill でプロセスを管理しなければシステムが落ちる。','「ゾンビプロセスを放置するな！」'],
      philosophy:'Everything is a file: Unixではすべてをファイルとして扱う',
      objective:'ps・kill -9 でゾンビプロセスを一掃せよ',
      unlockCmds:['ps','kill9','df','top'], unlockLang:null, color:'#66ccff', bgm:'overworld', tier:2, bossName:'秋葉原ゾンビプロセス' },
    { id:4, area:'浅草',      title:'Chapter 5: ネットワーク防衛戦',
      story:['浅草のネットワークが外部から攻撃されている！','curl と ping で通信状態を診断し、侵入を防げ。','この戦いでPythonの力が目覚めた——スクリプトは武器だ。'],
      philosophy:'ゼロトラスト: ネットワークは信頼しない、常に検証せよ',
      objective:'curl・ping で NetworkTroll を追い詰めよ',
      unlockCmds:['curl','ping','ss','netstat'], unlockLang:'python', color:'#ffcc66', bgm:'overworld', tier:3, bossName:'浅草ネットワーク鬼' },
    { id:5, area:'上野',      title:'Chapter 6: シェルスクリプトの魔術師',
      story:['上野公園のシステムがマルウェアに乗っ取られた！','awk と sed でデータを変換し、システムを取り戻せ。','Javaコンパイルの力が新たなスキルとして覚醒した。'],
      philosophy:'自動化: 繰り返し作業はスクリプトに任せよ',
      objective:'awk・sed・sort で ScriptKiddie を粉砕せよ',
      unlockCmds:['awk','sed','sort','uniq'], unlockLang:'java', color:'#99ff66', bgm:'overworld', tier:3, bossName:'上野スクリプト魔' },
    { id:6, area:'お台場',    title:'Chapter 7: コンテナ革命',
      story:['お台場——最先端技術の聖地。Dockerコンテナが暴走中！','TypeScriptの型安全性が新たな防御スキルとして覚醒した。','「型は嘘をつかない——TypeScriptで敵の攻撃を無効化せよ」'],
      philosophy:'コンテナ: 環境の一貫性と再現性を保証する',
      objective:'docker コマンドで ContainerBeast を封じ込めよ',
      unlockCmds:['docker','tar','rsync'], unlockLang:'typescript', color:'#66ffcc', bgm:'overworld', tier:4, bossName:'お台場コンテナ獣' },
    { id:7, area:'六本木',    title:'Chapter 8: セキュリティの砦',
      story:['六本木——ハッカー集団が企業データを狙っている！','iptables と ssh-keygen でシステムを防衛せよ。','Rustの所有権システムが最強の盾となった。'],
      philosophy:'多層防御: 一つの防御線に頼るな、多層で守れ',
      objective:'iptables・ssh で HackerElite を撃退せよ',
      unlockCmds:['ssh','iptables','chmod_x'], unlockLang:'rust', color:'#cc66ff', bgm:'overworld', tier:4, bossName:'六本木ハッカー' },
    { id:8, area:'銀座',      title:'Chapter 9: カーネルパニック',
      story:['銀座の基幹システムでカーネルパニックが発生！','systemctl と journalctl でシステムを診断し、復旧せよ。','「ログを読めば原因がわかる」——師匠 Torvalds 最後の教え'],
      philosophy:'可観測性: ログ・メトリクス・トレースで真実を知れ',
      objective:'systemctl・journalctl で KernelPanicBoss を鎮圧せよ',
      unlockCmds:['systemctl','journalctl','lsof'], unlockLang:null, color:'#ffaa44', bgm:'overworld', tier:5, bossName:'銀座カーネルパニック' },
    { id:9, area:'東京タワー',title:'Chapter 10: 最終決戦',
      story:['ついに東京タワーの頂上へ——。','NULL_DRAGON が待ち構えていた。','「お前がLinuxを極めた最後のエンジニアか...」','「ターミナルがある限り、私は負けない！」'],
      philosophy:'Unix哲学の集大成: シンプル・明確・強力',
      objective:'全コマンド・全スキルで NULL_DRAGON を倒せ！',
      unlockCmds:['sudo','dd'], unlockLang:'go', color:'#ff4444', bgm:'boss', tier:5, bossName:'NULL_DRAGON' },
  ];

  // ── Command tree (unlock by player level) ───────────────────────
  var COMMAND_TREE = [
    {id:'ls',      name:'ls',             lv:1,  atk:1.0, mpCost:0,  eff:'damage', desc:'一覧→ダメージ'},
    {id:'cat',     name:'cat',            lv:1,  atk:0.0, mpCost:0,  eff:'heal',   desc:'内容表示→HP+15%'},
    {id:'echo',    name:'echo',           lv:1,  atk:0.5, mpCost:0,  eff:'buff',   desc:'出力→ATK+2(2T)'},
    {id:'pwd',     name:'pwd',            lv:2,  atk:0.0, mpCost:0,  eff:'scan',   desc:'位置確認→敵HP表示'},
    {id:'grep',    name:'grep',           lv:3,  atk:1.2, mpCost:0,  eff:'debuff', desc:'検索→敵DEF低下'},
    {id:'find',    name:'find -name',     lv:5,  atk:0.7, mpCost:5,  eff:'multi',  desc:'検索→3ヒット'},
    {id:'ls_la',   name:'ls -la',         lv:5,  atk:1.3, mpCost:0,  eff:'scan2',  desc:'詳細→弱点暴露'},
    {id:'wc',      name:'wc -l',          lv:5,  atk:0.8, mpCost:0,  eff:'damage', desc:'カウント攻撃'},
    {id:'chmod',   name:'chmod',          lv:7,  atk:0.0, mpCost:8,  eff:'shield', desc:'権限→シールド2T'},
    {id:'cp',      name:'cp -r',          lv:6,  atk:0.0, mpCost:5,  eff:'clone',  desc:'コピー→HP+30%'},
    {id:'mv',      name:'mv',             lv:6,  atk:1.5, mpCost:5,  eff:'swap',   desc:'移動→敵ATK↔DEF'},
    {id:'ps',      name:'ps aux',         lv:10, atk:1.0, mpCost:5,  eff:'scan',   desc:'プロセス確認'},
    {id:'kill9',   name:'kill -9',        lv:11, atk:3.0, mpCost:10, eff:'damage', desc:'強制終了→大ダメ'},
    {id:'df',      name:'df -h',          lv:10, atk:0.5, mpCost:0,  eff:'scan',   desc:'ディスク確認'},
    {id:'awk',     name:"awk '{}'",       lv:12, atk:2.0, mpCost:10, eff:'aoe',    desc:'テキスト→全体攻撃'},
    {id:'sed',     name:"sed 's/a/b/'",   lv:13, atk:1.5, mpCost:8,  eff:'debuff', desc:'編集→弱体化'},
    {id:'sort',    name:'sort|uniq',      lv:12, atk:0.0, mpCost:5,  eff:'stun',   desc:'整列→敵スタン2T'},
    {id:'curl',    name:'curl --retry',   lv:8,  atk:0.0, mpCost:10, eff:'heal',   desc:'HTTP→HP+25%'},
    {id:'ping',    name:'ping -c4',       lv:8,  atk:0.8, mpCost:5,  eff:'probe',  desc:'疎通→情報取得'},
    {id:'ssh',     name:'ssh -i key',     lv:15, atk:2.5, mpCost:15, eff:'bypass', desc:'SSH→防御無視攻撃'},
    {id:'tar',     name:'tar -czf',       lv:14, atk:0.0, mpCost:12, eff:'seal',   desc:'圧縮→スキル封印3T'},
    {id:'rsync',   name:'rsync -avz',     lv:14, atk:1.0, mpCost:10, eff:'copy',   desc:'同期→直前技コピー'},
    {id:'docker',  name:'docker rm -f',   lv:20, atk:3.5, mpCost:20, eff:'multi',  desc:'削除→3ヒット'},
    {id:'iptables',name:'iptables -j DROP',lv:22,atk:0.0, mpCost:20, eff:'reflect',desc:'遮断→ダメージ反射'},
    {id:'systemctl',name:'systemctl stop',lv:22, atk:4.0, mpCost:25, eff:'damage', desc:'停止→大ダメージ'},
    {id:'sudo',    name:'sudo !!',        lv:18, atk:4.0, mpCost:30, eff:'damage', desc:'特権→超大ダメージ'},
    {id:'dd',      name:'dd if=/dev/random',lv:20,atk:5.0,mpCost:35, eff:'random', desc:'乱数→ランダム超ダメ'},
  ];

  // ── Hardware equipment DB ───────────────────────────────────────
  var HARDWARE_DB = {
    weapon:[
      {id:'cpu_celeron',name:'Celeron G6900',  lv:1,  atk:2,  drop:0,  desc:'初期CPU'},
      {id:'cpu_i3',     name:'Core i3-13100',  lv:3,  atk:5,  drop:15, desc:'基本CPU. ATK+5'},
      {id:'cpu_i5',     name:'Core i5-13600K', lv:8,  atk:10, drop:35, desc:'ミドルCPU. ATK+10'},
      {id:'cpu_r5',     name:'Ryzen 5 7600X',  lv:12, atk:15, drop:55, desc:'マルチコア. ATK+15'},
      {id:'cpu_i9',     name:'Core i9-14900K', lv:18, atk:22, drop:90, desc:'最強CPU. ATK+22'},
      {id:'gpu_3060',   name:'RTX 3060 12GB',  lv:10, atk:12, drop:45, desc:'GPU: 技+20%'},
      {id:'gpu_4090',   name:'RTX 4090 24GB',  lv:25, atk:30, drop:130,desc:'最強GPU. ATK+30'},
    ],
    armor:[
      {id:'ram_4g',  name:'DDR4 4GB',       lv:1,  hp:20,  def:0, drop:0,  desc:'最小メモリ'},
      {id:'ram_8g',  name:'DDR4 8GB',       lv:3,  hp:40,  def:1, drop:15, desc:'標準メモリ. HP+40'},
      {id:'ram_16g', name:'DDR5 16GB',      lv:8,  hp:80,  def:2, drop:35, desc:'快適メモリ. HP+80'},
      {id:'ram_32g', name:'DDR5 32GB',      lv:15, hp:150, def:4, drop:65, desc:'余裕メモリ. HP+150'},
      {id:'ram_64g', name:'DDR5 64GB',      lv:22, hp:280, def:6, drop:110,desc:'プロ仕様. HP+280'},
      {id:'ssd_sata',name:'SATA SSD 512GB', lv:4,  hp:30,  def:1, drop:20, desc:'標準SSD. HP+30'},
      {id:'ssd_nvme',name:'NVMe SSD 2TB',   lv:12, hp:60,  def:3, drop:55, desc:'高速SSD. DEF+3'},
    ],
    accessory:[
      {id:'kb_mem',  name:'メンブレンKB',        lv:1,  mp:0,  spd:0, drop:0,  desc:'入門KB'},
      {id:'kb_mech', name:'メカニカルKB',         lv:4,  mp:10, spd:1, drop:20, desc:'MP+10, SPD+1'},
      {id:'kb_hhkb', name:'HHKB Professional',   lv:12, mp:30, spd:3, drop:65, desc:'MP+30, SPD+3'},
      {id:'mon_fhd', name:'FHD 1080p LCD',        lv:2,  mp:5,  spd:0, drop:10, desc:'命中+5%'},
      {id:'mon_4k',  name:'4K OLED 32型',         lv:10, mp:20, spd:0, drop:50, desc:'命中+10%'},
      {id:'rpi4',    name:'Raspberry Pi 4',       lv:5,  mp:15, spd:0, drop:25, desc:'XP+20%'},
      {id:'usb4hub', name:'USB4 ハブ',             lv:8,  mp:25, spd:1, drop:38, desc:'MP+25, SPD+1'},
    ],
  };

  // ── Language skills (unlock by chapter + level) ─────────────────
  var LANG_SKILLS = [
    {id:'python', name:'Python スクリプト', icon:'🐍', lv:5,  mpCost:20, eff:'triple',   atk:1.5, hits:3, desc:'3連続スクリプト攻撃',     unlockCh:4},
    {id:'java',   name:'Java コンパイル',   icon:'☕', lv:10, mpCost:25, eff:'charge',   atk:4.0,         desc:'次ターン超ダメージ蓄積',   unlockCh:5},
    {id:'ts',     name:'TypeScript 型安全', icon:'🔷', lv:15, mpCost:20, eff:'nullify',                   desc:'次の敵攻撃を型エラーで無効', unlockCh:6},
    {id:'rust',   name:'Rust 所有権',       icon:'⚙',  lv:20, mpCost:35, eff:'ironwall',                  desc:'3ターン完全防御',           unlockCh:7},
    {id:'go',     name:'Go 並列処理',       icon:'🐹', lv:25, mpCost:30, eff:'goroutine',atk:1.2, hits:5, desc:'並列5回攻撃',              unlockCh:9},
  ];

  // ── Quiz DB (LinuC-style + TypeScript + Python + Java) ──────────
  var QUIZ_DB = [
    {q:'隠しファイルも含めて一覧表示するオプションは？',c:['ls -a','ls -l','ls -h','ls -r'],ans:0,exp:'ls -a でドットファイルも表示',lv:1,type:'linux'},
    {q:'ファイルの最後10行を表示するコマンドは？',c:['tail file','head file','cat file','less file'],ans:0,exp:'tail はデフォルト末尾10行',lv:1,type:'linux'},
    {q:'"error"を含む行を検索するコマンドは？',c:['grep "error" f','find "error" f','awk "error" f','sed "error" f'],ans:0,exp:'grep はパターンマッチで行を抽出',lv:1,type:'linux'},
    {q:'ファイルのパーミッションを755にするコマンドは？',c:['chmod 755 f','chown 755 f','chgrp 755 f','chmod 577 f'],ans:0,exp:'chmod 数値 でパーミッション変更',lv:1,type:'linux'},
    {q:'現在のディレクトリパスを表示するコマンドは？',c:['pwd','cwd','path','dir'],ans:0,exp:'pwd: print working directory',lv:1,type:'linux'},
    {q:'ファイルの行数・単語数を表示するコマンドは？',c:['wc file','count file','ls -s file','stat file'],ans:0,exp:'wc (word count) で統計表示',lv:1,type:'linux'},
    {q:'パーミッション644の意味は？',c:['rw-r--r--','rwxr-xr-x','rwxrwxrwx','r--r--r--'],ans:0,exp:'6=rw-, 4=r--, 4=r-- 所有者:読書,他:読のみ',lv:1,type:'linux'},
    {q:'全ユーザーのプロセスを確認するコマンドは？',c:['ps aux','ls -l','df -h','top -n1'],ans:0,exp:'ps aux で全ユーザーの全プロセスを表示',lv:2,type:'linux'},
    {q:'ネットワークの疎通確認コマンドは？',c:['ping host','curl host','ssh host','nc host'],ans:0,exp:'ping はICMPで疎通を確認する',lv:2,type:'linux'},
    {q:'テキストを行単位で並べ替えるコマンドは？',c:['sort file','order file','arrange file','grep -n file'],ans:0,exp:'sort でアルファベット順などに並べ替え',lv:2,type:'linux'},
    {q:'連続する重複行を除去するコマンドは？',c:['uniq','unique','dedup','rmdup'],ans:0,exp:'uniq は連続重複行を除去。sort|uniq で全重複除去',lv:2,type:'linux'},
    {q:'HTTPリクエストを送信するコマンドは？',c:['curl URL','http URL','get URL','fetch URL'],ans:0,exp:'curl でHTTP/FTPなどのデータ転送',lv:2,type:'linux'},
    {q:'ファイル末尾に追記するリダイレクト記号は？',c:['>>','>',' |','<'],ans:0,exp:'>> は追記。> は上書き。| はパイプ',lv:2,type:'linux'},
    {q:'プロセスを強制終了するシグナル番号は？',c:['kill -9 (SIGKILL)','kill -15 (SIGTERM)','kill -1 (SIGHUP)','kill -2 (SIGINT)'],ans:0,exp:'SIGKILL(9)は強制終了でトラップ不可',lv:2,type:'linux'},
    {q:'ファイルを再帰的に検索するコマンドは？',c:['find / -name "f"','locate "f" /','search "f"','grep -r "f" /'],ans:0,exp:'find は条件を指定してファイルを検索する',lv:2,type:'linux'},
    {q:'ディスク使用量を表示するコマンドは？',c:['df -h','du -s','ls -s','stat -f'],ans:0,exp:'df -h でファイルシステム使用量を人間が読める形式で',lv:3,type:'linux'},
    {q:'systemdでサービスを起動するコマンドは？',c:['systemctl start s','service s start','init s start','daemon s start'],ans:0,exp:'systemctl start でsystemdサービスを起動',lv:3,type:'linux'},
    {q:'SSH公開鍵ペアを生成するコマンドは？',c:['ssh-keygen -t rsa','ssh-keyscan','ssh-copy-id','openssl genrsa'],ans:0,exp:'ssh-keygen でRSAなどのキーペアを生成',lv:3,type:'linux'},
    {q:'Dockerコンテナの一覧を表示するコマンドは？',c:['docker ps','docker ls','docker list','docker show'],ans:0,exp:'docker ps で実行中コンテナを表示。-a で停止中も',lv:3,type:'linux'},
    {q:'tarでgzip圧縮アーカイブを作成するオプションは？',c:['tar -czf a.tgz dir/','tar -xzf a.tgz','tar -tvf a.tgz','tar -rf a.tgz dir/'],ans:0,exp:'-c:作成 -z:gzip -f:ファイル名指定',lv:3,type:'linux'},
    {q:'TypeScriptで型注釈の正しい構文は？',c:['let n: number = 5','let n = number(5)','let n :: number = 5','number n = 5'],ans:0,exp:'変数名: 型 = 値; がTypeScript型注釈',lv:2,type:'typescript'},
    {q:'TypeScriptで再代入不可の定数宣言は？',c:['const x = 10','let x = 10','var x = 10','final x = 10'],ans:0,exp:'const は再代入できない定数',lv:1,type:'typescript'},
    {q:'TypeScriptのインターフェース定義の正しい構文は？',c:['interface Foo { bar: string }','class interface Foo { }','type interface Foo { }','struct Foo { bar: string }'],ans:0,exp:'interface キーワードでオブジェクト型を定義',lv:2,type:'typescript'},
    {q:'TypeScriptでユニオン型を表す記号は？',c:['string | number','string & number','string + number','string, number'],ans:0,exp:'| でユニオン型。どちらかの型を受け入れる',lv:2,type:'typescript'},
    {q:'TypeScriptでオプショナルプロパティを表す記号は？',c:['name?: string','name! string','name? string','name?: string!'],ans:0,exp:'?: でオプショナルプロパティを定義',lv:2,type:'typescript'},
    {q:'Pythonでリストの最後の要素を取得するインデックスは？',c:['lst[-1]','lst[last]','lst.end()','lst[len-1]'],ans:0,exp:'マイナスインデックスで末尾から数える',lv:1,type:'python'},
    {q:'Pythonで1から10のrange正しい書き方は？',c:['range(1,11)','range(10)','range(1,10)','range(0,10)'],ans:0,exp:'range(start,stop) はstopを含まない',lv:1,type:'python'},
    {q:'Pythonのリスト内包表記の正しい構文は？',c:['[x*2 for x in l]','(x*2 for x in l)','[for x in l: x*2]','l.map(x=>x*2)'],ans:0,exp:'[式 for 変数 in イテラブル] がリスト内包表記',lv:2,type:'python'},
    {q:'Javaでクラスを継承するキーワードは？',c:['extends','implements','inherits','super'],ans:0,exp:'extends でクラス継承。interfaceはimplements',lv:2,type:'java'},
    {q:'Javaでnull安全にOptionalを使う正しい書き方は？',c:['Optional.ofNullable(v).orElse("x")','v.orElse("x")','Optional.get(v)','v?.orElse("x")'],ans:0,exp:'Optional.ofNullable()はnullを安全に扱うラッパー',lv:3,type:'java'},
  ];

  // ── Enemy definitions ───────────────────────────────────────────
  var ENEMY_DEFS = [
    {id:'bug',      name:'BugProcess',    hp:40,  atk:6,  def:1, xp:20,  drop:'ram_4g',  col:'#44ff44', tier:1, quizT:'linux'},
    {id:'daemon',   name:'DaemonBot',     hp:60,  atk:10, def:3, xp:35,  drop:'cpu_i3',  col:'#4488ff', tier:1, quizT:'linux'},
    {id:'zombie',   name:'ZombieThread',  hp:75,  atk:8,  def:2, xp:45,  drop:'ssd_sata',col:'#88ff44', tier:2, quizT:'linux'},
    {id:'cronbomb', name:'CronBomb',      hp:55,  atk:14, def:4, xp:55,  drop:'kb_mech', col:'#ffaa44', tier:2, quizT:'linux'},
    {id:'rootkit',  name:'RootKit',       hp:90,  atk:18, def:6, xp:80,  drop:'cpu_i5',  col:'#ff4444', tier:3, quizT:'linux'},
    {id:'segfault', name:'Segfault',      hp:80,  atk:15, def:4, xp:70,  drop:'mon_fhd', col:'#ff8800', tier:3, quizT:'linux'},
    {id:'memleak',  name:'MemoryLeak',    hp:120, atk:9,  def:3, xp:95,  drop:'ram_16g', col:'#cc44ff', tier:4, quizT:'typescript'},
    {id:'overflow', name:'StackOverflow', hp:100, atk:20, def:6, xp:110, drop:'cpu_r5',  col:'#ff6600', tier:4, quizT:'python'},
    {id:'malware',  name:'Malware.exe',   hp:140, atk:22, def:8, xp:130, drop:'gpu_3060',col:'#880000', tier:5, quizT:'java'},
    {id:'nulldragon',name:'NULL_DRAGON',  hp:500, atk:30, def:15,xp:999, drop:'gpu_4090',col:'#ff00ff', tier:5, isBoss:true, quizT:'linux'},
  ];

  // ── State variables ─────────────────────────────────────────────
  var state = 'title';
  var frame = 0;
  var storyPage = 0;
  var charCursor = 0;
  var tileMap = null;
  var playerTX=8, playerTY=4;
  var playerPX=0, playerPY=0, playerTargetX=0, playerTargetY=0;
  var playerMoving=false, playerDir=2, playerStep=0, moveDelay=0;
  var camX=0, camY=0;
  var currentArea=0, showAreaLabel=0, areaLabelText='';
  var overworldMsg='', overworldMsgTimer=0;
  var encounterTimer=0;
  var btState='choose';
  var playerHP=0, playerMaxHP=0, playerMP=0, playerMaxMP=0;
  var playerAtk=0, playerDef=0, playerAtkBuff=0;
  var playerShield=0, playerIronwall=0, playerReflect=0;
  var tsNullifyNext=false, javaCharge=0;
  var currentEnemy=null, enemyHP=0, enemyMaxHP=0, enemyDefMul=1.0;
  var enemyConfused=0, enemySealed=0;
  var battleCmds=[], cmdCursor=0, showLangMenu=false, langCursor=0;
  var btMsg='', btMsgQueue=[], btAnimTimer=0;
  var shakeX=0, shakeY=0, shakeTimer=0;
  var scanRevealed=false;
  var battleXP=0, pendingDrop=null;
  var lastCmdEff='';
  var quizQ=null, quizCursor=0, quizContext='', quizDmgPending=0;
  var equipTab=0, equipCursor=0;
  var endTimer=0, gainedXP=0, leveledUp=false;
  var battleEnemyY=0;
  var stageArea=0, stageCursor=0;
  var battleIsBoss=false, battleChapter=0;
  var stageClears=null;
  var encounterEnemy=null;

  // ── District positions ──────────────────────────────────────────
  var DISTRICT_POS = [
    {ax:1,ay:1},{ax:17,ay:1},{ax:33,ay:1},{ax:49,ay:1},{ax:65,ay:1},
    {ax:1,ay:31},{ax:17,ay:31},{ax:33,ay:31},{ax:49,ay:31},{ax:65,ay:31},
  ];

  // ── Save helpers ────────────────────────────────────────────────
  function getLbXP()  { return (window.SAVE&&window.SAVE.lb_xp)||0; }
  function getLbLv()  { return Math.max(1,Math.floor(Math.sqrt(getLbXP()/5))); }
  function getLbCh()  { return (window.SAVE&&window.SAVE.lb_chapter)||0; }
  function addLbXP(n) { if(window.SAVE){window.SAVE.lb_xp=getLbXP()+n; if(window.saveSave)window.saveSave();} }
  function getLbInv() { if(!window.SAVE)return[]; return window.SAVE.lb_inventory||(window.SAVE.lb_inventory=[]); }
  function getLbEq()  { if(!window.SAVE)return{weapon:'cpu_celeron',armor:'ram_4g',accessory:'kb_mem'}; return window.SAVE.lb_equip||(window.SAVE.lb_equip={weapon:'cpu_celeron',armor:'ram_4g',accessory:'kb_mem'}); }
  function setLbEq(slot,id){if(window.SAVE){if(!window.SAVE.lb_equip)window.SAVE.lb_equip={};window.SAVE.lb_equip[slot]=id;if(window.saveSave)window.saveSave();}}
  function addInv(id){var inv=getLbInv();if(inv.indexOf(id)<0){inv.push(id);if(window.saveSave)window.saveSave();}}
  function hasInv(id){return getLbInv().indexOf(id)>=0;}
  function getStageClear(a,s){stageClears=stageClears||(window.SAVE&&window.SAVE.lb_clear)||{};return!!stageClears[a*10+s];}
  function setStageClear(a,s){if(!window.SAVE)return;window.SAVE.lb_clear=window.SAVE.lb_clear||{};window.SAVE.lb_clear[a*10+s]=1;stageClears=window.SAVE.lb_clear;if(window.saveSave)window.saveSave();}
  function getAreaUnlock(){return Math.min(9,(window.SAVE&&window.SAVE.lb_areaUnlock)||0);}
  function setAreaUnlock(a){if(window.SAVE){window.SAVE.lb_areaUnlock=Math.max(getAreaUnlock(),a);if(window.saveSave)window.saveSave();}}

  function findHW(slot,id){var a=HARDWARE_DB[slot]||[];for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null;}
  function getStats(){
    var lv=getLbLv(),eq=getLbEq();
    var atk=5+lv*2,hp=50+lv*5,def=2+Math.floor(lv*0.5),mp=30+lv*3;
    var wd=findHW('weapon',eq.weapon); if(wd)atk+=wd.atk||0;
    var ad=findHW('armor',eq.armor);   if(ad){hp+=ad.hp||0;def+=ad.def||0;}
    var ac=findHW('accessory',eq.accessory); if(ac)mp+=ac.mp||0;
    return {atk:atk,hp:hp,def:def,mp:mp};
  }
  function getAvailCmds(){
    var lv=getLbLv(),res=[];
    for(var i=0;i<COMMAND_TREE.length;i++)if(COMMAND_TREE[i].lv<=lv)res.push(COMMAND_TREE[i]);
    return res;
  }
  function getAvailLangs(){
    var ch=getLbCh(),lv=getLbLv(),res=[];
    for(var i=0;i<LANG_SKILLS.length;i++){var sk=LANG_SKILLS[i];if(ch>=sk.unlockCh&&lv>=sk.lv)res.push(sk);}
    return res;
  }
  function pickBattleCmds(){
    var avail=getAvailCmds();
    if(avail.length<=4)return avail.slice();
    // Always include a heal/support command first
    var healCmds=avail.filter(function(c){return c.eff==='heal'||c.eff==='clone';});
    var atkCmds=avail.filter(function(c){return c.eff!=='heal'&&c.eff!=='clone';});
    var sorted=atkCmds.slice().sort(function(a,b){return b.atk-a.atk;});
    var res=[];
    // Add top attack commands
    for(var i=0;i<sorted.length&&res.length<3;i++) res.push(sorted[i]);
    // Guarantee one heal
    if(healCmds.length>0) res.push(healCmds[0]);
    // Fill remaining slots
    for(var i=0;i<avail.length&&res.length<4;i++){
      var dup=false;for(var j=0;j<res.length;j++)if(res[j].id===avail[i].id){dup=true;break;}
      if(!dup)res.push(avail[i]);
    }
    return res.slice(0,4);
  }
  function pickQuiz(type){
    var pool=[];
    for(var i=0;i<QUIZ_DB.length;i++)if(!type||QUIZ_DB[i].type===type)pool.push(QUIZ_DB[i]);
    if(!pool.length)pool=QUIZ_DB;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function scaleEnemy(def,ch){
    var mul=1+ch*0.12;
    return {id:def.id,name:def.name,col:def.col,quizT:def.quizT,isBoss:!!def.isBoss,drop:def.drop,
      hp:Math.floor(def.hp*mul),atk:Math.floor(def.atk*mul),def:Math.floor(def.def*mul),xp:Math.floor(def.xp*mul)};
  }
  function pickEnemy(ch){
    var tier=CHAPTERS[ch]?CHAPTERS[ch].tier:1,pool=[];
    for(var i=0;i<ENEMY_DEFS.length;i++){var e=ENEMY_DEFS[i];if(!e.isBoss&&e.tier>=Math.max(1,tier-1)&&e.tier<=tier)pool.push(e);}
    if(!pool.length)pool=[ENEMY_DEFS[0]];
    return scaleEnemy(pool[Math.floor(Math.random()*pool.length)],ch);
  }
  function getBoss(ch){
    if(ch===9)return scaleEnemy(ENEMY_DEFS[9],ch);
    var tier=CHAPTERS[ch]?CHAPTERS[ch].tier:1,bosses=[];
    for(var i=0;i<ENEMY_DEFS.length;i++)if(ENEMY_DEFS[i].tier===tier&&!ENEMY_DEFS[i].isBoss)bosses.push(ENEMY_DEFS[i]);
    var def=bosses[bosses.length-1]||ENEMY_DEFS[4];
    var e=scaleEnemy(def,ch);e.name='[BOSS] '+(CHAPTERS[ch].bossName||def.name);e.hp=Math.floor(e.hp*1.5);e.isBoss=true;return e;
  }

  // ── Map ─────────────────────────────────────────────────────────
  function setT(x,y,v){if(x>=0&&x<MAP_W&&y>=0&&y<MAP_H)tileMap[y*MAP_W+x]=v;}
  function getT(x,y){if(x<0||x>=MAP_W||y<0||y>=MAP_H)return T_BLDG;return tileMap[y*MAP_W+x];}
  function isWalkable(t){return t===T_ROAD||t===T_GRASS||t===T_TALL||t===T_SAND||t===T_DOOR||t===T_SIGN;}
  function getAreaAt(tx,ty){
    for(var i=0;i<DISTRICT_POS.length;i++){var p=DISTRICT_POS[i];if(tx>=p.ax&&tx<p.ax+14&&ty>=p.ay&&ty<p.ay+28)return i;}
    return 0;
  }
  function buildMap(){
    tileMap=new Uint8Array(MAP_W*MAP_H);tileMap.fill(T_BLDG);
    // Districts
    for(var di=0;di<DISTRICT_POS.length;di++){
      var p=DISTRICT_POS[di];
      for(var y=p.ay;y<p.ay+28&&y<MAP_H;y++)for(var x=p.ax;x<p.ax+14&&x<MAP_W;x++)setT(x,y,T_ROAD);
      // grass/tall patches
      for(var gy=p.ay+6;gy<p.ay+11;gy++)for(var gx=p.ax+3;gx<p.ax+10;gx++)setT(gx,gy,T_GRASS);
      for(var ty2=p.ay+13;ty2<p.ay+19;ty2++)for(var tx2=p.ax+2;tx2<p.ax+8;tx2++)setT(tx2,ty2,T_TALL);
      // trees border
      for(var ti=0;ti<6;ti++){setT(p.ax+ti*2,p.ay,T_TREE);setT(p.ax+ti*2,p.ay+5,T_TREE);}
      setT(p.ax+6,p.ay+22,T_SIGN);
      setT(p.ax+7,p.ay+23,T_DOOR);
    }
    // connector roads H
    for(var cx=0;cx<MAP_W;cx++){setT(cx,29,T_ROAD);setT(cx,30,T_ROAD);}
    // connector roads V
    var vroads=[8,24,40,56,72];
    for(var vi=0;vi<vroads.length;vi++)for(var vy=0;vy<MAP_H;vy++)setT(vroads[vi],vy,T_ROAD);
    // rail
    for(var rx=0;rx<MAP_W;rx++){setT(rx,0,T_RAIL);setT(rx,59,T_RAIL);}
    // water (Tokyo Bay)
    for(var wy=48;wy<59;wy++)for(var wx=68;wx<79;wx++)if(wy>48+(wx-68)*0.3)setT(wx,wy,T_WATER);
    // sand beach
    for(var sy=46;sy<50;sy++)for(var ssx=66;ssx<72;ssx++)if(getT(ssx,sy)===T_ROAD)setT(ssx,sy,T_SAND);
  }

  // ── Battle ──────────────────────────────────────────────────────
  function startBattle(enemy,isBoss,ch){
    var st=getStats();
    playerMaxHP=st.hp; playerHP=playerMaxHP;
    playerMaxMP=st.mp; playerMP=playerMaxMP;
    playerAtk=st.atk; playerDef=st.def; playerAtkBuff=0;
    playerShield=0; playerIronwall=0; playerReflect=0;
    tsNullifyNext=false; javaCharge=0;
    currentEnemy=enemy; enemyHP=enemy.hp; enemyMaxHP=enemy.hp;
    enemyDefMul=1.0; enemyConfused=0; enemySealed=0;
    battleCmds=pickBattleCmds(); cmdCursor=0; showLangMenu=false; langCursor=0;
    btMsg='何を使う？'; btMsgQueue=[]; btAnimTimer=0;
    shakeX=shakeY=shakeTimer=0; scanRevealed=false;
    battleXP=enemy.xp; pendingDrop=enemy.drop; lastCmdEff='';
    quizQ=null; javaCharge=0; battleIsBoss=!!isBoss; battleChapter=ch||0;
    btState='choose';
    if(window.GameAudio)window.GameAudio.playBGM(isBoss?'boss':'battle');
  }
  function qMsg(m){btMsgQueue.push(m);}
  function nextMsg(){
    if(btMsgQueue.length>0){btMsg=btMsgQueue.shift();btAnimTimer=70;return;}
    if(btState==='animp'){
      if(enemyHP<=0){doVictory();return;}
      btState='anime'; doEnemyTurn();
    } else if(btState==='anime'){
      if(playerHP<=0){doDefeat();return;}
      btState='choose'; btMsg='何を使う？';
      if(playerShield>0)playerShield--;
      if(playerIronwall>0)playerIronwall--;
      if(playerReflect>0)playerReflect--;
      if(playerAtkBuff>0)playerAtkBuff--;
      if(enemyConfused>0)enemyConfused--;
      if(enemySealed>0)enemySealed--;
    } else if(btState==='quiz'){
      btState='anime'; doEnemyTurn();
    }
  }
  function calcDmg(atkVal,defMul,eff){
    var d=Math.floor(atkVal*(0.85+Math.random()*0.3));
    if(eff!=='bypass')d=Math.floor(d/defMul);
    return Math.max(1,d);
  }
  function execCmd(cmd){
    if(playerMP<cmd.mpCost){qMsg('MPが足りない！');return;}
    playerMP=Math.max(0,playerMP-cmd.mpCost);
    var eff=cmd.eff, baseAtk=(playerAtk+(playerAtkBuff>0?2:0))*(javaCharge>0?1+javaCharge/playerAtk:1);
    javaCharge=0;
    var dmg=0;
    if(eff==='damage'||eff==='bypass'||eff==='aoe'){
      dmg=calcDmg(baseAtk*cmd.atk,(eff==='aoe'||eff==='bypass')?1:enemyDefMul,eff);
      enemyHP=Math.max(0,enemyHP-dmg); shakeTimer=8;
      qMsg(cmd.name+'！ '+dmg+'ダメージ！');
      if(window.GameAudio)window.GameAudio.sfx('attack_punch');
    } else if(eff==='heal'||eff==='clone'){
      var r=eff==='clone'?0.3:0.25;
      var h=Math.floor(playerMaxHP*r);
      playerHP=Math.min(playerMaxHP,playerHP+h);
      qMsg(cmd.name+'！ HP+'+h+'回復！');
      if(window.GameAudio)window.GameAudio.sfx('heal');
    } else if(eff==='buff'){
      playerAtkBuff=2; qMsg(cmd.name+'！ ATK+2（2ターン）！');
      if(window.GameAudio)window.GameAudio.sfx('status_buff');
    } else if(eff==='scan'||eff==='scan2'){
      scanRevealed=true; qMsg(cmd.name+'！ 敵のHPが判明した！');
      if(window.GameAudio)window.GameAudio.sfx('status_buff');
    } else if(eff==='debuff'){
      enemyDefMul=Math.min(2.5,enemyDefMul+0.5);
      qMsg(cmd.name+'！ 敵の防御が低下した！');
      if(window.GameAudio)window.GameAudio.sfx('attack_debuff');
    } else if(eff==='multi'){
      var tot=0;
      for(var i=0;i<3;i++){var d2=calcDmg(baseAtk*cmd.atk,enemyDefMul,'');enemyHP=Math.max(0,enemyHP-d2);tot+=d2;}
      shakeTimer=10; qMsg(cmd.name+'！ 3連続ヒット！ 計'+tot+'ダメージ！');
      if(window.GameAudio)window.GameAudio.sfx('attack_multi');
    } else if(eff==='shield'){
      playerShield=2; qMsg(cmd.name+'！ シールド展開（2ターン）！');
      if(window.GameAudio)window.GameAudio.sfx('shield');
    } else if(eff==='swap'){
      var tmp=enemyDefMul; enemyDefMul=Math.max(0.5,1/tmp);
      qMsg(cmd.name+'！ 敵のATKとDEFが入れ替わった！');
      if(window.GameAudio)window.GameAudio.sfx('status_confuse');
    } else if(eff==='stun'){
      enemyConfused=2; qMsg(cmd.name+'！ 敵が混乱した（2ターン）！');
      if(window.GameAudio)window.GameAudio.sfx('status_confuse');
    } else if(eff==='probe'){
      scanRevealed=true; dmg=calcDmg(baseAtk*cmd.atk,enemyDefMul,'');
      enemyHP=Math.max(0,enemyHP-dmg); shakeTimer=6;
      qMsg(cmd.name+'！ 敵情報取得＆'+dmg+'ダメージ！');
    } else if(eff==='seal'){
      enemySealed=3; qMsg(cmd.name+'！ 敵スキルを3ターン封印！');
      if(window.GameAudio)window.GameAudio.sfx('shield');
    } else if(eff==='copy'){
      if(lastCmdEff){execCmd({name:'rsync(copy)',mpCost:0,eff:lastCmdEff,atk:1.0});return;}
      else qMsg('コピーできる技がない！');
    } else if(eff==='reflect'){
      playerReflect=2; qMsg(cmd.name+'！ ダメージ反射（2ターン）！');
      if(window.GameAudio)window.GameAudio.sfx('shield');
    } else if(eff==='random'){
      dmg=Math.max(1,Math.floor((0.5+Math.random()*6)*baseAtk));
      enemyHP=Math.max(0,enemyHP-dmg); shakeTimer=12;
      qMsg(cmd.name+'！ '+dmg+'の超ランダムダメージ！');
      if(window.GameAudio)window.GameAudio.sfx('attack_random');
    }
    lastCmdEff=eff;
    btState='animp'; btAnimTimer=40;
  }
  function execLang(sk){
    if(playerMP<sk.mpCost){qMsg('MPが足りない！');return;}
    playerMP=Math.max(0,playerMP-sk.mpCost);
    if(sk.eff==='triple'){
      var tot=0;
      for(var i=0;i<(sk.hits||3);i++){var d=calcDmg(playerAtk*sk.atk,enemyDefMul,'');enemyHP=Math.max(0,enemyHP-d);tot+=d;}
      shakeTimer=12; qMsg(sk.name+'！ '+sk.hits+'連続攻撃！ 計'+tot+'ダメージ！');
      if(window.GameAudio)window.GameAudio.sfx('attack_multi');
    } else if(sk.eff==='charge'){
      javaCharge=Math.floor(playerAtk*(sk.atk-1)); qMsg(sk.name+'！ 次のコマンドに+'+javaCharge+'ダメージ追加！');
      if(window.GameAudio)window.GameAudio.sfx('status_buff');
    } else if(sk.eff==='nullify'){
      tsNullifyNext=true; qMsg(sk.name+'！ 次の敵攻撃を型エラーで無効化！');
      if(window.GameAudio)window.GameAudio.sfx('shield');
    } else if(sk.eff==='ironwall'){
      playerIronwall=3; qMsg(sk.name+'！ 3ターン完全防御！');
      if(window.GameAudio)window.GameAudio.sfx('shield');
    } else if(sk.eff==='goroutine'){
      var tot2=0;
      for(var j=0;j<(sk.hits||5);j++){var d2=calcDmg(playerAtk*sk.atk,enemyDefMul,'');enemyHP=Math.max(0,enemyHP-d2);tot2+=d2;}
      shakeTimer=15; qMsg(sk.name+'！ 並列'+sk.hits+'回攻撃！ 計'+tot2+'ダメージ！');
      if(window.GameAudio)window.GameAudio.sfx('attack_beam');
    }
    btState='animp'; btAnimTimer=40;
  }
  function doEnemyTurn(){
    if(!currentEnemy)return;
    if(enemyConfused>0&&Math.random()<0.5){
      var sd=Math.floor(currentEnemy.atk*0.4);
      enemyHP=Math.max(0,enemyHP-sd);
      qMsg(currentEnemy.name+'は混乱して自分を攻撃！ '+sd+'ダメージ！');
      if(window.GameAudio)window.GameAudio.sfx('hurt_enemy');
      return;
    }
    // 30% chance: quiz attack
    if(!enemySealed&&Math.random()<0.3){
      quizQ=pickQuiz(currentEnemy.quizT);
      var baseDmg=Math.floor(currentEnemy.atk*(0.8+Math.random()*0.4));
      if(playerShield>0)baseDmg=Math.floor(baseDmg*0.3);
      if(playerIronwall>0)baseDmg=0;
      quizDmgPending=baseDmg; quizContext='enemy_attack'; quizCursor=0;
      qMsg('【クイズ攻撃！】正解でダメージ軽減！');
      btState='quiz'; btAnimTimer=0; return;
    }
    // normal attack
    var dmg=Math.floor(currentEnemy.atk*(0.8+Math.random()*0.4));
    if(tsNullifyNext){tsNullifyNext=false;qMsg(currentEnemy.name+'の攻撃は型エラーで無効化された！');if(window.GameAudio)window.GameAudio.sfx('shield');return;}
    if(playerIronwall>0){qMsg(currentEnemy.name+'の攻撃！ 完全防御で'+dmg+'ダメージ無効！');return;}
    if(playerShield>0)dmg=Math.floor(dmg*0.3);
    if(playerReflect>0){enemyHP=Math.max(0,enemyHP-dmg);qMsg(currentEnemy.name+'の攻撃を反射！ '+dmg+'ダメージを跳ね返した！');return;}
    dmg=Math.max(1,dmg-playerDef);
    playerHP=Math.max(0,playerHP-dmg);
    qMsg(currentEnemy.name+'の攻撃！ '+dmg+'ダメージ！');
    if(window.GameAudio)window.GameAudio.sfx('hurt_player');
    shakeTimer=6;
  }
  function resolveQuiz(ansIdx){
    var correct=(ansIdx===quizQ.ans);
    if(quizContext==='enemy_attack'){
      var dmg=correct?Math.floor(quizDmgPending*0.3):quizDmgPending;
      if(correct){qMsg('正解！ '+quizQ.exp);qMsg('ダメージを70%軽減！ '+dmg+'ダメージ');}
      else{qMsg('不正解… '+quizQ.exp);qMsg('フルダメージ！ '+dmg+'ダメージ');}
      playerHP=Math.max(0,playerHP-dmg);
      if(window.GameAudio)window.GameAudio.sfx(correct?'status_buff':'hurt_player');
    }
    quizQ=null; btState='anime';
    if(playerHP<=0){doDefeat();return;}
    if(btMsgQueue.length===0)nextMsg();
  }
  function doVictory(){
    btState='result'; gainedXP=battleXP;
    var prevLv=getLbLv(); addLbXP(gainedXP); leveledUp=getLbLv()>prevLv;
    if(pendingDrop&&!hasInv(pendingDrop))addInv(pendingDrop);
    if(battleIsStage)setStageClear(stageArea,stageCursor);
    endTimer=0; btMsg='勝利！ +'+gainedXP+'XP！';
    if(window.GameAudio){window.GameAudio.sfx('victory');window.GameAudio.playBGM('victory_jingle');}
  }
  var battleIsStage=false;
  function doDefeat(){
    btState='result'; gainedXP=0; leveledUp=false; endTimer=0;
    btMsg='やられた…';
    if(window.GameAudio){window.GameAudio.stopBGM();window.GameAudio.sfx('defeat');}
  }

  // ── Update functions ────────────────────────────────────────────
  function updateTitle(){
    if(justPressed('ArrowUp')||justPressed('KeyK')){charCursor=0;if(window.GameAudio)window.GameAudio.sfx('select');}
    if(justPressed('ArrowDown')||justPressed('KeyJ')){charCursor=1;if(window.GameAudio)window.GameAudio.sfx('select');}
    if(justPressed('Enter')||justPressed('KeyZ')){
      if(charCursor===0){state='story';storyPage=0;if(window.GameAudio)window.GameAudio.sfx('confirm');}
      else{if(window.GameAudio)window.GameAudio.stopBGM();switchGame('menu');}
    }
    if(justPressed('Escape')){if(window.GameAudio)window.GameAudio.stopBGM();switchGame('menu');}
  }
  function updateStory(){
    var ch=CHAPTERS[getLbCh()]||CHAPTERS[0];
    if(justPressed('Enter')||justPressed('KeyZ')||justPressed('Space')){
      if(storyPage<ch.story.length-1){storyPage++;if(window.GameAudio)window.GameAudio.sfx('select');}
      else{state='charselect';charCursor=0;if(window.GameAudio)window.GameAudio.sfx('confirm');}
    }
    if(justPressed('Escape')){state='title';}
  }
  function updateCharSelect(){
    var defs=window.CHARACTER_DEFS||[];
    if(justPressed('ArrowLeft')||justPressed('KeyH'))charCursor=(charCursor-1+defs.length)%defs.length;
    if(justPressed('ArrowRight')||justPressed('KeyL'))charCursor=(charCursor+1)%defs.length;
    if(justPressed('Enter')||justPressed('KeyZ')){
      var ch=defs[charCursor];
      if(ch){if(window.SAVE)window.SAVE.character=ch.id;if(window.saveSave)window.saveSave();}
      state='overworld';
      if(window.GameAudio)window.GameAudio.playBGM(CHAPTERS[getLbCh()].bgm||'overworld');
    }
    if(justPressed('Escape'))state='story';
  }
  function updateOverworld(){
    frame++;
    // camera
    var tcx=playerPX-Math.floor(W/2)+TILE/2, tcy=playerPY-Math.floor(H/2)+TILE/2;
    camX+=(tcx-camX)*0.12; camY+=(tcy-camY)*0.12;
    camX=Math.max(0,Math.min(MAP_W*TILE-W,camX));
    camY=Math.max(0,Math.min(MAP_H*TILE-H,camY));
    if(showAreaLabel>0)showAreaLabel--;
    if(overworldMsgTimer>0)overworldMsgTimer--;
    if(playerMoving){
      var spd=3,dx=playerTargetX-playerPX,dy=playerTargetY-playerPY;
      if(Math.abs(dx)<=spd&&Math.abs(dy)<=spd){
        playerPX=playerTargetX;playerPY=playerTargetY;playerMoving=false;playerStep=(playerStep+1)%4;
        var t=getT(playerTX,playerTY);
        var prevA=currentArea; currentArea=getAreaAt(playerTX,playerTY);
        if(currentArea!==prevA){
          areaLabelText=CHAPTERS[currentArea].area;showAreaLabel=150;
          if(window.GameAudio)window.GameAudio.playBGM(CHAPTERS[currentArea].bgm||'overworld');
          // Show story hint when entering new area
          var ch2=CHAPTERS[currentArea];
          overworldMsg=ch2.story[0]||ch2.objective;
          overworldMsgTimer=240;
        }
        if((t===T_TALL&&Math.random()<0.25)||(t===T_GRASS&&Math.random()<0.05)){
          encounterEnemy=pickEnemy(currentArea);
          state='encounter_anim';encounterTimer=55;
          if(window.GameAudio)window.GameAudio.sfx('encounter');return;
        } else if(t===T_DOOR){
          stageArea=currentArea;stageCursor=0;state='stageselect';
          if(window.GameAudio)window.GameAudio.sfx('open_menu');return;
        } else if(t===T_SIGN){
          overworldMsg='★ '+CHAPTERS[currentArea].area+'——'+CHAPTERS[currentArea].objective;
          overworldMsgTimer=180;
        }
        if(window.GameAudio)window.GameAudio.sfx(t===T_TALL||t===T_GRASS?'step_grass':'step');
      } else {playerPX+=Math.sign(dx)*spd;playerPY+=Math.sign(dy)*spd;}
      return;
    }
    if(moveDelay>0){moveDelay--;return;}
    var mx=0,my=0;
    if(justPressed('ArrowLeft')||justPressed('KeyH')){mx=-1;playerDir=3;}
    else if(justPressed('ArrowRight')||justPressed('KeyL')){mx=1;playerDir=1;}
    else if(justPressed('ArrowUp')||justPressed('KeyK')){my=-1;playerDir=0;}
    else if(justPressed('ArrowDown')||justPressed('KeyJ')){my=1;playerDir=2;}
    if(mx===0&&my===0){
      if(pressed('ArrowLeft')||pressed('KeyH')){mx=-1;playerDir=3;}
      else if(pressed('ArrowRight')||pressed('KeyL')){mx=1;playerDir=1;}
      else if(pressed('ArrowUp')||pressed('KeyK')){my=-1;playerDir=0;}
      else if(pressed('ArrowDown')||pressed('KeyJ')){my=1;playerDir=2;}
      if(mx||my)moveDelay=4;
    }
    if(mx||my){var nx=playerTX+mx,ny=playerTY+my;if(isWalkable(getT(nx,ny))){playerTX=nx;playerTY=ny;playerTargetX=nx*TILE;playerTargetY=ny*TILE;playerMoving=true;}}
    if(justPressed('Escape')){if(window.GameAudio)window.GameAudio.stopBGM();switchGame('menu');}
    if(justPressed('Tab')||justPressed('KeyM')){stageArea=currentArea;stageCursor=0;state='stageselect';if(window.GameAudio)window.GameAudio.sfx('open_menu');}
    if(justPressed('KeyE')){state='equip';equipTab=0;equipCursor=0;if(window.GameAudio)window.GameAudio.sfx('open_menu');}
  }
  function updateStageSelect(){
    var maxA=getAreaUnlock();
    if(justPressed('ArrowLeft')||justPressed('KeyH'))stageArea=Math.max(0,stageArea-1);
    if(justPressed('ArrowRight')||justPressed('KeyL'))stageArea=Math.min(maxA,stageArea+1);
    if(justPressed('ArrowUp')||justPressed('KeyK'))stageCursor=Math.max(0,stageCursor-1);
    if(justPressed('ArrowDown')||justPressed('KeyJ'))stageCursor=Math.min(9,stageCursor+1);
    if(window.GameAudio&&(justPressed('ArrowLeft')||justPressed('ArrowRight')||justPressed('ArrowUp')||justPressed('ArrowDown')))window.GameAudio.sfx('select');
    if(justPressed('Enter')||justPressed('KeyZ')){
      battleIsStage=true;
      var enemy=stageCursor===9?getBoss(stageArea):pickEnemy(stageArea);
      startBattle(enemy,stageCursor===9,stageArea);
      state='battle';if(window.GameAudio)window.GameAudio.sfx('confirm');
    }
    if(justPressed('Escape')){state='overworld';if(window.GameAudio)window.GameAudio.sfx('cancel');}
  }
  function updateBattle(){
    btAnimTimer=Math.max(0,btAnimTimer-1);
    if(shakeTimer>0){shakeTimer--;shakeX=(Math.random()-0.5)*6;shakeY=(Math.random()-0.5)*4;}
    else{shakeX=shakeY=0;}
    if(btState==='animp'||btState==='anime'){if(btAnimTimer<=0)nextMsg();return;}
    if(btState==='quiz'){updateQuiz();return;}
    if(btState==='result'){
      endTimer++;
      if(justPressed('Enter')||justPressed('KeyZ')||endTimer>180){
        if(gainedXP>0&&pendingDrop&&!hasInv(pendingDrop)){state='equip';equipTab=0;equipCursor=0;return;}
        if(window.showInterstitial)window.showInterstitial();
        state='overworld';if(window.GameAudio)window.GameAudio.playBGM(CHAPTERS[currentArea].bgm||'overworld');
      }
      return;
    }
    if(btState==='choose'){
      if(!showLangMenu){
        if(justPressed('ArrowUp')||justPressed('KeyK')){cmdCursor=Math.max(0,cmdCursor-1);if(window.GameAudio)window.GameAudio.sfx('select');}
        if(justPressed('ArrowDown')||justPressed('KeyJ')){cmdCursor=Math.min(4,cmdCursor+1);if(window.GameAudio)window.GameAudio.sfx('select');}
        if(justPressed('Enter')||justPressed('KeyZ')){
          if(cmdCursor<4&&cmdCursor<battleCmds.length){execCmd(battleCmds[cmdCursor]);if(window.GameAudio)window.GameAudio.sfx('confirm');}
          else{var langs=getAvailLangs();if(langs.length>0){showLangMenu=true;langCursor=0;if(window.GameAudio)window.GameAudio.sfx('open_menu');}else{qMsg('言語スキルが解放されていない！');}}
        }
        if(justPressed('Escape')){state='overworld';if(window.GameAudio){window.GameAudio.sfx('cancel');window.GameAudio.playBGM(CHAPTERS[currentArea].bgm||'overworld');}}
      } else {
        var langs2=getAvailLangs();
        if(justPressed('ArrowUp')||justPressed('KeyK')){langCursor=Math.max(0,langCursor-1);if(window.GameAudio)window.GameAudio.sfx('select');}
        if(justPressed('ArrowDown')||justPressed('KeyJ')){langCursor=Math.min(langs2.length-1,langCursor+1);if(window.GameAudio)window.GameAudio.sfx('select');}
        if(justPressed('Enter')||justPressed('KeyZ')){if(langs2[langCursor])execLang(langs2[langCursor]);}
        if(justPressed('Escape')){showLangMenu=false;if(window.GameAudio)window.GameAudio.sfx('cancel');}
      }
    }
  }
  function updateQuiz(){
    if(justPressed('ArrowUp')||justPressed('KeyK'))quizCursor=Math.max(0,quizCursor-1);
    if(justPressed('ArrowDown')||justPressed('KeyJ'))quizCursor=Math.min(3,quizCursor+1);
    if(justPressed('Enter')||justPressed('KeyZ'))resolveQuiz(quizCursor);
  }
  function updateEquip(){
    var slots=['weapon','armor','accessory'];
    if(justPressed('ArrowLeft')||justPressed('KeyH')){equipTab=Math.max(0,equipTab-1);equipCursor=0;}
    if(justPressed('ArrowRight')||justPressed('KeyL')){equipTab=Math.min(2,equipTab+1);equipCursor=0;}
    var slot=slots[equipTab], items=HARDWARE_DB[slot]||[];
    var owned=items.filter(function(it){return it.lv<=getLbLv()&&(it.drop===0||hasInv(it.id));});
    if(justPressed('ArrowUp')||justPressed('KeyK'))equipCursor=Math.max(0,equipCursor-1);
    if(justPressed('ArrowDown')||justPressed('KeyJ'))equipCursor=Math.min(owned.length-1,equipCursor+1);
    if(justPressed('Enter')||justPressed('KeyZ')){
      if(owned[equipCursor]){setLbEq(slot,owned[equipCursor].id);if(window.GameAudio)window.GameAudio.sfx('confirm');}
    }
    if(justPressed('Escape')){state='overworld';if(window.GameAudio){window.GameAudio.sfx('cancel');window.GameAudio.playBGM(CHAPTERS[currentArea].bgm||'overworld');}}
  }

  // ── Main update + draw shells ───────────────────────────────────
  function init(){
    frame=0;state='title';charCursor=0;storyPage=0;
    if(!tileMap)buildMap();
    var p=DISTRICT_POS[0];
    playerTX=p.ax+6;playerTY=p.ay+3;
    playerPX=playerTX*TILE;playerPY=playerTY*TILE;
    playerTargetX=playerPX;playerTargetY=playerPY;
    playerMoving=false;playerDir=2;playerStep=0;
    camX=playerPX-W/2;camY=playerPY-H/2;
    currentArea=0;showAreaLabel=120;areaLabelText=CHAPTERS[0].area;
    if(window.GameAudio){setTimeout(function(){window.GameAudio.playBGM('title');},200);}
  }
  function update(){
    frame++;
    battleEnemyY=Math.sin(frame*0.05)*4;
    switch(state){
      case 'title':         updateTitle();         break;
      case 'story':         updateStory();         break;
      case 'charselect':    updateCharSelect();    break;
      case 'overworld':     updateOverworld();     break;
      case 'stageselect':   updateStageSelect();   break;
      case 'encounter_anim':
        encounterTimer--;
        if(encounterTimer<=0){
          battleIsStage=false;
          startBattle(encounterEnemy||pickEnemy(currentArea),false,currentArea);
          state='battle';
        }
        break;
      case 'battle':        updateBattle();        break;
      case 'equip':         updateEquip();         break;
    }
  }
  function draw(){
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    switch(state){
      case 'title':         drawTitle();         break;
      case 'story':         drawStory();         break;
      case 'charselect':    drawCharSelect();    break;
      case 'overworld':     drawOverworld();     break;
      case 'stageselect':   drawStageSelect();   break;
      case 'encounter_anim':drawEncounterAnim(); break;
      case 'battle':        drawBattle();        break;
      case 'equip':         drawEquip();         break;
    }
    drawVimStatusline();
  }
  function onKey(){}

  // ── Utility ─────────────────────────────────────────────────────
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
  function hpBar(x,y,w,h,cur,max,col){ctx.fillStyle='#111';ctx.fillRect(x,y,w,h);var r=Math.max(0,cur/max);ctx.fillStyle=r>0.5?col:r>0.25?'#cccc44':'#cc4444';ctx.fillRect(x+1,y+1,Math.floor((w-2)*r),h-2);ctx.strokeStyle='#555';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);}

  // ── drawTitle ───────────────────────────────────────────────────
  function drawTitle(){
    var g=ctx.createLinearGradient(0,0,0,H-20);g.addColorStop(0,'#0a0022');g.addColorStop(1,'#1a0044');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H-20);
    // stars
    for(var i=0;i<60;i++){var sx=(i*173+frame*0.2)%W,sy=(i*97+frame*0.05)%(H-20);ctx.fillStyle='rgba(255,255,255,'+(0.4+0.4*Math.sin(frame*0.05+i))+')';ctx.fillRect(Math.floor(sx),Math.floor(sy),1,1);}
    // Tokyo Tower (right side, away from menu)
    var tx=640,ty2=90;ctx.fillStyle='#ff4444';ctx.beginPath();ctx.moveTo(tx,ty2+120);ctx.lineTo(tx-10,ty2+120);ctx.lineTo(tx-20,ty2+60);ctx.lineTo(tx-6,ty2+36);ctx.lineTo(tx,ty2);ctx.lineTo(tx+6,ty2+36);ctx.lineTo(tx+20,ty2+60);ctx.lineTo(tx+10,ty2+120);ctx.fill();
    if(frame%60<30){ctx.fillStyle='#fff';ctx.fillRect(tx-1,ty2-2,3,3);}
    // title (left-center)
    ctx.textAlign='center';ctx.font='bold 24px monospace';ctx.fillStyle='#ffcc00';ctx.fillText('LINUX BATTLE',W/3,55);
    ctx.font='12px monospace';ctx.fillStyle='#88ccff';ctx.fillText('Terminal Chronicles — 東京コマンドRPG',W/3,74);
    // story blurb
    ctx.font='9px monospace';ctx.fillStyle='#cc8866';ctx.fillText('Linuxコマンドを武器に東京を守れ！',W/3,95);
    ctx.fillStyle='#886644';ctx.fillText('LinuC試験レベル準拠 / Python・Java・TS',W/3,110);
    // menu (left-center area)
    var opts=['ゲームスタート','メニューに戻る'];
    for(var oi=0;oi<opts.length;oi++){
      var oy=150+oi*40;
      var sel2=(oi===charCursor);
      ctx.fillStyle=sel2?'rgba(60,50,0,0.92)':'rgba(20,20,50,0.88)';
      ctx.fillRect(W/3-120,oy-16,240,26);
      ctx.strokeStyle=sel2?'#ffcc00':'#445566';
      ctx.lineWidth=1;ctx.strokeRect(W/3-120,oy-16,240,26);
      ctx.font=(sel2?'bold ':'')+'14px monospace';
      ctx.fillStyle=sel2?'#ffff00':'#bbbbcc';
      ctx.fillText((sel2?'▶ ':' ')+opts[oi],W/3,oy);
    }
    ctx.font='9px monospace';ctx.fillStyle='#444466';
    ctx.fillText('↑↓/jk:選択  Enter/Z:決定  hjkl:移動  Tab/M:ステージ  E:装備',W/2,H-44);
    ctx.fillText('草むら歩行でエンカウント → クイズ付きバトル → 装備ドロップ',W/2,H-40);
  }

  // ── drawStory ───────────────────────────────────────────────────
  function drawStory(){
    var ch=CHAPTERS[getLbCh()]||CHAPTERS[0];
    ctx.fillStyle='rgba(0,0,20,0.95)';ctx.fillRect(0,0,W,H-20);
    ctx.textAlign='center';ctx.font='bold 13px monospace';ctx.fillStyle=ch.color||'#88aaff';ctx.fillText(ch.title,W/2,22);
    ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(8,30,W-16,2);
    // story text
    ctx.font='11px monospace';ctx.fillStyle='#ccccee';ctx.textAlign='left';
    var lines=ch.story;
    for(var li=0;li<lines.length;li++){
      var alpha=li<=storyPage?1.0:0.2;
      ctx.globalAlpha=alpha;ctx.fillText(lines[li],14,52+li*18);
    }
    ctx.globalAlpha=1;
    // current page highlight
    if(storyPage<lines.length){ctx.fillStyle='#ffff88';ctx.font='11px monospace';ctx.fillText('▶ '+lines[storyPage],14,52+storyPage*18);}
    // philosophy box
    ctx.fillStyle='rgba(0,40,80,0.85)';rr(8,H-130,W-16,52,4);ctx.fill();
    ctx.strokeStyle='#2244aa';ctx.lineWidth=1;rr(8,H-130,W-16,52,4);ctx.stroke();
    ctx.font='bold 9px monospace';ctx.fillStyle='#88aaff';ctx.textAlign='left';ctx.fillText('【哲学】',12,H-116);
    ctx.font='9px monospace';ctx.fillStyle='#aaccff';ctx.fillText(ch.philosophy,12,H-102);
    ctx.font='bold 9px monospace';ctx.fillStyle='#ffcc44';ctx.fillText('【目的】'+ch.objective,12,H-84);
    // progress
    ctx.textAlign='center';ctx.font='9px monospace';ctx.fillStyle='#556677';
    ctx.fillText('Enter/Z: 次へ  ('+( storyPage+1)+'/'+lines.length+')',W/2,H-68);
  }

  // ── drawCharSelect ──────────────────────────────────────────────
  function drawCharSelect(){
    ctx.fillStyle='#050518';ctx.fillRect(0,0,W,H-20);
    ctx.textAlign='center';ctx.font='bold 14px monospace';ctx.fillStyle='#ffcc00';ctx.fillText('キャラクター選択',W/2,20);
    var defs=window.CHARACTER_DEFS||[];
    var vis=Math.min(defs.length,4),cw=110,ch2=130,startX=(W-vis*(cw+6))/2;
    for(var i=0;i<vis;i++){
      var ci=Math.max(0,charCursor-1)+i;if(ci>=defs.length)break;
      var def=defs[ci],cx=startX+i*(cw+6),cy=36,sel=ci===charCursor;
      // Card bg: selected = character color, unselected = bright navy
      ctx.fillStyle=sel?(def.color||'#5599ff'):'rgba(30,35,80,0.9)';rr(cx,cy,cw,ch2,5);ctx.fill();
      ctx.strokeStyle=sel?'#ffff00':(def.color||'#4466aa');ctx.lineWidth=sel?2:1;rr(cx,cy,cw,ch2,5);ctx.stroke();
      drawCharSprite(cx+cw/2,cy+45,def,sel?frame:0,1.8);
      ctx.font=(sel?'bold ':'')+'10px monospace';ctx.fillStyle=sel?'#fff':'#ddeeff';ctx.textAlign='center';
      ctx.fillText(def.name,cx+cw/2,cy+ch2-30);
      ctx.font='8px monospace';ctx.fillStyle=sel?'#ccffcc':'#99bbcc';
      ctx.fillText('HP:'+def.hp+' ATK:'+def.atk+' DEF:'+def.def,cx+cw/2,cy+ch2-17);
    }
    var sel2=defs[charCursor];
    if(sel2){
      ctx.fillStyle='rgba(20,25,70,0.95)';ctx.fillRect(8,198,W-16,62);ctx.strokeStyle='#5577cc';ctx.lineWidth=1;ctx.strokeRect(8,198,W-16,62);
      ctx.font='bold 9px monospace';ctx.fillStyle='#ffffff';ctx.textAlign='left';
      ctx.fillText(sel2.name+' — '+(sel2.desc||''),14,213);
      ctx.font='9px monospace';ctx.fillStyle='#aaddff';ctx.fillText('パッシブ: '+(sel2.passive||'-'),14,229);
      ctx.fillStyle='#ffcc88';ctx.fillText('HP:'+sel2.hp+' ATK:'+sel2.atk+' DEF:'+sel2.def+' SPD:'+sel2.spd,14,247);
    }
    ctx.font='9px monospace';ctx.fillStyle='#666699';ctx.textAlign='center';ctx.fillText('←→/hl:選択  Enter/Z:決定  Esc:戻る',W/2,H-35);
  }

  // ── drawOverworld ───────────────────────────────────────────────
  function drawOverworld(){
    var icx=Math.floor(camX),icy=Math.floor(camY);
    var sx0=Math.floor(icx/TILE),sy0=Math.floor(icy/TILE);
    var sx1=Math.min(MAP_W,sx0+Math.ceil(W/TILE)+1),sy1=Math.min(MAP_H,sy0+Math.ceil(H/TILE)+1);
    for(var ty=sy0;ty<sy1;ty++)for(var tx=sx0;tx<sx1;tx++)drawTile(tx*TILE-icx,ty*TILE-icy,getT(tx,ty),tx,ty);
    // district name labels
    for(var di=0;di<DISTRICT_POS.length;di++){
      var dp=DISTRICT_POS[di],lx=(dp.ax+6)*TILE-icx,ly=(dp.ay+22)*TILE-icy;
      if(lx>-30&&lx<W+30&&ly>-10&&ly<H+10){ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillStyle='#ffff88';ctx.fillText(CHAPTERS[di].area,lx+TILE/2,ly-2);}
    }
    // player
    var cd=window.CHARACTER_DEFS&&window.CHARACTER_DEFS.find(function(d){return d.id===((window.SAVE&&window.SAVE.character)||'vimman');});
    drawPlayerOW(Math.floor(playerPX-icx),Math.floor(playerPY-icy),playerDir,playerStep,cd);
    // area label
    if(showAreaLabel>0){ctx.globalAlpha=Math.min(1,showAreaLabel/20);ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(W/2-90,4,180,20);ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillStyle='#ffcc00';ctx.fillText('★ '+areaLabelText,W/2,18);ctx.globalAlpha=1;}
    // overworld msg
    if(overworldMsgTimer>0){
      var msgAlpha=Math.min(1,overworldMsgTimer/20);
      ctx.globalAlpha=msgAlpha;
      ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(4,H-80,W-86,28);
      ctx.strokeStyle='#446688';ctx.lineWidth=1;ctx.strokeRect(4,H-80,W-86,28);
      ctx.font='bold 9px monospace';ctx.textAlign='left';ctx.fillStyle='#ffff88';ctx.fillText('▶',8,H-64);
      ctx.font='9px monospace';ctx.fillStyle='#ffffff';ctx.fillText(overworldMsg,20,H-64);
      ctx.globalAlpha=1;
    }
    // mini HUD (top-left)
    var lv=getLbLv(),xp=getLbXP();
    ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(2,2,158,28);
    ctx.font='bold 9px monospace';ctx.textAlign='left';ctx.fillStyle='#aaffaa';
    ctx.fillText('Lv.'+lv+' XP:'+xp,5,13);
    ctx.font='9px monospace';ctx.fillStyle='#88ccff';
    ctx.fillText(CHAPTERS[currentArea].area+' — Ch.'+(currentArea+1),5,25);
    // Destination arrow + objective bar
    var targetCh=Math.min(getLbCh(),9);
    var tp=DISTRICT_POS[targetCh];
    var tdx=(tp.ax+7)*TILE, tdy=(tp.ay+14)*TILE;
    var ang2=Math.atan2(tdy-playerPY, tdx-playerPX);
    if(currentArea!==targetCh){
      // Objective bar at bottom (leave right side for minimap)
      ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(4,H-52,W-86,16);
      ctx.font='bold 8px monospace';ctx.textAlign='left';ctx.fillStyle='#ffff00';
      ctx.fillText('目標: ',6,H-40);
      ctx.font='8px monospace';ctx.fillStyle='#ffffff';
      var objText=CHAPTERS[targetCh].area+'へ → '+CHAPTERS[targetCh].objective;
      if(objText.length>46)objText=objText.slice(0,44)+'…';
      ctx.fillText(objText,44,H-40);
      // Arrow near player
      if(frame%40<25){
        var ppx2=Math.floor(playerPX-icx)+8, ppy2=Math.floor(playerPY-icy)+4;
        var arDist=22;
        var arx=ppx2+Math.cos(ang2)*arDist, ary=ppy2+Math.sin(ang2)*arDist;
        ctx.save();ctx.translate(arx,ary);ctx.rotate(ang2);
        ctx.fillStyle='#ffff00';ctx.strokeStyle='#000';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-4);ctx.lineTo(-2,0);ctx.lineTo(-4,4);ctx.closePath();
        ctx.fill();ctx.stroke();
        ctx.restore();
      }
    } else {
      // In target area: show objective
      ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(4,H-52,W-86,16);
      ctx.font='8px monospace';ctx.textAlign='left';ctx.fillStyle='#44ff88';
      ctx.fillText('★ '+CHAPTERS[currentArea].area+': '+CHAPTERS[currentArea].objective.slice(0,44),6,H-40);
    }
    // Mini-map (bottom-right, sized to fit above statusline)
    var mx=W-76,my=H-78,mw=70,mh=42;
    ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(mx-2,my-10,mw+4,mh+12);
    ctx.strokeStyle='#334455';ctx.lineWidth=1;ctx.strokeRect(mx-2,my-10,mw+4,mh+12);
    ctx.font='6px monospace';ctx.textAlign='center';ctx.fillStyle='#556677';ctx.fillText('MAP',mx+mw/2,my-2);
    var sx2=mw/MAP_W, sy2=mh/MAP_H;
    // Districts
    for(var di=0;di<DISTRICT_POS.length;di++){
      var dp2=DISTRICT_POS[di],unl=di<=getAreaUnlock();
      ctx.fillStyle=unl?(CHAPTERS[di].color||'#aaaaff')+'cc':'#222244';
      ctx.fillRect(mx+Math.floor(dp2.ax*sx2),my+Math.floor(dp2.ay*sy2),Math.max(2,Math.ceil(14*sx2)),Math.max(2,Math.ceil(28*sy2)));
    }
    // Player dot
    var pdotx=mx+Math.floor(playerTX*sx2), pdoty=my+Math.floor(playerTY*sy2);
    ctx.fillStyle='#ffffff';ctx.fillRect(pdotx-1,pdoty-1,3,3);
    // Target district (flashing)
    var tp2=DISTRICT_POS[targetCh];
    var tdotx=mx+Math.floor((tp2.ax+7)*sx2), tdoty=my+Math.floor((tp2.ay+14)*sy2);
    if(frame%20<10){ctx.fillStyle='#ffff00';ctx.fillRect(tdotx-2,tdoty-2,5,5);}
    ctx.font='8px monospace';ctx.fillStyle='#444466';ctx.textAlign='center';ctx.fillText('hjkl:移動  Tab:ステージ  E:装備  Esc:メニュー',W/2-40,H-34);
  }
  function drawTile(sx,sy,t,tx,ty){
    switch(t){
      case T_ROAD: ctx.fillStyle=(tx+ty)%2===0?'#2e2e3e':'#303048';ctx.fillRect(sx,sy,TILE,TILE);break;
      case T_BLDG:
        ctx.fillStyle='#181828';ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle='#222236';ctx.fillRect(sx+2,sy+2,5,5);ctx.fillRect(sx+9,sy+2,5,5);ctx.fillRect(sx+2,sy+9,5,5);ctx.fillRect(sx+9,sy+9,5,5);
        if((tx*7+ty*13)%5===0){ctx.fillStyle='#ffee88';ctx.fillRect(sx+2,sy+2,5,5);}break;
      case T_GRASS: ctx.fillStyle='#1a4a1a';ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#256625';ctx.fillRect(sx+2,sy+8,3,6);ctx.fillRect(sx+9,sy+4,3,8);break;
      case T_TALL:
        ctx.fillStyle='#0a3a0a';ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle='#1a5a1a';ctx.fillRect(sx+1,sy+5,3,9);ctx.fillRect(sx+6,sy+2,3,11);ctx.fillRect(sx+11,sy+4,3,10);
        if((frame+tx+ty)%30<5){ctx.fillStyle='#2a7a2a';ctx.fillRect(sx+5,sy+1,2,4);}break;
      case T_WATER:
        var wv=Math.sin(frame*0.05+tx*0.5+ty*0.3)*0.3;
        ctx.fillStyle='rgb('+(15+Math.floor(wv*20))+','+(55+Math.floor(wv*20))+',120)';ctx.fillRect(sx,sy,TILE,TILE);
        if((tx+ty+Math.floor(frame/10))%3===0){ctx.fillStyle='rgba(150,200,255,0.3)';ctx.fillRect(sx,sy+6,TILE,3);}break;
      case T_RAIL: ctx.fillStyle='#181818';ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#555566';ctx.fillRect(sx,sy+5,TILE,2);ctx.fillRect(sx,sy+9,TILE,2);for(var ri=0;ri<3;ri++){ctx.fillStyle='#333344';ctx.fillRect(sx+ri*6,sy,4,TILE);}break;
      case T_DOOR: ctx.fillStyle='#3a2a0a';ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#aa6600';ctx.fillRect(sx+3,sy+2,10,12);ctx.fillStyle='#ffcc44';ctx.fillRect(sx+9,sy+7,2,2);break;
      case T_SAND: ctx.fillStyle='#4a3a1a';ctx.fillRect(sx,sy,TILE,TILE);if((tx+ty)%3===0){ctx.fillStyle='#5a4a2a';ctx.fillRect(sx+3,sy+5,2,2);}break;
      case T_SIGN: ctx.fillStyle='#2a1a00';ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#cc8800';ctx.fillRect(sx+5,sy+1,6,8);ctx.fillRect(sx+7,sy+9,2,6);break;
      case T_TREE: ctx.fillStyle='#101510';ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#224422';ctx.beginPath();ctx.arc(sx+8,sy+7,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#336633';ctx.beginPath();ctx.arc(sx+8,sy+6,5,0,Math.PI*2);ctx.fill();break;
      default: ctx.fillStyle='#101020';ctx.fillRect(sx,sy,TILE,TILE);
    }
  }
  function drawPlayerOW(px,py,dir,step,cd){
    var col=(cd&&cd.color)||'#5599ff',bounce=(step%2===0)?0:-1;
    ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(px+3,py+13,10,3);
    ctx.fillStyle=col;ctx.fillRect(px+4,py+4+bounce,8,8);
    ctx.beginPath();ctx.arc(px+8,py+3+bounce,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';
    if(dir===2){ctx.fillRect(px+5,py+2+bounce,2,2);ctx.fillRect(px+9,py+2+bounce,2,2);}
    else if(dir===1){ctx.fillRect(px+10,py+2+bounce,2,2);}
    else if(dir===3){ctx.fillRect(px+4,py+2+bounce,2,2);}
    ctx.fillStyle='#334466';
    if(step%4<2){ctx.fillRect(px+4,py+12,3,4);ctx.fillRect(px+9,py+12,3,3);}
    else{ctx.fillRect(px+4,py+12,3,3);ctx.fillRect(px+9,py+12,3,4);}
  }
  function drawCharSprite(x,y,cd,fr,sc){
    sc=sc||1;var col=(cd&&cd.color)||'#5599ff',bob=Math.sin((fr||0)*0.08)*2;
    ctx.save();ctx.translate(x,y+bob);
    ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(-10*sc,13*sc,20*sc,4*sc);
    ctx.fillStyle=col;ctx.fillRect(-7*sc,-3*sc,14*sc,14*sc);
    ctx.beginPath();ctx.arc(0,-9*sc,7*sc,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.fillRect(-4*sc,-12*sc,3*sc,3*sc);ctx.fillRect(2*sc,-12*sc,3*sc,3*sc);
    ctx.fillStyle='#000033';ctx.fillRect(-3*sc,-11*sc,2*sc,2*sc);ctx.fillRect(3*sc,-11*sc,2*sc,2*sc);
    ctx.fillStyle='#334466';
    var lb=(fr||0)%16<8;ctx.fillRect(-6*sc,11*sc,4*sc,(lb?7:5)*sc);ctx.fillRect(2*sc,11*sc,4*sc,(lb?5:7)*sc);
    if(cd){
      if(cd.id==='mage'){ctx.fillStyle='#8844cc';ctx.beginPath();ctx.moveTo(-7*sc,-17*sc);ctx.lineTo(7*sc,-17*sc);ctx.lineTo(0,-26*sc);ctx.closePath();ctx.fill();}
      else if(cd.id==='swordsman'||cd.id==='warrior'){ctx.fillStyle='#ccaa44';ctx.fillRect(9*sc,-4*sc,3*sc,18*sc);ctx.fillRect(7*sc,-4*sc,6*sc,3*sc);}
      else if(cd.id==='claudeman'){ctx.fillStyle='#ff8c42';ctx.fillRect(-7*sc,-3*sc,14*sc,3*sc);}
    }
    ctx.restore();
  }

  // ── drawStageSelect ─────────────────────────────────────────────
  function drawStageSelect(){
    ctx.fillStyle='#050518';ctx.fillRect(0,0,W,H-20);
    ctx.textAlign='center';ctx.font='bold 13px monospace';ctx.fillStyle='#ffcc00';ctx.fillText('ステージ選択',W/2,18);
    // area tabs
    for(var ai=0;ai<CHAPTERS.length;ai++){
      var tw=46,tx3=4+ai*(tw+2),sel=ai===stageArea,unl=ai<=getAreaUnlock();
      ctx.fillStyle=sel?CHAPTERS[ai].color:'#222244';ctx.fillRect(tx3,24,tw,15);
      if(sel){ctx.strokeStyle='#ffff00';ctx.lineWidth=1;ctx.strokeRect(tx3,24,tw,15);}
      ctx.font='7px monospace';ctx.textAlign='center';ctx.fillStyle=sel?'#fff':(unl?'#888':'#333');ctx.fillText(CHAPTERS[ai].area,tx3+tw/2,35);
    }
    // stage grid
    var aUnl=stageArea<=getAreaUnlock();
    if(!aUnl){ctx.font='14px monospace';ctx.fillStyle='#444';ctx.textAlign='center';ctx.fillText('🔒 前エリアをクリアして解放',W/2,H/2);}
    else{
      for(var s=0;s<10;s++){
        var col2=s%2,row=Math.floor(s/2),bx=10+col2*246,by2=44+row*36,bw=234,bh=32;
        var ssel=s===stageCursor,clr=getStageClear(stageArea,s),boss=s===9;
        ctx.fillStyle=ssel?(boss?'#440000':'#112244'):(clr?'#0a2a0a':'#0a0a1a');ctx.fillRect(bx,by2,bw,bh);
        ctx.strokeStyle=ssel?'#ffff00':(clr?'#336633':'#223');ctx.lineWidth=ssel?2:1;ctx.strokeRect(bx,by2,bw,bh);
        ctx.font=(ssel?'bold ':'')+' 10px monospace';ctx.textAlign='left';
        ctx.fillStyle=ssel?'#fff':(clr?'#88cc88':'#8888aa');
        ctx.fillText((boss?'★ BOSS: ':' Stage '+(s+1)+':  ')+(boss?CHAPTERS[stageArea].bossName:'Tier.'+CHAPTERS[stageArea].tier+' エネミー'),bx+6,by2+14);
        ctx.font='8px monospace';ctx.fillStyle=clr?'#44aa44':(ssel?'#888':'#555');
        ctx.fillText(clr?'✓ クリア':(boss?'ボスバトル':'LinuCレベル'+CHAPTERS[stageArea].tier+' 問題出題'),bx+6,by2+26);
        if(ssel){ctx.fillStyle='#ffff00';ctx.fillText('◀',bx-10,by2+18);}
      }
    }
    ctx.font='9px monospace';ctx.fillStyle='#556677';ctx.textAlign='center';ctx.fillText('←→:エリア  ↑↓:ステージ  Enter:バトル  Esc:戻る',W/2,H-35);
  }

  // ── drawEncounterAnim ───────────────────────────────────────────
  function drawEncounterAnim(){
    var p=(55-encounterTimer)/55; // 0→1 over animation
    // Dark overlay with flashing border
    ctx.fillStyle='rgba(0,0,0,'+(0.3+p*0.5)+')';ctx.fillRect(0,0,W,H);
    // Pulsing border
    var bAlpha=Math.sin(p*Math.PI*4)*0.5+0.5;
    ctx.strokeStyle='rgba(255,80,0,'+bAlpha+')';ctx.lineWidth=6;ctx.strokeRect(3,3,W-6,H-26);
    // Danger lines radiating from center
    ctx.globalAlpha=p*0.4;
    for(var i=0;i<12;i++){
      var a=i*(Math.PI*2/12)+p*0.5;
      ctx.strokeStyle=i%2===0?'#ff4400':'#ffaa00';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(W/2,H/2);ctx.lineTo(W/2+Math.cos(a)*W,H/2+Math.sin(a)*H);ctx.stroke();
    }
    ctx.globalAlpha=1;
    // Main message
    ctx.textAlign='center';
    if(p>0.2){
      ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(W/2-130,H/2-36,260,28);
      ctx.font='bold 18px monospace';ctx.fillStyle='#ff4422';
      ctx.fillText('⚠ 敵に遭遇した！',W/2,H/2-14);
    }
    if(p>0.45&&encounterEnemy){
      ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(W/2-130,H/2-2,260,24);
      ctx.font='bold 14px monospace';ctx.fillStyle='#ffcc00';
      ctx.fillText(encounterEnemy.name,W/2,H/2+16);
    }
    if(p>0.65&&encounterEnemy){
      ctx.font='10px monospace';ctx.fillStyle='rgba(255,150,100,0.9)';
      ctx.fillText('HP:'+encounterEnemy.hp+' ATK:'+encounterEnemy.atk+' Tier.'+encounterEnemy.tier,W/2,H/2+34);
    }
    if(p>0.85){
      ctx.font='bold 11px monospace';ctx.fillStyle='rgba(255,255,100,'+((p-0.85)*6)+')';
      ctx.fillText('バトル開始！',W/2,H/2+54);
    }
  }

  // ── drawBattle ──────────────────────────────────────────────────
  function drawBattle(){
    var sx=shakeTimer>0?shakeX:0,sy=shakeTimer>0?shakeY:0;
    ctx.fillStyle='#080018';ctx.fillRect(0,0,W,Math.floor(H*0.58));
    ctx.fillStyle='#111a00';ctx.fillRect(0,Math.floor(H*0.58),W,Math.floor(H*0.15));
    // platforms
    ctx.fillStyle='#2a2a00';ctx.fillRect(22,Math.floor(H*0.64),88,8);
    ctx.fillStyle='#1a2a00';ctx.fillRect(W-128,Math.floor(H*0.44),108,8);
    // enemy
    if(currentEnemy){
      ctx.save();ctx.translate(sx,sy);
      drawEnemySprite(W-125,Math.floor(H*0.28)+battleEnemyY,currentEnemy);
      ctx.restore();
      // enemy HP bar (name above, bar below)
      ctx.font='bold 7px monospace';ctx.textAlign='left';ctx.fillStyle='#fff';ctx.fillText(currentEnemy.name,W-140,8);
      if(scanRevealed){ctx.fillStyle='#aaffaa';ctx.textAlign='right';ctx.font='7px monospace';ctx.fillText(enemyHP+'/'+enemyMaxHP,W-14,8);}
      hpBar(W-142,10,130,11,enemyHP,enemyMaxHP,'#44cc44');
      if(currentEnemy.isBoss){ctx.fillStyle='#ff4444';ctx.font='bold 7px monospace';ctx.textAlign='center';ctx.fillText('★ BOSS ★',W-77,26);}
    }
    // player
    var cd=window.CHARACTER_DEFS&&window.CHARACTER_DEFS.find(function(d){return d.id===((window.SAVE&&window.SAVE.character)||'vimman');});
    drawCharSprite(62,Math.floor(H*0.57),cd,frame,2.2);
    // player bars (labels above bars)
    ctx.font='7px monospace';ctx.textAlign='left';ctx.fillStyle='#aaffaa';ctx.fillText('HP '+playerHP+'/'+playerMaxHP,10,8);
    hpBar(8,10,118,10,playerHP,playerMaxHP,'#44cc44');
    ctx.fillStyle='#88aaff';ctx.fillText('MP '+playerMP+'/'+playerMaxMP,10,23);
    hpBar(8,25,118,8,playerMP,playerMaxMP,'#4488ff');
    // status icons (row below HP/MP bars)
    var si=8;
    if(playerShield>0){ctx.fillStyle='#88ccff';ctx.font='7px monospace';ctx.textAlign='left';ctx.fillText('[盾'+playerShield+']',si,36);si+=36;}
    if(playerIronwall>0){ctx.fillStyle='#ffaa44';ctx.font='7px monospace';ctx.fillText('[鉄壁'+playerIronwall+']',si,36);si+=46;}
    if(tsNullifyNext){ctx.fillStyle='#66ffff';ctx.font='7px monospace';ctx.fillText('[TS無効]',si,36);}
    if(javaCharge>0){ctx.fillStyle='#ffcc00';ctx.font='7px monospace';ctx.fillText('[Java+'+javaCharge+']',si+(tsNullifyNext?40:0),36);}
    // battle panel
    var panY=Math.floor(H*0.69);
    ctx.fillStyle='rgba(0,0,16,0.94)';ctx.fillRect(0,panY,W,H-20-panY);ctx.strokeStyle='#334488';ctx.lineWidth=1;ctx.strokeRect(0,panY,W,H-20-panY);
    ctx.fillStyle='#0a0a22';ctx.fillRect(2,panY+2,W-4,20);
    ctx.font='10px monospace';ctx.textAlign='left';ctx.fillStyle='#fff';ctx.fillText(btMsg,8,panY+15);

    if(btState==='choose'&&!showLangMenu){
      for(var ci=0;ci<battleCmds.length;ci++){
        var mx2=2+(ci%2)*256,my2=panY+26+Math.floor(ci/2)*22,csel=ci===cmdCursor;
        ctx.fillStyle=csel?'#223366':'#0a0a22';ctx.fillRect(mx2,my2,254,20);
        ctx.strokeStyle=csel?'#88aaff':'#223';ctx.lineWidth=1;ctx.strokeRect(mx2,my2,254,20);
        ctx.font=(csel?'bold ':'')+' 9px monospace';ctx.fillStyle=csel?'#fff':'#aac';ctx.textAlign='left';
        ctx.fillText((csel?'▶ ':' ')+battleCmds[ci].name,mx2+4,my2+13);
        ctx.font='8px monospace';ctx.fillStyle='#556677';ctx.textAlign='right';ctx.fillText(battleCmds[ci].desc,mx2+250,my2+13);ctx.textAlign='left';
      }
      var lbsel=cmdCursor===4;
      ctx.fillStyle=lbsel?'#331133':'#0a0a1a';ctx.fillRect(2,panY+70,W-4,18);ctx.strokeStyle=lbsel?'#cc44ff':'#223';ctx.lineWidth=1;ctx.strokeRect(2,panY+70,W-4,18);
      ctx.font=(lbsel?'bold ':'')+' 9px monospace';ctx.fillStyle=lbsel?'#cc88ff':'#885599';ctx.textAlign='left';
      ctx.fillText((lbsel?'▶ ':' ')+'言語スキル [Python/Java/TypeScript/Rust/Go]  MP:'+playerMP+'/'+playerMaxMP,8,panY+82);
    } else if(btState==='choose'&&showLangMenu){
      var langs=getAvailLangs();
      if(langs.length===0){ctx.font='10px monospace';ctx.fillStyle='#888';ctx.textAlign='center';ctx.fillText('言語スキルがまだ解放されていません',W/2,panY+55);}
      for(var li=0;li<langs.length;li++){
        var lsel=li===langCursor,ly3=panY+26+li*18;
        ctx.fillStyle=lsel?'#220033':'#0a0a16';ctx.fillRect(2,ly3,W-4,16);
        ctx.strokeStyle=lsel?'#cc44ff':'#223';ctx.lineWidth=1;ctx.strokeRect(2,ly3,W-4,16);
        ctx.font=(lsel?'bold ':'')+' 8px monospace';ctx.fillStyle=langs[li].mpCost<=playerMP?(lsel?'#fff':'#aac'):'#664466';ctx.textAlign='left';
        ctx.fillText((lsel?'▶ ':' ')+langs[li].icon+' '+langs[li].name+' ('+langs[li].mpCost+'MP)',8,ly3+12);
        ctx.font='8px monospace';ctx.fillStyle='#556677';ctx.textAlign='right';ctx.fillText(langs[li].desc,W-6,ly3+12);ctx.textAlign='left';
      }
    } else if(btState==='quiz'&&quizQ){
      ctx.fillStyle='rgba(0,20,40,0.97)';ctx.fillRect(2,panY+22,W-4,H-22-panY);
      ctx.font='bold 9px monospace';ctx.fillStyle='#ffcc00';ctx.textAlign='center';ctx.fillText('【クイズ攻撃】正解でダメージ軽減！',W/2,panY+35);
      ctx.font='9px monospace';ctx.fillStyle='#eee';ctx.textAlign='left';
      // wrap question
      var qw=W-20,qx=10,qy3=panY+50,words=quizQ.q.split(''),ln='';
      for(var qi=0;qi<words.length;qi++){var t2=ln+words[qi];if(ctx.measureText(t2).width>qw&&ln){ctx.fillText(ln,qx,qy3);qy3+=13;ln=words[qi];}else ln=t2;}ctx.fillText(ln,qx,qy3);qy3+=18;
      for(var qci=0;qci<4;qci++){
        var qsel=qci===quizCursor;
        ctx.fillStyle=qsel?'#223366':'#0a0a22';ctx.fillRect(4,qy3+qci*18,W-8,16);
        ctx.strokeStyle=qsel?'#88aaff':'#223';ctx.lineWidth=1;ctx.strokeRect(4,qy3+qci*18,W-8,16);
        ctx.font=(qsel?'bold ':'')+' 8px monospace';ctx.fillStyle=qsel?'#fff':'#aaa';ctx.textAlign='left';
        ctx.fillText((qsel?'▶ ':'  ')+['A','B','C','D'][qci]+': '+quizQ.c[qci],10,qy3+qci*18+12);
      }
      ctx.font='8px monospace';ctx.fillStyle='#445566';ctx.textAlign='center';ctx.fillText('↑↓/jk:選択  Enter:決定',W/2,H-36);
    } else if(btState==='result'){
      ctx.font='bold 13px monospace';ctx.textAlign='center';
      ctx.fillStyle=gainedXP>0?'#88ff88':'#ff8888';ctx.fillText(gainedXP>0?'勝利！ +'+gainedXP+'XP':'やられた…',W/2,panY+40);
      if(leveledUp){ctx.fillStyle='#ffff00';ctx.fillText('★ レベルアップ！ Lv.'+getLbLv()+' ★',W/2,panY+58);}
      if(gainedXP>0&&pendingDrop){
        var hw=findHW('weapon',pendingDrop)||findHW('armor',pendingDrop)||findHW('accessory',pendingDrop);
        if(hw){ctx.fillStyle='#ffaa44';ctx.font='10px monospace';ctx.fillText('ドロップ: '+hw.name+' 入手！',W/2,panY+74);}
      }
      ctx.font='9px monospace';ctx.fillStyle='#666';ctx.fillText('Enter/Z: 次へ',W/2,panY+88);
    }
  }

  // ── Enemy sprites ───────────────────────────────────────────────
  function drawEnemySprite(ex,ey,enemy){
    var col=enemy.col||'#44ff44',t=frame;
    switch(enemy.id){
      case 'bug':      drawBug(ex,ey,col,t); break;
      case 'daemon':   drawDaemon(ex,ey,col,t); break;
      case 'zombie':   drawZombie(ex,ey,col,t); break;
      case 'cronbomb': drawCron(ex,ey,col,t); break;
      case 'rootkit':  drawRootkit(ex,ey,col,t); break;
      case 'segfault': drawSeg(ex,ey,col,t); break;
      case 'memleak':  drawMem(ex,ey,col,t); break;
      case 'overflow': drawOverflow2(ex,ey,col,t); break;
      case 'malware':  drawMalware(ex,ey,col,t); break;
      case 'nulldragon':drawNullDragon(ex,ey,col,t); break;
      default:         drawDefaultEnemy(ex,ey,col,t); break;
    }
  }
  function drawBug(x,y,col,t){var cx=x+40,cy=y+45;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(cx,cy,22,16,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx,cy-20,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff0000';ctx.fillRect(cx-9,cy-24,5,5);ctx.fillRect(cx+4,cy-24,5,5);ctx.strokeStyle=col;ctx.lineWidth=2;for(var i=0;i<3;i++){ctx.beginPath();ctx.moveTo(cx-22+i*4,cy-4+i*3);ctx.lineTo(cx-32,cy+6);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+22-i*4,cy-4+i*3);ctx.lineTo(cx+32,cy+6);ctx.stroke();}ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText('BugProcess',cx,cy+28);}
  function drawDaemon(x,y,col,t){var cx=x+40,cy=y+40;ctx.fillStyle='#2244aa';ctx.fillRect(cx-14,cy-44,28,20);ctx.fillStyle=col;ctx.fillRect(cx-18,cy-24,36,38);ctx.fillStyle='rgba(0,255,100,0.9)';ctx.fillRect(cx-9,cy-37,7,6);ctx.fillRect(cx+2,cy-37,7,6);ctx.fillStyle='#001122';ctx.fillRect(cx-11,cy-14,22,16);ctx.font='6px monospace';ctx.fillStyle='#00ff88';ctx.textAlign='center';ctx.fillText('DAEMON',cx,cy-3);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy-44);ctx.lineTo(cx,cy-55);ctx.stroke();ctx.fillStyle='#ffff00';ctx.beginPath();ctx.arc(cx,cy-57,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3366cc';ctx.fillRect(cx-28,cy-20,12,24);ctx.fillRect(cx+16,cy-20,12,24);ctx.font='8px monospace';ctx.fillStyle='#fff';ctx.fillText('DaemonBot',cx,cy+22);}
  function drawZombie(x,y,col,t){var cx=x+40,cy=y+45;ctx.save();ctx.translate(cx,cy);ctx.rotate(0.12);ctx.fillStyle=col;ctx.fillRect(-14,-22,28,34);ctx.beginPath();ctx.arc(0,-30,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#004400';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(5,-16);ctx.stroke();ctx.strokeStyle='#ff4400';ctx.lineWidth=2;[-8,-2].forEach(function(ox){ctx.beginPath();ctx.moveTo(ox,-34);ctx.lineTo(ox+5,-29);ctx.moveTo(ox+5,-34);ctx.lineTo(ox,-29);ctx.stroke();});ctx.fillStyle=col;ctx.fillRect(-28,-16,15,8);ctx.fillRect(13,-16,15,8);ctx.restore();ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText('ZombieThread',cx,cy+24);}
  function drawCron(x,y,col,t){var cx=x+40,cy=y+38;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy-8,26,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#1a0a00';ctx.beginPath();ctx.arc(cx,cy-8,23,0,Math.PI*2);ctx.fill();var a=t*0.06;ctx.strokeStyle='#ffaa44';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy-8);ctx.lineTo(cx+Math.cos(a)*16,cy-8+Math.sin(a)*16);ctx.stroke();ctx.strokeStyle='#ff8800';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy-8);ctx.lineTo(cx+Math.cos(a*0.08)*10,cy-8+Math.sin(a*0.08)*10);ctx.stroke();ctx.fillStyle='#ffcc44';ctx.fillRect(cx-4,cy-12,8,8);ctx.fillStyle=col;ctx.fillRect(cx-10,cy+16,8,14);ctx.fillRect(cx+2,cy+16,8,14);ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText('CronBomb',cx,cy+38);}
  function drawRootkit(x,y,col,t){var cx=x+40,cy=y+50;var alpha=0.6+Math.sin(t*0.08)*0.3;ctx.globalAlpha=alpha;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(cx,cy-60);ctx.lineTo(cx+28,cy-10);ctx.lineTo(cx+18,cy+22);ctx.lineTo(cx-18,cy+22);ctx.lineTo(cx-28,cy-10);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#ff0000';ctx.beginPath();ctx.arc(cx-8,cy-28,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+8,cy-28,5,0,Math.PI*2);ctx.fill();ctx.font='7px monospace';ctx.fillStyle='#880088';ctx.textAlign='center';for(var i=0;i<4;i++){var a2=t*0.05+i*Math.PI/2;ctx.fillText(i%2?'1':'0',cx+Math.cos(a2)*34,cy+Math.sin(a2)*34-10);}ctx.font='8px monospace';ctx.fillStyle='#ff88ff';ctx.fillText('RootKit',cx,cy+30);}
  function drawSeg(x,y,col,t){var cx=x+40,cy=y+40;var gl=Math.sin(t*0.3)>0.7;ctx.fillStyle=gl?'#ff6600':col;for(var i=0;i<6;i++){var off=gl?(Math.random()-0.5)*6:0;ctx.fillRect(cx-18+off,cy-50+i*14,36,11);}ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText('SIGSEGV',cx+(gl?2:0),cy-18);ctx.font='8px monospace';ctx.fillStyle='#ff4400';ctx.fillText('Segfault',cx,cy+26);}
  function drawMem(x,y,col,t){var cx=x+40,cy=y+40;var sz=Math.min(22+Math.floor(t/60)*2,38);ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx,cy-12,sz,0,Math.PI*2);ctx.fill();for(var i=0;i<5;i++){var dy=(t+i*20)%40;ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx-14+i*7,cy+20+dy,3,0,Math.PI*2);ctx.fill();}ctx.font='7px monospace';ctx.textAlign='center';ctx.fillStyle='#aa44ff';ctx.fillText('0xDEADBEEF',cx,cy-28);ctx.font='8px monospace';ctx.fillStyle='#fff';ctx.fillText('MemoryLeak',cx,cy+38);}
  function drawOverflow2(x,y,col,t){var cx=x+40,cy=y+40;for(var i=0;i<8;i++){var off=Math.sin(t*0.1+i*0.5)*3;ctx.fillStyle=i<5?col:'#ff6600';ctx.fillRect(cx-18+off,cy+10-i*10,36,8);ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.strokeRect(cx-18+off,cy+10-i*10,36,8);}ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle='#ffaa00';ctx.fillText('OVERFLOW!',cx,cy-72);ctx.fillStyle='#fff';ctx.fillText('StackOverflow',cx,cy+24);}
  function drawMalware(x,y,col,t){var cx=x+40,cy=y+50;ctx.fillStyle='#880000';ctx.beginPath();ctx.arc(cx,cy-30,22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#cc0000';ctx.fillRect(cx-16,cy-8,32,36);ctx.fillStyle='#ff4400';ctx.fillRect(cx-10,cy-26,7,7);ctx.fillRect(cx+3,cy-26,7,7);ctx.fillStyle='#111';ctx.fillRect(cx-8,cy-12,16,10);ctx.font='bold 7px monospace';ctx.textAlign='center';ctx.fillStyle='#ff0000';ctx.fillText('MALWARE',cx,cy-6);for(var i=0;i<6;i++){var a3=t*0.04+i*Math.PI/3;ctx.fillStyle='rgba(255,0,0,0.6)';ctx.beginPath();ctx.arc(cx+Math.cos(a3)*30,cy+Math.sin(a3)*30-10,3,0,Math.PI*2);ctx.fill();}ctx.font='8px monospace';ctx.fillStyle='#ff8888';ctx.fillText('Malware.exe',cx,cy+36);}
  function drawNullDragon(x,y,col,t){var cx=x+55,cy=y+55;var roar=Math.sin(t*0.08)>0.8;ctx.fillStyle='#440044';ctx.beginPath();ctx.moveTo(cx,cy-20);ctx.lineTo(cx-75,cy-65);ctx.lineTo(cx-55,cy-8);ctx.lineTo(cx-18,cy+2);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(cx,cy-20);ctx.lineTo(cx+75,cy-65);ctx.lineTo(cx+55,cy-8);ctx.lineTo(cx+18,cy+2);ctx.closePath();ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(cx,cy,36,50,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#cc00cc';ctx.beginPath();ctx.arc(cx,cy-62,22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#880088';ctx.beginPath();ctx.moveTo(cx-14,cy-82);ctx.lineTo(cx-20,cy-108);ctx.lineTo(cx-7,cy-77);ctx.fill();ctx.beginPath();ctx.moveTo(cx+14,cy-82);ctx.lineTo(cx+20,cy-108);ctx.lineTo(cx+7,cy-77);ctx.fill();var glow=Math.sin(t*0.15)*0.5+0.5;ctx.fillStyle='rgba(255,'+(Math.floor(glow*200))+',0,1)';ctx.beginPath();ctx.arc(cx-10,cy-66,6,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+10,cy-66,6,0,Math.PI*2);ctx.fill();if(roar){ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(cx,cy-53,10,0,Math.PI);ctx.fill();}ctx.strokeStyle='#aa00aa';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(cx+33,cy+40);ctx.quadraticCurveTo(cx+58,cy+62,cx+48,cy+82);ctx.stroke();ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillStyle='#ff00ff';ctx.fillText('NULL_DRAGON',cx,cy+92);}
  function drawDefaultEnemy(x,y,col,t){var cx=x+40,cy=y+45;ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx,cy,28,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(cx-8,cy-8,6,6);ctx.fillRect(cx+2,cy-8,6,6);ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText('ENEMY',cx,cy+40);}

  // ── drawEquip ───────────────────────────────────────────────────
  function drawEquip(){
    ctx.fillStyle='#050518';ctx.fillRect(0,0,W,H-20);
    ctx.textAlign='center';ctx.font='bold 13px monospace';ctx.fillStyle='#ffcc00';ctx.fillText('装備管理 [E:閉じる / Esc:戻る]',W/2,18);
    var tabs=['⚔ 武器(CPU/GPU)','🛡 防具(RAM/SSD)','💎 アクセサリ'];
    for(var ti=0;ti<tabs.length;ti++){
      var tx4=8+ti*(W/3-3),tw4=W/3-6;
      ctx.fillStyle=equipTab===ti?'#223366':'#0a0a22';ctx.fillRect(tx4,22,tw4,18);
      ctx.strokeStyle=equipTab===ti?'#88aaff':'#223';ctx.lineWidth=1;ctx.strokeRect(tx4,22,tw4,18);
      ctx.font=(equipTab===ti?'bold ':'')+' 9px monospace';ctx.fillStyle=equipTab===ti?'#fff':'#888';ctx.textAlign='center';ctx.fillText(tabs[ti],tx4+tw4/2,35);
    }
    var slots=['weapon','armor','accessory'];
    var slot=slots[equipTab];
    var items=HARDWARE_DB[slot]||[];
    var lv=getLbLv(),eq=getLbEq(),inv=getLbInv();
    var owned=items.filter(function(it){return it.lv<=lv&&(it.drop===0||inv.indexOf(it.id)>=0);});
    var y2=44;
    if(owned.length===0){ctx.font='10px monospace';ctx.fillStyle='#666';ctx.textAlign='center';ctx.fillText('レベルアップで装備解放されます',W/2,80);}
    for(var ii=0;ii<owned.length;ii++){
      var it=owned[ii],sel=ii===equipCursor,equipped=eq[slot]===it.id;
      ctx.fillStyle=sel?'#1a2244':(equipped?'#0a2a0a':'#0a0a1a');ctx.fillRect(4,y2+ii*22,W-8,20);
      ctx.strokeStyle=sel?'#ffff00':(equipped?'#44cc44':'#223');ctx.lineWidth=1;ctx.strokeRect(4,y2+ii*22,W-8,20);
      ctx.font=(sel?'bold ':'')+' 9px monospace';ctx.fillStyle=sel?'#fff':'#aaa';ctx.textAlign='left';
      ctx.fillText((equipped?'✓ ':' ')+it.name+(slot==='weapon'?' ATK+'+it.atk:slot==='armor'?' HP+'+it.hp+' DEF+'+it.def:' MP+'+it.mp),10,y2+ii*22+14);
      ctx.font='8px monospace';ctx.fillStyle='#556677';ctx.textAlign='right';ctx.fillText('Lv.'+it.lv+' '+it.desc,W-8,y2+ii*22+14);ctx.textAlign='left';
    }
    // current stats preview (positioned to leave room for control hint)
    var st=getStats();
    var sy4=H-90;ctx.fillStyle='rgba(0,0,30,0.85)';ctx.fillRect(4,sy4,W-8,52);ctx.strokeStyle='#334';ctx.lineWidth=1;ctx.strokeRect(4,sy4,W-8,52);
    ctx.font='9px monospace';ctx.fillStyle='#88aaff';ctx.textAlign='left';
    ctx.fillText('現在の装備ステータス: HP '+st.hp+' / ATK '+st.atk+' / DEF '+st.def+' / MP '+st.mp,10,sy4+14);
    var langs=getAvailLangs();ctx.fillStyle='#88ff88';ctx.fillText('解放済み言語: '+(langs.length>0?langs.map(function(l){return l.icon+l.id;}).join(' '):'(なし)'),10,sy4+28);
    ctx.fillStyle='#ffaa44';ctx.fillText('LinuC Lv.'+CHAPTERS[Math.min(getLbCh(),9)].tier+' / 現在エリア: '+CHAPTERS[currentArea].area,10,sy4+42);
    ctx.font='9px monospace';ctx.fillStyle='#444466';ctx.textAlign='center';ctx.fillText('↑↓:選択  Enter:装備  ←→:タブ  Esc:戻る',W/2,H-34);
  }

  var _mod={init:init,update:update,draw:draw,onKey:onKey};
  registerGame('linuxbattle',_mod);
  return _mod;
})();

