'use strict';

/* =====================================================================
   Помощники
   ===================================================================== */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const restartAnim = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

/* ---------- озвучка ---------- */
const CAN_SPEAK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
if (!CAN_SPEAK) document.body.classList.add('no-speech');
function speak(text) {
  if (!CAN_SPEAK) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  const v = voices.find((x) => /en[-_]GB/i.test(x.lang)) || voices.find((x) => /^en/i.test(x.lang));
  if (v) u.voice = v;
  u.lang = v ? v.lang : 'en-GB';
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
if (CAN_SPEAK) speechSynthesis.getVoices();

/* ---------- конфетти ---------- */
function confetti(n = 70) {
  if (REDUCED) return;
  const box = $('#confetti');
  const colors = ['#e5322d', '#ffc928', '#13a058', '#1f5fd6', '#8e3bd1', '#fff'];
  for (let k = 0; k < n; k++) {
    const i = document.createElement('i');
    i.style.left = Math.random() * 100 + 'vw';
    i.style.background = pick(colors);
    box.appendChild(i);
    const dx = (Math.random() - 0.5) * 200;
    const a = i.animate([
      { transform: 'translate(0,0) rotate(0)' },
      { transform: `translate(${dx}px, ${window.innerHeight + 60}px) rotate(${Math.random() * 900}deg)` },
    ], { duration: 1600 + Math.random() * 1600, delay: Math.random() * 400, easing: 'cubic-bezier(.2,.6,.4,1)' });
    a.onfinish = () => i.remove();
  }
}

/* =====================================================================
   Порядковые числительные: движок
   ===================================================================== */
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function under100(n) {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)], o = n % 10;
  return o ? `${t}-${ONES[o]}` : t;
}
function cardinal(n) {
  const th = Math.floor(n / 1000), h = Math.floor((n % 1000) / 100), r = n % 100;
  const parts = [];
  if (th) parts.push(`${under100(th)} thousand`);
  if (h) parts.push(`${ONES[h]} hundred`);
  if (r) { if (th || h) parts.push('and'); parts.push(under100(r)); }
  return parts.join(' ');
}
const IRREG = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
function ordLast(w) {
  if (IRREG[w]) return IRREG[w];
  if (w.endsWith('y')) return w.slice(0, -1) + 'ieth';
  return w + 'th';
}
function splitLast(n) {
  const c = cardinal(n);
  const m = c.match(/^(.*[^a-z])?([a-z]+)$/);
  return { head: m[1] || '', last: m[2] };
}
function ordinalWord(n) { const { head, last } = splitLast(n); return head + ordLast(last); }
function suffix(n) {
  const r = n % 100;
  if (r >= 11 && r <= 13) return 'th';
  return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
}
function wordRule(last) {
  const rules = {
    one: 'one → first: бунтарь, своё слово.',
    two: 'two → second: бунтарь, своё слово.',
    three: 'three → third: бунтарь, своё слово.',
    five: 'five → fifth: VE → F.',
    twelve: 'twelve → twelfth: VE → F.',
    nine: 'nine → ninth: e выпадает (девятка на диете).',
    eight: 'eight → eighth: t уже есть, добавляем только h.',
  };
  if (rules[last]) return rules[last];
  if (last.endsWith('y')) return `${last} → ${ordLast(last)}: Y → IE, потом th.`;
  return `${last} → ${last}th: просто хвостик th.`;
}

/* ---------- рецепт с появлением ---------- */
(function recipe() {
  const box = $('#recipe');
  $$('.rec-row', box).forEach((row, r) => $$('span', row).forEach((s, k) => { s.style.transitionDelay = `${r * 0.35 + k * 0.12}s`; }));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { box.classList.add('go'); io.disconnect(); } }), { threshold: 0.4 });
  io.observe(box);
})();

/* ---------- три бунтаря ---------- */
$('#rebels-play').addEventListener('click', () => restartAnim($('#rebels'), 'trick'));

/* ---------- генератор ---------- */
(function generator() {
  const inp = $('#gen-n');
  function show() {
    let n = Math.round(Number(inp.value));
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > 9999) n = 9999;
    const s = String(n), suf = suffix(n), r = n % 100;
    const trap = r >= 11 && r <= 13;
    const tailLen = trap ? 2 : 1;
    $('#gen-big').innerHTML = `${s.slice(0, -tailLen)}<span class="last">${s.slice(-tailLen)}</span><span class="suf">${suf}</span>`;
    const { head, last } = splitLast(n);
    $('#gen-word').innerHTML = `${head}<mark>${ordLast(last)}</mark>`;
    let why;
    if (trap) why = `Конец на ${r} — «тинейджер» (${ONES[r]}), поэтому <b>th</b>. Ловушка!`;
    else if ([1, 2, 3].includes(n % 10)) why = `Последняя цифра ${n % 10} → <b>${suf}</b>, как в ${ordLast(ONES[n % 10]).replace(/(..)$/, '<b>$1</b>')}.`;
    else why = `Последняя цифра ${n % 10} → <b>th</b>.`;
    $('#gen-why').innerHTML = `${why} В словах меняется только последнее: ${wordRule(last)}`;
  }
  inp.addEventListener('input', show);
  $$('.gen .chip').forEach((b) => b.addEventListener('click', () => { inp.value = b.dataset.n; show(); }));
  $('#gen-say').addEventListener('click', () => speak(`the ${ordinalWord(Math.min(9999, Math.max(1, Number(inp.value) || 1)))}`));
  show();
})();

/* ---------- хирургия слов ---------- */
(function surgery() {
  const P = [
    { w: 'five', keep: 'fi', cut: 've', add: 'f', th: 'th', rule: 'VE → F, потом th: fifth' },
    { w: 'twelve', keep: 'twel', cut: 've', add: 'f', th: 'th', rule: 'VE → F, потом th: twelfth' },
    { w: 'nine', keep: 'nin', cut: 'e', add: '', th: 'th', rule: 'Девятка на диете: e выпадает → ninth' },
    { w: 'twenty', keep: 'twent', cut: 'y', add: 'ie', th: 'th', rule: 'Y → IE, потом th: twentieth' },
    { w: 'thirty', keep: 'thirt', cut: 'y', add: 'ie', th: 'th', rule: 'Y → IE, потом th: thirtieth' },
    { w: 'forty', keep: 'fort', cut: 'y', add: 'ie', th: 'th', rule: 'Y → IE: fortieth (и без u — как в forty!)' },
    { w: 'eight', keep: 'eight', cut: '', add: '', th: 'h', rule: 'Бонус-ловушка: t уже есть, добавь только h → eighth' },
    { w: 'seven', keep: 'seven', cut: '', add: '', th: 'th', rule: 'Здоровый пациент: просто + th → seventh' },
  ];
  const box = $('#patients'), word = $('#op-word'), rule = $('#op-rule');
  let token = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, REDUCED ? 0 : ms));
  const spans = (str, cls) => [...str].map((ch) => `<span class="${cls}">${ch}</span>`).join('');
  async function operate(p, btn) {
    const my = ++token;
    $$('.chip', box).forEach((b) => b.classList.toggle('on', b === btn));
    word.innerHTML = spans(p.keep, 'k') + spans(p.cut, 'c');
    rule.textContent = 'Пациент на столе…';
    await wait(600); if (my !== token) return;
    $$('.c', word).forEach((s) => s.classList.add('cut'));
    if (p.cut) { rule.textContent = `Убираем «${p.cut}»`; await wait(700); if (my !== token) return; }
    $$('.c', word).forEach((s) => s.classList.add('gone'));
    await wait(p.cut ? 500 : 0); if (my !== token) return;
    $$('.c', word).forEach((s) => s.remove());
    if (p.add) { word.insertAdjacentHTML('beforeend', spans(p.add, 'born')); rule.textContent = `Пришиваем «${p.add}»`; await wait(700); if (my !== token) return; }
    word.insertAdjacentHTML('beforeend', `<span class="th">${p.th}</span>`);
    rule.textContent = p.rule;
  }
  P.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = p.w;
    b.addEventListener('click', () => operate(p, b));
    box.appendChild(b);
  });
  word.textContent = 'five';
  rule.textContent = 'Выбери пациента ↑';
})();

/* ---------- даты ---------- */
(function dates() {
  const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MRU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const ms = $('#d-month'), ds = $('#d-day');
  const NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  M.forEach((m, i) => ms.add(new Option(`${m} — ${NOM[i]}`, i)));
  function fillDays(keep) {
    const n = DAYS[ms.value];
    ds.innerHTML = '';
    for (let d = 1; d <= n; d++) ds.add(new Option(d, d));
    ds.value = Math.min(keep || 1, n);
  }
  function spoken() { return `the ${ordinalWord(Number(ds.value))} of ${M[ms.value]}`; }
  function show() {
    const d = Number(ds.value), m = M[ms.value];
    $('#d-written').textContent = `${m} ${d}`;
    const parts = [['the', 'w-the'], [ordinalWord(d), 'w-ord'], ['of', 'w-of'], [m, 'w-m']];
    $('#d-spoken').innerHTML = parts.map(([t, c], k) => `<span class="${c}" style="animation-delay:${k * 0.15}s">${t}</span>`).join('');
    $('#d-bday').innerHTML = `Если твой день рождения ${d} ${MRU[ms.value]}, скажи: <b>«My birthday is on ${spoken()}.»</b> Почему <b>on</b>? Дата → ON, это будет на станции 4.`;
  }
  ms.addEventListener('change', () => { fillDays(Number(ds.value)); show(); });
  ds.addEventListener('change', show);
  $('#d-sep1').addEventListener('click', () => { ms.value = 8; fillDays(1); show(); });
  $('#d-jul4').addEventListener('click', () => { ms.value = 6; fillDays(4); show(); });
  $('#d-say').addEventListener('click', () => speak(spoken()));
  ms.value = 8; fillDays(1); show();
})();

/* =====================================================================
   Some / Any
   ===================================================================== */
(function someAny() {
  const NOUNS = [
    { k: 'coffee', em: '☕', ru: ['У меня есть немного кофе.', 'У тебя есть кофе?', 'У меня нет кофе.', 'Хочешь кофе?', 'Можно мне кофе, пожалуйста?'] },
    { k: 'apples', em: '🍎', ru: ['У меня есть несколько яблок.', 'У тебя есть яблоки?', 'У меня нет яблок.', 'Хочешь яблок?', 'Можно мне яблок, пожалуйста?'] },
    { k: 'milk', em: '🥛', ru: ['У меня есть немного молока.', 'У тебя есть молоко?', 'У меня нет молока.', 'Хочешь молока?', 'Можно мне молока, пожалуйста?'] },
    { k: 'books', em: '📚', ru: ['У меня есть несколько книг.', 'У тебя есть книги?', 'У меня нет книг.', 'Хочешь книг почитать?', 'Можно мне несколько книг, пожалуйста?'] },
  ];
  const MODES = [
    { label: '+ Утверждение', w: 'some', en: (n, w) => `I've got ${w} ${n}.`, why: 'Уверенно говорю «да» → S = Sure → some' },
    { label: '? Вопрос', w: 'any', en: (n, w) => `Have you got ${w} ${n}?`, why: 'Спрашиваю → A = Ask → any' },
    { label: '− Отрицание', w: 'any', en: (n, w) => `I haven't got ${w} ${n}.`, why: 'Говорю «нет» → N = No → any' },
    { label: '🎁 Угощаю', w: 'some', en: (n, w) => `Would you like ${w} ${n}?`, why: 'Вопрос, но я делюсь → S = Share → some!' },
    { label: '🙏 Прошу', w: 'some', en: (n, w) => `Can I have ${w} ${n}, please?`, why: 'Вопрос-просьба: жду «да» → some!' },
  ];
  let noun = 0, mode = 0, lastW = null;
  const nBox = $('#sw-nouns'), mBox = $('#sw-modes');
  NOUNS.forEach((n, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = `${n.em} ${n.k}`; b.onclick = () => { noun = i; render(); }; nBox.appendChild(b); });
  MODES.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = m.label; b.onclick = () => { mode = i; render(); }; mBox.appendChild(b); });
  function render() {
    $$('.chip', nBox).forEach((b, i) => b.classList.toggle('on', i === noun));
    $$('.chip', mBox).forEach((b, i) => b.classList.toggle('on', i === mode));
    const m = MODES[mode], n = NOUNS[noun];
    const flip = lastW !== null && lastW !== m.w;
    $('#sw-sentence').innerHTML = m.en(n.k, `<span class="w ${m.w}${flip ? ' flip' : ''}">${m.w}</span>`);
    $('#sw-ru').textContent = n.ru[mode];
    $('#sw-why').textContent = m.why;
    lastW = m.w;
  }
  render();

  const ITEMS = [
    { em: '🍞', en: 'bread', k: 'u' }, { em: '🥛', en: 'milk', k: 'u' }, { em: '💰', en: 'money', k: 'u' }, { em: '🍚', en: 'rice', k: 'u' },
    { em: '🍎🍎🍎', en: 'apples', k: 'p' }, { em: '✏️✏️', en: 'pens', k: 'p' }, { em: '🚗🚗', en: 'cars', k: 'p' }, { em: '📚', en: 'books', k: 'p' },
    { em: '🍎', en: 'apple', k: 's', fix: 'an apple' }, { em: '✏️', en: 'pen', k: 's', fix: 'a pen' }, { em: '🚗', en: 'car', k: 's', fix: 'a car' },
  ];
  const shelf = $('#shelf'), out = $('#shelf-out');
  shuffle(ITEMS).forEach((it) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'item';
    b.innerHTML = `<span class="em" aria-hidden="true">${it.em}</span><span>${it.en}</span>`;
    b.onclick = () => {
      b.classList.remove('ok', 'no'); void b.offsetWidth;
      if (it.k === 'u') { b.classList.add('ok'); out.innerHTML = `✓ <b>some ${it.en}</b> — это не посчитать поштучно, значит, можно.`; }
      else if (it.k === 'p') { b.classList.add('ok'); out.innerHTML = `✓ <b>some ${it.en}</b> — много штук, множественное число.`; }
      else { b.classList.add('no'); out.innerHTML = `✗ <b>some ${it.en}</b> — нельзя: это одна штука! Скажи <b>${it.fix}</b>, а «несколько» — <b>some ${it.en}s</b>.`; }
    };
    shelf.appendChild(b);
  });
})();

/* =====================================================================
   Предлоги места: кот и коробка
   ===================================================================== */
const PREPS = {
  in: { en: 'in', s: 'The cat is <b>in</b> the box.', ru: 'Кот в коробке.', hook: 'IN — «инсайдер»: внутри.', x: 322, y: 150, sc: 0.9, cover: 1 },
  on: { en: 'on', s: 'The cat is <b>on</b> the box.', ru: 'Кот на коробке.', hook: 'ON — сверху, на поверхности.', x: 336, y: 104, sc: 1, cover: 0 },
  under: { en: 'under', s: 'The cat is <b>under</b> the box.', ru: 'Кот под коробкой.', hook: 'UNDER — как «андеграунд»: под землёй, под чем-то.', x: 320, y: 250, sc: 0.5, cover: 0 },
  front: { en: 'in front of', s: 'The cat is <b>in front of</b> the box.', ru: 'Кот перед коробкой.', hook: 'IN FRONT OF — «фронт»: впереди, перед.', x: 320, y: 292, sc: 1.12, cover: 0 },
  behind: { en: 'behind', s: 'The cat is <b>behind</b> the box.', ru: 'Кот за коробкой.', hook: 'be-HIND: hind — «задний» (hind legs — задние лапы). Позади!', x: 394, y: 234, sc: 0.88, cover: 1 },
  next: { en: 'next to / beside', s: 'The cat is <b>next to</b> the box.', ru: 'Кот рядом с коробкой, вплотную.', hook: 'NEXT TO — «следующий» встал вплотную. BE-SIDE: side — бок, сбоку.', x: 220, y: 250, sc: 1, cover: 0 },
  near: { en: 'near', s: 'The cat is <b>near</b> the box.', ru: 'Кот недалеко от коробки.', hook: 'NEAR — поблизости, но не вплотную: пара шагов.', x: 130, y: 250, sc: 1, cover: 0 },
  between: { en: 'between', s: 'The cat is <b>between</b> the boxes.', ru: 'Кот между коробками.', hook: 'be-TWEEN: tween ≈ two — между двумя.', x: 437, y: 250, sc: 1, cover: 0, boxB: 1 },
  opposite: { en: 'opposite', s: 'The cat is <b>opposite</b> the box.', ru: 'Кот напротив коробки.', hook: 'OPPOSITE — как «оппозиция»: напротив, лицом к лицу.', x: 50, y: 250, sc: 1, cover: 0, zebra: 1 },
};
const plain = (html) => html.replace(/<[^>]+>/g, '');

const cat = (function catScene() {
  const catEl = $('#cat'), cover = $('#cover'), boxB = $('#boxB'), zebra = $('#zebra');
  // Передняя стенка коробки видна всегда; #cover — её копия поверх кота для in/behind
  [...cover.children].forEach((n) => $('#boxA').appendChild(n.cloneNode(true)));
  let cur = PREPS.in;
  const tf = (p) => `translate(${p.x}px, ${p.y}px) scale(${p.sc})`;
  catEl.style.transform = tf(cur);
  cover.style.opacity = cur.cover;
  function moveTo(key, caption = true) {
    const to = PREPS[key], from = cur;
    cur = to;
    boxB.classList.toggle('show', !!to.boxB);
    zebra.classList.toggle('show', !!to.zebra);
    if (caption) {
      $('#sc-en').innerHTML = to.s;
      $('#sc-ru').textContent = to.ru;
      $('#prep-hook').textContent = to.hook;
    }
    if (REDUCED || from === to) { catEl.style.transform = tf(to); cover.style.opacity = to.cover; return; }
    const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 70, sc: (from.sc + to.sc) / 2 };
    catEl.animate([{ transform: tf(from) }, { transform: tf(mid) }, { transform: tf(to) }], { duration: 750, easing: 'ease-in-out' });
    catEl.style.transform = tf(to);
    setTimeout(() => { cover.style.opacity = from.cover && to.cover ? 1 : 0; }, 160);
    setTimeout(() => { cover.style.opacity = to.cover; }, 520);
  }
  const btns = $('#prep-buttons');
  Object.entries(PREPS).forEach(([k, p]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = p.en; b.dataset.k = k;
    b.onclick = () => { stopGuess(); moveTo(k); $$('.chip', btns).forEach((x) => x.classList.toggle('on', x === b)); speak(plain(p.s)); };
    btns.appendChild(b);
  });
  $('.chip', btns).classList.add('on');
  $('#prep-hook').textContent = PREPS.in.hook;
  $('#sc-say').onclick = () => speak(plain($('#sc-en').innerHTML));

  /* --- игра «угадай, где кот» --- */
  const opts = $('#guess-opts'), scoreEl = $('#guess-score');
  let g = null;
  function stopGuess() { if (!g) return; g = null; opts.hidden = true; scoreEl.textContent = ''; $('#cat-guess').textContent = 'Игра: угадай, где кот'; }
  function round() {
    if (g.n >= 8) {
      opts.hidden = true;
      scoreEl.textContent = `Итог: ${g.ok} из 8 ${g.ok === 8 ? '🏆' : g.ok >= 6 ? '👍' : '— попробуй ещё'}`;
      if (g.ok === 8) confetti(40);
      g = null; $('#cat-guess').textContent = 'Сыграть ещё раз';
      return;
    }
    const keys = Object.keys(PREPS).filter((k) => PREPS[k] !== cur);
    const k = pick(keys);
    g.ans = k;
    moveTo(k, false);
    $('#sc-en').innerHTML = 'The cat is <b>???</b> the box.';
    $('#sc-ru').textContent = 'Где кот?';
    $('#prep-hook').textContent = '';
    $$('.chip', btns).forEach((x) => x.classList.remove('on'));
    const choices = shuffle([k, ...shuffle(Object.keys(PREPS).filter((x) => x !== k)).slice(0, 3)]);
    opts.innerHTML = choices.map((c) => `<button type="button" data-k="${c}">${PREPS[c].en}</button>`).join('');
    opts.hidden = false;
    scoreEl.textContent = `Раунд ${g.n + 1} из 8 · верно: ${g.ok}`;
    $$('button', opts).forEach((b) => b.onclick = () => {
      if (!g || g.locked) return;
      g.locked = true;
      const ok = b.dataset.k === g.ans;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) $(`[data-k="${g.ans}"]`, opts).classList.add('right');
      $$('button', opts).forEach((x) => { x.disabled = true; });
      if (ok) g.ok++;
      g.n++;
      $('#sc-en').innerHTML = PREPS[g.ans].s;
      $('#sc-ru').textContent = PREPS[g.ans].ru;
      $('#prep-hook').textContent = (ok ? '✓ ' : '✗ ') + PREPS[g.ans].hook;
      scoreEl.textContent = `Раунд ${g.n} из 8 · верно: ${g.ok}`;
      setTimeout(() => { if (g) { g.locked = false; round(); } }, ok ? 1200 : 2400);
    });
  }
  $('#cat-guess').onclick = () => { if (g) { stopGuess(); return; } g = { n: 0, ok: 0 }; $('#cat-guess').textContent = 'Остановить игру'; round(); };
  return { moveTo };
})();

/* ---------- корзины AT / IN / ON ---------- */
(function sorter() {
  const AT = ['school', 'work', 'home', '20 Oxford Street', 'university', 'college'];
  const IN = ['Moscow', 'England', 'Europe', 'Australia', 'bed', 'hospital', 'prison', 'the sky', 'the air', 'a picture', 'a newspaper', 'a magazine', 'the middle of the room'];
  const ON = ['the left', 'the right', 'the first floor', 'the second floor'];
  const HINT = {
    at: 'AT @ — точка-адрес или место, куда ходят по делу.',
    in: 'IN ▣ — внутри рамки: город, страна, кровать, больница, небо, картинка, газета.',
    on: 'ON ◧ — сторона или этаж.',
  };
  const card = $('#sort-card'), msg = $('#sort-msg'), prog = $('#sort-progress'), again = $('#sort-restart');
  let deck = [], i = 0, ok = 0, lock = false;
  function deal() {
    deck = shuffle([
      ...shuffle(AT).slice(0, 4).map((w) => [w, 'at']),
      ...shuffle(IN).slice(0, 5).map((w) => [w, 'in']),
      ...shuffle(ON).slice(0, 3).map((w) => [w, 'on']),
    ]);
    i = 0; ok = 0; lock = false;
    $$('.bk-items').forEach((b) => { b.innerHTML = ''; });
    again.hidden = true; msg.textContent = '';
    show();
  }
  function show() {
    if (i >= deck.length) {
      card.style.opacity = 1; card.style.transform = '';
      card.innerHTML = ok === deck.length ? '🏆 Все с первого раза!' : `Готово! С первого раза: ${ok} из ${deck.length}`;
      prog.textContent = '';
      again.hidden = false;
      if (ok >= 10) confetti(40);
      return;
    }
    card.style.transform = ''; card.style.opacity = 1;
    card.innerHTML = `<span class="gap"></span>${deck[i][0]}`;
    restartAnim(card, 'enter');
    prog.textContent = `Карточка ${i + 1} из ${deck.length} · с первого раза: ${ok}`;
  }
  let firstTry = true;
  $$('.basket').forEach((bk) => bk.addEventListener('click', () => {
    if (lock || i >= deck.length) return;
    const [w, p] = deck[i];
    if (bk.dataset.p === p) {
      lock = true;
      if (firstTry) ok++;
      msg.innerHTML = `✓ <b>${p} ${w}</b>`;
      const r1 = card.getBoundingClientRect(), r2 = bk.getBoundingClientRect();
      card.style.transform = `translate(${r2.left + r2.width / 2 - (r1.left + r1.width / 2)}px, ${r2.top + 40 - r1.top}px) scale(.3)`;
      card.style.opacity = 0;
      setTimeout(() => {
        $('.bk-items', bk).insertAdjacentHTML('beforeend', `<span>${w}</span>`);
        restartAnim(bk, 'hit');
        i++; firstTry = true; lock = false; show();
      }, REDUCED ? 0 : 450);
    } else {
      firstTry = false;
      restartAnim(card, 'bump');
      msg.innerHTML = `✗ Не ${bk.dataset.p.toUpperCase()}. Подсказка: ${HINT[p]}`;
    }
  }));
  again.onclick = deal;
  deal();
})();

/* =====================================================================
   Предлоги времени
   ===================================================================== */
const TIME = [
  ['September', 'in', 'Месяц → IN'], ['1996', 'in', 'Год → IN'], ['winter', 'in', 'Время года → IN (можно и in the winter)'],
  ['the 20th century', 'in', 'Век → IN, самый широкий слой воронки'], ['the morning', 'in', 'Утро длинное, мы внутри → IN'],
  ['the afternoon', 'in', 'День (часть суток) длинный → IN'], ['the evening', 'in', 'Вечер длинный → IN'],
  ['an hour', 'in', 'IN = «через»: in an hour — через час'], ['a week', 'in', 'IN = «через»: через неделю'],
  ['a few days', 'in', 'IN = «через»: через несколько дней'], ['spring', 'in', 'Время года → IN'], ['May', 'in', 'Месяц → IN'], ['2010', 'in', 'Год → IN'],
  ['a month', 'in', 'IN = «через»: через месяц'], ['autumn', 'in', 'Время года → IN'],
  ['Monday', 'on', 'День недели → ON, листок календаря'], ["New Year's Day", 'on', 'В названии есть Day — это день → ON'],
  ['May 6th', 'on', 'Дата → ON'], ['Tuesday evening', 'on', 'Есть день недели — ON побеждает, даже рядом с evening'],
  ['a hot day', 'on', 'Прилагательное + day — всё равно день → ON'], ['Friday', 'on', 'День недели → ON'],
  ['Sunday morning', 'on', 'Есть день недели — ON побеждает'], ['July 4th', 'on', 'Дата → ON'], ['a rainy day', 'on', 'Прилагательное + day → ON'],
  ["7 o'clock", 'at', 'Точное время → AT, точка на часах'], ['Christmas', 'at', 'Праздники — AT-тракционы!'], ['Easter', 'at', 'Праздники — AT-тракционы!'],
  ['the weekend', 'at', 'Выходные — тоже AT-тракцион: at the weekend'], ['the moment', 'at', 'Момент — точка → AT'], ['present', 'at', 'at present = сейчас, точка'],
  ['dawn', 'at', 'Рассвет — миг → AT'], ['noon', 'at', 'Полдень — точка на часах → AT'], ['night', 'at', 'Ночью все спят, ночь как точка → AT'],
  ['midnight', 'at', 'Полночь — точка на часах → AT'], ['half past three', 'at', 'Точное время → AT'], ['5 p.m.', 'at', 'Точное время → AT'],
];

(function funnelZoom() {
  const Z = [
    { p: 'in', ph: 'the 20th century', lens: 'XX<small>век</small>' },
    { p: 'in', ph: '1996', lens: '1996<small>год</small>' },
    { p: 'in', ph: 'winter', lens: '☃️<small>время года</small>' },
    { p: 'in', ph: 'September', lens: '<div class="cal"><i>2026</i><b>SEP</b></div><small>месяц</small>' },
    { p: 'on', ph: 'Monday', lens: '<div class="cal"><i>SEP</i><b>MON</b></div><small>день недели</small>' },
    { p: 'on', ph: 'May 6th', lens: '<div class="cal"><i>MAY</i><b>6</b></div><small>дата</small>' },
    { p: 'at', ph: "7 o'clock", lens: '<div class="clock"><i class="h"></i><i class="m"></i></div><small>точное время</small>' },
  ];
  const range = $('#zoom'), lensIn = $('#lens-in'), phrase = $('#lens-phrase');
  let playing = null;
  function show(k) {
    const z = Z[k];
    lensIn.innerHTML = z.lens;
    restartAnim(lensIn, 'zoomin');
    phrase.innerHTML = `<b class="p-${z.p}">${z.p}</b> ${z.ph}`;
    $$('.fl').forEach((f) => f.classList.toggle('active', f.dataset.p === z.p));
  }
  range.addEventListener('input', () => { clearInterval(playing); playing = null; show(Number(range.value)); });
  $('#zoom-play').addEventListener('click', () => {
    clearInterval(playing);
    let k = 0; range.value = 0; show(0);
    playing = setInterval(() => {
      k++;
      if (k >= Z.length) { clearInterval(playing); playing = null; return; }
      range.value = k; show(k); speak(`${Z[k].p} ${Z[k].ph}`);
    }, 1300);
    speak(`${Z[0].p} ${Z[0].ph}`);
  });
  show(0);
})();

(function flips() {
  const F = [
    { ph: '___ night', ans: 'at night', why: 'Ночью все спят — ночь сжимается в точку. А утро, день и вечер длинные: in the morning, in the afternoon, in the evening.' },
    { ph: '___ Christmas / Easter / the weekend', ans: 'at Christmas, at Easter, at the weekend', why: 'Праздники и выходные — это AT-тракционы!' },
    { ph: '___ Tuesday evening', ans: 'on Tuesday evening', why: 'Есть день недели — ON побеждает, даже если рядом стоит evening.' },
    { ph: '___ a hot day', ans: 'on a hot day', why: 'Прилагательное + day — это всё равно день. День → ON.' },
    { ph: '___ an hour', ans: 'in an hour = через час', why: 'IN = «через»: in a minute, in a week, in a few days, in a month, in a year.' },
    { ph: '___ the moment / present', ans: 'at the moment, at present', why: '«Сейчас» — одна точка на линии времени → AT.' },
    { ph: '___ noon / midnight / dawn', ans: 'at noon, at midnight, at dawn', why: 'Полдень, полночь, рассвет — мгновения на часах → AT.' },
    { ph: "___ New Year's Day", ans: "on New Year's Day", why: 'В названии есть Day — значит, это день → ON.' },
  ];
  const box = $('#flips');
  F.forEach((f) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'flip';
    b.innerHTML = `<div class="flip-in"><div class="flip-f"><span class="ph">${f.ph}</span><span class="hint">in, on или at? Нажми</span></div><div class="flip-b"><span class="ans">${f.ans}</span><span class="why">${f.why}</span></div></div>`;
    b.setAttribute('aria-label', `${f.ph.replace('___', 'пропуск')}. Нажми, чтобы перевернуть`);
    b.onclick = () => { b.classList.toggle('open'); if (b.classList.contains('open')) speak(f.ans.split(' = ')[0]); };
    box.appendChild(b);
  });
})();

/* ---------- аркада «Часовщик» ---------- */
(function arcade() {
  const N = 15, LIMIT = 8000;
  const phraseEl = $('#arc-phrase'), msg = $('#arc-msg'), bar = $('#arc-bar'), res = $('#arc-result');
  const btns = $$('.arc-b');
  let S = null, raf = 0;
  function start() {
    const by = (p) => shuffle(TIME.filter((t) => t[1] === p)).slice(0, 5);
    S = { list: shuffle([...by('in'), ...by('on'), ...by('at')]), i: 0, ok: 0, score: 0, streak: 0, best: 0, miss: [], lock: false, timed: $('#arc-timed').checked };
    res.innerHTML = ''; $('#arc-start').textContent = 'Заново';
    next();
  }
  function hud() {
    $('#arc-n').textContent = `${Math.min(S.i + 1, N)} / ${N}`;
    $('#arc-streak').textContent = `Серия: ${S.streak}${S.streak >= 3 ? ' 🔥' : ''}`;
    $('#arc-score').textContent = `Очки: ${S.score}`;
  }
  function next() {
    if (S.i >= N) return end();
    S.lock = false;
    btns.forEach((b) => { b.disabled = false; });
    phraseEl.innerHTML = `<span class="gap"></span>${S.list[S.i][0]}`;
    restartAnim(phraseEl, 'enter');
    msg.textContent = '';
    hud();
    cancelAnimationFrame(raf);
    bar.style.transform = 'scaleX(1)';
    if (S.timed) {
      const t0 = performance.now(), mine = S.i;
      const tick = (t) => {
        if (!S || S.i !== mine || S.lock) return;
        const left = 1 - (t - t0) / LIMIT;
        bar.style.transform = `scaleX(${Math.max(0, left)})`;
        if (left <= 0) answer(null); else raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
  }
  function answer(p) {
    if (!S || S.lock) return;
    S.lock = true;
    cancelAnimationFrame(raf);
    const [ph, a, why] = S.list[S.i];
    const ok = p === a;
    btns.forEach((b) => { b.disabled = true; });
    $('.gap', phraseEl).textContent = a;
    $('.gap', phraseEl).style.color = ok ? '#7dffb0' : '#ffb0a8';
    if (ok) { S.ok++; S.streak++; S.best = Math.max(S.best, S.streak); S.score += 10 + (S.streak >= 3 ? 5 : 0); msg.textContent = `✓ ${why}${S.streak >= 3 ? ' · бонус за серию +5' : ''}`; }
    else { S.streak = 0; S.miss.push(`${a} ${ph} — ${why}`); msg.textContent = `${p ? '✗' : '⏰ Время вышло.'} Правильно: ${a} ${ph}. ${why}`; }
    S.i++;
    hud();
    setTimeout(next, REDUCED ? 900 : ok ? 800 : 2200);
  }
  function end() {
    btns.forEach((b) => { b.disabled = true; });
    phraseEl.textContent = S.ok >= 13 ? '🏆 Мастер времени!' : S.ok >= 10 ? '⭐ Отлично!' : 'Ещё тренировка!';
    msg.textContent = '';
    bar.style.transform = 'scaleX(0)';
    res.innerHTML = `<h4>${S.ok} из ${N} · ${S.score} очков · лучшая серия ${S.best}</h4>${S.miss.length ? `<p>Повтори:</p><ul>${S.miss.map((m) => `<li>${m}</li>`).join('')}</ul>` : '<p style="text-align:center">Ни одной ошибки!</p>'}`;
    if (S.ok >= 13) confetti();
    S = null;
  }
  btns.forEach((b) => b.addEventListener('click', () => answer(b.dataset.p)));
  document.addEventListener('keydown', (e) => {
    if (!S || S.lock || e.target.matches('input, select, textarea')) return;
    const k = { i: 'in', o: 'on', a: 'at', 1: 'in', 2: 'on', 3: 'at' }[e.key.toLowerCase()];
    if (k) answer(k);
  });
  $('#arc-start').addEventListener('click', start);
})();

/* =====================================================================
   Банк вопросов
   ===================================================================== */
const BANK = {
  ordinal: [
    { q: '22 → ?', o: ['22st', '22nd', '22rd', '22th'], a: '22nd', w: 'Последняя цифра 2 → nd, как в secoND.' },
    { q: '51 → ?', o: ['51st', '51th', '51nd'], a: '51st', w: 'Последняя цифра 1 → st, как в fiRST.' },
    { q: '63 → ?', o: ['63th', '63rd', '63nd'], a: '63rd', w: 'Последняя цифра 3 → rd, как в thiRD.' },
    { q: '12 → ?', o: ['12nd', '12th', '12st'], a: '12th', w: '11, 12, 13 — «тинейджеры»: всегда th.' },
    { q: '11 → ?', o: ['11st', '11th', '11nd'], a: '11th', w: '11, 12, 13 — ловушка: всегда th.' },
    { q: '101 → ?', o: ['101th', '101st', '101nd'], a: '101st', w: 'Смотрим на последнюю цифру: 1 → st (one hundred and first).' },
    { q: '382 → ?', o: ['382rd', '382th', '382nd'], a: '382nd', w: 'Последняя цифра 2 → nd (three hundred and eighty-second).' },
    { q: 'five → ?', o: ['fiveth', 'fifth', 'fivth'], a: 'fifth', w: 'VE → F, потом th.' },
    { q: 'twelve → ?', o: ['twelveth', 'twelfth', 'twelvth'], a: 'twelfth', w: 'VE → F, потом th.' },
    { q: 'nine → ?', o: ['nineth', 'ninth', 'ninnth'], a: 'ninth', w: 'Девятка на диете: e выпадает.' },
    { q: 'twenty → ?', o: ['twentyth', 'twentieth', 'twentith'], a: 'twentieth', w: 'Y → IE, потом th.' },
    { q: 'forty → ?', o: ['fortieth', 'fourtieth', 'fortyth'], a: 'fortieth', w: 'Y → IE. И без u — как в forty.' },
    { q: 'thirty → ?', o: ['thirtyth', 'thirtieth', 'thirtith'], a: 'thirtieth', w: 'Y → IE, потом th.' },
    { q: 'He took ___ first prize at the Olympic Games.', o: ['a', 'the', '—'], a: 'the', w: 'Порядковое не ходит одно: телохранитель THE.' },
    { q: "It's ___ thirteenth birthday today.", o: ['my', 'a', '—'], a: 'my', w: 'Вместо the охранником может быть my, his, her.' },
    { q: 'Как сказать вслух: July 4?', o: ['the fourth of July', 'July four', 'the four of July'], a: 'the fourth of July', w: 'THE — порядковое — OF — месяц.' },
    { q: 'Как сказать вслух: September 1?', o: ['September one', 'the first of September', 'the one of September'], a: 'the first of September', w: 'THE — порядковое — OF — месяц.' },
    { q: 'Как прочитать 3rd?', o: ['three', 'third', 'thirth'], a: 'third', w: 'Бунтарь: thi-RD → 3-RD.' },
  ],
  someany: [
    { q: "I've got ___ money.", o: ['some', 'any'], a: 'some', w: 'Утверждение: S = Sure → some.' },
    { q: 'Have you got ___ books?', o: ['some', 'any'], a: 'any', w: 'Вопрос: A = Ask → any.' },
    { q: "No, I haven't got ___ books.", o: ['some', 'any'], a: 'any', w: 'Отрицание: N = No → any.' },
    { q: 'Would you like ___ coffee?', o: ['some', 'any'], a: 'some', w: 'Угощаю: S = Share → some, хоть это и вопрос.' },
    { q: 'Can I have ___ coffee, please?', o: ['some', 'any'], a: 'some', w: 'Прошу: жду «да» → some.' },
    { q: "There isn't ___ milk in the fridge.", o: ['some', 'any'], a: 'any', w: 'Отрицание (isn\'t): N = No → any.' },
    { q: "I'd like ___ apples, please.", o: ['some', 'any'], a: 'some', w: 'Прошу вежливо → some.' },
    { q: 'Are there ___ pens on the desk?', o: ['some', 'any'], a: 'any', w: 'Обычный вопрос: A = Ask → any.' },
    { q: "We've got ___ bread.", o: ['some', 'any'], a: 'some', w: 'Утверждение → some.' },
    { q: 'Is there ___ sugar in my tea?', o: ['some', 'any'], a: 'any', w: 'Вопрос → any.' },
    { q: "She hasn't got ___ friends here.", o: ['some', 'any'], a: 'any', w: 'Отрицание → any.' },
    { q: 'Where is the mistake?', o: ['some apples', 'some bread', 'some apple'], a: 'some apple', w: 'Одна штука — нельзя some. Нужно an apple или some apples.' },
    { q: 'Would you like ___ cake?', o: ['some', 'any'], a: 'some', w: 'Угощаю → some.' },
  ],
  place: [
    { q: "I'm ___ school.", o: ['at', 'in', 'on'], a: 'at', w: 'AT @ — место, куда ходят по делу.' },
    { q: 'She lives ___ 20 Oxford Street.', o: ['at', 'in', 'on'], a: 'at', w: 'Адрес с номером дома → AT @.' },
    { q: 'They live ___ Moscow.', o: ['at', 'in', 'on'], a: 'in', w: 'Город — внутри границ → IN.' },
    { q: 'Look at the bird ___ the sky!', o: ['at', 'in', 'on'], a: 'in', w: 'Небо — внутри → IN.' },
    { q: 'My grandpa is ___ hospital.', o: ['at', 'in', 'on'], a: 'in', w: 'in hospital — готовое выражение из рамки IN.' },
    { q: 'The shop is ___ the left.', o: ['at', 'in', 'on'], a: 'on', w: 'Сторона → ON ◧.' },
    { q: 'Our flat is ___ the first floor.', o: ['at', 'in', 'on'], a: 'on', w: 'Этаж → ON.' },
    { q: "There's a cat ___ the picture.", o: ['at', 'in', 'on'], a: 'in', w: 'У картинки рамка → IN (хотя по-русски «НА картинке»).' },
    { q: 'Dad is ___ work.', o: ['at', 'in', 'on'], a: 'at', w: 'at work — место по делу → AT.' },
    { q: 'Kangaroos live ___ Australia.', o: ['at', 'in', 'on'], a: 'in', w: 'Страна, континент → IN.' },
    { q: "It's late. Tom is ___ bed.", o: ['at', 'in', 'on'], a: 'in', w: 'in bed — внутри, под одеялом → IN.' },
    { q: 'Stay ___ home!', o: ['at', 'in', 'on'], a: 'at', w: 'at home — готовое выражение AT.' },
    { q: 'Кот ПОЗАДИ коробки: The cat is ___ the box.', o: ['behind', 'in front of', 'opposite'], a: 'behind', w: 'be-HIND: hind — задний.' },
    { q: 'Кот МЕЖДУ двумя коробками: The cat is ___ the boxes.', o: ['near', 'between', 'next to'], a: 'between', w: 'be-TWEEN ≈ two — между двумя.' },
    { q: 'Кафе НАПРОТИВ школы: The café is ___ the school.', o: ['opposite', 'behind', 'under'], a: 'opposite', w: 'OPPOSITE — «оппозиция», лицом к лицу.' },
    { q: 'Мяч ПОД столом: The ball is ___ the table.', o: ['on', 'under', 'in'], a: 'under', w: 'UNDER — «андеграунд», под.' },
  ],
  time: TIME.map(([ph, a, w]) => ({ q: `___ ${ph}`, o: ['in', 'on', 'at'], a, w })),
};
const TOPIC_NAMES = { ordinal: '1 · 1st 2nd 3rd', someany: '2 · Some / Any', place: '3 · Где?', time: '4 · Когда?' };

/* =====================================================================
   Проездной: прогресс
   ===================================================================== */
const KEYS = ['ordinal', 'someany', 'place', 'time', 'final'];
const STORE = 'eng-module2-v1';
let progress = {};
try { progress = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { progress = {}; }
function renderProgress() {
  const n = KEYS.filter((k) => progress[k]).length;
  $$('.station').forEach((s, i) => s.classList.toggle('done', !!progress[KEYS[i]]));
  $$('#pass-holes i').forEach((h, i) => h.classList.toggle('punched', !!progress[KEYS[i]]));
  $('#pass-count').textContent = n === 5 ? 'Вся линия пройдена! 🎉' : `Пройдено станций: ${n} из 5`;
}
function setDone(k) {
  progress[k] = 1;
  try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch (e) { /* приватный режим */ }
  renderProgress();
}
renderProgress();

/* ---------- контрольные и экзамен ---------- */
function checkpoint(el) {
  const topic = el.dataset.topic, exam = topic === 'all';
  const N = exam ? 12 : 5, PASS = exam ? 10 : 4, key = exam ? 'final' : topic;
  const nextLink = { ordinal: '#someany', someany: '#place', place: '#time', time: '#final' }[topic];
  let qs = [], i = 0, score = 0, marks = [];
  const gapify = (s) => s.replace('___', '<span class="gap">&nbsp;</span>');
  function build() {
    const take = (t, n) => shuffle(BANK[t]).slice(0, n).map((q) => ({ ...q, t, o: shuffle(q.o) }));
    return exam ? shuffle(['ordinal', 'someany', 'place', 'time'].flatMap((t) => take(t, 3))) : take(topic, N);
  }
  function intro() {
    el.innerHTML = `<div class="cp-head"><h3>${exam ? 'Экзамен: 12 вопросов' : 'Контроль станции: 5 вопросов'}</h3>${progress[key] ? '<span class="cp-done-badge">✓ пройдено</span>' : ''}</div>
      <div class="cp-start"><p style="margin:0;flex:1;min-width:220px">${exam ? 'По 3 вопроса с каждой станции. 10 из 12 — и проездной полностью прокомпостирован.' : 'Ответь правильно на 4 из 5 — станция засветится на карте наверху.'}</p>
      <button class="btn primary" type="button">${progress[key] ? 'Пройти ещё раз' : 'Начать'}</button></div>`;
    $('button', el).onclick = () => { qs = build(); i = 0; score = 0; marks = []; render(true); };
  }
  function render(focus) {
    const q = qs[i];
    el.innerHTML = `<div class="cp-head"><h3>Вопрос ${i + 1} из ${N}</h3><div class="cp-dots">${qs.map((_, k) => `<i class="${marks[k] || ''}${k === i ? ' cur' : ''}"></i>`).join('')}</div></div>
      ${exam ? `<span class="q-tag">Станция ${TOPIC_NAMES[q.t]}</span>` : ''}
      <p class="q-prompt">${gapify(q.q)}</p>
      <div class="q-opts">${q.o.map((o) => `<button class="opt" type="button">${o}</button>`).join('')}</div>
      <p class="q-why" aria-live="polite"></p>
      <button class="btn q-next" type="button" hidden>${i + 1 < N ? 'Дальше →' : 'Результат'}</button>`;
    const opts = $$('.opt', el);
    opts.forEach((b) => b.onclick = () => {
      const ok = b.textContent === q.a;
      opts.forEach((x) => { x.disabled = true; if (x.textContent === q.a) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      marks[i] = ok ? 'ok' : 'bad';
      if (ok) score++;
      const gap = $('.gap', el);
      if (gap) { gap.textContent = q.a; gap.classList.add('filled'); }
      const why = $('.q-why', el);
      why.className = `q-why ${ok ? 'ok' : 'bad'}`;
      why.textContent = ok ? `✓ ${q.w}` : `✗ Правильно: ${q.a}. ${q.w}`;
      $$('.cp-dots i', el)[i].className = marks[i];
      const nx = $('.q-next', el);
      nx.hidden = false; nx.focus({ preventScroll: true });
      nx.onclick = () => { i++; if (i < N) render(true); else finish(); };
    });
    if (focus) opts[0].focus({ preventScroll: true });
  }
  function finish() {
    const pass = score >= PASS;
    const stars = score === N ? 3 : pass ? 2 : score >= N / 2 ? 1 : 0;
    if (pass) { setDone(key); confetti(); }
    el.innerHTML = `<div class="cp-result">
      <div class="stars">${[0, 1, 2].map((k) => `<span class="s${k < stars ? '' : ' off'}" style="animation-delay:${k * 0.2}s">⭐</span>`).join('')}</div>
      <h4>${score} из ${N}</h4>
      <p>${pass ? (exam ? 'Экзамен сдан! Линия «Модуль 2» пройдена до конечной. Билет-шпаргалка ниже — твой.' : 'Станция пройдена — смотри, она засветилась на карте!') : `Нужно ${PASS} из ${N}. Перечитай запоминалки выше и попробуй ещё раз: вопросы будут другие.`}</p>
      <div class="cp-start" style="justify-content:center"><button class="btn" type="button" data-a="again">Ещё раз</button>${pass && nextLink ? `<a class="btn primary" href="${nextLink}">Следующая станция →</a>` : ''}</div></div>`;
    $('[data-a="again"]', el).onclick = () => { qs = build(); i = 0; score = 0; marks = []; render(true); };
  }
  intro();
}
$$('.checkpoint').forEach(checkpoint);

/* =====================================================================
   Карта метро и табло
   ===================================================================== */
(function metro() {
  const nav = $('#metro'), train = $('#train'), stations = $$('.station', nav), line = $('#board-line');
  const NAMES = ['1st 2nd 3rd', 'Some / Any', 'Где?', 'Когда?', 'Экзамен'];
  const BOARD = [
    'fiRST · secoND · thiRD — хвостик = 2 последние буквы',
    'SOME — Sure & Share · ANY — Ask? & No!',
    'AT @ адрес · IN ▣ рамка · ON ◧ сторона и этаж',
    'IN — большое ▸ ON — день ▸ AT — точка',
    'Конечная: экзамен и билет-шпаргалка',
  ];
  let cur = 0, typer = 0, auto = 0;
  function place(i) {
    const dot = $('.dot', stations[i]);
    const nr = nav.getBoundingClientRect(), dr = dot.getBoundingClientRect();
    const x = dr.left + dr.width / 2 - nr.left, y = dr.top - nr.top - 14;
    train.style.transform = `translate(${x - 32}px, ${y - 15}px)`;
  }
  function type(text) {
    clearInterval(typer);
    if (REDUCED) { line.textContent = text; return; }
    let k = 0; line.textContent = '';
    typer = setInterval(() => { k++; line.textContent = text.slice(0, k); if (k >= text.length) clearInterval(typer); }, 32);
  }
  function go(i) {
    cur = i;
    stations.forEach((s, k) => s.classList.toggle('here', k === i));
    train.classList.add('moving');
    place(i);
    setTimeout(() => train.classList.remove('moving'), 1100);
    $('#board-st').textContent = `Станция ${i + 1} · ${NAMES[i]}`;
    type(BOARD[i]);
  }
  function loop() { clearInterval(auto); if (!REDUCED) auto = setInterval(() => go((cur + 1) % stations.length), 6000); }
  stations.forEach((s, i) => {
    s.addEventListener('mouseenter', () => { if (cur !== i) go(i); loop(); });
    s.addEventListener('focusin', () => { if (cur !== i) go(i); loop(); });
  });
  window.addEventListener('resize', () => place(cur));
  document.fonts?.ready.then(() => place(cur));
  go(0); loop();

  const clock = () => { const d = new Date(); $('#board-clock').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  clock(); setInterval(clock, 20000);
})();

/* ---------- печать билета ---------- */
$('#print-ticket').addEventListener('click', () => {
  document.body.classList.add('print-ticket');
  window.print();
});
window.addEventListener('afterprint', () => document.body.classList.remove('print-ticket'));
