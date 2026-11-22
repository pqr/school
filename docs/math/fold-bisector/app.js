(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Геометрия чертежа ---------- */
  // B в начале координат, BC по горизонтали. deg — угол DBC. Чертёж условный, не в масштабе.
  const SCALE = 280, OX = 60, OY = 440, DEFAULT_DEG = 38;

  function geom(deg) {
    const t = deg * Math.PI / 180;
    const bd = 1 / Math.cos(t);
    const P = (x, y) => ({ x: OX + x * SCALE, y: OY - y * SCALE });
    return {
      B: P(0, 0),
      C: P(1, 0),
      D: P(1, Math.tan(t)),
      A: P(bd * Math.cos(2 * t), bd * Math.sin(2 * t)),
      H: P(Math.cos(2 * t), Math.sin(2 * t)),
      E: P(1 - (bd - 1), 0),
    };
  }

  const f1 = (n) => n.toFixed(1);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const unit = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  };
  const pts = (list) => list.map((p) => f1(p.x) + ',' + f1(p.y)).join(' ');

  const LABEL_OFFSET = { A: [-8, -16], B: [-16, 14], C: [16, 14], D: [18, -8], E: [0, 24], H: [-20, -2] };

  // flags — набор включённых слоёв, hl — список отрезков для подсветки ('AB', 'BD', ...)
  function draw(svg, flags, hl = [], deg = DEFAULT_DEG) {
    const g = geom(deg);
    const has = (k) => flags.has(k);
    let s = '';

    const line = (a, b, cls = 'ln') =>
      `<line class="${cls}" x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}"/>`;
    const ticks = (a, b, n) => {
      const m = mid(a, b), u = unit(a, b), nx = -u.y, ny = u.x;
      let out = '';
      for (let i = 0; i < n; i++) {
        const o = (i - (n - 1) / 2) * 6;
        const cx = m.x + u.x * o, cy = m.y + u.y * o;
        out += `<line class="tick" x1="${f1(cx - nx * 7)}" y1="${f1(cy - ny * 7)}" x2="${f1(cx + nx * 7)}" y2="${f1(cy + ny * 7)}"/>`;
      }
      return out;
    };
    const arc = (v, a, b, r) => {
      const u1 = unit(v, a), u2 = unit(v, b);
      return `<path class="arc" d="M${f1(v.x + u1.x * r)} ${f1(v.y + u1.y * r)} A${r} ${r} 0 0 0 ${f1(v.x + u2.x * r)} ${f1(v.y + u2.y * r)}"/>`;
    };
    const square = (v, a, b) => {
      const u = unit(v, a), w = unit(v, b), k = 13;
      return `<polyline class="sq" points="${pts([
        { x: v.x + u.x * k, y: v.y + u.y * k },
        { x: v.x + (u.x + w.x) * k, y: v.y + (u.y + w.y) * k },
        { x: v.x + w.x * k, y: v.y + w.y * k },
      ])}"/>`;
    };
    const num = (a, b, text, dx, dy, cls = '') => {
      const m = mid(a, b);
      return `<text class="num ${cls}" x="${f1(m.x + dx)}" y="${f1(m.y + dy)}">${text}</text>`;
    };
    const point = (name) => {
      const p = g[name], o = LABEL_OFFSET[name];
      return `<circle class="pt" cx="${f1(p.x)}" cy="${f1(p.y)}" r="4.5"/>` +
        `<text class="lab" x="${f1(p.x + o[0])}" y="${f1(p.y + o[1])}">${name}</text>`;
    };

    // заливки треугольников
    if (has('fBDC')) s += `<polygon class="f-yellow" points="${pts([g.B, g.D, g.C])}"/>`;
    if (has('fBDH')) s += `<polygon class="f-yellow" points="${pts([g.B, g.D, g.H])}"/>`;
    if (has('fDCE')) s += `<polygon class="f-coral" points="${pts([g.D, g.C, g.E])}"/>`;
    if (has('fDHA')) s += `<polygon class="f-coral" points="${pts([g.D, g.H, g.A])}"/>`;

    // подсветка
    hl.forEach((name) => { s += line(g[name[0]], g[name[1]], 'hl'); });

    // линии
    if (has('quad')) s += line(g.A, g.B) + line(g.B, g.C) + line(g.C, g.D) + line(g.D, g.A);
    if (has('bd')) s += line(g.B, g.D);
    if (has('de')) s += line(g.D, g.E);
    if (has('h')) s += line(g.D, g.H, 'dash') + square(g.H, g.B, g.D);

    // пометки
    if (has('tAB')) s += ticks(g.A, g.B, 1) + ticks(g.B, g.D, 1);
    if (has('tAD')) s += ticks(g.A, g.D, 2) + ticks(g.D, g.E, 2);
    if (has('tDH')) s += ticks(g.D, g.H, 3) + ticks(g.D, g.C, 3);
    if (has('ang')) s += arc(g.B, g.C, g.D, 42) + arc(g.B, g.D, g.A, 50);
    if (has('rightC')) s += square(g.C, g.B, g.D);

    // числа
    if (has('nums')) s += num(g.B, g.E, '7', 0, -14) + num(g.E, g.C, '5', 0, -14);
    if (has('bc12')) s += num(g.B, g.C, '<tspan font-style="italic">BC</tspan> = 12', 0, 52, 'new');
    if (has('bh12')) s += num(g.B, g.H, '12', -20, 8, 'new');
    if (has('ah5')) s += num(g.H, g.A, '5', -20, 0, 'new');
    if (has('bd17')) s += num(g.B, g.D, '17', 16, 14, 'new');

    // точки
    if (has('quad')) s += point('A') + point('B') + point('C') + point('D');
    if (has('e')) s += point('E');
    if (has('h')) s += point('H');

    svg.innerHTML = s;
    return g;
  }

  /* ---------- Анимации: сгиб по BD и поворот вокруг D ---------- */
  function animate(svg, frame, done) {
    if (reduceMotion) { done(); return; }
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    svg.appendChild(poly);
    const t0 = performance.now(), dur = 1300;
    const tick = (now) => {
      const raw = Math.min(1, (now - t0) / dur);
      const t = raw < .5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      frame(poly, t);
      if (raw < 1) requestAnimationFrame(tick); else done();
    };
    requestAnimationFrame(tick);
  }

  // Треугольник BDC переворачивается через прямую BD, как сложенный лист: C попадает в H
  function animFold(svg, done) {
    const g = geom(DEFAULT_DEG);
    const u = unit(g.B, g.D);
    const k = (g.C.x - g.B.x) * u.x + (g.C.y - g.B.y) * u.y;
    const foot = { x: g.B.x + u.x * k, y: g.B.y + u.y * k };
    animate(svg, (poly, t) => {
      const c = Math.cos(Math.PI * t);
      const p = { x: foot.x + (g.C.x - foot.x) * c, y: foot.y + (g.C.y - foot.y) * c };
      poly.setAttribute('class', 'fly f-yellow');
      poly.setAttribute('points', pts([g.B, g.D, p]));
    }, done);
  }

  // Треугольник DCE поворачивается вокруг D: C попадает в H, E попадает в A
  function animRotate(svg, done) {
    const g = geom(DEFAULT_DEG);
    const a1 = Math.atan2(g.C.y - g.D.y, g.C.x - g.D.x);
    const a2 = Math.atan2(g.H.y - g.D.y, g.H.x - g.D.x);
    let phi = a2 - a1;
    while (phi > Math.PI) phi -= 2 * Math.PI;
    while (phi < -Math.PI) phi += 2 * Math.PI;
    const rot = (p, a) => {
      const dx = p.x - g.D.x, dy = p.y - g.D.y;
      return { x: g.D.x + dx * Math.cos(a) - dy * Math.sin(a), y: g.D.y + dx * Math.sin(a) + dy * Math.cos(a) };
    };
    animate(svg, (poly, t) => {
      poly.setAttribute('class', 'fly f-coral');
      poly.setAttribute('points', pts([g.D, rot(g.C, phi * t), rot(g.E, phi * t)]));
    }, done);
  }

  /* ---------- Универсальный вопрос ---------- */
  // q: { text, type: 'choice' | 'num', options: [{ t, ok, fb }], answer, wrong: { '7': '...' }, good }
  function makeQuestion(q, onCorrect) {
    const box = document.createElement('div');
    box.className = 'q';
    const fb = document.createElement('p');
    fb.className = 'fb';
    fb.setAttribute('aria-live', 'polite');
    if (q.text) {
      const p = document.createElement('div');
      p.className = 'q-text';
      p.innerHTML = q.text;
      box.appendChild(p);
    }
    const win = () => {
      box.classList.add('ok');
      fb.className = 'fb good';
      fb.innerHTML = q.good || 'Верно!';
      if (onCorrect) onCorrect();
    };
    const lose = (msg) => {
      fb.className = 'fb bad';
      fb.innerHTML = msg;
    };

    if (q.type === 'choice') {
      const opts = document.createElement('div');
      opts.className = 'opts';
      q.options.forEach((o) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'opt';
        b.innerHTML = o.t;
        b.addEventListener('click', () => {
          if (o.ok) {
            b.classList.add('right');
            opts.querySelectorAll('button').forEach((x) => { x.disabled = true; });
            win();
          } else {
            b.classList.add('wrong');
            b.disabled = true;
            lose(o.fb || 'Не то. Подумай ещё.');
          }
        });
        opts.appendChild(b);
      });
      box.appendChild(opts);
    } else {
      const row = document.createElement('div');
      row.className = 'numrow';
      const label = document.createElement('label');
      label.innerHTML = q.label || 'Ответ:';
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      label.appendChild(document.createTextNode(' '));
      label.appendChild(input);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.textContent = 'Проверить';
      const check = () => {
        const v = input.value.trim().replace(',', '.');
        if (v === '') { lose('Впиши число.'); return; }
        if (Number(v) === q.answer) {
          input.disabled = true;
          btn.hidden = true;
          win();
        } else {
          input.classList.remove('wrong');
          void input.offsetWidth;
          input.classList.add('wrong');
          lose((q.wrong && q.wrong[v]) || 'Пока не сходится. Проверь рассуждение или возьми подсказку.');
        }
      };
      btn.addEventListener('click', check);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      row.appendChild(label);
      row.appendChild(btn);
      box.appendChild(row);
    }
    box.appendChild(fb);
    return box;
  }

  /* ---------- 1. Условие по фразам ---------- */
  const COND = [
    { add: ['quad'], hl: ['AB', 'BC', 'CD', 'DA'],
      html: '<p>Четыре точки <i>A</i>, <i>B</i>, <i>C</i>, <i>D</i> соединили по порядку. Отрезки <i>AB</i>, <i>BC</i>, <i>CD</i>, <i>DA</i> — <b class="term">стороны</b> четырёхугольника.</p>' },
    { add: ['bd', 'tAB'], hl: ['AB', 'BD'],
      html: '<p>Отрезок <i>BD</i> соединяет противоположные вершины — это <b class="term">диагональ</b>. Она такой же длины, как сторона <i>AB</i>.</p><p>Одинаковые чёрточки на чертеже значат «эти отрезки равны». Заметь: треугольник <i>ABD</i> равнобедренный.</p>' },
    { add: ['ang'], hl: ['BD'],
      html: '<p>Диагональ <i>BD</i> делит угол при вершине <i>B</i> на два одинаковых угла (дужки). Луч, который делит угол пополам, называется <b class="term">биссектрисой</b>.</p><p>Значит, <i>BD</i> — биссектриса угла <i>ABC</i>.</p>' },
    { add: ['rightC'], hl: ['BC', 'CD'],
      html: '<p>В вершине <i>C</i> прямой угол (квадратик): сторона <i>DC</i> перпендикулярна стороне <i>BC</i>.</p><p>Треугольник <i>BCD</i> прямоугольный, а <i>BD</i> — его <b class="term">гипотенуза</b>.</p>' },
    { add: ['e'], hl: ['BC'],
      html: '<p>Точка <i>E</i> лежит на стороне <i>BC</i>, где-то между <i>B</i> и <i>C</i>. Где именно — скажет следующее условие.</p>' },
    { add: ['de', 'tAD'], hl: ['AD', 'DE'],
      html: '<p>Точку <i>E</i> выбрали так, чтобы отрезок <i>DE</i> получился равен стороне <i>AD</i>.</p><p>Двойные чёрточки — это вторая пара равных отрезков. Не путай её с первой парой.</p>' },
    { add: ['nums'], hl: ['BE', 'EC'],
      html: '<p>Точка <i>E</i> делит сторону <i>BC</i> на два куска: <i>BE</i> = 7 и <i>EC</i> = 5. Других чисел в задаче нет.</p>' },
    { add: [], hl: ['BD'],
      html: '<p>Найти нужно длину диагонали <i>BD</i>.</p><p>Про неё известно немного: она равна <i>AB</i>, делит угол <i>B</i> пополам и служит гипотенузой треугольника <i>BCD</i>. Этого хватит!</p>' },
  ];

  (function initCond() {
    const svg = $('fig-cond');
    const buttons = [...$('statement').querySelectorAll('button')];
    let cur = -1, maxSeen = -1;

    function show(i) {
      cur = i;
      maxSeen = Math.max(maxSeen, i);
      const flags = new Set();
      for (let k = 0; k <= i; k++) COND[k].add.forEach((x) => flags.add(x));
      draw(svg, flags, i >= 0 ? COND[i].hl : []);
      buttons.forEach((b) => {
        const s = Number(b.dataset.s);
        b.classList.toggle('on', s === i);
        b.classList.toggle('seen', s !== i && s <= maxSeen);
        b.setAttribute('aria-pressed', s === i ? 'true' : 'false');
      });
      $('explain').innerHTML = i < 0
        ? '<p>Пока чертёж пустой. Нажми на первый подчёркнутый кусок: «четырёхугольник <i>ABCD</i>».</p>'
        : COND[i].html;
      $('cond-prev').disabled = i <= 0;
      $('cond-next').disabled = i >= COND.length - 1;
      $('cond-count').textContent = i < 0 ? '' : `${i + 1} из ${COND.length}`;
    }

    buttons.forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.s))));
    $('cond-prev').addEventListener('click', () => show(cur - 1));
    $('cond-next').addEventListener('click', () => show(cur + 1));
    show(-1);
  })();

  /* ---------- 2. Ползунок ---------- */
  const BASE = ['quad', 'bd', 'tAB', 'ang', 'rightC', 'e', 'de', 'tAD'];
  (function initFlex() {
    const svg = $('fig-flex'), input = $('flex');
    const render = () => draw(svg, new Set(BASE), [], Number(input.value));
    input.addEventListener('input', render);
    render();
  })();

  /* ---------- 3. Проверка понимания ---------- */
  [
    { text: 'Что такое <i>BD</i> в четырёхугольнике <i>ABCD</i>?', type: 'choice',
      good: 'Да, диагональ: она соединяет противоположные вершины.',
      options: [
        { t: 'Сторона', fb: 'Стороны — это <i>AB</i>, <i>BC</i>, <i>CD</i>, <i>DA</i>. А <i>BD</i> идёт внутри фигуры.' },
        { t: 'Диагональ', ok: true },
        { t: 'Высота', fb: 'Высота должна быть к чему-то перпендикулярна. Про <i>BD</i> такого не сказано.' },
      ] },
    { text: 'Какой треугольник равнобедренный из-за условия <i>AB</i> = <i>BD</i>?', type: 'choice',
      good: 'Верно: в треугольнике <i>ABD</i> равны стороны <i>AB</i> и <i>BD</i>.',
      options: [
        { t: 'Треугольник <i>BCD</i>', fb: 'В нём нет стороны <i>AB</i>.' },
        { t: 'Треугольник <i>ABD</i>', ok: true },
        { t: 'Треугольник <i>DCE</i>', fb: 'В нём нет ни <i>AB</i>, ни <i>BD</i>.' },
      ] },
    { text: 'Условие ∠<i>ABD</i> = ∠<i>DBC</i> значит, что для угла <i>ABC</i> луч <i>BD</i> —', type: 'choice',
      good: 'Точно. Запомни это слово: биссектриса очень пригодится.',
      options: [
        { t: 'медиана', fb: 'Медиана делит пополам сторону, а здесь пополам делится угол.' },
        { t: 'высота', fb: 'Высота образует прямой угол. Здесь про равные углы.' },
        { t: 'биссектриса', ok: true },
      ] },
    { text: 'Чему равна вся сторона <i>BC</i>?', type: 'num', answer: 12, label: '<i>BC</i> =',
      good: 'Да: 7 + 5 = 12.',
      wrong: { '2': 'Куски надо сложить, а не вычесть: <i>E</i> лежит между <i>B</i> и <i>C</i>.', '35': 'Умножать не нужно. Точка <i>E</i> делит отрезок на два куска.' } },
  ].forEach((q) => $('quiz').appendChild(makeQuestion(q)));

  /* ---------- 4. Путь к ответу ---------- */
  const HINT_NAMES = ['Наводящий вопрос', 'Подсказка посильнее', 'Почти ответ'];

  const STEPS = [
    {
      title: 'Разминка',
      q: { text: 'Начнём с простого. Чему равна сторона <i>BC</i>?', type: 'num', answer: 12, label: '<i>BC</i> =',
        wrong: { '2': 'Точка <i>E</i> лежит между <i>B</i> и <i>C</i>, куски складываются.' } },
      hints: ['На какие два куска точка <i>E</i> делит отрезок <i>BC</i>?', '<i>BC</i> = <i>BE</i> + <i>EC</i>.'],
      done: '<i>BC</i> = 7 + 5 = 12',
      add: ['bc12'],
    },
    {
      title: 'Главная идея',
      q: { text: 'На чертеже есть биссектриса <i>BD</i> и перпендикуляр <i>DC</i> к одной стороне угла <i>B</i>. Какое дополнительное построение сюда просится?', type: 'choice',
        good: 'Да! Смотри на чертёж: если согнуть лист по биссектрисе <i>BD</i>, точка <i>C</i> попадёт ровно в <i>H</i>.',
        options: [
          { t: 'Провести диагональ <i>AC</i>', fb: 'Отрезок <i>AC</i> ничего не знает ни о равных углах, ни о прямом угле. Посмотри на биссектрису.' },
          { t: 'Провести отрезок <i>AE</i>', fb: 'Треугольник <i>ADE</i> и правда равнобедренный, но про его углы ничего не известно. Попробуй использовать биссектрису.' },
          { t: 'Опустить перпендикуляр <i>DH</i> из точки <i>D</i> на сторону <i>AB</i>', ok: true },
          { t: 'Отметить середину отрезка <i>BD</i>', fb: 'Середина пригодилась бы для медианы. А у нас биссектриса и прямой угол.' },
        ] },
      hints: [
        'Из точки <i>D</i> к стороне <i>BC</i> угла уже идёт перпендикуляр <i>DC</i>. А что с другой стороной угла — <i>BA</i>?',
        'Представь, что лист согнули по прямой <i>BD</i>. Сторона <i>BC</i> ляжет на сторону <i>BA</i>, потому что углы равны. Куда попадёт точка <i>C</i>?',
        'Нужен второй перпендикуляр из точки <i>D</i> — на сторону <i>AB</i>. Назовём его <i>DH</i>.',
      ],
      done: 'Провели <i>DH</i> ⊥ <i>AB</i>',
      add: ['h', 'fBDC', 'fBDH'],
      anim: 'fold',
    },
    {
      title: 'Первая пара треугольников',
      q: { text: 'Сравни жёлтые треугольники <i>BDH</i> и <i>BDC</i>. Оба прямоугольные. По какому признаку они равны?', type: 'choice',
        good: 'Верно: гипотенуза <i>BD</i> общая, а острые углы при вершине <i>B</i> равны по условию.',
        options: [
          { t: 'По двум катетам', fb: 'Про катеты мы пока ничего не знаем — их как раз хочется найти.' },
          { t: 'По гипотенузе и острому углу', ok: true },
          { t: 'По трём сторонам', fb: 'Три стороны нам не известны. Что у треугольников общее и что равно по условию?' },
          { t: 'Они не равны', fb: 'Равны! Вспомни сгиб по <i>BD</i>: один треугольник лёг на другой.' },
        ] },
      hints: [
        'Что у этих треугольников общее? И какое условие задачи говорит про их углы?',
        '<i>BD</i> — гипотенуза в обоих треугольниках. Углы <i>HBD</i> и <i>DBC</i> равны по условию.',
      ],
      done: '△<i>BDH</i> = △<i>BDC</i> по гипотенузе и острому углу',
      add: [],
    },
    {
      title: 'Что даёт равенство',
      q: { text: 'В равных треугольниках равны соответствующие стороны. Чему равен отрезок <i>BH</i>?', type: 'num', answer: 12, label: '<i>BH</i> =',
        wrong: { '7': '7 — это <i>BE</i>. А какой катет треугольника <i>BDC</i> соответствует <i>BH</i>?', '5': '5 — это <i>EC</i>. Ищи сторону треугольника <i>BDC</i>, которая при сгибе ложится на <i>BH</i>.' } },
      hints: [
        'Какая сторона треугольника <i>BDC</i> при сгибе ложится на <i>BH</i>?',
        '<i>BH</i> = <i>BC</i>: оба катета прилегают к равным углам при вершине <i>B</i>.',
      ],
      done: '<i>BH</i> = <i>BC</i> = 12',
      add: ['bh12'],
    },
    {
      title: 'Вторая находка',
      q: { text: 'Из того же равенства: отрезок <i>DH</i> равен отрезку…', type: 'choice',
        good: 'Да, <i>DH</i> = <i>DC</i>. Кстати, это свойство биссектрисы: её точка одинаково удалена от сторон угла.',
        options: [
          { t: '<i>BC</i>', fb: '<i>BC</i> лежит напротив вершины <i>D</i>, а <i>DH</i> из неё выходит.' },
          { t: '<i>DE</i>', fb: '<i>DE</i> равен <i>AD</i>, это другое условие.' },
          { t: '<i>DC</i>', ok: true },
          { t: '<i>AD</i>', fb: '<i>AD</i> не сторона жёлтых треугольников.' },
        ] },
      hints: ['<i>DH</i> лежит против угла <i>HBD</i>. Какая сторона второго треугольника лежит против равного ему угла <i>DBC</i>?'],
      done: '<i>DH</i> = <i>DC</i>',
      add: ['tDH'],
    },
    {
      title: 'Вторая пара треугольников',
      q: { text: 'Одно условие мы ещё не использовали. Найди на чертеже ещё два прямоугольных треугольника, которые могут оказаться равными.', type: 'choice',
        good: 'Отлично: у них равны гипотенузы <i>AD</i> и <i>DE</i>.',
        options: [
          { t: '<i>ABD</i> и <i>BCD</i>', fb: 'Треугольник <i>ABD</i> не прямоугольный.' },
          { t: '<i>BDH</i> и <i>DCE</i>', fb: 'У них разные гипотенузы: <i>BD</i> и <i>DE</i>.' },
          { t: '<i>DHA</i> и <i>DCE</i>', ok: true },
          { t: '<i>ADE</i> и <i>BDC</i>', fb: 'Треугольник <i>ADE</i> равнобедренный, но не прямоугольный.' },
        ] },
      hints: [
        'Не использовано условие <i>AD</i> = <i>DE</i>. В каких треугольниках эти отрезки — стороны?',
        'Ищи треугольник с гипотенузой <i>AD</i> и прямым углом <i>H</i> и треугольник с гипотенузой <i>DE</i> и прямым углом <i>C</i>.',
      ],
      done: 'Сравниваем △<i>DHA</i> и △<i>DCE</i>',
      add: ['fDCE', 'fDHA'],
      remove: ['fBDC', 'fBDH'],
      anim: 'rot',
    },
    {
      title: 'Почему они равны',
      q: { text: 'По какому признаку равны прямоугольные треугольники <i>DHA</i> и <i>DCE</i>?', type: 'choice',
        good: 'Верно: гипотенузы <i>AD</i> = <i>DE</i> по условию, катеты <i>DH</i> = <i>DC</i> мы доказали.',
        options: [
          { t: 'По гипотенузе и острому углу', fb: 'Про острые углы этих треугольников мы ничего не знаем.' },
          { t: 'По гипотенузе и катету', ok: true },
          { t: 'По двум катетам', fb: 'Известна только одна пара равных катетов: <i>DH</i> = <i>DC</i>.' },
        ] },
      hints: ['Посмотри на чёрточки: какие стороны этих треугольников уже отмечены как равные?'],
      done: '△<i>DHA</i> = △<i>DCE</i> по гипотенузе и катету',
      add: [],
    },
    {
      title: 'Ещё один отрезок',
      q: { text: 'Чему равен отрезок <i>AH</i>?', type: 'num', answer: 5, label: '<i>AH</i> =',
        wrong: { '7': '7 — это <i>BE</i>, а он не сторона красных треугольников.', '12': '12 — это <i>BH</i>. А нужен кусочек от <i>H</i> до <i>A</i>.' } },
      hints: [
        'Какой катет треугольника <i>DCE</i> соответствует катету <i>AH</i>?',
        '<i>AH</i> = <i>EC</i>: это вторые катеты равных треугольников.',
      ],
      done: '<i>AH</i> = <i>EC</i> = 5',
      add: ['ah5'],
    },
    {
      title: 'Осторожно, ловушка',
      q: { text: 'Мы знаем: <i>BH</i> = 12, <i>AH</i> = 5. Но точка <i>H</i> могла бы лежать и на продолжении стороны за точку <i>A</i>. Какой вариант верный?', type: 'choice',
        good: 'Да. <i>AB</i> = <i>BD</i>, а гипотенуза <i>BD</i> длиннее катета <i>BC</i> = 12. Значит, <i>AB</i> &gt; 12 и вариант с 7 невозможен.',
        options: [
          { t: '<i>H</i> между <i>A</i> и <i>B</i>, тогда <i>AB</i> = 12 + 5 = 17', ok: true },
          { t: '<i>A</i> между <i>B</i> и <i>H</i>, тогда <i>AB</i> = 12 − 5 = 7', fb: 'Проверь: <i>AB</i> = <i>BD</i>. Может ли гипотенуза <i>BD</i> быть короче катета <i>BC</i> = 12?' },
          { t: 'Подходят оба варианта', fb: 'Один из вариантов противоречит условию. Сравни <i>AB</i> с катетом <i>BC</i>.' },
        ] },
      hints: [
        '<i>AB</i> = <i>BD</i>. А что известно про <i>BD</i> в прямоугольном треугольнике <i>BCD</i>?',
        'Гипотенуза длиннее катета: <i>BD</i> &gt; <i>BC</i> = 12. Значит, и <i>AB</i> &gt; 12 = <i>BH</i>.',
      ],
      done: '<i>AB</i> = <i>BH</i> + <i>HA</i> = 17',
      add: [],
    },
    {
      title: 'Ответ',
      q: { text: 'Остался последний шаг. Чему равна <i>BD</i>?', type: 'num', answer: 17, label: '<i>BD</i> =',
        wrong: { '12': '12 — это катет <i>BC</i>. Гипотенуза длиннее.', '7': 'Вспомни прошлый шаг: <i>AB</i> не может быть 7.' } },
      hints: ['Вспомни самое первое условие задачи про <i>AB</i> и <i>BD</i>.'],
      done: '<i>BD</i> = <i>AB</i> = 17',
      add: ['bd17'],
    },
  ];

  (function initPath() {
    const svg = $('fig-path');
    const flags = new Set([...BASE, 'nums']);
    let idx = 0, hintsUsed = 0;

    const redraw = () => draw(svg, flags);

    function renderProgress() {
      $('progress').innerHTML = STEPS.map((_, i) =>
        `<span class="${i < idx ? 'done' : i === idx ? 'cur' : ''}"></span>`).join('');
    }

    function unlockWrite() {
      $('write-locked').hidden = true;
      $('write').hidden = false;
    }

    function finish() {
      const word = hintsUsed === 0 ? 'без единой подсказки'
        : `с подсказками: ${hintsUsed}`;
      const praise = hintsUsed === 0 ? 'Это уровень олимпиадника.'
        : hintsUsed <= 4 ? 'Отличная работа: почти всё сам.'
        : 'Ты дошёл до конца — теперь попробуй задачу-близнеца ниже уже без подсказок.';
      $('step').innerHTML = `<div class="finale"><h3>Решено: <i>BD</i> = 17</h3><p>Ты прошёл путь ${word}. ${praise}</p><p>Запомни приём: видишь биссектрису и перпендикуляр к одной стороне угла — опусти перпендикуляр и на другую.</p></div>`;
      unlockWrite();
    }

    function renderStep() {
      renderProgress();
      if (idx >= STEPS.length) { finish(); return; }
      const st = STEPS[idx];
      const wrap = document.createElement('div');
      wrap.className = 'step';
      wrap.innerHTML = `<p class="step-n">Шаг ${idx + 1} из ${STEPS.length}</p><h3>${st.title}</h3>`;

      const hints = document.createElement('div');
      hints.className = 'hints';
      const hintBtn = document.createElement('button');
      hintBtn.type = 'button';
      hintBtn.className = 'btn ghost hint-btn';
      let shown = 0;
      const total = st.hints.length;
      // последняя подсказка шага всегда самая сильная
      const level = (i) => (i === total - 1 && total > 1 ? 2 : i);
      const setLabel = () => {
        if (shown >= total) { hintBtn.hidden = true; return; }
        hintBtn.textContent = (shown === 0 ? 'Взять подсказку: ' : 'Ещё подсказка: ') + HINT_NAMES[level(shown)].toLowerCase();
      };
      hintBtn.addEventListener('click', () => {
        const lv = level(shown);
        const h = document.createElement('div');
        h.className = 'hint l' + (lv + 1);
        h.innerHTML = `<b>${HINT_NAMES[lv]}</b>${st.hints[shown]}`;
        hints.insertBefore(h, hintBtn);
        shown++;
        hintsUsed++;
        setLabel();
      });
      setLabel();
      hints.appendChild(hintBtn);

      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'btn';
      next.textContent = idx === STEPS.length - 1 ? 'Готово!' : 'Следующий шаг';
      next.hidden = true;
      next.style.marginTop = '14px';
      next.addEventListener('click', () => {
        const li = document.createElement('li');
        li.innerHTML = st.done;
        $('done-list').appendChild(li);
        idx++;
        renderStep();
      });

      const q = makeQuestion(st.q, () => {
        hintBtn.hidden = true;
        const apply = () => {
          (st.remove || []).forEach((x) => flags.delete(x));
          st.add.forEach((x) => flags.add(x));
          redraw();
          next.hidden = false;
          next.focus({ preventScroll: true });
        };
        if (st.anim === 'fold') {
          flags.add('h'); flags.add('fBDC'); redraw();
          animFold(svg, apply);
        } else if (st.anim === 'rot') {
          flags.delete('fBDC'); flags.delete('fBDH'); flags.add('fDCE'); redraw();
          animRotate(svg, apply);
        } else {
          apply();
        }
      });

      wrap.appendChild(q);
      wrap.appendChild(next);
      wrap.appendChild(hints);
      $('step').innerHTML = '';
      $('step').appendChild(wrap);
    }

    $('give-up').addEventListener('click', unlockWrite);
    redraw();
    renderStep();
  })();

  /* ---------- Задача-близнец ---------- */
  $('twin').appendChild(makeQuestion({
    type: 'num', answer: 14, label: '<i>BD</i> =',
    good: 'Верно: <i>BC</i> = 10, <i>AH</i> = 4, <i>BD</i> = <i>AB</i> = 14. Приём усвоен!',
    wrong: { '10': '10 — это <i>BC</i>. Не забудь прибавить <i>AH</i>.', '6': 'Гипотенуза <i>BD</i> не может быть короче катета <i>BC</i> = 10.' },
  }));
})();
