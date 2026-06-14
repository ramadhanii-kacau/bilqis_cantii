/*
╔══════════════════════════════════════════════════════════════════╗
║  three-scene.js — Three.js Cinematic 3D Background (FIXED v2)   ║
║                                                                  ║
║  BUG FIX:                                                        ║
║  - Wrapper and canvas: pointer-events:none set in multiple ways  ║
║  - Canvas DOM element: setAttribute + style + cssText            ║
║  - wrapper gets z-index:1 + isolation:isolate to stay at bottom  ║
║  - No event listener on wrapper or canvas                        ║
╚══════════════════════════════════════════════════════════════════╝
*/

(function initThreeBackground() {
  const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  function loadScript(src, cb) {
    if (window.THREE) { cb(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = cb;
    s.onerror = () => console.warn('[three-scene.js] Failed to load Three.js');
    document.head.appendChild(s);
  }

  loadScript(THREE_CDN, () => {
    setTimeout(buildThreeScene, 400);
  });
})();


function buildThreeScene() {
  /* ── Canvas container ────────────────────────────── */
  const wrapper = document.createElement('div');
  wrapper.id = 'three-bg';

  // FIX: triple-enforce pointer-events:none using all available methods
  wrapper.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none !important;
    overflow: hidden;
    isolation: isolate;
  `;
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.setAttribute('inert', '');           // HTML5 inert — prevents all interaction

  document.body.insertBefore(wrapper, document.body.firstChild);

  /* ── Renderer ─────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // FIX: belt-and-suspenders on the canvas element
  const canvas = renderer.domElement;
  canvas.style.cssText          = 'pointer-events:none!important;position:absolute;inset:0;';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.pointerEvents    = 'none';
  canvas.style.userSelect       = 'none';
  canvas.tabIndex               = -1;          // remove from tab order
  wrapper.appendChild(canvas);

  /* ── Scene + Camera ──────────────────────────────── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 600;

  /* ── PARTICLE FIELD ───────────────────────────────── */
  const PARTICLE_COUNT = 3000;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors    = new Float32Array(PARTICLE_COUNT * 3);
  const sizes     = new Float32Array(PARTICLE_COUNT);

  const colPalette = [
    new THREE.Color('#2d61ff'),
    new THREE.Color('#6a94ff'),
    new THREE.Color('#1042cc'),
    new THREE.Color('#ffffff'),
    new THREE.Color('#ffd6ec'),
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 1800;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1800;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1200;

    const c = colPalette[Math.floor(Math.random() * colPalette.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = 1.5 + Math.random() * 3;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:    { value: 0 },
      uOpacity: { value: 0.55 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float uTime;
      void main() {
        vColor = color;
        vec3 pos = position;
        pos.y += sin(uTime * 0.4 + position.x * 0.01) * 8.0;
        pos.x += cos(uTime * 0.3 + position.z * 0.01) * 5.0;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (400.0 / -mvPosition.z);
        gl_Position  = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float glow = 1.0 - smoothstep(0.0, 0.5, d);
        gl_FragColor = vec4(vColor, glow * glow * uOpacity);
      }
    `,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    vertexColors: true
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);


  /* ── AURORA PLANES ───────────────────────────────── */
  const auroraGeo = new THREE.PlaneGeometry(2400, 800, 1, 1);
  const auroraMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:   { value: 0 },
      uColor1: { value: new THREE.Color('#2d76ff') },
      uColor2: { value: new THREE.Color('#000000') },
      uAlpha:  { value: 0.06 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uAlpha;
      varying vec2 vUv;
      void main() {
        float wave = sin(vUv.x * 6.28 + uTime * 0.5) * 0.5 + 0.5;
        wave *= sin(vUv.y * 3.14 + uTime * 0.3) * 0.5 + 0.5;
        vec3 col = mix(uColor2, uColor1, wave * vUv.y);
        gl_FragColor = vec4(col, wave * uAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  const aurora1 = new THREE.Mesh(auroraGeo, auroraMat.clone());
  aurora1.position.set(0, 200, -400);
  aurora1.rotation.x = 0.3;
  scene.add(aurora1);

  const aurora2 = new THREE.Mesh(auroraGeo, auroraMat.clone());
  aurora2.position.set(0, -200, -300);
  aurora2.rotation.x = -0.2;
  scene.add(aurora2);


  /* ── SCENE-AWARE COLOUR CONTROLLER ──────────────── */
  const sceneColors = {
    'scene-start': { target: 0.55 },
    'scene-1':     { target: 0.75 },
    'scene-2':     { target: 0.50 },
    'scene-3':     { target: 0.35 },
    'scene-4':     { target: 0.65 }
  };

  let targetOpacity  = 0.55;
  let currentOpacity = 0.55;

  const sceneObserver = new MutationObserver(() => {
    const active = document.querySelector('.scene.active');
    if (active && sceneColors[active.id]) {
      targetOpacity = sceneColors[active.id].target;
    }
  });

  sceneObserver.observe(document.body, {
    subtree: true,
    attributeFilter: ['class']
  });


  /* ── MOUSE PARALLAX ──────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  // FIX: listen on document, not on wrapper/canvas
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });


  /* ── RESIZE ──────────────────────────────────────── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });


  /* ── RENDER LOOP ──────────────────────────────────── */
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;

    currentOpacity += (targetOpacity - currentOpacity) * 0.03;
    mat.uniforms.uTime.value    = time;
    mat.uniforms.uOpacity.value = currentOpacity;

    [aurora1, aurora2].forEach(a => {
      a.material.uniforms.uTime.value = time;
    });

    particles.rotation.y = time * 0.025;
    particles.rotation.x = time * 0.008;

    camera.position.x += (mouseX * 40 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 25 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  // FIX: after render loop starts, re-assert pointer-events:none
  // (Three.js can reset canvas styles in some versions)
  setTimeout(() => {
    canvas.style.pointerEvents = 'none';
    wrapper.style.pointerEvents = 'none';
  }, 500);

  console.log('[three-scene.js] ✓ Three.js background initialised — pointer-events:none enforced on canvas.');
}
