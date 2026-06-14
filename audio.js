/*
╔══════════════════════════════════════════════════════════════════╗
║  audio.js — Cinematic Audio System                               ║
║                                                                  ║
║  Features:                                                       ║
║  - Background music (music.mp3) with fade-in/out                 ║
║  - Sound effects: click, hover, whoosh, chime                    ║
║  - Web Audio API synthesized SFX (no files needed!)              ║
║  - Music visualizer bar (subtle, below canvas)                   ║
║  - Beat sync option via analyser node                            ║
║  - Persistent toggle (survives scene changes)                    ║
╚══════════════════════════════════════════════════════════════════╝
*/

var AudioSystem = (function () {

  /* ── Web Audio context (lazy init on first user gesture) ── */
  var ctx      = null;
  var gainMstr = null;   // master gain
  var gainBg   = null;   // background music gain
  var gainSfx  = null;   // SFX gain
  var analyser = null;

  var bgSource  = null;
  var bgBuffer  = null;
  var bgStarted = false;
  var muted     = false;

  /* ── Synthesised SFX library (no audio files required) ──── */
  function createCtx() {
    if (ctx) return;
    ctx      = new (window.AudioContext || window.webkitAudioContext)();
    gainMstr = ctx.createGain();
    gainBg   = ctx.createGain();
    gainSfx  = ctx.createGain();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    gainBg.gain.value  = 0.25;
    gainSfx.gain.value = 0.6;
    gainMstr.gain.value = 1.0;

    gainBg.connect(gainMstr);
    gainSfx.connect(gainMstr);
    gainMstr.connect(analyser);
    analyser.connect(ctx.destination);
  }

  /* ── SFX: Click (short percussive tick) ─────────────────── */
  function playClick() {
    if (!ctx) return;
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(gainSfx);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /* ── SFX: Hover (soft high shimmer) ─────────────────────── */
  function playHover() {
    if (!ctx) return;
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(gainSfx);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /* ── SFX: Whoosh (scene transition) ─────────────────────── */
  function playWhoosh() {
    if (!ctx) return;
    var bufLen = ctx.sampleRate * 0.4;
    var buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data   = buffer.getChannelData(0);
    for (var i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    }
    var src    = ctx.createBufferSource();
    src.buffer = buffer;
    var filt   = ctx.createBiquadFilter();
    filt.type  = 'bandpass';
    filt.frequency.setValueAtTime(800, ctx.currentTime);
    filt.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.4);
    filt.Q.value = 2;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
    src.connect(filt); filt.connect(gain); gain.connect(gainSfx);
    src.start(ctx.currentTime);
  }

  /* ── SFX: Chime (birthday! ding-dong chord) ─────────────── */
  function playChime() {
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach(function (freq, i) {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(gainSfx);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 1.2);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime  + i * 0.08 + 1.4);
    });
  }

  /* ── SFX: Heartbeat (love scene) ─────────────────────────── */
  function playHeartbeat() {
    if (!ctx) return;
    function beat(offset) {
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(gainSfx);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + offset + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime  + offset + 0.22);
    }
    beat(0); beat(0.18); // lub-dub
  }

  /* ── Background Music ────────────────────────────────────── */
  function loadBgMusic(url) {
    if (!ctx || !url) return;
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(data => ctx.decodeAudioData(data))
      .then(buffer => {
        bgBuffer = buffer;
        if (bgStarted && !muted) startBgMusic();
      })
      .catch(() => {
        console.info('[audio.js] music.mp3 not found — using synthesised ambience');
        startSynthAmbience();
      });
  }

  function startBgMusic() {
    if (!bgBuffer || !ctx) return;
    if (bgSource) { try { bgSource.stop(); } catch(e){} }
    bgSource = ctx.createBufferSource();
    bgSource.buffer = bgBuffer;
    bgSource.loop   = true;
    bgSource.connect(gainBg);

    gainBg.gain.setValueAtTime(0, ctx.currentTime);
    gainBg.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 3);
    bgSource.start(ctx.currentTime);
  }

  /* ── Synthesised Ambience (fallback when no music.mp3) ──── */
  function startSynthAmbience() {
    if (!ctx) return;

    // Ambient pad: slowly evolving chord
    var chordFreqs = [110, 138.6, 165, 220];
    chordFreqs.forEach(function (freq) {
      var osc   = ctx.createOscillator();
      var lfo   = ctx.createOscillator();
      var lfoGain = ctx.createGain();
      var gain  = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      lfo.type = 'sine';
      lfo.frequency.value = 0.15 + Math.random() * 0.1;
      lfoGain.gain.value  = freq * 0.01;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.value = 0.045;
      osc.connect(gain); gain.connect(gainBg);
      osc.start(); lfo.start();
    });

    // Subtle noise shimmer
    var noiseLen = ctx.sampleRate * 2;
    var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;

    var noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuf;
    noiseNode.loop   = true;
    var nFilt = ctx.createBiquadFilter();
    nFilt.type = 'bandpass';
    nFilt.frequency.value = 600;
    nFilt.Q.value = 0.5;
    var nGain = ctx.createGain();
    nGain.gain.value = 0.012;
    noiseNode.connect(nFilt); nFilt.connect(nGain); nGain.connect(gainBg);

    gainBg.gain.setValueAtTime(0, ctx.currentTime);
    gainBg.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);
    noiseNode.start();
  }

  /* ── Music Visualiser ───────────────────────────────────── */
  function initVisualiser() {
    if (!analyser) return;

    var bar = document.createElement('canvas');
    bar.id  = 'audio-visualiser';
    bar.style.cssText = `
      position: fixed;
      bottom: 0; left: 0;
      width: 100%; height: 3px;
      z-index: 999;
      pointer-events: none;
      opacity: 0.6;
    `;
    document.body.appendChild(bar);

    var bCtx = bar.getContext('2d');
    var dataArr = new Uint8Array(analyser.frequencyBinCount);

    function drawVis() {
      requestAnimationFrame(drawVis);
      if (muted) return;

      bar.width = window.innerWidth;
      analyser.getByteFrequencyData(dataArr);

      var barW = bar.width / dataArr.length * 2.5;
      var x = 0;
      bCtx.clearRect(0, 0, bar.width, bar.height);

      for (var i = 0; i < dataArr.length; i++) {
        var h = (dataArr[i] / 255) * bar.height;
        var r = 255, g = 45 + dataArr[i] * 0.3, b = 155;
        bCtx.fillStyle = `rgba(${r},${g},${b},0.9)`;
        bCtx.fillRect(x, bar.height - h, barW - 1, h);
        x += barW;
      }
    }
    drawVis();
  }

  /* ── Mute / Unmute toggle ───────────────────────────────── */
  function initToggle() {
    var btn = document.createElement('button');
    btn.id  = 'audio-toggle';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path id="audio-icon-path" d="M11 5L6 9H2v6h4l5 4V5z"/>
        <path id="audio-wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path id="audio-wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      </svg>
    `;
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      muted = !muted;
      _melodyMuted = muted; // FIX AUDIO: sync melody mute state
      if (muted) {
        gainMstr.gain.linearRampToValueAtTime(0, ctx ? ctx.currentTime + 0.5 : 0);
        if (_melodyGain) _melodyGain.gain.linearRampToValueAtTime(0, ctx ? ctx.currentTime + 0.5 : 0);
        btn.classList.add('muted');
      } else {
        gainMstr.gain.linearRampToValueAtTime(1, ctx ? ctx.currentTime + 0.5 : 0);
        if (_melodyGain) _melodyGain.gain.linearRampToValueAtTime(0.16, ctx ? ctx.currentTime + 0.5 : 0);
        // Resume melody loop jika sudah berhenti
        if (ctx && _melodyActive) _loopMelody(ctx, _melodyGain, ctx.currentTime + 0.1);
        btn.classList.remove('muted');
      }
    });
  }

  /* ── Wire up SFX to existing elements ──────────────────── */
  function wireSFX() {
    // Click SFX on all buttons
    document.addEventListener('click', function (e) {
      if (!ctx) return;
      if (e.target.closest('button')) playClick();
    }, true);

    // Hover SFX on nav/dot buttons
    document.addEventListener('mouseover', function (e) {
      if (!ctx) return;
      var el = e.target.closest('.nav, .dot, .ghost-btn');
      if (el) playHover();
    }, true);

    // Scene-specific sounds
    var _origFade = window.fadeToScene;
    window.fadeToScene = async function (targetId, dur) {
      playWhoosh();
      return _origFade(targetId, dur);
    };

    // Chime on HBD scene
    var _origBuild = window.buildHBD;
    window.buildHBD = function () {
      _origBuild();
      setTimeout(playChime, 400);
    };

    // Heartbeat on love scene
    var _origLove = window.openLoveScene;
    window.openLoveScene = async function () {
      playHeartbeat();
      setTimeout(playHeartbeat, 900);
      return _origLove();
    };
  }

  /* ── FIX AUDIO: Synthesised Happy Birthday Melody ──────── */
  var _melodyGain   = null;
  var _melodyActive = false;
  var _melodyMuted  = false;

  // Happy Birthday melody: [note_hz, beats]  BPM=96 → 1 beat = 0.625s
  var _BPM  = 96;
  var _BEAT = 60 / _BPM;
  var _MELODY = [
    [392.00,0.75],[392.00,0.25],[440.00,1],[392.00,1],[523.25,1],[493.88,2],
    [392.00,0.75],[392.00,0.25],[440.00,1],[392.00,1],[587.33,1],[523.25,2],
    [392.00,0.75],[392.00,0.25],[783.99,1],[659.25,1],[523.25,1],[493.88,1],[440.00,2],
    [698.46,0.75],[698.46,0.25],[659.25,1],[523.25,1],[587.33,1],[523.25,2],
    [0,1.5] // REST sebelum loop
  ];

  function _playMelodyNote(audioCtx, masterGain, freq, startTime, dur) {
    if (!freq) return;
    var osc  = audioCtx.createOscillator();
    var env  = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    // Vibrato ringan
    var lfo = audioCtx.createOscillator();
    var lfoG = audioCtx.createGain();
    lfo.frequency.value = 5.5;
    lfoG.gain.value = freq * 0.004;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    lfo.start(startTime); lfo.stop(startTime + dur);

    // Envelope: attack 30ms, release 80ms
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(0.20, startTime + 0.03);
    env.gain.setValueAtTime(0.20, startTime + dur - 0.08);
    env.gain.linearRampToValueAtTime(0, startTime + dur);

    osc.connect(env); env.connect(masterGain);
    osc.start(startTime); osc.stop(startTime + dur + 0.01);
  }

  function _scheduleMelody(audioCtx, masterGain, startTime) {
    var t = startTime, total = 0;
    _MELODY.forEach(function(step) {
      var dur = step[1] * _BEAT;
      _playMelodyNote(audioCtx, masterGain, step[0], t, dur * 0.90);
      t += dur; total += dur;
    });
    return total;
  }

  function _loopMelody(audioCtx, masterGain, startTime) {
    if (_melodyMuted) return;
    var dur = _scheduleMelody(audioCtx, masterGain, startTime);
    var delay = ((startTime + dur) - audioCtx.currentTime - 0.15) * 1000;
    setTimeout(function() {
      _loopMelody(audioCtx, masterGain, startTime + dur);
    }, Math.max(0, delay));
  }

  function startHBDMelody() {
    if (_melodyActive || !ctx) return;
    _melodyActive = true;
    _melodyGain = ctx.createGain();
    _melodyGain.gain.setValueAtTime(0, ctx.currentTime);
    _melodyGain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3); // fade-in 3 detik
    _melodyGain.connect(gainMstr);
    _loopMelody(ctx, _melodyGain, ctx.currentTime + 0.2);
  }

  /* ── Public init ─────────────────────────────────────────── */
  function init() {
    initToggle();

    // Activate on first user gesture
    var activated = false;
    function activate() {
      if (activated) return;
      activated = true;
      createCtx();
      bgStarted = true;
      loadBgMusic('assets/music.mp3');
      initVisualiser();
      wireSFX();
      // FIX AUDIO: mulai HBD melody sebagai background music
      setTimeout(startHBDMelody, 500);
      document.removeEventListener('click',     activate);
      document.removeEventListener('touchstart', activate);
      document.removeEventListener('keydown',    activate);
    }

    document.addEventListener('click',     activate);
    document.addEventListener('touchstart', activate);
    document.addEventListener('keydown',    activate);
  }

  return { init: init };

})();

document.addEventListener('DOMContentLoaded', function () {
  AudioSystem.init();
});
