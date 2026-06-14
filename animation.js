/*
╔══════════════════════════════════════════════════════════════════╗
║  animation.js — GSAP Cinematic Timeline Engine                   ║
║  Loads from CDN: gsap + ScrollTrigger + TextPlugin               ║
╚══════════════════════════════════════════════════════════════════╝
*/

/* ═══════════════════════════════════════════════════════
   GSAP LOADER — loads GSAP from CDN, then initialises
═══════════════════════════════════════════════════════ */
(function loadGSAP() {
  const CDN_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5';

  function loadScript(src, cb) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = () => console.warn('[animation.js] Failed to load:', src);
    document.head.appendChild(s);
  }

  loadScript(`${CDN_BASE}/gsap.min.js`, () => {
    // GSAP core loaded
    loadScript(`${CDN_BASE}/TextPlugin.min.js`, () => {
      gsap.registerPlugin(TextPlugin);
      initGSAPAnimations();
    });
  });
})();


/* ═══════════════════════════════════════════════════════
   MASTER TIMELINE CONTROLLER
═══════════════════════════════════════════════════════ */
function initGSAPAnimations() {

  /* ── LENIS smooth scroll (loaded via CDN in HTML) ──── */
  initLenis();

  /* ── Per-scene enhancements ──────────────────────── */
  enhanceScene0_GSAP();
  patchSceneTransitions_GSAP();
  enhanceCountdown_GSAP();
  enhanceHBD_GSAP();
  enhanceCarousel_GSAP();
  enhanceHeart_GSAP();
}


/* ═══════════════════════════════════════════════════════
   LENIS — smooth scrolling wrapper
   (Birthday site doesn't scroll, but Lenis adds
    buttery-smooth touch momentum on mobile)
═══════════════════════════════════════════════════════ */
function initLenis() {
  if (typeof Lenis === 'undefined') {
    // Load Lenis from CDN
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
    s.onload = () => {
      const lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    };
    document.head.appendChild(s);
  }
}


/* ═══════════════════════════════════════════════════════
   SCENE 0 — START SCREEN GSAP ENTRANCE
═══════════════════════════════════════════════════════ */
function enhanceScene0_GSAP() {
  // Wait a tick so DOM is ready
  requestAnimationFrame(() => {
    const tl = gsap.timeline({ delay: 0.3 });

    tl.from('#scene-start .label:not(.dim)', {
      duration: 1.2,
      y: -40,
      opacity: 0,
      ease: 'expo.out',
      clearProps: 'all'
    })
    .from('.play-btn', {
      duration: 0.9,
      scale: 0,
      rotation: -180,
      opacity: 0,
      ease: 'back.out(1.8)'
    }, '-=0.5')
    .from('#scene-start .label.dim', {
      duration: 0.7,
      y: 20,
      opacity: 0,
      ease: 'power3.out'
    }, '-=0.3');

    // Continuous play button breathing
    gsap.to('.play-btn', {
      scale: 1.04,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1.5
    });
  });
}


/* ═══════════════════════════════════════════════════════
   SCENE TRANSITIONS — cinematic camera pull
═══════════════════════════════════════════════════════ */
function patchSceneTransitions_GSAP() {
  // Override the enhance.js override with GSAP-powered version
  const _base = window.fadeToScene;

  window.fadeToScene = function(targetId, dur) {
    dur = dur || 800;
    return new Promise(resolve => {
      const cur  = document.querySelector('.scene.active');
      const next = document.getElementById(targetId);
      const durS = dur / 1000;

      // Exit current
      if (cur) {
        gsap.to(cur, {
          opacity: 0,
          scale: 0.97,
          duration: durS * 0.55,
          ease: 'power2.in',
          onComplete: () => {
            cur.classList.remove('active');
            gsap.set(cur, { clearProps: 'all' });
          }
        });
      }

      // Enter next
      setTimeout(() => {
        next.classList.add('active');
        gsap.fromTo(next,
          { opacity: 0, scale: 1.025 },
          {
            opacity: 1,
            scale: 1,
            duration: durS * 0.65,
            ease: 'power2.out',
            onComplete: resolve
          }
        );
      }, dur * 0.38);
    });
  };
}


/* ═══════════════════════════════════════════════════════
   SCENE 1 — COUNTDOWN GSAP TIMELINES
═══════════════════════════════════════════════════════ */
function enhanceCountdown_GSAP() {
  const _orig = window.showStep;
  window.showStep = function(text, isWord) {
    _orig(text, isWord);

    const el = document.querySelector('#s1-content .big-num, #s1-content .big-word');
    if (!el) return;

    // Kill any running tweens on this element
    gsap.killTweensOf(el);

    if (!isWord) {
      // Numbers: explosive scale punch
      gsap.fromTo(el,
        { scale: 2.5, opacity: 0, filter: 'blur(20px)' },
        { scale: 1,   opacity: 1, filter: 'blur(0px)',
          duration: 0.5, ease: 'expo.out' }
      );

      // Exit: implode
      gsap.to(el, {
        scale: 0.6,
        opacity: 0,
        filter: 'blur(12px)',
        duration: 0.3,
        delay: 0.82,
        ease: 'power3.in'
      });
    } else {
      // Words: elegant slide + letter stagger
      gsap.fromTo(el,
        { y: 60, opacity: 0, letterSpacing: '20px' },
        { y: 0,  opacity: 1, letterSpacing: '8px',
          duration: 0.7, ease: 'expo.out' }
      );
    }
  };
}


/* ═══════════════════════════════════════════════════════
   SCENE 2 — HAPPY BIRTHDAY GSAP STAGGER
═══════════════════════════════════════════════════════ */
function enhanceHBD_GSAP() {
  const _orig = window.animateHBD;
  window.animateHBD = async function() {
    // Run original to add .show classes (for CSS fallback)
    await _orig();

    // Then GSAP adds extra life
    await new Promise(res => setTimeout(res, 200));

    // Letter-by-letter GSAP stagger on top of CSS animation
    const letters = document.querySelectorAll('.hbd-letter');
    gsap.fromTo(letters,
      { rotateY: 90, opacity: 0 },
      {
        rotateY: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: 'back.out(2)',
        delay: 0.3
      }
    );

    // Name shimmer
    gsap.to('#s2-name', {
      textShadow: '0 0 38px #2d84ff, 0 0 76px rgba(45, 132, 255, 0.5), 0 0 120px rgba(45, 83, 255, 0.25)',
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1.5
    });

    // Candles sway
    gsap.to('.candle-body', {
      skewX: 3,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.1
    });
  };
}


/* ═══════════════════════════════════════════════════════
   SCENE 3 — CAROUSEL GSAP ENTRANCE
═══════════════════════════════════════════════════════ */
function enhanceCarousel_GSAP() {
  const _orig = window.initSlider;
  window.initSlider = function() {
    _orig();

    // Card entrance
    gsap.from('.card', {
      duration: 1,
      y: 60,
      opacity: 0,
      scale: 0.9,
      ease: 'back.out(1.4)',
      clearProps: 'all'
    });

    // Card head letter stagger
    gsap.from('.card-head', {
      duration: 0.8,
      y: -20,
      opacity: 0,
      delay: 0.3,
      ease: 'expo.out'
    });

    // CTA button pulse after delay
    gsap.to('.cta', {
      boxShadow: '0 0 30px rgba(45, 101, 255, 0.6), 0 0 60px rgba(45, 115, 255, 0.3)',
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2
    });

    // Nav buttons entrance
    gsap.from(['.nav.prev','.nav.next'], {
      opacity: 0,
      x: (i) => i === 0 ? -20 : 20,
      duration: 0.6,
      stagger: 0.1,
      delay: 0.5,
      ease: 'power2.out'
    });
  };
}


/* ═══════════════════════════════════════════════════════
   SCENE 4 — HEART PHOTO STAGGER (GSAP OVERRIDE)
═══════════════════════════════════════════════════════ */
function enhanceHeart_GSAP() {
  const _orig = window.initHeart;
  window.initHeart = function() {
    _orig();

    // After CSS animations settle, add continuous hover drift
    const delay = (window.HEART_IMGS ? window.HEART_IMGS.length : 24) * 80 + 800;
    setTimeout(() => {
      const photos = document.querySelectorAll('.love-photo');

      // Breathing pulse on all photos
      gsap.to(photos, {
        scale: 1.06,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { each: 0.08, from: 'start' }
      });

      // Title entrance
      gsap.from('.love-title', {
        duration: 1.2,
        y: -30,
        opacity: 0,
        ease: 'expo.out'
      });

      // Ghost button entrance
      gsap.from('.ghost-btn', {
        duration: 0.8,
        y: 20,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.4
      });

    }, delay);
  };
}
