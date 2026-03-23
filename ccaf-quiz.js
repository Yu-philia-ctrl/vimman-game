// ── CCAF-QUIZ.JS ── Claude Certified Architect Foundation exam prep ──

const ccafQuizGame = (function () {

  // ── Rounded rect helper (local if global not available) ───────
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

  // ── Word-wrap helper ──────────────────────────────────────────
  function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      if ((line + (line ? ' ' : '') + w).length > maxChars) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = line ? line + ' ' + w : w;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // ── Domain metadata ───────────────────────────────────────────
  const DOMAINS = [
    { name: 'Agent Architecture & Orchestration', weight: 27, color: '#7b68ee' },
    { name: 'Tool Design & MCP Integration',      weight: 18, color: '#4fc3f7' },
    { name: 'Claude Code Configuration',          weight: 20, color: '#81c784' },
    { name: 'Prompt Engineering & Output',        weight: 20, color: '#ffb74d' },
    { name: 'Context Management & Reliability',   weight: 15, color: '#f06292' },
  ];

  // ── 30 Questions (6 per domain) ───────────────────────────────
  const QUESTIONS = [
    // Domain 0 — Agent Architecture & Orchestration
    {
      q: 'In a multi-agent system, which Claude role is responsible for directing subagents and synthesising their results?',
      opts: ['A. Subagent', 'B. Orchestrator', 'C. Tool server', 'D. Human-in-the-loop proxy'],
      ans: 1, domain: 0,
      exp: 'The orchestrator plans and delegates; subagents execute individual tool calls.'
    },
    {
      q: 'What content block type does Claude emit when it wants to invoke a tool during an agentic loop?',
      opts: ['A. text', 'B. image', 'C. tool_use', 'D. tool_result'],
      ans: 2, domain: 0,
      exp: 'Claude emits a tool_use block; the caller executes it and returns a tool_result block.'
    },
    {
      q: 'Which condition should terminate an agent loop to prevent runaway token spend?',
      opts: [
        'A. When the model outputs an empty string',
        'B. When stop_reason is "end_turn" or a max-iterations limit is hit',
        'C. When the user presses Ctrl-C',
        'D. When the first tool call succeeds'
      ],
      ans: 1, domain: 0,
      exp: 'Loops must check stop_reason=="end_turn" and enforce an iteration ceiling.'
    },
    {
      q: 'Human-in-the-loop (HITL) is BEST inserted at which point in an agentic pipeline?',
      opts: [
        'A. After every single tool call',
        'B. Only when the model is uncertain and explicitly asks',
        'C. Before irreversible or high-impact actions such as file deletion or payments',
        'D. Never — fully autonomous agents should not pause'
      ],
      ans: 2, domain: 0,
      exp: 'HITL checkpoints guard irreversible actions; pausing on every call is impractical.'
    },
    {
      q: 'Which pattern best handles a subagent that returns an error tool_result?',
      opts: [
        'A. Immediately raise an exception to the user',
        'B. Pass the error result back to the orchestrator so it can retry or re-plan',
        'C. Silently discard the error and continue',
        'D. Restart the entire agent loop from scratch'
      ],
      ans: 1, domain: 0,
      exp: 'Surfacing errors to the orchestrator lets it decide on retries or alternate plans.'
    },
    {
      q: 'What is the primary advantage of a subagent architecture over a single monolithic agent?',
      opts: [
        'A. Reduced API costs per request',
        'B. Parallel specialised execution with isolated context windows',
        'C. Elimination of all tool call overhead',
        'D. Built-in rate-limit bypass'
      ],
      ans: 1, domain: 0,
      exp: 'Subagents run in parallel with focused contexts, improving scalability and isolation.'
    },

    // Domain 1 — Tool Design & MCP Integration
    {
      q: 'Which transport protocol does an MCP server use when it communicates via standard input/output streams?',
      opts: ['A. SSE (Server-Sent Events)', 'B. WebSocket', 'C. stdio', 'D. gRPC'],
      ans: 2, domain: 1,
      exp: 'stdio transport reads/writes JSON-RPC messages over stdin/stdout.'
    },
    {
      q: 'In an MCP tool schema, which JSON Schema keyword marks a parameter as required?',
      opts: ['A. "mandatory": true', 'B. "required" array at the object level', 'C. "nullable": false', 'D. "optional": false'],
      ans: 1, domain: 1,
      exp: 'JSON Schema uses a top-level "required" array listing mandatory property names.'
    },
    {
      q: 'SSE transport in MCP is most suitable for which scenario?',
      opts: [
        'A. Local CLI tools where process isolation is needed',
        'B. Remote HTTP servers that push real-time events to the client',
        'C. Batch file-processing pipelines',
        'D. Offline embedded devices'
      ],
      ans: 1, domain: 1,
      exp: 'SSE suits remote HTTP servers; stdio suits local process-based servers.'
    },
    {
      q: 'Which authentication method is recommended for securing a public MCP HTTP server?',
      opts: [
        'A. Embedding secrets in the tool description string',
        'B. OAuth 2.0 / Bearer tokens validated by the server',
        'C. IP allowlisting only',
        'D. No authentication — MCP is inherently secure'
      ],
      ans: 1, domain: 1,
      exp: 'OAuth 2.0 Bearer tokens provide standard, auditable auth for HTTP MCP endpoints.'
    },
    {
      q: 'What makes a toolset "composable" in MCP design?',
      opts: [
        'A. Each tool performs one well-defined action with clear inputs/outputs',
        'B. All tools share a single large input schema',
        'C. Tools are bundled into one mega-function to reduce roundtrips',
        'D. Tools have no schema so the model decides parameters freely'
      ],
      ans: 0, domain: 1,
      exp: 'Single-responsibility tools compose cleanly; omnibus tools create coupling.'
    },
    {
      q: 'When implementing an MCP server, the tool description field primarily influences:',
      opts: [
        'A. Network timeout thresholds',
        'B. How the model decides when and how to call the tool',
        'C. The authentication mechanism used',
        'D. The transport protocol selected'
      ],
      ans: 1, domain: 1,
      exp: 'The description is the model\'s primary signal for tool selection and invocation.'
    },

    // Domain 2 — Claude Code Configuration
    {
      q: 'Which file does Claude Code read to understand project-specific instructions and context?',
      opts: ['A. .claudeignore', 'B. CLAUDE.md', 'C. .claude/config.json', 'D. README.md'],
      ans: 1, domain: 2,
      exp: 'CLAUDE.md is the canonical project memory file Claude Code reads automatically.'
    },
    {
      q: 'A PreToolUse hook in Claude Code fires:',
      opts: [
        'A. After every tool result is returned to the model',
        'B. Before Claude executes a tool call, allowing interception or rejection',
        'C. Only when a bash command fails',
        'D. When the session ends'
      ],
      ans: 1, domain: 2,
      exp: 'PreToolUse hooks intercept calls before execution; PostToolUse hooks fire after.'
    },
    {
      q: 'Which permission model setting would prevent Claude Code from writing to /etc?',
      opts: [
        'A. allow: ["Write(/etc)"]',
        'B. deny: ["Write(/etc/**)", "Write(/etc)"]',
        'C. readonly: true in CLAUDE.md',
        'D. disableShell: true'
      ],
      ans: 1, domain: 2,
      exp: 'deny rules with glob patterns block specific tool+path combinations.'
    },
    {
      q: 'In a CLAUDE.md file, which section heading convention is recommended for separating concerns?',
      opts: [
        'A. XML tags like <section>',
        'B. Markdown headings (## Section Name)',
        'C. JSON blocks with "section" keys',
        'D. YAML front matter only'
      ],
      ans: 1, domain: 2,
      exp: 'Markdown headings structure CLAUDE.md clearly; Claude parses standard Markdown.'
    },
    {
      q: 'Which hook type is best suited for automatically running tests after code edits?',
      opts: ['A. PreToolUse', 'B. OnSessionStart', 'C. PostToolUse', 'D. OnError'],
      ans: 2, domain: 2,
      exp: 'PostToolUse fires after an edit completes, ideal for triggering test runners.'
    },
    {
      q: 'Claude Code\'s permission "allow" and "deny" rules are evaluated in which order?',
      opts: [
        'A. Allow rules first; if matched, skip deny rules',
        'B. Deny rules first; deny wins over allow',
        'C. Alphabetically by tool name',
        'D. The order they appear in the config file, last rule wins'
      ],
      ans: 1, domain: 2,
      exp: 'Deny rules take precedence — a deny match blocks the action regardless of allow rules.'
    },

    // Domain 3 — Prompt Engineering & Structured Output
    {
      q: 'Which element of a system prompt most improves Claude\'s adherence to a specific output format?',
      opts: [
        'A. A long list of prohibited topics',
        'B. A concrete few-shot example showing the exact desired format',
        'C. Increasing the temperature parameter',
        'D. Using all-caps instructions'
      ],
      ans: 1, domain: 3,
      exp: 'Few-shot examples are the strongest signal for output structure compliance.'
    },
    {
      q: 'To guarantee Claude returns valid JSON, the MOST reliable approach is:',
      opts: [
        'A. Ask Claude to "try to return JSON"',
        'B. Use the JSON mode / structured output feature with a JSON Schema',
        'C. Post-process with regex',
        'D. Set temperature=0'
      ],
      ans: 1, domain: 3,
      exp: 'Schema-constrained structured output enforces valid JSON at the grammar level.'
    },
    {
      q: 'XML tags in prompts (e.g., <document>, <instructions>) primarily help by:',
      opts: [
        'A. Reducing token count automatically',
        'B. Clearly delimiting sections so Claude can locate each part of the prompt',
        'C. Enabling tool calls',
        'D. Bypassing content moderation'
      ],
      ans: 1, domain: 3,
      exp: 'XML tags act as semantic separators, reducing confusion between prompt sections.'
    },
    {
      q: 'Pydantic validation is used in Claude integrations primarily to:',
      opts: [
        'A. Generate system prompts automatically',
        'B. Validate and parse Claude\'s JSON output into typed Python objects',
        'C. Handle streaming responses',
        'D. Manage API authentication'
      ],
      ans: 1, domain: 3,
      exp: 'Pydantic models validate JSON responses, catching type errors early in the pipeline.'
    },
    {
      q: 'Which system prompt practice MOST reduces hallucinated citations?',
      opts: [
        'A. Telling Claude to "be confident"',
        'B. Instructing Claude to say "I don\'t know" when evidence is absent, with grounded examples',
        'C. Disabling the knowledge cutoff',
        'D. Using a higher max_tokens value'
      ],
      ans: 1, domain: 3,
      exp: 'Explicit "admit uncertainty" instructions with examples calibrate Claude\'s confidence.'
    },
    {
      q: 'In a JSON Schema for structured output, "additionalProperties": false ensures:',
      opts: [
        'A. Numeric fields are always positive',
        'B. The model cannot add undeclared keys to the response object',
        'C. Arrays have at least one element',
        'D. All string fields are non-empty'
      ],
      ans: 1, domain: 3,
      exp: 'additionalProperties:false blocks extraneous keys, keeping output strictly on-schema.'
    },

    // Domain 4 — Context Management & Reliability
    {
      q: 'Which API parameter enables prompt caching for a large static system prompt in Claude?',
      opts: [
        'A. "cache": true in the request body',
        'B. cache_control: {"type":"ephemeral"} on the content block',
        'C. X-Cache-Control HTTP header',
        'D. Caching is automatic and requires no configuration'
      ],
      ans: 1, domain: 4,
      exp: 'cache_control:{"type":"ephemeral"} marks a content block for prompt-cache storage.'
    },
    {
      q: 'What is the primary cost benefit of prompt caching?',
      opts: [
        'A. Output tokens are billed at a lower rate',
        'B. Cached input tokens are re-processed at a fraction of the normal input token cost',
        'C. The model skips safety checks for cached prompts',
        'D. Latency increases but cost stays the same'
      ],
      ans: 1, domain: 4,
      exp: 'Cache hits reprice input tokens at ~10% of standard cost, reducing repeated-prompt spend.'
    },
    {
      q: 'When Claude returns a 529 "overloaded" or 429 rate-limit error, the correct first response is:',
      opts: [
        'A. Switch to a competitor model permanently',
        'B. Retry immediately in a tight loop',
        'C. Exponential backoff with jitter before retrying',
        'D. Increase max_tokens to reduce request frequency'
      ],
      ans: 2, domain: 4,
      exp: 'Exponential backoff with jitter avoids thundering-herd behaviour on rate-limited APIs.'
    },
    {
      q: 'A "token budget" strategy in a long-running agent is BEST implemented by:',
      opts: [
        'A. Ignoring token counts and letting the API enforce limits',
        'B. Tracking cumulative input+output tokens and truncating context when approaching the limit',
        'C. Restarting the model every 1 000 tokens',
        'D. Using only 1-shot prompts to minimise tokens'
      ],
      ans: 1, domain: 4,
      exp: 'Proactive token tracking and context truncation prevents unexpected context-limit errors.'
    },
    {
      q: 'Which HTTP header is required to enable beta features such as extended thinking in Claude\'s API?',
      opts: [
        'A. X-Beta-Features: true',
        'B. anthropic-beta: <feature-name>',
        'C. Authorization: Beta <key>',
        'D. Content-Type: application/beta+json'
      ],
      ans: 1, domain: 4,
      exp: 'The anthropic-beta header opts into named beta features (e.g., "interleaved-thinking-2025-05-14").'
    },
    {
      q: 'To minimise cost when making many similar requests with a shared large context, you should:',
      opts: [
        'A. Send the full context fresh in every request',
        'B. Place shared context at the top of messages and use cache_control to cache it',
        'C. Split the context across multiple API keys',
        'D. Use streaming to avoid storing context server-side'
      ],
      ans: 1, domain: 4,
      exp: 'Caching shared context at the top of the prompt maximises cache hit rates across requests.'
    },
  ];

  // ── State ─────────────────────────────────────────────────────
  let state, qIndex, selected, answered, feedbackTimer, feedbackCorrect;
  let domainScores, totalScore, timerFrames, timerMax;
  let menuSel, resultSel;

  const TOTAL_Q   = QUESTIONS.length;   // 30
  const QUIZ_SECS = 120;
  const FPS       = 60;
  const FEED_DUR  = Math.round(1.5 * FPS);
  const PASS_SCALED = 720;

  // ── Scale raw score 0-30 → 100-1000 ──────────────────────────
  function scaleScore(raw) {
    return Math.round(100 + (raw / TOTAL_Q) * 900);
  }

  function init() {
    state        = 'menu';
    menuSel      = 0;
    resultSel    = 0;
    domainScores = DOMAINS.map(() => ({ correct: 0, total: 0 }));
    totalScore   = 0;
    qIndex       = 0;
    selected     = 0;
    answered     = false;
    feedbackTimer  = 0;
    feedbackCorrect = false;
    timerMax    = QUIZ_SECS * FPS;
    timerFrames = timerMax;
  }

  function startQuiz() {
    qIndex       = 0;
    selected     = 0;
    answered     = false;
    feedbackTimer = 0;
    totalScore   = 0;
    domainScores = DOMAINS.map(() => ({ correct: 0, total: 0 }));
    timerFrames  = timerMax;
    state        = 'quiz';
    if (window.GameAudio) window.GameAudio.sfx('confirm');
  }

  // ── UPDATE ────────────────────────────────────────────────────
  function update() {
    if (state === 'quiz' && !answered) {
      timerFrames = Math.max(0, timerFrames - 1);
      if (timerFrames === 0) {
        // Time up — auto-submit no answer
        submitAnswer(-1);
      }
    }
    if (state === 'quiz' && answered) {
      feedbackTimer--;
      if (feedbackTimer <= 0) {
        nextQuestion();
      }
    }
  }

  function submitAnswer(sel) {
    const q = QUESTIONS[qIndex];
    answered       = true;
    feedbackCorrect = (sel === q.ans);
    feedbackTimer   = FEED_DUR;
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
    if (qIndex >= TOTAL_Q) {
      state     = 'result';
      resultSel = 0;
      if (window.GameAudio) window.GameAudio.sfx('confirm');
    } else {
      selected  = 0;
      answered  = false;
      feedbackTimer = 0;
    }
  }

  // ── onKey ─────────────────────────────────────────────────────
  function onKey(e) {
    const k = e.key;
    if (state === 'menu') {
      if (k === 'ArrowUp'   || k === 'k') menuSel = Math.max(0, menuSel - 1);
      if (k === 'ArrowDown' || k === 'j') menuSel = Math.min(1, menuSel + 1);
      if (k === 'Enter' || k === 'z' || k === 'Z') {
        if (menuSel === 0) startQuiz();
        else switchGame('menu');
      }
    } else if (state === 'quiz') {
      if (answered) return;
      if (k === 'ArrowUp'   || k === 'k') selected = (selected + 3) % 4;
      if (k === 'ArrowDown' || k === 'j') selected = (selected + 1) % 4;
      if (k === 'Enter' || k === 'z' || k === 'Z') {
        if (!answered) submitAnswer(selected);
      }
    } else if (state === 'result') {
      if (k === 'ArrowUp'   || k === 'k') resultSel = Math.max(0, resultSel - 1);
      if (k === 'ArrowDown' || k === 'j') resultSel = Math.min(1, resultSel + 1);
      if (k === 'Enter' || k === 'z' || k === 'Z') {
        if (resultSel === 0) { init(); startQuiz(); }
        else switchGame('menu');
      }
    }
  }

  // ── DRAW helpers ──────────────────────────────────────────────
  function fillRR(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    rr(x, y, w, h, r);
    ctx.fill();
  }
  function strokeRR(x, y, w, h, r, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = lw || 2;
    rr(x, y, w, h, r);
    ctx.stroke();
  }
  function txt(str, x, y, font, color, align) {
    ctx.font      = font;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.fillText(str, x, y);
  }

  // ── DRAW MENU ─────────────────────────────────────────────────
  function drawMenu() {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0a1e');
    bg.addColorStop(1, '#0d0620');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Decorative top stripe
    ctx.fillStyle = '#1a0a3a';
    ctx.fillRect(0, 0, W, 4);

    // Title
    txt('⚡ CCA-F 認定試験 対策モード', W / 2, 58, 'bold 26px monospace', '#c5b0ff', 'center');
    txt('Claude Certified Architect — Foundations', W / 2, 86, '14px monospace', '#8877aa', 'center');

    // Exam stats bar
    fillRR(60, 102, W - 120, 36, 8, 'rgba(255,255,255,0.04)');
    const stats = TOTAL_Q + ' questions  ·  ' + QUIZ_SECS + ' sec/q  ·  Score 100-1000  ·  Pass: 720';
    txt(stats, W / 2, 125, '12px monospace', '#9988bb', 'center');

    // Domain cards
    const cardW = 670, cardH = 46;
    const cardX = (W - cardW) / 2;
    const cardStartY = 160;
    DOMAINS.forEach(function (d, i) {
      const cy = cardStartY + i * (cardH + 8);
      fillRR(cardX, cy, cardW, cardH, 8, 'rgba(255,255,255,0.04)');
      strokeRR(cardX, cy, cardW, cardH, 8, d.color + '66', 1.5);
      // Color swatch
      ctx.fillStyle = d.color;
      rr(cardX + 12, cy + 13, 20, 20, 4);
      ctx.fill();
      // Domain name
      txt('Domain ' + (i + 1) + ': ' + d.name, cardX + 44, cy + 28, '13px monospace', '#ddd', 'left');
      // Weight
      txt(d.weight + '%', cardX + cardW - 14, cy + 28, 'bold 13px monospace', d.color, 'right');
    });

    // Buttons
    const btnW = 220, btnH = 44;
    const btnY = cardStartY + DOMAINS.length * (cardH + 8) + 20;
    const btnLabels = ['試験を開始する', 'メニューに戻る'];
    btnLabels.forEach(function (label, i) {
      const bx = W / 2 - btnW / 2;
      const by = btnY + i * (btnH + 10);
      const sel = menuSel === i;
      fillRR(bx, by, btnW, btnH, 10, sel ? '#4433aa' : 'rgba(255,255,255,0.05)');
      strokeRR(bx, by, btnW, btnH, 10, sel ? '#9977ff' : '#333355', sel ? 2 : 1);
      txt(label, W / 2, by + 28, (sel ? 'bold ' : '') + '15px monospace', sel ? '#fff' : '#aaa', 'center');
    });

    // Nav hint
    txt('クリック または ↑↓/kj 選択    Enter/Z 決定', W / 2, H - 18, '12px monospace', '#8866aa', 'center');
  }

  // ── DRAW QUIZ ─────────────────────────────────────────────────
  function drawQuiz() {
    const q    = QUESTIONS[qIndex];
    const dom  = DOMAINS[q.domain];

    // Background
    ctx.fillStyle = '#07071a';
    ctx.fillRect(0, 0, W, H);

    // Timer bar
    const timerRatio = timerFrames / timerMax;
    const barW       = W - 40;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(20, 12, barW, 10);
    const barColor = timerRatio > 0.5 ? '#44cc88'
                   : timerRatio > 0.25 ? '#ffaa22'
                   : '#ff4444';
    ctx.fillStyle = barColor;
    ctx.fillRect(20, 12, Math.round(barW * timerRatio), 10);
    strokeRR(20, 12, barW, 10, 3, '#333355', 1);

    // Q counter + domain badge
    txt('Q ' + (qIndex + 1) + ' / ' + TOTAL_Q, 24, 42, 'bold 15px monospace', '#aaa', 'left');
    const badgeText = 'Domain ' + (q.domain + 1) + ': ' + dom.name + '  (' + dom.weight + '%)';
    const bw = Math.min(ctx.measureText(badgeText).width + 20, 420);
    fillRR(W - bw - 14, 28, bw, 22, 6, dom.color + '33');
    txt(badgeText, W - 14, 44, '11px monospace', dom.color, 'right');

    // Score
    txt('Score: ' + totalScore, W / 2, 42, '13px monospace', '#8877bb', 'center');

    // Divider
    ctx.strokeStyle = '#22224a';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(20, 52); ctx.lineTo(W - 20, 52); ctx.stroke();

    // Question text
    const qLines = wrapText(q.q, 72);
    const qY0    = 78;
    qLines.forEach(function (line, i) {
      txt(line, W / 2, qY0 + i * 22, '15px monospace', '#e8e0ff', 'center');
    });

    // Answer options
    const optStartY = qY0 + qLines.length * 22 + 20;
    const optW = W - 80, optX = 40;
    const labels = ['A', 'B', 'C', 'D'];

    q.opts.forEach(function (opt, i) {
      const oy  = optStartY + i * 62;
      let bg, border, textCol;

      if (answered) {
        if (i === q.ans) {
          bg = '#1a3a1a'; border = '#44ff88'; textCol = '#88ffaa';
        } else if (i === selected && i !== q.ans) {
          bg = '#3a1010'; border = '#ff4444'; textCol = '#ff8888';
        } else {
          bg = 'rgba(255,255,255,0.02)'; border = '#2a2a4a'; textCol = '#666';
        }
      } else {
        if (i === selected) {
          bg = '#1e1050'; border = '#8866ff'; textCol = '#fff';
        } else {
          bg = 'rgba(255,255,255,0.03)'; border = '#1e1e3e'; textCol = '#bbb';
        }
      }

      fillRR(optX, oy, optW, 52, 8, bg);
      strokeRR(optX, oy, optW, 52, 8, border, i === selected && !answered ? 2 : 1.5);

      // Letter badge
      ctx.fillStyle = i === selected && !answered ? '#8866ff' : (border);
      rr(optX + 10, oy + 12, 28, 28, 6);
      ctx.fill();
      txt(labels[i], optX + 24, oy + 31, 'bold 15px monospace', '#fff', 'center');

      // Option text (wrap if needed)
      const optText   = opt.replace(/^[A-D]\.\s*/, '');
      const optLines  = wrapText(optText, 62);
      const lineH     = 17;
      const textStartY = oy + 18 + (52 - optLines.length * lineH) / 2;
      optLines.forEach(function (line, li) {
        txt(line, optX + 50, textStartY + li * lineH, '13px monospace', textCol, 'left');
      });
    });

    // Feedback overlay
    if (answered) {
      const fadeIn  = Math.min(1, (FEED_DUR - feedbackTimer) / 8);
      const alpha   = fadeIn * 0.92;
      const msgY    = H - 90;
      const msgText = feedbackCorrect ? '✓  正解！' : '✗  不正解';
      const msgCol  = feedbackCorrect ? '#44ff88' : '#ff5555';

      ctx.globalAlpha = alpha;
      fillRR(W / 2 - 200, msgY - 22, 400, 40, 10, feedbackCorrect ? '#0a2a0a' : '#2a0a0a');
      strokeRR(W / 2 - 200, msgY - 22, 400, 40, 10, msgCol, 2);
      ctx.globalAlpha = alpha;
      txt(msgText, W / 2, msgY + 5, 'bold 18px monospace', msgCol, 'center');
      ctx.globalAlpha = 1;

      // Explanation
      const expLines = wrapText(q.exp, 74);
      expLines.forEach(function (line, i) {
        txt(line, W / 2, H - 38 + i * 16, '11px monospace', '#887799', 'center');
      });
    }

    // Nav hint
    if (!answered) {
      txt('クリックで選択 / ↑↓ kj で移動  Enter/Z で回答', W / 2, H - 12, '11px monospace', '#554477', 'center');
    }
  }

  // ── DRAW RESULT ───────────────────────────────────────────────
  function drawResult() {
    const bg2 = ctx.createLinearGradient(0, 0, 0, H);
    bg2.addColorStop(0, '#05051a');
    bg2.addColorStop(1, '#100520');
    ctx.fillStyle = bg2;
    ctx.fillRect(0, 0, W, H);

    const scaled = scaleScore(totalScore);
    const pass   = scaled >= PASS_SCALED;

    // Pass / Fail header
    const hColor = pass ? '#44ff88' : '#ff5555';
    const hText  = pass ? 'PASS  合格！' : 'FAIL  不合格';
    txt(hText, W / 2, 60, 'bold 32px monospace', hColor, 'center');

    // Scaled score
    txt('スコア: ' + scaled + ' / 1000', W / 2, 98, 'bold 22px monospace', '#ddd', 'center');
    txt('(合格ライン 720)', W / 2, 122, '13px monospace', '#887799', 'center');

    // Raw correct
    txt('正解数: ' + totalScore + ' / ' + TOTAL_Q, W / 2, 150, '14px monospace', '#aaa', 'center');

    // Domain breakdown
    const cardW = 680, cardX = (W - cardW) / 2;
    const bStartY = 172;
    const bH = 38;
    DOMAINS.forEach(function (d, i) {
      const ds  = domainScores[i];
      const cy  = bStartY + i * (bH + 6);
      const pct = ds.total > 0 ? ds.correct / ds.total : 0;
      fillRR(cardX, cy, cardW, bH, 7, 'rgba(255,255,255,0.03)');
      strokeRR(cardX, cy, cardW, bH, 7, d.color + '55', 1);
      // Color dot
      ctx.fillStyle = d.color;
      rr(cardX + 10, cy + 11, 16, 16, 4);
      ctx.fill();
      txt('D' + (i + 1) + ': ' + d.name, cardX + 36, cy + 24, '12px monospace', '#ccc', 'left');
      const pctStr = ds.correct + '/' + ds.total + '  (' + Math.round(pct * 100) + '%)';
      const pctCol = pct >= 0.7 ? '#44cc88' : pct >= 0.5 ? '#ffaa33' : '#ff6666';
      txt(pctStr, cardX + cardW - 10, cy + 24, 'bold 12px monospace', pctCol, 'right');
      // Mini progress
      const pbW = 100;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(cardX + cardW - 130, cy + 14, pbW, 10);
      ctx.fillStyle = pctCol;
      ctx.fillRect(cardX + cardW - 130, cy + 14, Math.round(pbW * pct), 10);
    });

    // Buttons
    const btnW = 200, btnH = 40;
    const btnY = bStartY + DOMAINS.length * (bH + 6) + 18;
    const btnLabels = ['もう一度挑戦', 'メニューへ'];
    btnLabels.forEach(function (label, i) {
      const bx  = W / 2 - btnW / 2;
      const by  = btnY + i * (btnH + 10);
      const sel = resultSel === i;
      fillRR(bx, by, btnW, btnH, 10, sel ? '#2a1a66' : 'rgba(255,255,255,0.04)');
      strokeRR(bx, by, btnW, btnH, 10, sel ? '#9977ff' : '#2a2a4a', sel ? 2 : 1);
      txt(label, W / 2, by + 26, (sel ? 'bold ' : '') + '14px monospace', sel ? '#fff' : '#999', 'center');
    });

    txt('↑↓ / k j  選択    Enter / Z  決定', W / 2, H - 12, '10px monospace', '#333355', 'center');
  }

  // ── DRAW dispatch ─────────────────────────────────────────────
  function draw() {
    if      (state === 'menu')   drawMenu();
    else if (state === 'quiz')   drawQuiz();
    else if (state === 'result') drawResult();
  }

  // ── onClick — canvas click handler ───────────────────────────
  // NOTE: X-axis constraint removed from all buttons — any horizontal
  // position at the correct Y triggers the button. This avoids click
  // misses caused by CSS zoom/scale coordinate rounding.
  function onClick(cx, cy) {
    if (state === 'menu') {
      // Button 0: 試験を開始する  y=450..494
      // Button 1: メニューに戻る  y=504..548
      const btnH = 44;
      const btnY = 450;
      if (cy >= btnY && cy <= btnY + btnH) { menuSel = 0; startQuiz(); return; }
      if (cy >= btnY + 54 && cy <= btnY + 54 + btnH) { switchGame('menu'); return; }
      return;
    }
    if (state === 'quiz' && !answered) {
      const q = QUESTIONS[qIndex];
      const qLinesLen = wrapText(q.q, 72).length;
      const optStartY = 78 + qLinesLen * 22 + 20;
      const optH = 52;
      for (var i = 0; i < q.opts.length; i++) {
        const oy = optStartY + i * 62;
        if (cy >= oy && cy <= oy + optH) {
          selected = i;
          submitAnswer(i);
          return;
        }
      }
      return;
    }
    if (state === 'result') {
      const btnH = 38;
      const b0y = H - 110, b1y = H - 64;
      if (cy >= b0y && cy <= b0y + btnH) { init(); startQuiz(); return; }
      if (cy >= b1y && cy <= b1y + btnH) { switchGame('menu'); return; }
    }
  }

  return { init: init, update: update, draw: draw, onKey: onKey, onClick: onClick };
})();

registerGame('ccaf', ccafQuizGame);
