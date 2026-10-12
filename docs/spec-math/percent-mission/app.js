'use strict';

/* =====================================================================
   Общие помощники
   ===================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const center = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

function store(key, val) {
  try {
    if (val === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, val);
  } catch {
    return null;
  }
  return null;
}

// «3,06», «21/4», «5 1/4», «25%» → число; иначе NaN
function parseNum(s) {
  s = s.trim().replace(/\s*%$/, '').replace(/\s+/g, ' ').replace(/,/g, '.').replace(/−/g, '-');
  let m = s.match(/^(\d+) (\d+)\/(\d+)$/);
  if (m) return +m[1] + +m[2] / +m[3];
  m = s.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)$/);
  if (m) return +m[1] / +m[2];
  if (/^-?\d*\.?\d+$/.test(s)) return +s;
  return NaN;
}
const same = (x, v) => Math.abs(x - v) < 1e-9 * Math.max(1, Math.abs(v));

// Дроби в тексте: {3/8} → дробь, {7 3/8} → смешанное число
const tx = (s) =>
  s.replace(/\{(?:(\d+) )?([^{}/]+)\/([^{}/]+)\}/g, (_, w, a, b) =>
    `<span class="ifm">${w || ''}<span class="ifr"><span>${a}</span><span>${b}</span></span></span>`);

/* =====================================================================
   Звук: всё синтезируется на лету через Web Audio, файлов нет
   ===================================================================== */

const Sound = (() => {
  let ctx = null;
  let master = null;
  let noise = null;
  let drone = null;
  let on = store('pm-sound') !== '0';

  function ac() {
    if (!on) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(comp).connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function env(g, t, peak, dur, attack = 0.008) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
  }

  function tone(type, f0, f1, t, dur, peak) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, peak, dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function hiss(t, dur, peak, f0, f1, type = 'lowpass', q = 0.7) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    env(g, t, peak, dur);
    s.connect(f).connect(g).connect(master);
    s.start(t);
    s.stop(t + dur + 0.1);
  }

  return {
    get on() {
      return on;
    },
    toggle() {
      if (on) this.drone(false);
      on = !on;
      store('pm-sound', on ? '1' : '0');
      return on;
    },
    boom(p = 1) {
      if (!ac()) return;
      const t = ctx.currentTime;
      hiss(t, 0.5 + 0.6 * p, 0.9, 2600, 50);
      tone('sine', 150, 34, t, 0.45 + 0.4 * p, 0.9);
    },
    launch() {
      if (!ac()) return;
      const t = ctx.currentTime;
      hiss(t, 0.55, 0.35, 400, 3500, 'bandpass', 1.4);
      tone('sawtooth', 160, 820, t, 0.5, 0.06);
    },
    hit() {
      if (!ac()) return;
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone('triangle', f, f, t + i * 0.07, 0.3, 0.22));
    },
    miss() {
      if (!ac()) return;
      tone('square', 190, 70, ctx.currentTime, 0.35, 0.1);
    },
    beep(f = 880) {
      if (!ac()) return;
      tone('sine', f, f, ctx.currentTime, 0.16, 0.3);
    },
    whoosh() {
      if (!ac()) return;
      hiss(ctx.currentTime, 1.3, 0.45, 7000, 180, 'bandpass', 2);
    },
    fanfare() {
      if (!ac()) return;
      const t = ctx.currentTime;
      [[392, 0], [523.25, 0.12], [659.25, 0.24], [783.99, 0.36], [1046.5, 0.5]].forEach(([f, d]) =>
        tone('triangle', f, f, t + d, d === 0.5 ? 1.2 : 0.25, 0.22));
      [261.63, 329.63, 392].forEach((f) => tone('sawtooth', f, f, t + 0.5, 1.2, 0.04));
    },
    // «БРААМ» из кинотрейлеров: низкие расстроенные пилы и фильтр, который распахивается и закрывается
    braam(len = 2.6) {
      if (!ac()) return;
      const t = ctx.currentTime;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(140, t);
      f.frequency.exponentialRampToValueAtTime(1500, t + 0.22);
      f.frequency.exponentialRampToValueAtTime(110, t + len);
      const g = ctx.createGain();
      env(g, t, 0.55, len, 0.06);
      f.connect(g).connect(master);
      for (const fr of [41.2, 41.7, 82.4, 61.7, 123.5]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = fr;
        o.connect(f);
        o.start(t);
        o.stop(t + len + 0.1);
      }
      hiss(t, 0.7, 0.5, 900, 60);
    },
    drone(start) {
      if (!start) {
        if (drone && ctx) {
          const d = drone;
          d.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
          setTimeout(() => d.os.forEach((o) => o.stop()), 2500);
        }
        drone = null;
        return;
      }
      if (drone || !ac()) return;
      const t = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 2.5);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 280;
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.09;
      lg.gain.value = 140;
      lfo.connect(lg).connect(f.frequency);
      f.connect(g).connect(master);
      const os = [55, 55.35, 82.4, 110.2].map((fr) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = fr;
        o.connect(f);
        o.start(t);
        return o;
      });
      lfo.start(t);
      os.push(lfo);
      drone = { g, os };
    },
  };
})();

/* =====================================================================
   Звёздное небо: полёт сквозь звёзды. Скорость растёт при прокрутке
   и во время «прыжка» (warp) — тогда звёзды тянутся в полосы.
   ===================================================================== */

const Space = (() => {
  const cv = $('#space');
  const ctx = cv.getContext('2d');
  const COLORS = ['255,255,255', '255,255,255', '255,255,255', '190,215,255', '255,200,230', '255,232,190'];
  let w = 0;
  let h = 0;
  let f = 0;
  let stars = [];
  let base = 1;
  let speed = 1;
  let boost = 0;
  let warpPeak = 0;
  let warpUntil = 0;
  let last = 0;

  const mk = (z) => ({ x: rnd(-1.3, 1.3), y: rnd(-1.3, 1.3), z: z ?? rnd(0.05, 1), c: pick(COLORS), ph: rnd(0, 6.3) });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    f = Math.max(w, h) * 0.5;
    const n = Math.round(Math.min(480, Math.max(160, (w * h) / 3200)));
    while (stars.length < n) stars.push(mk());
    stars.length = n;
    if (REDUCED) draw(0, 0);
  }

  function draw(step, t) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const streak = step > 0.0025;
    for (const s of stars) {
      s.z -= step;
      if (s.z <= 0.03) {
        Object.assign(s, mk(1));
        continue;
      }
      const x = cx + (s.x / s.z) * f;
      const y = cy + (s.y / s.z) * f;
      if (x < -40 || x > w + 40 || y < -40 || y > h + 40) {
        Object.assign(s, mk(1));
        continue;
      }
      const tw = streak ? 1 : 0.7 + 0.3 * Math.sin(t * 0.003 + s.ph);
      const a = Math.min(1, (1.05 - s.z) * 1.3) * tw;
      const size = (1 - s.z) * 2.3 + 0.4;
      if (streak) {
        const z2 = s.z + step * 9;
        ctx.strokeStyle = `rgba(${s.c},${a})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(cx + (s.x / z2) * f, cy + (s.y / z2) * f);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${s.c},${a})`;
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  function loop(t) {
    const dt = Math.max(0, Math.min(3, (t - last) / 16.67 || 1));
    last = t;
    const target = (t < warpUntil ? warpPeak : base) + boost;
    speed += (target - speed) * (1 - Math.pow(0.93, dt));
    boost *= Math.pow(0.94, dt);
    draw(0.00022 * speed * dt, t);
    requestAnimationFrame(loop);
  }

  let lastY = scrollY;
  addEventListener('scroll', () => {
    boost = Math.min(14, boost + Math.abs(scrollY - lastY) * 0.03);
    lastY = scrollY;
  }, { passive: true });
  addEventListener('resize', resize);
  resize();
  if (!REDUCED) requestAnimationFrame(loop);

  return {
    warp(ms = 1500, peak = 60) {
      warpPeak = peak;
      warpUntil = performance.now() + ms;
    },
    setBase(v) {
      base = v;
    },
  };
})();

/* =====================================================================
   Эффекты: искры, ударные волны, обломки цифр, ракеты, салют.
   Холст поверх страницы, координаты — как у getBoundingClientRect.
   ===================================================================== */

const FX = (() => {
  const cv = $('#fx');
  const ctx = cv.getContext('2d');
  const HOT = ['255,209,102', '255,160,70', '255,110,60', '255,240,200', '255,95,162'];
  let w = 0;
  let h = 0;
  let parts = [];
  let raf = 0;
  let last = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  function add(p) {
    if (REDUCED) return;
    p.age = 0;
    parts.push(p);
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  function loop(t) {
    const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
    last = t;
    ctx.clearRect(0, 0, w, h);
    const live = parts;
    parts = [];
    for (const p of live) {
      p.age += dt;
      if (p.age >= p.life) {
        p.end?.();
        continue;
      }
      p.step?.(dt);
      p.draw(ctx, p.age / p.life);
      parts.push(p);
    }
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!raf) ctx.clearRect(0, 0, w, h);
  }

  function spark(x, y, o = {}) {
    const a = o.angle ?? rnd(0, Math.PI * 2);
    const v = o.v ?? rnd(80, 520);
    add({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: o.life ?? rnd(0.5, 1.2), g: o.g ?? 0, drag: o.drag ?? 2.2,
      size: o.size ?? rnd(1.5, 3.5), color: o.color ?? pick(HOT),
      step(dt) {
        const k = Math.exp(-this.drag * dt);
        this.vx *= k;
        this.vy = this.vy * k + this.g * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
      },
      draw(c, k) {
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = `rgba(${this.color},${1 - k})`;
        c.lineWidth = this.size * (1 - k * 0.6);
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(this.x - this.vx * 0.035, this.y - this.vy * 0.035);
        c.lineTo(this.x, this.y);
        c.stroke();
      },
    });
  }

  function ring(x, y, o = {}) {
    add({
      life: o.life ?? 0.7, max: o.max ?? 160, color: o.color ?? '255,255,255', width: o.width ?? 6,
      draw(c, k) {
        const e = 1 - Math.pow(1 - k, 3);
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = `rgba(${this.color},${(1 - k) * 0.9})`;
        c.lineWidth = this.width * (1 - k) + 0.5;
        c.beginPath();
        c.arc(x, y, this.max * e, 0, Math.PI * 2);
        c.stroke();
      },
    });
  }

  function glow(x, y, o = {}) {
    add({
      life: o.life ?? 0.5, r: o.r ?? 90, color: o.color ?? '255,180,80',
      draw(c, k) {
        const r = this.r * (0.4 + k * 0.8);
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,255,255,${1 - k})`);
        g.addColorStop(0.3, `rgba(${this.color},${(1 - k) * 0.8})`);
        g.addColorStop(1, `rgba(${this.color},0)`);
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      },
    });
  }

  function flash(a = 0.3) {
    add({
      life: 0.28,
      draw(c, k) {
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = `rgba(255,240,220,${a * (1 - k)})`;
        c.fillRect(0, 0, w, h);
      },
    });
  }

  // Цифры и знаки сбитого выражения разлетаются, кувыркаясь
  function glyphs(rect, text) {
    const chars = [...text.replace(/\s+/g, '')].slice(0, 40);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    chars.forEach((ch, i) => {
      const x = rect.left + ((i + 0.5) / chars.length) * rect.width;
      const y = cy + rnd(-rect.height / 4, rect.height / 4);
      const a = Math.atan2(y - cy, x - cx) + rnd(-0.6, 0.6);
      const v = rnd(160, 480);
      add({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, rot: 0, vr: rnd(-9, 9),
        life: rnd(0.9, 1.5), size: rnd(18, 32), ch,
        step(dt) {
          this.vy += 560 * dt;
          this.vx *= Math.exp(-0.8 * dt);
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          this.rot += this.vr * dt;
        },
        draw(c, k) {
          c.globalCompositeOperation = 'source-over';
          c.save();
          c.translate(this.x, this.y);
          c.rotate(this.rot);
          c.globalAlpha = 1 - k;
          c.fillStyle = k < 0.12 ? '#ffffff' : '#ffd166';
          c.font = `${this.size}px "Times New Roman", serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(this.ch, 0, 0);
          c.restore();
        },
      });
    });
  }

  function explode(rect, text = '', power = 1) {
    if (REDUCED) return;
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    glow(x, y, { r: 70 + 70 * power });
    ring(x, y, { max: 110 + 120 * power, color: '255,220,150' });
    setTimeout(() => ring(x, y, { max: 60 + 200 * power, color: '76,201,240', width: 3, life: 0.9 }), 90);
    for (let i = 0; i < 70 * power; i++) {
      spark(x + rnd(-rect.width / 3, rect.width / 3), y + rnd(-rect.height / 3, rect.height / 3), { v: rnd(100, 300 + 500 * power) });
    }
    for (let i = 0; i < 14 * power; i++) spark(x, y, { color: '255,255,255', v: rnd(600, 1000), size: 1.3, life: rnd(0.3, 0.6), drag: 1 });
    if (text) glyphs(rect, text);
    flash(0.18 * power);
  }

  // Ракета летит по дуге и взрывается в цели
  function missile(from, to, dur = 0.6) {
    return new Promise((resolve) => {
      if (REDUCED) return resolve();
      const mx = (from.x + to.x) / 2 + rnd(-140, 140);
      const my = Math.min(from.y, to.y) - rnd(80, 180);
      add({
        life: dur, x: from.x, y: from.y, ang: -Math.PI / 2,
        step() {
          const e = Math.min(1, this.age / dur) ** 2;
          const u = 1 - e;
          const nx = u * u * from.x + 2 * u * e * mx + e * e * to.x;
          const ny = u * u * from.y + 2 * u * e * my + e * e * to.y;
          if (Math.hypot(nx - this.x, ny - this.y) > 0.5) this.ang = Math.atan2(ny - this.y, nx - this.x);
          this.x = nx;
          this.y = ny;
          for (let i = 0; i < 3; i++) {
            spark(this.x, this.y, {
              angle: this.ang + Math.PI + rnd(-0.35, 0.35), v: rnd(40, 170), life: rnd(0.2, 0.5),
              size: rnd(1.5, 3.2), color: pick(['255,160,60', '255,220,120', '255,100,60']), drag: 4,
            });
          }
        },
        draw(c) {
          c.globalCompositeOperation = 'source-over';
          c.save();
          c.translate(this.x, this.y);
          c.rotate(this.ang);
          c.fillStyle = '#ff5fa2';
          c.beginPath();
          c.moveTo(-8, -5); c.lineTo(-15, -10); c.lineTo(-4, -5);
          c.moveTo(-8, 5); c.lineTo(-15, 10); c.lineTo(-4, 5);
          c.fill();
          c.fillStyle = '#eef1ff';
          c.beginPath();
          c.moveTo(14, 0); c.quadraticCurveTo(8, -6, 0, -5); c.lineTo(-10, -5); c.lineTo(-10, 5); c.lineTo(0, 5); c.quadraticCurveTo(8, 6, 14, 0);
          c.fill();
          c.fillStyle = '#4cc9f0';
          c.beginPath();
          c.arc(3, 0, 2.2, 0, Math.PI * 2);
          c.fill();
          c.restore();
        },
        end: resolve,
      });
    });
  }

  function burst(x, y, col) {
    glow(x, y, { r: 70, color: col, life: 0.45 });
    const n = 90;
    for (let i = 0; i < n; i++) {
      spark(x, y, {
        angle: (i / n) * Math.PI * 2 + rnd(-0.05, 0.05), v: rnd(140, 300), g: 170, drag: 1.4,
        life: rnd(1, 1.7), color: Math.random() < 0.2 ? '255,255,255' : col, size: rnd(1.5, 2.8),
      });
    }
  }

  function firework(x, y, col) {
    if (REDUCED) return;
    const tx = x + rnd(-130, 130);
    const ty = Math.max(50, y - rnd(160, 320));
    col = col || pick(['76,201,240', '255,95,162', '255,209,102', '62,230,168', '155,93,229']);
    add({
      life: 0.7,
      step() {
        const k = this.age / this.life;
        const e = 1 - (1 - k) * (1 - k);
        spark(x + (tx - x) * e, y + (ty - y) * e, { v: rnd(10, 60), life: 0.35, size: 2, color: '255,220,160', drag: 3 });
      },
      draw() {},
      end: () => burst(tx, ty, col),
    });
  }

  // Пыль со всех сторон стягивается в точку — рождается планета
  function converge(x, y, col) {
    if (REDUCED) return Promise.resolve();
    for (let i = 0; i < 110; i++) {
      const a = rnd(0, Math.PI * 2);
      const r = rnd(140, 340);
      const sw = rnd(-1.4, 1.4);
      add({
        life: rnd(0.65, 0.95), size: rnd(1.5, 3.2), color: Math.random() < 0.3 ? '255,255,255' : col,
        draw(c, k) {
          const e = k * k * k;
          const ang = a + sw * e;
          const rr = r * (1 - e);
          const px = x + Math.cos(ang) * rr;
          const py = y + Math.sin(ang) * rr;
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = `rgba(${this.color},${0.3 + 0.7 * k})`;
          c.beginPath();
          c.arc(px, py, this.size, 0, Math.PI * 2);
          c.fill();
        },
      });
    }
    return sleep(950);
  }

  function shake(el, power = 1) {
    if (REDUCED || !el) return;
    const k = 8 * power;
    const frames = [];
    for (let i = 0; i < 7; i++) frames.push({ transform: `translate(${rnd(-k, k)}px, ${rnd(-k, k)}px)` });
    frames.push({ transform: 'none' });
    el.animate(frames, { duration: 450, easing: 'ease-out' });
  }

  function puff(x, y) {
    for (let i = 0; i < 18; i++) spark(x, y, { color: '160,170,210', v: rnd(40, 160), life: rnd(0.3, 0.6), size: 2 });
  }

  return { spark, ring, glow, flash, explode, missile, firework, burst, converge, shake, puff };
})();

/* =====================================================================
   Выражения: дерево узлов → HTML с настоящими дробями.
   Каждый шаг решения заменяет один помеченный узел (k) на результат.
   ===================================================================== */

const num = (v, k) => ({ t: 'n', v, k });
const mix = (w, nu, de, k) => ({ t: 'm', w, nu, de, k });
const op = (o, l, r, k) => ({ t: 'o', o, l, r, k });
const par = (x, k, br = '()') => ({ t: 'p', x, k, br });
const dfrac = (top, bot, k) => ({ t: 'd', top, bot, k });
const KIDS = ['l', 'r', 'x', 'top', 'bot'];

const hasFrac = (x) => x.t === 'm' || KIDS.some((c) => x[c] && hasFrac(x[c]));
// Высота скобки: сколько этажей дробей внутри
function pdepth(x) {
  let d = 0;
  for (const c of KIDS) if (x[c]) d = Math.max(d, pdepth(x[c]));
  return x.t === 'p' && hasFrac(x.x) ? d + 1 : d;
}

const xf = (a, b) => `<span class="x-f"><span>${a}</span><span>${b}</span></span>`;

function R(x) {
  let h;
  if (x.t === 'n') h = `<span class="x-n">${x.v}</span>`;
  else if (x.t === 'm') h = `<span class="x-n">${x.w}</span>${xf(x.nu, x.de)}`;
  else if (x.t === 'o') h = `${R(x.l)}<span class="x-op">${x.o}</span>${R(x.r)}`;
  else if (x.t === 'p') {
    const s = 1 + 0.55 * pdepth(x);
    const st = s > 1 ? ` style="--s:${s}"` : '';
    h = `<span class="x-br"${st}>${x.br[0]}</span>${R(x.x)}<span class="x-br"${st}>${x.br[1]}</span>`;
  } else h = `<span class="x-d"><span class="x-top">${R(x.top)}</span><span class="x-bot">${R(x.bot)}</span></span>`;
  return `<span class="x-g x-${x.t}"${x.k ? ` data-k="${x.k}"` : ''}>${h}</span>`;
}

const exprHTML = (letter, tree) =>
  `<div class="expr"><span class="x-lhs">${letter}</span><span class="x-eq">=</span>${R(tree)}</div>`;

function replace(x, k, r) {
  if (x.k === k) return r;
  const c = { ...x };
  for (const key of KIDS) if (x[key]) c[key] = replace(x[key], k, r);
  return c;
}

/* =====================================================================
   Данные миссий
   ===================================================================== */

const TREE_A = dfrac(
  op('−',
    op('·', par(op('−', mix(7, 3, 8), num('2,125')), 'a1'), mix(2, 2, 7), 'a2'),
    op(':', num('39,48'), num('5,6'), 'a3'),
    'a4'),
  op('−',
    op('·',
      op(':', par(op('−', op('·', num('3,4'), num('0,9'), 'a5'), num('2,7')), 'a6'), num('0,06'), 'a7'),
      mix(2, 2, 3), 'a8'),
    op('·', num('30,9'), num('0,5'), 'a9'),
    'a10'),
  'a11');

const TREE_B = dfrac(
  op('·',
    par(op('−',
      op('·', num('6,1'), num('3,05'), 'b1'),
      op('·', num('2,05'), par(op('+', mix(4, 3, 5), num('4,46')), 'b2'), 'b3')),
    'b4', '[]'),
    num('22,5'), 'b5'),
  op('·',
    op(':', par(op('+', op('+', mix(1, 1, 4), num('0,5'), 'b6'), mix(2, 1, 3)), 'b7'), mix(2, 1, 24), 'b8'),
    num('0,01'), 'b9'),
  'b10');

const MISSIONS = {
  a: {
    id: 'a', letter: 'A', value: 9, rgb: '76,201,240', tree: TREE_A,
    next: { href: '#b', label: 'К планете B →' },
    steps: [
      {
        k: 'a1', res: mix(5, 1, 4), val: 21 / 4,
        why: 'Сначала — действие в скобках.',
        aim: '{7 3/8} − 2,125',
        hint: '0,125 = {1/8}, значит, 2,125 = {2 1/8}.',
        log: '2,125 = {2 1/8}, потому что 0,125 = {1/8}. Тогда {7 3/8} − {2 1/8} = {5 2/8} = {5 1/4}.',
      },
      {
        k: 'a2', res: num('12'), val: 12,
        why: 'Скобки готовы. Теперь умножение: оно выполняется раньше вычитания.',
        aim: '{5 1/4} · {2 2/7}',
        hint: 'Переведи смешанные числа в неправильные дроби: {5 1/4} = {21/4}, {2 2/7} = {16/7}.',
        log: '{21/4} · {16/7} = {21 · 16/4 · 7} = {3 · 4/1 · 1} = 12. Сократили 21 и 7 на 7, 16 и 4 на 4.',
      },
      {
        k: 'a3', res: num('7,05'), val: 7.05,
        why: 'Деление тоже выполняется раньше вычитания.',
        aim: '39,48 : 5,6',
        hint: 'Перенеси запятую на один знак вправо в обоих числах: 394,8 : 56.',
        log: '39,48 : 5,6 = 394,8 : 56 = 7,05. Проверка: 56 · 7,05 = 394,8.',
      },
      {
        k: 'a4', res: num('4,95'), val: 4.95,
        why: 'В числителе осталось одно действие.',
        aim: '12 − 7,05',
        hint: '12 = 12,00',
        log: '12 − 7,05 = 4,95. <b>Числитель готов!</b>',
      },
      {
        k: 'a5', res: num('3,06'), val: 3.06,
        why: 'Переходим к знаменателю. В скобках умножение раньше вычитания.',
        aim: '3,4 · 0,9',
        hint: 'Умножь 34 · 9, а потом отсчитай справа 2 знака после запятой.',
        log: '34 · 9 = 306. У множителей 1 + 1 = 2 знака после запятой, значит, 3,4 · 0,9 = 3,06.',
      },
      {
        k: 'a6', res: num('0,36'), val: 0.36,
        why: 'Заканчиваем скобки.',
        aim: '3,06 − 2,7',
        hint: '2,7 = 2,70',
        log: '3,06 − 2,70 = 0,36.',
      },
      {
        k: 'a7', res: num('6'), val: 6,
        why: 'Деление и умножение стоят подряд — выполняем слева направо. Сначала деление!',
        aim: '0,36 : 0,06',
        hint: 'Перенеси запятую на два знака вправо в обоих числах: 36 : 6.',
        log: '0,36 : 0,06 = 36 : 6 = 6.',
      },
      {
        k: 'a8', res: num('16'), val: 16,
        why: 'Теперь умножение.',
        aim: '6 · {2 2/3}',
        hint: '{2 2/3} = {8/3}',
        log: '6 · {8/3} = {6 · 8/3} = {48/3} = 16.',
      },
      {
        k: 'a9', res: num('15,45'), val: 15.45,
        why: 'Ещё одно умножение — оно раньше вычитания.',
        aim: '30,9 · 0,5',
        hint: 'Умножить на 0,5 — всё равно что разделить пополам.',
        log: '30,9 · 0,5 = 30,9 : 2 = 15,45.',
      },
      {
        k: 'a10', res: num('0,55'), val: 0.55,
        why: 'Последнее действие в знаменателе.',
        aim: '16 − 15,45',
        hint: '16 = 16,00',
        log: '16 − 15,45 = 0,55. <b>Знаменатель готов!</b>',
      },
      {
        k: 'a11', res: num('9'), val: 9,
        why: 'Финал: дробная черта — это деление числителя на знаменатель.',
        aim: '{4,95/0,55}',
        hint: 'Перенеси запятые на два знака: 495 : 55.',
        log: '4,95 : 0,55 = 495 : 55 = 9. Проверка: 55 · 9 = 495. <b>A = 9</b>',
      },
    ],
  },
  b: {
    id: 'b', letter: 'B', value: 36, rgb: '255,95,162', tree: TREE_B,
    next: { href: '#dock', label: 'К стыковке →' },
    steps: [
      {
        k: 'b1', res: num('18,605'), val: 18.605,
        why: 'Начинаем с числителя. В квадратных скобках два умножения и вычитание — умножения первые.',
        aim: '6,1 · 3,05',
        hint: 'Умножь 61 · 305, потом отсчитай 1 + 2 = 3 знака после запятой.',
        log: '61 · 305 = 18 605. Знаков после запятой 1 + 2 = 3, значит, 6,1 · 3,05 = 18,605.',
      },
      {
        k: 'b2', res: num('9,06'), val: 9.06,
        why: 'Второе умножение пока нельзя: у него в множителе круглые скобки. Сначала они.',
        aim: '{4 3/5} + 4,46',
        hint: '{3/5} = 0,6, значит, {4 3/5} = 4,6.',
        log: '{4 3/5} = 4,6. Тогда 4,60 + 4,46 = 9,06.',
      },
      {
        k: 'b3', res: num('18,573'), val: 18.573,
        why: 'Теперь второе умножение.',
        aim: '2,05 · 9,06',
        hint: 'Умножь 205 · 906, потом отсчитай 2 + 2 = 4 знака после запятой.',
        log: '205 · 906 = 185 730. Отсчитываем 4 знака: 18,5730 = 18,573.',
      },
      {
        k: 'b4', res: num('0,032'), val: 0.032,
        why: 'Закрываем квадратные скобки.',
        aim: '18,605 − 18,573',
        hint: 'Числа почти равны, разность будет маленькой.',
        log: '18,605 − 18,573 = 0,032. Два больших числа почти уничтожили друг друга!',
      },
      {
        k: 'b5', res: num('0,72'), val: 0.72,
        why: 'Последнее действие числителя.',
        aim: '0,032 · 22,5',
        hint: 'Умножь 32 · 225, потом отсчитай 3 + 1 = 4 знака после запятой.',
        log: '32 · 225 = 7200. Отсчитываем 4 знака: 0,7200 = 0,72. <b>Числитель готов!</b>',
      },
      {
        k: 'b6', res: mix(1, 3, 4), val: 1.75,
        why: 'Знаменатель. Сначала скобки, внутри них — слева направо.',
        aim: '{1 1/4} + 0,5',
        hint: '0,5 = {1/2} = {2/4}',
        log: '{1 1/4} + {2/4} = {1 3/4}.',
      },
      {
        k: 'b7', res: mix(4, 1, 12), val: 49 / 12,
        why: 'Складываем дроби с разными знаменателями.',
        aim: '{1 3/4} + {2 1/3}',
        hint: 'Общий знаменатель 12: {3/4} = {9/12}, {1/3} = {4/12}. Ответ вводи смешанным числом через пробел: «4 1/12».',
        log: '{1 9/12} + {2 4/12} = {3 13/12} = {4 1/12}.',
      },
      {
        k: 'b8', res: num('2'), val: 2,
        why: '⚠️ Ловушка! Деление стоит левее умножения, значит, оно первое. Не умножай {2 1/24} на 0,01!',
        aim: '{4 1/12} : {2 1/24}',
        hint: '{4 1/12} = {49/12}, {2 1/24} = {49/24}. Делить на дробь — значит умножать на перевёрнутую.',
        log: '{49/12} : {49/24} = {49/12} · {24/49} = {24/12} = 2.',
      },
      {
        k: 'b9', res: num('0,02'), val: 0.02,
        why: 'Последнее действие знаменателя.',
        aim: '2 · 0,01',
        hint: 'Умножить на 0,01 — сдвинуть запятую на 2 знака влево.',
        log: '2 · 0,01 = 0,02. <b>Знаменатель готов!</b>',
      },
      {
        k: 'b10', res: num('36'), val: 36,
        why: 'Финальный удар: делим числитель на знаменатель.',
        aim: '{0,72/0,02}',
        hint: 'Перенеси запятые на два знака: 72 : 2.',
        log: '0,72 : 0,02 = 72 : 2 = 36. <b>B = 36</b>',
      },
    ],
  },
};

const found = { a: false, b: false };

/* =====================================================================
   Миссия: выражение, цель, ввод ответа, ракеты, журнал
   ===================================================================== */

const MISSES = [
  'Мимо! Пересчитай ещё раз.',
  'Промах! Проверь, где стоит запятая.',
  'Не попал. Открой подсказку 💡 или нажми «Вычислить».',
];

function Mission(root, d, onFound) {
  const steps = d.steps;
  const n = steps.length;
  const trees = [d.tree];
  steps.forEach((s, i) => {
    s.res.k = 'r' + s.k;
    trees.push(replace(trees[i], s.k, s.res));
  });

  root.innerHTML = `
    <div class="hud">
      <span data-r="idx"></span>
      <div class="fuel" aria-hidden="true"><i data-r="fuel"></i></div>
      <span class="stars" data-r="stars" title="Попадания без подсказки «Вычислить»"></span>
    </div>
    <div class="stage" data-r="stage"></div>
    <div class="console">
      <div data-r="aim-box">
        <p class="why" data-r="why"></p>
        <p class="aim"><span data-r="aim"></span><span class="aim-q">= ?</span></p>
        <details class="hint" data-r="hint-box"><summary>💡 Подсказка</summary><p data-r="hint"></p></details>
        <form class="shoot" data-r="form">
          <input data-r="input" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="например, 3,06 или 5 1/4" aria-label="Результат подсвеченного действия">
          <button class="btn" type="submit">🎯 Проверить</button>
          <button class="btn fire" type="button" data-r="fire">💥 Вычислить</button>
        </form>
      </div>
      <div data-r="done" hidden></div>
      <p class="verdict" data-r="verdict" aria-live="polite"></p>
      <div class="row-btns">
        <button class="btn ghost" type="button" data-r="back">← Назад</button>
        <button class="btn ghost" type="button" data-r="reset">⟲ Сначала</button>
      </div>
    </div>
    <details class="log" open><summary>Бортовой журнал <span data-r="log-n"></span></summary><ol data-r="log"></ol></details>`;

  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const stage = r('stage');
  const input = r('input');
  const verdict = r('verdict');
  const starsEl = r('stars');
  const stars = new Set();
  let pos = 0;
  let busy = false;

  function say(text, cls = '') {
    verdict.textContent = text;
    verdict.className = 'verdict ' + cls;
  }

  function render(born) {
    const done = pos === n;
    if (done) {
      stage.innerHTML = `<div class="found"><div class="planet planet-${d.id}"><span>${d.value}</span></div><p class="found-t"><i>${d.letter}</i> = ${d.value}</p></div>`;
      if (REDUCED || found[d.id]) stage.querySelector('.planet').classList.add('formed');
    } else {
      stage.innerHTML = exprHTML(d.letter, trees[pos]);
      stage.querySelector(`[data-k="${steps[pos].k}"]`).classList.add('target');
      if (born) stage.querySelector(`[data-k="r${born}"]`)?.classList.add('born');
      r('why').innerHTML = tx(steps[pos].why);
      r('aim').innerHTML = tx(steps[pos].aim);
      r('hint').innerHTML = tx(steps[pos].hint);
      r('hint-box').open = false;
      input.value = '';
    }
    r('aim-box').hidden = done;
    r('done').hidden = !done;
    if (done) paintDone();
    r('idx').innerHTML = done ? 'Все цели поражены' : `Цель <b>${pos + 1}</b> из ${n}`;
    r('fuel').style.width = (pos / n) * 100 + '%';
    starsEl.textContent = `⭐ ${stars.size}`;
    r('back').disabled = pos === 0;
    r('reset').disabled = pos === 0;

    const log = r('log');
    r('log-n').textContent = pos ? `· ${pos} из ${n}` : '';
    log.innerHTML = pos
      ? steps.slice(0, pos).map((s, i) => `
        <li class="${born && i === pos - 1 ? 'new' : ''}">
          <span class="num">${i + 1}</span>
          <div><b>${tx(s.aim)} = ${s.res.t === 'm' ? tx(`{${s.res.w} ${s.res.nu}/${s.res.de}}`) : s.res.v}</b>${stars.has(s.k) ? ' <span class="me">⭐ сам</span>' : ''}
          <p>${tx(s.log)}</p></div>
        </li>`).reverse().join('')
      : '<li class="log-empty">Здесь появится решение каждого сбитого действия.</li>';
  }

  function paintDone() {
    r('done').innerHTML = `
      <p class="done-t">🪐 Планета ${d.letter} найдена: ${d.letter} = ${d.value}</p>
      <p>Попаданий без кнопки «Вычислить»: ⭐ ${stars.size} из ${n}.${stars.size === n ? ' Идеальный полёт!' : ''}</p>
      ${found.a && found.b ? '<p>Обе планеты найдены — стыковка открыта!</p>' : ''}
      <a class="btn primary" href="${d.next.href}">${d.next.label}</a>`;
  }

  async function fire(byUser) {
    if (busy || pos >= n) return;
    busy = true;
    root.classList.add('busy');
    const s = steps[pos];
    const target = stage.querySelector(`[data-k="${s.k}"]`);
    const final = pos === n - 1;
    Sound.launch();
    await FX.missile(center(byUser ? input : r('fire')), center(target));
    FX.explode(target.getBoundingClientRect(), target.textContent, final ? 1.8 : 1);
    Sound.boom(final ? 1.7 : 1);
    if (byUser) stars.add(s.k);
    pos++;
    render(s.k);
    FX.shake(stage, final ? 1.6 : 1);
    if (byUser) {
      say('🎯 Точно в цель! +1 ⭐', 'good');
      starsEl.classList.remove('bump');
      void starsEl.offsetWidth;
      starsEl.classList.add('bump');
    } else {
      say('');
    }
    if (pos === n) await finale();
    busy = false;
    root.classList.remove('busy');
    if (byUser && pos < n) input.focus({ preventScroll: true });
  }

  async function finale() {
    const planet = stage.querySelector('.planet');
    const c = center(planet);
    if (!REDUCED && !found[d.id]) {
      Sound.whoosh();
      await FX.converge(c.x, c.y, d.rgb);
      Sound.braam(2.2);
      FX.ring(c.x, c.y, { max: 260, color: d.rgb, width: 8, life: 1 });
      FX.glow(c.x, c.y, { r: 160, color: d.rgb, life: 0.6 });
      FX.flash(0.35);
      for (let i = 0; i < 3; i++) setTimeout(() => FX.firework(c.x + rnd(-200, 200), c.y + 120), 300 + i * 350);
    }
    planet.classList.add('formed');
    found[d.id] = true;
    onFound();
    paintDone();
  }

  r('form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy || pos >= n) return;
    const v = parseNum(input.value);
    if (Number.isNaN(v)) {
      say('Введи число: например, 3,06 или 21/4 или 5 1/4.', 'bad');
      return;
    }
    if (same(v, steps[pos].val)) {
      Sound.hit();
      fire(true);
    } else {
      say(pick(MISSES), 'bad');
      Sound.miss();
      FX.shake(input, 0.6);
      const c = center(input);
      FX.puff(c.x, c.y);
    }
  });
  r('fire').addEventListener('click', () => fire(false));
  r('back').addEventListener('click', () => {
    if (busy || pos === 0) return;
    pos--;
    say('');
    render();
  });
  r('reset').addEventListener('click', () => {
    if (busy) return;
    pos = 0;
    stars.clear();
    say('');
    render();
  });

  render();
}

/* =====================================================================
   Стыковка: процентная линейка и три вопроса
   ===================================================================== */

const Dock = (() => {
  let open = false;
  const ruler = $('#ruler');
  const cellsA = $('#cells-a');
  const cellsB = $('#cells-b');

  const groups = (on, cls) => {
    let h = '';
    for (let g = 0; g < 4; g++) {
      h += `<span class="grp" style="grid-column:${g + 1}">`;
      for (let i = 0; i < 9; i++) h += `<i class="c ${g * 9 + i < on ? cls : 'ghost'}"></i>`;
      h += '</span>';
    }
    return h;
  };
  cellsA.innerHTML = groups(9, 'ca') + '<span class="gap-lbl" id="gap-lbl"></span>';
  cellsB.innerHTML = groups(36, 'cb');
  ruler.innerHTML = [0, 1, 2, 3, 4].map((i) => `<span class="tick" style="--i:${i}"><b></b></span>`).join('');

  const BASES = {
    b: {
      ticks: [0, 25, 50, 75, 100], va: '25%', vb: '100%', gap: '−27 = 75% от B',
      say: 'За 100% принимаем <b class="c-b">B = 36</b> — с ним сравниваем. Одна «девятка» — это 100% : 4 = 25%. A — одна девятка, значит, <b>A составляет 25% от B</b>. До B не хватает трёх девяток: <b>A меньше B на 75%</b>.',
    },
    a: {
      ticks: [0, 100, 200, 300, 400], va: '100%', vb: '400%', gap: '+27 = 300% от A',
      say: 'За 100% принимаем <b class="c-a">A = 9</b>. Теперь одна «девятка» — это целых 100%. B — четыре девятки, то есть 400% от A. Лишние три девятки — это 300%: <b>B больше A на 300%</b>.',
    },
  };

  function setBase(base, anim) {
    const cfg = BASES[base];
    $$('.tick', ruler).forEach((t, i) => {
      t.querySelector('b').textContent = cfg.ticks[i] + '%';
      t.classList.toggle('hundred', cfg.ticks[i] === 100);
    });
    $('#v-a').textContent = cfg.va;
    $('#v-b').textContent = cfg.vb;
    $('#gap-lbl').textContent = cfg.gap;
    $('#ruler-say').innerHTML = cfg.say;
    cellsA.classList.toggle('base', base === 'a');
    cellsB.classList.toggle('base', base === 'b');
    $$('[data-base]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.base === base)));
    if (anim) {
      ruler.classList.remove('flip');
      void ruler.offsetWidth;
      ruler.classList.add('flip');
      const c = center(base === 'a' ? cellsA : cellsB);
      Sound.whoosh();
      for (let i = 0; i < 30; i++) FX.spark(c.x + rnd(-150, 150), c.y, { color: base === 'a' ? '76,201,240' : '255,95,162', v: rnd(40, 200), life: 0.6 });
    }
  }
  $$('[data-base]').forEach((b) => b.addEventListener('click', () => setBase(b.dataset.base, true)));

  function update() {
    $('#dock-a').textContent = found.a || open ? '9' : '?';
    $('#dock-b').textContent = found.b || open ? '36' : '?';
    $('#dock-pa').classList.toggle('lit', found.a || open);
    $('#dock-pb').classList.toggle('lit', found.b || open);
    if (found.a && found.b && !open) unlock();
  }

  function unlock(celebrate) {
    open = true;
    update();
    $('#dock-lock').hidden = true;
    $('#dock-body').hidden = false;
    setBase('b');
    if (celebrate) {
      Sound.braam(2);
      for (const id of ['#dock-pa', '#dock-pb']) {
        const c = center($(id));
        FX.ring(c.x, c.y, { max: 180, color: id === '#dock-pa' ? '76,201,240' : '255,95,162' });
        FX.glow(c.x, c.y, { r: 120, color: id === '#dock-pa' ? '76,201,240' : '255,95,162' });
      }
    }
  }
  $('#dock-skip').addEventListener('click', () => unlock(true));

  const QS = {
    q1: {
      ans: 25,
      tips: [
        [400, 'Это B от A. А нам нужно A от B: делим A на B.'],
        [75, 'Это на сколько A меньше B. А сколько процентов A составляет от B?'],
        [0.25, 'Почти! 9 : 36 = 0,25 — это доля. Умножь на 100%.'],
      ],
    },
    q2: {
      ans: 75,
      tips: [
        [300, 'Это на сколько B больше A. Здесь «меньше, чем B» — значит, 100% = B.'],
        [25, 'Это сколько A составляет от B. А на сколько меньше? 100% − 25% = …'],
        [27, '27 — это разница в единицах, а не в процентах. Какую часть от B она составляет?'],
      ],
    },
    q3: {
      ans: 300,
      tips: [
        [75, 'Это ответ на вопрос «на сколько A меньше B». Здесь «больше, чем A» — значит, 100% = A.'],
        [400, 'B составляет 400% от A. А на сколько больше? 400% − 100% = …'],
        [27, '27 — это разница в единицах. Какую часть от A она составляет?'],
      ],
    },
  };

  $$('.q').forEach((q) => {
    const cfg = QS[q.dataset.q];
    const input = $('input', q);
    const out = $('.verdict', q);
    $('form', q).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = parseNum(input.value);
      if (Number.isNaN(v)) {
        out.textContent = 'Введи число процентов, например 40.';
        out.className = 'verdict bad';
        return;
      }
      if (same(v, cfg.ans)) {
        out.textContent = '🎆 Верно!';
        out.className = 'verdict good';
        const first = !q.classList.contains('solved');
        q.classList.add('solved');
        Sound.hit();
        const c = center(input);
        FX.firework(c.x, c.y);
        setTimeout(() => FX.firework(c.x + 60, c.y), 250);
        if (first && $$('.q.solved').length === 3) win();
      } else {
        const tip = cfg.tips.find(([x]) => same(v, x));
        out.textContent = tip ? tip[1] : 'Пока нет. Подумай, что здесь принимается за 100%.';
        out.className = 'verdict bad';
        Sound.miss();
        FX.shake(input, 0.6);
      }
    });
  });

  function win() {
    const el = $('#dock-win');
    el.hidden = false;
    setTimeout(() => {
      Sound.fanfare();
      Space.warp(1200, 25);
      for (let i = 0; i < 8; i++) {
        setTimeout(() => FX.firework(rnd(innerWidth * 0.15, innerWidth * 0.85), innerHeight * 0.95), i * 220);
      }
    }, 300);
  }

  return { update };
})();

/* =====================================================================
   Старт миссии: обратный отсчёт, ракета улетает, прыжок сквозь звёзды
   ===================================================================== */

let launching = false;

function countdown(text, cls = '') {
  const el = document.createElement('div');
  el.className = 'count';
  el.innerHTML = `<span class="${cls}">${text}</span>`;
  document.body.append(el);
  setTimeout(() => el.remove(), 1300);
}

async function launch() {
  if (REDUCED) {
    $('#task').scrollIntoView();
    return;
  }
  if (launching) return;
  launching = true;
  const box = $('#hero-rocket');
  const rocket = $('.rocket', box);
  for (const t of ['3', '2', '1']) {
    countdown(t);
    Sound.beep(660);
    FX.shake(rocket, 0.3);
    await sleep(850);
  }
  countdown('ПУСК!', 'go');
  Sound.beep(1320);
  Sound.boom(1.5);
  Sound.whoosh();
  box.classList.remove('back');
  box.classList.add('launch');
  Space.warp(2400, 70);
  const exhaust = setInterval(() => {
    const r = rocket.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.bottom - r.height * 0.1;
    for (let i = 0; i < 6; i++) {
      FX.spark(x, y, { angle: Math.PI / 2 + rnd(-0.5, 0.5), v: rnd(150, 450), life: rnd(0.4, 0.9), size: rnd(2, 4) });
    }
  }, 30);
  await sleep(1700);
  clearInterval(exhaust);
  $('#task').scrollIntoView({ behavior: 'smooth' });
  await sleep(1200);
  box.classList.remove('launch');
  box.classList.add('back');
  launching = false;
}

/* =====================================================================
   Трейлер: титры как в кино, голос (Web Speech), «БРААМ» и взрывы
   ===================================================================== */

const Trailer = (() => {
  const el = $('#trailer');
  const stage = $('#tl-stage');
  let run = 0;
  let opener = null;

  function voice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    const ru = vs.filter((v) => /^ru/i.test(v.lang));
    return ru.find((v) => /milena|yuri|google/i.test(v.name)) || ru[0] || null;
  }

  function speak(text) {
    return new Promise((res) => {
      if (!Sound.on || !text || !window.speechSynthesis) return res();
      const u = new SpeechSynthesisUtterance(text);
      const v = voice();
      if (v) u.voice = v;
      u.lang = 'ru-RU';
      u.rate = 0.9;
      u.pitch = 0.65;
      const t = setTimeout(done, 2000 + text.length * 110);
      function done() {
        clearTimeout(t);
        res();
      }
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    });
  }

  const boomCenter = (p = 1.2) => {
    const x = innerWidth / 2;
    const y = innerHeight / 2;
    FX.explode({ left: x - 120, top: y - 60, width: 240, height: 120 }, '', p);
    Sound.boom(p);
    FX.shake(stage, p);
  };

  const SCENES = [
    {
      anim: 'fade', min: 4200, say: 'В мире, где дроби захватили власть...',
      html: '<p class="tl-txt">В мире, где дроби<br>захватили власть…</p>',
      fx: () => Sound.braam(3.8),
    },
    {
      anim: 'drift', min: 4400, say: 'два числа прячутся за стеной вычислений.',
      html: () => `<div class="tl-formulas">${exprHTML('A', TREE_A)}${exprHTML('B', TREE_B)}</div><p class="tl-txt sm">…два числа прячутся за стеной вычислений.</p>`,
      fx: () => Sound.whoosh(),
    },
    { anim: 'slam', min: 1500, say: 'А.', html: '<div class="tl-huge c-a">A</div>', fx: () => boomCenter(1.3) },
    { anim: 'slam', min: 1800, say: 'И Бэ.', html: '<div class="tl-huge c-b">B</div>', fx: () => boomCenter(1.3) },
    {
      anim: 'slam', min: 1600, say: 'Смешанные дроби.',
      html: () => `<div class="tl-mid">${tx('{7 3/8}  {2 2/7}  {2 1/24}')}</div><p class="tl-txt sm">Смешанные дроби.</p>`,
      fx: () => boomCenter(0.6),
    },
    {
      anim: 'slam', min: 1600, say: 'Десятичные ловушки.',
      html: '<div class="tl-mid">2,125 · 0,06 · 39,48</div><p class="tl-txt sm">Десятичные ловушки.</p>',
      fx: () => boomCenter(0.6),
    },
    {
      anim: 'slam', min: 1800, say: 'Скобки внутри скобок.',
      html: '<div class="tl-mid">[ ( ( ) ) ]</div><p class="tl-txt sm">Скобки внутри скобок.</p>',
      fx: () => boomCenter(0.6),
    },
    { anim: 'fade', min: 2600, say: 'Одна ошибка в порядке действий...', html: '<p class="tl-txt">Одна ошибка в порядке действий —</p>' },
    {
      anim: 'slam', min: 2800, say: 'и всё взорвётся!', html: '<p class="tl-big c-bad">и всё взорвётся.</p>',
      fx: () => {
        boomCenter(2);
        Space.warp(900, 50);
        for (let i = 1; i < 5; i++) {
          setTimeout(() => {
            const x = rnd(innerWidth * 0.1, innerWidth * 0.9);
            const y = rnd(innerHeight * 0.2, innerHeight * 0.8);
            FX.explode({ left: x - 60, top: y - 40, width: 120, height: 80 }, '', 1);
            Sound.boom(1);
          }, i * 170);
        }
      },
    },
    {
      anim: 'fade', min: 2400, say: 'Но у тебя есть план.', html: '<p class="tl-txt">Но у тебя есть план.</p>',
      fx: () => Space.setBase(0.6),
    },
    {
      anim: 'list', min: 4600, say: 'Скобки. Умножение и деление. Сложение и вычитание.',
      html: '<ol class="tl-rules"><li>1. Скобки</li><li>2. Умножение и деление</li><li>3. Сложение и вычитание</li></ol>',
      fx: (id) => [0, 1000, 2000].forEach((d, i) => setTimeout(() => {
        if (id !== run) return;
        Sound.boom(0.5);
        Sound.beep([523, 659, 784][i]);
      }, d)),
    },
    {
      anim: 'fade', min: 5600, say: 'На сколько процентов А меньше, чем Бэ? И на сколько процентов Бэ больше, чем А?',
      html: '<p class="tl-txt">На сколько процентов <span class="c-a">A</span> меньше <span class="c-b">B</span>?</p><p class="tl-txt">На сколько процентов <span class="c-b">B</span> больше <span class="c-a">A</span>?</p>',
      fx: () => {
        Space.setBase(4);
        Space.warp(4500, 18);
      },
    },
    {
      anim: 'slam', min: 2800, say: 'Ответы... тебя удивят.', html: '<p class="tl-big">Ответы тебя удивят.</p>',
      fx: () => Sound.braam(2.5),
    },
    {
      anim: 'title', min: 0, say: 'Миссия «Процент». Уже на этой странице.',
      html: '<p class="tl-kick">Задача 14*</p><h2 class="tl-title">Миссия<br>«Процент»</h2><p class="tl-txt sm">Уже на этой странице</p><button class="btn primary big" type="button" id="tl-go">🚀 Начать миссию</button>',
      fx: () => {
        Sound.braam(4);
        Space.warp(1500, 60);
        for (let i = 0; i < 6; i++) {
          setTimeout(() => FX.firework(rnd(innerWidth * 0.1, innerWidth * 0.9), innerHeight * 0.9), 600 + i * 260);
        }
      },
    },
  ];

  async function play() {
    const id = ++run;
    opener = document.activeElement;
    document.body.classList.add('cinema');
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('on'));
    $('#tl-skip').focus();
    Sound.drone(true);
    Space.setBase(3);
    await sleep(900);
    for (const s of SCENES) {
      if (id !== run) return;
      stage.dataset.anim = REDUCED ? '' : s.anim;
      stage.innerHTML = typeof s.html === 'function' ? s.html() : s.html;
      s.fx?.(id);
      await Promise.all([speak(s.say), sleep(s.min)]);
    }
    if (id !== run) return;
    Sound.drone(false);
    $('#tl-go')?.focus();
  }

  function close(go) {
    run++;
    if (window.speechSynthesis) speechSynthesis.cancel();
    Sound.drone(false);
    Space.setBase(1);
    el.classList.remove('on');
    el.hidden = true;
    stage.innerHTML = '';
    document.body.classList.remove('cinema');
    if (go) $('#a').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
    else opener?.focus?.();
  }

  $('#tl-skip').addEventListener('click', () => close(false));
  stage.addEventListener('click', (e) => {
    if (e.target.closest('#tl-go')) close(true);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !el.hidden) close(false);
  });
  // Голоса в Chrome загружаются асинхронно — попросим список заранее
  if (window.speechSynthesis) speechSynthesis.getVoices();

  return { play };
})();

/* =====================================================================
   Запуск
   ===================================================================== */

$$('[data-tx]').forEach((el) => {
  el.innerHTML = tx(el.innerHTML);
});
$('#task-a').innerHTML = exprHTML('A', TREE_A);
$('#task-b').innerHTML = exprHTML('B', TREE_B);

Mission($('#mission-a'), MISSIONS.a, Dock.update);
Mission($('#mission-b'), MISSIONS.b, Dock.update);

$('#launch').addEventListener('click', launch);
$('#trailer-btn').addEventListener('click', () => Trailer.play());

const soundBtn = $('#sound-btn');
const paintSound = () => {
  soundBtn.textContent = Sound.on ? '🔊 Звук' : '🔇 Без звука';
  soundBtn.setAttribute('aria-pressed', String(Sound.on));
};
soundBtn.addEventListener('click', () => {
  Sound.toggle();
  paintSound();
  Sound.beep(990);
});
paintSound();
