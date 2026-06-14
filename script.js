/*
╔══════════════════════════════════════════════════════════════════╗
║  script.js — Happy Birthday BILQIS                             ║
║                                                                  ║
║  PERBAIKAN SCENE 4:                                              ║
║  - Foto lebih besar: ukuran foto dihitung ulang                  ║
║  - Center sempurna: stage di-center oleh CSS flex                ║
║  - Hati proporsional: titik lebih sedikit tapi foto besar        ║
║  - Animasi satu per satu: delay JS bertahap 80ms/foto            ║
║  - Responsive: ukuran menyesuaikan viewport                      ║
╚══════════════════════════════════════════════════════════════════╝
*/


/* ════════════════════════════════════════════════════════════════
   1. KONFIGURASI GAMBAR LOKAL
   Ganti nama file sesuai foto aslimu.
   Semua file harus berada di folder yang SAMA dengan index.html.
════════════════════════════════════════════════════════════════ */

var SLIDER_IMGS = [
  'img1.jpeg',
  'img5.jpeg',
  'img2.jpeg',
  'img3.jpeg',
  'img4.jpeg'
];

/*
  HEART_IMGS — foto untuk Love Heart Scene 4.

  TIPS UKURAN FOTO:
  - Gunakan 24 foto → foto ukuran besar, bentuk hati jelas
  - Gunakan 16 foto → foto lebih besar lagi (untuk sedikit foto)
  - Semakin sedikit foto, semakin besar tiap foto
  - Jika kamu hanya punya 5-12 foto, foto akan di-loop otomatis
*/
var HEART_IMGS = [
  'img2.jpeg',
  'img3.jpeg',
  'img4.jpeg',
  'img5.jpeg',
  'img6.jpeg',
  'img2.jpeg',
  'img3.jpeg',
  'img4.jpeg',
  'img5.jpeg',
  'img6.jpeg',
  'img2.jpeg',
  'img3.jpeg',
  'img4.jpeg',
  'img5.jpeg',
  'img6.jpeg',
  'img2.jpeg',
  'img3.jpeg',
  'img4.jpeg',
  'img5.jpeg',
  'img6.jpeg',
  'img2.jpeg',
  'img3.jpeg',
  'img4.jpeg',
  'img5.jpeg'
];


/* ════════════════════════════════════════════════════════════════
   2. MATRIX RAIN ENGINE
════════════════════════════════════════════════════════════════ */

function MatrixRain(canvas, accent, colW) {
  var ctx = canvas.getContext('2d');
  accent  = accent || '#ff2d9b';
  colW    = colW   || 15;

  var CHARS = 'アイウエオカキクケコサシスセソタチツナニHAPPYBIRTHDAYBILQIS♥★✦';

  var W, H, cols, drops;

  function resize() {
    W     = canvas.width  = canvas.offsetWidth;
    H     = canvas.height = canvas.offsetHeight;
    cols  = Math.floor(W / colW);
    drops = Array.from({ length: cols }, function () {
      return -Math.random() * 60;
    });
  }

  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = colW + 'px monospace';

    for (var i = 0; i < cols; i++) {
      var ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      var r  = Math.random();

      if      (r > 0.94) ctx.fillStyle = '#ffffff';
      else if (r > 0.70) ctx.fillStyle = accent;
      else               ctx.fillStyle = accent + '55';

      ctx.fillText(ch, i * colW, drops[i] * colW);

      if (drops[i] * colW > H && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  resize();
  window.addEventListener('resize', resize);

  return { draw: draw };
}


/* ════════════════════════════════════════════════════════════════
   3. INISIALISASI MATRIX PER SCENE
════════════════════════════════════════════════════════════════ */
var ACC = '#ff2d9b';

var mxStart = MatrixRain(document.getElementById('cvs-start'), ACC, 15);
var mxS1    = MatrixRain(document.getElementById('cvs-1'),     ACC, 14);
var mxS2    = MatrixRain(document.getElementById('cvs-2'),     ACC, 16);
var mxS3    = MatrixRain(document.getElementById('cvs-3'),     ACC, 17);
var mxS4    = MatrixRain(document.getElementById('cvs-4'),     ACC, 17);

setInterval(function () { mxStart.draw(); }, 50);


/* ════════════════════════════════════════════════════════════════
   4. SCENE MANAGER
════════════════════════════════════════════════════════════════ */

function fadeToScene(targetId, dur) {
  dur = dur || 800;
  return new Promise(function (resolve) {
    var cur  = document.querySelector('.scene.active');
    var next = document.getElementById(targetId);

    if (cur) {
      cur.style.transition = 'opacity ' + dur + 'ms ease';
      cur.style.opacity    = '0';
      setTimeout(function () {
        cur.classList.remove('active');
        cur.style.transition = '';
        cur.style.opacity    = '';
      }, dur);
    }

    setTimeout(function () {
      next.classList.add('active');
      next.style.transition = 'opacity ' + dur + 'ms ease';
      next.style.opacity    = '0';
      requestAnimationFrame(function () {
        next.style.opacity = '1';
        setTimeout(resolve, dur);
      });
    }, dur * 0.45);
  });
}


/* ════════════════════════════════════════════════════════════════
   5. SCENE 1 — COUNTDOWN
════════════════════════════════════════════════════════════════ */

var STEPS = [
  { text: '3' },
  { text: '2' },
  { text: '1' },
  { text: 'HAPPY',    isWord: true },
  { text: 'BIRTHDAY', isWord: true },
  { text: 'PRINSESS I', isWord: true },
  { text: ' ♥', isWord: true }
];

function showStep(text, isWord) {
  var box = document.getElementById('s1-content');
  box.innerHTML = '';
  var el = document.createElement('div');
  el.className   = isWord ? 'big-word' : 'big-num';
  el.textContent = text;
  box.appendChild(el);
}

function clearStep() {
  document.getElementById('s1-content').innerHTML = '';
}


/* ════════════════════════════════════════════════════════════════
   6. SCENE 2 — HAPPY BIRTHDAY STAGGER
════════════════════════════════════════════════════════════════ */

var CANDLE_CLRS = ['#2d57ff', '#6a79ff', '#1048cc', '#2d49ff', '#6aa6ff', '#103ccc'];

function buildHBD() {
  var rowCandle = document.getElementById('s2-candles');
  var rowHappy  = document.getElementById('s2-happy');
  var rowBday   = document.getElementById('s2-bday');

  rowCandle.innerHTML = '';
  rowHappy.innerHTML  = '';
  rowBday.innerHTML   = '';

  CANDLE_CLRS.forEach(function (c) {
    var el = document.createElement('div');
    el.className = 'candle';
    el.innerHTML =
      '<div class="flame"></div>' +
      '<div class="candle-body" style="background:' + c + '"></div>';
    rowCandle.appendChild(el);
  });

  ' HAPPY '.split('').forEach(function (ch) {
    var s = document.createElement('span');
    s.className   = 'hbd-letter';
    s.textContent = ch;
    rowHappy.appendChild(s);
  });

  'BIRTHDAY'.split('').forEach(function (ch) {
    var s = document.createElement('span');
    s.className   = 'hbd-letter';
    s.textContent = ch;
    rowBday.appendChild(s);
  });
}

function resetHBD() {
  document.querySelectorAll('#scene-2 [data-dir]').forEach(function (el) {
    el.classList.remove('show');
    void el.offsetWidth;
  });
}

async function animateHBD() {
  var queue = [
    { id: 's2-candles', wait: 0   },
    { id: 's2-happy',   wait: 300 },
    { id: 's2-bday',    wait: 280 },
    { id: 's2-name',    wait: 320 },
    { id: 's2-sub',     wait: 300 }
  ];

  for (var i = 0; i < queue.length; i++) {
    if (queue[i].wait > 0) await wait(queue[i].wait);
    var node = document.getElementById(queue[i].id);
    if (node) node.classList.add('show');
  }
}


/* ════════════════════════════════════════════════════════════════
   7. SCENE 3 — SLIDER / CAROUSEL
════════════════════════════════════════════════════════════════ */

var sldIdx   = 0;
var sldTotal = 0;
var sldTimer = null;
var sldBusy  = false;

function initSlider() {
  var track  = document.getElementById('s3-track');
  var dotsEl = document.getElementById('s3-dots');

  var wrap = track.closest('.slider-wrap') || track.parentElement;
  if (wrap) {
    var scene3  = document.getElementById('scene-3');
    var scene3H = scene3 ? scene3.offsetHeight : window.innerHeight;
    var availableH = scene3H - 160;
    var sliderH    = Math.min(Math.max(availableH, 280), 520);

    wrap.style.height    = sliderH + 'px';
    wrap.style.minHeight = '280px';
    wrap.style.maxHeight = '520px';
    wrap.style.overflow  = 'hidden';
    wrap.style.position  = 'relative';
    wrap.style.width     = '100%';
  }

  track.style.display = 'flex';
  track.style.width   = '100%';
  track.style.height  = '100%';

  track.innerHTML = '';
  SLIDER_IMGS.forEach(function (src, i) {
    var slide = document.createElement('div');
    slide.className = 'slide';
    slide.style.flex        = '0 0 100%';
    slide.style.width       = '100%';
    slide.style.height      = '100%';
    slide.style.overflow    = 'hidden';
    slide.style.position    = 'relative';
    slide.style.aspectRatio = 'unset';

    var img = document.createElement('img');
    img.alt                  = 'Foto ' + (i + 1);
    img.style.width          = '100%';
    img.style.height         = '100%';
    img.style.objectFit      = 'contain';
    img.style.objectPosition = 'center center';
    img.style.display        = 'block';
    img.style.background     = '#000';
    img.src = src;

    slide.appendChild(img);
    track.appendChild(slide);
  });

  sldTotal = SLIDER_IMGS.length;
  sldIdx   = 0;

  dotsEl.innerHTML = '';
  SLIDER_IMGS.forEach(function (_, i) {
    var d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', function () { resetTimer(); goSlide(i); });
    dotsEl.appendChild(d);
  });

  document.getElementById('btn-prev').onclick = function () { resetTimer(); goSlide(sldIdx - 1); };
  document.getElementById('btn-next').onclick = function () { resetTimer(); goSlide(sldIdx + 1); };
  document.getElementById('btn-love').onclick  = openLoveScene;

  // ── FIX SCENE 3: Force z-index agar tidak terblokir overlay ──
  var scene3el = document.getElementById('scene-3');
  if (scene3el) {
    scene3el.style.pointerEvents = 'all';
    var card3 = scene3el.querySelector('.card');
    if (card3) { card3.style.zIndex = '30'; card3.style.pointerEvents = 'all'; card3.style.position = 'relative'; }
    var wrap3 = scene3el.querySelector('.slider-wrap');
    if (wrap3) { wrap3.style.zIndex = '25'; wrap3.style.pointerEvents = 'all'; }
    ['btn-prev','btn-next','btn-love'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) { el.style.zIndex = '35'; el.style.pointerEvents = 'all'; el.style.position = 'relative'; }
    });
    scene3el.querySelectorAll('.dot').forEach(function(d) {
      d.style.zIndex = '35'; d.style.pointerEvents = 'all';
    });
  }

  // ── FIX SCENE 3: Touch swipe support ──
  var sliderWrap3 = document.querySelector('#scene-3 .slider-wrap');
  if (sliderWrap3 && !sliderWrap3._swipePatched) {
    sliderWrap3._swipePatched = true;
    var _tx = 0, _ty = 0;
    sliderWrap3.addEventListener('touchstart', function(e) {
      _tx = e.touches[0].clientX;
      _ty = e.touches[0].clientY;
    }, { passive: true });
    sliderWrap3.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - _tx;
      var dy = e.changedTouches[0].clientY - _ty;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        resetTimer(); goSlide(sldIdx + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
  }

  goSlide(0);
  startTimer();
}

function goSlide(idx) {
  if (sldBusy) return;
  sldBusy = true;

  sldIdx = ((idx % sldTotal) + sldTotal) % sldTotal;
  document.getElementById('s3-track').style.transform =
    'translateX(-' + (sldIdx * 100) + '%)';

  document.querySelectorAll('.dot').forEach(function (d, i) {
    d.classList.toggle('active', i === sldIdx);
  });

  setTimeout(function () { sldBusy = false; }, 580);
}

function startTimer()  { sldTimer = setInterval(function () { goSlide(sldIdx + 1); }, 3000); }
function stopTimer()   { clearInterval(sldTimer); sldTimer = null; }
function resetTimer()  { stopTimer(); startTimer(); }


/* ════════════════════════════════════════════════════════════════
   8. SCENE 4 — LOVE HEART (DIPERBAIKI TOTAL)

   PERUBAHAN UTAMA DIBANDING VERSI LAMA:
   ─────────────────────────────────────
   A. UKURAN STAGE
      - Stage dihitung dari ruang NYATA yang tersedia setelah
        dikurangi judul (.love-title) dan tombol (.ghost-btn)
      - Ini mencegah stage terlalu kecil atau overflow

   B. UKURAN FOTO (pSize)
      - Rumus lama: circumference / n * 0.75 → foto kecil
      - Rumus baru: gunakan rumus berbasis GRID, bukan circumference
        Hitung berapa banyak foto muat di lingkaran hati,
        lalu bagi ukuran stage dengan jumlah baris ekuivalen
      - Minimum foto: 48px, maksimum: 88px
      - Hasilnya foto JAUH lebih besar

   C. CENTERING
      - Stage diposisikan oleh flex parent (.love-scene-wrap)
        yang sudah diset di CSS: align-items: center
      - Tidak perlu margin atau transform manual
      - Stage sendiri: position relative, display block

   D. ANIMASI SATU PER SATU
      - Setiap .love-photo mendapat animation-delay berbeda
      - Delay = indeks × 80ms → foto muncul berurutan
      - CSS @keyframes photoIn sudah diperbarui (lebih dinamis)

   E. RESPONSIVE
      - Ukuran stage = min(80vw, 80vh, 500px)
        → di HP kecil tetap proporsional
      - resize handler: rebuild ulang jika scene aktif
════════════════════════════════════════════════════════════════ */

/*
  heartPoints(n, size) — menghasilkan n titik di kontur hati
  berukuran [size × size] piksel, tersentral di tengah stage.

  Formula hati parametrik:
    x = 16 sin³(t)
    y = 13 cos(t) − 5 cos(2t) − 2 cos(3t) − cos(4t)
  rentang asli: x ∈ [-16, 16], y ∈ [-17, 13]

  scale = (size × 0.82) / 34
    → faktor 0.82 memberi margin agar foto di tepi tidak terpotong

  Koordinat dibalik (y dikali -1) karena sumbu Y canvas ke bawah.
*/
function heartPoints(n, size) {
  var scale = (size * 0.82) / 34;   // 34 = rentang x (-16..16)
  var cx    = size / 2;
  var cy    = size / 2 + size * 0.04; // sedikit ke bawah agar hati simetris visual

  var pts = [];
  for (var i = 0; i < n; i++) {
    var t  = (i / n) * Math.PI * 2;
    var hx =  16 * Math.pow(Math.sin(t), 3);
    var hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push({
      x: cx + hx * scale,
      y: cy + hy * scale
    });
  }
  return pts;
}

/*
  calcPhotoSize(n, size) — menghitung ukuran foto yang IDEAL

  Pendekatan:
  1. Hitung keliling hati (approx): 2π × r_equiv, di mana r_equiv
     ≈ size × 0.38 (estimasi berdasarkan visual)
  2. Bagi keliling dengan jumlah foto
  3. Kalikan dengan faktor isi 0.85 (ada gap antar foto)
  4. Clamp antara MIN dan MAX agar tidak terlalu kecil/besar

  Ini menghasilkan foto yang MENGISI kontur hati tanpa tumpang tindih
  terlalu banyak dan tidak terlalu berjauhan.
*/
function calcPhotoSize(n, size) {
  // FIX LAYOUT: fill factor lebih besar (0.95 vs 0.85) + clamp lebih lebar
  var circumference = 2 * Math.PI * (size * 0.40);
  var natural = (circumference / n) * 0.95;
  var MIN = 48;
  var MAX = 100;
  return Math.min(MAX, Math.max(MIN, Math.round(natural)));
}

function initHeart() {
  var stage   = document.getElementById('heart-stage');
  var scene4  = document.getElementById('scene-4');
  var n       = HEART_IMGS.length;

  // ── A. Hitung ukuran stage yang tersedia ──
  // Ruang total scene 4 dikurangi estimasi judul + tombol + gap
  var sceneH = scene4 ? scene4.offsetHeight : window.innerHeight;
  var sceneW = scene4 ? scene4.offsetWidth  : window.innerWidth;

  // Kurangi: judul ~40px, tombol ~50px, gap total ~30px, padding ~20px
  var usedH   = 40 + 50 + 30 + 20;
  var availH  = sceneH - usedH;
  var availW  = sceneW * 0.92; // 92% lebar layar

  // Stage berbentuk kotak, ambil sisi terkecil
  var size = Math.floor(Math.min(availH, availW, 520));
  size = Math.max(size, 200); // minimum 200px

  // ── B. Hitung ukuran foto ──
  var pSize = calcPhotoSize(n, size);

  // ── C. Set dimensi stage ──
  // Clear & reset dulu
  stage.innerHTML    = '';
  stage.style.width  = size + 'px';
  stage.style.height = size + 'px';

  // ── D. Hitung titik-titik hati ──
  var pts = heartPoints(n, size);

  // ── E. Buat foto satu per satu ──
  pts.forEach(function (p, i) {
    var div = document.createElement('div');
    div.className = 'love-photo';

    // Posisi: tengah foto di titik hati
    div.style.width  = pSize + 'px';
    div.style.height = pSize + 'px';
    div.style.left   = Math.round(p.x - pSize / 2) + 'px';
    div.style.top    = Math.round(p.y - pSize / 2) + 'px';

    // Delay animasi: muncul satu per satu, 80ms antar foto
    div.style.animationDelay = (i * 80) + 'ms';

    // Buat img
    var img = document.createElement('img');
    img.alt = 'memory ' + (i + 1);

    // Set semua style SEBELUM src
    img.style.width          = '100%';
    img.style.height         = '100%';
    img.style.objectFit      = 'cover';
    img.style.objectPosition = 'center center';
    img.style.display        = 'block';
    img.style.borderRadius   = '50%'; // FIX LAYOUT: clip ke lingkaran di img-nya

    img.src = HEART_IMGS[i % n]; // loop foto jika kurang dari n

    div.appendChild(img);
    // FIX LAYOUT: overflow visible agar hover glow tidak terpotong
    div.style.overflow = 'visible';
    stage.appendChild(div);
  });
}

// Resize handler untuk scene 4
var heartResizeTimer = null;
window.addEventListener('resize', function () {
  clearTimeout(heartResizeTimer);
  heartResizeTimer = setTimeout(function () {
    var scene4 = document.getElementById('scene-4');
    var stage  = document.getElementById('heart-stage');
    if (stage && scene4 && scene4.classList.contains('active')) {
      initHeart();
    }
  }, 250);
});

async function openLoveScene() {
  stopTimer();
  clearInterval(heartTimerId);
  await fadeToScene('scene-4', 800);
  await wait(100);
  initHeart();

  // ── FIX SCENE 4: Inject "Play Again" button ──
  var existing = document.getElementById('play-again-btn');
  if (existing) existing.remove();

  var wrap4 = document.querySelector('.love-scene-wrap');
  if (wrap4) {
    var paBtn = document.createElement('button');
    paBtn.id = 'play-again-btn';
    paBtn.innerHTML =
      paBtn.innerHTML =
  '<span><a href="https://perinsess-bilqis.vercel.app/" style="color: aqua; font-family: Arial, sans-serif; text-decoration: none; font-size: 20px;">Next</a></span>';

    var ghost4 = wrap4.querySelector('.ghost-btn');
    if (ghost4) ghost4.parentNode.insertBefore(paBtn, ghost4.nextSibling);
    else wrap4.appendChild(paBtn);

    paBtn.addEventListener('click', function() { restartShow(); });

    // GSAP entrance jika tersedia
    if (window.gsap) {
      gsap.fromTo(paBtn,
        { y: 28, opacity: 0, scale: 0.88 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.8)', delay: 0.4 }
      );
      gsap.to(paBtn, {
        boxShadow: '0 0 24px rgba(45, 108, 255, 0.55), 0 0 50px rgba(45, 143, 255, 0.25)',
        duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.2
      });
    }
  }
}


/* ════════════════════════════════════════════════════════════════
   9. FLOATING HEARTS
════════════════════════════════════════════════════════════════ */
var heartTimerId = null;

function spawnHeart() {
  var scene = document.getElementById('scene-3');
  var h     = document.createElement('div');
  h.className      = 'heart-float';
  h.textContent    = '♥';
  h.style.left     = Math.random() * 88 + '%';
  h.style.bottom   = '6%';
  h.style.fontSize = (10 + Math.random() * 18) + 'px';
  h.style.opacity  = 0.5 + Math.random() * 0.5;
  h.style.animationDuration = (3 + Math.random() * 2.5) + 's';
  scene.appendChild(h);
  setTimeout(function () { h.remove(); }, 5500);
}


/* ════════════════════════════════════════════════════════════════
   10. RENDER LOOP
════════════════════════════════════════════════════════════════ */
var running = false;

function renderLoop() {
  if (!running) return;
  mxS1.draw();
  mxS2.draw();
  mxS3.draw();
  mxS4.draw();
  requestAnimationFrame(renderLoop);
}


/* ════════════════════════════════════════════════════════════════
   11. SHOW SEQUENCE & ENTRY POINTS
════════════════════════════════════════════════════════════════ */

async function startShow() {
  running = true;
  renderLoop();

  await fadeToScene('scene-1', 600);

  for (var i = 0; i < STEPS.length; i++) {
    if (i > 0) await wait(1000);
    showStep(STEPS[i].text, STEPS[i].isWord);
  }

  await wait(1300);
  clearStep();

  buildHBD();
  resetHBD();

  await fadeToScene('scene-2', 900);
  await animateHBD();
  await wait(2600);

  await fadeToScene('scene-3', 900);
  initSlider();

  heartTimerId = setInterval(spawnHeart, 1000);
}

async function restartShow() {
  stopTimer();
  clearInterval(heartTimerId);
  heartTimerId = null;
  running      = false;

  document.getElementById('heart-stage').innerHTML = '';
  document.getElementById('s3-dots').innerHTML     = '';
  document.getElementById('s1-content').innerHTML  = '';

  await fadeToScene('scene-start', 700);
}


/* ════════════════════════════════════════════════════════════════
   12. UTILITY
════════════════════════════════════════════════════════════════ */

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
