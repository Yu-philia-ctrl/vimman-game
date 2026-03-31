// ── CCAF-EXAM.JS ── HTML版 CCA-F 対策問題集（外部サイト仕様準拠）──
(function () {
  'use strict';

  // ── 問題データ（全45問）────────────────────────────────────────
  const DOMAINS = [
    { name: 'エージェント設計 & オーケストレーション', nameEn: 'Agent Design & Orchestration', weight: 27, color: '#7b68ee' },
    { name: 'ツール設計 & MCP統合', nameEn: 'Tool Design & MCP', weight: 18, color: '#4fc3f7' },
    { name: 'Claude Code 設定', nameEn: 'Claude Code Config', weight: 20, color: '#81c784' },
    { name: 'プロンプト設計 & 出力制御', nameEn: 'Prompt Engineering', weight: 20, color: '#ffb74d' },
    { name: 'コンテキスト管理 & 信頼性', nameEn: 'Context & Reliability', weight: 15, color: '#f06292' },
  ];

  const ALL_Q = [
    // D0
    { q:'マルチエージェントシステムで、サブエージェントを指揮し結果を統合するClaudeの役割は何か？', opts:['A. サブエージェント','B. オーケストレーター','C. ツールサーバー','D. HITLプロキシ'], ans:1, domain:0, exp:'オーケストレーターが計画・委任・統合を担当。サブエージェントは個別タスクを実行する。', optExp:['A: ✗ サブエージェントは指示を受けて実行する側。指揮・統合は行わない。','B: ✓ オーケストレーターが全体計画を立て、サブエージェントに委任し、結果を統合する。','C: ✗ ツールサーバーは外部ツール機能を提供するコンポーネント。オーケストレーションは行わない。','D: ✗ HITLプロキシは人間の承認を仲介する仕組みであり、エージェント指揮とは別の概念。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
    { q:'エージェントループ中にClaudeがツールを呼び出す際に出力するコンテンツブロックの種類は？', opts:['A. text','B. image','C. tool_use','D. tool_result'], ans:2, domain:0, exp:'tool_useブロックでツール呼び出しを表現。実行後の結果はtool_resultで返す。', optExp:['A: ✗ textは通常のテキスト応答に使われるブロック。','B: ✗ imageは画像データを表すブロック。ツール呼び出しとは無関係。','C: ✓ Claudeはtool_useブロックを出力してツール呼び出しを指示する。','D: ✗ tool_resultはツール実行後の結果を Claude に返すブロック。Claudeが出力するのではない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/tool-use' },
    { q:'エージェントループを終了させる最も適切な条件は何か？', opts:['A. モデルが空文字列を出力したとき','B. stop_reasonが"end_turn"またはmax_iterationsに達したとき','C. ユーザーがCtrl-Cを押したとき','D. 最初のツール呼び出しが成功したとき'], ans:1, domain:0, exp:'stop_reason=="end_turn"の検出と反復上限の両方でループを正しく制御する。', optExp:['A: ✗ 空文字列は一時的な出力であり、タスク完了を意味しない。','B: ✓ end_turn検出と反復上限の組み合わせでトークン浪費を防ぎループを終了させる。','C: ✗ Ctrl-Cはプロセス強制終了であり、設計上の終了条件ではない。','D: ✗ 単一ツール成功はタスク完了を意味しない。早期打ち切りになる。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
    { q:'ヒューマン・イン・ザ・ループ (HITL) を挿入するのに最も適切なタイミングはどれか？', opts:['A. ツール呼び出しのたびに毎回確認する','B. モデルが不確かと判断した場合のみ','C. ファイル削除・支払いなど不可逆・高影響アクションの前','D. 完全自律エージェントは一時停止すべきでない'], ans:2, domain:0, exp:'HITLは取り消せない操作の前に設けるのが最善。毎回確認は実用性を損なう。', optExp:['A: ✗ 毎回確認すると実用性が著しく低下し、自動化の意味がなくなる。','B: ✗ モデルの自己評価だけでは不十分。不可逆アクション前の確認が最重要。','C: ✓ 不可逆・高影響アクション（削除・支払い等）の前にHITLチェックポイントを設ける。','D: ✗ 自律性≠無制限実行。高リスク時には人間確認が必須。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
    { q:'サブエージェントがエラーのtool_resultを返した場合の最善の対処は何か？', opts:['A. 即座にユーザーへ例外を発生させる','B. エラー結果をオーケストレーターに渡して再試行・再計画させる','C. エラーを無視して続行する','D. エージェントループ全体を最初からやり直す'], ans:1, domain:0, exp:'エラーをオーケストレーターに渡すことで、再試行や代替計画への柔軟な切り替えが可能になる。', optExp:['A: ✗ ユーザーに渡す前に回復を試みるべき。即例外は過剰反応。','B: ✓ エラーを上位に渡すことでオーケストレーターが再試行・代替案を判断できる。','C: ✗ エラーの無視はデータ損失や誤動作の原因になる。','D: ✗ 全体再起動はコスト・時間の無駄。部分的なリトライが先。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
    { q:'サブエージェントアーキテクチャの主なメリットは何か？', opts:['A. リクエストあたりのAPIコストが削減される','B. 並列専門実行とコンテキストウィンドウの分離','C. ツール呼び出しオーバーヘッドが完全に排除される','D. レート制限がバイパスされる'], ans:1, domain:0, exp:'サブエージェントは専門化・並列化によりスケーラビリティとコンテキスト分離を実現する。', optExp:['A: ✗ 複数の呼び出しが発生するため合計コストは増加することが多い。','B: ✓ 専門化されたサブエージェントの並列実行とコンテキスト分離がスケーラビリティを向上させる。','C: ✗ サブエージェント間の通信には依然コストがかかる。','D: ✗ APIレート制限はアーキテクチャに関わらず全リクエストに適用される。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
    { q:'エージェントが長時間タスクで予期しない状況に遭遇した場合の最善の対処は？', opts:['A. タスクを中断してユーザーに即座に報告する','B. 状況をオーケストレーターに渡し、続行・停止・代替案を判断させる','C. エラーログに記録して何事もなかったように処理を続ける','D. 同じ操作を無制限にリトライする'], ans:1, domain:0, exp:'予期しない状況はオーケストレーターが判断すべき。中断か継続かは上位ロジックで決定する。', optExp:['A: ✗ 中断が必要かはオーケストレーターが判断すべき。サブエージェントが勝手に止めるのは不適切。','B: ✓ 状況を上位に渡してオーケストレーターが最善の対処を判断するのが正しいパターン。','C: ✗ エラーを隠蔽することで後続処理が誤った前提で進む危険がある。','D: ✗ 無制限リトライはトークン・コストを無駄に消費するアンチパターン。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
    { q:'マルチエージェントシステムにおけるサブエージェントのコンテキストウィンドウはどうなるか？', opts:['A. オーケストレーターのコンテキストをすべて共有する','B. 各サブエージェントが独立したコンテキストウィンドウを持つ','C. グローバルな共有メモリにすべて保存される','D. コンテキストは持たず、ツール呼び出しのみで動作する'], ans:1, domain:0, exp:'サブエージェントは独立したコンテキストを持つため、フォーカスと分離が実現できる。', optExp:['A: ✗ コンテキストを完全共有すると分離のメリットが失われ、ウィンドウが肥大化する。','B: ✓ 各サブエージェントは独立したコンテキストウィンドウを持ち、専門タスクに集中できる。','C: ✗ グローバル共有メモリはマルチエージェントの標準アーキテクチャではない。','D: ✗ サブエージェントもClaudeモデルであり、通常のコンテキストウィンドウを持つ。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
    { q:'エージェントパイプラインで「最小権限の原則」を適用する主な目的は？', opts:['A. APIコールの数を減らすため','B. エージェントが必要最低限のツールとアクセス権しか持たないようにするため','C. 処理速度を向上させるため','D. コンテキストウィンドウを小さく保つため'], ans:1, domain:0, exp:'最小権限の原則により、エラーや悪意ある入力によるシステムへの影響範囲を最小化できる。', optExp:['A: ✗ APIコール数の削減は最小権限の目的ではない。','B: ✓ 必要最低限の権限のみ付与することで、誤動作や攻撃時の被害を限定できる。','C: ✗ 権限制限が速度改善に直接つながるわけではない。','D: ✗ コンテキストサイズと権限制限は別の概念。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
    // D1
    { q:'MCPサーバーが標準入出力(stdin/stdout)経由で通信する際のトランスポートプロトコルは？', opts:['A. SSE（Server-Sent Events）','B. WebSocket','C. stdio','D. gRPC'], ans:2, domain:1, exp:'stdioトランスポートはstdin/stdout上でJSON-RPCメッセージを送受信する。ローカルプロセス向け。', optExp:['A: ✗ SSEはHTTP経由のリモートサーバーへのイベントプッシュに使う。stdioではない。','B: ✗ WebSocketはMCPの標準トランスポートとして採用されていない。','C: ✓ ローカルプロセス間通信にはstdioトランスポートを使い、JSON-RPCでやり取りする。','D: ✗ gRPCはMCPの標準仕様に含まれておらず、サポートされていない。'], ref:'modelcontextprotocol.io/docs/concepts/transports' },
    { q:'MCPツールスキーマで、パラメータを必須にするJSONスキーマのキーワードは？', opts:['A. "mandatory": true','B. オブジェクトレベルの "required" 配列','C. "nullable": false','D. "optional": false'], ans:1, domain:1, exp:'JSON Schemaでは {"required": ["param1"]} のようにオブジェクトレベルで必須フィールドを宣言する。', optExp:['A: ✗ "mandatory"はJSON Schemaの標準キーワードではない。存在しないプロパティ。','B: ✓ JSON Schemaの"required"配列にプロパティ名を列挙して必須を宣言する正式な方法。','C: ✗ "nullable"はOpenAPI拡張仕様であり、required（必須化）とは別の概念。','D: ✗ "optional"もJSON Schemaの標準キーワードには存在しない。'], ref:'modelcontextprotocol.io/docs/concepts/tools' },
    { q:'MCPのSSEトランスポートが最も適するシナリオはどれか？', opts:['A. プロセス分離が必要なローカルCLIツール','B. リアルタイムイベントをプッシュするリモートHTTPサーバー','C. バッチファイル処理パイプライン','D. オフライン組み込みデバイス'], ans:1, domain:1, exp:'SSEはHTTP上でサーバーからクライアントへリアルタイムイベントをプッシュするのに適する。', optExp:['A: ✗ ローカルCLIツールにはstdioトランスポートが適切。SSEは不要なネットワーク依存を生む。','B: ✓ SSEはリモートHTTPサーバーがイベントをプッシュするユースケースに最適。','C: ✗ バッチ処理に双方向リアルタイムプッシュは不要で、オーバースペック。','D: ✗ SSEにはネットワーク接続が必要。オフラインデバイスには使えない。'], ref:'modelcontextprotocol.io/docs/concepts/transports' },
    { q:'公開MCPサーバーのHTTPエンドポイントに推奨される認証方法は？', opts:['A. ツールのdescription文字列に秘密情報を埋め込む','B. OAuth 2.0 / Bearerトークンでサーバー側が検証','C. IPアドレス制限のみ','D. 認証不要 — MCPは元々安全'], ans:1, domain:1, exp:'OAuth 2.0 Bearer tokenは標準的で監査可能な認証手段。公開APIの保護に適している。', optExp:['A: ✗ description文字列に秘密情報を埋め込むと外部公開される重大なセキュリティリスクになる。','B: ✓ OAuth 2.0 / Bearerトークンはオープンな標準で、スコープ制御・監査が可能。','C: ✗ IPアドレス制限だけでは認可制御として不十分。なりすましに対して脆弱。','D: ✗ MCPに固有のセキュリティ機能はない。適切な認証は実装者の責任。'], ref:'modelcontextprotocol.io/docs/concepts/transports' },
    { q:'MCPツール設計で「コンポーザブル（組み合わせやすい）」ツールセットとは何か？', opts:['A. 各ツールが明確な入出力を持つ単一のアクションを実行する','B. すべてのツールが単一の巨大な入力スキーマを共有する','C. ラウンドトリップ削減のため全機能を1つのメガ関数にまとめる','D. スキーマなしでモデルが自由にパラメータを決める'], ans:0, domain:1, exp:'単一責任の原則に従ったツールが組み合わせやすい設計になる。密結合は保守性を下げる。', optExp:['A: ✓ 各ツールが単一の明確なアクションを持つことで、組み合わせ・テスト・再利用が容易になる。','B: ✗ 巨大な共有スキーマは密結合を生みメンテナンスが困難になる。','C: ✗ メガ関数は再利用性・テスト性が著しく低下するアンチパターン。','D: ✗ スキーマなしでは型安全性が失われ、モデルが誤ったパラメータを渡す原因になる。'], ref:'modelcontextprotocol.io/docs/concepts/tools' },
    { q:'MCPサーバー実装においてツールの"description"フィールドが主に影響するのは？', opts:['A. ネットワークのタイムアウト閾値','B. モデルがいつどのようにツールを呼び出すかの判断','C. 使用される認証メカニズム','D. 選択されるトランスポートプロトコル'], ans:1, domain:1, exp:'descriptionはモデルのツール選択・呼び出し判断の主要シグナル。明確な記述が精度を左右する。', optExp:['A: ✗ タイムアウトはサーバー設定やネットワーク設定で制御する。descriptionとは無関係。','B: ✓ モデルはdescriptionを読んで、いつそのツールを使うべきか・どう呼ぶかを判断する。','C: ✗ 認証はサーバー設定やOAuthフローで決まる。descriptionは関係しない。','D: ✗ トランスポートは接続設定（stdio/SSE）で決まり、descriptionは関係しない。'], ref:'modelcontextprotocol.io/docs/concepts/tools' },
    { q:'MCPツールのtool_useブロックとtool_resultブロックの役割の違いは？', opts:['A. どちらもClaudeが出力するブロックで、内容に違いはない','B. tool_useがClaudeのツール呼び出し指示、tool_resultが呼び出し結果の返却','C. tool_resultはClaudeが出力し、tool_useはAPIが自動生成する','D. tool_useはエラー時のみ使われる特殊なブロック'], ans:1, domain:1, exp:'Claudeがtool_useを出力→実行者が実行→tool_resultをClaudeに返す、という流れで動作する。', optExp:['A: ✗ 2つのブロックは全く異なる役割を持つ。混同しないことが重要。','B: ✓ tool_use＝Claude→実行者へのツール呼び出し指示。tool_result＝実行者→Claudeへの結果返却。','C: ✗ tool_resultは実行者（呼び出し側コード）が生成してClaudeに渡すもの。','D: ✗ tool_useは正常な処理フローで常に使われる。エラー専用ではない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/tool-use' },
    { q:'MCP対応ツールのスキーマで"type": "object"を最上位に置く主な理由は？', opts:['A. JSON Schema仕様の要件として引数全体をオブジェクトで包む必要があるため','B. オブジェクト型のみAPIに送信できるため','C. モデルがパラメータ名を無視できるようにするため','D. ネストしたツールの呼び出しを可能にするため'], ans:0, domain:1, exp:'MCP/Anthropic APIのツールスキーマは引数をobjectとして定義し、propertiesで各パラメータを記述する仕様。', optExp:['A: ✓ ツールの引数スキーマはtypeをobjectとし、properties内に各パラメータを定義するのが仕様。','B: ✗ API送信可能な型は複数あるが、ツールスキーマの最上位はobjectが仕様要件。','C: ✗ objectのpropertiesでパラメータ名を明示するのが目的。名前を無視するためではない。','D: ✗ ネスト呼び出しとobject型は直接関係しない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/tool-use' },
    { q:'MCPサーバーを実装する際、ツールの実行結果に含めるべき最も重要な要素は？', opts:['A. 実行時間とメモリ使用量の詳細統計','B. モデルが次のアクションを判断できる情報と、エラー発生時は明確なエラーメッセージ','C. 常に成功レスポンスのみ（エラーは隠蔽）','D. 次に呼ぶべきツール名の推奨リスト'], ans:1, domain:1, exp:'結果には次の判断に必要な情報を含め、エラー時は明確なメッセージを返すことで回復可能にする。', optExp:['A: ✗ 統計情報は有用なこともあるが、必須ではなくモデルの判断に直接影響しない。','B: ✓ モデルが次のアクションを判断できる情報と、エラー時の明確なメッセージが最も重要。','C: ✗ エラーを隠蔽するとモデルが誤った前提で処理を続けてしまう。','D: ✗ 次のツール選択はモデルが判断すべきこと。結果に含める必要はない。'], ref:'modelcontextprotocol.io/docs/concepts/tools' },
    // D2
    { q:'Claude Codeがプロジェクト固有の指示とコンテキストを自動で読み込むファイルは？', opts:['A. .claudeignore','B. CLAUDE.md','C. .claude/config.json','D. README.md'], ans:1, domain:2, exp:'CLAUDE.mdがClaude Codeのプロジェクトメモリファイル。自動的に読み込まれ指示として機能する。', optExp:['A: ✗ .claudeignoreはClaudeが無視するファイルパターンを定義するファイル。指示ではない。','B: ✓ CLAUDE.mdはClaude Codeが自動読み込みするプロジェクト固有の指示・コンテキストファイル。','C: ✗ .claude/config.jsonはClaude Codeの設定ファイル形式として一般的ではない。','D: ✗ README.mdはClaudeに特別扱いされない。明示的に渡さない限り自動読み込みされない。'], ref:'docs.anthropic.com/ja/docs/claude-code/memory' },
    { q:'Claude CodeのPreToolUseフックが発火するタイミングはいつか？', opts:['A. ツール結果がモデルに返された後','B. Claudeがツール呼び出しを実行する前（傍受・拒否が可能）','C. bashコマンドが失敗した時のみ','D. セッション終了時'], ans:1, domain:2, exp:'PreToolUseは実行前フック。ツール呼び出しの傍受・検証・拒否が可能。PostToolUseは実行後。', optExp:['A: ✗ 実行後に発火するのはPostToolUseフック。PreToolUseは実行前。','B: ✓ PreToolUseはツール実行前に発火し、ログ記録・検証・拒否などの処理を挿入できる。','C: ✗ PreToolUseは成功・失敗に関わらず全ツール呼び出しの前に発火する。','D: ✗ セッション終了時のフックは別（Stopフック）。PreToolUseとは無関係。'], ref:'docs.anthropic.com/ja/docs/claude-code/hooks' },
    { q:'Claude Codeが/etcに書き込めないよう防ぐ設定は？', opts:['A. allow: ["Write(/etc)"]','B. deny: ["Write(/etc/**)", "Write(/etc)"]','C. CLAUDE.mdにreadonly: trueを記述','D. disableShell: true'], ans:1, domain:2, exp:'denyルールにglobパターンを指定して特定のツール+パスの組み合わせをブロックする。', optExp:['A: ✗ allowは許可を与えるルール。これでは/etcへの書き込みを許可してしまう逆効果。','B: ✓ denyルールにglobパターンを使い、/etc配下のすべての書き込みを禁止できる。','C: ✗ readonly: trueはCLAUDE.mdの設定項目として存在しない。','D: ✗ disableShell: trueはシェル実行の制御であり、Writeツールの制御とは別。'], ref:'docs.anthropic.com/ja/docs/claude-code/settings' },
    { q:'CLAUDE.mdファイルでのセクション分けに推奨される記法は何か？', opts:['A. <section>などのXMLタグ','B. Markdownの見出し (## セクション名)','C. "section"キーを持つJSONブロック','D. YAMLフロントマターのみ'], ans:1, domain:2, exp:'Markdown見出しはシンプルで可読性が高く、Claude Codeが解析しやすい標準的な記法。', optExp:['A: ✗ XMLタグも解釈されるが、CLAUDE.mdの推奨はMarkdown形式。','B: ✓ ## や ### などのMarkdown見出しでセクションを分けるのが推奨される慣習。','C: ✗ JSONブロックは読みにくく、CLAUDE.mdのMarkdown形式と馴染みにくい。','D: ✗ YAMLフロントマターは限定的なメタデータ記述向け。セクション分けには不向き。'], ref:'docs.anthropic.com/ja/docs/claude-code/memory' },
    { q:'コード編集後に自動でテストを実行するのに最適なフックの種類は？', opts:['A. PreToolUse','B. OnSessionStart','C. PostToolUse','D. OnError'], ans:2, domain:2, exp:'PostToolUseは編集完了後に発火するため、テストランナーの自動起動に最適。', optExp:['A: ✗ PreToolUseは実行前フック。編集後のテスト実行タイミングとして早すぎる。','B: ✗ OnSessionStartはセッション開始時に発火。編集後ではない。','C: ✓ PostToolUseは編集（Write/Edit等）完了後に発火するため、自動テストトリガーに最適。','D: ✗ OnErrorはエラー発生時のみ動作。通常の自動テストには使えない。'], ref:'docs.anthropic.com/ja/docs/claude-code/hooks' },
    { q:'Claude Codeのallow/denyルールはどの優先順位で評価されるか？', opts:['A. allowルールが先。マッチすればdenyをスキップ','B. denyルールが優先 — denyがallowに勝つ','C. アルファベット順でツール名を評価','D. 設定ファイルでの出現順、最後のルールが優先'], ans:1, domain:2, exp:'denyは最強の権限制御。denyがマッチすれば、allowルールに関係なく常にブロックされる。', optExp:['A: ✗ allowが優先されると悪意ある設定でdenyを無効化できてしまう。正しい評価順ではない。','B: ✓ denyルールが優先される。セキュリティポリシーとして最も安全な評価方式。','C: ✗ アルファベット順での評価は行われない。','D: ✗ 出現順・最後優先の評価方式は採用されていない。'], ref:'docs.anthropic.com/ja/docs/claude-code/settings' },
    { q:'CLAUDE.mdに記述する「プロジェクトのコーディング規約」が有効なのはなぜか？', opts:['A. Claudeがコードを書く際にそのファイルを参照して従うため','B. 他のAIモデルも自動的に読み込むため','C. コンパイラが規約違反を自動検出するため','D. GitHubのCIが規約チェックを自動実行するため'], ans:0, domain:2, exp:'Claude CodeはCLAUDE.mdをセッション開始時に読み込み、記述されたルールに従って動作する。', optExp:['A: ✓ Claude CodeはCLAUDE.mdを自動読み込みし、記載されたコーディング規約に従ってコードを生成する。','B: ✗ CLAUDE.mdはClaude Code専用。他のAIモデルが自動的に読み込む仕組みはない。','C: ✗ コンパイラはCLAUDE.mdを認識しない。規約チェックはLinterやテストが担う。','D: ✗ GitHub CIもCLAUDE.mdを自動認識しない。CI設定は別途必要。'], ref:'docs.anthropic.com/ja/docs/claude-code/memory' },
    { q:'Claude Codeで特定のファイルやディレクトリをモデルが参照しないようにするには？', opts:['A. CLAUDE.mdに除外リストを書く','B. .claudeignoreファイルにglobパターンを記述する','C. ファイル名を隠しファイル（.ドット始まり）にする','D. denyルールにReadツールを追加する'], ans:1, domain:2, exp:'.claudeignoreは.gitignoreと同じ構文でClaude Codeが無視するパスを定義する。', optExp:['A: ✗ CLAUDE.mdは指示・コンテキスト用のファイル。除外リストには使わない。','B: ✓ .claudeignoreに.gitignore構文でパターンを記述すると、Claude Codeはそれらを無視する。','C: ✗ 隠しファイルはClaudeの参照制御とは無関係。アクセス可能なままになる。','D: ✗ denyルールはツール実行制御用。ファイル無視には.claudeignoreを使う。'], ref:'docs.anthropic.com/ja/docs/claude-code/settings' },
    { q:'Claude Codeのセッション開始時 (OnSessionStart) フックの典型的な用途は？', opts:['A. 編集後のファイルを自動でgit commitする','B. プロジェクトの状態確認やウォームアップスクリプトの実行','C. 各ツール呼び出し前のバリデーション','D. エラー発生時のロールバック処理'], ans:1, domain:2, exp:'OnSessionStartはセッション開始時のウォームアップ・環境確認・初期化に適している。', optExp:['A: ✗ git commitは編集後のPostToolUseフックで実行するのが適切。','B: ✓ セッション開始時に環境確認・依存チェック・初期化スクリプトを実行するのが典型的用途。','C: ✗ 各ツール呼び出し前のバリデーションはPreToolUseフックが担う。','D: ✗ エラー時のロールバックはエラーハンドリングロジックやOnErrorフックで対応する。'], ref:'docs.anthropic.com/ja/docs/claude-code/hooks' },
    // D3
    { q:'Claudeが特定の出力フォーマットに従う可能性を最も高めるシステムプロンプトの要素は？', opts:['A. 禁止トピックの長いリスト','B. 期待するフォーマットを示す具体的なFew-shotサンプル','C. temperatureパラメータの引き上げ','D. 全大文字による指示文'], ans:1, domain:3, exp:'Few-shotサンプルはフォーマット準拠に最も効果的なシグナル。具体例が抽象的指示より強い。', optExp:['A: ✗ 禁止リストはコンテンツ制御に使う。出力フォーマットの制御には効果が限定的。','B: ✓ 具体的なFew-shotサンプルは、モデルが期待フォーマットを「見て」学べる最強のシグナル。','C: ✗ temperature上昇は多様性を増やし、フォーマット準拠率を下げる方向に働く。','D: ✗ 大文字化が従順性に与える効果は統計的に限定的。Few-shotの方が遥かに効果的。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering' },
    { q:'ClaudeからJSON出力を確実に得るための最も信頼性の高い方法はどれか？', opts:['A. 「JSONで返すよう試みてください」と依頼する','B. JSONスキーマ付きの構造化出力機能を使用する','C. 正規表現で後処理してJSONを抽出する','D. temperature=0に設定する'], ans:1, domain:3, exp:'スキーマ制約付き構造化出力は文法レベルでJSON形式を強制し、パース失敗を防ぐ。', optExp:['A: ✗ 努力指示は保証にならない。モデルが従わない場合がある。','B: ✓ JSONスキーマを使った構造化出力機能は文法レベルで有効なJSONを保証する最も確実な方法。','C: ✗ 後処理は形式を制御するのではなく、壊れた出力を修復しようとするだけ。根本的解決ではない。','D: ✗ temperature=0は決定論的にするが、有効なJSONが生成される保証はない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/structured-outputs' },
    { q:'プロンプトでXMLタグ (<document>, <instructions>等) を使う主な効果は？', opts:['A. 自動的にトークン数を削減する','B. セクションを明確に区切り、Claudeが各部分を識別しやすくする','C. ツール呼び出しを有効化する','D. コンテンツフィルターをバイパスできる'], ans:1, domain:3, exp:'XMLタグはセマンティック境界として機能し、プロンプトの各部分の混同を防ぐ。', optExp:['A: ✗ XMLタグ自体がトークンを消費するため、トークン数は増える方向に働く。','B: ✓ XMLタグがセクションの境界を明確化し、Claudeがプロンプト構造を正確に把握できるようになる。','C: ✗ ツール呼び出しはtool_useブロックで行う。XMLタグは関係しない。','D: ✗ コンテンツフィルターのバイパスはできない。そのような機能は存在しない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering' },
    { q:'ClaudeのJSON出力をPython型オブジェクトに変換するためにPydanticが使われる主な目的は？', opts:['A. システムプロンプトを自動生成する','B. ClaudeのJSON出力を型付きPythonオブジェクトとしてバリデーション・パースする','C. ストリーミングレスポンスを処理する','D. API認証を管理する'], ans:1, domain:3, exp:'PydanticモデルでClaudeのJSONをバリデーションし、型エラーをパイプラインの早い段階で検出する。', optExp:['A: ✗ PydanticはPythonのデータバリデーションライブラリ。プロンプト生成機能はない。','B: ✓ PydanticモデルにClaudeのJSON出力をパースし、型安全性を保証して型エラーを早期発見する。','C: ✗ ストリーミング処理はAnthropicのSDKが提供するstream APIが担う。','D: ✗ API認証はAPIキー管理の問題。Pydanticの役割ではない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/structured-outputs' },
    { q:'ハルシネーション（架空情報の生成）を最も効果的に減らすシステムプロンプトの記述は？', opts:['A. 「自信を持って答えてください」と伝える','B. 根拠がない場合は「わかりません」と言うよう例示付きで指示する','C. 知識カットオフを無効化する設定を加える','D. max_tokensを増やして詳細な回答を促す'], ans:1, domain:3, exp:'不確実性を認める明示的な指示と例示が、Claudeの信頼度校正に最も効果的。', optExp:['A: ✗ 自信の強調は逆にハルシネーションを増加させる。根拠のない「自信」は有害。','B: ✓ 「証拠がなければわかりませんと答える」という指示と例示が信頼度を正しく校正する。','C: ✗ 知識カットオフは変更不可能であり、ハルシネーション対策にもならない。','D: ✗ max_tokens増加はハルシネーション率に直接影響しない。内容の質とは別の設定。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering' },
    { q:'構造化出力のJSONスキーマで "additionalProperties": false が保証することは？', opts:['A. 数値フィールドが常に正の値である','B. モデルがスキーマ外のキーをレスポンスに追加できない','C. 配列フィールドに少なくとも1つの要素がある','D. すべての文字列フィールドが空でない'], ans:1, domain:3, exp:'additionalProperties: falseはスキーマ外のキーを排除し、出力をスキーマ定義通りに厳密化する。', optExp:['A: ✗ 正の値制約にはminimum: 0またはexclusiveMinimum: 0を使う。','B: ✓ additionalProperties: falseにより、スキーマに定義されていないキーの追加が禁止される。','C: ✗ 配列の最小要素数にはminItems: 1を使う。','D: ✗ 文字列の非空制約にはminLength: 1を使う。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/structured-outputs' },
    { q:'Chain-of-Thought（思考の連鎖）プロンプティングの主な目的は？', opts:['A. 出力トークン数を削減する','B. モデルに段階的な推論ステップを踏ませ、複雑な問題の精度を上げる','C. ストリーミングAPIを有効化する','D. プロンプトのトークンコストを下げる'], ans:1, domain:3, exp:'CoTはモデルに中間ステップを明示させることで複雑な推論タスクの精度が向上する。', optExp:['A: ✗ CoTは中間ステップを生成するため出力トークン数は増加する傾向にある。','B: ✓ 「まず…次に…最終的に…」と段階的に考えさせることで、複雑な推論精度が向上する。','C: ✗ ストリーミングAPIはパラメータで有効化するもの。CoTとは無関係。','D: ✗ CoTは追加トークンが発生するためコストは上がる。コスト削減ではない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering' },
    { q:'システムプロンプトとユーザーメッセージの役割の違いとして最も正確なのは？', opts:['A. システムプロンプトはAPIコストが低く、ユーザーメッセージは高い','B. システムプロンプトは会話全体に適用される指示・コンテキスト、ユーザーメッセージは個々のリクエスト','C. ユーザーメッセージはシステムプロンプトを上書きできない','D. システムプロンプトは最初の1回しか読まれない'], ans:1, domain:3, exp:'システムプロンプトは会話全体の基盤となる指示・ペルソナ・制約を設定する。', optExp:['A: ✗ トークンコストは入力トークンとして同等に計算される。役割での価格差はない。','B: ✓ システムプロンプトは全体的な指示・コンテキストを提供し、ユーザーメッセージは個々の要求を伝える。','C: ✗ ユーザーメッセージの内容によってはシステムプロンプトの一部の動作が変化する場合がある。','D: ✗ システムプロンプトは毎回のAPI呼び出しで提供される。1回きりではない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering' },
    { q:'モデルへの指示の明確さを高める「制約条件の具体化」の例として最も適切なのは？', opts:['A. 「できるだけ短く答えてください」','B. 「200文字以内で、箇条書き3点以内でまとめてください」','C. 「簡潔にお願いします」','D. 「なるべく分かりやすく」'], ans:1, domain:3, exp:'測定可能な制約（文字数・形式・点数）を具体的に指定するほど出力の一貫性が高まる。', optExp:['A: ✗ 「できるだけ短く」は主観的で測定不能。モデルごとに解釈が異なる。','B: ✓ 「200文字以内・箇条書き3点以内」のように数値と形式を明示すると出力が安定する。','C: ✗ 「簡潔に」は相対的な表現。何を基準に「簡潔」とするかが不明確。','D: ✗ 「わかりやすく」も主観的。対象読者・専門レベルを明示する方が効果的。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering' },
    // D4
    { q:'ClaudeのAPIで大きな静的システムプロンプトのプロンプトキャッシングを有効にするには？', opts:['A. リクエストボディに "cache": true を追加','B. コンテンツブロックに cache_control: {"type":"ephemeral"} を指定','C. X-Cache-Control HTTPヘッダーを追加','D. キャッシングは自動で設定不要'], ans:1, domain:4, exp:'cache_control: {type:"ephemeral"}マーカーをコンテンツブロックに付与してキャッシュ対象を指定する。', optExp:['A: ✗ "cache": trueというリクエストボディパラメータは存在しない。','B: ✓ コンテンツブロックにcache_control: {type:"ephemeral"}を付与してプロンプトキャッシングを有効化する。','C: ✗ X-Cache-ControlというHTTPヘッダーはAnthropicAPIには存在しない。','D: ✗ プロンプトキャッシングは自動ではない。明示的なcache_controlマーカーが必要。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-caching' },
    { q:'プロンプトキャッシングの主なコスト面でのメリットは何か？', opts:['A. 出力トークンが低料金で課金される','B. キャッシュされた入力トークンが通常料金の約10%で再処理される','C. キャッシュ済みプロンプトでは安全チェックがスキップされる','D. レイテンシは増えるがコストは変わらない'], ans:1, domain:4, exp:'キャッシュヒット時の入力トークンは約10%のコストで処理され、繰り返しプロンプトの費用が大幅削減される。', optExp:['A: ✗ 出力トークンのキャッシング割引はない。入力トークンの削減がメリット。','B: ✓ キャッシュヒット時は入力トークンが通常料金の約10%で課金され、大幅なコスト削減になる。','C: ✗ 安全チェックはキャッシュに関わらず常に全リクエストで実施される。','D: ✗ キャッシュヒット時はレイテンシも改善する。コストとレイテンシの両方でメリットがある。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-caching' },
    { q:'529「overloaded」または429レート制限エラー時の正しい最初の対応は？', opts:['A. 競合モデルへ永続的に切り替える','B. 即座にタイトループでリトライする','C. ジッター付き指数バックオフでリトライする','D. max_tokensを増やしてリクエスト頻度を下げる'], ans:2, domain:4, exp:'指数バックオフ+ジッターでサンダリングハード問題を回避するのが標準的なエラー処理。', optExp:['A: ✗ 一時的なエラーに対して恒久的なモデル変更は過剰反応。適切ではない。','B: ✗ タイトループリトライはサーバー負荷を悪化させ、429エラーをさらに引き起こすアンチパターン。','C: ✓ 指数バックオフ（待ち時間を徐々に増やす）+ジッター（ランダム要素）が正しいリトライ戦略。','D: ✗ max_tokensはリクエストあたりの最大出力トークン数。レート制限とは独立したパラメータ。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/rate-limits' },
    { q:'長期実行エージェントで「トークン予算」戦略を実装する最善の方法は？', opts:['A. トークン数を無視してAPIに制限を任せる','B. 累積入出力トークンを追跡し、制限近くでコンテキストを切り詰める','C. 1000トークンごとにモデルを再起動する','D. 1-shotプロンプトのみを使用してトークンを最小化する'], ans:1, domain:4, exp:'プロアクティブなトークン追跡とコンテキスト切り詰めで、予期しないコンテキスト上限エラーを防ぐ。', optExp:['A: ✗ APIに任せると予期しないエラーで処理が中断する。プロアクティブな管理が必要。','B: ✓ 累積トークンを追跡し、上限に近づいたら古いコンテキストを切り詰めるのが最善の戦略。','C: ✗ 頻繁な再起動でコンテキストが失われ、タスクの継続性が損なわれる。','D: ✗ 1-shotのみでは長期タスクに必要な情報が保持できず、品質が著しく低下する。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/context-windows' },
    { q:'Claude APIでextended thinkingなどのベータ機能を有効にするHTTPヘッダーは？', opts:['A. X-Beta-Features: true','B. anthropic-beta: <機能名>','C. Authorization: Beta <APIキー>','D. Content-Type: application/beta+json'], ans:1, domain:4, exp:'anthropic-betaヘッダーに機能名（例: "interleaved-thinking-2025-05-14"）を指定してオプトインする。', optExp:['A: ✗ X-Beta-Featuresというヘッダーは存在しない。','B: ✓ anthropic-betaヘッダーにベータ機能名を指定することでオプトインできる。','C: ✗ AuthorizationヘッダーはAPIキー認証に使う。ベータ機能の有効化ではない。','D: ✗ application/beta+jsonというMIMEタイプは存在しない。Content-Typeはapplication/json。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/extended-thinking' },
    { q:'多数の類似リクエストで大きな共有コンテキストのコストを最小化するには？', opts:['A. 毎リクエストで全コンテキストを新規送信する','B. 共有コンテキストをメッセージ先頭に置き、cache_controlでキャッシュする','C. 複数のAPIキーにコンテキストを分散する','D. ストリーミングを使ってサーバー側のコンテキスト保存を回避する'], ans:1, domain:4, exp:'メッセージ先頭に共有コンテキストを置きcache_controlでキャッシュするとヒット率が最大化される。', optExp:['A: ✗ キャッシュを使わないとフルコストが毎回発生する。最も非効率な方法。','B: ✓ 共有コンテキストを先頭に配置してcache_controlを付与するとキャッシュヒット率が最大化される。','C: ✗ APIキーの分散はコスト削減にならない。トークン消費量は変わらない。','D: ✗ ストリーミングはレイテンシ改善技術。コンテキストのキャッシングとは別の概念。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/prompt-caching' },
    { q:'Claudeのコンテキストウィンドウが200,000トークンに達しそうな場合の推奨対処は？', opts:['A. より大きなコンテキストウィンドウを持つモデルへ常時切り替える','B. 古いメッセージを要約・切り詰めてコンテキストを管理する','C. リクエストを中断してユーザーにコンテキストのリセットを促す','D. max_tokensを0に設定して出力を無効化する'], ans:1, domain:4, exp:'古いメッセージを要約・圧縮してコンテキストを管理するのが最もコスト効率のよい対処。', optExp:['A: ✗ 常にモデル切り替えはコスト増大につながる。まず既存コンテキストの最適化を行う。','B: ✓ 古いメッセージを要約して圧縮することで、重要情報を保持しつつコンテキストを維持できる。','C: ✗ ユーザーへのリセット促進はUXを損なう。適切なコンテキスト管理で回避すべき。','D: ✗ max_tokens=0は無効な設定。出力を無効化してもコンテキスト問題は解決しない。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/context-windows' },
    { q:'APIリクエストで "temperature" パラメータを0に設定した場合の効果は？', opts:['A. モデルが完全にランダムな応答を生成する','B. 応答が決定論的（再現可能）になり、同じ入力に同じ出力が返りやすくなる','C. コンテキストウィンドウが拡張される','D. プロンプトキャッシングが自動有効化される'], ans:1, domain:4, exp:'temperature=0は最も確率の高いトークンを選択し続けるため、出力が安定・再現可能になる。', optExp:['A: ✗ temperature=0は最も確率の高い選択を行う。ランダム性は最小化される。','B: ✓ temperature=0では決定論的な（再現しやすい）出力が得られる。テスト・評価に有用。','C: ✗ temperatureはサンプリングの多様性を制御するパラメータ。コンテキストとは無関係。','D: ✗ キャッシングはcache_controlで明示的に設定する。temperatureとは独立。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/inference' },
    { q:'エージェントの信頼性向上のために「フォールバック」を実装する主な目的は？', opts:['A. APIコストを削減する','B. プライマリの手段が失敗した際に代替手段でタスクを継続する','C. 応答速度を向上させる','D. コンテキストウィンドウを節約する'], ans:1, domain:4, exp:'フォールバックは部分的な障害でもエージェントが機能し続けるための耐障害性設計。', optExp:['A: ✗ フォールバックの目的はコスト削減ではなく信頼性・継続性の確保。','B: ✓ プライマリ手段の失敗時に別の手段（別ツール・別モデル等）でタスクを継続するのがフォールバックの目的。','C: ✗ フォールバックは応答速度の最適化ではなく信頼性の向上が目的。','D: ✗ コンテキスト管理はフォールバックとは別の最適化。'], ref:'docs.anthropic.com/ja/docs/build-with-claude/agents' },
  ];

  // ── UI テキスト（多言語）────────────────────────────────────────
  const I18N = {
    ja: {
      title: 'CCA-F 対策問題集',
      subtitle: 'Claude Certified Architect — Foundations 非公式練習問題集',
      unofficial: '※ 本問題集はAnthropicが提供・保証する公式教材ではありません。',
      tabs: ['一覧', 'ランダム', '模擬試験', '復習', 'スコア履歴', '分析'],
      start: '▶ 開始する',
      next: '次の問題 →',
      finish: '結果を見る',
      retry: 'もう一度',
      correct: '✓ 正解',
      incorrect: '✗ 不正解',
      explanation: '解説',
      ref: '参考',
      domain: 'ドメイン',
      all: '全問',
      filter: 'ドメインで絞り込む',
      score: 'スコア',
      pass: '合格',
      fail: '不合格',
      passLine: '合格ライン: 720 / 1000',
      wrongList: '間違えた問題',
      noWrong: '間違えた問題はありません 🎉',
      noHistory: 'まだ模擬試験を受けていません',
      histTitle: 'スコア履歴',
      clearHistory: '履歴を消去',
      share: 'Xにシェア',
      total: '問',
      correct2: '正解',
      accuracy: '正解率',
      domainBreakdown: 'ドメイン別',
      studyHint: '💡 各選択肢の詳細解説あり',
      timeLeft: '残り時間',
      examInfo: '30問 / 120秒 / スコア100-1000 / 合格720以上',
    },
    en: {
      title: 'CCA-F Practice Questions',
      subtitle: 'Claude Certified Architect — Foundations (Unofficial)',
      unofficial: '※ This is an unofficial study resource, not provided or endorsed by Anthropic.',
      tabs: ['Browse', 'Random', 'Exam', 'Review', 'History', 'Analysis'],
      start: '▶ Start',
      next: 'Next →',
      finish: 'See Results',
      retry: 'Try Again',
      correct: '✓ Correct',
      incorrect: '✗ Incorrect',
      explanation: 'Explanation',
      ref: 'Reference',
      domain: 'Domain',
      all: 'All',
      filter: 'Filter by Domain',
      score: 'Score',
      pass: 'PASS',
      fail: 'FAIL',
      passLine: 'Pass line: 720 / 1000',
      wrongList: 'Wrong Answers',
      noWrong: 'No wrong answers! 🎉',
      noHistory: 'No exam history yet',
      histTitle: 'Score History',
      clearHistory: 'Clear History',
      share: 'Share on X',
      total: ' questions',
      correct2: 'Correct',
      accuracy: 'Accuracy',
      domainBreakdown: 'By Domain',
      studyHint: '💡 Detailed explanation for each option',
      timeLeft: 'Time Left',
      examInfo: '30q / 120s / Score 100-1000 / Pass ≥720',
    },
  };

  // ── 状態 ─────────────────────────────────────────────────────
  let lang = 'ja';
  let activeTab = 'list';
  let listDomainFilter = -1; // -1=全問
  let listScroll = 0;

  // ランダムモード
  let randQ = null, randSelected = -1, randAnswered = false;

  // 模擬試験モード
  const EXAM_SIZE = 30, EXAM_SECS = 120;
  let examState = 'idle'; // idle | running | done
  let examQs = [], examIdx = 0, examSel = 0, examAnswered = false;
  let examCorrect = false, examTotalScore = 0;
  let examDomainScores = [];
  let examTimerInterval = null, examSecsLeft = EXAM_SECS;
  let examWrongIds = [];

  // 復習モード
  let reviewList = [], reviewIdx = 0, reviewSel = 0, reviewAnswered = false;

  // スコア履歴
  const HIST_KEY = 'ccaf_exam_history';
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch(e) { return []; }
  }
  function saveHistory(rec) {
    const h = loadHistory();
    h.unshift(rec);
    if (h.length > 20) h.length = 20;
    localStorage.setItem(HIST_KEY, JSON.stringify(h));
  }

  // 復習リスト(間違えた問題) — examWrongIdsをlocalStorageに保存
  const WRONG_KEY = 'ccaf_wrong_ids';
  function loadWrong() {
    try { return JSON.parse(localStorage.getItem(WRONG_KEY) || '[]'); } catch(e) { return []; }
  }
  function saveWrong(ids) {
    localStorage.setItem(WRONG_KEY, JSON.stringify(ids));
  }

  // ── 初期化 ────────────────────────────────────────────────────
  function init() {
    const sec = document.getElementById('ccaf-exam');
    if (!sec) return;
    renderHeader();
    renderTabs();
    renderPanel();
    bindTabEvents();
    bindLangEvents();
  }

  function t(key) { return (I18N[lang] || I18N.ja)[key] || key; }

  // ── ヘッダー ────────────────────────────────────────────────
  function renderHeader() {
    const h = document.getElementById('ccaf-exam-header');
    if (!h) return;
    h.innerHTML =
      '<div class="cex-brand">' +
        '<span class="cex-logo">⚡</span>' +
        '<div>' +
          '<div class="cex-title">' + t('title') + '</div>' +
          '<div class="cex-sub">' + t('subtitle') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="cex-lang">' +
        '<button class="cex-lang-btn' + (lang === 'ja' ? ' active' : '') + '" data-lang="ja">日本語</button>' +
        '<button class="cex-lang-btn' + (lang === 'en' ? ' active' : '') + '" data-lang="en">EN</button>' +
      '</div>';
  }

  // ── タブバー ────────────────────────────────────────────────
  function renderTabs() {
    const tabIds = ['list','random','exam','review','history','analysis'];
    const tabBar = document.getElementById('ccaf-exam-tabs');
    if (!tabBar) return;
    tabBar.innerHTML = tabIds.map(function(id, i) {
      return '<button class="cex-tab' + (activeTab === id ? ' active' : '') + '" data-tab="' + id + '">' + t('tabs')[i] + '</button>';
    }).join('');
  }

  // ── パネル切り替え ─────────────────────────────────────────
  function renderPanel() {
    const body = document.getElementById('ccaf-exam-body');
    if (!body) return;
    if (activeTab === 'list')     body.innerHTML = buildListPanel();
    else if (activeTab === 'random')  body.innerHTML = buildRandomPanel();
    else if (activeTab === 'exam')    body.innerHTML = buildExamPanel();
    else if (activeTab === 'review')  body.innerHTML = buildReviewPanel();
    else if (activeTab === 'history') body.innerHTML = buildHistoryPanel();
    else if (activeTab === 'analysis') body.innerHTML = buildAnalysisPanel();
    bindPanelEvents();
  }

  // ── 一覧パネル ────────────────────────────────────────────
  function buildListPanel() {
    const filtered = listDomainFilter < 0 ? ALL_Q : ALL_Q.filter(function(q) { return q.domain === listDomainFilter; });
    const domOpts = '<option value="-1">' + (lang === 'ja' ? '全ドメイン' : 'All Domains') + '</option>' +
      DOMAINS.map(function(d, i) {
        return '<option value="' + i + '"' + (listDomainFilter === i ? ' selected' : '') + '>D' + (i+1) + ': ' + (lang === 'ja' ? d.name : d.nameEn) + '</option>';
      }).join('');
    const qCards = filtered.map(function(q, qi) {
      const real = ALL_Q.indexOf(q);
      return '<div class="cex-list-item" data-qidx="' + real + '">' +
        '<div class="cex-list-q-header">' +
          '<span class="cex-list-qnum">Q' + (real+1) + '</span>' +
          '<span class="cex-domain-badge" style="background:' + DOMAINS[q.domain].color + '22;border-color:' + DOMAINS[q.domain].color + '66;color:' + DOMAINS[q.domain].color + '">D' + (q.domain+1) + '</span>' +
        '</div>' +
        '<div class="cex-list-q-text">' + esc(q.q) + '</div>' +
        '<div class="cex-list-opts">' +
          q.opts.map(function(opt, oi) {
            const isAns = oi === q.ans;
            return '<div class="cex-list-opt' + (isAns ? ' correct' : '') + '">' +
              '<span class="cex-opt-label' + (isAns ? ' correct' : '') + '">' + ['A','B','C','D'][oi] + '</span>' +
              '<span>' + esc(opt.replace(/^[A-D]\.\s*/,'')) + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="cex-exp-panel">' +
          '<div class="cex-exp-title">💡 ' + t('explanation') + '</div>' +
          '<div class="cex-exp-main">' + esc(q.exp) + '</div>' +
          (q.optExp ? '<div class="cex-opt-exps">' + q.optExp.map(function(e) {
            const isCorrect = e.startsWith(String.fromCharCode(65 + q.ans) + ': ✓');
            return '<div class="cex-opt-exp' + (isCorrect ? ' correct' : ' wrong') + '">' + esc(e) + '</div>';
          }).join('') + '</div>' : '') +
          (q.ref ? '<div class="cex-ref">🔗 <a href="https://' + esc(q.ref) + '" target="_blank" rel="noopener">https://' + esc(q.ref) + '</a></div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="cex-list-wrap">' +
      '<div class="cex-list-filter">' +
        '<select id="cex-domain-select" class="cex-select">' + domOpts + '</select>' +
        '<span class="cex-count">' + filtered.length + t('total') + '</span>' +
      '</div>' +
      '<div class="cex-list-hint">' + t('studyHint') + '</div>' +
      qCards +
    '</div>';
  }

  // ── ランダムパネル ──────────────────────────────────────────
  function buildRandomPanel() {
    if (!randQ) {
      randQ = ALL_Q[Math.floor(Math.random() * ALL_Q.length)];
      randSelected = -1; randAnswered = false;
    }
    return buildQCard(randQ, randSelected, randAnswered, false, function() {
      return '<button class="cex-btn-primary" id="cex-rand-next">' + (randAnswered ? t('next') : t('start')) + '</button>';
    });
  }

  // ── 模擬試験パネル ─────────────────────────────────────────
  function buildExamPanel() {
    if (examState === 'idle') {
      return '<div class="cex-exam-intro">' +
        '<div class="cex-exam-icon">📝</div>' +
        '<h3 class="cex-exam-h3">' + (lang === 'ja' ? 'CCA-F 模擬試験' : 'CCA-F Mock Exam') + '</h3>' +
        '<p class="cex-exam-info">' + t('examInfo') + '</p>' +
        '<div class="cex-domain-list">' +
          DOMAINS.map(function(d, i) {
            return '<div class="cex-domain-row">' +
              '<span class="cex-domain-dot" style="background:' + d.color + '"></span>' +
              '<span>D' + (i+1) + ': ' + (lang === 'ja' ? d.name : d.nameEn) + '</span>' +
              '<span class="cex-domain-weight">' + d.weight + '%</span>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<button class="cex-btn-primary cex-btn-big" id="cex-exam-start">' + t('start') + '</button>' +
      '</div>';
    }
    if (examState === 'running') {
      const q = examQs[examIdx];
      return '<div class="cex-exam-running">' +
        '<div class="cex-exam-topbar">' +
          '<span>' + (examIdx+1) + ' / ' + EXAM_SIZE + '</span>' +
          '<span class="cex-timer' + (examSecsLeft <= 20 ? ' danger' : '') + '" id="cex-timer">⏱ ' + examSecsLeft + 's</span>' +
          '<span>✓ ' + examTotalScore + '</span>' +
        '</div>' +
        '<div class="cex-timer-bar"><div class="cex-timer-fill' + (examSecsLeft <= 20 ? ' danger' : '') + '" id="cex-timer-fill" style="width:' + Math.round(examSecsLeft / EXAM_SECS * 100) + '%"></div></div>' +
        buildQCard(q, examSel, examAnswered, true) +
        (examAnswered ? '<button class="cex-btn-primary cex-btn-next" id="cex-exam-next">' + (examIdx + 1 >= EXAM_SIZE ? t('finish') : t('next')) + '</button>' : '') +
      '</div>';
    }
    if (examState === 'done') {
      const sc = Math.round(100 + (examTotalScore / EXAM_SIZE) * 900);
      const pass = sc >= 720;
      return '<div class="cex-exam-result">' +
        '<div class="cex-result-badge' + (pass ? ' pass' : ' fail') + '">' + (pass ? t('pass') + ' 🎉' : t('fail')) + '</div>' +
        '<div class="cex-result-score">' + sc + ' <span>/ 1000</span></div>' +
        '<div class="cex-result-sub">' + t('passLine') + ' &nbsp;|&nbsp; ' + t('correct2') + ': ' + examTotalScore + '/' + EXAM_SIZE + '</div>' +
        '<div class="cex-domain-breakdown">' +
          DOMAINS.map(function(d, i) {
            const ds = examDomainScores[i];
            const pct = ds.total > 0 ? Math.round(ds.correct / ds.total * 100) : 0;
            return '<div class="cex-db-row">' +
              '<span class="cex-db-name" style="color:' + d.color + '">D' + (i+1) + '</span>' +
              '<div class="cex-db-bar-wrap"><div class="cex-db-bar" style="width:' + pct + '%;background:' + d.color + '"></div></div>' +
              '<span class="cex-db-val">' + ds.correct + '/' + ds.total + ' (' + pct + '%)</span>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="cex-result-btns">' +
          '<button class="cex-btn-primary" id="cex-exam-retry">' + t('retry') + '</button>' +
          '<button class="cex-btn-share" id="cex-exam-share">' + t('share') + '</button>' +
          (loadWrong().length > 0 ? '<button class="cex-btn-review" id="cex-exam-review">' + (lang === 'ja' ? '間違いを復習 →' : 'Review Mistakes →') + '</button>' : '') +
        '</div>' +
      '</div>';
    }
    return '';
  }

  // ── 復習パネル ────────────────────────────────────────────
  function buildReviewPanel() {
    const wrongIds = loadWrong();
    if (wrongIds.length === 0) {
      return '<div class="cex-empty">' + t('noWrong') + '</div>';
    }
    if (reviewList.length === 0 || reviewIdx >= reviewList.length) {
      reviewList = wrongIds.map(function(id) { return ALL_Q[id]; }).filter(Boolean);
      reviewIdx = 0; reviewSel = 0; reviewAnswered = false;
    }
    const q = reviewList[reviewIdx];
    return '<div class="cex-review-wrap">' +
      '<div class="cex-review-progress">' + (lang === 'ja' ? '復習' : 'Review') + ' ' + (reviewIdx+1) + '/' + reviewList.length + '</div>' +
      buildQCard(q, reviewSel, reviewAnswered, false) +
      (reviewAnswered ? '<button class="cex-btn-primary" id="cex-review-next">' + (reviewIdx+1 < reviewList.length ? t('next') : (lang === 'ja' ? '完了 ✓' : 'Done ✓')) + '</button>' : '') +
    '</div>';
  }

  // ── スコア履歴パネル ───────────────────────────────────────
  function buildHistoryPanel() {
    const h = loadHistory();
    if (h.length === 0) {
      return '<div class="cex-empty">' + t('noHistory') + '</div>';
    }
    return '<div class="cex-hist-wrap">' +
      '<div class="cex-hist-header">' +
        '<span class="cex-hist-title">' + t('histTitle') + '</span>' +
        '<button class="cex-btn-clear" id="cex-hist-clear">' + t('clearHistory') + '</button>' +
      '</div>' +
      h.map(function(rec, i) {
        const pass = rec.score >= 720;
        return '<div class="cex-hist-row">' +
          '<span class="cex-hist-num">' + (i+1) + '</span>' +
          '<span class="cex-hist-date">' + rec.date + '</span>' +
          '<span class="cex-hist-score' + (pass ? ' pass' : ' fail') + '">' + rec.score + '</span>' +
          '<span class="cex-hist-result' + (pass ? ' pass' : ' fail') + '">' + (pass ? t('pass') : t('fail')) + '</span>' +
          '<span class="cex-hist-acc">' + rec.correct + '/' + EXAM_SIZE + ' (' + Math.round(rec.correct/EXAM_SIZE*100) + '%)</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  // ── 分析パネル ────────────────────────────────────────────
  function buildAnalysisPanel() {
    const h = loadHistory();
    if (h.length === 0) {
      return '<div class="cex-empty">' + t('noHistory') + '</div>';
    }
    const avg = Math.round(h.reduce(function(s,r) { return s + r.score; }, 0) / h.length);
    const best = Math.max.apply(null, h.map(function(r) { return r.score; }));
    const passCount = h.filter(function(r) { return r.score >= 720; }).length;
    const trend = h.slice(0, Math.min(7, h.length)).map(function(r, i) {
      const pct = Math.round((r.score - 100) / 900 * 100);
      return '<div class="cex-trend-bar-wrap" title="' + r.score + '">' +
        '<div class="cex-trend-bar' + (r.score >= 720 ? ' pass' : '') + '" style="height:' + pct + '%"></div>' +
        '<div class="cex-trend-label">' + r.score + '</div>' +
      '</div>';
    }).reverse().join('');
    return '<div class="cex-analysis-wrap">' +
      '<div class="cex-stats-row">' +
        '<div class="cex-stat"><div class="cex-stat-val">' + avg + '</div><div class="cex-stat-label">' + (lang === 'ja' ? '平均スコア' : 'Avg Score') + '</div></div>' +
        '<div class="cex-stat"><div class="cex-stat-val">' + best + '</div><div class="cex-stat-label">' + (lang === 'ja' ? '最高スコア' : 'Best Score') + '</div></div>' +
        '<div class="cex-stat"><div class="cex-stat-val">' + passCount + '/' + h.length + '</div><div class="cex-stat-label">' + (lang === 'ja' ? '合格回数' : 'Pass Count') + '</div></div>' +
      '</div>' +
      '<div class="cex-trend-title">' + (lang === 'ja' ? '直近の推移（新→旧）' : 'Recent Trend (new→old)') + '</div>' +
      '<div class="cex-trend">' + trend + '</div>' +
      (loadWrong().length > 0 ?
        '<div class="cex-wrong-hint">' + (lang === 'ja' ? '⚠ 直近の試験で' + loadWrong().length + '問間違えました。「復習」タブで練習しましょう。' : '⚠ You got ' + loadWrong().length + ' wrong in the last exam. Go to the Review tab.') + '</div>'
      : '<div class="cex-no-wrong">✓ ' + t('noWrong') + '</div>') +
    '</div>';
  }

  // ── 問題カード共通 ─────────────────────────────────────────
  function buildQCard(q, sel, answered, compact, extraHtml) {
    const labels = ['A','B','C','D'];
    const optHtml = q.opts.map(function(opt, oi) {
      let cls = 'cex-opt';
      if (answered) {
        if (oi === q.ans) cls += ' correct';
        else if (oi === sel && oi !== q.ans) cls += ' wrong';
        else cls += ' dim';
      } else if (oi === sel) cls += ' selected';
      return '<div class="' + cls + '" data-oi="' + oi + '">' +
        '<span class="cex-opt-key' + (answered && oi === q.ans ? ' correct' : answered && oi === sel && oi !== q.ans ? ' wrong' : '') + '">' + labels[oi] + '</span>' +
        '<span>' + esc(opt.replace(/^[A-D]\.\s*/,'')) + '</span>' +
      '</div>';
    }).join('');
    const expHtml = answered ? '<div class="cex-exp-panel show">' +
      '<div class="cex-feedback' + (sel === q.ans ? ' correct' : ' wrong') + '">' + (sel === q.ans ? t('correct') : t('incorrect') + ' — ' + (lang === 'ja' ? '正解は ' : 'Answer: ') + labels[q.ans]) + '</div>' +
      (q.optExp ? '<div class="cex-opt-exps">' +
        q.optExp.map(function(e, ei) {
          const isAns = ei === q.ans;
          const isWrong = ei === sel && !isAns;
          return '<div class="cex-opt-exp' + (isAns ? ' correct' : isWrong ? ' wrong' : '') + '">' + esc(e) + '</div>';
        }).join('') +
      '</div>' : '') +
      '<div class="cex-exp-main">📖 ' + esc(q.exp) + '</div>' +
      (q.ref ? '<div class="cex-ref">🔗 <a href="https://' + esc(q.ref) + '" target="_blank" rel="noopener">https://' + esc(q.ref) + '</a></div>' : '') +
    '</div>' : '';

    return '<div class="cex-qcard">' +
      '<div class="cex-domain-badge-row"><span class="cex-domain-badge" style="background:' + DOMAINS[q.domain].color + '22;border-color:' + DOMAINS[q.domain].color + '66;color:' + DOMAINS[q.domain].color + '">D' + (q.domain+1) + ': ' + (lang === 'ja' ? DOMAINS[q.domain].name : DOMAINS[q.domain].nameEn) + '</span></div>' +
      '<div class="cex-q-text">' + esc(q.q) + '</div>' +
      '<div class="cex-opts">' + optHtml + '</div>' +
      expHtml +
      (extraHtml ? extraHtml() : '') +
    '</div>';
  }

  // ── イベントバインド ────────────────────────────────────────
  function bindTabEvents() {
    const tabBar = document.getElementById('ccaf-exam-tabs');
    if (!tabBar) return;
    tabBar.addEventListener('click', function(e) {
      const btn = e.target.closest('.cex-tab');
      if (!btn) return;
      activeTab = btn.dataset.tab;
      // 復習モードリセット
      if (activeTab === 'review') { reviewList = []; reviewIdx = 0; reviewSel = 0; reviewAnswered = false; }
      renderTabs();
      renderPanel();
    });
  }

  function bindLangEvents() {
    const hdr = document.getElementById('ccaf-exam-header');
    if (!hdr) return;
    hdr.addEventListener('click', function(e) {
      const btn = e.target.closest('.cex-lang-btn');
      if (!btn) return;
      lang = btn.dataset.lang;
      renderHeader();
      renderTabs();
      renderPanel();
    });
  }

  function bindPanelEvents() {
    const body = document.getElementById('ccaf-exam-body');
    if (!body) return;

    // ドメインフィルター
    const sel = document.getElementById('cex-domain-select');
    if (sel) sel.addEventListener('change', function() {
      listDomainFilter = parseInt(this.value, 10);
      renderPanel();
    });

    // ランダム: 選択肢クリック
    if (activeTab === 'random') {
      body.addEventListener('click', function(e) {
        const opt = e.target.closest('.cex-opt');
        if (opt && !randAnswered) {
          randSelected = parseInt(opt.dataset.oi, 10);
          randAnswered = true;
          renderPanel();
        }
        const nextBtn = e.target.closest('#cex-rand-next');
        if (nextBtn) {
          randQ = ALL_Q[Math.floor(Math.random() * ALL_Q.length)];
          randSelected = -1; randAnswered = false;
          renderPanel();
        }
      });
      return;
    }

    // 模擬試験: 開始
    const examStart = document.getElementById('cex-exam-start');
    if (examStart) {
      examStart.addEventListener('click', startExam);
    }
    // 模擬試験: 選択肢クリック + 次へ
    if (activeTab === 'exam' && examState === 'running') {
      body.addEventListener('click', function(e) {
        const opt = e.target.closest('.cex-opt');
        if (opt && !examAnswered) {
          examSel = parseInt(opt.dataset.oi, 10);
          examAnswered = true;
          examCorrect = examSel === examQs[examIdx].ans;
          if (examCorrect) examTotalScore++;
          else examWrongIds.push(ALL_Q.indexOf(examQs[examIdx]));
          examDomainScores[examQs[examIdx].domain].total++;
          if (examCorrect) examDomainScores[examQs[examIdx].domain].correct++;
          renderPanel();
        }
        const nextBtn = e.target.closest('#cex-exam-next');
        if (nextBtn) advanceExam();
      });
    }
    // 模擬試験: リトライ・シェア・復習へ
    const retry = document.getElementById('cex-exam-retry');
    if (retry) retry.addEventListener('click', function() { examState = 'idle'; renderPanel(); });
    const share = document.getElementById('cex-exam-share');
    if (share) share.addEventListener('click', shareResult);
    const rev = document.getElementById('cex-exam-review');
    if (rev) rev.addEventListener('click', function() { activeTab = 'review'; reviewList = []; reviewIdx = 0; renderTabs(); renderPanel(); });

    // 復習: 選択肢クリック + 次へ
    if (activeTab === 'review') {
      body.addEventListener('click', function(e) {
        const opt = e.target.closest('.cex-opt');
        if (opt && !reviewAnswered) {
          reviewSel = parseInt(opt.dataset.oi, 10);
          reviewAnswered = true;
          renderPanel();
        }
        const nextBtn = e.target.closest('#cex-review-next');
        if (nextBtn) {
          reviewIdx++;
          reviewSel = 0; reviewAnswered = false;
          if (reviewIdx >= reviewList.length) {
            reviewList = []; reviewIdx = 0;
          }
          renderPanel();
        }
      });
    }

    // スコア履歴: 消去
    const clearBtn = document.getElementById('cex-hist-clear');
    if (clearBtn) clearBtn.addEventListener('click', function() {
      localStorage.removeItem(HIST_KEY);
      renderPanel();
    });
  }

  function startExam() {
    stopTimer();
    const byDomain = [[],[],[],[],[]];
    ALL_Q.forEach(function(q) { byDomain[q.domain].push(q); });
    byDomain.forEach(function(arr, i) { byDomain[i] = shuffle(arr); });
    const targets = [7, 6, 6, 6, 5];
    examQs = [];
    byDomain.forEach(function(arr, i) { examQs = examQs.concat(arr.slice(0, targets[i])); });
    examQs = shuffle(examQs);
    examIdx = 0; examSel = 0; examAnswered = false; examCorrect = false;
    examTotalScore = 0; examWrongIds = [];
    examDomainScores = DOMAINS.map(function() { return { correct:0, total:0 }; });
    examSecsLeft = EXAM_SECS;
    examState = 'running';
    renderPanel();
    startTimer();
  }

  function startTimer() {
    stopTimer();
    examTimerInterval = setInterval(function() {
      examSecsLeft--;
      const timerEl = document.getElementById('cex-timer');
      const fillEl  = document.getElementById('cex-timer-fill');
      if (timerEl) timerEl.textContent = '⏱ ' + examSecsLeft + 's';
      if (fillEl) {
        fillEl.style.width = Math.round(examSecsLeft / EXAM_SECS * 100) + '%';
        if (examSecsLeft <= 20) { fillEl.classList.add('danger'); timerEl && timerEl.classList.add('danger'); }
      }
      if (examSecsLeft <= 0) finishExam();
    }, 1000);
  }

  function stopTimer() {
    if (examTimerInterval) { clearInterval(examTimerInterval); examTimerInterval = null; }
  }

  function advanceExam() {
    examIdx++;
    if (examIdx >= EXAM_SIZE) { finishExam(); return; }
    examSel = 0; examAnswered = false;
    renderPanel();
    startTimer();
  }

  function finishExam() {
    stopTimer();
    examState = 'done';
    const sc = Math.round(100 + (examTotalScore / EXAM_SIZE) * 900);
    const now = new Date();
    saveHistory({
      score: sc,
      correct: examTotalScore,
      date: now.getFullYear() + '/' + pad(now.getMonth()+1) + '/' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()),
    });
    saveWrong(examWrongIds);
    renderPanel();
  }

  function shareResult() {
    const sc = Math.round(100 + (examTotalScore / EXAM_SIZE) * 900);
    const pass = sc >= 720;
    const text = '【CCA-F模擬試験】スコア: ' + sc + '/1000 ' + (pass ? '✅合格' : '❌不合格') + '  正解: ' + examTotalScore + '/' + EXAM_SIZE + '問  #VimArcade #CCAF #CCA_F';
    window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (var i = a.length-1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── DOM ready ─────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
