'use strict';

/* =====================================================================
   Помощники
   ===================================================================== */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCED ? 0 : ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const mod = (n, m) => ((n % m) + m) % m;
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.innerHTML = text;
  return e;
}
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} ${one}`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}
const nights = (n) => plural(n, 'ночь', 'ночи', 'ночей');
const fmt = (n) => n.toLocaleString('ru-RU');

/* =====================================================================
   Прогресс
   ===================================================================== */
const TASKS = ['p1', 'p2a', 'p2b', 'p2c', 'p3', 'p4', 'p5', 'p6', 'p7'];
const KEY = 'remainder-clock-progress';
let done = new Set();
try { done = new Set(JSON.parse(localStorage.getItem(KEY) || '[]').filter((t) => TASKS.includes(t))); } catch (e) { done = new Set(); }
function markDone(id) {
  done.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...done])); } catch (e) { /* приватный режим */ }
  renderProgress();
}
function renderProgress() {
  $('#progress').textContent = `★ ${done.size}/${TASKS.length}`;
  $$('.toc a[data-task]').forEach((a) => {
    const t = a.dataset.task;
    const ok = t === 'p2' ? ['p2a', 'p2b', 'p2c'].every((x) => done.has(x)) : done.has(t);
    a.classList.toggle('done', ok);
  });
}
function feedback(elm, ok, text) {
  elm.textContent = text;
  elm.classList.toggle('ok', ok);
  elm.classList.toggle('bad', !ok);
}

/* =====================================================================
   Циферблат
   ===================================================================== */
class Dial {
  constructor(svg, opts = {}) {
    this.svg = svg;
    this.m = opts.m || 5;
    this.deg = 0;      // накопленный поворот стрелки
    this.pos = 0;      // угол текущего остатка (0..360)
    this.r = 0;
    this.lit = new Set();
    svg.setAttribute('viewBox', '0 0 300 300');
    svg.classList.add('dial');
    this.build();
  }
  build() {
    const s = this.svg;
    s.innerHTML = '';
    el('circle', { cx: 150, cy: 150, r: 144, class: 'dial-outer' }, s);
    el('circle', { cx: 150, cy: 150, r: 132, class: 'dial-face' }, s);
    this.wedge = el('path', { class: 'dial-wedge', d: '' }, s);
    this.ticks = el('g', { class: 'dial-ticks' }, s);
    this.labels = el('g', { class: 'dial-labels' }, s);
    this.hand = el('g', { class: 'dial-hand' }, s);
    el('path', { d: 'M150 150 L150 178', class: 'hand-tail' }, this.hand);
    el('path', { d: 'M150 150 L150 56', class: 'hand-stem' }, this.hand);
    el('path', { d: 'M150 34 L139 62 L161 62 Z', class: 'hand-tip' }, this.hand);
    el('circle', { cx: 150, cy: 150, r: 9, class: 'dial-cap' }, s);
    this.drawScale();
  }
  angle(i) { return (i * 360 / this.m - 90) * Math.PI / 180; }
  drawScale() {
    this.ticks.innerHTML = '';
    this.labels.innerHTML = '';
    for (let i = 0; i < this.m; i++) {
      const a = this.angle(i);
      el('line', { x1: 150 + Math.cos(a) * 128, y1: 150 + Math.sin(a) * 128, x2: 150 + Math.cos(a) * 116, y2: 150 + Math.sin(a) * 116 }, this.ticks);
      const t = el('text', { x: 150 + Math.cos(a) * 97, y: 150 + Math.sin(a) * 97, 'data-i': i }, this.labels);
      t.textContent = i;
      if (this.m > 16) t.classList.add('sm');
    }
    this.paint();
  }
  paint() {
    const m = this.m, half = Math.PI / m;
    const a0 = this.angle(this.r) - half, a1 = this.angle(this.r) + half;
    const R = 112;
    const large = m <= 1 ? 1 : 0;
    this.wedge.setAttribute('d', `M150 150 L${150 + Math.cos(a0) * R} ${150 + Math.sin(a0) * R} A${R} ${R} 0 ${large} 1 ${150 + Math.cos(a1) * R} ${150 + Math.sin(a1) * R} Z`);
    $$('text', this.labels).forEach((t) => {
      const i = +t.dataset.i;
      t.classList.toggle('on', i === this.r);
      t.classList.toggle('lit', this.lit.has(i) && i !== this.r);
    });
  }
  setM(m) {
    this.m = m;
    this.r = 0;
    this.lit.clear();
    this.deg = Math.ceil(this.deg / 360) * 360;
    this.pos = 0;
    this.hand.style.transition = 'none';
    this.hand.style.transform = `rotate(${this.deg}deg)`;
    this.drawScale();
  }
  // Крутим стрелку на число n от нуля: показываем до maxTurns полных кругов и остаток.
  // Если кругов больше maxTurns, лишние не рисуем (иначе ждать долго), остаток при этом верный.
  spinTo(n, { maxTurns = 5, dur = null, fromZero = true } = {}) {
    const m = this.m, q = Math.floor(n / m), r = mod(n, m);
    const turns = Math.min(Math.max(q, 0), maxTurns);
    const target = r * 360 / m;
    if (fromZero && this.pos !== 0) {
      // Мгновенно ставим стрелку на 0, чтобы отсчёт шёл с начала круга
      this.deg += mod(-this.pos, 360);
      this.pos = 0;
      this.hand.style.transition = 'none';
      this.hand.style.transform = `rotate(${this.deg}deg)`;
    }
    let delta = turns * 360 + mod(target - this.pos, 360);
    if (delta === 0 && n >= m) delta = 360;
    this.deg += delta;
    this.pos = target;
    this.r = r;
    const d = dur ?? Math.min(2400, 350 + delta * 1.1);
    void this.hand.offsetWidth;
    this.hand.style.transition = REDUCED ? 'none' : `transform ${d}ms cubic-bezier(.3,.85,.3,1)`;
    this.hand.style.transform = `rotate(${this.deg}deg)`;
    this.paint();
    return { q, r, dur: REDUCED ? 0 : d, wait: sleep(d) };
  }
  // Короткий ход вперёд до остатка r из текущего положения (без лишних кругов)
  pointTo(r) { return this.spinTo(r, { maxTurns: 0, fromZero: false }); }
  light(r) { this.lit.add(r); this.paint(); }
}

/* =====================================================================
   Герой
   ===================================================================== */
(function hero() {
  const dial = new Dial($('#hero-dial'), { m: 5 });
  const input = $('#hero-n'), readout = $('#hero-readout'), note = $('#hero-note'), turnsEl = $('#hero-turns');
  let m = 5, busy = false;
  function countTurns(q, dur) {
    if (!dur) { turnsEl.textContent = q; return; }
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      turnsEl.textContent = Math.round(q * e);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  async function go() {
    if (busy) return;
    let n = Math.floor(Number(input.value));
    if (!Number.isFinite(n) || n < 0) n = 0;
    if (n > 9999999) n = 9999999;
    input.value = n;
    busy = true;
    const { q, r, dur, wait } = dial.spinTo(n);
    countTurns(q, dur);
    readout.innerHTML = `${fmt(n)} = ${m} · ${fmt(q)} + <b>${r}</b>`;
    note.innerHTML = q === 0
      ? `Число меньше ${m}: ни одного круга, стрелка сразу показывает <b>${r}</b>. Остаток равен самому числу.`
      : `Стрелка делает ${plural(q, 'полный круг', 'полных круга', 'полных кругов')} и останавливается на <b>${r}</b>. Это и есть остаток от деления ${fmt(n)} на ${m}.${q > 5 ? ' На экране нарисованы только первые пять кругов, остальные стрелка пролетает мгновенно.' : ''}`;
    await wait;
    busy = false;
  }
  $('#hero-go').addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  $$('#hero-mods .mod').forEach((b) => b.addEventListener('click', () => {
    $$('#hero-mods .mod').forEach((x) => x.classList.toggle('on', x === b));
    m = +b.dataset.m;
    dial.setM(m);
    turnsEl.textContent = 0;
    readout.innerHTML = `${fmt(+input.value || 0)} на циферблате ${m}: нажми «Крутить»`;
  }));
  setTimeout(go, REDUCED ? 0 : 700);
})();

/* =====================================================================
   Правило 2: лаборатория
   ===================================================================== */
(function lab() {
  const a = $('#lab-a'), b = $('#lab-b'), mI = $('#lab-m');
  const r = (x) => `<span class="r">${x}</span>`;
  const verdict = $('#lab-verdict');
  const intOf = (inp) => (/^-?\d{1,9}$/.test(inp.value.trim()) ? BigInt(inp.value.trim()) : null);
  const bmod = (x, m) => ((x % m) + m) % m;
  const bfmt = (x) => x.toLocaleString('ru-RU');
  function upd() {
    const A = intOf(a), B = intOf(b);
    const M = /^\d{1,2}$/.test(mI.value.trim()) ? BigInt(mI.value.trim()) : null;
    const bad = A === null || B === null || M === null || M < 2n;
    ['#lab-sum1', '#lab-prod1', '#lab-rep', '#lab-sum2', '#lab-prod2'].forEach((id) => { $(id).textContent = ''; });
    if (bad) {
      verdict.style.color = 'var(--bad)';
      verdict.textContent = 'Нужны целые числа a и b (до девяти цифр) и число делений от 2 до 99.';
      return;
    }
    const ra = bmod(A, M), rb = bmod(B, M);
    const s1 = bmod(A + B, M), p1 = bmod(A * B, M), s2 = bmod(ra + rb, M), p2 = bmod(ra * rb, M);
    $('#lab-sum1').innerHTML = `${bfmt(A)} + ${bfmt(B)} = ${bfmt(A + B)} → ${r(s1)}`;
    $('#lab-prod1').innerHTML = `${bfmt(A)} · ${bfmt(B)} = ${bfmt(A * B)} → ${r(p1)}`;
    $('#lab-rep').innerHTML = `${bfmt(A)} → ${r(ra)}, ${bfmt(B)} → ${r(rb)}`;
    $('#lab-sum2').innerHTML = `${ra} + ${rb} = ${ra + rb} → ${r(s2)}`;
    $('#lab-prod2').innerHTML = `${ra} · ${rb} = ${ra * rb} → ${r(p2)}`;
    const same = s1 === s2 && p1 === p2;
    verdict.style.color = same ? '' : 'var(--bad)';
    verdict.textContent = same
      ? `Совпало: на ${M}-циферблате оба способа приводят стрелку в одно место.`
      : 'Не совпало. Так быть не должно, сообщи автору страницы.';
  }
  [a, b, mI].forEach((i) => i.addEventListener('input', upd));
  $('#lab-rnd').addEventListener('click', () => {
    a.value = rnd(10, 999); b.value = rnd(10, 999); mI.value = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12][rnd(0, 9)];
    upd();
  });
  upd();
})();

/* =====================================================================
   Задача 1: 2021 · 2022 + 2023² на 5
   ===================================================================== */
(function p1() {
  const dial = new Dial($('#p1-dial'), { m: 5 });
  const chips = $$('#p1-expr .chip');
  const hint = $('#p1-hint');
  chips.forEach((c) => c.addEventListener('click', async () => {
    if (c.classList.contains('done')) return;
    const n = +c.dataset.n;
    c.classList.add('spin');
    const { r, wait } = dial.spinTo(n, { maxTurns: 3, dur: 1200 });
    hint.innerHTML = `${n} = 5 · ${Math.floor(n / 5)} + <b>${r}</b>: от числа ${n} на 5-циферблате остаётся <b>${r}</b>.`;
    await wait;
    c.classList.remove('spin');
    c.classList.add('done');
    c.innerHTML = `${r}<small>было ${n}</small>`;
    if (chips.every((x) => x.classList.contains('done'))) {
      hint.innerHTML = 'Все три числа заменены остатками. Четырёхзначные числа превратились в 1, 2 и 3.';
      $('#p1-after').hidden = false;
    }
  }));
  $('#p1-eleven').addEventListener('click', () => {
    const { r } = dial.spinTo(11, { maxTurns: 2 });
    hint.innerHTML = `11 = 5 · 2 + <b>${r}</b>. Вот и ответ, впиши его ниже.`;
  });
  $('#p1-btn').addEventListener('click', () => {
    const v = +$('#p1-in').value;
    if ($('#p1-in').value === '') return feedback($('#p1-fb'), false, 'Введи число от 0 до 4.');
    if (v === 1) { feedback($('#p1-fb'), true, 'Верно! Остаток 1: заменили числа остатками, получили 11, а 11 на 5-циферблате стоит на единице.'); markDone('p1'); }
    else if (v === 11) feedback($('#p1-fb'), false, '11 — это ещё не остаток: остаток меньше 5. Докрути 11 на циферблате.');
    else feedback($('#p1-fb'), false, 'Пока нет. Замени 2021, 2022, 2023 остатками и посчитай 1 · 2 + 3 · 3.');
  });
})();

/* =====================================================================
   Задача 2: 9^100
   ===================================================================== */
(function p2() {
  const dial = new Dial($('#p2-dial'), { m: 10 });
  const pills = $('#p2-pills'), msg = $('#p2-msg'), jump = $('#p2-jump'), jumpOut = $('#p2-jump-out');
  let m = 10, e = 0, r = 1, hist = [1], period = 0, busy = false;
  const sup = (k) => `9<sup>${k}</sup>`;
  function reset() {
    e = 0; r = 1; hist = [1]; period = 0;
    dial.setM(m);
    dial.pointTo(1);
    pills.innerHTML = '';
    pills.appendChild(h('span', 'pill', `${sup(0)} → <b>1</b>`));
    msg.innerHTML = `Стрелка на 1: это ${sup(0)}. Умножай на 9, пока остатки не начнут повторяться.`;
    jump.hidden = true;
    jumpOut.textContent = '';
  }
  async function mul() {
    if (busy) return;
    busy = true;
    e += 1;
    const prev = r;
    r = mod(prev * 9, m);
    hist.push(r);
    const { wait } = dial.spinTo(prev * 9, { maxTurns: 3, dur: 700 });
    // от нуля: prev · 9 шагов, как и написано в подсказке
    pills.appendChild(h('span', 'pill', `${sup(e)} → <b>${r}</b>`));
    if (!period) {
      const j = hist.indexOf(r);
      if (j < e) {
        period = e - j;
        $$('.pill', pills).forEach((p, i) => { if (i >= j && i < e) p.classList.add('cyc'); });
        msg.innerHTML = `Остаток ${r} уже был у ${sup(j)}. Дальше стрелка ходит по кругу из <b>${plural(period, 'шага', 'шагов', 'шагов')}</b>: ${hist.slice(j, e).join(', ')}, ${hist.slice(j, e).join(', ')}… Можно не крутить до ста.`;
        jump.hidden = false;
      } else {
        msg.innerHTML = `${prev} · 9 = ${prev * 9}, на ${m}-циферблате это <b>${r}</b>.`;
      }
    } else {
      msg.innerHTML = `Как и ожидалось: ${sup(e)} → ${r}. Узор повторяется.`;
    }
    await wait;
    busy = false;
  }
  $('#p2-mul').addEventListener('click', mul);
  $('#p2-reset').addEventListener('click', reset);
  $('#p2-jump-btn').addEventListener('click', () => {
    const k = Math.floor(100 / period), rem = 100 % period;
    const idx = rem === 0 ? period : rem;
    const ans = hist[idx];
    dial.pointTo(ans);
    const why = period === 1
      ? `Остаток всегда ${ans}: единица, сколько её ни умножай, остаётся единицей.`
      : `100 = ${period} · ${k}${rem ? ` + ${rem}` : ''}: ${k} полных ${period === 2 ? 'пары' : 'цикла'} по ${period} шагов${rem ? ` и ещё ${plural(rem, 'шаг', 'шага', 'шагов')}` : ''}. Поэтому ${sup(100)} стоит там же, где ${sup(idx)}.`;
    jumpOut.innerHTML = `${sup(100)} на ${m}-циферблате → ${ans}`;
    msg.innerHTML = why;
  });
  $$('#p2-mods .mod').forEach((b) => b.addEventListener('click', () => {
    $$('#p2-mods .mod').forEach((x) => x.classList.toggle('on', x === b));
    m = +b.dataset.m;
    reset();
  }));
  // Таблица настоящих степеней
  const tbl = $('#p2-table');
  let v = 1n;
  for (let k = 1; k <= 8; k++) {
    v *= 9n;
    const s = v.toString();
    const tr = h('tr');
    tr.appendChild(h('td', '', `9<sup>${k}</sup>`));
    tr.appendChild(h('td', '', `${s.slice(0, -1)}<span class="last">${s.slice(-1)}</span>`));
    tbl.appendChild(tr);
  }
  $('#p2-btn').addEventListener('click', () => {
    const a = $('#p2a-in').value, b = $('#p2b-in').value, c = $('#p2c-in').value;
    const parts = [];
    const oks = [];
    if (a !== '') { const ok = +a === 1; oks.push(ok); if (ok) markDone('p2a'); parts.push(`(а) ${ok ? 'верно' : 'нет: круг из 2 шагов, сотня чётная'}`); }
    if (b !== '') { const ok = +b === 1; oks.push(ok); if (ok) markDone('p2b'); parts.push(`(б) ${ok ? 'верно' : 'нет: 9 на 8-циферблате стоит на 1'}`); }
    if (c !== '') { const ok = +c === 2; oks.push(ok); if (ok) markDone('p2c'); parts.push(`(в) ${ok ? 'верно' : 'нет: круг из 3 шагов, 100 = 3 · 33 + 1'}`); }
    if (!parts.length) return feedback($('#p2-fb'), false, 'Заполни хотя бы один ответ.');
    const allNow = oks.length === 3 && oks.every(Boolean);
    feedback($('#p2-fb'), oks.every(Boolean), parts.join(' · ') + (allNow ? '. Все три верно: 1, 1 и 2.' : ''));
  });
  reset();
})();

/* =====================================================================
   Задача 3: Поле Чудес
   ===================================================================== */
(function p3() {
  const cal = $('#p3-cal'), info = $('#p3-info');
  let D = 28, sel = 0;
  function build() {
    cal.innerHTML = '';
    for (let k = 1; k <= D; k++) {
      const d = h('button', 'day', `${k}`);
      d.type = 'button';
      if (k === 1) { d.classList.add('fixed'); d.innerHTML = '1<small>🪙 1000</small>'; }
      d.dataset.k = k;
      d.addEventListener('click', () => { if (k > 1) pick(k); else info.innerHTML = '<p>1 февраля монеты пересчитали. Буратино сажал дерево в один из <b>следующих</b> дней.</p>'; });
      cal.appendChild(d);
    }
    const mar = h('div', 'day mar', '1<small>марта 🪙 2400</small>');
    cal.appendChild(mar);
  }
  function check(k) {
    const n = D - k + 1, rest = 1400 - n;
    return { n, rest, ok: rest % D === 0, N: rest / D, rem: rest % D };
  }
  function pick(k, quiet) {
    sel = k;
    const { n, rest, ok, N, rem } = check(k);
    $$('.day', cal).forEach((d) => { d.classList.toggle('sel', +d.dataset.k === k); if (!quiet) d.classList.remove('ok', 'no'); });
    const cell = $(`.day[data-k="${k}"]`, cal);
    cell.classList.toggle('ok', ok);
    cell.classList.toggle('no', !ok);
    info.innerHTML = `
      <p>Дерево посажено <b>${k} февраля</b>. До 1 марта оно застанет ${nights(n)} (первая — с ${k}-го на ${k + 1 > D ? '1 марта' : `${k + 1}-е`}, последняя — с ${D}-го на 1 марта) и даст <b>${n}</b> монет.</p>
      <p class="mono">1400 − ${n} = ${rest} монет дали старые деревья за ${D} ночей.</p>
      <p class="mono">${rest} : ${D} = ${Math.floor(rest / D)}${rem ? ` (остаток ${rem})` : ''}</p>
      ${ok
        ? `<p class="yes">Делится без остатка! Старых деревьев было ${N}. Проверка: ${N} · ${D} + ${n} = ${N * D + n}. Подходит.</p>`
        : `<p class="nope">Не делится: число деревьев должно быть целым. ${k} февраля не подходит.</p>`}`;
  }
  let checking = false;
  async function all() {
    if (checking) return;
    checking = true;
    $$('#p3-mods .mod').forEach((b) => { b.disabled = true; });
    $('#p3-all').disabled = true;
    try { await allRun(); } finally {
      checking = false;
      $$('#p3-mods .mod').forEach((b) => { b.disabled = false; });
      $('#p3-all').disabled = false;
    }
  }
  async function allRun() {
    info.innerHTML = '<p>Проверяю все дни…</p>';
    const good = [];
    for (let k = 2; k <= D; k++) {
      const c = check(k);
      const cell = $(`.day[data-k="${k}"]`, cal);
      cell.classList.toggle('ok', c.ok);
      cell.classList.toggle('no', !c.ok);
      if (c.ok) good.push(k);
      await sleep(45);
    }
    if (good.length) info.innerHTML = `<p class="yes">Подходит только ${good.join(', ')} февраля.</p><p>Секрет: 1400 = ${D} · ${Math.floor(1400 / D)} + <b>${1400 % D}</b>. Остаток ${1400 % D} — это ровно число ночей нового дерева.</p>`;
    else info.innerHTML = `<p class="nope">Ни один день не подходит!</p><p>1400 = 28 · 50, остаток 0. Новое дерево должно было бы прожить все 28 ночей (посадка 1 февраля) или 0 ночей (посадка 1 марта). Условие это запрещает. Значит, февраль был <b>високосным</b>: переключи на 29 дней.</p>`;
  }
  $$('#p3-mods .mod').forEach((b) => b.addEventListener('click', () => {
    $$('#p3-mods .mod').forEach((x) => x.classList.toggle('on', x === b));
    D = +b.dataset.d;
    build();
    info.innerHTML = `<p>В феврале ${D} дней, значит, с 1 февраля по 1 марта ${nights(D)}. Выбери день.</p>`;
  }));
  $('#p3-all').addEventListener('click', all);

  // «На пальцах»: лента дней и ночей
  const tl = $('#p3-timeline'), fmsg = $('#p3-fing-msg');
  let fingRun = 0;
  async function fingers(k) {
    const run = ++fingRun;
    tl.innerHTML = '';
    const days = [21, 22, 23, 24, 25, 26, 27, 28, 29, 'Мар 1'];
    const nightEls = [];
    days.forEach((d, i) => {
      const day = h('div', 'tl-day', typeof d === 'number' ? `${d}<small>фев</small>` : '1<small>марта</small>');
      day.dataset.d = d;
      if (d === k) { day.classList.add('planted'); day.innerHTML += '<span class="tree">🌱</span>'; }
      if (typeof d === 'number' && d < k) day.classList.add('before');
      tl.appendChild(day);
      if (i < days.length - 1) {
        const night = h('div', 'tl-night', '<span class="moon">🌙</span><span class="coin"></span>');
        night.dataset.from = d;
        if (typeof d === 'number' && d >= k) nightEls.push(night); else night.classList.add('off');
        tl.appendChild(night);
      }
    });
    fmsg.innerHTML = `Дерево посадили днём ${k}-го без единой монеты. Считаем ночи…`;
    let c = 0;
    for (const nEl of nightEls) {
      await sleep(420);
      if (run !== fingRun) return;
      c += 1;
      nEl.classList.add('on');
      $('.coin', nEl).textContent = c;
      if (tl.scrollWidth > tl.clientWidth) tl.scrollTo({ left: nEl.offsetLeft - tl.clientWidth / 2 + nEl.offsetWidth / 2, behavior: REDUCED ? 'auto' : 'smooth' });
      const from = nEl.dataset.from, to = +from === 29 ? '1 марта' : `${+from + 1}-е`;
      fmsg.innerHTML = `Ночь ${c}: с ${from}-го на ${to}, выросла монета № ${c}.`;
    }
    await sleep(300);
    if (run !== fingRun) return;
    const total = nightEls.length;
    if (total === 8) fmsg.innerHTML = `Итого <b>8 ночей</b> и <b>8 монет</b>: ровно остаток от деления 1400 на 29. Посадка 22-го подходит. Заметь: дней с 22-го по 1 марта девять, а ночей между ними восемь.`;
    else fmsg.innerHTML = `Итого <b>${nights(total)}</b> и <b>${total}</b> монет, а нужно 8. ${k === 21 ? 'Если вычесть 29 − 8 = 21, получится день, когда дерева ещё не было: первая его ночь началась бы 21-го, и монет вышло бы девять.' : 'На одну ночь меньше, чем нужно: посадили слишком поздно.'}`;
  }
  $$('#p3-fing-mods .mod').forEach((b) => b.addEventListener('click', () => {
    $$('#p3-fing-mods .mod').forEach((x) => x.classList.toggle('on', x === b));
    fingers(+b.dataset.k);
  }));
  fingers(22);
  $('#p3-btn').addEventListener('click', () => {
    const v = +$('#p3-in').value;
    if (!v) return feedback($('#p3-fb'), false, 'Введи число месяца.');
    if (v === 22) { feedback($('#p3-fb'), true, 'Верно! 22 февраля високосного года: 1400 = 29 · 48 + 8, дерево застало 8 ночей.'); markDone('p3'); }
    else if (v === 1) feedback($('#p3-fb'), false, '1 февраля монеты уже посчитали, дерево сажали позже.');
    else feedback($('#p3-fb'), false, 'Проверь этот день в календаре: делится ли 1400 минус ночи нового дерева на число ночей?');
  });
  build();
})();

/* =====================================================================
   Задача 4: карманы
   ===================================================================== */
(function p4() {
  const inputs = $$('#p4-inputs input'), pockets = $('#p4-pockets'), msg = $('#p4-msg'), smsg = $('#p4-sum-msg');
  function nums() {
    const v = inputs.map((i) => i.value.trim()).filter((t) => /^-?\d{1,7}$/.test(t)).map(Number);
    return [...new Set(v)];
  }
  function buildPockets() {
    pockets.innerHTML = '';
    for (let r = 0; r < 5; r++) { const p = h('div', 'pocket'); p.dataset.r = r; pockets.appendChild(p); }
  }
  async function sort() {
    const v = nums();
    smsg.textContent = '';
    smsg.className = 'pocket-msg';
    if (v.length < 6) { msg.className = 'pocket-msg bad'; msg.textContent = 'Нужны шесть разных целых чисел (без дробей, до семи цифр).'; return; }
    buildPockets();
    msg.className = 'pocket-msg';
    msg.textContent = '';
    const by = new Map();
    for (const x of v) {
      const r = mod(x, 5);
      const tok = h('span', 'tok', x);
      $(`.pocket[data-r="${r}"]`, pockets).appendChild(tok);
      if (!by.has(r)) by.set(r, []);
      by.get(r).push(x);
      await sleep(260);
    }
    const crowd = [...by.entries()].filter(([, arr]) => arr.length >= 2);
    crowd.forEach(([r]) => $(`.pocket[data-r="${r}"]`, pockets).classList.add('crowd'));
    const [r, arr] = crowd[0];
    const [x, y] = [Math.max(arr[0], arr[1]), Math.min(arr[0], arr[1])];
    msg.className = 'pocket-msg ok';
    msg.innerHTML = `В кармане «${r}» оказались ${x} и ${y}. Их разность ${x} − ${y < 0 ? `(${y})` : y} = ${x - y} = 5 · ${(x - y) / 5}. Делится! Так будет с любыми шестью числами: карманов пять, а чисел шесть.`;
  }
  $('#p4-sort').addEventListener('click', sort);
  $('#p4-rnd').addEventListener('click', () => {
    const s = new Set();
    while (s.size < 6) s.add(rnd(-20, 99));
    [...s].forEach((x, i) => { inputs[i].value = x; });
    sort();
  });
  $('#p4-hint').addEventListener('click', () => {
    [1, 6, 11, 16, 21, 26].forEach((x, i) => { inputs[i].value = x; });
    sort();
  });
  $('#p4-sums').addEventListener('click', () => {
    const v = nums();
    if (v.length < 6) { smsg.className = 'pocket-msg bad'; smsg.textContent = 'Сначала введи шесть разных целых чисел.'; return; }
    const hits = [];
    for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (mod(v[i] + v[j], 5) === 0) hits.push(`${v[i]} + ${v[j]} = ${v[i] + v[j]}`);
    if (hits.length) { smsg.className = 'pocket-msg bad'; smsg.innerHTML = `Есть суммы, делящиеся на 5: ${hits.slice(0, 4).join('; ')}${hits.length > 4 ? '…' : ''}. Попробуй собрать все числа в одном кармане (кроме кармана 0).`; }
    else { smsg.className = 'pocket-msg ok'; smsg.innerHTML = `Ни одна из 15 сумм не делится на 5! Ты нашёл контрпример: ${v.join(', ')}. Значит, для суммы утверждение неверно.`; }
  });
  const fb = $('#p4-fb');
  $('#p4-yes').addEventListener('click', () => { $('#p4-yes').className = 'btn choice picked-bad'; $('#p4-no').className = 'btn choice'; feedback(fb, false, 'Нет: достаточно одного контрпримера. Нажми «Подсказка для (б)» и проверь суммы.'); });
  $('#p4-no').addEventListener('click', () => { $('#p4-no').className = 'btn choice picked-ok'; $('#p4-yes').className = 'btn choice'; feedback(fb, true, 'Верно! Например, 1, 6, 11, 16, 21, 26: все суммы дают остаток 2.'); markDone('p4'); });
  buildPockets();
})();

/* =====================================================================
   Задача 5: шпионы
   ===================================================================== */
(function p5() {
  const SPIES = ['Джеймс', 'Анна', 'Борис', 'Вера', 'Глеб', 'Дина'];
  const range = $('#p5-range'), view = $('#p5-view'), cap = $('#p5-cap');
  let stage = 1;
  const candy = (cls = '', delay = 0) => { const i = h('i', 'cd ' + cls); if (delay) i.style.animationDelay = `${delay}ms`; return i; };
  const column = (k, cls, delay) => { const c = h('div', 'ccol'); for (let i = 0; i < k; i++) c.appendChild(candy(cls)); if (delay) c.style.animationDelay = `${delay}ms`; return c; };
  const quad = (cls, delay) => { const q = h('div', 'quad'); for (let i = 0; i < 4; i++) q.appendChild(candy(cls)); if (delay) q.style.animationDelay = `${delay}ms`; return q; };

  function stage1(k) {
    const T = 24 * k + 18;
    const wrap = h('div', 'rucksack');
    const days = h('div', 'days');
    for (let d = 0; d < 24; d++) {
      const cell = h('div', 'daycell');
      cell.appendChild(column(k, 's0', d * 40));
      cell.appendChild(h('small', '', d + 1));
      days.appendChild(cell);
    }
    const spare = h('div', 'spare');
    const sp = h('div', 'spare-box');
    for (let i = 0; i < 18; i++) sp.appendChild(candy('sx', 960 + i * 30));
    spare.appendChild(sp);
    spare.appendChild(h('small', '', '18 запасных'));
    wrap.appendChild(days);
    wrap.appendChild(spare);
    view.replaceChildren(wrap);
    cap.innerHTML = `<p>24 дня по <b>${k}</b> конфет и ещё 18 запасных.</p><p class="formula">24 · ${k} + 18 = ${T}</p><p>Форма числа: <span class="mono">24k + 18</span>. Она одна и та же при любом k.</p>`;
  }
  function stage2(k) {
    const T = 24 * k + 18, each = 4 * k + 3;
    const wrap = h('div', 'spies');
    SPIES.forEach((name, sIdx) => {
      const row = h('div', 'spy-row');
      row.style.animationDelay = `${sIdx * 180}ms`;
      row.appendChild(h('span', 'spy-name', `🕵️ ${name}`));
      const cols = h('div', 'spy-cols');
      for (let c = 0; c < 4; c++) cols.appendChild(column(k, `s${sIdx}`));
      row.appendChild(cols);
      const loose = h('div', 'loose');
      for (let i = 0; i < 3; i++) loose.appendChild(candy('sx'));
      row.appendChild(loose);
      row.appendChild(h('span', 'spy-sum mono', `4 · ${k} + 3 = ${each}`));
      wrap.appendChild(row);
    });
    view.replaceChildren(wrap);
    cap.innerHTML = `<p>24 дневных столбика делятся на шестерых поровну: по <b>4 столбика</b> каждому (24 = 6 · 4). 18 запасных тоже делятся: по <b>3</b> каждому (18 = 6 · 3).</p><p class="formula">(24 · ${k} + 18) : 6 = 4 · ${k} + 3 = ${each}</p><p>У каждого шпиона <span class="mono">4k + 3</span> конфет: 4 столбика по k плюс 3 штуки. Это верно при любом k, потому что 24 и 18 делятся на 6.</p>`;
  }
  function stage3(k) {
    const each = 4 * k + 3, q = Math.floor(k / 6), j = k % 6, r = 4 * j + 3;
    const wrap = h('div', 'james');
    // Поворот: 4 столбика по k = k четвёрок
    const left = h('div', 'james-left');
    left.appendChild(h('p', 'jl-h', `Те же 4 столбика по ${k}, только смотрим на строки: каждая строка — четвёрка. Строк ровно <b>${plural(k, 'четвёрка', 'четвёрки', 'четвёрок')}</b>, и ещё 3 конфеты`));
    const quads = h('div', 'quads');
    for (let i = 0; i < k; i++) quads.appendChild(quad('s0', i * 60));
    const loose = h('div', 'loose big');
    for (let i = 0; i < 3; i++) loose.appendChild(candy('sx'));
    quads.appendChild(loose);
    left.appendChild(quads);
    wrap.appendChild(left);
    // Дни по 6 четвёрок
    const right = h('div', 'james-right');
    right.appendChild(h('p', 'jl-h', 'День = 24 конфеты = <b>6 четвёрок</b>'));
    const daysBox = h('div', 'jdays');
    let delay = 600;
    for (let d = 0; d < q; d++) {
      const box = h('div', 'jday');
      for (let i = 0; i < 6; i++) { box.appendChild(quad('s0', delay)); delay += 90; }
      box.appendChild(h('small', '', `день ${d + 1}`));
      daysBox.appendChild(box);
    }
    if (q === 0) daysBox.appendChild(h('p', 'small', 'На целый день четвёрок не хватает: ни одного полного дня.'));
    right.appendChild(daysBox);
    const rest = h('div', 'jrest');
    rest.style.animationDelay = `${delay + 200}ms`;
    const restQ = h('div', 'quads');
    for (let i = 0; i < j; i++) restQ.appendChild(quad('s0', delay + 200));
    const restLoose = h('div', 'loose big');
    for (let i = 0; i < 3; i++) restLoose.appendChild(candy('sx'));
    restQ.appendChild(restLoose);
    rest.appendChild(restQ);
    rest.appendChild(h('small', '', `отложено: ${j ? `${j} · 4 + 3` : '0 · 4 + 3'} = ${r}`));
    right.appendChild(rest);
    wrap.appendChild(right);
    view.replaceChildren(wrap);
    cap.innerHTML = `<p>Джеймс отдаёт на каждый день по 6 четвёрок. Четвёрок у него <b>${k}</b>: ${k} = 6 · ${q} + <b>${j}</b>, то есть ${plural(q, 'полный день', 'полных дня', 'полных дней')} и ${plural(j, 'лишняя четвёрка', 'лишние четвёрки', 'лишних четвёрок')}. Плюс 3 конфеты, которые четвёрку не образуют.</p><p class="formula">${each} = 24 · ${q} + (4 · ${j} + 3) = 24 · ${q} + ${r}</p><p>Отложено <b>${r}</b>. Оставшееся всегда имеет вид «несколько четвёрок (меньше шести) плюс 3», и это уже не зависит от того, большое k или маленькое.</p>`;
  }
  function render() {
    const k = +range.value;
    $('#p5-k').textContent = k;
    [stage1, stage2, stage3][stage - 1](k);
  }
  range.addEventListener('input', render);
  $$('#p5-stages .mod').forEach((b) => b.addEventListener('click', () => {
    $$('#p5-stages .mod').forEach((x) => x.classList.toggle('on', x === b));
    stage = +b.dataset.stage;
    render();
  }));
  render();

  // Любое k: точный счёт на BigInt + циферблат
  const dial = new Dial($('#p5-dial'), { m: 24 });
  const bigIn = $('#p5-bigk'), bigOut = $('#p5-bigout'), litEl = $('#p5-lit');
  const seen = new Set();
  function big() {
    const t = bigIn.value.trim();
    $$('#p5-jtable td').forEach((td) => td.classList.remove('on'));
    if (!/^\d{1,15}$/.test(t)) { bigOut.innerHTML = '<span class="bad-t">Введи целое неотрицательное k (до 15 цифр).</span>'; return; }
    const k = BigInt(t), q = k / 6n, j = k % 6n, each = 4n * k + 3n, r = 4n * j + 3n;
    const f = (x) => x.toLocaleString('ru-RU');
    bigOut.innerHTML = `<p>k = ${f(k)} = 6 · ${f(q)} + <b>${j}</b></p><p>Джеймсу: 4k + 3 = ${f(each)}</p><p>${f(each)} = 24 · ${f(q)} + <b>${r}</b> → отложено <b>${r}</b></p>`;
    $(`#p5-jtable td[data-j="${j}"]`).classList.add('on');
    const rn = Number(r);
    dial.pointTo(rn);
    seen.add(rn);
    dial.light(rn);
    litEl.innerHTML = '';
    [...seen].sort((a, b) => a - b).forEach((x) => litEl.appendChild(h('span', 'pill lit', x)));
  }
  bigIn.addEventListener('input', () => { $$('#p5-presets .mod').forEach((x) => x.classList.remove('on')); big(); });
  $$('#p5-presets .mod').forEach((b) => b.addEventListener('click', () => {
    $$('#p5-presets .mod').forEach((x) => x.classList.toggle('on', x === b));
    bigIn.value = b.dataset.k;
    big();
  }));
  big();

  $('#p5-btn').addEventListener('click', () => {
    const raw = $('#p5-in').value.trim();
    const tokens = raw.split(/[,;\s]+/).filter(Boolean);
    if (!tokens.length) return feedback($('#p5-fb'), false, 'Перечисли числа через запятую.');
    const badTok = tokens.filter((t) => !/^\d{1,3}$/.test(t));
    if (badTok.length) return feedback($('#p5-fb'), false, `Не понимаю «${badTok[0]}». Нужны целые неотрицательные числа через запятую.`);
    const got = [...new Set(tokens.map(Number))].sort((a, b) => a - b);
    const want = [3, 7, 11, 15, 19, 23];
    const extra = got.filter((x) => !want.includes(x)), miss = want.filter((x) => !got.includes(x));
    if (!extra.length && !miss.length) { feedback($('#p5-fb'), true, 'Верно! 3, 7, 11, 15, 19 или 23: несколько четвёрок (от нуля до пяти) и ещё три конфеты.'); markDone('p5'); }
    else if (extra.length) feedback($('#p5-fb'), false, `Лишнее: ${extra.join(', ')}. У Джеймса 4k + 3 конфет: остаток обязан быть «четвёрки плюс три».`);
    else feedback($('#p5-fb'), false, `Не хватает: ${miss.join(', ')}. Проверь k = 1, 2, 3, 4, 5, 6 в поле «Любое k».`);
  });
})();

/* =====================================================================
   Задача 6: доска
   ===================================================================== */
(function p6() {
  const NUMS = Array.from({ length: 64 }, (_, i) => 1 + 10 * i);
  const numsEl = $('#p6-nums'), board = $('#p6-board'), info = $('#p6-info'), nummsg = $('#p6-nummsg');
  NUMS.forEach((n) => { const s = h('span', 'num', n); s.dataset.n = n; numsEl.appendChild(s); });
  let colored = false, placed = false;
  async function color() {
    if (colored) return;
    colored = true;
    const chips = $$('.num', numsEl);
    for (const c of chips) { c.classList.add(c.dataset.n % 4 === 1 ? 't1' : 't3'); await sleep(18); }
    nummsg.innerHTML = `Остатки чередуются: <b style="color:var(--blue)">1</b>, <b style="color:var(--orange)">3</b>, 1, 3… Каждое следующее число больше на 10, а 10 на 4-циферблате — это 2. Чисел с остатком 1 ровно 32, с остатком 3 тоже 32.`;
    $('#p6-place').disabled = false;
  }
  const cells = [];
  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8), col = i % 8;
    const c = h('div', 'sq' + ((row + col) % 2 ? ' dark' : ''));
    c.dataset.i = i;
    board.appendChild(c);
    cells.push(c);
    c.addEventListener('mouseenter', () => show(i));
    c.addEventListener('click', () => show(i));
  }
  function neighbours(i) {
    const r = Math.floor(i / 8), c = i % 8, out = [];
    if (r > 0) out.push(i - 8); if (r < 7) out.push(i + 8); if (c > 0) out.push(i - 1); if (c < 7) out.push(i + 1);
    return out;
  }
  function show(i) {
    if (!placed || !cells[i].dataset.n || neighbours(i).some((j) => !cells[j].dataset.n)) return;
    cells.forEach((c) => c.classList.remove('focus', 'nb'));
    cells[i].classList.add('focus');
    const n = +cells[i].dataset.n;
    const lines = neighbours(i).map((j) => { cells[j].classList.add('nb'); const m = +cells[j].dataset.n; return `<p class="mono">${n} + ${m} = ${n + m} = 4 · ${(n + m) / 4} <span class="okm">✓</span></p>`; });
    info.innerHTML = `<p>Клетка с числом <b>${n}</b> (остаток ${n % 4}). Соседи другого цвета, у них остаток ${n % 4 === 1 ? 3 : 1}:</p>${lines.join('')}`;
  }
  async function place() {
    if (placed) return;
    placed = true;
    const t1 = NUMS.filter((n) => n % 4 === 1), t3 = NUMS.filter((n) => n % 4 === 3);
    for (let i = 0; i < 64; i++) {
      const dark = cells[i].classList.contains('dark');
      const n = dark ? t1.shift() : t3.shift();
      cells[i].dataset.n = n;
      cells[i].textContent = n;
      cells[i].classList.add(dark ? 't1' : 't3', 'wave');
      $(`.num[data-n="${n}"]`, numsEl).classList.add('gone');
      await sleep(30);
    }
    info.innerHTML = '<p>Синие (остаток 1) на тёмных клетках, оранжевые (остаток 3) на светлых. Соседи по стороне всегда разного цвета. Наведи на любую клетку и проверь суммы.</p>';
  }
  $('#p6-color').addEventListener('click', color);
  $('#p6-place').addEventListener('click', place);

  // Мини-доска: заливка
  const mini = $('#p6-mini'), fmsg = $('#p6-floodmsg');
  const mcells = [];
  let flooding = false;
  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8), col = i % 8;
    const c = h('div', 'sq' + ((row + col) % 2 ? ' dark' : ''));
    mini.appendChild(c);
    mcells.push(c);
    c.addEventListener('click', () => flood(i));
  }
  async function flood(start) {
    if (flooding) return;
    flooding = true;
    mcells.forEach((c) => { c.classList.remove('t1', 'wave'); c.textContent = ''; });
    const dist = new Array(64).fill(-1);
    dist[start] = 0;
    const queue = [start];
    while (queue.length) { const i = queue.shift(); for (const j of neighbours(i)) if (dist[j] < 0) { dist[j] = dist[i] + 1; queue.push(j); } }
    const maxD = Math.max(...dist);
    mcells[start].classList.add('t1', 'wave');
    fmsg.innerHTML = 'Поставили синее число. Чтобы сумма с соседом не делилась на 4, сосед тоже должен быть синим…';
    for (let d = 1; d <= maxD; d++) {
      await sleep(140);
      mcells.forEach((c, i) => { if (dist[i] === d) c.classList.add('t1', 'wave'); });
      if (d === 2) fmsg.innerHTML = '…и соседи соседей тоже синие…';
    }
    await sleep(200);
    fmsg.innerHTML = 'Все 64 клетки должны быть синими. А синих чисел у нас только 32, остальные 32 оранжевые. Значит, так расставить <b>нельзя</b>.';
    flooding = false;
  }

  const fb = $('#p6-fb');
  const ans = { a: 'yes', b: 'no' };
  const got = {};
  $$('#p6 .choice').forEach((b) => b.addEventListener('click', () => {
    const q = b.dataset.q, v = b.dataset.v;
    $$(`#p6 .choice[data-q="${q}"]`).forEach((x) => { x.className = 'btn choice'; });
    const ok = v === ans[q];
    b.classList.add(ok ? 'picked-ok' : 'picked-bad');
    got[q] = ok;
    const t = [];
    if ('a' in got) t.push(`(а) ${got.a ? 'верно: шахматная раскраска' : 'нет, подумай про цвета клеток доски'}`);
    if ('b' in got) t.push(`(б) ${got.b ? 'верно: вся доска должна стать одного цвета' : 'нет, попробуй опыт с заливкой'}`);
    const all = got.a && got.b;
    feedback(fb, all || (got[q] && Object.keys(got).length === 1), t.join(' · '));
    if (all) markDone('p6');
  }));
})();

/* =====================================================================
   Задача 7: признак делимости на 11
   ===================================================================== */
(function p7() {
  const input = $('#p7-in'), digitsEl = $('#p7-digits'), sumEl = $('#p7-sum'), verdict = $('#p7-verdict'), expand = $('#p7-expand');
  const mod11 = (s) => [...s].reduce((acc, ch) => (acc * 10 + +ch) % 11, 0);
  const altSum = (s) => [...s].reverse().reduce((acc, ch, i) => acc + (i % 2 ? -1 : 1) * +ch, 0);
  function upd() {
    const s = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (s !== input.value) input.value = s;
    digitsEl.innerHTML = '';
    if (!s) { sumEl.textContent = ''; verdict.textContent = ''; expand.innerHTML = ''; return; }
    const ds = [...s];
    const n = ds.length;
    ds.forEach((d, i) => {
      const k = n - 1 - i; // разряд
      const plus = k % 2 === 0;
      const box = h('div', 'dg ' + (plus ? 'plus' : 'minus'));
      box.innerHTML = `<span class="sg">${plus ? '+' : '−'}</span>${d}`;
      digitsEl.appendChild(box);
    });
    const sum = altSum(s);
    const terms = ds.map((d, i) => { const k = n - 1 - i; return k % 2 === 0 ? `+ ${d}` : `− ${d}`; }).reverse().join(' ').replace(/^\+ /, '');
    sumEl.innerHTML = `${terms} = ${sum}`;
    const div = mod11(s) === 0;
    verdict.className = 'alt-verdict ' + (div ? 'ok' : 'bad');
    verdict.innerHTML = div
      ? `${sum} делится на 11, значит, и ${fmt(Number(s))} делится на 11${s.length <= 15 ? ` (это 11 · ${(BigInt(s) / 11n).toLocaleString('ru-RU')})` : ''}.`
      : `${sum} на 11 не делится (остаток ${mod(sum, 11)}), значит, и ${fmt(Number(s))} не делится: его остаток тоже ${mod11(s)}.`;
    // Разложение
    const pow = (k) => (k === 0 ? '1' : '1' + '0'.repeat(k));
    const near = (k) => { if (k === 0) return '1'; const p = BigInt(pow(k)); return k % 2 ? `(${(p + 1n).toLocaleString('ru-RU')} − 1)` : `(${(p - 1n).toLocaleString('ru-RU')} + 1)`; };
    const l1 = ds.map((d, i) => { const k = n - 1 - i; return `${d} · ${pow(k)}`; }).join(' + ');
    const l2 = ds.map((d, i) => { const k = n - 1 - i; return `${d} · ${near(k)}`; }).join(' + ');
    const l3 = ds.map((d, i) => { const k = n - 1 - i; return k % 2 ? `${d} · <span class="m1">(−1)</span>` : `${d} · <span class="p1">(+1)</span>`; }).join(' + ');
    expand.innerHTML = `
      <p>${fmt(Number(s))} = ${l1}</p>
      <p>= ${l2}</p>
      <p>= <span class="k11">(куски, кратные 11)</span> + ${l3}</p>
      <p>→ на 11-циферблате это то же место, что ${terms} = <b>${sum}</b></p>`;
  }
  input.addEventListener('input', upd);
  upd();

  // Циферблат степеней десятки
  const dial = new Dial($('#p7-dial'), { m: 11 });
  const tens = $('#p7-tens'), pmsg = $('#p7-powmsg');
  const texts = {
    1: 'Единицы: стрелка на 1.',
    10: '10 = 11 − 1. Десять шагов вперёд привели на один шаг <b>назад</b> от нуля: место 10 — это −1.',
    100: '100 = 99 + 1. Девять полных кругов и шаг <b>вперёд</b>: место 1, то есть +1.',
    1000: '1000 = 1001 − 1 (а 1001 = 11 · 91). Снова шаг <b>назад</b>: −1.',
    10000: '10 000 = 9999 + 1 (а 9999 = 11 · 909). Снова +1. Знаки чередуются: +, −, +, −…',
  };
  const seen = new Set();
  $$('#p7-pow .mod').forEach((b) => b.addEventListener('click', () => {
    const n = +b.dataset.n;
    $$('#p7-pow .mod').forEach((x) => x.classList.toggle('on', x === b));
    dial.spinTo(n, { maxTurns: 3, dur: 900 });
    pmsg.innerHTML = texts[n];
    seen.add(n);
    tens.innerHTML = [1, 10, 100, 1000, 10000].filter((x) => seen.has(x)).map((x) => {
      const r = x % 11;
      return `<p>${fmt(x)} → место ${r}${r === 1 ? ', <span class="p1">это +1</span>' : ', <span class="m1">то же, что −1</span>'}</p>`;
    }).join('');
  }));

  // Викторина
  const QUIZ = [121, 2024, 12345, 918082, 4719, 90816];
  const quiz = $('#p7-quiz'), fb = $('#p7-fb');
  const res = {};
  QUIZ.forEach((n) => {
    const s = String(n), div = n % 11 === 0, sum = altSum(s);
    const card = h('div', 'qz');
    card.innerHTML = `<p class="qn">${fmt(n)}</p><div class="row"><button type="button" class="btn choice small-btn" data-v="yes">Делится</button><button type="button" class="btn choice small-btn" data-v="no">Нет</button></div><p class="exp"></p>`;
    const exp = $('.exp', card);
    $$('.choice', card).forEach((b) => b.addEventListener('click', () => {
      $$('.choice', card).forEach((x) => { x.className = 'btn choice small-btn'; });
      const ok = (b.dataset.v === 'yes') === div;
      b.classList.add(ok ? 'picked-ok' : 'picked-bad');
      const ts = [...s].reverse().map((d, i) => (i % 2 ? `− ${d}` : `+ ${d}`)).join(' ').replace(/^\+ /, '');
      exp.innerHTML = `${ts} = ${sum}${div ? ', делится' : `, остаток ${mod(sum, 11)}`}${ok ? ' ✓' : ''}`;
      res[n] = ok;
      const good = Object.values(res).filter(Boolean).length;
      if (good >= 4) { feedback(fb, true, `Отлично: ${good} из ${QUIZ.length} верно. Признак освоен!`); markDone('p7'); }
      else feedback(fb, false, `Верно ${good} из ${Object.keys(res).length}. Нужно хотя бы четыре правильных.`);
    }));
    quiz.appendChild(card);
  });
})();

renderProgress();
