// ── HUMANITY-QUIZ.JS ── 人間性偏差値テスト ────────────────────

(function () {
  'use strict';

  // ── 問題データ ───────────────────────────────────────────────
  // cat: 共感力/誠実さ/思いやり/倫理観/社会性
  // opts: [text, score(0-3)]  A→B→C→D の順
  const QUESTIONS = [
    // ── 共感力 (Empathy) ────────────────────────────────────────
    {
      cat: '共感力',
      q: '親友が深刻な悩みを打ち明けてきた。あなたはどうする？',
      opts: [
        ['最後まで話を聞いてから、一緒に解決策を考える', 3],
        ['話を聞きながらアドバイスをする', 2],
        ['手短に聞いて前向きな言葉をかける', 1],
        ['忙しいので後で聞くと伝える', 0],
      ]
    },
    {
      cat: '共感力',
      q: '同僚が大きなミスをして落ち込んでいる。あなたには関係ないことだが？',
      opts: [
        ['自分から声をかけてサポートを申し出る', 3],
        ['普通に接して、気分転換になるよう努める', 2],
        ['そっとしておく（元気になるのを待つ）', 1],
        ['「自業自得だ」と思って全く関わらない', 0],
      ]
    },
    {
      cat: '共感力',
      q: 'パーティーで一人だけぼっちになっている人がいる。あなたは？',
      opts: [
        ['積極的に話しかけて、自分のグループに誘う', 3],
        ['自然な流れを見計らって声をかける', 2],
        ['気にはなるが自分からは行動しない', 1],
        ['特に気にとめない', 0],
      ]
    },
    // ── 誠実さ (Integrity) ──────────────────────────────────────
    {
      cat: '誠実さ',
      q: '誰も見ていない場所で財布を拾った。中には現金1万円。どうする？',
      opts: [
        ['迷わず警察に届ける', 3],
        ['少し悩むが最終的に届ける', 2],
        ['持ち主が分かれば連絡するが、分からなければ迷う', 1],
        ['周りを確認してから、そっとポケットに入れる', 0],
      ]
    },
    {
      cat: '誠実さ',
      q: '自分が担当した仕事にミスが発覚した。上司はまだ気づいていない。',
      opts: [
        ['すぐに自分から上司に報告して対処を相談する', 3],
        ['まず自力で解決を試みて、ダメなら報告する', 2],
        ['気づかれるまで様子を見る', 1],
        ['他の人のせいにして隠す', 0],
      ]
    },
    {
      cat: '誠実さ',
      q: '友人が秘密を打ち明けてくれた。別の友人も関係する内容だ。',
      opts: [
        ['誰にも絶対に言わない', 3],
        ['「他言無用」と念を押されたから言わない', 2],
        ['直接関係する人には伝えることがある', 1],
        ['面白い話題なのでついシェアしてしまう', 0],
      ]
    },
    // ── 思いやり (Consideration) ─────────────────────────────────
    {
      cat: '思いやり',
      q: '電車で高齢者が立っているのを見かけた。席は空いていない。あなたは座っている。',
      opts: [
        ['何も迷わずすぐに席を譲る', 3],
        ['周りの反応を少し確認してから席を譲る', 2],
        ['高齢者が近づいてきたら譲ろうと思いつつ、座り続ける', 1],
        ['自分も疲れているので座り続ける', 0],
      ]
    },
    {
      cat: '思いやり',
      q: '道端で見知らぬ人が倒れている。どう行動する？',
      opts: [
        ['すぐに駆け寄って声をかけ、救急車を呼ぶ', 3],
        ['119番に通報だけして、様子を見守る', 2],
        ['近くにいる他の人に任せる', 1],
        ['見て見ぬ振りをして通り過ぎる', 0],
      ]
    },
    {
      cat: '思いやり',
      q: '普段、「ありがとう」という感謝の気持ちをどう伝えるか？',
      opts: [
        ['言葉・行動の両方で積極的に伝えている', 3],
        ['言葉には出しにくいが、何らかの形で伝えている', 2],
        ['特別なことがあった時だけ伝える', 1],
        ['感謝を表現するのが苦手で、ほとんど伝えない', 0],
      ]
    },
    // ── 倫理観 (Ethics) ──────────────────────────────────────────
    {
      cat: '倫理観',
      q: 'レストランで注文と違う料理が来た。対応は？',
      opts: [
        ['丁寧にスタッフに伝えて、正しいものと交換してもらう', 3],
        ['まあいいかと思って、そのまま食べる', 2],
        ['少し不満そうにしながらも一応指摘する', 1],
        ['怒った口調で強くクレームを入れる', 0],
      ]
    },
    {
      cat: '倫理観',
      q: 'SNSで知り合いが明らかに誤った情報を拡散している。どうする？',
      opts: [
        ['優しく正しい情報をDMで伝える', 3],
        ['コメント欄で穏やかに、丁寧に訂正する', 2],
        ['見て見ぬ振りをして無視する', 1],
        ['「それ嘘ですよ」と公開で強く指摘する', 0],
      ]
    },
    {
      cat: '倫理観',
      q: '環境問題に対して、日常生活でどのように取り組んでいるか？',
      opts: [
        ['ゴミ分別・節電・節水など積極的に実践している', 3],
        ['できる範囲でエコな行動を心がけている', 2],
        ['特に意識していないが、言われたことはやっている', 1],
        ['自分一人が何をしても変わらないと思っている', 0],
      ]
    },
    // ── 社会性 (Social Intelligence) ────────────────────────────
    {
      cat: '社会性',
      q: '自分への批判を受けた時、どのように反応するか？',
      opts: [
        ['冷静に受け止め、正しい部分は素直に改善しようとする', 3],
        ['最初は傷つくが、後で冷静に振り返って考える', 2],
        ['反論したくなるが何とか我慢する', 1],
        ['全否定されたと感じて激しく落ち込むか怒る', 0],
      ]
    },
    {
      cat: '社会性',
      q: '権威ある上司と全く逆の意見を持っている。どうする？',
      opts: [
        ['礼儀正しく、でも自分の意見を明確に伝える', 3],
        ['状況を見て、適切なタイミングで意見を述べる', 2],
        ['反論しにくい雰囲気なのでうやむやにする', 1],
        ['常に上の人の意見に賛成する', 0],
      ]
    },
    {
      cat: '社会性',
      q: '人生で一番大切にしていることは何か？',
      opts: [
        ['他者への親切と、社会への貢献', 3],
        ['家族・友人との深いつながり', 2],
        ['自分の成長と夢の実現', 1],
        ['自分の快楽と利益の最大化', 0],
      ]
    },
  ];

  const TOTAL_Q = QUESTIONS.length; // 15

  // ── 偏差値・判定テーブル ────────────────────────────────────
  //  mean=22.5, σ=10 → 偏差値 = 50 + (score - 22.5) / 10 * 10
  //  (簡略計算 → 偏差値 = 50 + score - 22.5 = 27.5 + score * 1.0)
  //  実際は非線形補正を入れてメッセージに個性を持たせる
  const RANKS = [
    { min: 42, hensachi: 78, rank: 'S', title: '人間性の鑑',   color: '#ffd700',
      msg: '傑出した共感力・誠実さ・思いやりを持つ、稀有な存在。周囲の人々の心の支えになっているはず。' },
    { min: 36, hensachi: 68, rank: 'A', title: '高い人間性',   color: '#4fc3f7',
      msg: '倫理観と社会性を高水準で兼ね備えている。意識的に行動できており、信頼される人柄だ。' },
    { min: 28, hensachi: 55, rank: 'B', title: '平均以上',     color: '#81c784',
      msg: 'バランスの良い人間性を持っている。もう少しの意識で大きな飛躍が期待できる。' },
    { min: 18, hensachi: 44, rank: 'C', title: '標準的',       color: '#ffb74d',
      msg: '平均的な人間性。自分と他者の関係を少し意識するだけで、偏差値は大きく上がる。' },
    { min:  8, hensachi: 33, rank: 'D', title: '要意識改革',   color: '#ff7043',
      msg: '他者への関心が薄い傾向がある。小さな親切の積み重ねが、人間性を磨く第一歩。' },
    { min:  0, hensachi: 22, rank: 'E', title: '人間性発展途上',color: '#ef5350',
      msg: '今の自分を振り返るチャンス。他者の気持ちを想像することから始めてみよう。' },
  ];

  // ── カテゴリ色 ─────────────────────────────────────────────
  const CAT_COLORS = {
    '共感力':  '#7b68ee',
    '誠実さ':  '#4fc3f7',
    '思いやり':'#81c784',
    '倫理観':  '#ffb74d',
    '社会性':  '#f06292',
  };

  // ── DOM ────────────────────────────────────────────────────
  let elSection, elProgress, elProgressBar, elProgressLabel;
  let elQNum, elQCat, elQText, elOptions;
  let elResult;

  // ── 状態 ───────────────────────────────────────────────────
  let current = 0;
  let scores  = [];   // 各問の得点
  let catScores = {}; // カテゴリ別合計

  // ── 初期化 ─────────────────────────────────────────────────
  function init() {
    elSection       = document.getElementById('humanity-quiz');
    elProgress      = document.getElementById('hq-progress');
    elProgressBar   = document.getElementById('hq-progress-bar');
    elProgressLabel = document.getElementById('hq-progress-label');
    elQNum          = document.getElementById('hq-q-num');
    elQCat          = document.getElementById('hq-q-cat');
    elQText         = document.getElementById('hq-q-text');
    elOptions       = document.getElementById('hq-options');
    elResult        = document.getElementById('hq-result');

    if (!elSection) return;

    document.getElementById('hq-start-btn').addEventListener('click', startQuiz);
    document.getElementById('hq-retry-btn').addEventListener('click', retryQuiz);
    document.getElementById('hq-share-btn').addEventListener('click', shareResult);
  }

  function startQuiz() {
    current = 0;
    scores  = [];
    catScores = {};
    document.getElementById('hq-intro').classList.add('hidden');
    document.getElementById('hq-quiz-area').classList.remove('hidden');
    elResult.classList.add('hidden');
    showQuestion();
  }

  function retryQuiz() {
    elResult.classList.add('hidden');
    document.getElementById('hq-quiz-area').classList.remove('hidden');
    startQuiz();
  }

  function showQuestion() {
    const q = QUESTIONS[current];
    // Progress
    const pct = (current / TOTAL_Q) * 100;
    elProgressBar.style.width = pct + '%';
    elProgressLabel.textContent = (current + 1) + ' / ' + TOTAL_Q;
    // Q meta
    elQNum.textContent  = 'Q' + (current + 1);
    elQCat.textContent  = q.cat;
    elQCat.style.background = CAT_COLORS[q.cat] || '#666';
    elQText.textContent = q.q;
    // Options
    elOptions.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D'];
    q.opts.forEach(function (opt, i) {
      const btn = document.createElement('button');
      btn.className = 'hq-opt-btn';
      btn.innerHTML = '<span class="hq-opt-label">' + labels[i] + '</span>' +
                      '<span class="hq-opt-text">'  + opt[0]    + '</span>';
      btn.addEventListener('click', function () { selectOption(opt[1], btn); });
      elOptions.appendChild(btn);
    });
    // Animate in
    elQText.classList.remove('hq-fade-in');
    elOptions.classList.remove('hq-fade-in');
    void elQText.offsetWidth;
    elQText.classList.add('hq-fade-in');
    elOptions.classList.add('hq-fade-in');
  }

  function selectOption(score, btn) {
    // Disable all options
    Array.from(elOptions.querySelectorAll('.hq-opt-btn')).forEach(function (b) {
      b.disabled = true;
      b.classList.add('hq-opt-disabled');
    });
    btn.classList.add('hq-opt-selected');
    scores.push(score);

    // Brief highlight then advance
    setTimeout(function () {
      current++;
      if (current < TOTAL_Q) {
        showQuestion();
      } else {
        showResult();
      }
    }, 320);
  }

  function showResult() {
    document.getElementById('hq-quiz-area').classList.add('hidden');
    elResult.classList.remove('hidden');

    // Total score
    const total = scores.reduce(function (a, b) { return a + b; }, 0);

    // Category scores
    const catMax = {};
    QUESTIONS.forEach(function (q, i) {
      catScores[q.cat] = (catScores[q.cat] || 0) + scores[i];
      catMax[q.cat]    = (catMax[q.cat]    || 0) + 3;
    });

    // Determine rank
    const rank = RANKS.find(function (r) { return total >= r.min; }) || RANKS[RANKS.length - 1];

    // Hensachi display
    document.getElementById('hq-hensachi-val').textContent = rank.hensachi;
    document.getElementById('hq-hensachi-val').style.color  = rank.color;
    document.getElementById('hq-rank-badge').textContent    = rank.rank;
    document.getElementById('hq-rank-badge').style.borderColor = rank.color;
    document.getElementById('hq-rank-badge').style.color       = rank.color;
    document.getElementById('hq-rank-title').textContent   = rank.title;
    document.getElementById('hq-rank-title').style.color   = rank.color;
    document.getElementById('hq-rank-msg').textContent     = rank.msg;
    document.getElementById('hq-total-score').textContent  = total + ' / ' + (TOTAL_Q * 3);

    // Category bars
    const barsEl = document.getElementById('hq-cat-bars');
    barsEl.innerHTML = '';
    Object.keys(catScores).forEach(function (cat) {
      const pct = Math.round((catScores[cat] / catMax[cat]) * 100);
      const col = CAT_COLORS[cat] || '#aaa';
      const row = document.createElement('div');
      row.className = 'hq-cat-row';
      row.innerHTML =
        '<span class="hq-cat-name">' + cat + '</span>' +
        '<div class="hq-cat-track"><div class="hq-cat-fill" style="width:0%;background:' + col + '"></div></div>' +
        '<span class="hq-cat-pct">' + pct + '%</span>';
      barsEl.appendChild(row);
      // Animate bar fill
      setTimeout(function () {
        row.querySelector('.hq-cat-fill').style.width = pct + '%';
      }, 50);
    });

    // Progress to 100%
    elProgressBar.style.width = '100%';
    elProgressLabel.textContent = TOTAL_Q + ' / ' + TOTAL_Q;
  }

  function shareResult() {
    const hensachi = document.getElementById('hq-hensachi-val').textContent;
    const title    = document.getElementById('hq-rank-title').textContent;
    const text = '🧠 人間性偏差値テスト結果\n偏差値 ' + hensachi + '「' + title + '」\n#VimArcade #人間性偏差値 #VimMan\nhttps://yu-philia-ctrl.github.io/vimman-game/';
    if (navigator.share) {
      navigator.share({ text: text }).catch(function () {});
    } else {
      // Fallback: open X/Twitter
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
    }
  }

  // ── 起動 ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
