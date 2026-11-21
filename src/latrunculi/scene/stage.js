// The 3D stage: renderer, camera, lights, table, backdrop and post-processing.
// Three layers are drawn each frame: the backdrop plate, the 3D table and board, then the characters (actors.js).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SETTINGS } from '../../shared/characters.js';

export const ART = new URL('../art/', document.baseURI).href;
const texLoader = new THREE.TextureLoader();
/** Load a texture; resolves to null (never rejects) when the file is missing. */
export function loadTexture(path, srgb = true) {
  return new Promise((resolve) => {
    texLoader.load(ART + path, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; resolve(t); }, undefined, () => resolve(null));
  });
}
export function loadImage(path) {
  return new Promise((resolve) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = () => resolve(null); im.src = ART + path; });
}

const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  back: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVignette: { value: 0.9 }, uGrain: { value: 0.035 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uVignette, uGrain; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      // a breath of chromatic aberration toward the corners
      vec3 c = vec3(texture2D(tDiffuse, vUv + d * r2 * 0.005).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * r2 * 0.005).b);
      c *= mix(1.0, smoothstep(0.85, 0.15, r2 * 1.9), uVignette);
      c += (hash(vUv * 1000.0 + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.autoClear = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.5, 300);
    this.bgScene = new THREE.Scene();
    this.overlay = new THREE.Scene();                 // characters and Dux, in screen space
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10); // x in [-aspect, aspect], y in [-1, 1]
    this.ortho.position.z = 5;

    this.view = { azimuth: 0, elevation: 50, zoom: 1 };
    this.viewGoal = { ...this.view };
    this.tweens = [];
    this.frameHooks = [];
    this.clock = new THREE.Clock();
    this.time = 0;
    this.settingId = 'cubiculum';
    this.boardSize = { cols: 8, rows: 8 };
    this.quality = 'high';

    this._buildBackdrop();
    this._buildLights();
    this._buildTable();
    this._buildDust();
    this._buildComposer();
    this._bindCameraInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.resize());
    r.setAnimationLoop(() => this._frame());
  }

  // ---- construction --------------------------------------------------------------------------------------------
  _buildBackdrop() {
    this.bgMat = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { tA: { value: null }, tB: { value: null }, uMix: { value: 0 }, uHas: { value: 0 }, uScale: { value: new THREE.Vector2(1, 1) }, uShift: { value: new THREE.Vector2() }, uDim: { value: 0.9 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D tA, tB; uniform float uMix, uHas, uDim; uniform vec2 uScale, uShift; varying vec2 vUv;
        void main(){
          vec2 uv = (vUv - 0.5) * uScale + 0.5 + uShift;
          vec3 a = texture2D(tA, uv).rgb, b = texture2D(tB, uv).rgb;
          vec3 c = mix(a, b, uMix) * uHas + (1.0 - uHas) * mix(vec3(0.02, 0.012, 0.008), vec3(0.16, 0.09, 0.05), vUv.y);
          c *= uDim * mix(0.55, 1.0, smoothstep(0.0, 0.75, vUv.y));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMat);
    quad.frustumCulled = false;
    this.bgScene.add(quad);
    this.bgTextures = {};
  }

  _buildLights() {
    const s = this.scene;
    this.key = new THREE.SpotLight(0xffc78a, 150, 70, 0.78, 0.9, 1.5);
    this.key.position.set(-11.5, 6.4, 3.5); // low, like a lamp on a stand: long soft shadows across the board
    this.key.target.position.set(0, 0, 0);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0004;
    this.key.shadow.radius = 4;
    this.key.shadow.intensity = 0.9;
    this.key.shadow.camera.near = 4; this.key.shadow.camera.far = 40;
    s.add(this.key, this.key.target);
    this.lamp = new THREE.PointLight(0xff9a4a, 10, 30, 1.8);   // the flickering oil lamp, off to one side
    this.lamp.position.set(6.5, 2.4, -4.5);
    s.add(this.lamp);
    this.rim = new THREE.DirectionalLight(0x9fb6ff, 0.35);
    this.rim.position.set(4, 6, -10);
    s.add(this.rim);
    s.add(new THREE.HemisphereLight(0xffe8cc, 0x1a0f08, 0.1));
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.fallbackEnv = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environment = this.fallbackEnv;
    s.environmentIntensity = 0.5;
    this.pmrem = pm;
  }

  _buildTable() {
    this.tableMat = new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.62, metalness: 0.0 });
    this.table = new THREE.Mesh(new THREE.BoxGeometry(90, 1, 60), this.tableMat);
    this.table.receiveShadow = true;
    this.scene.add(this.table);
    this._placeTable();
  }
  _placeTable() {
    const depth = this.boardSize.cols;
    const far = -(depth / 2 + 3.45);
    this.table.position.set(0, -0.78, far + 30);
    this.tableFar = far;
  }

  _buildDust() {
    const n = 260, pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26; pos[i * 3 + 1] = Math.random() * 9 + 0.3; pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
      seed[i] = Math.random() * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    this.dustMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffd9a8) }, uSize: { value: 26 } },
      vertexShader: `
        attribute float seed; uniform float uTime, uSize; varying float vA;
        void main(){
          vec3 p = position;
          p.x += sin(uTime * 0.11 + seed) * 0.7; p.y += sin(uTime * 0.07 + seed * 1.7) * 0.5; p.z += cos(uTime * 0.09 + seed * 0.6) * 0.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (0.4 + fract(seed) * 0.9) / -mv.z;
          vA = 0.25 + 0.75 * abs(sin(uTime * 0.4 + seed));
        }`,
      fragmentShader: 'uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(uColor, a * a * vA * 0.5); }',
    });
    this.dust = new THREE.Points(g, this.dustMat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  _buildComposer() {
    const r = this.renderer;
    const target = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(r, target);
    const bg = new RenderPass(this.bgScene, this.ortho);
    const main = new RenderPass(this.scene, this.camera); main.clear = false; main.clearDepth = true;
    const actors = new RenderPass(this.overlay, this.ortho); actors.clear = false; actors.clearDepth = true;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.24, 0.7, 0.9);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(bg); this.composer.addPass(main); this.composer.addPass(actors);
    this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass()); this.composer.addPass(this.grade);
  }

  // ---- assets and settings -------------------------------------------------------------------------------------
  /** Load shared material textures and the reflection environment. Missing files fall back to procedural looks. */
  async loadMaterials() {
    const [d, n, arm] = await Promise.all([loadTexture('textures/wood/diffuse.jpg'), loadTexture('textures/wood/normal_gl.jpg', false), loadTexture('textures/wood/arm.jpg', false)]);
    for (const t of [d, n, arm]) if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 6); }
    if (d) { this.tableMat.map = d; this.tableMat.color.set(0x8a6f5a); }
    if (n) { this.tableMat.normalMap = n; this.tableMat.normalScale.set(0.9, 0.9); }
    if (arm) { this.tableMat.roughnessMap = arm; this.tableMat.roughness = 0.9; }
    this.tableMat.needsUpdate = true;
    await new Promise((resolve) => new RGBELoader().load(ART + 'env/studio.hdr', (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      this.hdrEnv = this.pmrem.fromEquirectangular(tex).texture; tex.dispose();
      this.scene.environment = this.hdrEnv; resolve();
    }, undefined, () => resolve()));
  }

  async setSetting(id) {
    const cfg = SETTINGS[id] || SETTINGS.cubiculum;
    this.settingId = cfg.id;
    this.renderer.toneMappingExposure = cfg.exposure;
    this.key.color.set(cfg.key); this.key.intensity = cfg.keyPower;
    this.lamp.color.set(cfg.fill); this.lampBase = 5 + 7 * cfg.flicker; this.flicker = cfg.flicker;
    this.scene.environmentIntensity = cfg.env;
    this.dustMat.uniforms.uColor.value.set(cfg.key);
    this.tint = cfg.tint;
    if (!this.bgTextures[id]) this.bgTextures[id] = await loadTexture(`backgrounds/${id}.webp`);
    const tex = this.bgTextures[id];
    const u = this.bgMat.uniforms;
    if (tex) {
      if (!u.tA.value) { u.tA.value = tex; u.tB.value = tex; u.uHas.value = 1; } else {
        u.tB.value = tex; u.uMix.value = 0;
        await this.tween(0.9, (t) => { u.uMix.value = t; }, 'inOut');
        u.tA.value = tex; u.uMix.value = 0;
      }
      this.bgAspect = tex.image.width / tex.image.height;
      this._fitBackdrop();
    }
  }
  _fitBackdrop() {
    const a = this.aspect || 1, b = this.bgAspect || 16 / 9, s = this.bgMat.uniforms.uScale.value;
    if (a > b) s.set(1, b / a); else s.set(a / b, 1);
    s.multiplyScalar(0.94); // a little slack so the plate can drift with the camera
  }

  // ---- camera --------------------------------------------------------------------------------------------------
  setBoardSize(cols, rows) {
    this.boardSize = { cols, rows };
    this._placeTable();
    this.fitCamera(true);
  }

  /** Screen rectangle (in NDC) that the board must fit inside; the rest is for the characters and the interface. */
  boardRect() {
    if (this.rect) return this.rect; // a panel (the review) may claim part of the screen
    const a = this.aspect;
    if (a >= 1.45) return this.height < 520 ? { fx: 0.46, top: 0.72, bottom: -0.66 } : { fx: 0.5, top: 0.7, bottom: -0.74 };
    if (a >= 1.0) return { fx: 0.66, top: 0.5, bottom: -0.72 };
    return { fx: 0.92, top: 0.3, bottom: -0.76 }; // upright phone: names and faces above, controls below
  }

  fitCamera(snap = false) {
    const { cols, rows } = this.boardSize;
    const hx = rows / 2 + 0.55, hz = cols / 2 + 0.55;
    const rect = this.boardRect(), fy = (rect.top - rect.bottom) / 2, cy = (rect.top + rect.bottom) / 2;
    const cam = this.camera, v = this.view;
    const az = THREE.MathUtils.degToRad(v.azimuth), el = THREE.MathUtils.degToRad(v.elevation);
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    cam.clearViewOffset();
    const corners = [];
    for (const x of [-hx, hx]) for (const z of [-hz, hz]) for (const y of [0, 0.45]) corners.push(new THREE.Vector3(x, y, z));
    const fits = (d) => {
      cam.position.copy(dir).multiplyScalar(d); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      let mx = 0, my = 0;
      for (const c of corners) { const p = c.clone().project(cam); mx = Math.max(mx, Math.abs(p.x)); my = Math.max(my, Math.abs(p.y)); }
      return mx <= rect.fx && my <= fy;
    };
    let lo = 4, hi = 120;
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
    const d = hi / v.zoom;
    cam.position.copy(dir).multiplyScalar(d); cam.lookAt(0, 0, 0);
    const w = this.width, h = this.height;
    cam.setViewOffset(w, h, -(this.shiftX || 0) * w / 2, cy * h / 2, w, h); // shiftX slides the board aside to make room for a panel
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    if (snap) this.viewGoal = { ...v };
    this.onLayout && this.onLayout();
  }

  setView(name) {
    if (name === 'top') this.viewGoal = { azimuth: 0, elevation: 84, zoom: 1 };
    else this.viewGoal = { azimuth: 0, elevation: 50, zoom: 1 };
  }

  _bindCameraInput() {
    const c = this.canvas;
    let drag = null;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointerdown', (e) => { if (e.button === 2 || e.button === 1) { drag = { x: e.clientX, y: e.clientY, az: this.viewGoal.azimuth, el: this.viewGoal.elevation }; c.setPointerCapture(e.pointerId); } });
    c.addEventListener('pointermove', (e) => {
      this.pointer = { x: (e.clientX / this.width) * 2 - 1, y: -(e.clientY / this.height) * 2 + 1, px: e.clientX, py: e.clientY };
      if (!drag) return;
      this.viewGoal.azimuth = THREE.MathUtils.clamp(drag.az - (e.clientX - drag.x) * 0.2, -40, 40);
      this.viewGoal.elevation = THREE.MathUtils.clamp(drag.el + (e.clientY - drag.y) * 0.2, 28, 86);
    });
    c.addEventListener('pointerup', () => { drag = null; });
    c.addEventListener('wheel', (e) => { e.preventDefault(); this.viewGoal.zoom = THREE.MathUtils.clamp(this.viewGoal.zoom * (e.deltaY > 0 ? 0.94 : 1.06), 0.75, 1.5); }, { passive: false });
    this.pointer = { x: 0, y: 0, px: 0, py: 0 };
  }

  resize() {
    const w = this.width = this.canvas.clientWidth || window.innerWidth, h = this.height = this.canvas.clientHeight || window.innerHeight;
    this.aspect = w / h;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.camera.aspect = this.aspect;
    this.ortho.left = -this.aspect; this.ortho.right = this.aspect; this.ortho.updateProjectionMatrix();
    this._fitBackdrop();
    this.fitCamera();
  }

  // ---- helpers -------------------------------------------------------------------------------------------------
  /** Animate t from 0 to 1 over `dur` seconds. Returns a promise. */
  tween(dur, update, easing = 'inOut') {
    return new Promise((resolve) => {
      if (this.instant || dur <= 0) { update(1); resolve(); return; }
      this.tweens.push({ t: 0, dur, update, ease: ease[easing] || ease.inOut, resolve });
    });
  }
  wait(seconds) { return this.tween(seconds, () => {}, 'linear'); }

  /** World point on the board plane under a screen position, or null. */
  boardPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.08), hit) ? hit : null;
  }

  /** Project a world position into overlay coordinates (x in [-aspect, aspect], y in [-1, 1]). */
  toOverlay(v) {
    const p = v.clone().project(this.camera);
    return new THREE.Vector2(p.x * this.aspect, p.y);
  }
  toPixels(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x + 1) / 2 * this.width, y: (1 - p.y) / 2 * this.height };
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.time += dt;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t = Math.min(1, tw.t + (dt * (this.timeScale || 1)) / tw.dur);
      tw.update(tw.ease(tw.t));
      if (tw.t >= 1) { this.tweens.splice(i, 1); tw.resolve(); }
    }
    // ease the camera toward its goal, with a little drift from the pointer
    const v = this.view, g = this.viewGoal, k = 1 - Math.pow(0.002, dt);
    const sway = this.reduceMotion ? 0 : 1;
    const az = g.azimuth + this.pointer.x * 1.6 * sway, el = g.elevation - this.pointer.y * 0.9 * sway;
    if (Math.abs(az - v.azimuth) + Math.abs(el - v.elevation) + Math.abs(g.zoom - v.zoom) > 0.002) {
      v.azimuth += (az - v.azimuth) * k; v.elevation += (el - v.elevation) * k; v.zoom += (g.zoom - v.zoom) * k;
      this.fitCamera();
    }
    this.bgMat.uniforms.uShift.value.set(-v.azimuth * 0.0012, (v.elevation - 50) * 0.0012);
    const f = this.flicker || 0;
    this.lamp.intensity = (this.lampBase || 10) * (1 + f * (0.08 * Math.sin(this.time * 11.3) + 0.06 * Math.sin(this.time * 23.7 + 1.3) + 0.05 * Math.sin(this.time * 4.1)));
    this.dustMat.uniforms.uTime.value = this.time;
    this.grade.uniforms.uTime.value = this.time % 10;
    for (const hook of this.frameHooks) hook(dt, this.time);
    this.composer.render(dt);
  }
}
