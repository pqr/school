/* Фабрика остатков: логика девяти цехов */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const digitSum = n => String(n).split('').reduce((a, c) => a + +c, 0);
  const isPrime = n => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  };
  const smallestDivisor = n => {
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return d;
    return n;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ================= пропуск и штампы ================= */
  const KEY = 'remainders-factory-done';
  let done = new Set();
  try { done = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { done = new Set(); }
  const passStamps = $('#pass-stamps');
  for (let i = 1; i <= 9; i++) {
    const a = el('a', 'pass-slot', String(i));
    a.href = '#w' + i;
    a.dataset.w = i;
    passStamps.append(a);
  }
  function renderDone() {
    $$('.pass-slot').forEach(s => s.classList.toggle('is-done', done.has(+s.dataset.w)));
    $$('.workshop').forEach(w => {
      const n = +w.dataset.w;
      const is = done.has(n);
      $('.w-done', w).hidden = !is;
      const b = $('.done-btn', w);
      b.classList.toggle('is-done', is);
      b.textContent = is ? 'Штамп поставлен' : 'Поставить штамп';
    });
    $$('.toc a').forEach(a => {
      const m = a.getAttribute('href').match(/^#w(\d)$/);
      if (m) a.classList.toggle('is-done', done.has(+m[1]));
    });
    $('#pass-note').textContent = `Штампов: ${done.size} из 9`;
    $('#final').hidden = done.size < 9;
  }
  function markDone(n) {
    if (done.has(n)) return;
    done.add(n);
    try { localStorage.setItem(KEY, JSON.stringify([...done])); } catch (e) { /* ничего */ }
    renderDone();
  }
  $$('.done-btn').forEach(b => b.addEventListener('click', () => markDone(+b.dataset.done)));
  renderDone();

  /* ================= делительная машина ================= */
  const mN = $('#m-n'), mCustom = $('#m-custom'), mCrates = $('#m-crates'), mCoins = $('#m-coins');
  const mTray = $('#m-tray'), mStamp = $('#m-stamp'), mReadout = $('#m-readout'), mNote = $('#m-note');
  let mDiv = 5, mStampTimer = null;
  $('#m-chips').addEventListener('click', e => {
    const c = e.target.closest('.chip[data-m]');
    if (!c) return;
    mDiv = +c.dataset.m;
    mCustom.value = '';
    $$('#m-chips .chip').forEach(x => x.classList.toggle('is-on', x === c));
    runMachine();
  });
  mCustom.addEventListener('input', () => {
    const raw = mCustom.value.trim();
    if (raw === '') { mCustom.classList.remove('is-on'); return; }
    const v = Number(raw);
    if (Number.isInteger(v) && v >= 2 && v <= 99) {
      mDiv = v;
      $$('#m-chips .chip').forEach(x => x.classList.remove('is-on'));
      mCustom.classList.add('is-on');
      runMachine();
    } else {
      if (mStampTimer) { clearTimeout(mStampTimer); mStampTimer = null; }
      mCustom.classList.remove('is-on');
      mCrates.innerHTML = '';
      mCoins.innerHTML = '';
      mStamp.innerHTML = '';
      mTray.classList.remove('empty-ok');
      mReadout.innerHTML = '<b>?</b>';
      mNote.innerHTML = 'Введи <b>целый</b> делитель от 2 до 99: ящик не бывает дробным.';
    }
  });
  $('#m-run').addEventListener('click', runMachine);
  mN.addEventListener('change', runMachine);
  mN.addEventListener('keydown', e => { if (e.key === 'Enter') runMachine(); });

  function runMachine() {
    const n = clamp(Math.floor(+mN.value || 0), 0, 99999);
    mN.value = n;
    const m = mDiv, q = Math.floor(n / m), r = n % m;
    mCrates.innerHTML = '';
    mCoins.innerHTML = '';
    mStamp.innerHTML = '';
    mTray.classList.remove('empty-ok');
    const shown = Math.min(q, 36);
    const step = Math.min(90, 1400 / Math.max(shown, 1));
    for (let i = 0; i < shown; i++) {
      const c = el('div', 'crate', String(m));
      c.style.animationDelay = (i * step) + 'ms';
      mCrates.append(c);
    }
    if (q > shown) {
      const more = el('div', 'crate crate-more', `+ ещё ${q - shown}`);
      more.style.animationDelay = (shown * step) + 'ms';
      mCrates.append(more);
    }
    const t0 = shown * step + 150;
    for (let i = 0; i < r; i++) {
      const c = el('span', 'coin' + (r > 20 ? ' mini' : ''));
      c.style.animationDelay = (t0 + i * 40) + 'ms';
      mCoins.append(c);
    }
    const tStamp = t0 + r * 40 + 200;
    if (mStampTimer) clearTimeout(mStampTimer);
    mStampTimer = setTimeout(() => {
      mStampTimer = null;
      const s = el('span', 'stamp ' + (r === 0 ? 'ok' : 'rest'), r === 0 ? 'Делится' : `Остаток ${r}`);
      mStamp.append(s);
      if (r === 0) mTray.classList.add('empty-ok');
    }, tStamp);
    mReadout.innerHTML = `<b>${n}</b> = <b>${m}</b> · <b>${q}</b> + <b class="${r === 0 ? 'r0' : 'rr'}">${r}</b>`;
    const boxes = q === 1 ? 'один ящик полный' : `${q} ${plural(q, 'ящик полный', 'ящика полные', 'ящиков полные')}`;
    mNote.innerHTML = r === 0
      ? `Складываем число в ящики по ${m}. ${cap(boxes)}, лоток пустой: ${n} <b>делится</b> на ${m}.`
      : `Складываем число в ящики по ${m}. ${cap(boxes)}, а ${r} ${plural(r, 'монетка не влезла', 'монетки не влезли', 'монеток не влезли')} — это <b>остаток</b>. Остаток всегда меньше ящика.`;
  }
  function plural(n, one, few, many) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  runMachine();

  /* ================= правило 3: ящики не считаются ================= */
  const r3 = ['#r3-a', '#r3-b', '#r3-m'].map(s => $(s));
  function rule3() {
    const a = clamp(Math.floor(+r3[0].value || 0), 0, 999), b = clamp(Math.floor(+r3[1].value || 0), 0, 999);
    const m = clamp(Math.floor(+r3[2].value || 2), 2, 99);
    const ra = a % m, rb = b % m;
    const tag = (v, m) => `<span class="tag ${v % m === 0 ? 'ok' : 'rest'}">остаток ${v % m}</span>`;
    const row = (label, v, extra) => `<div class="row"><span>${label} = <b>${v}</b></span>${tag(v, m)}<span>${extra}</span></div>`;
    $('#r3-out').innerHTML =
      row('a', a, `${a} = ${m} · ${Math.floor(a / m)} + ${ra}`) +
      row('b', b, `${b} = ${m} · ${Math.floor(b / m)} + ${rb}`) +
      row('a + b', a + b, `хвостики: ${ra} + ${rb} = ${ra + rb} → остаток ${(ra + rb) % m}`) +
      row('a · b', a * b, `хвостики: ${ra} · ${rb} = ${ra * rb} → остаток ${(ra * rb) % m}`);
  }
  r3.forEach(i => i.addEventListener('input', rule3));
  rule3();

  /* ================= цех 1 ================= */
  const W1_COL = ['#15a862', '#2d6cdf', '#ff6a13'];
  function wheelSvg(svg) {
    const cx = 50, cy = 50, R = 44;
    let html = '';
    for (let i = 0; i < 3; i++) {
      const a0 = (-90 - 60 + 120 * i) * Math.PI / 180, a1 = (-90 + 60 + 120 * i) * Math.PI / 180;
      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      html += `<path d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="${W1_COL[i]}" opacity="0.85" stroke="#1b2430" stroke-width="2"/>`;
      const am = (-90 + 120 * i) * Math.PI / 180;
      html += `<text x="${(cx + 30 * Math.cos(am)).toFixed(1)}" y="${(cy + 30 * Math.sin(am) + 5).toFixed(1)}" text-anchor="middle" font-family="Russo One, sans-serif" font-size="14" fill="#fff">${i}</text>`;
    }
    html += `<g class="pointer" style="transform-origin:50px 50px;transition:transform .5s cubic-bezier(.3,1.4,.5,1)"><line x1="50" y1="50" x2="50" y2="12" stroke="#1b2430" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="#1b2430"/></g>`;
    svg.innerHTML = html;
    return $('.pointer', svg);
  }
  const w1p = ['#w1-wa', '#w1-wb', '#w1-wc'].map(s => wheelSvg($(s)));
  const w1caps = ['#w1-ca', '#w1-cb', '#w1-cc'].map(s => $(s));
  const w1n = $('#w1-n');
  function w1update() {
    const n = +w1n.value;
    $('#w1-nv').textContent = n;
    const vals = [n, n * n, n * n + 1];
    vals.forEach((v, i) => {
      const r = v % 3;
      w1p[i].style.transform = `rotate(${120 * r}deg)`;
      w1caps[i].innerHTML = `${v} = 3 · ${Math.floor(v / 3)} + <b class="${r === 0 ? 'r0' : 'rr'}">${r}</b>`;
    });
    $$('#w1-cases tr').forEach((tr, i) => tr.classList.toggle('hit', i === n % 3 + 1));
  }
  w1n.addEventListener('input', w1update);
  w1update();

  const w1area = $('#w1-area');
  const w1tried = new Set();
  function w1drawArea(r) {
    const U = 30, Q = 6 * U, side = Q + r * U, off = 10;
    const grey = 'var(--line)', or = 'var(--orange)';
    let h = '';
    const rect = (x, y, w, hh, f, label, size = 15, color = 'var(--ink)') => {
      if (w <= 0 || hh <= 0) return '';
      return `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${f}" stroke="#1b2430" stroke-width="2"/>` +
        (label ? `<text x="${x + w / 2}" y="${y + hh / 2 + size / 3}" text-anchor="middle" font-family="Rubik, sans-serif" font-weight="700" font-size="${size}" fill="${color}">${label}</text>` : '');
    };
    h += rect(off, off, Q, Q, grey, '3q · 3q', 16);
    h += rect(off + Q, off, r * U, Q, grey, r ? '3q·r' : '', 12);
    h += rect(off, off + Q, Q, r * U, grey, r ? '3q·r' : '', 12);
    h += rect(off + Q, off + Q, r * U, r * U, or, r ? 'r²' : '', 14, '#fff');
    h += `<text x="130" y="${off + side + 20}" text-anchor="middle" font-size="13" fill="var(--muted)" font-family="Rubik, sans-serif">сторона 3q + r (здесь q = 2, r = ${r})</text>`;
    w1area.innerHTML = h;
    const sq = r * r, rr = sq % 3;
    $('#w1-area-text').innerHTML = r === 0
      ? 'Когда r = 0, число n само делится на 3, и квадрат целиком состоит из серых частей, делящихся на 3. Хвостик квадрата 0, а n² + 1 даёт остаток <b>1</b>.'
      : `Серые части имеют стороны, кратные 3, поэтому делятся на 3 и на остаток не влияют. Остаётся оранжевый уголок <b>r² = ${sq}</b>${sq >= 3 ? `, его остаток <b>${rr}</b>` : ''}. Значит, n² даёт остаток ${rr}, а n² + 1 — остаток <b>${(rr + 1) % 3}</b>. Не ноль!`;
  }
  $('#w1-rbtns').addEventListener('click', e => {
    const b = e.target.closest('button[data-r]');
    if (!b) return;
    $$('#w1-rbtns button').forEach(x => x.classList.toggle('is-on', x === b));
    w1drawArea(+b.dataset.r);
    w1tried.add(b.dataset.r);
    if (w1tried.size === 3) markDone(1);
  });
  w1drawArea(0);

  /* ================= цех 2 ================= */
  const w2pad = $('#w2-pad');
  for (let d = 0; d <= 9; d++) {
    const b = el('button', 'digit', String(d));
    b.type = 'button';
    b.dataset.d = d;
    if (d === 0) { b.disabled = true; b.title = 'Число не может начинаться с нуля'; }
    w2pad.append(b);
  }
  w2pad.addEventListener('click', e => {
    const b = e.target.closest('.digit:not(:disabled)');
    if (!b) return;
    $$('.digit', w2pad).forEach(x => x.classList.toggle('is-on', x === b));
    w2show(+b.dataset.d);
  });
  function w2show(a) {
    $('#w2-num').innerHTML = `<span class="d-a">${a}</span>2023<span class="d-a">${a}</span>`;
    const even = a % 2 === 0, s = 7 + 2 * a, d3 = s % 3 === 0, d9 = s % 9 === 0;
    const g = (id, ok, body) => { const x = $(id); x.className = 'gauge ' + (ok ? 'ok' : 'bad'); $('.g-body', x).innerHTML = body; };
    g('#w2-g2', even, `последняя цифра ${a} — ${even ? 'чётная ✓' : 'нечётная ✗'}`);
    const gs = $('#w2-gs'); gs.className = 'gauge'; $('.g-body', gs).innerHTML = `2 + 0 + 2 + 3 + ${a} + ${a} = <b>${s}</b>`;
    g('#w2-g3', d3, `${s} ${d3 ? 'делится на 3 ✓' : 'на 3 не делится ✗'}`);
    g('#w2-g9', d9, `${s} ${d9 ? 'делится на 9 ✓' : 'на 9 не делится ✗'}`);
    const v6 = even && d3, v18 = even && d9;
    const v = (id, ok, text) => { const x = $(id); x.className = 'verdict ' + (ok ? 'ok' : 'bad'); $('b', x).textContent = text; };
    v('#w2-v6', v6, v6 ? `да! ${a}2023${a} делится на 6` : 'нет');
    v('#w2-v18', v18, v18 ? 'да' : 'нет');
  }
  $('#w2-all').addEventListener('click', () => {
    const t = $('#w2-table');
    let h = '<tr><th>цифра</th><th>число</th><th>чётное</th><th>сумма цифр</th><th>на 3</th><th>на 9</th><th>на 6</th><th>на 18</th></tr>';
    for (let a = 1; a <= 9; a++) {
      const s = 7 + 2 * a, e = a % 2 === 0, d3 = s % 3 === 0, d9 = s % 9 === 0;
      const yn = ok => `<td class="${ok ? 'good' : 'bad'}">${ok ? 'да' : 'нет'}</td>`;
      h += `<tr class="${e && d3 ? 'hit' : ''}"><td>${a}</td><td>${a}2023${a}</td>${yn(e)}<td>${s}</td>${yn(d3)}${yn(d9)}${yn(e && d3)}${yn(e && d9)}</tr>`;
    }
    t.innerHTML = h;
    t.hidden = false;
    markDone(2);
  });

  /* ================= цех 3 ================= */
  const w3rows = $('#w3-rows');
  const W3_STEPS = [
    ['2008', '2', '1004'], ['1004', '2', '502'], ['502', '2', '251']
  ];
  $('#w3-split').addEventListener('click', function () {
    this.disabled = true;
    w3rows.innerHTML = '';
    W3_STEPS.forEach((s, i) => {
      setTimeout(() => {
        const row = el('div', 'tree-row');
        row.innerHTML = `<span class="node big">${s[0]}</span> = <span class="node prime">${s[1]}</span> · <span class="node">${s[2]}</span>`;
        w3rows.append(row);
      }, i * 600);
    });
    setTimeout(() => {
      const checks = [2, 3, 5, 7, 11, 13].map(d => `251 : ${d} → остаток ${251 % d}`).join('; ');
      const row = el('div', 'tree-row');
      row.innerHTML = `<span class="node prime">251</span><span class="note">— простое. Проверка: ${checks}. Дальше проверять не надо: 17 · 17 = 289 &gt; 251.</span>`;
      w3rows.append(row);
      const fin = el('div', 'tree-row');
      fin.innerHTML = `<span class="node big">2008</span> = <span class="node prime">2</span> · <span class="node prime">2</span> · <span class="node prime">2</span> · <span class="node prime">251</span>`;
      w3rows.append(fin);
      const p = $('#w3-prime');
      p.hidden = false;
      p.innerHTML = 'Все делители 2008: 1, 2, 4, 8, 251, 502, 1004, 2008. Всего восемь.';
    }, 3 * 600);
  });
  const w3cards = $('#w3-cards');
  const w3checked = new Set();
  [[1, 2008], [2, 1004], [4, 502], [8, 251]].forEach(([s, n]) => {
    const c = el('button', 'card');
    c.type = 'button';
    c.innerHTML = `<p class="c-top">сумма цифр ${s} → N = ${n}</p><p class="c-body">Проверить: а правда ли у ${n} сумма цифр ${s}?</p>`;
    c.addEventListener('click', () => {
      const real = digitSum(n), ok = real === s;
      c.classList.add(ok ? 'ok' : 'bad');
      $('.c-body', c).innerHTML = `${String(n).split('').join(' + ')} = <b>${real}</b>. ${ok ? `Совпало! ${n} · ${s} = ${n * s}. Это число Лены.` : `Нужно ${s}, не подходит.`}`;
      w3checked.add(s);
      if (w3checked.size === 4) { $('#w3-hint').textContent = 'Все четыре кандидата проверены: подошло только 251.'; markDone(3); }
    });
    w3cards.append(c);
  });
  const w3try = $('#w3-try');
  function w3tryUpdate() {
    const n = clamp(Math.floor(+w3try.value || 0), 1, 99999);
    const s = digitSum(n), p = n * s;
    $('#w3-try-out').innerHTML = `${n} · (${String(n).split('').join(' + ')}) = ${n} · ${s} = <b>${p}</b> ${p === 2008 ? '<span class="tag ok">это 2008!</span>' : p > 2008 ? '<span class="tag rest">больше 2008</span>' : '<span class="tag rest">меньше 2008</span>'}`;
  }
  w3try.addEventListener('input', w3tryUpdate);
  w3tryUpdate();

  /* ================= цех 4 ================= */
  const w4k = $('#w4-k'), w4cargo = $('#w4-cargo');
  function w4update() {
    const k = +w4k.value;
    $('#w4-kv').textContent = k;
    w4cargo.innerHTML = '';
    for (let i = 0; i < k; i++) {
      const b = el('div', 'box225', '<span>75</span><span>75</span><span>75</span><p class="blab">225</p>');
      w4cargo.append(b);
    }
    w4cargo.append(el('div', 'box225 box150', '<span>75</span><span>75</span><p class="blab">150</p>'));
    w4read();
  }
  function w4read() {
    const k = +w4k.value, n = 225 * k + 150;
    const packed = w4cargo.classList.contains('packed75');
    $('#w4-read').innerHTML = packed
      ? `N = 75 · ${3 * k} + 75 · 2 = 75 · <b>${3 * k + 2}</b> = ${n}. Остаток от деления на 75: <b class="r0">0</b>`
      : `N = 225 · <b>${k}</b> + <b>150</b> = ${n}`;
  }
  w4k.addEventListener('input', w4update);
  $('#w4-repack').addEventListener('click', () => { w4cargo.classList.add('packed75'); w4read(); markDone(4); });
  $('#w4-back').addEventListener('click', () => { w4cargo.classList.remove('packed75'); w4read(); });
  w4update();

  /* ================= цех 5 ================= */
  let w5a = 0, w5b = 0;
  const w5found = new Set();
  const w5heat = $('#w5-heat');
  for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) {
    const c = el('button', 'cell', `${a}${b}`);
    c.type = 'button';
    c.dataset.a = a; c.dataset.b = b;
    c.title = `72${a}4${b}`;
    if (b === 0 || b === 5) c.dataset.f5 = '1';
    if ((13 + a + b) % 9 === 0) c.dataset.f9 = '1';
    c.addEventListener('click', () => { w5a = a; w5b = b; w5update(); });
    w5heat.append(c);
  }
  $$('.arrow[data-s]').forEach(b => b.addEventListener('click', () => {
    const d = +b.dataset.d;
    if (b.dataset.s === 'a') w5a = (w5a + d + 10) % 10; else w5b = (w5b + d + 10) % 10;
    w5update();
  }));
  function w5update() {
    $('#w5-a').textContent = w5a; $('#w5-b').textContent = w5b;
    const n = 72000 + w5a * 100 + 40 + w5b, s = 13 + w5a + w5b;
    const d5 = w5b === 0 || w5b === 5, d9 = s % 9 === 0;
    const g = (id, ok, body) => { const x = $(id); x.className = 'gauge ' + (ok ? 'ok' : 'bad'); $('.g-body', x).innerHTML = body; };
    g('#w5-g5', d5, `последняя цифра ${w5b} ${d5 ? '— это 0 или 5 ✓' : '— не 0 и не 5 ✗'}`);
    g('#w5-g9', d9, `7 + 2 + ${w5a} + 4 + ${w5b} = <b>${s}</b> ${d9 ? '— делится на 9 ✓' : '— на 9 не делится ✗'}`);
    g('#w5-g45', d5 && d9, d5 && d9 ? `${n} делится на 45! В коллекцию.` : `${n} на 45 не делится`);
    $$('.cell', w5heat).forEach(c => c.classList.toggle('is-on', +c.dataset.a === w5a && +c.dataset.b === w5b));
    if (d5 && d9 && !w5found.has(n)) {
      w5found.add(n);
      const slot = $$('#w5-found .slot').find(s => !s.classList.contains('filled'));
      if (slot) { slot.textContent = n; slot.classList.add('filled'); }
      if (w5found.size === 3) markDone(5);
    }
  }
  $('#w5-t5').addEventListener('click', function () {
    this.classList.toggle('is-on');
    const on = this.classList.contains('is-on');
    $$('.cell[data-f5]', w5heat).forEach(c => c.classList.toggle('f5', on));
  });
  $('#w5-t9').addEventListener('click', function () {
    this.classList.toggle('is-on');
    const on = this.classList.contains('is-on');
    $$('.cell[data-f9]', w5heat).forEach(c => c.classList.toggle('f9', on));
  });
  w5update();

  /* ================= цех 6 ================= */
  const w6a = $('#w6-a'), w6b = $('#w6-b');
  const fives = (full, loose, cls) => {
    let h = '';
    for (let i = 0; i < full; i++) h += '<div class="five">' + '<i></i>'.repeat(5) + '</div>';
    if (loose) h += `<div class="five loose ${cls || ''}">` + '<i></i>'.repeat(loose) + '</div>';
    return h;
  };
  function w6update() {
    const a = +w6a.value, b = +w6b.value;
    $('#w6-av').textContent = a; $('#w6-bv').textContent = b;
    const x = 10 * a + 8, y = 35 * b + 17;
    $('#w6-xt').innerHTML = `x = 10 · ${a} + 8 = <b>${x}</b> → пятёрок: ${2 * a + 1}, хвостик <span class="tag rest">3</span>`;
    $('#w6-yt').innerHTML = `y = 35 · ${b} + 17 = <b>${y}</b> → пятёрок: ${7 * b + 3}, хвостик <span class="tag rest">2</span>`;
    $('#w6-x').innerHTML = fives(2 * a + 1, 3);
    $('#w6-y').innerHTML = fives(7 * b + 3, 2);
    $('#w6-mergeout').innerHTML = '';
  }
  w6a.addEventListener('input', w6update);
  w6b.addEventListener('input', w6update);
  $('#w6-merge').addEventListener('click', () => {
    const a = +w6a.value, b = +w6b.value, x = 10 * a + 8, y = 35 * b + 17;
    $('#w6-mergeout').innerHTML =
      `<p>Хвостики <span class="tag rest">3</span> + <span class="tag rest">2</span> = <span class="tag ok">5</span> — ещё одна полная пятёрка:</p>` +
      `<div class="dots"><div class="five merged">${'<i></i>'.repeat(5)}</div></div>` +
      `<p>x + y = ${x} + ${y} = <b>${x + y}</b> = 5 · ${(x + y) / 5}. Остаток <span class="tag ok">0</span>, и так при любых a и b.</p>`;
    markDone(6);
  });
  w6update();

  /* ================= цех 7 ================= */
  const w7pairs = $('#w7-pairs');
  const pairs = [];
  for (let a = 1; a * a <= 2280; a++) if (2280 % a === 0) pairs.push([a, 2280 / a]);
  pairs.forEach(([a, b]) => {
    const p = el('div', 'pair', `<p class="p-num">${a} и ${b}</p><p class="p-sum">сумма ${a + b}</p>`);
    p.dataset.sum = a + b;
    w7pairs.append(p);
  });
  const w7odd = $('#w7-odd'), w7two = $('#w7-two');
  function w7update() {
    const odd = w7odd.classList.contains('is-on'), two = w7two.classList.contains('is-on');
    let left = 0;
    $$('.pair', w7pairs).forEach(p => {
      const s = +p.dataset.sum;
      const out = (odd && s % 2 === 0) || (two && (s < 10 || s > 99));
      p.classList.toggle('out', out);
      p.classList.remove('win');
      if (!out) left++;
    });
    if (left === 1) $$('.pair:not(.out)', w7pairs).forEach(p => p.classList.add('win'));
    const hint = $('#w7-hint');
    if (!odd && !two) hint.textContent = 'Нажимай на подсказки Симы и смотри, какие пары вылетают с конвейера.';
    else if (odd && !two) hint.innerHTML = `Сумма нечётная, значит одно число чётное, другое нечётное. Все три двойки из 2 · 2 · 2 ушли к одному числу — оно делится на 8. Осталось ${left} пар, Пров всё ещё не знает ответ.`;
    else if (!odd && two) hint.innerHTML = `Двузначных сумм ${left}: 98 и 97. Одной подсказки мало — Пров не может выбрать.`;
    else { hint.innerHTML = 'Нечётная и двузначная сумма только одна — 97. Числа <b>40 и 57</b>. Прову нужны были обе подсказки.'; markDone(7); }
  }
  [w7odd, w7two].forEach(b => b.addEventListener('click', () => { b.classList.toggle('is-on'); w7update(); }));

  /* ================= цех 8 ================= */
  const W8_M = [2, 3, 4, 5, 6];
  let w8n = 1, w8timer = null;
  const w8g = $('#w8-g');
  W8_M.forEach(m => w8g.append(el('div', 'sg', `<p class="sg-m">на ${m}</p><p class="sg-r">0</p>`)));
  const w8gs = $$('.sg', w8g);
  function w8show() {
    $('#w8-n').textContent = w8n;
    const rs = W8_M.map(m => w8n % m);
    const counts = {};
    rs.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const allDistinct = rs.every(r => counts[r] === 1);
    rs.forEach((r, i) => {
      $('.sg-r', w8gs[i]).textContent = r;
      w8gs[i].className = 'sg ' + (counts[r] > 1 ? 'dup' : allDistinct ? 'uniq' : '');
    });
    const msg = $('#w8-msg');
    if (allDistinct) {
      msg.className = 'scan-msg win';
      msg.textContent = w8n === 35 ? 'Все пять остатков разные! N = 35 — первое такое число.' : `Тоже подходит: ${w8n}. Но 35 было раньше.`;
      if (w8n === 35) markDone(8);
    } else {
      const dup = Object.keys(counts).filter(r => counts[r] > 1).join(', ');
      msg.className = 'scan-msg';
      msg.textContent = `Совпадает остаток ${dup} — не подходит.`;
    }
    return allDistinct;
  }
  function w8stop() { if (w8timer) { clearInterval(w8timer); w8timer = null; } $('#w8-play').textContent = 'Запустить сканер'; }
  $('#w8-play').addEventListener('click', function () {
    if (w8timer) { w8stop(); return; }
    this.textContent = 'Стоп';
    if (w8show()) w8n++;
    w8timer = setInterval(() => {
      if (w8show()) { w8stop(); return; }
      w8n++;
      if (w8n > 999) w8stop();
    }, 170);
  });
  $('#w8-inc').addEventListener('click', () => { w8stop(); w8n++; w8show(); });
  $('#w8-dec').addEventListener('click', () => { w8stop(); w8n = Math.max(1, w8n - 1); w8show(); });
  $('#w8-reset').addEventListener('click', () => { w8stop(); w8n = 1; w8show(); });
  w8show();

  /* ================= цех 9 ================= */
  const w9sieve = $('#w9-sieve');
  for (let i = 0; i < 30; i++) {
    const c = el('div', 'sc', String(i));
    c.dataset.v = i;
    w9sieve.append(c);
  }
  const w9t = {2: $('#w9-s2'), 3: $('#w9-s3'), 5: $('#w9-s5')};
  let w9checkedPrime = false;
  function w9sieveUpdate() {
    const on = Object.keys(w9t).filter(k => w9t[k].classList.contains('is-on')).map(Number);
    const all = on.length === 3;
    $$('.sc', w9sieve).forEach(c => {
      const v = +c.dataset.v;
      const crossed = on.some(d => v % d === 0);
      c.classList.toggle('x', crossed);
      c.classList.toggle('left', all && !crossed);
    });
    const hint = $('#w9-hint');
    if (all) {
      hint.innerHTML = 'Остались <b>1, 7, 11, 13, 17, 19, 23, 29</b>: единица и семь простых. Составному тут взяться неоткуда: самое маленькое составное без делителей 2, 3, 5 — это 7 · 7 = 49, а оно больше 29.';
      if (w9checkedPrime) markDone(9);
    } else if (on.length === 0) {
      hint.innerHTML = W9_HINT0;
    } else {
      const left = $$('.sc', w9sieve).filter(c => !c.classList.contains('x')).map(c => c.dataset.v);
      hint.innerHTML = `Вычеркнуты кратные ${on.join(' и ')}. Пока не вычеркнуты ${left.length} чисел: ${left.join(', ')}. Включи все три кнопки, чтобы увидеть, что останется.`;
    }
  }
  const W9_HINT0 = $('#w9-hint').innerHTML;
  Object.values(w9t).forEach(b => b.addEventListener('click', () => { b.classList.toggle('is-on'); w9sieveUpdate(); }));
  const w9p = $('#w9-p');
  function w9check() {
    const p = clamp(Math.floor(+w9p.value || 0), 0, 99999);
    $$('.sc', w9sieve).forEach(c => c.classList.remove('hit'));
    const out = $('#w9-out');
    if (!isPrime(p)) {
      const d = p < 2 ? null : smallestDivisor(p);
      out.innerHTML = p < 2 ? `<b class="no">${p}</b> — не простое число, машина не принимает.` : `<b class="no">${p}</b> — не простое: делится на ${d}. Машина принимает только простые.`;
      return;
    }
    const q = Math.floor(p / 30), r = p % 30;
    const cell = $(`.sc[data-v="${r}"]`, w9sieve);
    if (cell) cell.classList.add('hit');
    const what = r === 1 ? 'единица' : isPrime(r) ? 'простое' : 'составное?!';
    out.innerHTML = `${p} = 30 · ${q} + <b>${r}</b>. Остаток ${r} — <b class="ok">${what}</b>${p < 30 ? ' (число меньше 30, так что остаток — оно само)' : ''}.`;
    w9checkedPrime = true;
    if (Object.values(w9t).every(b => b.classList.contains('is-on'))) markDone(9);
  }
  w9p.addEventListener('input', w9check);
  const w9chips = $('#w9-chips');
  [2, 3, 5, 7, 11, 13, 31, 37, 53, 61, 97, 101, 199, 2027].filter(isPrime).forEach(p => {
    const c = el('button', 'chip', String(p));
    c.type = 'button';
    c.addEventListener('click', () => { w9p.value = p; w9check(); });
    w9chips.append(c);
  });
  w9check();
})();
