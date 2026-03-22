// ── AUDIO.JS ── Web Audio API chiptune sound system ──────────────

window.GameAudio = (function() {
  let ac = null;
  let masterGain = null;
  let bgmTimer = null;
  let currentBgm = null;
  let bgmStep = 0;
  let sfxEnabled = true;
  let bgmEnabled = true;
  let volume = 0.35;

  // ── Init ────────────────────────────────────────────────────────
  function init() {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ac.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ac.destination);
    } catch(e) {
      console.warn('[GameAudio] Web Audio API not available:', e);
    }
  }

  function resume() {
    if (ac && ac.state === 'suspended') ac.resume().catch(function(){});
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain) masterGain.gain.value = volume;
  }

  // ── Low-level tone ───────────────────────────────────────────────
  function playNote(freq, type, dur, vol, delay) {
    if (!ac || !masterGain || !sfxEnabled) return;
    resume();
    const t = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // ── Noise burst ──────────────────────────────────────────────────
  function playNoise(dur, vol, delay) {
    if (!ac || !masterGain) return;
    resume();
    const t = ac.currentTime + (delay || 0);
    const bufLen = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(vol || 0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(gain);
    gain.connect(masterGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // ── SFX library ──────────────────────────────────────────────────
  function sfx(name) {
    if (!ac) return;
    resume();
    switch(name) {
      // Movement
      case 'step':
        playNote(180, 'square', 0.05, 0.04);
        break;
      case 'step_grass':
        playNoise(0.06, 0.04);
        playNote(220, 'square', 0.04, 0.02);
        break;

      // Encounter
      case 'encounter':
        playNote(440, 'square', 0.08, 0.25, 0.00);
        playNote(550, 'square', 0.08, 0.25, 0.10);
        playNote(660, 'square', 0.08, 0.25, 0.20);
        playNote(880, 'square', 0.20, 0.30, 0.30);
        break;

      // Battle
      case 'attack_punch':
        playNote(330, 'sawtooth', 0.07, 0.18);
        playNote(220, 'sawtooth', 0.07, 0.18, 0.06);
        playNoise(0.08, 0.08, 0.02);
        break;
      case 'attack_fire':
        playNote(440, 'sawtooth', 0.15, 0.20);
        playNote(660, 'square',   0.10, 0.15, 0.05);
        playNoise(0.15, 0.10, 0);
        break;
      case 'attack_beam':
        for (let i = 0; i < 8; i++) {
          playNote(880 - i * 60, 'square', 0.06, 0.10, i * 0.04);
        }
        break;
      case 'attack_multi':
        [220, 330, 440].forEach(function(f, i) {
          playNote(f, 'square', 0.06, 0.15, i * 0.06);
          playNoise(0.05, 0.06, i * 0.06);
        });
        break;
      case 'attack_random':
        const rf = 100 + Math.random() * 800;
        playNote(rf, 'sawtooth', 0.20, 0.25);
        playNoise(0.12, 0.12);
        break;
      case 'attack_ultimate':
        for (let i = 0; i < 12; i++) {
          playNote(110 + i * 80, 'sawtooth', 0.25, 0.20, i * 0.05);
        }
        playNoise(0.60, 0.25);
        break;
      case 'attack_debuff':
        playNote(330, 'sine', 0.15, 0.12);
        playNote(220, 'sine', 0.15, 0.12, 0.08);
        playNote(165, 'sine', 0.15, 0.10, 0.16);
        break;
      case 'heal':
        [523, 659, 784, 1047].forEach(function(f, i) {
          playNote(f, 'sine', 0.20, 0.14, i * 0.07);
        });
        break;
      case 'shield':
        playNote(880, 'square', 0.05, 0.10, 0.00);
        playNote(1100,'square', 0.05, 0.10, 0.06);
        playNote(1320,'square', 0.10, 0.12, 0.12);
        break;

      // Damage
      case 'hurt_player':
        playNote(110, 'square', 0.18, 0.22);
        playNoise(0.10, 0.15, 0.02);
        break;
      case 'hurt_enemy':
        playNote(440, 'sawtooth', 0.08, 0.18);
        playNoise(0.08, 0.08, 0.01);
        break;
      case 'miss':
        playNote(220, 'square', 0.10, 0.08);
        break;

      // Status
      case 'status_poison':
        playNote(220, 'sine', 0.10, 0.10, 0.00);
        playNote(196, 'sine', 0.10, 0.10, 0.12);
        playNote(165, 'sine', 0.15, 0.08, 0.24);
        break;
      case 'status_confuse':
        [440, 550, 490, 415, 440].forEach(function(f, i) {
          playNote(f, 'square', 0.08, 0.10, i * 0.05);
        });
        break;
      case 'status_buff':
        [523, 659, 784].forEach(function(f, i) {
          playNote(f, 'square', 0.08, 0.12, i * 0.06);
        });
        break;

      // UI
      case 'select':
        playNote(440, 'square', 0.06, 0.10);
        break;
      case 'confirm':
        playNote(660, 'square', 0.06, 0.12);
        playNote(880, 'square', 0.08, 0.10, 0.06);
        break;
      case 'cancel':
        playNote(330, 'square', 0.08, 0.10);
        playNote(220, 'square', 0.10, 0.08, 0.07);
        break;
      case 'open_menu':
        playNote(880, 'square', 0.05, 0.08);
        break;
      case 'level_up':
        [523, 659, 784, 659, 784, 1047].forEach(function(f, i) {
          playNote(f, 'square', 0.12, 0.20, i * 0.07);
        });
        break;
      case 'victory':
        [523, 659, 784, 1047, 784, 1047, 1319].forEach(function(f, i) {
          playNote(f, 'square', 0.14, 0.22, i * 0.08);
        });
        break;
      case 'defeat':
        [330, 262, 220, 196, 165].forEach(function(f, i) {
          playNote(f, 'square', 0.25, 0.18, i * 0.15);
        });
        break;
      case 'save':
        [523, 784, 1047].forEach(function(f, i) {
          playNote(f, 'sine', 0.15, 0.15, i * 0.10);
        });
        break;
      case 'area_clear':
        [523, 659, 784, 1047, 784, 659, 523, 659, 784, 1047].forEach(function(f, i) {
          playNote(f, 'square', 0.14, 0.22, i * 0.09);
        });
        break;
      case 'warp':
        for (let i = 0; i < 12; i++) {
          playNote(220 + i * 55, 'sine', 0.10, 0.10, i * 0.04);
        }
        break;
    }
  }

  // ── BGM Patterns (chiptune, 16-step sequencer) ──────────────────
  // Each note: [freq, duration_multiplier]  0 = rest
  const BGM = {
    // ── オーバーワールド: 疾走感のある冒険BGM ──
    overworld: {
      tempo: 175,
      melody: [
        [659,1],[784,1],[880,1],[784,1],[659,1],[0,0.5],[659,0.5],[784,2],
        [523,1],[659,1],[784,1],[659,1],[523,1],[0,0.5],[523,0.5],[659,2],
        [880,1],[988,1],[1047,1],[988,1],[880,1],[784,1],[698,1],[659,2],
        [523,1],[659,1],[784,1],[698,1],[659,1],[0,1],[784,3],[0,1],
      ],
      bass: [
        [131,2],[0,1],[165,1],[131,2],[0,2],
        [110,2],[0,1],[131,1],[110,2],[0,2],
        [165,2],[0,1],[196,1],[165,2],[0,2],
        [131,2],[0,1],[147,1],[131,4],[0,1],
      ],
    },
    // ── バトル: アグレッシブなドライブ感 ──
    battle: {
      tempo: 230,
      melody: [
        [440,1],[0,0.5],[440,0.5],[494,1],[523,1],[494,1],[440,1],[392,1],
        [440,1],[0,0.5],[392,0.5],[440,1],[0,1],[349,1],[0,1],[392,1],
        [523,1],[587,1],[659,1],[587,1],[523,1],[494,1],[440,2],
        [392,1],[440,1],[494,1],[0,0.5],[440,1],[392,1],[330,2],[0,2],
      ],
      bass: [
        [110,1],[0,0.5],[110,0.5],[123,1],[0,1],[110,1],[98,1],
        [110,1],[0,0.5],[98,0.5],[110,1],[0,1],[87,1],[0,1],[98,1],
        [131,1],[0,1],[123,1],[0,1],[110,2],
        [98,1],[110,1],[123,1],[0,1],[110,1],[98,1],[82,3],
      ],
    },
    // ── ボス: 重厚でダークなメタル風 ──
    boss: {
      tempo: 210,
      melody: [
        [220,1],[0,0.5],[220,0.5],[262,1],[220,1],[196,1],[175,1],[196,1],
        [220,1],[196,1],[175,1],[0,1],[196,1],[0,1],[220,2],
        [294,1],[262,1],[294,1],[330,1],[294,1],[0,1],[262,1],[0,1],
        [220,1],[0,0.5],[262,0.5],[220,1],[196,1],[175,1],[165,3],[0,2],
      ],
      bass: [
        [55,1],[0,0.5],[55,0.5],[65,1],[55,1],[49,1],[44,1],[49,1],
        [55,1],[49,1],[44,1],[0,1],[49,1],[0,1],[55,2],
        [73,1],[65,1],[73,1],[82,1],[73,1],[0,1],[65,1],[0,1],
        [55,1],[0,0.5],[65,0.5],[55,1],[49,1],[44,1],[41,3],[0,2],
      ],
    },
    victory_jingle: {
      tempo: 200,
      melody: [
        [523,1],[659,1],[784,1],[1047,2],[784,1],[1047,1],[1319,3],[0,1],
        [1047,1],[1175,1],[1319,1],[1047,2],[1319,4],
      ],
      bass: [
        [131,2],[165,2],[196,2],[262,2],
        [196,2],[262,4],
      ],
    },
    town: {
      tempo: 150,
      melody: [
        [659,1],[784,1],[880,1],[784,1],[659,2],[523,1],[659,1],
        [784,1],[880,1],[988,1],[880,1],[784,2],[659,2],
        [523,1],[659,1],[784,1],[880,1],[784,1],[698,1],[659,2],
        [523,1],[587,1],[659,1],[523,1],[587,2],[523,4],
      ],
      bass: [
        [165,2],[0,2],[196,2],[0,2],
        [196,2],[0,2],[220,2],[0,2],
        [165,2],[0,2],[196,2],[0,2],
        [131,2],[0,2],[165,4],
      ],
    },
    title: {
      tempo: 150,
      melody: [
        [523,1],[659,1],[784,1],[880,1],[784,1],[659,1],[523,2],
        [659,1],[784,1],[880,1],[988,1],[880,1],[784,1],[659,2],
        [784,1],[880,1],[988,1],[1047,2],[880,1],[784,1],[659,2],
        [523,1],[659,1],[784,1],[659,1],[523,1],[440,1],[523,4],
      ],
      bass: [
        [131,2],[0,2],[165,2],[0,2],
        [165,2],[0,2],[196,2],[0,2],
        [196,2],[0,2],[220,2],[0,2],
        [131,2],[0,2],[131,4],
      ],
    },
    // ── HOME: シンセウェーブ×チップチューン ── イカした疾走感 ──
    home: {
      tempo: 168,
      melody: [
        // フック A: 上昇ライン
        [587,1],[523,1],[466,1],[440,1],[392,1],[440,1],[523,2],
        [466,1],[440,1],[392,1],[349,1],[392,2],[330,2],
        // フック B: より高く
        [659,1],[587,1],[523,1],[466,1],[440,1],[466,1],[587,2],
        [523,1],[466,1],[440,1],[392,1],[440,4],
        // ブリッジ: 高域
        [880,1],[784,1],[698,1],[659,1],[587,1],[659,1],[784,2],
        [698,1],[659,1],[587,1],[523,1],[587,2],[466,2],
        // 解決
        [587,1],[523,1],[466,1],[440,1],[392,1],[349,1],[392,2],
        [440,1],[466,1],[523,1],[466,1],[587,4],[0,2],
      ],
      bass: [
        [147,2],[0,1],[147,1],[220,2],[0,2],
        [131,2],[0,1],[131,1],[196,2],[0,2],
        [147,2],[0,1],[147,1],[220,2],[0,2],
        [110,2],[0,1],[110,1],[165,4],
        [175,2],[0,1],[175,1],[262,2],[0,2],
        [165,2],[0,1],[165,1],[247,2],[0,2],
        [147,2],[0,1],[147,1],[220,2],[0,2],
        [110,2],[0,1],[123,1],[147,4],
      ],
    },
  };

  let bgmData = null;
  let melodyIdx = 0;
  let bassIdx = 0;
  let melodyTimer = null;
  let bassTimer = null;

  function playBGM(name) {
    if (!ac || !bgmEnabled) return;
    if (currentBgm === name) return;
    resume(); // ensure AudioContext is running before scheduling notes
    stopBGM();
    const pat = BGM[name];
    if (!pat) return;
    currentBgm = name;
    bgmData = pat;
    melodyIdx = 0;
    bassIdx = 0;
    tickMelody();
    if (pat.bass.length > 0) tickBass();
  }

  function tickMelody() {
    if (!bgmData) return;
    const notes = bgmData.melody;
    if (!notes || notes.length === 0) return;
    const note = notes[melodyIdx % notes.length];
    const msPerBeat = 60000 / bgmData.tempo;
    if (note[0] > 0) playNote(note[0], 'square', (msPerBeat * note[1] * 0.85) / 1000, 0.10);
    melodyIdx++;
    melodyTimer = setTimeout(tickMelody, msPerBeat * note[1]);
  }

  function tickBass() {
    if (!bgmData) return;
    const notes = bgmData.bass;
    if (!notes || notes.length === 0) return;
    const note = notes[bassIdx % notes.length];
    const msPerBeat = 60000 / bgmData.tempo;
    if (note[0] > 0) playNote(note[0], 'triangle', (msPerBeat * note[1] * 0.7) / 1000, 0.07);
    bassIdx++;
    bassTimer = setTimeout(tickBass, msPerBeat * note[1]);
  }

  function stopBGM() {
    if (melodyTimer) clearTimeout(melodyTimer);
    if (bassTimer) clearTimeout(bassTimer);
    melodyTimer = null;
    bassTimer = null;
    bgmData = null;
    currentBgm = null;
  }

  function toggleSFX() { sfxEnabled = !sfxEnabled; return sfxEnabled; }
  function toggleBGM() {
    bgmEnabled = !bgmEnabled;
    if (!bgmEnabled) stopBGM();
    return bgmEnabled;
  }
  function isBGMOn() { return bgmEnabled; }
  function isSFXOn() { return sfxEnabled; }

  return {
    init: init,
    resume: resume,
    sfx: sfx,
    playBGM: playBGM,
    stopBGM: stopBGM,
    setVolume: setVolume,
    toggleSFX: toggleSFX,
    toggleBGM: toggleBGM,
    isBGMOn: isBGMOn,
    isSFXOn: isSFXOn,
  };
})();
