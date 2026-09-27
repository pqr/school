'use strict';

/* =====================================================================
   Общие помощники
   ===================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);

// 24360 → «24 360» (неразрывный пробел между разрядами)
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function fact(n) {
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}

// Все перестановки массива в лексикографическом порядке
function perms(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((x, i) => {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    perms(rest).forEach((p) => out.push([x, ...p]));
  });
  return out;
}

// Все k-элементные подмножества {1..n}
function combos(n, k, start = 1) {
  if (k === 0) return [[]];
  const out = [];
  for (let i = start; i <= n - k + 1; i++) {
    combos(n, k - 1, i + 1).forEach((c) => out.push([i, ...c]));
  }
  return out;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Перерисовка через innerHTML уничтожает кнопку, на которой был фокус.
   Запоминаем её по атрибуту и после перерисовки фокусируем такую же. */
function keepFocus(container, redraw, attr = 'data-k') {
  const a = document.activeElement;
  const val = a && container.contains(a) ? a.getAttribute(attr) : null;
  redraw();
  if (val !== null) container.querySelector(`[${attr}="${CSS.escape(val)}"]`)?.focus();
}

/* FLIP-анимация: элементы с одинаковым data-k плавно переезжают
   со старого места на новое, новые элементы «выпрыгивают».
   Математическое состояние от анимации не зависит: DOM сразу
   нарисован в новом виде, анимация только сглаживает переход. */
function flip(container, mutate, { height = true } = {}) {
  const visible = container.offsetParent !== null && !REDUCED;
  const before = new Map();
  const h0 = container.offsetHeight;
  if (visible) {
    container.querySelectorAll('[data-k]').forEach((el) => {
      before.set(el.dataset.k, el.getBoundingClientRect());
    });
  }
  mutate();
  if (!visible) return;
  let born = 0;
  container.querySelectorAll('[data-k]').forEach((el) => {
    const f = before.get(el.dataset.k);
    const l = el.getBoundingClientRect();
    if (f) {
      const dx = f.left - l.left;
      const dy = f.top - l.top;
      const sx = l.width ? f.width / l.width : 1;
      const sy = l.height ? f.height / l.height : 1;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(sx - 1) > 0.02 || Math.abs(sy - 1) > 0.02) {
        el.animate(
          [
            { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
            { transformOrigin: '0 0', transform: 'none' },
          ],
          { duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)' }
        );
      }
    } else {
      el.animate(
        [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, delay: Math.min(born++ * 22, 600), easing: 'ease-out', fill: 'backwards' }
      );
    }
  });
  container.querySelectorAll('[data-in]').forEach((el, i) => {
    el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
      duration: 400, delay: 150 + i * 120, easing: 'ease-out', fill: 'backwards',
    });
  });
  const h1 = container.offsetHeight;
  if (height && h0 && Math.abs(h0 - h1) > 2) {
    container.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 380, easing: 'ease-out' });
  }
}

/* =====================================================================
   Пошаговое решение: состояние — это только номер шага.
   ===================================================================== */

function makeStepper(root, steps) {
  root.tabIndex = 0;
  root.setAttribute('aria-roledescription', 'пошаговое решение');
  root.innerHTML = `
    <div class="stage"></div>
    <p class="step-text" aria-live="polite"></p>
    <div class="step-nav">
      <span class="step-count"></span>
      <button class="btn" type="button" data-go="first" aria-label="Сначала">⟲<span class="lbl"> Сначала</span></button>
      <button class="btn" type="button" data-go="prev">← Назад</button>
      <button class="btn primary" type="button" data-go="next">Дальше →</button>
    </div>`;
  const stage = $('.stage', root);
  const text = $('.step-text', root);
  const count = $('.step-count', root);
  const bFirst = $('[data-go="first"]', root);
  const bPrev = $('[data-go="prev"]', root);
  const bNext = $('[data-go="next"]', root);
  let i = 0;

  function show(n, animate = true) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    const step = steps[i];
    const draw = () => { stage.innerHTML = step.html(); };
    if (animate) flip(stage, draw); else draw();
    text.innerHTML = step.text;
    count.textContent = `Шаг ${i + 1} из ${steps.length}`;
    bFirst.disabled = bPrev.disabled = i === 0;
    bNext.disabled = i === steps.length - 1;
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    if (b.dataset.go === 'next') show(i + 1);
    if (b.dataset.go === 'prev') show(i - 1);
    if (b.dataset.go === 'first') show(0);
  });
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('input')) return;
    if (e.key === 'ArrowRight') { show(i + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { show(i - 1); e.preventDefault(); }
  });
  show(0, false);
}

const STEPS = {};

/* =====================================================================
   Проверка ответа: понимает 2*19!, 20!/2, 10·9·8:6 и т.п.
   Считает точно — в дробях из BigInt.
   ===================================================================== */

function gcd(a, b) {
  a = a < 0n ? -a : a;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}
function Q(n, d = 1n) {
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function evaluate(src) {
  const s = src
    .replace(/[\s  ]/g, '')
    .replace(/[·×xх*⋅]/g, '*')
    .replace(/[:÷]/g, '/');
  let i = 0;
  const fail = () => { throw new Error('parse'); };
  function expr() {
    let v = term();
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++];
      const w = term();
      v = op === '+' ? Q(v.n * w.d + w.n * v.d, v.d * w.d) : Q(v.n * w.d - w.n * v.d, v.d * w.d);
    }
    return v;
  }
  function term() {
    let v = power();
    while (s[i] === '*' || s[i] === '/') {
      const op = s[i++];
      const w = power();
      if (op === '*') v = Q(v.n * w.n, v.d * w.d);
      else { if (w.n === 0n) fail(); v = Q(v.n * w.d, v.d * w.n); }
    }
    return v;
  }
  function power() {
    const v = postfix();
    if (s[i] !== '^') return v;
    i++;
    const e = power();
    if (e.d !== 1n || e.n < 0n || e.n > 64n) fail();
    return Q(v.n ** e.n, v.d ** e.n);
  }
  function postfix() {
    let v = primary();
    while (s[i] === '!') {
      i++;
      if (v.d !== 1n || v.n < 0n || v.n > 300n) fail();
      v = Q(fact(v.n));
    }
    return v;
  }
  function primary() {
    if (s[i] === '(') {
      i++;
      const v = expr();
      if (s[i++] !== ')') fail();
      return v;
    }
    const m = /^\d+/.exec(s.slice(i));
    if (!m) fail();
    i += m[0].length;
    return Q(BigInt(m[0]));
  }
  if (!s) fail();
  const v = expr();
  if (i !== s.length) fail();
  return v;
}

const same = (a, b) => a.n === b.n && a.d === b.d;

// Ответы и подсказки на частые ошибки (ответ не показывается)
const CHECKS = {
  t1: [{
    answer: '12180',
    hints: {
      '30*29*28': 'Так было бы, если бы замы были «первый» и «второй». А в условии они равноправны. Что здесь посчитано дважды?',
    },
  }],
  t2: [
    { label: '(а) ПЛЮС', answer: '24' },
    {
      label: '(б) МАМА', answer: '6',
      hints: { '24': 'В слове МАМА есть одинаковые буквы. Разве все 24 перестановки дают разные слова?' },
    },
    {
      label: '(в) МАТЕМАТИКА', answer: '151200',
      hints: {
        '10!': 'Это 10! — как будто все буквы разные. А сколько раз посчитано каждое настоящее слово?',
        '10!/6': 'Три буквы А ты учёл. А две М и две Т?',
        '10!/12': 'Почти! Проверь, все ли повторяющиеся буквы ты учёл: А, М и Т.',
        '10!/(2*2*2)': 'Букв А — три, а не две. Сколькими способами можно расставить по трём местам помеченные буквы А₁, А₂, А₃?',
      },
    },
  ],
  t3: [
    {
      label: '(а) рядом', answer: '2*19!',
      hints: {
        '19!': 'Андрей и Борис внутри «паровозика» могут стоять двумя способами: АБ или БА.',
        '2*18!': 'Сколько предметов получится после склейки двоих? Паровозик — тоже предмет!',
        '18!': 'Сколько предметов получится после склейки двоих? Паровозик — тоже предмет!',
        '20!': 'Это все расстановки, даже где Андрей и Борис далеко друг от друга.',
      },
    },
    {
      label: '(б) Борис левее', answer: '20!/2',
      hints: { '20!': 'Это все расстановки. В какой их части Борис левее Андрея?' },
    },
  ],
  t4: [{
    answer: '176400',
    hints: {
      '10*9*8*8*7*6*5*7*6': 'Внутри команды порядок не важен: тройка стратегов 1, 2, 3 — та же, что 3, 2, 1. Сколько раз посчитана каждая тройка?',
      '120+70+21': 'Каждую тройку стратегов можно соединить с каждой четвёркой разведчиков. Количества нужно перемножить, а не сложить.',
    },
  }],
  t5: [{
    answer: '56',
    hints: {
      '8*7*6': 'Места 2, 5, 6 и места 6, 2, 5 — это одна и та же последовательность. Сколько раз посчитана каждая?',
      '2^8': '2⁸ — это все последовательности. А нам нужны только с тремя орлами.',
      '2^3': 'Орлов три, но где они стоят среди 8 бросков — выбирается по-разному.',
    },
  }],
  t6: [{
    answer: '369600',
    hints: {
      '12!': 'Нам не важно, как пришельцы сидят внутри тарелки. Сколько раз посчитана каждая рассадка?',
      '12!/6': 'Тарелок четыре, и внутри каждой можно переставить троих.',
      '12!/(6*6*6*6*24)': 'Тарелки разного цвета — поменять их местами значит получить другую рассадку. На 4! делить не нужно.',
      '12!/(6*4)': 'Внутри каждой из четырёх тарелок трое переставляются 3! = 6 способами. Повторы перемножаются.',
    },
  }],
};

function initChecks() {
  document.querySelectorAll('.check[data-check]').forEach((box) => {
    CHECKS[box.dataset.check].forEach((c, k) => {
      const id = `${box.dataset.check}-ans-${k}`;
      const want = evaluate(c.answer);
      const hints = Object.entries(c.hints || {}).map(([e, msg]) => [evaluate(e), msg]);
      const form = document.createElement('form');
      form.innerHTML = `
        <label for="${id}">${c.label ? c.label + ': ' : 'Твой ответ: '}</label>
        <input id="${id}" inputmode="text" autocomplete="off" spellcheck="false" placeholder="число">
        <button class="btn" type="submit">Проверить</button>
        <span class="verdict" aria-live="polite"></span>`;
      const input = $('input', form);
      const verdict = $('.verdict', form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        verdict.className = 'verdict';
        if (!input.value.trim()) { verdict.textContent = ''; return; }
        let got;
        try { got = evaluate(input.value); } catch {
          verdict.textContent = 'Не понимаю запись. Можно писать числа, *, /, ! и скобки.';
          verdict.classList.add('bad');
          return;
        }
        if (same(got, want)) {
          verdict.textContent = '✓ Верно!';
          verdict.classList.add('good');
          return;
        }
        const hint = hints.find(([v]) => same(v, got));
        verdict.textContent = '✗ Пока нет. ' + (hint ? hint[1] : 'Попробуй ещё раз.');
        verdict.classList.add('bad');
      });
      box.appendChild(form);
    });
  });
}

/* =====================================================================
   Правило деления: 2 дежурных из 4
   ===================================================================== */

{
  const N = ['Аня', 'Боря', 'Вика', 'Гоша'];
  const PAIRS = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  const color = (a, b) => 1 + PAIRS.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const card = (a, b, cls = '') =>
    `<span class="pair ${cls}" data-k="p${a}${b}">${N[a]} <span class="arrow">→</span> ${N[b]}</span>`;
  const rows = (clsOf) =>
    `<div class="col">${N.map((_, a) =>
      `<div class="wrap">${N.map((_, b) => (a === b ? '' : card(a, b, clsOf(a, b)))).join('')}</div>`
    ).join('')}</div>`;
  const groups = () =>
    `<div class="wrap">${PAIRS.map(([a, b], i) =>
      `<div class="grp g${i + 1}">${card(a, b, 'g' + (i + 1))}${card(b, a, 'g' + (i + 1))}</div>`
    ).join('')}</div>`;

  STEPS.rule = [
    {
      text: 'Будем выбирать по очереди. <b>Первого</b> дежурного можно выбрать 4 способами, <b>второго</b> — из оставшихся троих, 3 способами. Получилось <b>4 · 3 = 12</b> записей. Запись «Аня → Боря» значит: сначала выбрали Аню, потом Борю.',
      html: () => rows(() => ''),
    },
    {
      text: 'Но посмотри: «Аня → Боря» и «Боря → Аня» — это <b>одна и та же пара</b> дежурных! Дежурить будут одни и те же двое, порядок выбора тут не важен.',
      html: () => rows((a, b) => (color(a, b) === 1 ? 'g1' : 'faint')),
    },
    {
      text: 'И так с <b>каждой</b> парой: каждая пара записана ровно <b>2 раза</b>. Покрасим одинаковые пары одним цветом.',
      html: () => rows((a, b) => 'g' + color(a, b)),
    },
    {
      text: 'Соберём вместе записи одной и той же пары. Получилось 6 кучек, и в <b>каждой</b> ровно 2 записи.',
      html: groups,
    },
    {
      text: 'Каждая пара посчитана одинаковое число раз — дважды. Значит, делим: <b>12 : 2 = 6</b> способов выбрать двух дежурных. Это и есть правило деления.',
      html: () => groups() + '<p class="big-eq" data-in>12 записей : 2 повтора = <b>6</b> пар</p>',
    },
  ];
}

/* =====================================================================
   Задача 1: староста и два заместителя
   ===================================================================== */

const KIDS = ['Аня', 'Боря', 'Вика', 'Гоша', 'Даша', 'Егор', 'Женя', 'Зоя', 'Илья', 'Катя',
  'Лёша', 'Маша', 'Ника', 'Олег', 'Поля', 'Рома', 'Соня', 'Тима', 'Уля', 'Федя',
  'Юля', 'Яна', 'Артём', 'Вера', 'Глеб', 'Дима', 'Ева', 'Кира', 'Лиза', 'Миша'];

{
  const grid = $('#t1-class');
  const out = $('#t1-result');
  let head = null;
  let deps = [];
  let swapped = false;

  function render(msg = '') {
    keepFocus(grid, () => { grid.innerHTML = KIDS.map((n, i) => {
      const role = i === head ? 'head' : deps.includes(i) ? 'dep' : '';
      const badge = role === 'head' ? '<span class="badge">👑</span>' : role === 'dep' ? '<span class="badge">⭐</span>' : '';
      const label = role === 'head' ? `${n}, староста` : role === 'dep' ? `${n}, заместитель` : n;
      return `<button type="button" class="kid" data-i="${i}" data-role="${role}" aria-label="${label}">${n}${badge}</button>`;
    }).join(''); }, 'data-i');
    if (msg) { out.innerHTML = msg; return; }
    if (head === null) { out.textContent = 'Выбери старосту.'; return; }
    if (deps.length < 2) { out.textContent = `Староста: ${KIDS[head]} 👑. Теперь выбери ${deps.length ? 'второго' : 'первого'} заместителя.`; return; }
    out.innerHTML = `Староста: <b>${KIDS[head]}</b> 👑. Заместители: <b>${KIDS[deps[0]]}</b> и <b>${KIDS[deps[1]]}</b> ⭐.` +
      (swapped ? ' <span class="ok">Мы поменяли замов местами, но это тот же самый выбор!</span>' : '');
  }

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.kid');
    if (!b) return;
    const i = +b.dataset.i;
    swapped = false;
    if (i === head) { head = null; render(); return; }
    if (deps.includes(i)) { deps = deps.filter((d) => d !== i); render(); return; }
    if (head === null) head = i;
    else if (deps.length < 2) deps.push(i);
    else { render('Все трое уже выбраны. Нажми на кого-нибудь из них, чтобы снять выбор.'); return; }
    render();
  });
  $('#t1-swap').addEventListener('click', () => {
    if (head === null || deps.length < 2) { render('Сначала выбери старосту и двух заместителей.'); return; }
    deps.reverse();
    swapped = true;
    render();
  });
  $('#t1-reset').addEventListener('click', () => { head = null; deps = []; swapped = false; render(); });
  render();

  // --- решение ---
  const mini = (h, d1, d2) => `<div class="mini-class">${KIDS.map((n, i) => {
    const cls = i === h ? 'head' : i === d1 || i === d2 ? 'dep' : '';
    return `<span class="${cls}" title="${n}">${n.slice(0, 2)}</span>`;
  }).join('')}</div>`;
  const who = (name, role) => `<span class="chip ${role === 'head' ? 'hl' : 'g2'}" data-k="r-${name}">${role === 'head' ? '👑' : '⭐'} ${name}</span>`;
  const record = (h, a, b, tag = '') => `
    <div class="record ${tag}">
      <span class="lbl">староста</span>${who(h, 'head')}
      <span class="lbl">замы</span>${who(a, 'dep')}${who(b, 'dep')}
      ${tag === 'same' ? '<span class="verdict-tag same" data-in>тот же выбор</span>' : ''}
      ${tag === 'diff' ? '<span class="verdict-tag diff" data-in>другой выбор</span>' : ''}
    </div>`;

  STEPS.t1 = [
    {
      text: 'Сначала выберем старосту. Кандидатов <b>30</b>. Пусть это Аня 👑.',
      html: () => mini(0) + '<p class="big-eq" data-in>30</p>',
    },
    {
      text: 'Первого заместителя выбираем из оставшихся <b>29</b> человек — Аню уже выбрали.',
      html: () => mini(0, 1) + '<p class="big-eq">30 · 29</p>',
    },
    {
      text: 'Второго заместителя — из оставшихся <b>28</b>. Всего получается 30 · 29 · 28 = 24 360 записей. Но это ещё не ответ!',
      html: () => mini(0, 1, 2) + '<p class="big-eq">30 · 29 · 28 = 24&nbsp;360 <span class="m">записей</span></p>',
    },
    {
      text: 'Посмотрим на одну из записей: староста Аня, первым выбрали Борю, вторым — Вику.',
      html: () => `<div class="col">${record('Аня', 'Боря', 'Вика')}</div>`,
    },
    {
      text: 'А в другой записи сначала выбрали Вику, потом Борю. Для нас это <b>тот же самый выбор</b>: староста Аня, замы Боря и Вика. Заместители <b>равноправны</b>, «первого» и «второго» зама нет.',
      html: () => `<div class="col">${record('Аня', 'Вика', 'Боря', 'same')}</div>`,
    },
    {
      text: 'А вот если поменять местами старосту и зама, получится <b>другой</b> выбор: теперь староста — Боря. Поэтому старосту мы выбираем отдельно, а замов — «парой».',
      html: () => `<div class="col">${record('Боря', 'Аня', 'Вика', 'diff')}</div>`,
    },
    {
      text: 'Каждый выбор мы посчитали ровно <b>2 раза</b>: замов можно записать в двух порядках. Делим. <br><span class="small">Если бы должности были разные («первый зам» и «второй зам»), делить было бы не нужно и ответ был бы 24 360.</span>',
      html: () => '<p class="big-eq" data-in>24&nbsp;360 : 2 = <b>12&nbsp;180</b></p><p style="text-align:center" data-in><span class="answer">Ответ: 12 180 способов</span></p>',
    },
  ];
}

/* =====================================================================
   Задача 2: слова
   ===================================================================== */

{
  const TOTAL = { 'ПЛЮС': 24, 'МАМА': 6, 'МАТЕМАТИКА': 151200 };
  const tilesEl = $('#t2-tiles');
  const countEl = $('#t2-count');
  const foundEl = $('#t2-found');
  let word = 'ПЛЮС';
  let tiles = [];
  let sel = null;
  let found = [];
  let fresh = null;
  let msg = '';

  const current = () => tiles.map((t) => t.ch).join('');

  function reset(w) {
    word = w;
    tiles = [...w].map((ch, id) => ({ ch, id }));
    sel = null;
    found = [w];
    fresh = null;
    msg = '';
    render();
  }

  function addWord() {
    const w = current();
    if (!found.includes(w)) { found.push(w); fresh = w; msg = ''; }
    else { fresh = null; }
  }

  function render() {
    flip(tilesEl, () => keepFocus(tilesEl, () => {
      tilesEl.innerHTML = tiles.map((t, i) =>
        `<button type="button" class="tile" data-k="t${t.id}" data-i="${i}" aria-pressed="${sel === i}" aria-label="буква ${t.ch}, место ${i + 1}">${t.ch}</button>`
      ).join('');
    }), { height: false });
    const all = found.length === TOTAL[word];
    countEl.innerHTML = (msg ? msg + ' ' : '') + `Разных слов найдено: <b>${found.length}</b>.` +
      (all ? ' <span class="ok">Ты нашёл все слова!</span>' : '');
    const shown = found.length > 60 ? found.slice(-60) : found;
    foundEl.innerHTML = (found.length > 60 ? '<span class="w">…</span>' : '') +
      shown.map((w) => `<span class="w${w === fresh ? ' new' : ''}">${w}</span>`).join('');
  }

  tilesEl.addEventListener('click', (e) => {
    const b = e.target.closest('.tile');
    if (!b) return;
    const i = +b.dataset.i;
    msg = '';
    if (sel === null) { sel = i; render(); return; }
    if (sel === i) { sel = null; render(); return; }
    const before = current();
    [tiles[sel], tiles[i]] = [tiles[i], tiles[sel]];
    sel = null;
    if (current() === before) msg = 'Слово не изменилось — ты поменял местами <b>одинаковые</b> буквы!';
    addWord();
    render();
  });
  $('#t2-shuffle').addEventListener('click', () => {
    tiles = shuffle(tiles);
    sel = null;
    msg = '';
    addWord();
    render();
  });
  $('#t2-reset').addEventListener('click', () => reset(word));
  $('#t2-word').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-word]');
    if (!b) return;
    $('#t2-word').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    reset(b.dataset.word);
  });
  reset('ПЛЮС');

  // --- (а) ПЛЮС ---
  const slots = (letters, nums) => `<div class="fact-row">${[0, 1, 2, 3].map((k) => `
      ${k ? '<span class="times">·</span>' : ''}
      <span class="slot"><span class="box">${letters[k] ? `<span class="tile" data-k="l${letters[k]}">${letters[k]}</span>` : ''}</span>
      <span class="n">${nums[k] ?? '&nbsp;'}</span></span>`).join('')}</div>`;
  const pool = (used) => `<div class="tiles">${[...'ПЛЮС'].filter((c) => !used.includes(c))
    .map((c) => `<span class="tile" data-k="l${c}">${c}</span>`).join('')}</div>`;
  const allPlus = () => `<div class="wrap">${perms([...'ПЛЮС']).map((p) =>
    `<span class="word sm">${p.map((c) => `<span class="tile">${c}</span>`).join('')}</span>`).join('')}</div>`;

  STEPS.t2a = [
    {
      text: 'Четыре места, четыре разные буквы. На <b>первое</b> место можно поставить любую из 4 букв. Например, П.',
      html: () => slots(['П'], [4]) + pool(['П']),
    },
    {
      text: 'На <b>второе</b> место — любую из 3 оставшихся.',
      html: () => slots(['П', 'Л'], [4, 3]) + pool(['П', 'Л']),
    },
    {
      text: 'На третье — любую из 2 оставшихся, а на последнее место остаётся 1 буква. Всего <b>4 · 3 · 2 · 1 = 24</b>.',
      html: () => slots(['П', 'Л', 'Ю', 'С'], [4, 3, 2, 1]) + '<p class="big-eq" data-in>4 · 3 · 2 · 1 = <b>24</b></p>',
    },
    {
      text: 'Вот все 24 слова. Произведение 1 · 2 · 3 · 4 коротко пишут <b>4!</b> и читают «четыре факториал». Так же 10! = 1 · 2 · … · 10.',
      html: () => allPlus() + '<p style="text-align:center" data-in><span class="answer">Ответ (а): 24</span></p>',
    },
  ];

  // --- (б) МАМА ---
  const TOK = { m1: ['М', 1, 'cm1'], a1: ['А', 1, 'ca1'], m2: ['М', 2, 'cm2'], a2: ['А', 2, 'ca2'] };
  const tok = (t, colored = true, key = true) => {
    const [ch, n, cls] = TOK[t];
    return `<span class="tile ${colored ? cls : ''}" ${key ? `data-k="${t}"` : ''}>${ch}${colored ? `<sub>${n}</sub>` : ''}</span>`;
  };
  const ORIG = ['m1', 'a1', 'm2', 'a2'];
  const ALL = perms(ORIG);
  const plain = (p) => p.map((t) => TOK[t][0]).join('');
  const cw = (p, { colored = true, cls = '' } = {}) =>
    `<span class="word sm ${cls}" data-k="w${p.join('')}">${p.map((t) => tok(t, colored, false)).join('')}</span>`;
  const WORDS = [...new Set(ALL.map(plain))].sort();
  const grouped = () => `<div class="wrap">${WORDS.map((w, gi) =>
    `<div class="grp grid2 g${gi + 1}"><span class="grp-label">${w}</span>${ALL.filter((p) => plain(p) === w).map((p) => cw(p)).join('')}</div>`
  ).join('')}</div>`;

  STEPS.t2b = [
    {
      text: 'В слове МАМА две одинаковые М и две одинаковые А. Если просто посчитать 4! = 24, некоторые слова совпадут.',
      html: () => `<div class="tiles">${ORIG.map((t) => tok(t, false)).join('')}</div>`,
    },
    {
      text: 'Хитрость: <b>покрасим</b> буквы, как будто они все разные: М₁, А₁, М₂, А₂. Четыре разные буквы можно переставить 4! = <b>24</b> способами.',
      html: () => `<div class="tiles">${ORIG.map((t) => tok(t)).join('')}</div>`,
    },
    {
      text: 'Среди этих 24 раскрашенных записей найдём те, где написано МАМА. Их ровно <b>4</b>: две М можно поменять местами (2 способа), и две А тоже (2 способа): 2 · 2 = 4.',
      html: () => `<div class="wrap">${ALL.filter((p) => plain(p) === 'МАМА').map((p) => cw(p, { cls: 'hl' })).join('')}</div>`,
    },
    {
      text: 'Теперь <b>сотрём метки</b>. Все 4 записи превратились в одно и то же слово МАМА. Значит, слово МАМА мы посчитали 4 раза.',
      html: () => `<div class="wrap">${ALL.filter((p) => plain(p) === 'МАМА').map((p) => cw(p, { colored: false, cls: 'hl' })).join('')}</div>
        <p class="big-eq" data-in>4 записи → 1 слово</p>`,
    },
    {
      text: 'С <b>любым</b> другим словом то же самое: например, ААММ тоже записано ровно 4 раза. Вот все 24 раскрашенные записи — они разбились на 6 кучек по 4.',
      html: grouped,
    },
    {
      text: 'Каждое слово посчитано одинаково — 4 раза. Делим: <b>24 : 4 = 6</b>. Вот эти 6 слов: ' + WORDS.join(', ') + '.',
      html: () => grouped() + '<p class="big-eq" data-in>24 : (2 · 2) = <b>6</b></p><p style="text-align:center" data-in><span class="answer">Ответ (б): 6</span></p>',
    },
  ];

  // --- (в) МАТЕМАТИКА ---
  const MAT = [...'МАТЕМАТИКА'];
  const kind = { 'А': 'kA', 'М': 'kM', 'Т': 'kT' };
  const idx = (() => { const c = {}; return MAT.map((ch) => (c[ch] = (c[ch] || 0) + 1)); })();
  const colorOf = (ch, n) => ({ 'А': ['ca1', 'ca2', 'ca3'], 'М': ['cm1', 'cm2'], 'Т': ['ct1', 'ct2'] }[ch] || [])[n - 1] || '';
  const matWord = (mode, aOrder = [1, 2, 3], key = true) => {
    let a = 0;
    return `<span class="word" ${key ? '' : ''}>${MAT.map((ch, k) => {
      let cls = '';
      let sub = '';
      let n = idx[k];
      if (ch === 'А' && mode !== 'plain') { n = aOrder[a++]; }
      if (mode === 'kinds') cls = kind[ch] || '';
      if (mode === 'all' && idx[k] && colorOf(ch, n)) { cls = colorOf(ch, n); sub = `<sub>${n}</sub>`; }
      if (mode === 'onlyA' && ch === 'А') { cls = colorOf(ch, n); sub = `<sub>${n}</sub>`; }
      return `<span class="tile ${cls}" ${key ? `data-k="m${k}"` : ''}>${ch}${sub}</span>`;
    }).join('')}</span>`;
  };

  STEPS.t2c = [
    {
      text: 'В слове МАТЕМАТИКА 10 букв. Некоторые повторяются: <b>А — 3 раза, М — 2 раза, Т — 2 раза</b>. Е, И, К — по одному разу.',
      html: () => `<div class="tiles">${matWord('kinds')}</div>
        <div class="counts" data-in><span class="cnt kA tile">А × 3</span><span class="cnt kM tile">М × 2</span><span class="cnt kT tile">Т × 2</span><span class="cnt">Е, И, К × 1</span></div>`,
    },
    {
      text: 'Покрасим все буквы, чтобы они стали разными. Тогда перестановок было бы 10! = 1 · 2 · 3 · … · 10 = <b>3 628 800</b>.',
      html: () => `<div class="tiles">${matWord('all')}</div><p class="big-eq" data-in>10! = 3&nbsp;628&nbsp;800 <span class="m">раскрашенных записей</span></p>`,
    },
    {
      text: 'Возьмём одно настоящее слово, например само МАТЕМАТИКА. Пометим три буквы А: А₁, А₂, А₃. Их можно расставить по трём местам <b>3! = 3 · 2 · 1 = 6</b> способами. Сотрём метки — и во всех шести случаях получится то же слово.',
      html: () => `<div class="col">${perms([1, 2, 3]).map((o) => `<div class="tiles" style="margin:0">${matWord('onlyA', o, false)}</div>`).join('')}</div>`,
    },
    {
      text: 'К тому же две М можно поменять местами (2 способа), и две Т (2 способа). Значит, <b>каждое</b> слово — не только это — мы посчитали 6 · 2 · 2 = <b>24</b> раза.',
      html: () => `<div class="mult">
          <div class="box" data-in>три А<b>3! = 6</b></div><span class="op">·</span>
          <div class="box" data-in>две М<b>2</b></div><span class="op">·</span>
          <div class="box" data-in>две Т<b>2</b></div><span class="op">=</span>
          <div class="box" data-in>повторов<b>24</b></div></div>`,
    },
    {
      text: 'Делим все раскрашенные записи на число повторов.',
      html: () => '<p class="big-eq" data-in>10! : (3! · 2! · 2!) = 3&nbsp;628&nbsp;800 : 24 = <b>151&nbsp;200</b></p><p style="text-align:center" data-in><span class="answer">Ответ (в): 151 200</span></p>',
    },
  ];
}

/* =====================================================================
   Задача 3: 20 учеников в ряд
   ===================================================================== */

{
  const OTHERS = [...'ВГДЕЖЗИКЛМНОПРСТУФ'];
  const rowEl = $('#t3-row');
  const flags = $('#t3-flags');
  let row = ['В', 'Г', 'Д', 'Е', 'Ж', 'А', 'З', 'И', 'К', 'Л', 'М', 'Н', 'Б', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф'];
  let sel = null;
  const pcls = (p) => (p === 'А' ? 'pa' : p === 'Б' ? 'pb' : '');
  const pname = (p) => (p === 'А' ? 'Андрей' : p === 'Б' ? 'Борис' : `ученик ${p}`);

  function render() {
    rowEl.classList.add('withpos');
    flip(rowEl, () => keepFocus(rowEl, () => {
      rowEl.innerHTML = row.map((p, i) =>
        `<button type="button" class="person ${pcls(p)}" data-k="s${p}" data-i="${i}" aria-pressed="${sel === i}" aria-label="${pname(p)}, место ${i + 1}">${p}<span class="pos">${i + 1}</span></button>`
      ).join('');
    }), { height: false });
    const a = row.indexOf('А');
    const b = row.indexOf('Б');
    const yes = (ok, t) => `<li><span class="${ok ? 'yes' : 'no'}">${ok ? '✓' : '✗'}</span> ${t}</li>`;
    flags.innerHTML = yes(Math.abs(a - b) === 1, `(а) Андрей и Борис стоят рядом`) +
      yes(b < a, `(б) Борис левее Андрея (Борис на ${b + 1}-м месте, Андрей на ${a + 1}-м)`);
  }
  rowEl.addEventListener('click', (e) => {
    const t = e.target.closest('.person');
    if (!t) return;
    const i = +t.dataset.i;
    if (sel === null) sel = i;
    else if (sel === i) sel = null;
    else { [row[sel], row[i]] = [row[i], row[sel]]; sel = null; }
    render();
  });
  $('#t3-shuffle').addEventListener('click', () => { row = shuffle(row); sel = null; render(); });
  render();

  // --- решение ---
  const person = (p, key) => `<span class="person sm ${pcls(p)}"${key ? ` data-k="${key}"` : ''}>${p}</span>`;
  const arr = (p, cls = '', key = '') => `<span class="arr ${cls}"${key ? ` data-k="${key}"` : ''}>${p.map((x) => person(x)).join('')}</span>`;
  const ALL4 = perms(['А', 'Б', 'В', 'Г']);
  const adj = (p) => Math.abs(p.indexOf('А') - p.indexOf('Б')) === 1;
  const trainArr = (p, inside, cls = '') => `<span class="arr ${cls}" data-k="tr${p.join('')}${inside.join('')}">${p.map((x) =>
    x === '*' ? `<span class="train">${inside.map((y) => person(y)).join('')}</span>` : person(x)).join('')}</span>`;
  const OBJ3 = perms(['*', 'В', 'Г']);

  STEPS.t3a = [
    {
      text: 'Двадцать человек перебирать долго. Сначала <b>уменьшим задачу</b>: пусть учеников четверо — Андрей (А), Борис (Б), В и Г. Всего расстановок 4! = <b>24</b>.',
      html: () => `<div class="wrap">${ALL4.map((p) => arr(p, '', 'q' + p.join(''))).join('')}</div>`,
    },
    {
      text: 'Андрей и Борис стоят рядом в <b>12</b> расстановках из 24 (они подсвечены). Как получить 12, не перебирая?',
      html: () => `<div class="wrap">${ALL4.map((p) => arr(p, adj(p) ? 'hl' : 'faint', 'q' + p.join(''))).join('')}</div>`,
    },
    {
      text: '<b>Склеим</b> Андрея и Бориса в «паровозик». Теперь переставляем <b>3 предмета</b>: паровозик, В и Г. Это 3! = <b>6</b> способов.',
      html: () => `<div class="wrap">${OBJ3.map((p) => trainArr(p, ['А', 'Б'])).join('')}</div>`,
    },
    {
      text: 'Но внутри паровозика двое могут стоять по-разному: АБ или БА — <b>2 способа</b>. Итого 6 · 2 = <b>12</b>. Совпало с перебором!',
      html: () => `<div class="wrap">${OBJ3.map((p) => trainArr(p, ['А', 'Б'])).join('')}</div>
        <div class="wrap" style="margin-top:6px">${OBJ3.map((p) => trainArr(p, ['Б', 'А'])).join('')}</div>
        <p class="big-eq" data-in>3! · 2 = 6 · 2 = <b>12</b></p>`,
    },
    {
      text: 'Теперь настоящая задача. Склеиваем Андрея и Бориса — получается паровозик и ещё 18 учеников, то есть <b>19 предметов</b>. <span class="warn">Получилось 19 предметов, а не 18</span>: паровозик — тоже предмет, его тоже надо переставлять.',
      html: () => `<div class="line20"><span class="train">${person('А')}${person('Б')}</span>${OTHERS.map((p) => person(p)).join('')}</div>
        <p class="big-eq" data-in>1 паровозик + 18 учеников = <b>19</b> предметов</p>`,
    },
    {
      text: '19 предметов переставляются 19! способами, и внутри паровозика ещё 2 способа.',
      html: () => `<p class="big-eq" data-in>2 · 19! = <b>${fmt(2n * fact(19))}</b></p><p style="text-align:center" data-in><span class="answer">Ответ (а): 2 · 19! = ${fmt(2n * fact(19))}</span></p>`,
    },
  ];

  const R20 = ['В', 'Г', 'Б', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'А', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф'];
  const swapAB = (p) => p.map((x) => (x === 'А' ? 'Б' : x === 'Б' ? 'А' : x));
  const line = (p) => `<div class="line20 withpos">${p.map((x, i) => `<span class="person ${pcls(x)}" data-k="z${x}">${x}<span class="pos">${i + 1}</span></span>`).join('')}</div>`;
  const PAIRS4 = ALL4.filter((p) => p.indexOf('Б') < p.indexOf('А'));

  STEPS.t3b = [
    {
      text: 'Возьмём любую расстановку, где Борис левее Андрея. «Левее» значит на месте с <b>меньшим номером</b>; стоять рядом не обязательно. Здесь Борис на 3-м месте, Андрей на 10-м.',
      html: () => line(R20),
    },
    {
      text: 'Поменяем местами <b>только</b> Андрея и Бориса, все остальные стоят на своих местах. Получилась другая расстановка, и в ней уже Андрей левее Бориса.',
      html: () => line(swapAB(R20)),
    },
    {
      text: 'Так <b>все</b> расстановки разбиваются на пары: «расстановка» и «она же, но А и Б поменялись». В каждой паре подходит <b>ровно одна</b> (подсвечена). На модели из 4 учеников: 12 пар, подходят 12 расстановок из 24.',
      html: () => `<div class="wrap">${PAIRS4.map((p) => `<span class="pairbox" data-k="pb${p.join('')}">${arr(p, 'hl')}${arr(swapAB(p))}</span>`).join('')}</div>`,
    },
    {
      text: 'Значит, подходит ровно <b>половина</b> всех расстановок. Всего расстановок 20!, делим на 2.',
      html: () => `<p class="big-eq" data-in>20! : 2 = <b>${fmt(fact(20) / 2n)}</b></p><p style="text-align:center" data-in><span class="answer">Ответ (б): 20! : 2 = ${fmt(fact(20) / 2n)}</span></p>`,
    },
  ];
}

/* =====================================================================
   Задача 4: команда
   ===================================================================== */

{
  const POOLS = [
    { name: 'Стратеги', icon: '🧠', total: 10, need: 3 },
    { name: 'Разведчики', icon: '🔭', total: 8, need: 4 },
    { name: 'Изобретатели', icon: '🔧', total: 7, need: 2 },
  ];
  const poolsEl = $('#t4-pools');
  const out = $('#t4-result');
  let picked = POOLS.map(() => []);

  function render() {
    keepFocus(poolsEl, () => { poolsEl.innerHTML = POOLS.map((p, k) => {
      const done = picked[k].length === p.need;
      return `<div class="pool">
        <h4>${p.name} <span class="need ${done ? 'done' : ''}">${picked[k].length} из ${p.need}</span></h4>
        <div class="members">${Array.from({ length: p.total }, (_, i) => {
          const on = picked[k].includes(i + 1);
          return `<button type="button" class="hero" data-k="h${k}-${i + 1}" data-p="${k}" data-i="${i + 1}" aria-pressed="${on}" ${!on && done ? 'disabled' : ''} aria-label="${p.name.slice(0, -1)} ${i + 1}">${p.icon}<small>${i + 1}</small></button>`;
        }).join('')}</div></div>`;
    }).join(''); });
    const complete = POOLS.every((p, k) => picked[k].length === p.need);
    out.innerHTML = complete
      ? '<span class="ok">Команда собрана!</span> ' + POOLS.map((p, k) => `${p.name}: ${picked[k].slice().sort((a, b) => a - b).join(', ')}`).join('; ') + '.'
      : 'Набери нужное число людей в каждую группу.';
  }
  poolsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.hero');
    if (!b || b.disabled) return;
    const k = +b.dataset.p;
    const i = +b.dataset.i;
    picked[k] = picked[k].includes(i) ? picked[k].filter((x) => x !== i) : [...picked[k], i];
    render();
  });
  $('#t4-random').addEventListener('click', () => {
    picked = POOLS.map((p) => shuffle(Array.from({ length: p.total }, (_, i) => i + 1)).slice(0, p.need));
    render();
  });
  $('#t4-reset').addEventListener('click', () => { picked = POOLS.map(() => []); render(); });
  render();

  // --- решение ---
  const heroes = (icon, total, on, order = []) => `<div class="wrap">${Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const o = order.indexOf(n);
    return `<span class="hero sm ${on.includes(n) ? 'on' : ''}" title="${n}">${icon}<small>${o >= 0 ? `${o + 1}-й` : n}</small></span>`;
  }).join('')}</div>`;
  const setBox = (s, key) => `<span class="setbox" data-k="${key}">${s.join(', ')}</span>`;

  STEPS.t4 = [
    {
      text: 'Начнём со стратегов. Будем брать их по очереди: первого — из 10, второго — из 9, третьего — из 8. Получится 10 · 9 · 8 = <b>720</b> записей.',
      html: () => heroes('🧠', 10, [1, 3, 7], [3, 7, 1]) + '<p class="big-eq" data-in>10 · 9 · 8 = 720 <span class="m">записей</span></p>',
    },
    {
      text: 'Но команде не важно, кого из стратегов взяли первым. Тройка «1, 3, 7» записана <b>3 · 2 · 1 = 6</b> раз — в разном порядке. Так с каждой тройкой.',
      html: () => `<div class="wrap">${perms([1, 3, 7]).map((p) => setBox(p, 's' + p.join(''))).join('')}</div>
        <p class="big-eq" data-in>720 : 6 = <b>120</b> <span class="m">троек стратегов</span></p>`,
    },
    {
      text: 'Разведчики так же: 8 · 7 · 6 · 5 = 1680 записей, а каждая четвёрка повторяется 4 · 3 · 2 · 1 = 24 раза.',
      html: () => heroes('🔭', 8, [2, 4, 5, 8]) + '<p class="big-eq" data-in>(8 · 7 · 6 · 5) : (4 · 3 · 2 · 1) = 1680 : 24 = <b>70</b></p>',
    },
    {
      text: 'Изобретатели: 7 · 6 = 42 записи, и каждая пара записана 2 раза.',
      html: () => heroes('🔧', 7, [3, 6]) + '<p class="big-eq" data-in>(7 · 6) : (2 · 1) = 42 : 2 = <b>21</b></p>',
    },
    {
      text: 'Выборы не мешают друг другу: к <b>любой</b> тройке стратегов можно добавить <b>любую</b> из 70 четвёрок разведчиков, а к ним — любую из 21 пары изобретателей. Поэтому числа <b>перемножаем</b>. Здесь уже ничего не повторяется: стратега с разведчиком не перепутаешь.',
      html: () => `<div class="mult">
          <div class="box" data-in>🧠 стратеги<b>120</b></div><span class="op">·</span>
          <div class="box" data-in>🔭 разведчики<b>70</b></div><span class="op">·</span>
          <div class="box" data-in>🔧 изобретатели<b>21</b></div></div>
        <p class="big-eq" data-in>120 · 70 · 21 = <b>176&nbsp;400</b></p>
        <p style="text-align:center" data-in><span class="answer">Ответ: 176 400 способов</span></p>`,
    },
  ];
}

/* =====================================================================
   Задача 5: монета
   ===================================================================== */

{
  const coinsEl = $('#t5-coins');
  const out = $('#t5-result');
  const foundEl = $('#t5-found');
  let seq = Array(8).fill('Р');
  let found = [];
  let fresh = null;
  let flipped = null;

  function render() {
    keepFocus(coinsEl, () => { coinsEl.innerHTML = seq.map((c, i) =>
      `<button type="button" class="coin ${c === 'О' ? 'o' : 'r'} ${i === flipped ? 'flip' : ''}" data-i="${i}" aria-label="бросок ${i + 1}: ${c === 'О' ? 'орёл' : 'решка'}">${c}<span class="pos">${i + 1}</span></button>`
    ).join(''); }, 'data-i');
    const k = seq.filter((c) => c === 'О').length;
    if (k === 3) {
      const s = seq.join('');
      if (!found.includes(s)) { found.push(s); fresh = s; } else fresh = null;
      out.innerHTML = `Орлов: <b>3</b>. <span class="ok">Подходит!</span> Орлы на местах ${seq.map((c, i) => (c === 'О' ? i + 1 : 0)).filter(Boolean).join(', ')}.`;
    } else {
      fresh = null;
      out.innerHTML = `Орлов: <b>${k}</b>. ${k < 3 ? 'Нужно ровно три.' : 'Многовато, нужно ровно три.'}`;
    }
    foundEl.innerHTML = found.length
      ? `<span class="small">Разных подходящих найдено: ${found.length}.</span> ` +
        found.map((s) => `<span class="w${s === fresh ? ' new' : ''}">${s}</span>`).join('')
      : '';
  }
  coinsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.coin');
    if (!b) return;
    const i = +b.dataset.i;
    seq[i] = seq[i] === 'О' ? 'Р' : 'О';
    flipped = i;
    render();
    flipped = null;
  });
  $('#t5-random').addEventListener('click', () => {
    const on = shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 3);
    seq = seq.map((_, i) => (on.includes(i) ? 'О' : 'Р'));
    render();
  });
  $('#t5-reset').addEventListener('click', () => { seq = Array(8).fill('Р'); found = []; render(); });
  render();

  // --- решение ---
  const ON = [2, 5, 6];
  const coinsRow = (on) => `<div class="coins">${Array.from({ length: 8 }, (_, i) => {
    const o = on.includes(i + 1);
    return `<span class="coin ${o ? 'o' : 'r'}" data-k="c${i}">${o ? 'О' : 'Р'}<span class="pos">${i + 1}</span></span>`;
  }).join('')}</div>`;
  const places = (on) => `<div class="places">${Array.from({ length: 8 }, (_, i) =>
    `<span class="place ${on.includes(i + 1) ? 'on' : ''}" data-k="c${i}">${i + 1}</span>`).join('')}</div>`;
  const setBox = (s) => `<span class="setbox" data-k="o${s.join('')}">${s.join(', ')}</span>`;

  STEPS.t5 = [
    {
      text: 'Броски идут по порядку: 1-й, 2-й, …, 8-й. Монета всегда одна и та же, но <b>номера бросков разные</b>. Последовательность целиком задаётся тем, <b>на каких местах</b> выпали орлы. Здесь — на 2-м, 5-м и 6-м.',
      html: () => coinsRow(ON),
    },
    {
      text: 'Значит, задача такая: <b>сколькими способами выбрать 3 места из 8?</b>',
      html: () => places(ON),
    },
    {
      text: 'Выбираем места по очереди: первое — 8 способов, второе — 7, третье — 6. Получается 8 · 7 · 6 = <b>336</b> записей.',
      html: () => places(ON) + '<p class="big-eq" data-in>8 · 7 · 6 = 336 <span class="m">записей</span></p>',
    },
    {
      text: 'Записи «2, 5, 6», «6, 2, 5», «5, 6, 2»… — это одни и те же три места, одна и та же последовательность монет. Каждая записана <b>3 · 2 · 1 = 6</b> раз.',
      html: () => `<div class="wrap">${perms(ON).map(setBox).join('')}</div>` + coinsRow(ON),
    },
    {
      text: 'Делим на число повторов. Все 56 последовательностей можно посмотреть ниже.',
      html: () => '<p class="big-eq" data-in>(8 · 7 · 6) : (3 · 2 · 1) = 336 : 6 = <b>56</b></p><p style="text-align:center" data-in><span class="answer">Ответ: 56 последовательностей</span></p>',
    },
  ];

  $('#t5-all').innerHTML = combos(8, 3).map((c) =>
    `<span class="seq" title="орлы на местах ${c.join(', ')}">${Array.from({ length: 8 }, (_, i) =>
      `<span class="coin sm ${c.includes(i + 1) ? 'o' : 'r'}">${c.includes(i + 1) ? 'О' : 'Р'}</span>`).join('')}</span>`
  ).join('');
}

/* =====================================================================
   Задача 6: инопланетяне
   ===================================================================== */

{
  const SHIPS = [
    { id: 'red', name: 'Красная', color: '#e03131' },
    { id: 'blue', name: 'Синяя', color: '#1c7ed6' },
    { id: 'green', name: 'Зелёная', color: '#2f9e44' },
    { id: 'yellow', name: 'Жёлтая', color: '#e8a400' },
  ];
  const tryEl = $('#t6').querySelector('.try');
  const pickEl = $('#t6-pick');
  const groundEl = $('#t6-ground');
  const shipsEl = $('#t6-ships');
  const out = $('#t6-result');
  let seats = SHIPS.map(() => []);
  let active = 0;
  let msg = '';

  const alienBtn = (n, where) => `<button type="button" class="alien" data-k="al${n}" data-n="${n}" aria-label="пришелец ${n}${where}">${n}</button>`;

  // focusSel — куда перевести фокус после перерисовки, если он был внутри блока
  function render(focusSel = null) {
    const hadFocus = tryEl.contains(document.activeElement);
    keepFocus(pickEl, () => {
      pickEl.innerHTML = SHIPS.map((s, k) =>
        `<button type="button" data-s="${k}" aria-pressed="${k === active}"><span class="dot" style="background:${s.color}"></span>${s.name}</button>`
      ).join('');
    }, 'data-s');
    flip(tryEl, () => {
      const seated = seats.flat();
      groundEl.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).filter((n) => !seated.includes(n))
        .map((n) => alienBtn(n, ', на Земле')).join('') || '<span class="small">Все пришельцы в тарелках!</span>';
      shipsEl.innerHTML = SHIPS.map((s, k) => `
        <div class="ship ${s.id} ${k === active ? 'active' : ''}" data-s="${k}">
          <span class="name">${s.name}</span>
          <div class="seats">${[0, 1, 2].map((j) => (seats[k][j] ? alienBtn(seats[k][j], `, в тарелке ${s.name}`) : '<span class="seat"></span>')).join('')}</div>
        </div>`).join('');
    }, { height: false });
    if (hadFocus && focusSel) (tryEl.querySelector(focusSel) || pickEl.querySelector(`[data-s="${active}"]`))?.focus();
    const full = seats.every((s) => s.length === 3);
    out.innerHTML = msg || (full
      ? '<span class="ok">Все расселись!</span> ' + SHIPS.map((s, k) => `${s.name}: ${seats[k].slice().sort((a, b) => a - b).join(', ')}`).join('; ') + '.'
      : `Сейчас сажаем в тарелку «${SHIPS[active].name}».`);
    msg = '';
  }

  pickEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-s]');
    if (b) { active = +b.dataset.s; render(); }
  });
  groundEl.addEventListener('click', (e) => {
    const b = e.target.closest('.alien');
    if (!b) return;
    const n = +b.dataset.n;
    const left = [...groundEl.querySelectorAll('.alien')].map((x) => x.dataset.k);
    const at = left.indexOf(b.dataset.k);
    let focusSel = `[data-k="${b.dataset.k}"]`;
    if (seats[active].length >= 3) {
      msg = `Тарелка «${SHIPS[active].name}» уже полная: в неё входит ровно трое. Выбери другую.`;
    } else {
      seats[active].push(n);
      const nb = left[at + 1] || left[at - 1];
      focusSel = nb ? `#t6-ground [data-k="${nb}"]` : '#t6-pick [aria-pressed="true"]';
      if (seats[active].length === 3) {
        const next = seats.findIndex((s) => s.length < 3);
        if (next >= 0) active = next;
      }
    }
    render(focusSel);
  });
  shipsEl.addEventListener('click', (e) => {
    const a = e.target.closest('.alien');
    if (a) {
      const n = +a.dataset.n;
      active = seats.findIndex((s) => s.includes(n));
      const at = seats[active].indexOf(n);
      const nb = seats[active][at + 1] || seats[active][at - 1];
      seats = seats.map((s) => s.filter((x) => x !== n));
      render(nb ? `#t6-ships [data-k="al${nb}"]` : `#t6-pick [data-s="${active}"]`);
      return;
    }
    const s = e.target.closest('.ship');
    if (s) { active = +s.dataset.s; render(); }
  });
  $('#t6-random').addEventListener('click', () => {
    const q = shuffle(Array.from({ length: 12 }, (_, i) => i + 1));
    seats = SHIPS.map((_, k) => q.slice(3 * k, 3 * k + 3));
    render();
  });
  $('#t6-reset').addEventListener('click', () => { seats = SHIPS.map(() => []); active = 0; render(); });
  render();

  // --- решение: сначала 4 пришельца и 2 тарелки ---
  const al = (n, key = true) => `<span class="alien sm"${key ? ` data-k="a${n}"` : ''}>${n}</span>`;
  const SNAME = Object.fromEntries(SHIPS.map((s) => [s.id, s.name]));
  const ship = (id, list, key = true, size = 2) => `<span class="ship sm ${id}"><span class="sname">${SNAME[id]}</span><span class="sseats">${
    list.map((n) => al(n, key)).join('')}${'<span class="seat"></span>'.repeat(Math.max(0, size - list.length))}</span></span>`;
  // Очередь делится чертами на группы; переносится только целыми группами
  const queue = (q, cut = 2, key = true) => {
    const groups = [];
    for (let i = 0; i < q.length; i += cut) groups.push(q.slice(i, i + cut));
    return `<span class="queue">${groups.map((g, i) =>
      (i ? '<span class="bar"></span>' : '') + `<span class="qg">${g.map((n) => al(n, key)).join('')}</span>`).join('')}</span>`;
  };
  const seating = (r, b, key = false, tag = '') => `<span class="seating">${ship('red', r, key)}${ship('blue', b, key)}${tag}</span>`;
  const SEATINGS = combos(4, 2).map((r) => [r, [1, 2, 3, 4].filter((x) => !r.includes(x))]);

  STEPS.t6 = [
    {
      text: 'Сначала <b>уменьшим задачу</b>: 4 пришельца и 2 тарелки — красная и синяя, в каждую входит двое. Пришельцы пронумерованы, а тарелки разного цвета, так что их не перепутать.',
      html: () => `<div class="wrap">${[1, 2, 3, 4].map((n) => al(n)).join('')}</div>
        <div class="wrap" style="margin-top:10px">${ship('red', [], false)}${ship('blue', [], false)}</div>`,
    },
    {
      text: 'Выстроим пришельцев в <b>очередь</b>. Очередей 4! = 24. Договоримся: первые двое садятся в красную тарелку, остальные — в синюю.',
      html: () => `<div class="wrap">${queue([2, 1, 3, 4])}</div>
        <div class="wrap" style="margin-top:10px">${ship('red', [], false)}${ship('blue', [], false)}</div>`,
    },
    {
      text: 'Очередь 2 1 | 3 4 даёт рассадку: в красной 1 и 2, в синей 3 и 4.',
      html: () => `<div class="wrap">${ship('red', [2, 1])}${ship('blue', [3, 4])}</div>`,
    },
    {
      text: 'Но такую же рассадку дают очереди 1 2 | 3 4, 2 1 | 3 4, 1 2 | 4 3 и 2 1 | 4 3. Порядок <b>внутри</b> тарелки нам не важен: 2 способа в красной и 2 в синей, 2 · 2 = <b>4</b> повтора.',
      html: () => `<div class="col">${[[1, 2, 3, 4], [2, 1, 3, 4], [1, 2, 4, 3], [2, 1, 4, 3]].map((q) => queue(q, 2, false)).join('')}
        <span class="big-eq" data-in>↓</span>${seating([1, 2], [3, 4])}</div>`,
    },
    {
      text: 'Каждая рассадка получилась ровно 4 раза. Значит, рассадок 24 : 4 = <b>6</b>. Вот они все.',
      html: () => `<div class="wrap">${SEATINGS.map(([r, b]) => seating(r, b)).join('')}</div><p class="big-eq" data-in>4! : (2! · 2!) = 24 : 4 = <b>6</b></p>`,
    },
    {
      text: '<b>Осторожно!</b> Обмен пассажирами <b>между</b> тарелками — это уже другая рассадка. И если пересадить всю красную группу в синюю тарелку, а синюю — в красную, тоже получится другая рассадка: «1 и 2 в красной» не то же, что «1 и 2 в синей». Тарелки разного цвета, поэтому на число порядков тарелок мы <b>не делим</b>.',
      html: () => `<div class="col">${seating([1, 2], [3, 4])}${seating([3, 4], [1, 2], false, '<span class="verdict-tag diff" data-in>другая рассадка</span>')}</div>`,
    },
    {
      text: 'Теперь настоящая задача. 12 пришельцев выстраиваются в очередь: 12! = <b>479 001 600</b> способов. Первые трое — в красную, следующие трое — в синюю, потом в зелёную и жёлтую.',
      html: () => `<div class="wrap">${queue([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3, false)}</div>
        <div class="wrap" style="margin-top:10px">${SHIPS.map((s, k) => ship(s.id, [1, 2, 3].map((j) => 3 * k + j), false, 3)).join('')}</div>`,
    },
    {
      text: 'Внутри каждой тарелки троих можно переставить 3! = 6 способами, а тарелок четыре. Каждая рассадка посчитана 6 · 6 · 6 · 6 = <b>1296</b> раз. Делим.',
      html: () => `<p class="big-eq" data-in>12! : (3! · 3! · 3! · 3!) = 479&nbsp;001&nbsp;600 : 1296 = <b>369&nbsp;600</b></p>
        <p class="note" data-in>Проверка другим способом. В красную выбираем 3 из 12: (12 · 11 · 10) : 6 = 220. В синюю — 3 из оставшихся 9: 84. В зелёную — 3 из 6: 20. В жёлтую садятся последние трое: 1 способ. 220 · 84 · 20 · 1 = 369 600. Сошлось!</p>
        <p style="text-align:center" data-in><span class="answer">Ответ: 369 600 способов</span></p>`,
    },
  ];
}

/* =====================================================================
   Запуск
   ===================================================================== */

document.querySelectorAll('[data-stepper]').forEach((el) => makeStepper(el, STEPS[el.dataset.stepper]));
initChecks();
