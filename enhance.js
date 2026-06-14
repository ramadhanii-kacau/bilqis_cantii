/*
╔══════════════════════════════════════════════════════════════════╗
║  enhance.js — Cinematic Upgrade Orchestrator (FIXED v2)          ║
║                                                                  ║
║  BUG FIXES:                                                      ║
║  1. lux-ring: explicitly set pointer-events:none in JS too       ║
║  2. play-btn: explicit z-index + pointer-events + debug log      ║
║  3. cursor: removed mix-blend-mode (compositing conflict fix)    ║
║  4. All decorative DOM elements: pointer-events:none enforced    ║
║  5. fadeToScene patch: guard against double-wrapping             ║
╚══════════════════════════════════════════════════════════════════╝
*/

/* ═══════════════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════════════ */
function initCursor() {
  const cursor    = document.createElement('div');
  const cursorDot = document.createElement('div');
  cursor.id    = 'lux-cursor';
  cursorDot.id = 'lux-cursor-dot';

  // FIX: explicit pointer-events:none in JS (belt-and-suspenders with CSS)
  cursor.style.pointerEvents    = 'none';
  cursorDot.style.pointerEvents = 'none';

  // FIX: removed mix-blend-mode:difference — it creates a new stacking context
  // that can interfere with hit-testing order in Blink/WebKit
  // The cursor remains visually premium without it.
  cursor.style.mixBlendMode = 'normal';

  document.body.appendChild(cursor);
  document.body.appendChild(cursorDot);

  let mx = -200, my = -200;
  let cx = -200, cy = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursorDot.style.transform = `translate(${mx}px,${my}px)`;
  });

  function animateCursor() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    cursor.style.transform = `translate(${cx}px,${cy}px)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover state on interactive elements
  const hoverEls = () => document.querySelectorAll('button, a, .dot, .nav, .slide img');
  document.addEventListener('mouseover', e => {
    if ([...hoverEls()].some(el => el.contains(e.target) || el === e.target)) {
      cursor.classList.add('hovered');
    }
  });
  document.addEventListener('mouseout', e => {
    if ([...hoverEls()].some(el => el.contains(e.target) || el === e.target)) {
      cursor.classList.remove('hovered');
    }
  });

  // Click burst
  document.addEventListener('click', e => {
    spawnClickBurst(e.clientX, e.clientY);
    cursor.classList.add('clicked');
    setTimeout(() => cursor.classList.remove('clicked'), 220);
  });
}

function spawnClickBurst(x, y) {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'click-particle';
    const angle = (i / 8) * Math.PI * 2;
    const dist  = 28 + Math.random() * 22;
    p.style.cssText = `
      left:${x}px; top:${y}px;
      --tx:${Math.cos(angle)*dist}px;
      --ty:${Math.sin(angle)*dist}px;
      pointer-events:none;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}


/* ═══════════════════════════════════════════════════════
   CINEMATIC OVERLAY (scanlines + vignette + film grain)
═══════════════════════════════════════════════════════ */
function initCinematicOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'cinematic-overlay';
  overlay.style.pointerEvents = 'none'; // explicit JS guard
  overlay.innerHTML = `
    <canvas id="grain-canvas" style="pointer-events:none"></canvas>
    <div id="scanlines"        style="pointer-events:none"></div>
    <div id="vignette"         style="pointer-events:none"></div>
    <div id="letterbox-top"    style="pointer-events:none"></div>
    <div id="letterbox-bottom" style="pointer-events:none"></div>
  `;
  document.body.appendChild(overlay);

  // Film grain
  const gc  = document.getElementById('grain-canvas');
  const gctx = gc.getContext('2d');
  gc.width  = 256;
  gc.height = 256;

  function renderGrain() {
    const id = gctx.createImageData(256, 256);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255 | 0;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = Math.random() * 28 | 0;
    }
    gctx.putImageData(id, 0, 0);
  }
  setInterval(renderGrain, 80);
  renderGrain();
}


/* ═══════════════════════════════════════════════════════
   SCENE TRANSITION CINEMATIC FLASH
═══════════════════════════════════════════════════════ */
function initTransitionFlash() {
  const flash = document.createElement('div');
  flash.id = 'transition-flash';
  flash.style.pointerEvents = 'none'; // explicit guard
  document.body.appendChild(flash);

  // FIX: use a flag to prevent double-patching if this runs multiple times
  if (window._enhanceFadePatched) return;
  window._enhanceFadePatched = true;

  const _orig = window.fadeToScene;
  window.fadeToScene = async function(targetId, dur) {
    flash.style.animation = 'none';
    void flash.offsetWidth;
    flash.style.animation = 'flashIn 0.18s ease-out forwards';
    const result = await _orig(targetId, dur);
    flash.style.animation = 'flashOut 0.35s ease-in forwards';
    return result;
  };
}


/* ═══════════════════════════════════════════════════════
   ENHANCED BUTTON RIPPLE EFFECT
═══════════════════════════════════════════════════════ */
function initButtonRipples() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const rect   = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left   = (e.clientX - rect.left) + 'px';
    ripple.style.top    = (e.clientY - rect.top)  + 'px';
    ripple.style.pointerEvents = 'none'; // explicit guard
    btn.style.position  = btn.style.position || 'relative';
    btn.style.overflow  = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
}


/* ═══════════════════════════════════════════════════════
   SCENE 0 — ENHANCED START SCREEN
═══════════════════════════════════════════════════════ */
function enhanceStartScreen() {
  const box = document.querySelector('#scene-start .center-box');
  if (!box) return;

  // Floating ambient orbs — all pointer-events:none
  const orbs = document.createElement('div');
  orbs.id = 'start-orbs';
  orbs.style.pointerEvents = 'none';
  orbs.innerHTML = `
    <div class="orb orb-1" style="pointer-events:none"></div>
    <div class="orb orb-2" style="pointer-events:none"></div>
    <div class="orb orb-3" style="pointer-events:none"></div>
  `;
  document.getElementById('scene-start').appendChild(orbs);

  // Typing subtitle effect
  const label = document.querySelector('#scene-start .label:not(.dim)');
  if (label) {
    const text = label.textContent;
    label.textContent = '';
    label.style.opacity = '1';
    let i = 0;
    const type = setInterval(() => {
      label.textContent += text[i++];
      if (i >= text.length) clearInterval(type);
    }, 65);
  }

  // Enhanced play button pulse rings
  // FIX: rings are appended to playBtn.parentElement (center-box),
  // they are DECORATIVE ONLY — must never receive pointer events.
  const playBtn = document.querySelector('.play-btn');
  if (playBtn) {
    // FIX: explicitly hoist play-btn z-index in JS
    playBtn.style.position = 'relative';
    playBtn.style.zIndex   = '200';
    playBtn.style.pointerEvents = 'all';

    // FIX: debug click confirmation
    if (!playBtn._debugPatched) {
      playBtn._debugPatched = true;
      playBtn.addEventListener('click', function(e) {
        console.log('%c✦ Play button clicked! ✦', 'color:#ff2d9b;font-size:14px;font-weight:bold');
        console.log('Event target:', e.target);
        console.log('currentTarget:', e.currentTarget);
      });
    }

    const ring1 = document.createElement('div');
    const ring2 = document.createElement('div');
    const ring3 = document.createElement('div');
    ring1.className = 'lux-ring lux-ring-1';
    ring2.className = 'lux-ring lux-ring-2';
    ring3.className = 'lux-ring lux-ring-3';

    // FIX: pointer-events:none set in JS as well as CSS
    ring1.style.pointerEvents = 'none';
    ring2.style.pointerEvents = 'none';
    ring3.style.pointerEvents = 'none';
    ring1.style.zIndex = '1';
    ring2.style.zIndex = '1';
    ring3.style.zIndex = '1';

    playBtn.parentElement.appendChild(ring1);
    playBtn.parentElement.appendChild(ring2);
    playBtn.parentElement.appendChild(ring3);
  }
}


/* ═══════════════════════════════════════════════════════
   PLAY BUTTON BULLETPROOF FIX
   Runs after DOM settles — ensures nothing is sitting
   on top of the play button regardless of load order.
═══════════════════════════════════════════════════════ */
function bulletproofPlayButton() {
  const playBtn = document.querySelector('.play-btn');
  if (!playBtn) return;

  // Ensure z-index is high enough
  playBtn.style.position     = 'relative';
  playBtn.style.zIndex       = '200';
  playBtn.style.pointerEvents = 'all';

  // Log confirmation
  console.log('[enhance.js] ✓ Play button bulletproofed:', playBtn);

  // Scan siblings for any overlay elements that might block it
  const siblings = playBtn.parentElement ? [...playBtn.parentElement.children] : [];
  siblings.forEach(el => {
    if (el === playBtn) return;
    if (
      el.classList.contains('lux-ring') ||
      el.classList.contains('orb')      ||
      el.id === 'start-orbs'
    ) {
      el.style.pointerEvents = 'none';
      console.log('[enhance.js] ✓ Neutralised blocking sibling:', el.className || el.id);
    }
  });

  // Also scan the scene for any absolutely-positioned overlays
  const scene = document.getElementById('scene-start');
  if (scene) {
    scene.querySelectorAll('[id$="-overlay"], [id$="-bg"], [id^="grain"], [id^="scanline"], [id^="vignette"]').forEach(el => {
      el.style.pointerEvents = 'none';
    });
  }
}


/* ═══════════════════════════════════════════════════════
   SCENE 1 — ENHANCED COUNTDOWN
═══════════════════════════════════════════════════════ */
function enhanceCountdown() {
  const _orig = window.showStep;
  window.showStep = function(text, isWord) {
    _orig(text, isWord);

    if (!isWord) {
      // Shockwave for numbers
      const sw = document.createElement('div');
      sw.className = 'shockwave';
      sw.style.pointerEvents = 'none';
      document.getElementById('scene-1').appendChild(sw);
      setTimeout(() => sw.remove(), 900);

      // Screen shake
      document.getElementById('scene-1').classList.add('shake');
      setTimeout(() => document.getElementById('scene-1').classList.remove('shake'), 400);
    }

    // Chromatic aberration echo
    const content = document.getElementById('s1-content');
    if (content) {
      const el = content.firstChild;
      if (el) {
        const ghost1 = el.cloneNode(true);
        const ghost2 = el.cloneNode(true);
        ghost1.className += ' chroma-r';
        ghost2.className += ' chroma-b';
        ghost1.style.pointerEvents = 'none';
        ghost2.style.pointerEvents = 'none';
        content.appendChild(ghost1);
        content.appendChild(ghost2);
        setTimeout(() => { ghost1.remove(); ghost2.remove(); }, 500);
      }
    }
  };
}


/* ═══════════════════════════════════════════════════════
   SCENE 2 — LETTER STAGGER ENHANCEMENT
═══════════════════════════════════════════════════════ */
function enhanceHBD() {
  const _orig = window.buildHBD;
  window.buildHBD = function() {
    _orig();

    // After DOM is ready, add shimmer spans
    setTimeout(() => {
      document.querySelectorAll('.hbd-letter').forEach((el, i) => {
        el.innerHTML = `<span class="letter-inner">${el.textContent}</span>`;
        el.textContent = '';
        el.appendChild(el.querySelector('.letter-inner'));

        // Random hue rotation for festive effect
        const hue = (i * 23) % 60 - 30;
        el.style.filter = `hue-rotate(${hue}deg)`;
      });
    }, 50);
  };
}


/* ═══════════════════════════════════════════════════════
   SCENE 3 — FLOATING PARTICLES UPGRADE
═══════════════════════════════════════════════════════ */
function enhanceScene3() {
  const _orig = window.spawnHeart;
  window.spawnHeart = function() {
    _orig();
    // Also spawn sparkles
    const scene = document.getElementById('scene-3');
    const types  = ['✦', '★', '·', '✧'];
    const sp = document.createElement('div');
    sp.className  = 'sparkle-float';
    sp.textContent = types[Math.floor(Math.random() * types.length)];
    sp.style.left  = Math.random() * 95 + '%';
    sp.style.bottom = '3%';
    sp.style.fontSize = (8 + Math.random() * 14) + 'px';
    sp.style.animationDuration = (2.5 + Math.random() * 2) + 's';
    sp.style.animationDelay    = Math.random() * 0.5 + 's';
    sp.style.pointerEvents = 'none';
    scene.appendChild(sp);
    setTimeout(() => sp.remove(), 5000);
  };
}


/* ═══════════════════════════════════════════════════════
   SCENE 4 — HEART GLOW PULSE AFTER INIT
═══════════════════════════════════════════════════════ */
function enhanceLoveScene() {
  const _orig = window.openLoveScene;
  window.openLoveScene = async function() {
    await _orig();

    // Add pulse rings to heart stage after it's built
    setTimeout(() => {
      const stage = document.getElementById('heart-stage');
      if (!stage) return;
      const size = parseInt(stage.style.width);

      ['lux-heart-ring-1','lux-heart-ring-2','lux-heart-ring-3'].forEach((cls, i) => {
        const ring = document.createElement('div');
        ring.className = 'lux-heart-ring ' + cls;
        ring.style.width  = (size + i * 40) + 'px';
        ring.style.height = (size + i * 40) + 'px';
        ring.style.marginLeft = -(i * 20) + 'px';
        ring.style.marginTop  = -(i * 20) + 'px';
        ring.style.pointerEvents = 'none'; // explicit
        stage.appendChild(ring);
      });
    }, HEART_IMGS.length * 80 + 600);
  };
}


/* ═══════════════════════════════════════════════════════
   PERFORMANCE MONITOR (dev only, hidden in prod)
═══════════════════════════════════════════════════════ */
function initPerfMonitor() {
  if (!location.hostname.includes('localhost') && !location.hostname.includes('127.')) return;

  let fps = 0, frames = 0, last = performance.now();
  const el = document.createElement('div');
  el.id = 'perf-monitor';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);

  function tick() {
    frames++;
    const now = performance.now();
    if (now - last >= 1000) {
      fps = frames;
      frames = 0;
      last = now;
      el.textContent = `${fps} FPS`;
      el.style.color = fps < 30 ? '#f44' : fps < 50 ? '#fa0' : '#4f4';
    }
    requestAnimationFrame(tick);
  }
  tick();
}


/* ═══════════════════════════════════════════════════════
   INIT ALL
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initCinematicOverlay();
  initTransitionFlash();
  initButtonRipples();
  enhanceStartScreen();
  enhanceCountdown();
  enhanceHBD();
  enhanceScene3();
  enhanceLoveScene();
  initPerfMonitor();

  // FIX: bulletproof the play button after a short delay to ensure
  // Three.js, GSAP, and other scripts have also run their DOM mutations
  setTimeout(bulletproofPlayButton, 600);
  // Run again at 1.5s as belt-and-suspenders (in case CDN scripts load slowly)
  setTimeout(bulletproofPlayButton, 1500);

  console.log(
    '%c✦ Cinematic Birthday Experience ✦',
    'color:#ff2d9b;font-size:16px;font-weight:bold;text-shadow:0 0 10px #2d5eff'
  );
  console.log(
    '%c[enhance.js] Play button fix active — pointer-events hardened.',
    'color:#c9a84c;font-size:11px;'
  );
});
