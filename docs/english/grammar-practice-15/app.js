'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- озвучка (если браузер умеет) ---------- */
const CAN_SPEAK = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
function speak(text) {
  if (!CAN_SPEAK) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const v = voices.find((x) => /en[-_]GB/i.test(x.lang)) || voices.find((x) => /^en/i.test(x.lang));
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-GB';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { /* озвучка необязательна */ }
}

/* =====================================================================
   HERO: кот переезжает по предлогам
   ===================================================================== */
const POS_TEXT = {
  on:    ['The cat is on the table.', 'Кот на столе.'],
  under: ['The cat is under the table.', 'Кот под столом.'],
  front: ['The cat is in front of the table.', 'Кот перед столом.'],
  in:    ['The cat is in the box.', 'Кот в коробке.'],
};
const stage = $('#stage');
const caption = $('#caption');
$$('.stage-btns [data-pos]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const pos = btn.dataset.pos;
    stage.dataset.pos = pos;
    $$('.stage-btns [data-pos]').forEach((b) => b.classList.toggle('on', b === btn));
    const [en, ru] = POS_TEXT[pos];
    caption.textContent = `${en}  ·  ${ru}`;
    speak(en);
  });
});

/* =====================================================================
   ЗАДАНИЯ 1, 2, 3, 5: выбор из списка и проверка
   ===================================================================== */
const TOTAL_GRADED = 26;
const results = {}; // id секции -> число верных

function updateTotal() {
  const sum = Object.values(results).reduce((a, b) => a + b, 0);
  const done = Object.keys(results).length;
  $('#total').textContent = `${sum} из ${TOTAL_GRADED}`;
  $('#finish-msg').textContent = done === 0
    ? 'Проверь каждое задание кнопкой «Проверить». Ошибки подскажут правило.'
    : sum === TOTAL_GRADED
      ? 'Все дырки заполнены верно. Ты прошёл страницу 15!'
      : 'Почти всё. Посмотри подсказки под ошибками и попробуй ещё раз.';
}

function checkSection(section) {
  const selects = $$('select[data-a]', section);
  let correct = 0;
  selects.forEach((sel) => {
    const item = sel.closest('.item, .scene-card');
    const fb = item.querySelector('.fb');
    const want = sel.dataset.a;
    const got = sel.value.trim().toLowerCase();
    const ok = got === want;
    sel.classList.remove('ok', 'bad');
    sel.classList.add(ok ? 'ok' : 'bad');
    fb.classList.remove('ok', 'bad');
    fb.classList.add(ok ? 'ok' : 'bad');
    if (ok) {
      correct++;
      fb.textContent = '✓ Верно. ' + sel.dataset.hint;
    } else {
      fb.textContent = (got ? '✗ Не то. ' : '…Выбери слово. ') + `Правильно: «${want}». ` + sel.dataset.hint;
    }
  });

  const score = $('[data-score]', section);
  score.textContent = `${correct} из ${selects.length}`;
  score.classList.toggle('ok', correct === selects.length);

  results[section.id] = correct;
  const tab = document.querySelector(`[data-tab="${section.id}"]`);
  if (tab) tab.classList.add('done');
  updateTotal();
}

function resetSection(section) {
  $$('select[data-a]', section).forEach((sel) => {
    sel.value = '';
    sel.classList.remove('ok', 'bad');
  });
  $$('.fb', section).forEach((fb) => {
    fb.textContent = '';
    fb.classList.remove('ok', 'bad');
  });
  const score = $('[data-score]', section);
  if (score) {
    score.textContent = '—';
    score.classList.remove('ok');
  }
  delete results[section.id];
  const tab = document.querySelector(`[data-tab="${section.id}"]`);
  if (tab) tab.classList.remove('done');
  updateTotal();
}

$$('section.ex').forEach((section) => {
  const check = $('[data-check]', section);
  const reset = $('[data-reset]', section);
  if (check) check.addEventListener('click', () => checkSection(section));
  if (reset) reset.addEventListener('click', () => resetSection(section));
});

$('#reset-all').addEventListener('click', () => {
  $$('section.ex').forEach((section) => resetSection(section));
});

/* =====================================================================
   ЗАДАНИЕ 4: вопросы о картинке (не проверяется, только тренировка)
   ===================================================================== */
const QA = [
  { w: 'girls', q: 'Are there any girls in the picture?', y: 'Yes, there are.', n: "No, there aren't." },
  { w: 'boys', q: 'Are there any boys in the picture?', y: 'Yes, there are.', n: "No, there aren't." },
  { w: 'trees', q: 'Are there any trees in the picture?', y: 'Yes, there are.', n: "No, there aren't." },
  { w: 'cars', q: 'Are there any cars in the picture?', y: 'Yes, there are.', n: "No, there aren't." },
  { w: 'dog', q: 'Is there a dog in the picture?', y: 'Yes, there is.', n: "No, there isn't." },
  { w: 'cat', q: 'Is there a cat in the picture?', y: 'Yes, there is.', n: "No, there isn't." },
];

const wordsBox = $('#words');
const qaQ = $('#qa .qa-q');
const qaBtns = $('#qa-btns');
const qaA = $('#qa-a');

function showQuestion(item) {
  $$('.chip', wordsBox).forEach((c) => c.classList.toggle('on', c.dataset.w === item.w));
  qaQ.textContent = item.q;
  speak(item.q);
  qaA.textContent = '';
  qaBtns.innerHTML = '';
  [['Да', item.y], ['Нет', item.n]].forEach(([label, answer]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = label;
    b.addEventListener('click', () => {
      qaA.textContent = answer;
      speak(answer);
    });
    qaBtns.appendChild(b);
  });
}

QA.forEach((item) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.dataset.w = item.w;
  b.textContent = item.w;
  b.addEventListener('click', () => showQuestion(item));
  wordsBox.appendChild(b);
});

/* =====================================================================
   Вкладки: подсветка текущего задания при прокрутке
   ===================================================================== */
const tabLinks = $$('.tabs a');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        tabLinks.forEach((t) => t.classList.toggle('current', t.dataset.tab === e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('section.ex').forEach((s) => io.observe(s));
}
