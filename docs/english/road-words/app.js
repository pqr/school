'use strict';

/* =====================================================================
   СЛОВА УРОКА
   en — английское слово, ru — перевод для карточки, short — перевод для пар,
   ex / exRu — пример, emoji — картинка на карточке
   ===================================================================== */
const WORDS = [
  { en: 'traffic lights', short: 'светофоры', emoji: '🚦',
    ru: 'светофоры', ex: 'The traffic lights are red now.', exRu: 'Светофоры сейчас красные.' },
  { en: 'parking zone', short: 'зона парковки', emoji: '🅿️',
    ru: 'зона парковки (платная)', ex: 'You must pay in the parking zone.', exRu: 'В зоне парковки надо платить.' },
  { en: 'pedestrian', short: 'пешеход', emoji: '🚶',
    ru: 'пешеход', ex: 'A pedestrian walks on the pavement.', exRu: 'Пешеход идёт по тротуару.' },
  { en: 'traffic sign', short: 'дорожный знак', emoji: '🛑',
    ru: 'дорожный знак', ex: 'Look at the traffic sign: STOP.', exRu: 'Посмотри на знак: STOP.' },
  { en: 'yellow lines', short: 'жёлтые линии', emoji: '🟨',
    ru: 'жёлтые линии у обочины: парковаться нельзя', ex: "Don't park on yellow lines.", exRu: 'Не паркуйся на жёлтых линиях.' },
  { en: 'traffic warden', short: 'инспектор парковки', emoji: '👮',
    ru: 'инспектор парковки, он выписывает штрафы', ex: 'The traffic warden gave me a ticket.', exRu: 'Инспектор выписал мне штраф.' },
  { en: 'zebra crossing', short: 'пешеходный переход', emoji: '🦓',
    ru: 'пешеходный переход «зебра»', ex: 'Cross the road at the zebra crossing.', exRu: 'Переходи дорогу по «зебре».' },
  { en: 'pavement', short: 'тротуар', emoji: '👣',
    ru: 'тротуар (в США — sidewalk)', ex: 'Wait on the pavement, please.', exRu: 'Подожди, пожалуйста, на тротуаре.' },
  { en: 'traffic light', short: 'светофор', emoji: '🚥',
    ru: 'светофор (один)', ex: 'There is one traffic light here.', exRu: 'Здесь один светофор.',
    note: 'traffic light — один, traffic lights — несколько: добавляем -s.' },
];

/* Сцена «Улица»: позиция, подпись и картинка для каждого объекта */
const SCENE = [
  { id: 'sign',   cls: 's-sign',   label: 'traffic sign',   emoji: '🛑' },
  { id: 'lights', cls: 's-lights', label: 'traffic lights', emoji: '🚦' },
  { id: 'pave',   cls: 's-pave',   label: 'pavement' },
  { id: 'warden', cls: 's-warden', label: 'traffic warden', emoji: '👮' },
  { id: 'ped',    cls: 's-ped',    label: 'pedestrian',     emoji: '🚶' },
  { id: 'yellow', cls: 's-yellow', label: 'yellow lines' },
  { id: 'zebra',  cls: 's-zebra',  label: 'zebra crossing' },
  { id: 'park',   cls: 's-park',   label: 'parking zone',   emoji: '🅿️' },
];

/* =====================================================================
   УПРАЖНЕНИЯ УРОКА (порядок — как в уроке; неверные вернутся в конец)
   ===================================================================== */
const STEPS = [
  { type: 'learn' },
  { type: 'match' },

  { type: 'choice', big: true, title: 'pedestrian', sub: 'Выбери картинку',
    options: [
      { label: '🚶', value: 'pedestrian' }, { label: '🚦', value: 'traffic lights' },
      { label: '👮', value: 'traffic warden' }, { label: '🟨', value: 'yellow lines' },
    ],
    answer: 'pedestrian' },
  { type: 'choice', big: true, title: 'traffic warden', sub: 'Выбери картинку',
    options: [
      { label: '👮', value: 'traffic warden' }, { label: '🅿️', value: 'parking zone' },
      { label: '🛑', value: 'traffic sign' }, { label: '🦓', value: 'zebra crossing' },
    ],
    answer: 'traffic warden' },
  { type: 'choice', big: true, title: 'yellow lines', sub: 'Выбери картинку',
    options: [
      { label: '🟨', value: 'yellow lines' }, { label: '🦓', value: 'zebra crossing' },
      { label: '👣', value: 'pavement' }, { label: '🚥', value: 'traffic light' },
    ],
    answer: 'yellow lines' },

  { type: 'choice', title: 'тротуар', sub: 'Переведи на английский',
    options: [
      { label: 'pavement', value: 'pavement' }, { label: 'parking zone', value: 'parking zone' },
      { label: 'pedestrian', value: 'pedestrian' },
    ],
    answer: 'pavement' },
  { type: 'choice', title: 'дорожный знак', sub: 'Переведи на английский',
    options: [
      { label: 'traffic warden', value: 'traffic warden' }, { label: 'traffic sign', value: 'traffic sign' },
      { label: 'traffic lights', value: 'traffic lights' },
    ],
    answer: 'traffic sign' },

  { type: 'choice', title: 'Послушай и выбери слово', speak: 'zebra crossing',
    options: [
      { label: 'zebra crossing', value: 'zebra crossing' }, { label: 'zebra crossroads', value: 'zebra crossroads' },
      { label: 'zebra costume', value: 'zebra costume' },
    ],
    answer: 'zebra crossing' },
  { type: 'choice', title: 'Послушай и выбери слово', speak: 'traffic warden',
    options: [
      { label: 'traffic warden', value: 'traffic warden' }, { label: 'traffic garden', value: 'traffic garden' },
      { label: 'traffic lights', value: 'traffic lights' },
    ],
    answer: 'traffic warden' },

  { type: 'choice', title: 'Заполни пропуск', sentence: 'The ___ are red, yellow and green.',
    options: [
      { label: 'traffic lights', value: 'traffic lights' }, { label: 'pavement', value: 'pavement' },
      { label: 'zebra crossing', value: 'zebra crossing' }, { label: 'pedestrian', value: 'pedestrian' },
    ],
    answer: 'traffic lights' },
  { type: 'choice', title: 'Заполни пропуск', sentence: "Don't park on the ___.",
    options: [
      { label: 'yellow lines', value: 'yellow lines' }, { label: 'traffic sign', value: 'traffic sign' },
      { label: 'pedestrian', value: 'pedestrian' }, { label: 'pavement', value: 'pavement' },
    ],
    answer: 'yellow lines' },
  { type: 'choice', title: 'Заполни пропуск', sentence: 'A ___ walks on the pavement.',
    options: [
      { label: 'pedestrian', value: 'pedestrian' }, { label: 'traffic warden', value: 'traffic warden' },
      { label: 'zebra crossing', value: 'zebra crossing' }, { label: 'traffic light', value: 'traffic light' },
    ],
    answer: 'pedestrian' },
  { type: 'choice', title: 'Заполни пропуск', sentence: 'You must pay in the ___.',
    options: [
      { label: 'parking zone', value: 'parking zone' }, { label: 'traffic sign', value: 'traffic sign' },
      { label: 'pedestrian', value: 'pedestrian' }, { label: 'pavement', value: 'pavement' },
    ],
    answer: 'parking zone' },

  { type: 'scene', target: 'zebra', label: 'zebra crossing', prompt: 'Нажми на пешеходный переход: zebra crossing' },
  { type: 'scene', target: 'lights', label: 'traffic lights', prompt: 'Нажми на светофоры: traffic lights' },
  { type: 'scene', target: 'warden', label: 'traffic warden', prompt: 'Нажми на инспектора: traffic warden' },

  { type: 'order', sentence: 'The pedestrian waits on the pavement.' },
  { type: 'order', sentence: "You can't park on yellow lines." },
  { type: 'order', sentence: 'Look at the traffic sign.' },
];

/* =====================================================================
   ХЕЛПЕРЫ
   ===================================================================== */
const MAX_HEARTS = 3;
const XP_PER = 10;

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, cls, ...kids) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  kids.forEach((k) => node.append(k));
  return node;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* порядок индексов, отличный от исходного (чтобы не было готового ответа) */
function shuffledIndexes(n) {
  let order;
  do { order = shuffle([...Array(n).keys()]); } while (n > 1 && order.every((v, i) => v === i));
  return order;
}

/* озвучка — необязательна, при сбое просто молчим */
const CAN_SPEAK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
function speak(text) {
  if (!CAN_SPEAK) return;
  try {
    speechSynthesis.cancel();
    const voices = speechSynthesis.getVoices();
    const voice = voices.find((v) => /^en[-_]GB/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang));
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-GB';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { /* озвучка необязательна */ }
}

/* =====================================================================
   СОСТОЯНИЕ И ЭЛЕМЕНТЫ
   ===================================================================== */
const stage = $('#stage');
const foot = $('#foot');
const fb = $('#fb');
const action = $('#action');
const barFill = $('#barFill');
const bar = $('.bar');
const heartsEl = $('#hearts');
const xpEl = $('#xp');

let queue = [];      // индексы STEPS, которые ещё предстоит показать
let pos = 0;         // текущая позиция в очереди
let hearts = MAX_HEARTS;
let xp = 0;
let seen = new Set(); // шаги, по которым уже был ответ
let passed = new Set(); // шаги, пройденные верно

function renderHearts() {
  heartsEl.innerHTML = '';
  for (let i = 0; i < MAX_HEARTS; i++) {
    heartsEl.append(el('span', i < hearts ? 'heart' : 'heart off', '♥'));
  }
}

function renderXP() {
  xpEl.textContent = `${xp} XP`;
}

function setBar() {
  const pct = Math.round((passed.size / STEPS.length) * 100);
  barFill.style.width = `${pct}%`;
  bar.setAttribute('aria-valuenow', String(pct));
}

function feedback(text, tone) {
  fb.textContent = text;
  foot.className = tone ? `foot ${tone}` : 'foot';
}

function setAction(label, enabled, handler) {
  action.textContent = label;
  action.disabled = !enabled;
  action.onclick = enabled && handler ? handler : null;
}

function head(title, sub) {
  stage.append(el('h1', 'qtitle', title));
  if (sub) stage.append(el('p', 'qsub', sub));
}

function lose() {
  hearts = Math.max(0, hearts - 1);
  renderHearts();
}

/* итог ответа на шаг: начисляет XP, ставит «Дальше», неверный шаг вернётся в конец */
function resolve(idx, ok, { clean = true, answer = '' } = {}) {
  const first = !seen.has(idx);
  seen.add(idx);

  let text;
  let tone;
  if (ok) {
    passed.add(idx);
    if (first && clean) {
      xp += XP_PER;
      text = `Верно! +${XP_PER} XP`;
    } else {
      text = 'Верно!';
    }
    tone = 'ok';
  } else {
    queue.push(idx);
    text = `Почти. Правильно: ${answer}`;
    tone = 'bad';
  }

  renderXP();
  setBar();
  feedback(text, tone);
  setAction('Дальше', true, next);
}

function next() {
  pos++;
  showStep();
}

function start() {
  queue = STEPS.map((_, i) => i);
  pos = 0;
  hearts = MAX_HEARTS;
  xp = 0;
  seen = new Set();
  passed = new Set();
  renderHearts();
  renderXP();
  showStep();
}

function showStep() {
  stage.innerHTML = '';
  feedback('', '');
  setBar();

  if (hearts <= 0) return gameOver();
  if (pos >= queue.length) return finish();

  const idx = queue[pos];
  const step = STEPS[idx];
  setAction('Проверить', false, null);

  if (step.type === 'learn') return buildLearn(idx);
  if (step.type === 'match') return buildMatch(idx);
  if (step.type === 'choice') return buildChoice(idx, step);
  if (step.type === 'scene') return buildScene(idx, step);
  if (step.type === 'order') return buildOrder(idx, step);
}

/* =====================================================================
   ТИПЫ УПРАЖНЕНИЙ
   ===================================================================== */

/* 1. Новые слова */
function buildLearn(idx) {
  head('Новые слова', 'Нажимай 🔊, повторяй вслух и запоминай.');

  const cards = el('div', 'cards');
  WORDS.forEach((w) => {
    const body = el('div', 'wbody',
      el('b', '', w.en),
      el('span', 'ru', w.ru),
      el('em', '', w.ex),
      el('small', '', w.exRu),
    );
    if (w.note) body.append(el('p', 'note', w.note));

    const btn = el('button', 'snd', '🔊');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Послушать: ${w.en}`);
    btn.onclick = () => speak(w.en);

    cards.append(el('article', 'wcard', el('span', 'wemo', w.emoji), body, btn));
  });
  stage.append(cards);

  setAction('Дальше', true, () => {
    passed.add(idx);
    next();
  });
}

/* 2. Соедини пары */
function buildMatch(idx) {
  head('Соедини пары', 'Нажми английское слово и его перевод. Ошибки не отнимают жизни.');

  const pairs = WORDS.filter((w) => w.en !== 'traffic light').map((w) => ({ en: w.en, ru: w.short }));
  const colL = el('div', 'col');
  const colR = el('div', 'col');
  shuffle(pairs).forEach((p) => colL.append(makeMatchBtn(p, 'en', p.en)));
  shuffle(pairs).forEach((p) => colR.append(makeMatchBtn(p, 'ru', p.ru)));
  stage.append(el('div', 'match', colL, colR));

  let sel = null;       // { btn, item, key }
  let found = 0;
  let clean = true;
  let locked = false;

  function makeMatchBtn(item, key, text) {
    const b = el('button', 'opt', text);
    b.type = 'button';
    b.onclick = () => pick(b, item, key);
    return b;
  }

  function pick(btn, item, key) {
    if (btn.disabled || locked) return;

    if (!sel || sel.key === key) {
      if (sel) sel.btn.classList.remove('sel');
      sel = { btn, item, key };
      btn.classList.add('sel');
      return;
    }

    const first = sel;
    sel = null;
    first.btn.classList.remove('sel');

    if (first.item.en === item.en) {
      [first.btn, btn].forEach((x) => { x.classList.add('ok'); x.disabled = true; });
      found++;
      if (found === pairs.length) resolve(idx, true, { clean });
    } else {
      clean = false;
      locked = true;
      [first.btn, btn].forEach((x) => x.classList.add('bad'));
      setTimeout(() => {
        [first.btn, btn].forEach((x) => x.classList.remove('bad'));
        locked = false;
      }, 500);
    }
  }
}

/* 3. Выбор ответа: картинка, перевод, слушание, пропуск в предложении */
function buildChoice(idx, step) {
  head(step.title, step.sub);

  if (step.speak) {
    const btn = el('button', 'snd', '🔊 Послушать');
    btn.type = 'button';
    btn.onclick = () => speak(step.speak);
    stage.append(btn);
    setTimeout(() => speak(step.speak), 250);
  }

  let blankEl = null;
  if (step.sentence) {
    const [before, after] = step.sentence.split('___');
    blankEl = el('span', 'blank', '     ');
    stage.append(el('p', 'sentence', before, blankEl, after));
  }

  const opts = el('div', step.big ? 'opts big' : 'opts');
  const buttons = [];
  let chosen = null; // { btn, value }

  step.options.forEach((o) => {
    const b = el('button', 'opt', o.label);
    b.type = 'button';
    b.dataset.value = o.value;
    b.onclick = () => {
      if (b.disabled) return;
      if (chosen) chosen.btn.classList.remove('sel');
      chosen = { btn: b, value: o.value };
      b.classList.add('sel');
      if (blankEl) blankEl.textContent = o.label;
      setAction('Проверить', true, check);
    };
    buttons.push(b);
    opts.append(b);
  });
  stage.append(opts);

  function check() {
    const ok = chosen.value === step.answer;
    buttons.forEach((b) => { b.disabled = true; });
    chosen.btn.classList.remove('sel');
    chosen.btn.classList.add(ok ? 'ok' : 'bad');
    if (!ok) {
      lose();
      buttons.find((b) => b.dataset.value === step.answer).classList.add('ok');
    }
    resolve(idx, ok, { answer: step.answer });
  }
}

/* 4. Найди на картинке — сцена «Улица» */
function buildScene(idx, step) {
  head('Найди на картинке', step.prompt);

  const scene = el('div', 'scene');
  scene.setAttribute('role', 'group');
  scene.setAttribute('aria-label', 'Улица');

  const buttons = SCENE.map((s) => {
    const b = el('button', `hs ${s.cls}`, s.emoji || '');
    b.type = 'button';
    b.setAttribute('aria-label', s.label);
    b.onclick = () => tap(s, b);
    scene.append(b);
    return b;
  });
  stage.append(scene);

  let misses = 0;
  let done = false;

  function tap(s, b) {
    if (done || b.disabled) return;

    if (s.id === step.target) {
      done = true;
      buttons.forEach((x) => { x.disabled = true; });
      b.classList.add('ok');
      resolve(idx, true, { clean: misses === 0 });
      return;
    }

    misses++;
    b.classList.add('bad');
    setTimeout(() => b.classList.remove('bad'), 450);
    feedback(`Не то: это ${s.label}. Ищи ${step.label}.`, 'bad');
    lose();

    if (hearts <= 0) {
      done = true;
      buttons.forEach((x) => { x.disabled = true; });
      resolve(idx, false, { answer: step.label });
    }
  }
}

/* 5. Собери предложение */
function buildOrder(idx, step) {
  head('Собери предложение', 'Нажимай слова по порядку. Нажми на слово в ответе, чтобы вернуть его.');

  const tokens = step.sentence.split(' ');
  const order = shuffledIndexes(tokens.length);
  const answerRow = el('div', 'answer');
  const bankRow = el('div', 'bank');
  const bankBtns = {};
  const chosen = []; // индексы токенов в порядке выбора

  order.forEach((i) => {
    const b = el('button', 'tok', tokens[i]);
    b.type = 'button';
    b.onclick = () => {
      if (b.disabled) return;
      chosen.push(i);
      b.classList.add('used');
      b.disabled = true;
      renderAnswer();
    };
    bankBtns[i] = b;
    bankRow.append(b);
  });

  function renderAnswer() {
    answerRow.innerHTML = '';
    chosen.forEach((i, k) => {
      const b = el('button', 'tok on', tokens[i]);
      b.type = 'button';
      b.onclick = () => {
        chosen.splice(k, 1);
        bankBtns[i].classList.remove('used');
        bankBtns[i].disabled = false;
        renderAnswer();
      };
      answerRow.append(b);
    });
    if (chosen.length === tokens.length) {
      setAction('Проверить', true, check);
    } else {
      setAction('Проверить', false, null);
    }
  }

  function check() {
    const built = chosen.map((i) => tokens[i]).join(' ');
    const ok = built === step.sentence;
    answerRow.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    answerRow.classList.add(ok ? 'ok' : 'bad');
    if (!ok) lose();
    resolve(idx, ok, { answer: step.sentence });
  }

  stage.append(answerRow, bankRow);
  renderAnswer();
}

/* =====================================================================
   ЭКРАНЫ ИТОГА
   ===================================================================== */
function finish() {
  stage.innerHTML = '';
  stage.append(el('section', 'end',
    el('div', 'end-emoji', '🏆'),
    el('h1', '', 'Урок пройден!'),
    el('p', '', `XP: ${xp}. Жизней осталось: ${hearts} из ${MAX_HEARTS}.`),
    el('p', '', `Слов в уроке: ${WORDS.length}. Теперь проверь себя по картинке на улице.`),
  ));
  feedback('', 'ok');
  setAction('Пройти ещё раз', true, start);
}

function gameOver() {
  stage.innerHTML = '';
  stage.append(el('section', 'end',
    el('div', 'end-emoji', '💔'),
    el('h1', '', 'Жизни закончились'),
    el('p', '', 'Ничего страшного: посмотри карточки слов ещё раз и попробуй снова.'),
  ));
  feedback('', 'bad');
  setAction('Начать заново', true, start);
}

start();
