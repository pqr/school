'use strict';

/* =====================================================================
   Общие помощники
   Все массы храним в «квадратиках» по 0,5 кг — так считаем в целых
   числах и не ловим ошибок округления вроде 0,1 + 0,2.
   ===================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);

// 17 квадратиков → «8,5 кг»
const kg = (units) => (units / 2).toLocaleString('ru-RU') + ' кг';

// Доля соли в процентах: точное значение без «≈», иначе с одним знаком
function pct(salt, total) {
  const exact = (100 * salt) % total === 0;
  const v = Math.round((1000 * salt) / total) / 10;
  return (exact ? '' : '≈ ') + v.toLocaleString('ru-RU') + '%';
}

// Банка: соль внизу, вода сверху. Ключи data-k нужны для FLIP-анимации.
function tiles(water, salt, keep = '') {
  let h = '';
  for (let i = 0; i < salt; i++) h += `<i class="tile s${keep === 's' ? ' keep' : ''}" data-k="s${i}"></i>`;
  for (let i = 0; i < water; i++) h += `<i class="tile w${keep === 'w' ? ' keep' : ''}" data-k="w${i}"></i>`;
  return h;
}

/* FLIP-анимация: элементы с одинаковым data-k плавно переезжают
   со старого места на новое, новые элементы «выпрыгивают». */
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
        { duration: 380, delay: Math.min(born++ * 25, 500), easing: 'ease-out', fill: 'backwards' }
      );
    }
  });
  const h1 = container.offsetHeight;
  if (height && h0 && Math.abs(h0 - h1) > 2) {
    container.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 380, easing: 'ease-out' });
  }
}

/* =====================================================================
   Начальный раствор в разделе «Что значат слова»
   ===================================================================== */

const W0 = 2; // 1 кг воды
const S0 = 3; // 1,5 кг соли

$('#start-jar').innerHTML = tiles(W0, S0);

/* =====================================================================
   Лаборатория: состояние — сколько квадратиков воды и соли добавили.
   ===================================================================== */

const lab = {
  jar: $('#lab-jar'),
  addW: $('#lab-addw'),
  addS: $('#lab-adds'),
  ctrlW: $('#ctrl-water'),
  ctrlS: $('#ctrl-salt'),
  msg: $('#lab-msg'),
};

// Цели из условия: 15% после воды, 50% после соли
const hits = (salt, total, p) => 100 * salt === p * total;

function renderLab() {
  const dw = +lab.addW.value;
  const w = W0 + dw;
  const waterOk = hits(S0, w + S0, 15);

  // Соль досыпают только после того, как вода долита ровно до 15%
  lab.ctrlS.disabled = !waterOk;
  if (!waterOk) lab.addS.value = 0;
  const ds = +lab.addS.value;
  const s = S0 + ds;
  const m = w + s;
  const saltOk = waterOk && hits(s, m, 50);

  flip(lab.jar, () => { lab.jar.innerHTML = tiles(w, s); }, { height: false });

  $('#lab-w').textContent = kg(w);
  $('#lab-s').textContent = kg(s);
  $('#lab-m').textContent = kg(m);
  const c = $('#lab-c');
  c.textContent = pct(s, m);
  c.classList.toggle('hit', (waterOk && ds === 0) || saltOk);
  $('#lab-addw-v').textContent = kg(dw);
  $('#lab-adds-v').textContent = kg(ds);
  lab.ctrlW.classList.toggle('done', waterOk);
  lab.ctrlS.classList.toggle('done', saltOk);

  const goal = waterOk ? 50 : 15;
  $('#lab-fill').style.width = (100 * s) / m + '%';
  const g = $('#lab-goal');
  g.style.left = goal + '%';
  g.dataset.label = 'цель ' + goal + '%';

  const say = (html, cls = '') => {
    lab.msg.innerHTML = html;
    lab.msg.className = 'result' + (cls ? ' ' + cls : '');
  };
  const share = 100 * s / m;
  if (!waterOk) {
    if (dw === 0) say('Сейчас соли 60%. Доливай воду и следи за процентами.');
    else if (share > 15) say(`Соли ${pct(s, m)} — это ещё больше 15%. Доливай дальше.`);
    else say('Перелили: соли стало меньше 15%. Убери немного воды.', 'bad');
  } else if (ds === 0) {
    say(`Ровно 15%! Обрати внимание: соли так и осталось ${kg(S0)}, изменилась только вода. Теперь досыпай соль.`, 'good');
  } else if (!saltOk) {
    if (share < 50) say(`Соли ${pct(s, m)} — меньше 50%. Досыпай ещё.`);
    else say('Пересолили: соли стало больше 50%. Убери немного соли.', 'bad');
  } else {
    say(`Ровно 50%! Воды так и осталось ${kg(w)}. Масса раствора была ${kg(W0 + S0)}, а стала ${kg(m)}. Во сколько раз она выросла? Посчитай и проверь ответ ниже.`, 'good');
  }
}

function nudge(input, d) {
  input.value = Math.max(+input.min, Math.min(+input.max, +input.value + d));
  renderLab();
}

lab.addW.addEventListener('input', renderLab);
lab.addS.addEventListener('input', renderLab);
$('#lab').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  nudge(act[0] === 'w' ? lab.addW : lab.addS, act[1] === '+' ? 1 : -1);
});
$('#lab-reset').addEventListener('click', () => {
  lab.addW.value = 0;
  lab.addS.value = 0;
  renderLab();
});
renderLab();

/* =====================================================================
   Проверка ответа: понимает 6,8 · 6.8 · 34/5 · 17:2,5 · 6 4/5 · «в 6,8 раза»
   ===================================================================== */

function parseAnswer(src) {
  let s = src.toLowerCase().replace(/раза?/g, '').replace(/^\s*в\s+/, '').replace(/,/g, '.').replace(/[:÷]/g, '/').trim();
  let m = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) return +m[1] + m[2] / m[3];
  s = s.replace(/\s+/g, '');
  m = /^(\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?$/.exec(s);
  if (!m) return null;
  const v = m[2] ? m[1] / m[2] : +m[1];
  return Number.isFinite(v) ? v : null;
}

const near = (a, b) => Math.abs(a - b) < 1e-6;
const ANSWER = 6.8;
// Подсказки на частые ошибки. Сам ответ в них не раскрывается.
const HINTS = [
  [4, 'Так масса изменилась только после того, как долили воду. Но потом ещё досыпали соль, и масса снова выросла.'],
  [1.7, 'Так масса изменилась только на втором этапе, когда досыпали соль. А сравнить нужно с самой первой массой.'],
  [2.5 / 17, 'Ты поделил начальную массу на конечную. Масса выросла, поэтому дели большую на меньшую.'],
  [17, 'Это масса раствора в конце, в килограммах. А спрашивают, во сколько раз она больше начальной.'],
  [14.5, 'Это на сколько килограммов выросла масса. А спрашивают, во сколько раз.'],
  [1, 'Масса раствора точно изменилась: сначала долили воду, потом досыпали соль.'],
];

$('#check-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#ans');
  const verdict = $('#verdict');
  verdict.className = 'verdict';
  if (!input.value.trim()) { verdict.textContent = ''; return; }
  const got = parseAnswer(input.value);
  if (got === null) {
    verdict.textContent = 'Не понимаю запись. Напиши число, например 6,5 или 13/2.';
    verdict.classList.add('bad');
    return;
  }
  if (near(got, ANSWER)) {
    verdict.textContent = '✓ Верно! Масса раствора увеличилась в 6,8 раза.';
    verdict.classList.add('good');
    return;
  }
  const hint = HINTS.find(([v]) => near(v, got));
  verdict.textContent = '✗ Пока нет. ' + (hint ? hint[1] : 'Пройди задачу в лаборатории или открой решение по шагам.');
  verdict.classList.add('bad');
});

/* =====================================================================
   Пошаговое решение: состояние — это только номер шага.
   ===================================================================== */

// Ячейка таблицы: null → «?», строка → значение, [значение, класс] → с подсветкой
function cell(x) {
  if (x === null) return '<td class="q">?</td>';
  if (Array.isArray(x)) return `<td class="${x[1]}">${x[0]}</td>`;
  return `<td>${x}</td>`;
}

const ROWS = ['Начало', 'Долили воду', 'Досыпали соль'];

function table(rows, cur) {
  return `<div class="tbl-wrap"><table class="state">
    <thead><tr><th></th><th>Вода</th><th>Соль</th><th>Раствор</th><th>Соли</th></tr></thead>
    <tbody>${rows.map((r, k) => `<tr${k === cur ? ' class="cur"' : ''}><td>${ROWS[k]}</td>${r.map(cell).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

const jar = (w, s, keep) => `<div class="jar sm">${tiles(w, s, keep)}</div>`;
const eq = (html) => `<p class="big-eq">${html}</p>`;

// Финал: 34 квадратика раскладываем на кучки по 5 (столько было в начале)
function groups() {
  const keys = [];
  for (let i = 0; i < 17; i++) keys.push(['s', i]);
  for (let i = 0; i < 17; i++) keys.push(['w', i]);
  let h = '<div class="groups">';
  for (let g = 0; g * 5 < keys.length; g++) {
    const chunk = keys.slice(g * 5, g * 5 + 5);
    const part = chunk.length < 5;
    h += `<div class="g5${part ? ' part' : ''}"><div class="tiles">${chunk.map(([t, i]) => `<i class="tile ${t}" data-k="${t}${i}"></i>`).join('')}</div>
      <span class="lbl">${part ? chunk.length + '/5' : g + 1}</span></div>`;
  }
  return h + '</div>';
}

const STEPS = [
  {
    html: () => jar(W0, S0) + table([
      ['1 кг', '1,5 кг', ['2,5 кг', 'new'], null],
      [null, null, null, '15%'],
      [null, null, null, '50%'],
    ], 0),
    text: '<b>Что дано.</b> В начале 1 кг воды и 1,5 кг соли. Весь раствор весит 1 + 1,5 = <b>2,5 кг</b> — это 5 квадратиков. Проценты на втором и третьем этапе тоже известны из условия. Остальное найдём.',
  },
  {
    html: () => jar(W0, S0) + eq('1,5 : 2,5 = 0,6 = 60%') + table([
      ['1 кг', '1,5 кг', '2,5 кг', ['60%', 'new']],
      [null, null, null, '15%'],
      [null, null, null, '50%'],
    ], 0),
    text: '<b>Для понимания.</b> Сейчас соли 3 квадратика из 5, то есть 1,5 : 2,5 = 0,6 = <b>60%</b>. Для ответа это число не нужно, но так видно, что вода «разбавит» раствор с 60% до 15%.',
  },
  {
    html: () => jar(W0, S0, 's') + table([
      ['1 кг', '1,5 кг', '2,5 кг', '60%'],
      [null, ['1,5 кг', 'keep'], null, '15%'],
      [null, null, null, '50%'],
    ], 1),
    text: '<b>Доливаем воду. Что не меняется?</b> Соль! Её по-прежнему <b>1,5 кг</b>, те же 3 квадратика. Но теперь эти 1,5 кг составляют только <b>15%</b> всего раствора.',
  },
  {
    html: () => jar(17, S0, 's') + eq('1,5 : 0,15 = 10 кг') + table([
      ['1 кг', '1,5 кг', '2,5 кг', '60%'],
      [['8,5 кг', 'new'], ['1,5 кг', 'keep'], ['10 кг', 'new'], '15%'],
      [null, null, null, '50%'],
    ], 1),
    text: '15% = 15/100 = 3/20. Значит, соль — это <b>3 части из 20</b>. 3 части — это наши 3 квадратика, по 0,5 кг каждый. Всего частей 20, и раствор весит 20 · 0,5 = <b>10 кг</b>. Воды в нём 10 − 1,5 = 8,5 кг: долили 7,5 кг.',
  },
  {
    html: () => jar(17, S0, 'w') + table([
      ['1 кг', '1,5 кг', '2,5 кг', '60%'],
      ['8,5 кг', '1,5 кг', '10 кг', '15%'],
      [['8,5 кг', 'keep'], null, null, '50%'],
    ], 2),
    text: '<b>Досыпаем соль. Что не меняется?</b> Теперь вода: её так и осталось <b>8,5 кг</b>, 17 квадратиков. Соли стало 50%, то есть ровно половина раствора. Значит, вода — это вторая половина.',
  },
  {
    html: () => jar(17, 17, 'w') + eq('8,5 · 2 = 17 кг') + table([
      ['1 кг', '1,5 кг', '2,5 кг', '60%'],
      ['8,5 кг', '1,5 кг', '10 кг', '15%'],
      [['8,5 кг', 'keep'], ['8,5 кг', 'new'], ['17 кг', 'new'], '50%'],
    ], 2),
    text: 'Вода — половина раствора, значит весь раствор вдвое тяжелее: 8,5 · 2 = <b>17 кг</b>. Соли тоже 8,5 кг: досыпали 8,5 − 1,5 = 7 кг. Квадратиков стало 17 + 17 = 34.',
  },
  {
    html: () => groups() + eq('17 : 2,5 = 170 : 25 = 6,8') + table([
      ['1 кг', '1,5 кг', ['2,5 кг', 'keep'], '60%'],
      ['8,5 кг', '1,5 кг', '10 кг', '15%'],
      ['8,5 кг', '8,5 кг', ['17 кг', 'keep'], '50%'],
    ], -1),
    text: '<b>Сравниваем.</b> Было 5 квадратиков, стало 34. Разложим 34 на кучки по 5: получилось 6 полных кучек и ещё 4 квадратика, то есть 4/5 кучки. Масса выросла в 6 4/5 = 6,8 раза.<br><span class="answer">Ответ: масса раствора увеличилась в 6,8 раза</span>',
  },
];

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
    const draw = () => { stage.innerHTML = steps[i].html(); };
    if (animate) flip(stage, draw); else draw();
    text.innerHTML = steps[i].text;
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
    if (e.key === 'ArrowRight') { show(i + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { show(i - 1); e.preventDefault(); }
  });
  show(0, false);
}

makeStepper($('#stepper'), STEPS);
