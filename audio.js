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
    overworld: {
      tempo: 160,
      melody: [
        [659,1],[0,0.5],[784,1],[0,0.5],[880,1],[784,1],[659,1],[0,1],
        [523,1],[0,0.5],[659,1],[0,0.5],[784,1],[659,1],[523,1],[0,1],
      ],
      bass: [
        [131,2],[0,2],[165,2],[0,2],[131,2],[0,2],[110,2],[0,2],
      ],
    },
    battle: {
      tempo: 200,
      melody: [
        [330,1],[0,0.5],[330,1],[494,1],[0,0.5],[440,1],[0,1],[330,1],
        [294,1],[0,0.5],[330,1],[0,1],[262,1],[0,3],
      ],
      bass: [
        [82,1],[0,0.5],[82,1],[110,1],[0,0.5],[98,1],[0,1],[82,1],
      ],
    },
    boss: {
      tempo: 220,
      melody: [
        [220,1],[0,0.5],[262,1],[220,1],[0,0.5],[196,1],[0,1],[220,1],
        [176,1],[196,1],[220,1],[0,1],[176,1],[0,1],[165,2],[0,1],
      ],
      bass: [
        [55,2],[0,2],[55,2],[0,2],[49,2],[0,2],[55,2],[0,2],
      ],
    },
    victory_jingle: {
      tempo: 180,
      melody: [
        [523,1],[659,1],[784,1],[1047,2],[784,1],[1047,1],[1319,4],
      ],
      bass: [],
    },
    town: {
      tempo: 140,
      melody: [
        [659,1],[784,1],[880,1],[784,1],[659,2],[0,2],
        [784,1],[880,1],[988,1],[880,1],[784,2],[0,2],
      ],
      bass: [
        [165,2],[0,2],[196,2],[0,2],[165,2],[0,2],[131,2],[0,2],
      ],
    },
    title: {
      tempo: 130,
      melody: [
        [523,1],[659,1],[784,1],[523,1],[659,1],[784,1],[1047,2],[0,2],
        [784,1],[659,1],[523,1],[440,1],[523,2],[0,2],
      ],
      bass: [
        [131,2],[0,2],[165,2],[0,2],[131,2],[0,2],[110,2],[0,2],
      ],
    },
    // ── Mysterious home screen BGM (Phrygian mode, ambient, spacious) ──
    home: {
      tempo: 58,
      melody: [
        [440,3],[0,2],[466,2],[0,3],[440,2],[0,4],
        [392,3],[0,2],[349,2],[0,3],[330,4],[0,3],
        [440,2],[0,3],[523,2],[0,2],[466,3],[0,4],
        [392,2],[0,3],[415,2],[0,2],[440,6],[0,4],
        [311,2],[0,3],[330,3],[0,3],[349,2],[0,4],
        [330,3],[0,2],[311,2],[0,3],[294,5],[0,3],
      ],
      bass: [
        [110,6],[0,4],[116,5],[0,5],
        [110,5],[0,3],[98,6],[0,4],
        [104,6],[0,4],[110,8],[0,4],
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
