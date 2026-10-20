'use strict';

/* =====================================================================
   Общие помощники: арифметика и кирпичики
   ===================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCED ? 0 : ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[rnd(0, arr.length - 1)];
// Склонение: 1 кирпичик, 2 кирпичика, 5 кирпичиков
function plural(n, one, few, many) { const m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return `${n} ${one}`; if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} ${few}`; return `${n} ${many}`; }
const bricks = (n) => plural(n, 'кирпичик', 'кирпичика', 'кирпичиков');

function gcd2(a, b) { while (b) [a, b] = [b, a % b]; return a; }
const gcdN = (arr) => arr.reduce(gcd2);
const lcm2 = (a, b) => (a / gcd2(a, b)) * b;
const lcmN = (arr) => arr.reduce(lcm2);
const prod = (f) => f.reduce((x, y) => x * y, 1);

function factorize(n) {
  const out = [];
  let m = n;
  for (let d = 2; d * d <= m; d++) while (m % d === 0) { out.push(d); m /= d; }
  if (m > 1) out.push(m);
  return out;
}
const isPrime = (n) => n > 1 && factorize(n).length === 1;
function divisors(n) { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; }
function counts(f) { const m = new Map(); f.forEach((p) => m.set(p, (m.get(p) || 0) + 1)); return m; }
function fromCounts(m) {
  const out = [];
  [...m.keys()].sort((a, b) => a - b).forEach((p) => { for (let i = 0; i < m.get(p); i++) out.push(p); });
  return out;
}
// Множители НОД: каждый простой берём меньшее число раз
function commonFactors(nums) {
  const cs = nums.map((n) => counts(factorize(n)));
  const m = new Map();
  for (const p of cs[0].keys()) { const k = Math.min(...cs.map((c) => c.get(p) || 0)); if (k) m.set(p, k); }
  return fromCounts(m);
}
// Множители НОК: каждый простой берём большее число раз
function unionFactors(nums) {
  const cs = nums.map((n) => counts(factorize(n)));
  const m = new Map();
  cs.forEach((c) => { for (const [p, k] of c) m.set(p, Math.max(m.get(p) || 0, k)); });
  return fromCounts(m);
}

const PRIME_CLASS = (p) => ([2, 3, 5, 7, 11, 13].includes(p) ? `p${p}` : 'px');
function brickHTML(p, cls = '', attrs = '') {
  return `<span class="brick ${PRIME_CLASS(p)} ${cls}" data-p="${p}" ${attrs}>${p}</span>`;
}
// Строка кирпичиков «2 · 2 · 3»; пустой набор — пунктирная единица
function rowHTML(f, cls = '') {
  if (!f.length) return '<span class="brick one" data-p="1">1</span>';
  return f.map((p, i) => (i ? '<span class="dot">·</span>' : '') + brickHTML(p, cls, `data-i="${i}"`)).join('');
}
const dotStr = (f) => (f.length ? f.join('·') : '1');
function powStr(f) {
  const m = counts(f);
  return [...m.keys()].sort((a, b) => a - b).map((p) => (m.get(p) > 1 ? `${p}<sup>${m.get(p)}</sup>` : `${p}`)).join('·');
}
function clampInt(el, min, max, def) {
  let v = parseInt(el.value, 10);
  if (!Number.isFinite(v)) v = def;
  v = Math.max(min, Math.min(max, v));
  el.value = v;
  return v;
}
function setResult(el, text, kind) {
  el.innerHTML = text;
  el.classList.remove('good', 'bad');
  if (kind) el.classList.add(kind);
}
function pulse(el, cls = 'pop') {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
// Перелёт клона кирпичика из src в dst (Web Animations API)
function fly(src, dst, ms = 600) {
  if (REDUCED || !src.animate) return Promise.resolve();
  const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
  const clone = src.cloneNode(true);
  clone.classList.add('fly');
  clone.classList.remove('dim', 'ghost', 'boxed', 'click', 'glow');
  clone.style.visibility = 'visible';
  clone.style.left = `${a.left}px`;
  clone.style.top = `${a.top}px`;
  clone.style.width = `${a.width}px`;
  clone.style.height = `${a.height}px`;
  document.body.appendChild(clone);
  const anim = clone.animate(
    [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width || 1})` }],
    { duration: ms, easing: 'cubic-bezier(.3,.9,.3,1)' }
  );
  return anim.finished.catch(() => {}).then(() => clone.remove());
}
function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* нет хранилища */ } }
function load(key, def) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? def; } catch (e) { return def; } }
function wirePresets(scope, onPair) {
  $$('[data-pair]', scope).forEach((b) => b.addEventListener('click', () => onPair(...b.dataset.pair.split(',').map(Number))));
}
function onEnter(inputs, fn) { inputs.forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') fn(); })); }

/* =====================================================================
   0. Шапка: два числа собираются из кирпичиков, общие защёлкиваются в НОД
   ===================================================================== */
(function hero() {
  const A = 60, B = 72;
  const rowA = $('#hero-a'), rowB = $('#hero-b'), rowG = $('#hero-g'), rowL = $('#hero-l');
  const note = $('#hero-note'), replay = $('#hero-replay');
  let run = 0;
  async function dropRow(row, n, f, id) {
    row.innerHTML = `<span class="lhs">${n} =</span>`;
    for (let i = 0; i < f.length; i++) {
      if (id !== run) return;
      row.insertAdjacentHTML('beforeend', (i ? '<span class="dot">·</span>' : '') + brickHTML(f[i], 'drop'));
      await sleep(150);
    }
  }
  async function play() {
    const id = ++run;
    replay.hidden = true;
    rowG.innerHTML = '<span class="lhs">НОД =</span>';
    rowL.innerHTML = '<span class="lhs">НОК =</span>';
    note.textContent = '';
    const fa = factorize(A), fb = factorize(B);
    await dropRow(rowA, A, fa, id);
    await dropRow(rowB, B, fb, id);
    await sleep(350);
    if (id !== run) return;
    // общие
    const common = commonFactors([A, B]), cc = counts(common);
    const mark = (row) => {
      const seen = new Map();
      return $$('.brick', row).filter((b) => { const p = +b.dataset.p; const k = seen.get(p) || 0; seen.set(p, k + 1); return k < (cc.get(p) || 0); });
    };
    const ca = mark(rowA), cb = mark(rowB);
    [...ca, ...cb].forEach((b) => b.classList.add('glow'));
    note.textContent = 'Светятся кирпичики, которые есть у обоих чисел.';
    await sleep(1400);
    if (id !== run) return;
    for (let i = 0; i < common.length; i++) {
      rowG.insertAdjacentHTML('beforeend', (i ? '<span class="dot">·</span>' : '') + brickHTML(common[i]));
      const dst = rowG.lastElementChild;
      dst.style.visibility = 'hidden';
      await Promise.all([fly(ca[i], dst, 600), fly(cb[i], dst, 600)]);
      dst.style.visibility = '';
      pulse(dst);
    }
    [...ca, ...cb].forEach((b) => b.classList.remove('glow'));
    rowG.insertAdjacentHTML('beforeend', `<span class="rhs">= ${prod(common)}</span>`);
    note.textContent = 'Общие кирпичики — это НОД.';
    await sleep(900);
    if (id !== run) return;
    // НОК: все кирпичики первого числа + недостающие второго
    const bricksA = $$('.brick', rowA);
    const missing = $$('.brick', rowB).filter((b) => !cb.includes(b));
    const order = [...bricksA, ...missing];
    for (let i = 0; i < order.length; i++) {
      rowL.insertAdjacentHTML('beforeend', (i ? '<span class="dot">·</span>' : '') + brickHTML(+order[i].dataset.p));
      const dst = rowL.lastElementChild;
      dst.style.visibility = 'hidden';
      await fly(order[i], dst, 450);
      dst.style.visibility = '';
      pulse(dst);
    }
    rowL.insertAdjacentHTML('beforeend', `<span class="rhs">= ${lcm2(A, B)}</span>`);
    note.textContent = 'Все кирпичики без повторов — это НОК.';
    replay.hidden = false;
  }
  replay.addEventListener('click', play);
  if ('IntersectionObserver' in window && !REDUCED) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); play(); } }, { threshold: 0.4 });
    io.observe($('#hero'));
  } else play();
})();

/* =====================================================================
   1. Два слова
   ===================================================================== */
(function words() {
  const TIPS = {
    nod: [
      'Наибольший: из всех общих делителей берём самый большой. У 16 и 24 общие делители 1, 2, 4, 8, значит, НОД = 8.',
      'Общий: подходит обоим числам сразу. Делитель только одного числа нас не интересует.',
      'Делитель: число, на которое делится без остатка. Делитель не больше самого числа, поэтому НОД «смотрит вниз».',
    ],
    nok: [
      'Наименьшее: общих кратных бесконечно много (60, 120, 180…), берём самое маленькое.',
      'Общее: делится на оба числа сразу. 60 делится и на 12, и на 30.',
      'Кратное: число, которое делится на данное. Кратное не меньше самого числа, поэтому НОК «смотрит вверх».',
    ],
  };
  $$('.words').forEach((box) => {
    const term = box.dataset.term;
    const tip = $(`[data-tip="${term}"]`);
    $$('.word', box).forEach((btn) => btn.addEventListener('click', () => {
      $$('.word', box).forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      tip.textContent = TIPS[term][+btn.dataset.k];
      pulse(tip, 'pop');
    }));
  });

  const ia = $('#why-a'), ib = $('#why-b'), chain = $('#why-chain');
  function draw() {
    const a = clampInt(ia, 1, 999, 16), b = clampInt(ib, 1, 999, 24);
    const lo = Math.min(a, b), hi = Math.max(a, b);
    chain.innerHTML = `
      <span class="box">1</span><span class="le">≤</span>
      <span class="box nod">НОД = ${gcd2(a, b)}</span><span class="le">≤</span>
      <span class="box">${lo}</span><span class="le">≤</span>
      <span class="box">${hi}</span><span class="le">≤</span>
      <span class="box nok">НОК = ${lcm2(a, b)}</span><span class="le">≤</span>
      <span class="box">${a} · ${b} = ${a * b}</span>`;
  }
  [ia, ib].forEach((i) => i.addEventListener('input', draw));
  draw();
})();

/* =====================================================================
   2. Делители: сетка и перебор
   ===================================================================== */
(function divisorsSection() {
  const ia = $('#div-a'), ib = $('#div-b'), grid = $('#div-grid'), res = $('#div-result');
  const walkList = $('#walk-list'), walkRes = $('#walk-result');
  let run = 0;

  function cells(n) {
    grid.innerHTML = '';
    for (let i = 1; i <= n; i++) {
      const c = document.createElement('div');
      c.className = 'cell';
      c.textContent = i;
      c.dataset.n = i;
      grid.appendChild(c);
    }
  }
  async function show() {
    const id = ++run;
    const a = clampInt(ia, 1, 120, 16), b = clampInt(ib, 1, 120, 24);
    const hi = Math.max(a, b);
    cells(hi);
    setResult(res, '');
    walkList.innerHTML = '';
    setResult(walkRes, '');
    const da = divisors(a), db = divisors(b);
    const step = Math.max(40, Math.min(160, 2400 / hi));
    for (let i = 1; i <= hi; i++) {
      if (id !== run) return;
      const c = grid.children[i - 1];
      const inA = a % i === 0, inB = b % i === 0;
      if (inA) c.classList.add('da');
      if (inB) c.classList.add('db');
      if (inA || inB) pulse(c); else c.classList.add('off');
      await sleep(step);
    }
    if (id !== run) return;
    const common = da.filter((d) => b % d === 0);
    const g = common[common.length - 1];
    grid.children[g - 1].classList.add('crown');
    setResult(res, `Делители ${a}: ${da.join(', ')}.<br>Делители ${b}: ${db.join(', ')}.<br>Общие: <b>${common.join(', ')}</b>. Самый большой — <b>${g}</b>, значит, НОД(${a}, ${b}) = <b>${g}</b>${g === 1 ? ' — числа взаимно простые' : ''}.`, 'good');
  }
  async function walk() {
    const id = ++run;
    const a = clampInt(ia, 1, 120, 16), b = clampInt(ib, 1, 120, 24);
    const lo = Math.min(a, b), hi = Math.max(a, b);
    walkList.innerHTML = '';
    setResult(walkRes, '');
    const ds = divisors(lo).reverse();
    for (const d of ds) {
      if (id !== run) return;
      const li = document.createElement('li');
      const ok = hi % d === 0;
      li.innerHTML = ok
        ? `${hi} : ${d} = ${hi / d} — <span class="yes">делится!</span>`
        : `${hi} : ${d} — <span class="no">не делится</span> (остаток ${hi % d})`;
      walkList.appendChild(li);
      await sleep(550);
      if (ok) {
        setResult(walkRes, `Первый подошедший делитель — ${d}. НОД(${a}, ${b}) = <b>${d}</b>. Проверили всего ${walkList.children.length} ${walkList.children.length === 1 ? 'число' : 'числа'} вместо ${divisors(hi).length} делителей числа ${hi}.`, 'good');
        break;
      }
    }
  }
  $('#div-show').addEventListener('click', show);
  $('#walk-play').addEventListener('click', walk);
  onEnter([ia, ib], show);
  wirePresets($('#divs'), (a, b) => { ia.value = a; ib.value = b; show(); });
  cells(24);
})();

/* =====================================================================
   3. Кратные: лягушки
   ===================================================================== */
(function frogs() {
  const ia = $('#frog-a'), ib = $('#frog-b'), svg = $('#pond'), res = $('#frog-result'), lists = $('#frog-lists');
  const W = 900, PAD = 36, Y_AXIS = 104, Y_A = 72, Y_B = 170;
  let run = 0;

  function draw(a, b) {
    const L = lcm2(a, b);
    const x = (v) => PAD + (v / L) * (W - 2 * PAD);
    const labelEvery = L <= 30 ? 1 : L <= 60 ? 2 : L <= 120 ? 6 : L <= 300 ? 12 : 30;
    let s = `<line class="axis" x1="${PAD - 10}" y1="${Y_AXIS}" x2="${W - PAD + 20}" y2="${Y_AXIS}"/>`;
    for (let v = 0; v <= L; v++) {
      const big = v % a === 0 || v % b === 0;
      if (L > 150 && !big && v % labelEvery) continue;
      s += `<line class="tick" x1="${x(v)}" y1="${Y_AXIS - (big ? 7 : 4)}" x2="${x(v)}" y2="${Y_AXIS + (big ? 7 : 4)}"/>`;
      if (v % labelEvery === 0 || big) s += `<text class="lbl ${big ? 'big' : ''}" x="${x(v)}" y="${Y_AXIS + 24}">${v}</text>`;
    }
    s += `<g id="prints"></g><g id="pads"></g>`;
    s += `<text class="frog" id="frog-a-el" x="${x(0)}" y="${Y_A}">🐸</text>`;
    s += `<text class="frog" id="frog-b-el" x="${x(0)}" y="${Y_B}">🐸</text>`;
    s += `<text class="lbl big" x="${x(0) + 10}" y="${Y_A - 34}">a = ${a}</text>`;
    s += `<text class="lbl big" x="${x(0) + 10}" y="${Y_B + 22}">b = ${b}</text>`;
    svg.innerHTML = s;
    return { L, x };
  }
  function jump(el, x0, x1, yBase, ms) {
    return new Promise((done) => {
      if (REDUCED) { el.setAttribute('x', x1); return done(); }
      const t0 = performance.now();
      const h = Math.min(45, Math.max(18, Math.abs(x1 - x0) * 0.35));
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        el.setAttribute('x', x0 + (x1 - x0) * k);
        el.setAttribute('y', yBase - h * Math.sin(Math.PI * k));
        if (k < 1) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
  }
  async function play() {
    const id = ++run;
    const a = clampInt(ia, 1, 60, 12), b = clampInt(ib, 1, 60, 30);
    const L = lcm2(a, b);
    if (L > 600) { setResult(res, `НОК(${a}, ${b}) = ${L}: слишком длинная прямая для лягушек. Для таких чисел удобнее кирпичики ниже.`, 'bad'); return; }
    const { x } = draw(a, b);
    setResult(res, '');
    lists.textContent = '';
    const prints = $('#prints', svg), pads = $('#pads', svg);
    const fa = $('#frog-a-el', svg), fb = $('#frog-b-el', svg);
    let pa = 0, pb = 0;
    const total = L / a + L / b;
    const ms = Math.max(140, Math.min(480, 3600 / total));
    while (pa < L || pb < L) {
      if (id !== run) return;
      const aTurn = pa <= pb && pa < L;
      if (aTurn) {
        await jump(fa, x(pa), x(pa + a), Y_A, ms);
        pa += a;
        prints.insertAdjacentHTML('beforeend', `<circle class="pa" cx="${x(pa)}" cy="${Y_AXIS - 12}" r="5"/>`);
      } else {
        await jump(fb, x(pb), x(pb + b), Y_B, ms);
        pb += b;
        prints.insertAdjacentHTML('beforeend', `<circle class="pb" cx="${x(pb)}" cy="${Y_AXIS + 12}" r="5"/>`);
      }
      if (pa === pb && pa > 0) {
        pads.insertAdjacentHTML('beforeend', `<circle class="pad" cx="${x(pa)}" cy="${Y_AXIS}" r="16"/><text class="meet" x="${x(pa) - 20}" y="${Y_AXIS - 22}">встреча!</text>`);
      }
    }
    if (id !== run) return;
    const ma = Array.from({ length: L / a }, (_, i) => (i + 1) * a).join(', ');
    const mb = Array.from({ length: L / b }, (_, i) => (i + 1) * b).join(', ');
    setResult(res, `Обе лягушки впервые оказались вместе на клетке <b>${L}</b>. НОК(${a}, ${b}) = <b>${L}</b>. Дальше они встретятся на ${2 * L}, ${3 * L}… — это тоже общие кратные, но не наименьшие.`, 'good');
    lists.innerHTML = `Кратные ${a}: ${ma}. Кратные ${b}: ${mb}.`;
  }
  $('#frog-play').addEventListener('click', play);
  onEnter([ia, ib], play);
  wirePresets($('#mult'), (a, b) => { ia.value = a; ib.value = b; play(); });
  draw(12, 30);
})();

/* =====================================================================
   4. Кирпичики: легенда и столбик
   ===================================================================== */
(function column() {
  $('#prime-legend').innerHTML = [2, 3, 5, 7, 11, 13].map((p) => brickHTML(p)).join(' ') + ' ' + brickHTML(17) + ' <span class="small">… остальные простые серые</span>';

  const inp = $('#col-n'), tbody = $('#col-table tbody'), eq = $('#col-eq'), pw = $('#col-pow');
  let run = 0;
  async function play() {
    const id = ++run;
    const n = clampInt(inp, 2, 99999, 2520);
    tbody.innerHTML = '';
    eq.innerHTML = '';
    pw.innerHTML = '';
    const f = factorize(n);
    let m = n;
    for (const p of f) {
      if (id !== run) return;
      tbody.insertAdjacentHTML('beforeend', `<tr><td>${m}</td><td>${p}</td></tr>`);
      m /= p;
      await sleep(380);
    }
    if (id !== run) return;
    tbody.insertAdjacentHTML('beforeend', `<tr class="fin"><td>1</td><td></td></tr>`);
    eq.innerHTML = `<span class="lhs">${n} =</span>`;
    for (let i = 0; i < f.length; i++) {
      if (id !== run) return;
      eq.insertAdjacentHTML('beforeend', (i ? '<span class="dot">·</span>' : '') + brickHTML(f[i], 'pop'));
      await sleep(160);
    }
    pw.innerHTML = `Короче, со степенями: ${n} = ${powStr(f)}${f.length === 1 ? '. Это простое число: один кирпичик' : ''}.`;
  }
  $('#col-play').addEventListener('click', play);
  onEnter([inp], play);
  $$('#bricks [data-n]').forEach((b) => b.addEventListener('click', () => { inp.value = b.dataset.n; play(); }));
})();

/* =====================================================================
   5. Дробилка
   ===================================================================== */
(function crusher() {
  const numEl = $('#cr-num'), tray = $('#cr-tray'), res = $('#cr-result'), btns = $('#cr-buttons');
  const scoreEl = $('#cr-score'), missEl = $('#cr-miss');
  const HINT = {
    2: 'не чётное, значит, на 2 не делится.',
    3: 'сумма цифр не делится на 3.',
    5: 'не заканчивается на 0 или 5.',
    7: 'на 7 не делится: проверь делением.',
    11: 'на 11 не делится: проверь делением.',
    13: 'на 13 не делится: проверь делением.',
  };
  const queue = [1968, 2520, 56, 81, 60, 72, 96, 12, 30, 36, 54];
  let n = 0, start = 0, score = 0, miss = 0, busy = false;

  function randomNumber() {
    for (;;) {
      const k = rnd(3, 6);
      let v = 1;
      for (let i = 0; i < k; i++) v *= pick([2, 2, 2, 3, 3, 5, 7, 11, 13]);
      if (v <= 6000 && v >= 20) return v;
    }
  }
  function next() {
    start = n = queue.length ? queue.shift() : randomNumber();
    numEl.textContent = n;
    numEl.classList.remove('done');
    tray.innerHTML = '';
    setResult(res, '');
    pulse(numEl);
  }
  function finish() {
    score++;
    scoreEl.textContent = score;
    numEl.classList.add('done');
    const f = $$('.brick', tray).map((b) => +b.dataset.p);
    setResult(res, `Готово! ${start} = ${dotStr(f)} = ${powStr(f)}. ⭐`, 'good');
  }
  async function hit(p) {
    if (busy || n === 1) return;
    if (p === 'prime') {
      if (isPrime(n)) { await drop(n); } else {
        miss++; missEl.textContent = miss; pulse(numEl, 'shake');
        setResult(res, `${n} не простое: оно делится на ${factorize(n)[0]}.`, 'bad');
      }
      return;
    }
    if (n % p === 0) await drop(p); else {
      miss++; missEl.textContent = miss; pulse(numEl, 'shake');
      setResult(res, `${n} ${HINT[p]}`, 'bad');
    }
  }
  async function drop(p) {
    busy = true;
    const src = $(`[data-p="${p}"]`, btns) || numEl;
    tray.insertAdjacentHTML('beforeend', (tray.children.length ? '<span class="dot">·</span>' : '') + brickHTML(p, 'pop'));
    const dst = tray.lastElementChild;
    dst.style.visibility = 'hidden';
    await fly(src.classList.contains('brick') ? src : dst, dst, 450);
    dst.style.visibility = '';
    n /= p;
    numEl.textContent = n;
    pulse(numEl);
    setResult(res, n === 1 ? '' : `Откололи ${p}. Осталось ${n}.`);
    busy = false;
    if (n === 1) finish();
  }
  btns.innerHTML = [2, 3, 5, 7, 11, 13].map((p) => `<button type="button" class="brick ${PRIME_CLASS(p)}" data-p="${p}" aria-label="Разделить на ${p}">${p}</button>`).join('')
    + '<button type="button" class="btn prime-btn" data-p="prime">Это уже простое!</button>';
  btns.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]');
    if (!b) return;
    hit(b.dataset.p === 'prime' ? 'prime' : +b.dataset.p);
  });
  $('#cr-skip').addEventListener('click', next);
  $('#cr-rules').addEventListener('click', () => { const box = $('#cr-rules-box'); box.hidden = !box.hidden; });
  next();
})();

/* =====================================================================
   6. Два мешка
   ===================================================================== */
(function venn() {
  const ia = $('#venn-a'), ib = $('#venn-b');
  const rowA = $('#venn-row-a'), rowB = $('#venn-row-b');
  const left = $('#venn-left'), mid = $('#venn-mid'), right = $('#venn-right'), out = $('#venn-out');
  let run = 0;

  function regionClear(r) { $$('.brick', r).forEach((b) => b.remove()); }
  function setup(a, b) {
    const fa = factorize(a), fb = factorize(b);
    rowA.innerHTML = `<span class="lhs">${a} =</span>${rowHTML(fa)}`;
    rowB.innerHTML = `<span class="lhs">${b} =</span>${rowHTML(fb)}`;
    $('#venn-la').textContent = a;
    $('#venn-lb').textContent = b;
    [left, mid, right].forEach(regionClear);
    out.innerHTML = '';
    return { fa, fb };
  }
  async function play() {
    const id = ++run;
    const a = clampInt(ia, 2, 99999, 12), b = clampInt(ib, 2, 99999, 30);
    const { fa, fb } = setup(a, b);
    const common = commonFactors([a, b]);
    const cc = counts(common);
    // Назначаем каждому кирпичику в строке мешок: первые common штук каждого простого — в середину
    const plan = [];
    const used = new Map();
    $$('.brick', rowA).forEach((el) => {
      const p = +el.dataset.p; const k = used.get(p) || 0; used.set(p, k + 1);
      plan.push({ el, p, region: k < (cc.get(p) || 0) ? mid : left, shared: k < (cc.get(p) || 0) });
    });
    used.clear();
    $$('.brick', rowB).forEach((el) => {
      const p = +el.dataset.p; const k = used.get(p) || 0; used.set(p, k + 1);
      plan.push({ el, p, region: k < (cc.get(p) || 0) ? mid : right, shared: k < (cc.get(p) || 0) });
    });
    // Целевые кирпичики: середина содержит common по одному разу
    const targets = new Map();
    const midBricks = common.map((p) => { mid.insertAdjacentHTML('beforeend', brickHTML(p)); return mid.lastElementChild; });
    const midIdx = new Map();
    plan.forEach((it) => {
      if (it.shared) {
        const k = midIdx.get(it.p) || 0; midIdx.set(it.p, k + 1);
        // k-й общий кирпичик p в строке соответствует k-му (по порядку) кирпичику p в середине
        targets.set(it.el, midBricks.filter((m) => +m.dataset.p === it.p)[k % (cc.get(it.p) || 1)]);
      } else {
        it.region.insertAdjacentHTML('beforeend', brickHTML(it.p));
        targets.set(it.el, it.region.lastElementChild);
      }
    });
    if (!common.length) mid.insertAdjacentHTML('beforeend', '<span class="brick one shown">1</span>');
    // Летим: сначала общие (эффектно сходятся), потом остальные
    const order = [...plan.filter((x) => x.shared), ...plan.filter((x) => !x.shared)];
    for (const it of order) {
      if (id !== run) return;
      const dst = targets.get(it.el);
      it.el.classList.add('ghost');
      fly(it.el, dst, 650).then(() => dst.classList.add('shown'));
      await sleep(it.shared ? 180 : 110);
    }
    await sleep(REDUCED ? 0 : 700);
    if (id !== run) return;
    const g = prod(common), l = lcm2(a, b);
    const union = unionFactors([a, b]);
    out.innerHTML = `
      <div class="line nod"><b>Середина</b> (общие кирпичики): НОД(${a}, ${b}) = ${common.length > 1 ? dotStr(common) + ' = ' : ''}<b>${g}</b>${g === 1 ? '. Общих кирпичиков нет: числа взаимно простые' : ''}.</div>`;
    await sleep(500);
    out.insertAdjacentHTML('beforeend', `<div class="line nok"><b>Всё вместе</b> (левая часть + середина + правая): НОК(${a}, ${b}) = ${dotStr(union)} = <b>${l}</b>${g === 1 ? ' = a · b, раз общего нет' : ''}.</div>`);
    await sleep(500);
    out.insertAdjacentHTML('beforeend', `<div class="line chk">Проверка: ${a} · ${b} = ${a * b}, и НОД · НОК = ${g} · ${l} = ${g * l}. Совпало.</div>`);
  }
  $('#venn-play').addEventListener('click', play);
  onEnter([ia, ib], play);
  wirePresets($('#venn'), (a, b) => { ia.value = a; ib.value = b; play(); });
  setup(12, 30);
})();

/* =====================================================================
   7. Мастерская
   ===================================================================== */
(function workshop() {
  const TASKS = [
    { type: 'gcd', nums: [1968, 2520] },
    { type: 'gcd', nums: [56, 81] },
    { type: 'gcd', nums: [60, 72, 96] },
    { type: 'lcm', nums: [12, 30] },
    { type: 'lcm', nums: [36, 54] },
    { type: 'lcm', nums: [60, 72, 96] },
  ];
  const pickBox = $('#ws-tasks'), title = $('#ws-title'), instr = $('#ws-instr'), rows = $('#ws-rows');
  const buildBox = $('#ws-build'), buildRow = $('#ws-build-row'), res = $('#ws-result'), ans = $('#ws-answer'), scoreEl = $('#ws-score');
  let cur = null, curIdx = -1, score = 0, solved = false;
  const done = new Set();
  const label = (t) => `${t.type === 'gcd' ? 'НОД' : 'НОК'}(${t.nums.join(', ')})`;

  pickBox.innerHTML = TASKS.map((t, i) => `<button type="button" data-i="${i}" aria-pressed="false">${label(t)}</button>`).join('');
  pickBox.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) start(TASKS[+b.dataset.i], +b.dataset.i); });

  function start(task, idx = -1) {
    cur = task; curIdx = idx; solved = false;
    $$('button', pickBox).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === idx)));
    title.textContent = `Найди ${label(task)}`;
    rows.innerHTML = task.nums.map((n, r) => `<div class="eq" data-r="${r}"><span class="lhs">${n} =</span>${rowHTML(factorize(n), 'click')}</div>`).join('');
    setResult(res, '');
    ans.hidden = true;
    ans.innerHTML = '';
    if (task.type === 'gcd') {
      instr.textContent = 'Нажимай на кирпичики, которые есть у всех чисел сразу, чтобы обвести их в квадратик. Один общий кирпичик — по одному квадратику в каждой строке.';
      buildBox.hidden = true;
    } else {
      instr.textContent = 'Разложение первого числа уже в ответе. Нажимай на недостающие кирпичики в других строках, чтобы дописать их. Кирпичик в ответе можно убрать обратно нажатием.';
      buildBox.hidden = false;
      buildRow.innerHTML = rowHTML(factorize(task.nums[0]), 'fixed');
    }
  }
  rows.addEventListener('click', async (e) => {
    const br = e.target.closest('.brick.click');
    if (!br || solved) return;
    if (cur.type === 'gcd') { br.classList.toggle('boxed'); return; }
    if (br.closest('[data-r="0"]') || br.classList.contains('dim')) return;
    br.classList.add('dim');
    buildRow.insertAdjacentHTML('beforeend', '<span class="dot">·</span>' + brickHTML(+br.dataset.p, 'click added'));
    const dst = buildRow.lastElementChild;
    dst.style.visibility = 'hidden';
    await fly(br, dst, 500);
    dst.style.visibility = '';
    dst._src = br;
    pulse(dst);
  });
  buildRow.addEventListener('click', (e) => {
    const br = e.target.closest('.brick.added');
    if (!br || solved) return;
    if (br._src) br._src.classList.remove('dim');
    if (br.previousElementSibling?.classList.contains('dot')) br.previousElementSibling.remove();
    br.remove();
  });

  function check() {
    if (!cur || solved) return;
    const common = commonFactors(cur.nums);
    if (cur.type === 'gcd') {
      const want = counts(common);
      const problems = [];
      $$('.eq', rows).forEach((row, r) => {
        const got = counts($$('.brick.boxed', row).map((b) => +b.dataset.p));
        const primes = new Set([...want.keys(), ...got.keys()]);
        for (const p of primes) {
          const w = want.get(p) || 0, g = got.get(p) || 0;
          if (g > w) {
            const limiter = cur.nums.find((n) => (counts(factorize(n)).get(p) || 0) === w);
            problems.push(`В строке ${cur.nums[r]} обведено ${bricks(g)} ${p}, но ${w === 0 ? `у числа ${limiter} нет ни одного ${p}` : `у числа ${limiter} их только ${w}`}: общих ${p} — ${w}.`);
          } else if (g < w) {
            problems.push(`В строке ${cur.nums[r]} нужно обвести ещё ${bricks(w - g)} ${p}: он есть у всех чисел.`);
          }
        }
      });
      if (problems.length) { setResult(res, problems.slice(0, 2).join('<br>'), 'bad'); return; }
      win(`НОД(${cur.nums.join(', ')}) = ${common.length > 1 ? dotStr(common) + ' = ' : ''}<b>${prod(common)}</b>${common.length ? '' : '. Общих кирпичиков нет, числа взаимно простые'}.`, common);
    } else {
      const union = unionFactors(cur.nums);
      const want = counts(union);
      const got = counts($$('.brick', buildRow).map((b) => +b.dataset.p));
      const value = prod($$('.brick', buildRow).map((b) => +b.dataset.p));
      const problems = [];
      for (const p of new Set([...want.keys(), ...got.keys()])) {
        const w = want.get(p) || 0, g = got.get(p) || 0;
        if (g < w) {
          const bad = cur.nums.find((n) => value % n !== 0);
          problems.push(`Твоё число ${value} не делится на ${bad}: у него ${bricks(w)} ${p}, а в ответе только ${g}. Допиши ${w - g}.`);
        } else if (g > w) {
          problems.push(`Кирпичик ${p} лишний: даже без него число делится на все данные. Ни у одного числа нет ${g} штук ${p}, самое большее — ${w}.`);
        }
      }
      if (problems.length) { setResult(res, problems.slice(0, 2).join('<br>'), 'bad'); return; }
      win(`НОК(${cur.nums.join(', ')}) = ${dotStr(union)} = ${powStr(union)} = <b>${prod(union)}</b>.`, union);
    }
  }
  function win(text, factors) {
    solved = true;
    setResult(res, 'Верно! ⭐', 'good');
    ans.hidden = false;
    ans.innerHTML = `<p>${text}</p><div class="eq">${rowHTML(factors)}</div>`;
    $$('.brick.click', rows).forEach((b) => b.classList.remove('click'));
    if (curIdx >= 0 && !done.has(curIdx)) { done.add(curIdx); $$('button', pickBox)[curIdx].classList.add('done'); }
    score++;
    scoreEl.textContent = score;
  }
  function hint() {
    if (!cur) return;
    const common = commonFactors(cur.nums);
    if (cur.type === 'gcd') {
      const cc = counts(common);
      $$('.eq', rows).forEach((row) => {
        const seen = new Map();
        $$('.brick', row).forEach((b) => {
          const p = +b.dataset.p; const k = seen.get(p) || 0; seen.set(p, k + 1);
          if (k < (cc.get(p) || 0)) b.classList.add('glow');
        });
      });
      setResult(res, common.length ? 'Светятся кирпичики, которые есть у каждого числа. Обведи их.' : 'Ничего не светится: у этих чисел нет общих кирпичиков. Проверь ответ, ничего не обводя.');
    } else {
      const have = counts($$('.brick', buildRow).map((b) => +b.dataset.p));
      const want = counts(unionFactors(cur.nums));
      const need = new Map();
      for (const [p, w] of want) if (w > (have.get(p) || 0)) need.set(p, w - (have.get(p) || 0));
      if (!need.size) { setResult(res, 'Кажется, всё уже есть. Проверяй!'); return; }
      $$('.eq', rows).slice(1).forEach((row) => {
        const seen = new Map();
        $$('.brick', row).forEach((b) => {
          const p = +b.dataset.p; const k = seen.get(p) || 0; seen.set(p, k + 1);
          if (!b.classList.contains('dim') && k >= (have.get(p) || 0) && k < (want.get(p) || 0)) b.classList.add('glow');
        });
      });
      setResult(res, `Не хватает: ${[...need].map(([p, k]) => `${k} × ${p}`).join(', ')}. Светятся кирпичики, которые можно дописать.`);
    }
    setTimeout(() => $$('.glow', rows).forEach((b) => b.classList.remove('glow')), 4000);
  }
  function randomTask() {
    const type = pick(['gcd', 'lcm']);
    const k = Math.random() < 0.3 ? 3 : 2;
    const nums = [];
    while (nums.length < k) {
      let v = 1;
      const m = rnd(2, 4);
      for (let i = 0; i < m; i++) v *= pick([2, 2, 3, 3, 5, 7]);
      if (!nums.includes(v) && v <= 500) nums.push(v);
    }
    start({ type, nums });
  }
  $('#ws-check').addEventListener('click', check);
  $('#ws-hint').addEventListener('click', hint);
  $('#ws-reset').addEventListener('click', () => cur && start(cur, curIdx));
  $('#ws-random').addEventListener('click', randomTask);
  start(TASKS[0], 0);
})();

/* =====================================================================
   8. Что искать: НОД или НОК
   ===================================================================== */
(function which() {
  const ITEMS = [
    { t: 'Две ленты, 60 см и 72 см, нужно разрезать на одинаковые куски как можно длиннее, чтобы ничего не осталось. Какой длины куски?', a: 'nod', e: 'Режем на одинаковые части «как можно крупнее»: ищем число, на которое делятся и 60, и 72. НОД(60, 72) = 12 см.' },
    { t: 'Автобусы двух маршрутов отходят от вокзала каждые 12 и 30 минут. В 8:00 они отошли вместе. Когда снова отойдут вместе?', a: 'nok', e: 'Ждём, когда события совпадут: нужно число, которое делится и на 12, и на 30. НОК(12, 30) = 60 минут, в 9:00.' },
    { t: 'Прямоугольный пол 16 на 24 дм хотят выложить одинаковыми квадратными плитками как можно крупнее. Какая сторона у плитки?', a: 'nod', e: 'Делим обе стороны на равные части: сторона плитки делит и 16, и 24. НОД(16, 24) = 8 дм.' },
    { t: 'Из одинаковых плиток 12 на 30 см складывают самый маленький квадрат. Какая у него сторона?', a: 'nok', e: 'Складываем из одинаковых кусочков «самое маленькое целое»: сторона делится и на 12, и на 30. НОК(12, 30) = 60 см.' },
    { t: '36 яблок и 54 груши раскладывают в одинаковые подарочные наборы, чтобы наборов было как можно больше и всё поместилось. Сколько наборов?', a: 'nod', e: 'Раскладываем поровну: число наборов делит и 36, и 54. НОД(36, 54) = 18 наборов.' },
    { t: 'Две шестерёнки, 36 и 54 зубца, стоят метками друг к другу. Через сколько зубцов метки снова совпадут?', a: 'nok', e: 'Ждём повторения: число зубцов делится и на 36, и на 54. НОК(36, 54) = 108.' },
    { t: 'Дроби 1/12 и 1/30 нужно привести к общему знаменателю, самому маленькому из возможных. Какой знаменатель?', a: 'nok', e: 'Общий знаменатель делится на оба старых: это общее кратное, и нужно наименьшее. НОК(12, 30) = 60.' },
    { t: 'Дробь 56/81 хотят сократить. На какое наибольшее число можно разделить числитель и знаменатель?', a: 'nod', e: 'Сокращаем — делим оба числа на одно и то же: ищем общий делитель. НОД(56, 81) = 1: дробь не сокращается, числа взаимно простые.' },
  ];
  const text = $('#wh-text'), res = $('#wh-result'), next = $('#wh-next'), scoreEl = $('#wh-score'), nEl = $('#wh-n');
  const choices = $$('#which .choice');
  let i = 0, score = 0, answered = false;
  $('#wh-total').textContent = ITEMS.length;
  function show() {
    answered = false;
    nEl.textContent = i + 1;
    text.textContent = ITEMS[i].t;
    pulse(text, 'pop');
    setResult(res, '');
    next.hidden = true;
    choices.forEach((b) => { b.classList.remove('right', 'wrong'); b.disabled = false; });
  }
  choices.forEach((b) => b.addEventListener('click', () => {
    if (answered) return;
    answered = true;
    const ok = b.dataset.ans === ITEMS[i].a;
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok) choices.find((c) => c.dataset.ans === ITEMS[i].a).classList.add('right');
    if (ok) { score++; scoreEl.textContent = score; }
    setResult(res, (ok ? 'Верно! ' : 'Не угадал. ') + ITEMS[i].e, ok ? 'good' : 'bad');
    choices.forEach((c) => (c.disabled = true));
    next.hidden = false;
    next.textContent = i + 1 < ITEMS.length ? 'Дальше →' : 'Ещё раз сначала';
  }));
  next.addEventListener('click', () => {
    i++;
    if (i >= ITEMS.length) { i = 0; score = 0; scoreEl.textContent = 0; }
    show();
  });
  show();
})();

/* =====================================================================
   9. Тренажёр
   ===================================================================== */
(function trainer() {
  const q = $('#tr-q'), input = $('#tr-input'), res = $('#tr-result'), sol = $('#tr-solution');
  const numRow = $('#tr-num-row'), ynRow = $('#tr-yn-row');
  const streakEl = $('#tr-streak'), bestEl = $('#tr-best'), totalEl = $('#tr-total'), starsEl = $('#tr-stars');
  const KEY = 'nod-nok-trainer';
  const saved = load(KEY, { best: 0, total: 0 });
  let level = 1, streak = 0, best = saved.best || 0, total = saved.total || 0, cur = null, answered = false;

  function buildNum(primes, maxV, minFactors = 2) {
    for (;;) {
      let v = 1;
      const k = rnd(minFactors, 5);
      for (let i = 0; i < k; i++) v *= pick(primes);
      if (v <= maxV && v > 1) return v;
    }
  }
  function gen() {
    const type = pick(['gcd', 'lcm', 'gcd', 'lcm', 'coprime']);
    let nums;
    if (level === 1) {
      nums = [rnd(2, 30), rnd(2, 30)];
      while (nums[1] === nums[0]) nums[1] = rnd(2, 30);
    } else if (level === 2) {
      nums = [buildNum([2, 2, 3, 3, 5, 7], 200), buildNum([2, 2, 3, 3, 5, 7], 200)];
      while (nums[1] === nums[0]) nums[1] = buildNum([2, 2, 3, 3, 5, 7], 200);
    } else {
      const k = type !== 'coprime' && Math.random() < 0.35 ? 3 : 2;
      nums = [];
      while (nums.length < k) { const v = buildNum([2, 2, 2, 3, 3, 5, 7, 11, 13], 3000, 3); if (!nums.includes(v)) nums.push(v); }
    }
    if (type === 'coprime' && level === 3) nums = nums.slice(0, 2);
    const answer = type === 'gcd' ? gcdN(nums) : type === 'lcm' ? lcmN(nums) : gcdN(nums) === 1 ? 'yes' : 'no';
    return { type, nums, answer };
  }
  function ask() {
    cur = gen();
    answered = false;
    const name = { gcd: 'НОД', lcm: 'НОК', coprime: 'Взаимно простые ли числа' }[cur.type];
    q.textContent = cur.type === 'coprime' ? `${name} ${cur.nums.join(' и ')}?` : `${name}(${cur.nums.join(', ')}) = ?`;
    pulse(q, 'pop');
    numRow.hidden = cur.type === 'coprime';
    ynRow.hidden = cur.type !== 'coprime';
    $$('.choice', ynRow).forEach((b) => { b.classList.remove('right', 'wrong'); b.disabled = false; });
    input.value = '';
    setResult(res, '');
    sol.hidden = true;
    if (cur.type !== 'coprime') input.focus({ preventScroll: true });
  }
  function grade(ok, extra = '') {
    if (answered) return;
    answered = true;
    if (ok) {
      streak++; total++;
      if (streak > best) best = streak;
      setResult(res, `Верно! ${streak >= 3 ? `Серия ${streak} 🔥` : '⭐'} ${extra}`, 'good');
    } else {
      streak = 0;
      setResult(res, `Не сошлось. ${extra}`, 'bad');
    }
    store(KEY, { best, total });
    stats();
  }
  function stats() {
    streakEl.textContent = streak;
    bestEl.textContent = best;
    totalEl.textContent = total;
    starsEl.textContent = '⭐'.repeat(Math.min(10, Math.floor(total / 5)));
  }
  function check() {
    const v = parseInt(input.value, 10);
    if (!Number.isFinite(v)) { setResult(res, 'Введи число.', 'bad'); return; }
    if (v === cur.answer) { grade(true); return; }
    const lo = Math.min(...cur.nums), hi = Math.max(...cur.nums);
    let why = '';
    if (cur.type === 'gcd' && v > lo) why = `Подсказка: НОД не может быть больше меньшего числа ${lo}.`;
    else if (cur.type === 'lcm' && v < hi) why = `Подсказка: НОК не может быть меньше большего числа ${hi}.`;
    else if (cur.type === 'gcd' && cur.nums.some((n) => n % v !== 0)) why = `${v} не делит ${cur.nums.find((n) => n % v !== 0)}, значит, это не общий делитель.`;
    else if (cur.type === 'lcm' && cur.nums.some((n) => v % n !== 0)) why = `${v} не делится на ${cur.nums.find((n) => v % n !== 0)}, значит, это не общее кратное.`;
    else if (cur.type === 'gcd') why = `${v} — общий делитель, но не наибольший.`;
    else why = `${v} — общее кратное, но не наименьшее.`;
    grade(false, why + ' Нажми «Решение».');
  }
  function solve() {
    const common = commonFactors(cur.nums), union = unionFactors(cur.nums);
    const cc = counts(common);
    const rowsHTML = cur.nums.map((n) => {
      const f = factorize(n);
      const seen = new Map();
      const marked = f.map((p, i) => {
        const k = seen.get(p) || 0; seen.set(p, k + 1);
        return (i ? '<span class="dot">·</span>' : '') + brickHTML(p, k < (cc.get(p) || 0) ? 'boxed' : '');
      }).join('');
      return `<div class="eq"><span class="lhs">${n} =</span>${f.length ? marked : brickHTML(n)}</div>`;
    }).join('');
    let line;
    if (cur.type === 'gcd') line = `Обведено общее: НОД = ${common.length > 1 ? dotStr(common) + ' = ' : ''}<b>${prod(common)}</b>${common.length ? '' : ' (общих кирпичиков нет)'}.`;
    else if (cur.type === 'lcm') line = `Берём первое разложение и дописываем недостающее: НОК = ${dotStr(union)} = <b>${prod(union)}</b>.`;
    else line = common.length ? `Есть общие кирпичики (${dotStr(common)}), НОД = ${prod(common)} ≠ 1: <b>не взаимно простые</b>.` : 'Общих кирпичиков нет, НОД = 1: <b>взаимно простые</b>.';
    sol.innerHTML = rowsHTML + `<p>${line}</p>`;
    sol.hidden = false;
    if (!answered) { answered = true; streak = 0; stats(); setResult(res, 'Смотри решение, следующий пример — за тобой.'); }
  }
  $('#tr-check').addEventListener('click', check);
  onEnter([input], () => (answered ? ask() : check()));
  $$('.choice', ynRow).forEach((b) => b.addEventListener('click', () => {
    if (answered) return;
    const ok = b.dataset.yn === cur.answer;
    b.classList.add(ok ? 'right' : 'wrong');
    $$('.choice', ynRow).forEach((c) => (c.disabled = true));
    grade(ok, ok ? '' : `НОД(${cur.nums.join(', ')}) = ${gcdN(cur.nums)}.`);
  }));
  $('#tr-solve').addEventListener('click', solve);
  $('#tr-next').addEventListener('click', ask);
  $$('#trainer .seg button').forEach((b) => b.addEventListener('click', () => {
    level = +b.dataset.level;
    $$('#trainer .seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    streak = 0;
    stats();
    ask();
  }));
  stats();
  ask();
})();

/* =====================================================================
   10. Шпаргалка: примеры из учебника
   ===================================================================== */
(function cheat() {
  const EX = [
    { type: 'gcd', nums: [16, 24] }, { type: 'gcd', nums: [35, 182] }, { type: 'gcd', nums: [1968, 2520] },
    { type: 'gcd', nums: [56, 81] }, { type: 'gcd', nums: [60, 72, 96] },
    { type: 'lcm', nums: [12, 30] }, { type: 'lcm', nums: [36, 54] }, { type: 'lcm', nums: [60, 72, 96] },
  ];
  $('#cheat-examples').innerHTML = EX.map((e) => {
    const common = commonFactors(e.nums), cc = counts(common);
    const rows = e.nums.map((n) => {
      const seen = new Map();
      const f = factorize(n);
      return `<div class="eq"><span class="lhs">${n} =</span>${f.map((p, i) => { const k = seen.get(p) || 0; seen.set(p, k + 1); return (i ? '<span class="dot">·</span>' : '') + brickHTML(p, k < (cc.get(p) || 0) ? 'boxed' : ''); }).join('')}</div>`;
    }).join('');
    const ans = e.type === 'gcd'
      ? `НОД = ${common.length > 1 ? dotStr(common) + ' = ' : ''}${prod(common)}${common.length ? '' : ' (взаимно простые)'}`
      : `НОК = ${dotStr(unionFactors(e.nums))} = ${prod(unionFactors(e.nums))}`;
    return `<div class="example"><h4>${e.type === 'gcd' ? 'НОД' : 'НОК'}(${e.nums.join(', ')})</h4>${rows}<p class="ans">${ans}</p></div>`;
  }).join('');
})();
