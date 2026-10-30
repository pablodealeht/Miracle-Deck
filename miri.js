// Miri, el personaje de Miracle Deck (diseño propio). COPIA de src/PabloDeck.Core/web/miri.js para la página de
// descarga (GitHub Pages sirve solo lo que está en site/): si cambia el dibujo, copiarlo de nuevo. Caja de 100 × 100.
"use strict";

class MiriSpring {
  constructor(v, response, damping) { this.value = this.target = v; this.velocity = 0; this.configure(response, damping); }
  configure(response, damping) { this.omega = 2 * Math.PI / response; this.zeta = damping; }
  get settled() { return Math.abs(this.target - this.value) < 0.0005 && Math.abs(this.velocity) < 0.005; }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = this.omega * this.omega * (this.target - this.value) - 2 * this.zeta * this.omega * this.velocity;
      this.velocity += a * h; this.value += this.velocity * h;
    }
  }
}

const MIRI = {
  body: "#3FCBB0", top: "#5FE0C6", side: "#23967F", sideDark: "#1A7462",
  screen: "#0F1D1A", eye: "#9CFBE8", feet: "#1A2A26", shadow: "rgba(0,0,0,0.28)",
  led: { idle: "#9CFBE8", happy: "#C6FFF3", sleep: "#56655F", dizzy: "#9CFBE8", alert: "#FFB547", working: "#FFB547",
         sad: "#FF6B61", thinking: "#8FB8FF", party: "#FFE36B", rec: "#FF4D4D", yawn: "#56655F", dance: "#C58BFF" },
  confetti: ["#3FCBB0", "#FFB547", "#FF6B61", "#8FB8FF", "#FFE36B", "#C58BFF"],
};

class Miri {
  constructor() {
    this.base = "idle"; this.temp = null; this.tempUntil = 0;
    this.t = Math.random() * 10;
    this.press = new MiriSpring(0, 0.3, 0.42);
    this.lookX = new MiriSpring(0, 0.35, 0.8);
    this.lookY = new MiriSpring(0, 0.35, 0.8);
    this.hop = new MiriSpring(0, 0.28, 0.35);   // salto con cada golpe de la música
    this.pointer = null; this.nextBlink = 2 + Math.random() * 3; this.blink = 0;
    this.pokes = []; this.nextWander = 1.5; this.bits = [];
    this.accessory = ""; this.night = false; this.nextYawn = 20 + Math.random() * 20;
  }
  setState(s) { if (this.base !== s) { this.base = s; } }
  get mood() { return this.temp && this.t < this.tempUntil ? this.temp : this.base; }
  lookAt(x, y) { this.pointer = x == null ? null : [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))]; }
  react(s, secs) { this.temp = s; this.tempUntil = this.t + secs; this.reactStart = this.t; }

  /** Un golpe de la música: salta (si está bailando) y suelta una notita. */
  beat() {
    this.hop.velocity -= 9;
    if (this.mood === "dance" && Math.random() < 0.6)
      this.bits.push({ kind: "note", x: 20 + Math.random() * 60, y: 20, vx: (Math.random() - 0.5) * 16, vy: -22, age: 0, life: 1.3 });
  }

  poke() {
    this.press.value = Math.max(this.press.value, 0.2);
    this.press.velocity = 9;
    this.pokes = this.pokes.filter(p => this.t - p < 2);
    this.pokes.push(this.t);
    if (this.pokes.length >= 5) { this.react("dizzy", 2.6); this.pokes = []; }
    else if (this.mood !== "dizzy") {
      this.react("happy", 1.3);
      for (let i = 0; i < 6; i++) this.bits.push({ kind: "px", x: 50, y: 30, vx: (Math.random() - 0.5) * 70, vy: -30 - Math.random() * 40, age: 0, life: 0.7 });
    }
  }

  step(dt) {
    this.t += dt;
    const m = this.mood;
    this.press.step(dt);
    this.hop.step(dt);
    let tx = 0, ty = 0;
    if (m === "working") { tx = Math.sin(this.t * 3); ty = 0.2; }
    else if (m === "thinking") { tx = Math.sin(this.t * 0.8) * 0.5; ty = -0.9; }
    else if (m === "sleep" || m === "dizzy" || m === "yawn") { ty = 0.3; }
    else if (m === "dance") { tx = Math.sin(this.t * 4) * 0.7; ty = -0.2; }
    else if (this.pointer) { [tx, ty] = this.pointer; }
    else {
      this.nextWander -= dt;
      if (this.nextWander <= 0) { this.wander = [Math.random() * 1.6 - 0.8, Math.random() * 0.8 - 0.4]; this.nextWander = 1.5 + Math.random() * 2.5; }
      if (this.wander) [tx, ty] = this.wander;
    }
    this.lookX.target = tx; this.lookY.target = ty;
    this.lookX.step(dt); this.lookY.step(dt);

    this.nextBlink -= dt;
    if (this.nextBlink <= 0) { this.blinkT = 0; this.nextBlink = Math.random() < 0.2 ? 0.25 : 2.5 + Math.random() * 3.5; }
    if (this.blinkT != null) {
      this.blinkT += dt;
      const k = this.blinkT / 0.16;
      this.blink = k < 0.5 ? k * 2 : Math.max(0, 2 - k * 2);
      if (k >= 1) { this.blinkT = null; this.blink = 0; }
    }
    // De noche, quieto, bosteza cada tanto.
    if (this.night && this.base === "idle" && !this.temp) {
      this.nextYawn -= dt;
      if (this.nextYawn <= 0) { this.react("yawn", 1.8); this.nextYawn = 25 + Math.random() * 30; }
    }
    if (m === "sleep") {
      this.zzT = (this.zzT || 0) + dt;
      if (this.zzT > 1.1) { this.zzT = 0; this.bits.push({ kind: "z", x: 64, y: 22, vx: 8, vy: -14, age: 0, life: 2.2 }); }
    }
    if (m === "party") {
      this.cfT = (this.cfT || 0) + dt;
      if (this.cfT > 0.07) { this.cfT = 0; this.bits.push({ kind: "cf", x: 10 + Math.random() * 80, y: -4, vx: (Math.random() - 0.5) * 30, vy: 10 + Math.random() * 20, age: 0, life: 1.4, color: MIRI.confetti[(Math.random() * 6) | 0] }); }
    }
    for (const b of this.bits) {
      b.age += dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.kind === "px") b.vy += 160 * dt;
      if (b.kind === "cf") b.vy += 40 * dt;
    }
    this.bits = this.bits.filter(b => b.age < b.life);
    if (this.temp && this.t >= this.tempUntil) this.temp = null;
  }
}

function miriRR(x, X, Y, W, H, R) {
  R = Math.min(R, W / 2, H / 2);
  x.beginPath();
  x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R);
  x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
}

/** Accesorios que van detrás de la antena (gorra, corona, gorrito, vincha de los auriculares). */
function miriBackAccessory(x, id, top) {
  x.save();
  if (id === "cap") {
    x.fillStyle = "#E74C3C";
    x.beginPath(); x.moveTo(27, top + 5); x.quadraticCurveTo(28, top - 9, 50, top - 9); x.quadraticCurveTo(72, top - 9, 73, top + 5); x.closePath(); x.fill();
    x.fillStyle = "#C0392B"; miriRR(x, 62, top + 1, 28, 5, 2.5); x.fill();
    x.fillStyle = "#FFFFFF"; x.beginPath(); x.arc(50, top - 8.5, 1.8, 0, Math.PI * 2); x.fill();
  } else if (id === "crown") {
    x.fillStyle = "#FFC93C"; x.strokeStyle = "#E0A100"; x.lineWidth = 1.2; x.lineJoin = "round";
    x.beginPath(); x.moveTo(30, top + 4); x.lineTo(30, top - 8); x.lineTo(38, top - 2); x.lineTo(44, top - 12); x.lineTo(50, top - 3);
    x.lineTo(56, top - 12); x.lineTo(62, top - 2); x.lineTo(70, top - 8); x.lineTo(70, top + 4); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = "#FF6B61"; x.beginPath(); x.arc(44, top - 1, 1.8, 0, Math.PI * 2); x.arc(56, top - 1, 1.8, 0, Math.PI * 2); x.fill();
  } else if (id === "partyhat") {
    x.fillStyle = "#8FB8FF";
    x.beginPath(); x.moveTo(24, top + 5); x.lineTo(40, top + 5); x.lineTo(30, top - 20); x.closePath(); x.fill();
    x.strokeStyle = "#FFE36B"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(26, top - 1); x.lineTo(37, top - 3); x.moveTo(28, top - 9); x.lineTo(34, top - 10); x.stroke();
    x.fillStyle = "#FF6B61"; x.beginPath(); x.arc(30, top - 21, 3, 0, Math.PI * 2); x.fill();
  } else if (id === "headphones") {
    x.strokeStyle = "#2B2F36"; x.lineWidth = 4; x.lineCap = "round";
    x.beginPath(); x.moveTo(14, top + 16); x.quadraticCurveTo(14, top - 14, 50, top - 14); x.quadraticCurveTo(86, top - 14, 86, top + 16); x.stroke();
  }
  x.restore();
}

/** Accesorios que van delante (moño, auriculares). Los anteojos van con los ojos. */
function miriFrontAccessory(x, id, top) {
  x.save();
  if (id === "bow") {
    x.fillStyle = "#FF6B9A";
    x.beginPath(); x.moveTo(74, top + 2); x.lineTo(64, top - 5); x.lineTo(64, top + 9); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(74, top + 2); x.lineTo(84, top - 5); x.lineTo(84, top + 9); x.closePath(); x.fill();
    x.fillStyle = "#E0457A"; x.beginPath(); x.arc(74, top + 2, 3, 0, Math.PI * 2); x.fill();
  } else if (id === "headphones") {
    x.fillStyle = "#2B2F36"; miriRR(x, 8, top + 10, 11, 20, 5); x.fill(); miriRR(x, 81, top + 10, 11, 20, 5); x.fill();
    x.fillStyle = MIRI.body; miriRR(x, 10, top + 14, 4, 12, 2); x.fill(); miriRR(x, 86, top + 14, 4, 12, 2); x.fill();
  }
  x.restore();
}

function drawMiri(x, m, W, H) {
  const s = Math.min(W, H) / 100, t = m.t, mood = m.mood, p = Math.max(-0.3, Math.min(1, m.press.value));
  x.save();
  x.clearRect(0, 0, W, H);
  x.translate((W - 100 * s) / 2, (H - 100 * s) / 2);
  x.scale(s, s);

  let bob = Math.sin(t * 2.2) * 1.6;
  if (mood === "sleep") bob = Math.sin(t * 1.1) * 0.8;
  if (mood === "happy") bob = -Math.abs(Math.sin(t * 7)) * 4;
  if (mood === "alert") bob = Math.sin(t * 14) * 0.7;
  if (mood === "party") bob = -Math.abs(Math.sin(t * 8)) * 7;
  if (mood === "dance") bob = Math.sin(t * 4) * 1.2;
  bob += Math.min(0, m.hop.value) * 1.2 + Math.max(0, m.hop.value) * 0.4;
  const lift = -bob;

  x.fillStyle = MIRI.shadow;
  x.beginPath(); x.ellipse(50, 92, Math.max(8, 30 - lift * 1.2), Math.max(1, 4 - lift * 0.15), 0, 0, Math.PI * 2); x.fill();

  x.translate(0, bob);
  const rot = mood === "dizzy" ? Math.sin(t * 6) * 0.14 : mood === "sad" ? -0.05 : mood === "party" ? Math.sin(t * 8) * 0.08 : mood === "dance" ? Math.sin(t * 4) * 0.12 : 0;
  if (rot) { x.translate(50, 88); x.rotate(rot); x.translate(-50, -88); }
  // Bostezo: se estira para arriba y vuelve.
  if (mood === "yawn") {
    const k = Math.sin(Math.min(1, (t - (m.reactStart || t)) / 1.8) * Math.PI);
    x.translate(50, 88); x.scale(1 - 0.03 * k, 1 + 0.08 * k); x.translate(-50, -88);
  }

  x.fillStyle = MIRI.feet;
  miriRR(x, 28, 82, 12, 8, 3); x.fill();
  miriRR(x, 60, 82, 12, 8, 3); x.fill();

  const sq = 1 + 0.05 * p, dip = 7 * p;
  x.translate(50, 84); x.scale(sq, 1); x.translate(-50, -84);
  x.fillStyle = MIRI.side; miriRR(x, 13, 30 + dip, 74, 55 - dip, 15); x.fill();
  x.fillStyle = MIRI.sideDark; miriRR(x, 13, 70, 74, 15, 12); x.fill();
  x.fillStyle = MIRI.side; x.fillRect(13, 66, 74, 8);
  const top = 22 + dip;
  const g = x.createLinearGradient(0, top, 0, top + 52);
  g.addColorStop(0, MIRI.top); g.addColorStop(1, MIRI.body);
  x.fillStyle = g; miriRR(x, 17, top, 66, 52, 13); x.fill();

  if (m.accessory) miriBackAccessory(x, m.accessory, top);

  let sway = Math.sin(t * 1.7) * 2 + m.lookX.value * 2 - m.press.velocity * 0.15;
  if (mood === "dizzy") sway = Math.sin(t * 9) * 6;
  if (mood === "dance") sway = Math.sin(t * 8) * 4;
  const ax = 50 + sway, ay = top - 12 + (mood === "yawn" ? 3 : 0);
  x.strokeStyle = MIRI.sideDark; x.lineWidth = 2.4; x.lineCap = "round";
  x.beginPath(); x.moveTo(50, top + 1); x.quadraticCurveTo(50, ay + 6, ax, ay); x.stroke();
  let led = MIRI.led[mood] || MIRI.led.idle, glow = 1;
  if (mood === "alert" || mood === "rec") glow = Math.sin(t * (mood === "rec" ? 5 : 10)) > 0 ? 1 : 0.35;
  if (mood === "working") glow = 0.55 + 0.45 * Math.sin(t * 5);
  if (mood === "sleep" || mood === "yawn") glow = 0.4;
  if (mood === "thinking") glow = 0.5 + 0.5 * Math.sin(t * 2.5);
  if (mood === "dance") led = MIRI.confetti[Math.floor(t * 4) % MIRI.confetti.length];
  x.save();
  x.shadowColor = led; x.shadowBlur = 8 * glow * s;
  x.globalAlpha = 0.45 + 0.55 * glow;
  x.fillStyle = led;
  x.beginPath(); x.arc(ax, ay, 4.2, 0, Math.PI * 2); x.fill();
  x.restore();

  const sy = top + 9;
  x.fillStyle = MIRI.screen; miriRR(x, 25, sy, 50, 30, 9); x.fill();
  x.fillStyle = "rgba(255,255,255,0.05)"; miriRR(x, 27, sy + 2, 46, 8, 6); x.fill();

  const lx = m.lookX.value * 5, ly = m.lookY.value * 3;
  const ey = sy + 15 + ly;
  x.save();
  x.beginPath(); miriRR(x, 25, sy, 50, 30, 9); x.clip();
  x.shadowColor = MIRI.eye; x.shadowBlur = 6 * s;
  x.fillStyle = x.strokeStyle = MIRI.eye;
  x.lineWidth = 2.6; x.lineCap = "round"; x.lineJoin = "round";
  for (let i = 0; i < 2; i++) {
    const cx = (i === 0 ? 40 : 60) + lx, dir = i === 0 ? -1 : 1;
    if (mood === "happy" || mood === "party" || mood === "dance") {
      x.beginPath(); x.moveTo(cx - 5, ey + 2); x.lineTo(cx, ey - 3); x.lineTo(cx + 5, ey + 2); x.stroke();
    } else if (mood === "sleep") {
      x.beginPath(); x.moveTo(cx - 5, ey + 3); x.quadraticCurveTo(cx, ey + 6, cx + 5, ey + 3); x.stroke();
    } else if (mood === "yawn") {
      x.beginPath(); x.moveTo(cx - 5, ey + 1); x.lineTo(cx + 5, ey + 1); x.stroke();
    } else if (mood === "dizzy") {
      x.save(); x.translate(cx, ey); x.rotate(t * 4 * dir);
      x.beginPath(); x.moveTo(-4, -4); x.lineTo(4, 4); x.moveTo(4, -4); x.lineTo(-4, 4); x.stroke();
      x.restore();
    } else if (mood === "alert") {
      x.beginPath(); x.arc(cx, ey, 5.2, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(cx, ey, 1.6, 0, Math.PI * 2); x.fill();
    } else if (mood === "sad") {
      const h = 7 * (1 - m.blink) + 1;
      miriRR(x, cx - 3.5, ey + 2 - h / 2, 7, h, 2.5); x.fill();
      x.beginPath(); x.moveTo(cx - 4 * dir, ey - 8.5); x.lineTo(cx + 4 * dir, ey - 5.5); x.stroke();
    } else {
      const h = 11 * (1 - m.blink) + 1.2;
      miriRR(x, cx - 3.8, ey - h / 2, 7.6, h, 3); x.fill();
    }
  }
  x.shadowBlur = 0;
  if (mood === "working") {
    x.globalAlpha = 0.5;
    const w = 18, at = ((t * 0.8) % 1) * (40 - w);
    miriRR(x, 30 + at, sy + 25, w, 2.4, 1.2); x.fill();
    x.globalAlpha = 1;
  }
  if (mood === "thinking") {
    for (let i = 0; i < 3; i++) {
      x.globalAlpha = 0.25 + 0.75 * Math.max(0, Math.sin(t * 4 - i * 0.9));
      miriRR(x, 43 + i * 6, sy + 24, 2.6, 2.6, 1.3); x.fill();
    }
    x.globalAlpha = 1;
  }
  if (mood === "rec") {
    // grabando: punto rojo que titila y "REC" chiquito
    x.globalAlpha = Math.sin(t * 5) > 0 ? 1 : 0.3;
    x.fillStyle = "#FF4D4D"; x.beginPath(); x.arc(31, sy + 6, 2.4, 0, Math.PI * 2); x.fill();
    x.globalAlpha = 1;
    x.font = "700 6px system-ui, sans-serif"; x.fillText("REC", 35, sy + 8.2);
  }
  x.restore();
  if (m.accessory === "glasses") {
    // lentes oscuros con marco claro (si no, se pierden contra la pantallita)
    x.fillStyle = "#05070A"; x.strokeStyle = "#D5DEE2"; x.lineWidth = 1.4;
    miriRR(x, 31 + lx, ey - 6, 16, 11, 4); x.fill(); x.stroke();
    miriRR(x, 53 + lx, ey - 6, 16, 11, 4); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(47 + lx, ey - 2.5); x.lineTo(53 + lx, ey - 2.5); x.stroke();
    x.strokeStyle = "rgba(255,255,255,0.35)"; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(35 + lx, ey - 3); x.lineTo(39 + lx, ey - 3); x.moveTo(56 + lx, ey - 3); x.lineTo(60 + lx, ey - 3); x.stroke();
  }
  if (m.accessory) miriFrontAccessory(x, m.accessory, top);
  x.restore();

  x.save();
  x.translate((W - 100 * s) / 2, (H - 100 * s) / 2);
  x.scale(s, s);
  for (const b of m.bits) {
    x.globalAlpha = Math.max(0, 1 - b.age / b.life);
    if (b.kind === "z" || b.kind === "note") {
      x.fillStyle = b.kind === "note" ? MIRI.confetti[(b.x | 0) % 6] : MIRI.eye;
      x.font = `700 ${(b.kind === "note" ? 10 : 8) + b.age * 3}px system-ui, sans-serif`;
      x.fillText(b.kind === "note" ? "♪" : "z", b.x, b.y);
    } else if (b.kind === "cf") {
      x.save(); x.translate(b.x, b.y); x.rotate(b.age * 6 + b.x);
      x.fillStyle = b.color; x.fillRect(-2, -1.2, 4, 2.4);
      x.restore();
    } else {
      x.fillStyle = MIRI.eye; x.fillRect(b.x - 1.6, b.y - 1.6, 3.2, 3.2);
    }
  }
  x.restore();
}

/** Miri viva dentro de un <canvas>: se anima sola, mira el puntero y se hunde al tocarla. */
class MiriView {
  constructor(canvas, { interactive = true } = {}) {
    this.canvas = canvas; this.miri = new Miri(); this.last = 0; this.running = true;
    if (interactive) {
      canvas.addEventListener("pointerdown", e => { this.miri.poke(); this.look(e); });
      canvas.addEventListener("pointermove", e => this.look(e));
      canvas.addEventListener("pointerleave", () => this.miri.lookAt(null));
    }
    const frame = now => {
      if (!this.running) return;
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
      this.last = now;
      if (this.canvas.isConnected) {
        const r = this.canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
        if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
        this.miri.night = new Date().getHours() >= 23 || new Date().getHours() < 6;
        this.miri.step(dt);
        drawMiri(this.canvas.getContext("2d"), this.miri, w, h);
      } else if (!document.contains(this.canvas)) { this.running = false; return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  look(e) {
    const r = this.canvas.getBoundingClientRect();
    this.miri.lookAt((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
  }
}
