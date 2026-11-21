// The marble board, the glass counters and everything that moves on them.
// Engine squares map to the table like this: rows run left to right (White sits on the left), columns run away
// from the camera ('a' is the far edge), one square = one world unit.
import * as THREE from 'three';
import { GLASS } from '../../shared/characters.js';
import { loadImage } from './stage.js';

const PX = 128;      // texture pixels per square
const MARGIN = 0.55; // marble border around the grid, in squares

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Profile of a plano-convex glass counter: flat underneath, domed on top, with a soft rim. */
function counterGeometry(radius, height) {
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(radius - 0.05, 0)];
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2); pts.push(new THREE.Vector2(radius - 0.05 + Math.cos(a) * 0.05, 0.05 + Math.sin(a) * 0.05)); }
  for (let i = 1; i <= 18; i++) { const a = (i / 18) * (Math.PI / 2); pts.push(new THREE.Vector2(radius * Math.cos(a), 0.05 + (height - 0.05) * Math.sin(a))); }
  const g = new THREE.LatheGeometry(pts, 56);
  g.computeVertexNormals();
  return g;
}

export class BoardView {
  /** @param {import('./stage.js').Stage} stage  @param glass [glassIdForWhite, glassIdForBlack] */
  constructor(stage, cols, rows, glass, marbleImage) {
    this.stage = stage; this.cols = cols; this.rows = rows; this.glass = glass;
    this.group = new THREE.Group();
    stage.scene.add(this.group);
    this.pieces = new Map();   // square -> mesh
    this.trayCount = [0, 0];
    this.marks = new THREE.Group(); this.group.add(this.marks);
    this._buildBoard(marbleImage);
    this._buildMaterials();
    this._buildTrays();
    this._buildMarkers();
    this.hook = (dt, time) => this._tick(dt, time);
    stage.frameHooks.push(this.hook);
  }

  dispose() {
    this.stage.scene.remove(this.group);
    const i = this.stage.frameHooks.indexOf(this.hook); if (i >= 0) this.stage.frameHooks.splice(i, 1);
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose && !o.material.shared) o.material.dispose(); });
  }

  // ---- coordinates ---------------------------------------------------------------------------------------------
  pos(i, y = 0) {
    const c = i % this.cols, r = (i / this.cols) | 0;
    return new THREE.Vector3(r - (this.rows - 1) / 2, y, c - (this.cols - 1) / 2);
  }
  squareAt(point) {
    if (!point) return -1;
    const r = Math.round(point.x + (this.rows - 1) / 2), c = Math.round(point.z + (this.cols - 1) / 2);
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols ? r * this.cols + c : -1;
  }
  squareAtScreen(x, y) { return this.squareAt(this.stage.boardPoint(x, y)); }

  // ---- the board -----------------------------------------------------------------------------------------------
  _buildBoard(marbleImage) {
    const { cols, rows } = this;
    const W = rows + 2 * MARGIN, D = cols + 2 * MARGIN;
    const cw = Math.round(W * PX), ch = Math.round(D * PX);
    const albedo = document.createElement('canvas'); albedo.width = cw; albedo.height = ch;
    const bump = document.createElement('canvas'); bump.width = cw; bump.height = ch;
    const a = albedo.getContext('2d'), b = bump.getContext('2d');
    const rnd = rng(cols * 31 + rows);
    // stone
    if (marbleImage) {
      const s = Math.max(cw / marbleImage.width, ch / marbleImage.height) * 1.0;
      a.drawImage(marbleImage, 0, 0, marbleImage.width * s, marbleImage.height * s);
      a.globalCompositeOperation = 'multiply'; a.fillStyle = '#c9b596'; a.fillRect(0, 0, cw, ch); a.globalCompositeOperation = 'source-over';
    } else {
      const g = a.createLinearGradient(0, 0, cw, ch); g.addColorStop(0, '#b3a184'); g.addColorStop(0.5, '#c2b094'); g.addColorStop(1, '#a8967a');
      a.fillStyle = g; a.fillRect(0, 0, cw, ch);
      for (let i = 0; i < 46; i++) { // veins
        a.strokeStyle = `rgba(${110 + rnd() * 50},${98 + rnd() * 40},${84 + rnd() * 30},${0.05 + rnd() * 0.16})`; a.lineWidth = 0.6 + rnd() * 2.6;
        a.beginPath(); let x = rnd() * cw, y = rnd() * ch; a.moveTo(x, y);
        for (let k = 0; k < 9; k++) { x += (rnd() - 0.3) * 220; y += (rnd() - 0.5) * 150; a.lineTo(x, y); }
        a.stroke();
      }
    }
    for (let i = 0; i < 2600; i++) { a.fillStyle = `rgba(${rnd() < 0.5 ? '40,30,20' : '255,250,240'},${rnd() * 0.05})`; a.fillRect(rnd() * cw, rnd() * ch, 1 + rnd() * 3, 1 + rnd() * 3); }
    b.fillStyle = '#909090'; b.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 900; i++) { const v = 120 + rnd() * 50; b.fillStyle = `rgba(${v},${v},${v},0.25)`; b.beginPath(); b.arc(rnd() * cw, rnd() * ch, 2 + rnd() * 14, 0, 7); b.fill(); }
    // incised grid: hand-cut lines that wander a little, darker where dirt has gathered
    const x0 = MARGIN * PX, y0 = MARGIN * PX;
    const line = (ctx, x1, y1, x2, y2, style, width) => {
      ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath();
      const n = 14; ctx.moveTo(x1, y1);
      for (let k = 1; k <= n; k++) { const t = k / n; ctx.lineTo(x1 + (x2 - x1) * t + (rnd() - 0.5) * 2.2, y1 + (y2 - y1) * t + (rnd() - 0.5) * 2.2); }
      ctx.stroke();
    };
    const each = (fn) => {
      for (let r = 0; r <= rows; r++) fn(x0 + r * PX, y0 - 6, x0 + r * PX, y0 + cols * PX + 6);
      for (let c = 0; c <= cols; c++) fn(x0 - 6, y0 + c * PX, x0 + rows * PX + 6, y0 + c * PX);
    };
    each((x1, y1, x2, y2) => line(a, x1 + 1.5, y1 + 1.5, x2 + 1.5, y2 + 1.5, 'rgba(255,248,232,0.42)', 2.2)); // lit lip of the groove
    each((x1, y1, x2, y2) => line(a, x1, y1, x2, y2, 'rgba(44,29,16,0.8)', 4.6));
    each((x1, y1, x2, y2) => line(a, x1, y1, x2, y2, 'rgba(24,14,8,0.5)', 1.6));
    b.filter = 'blur(1.2px)';
    each((x1, y1, x2, y2) => line(b, x1, y1, x2, y2, '#141414', 5));
    b.filter = 'none';
    // worn, darker border
    const vg = a.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
    vg.addColorStop(0, 'rgba(60,40,20,0)'); vg.addColorStop(1, 'rgba(60,40,20,0.3)');
    a.fillStyle = vg; a.fillRect(0, 0, cw, ch);

    const map = new THREE.CanvasTexture(albedo); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 16;
    const bumpMap = new THREE.CanvasTexture(bump); bumpMap.anisotropy = 8;
    const top = new THREE.MeshPhysicalMaterial({ map, bumpMap, bumpScale: 2.2, roughness: 0.42, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.45, envMapIntensity: 0.8 });
    const side = new THREE.MeshStandardMaterial({ color: 0xa8967a, roughness: 0.6 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W, 0.28, D), [side, side, top, side, side, side]);
    // the canvas runs x -> rows and y -> columns, which is how BoxGeometry maps its top face (u along +x, v=1 at the far edge)
    slab.position.y = -0.14;
    slab.receiveShadow = true; slab.castShadow = true;
    this.group.add(slab);
    this.slab = slab; this.size = { W, D };
  }

  _buildMaterials() {
    this.mats = this.glass.map((id) => {
      const g = GLASS[id];
      return new THREE.MeshPhysicalMaterial({
        color: g.color, roughness: g.roughness, metalness: 0, transmission: g.transmission, thickness: 0.5, ior: 1.52,
        attenuationColor: new THREE.Color(g.attenuation), attenuationDistance: g.depth,
        clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.5, specularIntensity: 1,
      });
    });
    this.gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 1, roughness: 0.28, envMapIntensity: 1.4 });
    this.geoMan = counterGeometry(0.36, 0.2);
    this.geoDux = counterGeometry(0.4, 0.42);
    this.geoRing = new THREE.TorusGeometry(0.33, 0.035, 12, 48);
    this.geoKnob = new THREE.SphereGeometry(0.085, 24, 16);
    // a soft dark pool under each counter, so it sits on the stone instead of floating over it
    this.geoContact = new THREE.PlaneGeometry(1.25, 1.25); this.geoContact.rotateX(-Math.PI / 2);
    this.contactMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.45, d); gl_FragColor = vec4(0.05, 0.03, 0.02, a * a * 0.55); }',
    });
    this.contactMat.shared = true;
  }

  _makePiece(code) {
    const side = code > 0 ? 0 : 1, dux = code === 2 || code === -2;
    const mesh = new THREE.Mesh(dux ? this.geoDux : this.geoMan, this.mats[side]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    const g = new THREE.Group(); g.add(mesh);
    const contact = new THREE.Mesh(this.geoContact, this.contactMat); contact.position.y = 0.004; contact.scale.setScalar(dux ? 1.12 : 1); contact.renderOrder = 1;
    g.add(contact);
    if (dux) {
      const ring = new THREE.Mesh(this.geoRing, this.gold); ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; ring.castShadow = true;
      const knob = new THREE.Mesh(this.geoKnob, this.gold); knob.position.y = 0.46; knob.castShadow = true;
      g.add(ring, knob);
    }
    g.userData = { code, bound: false, spin: Math.random() * 6.28 };
    g.rotation.y = g.userData.spin;
    return g;
  }

  _buildTrays() {
    const bronze = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, metalness: 0.95, roughness: 0.38, envMapIntensity: 1.2 });
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.9, 0), new THREE.Vector2(1.18, 0.16), new THREE.Vector2(1.22, 0.2), new THREE.Vector2(1.14, 0.17), new THREE.Vector2(0.86, 0.05), new THREE.Vector2(0, 0.05)];
    const geo = new THREE.LatheGeometry(pts, 64);
    // the dishes for captured pieces stand on the far side of the board, one toward each player
    const z = -(this.cols / 2 + MARGIN + 1.3);
    this.trays = [-1, 1].map((sgn) => {
      const m = new THREE.Mesh(geo, bronze); m.position.set(sgn * Math.max(1.9, this.rows / 2 - 1.1), -0.28, z);
      m.castShadow = true; m.receiveShadow = true; this.group.add(m); return m;
    });
  }
  traySlot(side, k) {
    const t = this.trays[side].position, a = k * 2.399963, r = Math.min(0.78, 0.25 * Math.sqrt(k));
    return new THREE.Vector3(t.x + Math.cos(a) * r, -0.22 + Math.floor(k / 9) * 0.16, t.z + Math.sin(a) * r);
  }
  trayPosition(side) { return this.trays[side].position.clone(); }

  // ---- markers -------------------------------------------------------------------------------------------------
  _buildMarkers() {
    const mk = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
    this.geoDot = new THREE.CircleGeometry(0.15, 32); this.geoDot.rotateX(-Math.PI / 2);
    this.geoHalo = new THREE.RingGeometry(0.39, 0.47, 48); this.geoHalo.rotateX(-Math.PI / 2);
    this.geoTile = new THREE.PlaneGeometry(0.92, 0.92); this.geoTile.rotateX(-Math.PI / 2);
    this.m = { move: mk(0xffe2a0, 0.85), take: mk(0xff6a3c, 0.95), select: mk(0xffd27a, 1), last: mk(0xffc46a, 0.09), threat: mk(0xff3b2a, 0.9), hint: mk(0x7dffb0, 0.95), hover: mk(0xffffff, 0.1), bound: mk(0xb388ff, 0.8) };
    this.sets = { select: [], last: [], threat: [], hint: [], hover: [], bound: [] };
    this.hintArrow = null;
  }
  _clear(name) { for (const o of this.sets[name]) this.marks.remove(o); this.sets[name] = []; }
  _add(name, geo, mat, i, y = 0.012, scale = 1) {
    const o = new THREE.Mesh(geo, mat); o.position.copy(this.pos(i, y)); o.scale.setScalar(scale); o.renderOrder = 2;
    this.marks.add(o); this.sets[name].push(o); return o;
  }
  /** Highlight a selected piece and where it may go. `targets` is [{ to, takes }]. */
  setSelection(from, targets = []) {
    this._clear('select');
    if (from >= 0) this._add('select', this.geoHalo, this.m.select, from);
    for (const t of targets) {
      if (t.takes) this._add('select', this.geoHalo, this.m.take, t.to, 0.012, 0.8); else this._add('select', this.geoDot, this.m.move, t.to);
    }
  }
  /** Squares where a piece may be placed (placement phase): shown only under the pointer. */
  setHover(i) { this._clear('hover'); if (i >= 0) this._add('hover', this.geoTile, this.m.hover, i, 0.008); }
  setLast(squares = []) { this._clear('last'); for (const i of squares) if (i >= 0) this._add('last', this.geoTile, this.m.last, i, 0.006); }
  setThreats(squares = []) { this._clear('threat'); for (const i of squares) this._add('threat', this.geoHalo, this.m.threat, i, 0.014, 1.08); }
  setBoundMarks(squares = []) { this._clear('bound'); for (const i of squares) this._add('bound', this.geoHalo, this.m.bound, i, 0.014, 1.12); }
  /** Show a hint: a glowing square (level 2) or an arrow from one square to another (level 3). */
  setHint(hint) {
    this._clear('hint');
    if (this.hintArrow) { this.marks.remove(this.hintArrow); this.hintArrow = null; }
    if (!hint) return;
    if (hint.from >= 0) this._add('hint', this.geoHalo, this.m.hint, hint.from, 0.016, 1.15);
    if (hint.to >= 0 && hint.showTo) {
      this._add('hint', this.geoDot, this.m.hint, hint.to, 0.016, 1.3);
      if (hint.from >= 0) {
        const a = this.pos(hint.from, 0.05), b = this.pos(hint.to, 0.05), d = b.clone().sub(a), len = d.length();
        const shape = new THREE.Shape(); const w = 0.07, hw = 0.2, hl = 0.34, L = Math.max(0.1, len - 0.42);
        shape.moveTo(0.36, -w); shape.lineTo(L - hl, -w); shape.lineTo(L - hl, -hw); shape.lineTo(L, 0); shape.lineTo(L - hl, hw); shape.lineTo(L - hl, w); shape.lineTo(0.36, w); shape.closePath();
        const g = new THREE.ShapeGeometry(shape); g.rotateX(-Math.PI / 2);
        const arrow = new THREE.Mesh(g, this.m.hint); arrow.position.copy(a); arrow.rotation.y = -Math.atan2(d.z, d.x); arrow.renderOrder = 3;
        this.marks.add(arrow); this.hintArrow = arrow;
      }
    }
  }
  clearMarks() { this.setSelection(-1); this.setHover(-1); this.setThreats(); this.setHint(null); this.setBoundMarks(); }

  _tick(dt, time) {
    const pulse = 0.6 + 0.4 * Math.sin(time * 5);
    this.m.threat.opacity = 0.45 + 0.5 * pulse; this.m.hint.opacity = 0.55 + 0.4 * pulse; this.m.select.opacity = 0.8 + 0.2 * pulse;
    for (const o of this.sets.threat) o.scale.setScalar(1.02 + 0.1 * pulse);
  }

  // ---- pieces --------------------------------------------------------------------------------------------------
  /** Rebuild every piece from an engine state, with no animation. */
  sync(state) {
    for (const p of this.pieces.values()) this.group.remove(p);
    this.pieces.clear();
    for (const list of this.trayPieces || []) for (const p of list) this.group.remove(p);
    this.trayPieces = [[], []];
    for (let i = 0; i < state.board.length; i++) {
      const code = state.board[i];
      if (!code) continue;
      const p = this._makePiece(code); p.position.copy(this.pos(i));
      if (state.capA[i] >= 0) { p.userData.bound = true; p.children[0].rotation.x = Math.PI; p.children[0].position.y = code === 2 || code === -2 ? 0.42 : 0.2; }
      this.group.add(p); this.pieces.set(i, p);
    }
    // captured pieces lie in the captor's tray: white's captures are black pieces, and the reverse
    for (const side of [0, 1]) for (let k = 0; k < state.captured[side]; k++) {
      const p = this._makePiece(side === 0 ? -1 : 1); p.position.copy(this.traySlot(side, k)); p.rotation.z = (k % 3 - 1) * 0.2;
      this.group.add(p); this.trayPieces[side].push(p);
    }
    const bound = []; for (let i = 0; i < state.board.length; i++) if (state.capA[i] >= 0) bound.push(i);
    this.setBoundMarks(bound);
  }

  _flip(p, bound) {
    const body = p.children[0], dux = Math.abs(p.userData.code) === 2, from = body.rotation.x, to = bound ? Math.PI : 0, top = dux ? 0.42 : 0.2;
    p.userData.bound = bound;
    return this.stage.tween(0.42, (t) => { body.rotation.x = from + (to - from) * t; body.position.y = (bound ? t : 1 - t) * top + Math.sin(t * Math.PI) * 0.35; }, 'inOut');
  }

  _toTray(p, side) {
    const k = this.trayPieces[side].length; this.trayPieces[side].push(p);
    const a = p.position.clone(), b = this.traySlot(side, k), tilt = (k % 3 - 1) * 0.2;
    if (p.userData.bound) { p.children[0].rotation.x = 0; p.children[0].position.y = 0; }
    return this.stage.tween(0.62, (t) => { p.position.lerpVectors(a, b, t); p.position.y += Math.sin(t * Math.PI) * 1.5; p.rotation.z = tilt * t; p.rotation.x = Math.sin(t * Math.PI) * 0.6; }, 'inOut');
  }

  /** Animate one applied move. `before` is the state the move was made in, `after` the result (after.last has details). */
  async animate(before, after, sfx) {
    const info = after.last, mv = info.move, jobs = [];
    const side = info.by > 0 ? 0 : 1;
    if (mv.t === 'p') {
      const p = this._makePiece(info.piece), target = this.pos(mv.to);
      p.position.copy(target).setY(2.6); p.scale.setScalar(0.9);
      this.group.add(p); this.pieces.set(mv.to, p);
      await this.stage.tween(0.3, (t) => { p.position.y = 2.6 * (1 - t); }, 'in');
      sfx && sfx.click(0.9);
      await this.stage.tween(0.16, (t) => { p.position.y = Math.sin(t * Math.PI) * 0.07; p.scale.setScalar(0.9 + 0.1 * t); }, 'out');
    } else if (mv.t === 'm') {
      const p = this.pieces.get(mv.from);
      this.pieces.delete(mv.from); this.pieces.set(mv.to, p);
      const a = this.pos(mv.from), b = this.pos(mv.to), dist = a.distanceTo(b);
      const lift = mv.hop ? 0.9 : 0.16, dur = mv.hop ? 0.46 : Math.min(0.6, 0.2 + dist * 0.075);
      sfx && sfx.slide(dist);
      await this.stage.tween(dur, (t) => { p.position.lerpVectors(a, b, t); p.position.y = Math.sin(t * Math.PI) * lift; p.rotation.y = p.userData.spin + t * dist * 0.25; }, 'inOut');
      p.userData.spin = p.rotation.y;
      sfx && sfx.click(mv.hop ? 1 : 0.7);
    }
    for (const i of info.captured) {
      const p = this.pieces.get(i); if (!p) continue;
      this.pieces.delete(i);
      this._flash(i, 0xff6a3c);
      jobs.push(this.stage.wait(0.12).then(() => { sfx && sfx.take(); return this._toTray(p, side); }));
    }
    for (const i of info.bound) { const p = this.pieces.get(i); if (p) { this._flash(i, 0xb388ff); sfx && sfx.bind(); jobs.push(this._flip(p, true)); } }
    for (const i of info.freed) { const p = this.pieces.get(i); if (p) { this._flash(i, 0x7dffb0); jobs.push(this._flip(p, false)); } }
    if (info.removed.length) {
      // bound pieces are taken off by the player whose turn is beginning
      const captor = after.turn > 0 ? 0 : 1;
      for (const i of info.removed) {
        const p = this.pieces.get(i); if (!p) continue;
        this.pieces.delete(i);
        jobs.push(this.stage.wait(0.25).then(() => { sfx && sfx.take(); return this._toTray(p, captor); }));
      }
    }
    await Promise.all(jobs);
    const bound = []; for (let i = 0; i < after.board.length; i++) if (after.capA[i] >= 0) bound.push(i);
    this.setBoundMarks(bound);
    this.setLast(mv.t === 'm' ? [mv.from, mv.to] : mv.t === 'p' ? [mv.to] : []);
  }

  _flash(i, color) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
    const o = new THREE.Mesh(this.geoHalo, mat); o.position.copy(this.pos(i, 0.02)); this.marks.add(o);
    this.stage.tween(0.7, (t) => { o.scale.setScalar(1 + t * 1.6); mat.opacity = 0.9 * (1 - t); }, 'out').then(() => { this.marks.remove(o); mat.dispose(); });
  }

  /** Lift the piece on a square a little (while it is selected). */
  lift(i, on) {
    const p = this.pieces.get(i); if (!p) return;
    const from = p.position.y, to = on ? 0.14 : 0;
    this.stage.tween(0.14, (t) => { p.position.y = from + (to - from) * t; }, 'out');
  }

  /** Take one piece out of a tray (Dux steals it); returns its world position, or null if the tray is empty. */
  stealFromTray(side) {
    const list = this.trayPieces[side]; if (!list || !list.length) return null;
    const p = list[list.length - 1]; return { piece: p, position: p.position.clone() };
  }
}

/** The stone for the board: a single slab if there is one, else the tiled stone from the material library. */
export async function loadMarble() {
  return (await loadImage('textures/marble/slab.webp')) || loadImage('textures/marble/diffuse.jpg');
}
