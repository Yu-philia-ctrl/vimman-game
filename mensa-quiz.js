// ── MENSA-QUIZ.JS ── Mensa式IQテスト ──────────────────────────

(function () {
  'use strict';

  // ── 問題データ ───────────────────────────────────────────────
  const QUESTIONS = [
    {
      type: '数列',
      q: '次の数列の「?」に入る数字は何か？\n1, 1, 2, 3, 5, 8, 13, ?',
      opts: ['18', '20', '21', '24'],
      answer: 2, // 0-indexed: '21'
      hint: 'フィボナッチ数列（前2つの和）'
    },
    {
      type: '数列',
      q: '次の数列の「?」に入る数字は何か？\n2, 3, 5, 7, 11, 13, ?',
      opts: ['15', '16', '17', '18'],
      answer: 2, // '17'
      hint: '素数の列'
    },
    {
      type: '数列',
      q: '次の数列の「?」に入る数字は何か？\n1, 8, 27, 64, 125, ?',
      opts: ['196', '210', '216', '225'],
      answer: 2, // '216'
      hint: '自然数の3乗（1³=1, 2³=8, ...）'
    },
    {
      type: '数列',
      q: '次の数列の「?」に入る数字は何か？\n1, 3, 6, 10, 15, ?',
      opts: ['18', '20', '21', '24'],
      answer: 2, // '21'
      hint: '三角数（1+2+3+...+n）'
    },
    {
      type: '文字列',
      q: '次のアルファベット列の「?」に入る文字は何か？\nA, C, F, J, O, ?',
      opts: ['R', 'S', 'T', 'U'],
      answer: 3, // 'U'
      hint: '間隔が2, 3, 4, 5, 6と増えていく'
    },
    {
      type: '論理',
      q: '次の条件がすべて正しいとする。\n「A > B > C > D」\n4つの中で最も値が小さいのはどれか？',
      opts: ['A', 'B', 'C', 'D'],
      answer: 3, // 'D'
      hint: '不等号の向きに注意'
    },
    {
      type: '代数',
      q: 'ある数を3倍して9を引くと21になる。\nその数はいくつか？',
      opts: ['8', '9', '10', '12'],
      answer: 2, // '10'
      hint: '3x - 9 = 21 → x = ?'
    },
    {
      type: '仕事算',
      q: 'ある仕事を4人でやると12日かかる。\n同じ仕事を3人でやると何日かかるか？',
      opts: ['9日', '14日', '15日', '16日'],
      answer: 3, // '16日'
      hint: '全体の仕事量 = 人数 × 日数 = 一定'
    },
    {
      type: '類推',
      q: '次の関係が成り立つとき、「?」に入るのは何か？\n「医者 : 病院」 ＝ 「教師 : ?」',
      opts: ['図書館', '教室', '学校', '塾'],
      answer: 2, // '学校'
      hint: '職業とその職場の対応関係'
    },
    {
      type: '空間',
      q: 'アナログ時計で3時ちょうどのとき、\n時針（時の針）と分針（分の針）がなす角度は何度か？',
      opts: ['60度', '75度', '90度', '120度'],
      answer: 2, // '90度'
      hint: '12時を起点に時針は3時 = 90°、分針は0°（12時）'
    },
  ];

  const TOTAL_Q = QUESTIONS.length; // 10
  const TOTAL_TIME = 60; // 60秒
  const TIME_PER_Q = 6;  // 1問あたり6秒

  // ── IQスコア表 ─────────────────────────────────────────────
  const IQ_TABLE = [
    { min: 10, iq: 138, pct: 0.1,  mensa: true,
      msg: '驚異的な知性。Mensa基準を大きく超えており、世界最高水準の問題解決能力を持つ。' },
    { min: 9,  iq: 128, pct: 2.3,  mensa: true,
      msg: '非常に高い知性。Mensa基準（IQ130）に近く、複雑なパターン認識と論理推論に優れている。' },
    { min: 8,  iq: 118, pct: 9.2,  mensa: false,
      msg: '高い知性。上位10%に相当し、数列・論理・類推のすべてで優秀な成績を示した。' },
    { min: 6,  iq: 108, pct: 23.0, mensa: false,
      msg: '平均以上の知性。知的好奇心をさらに磨けば、より高いスコアが期待できる。' },
    { min: 4,  iq: 95,  pct: 38.0, mensa: false,
      msg: '平均的な知性。トレーニングを重ねることでパターン認識力を向上させられる。' },
    { min: 0,  iq: 85,  pct: 55.0, mensa: false,
      msg: '数列・論理問題は練習で伸びる。焦らず一歩ずつ取り組もう。' },
  ];

  // ── 状態 ───────────────────────────────────────────────────
  let current = 0;
  let correctCount = 0;
  let answers = [];
  let timerInterval = null;
  let totalElapsed = 0;
  let qTimer = 0;
  let qTimerInterval = null;

  // ── DOM refs ───────────────────────────────────────────────
  let elSection, elIntro, elQuizArea, elResult;
  let elTimerBar, elProgressLabel, elQType, elQText, elOptions;
  let elIqVal, elPctVal, elVerdict, elScoreRow;

  // ── 初期化 ─────────────────────────────────────────────────
  function init() {
    elSection      = document.getElementById('mensa-quiz');
    elIntro        = document.getElementById('mensa-intro');
    elQuizArea     = document.getElementById('mensa-quiz-area');
    elResult       = document.getElementById('mensa-result');
    elTimerBar     = document.getElementById('mensa-timer-bar');
    elProgressLabel= document.getElementById('mensa-progress-label');
    elQType        = document.getElementById('mensa-q-type');
    elQText        = document.getElementById('mensa-q-text');
    elOptions      = document.getElementById('mensa-options');
    elIqVal        = document.getElementById('mensa-iq-val');
    elPctVal       = document.getElementById('mensa-pct-val');
    elVerdict      = document.getElementById('mensa-verdict');
    elScoreRow     = document.getElementById('mensa-score-row');

    if (!elSection) return;

    var startBtn = document.getElementById('mensa-start-btn');
    var retryBtn = document.getElementById('mensa-retry-btn');
    var shareBtn = document.getElementById('mensa-share-btn');
    if (startBtn) startBtn.addEventListener('click', startQuiz);
    if (retryBtn) retryBtn.addEventListener('click', retryQuiz);
    if (shareBtn) shareBtn.addEventListener('click', shareResult);
  }

  function startQuiz() {
    current      = 0;
    correctCount = 0;
    answers      = [];
    totalElapsed = 0;
    clearAllTimers();

    elIntro.classList.add('hidden');
    elResult.classList.add('hidden');
    elQuizArea.classList.remove('hidden');

    // 全体タイマー（60秒）
    timerInterval = setInterval(function () {
      totalElapsed++;
      var remaining = Math.max(0, TOTAL_TIME - totalElapsed);
      var pct = ((TOTAL_TIME - remaining) / TOTAL_TIME) * 100;
      if (elTimerBar) elTimerBar.style.width = pct + '%';
      if (remaining <= 10) {
        if (elTimerBar) elTimerBar.classList.add('mensa-timer-urgent');
      }
      if (remaining <= 0) {
        // 時間切れ：残り問題を全部スキップ
        clearAllTimers();
        while (answers.length < TOTAL_Q) answers.push(-1);
        showResult();
      }
    }, 1000);

    showQuestion();
  }

  function retryQuiz() {
    clearAllTimers();
    elResult.classList.add('hidden');
    startQuiz();
  }

  function clearAllTimers() {
    clearInterval(timerInterval);
    clearInterval(qTimerInterval);
    timerInterval = null;
    qTimerInterval = null;
  }

  function showQuestion() {
    if (current >= TOTAL_Q) {
      clearAllTimers();
      showResult();
      return;
    }

    clearInterval(qTimerInterval);
    qTimer = TIME_PER_Q;

    var q = QUESTIONS[current];
    if (elProgressLabel) elProgressLabel.textContent = (current + 1) + ' / ' + TOTAL_Q;
    if (elQType) {
      elQType.textContent = q.type;
    }
    if (elQText) elQText.textContent = q.q;

    // オプション生成
    if (elOptions) {
      elOptions.innerHTML = '';
      var labels = ['A', 'B', 'C', 'D'];
      q.opts.forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.className = 'mensa-opt-btn';
        btn.innerHTML =
          '<span class="mensa-opt-label">' + labels[i] + '</span>' +
          '<span class="mensa-opt-text">' + opt + '</span>';
        btn.addEventListener('click', (function (idx) {
          return function () { selectOption(idx); };
        })(i));
        elOptions.appendChild(btn);
      });
    }

    // フェードイン
    if (elQText) {
      elQText.classList.remove('mensa-fade-in');
      void elQText.offsetWidth;
      elQText.classList.add('mensa-fade-in');
    }
    if (elOptions) {
      elOptions.classList.remove('mensa-fade-in');
      void elOptions.offsetWidth;
      elOptions.classList.add('mensa-fade-in');
    }

    // 1問あたりのタイマー（6秒で自動進行）
    qTimerInterval = setInterval(function () {
      qTimer--;
      if (qTimer <= 0) {
        clearInterval(qTimerInterval);
        // タイムアウト：無回答として記録
        answers.push(-1);
        // ボタン無効化
        if (elOptions) {
          Array.from(elOptions.querySelectorAll('.mensa-opt-btn')).forEach(function (b) {
            b.disabled = true;
            b.classList.add('mensa-opt-disabled');
          });
        }
        setTimeout(function () {
          current++;
          showQuestion();
        }, 300);
      }
    }, 1000);
  }

  function selectOption(idx) {
    clearInterval(qTimerInterval);

    var q = QUESTIONS[current];
    var isCorrect = (idx === q.answer);
    answers.push(idx);
    if (isCorrect) correctCount++;

    // ボタン無効化 + 正誤表示
    if (elOptions) {
      Array.from(elOptions.querySelectorAll('.mensa-opt-btn')).forEach(function (b, i) {
        b.disabled = true;
        if (i === q.answer) {
          b.classList.add('mensa-opt-correct');
        } else if (i === idx && !isCorrect) {
          b.classList.add('mensa-opt-wrong');
        } else {
          b.classList.add('mensa-opt-disabled');
        }
      });
    }

    setTimeout(function () {
      current++;
      showQuestion();
    }, 400);
  }

  function showResult() {
    clearAllTimers();
    elQuizArea.classList.add('hidden');
    elResult.classList.remove('hidden');

    var row = IQ_TABLE.find(function (r) { return correctCount >= r.min; }) || IQ_TABLE[IQ_TABLE.length - 1];

    if (elIqVal) {
      elIqVal.textContent = row.iq;
      if (row.mensa) {
        elIqVal.classList.add('mensa-iq-gold');
      } else {
        elIqVal.classList.remove('mensa-iq-gold');
      }
    }
    if (elPctVal) elPctVal.textContent = row.pct + '%';

    if (elVerdict) {
      if (row.mensa) {
        elVerdict.innerHTML =
          '<div class="mensa-verdict mensa-verdict-pass">' +
          '🏆 Mensa基準クリア！ IQ ' + row.iq + ' — 上位2%の知性' +
          '</div>' +
          '<p class="mensa-verdict-msg">' + row.msg + '</p>';
      } else {
        elVerdict.innerHTML =
          '<div class="mensa-verdict mensa-verdict-normal">' +
          'IQ ' + row.iq + ' 相当' +
          '</div>' +
          '<p class="mensa-verdict-msg">' + row.msg + '</p>';
      }
    }

    if (elScoreRow) {
      elScoreRow.innerHTML =
        '<span class="mensa-score-label">正解数</span>' +
        '<span class="mensa-score-num">' + correctCount + ' / ' + TOTAL_Q + '</span>';
    }

    // タイマーバー満杯に
    if (elTimerBar) {
      elTimerBar.style.width = '100%';
      elTimerBar.classList.remove('mensa-timer-urgent');
    }
  }

  function shareResult() {
    var iq  = elIqVal  ? elIqVal.textContent  : '--';
    var pct = elPctVal ? elPctVal.textContent : '--%';
    var text =
      '🧩 Mensa式IQテスト結果\n' +
      'IQ ' + iq + '（上位 ' + pct + '）\n' +
      '正解数: ' + correctCount + ' / ' + TOTAL_Q + '\n' +
      '#VimArcade #MensaIQ #IQテスト\n' +
      'https://yu-philia-ctrl.github.io/vimman-game/';
    if (navigator.share) {
      navigator.share({ text: text }).catch(function () {});
    } else {
      window.open(
        'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text),
        '_blank'
      );
    }
  }

  // ── 起動 ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
