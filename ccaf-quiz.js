// ── CCAF-QUIZ.JS ── Claude Certified Architect Foundation 日本語対策モード ──

const ccafQuizGame = (function () {

  // ── 角丸矩形 helper ───────────────────────────────────────────
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── 日本語対応テキスト折り返し ────────────────────────────────
  // CJK文字を幅2、ASCII文字を幅1として計算
  function wrapText(text, maxW) {
    function cw(c) { return c.charCodeAt(0) > 0x2E7F ? 2 : 1; }
    function tokW(s) { let w = 0; for (const c of s) w += cw(c); return w; }

    const lines = [];
    const tokens = text.split(/(\s+)/);
    let line = '';
    let lineW = 0;

    for (const tok of tokens) {
      const tw = tokW(tok);
      if (lineW + tw > maxW && line.trim()) {
        lines.push(line.trim());
        const trimmed = tok.trim();
        line = trimmed;
        lineW = tokW(trimmed);
      } else {
        line += tok;
        lineW += tw;
      }
    }
    if (line.trim()) lines.push(line.trim());

    // スペースなし(日本語のみ)の場合は文字単位で折り返し
    if (lines.length === 0) {
      let cur = '';
      let curW = 0;
      for (const c of text) {
        const cWidth = cw(c);
        if (curW + cWidth > maxW && cur) {
          lines.push(cur);
          cur = c; curW = cWidth;
        } else {
          cur += c; curW += cWidth;
        }
      }
      if (cur) lines.push(cur);
    }
    return lines.length ? lines : [text];
  }

  // ── ドメイン定義（日本語） ────────────────────────────────────
  const DOMAINS = [
    { name: 'エージェント設計 & オーケストレーション', weight: 27, color: '#7b68ee' },
    { name: 'ツール設計 & MCP統合',                   weight: 18, color: '#4fc3f7' },
    { name: 'Claude Code設定',                        weight: 20, color: '#81c784' },
    { name: 'プロンプト設計 & 出力制御',               weight: 20, color: '#ffb74d' },
    { name: 'コンテキスト管理 & 信頼性',              weight: 15, color: '#f06292' },
  ];

  // ── 全問題プール (45問) ──────────────────────────────────────
  // optExp: 各選択肢の解説 [A, B, C, D]
  // ref: 参考URL (短縮形)
  const ALL_QUESTIONS = [

    // ── Domain 0: エージェント設計 & オーケストレーション (9問) ──
    {
      q: 'マルチエージェントシステムで、サブエージェントを指揮し結果を統合するClaudeの役割は何か？',
      opts: ['A. サブエージェント', 'B. オーケストレーター', 'C. ツールサーバー', 'D. HITLプロキシ'],
      ans: 1, domain: 0,
      exp: 'オーケストレーターが計画・委任・統合を担当。サブエージェントは個別タスクを実行する。',
      optExp: [
        'A: ✗ サブエージェントは指示を受けて実行する側。指揮・統合は行わない。',
        'B: ✓ オーケストレーターが全体計画を立て、サブエージェントに委任し、結果を統合する。',
        'C: ✗ ツールサーバーは外部ツール機能を提供するコンポーネント。オーケストレーションは行わない。',
        'D: ✗ HITLプロキシは人間の承認を仲介する仕組みであり、エージェント指揮とは別の概念。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },
    {
      q: 'エージェントループ中にClaudeがツールを呼び出す際に出力するコンテンツブロックの種類は？',
      opts: ['A. text', 'B. image', 'C. tool_use', 'D. tool_result'],
      ans: 2, domain: 0,
      exp: 'tool_useブロックでツール呼び出しを表現。実行後の結果はtool_resultで返す。',
      optExp: [
        'A: ✗ textは通常のテキスト応答に使われるブロック。ツール呼び出しには使わない。',
        'B: ✗ imageは画像データを表すブロック。ツール呼び出しとは無関係。',
        'C: ✓ Claudeはtool_useブロックを出力してツール呼び出しを指示する。',
        'D: ✗ tool_resultはツール実行後の結果を Claude に返すブロック。Claudeが出力するのではない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/tool-use',
    },
    {
      q: 'エージェントループを終了させる最も適切な条件は何か？',
      opts: [
        'A. モデルが空文字列を出力したとき',
        'B. stop_reasonが"end_turn"またはmax_iterationsに達したとき',
        'C. ユーザーがCtrl-Cを押したとき',
        'D. 最初のツール呼び出しが成功したとき',
      ],
      ans: 1, domain: 0,
      exp: 'stop_reason=="end_turn"の検出と反復上限の両方でループを正しく制御する。',
      optExp: [
        'A: ✗ 空文字列は一時的な出力であり、タスク完了を意味しない。',
        'B: ✓ end_turn検出と反復上限の組み合わせでトークン浪費を防ぎループを終了させる。',
        'C: ✗ Ctrl-Cはプロセス強制終了であり、設計上の終了条件ではない。',
        'D: ✗ 単一ツール成功はタスク完了を意味しない。早期打ち切りになる。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },
    {
      q: 'ヒューマン・イン・ザ・ループ (HITL) を挿入するのに最も適切なタイミングはどれか？',
      opts: [
        'A. ツール呼び出しのたびに毎回確認する',
        'B. モデルが不確かと判断した場合のみ',
        'C. ファイル削除・支払いなど不可逆・高影響アクションの前',
        'D. 完全自律エージェントは一時停止すべきでない',
      ],
      ans: 2, domain: 0,
      exp: 'HITLは取り消せない操作の前に設けるのが最善。毎回確認は実用性を損なう。',
      optExp: [
        'A: ✗ 毎回確認すると実用性が著しく低下し、自動化の意味がなくなる。',
        'B: ✗ モデルの自己評価だけでは不十分。不可逆アクション前の確認が最重要。',
        'C: ✓ 不可逆・高影響アクション（削除・支払い等）の前にHITLチェックポイントを設ける。',
        'D: ✗ 自律性≠無制限実行。高リスク時には人間確認が必須。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },
    {
      q: 'サブエージェントがエラーのtool_resultを返した場合の最善の対処は何か？',
      opts: [
        'A. 即座にユーザーへ例外を発生させる',
        'B. エラー結果をオーケストレーターに渡して再試行・再計画させる',
        'C. エラーを無視して続行する',
        'D. エージェントループ全体を最初からやり直す',
      ],
      ans: 1, domain: 0,
      exp: 'エラーをオーケストレーターに渡すことで、再試行や代替計画への柔軟な切り替えが可能になる。',
      optExp: [
        'A: ✗ ユーザーに渡す前に回復を試みるべき。即例外は過剰反応。',
        'B: ✓ エラーを上位に渡すことでオーケストレーターが再試行・代替案を判断できる。',
        'C: ✗ エラーの無視はデータ損失や誤動作の原因になる。',
        'D: ✗ 全体再起動はコスト・時間の無駄。部分的なリトライが先。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },
    {
      q: 'サブエージェントアーキテクチャの主なメリットは何か？',
      opts: [
        'A. リクエストあたりのAPIコストが削減される',
        'B. 並列専門実行とコンテキストウィンドウの分離',
        'C. ツール呼び出しオーバーヘッドが完全に排除される',
        'D. レート制限がバイパスされる',
      ],
      ans: 1, domain: 0,
      exp: 'サブエージェントは専門化・並列化によりスケーラビリティとコンテキスト分離を実現する。',
      optExp: [
        'A: ✗ 複数の呼び出しが発生するため合計コストは増加することが多い。',
        'B: ✓ 専門化されたサブエージェントの並列実行とコンテキスト分離がスケーラビリティを向上させる。',
        'C: ✗ サブエージェント間の通信には依然コストがかかる。',
        'D: ✗ APIレート制限はアーキテクチャに関わらず全リクエストに適用される。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },
    {
      q: 'エージェントが長時間タスクで予期しない状況に遭遇した場合の最善の対処は？',
      opts: [
        'A. タスクを中断してユーザーに即座に報告する',
        'B. 状況をオーケストレーターに渡し、続行・停止・代替案を判断させる',
        'C. エラーログに記録して何事もなかったように処理を続ける',
        'D. 同じ操作を無制限にリトライする',
      ],
      ans: 1, domain: 0,
      exp: '予期しない状況はオーケストレーターが判断すべき。中断か継続かは上位ロジックで決定する。',
      optExp: [
        'A: ✗ 中断が必要かはオーケストレーターが判断すべき。サブエージェントが勝手に止めるのは不適切。',
        'B: ✓ 状況を上位に渡してオーケストレーターが最善の対処を判断するのが正しいパターン。',
        'C: ✗ エラーを隠蔽することで後続処理が誤った前提で進む危険がある。',
        'D: ✗ 無制限リトライはトークン・コストを無駄に消費するアンチパターン。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },
    {
      q: 'マルチエージェントシステムにおけるサブエージェントのコンテキストウィンドウはどうなるか？',
      opts: [
        'A. オーケストレーターのコンテキストをすべて共有する',
        'B. 各サブエージェントが独立したコンテキストウィンドウを持つ',
        'C. グローバルな共有メモリにすべて保存される',
        'D. コンテキストは持たず、ツール呼び出しのみで動作する',
      ],
      ans: 1, domain: 0,
      exp: 'サブエージェントは独立したコンテキストを持つため、フォーカスと分離が実現できる。',
      optExp: [
        'A: ✗ コンテキストを完全共有すると分離のメリットが失われ、ウィンドウが肥大化する。',
        'B: ✓ 各サブエージェントは独立したコンテキストウィンドウを持ち、専門タスクに集中できる。',
        'C: ✗ グローバル共有メモリはマルチエージェントの標準アーキテクチャではない。',
        'D: ✗ サブエージェントもClaudeモデルであり、通常のコンテキストウィンドウを持つ。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },
    {
      q: 'エージェントパイプラインで「最小権限の原則」を適用する主な目的は？',
      opts: [
        'A. APIコールの数を減らすため',
        'B. エージェントが必要最低限のツールとアクセス権しか持たないようにするため',
        'C. 処理速度を向上させるため',
        'D. コンテキストウィンドウを小さく保つため',
      ],
      ans: 1, domain: 0,
      exp: '最小権限の原則により、エラーや悪意ある入力によるシステムへの影響範囲を最小化できる。',
      optExp: [
        'A: ✗ APIコール数の削減は最小権限の目的ではない。',
        'B: ✓ 必要最低限の権限のみ付与することで、誤動作や攻撃時の被害を限定できる。',
        'C: ✗ 権限制限が速度改善に直接つながるわけではない。',
        'D: ✗ コンテキストサイズと権限制限は別の概念。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },

    // ── Domain 1: ツール設計 & MCP統合 (9問) ──
    {
      q: 'MCPサーバーが標準入出力(stdin/stdout)経由で通信する際のトランスポートプロトコルは？',
      opts: ['A. SSE（Server-Sent Events）', 'B. WebSocket', 'C. stdio', 'D. gRPC'],
      ans: 2, domain: 1,
      exp: 'stdioトランスポートはstdin/stdout上でJSON-RPCメッセージを送受信する。ローカルプロセス向け。',
      optExp: [
        'A: ✗ SSEはHTTP経由のリモートサーバーへのイベントプッシュに使う。stdioではない。',
        'B: ✗ WebSocketはMCPの標準トランスポートとして採用されていない。',
        'C: ✓ ローカルプロセス間通信にはstdioトランスポートを使い、JSON-RPCでやり取りする。',
        'D: ✗ gRPCはMCPの標準仕様に含まれておらず、サポートされていない。',
      ],
      ref: 'modelcontextprotocol.io/docs/concepts/transports',
    },
    {
      q: 'MCPツールスキーマで、パラメータを必須にするJSONスキーマのキーワードは？',
      opts: [
        'A. "mandatory": true',
        'B. オブジェクトレベルの "required" 配列',
        'C. "nullable": false',
        'D. "optional": false',
      ],
      ans: 1, domain: 1,
      exp: 'JSON Schemaでは {"required": ["param1"]} のようにオブジェクトレベルで必須フィールドを宣言する。',
      optExp: [
        'A: ✗ "mandatory"はJSON Schemaの標準キーワードではない。存在しないプロパティ。',
        'B: ✓ JSON Schemaの"required"配列にプロパティ名を列挙して必須を宣言する正式な方法。',
        'C: ✗ "nullable"はOpenAPI拡張仕様であり、required（必須化）とは別の概念。',
        'D: ✗ "optional"もJSON Schemaの標準キーワードには存在しない。',
      ],
      ref: 'modelcontextprotocol.io/docs/concepts/tools',
    },
    {
      q: 'MCPのSSEトランスポートが最も適するシナリオはどれか？',
      opts: [
        'A. プロセス分離が必要なローカルCLIツール',
        'B. リアルタイムイベントをプッシュするリモートHTTPサーバー',
        'C. バッチファイル処理パイプライン',
        'D. オフライン組み込みデバイス',
      ],
      ans: 1, domain: 1,
      exp: 'SSEはHTTP上でサーバーからクライアントへリアルタイムイベントをプッシュするのに適する。',
      optExp: [
        'A: ✗ ローカルCLIツールにはstdioトランスポートが適切。SSEは不要なネットワーク依存を生む。',
        'B: ✓ SSEはリモートHTTPサーバーがイベントをプッシュするユースケースに最適。',
        'C: ✗ バッチ処理に双方向リアルタイムプッシュは不要で、オーバースペック。',
        'D: ✗ SSEにはネットワーク接続が必要。オフラインデバイスには使えない。',
      ],
      ref: 'modelcontextprotocol.io/docs/concepts/transports',
    },
    {
      q: '公開MCPサーバーのHTTPエンドポイントに推奨される認証方法は？',
      opts: [
        'A. ツールのdescription文字列に秘密情報を埋め込む',
        'B. OAuth 2.0 / Bearerトークンでサーバー側が検証',
        'C. IPアドレス制限のみ',
        'D. 認証不要 — MCPは元々安全',
      ],
      ans: 1, domain: 1,
      exp: 'OAuth 2.0 Bearer tokenは標準的で監査可能な認証手段。公開APIの保護に適している。',
      optExp: [
        'A: ✗ description文字列に秘密情報を埋め込むと外部公開される重大なセキュリティリスクになる。',
        'B: ✓ OAuth 2.0 / Bearerトークンはオープンな標準で、スコープ制御・監査が可能。',
        'C: ✗ IPアドレス制限だけでは認可制御として不十分。なりすましに対して脆弱。',
        'D: ✗ MCPに固有のセキュリティ機能はない。適切な認証は実装者の責任。',
      ],
      ref: 'modelcontextprotocol.io/docs/concepts/transports',
    },
    {
      q: 'MCPツール設計で「コンポーザブル（組み合わせやすい）」ツールセットとは何か？',
      opts: [
        'A. 各ツールが明確な入出力を持つ単一のアクションを実行する',
        'B. すべてのツールが単一の巨大な入力スキーマを共有する',
        'C. ラウンドトリップ削減のため全機能を1つのメガ関数にまとめる',
        'D. スキーマなしでモデルが自由にパラメータを決める',
      ],
      ans: 0, domain: 1,
      exp: '単一責任の原則に従ったツールが組み合わせやすい設計になる。密結合は保守性を下げる。',
      optExp: [
        'A: ✓ 各ツールが単一の明確なアクションを持つことで、組み合わせ・テスト・再利用が容易になる。',
        'B: ✗ 巨大な共有スキーマは密結合を生みメンテナンスが困難になる。',
        'C: ✗ メガ関数は再利用性・テスト性が著しく低下するアンチパターン。',
        'D: ✗ スキーマなしでは型安全性が失われ、モデルが誤ったパラメータを渡す原因になる。',
      ],
      ref: 'modelcontextprotocol.io/docs/concepts/tools',
    },
    {
      q: 'MCPサーバー実装においてツールの"description"フィールドが主に影響するのは？',
      opts: [
        'A. ネットワークのタイムアウト閾値',
        'B. モデルがいつどのようにツールを呼び出すかの判断',
        'C. 使用される認証メカニズム',
        'D. 選択されるトランスポートプロトコル',
      ],
      ans: 1, domain: 1,
      exp: 'descriptionはモデルのツール選択・呼び出し判断の主要シグナル。明確な記述が精度を左右する。',
      optExp: [
        'A: ✗ タイムアウトはサーバー設定やネットワーク設定で制御する。descriptionとは無関係。',
        'B: ✓ モデルはdescriptionを読んで、いつそのツールを使うべきか・どう呼ぶかを判断する。',
        'C: ✗ 認証はサーバー設定やOAuthフローで決まる。descriptionは関係しない。',
        'D: ✗ トランスポートは接続設定（stdio/SSE）で決まり、descriptionは関係しない。',
      ],
      ref: 'modelcontextprotocol.io/docs/concepts/tools',
    },
    {
      q: 'MCPツールのtool_useブロックとtool_resultブロックの役割の違いは？',
      opts: [
        'A. どちらもClaudeが出力するブロックで、内容に違いはない',
        'B. tool_useがClaudeのツール呼び出し指示、tool_resultが呼び出し結果の返却',
        'C. tool_resultはClaudeが出力し、tool_useはAPIが自動生成する',
        'D. tool_useはエラー時のみ使われる特殊なブロック',
      ],
      ans: 1, domain: 1,
      exp: 'Claudeがtool_useを出力→実行者が実行→tool_resultをClaudeに返す、という流れで動作する。',
      optExp: [
        'A: ✗ 2つのブロックは全く異なる役割を持つ。混同しないことが重要。',
        'B: ✓ tool_use＝Claude→実行者へのツール呼び出し指示。tool_result＝実行者→Claudeへの結果返却。',
        'C: ✗ tool_resultは実行者（呼び出し側コード）が生成してClaudeに渡すもの。',
        'D: ✗ tool_useは正常な処理フローで常に使われる。エラー専用ではない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/tool-use',
    },
    {
      q: 'MCP対応ツールのスキーマで"type": "object"を最上位に置く主な理由は？',
      opts: [
        'A. JSON Schema仕様の要件として引数全体をオブジェクトで包む必要があるため',
        'B. オブジェクト型のみAPIに送信できるため',
        'C. モデルがパラメータ名を無視できるようにするため',
        'D. ネストしたツールの呼び出しを可能にするため',
      ],
      ans: 0, domain: 1,
      exp: 'MCP/Anthropic APIのツールスキーマは引数をobjectとして定義し、propertiesで各パラメータを記述する仕様。',
      optExp: [
        'A: ✓ ツールの引数スキーマはtypeをobjectとし、properties内に各パラメータを定義するのが仕様。',
        'B: ✗ API送信可能な型は複数あるが、ツールスキーマの最上位はobjectが仕様要件。',
        'C: ✗ objectのpropertiesでパラメータ名を明示するのが目的。名前を無視するためではない。',
        'D: ✗ ネスト呼び出しとobject型は直接関係しない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/tool-use',
    },
    {
      q: 'MCPサーバーを実装する際、ツールの実行結果に含めるべき最も重要な要素は？',
      opts: [
        'A. 実行時間とメモリ使用量の詳細統計',
        'B. モデルが次のアクションを判断できる情報と、エラー発生時は明確なエラーメッセージ',
        'C. 常に成功レスポンスのみ（エラーは隠蔽）',
        'D. 次に呼ぶべきツール名の推奨リスト',
      ],
      ans: 1, domain: 1,
      exp: '結果には次の判断に必要な情報を含め、エラー時は明確なメッセージを返すことで回復可能にする。',
      optExp: [
        'A: ✗ 統計情報は有用なこともあるが、必須ではなくモデルの判断に直接影響しない。',
        'B: ✓ モデルが次のアクションを判断できる情報と、エラー時の明確なメッセージが最も重要。',
        'C: ✗ エラーを隠蔽するとモデルが誤った前提で処理を続けてしまう。',
        'D: ✗ 次のツール選択はモデルが判断すべきこと。結果に含める必要はない。',
      ],
      ref: 'modelcontextprotocol.io/docs/concepts/tools',
    },

    // ── Domain 2: Claude Code設定 (9問) ──
    {
      q: 'Claude Codeがプロジェクト固有の指示とコンテキストを自動で読み込むファイルは？',
      opts: ['A. .claudeignore', 'B. CLAUDE.md', 'C. .claude/config.json', 'D. README.md'],
      ans: 1, domain: 2,
      exp: 'CLAUDE.mdがClaude Codeのプロジェクトメモリファイル。自動的に読み込まれ指示として機能する。',
      optExp: [
        'A: ✗ .claudeignoreはClaudeが無視するファイルパターンを定義するファイル。指示ではない。',
        'B: ✓ CLAUDE.mdはClaude Codeが自動読み込みするプロジェクト固有の指示・コンテキストファイル。',
        'C: ✗ .claude/config.jsonはClaude Codeの設定ファイル形式として一般的ではない。',
        'D: ✗ README.mdはClaudeに特別扱いされない。明示的に渡さない限り自動読み込みされない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/memory',
    },
    {
      q: 'Claude CodeのPreToolUseフックが発火するタイミングはいつか？',
      opts: [
        'A. ツール結果がモデルに返された後',
        'B. Claudeがツール呼び出しを実行する前（傍受・拒否が可能）',
        'C. bashコマンドが失敗した時のみ',
        'D. セッション終了時',
      ],
      ans: 1, domain: 2,
      exp: 'PreToolUseは実行前フック。ツール呼び出しの傍受・検証・拒否が可能。PostToolUseは実行後。',
      optExp: [
        'A: ✗ 実行後に発火するのはPostToolUseフック。PreToolUseは実行前。',
        'B: ✓ PreToolUseはツール実行前に発火し、ログ記録・検証・拒否などの処理を挿入できる。',
        'C: ✗ PreToolUseは成功・失敗に関わらず全ツール呼び出しの前に発火する。',
        'D: ✗ セッション終了時のフックは別（Stopフック）。PreToolUseとは無関係。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/hooks',
    },
    {
      q: 'Claude Codeが/etcに書き込めないよう防ぐ設定は？',
      opts: [
        'A. allow: ["Write(/etc)"]',
        'B. deny: ["Write(/etc/**)", "Write(/etc)"]',
        'C. CLAUDE.mdにreadonly: trueを記述',
        'D. disableShell: true',
      ],
      ans: 1, domain: 2,
      exp: 'denyルールにglobパターンを指定して特定のツール+パスの組み合わせをブロックする。',
      optExp: [
        'A: ✗ allowは許可を与えるルール。これでは/etcへの書き込みを許可してしまう逆効果。',
        'B: ✓ denyルールにglobパターンを使い、/etc配下のすべての書き込みを禁止できる。',
        'C: ✗ readonly: trueはCLAUDE.mdの設定項目として存在しない。',
        'D: ✗ disableShell: trueはシェル実行の制御であり、Writeツールの制御とは別。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/settings',
    },
    {
      q: 'CLAUDE.mdファイルでのセクション分けに推奨される記法は何か？',
      opts: [
        'A. <section>などのXMLタグ',
        'B. Markdownの見出し (## セクション名)',
        'C. "section"キーを持つJSONブロック',
        'D. YAMLフロントマターのみ',
      ],
      ans: 1, domain: 2,
      exp: 'Markdown見出しはシンプルで可読性が高く、Claude Codeが解析しやすい標準的な記法。',
      optExp: [
        'A: ✗ XMLタグも解釈されるが、CLAUDE.mdの推奨はMarkdown形式。',
        'B: ✓ ## や ### などのMarkdown見出しでセクションを分けるのが推奨される慣習。',
        'C: ✗ JSONブロックは読みにくく、CLAUDE.mdのMarkdown形式と馴染みにくい。',
        'D: ✗ YAMLフロントマターは限定的なメタデータ記述向け。セクション分けには不向き。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/memory',
    },
    {
      q: 'コード編集後に自動でテストを実行するのに最適なフックの種類は？',
      opts: ['A. PreToolUse', 'B. OnSessionStart', 'C. PostToolUse', 'D. OnError'],
      ans: 2, domain: 2,
      exp: 'PostToolUseは編集完了後に発火するため、テストランナーの自動起動に最適。',
      optExp: [
        'A: ✗ PreToolUseは実行前フック。編集後のテスト実行タイミングとして早すぎる。',
        'B: ✗ OnSessionStartはセッション開始時に発火。編集後ではない。',
        'C: ✓ PostToolUseは編集（Write/Edit等）完了後に発火するため、自動テストトリガーに最適。',
        'D: ✗ OnErrorはエラー発生時のみ動作。通常の自動テストには使えない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/hooks',
    },
    {
      q: 'Claude Codeのallow/denyルールはどの優先順位で評価されるか？',
      opts: [
        'A. allowルールが先。マッチすればdenyをスキップ',
        'B. denyルールが優先 — denyがallowに勝つ',
        'C. アルファベット順でツール名を評価',
        'D. 設定ファイルでの出現順、最後のルールが優先',
      ],
      ans: 1, domain: 2,
      exp: 'denyは最強の権限制御。denyがマッチすれば、allowルールに関係なく常にブロックされる。',
      optExp: [
        'A: ✗ allowが優先されると悪意ある設定でdenyを無効化できてしまう。正しい評価順ではない。',
        'B: ✓ denyルールが優先される。セキュリティポリシーとして最も安全な評価方式。',
        'C: ✗ アルファベット順での評価は行われない。',
        'D: ✗ 出現順・最後優先の評価方式は採用されていない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/settings',
    },
    {
      q: 'CLAUDE.mdに記述する「プロジェクトのコーディング規約」が有効なのはなぜか？',
      opts: [
        'A. Claudeがコードを書く際にそのファイルを参照して従うため',
        'B. 他のAIモデルも自動的に読み込むため',
        'C. コンパイラが規約違反を自動検出するため',
        'D. GitHubのCIが規約チェックを自動実行するため',
      ],
      ans: 0, domain: 2,
      exp: 'Claude CodeはCLAUDE.mdをセッション開始時に読み込み、記述されたルールに従って動作する。',
      optExp: [
        'A: ✓ Claude CodeはCLAUDE.mdを自動読み込みし、記載されたコーディング規約に従ってコードを生成する。',
        'B: ✗ CLAUDE.mdはClaude Code専用。他のAIモデルが自動的に読み込む仕組みはない。',
        'C: ✗ コンパイラはCLAUDE.mdを認識しない。規約チェックはLinterやテストが担う。',
        'D: ✗ GitHub CIもCLAUDE.mdを自動認識しない。CI設定は別途必要。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/memory',
    },
    {
      q: 'Claude Codeで特定のファイルやディレクトリをモデルが参照しないようにするには？',
      opts: [
        'A. CLAUDE.mdに除外リストを書く',
        'B. .claudeignoreファイルにglobパターンを記述する',
        'C. ファイル名を隠しファイル（.ドット始まり）にする',
        'D. denyルールにReadツールを追加する',
      ],
      ans: 1, domain: 2,
      exp: '.claudeignoreは.gitignoreと同じ構文でClaude Codeが無視するパスを定義する。',
      optExp: [
        'A: ✗ CLAUDE.mdは指示・コンテキスト用のファイル。除外リストには使わない。',
        'B: ✓ .claudeignoreに.gitignore構文でパターンを記述すると、Claude Codeはそれらを無視する。',
        'C: ✗ 隠しファイルはClaudeの参照制御とは無関係。アクセス可能なままになる。',
        'D: ✗ denyルールはツール実行制御用。ファイル無視には.claudeignoreを使う。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/settings',
    },
    {
      q: 'Claude Codeのセッション開始時 (OnSessionStart) フックの典型的な用途は？',
      opts: [
        'A. 編集後のファイルを自動でgit commitする',
        'B. プロジェクトの状態確認やウォームアップスクリプトの実行',
        'C. 各ツール呼び出し前のバリデーション',
        'D. エラー発生時のロールバック処理',
      ],
      ans: 1, domain: 2,
      exp: 'OnSessionStartはセッション開始時のウォームアップ・環境確認・初期化に適している。',
      optExp: [
        'A: ✗ git commitは編集後のPostToolUseフックで実行するのが適切。',
        'B: ✓ セッション開始時に環境確認・依存チェック・初期化スクリプトを実行するのが典型的用途。',
        'C: ✗ 各ツール呼び出し前のバリデーションはPreToolUseフックが担う。',
        'D: ✗ エラー時のロールバックはエラーハンドリングロジックやOnErrorフックで対応する。',
      ],
      ref: 'docs.anthropic.com/ja/docs/claude-code/hooks',
    },

    // ── Domain 3: プロンプト設計 & 出力制御 (9問) ──
    {
      q: 'Claudeが特定の出力フォーマットに従う可能性を最も高めるシステムプロンプトの要素は？',
      opts: [
        'A. 禁止トピックの長いリスト',
        'B. 期待するフォーマットを示す具体的なFew-shotサンプル',
        'C. temperatureパラメータの引き上げ',
        'D. 全大文字による指示文',
      ],
      ans: 1, domain: 3,
      exp: 'Few-shotサンプルはフォーマット準拠に最も効果的なシグナル。具体例が抽象的指示より強い。',
      optExp: [
        'A: ✗ 禁止リストはコンテンツ制御に使う。出力フォーマットの制御には効果が限定的。',
        'B: ✓ 具体的なFew-shotサンプルは、モデルが期待フォーマットを「見て」学べる最強のシグナル。',
        'C: ✗ temperature上昇は多様性を増やし、フォーマット準拠率を下げる方向に働く。',
        'D: ✗ 大文字化が従順性に与える効果は統計的に限定的。Few-shotの方が遥かに効果的。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering',
    },
    {
      q: 'ClaudeからJSON出力を確実に得るための最も信頼性の高い方法はどれか？',
      opts: [
        'A. 「JSONで返すよう試みてください」と依頼する',
        'B. JSONスキーマ付きの構造化出力機能を使用する',
        'C. 正規表現で後処理してJSONを抽出する',
        'D. temperature=0に設定する',
      ],
      ans: 1, domain: 3,
      exp: 'スキーマ制約付き構造化出力は文法レベルでJSON形式を強制し、パース失敗を防ぐ。',
      optExp: [
        'A: ✗ 努力指示は保証にならない。モデルが従わない場合がある。',
        'B: ✓ JSONスキーマを使った構造化出力機能は文法レベルで有効なJSONを保証する最も確実な方法。',
        'C: ✗ 後処理は形式を制御するのではなく、壊れた出力を修復しようとするだけ。根本的解決ではない。',
        'D: ✗ temperature=0は決定論的にするが、有効なJSONが生成される保証はない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/structured-outputs',
    },
    {
      q: 'プロンプトでXMLタグ (<document>, <instructions>等) を使う主な効果は？',
      opts: [
        'A. 自動的にトークン数を削減する',
        'B. セクションを明確に区切り、Claudeが各部分を識別しやすくする',
        'C. ツール呼び出しを有効化する',
        'D. コンテンツフィルターをバイパスできる',
      ],
      ans: 1, domain: 3,
      exp: 'XMLタグはセマンティック境界として機能し、プロンプトの各部分の混同を防ぐ。',
      optExp: [
        'A: ✗ XMLタグ自体がトークンを消費するため、トークン数は増える方向に働く。',
        'B: ✓ XMLタグがセクションの境界を明確化し、Claudeがプロンプト構造を正確に把握できるようになる。',
        'C: ✗ ツール呼び出しはtool_useブロックで行う。XMLタグは関係しない。',
        'D: ✗ コンテンツフィルターのバイパスはできない。そのような機能は存在しない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering',
    },
    {
      q: 'ClaudeのJSON出力をPython型オブジェクトに変換するためにPydanticが使われる主な目的は？',
      opts: [
        'A. システムプロンプトを自動生成する',
        'B. ClaudeのJSON出力を型付きPythonオブジェクトとしてバリデーション・パースする',
        'C. ストリーミングレスポンスを処理する',
        'D. API認証を管理する',
      ],
      ans: 1, domain: 3,
      exp: 'PydanticモデルでClaudeのJSONをバリデーションし、型エラーをパイプラインの早い段階で検出する。',
      optExp: [
        'A: ✗ PydanticはPythonのデータバリデーションライブラリ。プロンプト生成機能はない。',
        'B: ✓ PydanticモデルにClaudeのJSON出力をパースし、型安全性を保証して型エラーを早期発見する。',
        'C: ✗ ストリーミング処理はAnthropicのSDKが提供するstream APIが担う。',
        'D: ✗ API認証はAPIキー管理の問題。Pydanticの役割ではない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/structured-outputs',
    },
    {
      q: 'ハルシネーション（架空情報の生成）を最も効果的に減らすシステムプロンプトの記述は？',
      opts: [
        'A. 「自信を持って答えてください」と伝える',
        'B. 根拠がない場合は「わかりません」と言うよう例示付きで指示する',
        'C. 知識カットオフを無効化する設定を加える',
        'D. max_tokensを増やして詳細な回答を促す',
      ],
      ans: 1, domain: 3,
      exp: '不確実性を認める明示的な指示と例示が、Claudeの信頼度校正に最も効果的。',
      optExp: [
        'A: ✗ 自信の強調は逆にハルシネーションを増加させる。根拠のない「自信」は有害。',
        'B: ✓ 「証拠がなければわかりませんと答える」という指示と例示が信頼度を正しく校正する。',
        'C: ✗ 知識カットオフは変更不可能であり、ハルシネーション対策にもならない。',
        'D: ✗ max_tokens増加はハルシネーション率に直接影響しない。内容の質とは別の設定。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering',
    },
    {
      q: '構造化出力のJSONスキーマで "additionalProperties": false が保証することは？',
      opts: [
        'A. 数値フィールドが常に正の値である',
        'B. モデルがスキーマ外のキーをレスポンスに追加できない',
        'C. 配列フィールドに少なくとも1つの要素がある',
        'D. すべての文字列フィールドが空でない',
      ],
      ans: 1, domain: 3,
      exp: 'additionalProperties: falseはスキーマ外のキーを排除し、出力をスキーマ定義通りに厳密化する。',
      optExp: [
        'A: ✗ 正の値制約にはminimum: 0またはexclusiveMinimum: 0を使う。',
        'B: ✓ additionalProperties: falseにより、スキーマに定義されていないキーの追加が禁止される。',
        'C: ✗ 配列の最小要素数にはminItems: 1を使う。',
        'D: ✗ 文字列の非空制約にはminLength: 1を使う。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/structured-outputs',
    },
    {
      q: 'Chain-of-Thought（思考の連鎖）プロンプティングの主な目的は？',
      opts: [
        'A. 出力トークン数を削減する',
        'B. モデルに段階的な推論ステップを踏ませ、複雑な問題の精度を上げる',
        'C. ストリーミングAPIを有効化する',
        'D. プロンプトのトークンコストを下げる',
      ],
      ans: 1, domain: 3,
      exp: 'CoTはモデルに中間ステップを明示させることで複雑な推論タスクの精度が向上する。',
      optExp: [
        'A: ✗ CoTは中間ステップを生成するため出力トークン数は増加する傾向にある。',
        'B: ✓ 「まず…次に…最終的に…」と段階的に考えさせることで、複雑な推論精度が向上する。',
        'C: ✗ ストリーミングAPIはパラメータで有効化するもの。CoTとは無関係。',
        'D: ✗ CoTは追加トークンが発生するためコストは上がる。コスト削減ではない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering',
    },
    {
      q: 'システムプロンプトとユーザーメッセージの役割の違いとして最も正確なのは？',
      opts: [
        'A. システムプロンプトはAPIコストが低く、ユーザーメッセージは高い',
        'B. システムプロンプトは会話全体に適用される指示・コンテキスト、ユーザーメッセージは個々のリクエスト',
        'C. ユーザーメッセージはシステムプロンプトを上書きできない',
        'D. システムプロンプトは最初の1回しか読まれない',
      ],
      ans: 1, domain: 3,
      exp: 'システムプロンプトは会話全体の基盤となる指示・ペルソナ・制約を設定する。',
      optExp: [
        'A: ✗ トークンコストは入力トークンとして同等に計算される。役割での価格差はない。',
        'B: ✓ システムプロンプトは全体的な指示・コンテキストを提供し、ユーザーメッセージは個々の要求を伝える。',
        'C: ✗ ユーザーメッセージの内容によってはシステムプロンプトの一部の動作が変化する場合がある。',
        'D: ✗ システムプロンプトは毎回のAPI呼び出しで提供される。1回きりではない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering',
    },
    {
      q: 'モデルへの指示の明確さを高める「制約条件の具体化」の例として最も適切なのは？',
      opts: [
        'A. 「できるだけ短く答えてください」',
        'B. 「200文字以内で、箇条書き3点以内でまとめてください」',
        'C. 「簡潔にお願いします」',
        'D. 「なるべく分かりやすく」',
      ],
      ans: 1, domain: 3,
      exp: '測定可能な制約（文字数・形式・点数）を具体的に指定するほど出力の一貫性が高まる。',
      optExp: [
        'A: ✗ 「できるだけ短く」は主観的で測定不能。モデルごとに解釈が異なる。',
        'B: ✓ 「200文字以内・箇条書き3点以内」のように数値と形式を明示すると出力が安定する。',
        'C: ✗ 「簡潔に」は相対的な表現。何を基準に「簡潔」とするかが不明確。',
        'D: ✗ 「わかりやすく」も主観的。対象読者・専門レベルを明示する方が効果的。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering',
    },

    // ── Domain 4: コンテキスト管理 & 信頼性 (9問) ──
    {
      q: 'ClaudeのAPIで大きな静的システムプロンプトのプロンプトキャッシングを有効にするには？',
      opts: [
        'A. リクエストボディに "cache": true を追加',
        'B. コンテンツブロックに cache_control: {"type":"ephemeral"} を指定',
        'C. X-Cache-Control HTTPヘッダーを追加',
        'D. キャッシングは自動で設定不要',
      ],
      ans: 1, domain: 4,
      exp: 'cache_control: {type:"ephemeral"}マーカーをコンテンツブロックに付与してキャッシュ対象を指定する。',
      optExp: [
        'A: ✗ "cache": trueというリクエストボディパラメータは存在しない。',
        'B: ✓ コンテンツブロックにcache_control: {type:"ephemeral"}を付与してプロンプトキャッシングを有効化する。',
        'C: ✗ X-Cache-ControlというHTTPヘッダーはAnthropicAPIには存在しない。',
        'D: ✗ プロンプトキャッシングは自動ではない。明示的なcache_controlマーカーが必要。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-caching',
    },
    {
      q: 'プロンプトキャッシングの主なコスト面でのメリットは何か？',
      opts: [
        'A. 出力トークンが低料金で課金される',
        'B. キャッシュされた入力トークンが通常料金の約10%で再処理される',
        'C. キャッシュ済みプロンプトでは安全チェックがスキップされる',
        'D. レイテンシは増えるがコストは変わらない',
      ],
      ans: 1, domain: 4,
      exp: 'キャッシュヒット時の入力トークンは約10%のコストで処理され、繰り返しプロンプトの費用が大幅削減される。',
      optExp: [
        'A: ✗ 出力トークンのキャッシング割引はない。入力トークンの削減がメリット。',
        'B: ✓ キャッシュヒット時は入力トークンが通常料金の約10%で課金され、大幅なコスト削減になる。',
        'C: ✗ 安全チェックはキャッシュに関わらず常に全リクエストで実施される。',
        'D: ✗ キャッシュヒット時はレイテンシも改善する。コストとレイテンシの両方でメリットがある。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-caching',
    },
    {
      q: '529「overloaded」または429レート制限エラー時の正しい最初の対応は？',
      opts: [
        'A. 競合モデルへ永続的に切り替える',
        'B. 即座にタイトループでリトライする',
        'C. ジッター付き指数バックオフでリトライする',
        'D. max_tokensを増やしてリクエスト頻度を下げる',
      ],
      ans: 2, domain: 4,
      exp: '指数バックオフ+ジッターでサンダリングハード問題を回避するのが標準的なエラー処理。',
      optExp: [
        'A: ✗ 一時的なエラーに対して恒久的なモデル変更は過剰反応。適切ではない。',
        'B: ✗ タイトループリトライはサーバー負荷を悪化させ、429エラーをさらに引き起こすアンチパターン。',
        'C: ✓ 指数バックオフ（待ち時間を徐々に増やす）+ジッター（ランダム要素）が正しいリトライ戦略。',
        'D: ✗ max_tokensはリクエストあたりの最大出力トークン数。レート制限とは独立したパラメータ。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/rate-limits',
    },
    {
      q: '長期実行エージェントで「トークン予算」戦略を実装する最善の方法は？',
      opts: [
        'A. トークン数を無視してAPIに制限を任せる',
        'B. 累積入出力トークンを追跡し、制限近くでコンテキストを切り詰める',
        'C. 1000トークンごとにモデルを再起動する',
        'D. 1-shotプロンプトのみを使用してトークンを最小化する',
      ],
      ans: 1, domain: 4,
      exp: 'プロアクティブなトークン追跡とコンテキスト切り詰めで、予期しないコンテキスト上限エラーを防ぐ。',
      optExp: [
        'A: ✗ APIに任せると予期しないエラーで処理が中断する。プロアクティブな管理が必要。',
        'B: ✓ 累積トークンを追跡し、上限に近づいたら古いコンテキストを切り詰めるのが最善の戦略。',
        'C: ✗ 頻繁な再起動でコンテキストが失われ、タスクの継続性が損なわれる。',
        'D: ✗ 1-shotのみでは長期タスクに必要な情報が保持できず、品質が著しく低下する。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/context-windows',
    },
    {
      q: 'Claude APIでextended thinkingなどのベータ機能を有効にするHTTPヘッダーは？',
      opts: [
        'A. X-Beta-Features: true',
        'B. anthropic-beta: <機能名>',
        'C. Authorization: Beta <APIキー>',
        'D. Content-Type: application/beta+json',
      ],
      ans: 1, domain: 4,
      exp: 'anthropic-betaヘッダーに機能名（例: "interleaved-thinking-2025-05-14"）を指定してオプトインする。',
      optExp: [
        'A: ✗ X-Beta-Featuresというヘッダーは存在しない。',
        'B: ✓ anthropic-betaヘッダーにベータ機能名を指定することでオプトインできる。',
        'C: ✗ AuthorizationヘッダーはAPIキー認証に使う。ベータ機能の有効化ではない。',
        'D: ✗ application/beta+jsonというMIMEタイプは存在しない。Content-Typeはapplication/json。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/extended-thinking',
    },
    {
      q: '多数の類似リクエストで大きな共有コンテキストのコストを最小化するには？',
      opts: [
        'A. 毎リクエストで全コンテキストを新規送信する',
        'B. 共有コンテキストをメッセージ先頭に置き、cache_controlでキャッシュする',
        'C. 複数のAPIキーにコンテキストを分散する',
        'D. ストリーミングを使ってサーバー側のコンテキスト保存を回避する',
      ],
      ans: 1, domain: 4,
      exp: 'メッセージ先頭に共有コンテキストを置きcache_controlでキャッシュするとヒット率が最大化される。',
      optExp: [
        'A: ✗ キャッシュを使わないとフルコストが毎回発生する。最も非効率な方法。',
        'B: ✓ 共有コンテキストを先頭に配置してcache_controlを付与するとキャッシュヒット率が最大化される。',
        'C: ✗ APIキーの分散はコスト削減にならない。トークン消費量は変わらない。',
        'D: ✗ ストリーミングはレイテンシ改善技術。コンテキストのキャッシングとは別の概念。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/prompt-caching',
    },
    {
      q: 'Claudeのコンテキストウィンドウが200,000トークンに達しそうな場合の推奨対処は？',
      opts: [
        'A. より大きなコンテキストウィンドウを持つモデルへ常時切り替える',
        'B. 古いメッセージを要約・切り詰めてコンテキストを管理する',
        'C. リクエストを中断してユーザーにコンテキストのリセットを促す',
        'D. max_tokensを0に設定して出力を無効化する',
      ],
      ans: 1, domain: 4,
      exp: '古いメッセージを要約・圧縮してコンテキストを管理するのが最もコスト効率のよい対処。',
      optExp: [
        'A: ✗ 常にモデル切り替えはコスト増大につながる。まず既存コンテキストの最適化を行う。',
        'B: ✓ 古いメッセージを要約して圧縮することで、重要情報を保持しつつコンテキストを維持できる。',
        'C: ✗ ユーザーへのリセット促進はUXを損なう。適切なコンテキスト管理で回避すべき。',
        'D: ✗ max_tokens=0は無効な設定。出力を無効化してもコンテキスト問題は解決しない。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/context-windows',
    },
    {
      q: 'APIリクエストで "temperature" パラメータを0に設定した場合の効果は？',
      opts: [
        'A. モデルが完全にランダムな応答を生成する',
        'B. 応答が決定論的（再現可能）になり、同じ入力に同じ出力が返りやすくなる',
        'C. コンテキストウィンドウが拡張される',
        'D. プロンプトキャッシングが自動有効化される',
      ],
      ans: 1, domain: 4,
      exp: 'temperature=0は最も確率の高いトークンを選択し続けるため、出力が安定・再現可能になる。',
      optExp: [
        'A: ✗ temperature=0は最も確率の高い選択を行う。ランダム性は最小化される。',
        'B: ✓ temperature=0では決定論的な（再現しやすい）出力が得られる。テスト・評価に有用。',
        'C: ✗ temperatureはサンプリングの多様性を制御するパラメータ。コンテキストとは無関係。',
        'D: ✗ キャッシングはcache_controlで明示的に設定する。temperatureとは独立。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/inference',
    },
    {
      q: 'エージェントの信頼性向上のために「フォールバック」を実装する主な目的は？',
      opts: [
        'A. APIコストを削減する',
        'B. プライマリの手段が失敗した際に代替手段でタスクを継続する',
        'C. 応答速度を向上させる',
        'D. コンテキストウィンドウを節約する',
      ],
      ans: 1, domain: 4,
      exp: 'フォールバックは部分的な障害でもエージェントが機能し続けるための耐障害性設計。',
      optExp: [
        'A: ✗ フォールバックの目的はコスト削減ではなく信頼性・継続性の確保。',
        'B: ✓ プライマリ手段の失敗時に別の手段（別ツール・別モデル等）でタスクを継続するのがフォールバックの目的。',
        'C: ✗ フォールバックは応答速度の最適化ではなく信頼性の向上が目的。',
        'D: ✗ コンテキスト管理はフォールバックとは別の最適化。',
      ],
      ref: 'docs.anthropic.com/ja/docs/build-with-claude/agents',
    },
  ];

  // ── 事前学習コンテンツ ───────────────────────────────────────
  const STUDY_CONTENT = [
    { color: '#7b68ee', points: [
      'オーケストレーター = 計画・委任・統合する指揮官',
      'サブエージェント = 個別タスクを実行する実行者',
      'tool_use = Claudeが出力するツール呼び出し指示ブロック',
      'tool_result = 実行者がClaudeに返す結果ブロック',
      'ループ終了: stop_reason="end_turn" + max_iterations上限',
      'HITL = 不可逆・高影響アクション（削除・支払い等）の前に挿入',
      'エラー処理: エラー結果をオーケストレーターへ渡して再計画',
      '最小権限の原則: 必要最低限の権限・ツールのみ付与',
      'サブエージェントは各自独立したコンテキストウィンドウを持つ',
    ]},
    { color: '#4fc3f7', points: [
      'stdioトランスポート: ローカルプロセス stdin/stdout でJSON-RPC通信',
      'SSEトランスポート: リモートHTTPサーバーからのイベントプッシュ向け',
      '"required"配列: JSON Schemaで必須パラメータを宣言する正式方法',
      'OAuth 2.0 / Bearer: 公開MCPエンドポイントの推奨認証方式',
      'コンポーザブル設計: 各ツールが単一責任の明確なアクションを持つ',
      'description = モデルのツール選択・呼び出し判断の主要シグナル',
      'tool_use→tool_result の順でツール実行フローが成立する',
      'スキーマ最上位はtype:"object"、properties内に各パラメータ定義',
    ]},
    { color: '#81c784', points: [
      'CLAUDE.md: プロジェクトメモリ、セッション開始時に自動読み込み',
      'PreToolUse: ツール実行前フック（傍受・拒否・ログが可能）',
      'PostToolUse: ツール実行後フック（テスト自動化に最適）',
      'OnSessionStart: セッション開始時のウォームアップ処理向け',
      'deny > allow: denyルールが常に優先される（セキュリティポリシー）',
      '.claudeignore: Claudeが無視するパスを.gitignore構文で定義',
      'CLAUDE.mdの構造化: Markdown見出し(## セクション名)を推奨',
      'セッション内での除外: .claudeignoreにglobパターンを記述',
    ]},
    { color: '#ffb74d', points: [
      'Few-shot例: フォーマット準拠に最も効果的なシグナル（具体例が最強）',
      '構造化出力 + JSONスキーマ: 文法レベルで有効なJSONを保証',
      'XMLタグ: プロンプト内のセクション境界を明確化（混乱防止）',
      'Pydantic: ClaudeのJSONを型付きPythonオブジェクトにバリデーション',
      '"わかりません"指示 + 例示: ハルシネーション削減に最も有効',
      'additionalProperties:false: スキーマ外のキーを排除',
      'Chain-of-Thought (CoT): 中間ステップで複雑な推論精度が向上',
      'temperature=0: 決定論的・再現可能な出力（テスト・評価向き）',
      '制約は具体的に: "200文字以内・箇条書き3点以内"など数値で指定',
    ]},
    { color: '#f06292', points: [
      'cache_control:{type:"ephemeral"}: プロンプトキャッシュの明示的マーカー',
      'キャッシュヒット: 入力トークンが通常料金の約10%で再処理される',
      '指数バックオフ+ジッター: 429/529エラーの標準的なリトライ戦略',
      'トークン予算: 累積トークン追跡+上限前にコンテキストを切り詰める',
      'anthropic-beta: ベータ機能（extended thinking等）の有効化ヘッダー',
      '共有コンテキストはメッセージ先頭に配置するとキャッシュヒット率が最大',
      'コンテキスト上限対策: 古いメッセージを要約・圧縮して管理する',
      'フォールバック: プライマリ失敗時に別手段でタスクを継続する設計',
    ]},
  ];

  // ── 状態変数 ────────────────────────────────────────────────
  let QUESTIONS = [];  // startQuizで45問からシャッフルして30問選択
  let state, qIndex, selected, answered, feedbackCorrect;
  let domainScores, totalScore, timerFrames, timerMax;
  let menuSel, resultSel, studyDomain, studyScroll;
  let communityPosted = false;
  let resultBtnYList = [];  // drawResultで設定、onClickで参照

  const QUIZ_SIZE   = 30;
  const QUIZ_SECS   = 120;
  const FPS         = 60;
  const PASS_SCALED = 720;

  function scaleScore(raw) {
    return Math.round(100 + (raw / QUIZ_SIZE) * 900);
  }

  // ── Fisher–Yates シャッフル ──────────────────────────────────
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function init() {
    state           = 'menu';
    menuSel         = 0;
    resultSel       = 0;
    studyDomain     = 0;
    studyScroll     = 0;
    communityPosted = false;
    domainScores    = DOMAINS.map(() => ({ correct: 0, total: 0 }));
    totalScore      = 0;
    qIndex          = 0;
    selected        = 0;
    answered        = false;
    feedbackCorrect = false;
    timerMax        = QUIZ_SECS * FPS;
    timerFrames     = timerMax;
    resultBtnYList  = [];
  }

  function startQuiz() {
    // ドメインごとにバランスよくサンプリング（各ドメインの問題数を等分）
    const byDomain = [[], [], [], [], []];
    ALL_QUESTIONS.forEach(function(q) { byDomain[q.domain].push(q); });
    byDomain.forEach(function(arr, i) { byDomain[i] = shuffle(arr); });

    // 30問をドメイン比率に近くなるよう選択
    const targets = [7, 6, 6, 6, 5];  // 合計30
    QUESTIONS = [];
    byDomain.forEach(function(arr, i) {
      QUESTIONS = QUESTIONS.concat(arr.slice(0, targets[i]));
    });
    QUESTIONS = shuffle(QUESTIONS);

    qIndex          = 0;
    selected        = 0;
    answered        = false;
    totalScore      = 0;
    communityPosted = false;
    domainScores    = DOMAINS.map(() => ({ correct: 0, total: 0 }));
    timerFrames     = timerMax;
    state           = 'quiz';
    if (window.GameAudio) window.GameAudio.sfx('confirm');
  }

  // ── UPDATE ─────────────────────────────────────────────────
  // answered後の自動進行を廃止 → ユーザー手動で進める
  function update() {
    if (state === 'quiz' && !answered) {
      timerFrames = Math.max(0, timerFrames - 1);
      if (timerFrames === 0) submitAnswer(-1);
    }
    // answered時は何もしない (onKey/onClickで手動進行)
  }

  function submitAnswer(sel) {
    const q = QUESTIONS[qIndex];
    answered        = true;
    feedbackCorrect = (sel === q.ans);
    domainScores[q.domain].total++;
    if (feedbackCorrect) {
      domainScores[q.domain].correct++;
      totalScore++;
      if (window.GameAudio) window.GameAudio.sfx('score');
    } else {
      if (window.GameAudio) window.GameAudio.sfx('hit');
    }
  }

  function nextQuestion() {
    qIndex++;
    if (qIndex >= QUIZ_SIZE) {
      state     = 'result';
      resultSel = 0;
      if (window.GameAudio) window.GameAudio.sfx('confirm');
    } else {
      selected      = 0;
      answered      = false;
      feedbackTimer = 0;
    }
  }

  // ── onKey ──────────────────────────────────────────────────
  function onKey(e) {
    const k = e.key;
    if (state === 'menu') {
      if (k === 'ArrowUp'   || k === 'k') menuSel = Math.max(0, menuSel - 1);
      if (k === 'ArrowDown' || k === 'j') menuSel = Math.min(2, menuSel + 1);
      if (k === 'Enter' || k === 'z' || k === 'Z') {
        if (menuSel === 0) startQuiz();
        else if (menuSel === 1) { state = 'study'; studyDomain = 0; studyScroll = 0; }
        else switchGame('menu');
      }
    } else if (state === 'study') {
      // ドメイン切り替え: 1-5 キーまたは ←→
      for (var d = 0; d < 5; d++) {
        if (k === String(d + 1)) { studyDomain = d; studyScroll = 0; return; }
      }
      if (k === 'ArrowLeft'  || k === 'h') { studyDomain = Math.max(0, studyDomain - 1); studyScroll = 0; }
      if (k === 'ArrowRight' || k === 'l') { studyDomain = Math.min(4, studyDomain + 1); studyScroll = 0; }
      if (k === 'ArrowDown'  || k === 'j') studyScroll = Math.min(studyScroll + 1, Math.max(0, STUDY_CONTENT[studyDomain].points.length - 5));
      if (k === 'ArrowUp'    || k === 'k') studyScroll = Math.max(0, studyScroll - 1);
      if (k === 'Enter' || k === 'z' || k === 'Z') startQuiz();
      if (k === 'Escape' || k === 'q') { state = 'menu'; }
    } else if (state === 'quiz') {
      if (answered) {
        // 解説読了後に手動で次へ進む
        if (k === 'Enter' || k === 'z' || k === 'Z' || k === ' ') nextQuestion();
        return;
      }
      if (k === 'ArrowUp'   || k === 'k') selected = (selected + 3) % 4;
      if (k === 'ArrowDown' || k === 'j') selected = (selected + 1) % 4;
      if (k === 'Enter' || k === 'z' || k === 'Z') {
        if (!answered) submitAnswer(selected);
      }
    } else if (state === 'result') {
      if (k === 'ArrowUp'   || k === 'k') resultSel = Math.max(0, resultSel - 1);
      if (k === 'ArrowDown' || k === 'j') resultSel = Math.min(2, resultSel + 1);
      if (k === 'Enter' || k === 'z' || k === 'Z') handleResultSel(resultSel);
    }
  }

  function handleResultSel(idx) {
    if (idx === 0) { init(); startQuiz(); }
    else if (idx === 1) { postToComm(); }
    else { switchGame('menu'); }
  }

  function postToComm() {
    if (communityPosted) return;
    const scaled = scaleScore(totalScore);
    const pass   = scaled >= PASS_SCALED;
    const text   = '【CCA-F模擬試験】スコア: ' + scaled + '/1000 ' +
                   (pass ? '✅合格' : '❌不合格') +
                   '  正解: ' + totalScore + '/' + QUIZ_SIZE + '問  #VimArcade #CCAF';
    if (window.communityPostScore && window.communityPostScore(text)) {
      communityPosted = true;
    } else {
      // フォールバック: コミュニティに未ログインの場合ヒント
    }
  }

  // ── DRAW helpers ──────────────────────────────────────────
  function fillRR(x, y, w, h, r, color) {
    ctx.fillStyle = color; rr(x, y, w, h, r); ctx.fill();
  }
  function strokeRR(x, y, w, h, r, color, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw || 2; rr(x, y, w, h, r); ctx.stroke();
  }
  function txt(str, x, y, font, color, align) {
    ctx.font = font; ctx.fillStyle = color;
    ctx.textAlign = align || 'left'; ctx.fillText(str, x, y);
  }

  // ── DRAW MENU ─────────────────────────────────────────────
  function drawMenu() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0a1e'); bg.addColorStop(1, '#0d0620');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a0a3a'; ctx.fillRect(0, 0, W, 4);

    txt('⚡ CCA-F 認定試験 対策モード', W / 2, 58, 'bold 26px monospace', '#c5b0ff', 'center');
    txt('Claude Certified Architect — Foundations', W / 2, 84, '13px monospace', '#8877aa', 'center');

    fillRR(60, 100, W - 120, 36, 8, 'rgba(255,255,255,0.04)');
    txt(QUIZ_SIZE + '問（全' + ALL_QUESTIONS.length + '問からランダム選択）  120秒  スコア100-1000  合格: 720', W / 2, 122, '11px monospace', '#9988bb', 'center');

    const cardW = 670, cardH = 44, cardX = (W - cardW) / 2, cardStartY = 155;
    DOMAINS.forEach(function (d, i) {
      const cy = cardStartY + i * (cardH + 8);
      fillRR(cardX, cy, cardW, cardH, 8, 'rgba(255,255,255,0.04)');
      strokeRR(cardX, cy, cardW, cardH, 8, d.color + '66', 1.5);
      ctx.fillStyle = d.color; rr(cardX + 12, cy + 12, 20, 20, 4); ctx.fill();
      txt('Domain ' + (i + 1) + ': ' + d.name, cardX + 44, cy + 27, '13px monospace', '#ddd', 'left');
      txt(d.weight + '%', cardX + cardW - 14, cy + 27, 'bold 13px monospace', d.color, 'right');
    });

    const btnW = 260, btnH = 44;
    const btnY = cardStartY + DOMAINS.length * (cardH + 8) + 14;
    const btnDefs = [
      { label: '▶ 試験を開始する',   color: '#9977ff', bg: '#4433aa' },
      { label: '📚 事前に学習する',  color: '#44cc88', bg: '#1a3a22' },
      { label: '← メニューに戻る',  color: '#aaa',    bg: 'rgba(255,255,255,0.05)' },
    ];
    btnDefs.forEach(function (btn, i) {
      const bx = W / 2 - btnW / 2;
      const by = btnY + i * (btnH + 8);
      const sel = menuSel === i;
      fillRR(bx, by, btnW, btnH, 10, sel ? btn.bg : 'rgba(255,255,255,0.03)');
      strokeRR(bx, by, btnW, btnH, 10, sel ? btn.color : '#333355', sel ? 2 : 1);
      txt(btn.label, W / 2, by + 28, (sel ? 'bold ' : '') + '14px monospace', sel ? btn.color : '#888', 'center');
    });

    txt('クリック / ↑↓ kj 選択  Enter/Z 決定', W / 2, H - 18, '11px monospace', '#8866aa', 'center');
  }

  // ── DRAW STUDY ────────────────────────────────────────────
  function drawStudy() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#050518'); bg.addColorStop(1, '#0a0820');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    txt('📚 CCA-F 事前学習モード', W / 2, 38, 'bold 20px monospace', '#c5b0ff', 'center');
    txt('試験前に各ドメインの重要ポイントを確認しましょう', W / 2, 58, '11px monospace', '#776699', 'center');

    // ドメインタブ
    const tabW = Math.floor((W - 20) / 5);
    DOMAINS.forEach(function (d, i) {
      const tx = 10 + i * tabW;
      const sel = studyDomain === i;
      fillRR(tx, 68, tabW - 4, 28, 6, sel ? d.color + '44' : 'rgba(255,255,255,0.04)');
      strokeRR(tx, 68, tabW - 4, 28, 6, sel ? d.color : '#222244', sel ? 2 : 1);
      txt('D' + (i + 1), tx + (tabW - 4) / 2, 87, (sel ? 'bold ' : '') + '12px monospace', sel ? d.color : '#666', 'center');
    });

    const dom = STUDY_CONTENT[studyDomain];
    const domLabel = DOMAINS[studyDomain];
    txt(domLabel.name, W / 2, 116, 'bold 13px monospace', domLabel.color, 'center');

    // 説明ポイントリスト
    const points = dom.points;
    const startY = 130;
    const lineH = 38;
    const visible = 9;
    const scroll = Math.min(studyScroll, Math.max(0, points.length - visible));

    for (var pi = 0; pi < Math.min(visible, points.length - scroll); pi++) {
      const pt = points[pi + scroll];
      const py = startY + pi * lineH;
      fillRR(14, py, W - 28, lineH - 4, 6, 'rgba(255,255,255,0.03)');
      strokeRR(14, py, W - 28, lineH - 4, 6, domLabel.color + '44', 1);
      ctx.fillStyle = domLabel.color;
      ctx.beginPath(); ctx.arc(30, py + (lineH - 4) / 2, 4, 0, Math.PI * 2); ctx.fill();
      const ptLines = wrapText(pt, 78);
      ptLines.forEach(function (line, li) {
        txt(line, 42, py + 14 + li * 14, '12px monospace', '#ddd', 'left');
      });
    }

    // スクロールインジケーター
    if (points.length > visible) {
      txt((scroll + 1) + '-' + Math.min(scroll + visible, points.length) + ' / ' + points.length,
        W - 20, H - 58, '10px monospace', '#554477', 'right');
    }

    // ボタン
    const b0y = H - 52, b1y = H - 26;
    const bFlash = Math.floor(Date.now() / 500) % 2 === 0;
    fillRR(W / 2 - 160, b0y - 4, 320, 28, 7, '#1a3a22');
    strokeRR(W / 2 - 160, b0y - 4, 320, 28, 7, '#44cc88', 1.5);
    txt('▶ 学習完了 — 試験を開始 (Enter/Z)', W / 2, b0y + 13, 'bold 12px monospace', bFlash ? '#44ff88' : '#44cc88', 'center');
    txt('← 戻る (Esc/q)  ←→/hl ドメイン切替  1-5 ダイレクト選択', W / 2, b1y + 10, '10px monospace', '#554477', 'center');
  }

  // ── DRAW QUIZ ─────────────────────────────────────────────
  function drawQuiz() {
    const q   = QUESTIONS[qIndex];
    const dom = DOMAINS[q.domain];

    ctx.fillStyle = '#07071a'; ctx.fillRect(0, 0, W, H);

    // タイマーバー
    const timerRatio = timerFrames / timerMax;
    const barW = W - 40;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(20, 12, barW, 10);
    const barColor = timerRatio > 0.5 ? '#44cc88' : timerRatio > 0.25 ? '#ffaa22' : '#ff4444';
    ctx.fillStyle = barColor;
    ctx.fillRect(20, 12, Math.round(barW * timerRatio), 10);
    strokeRR(20, 12, barW, 10, 3, '#333355', 1);

    // Q番号 + ドメインバッジ
    txt('Q ' + (qIndex + 1) + ' / ' + QUIZ_SIZE, 24, 42, 'bold 14px monospace', '#aaa', 'left');
    const badgeText = 'D' + (q.domain + 1) + ': ' + dom.name + ' (' + dom.weight + '%)';
    const bw = Math.min(ctx.measureText(badgeText).width * 0.85 + 24, 400);
    fillRR(W - bw - 14, 28, bw, 22, 6, dom.color + '33');
    txt(badgeText, W - 14, 44, '11px monospace', dom.color, 'right');

    txt('正解: ' + totalScore, W / 2, 42, '13px monospace', '#8877bb', 'center');

    ctx.strokeStyle = '#22224a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 52); ctx.lineTo(W - 20, 52); ctx.stroke();

    // 問題文
    const qLines = wrapText(q.q, 72);
    const qY0 = 76;
    qLines.forEach(function (line, i) {
      txt(line, W / 2, qY0 + i * 22, '14px monospace', '#e8e0ff', 'center');
    });

    // 選択肢
    const optStartY = qY0 + qLines.length * 22 + 16;
    const optW = W - 80, optX = 40;
    const optH = 50;
    const labels = ['A', 'B', 'C', 'D'];

    q.opts.forEach(function (opt, i) {
      const oy = optStartY + i * 60;
      let bg, border, textCol;
      if (answered) {
        if (i === q.ans) { bg = '#1a3a1a'; border = '#44ff88'; textCol = '#88ffaa'; }
        else if (i === selected && i !== q.ans) { bg = '#3a1010'; border = '#ff4444'; textCol = '#ff8888'; }
        else { bg = 'rgba(255,255,255,0.02)'; border = '#2a2a4a'; textCol = '#555'; }
      } else {
        if (i === selected) { bg = '#1e1050'; border = '#8866ff'; textCol = '#fff'; }
        else { bg = 'rgba(255,255,255,0.03)'; border = '#1e1e3e'; textCol = '#bbb'; }
      }
      fillRR(optX, oy, optW, optH, 8, bg);
      strokeRR(optX, oy, optW, optH, 8, border, i === selected && !answered ? 2 : 1.5);
      ctx.fillStyle = i === selected && !answered ? '#8866ff' : border;
      rr(optX + 10, oy + 12, 26, 26, 6); ctx.fill();
      txt(labels[i], optX + 23, oy + 30, 'bold 14px monospace', '#fff', 'center');
      const optText  = opt.replace(/^[A-D]\.\s*/, '');
      const optLines = wrapText(optText, 68);
      const lineH    = 16;
      const textY0   = oy + 14 + (optH - 28 - optLines.length * lineH) / 2;
      optLines.forEach(function (line, li) {
        txt(line, optX + 48, textY0 + li * lineH + 14, '12px monospace', textCol, 'left');
      });
    });

    // ── 解説パネル (answered後は下部全体を使って全解説を表示) ──
    if (answered) {
      const panelY = optStartY + 4 * 60 + 4;
      const panelH = H - panelY - 4;
      const msgCol = feedbackCorrect ? '#44ff88' : '#ff5555';

      ctx.fillStyle = feedbackCorrect ? 'rgba(10,40,10,0.94)' : 'rgba(40,10,10,0.94)';
      ctx.fillRect(0, panelY, W, panelH);
      ctx.strokeStyle = msgCol; ctx.lineWidth = 1.5;
      ctx.strokeRect(10, panelY + 2, W - 20, panelH - 4);

      const msgText = feedbackCorrect
        ? '✓  正解！  — ' + labels[q.ans] + ' が正しい'
        : '✗  不正解  — 正解は ' + labels[q.ans];
      txt(msgText, W / 2, panelY + 18, 'bold 14px monospace', msgCol, 'center');

      var cy = panelY + 34;

      if (q.optExp) {
        if (!feedbackCorrect) {
          var selLines = wrapText(q.optExp[selected < q.opts.length ? selected : q.ans], 82);
          selLines.slice(0, 2).forEach(function(line, i) {
            txt(line, W / 2, cy + i * 15, '11px monospace', '#ff9999', 'center');
          });
          cy += Math.min(2, selLines.length) * 15 + 4;
          var ansLines2 = wrapText(q.optExp[q.ans], 82);
          ansLines2.slice(0, 2).forEach(function(line, i) {
            txt(line, W / 2, cy + i * 15, '11px monospace', '#88ffaa', 'center');
          });
          cy += Math.min(2, ansLines2.length) * 15 + 4;
        } else {
          var ansLines3 = wrapText(q.optExp[q.ans], 82);
          ansLines3.slice(0, 2).forEach(function(line, i) {
            txt(line, W / 2, cy + i * 15, '11px monospace', '#88ffaa', 'center');
          });
          cy += Math.min(2, ansLines3.length) * 15 + 4;
        }
      }

      var expLines2 = wrapText(q.exp, 82);
      expLines2.slice(0, 2).forEach(function(line, i) {
        txt(line, W / 2, cy + i * 14, '11px monospace', '#aa99cc', 'center');
      });
      cy += Math.min(2, expLines2.length) * 14 + 2;

      if (q.ref) txt('参考: ' + q.ref, W / 2, cy + 2, '10px monospace', '#554477', 'center');

      var blink = Math.floor(Date.now() / 600) % 2 === 0;
      if (blink) {
        txt('→ 次の問題へ  (Enter / Z / クリック)', W / 2, H - 8, 'bold 11px monospace', '#9977ff', 'center');
      }
    } else {
      txt('クリックで選択 / ↑↓ kj で移動  Enter/Z で回答', W / 2, H - 12, '11px monospace', '#554477', 'center');
    }
  }

  // ── DRAW RESULT ───────────────────────────────────────────
  function drawResult() {
    const bg2 = ctx.createLinearGradient(0, 0, 0, H);
    bg2.addColorStop(0, '#05051a'); bg2.addColorStop(1, '#100520');
    ctx.fillStyle = bg2; ctx.fillRect(0, 0, W, H);

    const scaled = scaleScore(totalScore);
    const pass   = scaled >= PASS_SCALED;

    const hColor = pass ? '#44ff88' : '#ff5555';
    txt(pass ? 'PASS  合格！' : 'FAIL  不合格', W / 2, 58, 'bold 30px monospace', hColor, 'center');
    txt('スコア: ' + scaled + ' / 1000', W / 2, 94, 'bold 22px monospace', '#ddd', 'center');
    txt('（合格ライン 720 / 正解: ' + totalScore + '/' + QUIZ_SIZE + '問）', W / 2, 118, '12px monospace', '#887799', 'center');

    const cardW = 680, cardX = (W - cardW) / 2;
    const bStartY = 136, bH = 36;
    DOMAINS.forEach(function (d, i) {
      const ds  = domainScores[i];
      const cy  = bStartY + i * (bH + 5);
      const pct = ds.total > 0 ? ds.correct / ds.total : 0;
      fillRR(cardX, cy, cardW, bH, 7, 'rgba(255,255,255,0.03)');
      strokeRR(cardX, cy, cardW, bH, 7, d.color + '55', 1);
      ctx.fillStyle = d.color; rr(cardX + 10, cy + 10, 16, 16, 4); ctx.fill();
      txt('D' + (i + 1) + ': ' + d.name, cardX + 36, cy + 22, '11px monospace', '#ccc', 'left');
      const pctStr = ds.correct + '/' + ds.total + ' (' + Math.round(pct * 100) + '%)';
      const pctCol = pct >= 0.7 ? '#44cc88' : pct >= 0.5 ? '#ffaa33' : '#ff6666';
      txt(pctStr, cardX + cardW - 10, cy + 22, 'bold 11px monospace', pctCol, 'right');
      const pbW = 90;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(cardX + cardW - 115, cy + 12, pbW, 8);
      ctx.fillStyle = pctCol;
      ctx.fillRect(cardX + cardW - 115, cy + 12, Math.round(pbW * pct), 8);
    });

    // ボタン（3つ）
    const btnW = 220, btnH = 40;
    const btnY = bStartY + DOMAINS.length * (bH + 5) + 16;
    resultBtnYList = [];
    const btnLabels = ['もう一度挑戦', communityPosted ? '投稿済み ✓' : 'コミュニティに投稿', 'メニューへ'];
    btnLabels.forEach(function (label, i) {
      const bx  = W / 2 - btnW / 2;
      const by  = btnY + i * (btnH + 8);
      resultBtnYList.push({ y: by, h: btnH });
      const sel = resultSel === i;
      const isPost = i === 1;
      const posted = isPost && communityPosted;
      const bg = sel ? (isPost && !posted ? '#1a4422' : '#2a1a66') : 'rgba(255,255,255,0.04)';
      const border = sel ? (isPost && !posted ? '#44cc88' : '#9977ff') : '#2a2a4a';
      fillRR(bx, by, btnW, btnH, 10, bg);
      strokeRR(bx, by, btnW, btnH, 10, border, sel ? 2 : 1);
      const labelCol = sel ? '#fff' : (posted ? '#55aa66' : '#999');
      txt(label, W / 2, by + 26, (sel ? 'bold ' : '') + '13px monospace', labelCol, 'center');
    });

    txt('↑↓ / kj 選択  Enter/Z 決定', W / 2, H - 12, '10px monospace', '#333355', 'center');
  }

  // ── DRAW dispatch ────────────────────────────────────────
  function draw() {
    if      (state === 'menu')   drawMenu();
    else if (state === 'study')  drawStudy();
    else if (state === 'quiz')   drawQuiz();
    else if (state === 'result') drawResult();
  }

  // ── onClick ─────────────────────────────────────────────
  function onClick(cx, cy) {
    if (state === 'menu') {
      const btnH = 44, cardH = 44, cardStartY = 155;
      const btnY = cardStartY + DOMAINS.length * (cardH + 8) + 14;
      if (cy >= btnY           && cy <= btnY + btnH)       { menuSel = 0; startQuiz(); return; }
      if (cy >= btnY + 52      && cy <= btnY + 52 + btnH)  { menuSel = 1; state = 'study'; studyDomain = 0; studyScroll = 0; return; }
      if (cy >= btnY + 104     && cy <= btnY + 104 + btnH) { menuSel = 2; switchGame('menu'); return; }
      return;
    }
    if (state === 'study') {
      // 学習開始ボタン
      if (cy >= H - 56 && cy <= H - 28) { startQuiz(); return; }
      // ドメインタブクリック
      const tabW = Math.floor((W - 20) / 5);
      if (cy >= 68 && cy <= 96) {
        for (var d = 0; d < 5; d++) {
          if (cx >= 10 + d * tabW && cx <= 10 + (d + 1) * tabW - 4) {
            studyDomain = d; studyScroll = 0; return;
          }
        }
      }
      return;
    }
    if (state === 'quiz') {
      if (answered) { nextQuestion(); return; }
      const q = QUESTIONS[qIndex];
      const qLinesLen = wrapText(q.q, 72).length;
      const optStartY = 76 + qLinesLen * 22 + 16;
      for (var i = 0; i < q.opts.length; i++) {
        const oy = optStartY + i * 60;
        if (cy >= oy && cy <= oy + 50) { selected = i; submitAnswer(i); return; }
      }
      return;
    }
    if (state === 'result') {
      for (var j = 0; j < resultBtnYList.length; j++) {
        const btn = resultBtnYList[j];
        if (cy >= btn.y && cy <= btn.y + btn.h) {
          resultSel = j; handleResultSel(j); return;
        }
      }
    }
  }

  return { init: init, update: update, draw: draw, onKey: onKey, onClick: onClick };
})();

registerGame('ccaf', ccafQuizGame);
