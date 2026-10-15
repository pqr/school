'use strict';

/* =====================================================================
   Общие помощники и геометрия звезды
   Вершины A–E идут по часовой стрелке, A — сверху.
   Прямая i проходит через вершины LINES[i]: AC, BD, CE, DA, EB.
   ===================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const R = 100;
const TIP_NAMES = 'ABCDE';
const INNER_NAMES = 'KLMNP';
const LINES = [[0, 2], [1, 3], [2, 4], [3, 0], [4, 1]];
const lineName = (i) => TIP_NAMES[LINES[i][0]] + TIP_NAMES[LINES[i][1]];
// Название прямой с цветной чертой снизу — для подписей в тексте
const ln = (i) => `<b class="nm k${i}">${lineName(i)}</b>`;
// Проспекты Звездограда названы по цвету линии на карте
const STREETS = ['Красный', 'Оранжевый', 'Зелёный', 'Синий', 'Фиолетовый'];
const street = (i) => `${STREETS[i]} проспект ${ln(i)}`;

function regularTips() {
  return [0, 1, 2, 3, 4].map((k) => {
    const a = (k * 72 * Math.PI) / 180;
    return { x: R * Math.sin(a), y: -R * Math.cos(a) };
  });
}
const TIPS = regularTips();

const f = (n) => +n.toFixed(2);
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

// Точка пересечения прямых ab и cd; null, если они параллельны
function cross(a, b, c, d) {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9 * Math.hypot(rx, ry) * Math.hypot(sx, sy)) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den;
  return { x: a.x + t * rx, y: a.y + t * ry };
}

// Точка на прямой i: t = 0 — первая вершина, t = 1 — вторая
function at(P, i, t) {
  const a = P[LINES[i][0]], b = P[LINES[i][1]];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Расстояние от точки до отрезка ab
function distSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

// Расстояние от точки до всей прямой ab
function distLine(p, a, b) {
  return Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / (dist(a, b) || 1);
}

/* 10 точек пересечения правильной звезды. Если у двух прямых общая
   вершина — точка на кончике луча, иначе — внутри звезды. */
const PTS = [];
for (let i = 0; i < 5; i++) {
  for (let j = i + 1; j < 5; j++) {
    const p = cross(at(TIPS, i, 0), at(TIPS, i, 1), at(TIPS, j, 0), at(TIPS, j, 1));
    const shared = LINES[i].find((k) => LINES[j].includes(k));
    const outer = shared !== undefined;
    const name = outer ? TIP_NAMES[shared] : INNER_NAMES[j - i === 1 ? i : j];
    PTS.push({ ...p, i, j, outer, name });
  }
}
const ptByName = (n) => PTS.find((p) => p.name === n);

// Подпись отодвигаем от центра наружу
function labelPos(p, c, d) {
  const l = dist(p, c) || 1;
  return { x: p.x + ((p.x - c.x) / l) * d, y: p.y + ((p.y - c.y) / l) * d };
}
const CENTER = { x: 0, y: 0 };

/* ---------- Кусочки SVG ---------- */

// Отрезок pq. anim = {d, dur} — нарисовать «карандашом» с задержкой d
function seg(p, q, cls, anim) {
  const a = anim ? ` pathLength="1" style="--d:${anim.d || 0}s;--dur:${anim.dur || 0.6}s"` : '';
  return `<path class="${cls}${anim ? ' draw' : ''}" d="M${f(p.x)} ${f(p.y)}L${f(q.x)} ${f(q.y)}"${a}/>`;
}

function label(p, text, cls = 'lbl') {
  return `<text class="${cls}" x="${f(p.x)}" y="${f(p.y)}">${text}</text>`;
}

function dot(p, cls, d) {
  const anim = d === undefined ? '' : ` pop" style="--d:${d}s`;
  return `<circle class="pt ${cls}${anim}" cx="${f(p.x)}" cy="${f(p.y)}" r="4.5"/>`;
}

const tipLabels = (P = TIPS) => P.map((p, k) => label(labelPos(p, CENTER, 21), TIP_NAMES[k])).join('');

// Прямая i целиком: хорда звезды + два «луча» за вершины
function fullLine(i, anim, far = 3) {
  const a = at(TIPS, i, 0), b = at(TIPS, i, 1);
  const c = `ln c${i}`;
  if (!anim) {
    return seg(at(TIPS, i, -far), a, `ray c${i}`) + seg(b, at(TIPS, i, 1 + far), `ray c${i}`) + seg(a, b, c);
  }
  const d = anim.d || 0;
  return seg(a, at(TIPS, i, -far), `ray c${i}`, { d: d + 0.45, dur: 0.9 })
    + seg(b, at(TIPS, i, 1 + far), `ray c${i}`, { d: d + 0.45, dur: 0.9 })
    + seg(a, b, c + (anim.flash ? ' flash' : ''), anim.flash ? null : { d, dur: 0.5 });
}

const grayChord = (i, anim) => seg(at(TIPS, i, 0), at(TIPS, i, 1), 'star', anim);

// Координаты клика в системе координат SVG
function svgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: p.x, y: p.y };
}

function missMark(svg, p) {
  svg.insertAdjacentHTML('beforeend', `<circle class="miss" cx="${f(p.x)}" cy="${f(p.y)}" r="14"/>`);
  const el = svg.lastElementChild;
  setTimeout(() => el.remove(), 700);
}

function say(el, html, kind = '') {
  el.className = 'result' + (kind ? ' ' + kind : '');
  el.innerHTML = html;
}

/* =====================================================================
   Письмо мэра печатается на машинке, когда его видно
   ===================================================================== */

(function letter() {
  const body = $('#letter-body');
  const skip = $('#letter-skip');
  const TEXT = `Уважаемый инспектор Циркуль!

Наш Звездоград построен в форме пятиконечной звезды, все его улицы — прямые проспекты. Вчера фирма «Мигай-Мигай» прислала счёт на 21 светофор, по одному на каждый перекрёсток.

Архитектор говорит, что проспектов 10, дворник — что 15. Сколько перекрёстков, не знает никто, а я считать не мастер. Подозреваю, что нас дурят. Разберитесь!

Мэр Звездограда А. П. Лучикова

P. S. Карту города прилагаю.`;
  let timer = 0;

  function done() {
    clearInterval(timer);
    body.textContent = TEXT;
    body.classList.remove('typing');
    skip.hidden = true;
  }

  function type() {
    let n = 0;
    body.classList.add('typing');
    timer = setInterval(() => {
      n += 2;
      body.textContent = TEXT.slice(0, n);
      if (n >= TEXT.length) done();
    }, 28);
  }

  skip.addEventListener('click', done);
  if (REDUCED || !('IntersectionObserver' in window)) { done(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); type(); }
  }, { threshold: 0.3 });
  io.observe(body);
})();

/* =====================================================================
   Рисуем звезду: карандаш едет по ломаной
   ===================================================================== */

(function drawSection() {
  const svg = $('#draw-svg');
  const msg = $('#draw-msg');
  const play = $('#draw-play');
  let mode = 'stroke';
  let raf = 0;

  // Вершины контура: кончик луча, «ямка», следующий кончик…
  const notch = (k) => cross(TIPS[k], TIPS[(k + 2) % 5], TIPS[(k + 1) % 5], TIPS[(k + 4) % 5]);
  const route = () => (mode === 'stroke'
    ? [0, 2, 4, 1, 3, 0].map((k) => TIPS[k])
    : [0, 1, 2, 3, 4, 0].flatMap((k, n) => (n < 5 ? [TIPS[k], notch(k)] : [TIPS[0]])));
  const routeText = () => (mode === 'stroke' ? 'A → C → E → B → D → A' : 'по контуру, через «ямки» между лучами');

  function render() {
    const pts = route();
    const d = 'M' + pts.map((p) => `${f(p.x)} ${f(p.y)}`).join('L');
    svg.innerHTML = `<circle class="guide" cx="0" cy="0" r="${R}"/>`
      + `<path class="star" id="draw-path" d="${d}"/>`
      + TIPS.map((p) => `<circle class="mark" cx="${f(p.x)}" cy="${f(p.y)}" r="3.5"/>`).join('')
      + tipLabels()
      + '<circle class="pencil" id="draw-pen" r="5" cx="0" cy="-100" opacity="0"/>';
  }

  function finish() {
    say(msg, mode === 'stroke'
      ? 'Готово! У основателя вышло <b>5 длинных улиц</b>: AC, CE, EB, BD, DA. В середине они пересекают друг друга.'
      : 'Готово! У архитектора вышел контур из <b>10 коротких сторон</b>, а в середине пусто. Красиво, но улицы-то куда делись?');
  }

  function animate() {
    cancelAnimationFrame(raf);
    render();
    const path = $('#draw-path', svg);
    const pen = $('#draw-pen', svg);
    const len = path.getTotalLength();
    if (REDUCED) { finish(); return; }
    const dur = mode === 'stroke' ? 2600 : 3200;
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    pen.setAttribute('opacity', '1');
    say(msg, (mode === 'stroke' ? 'Основатель рисует: ' : 'Архитектор рисует ') + routeText());
    let t0 = 0;
    const tick = (now) => {
      t0 = t0 || now;
      const t = Math.min(1, (now - t0) / dur);
      path.style.strokeDashoffset = len * (1 - t);
      const p = path.getPointAtLength(len * t);
      pen.setAttribute('cx', p.x);
      pen.setAttribute('cy', p.y);
      if (t < 1) raf = requestAnimationFrame(tick);
      else { pen.setAttribute('opacity', '0'); finish(); }
    };
    raf = requestAnimationFrame(tick);
  }

  $$('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    $$('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    animate();
  }));
  play.addEventListener('click', animate);

  render();
  finish();
  // Первый раз рисуем сами, когда звезда появится на экране
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); animate(); }
    }, { threshold: 0.6 });
    io.observe(svg);
  }
})();

/* =====================================================================
   1. Ищем прямые: нажимаешь на кусочек — появляется вся прямая
   ===================================================================== */

(function findLines() {
  const svg = $('#lines-svg');
  const msg = $('#lines-msg');
  const count = $('#lines-n');
  const found = new Set();

  function render(fresh = -1, flash = -1) {
    let h = '';
    for (let i = 0; i < 5; i++) if (!found.has(i)) h += grayChord(i);
    for (const i of found) {
      if (i === fresh) h += fullLine(i, { d: 0 });
      else if (i === flash) h += fullLine(i, { flash: true });
      else h += fullLine(i);
    }
    svg.innerHTML = h + TIPS.map((p) => `<circle class="mark" cx="${f(p.x)}" cy="${f(p.y)}" r="3"/>`).join('') + tipLabels();
    count.textContent = found.size;
  }

  svg.addEventListener('click', (e) => {
    const p = svgPoint(svg, e);
    let best = -1, bd = 12;
    for (let i = 0; i < 5; i++) {
      const d = distSeg(p, at(TIPS, i, 0), at(TIPS, i, 1));
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) {
      missMark(svg, p);
      say(msg, 'Тут поле с коровами, улиц нет. Нажми прямо на линию.');
      return;
    }
    if (found.has(best)) {
      render(-1, best);
      say(msg, `Это снова ${street(best)}: кусок лежит на нём. Петрович считал бы его отдельно. Ищи серые улицы.`);
      return;
    }
    found.add(best);
    render(best);
    if (found.size === 5) {
      say(msg, `${street(best)}. Серых улиц не осталось: каждый кусок лежит на одном из найденных проспектов. <b>Проспектов (прямых) ровно 5.</b> Петрович чешет затылок: «А мётлы-то куда девать?»`, 'good');
    } else if (found.size === 1) {
      say(msg, `Это ${street(best)}. Ты нажал на маленький кусок, а проспект проходит через весь город и уходит за край карты. На нём лежат <b>3 куска</b> улиц, но проспект один.`);
    } else {
      say(msg, `${street(best)}. Найдено проспектов: ${found.size}. Нажимай на серые улицы.`);
    }
  });

  $('#lines-done').addEventListener('click', () => {
    if (found.size === 5) say(msg, 'Да, все! Проспектов <b>5</b>: AC, BD, CE, DA, EB. Ни 10, ни 15.', 'good');
    else say(msg, 'Пока нет: на карте ещё есть серые улицы. Каждая из них лежит на каком-то проспекте.', 'bad');
  });
  $('#lines-reset').addEventListener('click', () => { found.clear(); render(); say(msg, ''); });

  render();
})();

/* =====================================================================
   2. Ищем точки пересечения
   ===================================================================== */

(function findPoints() {
  const svg = $('#points-svg');
  const msg = $('#points-msg');
  const count = $('#points-n');
  const found = new Set();

  function render(fresh = -1) {
    let h = '';
    for (let i = 0; i < 5; i++) h += fullLine(i);
    h += tipLabels();
    for (const k of found) {
      const p = PTS[k];
      h += dot(p, (p.outer ? 'outer' : 'inner') + (k === fresh ? ' blink' : ''));
      if (!p.outer) h += label(labelPos(p, CENTER, 12), p.name);
    }
    svg.innerHTML = h;
    count.textContent = found.size;
  }

  const allFound = () => 'Все светофоры на месте: <b>10 перекрёстков</b>, 5 на кончиках лучей и 5 в центре. Не 20! Но Мигалкин шепчет: «А за лесом?..» Это проверим в рапорте инспектора.';

  svg.addEventListener('click', (e) => {
    const p = svgPoint(svg, e);
    let best = -1, bd = 14;
    PTS.forEach((q, k) => {
      const d = dist(p, q);
      if (d < bd) { bd = d; best = k; }
    });
    if (best < 0) {
      missMark(svg, p);
      const near = [0, 1, 2, 3, 4].find((i) => distLine(p, at(TIPS, i, 0), at(TIPS, i, 1)) < 8);
      say(msg, near === undefined
        ? 'Светофор посреди поля? Коровы оценят, но перекрёстка тут нет.'
        : `Здесь проходит только ${street(near)}. Светофор нужен там, где встречаются два проспекта.`);
      return;
    }
    const q = PTS[best];
    if (found.has(best)) {
      say(msg, `На перекрёстке ${q.name} светофор уже стоит. Второй тут был бы нужен только Мигалкину.`);
      return;
    }
    found.add(best);
    render(best);
    if (found.size === 10) { say(msg, allFound(), 'good'); return; }
    say(msg, (q.outer
      ? `Перекрёсток ${q.name} на кончике луча: тут встречаются ${ln(q.i)} и ${ln(q.j)}. Светофор поставлен.`
      : `Перекрёсток ${q.name} в центре города: тут пересекаются ${ln(q.i)} и ${ln(q.j)}. Светофор поставлен.`));
  });

  $('#points-done').addEventListener('click', () => {
    const outer = [...found].filter((k) => PTS[k].outer).length;
    const inner = found.size - outer;
    if (found.size === 10) say(msg, allFound(), 'good');
    else if (outer < 5) say(msg, 'Ещё не все. Посмотри на кончики лучей: там тоже встречаются два проспекта.', 'bad');
    else say(msg, `Ещё не все: в центре города найдено только ${inner}. Загляни внутрь звезды, там проспекты тоже пересекаются.`, 'bad');
  });
  $('#points-reset').addEventListener('click', () => { found.clear(); render(); say(msg, ''); });

  render();
})();

/* =====================================================================
   Проверка ответа
   ===================================================================== */

const HINTS_LINES = {
  10: 'Так считал архитектор Штрих: это стороны контура. Каждые две стороны лежат на одном проспекте.',
  15: 'Так считал дворник Петрович: это куски улиц. На каждом проспекте их по 3.',
  1: 'Основатель рисовал одним росчерком, но получилась ломаная, а не один прямой проспект.',
};
const HINTS_POINTS = {
  20: 'Это версия Мигалкина! Каждый перекрёсток он посчитал дважды: один раз от одного проспекта, второй — от другого.',
  21: 'Это счёт Мигалкина целиком. 20 — двойной счёт, а перекрёсток «за лесом» ещё надо доказать.',
  5: 'Это только половина: или кончики лучей, или перекрёстки в центре. Нужны и те, и другие.',
  15: 'Это куски улиц Петровича, а не перекрёстки.',
};

function verdict(el, raw, right, hints, okText, fallback) {
  el.className = 'verdict';
  if (!raw.trim()) { el.textContent = ''; return false; }
  const n = Number(raw.trim());
  if (!Number.isInteger(n)) {
    el.textContent = 'Напиши целое число.';
    el.classList.add('bad');
    return false;
  }
  if (n === right) {
    el.textContent = '✓ ' + okText;
    el.classList.add('good');
    return true;
  }
  el.textContent = '✗ ' + (hints[n] || fallback);
  el.classList.add('bad');
  return false;
}

// Когда оба числа верны, инспектор ставит штампы на показания
const STAMPS = {
  arch: '10 ≠ 5: считал стороны',
  broom: '15 ≠ 5: считал куски',
  blink: '21 ≠ 10: не сходится!',
};
function stampSuspects() {
  for (const [who, text] of Object.entries(STAMPS)) {
    const st = $(`#sus-${who} .stamp`);
    st.textContent = text;
    st.hidden = false;
  }
}

$('#check-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const a = verdict($('#verdict-lines'), $('#ans-lines').value, 5, HINTS_LINES,
    'Проспектов (прямых) 5: верно!', 'Проспектов не столько. Вернись к заданию «Сколько в городе проспектов?».');
  const b = verdict($('#verdict-points'), $('#ans-points').value, 10, HINTS_POINTS,
    'Перекрёстков (точек пересечения) 10: верно! Штампы на показаниях подозреваемых в начале страницы.', 'Перекрёстков не столько. Вернись к заданию «Сколько перекрёстков?».');
  if (a && b) stampSuspects();
});

/* =====================================================================
   Кто виноват
   ===================================================================== */

const CULPRIT = {
  arch: ['bad', 'Штрих ошибся, но нечаянно. Он такой рассеянный, что вчера посчитал свою шляпу за две: у неё же два поля. На ошибке он не заработал ни звездика. Подумай, кому выгодны лишние перекрёстки.'],
  broom: ['bad', 'Петрович ошибся, но ему с этой ошибки никакой выгоды: улицы те же, мести их столько же. Подумай, кто получает деньги за каждый перекрёсток.'],
  blink: ['good', 'Виновен! Мигалкин правильно знал, что у каждого проспекта 4 перекрёстка, но умножил 5 · 4 = 20, и каждый перекрёсток попал в счёт дважды. А «перекрёсток за лесом» он выдумал: два прямых проспекта встречаются только один раз. Лишних светофоров 21 − 10 = 11, это 11 000 звездиков.'],
};

$$('[data-who]').forEach((b) => b.addEventListener('click', () => {
  const [kind, text] = CULPRIT[b.dataset.who];
  $$('[data-who]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  say($('#culprit-msg'), text, kind);
  if (kind === 'good') {
    $('#sus-blink').classList.add('guilty');
    $('#epilogue').hidden = false;
  }
}));

/* =====================================================================
   Пошаговое решение
   ===================================================================== */

const fig = (inner, cls = '') => `<svg class="fig${cls}" viewBox="-130 -128 260 232" role="img" aria-hidden="true">${inner}</svg>`;
const DRAW_ORDER = [0, 2, 4, 1, 3]; // AC, CE, EB, BD, DA — как рисует карандаш
const allLines = () => [0, 1, 2, 3, 4].map((i) => fullLine(i)).join('');
const outerPts = (anim) => PTS.filter((p) => p.outer).map((p, n) => dot(p, 'outer', anim ? n * 0.25 : undefined)).join('');
const innerPts = (anim) => PTS.filter((p) => !p.outer)
  .map((p, n) => dot(p, 'inner', anim ? 0.2 + n * 0.25 : undefined) + label(labelPos(p, CENTER, 12), p.name)).join('');
const legend = '<p class="legend"><span><i class="dot outer"></i>кончики лучей</span><span><i class="dot inner"></i>точки внутри звезды</span></p>';

// Таблица пар: у каждой прямой — пары с теми, что ниже по списку
function pairsTable() {
  let h = '<div class="pairs">';
  for (let i = 0; i < 5; i++) {
    const chips = [];
    for (let j = i + 1; j < 5; j++) {
      const p = PTS.find((q) => q.i === i && q.j === j);
      chips.push(`<span class="chip">${ln(j)} → <i class="dot ${p.outer ? 'outer' : 'inner'}"></i><b>${p.name}</b></span>`);
    }
    h += `<div class="pair-row fade${chips.length ? '' : ' none'}" style="--d:${i * 0.5}s"><span class="who">${ln(i)}</span>`
      + (chips.length ? chips.join('') : '<span>все пары уже посчитаны</span>')
      + `<span class="sum">${chips.length}</span></div>`;
  }
  return h + '</div>';
}

// Отъезжаем камерой: прямые тянутся далеко, новых точек не появляется
function zoomOut(stage) {
  const svg = $('svg', stage);
  const dots = $$('circle', svg);
  const from = [-130, -128, 260, 232];
  const k = 4;
  const set = (s) => {
    const cx = 0, cy = -12;
    const w = from[2] * s, h = from[3] * s;
    svg.setAttribute('viewBox', `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);
    dots.forEach((c) => c.setAttribute('r', 4.5 * Math.sqrt(s)));
  };
  if (REDUCED) { set(k); return () => {}; }
  let raf = 0, t0 = 0;
  const tick = (now) => {
    t0 = t0 || now;
    const t = Math.min(1, Math.max(0, (now - t0 - 300) / 1800));
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    set(1 + (k - 1) * e);
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

const STEPS = [
  {
    html: () => fig(DRAW_ORDER.map((i, n) => grayChord(i, { d: n * 0.5, dur: 0.5 })).join('') + tipLabels()),
    text: '<b>Карта.</b> Основатель соединил 5 площадей через одну: A → C → E → B → D → A. На карте 5 отрезков: AC, CE, EB, BD и DA.',
  },
  {
    html: () => fig([1, 2, 3, 4].map((i) => grayChord(i)).join('') + fullLine(0, { d: 0.2 }) + tipLabels()),
    text: `<b>Отрезок — часть прямой.</b> Отрезок AC — кусок проспекта ${ln(0)}. Продлим его в обе стороны, за город. Другие улицы режут AC на 3 куска, но проспект всё равно один.`,
  },
  {
    html: () => fig([0, 1, 2, 3, 4].map((i, n) => fullLine(i, { d: n * 0.45 })).join('') + tipLabels()),
    text: `Так же продлим остальные: ${ln(1)}, ${ln(2)}, ${ln(3)}, ${ln(4)}. Любой кусок любой улицы лежит на одном из этих проспектов.<br><span class="answer">Прямых (проспектов): 5</span><br><span class="small">10 сторон контура Штриха лежат на тех же 5 прямых, по 2 на каждой. 15 кусков Петровича — по 3 на каждой.</span>`,
  },
  {
    html: () => fig(allLines() + tipLabels() + outerPts(true)) + legend,
    text: `<b>Перекрёстки на кончиках лучей.</b> В каждой вершине встречаются две прямые. Например, в точке A — ${ln(0)} и ${ln(3)}. Таких точек <b>5</b>: A, B, C, D, E.`,
  },
  {
    html: () => fig(allLines() + tipLabels() + outerPts() + innerPts(true)) + legend,
    text: `<b>Перекрёстки в центре.</b> В середине города получился пятиугольник. Его вершины K, L, M, N, P — тоже точки пересечения. Например, в точке K пересекаются ${ln(0)} и ${ln(1)}. Это ещё <b>5</b> точек.<p class="big-eq">5 + 5 = 10</p>`,
  },
  {
    html: () => fig([0, 1, 2, 3, 4].map((i) => fullLine(i, null, 30)).join('') + outerPts() + PTS.filter((p) => !p.outer).map((p) => dot(p, 'inner')).join(''), ' zoomfig'),
    after: zoomOut,
    text: '<b>Перекрёсток за лесом?</b> Мигалкин клянётся, что далеко за городом проспекты снова сходятся. Поднимемся на вертолёте повыше. Прямые только расходятся, новых точек не видно. Но вдруг они встретятся за горизонтом? Тут нужна решающая улика.',
  },
  {
    html: () => pairsTable() + '<p class="big-eq">4 + 3 + 2 + 1 = 10</p>',
    text: '<b>Решающая улика.</b> Две прямые пересекаются не больше одного раза: если бы они встретились дважды, одна из них была бы кривой. Переберём пары: AC встречает 4 другие прямые, у BD остаётся 3 новые пары, у CE — 2, у DA — 1. Всего 10 пар, и у каждой пары перекрёсток уже найден. Значит, за лесом ничего нет. А 20 у Мигалкина вышло так: 5 · 4 = 20, но каждая пара посчитана дважды, 20 : 2 = 10.<br><span class="answer">Ответ: 5 прямых, 10 точек пересечения</span>',
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
      <button class="btn" type="button" data-go="first" aria-label="Сначала">⟲<span class="txt"> Сначала</span></button>
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
  let stop = () => {};

  function show(n) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    stop();
    stage.innerHTML = steps[i].html();
    stop = steps[i].after ? steps[i].after(stage) : () => {};
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
  // Анимации первого шага запускаем, когда решение открыли
  root.closest('details')?.addEventListener('toggle', (e) => { if (e.target.open) show(i); });
  show(0);
}

makeStepper($('#stepper'), STEPS);

/* =====================================================================
   Песочница: 5 подвижных вершин, прямые продлены до краёв
   ===================================================================== */

(function sandbox() {
  const svg = $('#sand-svg');
  const counter = $('#sand-n');
  const msg = $('#sand-msg');
  const VIEW = { x0: -150, y0: -140, x1: 150, y1: 130 };
  const BOUND = { x0: -138, y0: -128, x1: 138, y1: 118 };
  const C = { x: 0, y: -5 };
  let P = regularTips();
  let drag = -1;
  let raf = 0;

  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };

  // Все точки пересечения; совпавшие точки склеиваем
  function analyse() {
    const pts = [];
    const parallel = [];
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        const p = cross(at(P, i, 0), at(P, i, 1), at(P, j, 0), at(P, j, 1));
        if (!p) { parallel.push([i, j]); continue; }
        const g = pts.find((q) => dist(p, q) < 1.5);
        if (g) { g.lines.add(i); g.lines.add(j); } else pts.push({ ...p, lines: new Set([i, j]) });
      }
    }
    return { pts, parallel };
  }

  const inView = (p) => p.x > VIEW.x0 + 4 && p.x < VIEW.x1 - 4 && p.y > VIEW.y0 + 4 && p.y < VIEW.y1 - 4;

  // Стрелка у края рисунка в сторону далёкой точки
  function farArrow(p) {
    const dx = p.x - C.x, dy = p.y - C.y;
    const m = 12;
    const s = Math.min(
      dx > 0 ? (VIEW.x1 - m - C.x) / dx : dx < 0 ? (VIEW.x0 + m - C.x) / dx : Infinity,
      dy > 0 ? (VIEW.y1 - m - C.y) / dy : dy < 0 ? (VIEW.y0 + m - C.y) / dy : Infinity,
    );
    const x = C.x + dx * s, y = C.y + dy * s;
    const a = (Math.atan2(dy, dx) * 180) / Math.PI;
    return `<path class="far" d="M8 0L-5 -6L-5 6Z" transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"/>`;
  }

  function render() {
    const { pts, parallel } = analyse();
    let h = '';
    for (let i = 0; i < 5; i++) {
      if (dist(at(P, i, 0), at(P, i, 1)) < 1) continue;
      h += seg(at(P, i, -20), at(P, i, 21), `ln c${i}`);
    }
    // Ручки под точками: красную точку в вершине должно быть видно
    h += P.map((p) => `<circle class="handle" cx="${f(p.x)}" cy="${f(p.y)}" r="7"/>`).join('');
    let far = 0, multi = 0;
    for (const p of pts) {
      if (!inView(p)) { far++; h += farArrow(p); continue; }
      if (p.lines.size > 2) {
        multi++;
        h += `<circle class="halo" cx="${f(p.x)}" cy="${f(p.y)}" r="9"/>` + dot(p, 'multi');
      } else {
        h += dot(p, 'outer');
      }
    }
    const c = P.reduce((s, p) => ({ x: s.x + p.x / 5, y: s.y + p.y / 5 }), { x: 0, y: 0 });
    h += P.map((p, k) => label(labelPos(p, c, 20), TIP_NAMES[k])).join('');
    svg.innerHTML = h;

    const n = pts.length;
    counter.innerHTML = `Проспектов: <b>5</b> · Перекрёстков: <b>${n}</b>`;
    const parts = [];
    if (far) parts.push(`${far} ${plural(far, 'перекрёсток', 'перекрёстка', 'перекрёстков')} за краем карты: туда показывают серые стрелки. Они настоящие, просто далеко.`);
    for (const [i, j] of parallel) parts.push(`Проспекты ${ln(i)} и ${ln(j)} параллельны и не встретятся никогда, даже за лесом. Перекрёстков стало меньше, Мигалкин в отчаянии.`);
    if (multi) parts.push('В красной точке сходятся сразу три проспекта: три пары встретились в одном месте. Будет жуткая пробка, а светофоров меньше.');
    if (n === 10) parts.push('Все 10 пар проспектов пересекаются в разных местах. Больше 10 у пяти прямых не бывает, как ни двигай. Мигалкин грызёт карандаш.');
    say(msg, parts.join(' '), n === 10 ? 'good' : '');
  }

  function clamp(p) {
    return { x: Math.max(BOUND.x0, Math.min(BOUND.x1, p.x)), y: Math.max(BOUND.y0, Math.min(BOUND.y1, p.y)) };
  }

  svg.addEventListener('pointerdown', (e) => {
    const p = svgPoint(svg, e);
    let bd = 20;
    drag = -1;
    P.forEach((q, k) => { const d = dist(p, q); if (d < bd) { bd = d; drag = k; } });
    if (drag < 0) return;
    cancelAnimationFrame(raf);
    svg.setPointerCapture(e.pointerId);
    svg.classList.add('grabbing');
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (drag < 0) return;
    P[drag] = clamp(svgPoint(svg, e));
    render();
  });
  const end = () => { drag = -1; svg.classList.remove('grabbing'); };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  function preset(name) {
    const S = regularTips();
    if (name === 'random') {
      const base = Math.random() * 72;
      return [0, 1, 2, 3, 4].map((k) => {
        const a = ((base + k * 72 + (Math.random() - 0.5) * 40) * Math.PI) / 180;
        const r = 65 + Math.random() * 50;
        return clamp({ x: r * Math.sin(a), y: -r * Math.cos(a) });
      });
    }
    // D сдвигаем так, чтобы BD стала параллельна AC
    if (name === 'parallel') S[3] = { x: S[1].x + 0.55 * (S[2].x - S[0].x), y: S[1].y + 0.55 * (S[2].y - S[0].y) };
    // C ставим на середину BD: через C пройдут AC, CE и BD
    if (name === 'three') S[2] = { x: (S[1].x + S[3].x) / 2, y: (S[1].y + S[3].y) / 2 };
    return S;
  }

  // Плавно переводим вершины в новое положение; в конце ставим точные координаты
  function moveTo(target) {
    cancelAnimationFrame(raf);
    if (REDUCED) { P = target; render(); return; }
    const from = P.map((p) => ({ ...p }));
    let t0 = 0;
    const tick = (now) => {
      t0 = t0 || now;
      const t = Math.min(1, (now - t0) / 600);
      const e = 1 - (1 - t) ** 3;
      P = t < 1 ? from.map((p, k) => ({ x: p.x + (target[k].x - p.x) * e, y: p.y + (target[k].y - p.y) * e })) : target;
      render();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => moveTo(preset(b.dataset.preset))));
  render();
})();
