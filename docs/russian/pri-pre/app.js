(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// Слово с пропуском "пр_ехать" -> HTML; letter: undefined (пусто), 'и' или 'е'
const gap = (w, letter) => esc(w).replace('_', `<span class="gap${letter ? (letter === 'и' ? ' g-pri' : ' g-pre') : ''}">${letter || '&nbsp;'}</span>`);
const full = (w, letter) => w.replace('_', letter);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

/* ---------- Данные ---------- */
const POWERS = {
  a: { l: 'и', name: 'приближение', why: 'приближение: движение сюда, ближе' },
  j: { l: 'и', name: 'присоединение', why: 'присоединение: одно прикрепили или добавили к другому' },
  n: { l: 'и', name: 'близость', why: 'близость: находится рядом' },
  p: { l: 'и', name: 'неполное действие', why: 'неполное действие: чуть-чуть, не до конца' },
  v: { l: 'е', name: '= очень', why: 'пре- можно заменить словом «очень»' },
  r: { l: 'е', name: '= пере-', why: 'пре- близко по смыслу к пере-' }
};
const RULES = {
  a: 'пр_ехать пр_бежать пр_лететь пр_плыть пр_нести пр_везти пр_ползти пр_скакать пр_землиться пр_близиться пр_мчаться пр_шагать',
  j: 'пр_клеить пр_шить пр_бить пр_вязать пр_крепить пр_винтить пр_колоть пр_строить пр_делать пр_цепить пр_паять пр_писать',
  n: 'пр_школьный|при школе;пр_морский|при море;пр_вокзальный|при вокзале;пр_брежный|при береге;пр_город|при городе;пр_усадебный|при усадьбе;пр_дорожный|при дороге;пр_речный|при реке;пр_озёрный|при озере;пр_граничный|при границе;пр_волжский|при Волге;пр_уральский|при Урале',
  p: 'пр_открыть пр_сесть пр_встать пр_глушить пр_тормозить пр_поднять пр_лечь пр_утихнуть пр_задуматься пр_украсить пр_храмывать пр_спустить',
  v: 'пр_красный|очень красивый;пр_добрый|очень добрый;пр_милый|очень милый;пр_мудрый|очень мудрый;пр_забавный|очень забавный;пр_большой|очень большой;пр_спокойный|очень спокойный;пр_неприятный|очень неприятный;пр_хитрый|очень хитрый;пр_смешной|очень смешной;пр_огромный|очень огромный;пр_увеличить|слишком увеличить;пр_восходный|очень хороший;пр_скверный|очень скверный;пр_интересный|очень интересный',
  r: 'пр_рвать|перервать;пр_градить|перегородить;пр_одолеть|пересилить;пр_образовать|переделать;пр_вратить|переделать в другое;пр_кратить|перестать;пр_дание|передаётся от старших;пр_терпеть|перетерпеть, пережить;пр_возмочь|пересилить;пр_ломить|переломить;пр_града|перегородка;пр_рывистый|с перерывами;пр_образиться|перемениться'
};
const DICT = {
  'и': 'пр_вет пр_рода пр_чина пр_сяга пр_лежный пр_ключение пр_каз пр_вычка пр_бор пр_личный пр_мер пр_ятный пр_гласить пр_гожий пр_творяться пр_вередливый пр_чудливый непр_хотливый непр_ступный пр_оритет пр_вилегия пр_митивный пр_ватный пр_сутствовать пр_говор пр_звание',
  'е': 'пр_пятствие пр_следовать пр_небрегать пр_подаватель пр_лесть пр_имущество пр_зирать пр_стол пр_поднести пр_словутый пр_смыкаться пр_льстить пр_вратный беспр_кословно пр_ткновение пр_зидент пр_мьера пр_зентация пр_парат пр_зидиум пр_стиж пр_тензия пр_людия пр_мия пр_тендент пр_пинания'
};
// Пары: [слово, значение, пример]
const TWINS = [
  [['прибыть', 'приехать, появиться', 'Поезд прибыл на станцию.'], ['пребывать', 'находиться где-то или в каком-то состоянии', 'Мы пребывали в отличном настроении.']],
  [['придать', 'дать, добавить', 'Придать глине форму шара.'], ['предать', 'изменить, выдать', 'Нельзя предать друга.']],
  [['притворить', 'прикрыть', 'Притвори дверь, дует.'], ['претворить', 'воплотить, превратить в дело', 'Претворить мечту в жизнь.']],
  [['призреть', 'приютить, позаботиться', 'Призреть бездомного щенка.'], ['презирать', 'считать недостойным', 'Все презирают труса.']],
  [['приклонить', 'нагнуть, приблизить', 'Приклонить ветку к земле.'], ['преклонить', 'опустить с уважением; преклонный — очень старый', 'Преклонить колени. Преклонный возраст.']],
  [['приступить', 'начать', 'Приступить к работе.'], ['преступить', 'нарушить, переступить', 'Преступить закон. Преступник.']],
  [['приёмник', 'то, что принимает', 'Радиоприёмник ловит волну.'], ['преемник', 'тот, кто перенимает дело', 'Директор выбрал себе преемника.']],
  [['привратник', 'сторож при воротах', 'Привратник открыл ворота.'], ['превратный', 'неправильный, перевёрнутый', 'Превратное мнение. Превратности судьбы.']],
  [['приходящий', 'тот, кто приходит', 'Приходящая няня бывает по средам.'], ['преходящий', 'временный, проходит', 'Мода — явление преходящее.']],
  [['притерпеться', 'привыкнуть', 'Притерпеться к шуму.'], ['претерпеть', 'пережить, перенести', 'Город претерпел большие изменения.']],
  [['придел', 'пристройка в храме', 'Южный придел собора.'], ['предел', 'граница', 'Моему терпению есть предел.']],
  [['приуменьшить', 'уменьшить немного', 'Слегка приуменьшить расходы.'], ['преуменьшить', 'уменьшить очень сильно', 'Сильно преуменьшить опасность.']]
];
// Предложения для тренажёра: фраза | буква | объяснение
const TWIN_Q = `Поезд пр_был на станцию|и|прибыл = приехал, приближение
Гости пр_бывали в хорошем настроении|е|пребывать = находиться
Место пр_бывания туристов|е|пребывание = нахождение
Пр_дать глине форму|и|придать = дать, добавить
Пр_дать друга|е|предать = изменить
Соус пр_даёт блюду вкус|и|придаёт = добавляет
Пр_творить дверь|и|притворить = прикрыть, неполное действие
Пр_творить мечту в жизнь|е|претворить = воплотить, превратить в дело
Пр_творяться спящим|и|словарное: притворяться
Пр_зреть бездомного щенка|и|призреть = приютить
Пр_зирать труса|е|презирать = считать недостойным
Пр_клонить ветку к земле|и|приклонить = приблизить, нагнуть
Пр_клонить колени перед героями|е|преклонить = склонить с уважением
Пр_клонный возраст|е|преклонный = очень старый
Пр_клоняться перед талантом|е|преклоняться = очень уважать
Пр_ступить к работе|и|приступить = начать, подойти к делу
Пр_ступить закон|е|преступить = переступить
Опасный пр_ступник|е|преступник переступил закон
Радиопр_ёмник ловит волну|и|приёмник принимает
Директор выбрал себе пр_емника|е|преемник перенимает дело
Пр_вратник открыл ворота|и|привратник стоит при воротах
Пр_вратное мнение о человеке|е|превратное = перевёрнутое, неправильное
Пр_вратности судьбы|е|превратности = перемены, повороты
Пр_ходящая няня бывает по средам|и|приходящая = та, что приходит
Мода — явление пр_ходящее|е|преходящее = проходит, временное
Пр_терпеться к шуму|и|притерпеться = привыкнуть
Город пр_терпел большие изменения|е|претерпел = пережил
Моему терпению есть пр_дел|е|предел = граница
Пр_ложить усилия|и|приложить = присоединить, добавить
Непр_ложный закон|е|непреложный = нельзя переложить, изменить
Камень пр_ткновения|е|словарное: преткновение
Слегка пр_уменьшить расходы|и|приуменьшить = уменьшить немного
Сильно пр_уменьшить опасность|е|преуменьшить = уменьшить очень сильно`.split('\n').map(s => s.split('|'));

const items = { rules: [], dict: [], twins: [] };
for (const [t, str] of Object.entries(RULES)) {
  for (const part of str.split(str.includes(';') ? ';' : ' ')) {
    const [w, note] = part.split('|');
    items.rules.push({ w, l: POWERS[t].l, t, note, kind: 'rule' });
  }
}
for (const [l, str] of Object.entries(DICT)) for (const w of str.split(' ')) items.dict.push({ w, l, kind: 'dict' });
for (const [w, l, note] of TWIN_Q) items.twins.push({ w, l, note, kind: 'twin' });

function explain(it) {
  const word = `<b class="${it.l === 'и' ? 'pri' : 'pre'}">${esc(full(it.w, it.l))}</b>`;
  if (it.kind === 'rule') return `${word} — ${POWERS[it.t].why}${it.note ? ` (${esc(it.note)})` : ''}.`;
  if (it.kind === 'dict') return `${word} — словарное слово, его нужно запомнить.`;
  return `${word}: ${esc(it.note)}.`;
}

/* ---------- Арена в шапке ---------- */
(() => {
  const words = [
    ['пр_ехал', 'и', 'Притянул! Приехал — значит, стал ближе.'],
    ['пр_красный', 'е', 'Моё! Прекрасный — очень красивый.'],
    ['пр_клеил', 'и', 'Прилипло! Одно присоединили к другому.'],
    ['пр_рвал', 'е', 'Моё! Прервал — то же, что перервал.'],
    ['пр_школьный', 'и', 'Моё! Пришкольный — рядом, при школе.'],
    ['пр_мудрый', 'е', 'Беру! Премудрый — очень мудрый.'],
    ['пр_сел', 'и', 'Моё! Присел — сел чуть-чуть, ненадолго.'],
    ['пр_градил', 'е', 'Беру! Преградил — перегородил.']
  ];
  const idle = { 'и': 'Я притягиваю, прикрепляю, стою рядом и делаю чуть-чуть.', 'е': 'Я значу «очень» или «пере-».' };
  const nope = { 'и': 'Не притягивается! Проверь: тут прячется «очень» или «пере-».', 'е': 'Не моё: ни «очень», ни «пере-» сюда не подставить.' };
  const el = { 'и': $('#pick-pri'), 'е': $('#pick-pre') }, say = { 'и': $('#say-pri'), 'е': $('#say-pre') };
  let i = 0, busy = false;
  const show = () => {
    busy = false;
    $('#hero-again').hidden = true;
    if (i >= words.length) {
      $('#hero-count').textContent = '';
      $('#hero-word').textContent = 'Все слова разобраны!';
      $('#hero-hint').textContent = 'Листай вниз: там все силы героев и тренажёр.';
      $('#hero-again').hidden = false;
      busy = true;
      return;
    }
    $('#hero-count').textContent = `Слово ${i + 1} из ${words.length}`;
    $('#hero-word').innerHTML = gap(words[i][0]);
    $('#hero-hint').textContent = 'Нажми на героя, которому подходит слово.';
    say['и'].textContent = idle['и']; say['е'].textContent = idle['е'];
  };
  const pick = l => {
    if (busy) return;
    const [w, right, text] = words[i];
    const other = l === 'и' ? 'е' : 'и';
    el[l].classList.remove('yes', 'no'); void el[l].offsetWidth;
    if (l === right) {
      busy = true;
      el[l].classList.add('yes');
      say[l].textContent = text; say[other].textContent = 'Согласен, это не моё слово.';
      $('#hero-word').innerHTML = gap(w, right);
      $('#hero-hint').textContent = 'Верно!';
      i++; setTimeout(show, 2300);
    } else {
      el[l].classList.add('no');
      say[l].textContent = nope[l];
      $('#hero-hint').textContent = 'Попробуй отдать слово другому герою.';
    }
  };
  el['и'].onclick = () => pick('и');
  el['е'].onclick = () => pick('е');
  $('#hero-again').onclick = () => { i = 0; show(); };
  show();
})();

/* ---------- Сцены сил ---------- */
(() => {
  const moves = [['бежал', 'к финишу'], ['летел', 'домой'], ['плыл', 'к берегу'], ['ехал', 'в гости']];
  let mi = 0;
  const sc = $('#sc-move'), chip = $('#mv-chip');
  $('#mv-btn').onclick = () => {
    const [base, where] = moves[mi++ % moves.length];
    sc.classList.remove('go'); chip.style.transition = 'none'; chip.textContent = base;
    $('#mv-cap').textContent = `${base} ${where}…`;
    void chip.offsetWidth; chip.style.transition = '';
    sc.style.setProperty('--w', chip.offsetWidth + 34 + 'px');
    sc.classList.add('go');
    setTimeout(() => {
      chip.innerHTML = `<b class="pri">при</b>${base}`;
      $('#mv-cap').innerHTML = `<b class="pri">При</b>${base} ${where} — оказался ближе.`;
    }, 650);
  };

  const joins = [['марка', 'конверт', 'клеил марку к конверту'], ['пуговица', 'рубашка', 'шил пуговицу к рубашке'], ['вагон', 'поезд', 'цепил вагон к поезду'], ['полка', 'стена', 'бил полку к стене']];
  let ji = 0;
  const js = $('#sc-join'), ja = $('#jn-a'), jb = $('#jn-b');
  $('#jn-btn').onclick = () => {
    const [a, b, text] = joins[ji++ % joins.length];
    js.classList.remove('go'); ja.style.transition = jb.style.transition = 'none';
    ja.textContent = a; jb.textContent = b; $('#jn-cap').textContent = `${a} и ${b} пока отдельно…`;
    void ja.offsetWidth; ja.style.transition = jb.style.transition = '';
    js.style.setProperty('--wa', ja.offsetWidth + 'px'); js.style.setProperty('--wb', jb.offsetWidth + 'px');
    js.classList.add('go');
    setTimeout(() => { $('#jn-cap').innerHTML = `<b class="pri">При</b>${text} — теперь они вместе.`; }, 550);
  };

  for (const b of $$('.flip')) {
    b.textContent = b.dataset.a;
    b.onclick = () => { const on = b.classList.toggle('on'); b.textContent = on ? b.dataset.b : b.dataset.a; };
  }

  const door = $('#door'), cap = $('#door-cap');
  $('#door-range').oninput = e => {
    const v = +e.target.value;
    door.style.transform = `rotateY(${-v * 0.85}deg)`;
    cap.innerHTML = v === 0 ? 'Дверь закрыта. Подвинь ползунок совсем немного.'
      : v <= 35 ? 'Дверь <b class="pri">при</b>открыта: открыли чуть-чуть, не до конца.'
      : 'Теперь дверь просто открыта. «Чуть-чуть» закончилось, приставка при- больше не нужна.';
  };

  const adj = [['добрый', 'добрый'], ['смешной', 'смешной'], ['хитрый', 'хитрый'], ['милый', 'милый'], ['большой', 'большой']];
  let cur = 0;
  const box = $('#amp-words'), range = $('#amp-range'), scene = $('.scene-amp');
  const paint = () => {
    const w = adj[cur][0], v = +range.value;
    $$('button', box).forEach((b, k) => b.setAttribute('aria-pressed', k === cur));
    scene.className = 'scene scene-amp lvl' + v;
    $('#amp-out').innerHTML = v === 0 ? w : v === 1 ? `очень ${w}` : `<b class="pre">пре</b>${w}`;
    $('#amp-cap').innerHTML = v === 0 ? 'Обычное слово. Подвинь ползунок.' : v === 1 ? 'Сильнее! Двигай ещё.' : `<b class="pre">Пре</b>${w} = очень ${w}. Заменяется на «очень» — пишем Е.`;
  };
  adj.forEach(([w], k) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = w; b.onclick = () => { cur = k; paint(); }; box.append(b); });
  range.oninput = paint; paint();
})();

/* ---------- Допрос слова ---------- */
(() => {
  const sus = [
    { w: 'пр_скверный', t: 'v', note: 'очень скверный' }, { w: 'пр_рвать', t: 'r', note: 'перервать' },
    { w: 'пр_брежный', t: 'n', note: 'рядом, при береге — близость' }, { w: 'пр_сесть', t: 'p', note: 'сесть чуть-чуть — неполное действие' },
    { w: 'пр_шить', t: 'j', note: 'одно присоединили к другому' }, { w: 'пр_вет', t: 'di' }, { w: 'пр_пятствие', t: 'de' },
    { w: 'пр_мудрый', t: 'v', note: 'очень мудрый' }, { w: 'пр_бежать', t: 'a', note: 'стать ближе — приближение' }
  ];
  const qs = [
    ['Вопрос 1. Можно заменить приставку словом «очень»?', it => it.t === 'v', 'Попробуй сказать слово с «очень» вместо приставки. Получается осмысленно?'],
    ['Вопрос 2. Можно заменить приставку на «пере-»?', it => it.t === 'r', 'Подставь «пере-» вместо приставки. Есть такое слово с тем же смыслом?'],
    ['Вопрос 3. Есть приближение, присоединение, близость или «чуть-чуть»?', it => 'ajnp'.includes(it.t), 'Примерь по очереди все четыре силы Магнита.']
  ];
  const box = $('#algo-words'), btns = $('#algo-btns');
  let it, step;
  const verdict = (l, text) => {
    $('#algo-word').innerHTML = gap(it.w, l);
    $('#algo-q').textContent = 'Дело раскрыто!';
    $('#algo-msg').innerHTML = text;
    btns.hidden = true;
  };
  const ask = () => { $('#algo-q').textContent = qs[step][0]; };
  const start = k => {
    it = sus[k]; step = 0;
    $$('button', box).forEach((b, n) => b.setAttribute('aria-pressed', n === k));
    $('#algo-word').innerHTML = gap(it.w); $('#algo-msg').textContent = ''; btns.hidden = false; ask();
  };
  sus.forEach((s, k) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = s.w.replace('_', '…'); b.onclick = () => start(k); box.append(b); });
  for (const b of $$('button', btns)) b.onclick = () => {
    const yes = b.dataset.ans === '1', truth = qs[step][1](it);
    if (yes !== truth) { $('#algo-msg').textContent = 'Не сходится. ' + qs[step][2]; return; }
    $('#algo-msg').textContent = '';
    if (yes) return verdict(step < 2 ? 'е' : 'и', `Верно: ${esc(it.note)}. Пишем <b class="${step < 2 ? 'pre">пре' : 'pri">при'}-</b>.`);
    if (++step < 3) return ask();
    const l = it.t === 'di' ? 'и' : 'е';
    verdict(l, `Ни одна сила не подошла. Это словарное слово: <b>${full(it.w, l)}</b>. Его запоминают.`);
  };
  start(0);
})();

/* ---------- Близнецы, словарь, шпаргалка ---------- */
(() => {
  const hl = (w, cls) => w.replace(/(пр)([ие])/i, `$1<b class="${cls}">$2</b>`);
  $('#twins-list').innerHTML = TWINS.map(([a, b]) => `<div class="twin">
    <div class="tw-pri"><h3>${hl(a[0], 'pri')}</h3><p class="mean">${a[1]}</p><p class="eg">${a[2]}</p></div>
    <div class="tw-pre"><h3>${hl(b[0], 'pre')}</h3><p class="mean">${b[1]}</p><p class="eg">${b[2]}</p></div></div>`).join('');
  $('#cheat-twins').innerHTML = TWINS.map(([a, b]) => `<tr><td><b>${a[0]}</b> — ${a[1]}</td><td><b>${b[0]}</b> — ${b[1]}</td></tr>`).join('');

  let hidden = false;
  const draw = () => {
    for (const l of ['и', 'е']) {
      const host = $(l === 'и' ? '#dict-pri' : '#dict-pre');
      host.innerHTML = '';
      for (const w of DICT[l].split(' ')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'brick';
        b.innerHTML = hidden ? gap(w) : gap(w, l).replace(/<span[^>]*>(.)<\/span>/, `<b class="${l === 'и' ? 'pri' : 'pre'}">$1</b>`);
        b.onclick = () => { if (hidden) b.innerHTML = gap(w, l); };
        host.append(b);
      }
    }
    $('#dict').classList.toggle('hide-mode', hidden);
    $('#dict-hide').textContent = hidden ? 'Показать буквы' : 'Спрятать буквы и проверить себя';
  };
  $('#dict-hide').onclick = () => { hidden = !hidden; draw(); };
  draw();
  $('#print-btn').onclick = () => print();
})();

/* ---------- Тренажёр ---------- */
(() => {
  const MODES = [
    { id: 'rules', name: 'Правила', desc: 'Шесть сил: приближение, «очень», «пере-» и другие', n: 14, pool: () => items.rules },
    { id: 'dict', name: 'Исключения', desc: 'Словарные слова, которые нужно запомнить', n: 14, pool: () => items.dict },
    { id: 'twins', name: 'Близнецы', desc: 'Букву подсказывает смысл предложения', n: 12, pool: () => items.twins },
    { id: 'mix', name: 'Всё вместе', desc: 'Как на контрольной: всё вперемешку', n: 20, pool: () => [...shuffle(items.rules).slice(0, 9), ...shuffle(items.dict).slice(0, 6), ...shuffle(items.twins).slice(0, 5)] }
  ];
  const menu = $('#tr-menu'), game = $('#tr-game'), result = $('#tr-result');
  const fb = $('#tr-fb'), whybox = $('#tr-whybox'), letters = $$('.letter');
  let mode, queue, total, done, missed, cur, phase; // phase: letter | why | fb

  const drawMenu = () => {
    const best = store.get('pripre-best', {});
    const host = $('#tr-modes'); host.innerHTML = '';
    for (const m of MODES) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mode';
      b.innerHTML = `<b>${m.name}</b><small>${m.desc}</small><span class="best">${best[m.id] ? '★'.repeat(best[m.id]) + '☆'.repeat(3 - best[m.id]) : `${m.n} слов`}</span>`;
      b.onclick = () => start(m);
      host.append(b);
    }
  };
  const view = v => { menu.hidden = v !== 'menu'; game.hidden = v !== 'game'; result.hidden = v !== 'result'; };

  function start(m) {
    mode = m;
    queue = shuffle(m.pool()).slice(0, m.n).map(it => ({ ...it, failed: false }));
    total = queue.length; done = 0; missed = [];
    $('#tr-mode-name').textContent = m.name;
    view('game'); next();
    $('#train').scrollIntoView({ block: 'start' });
  }
  function next() {
    if (!queue.length) return finish();
    cur = queue[0]; phase = 'letter';
    $('#tr-word').innerHTML = gap(cur.w) + (cur.failed ? '<span class="tr-hint">Это слово вернулось. Вспомни объяснение.</span>' : '');
    $('#tr-bar').style.width = done / total * 100 + '%';
    $('#tr-count').textContent = `${done} из ${total}`;
    letters.forEach(b => b.disabled = false);
    fb.hidden = true; whybox.hidden = true;
  }
  function feedback(good, html) {
    phase = 'fb';
    whybox.hidden = true;
    fb.hidden = false; fb.className = 'fb ' + (good ? 'good' : 'bad');
    $('#tr-fb-text').innerHTML = html;
    $('#tr-word').innerHTML = gap(cur.w, cur.l);
    queue.shift();
    if (good) done++;
    else { if (!cur.failed) missed.push(cur); queue.push({ ...cur, failed: true }); }
    $('#tr-bar').style.width = done / total * 100 + '%';
    $('#tr-count').textContent = `${done} из ${total}`;
    $('#tr-next').focus({ preventScroll: true });
  }
  function answer(l) {
    if (phase !== 'letter') return;
    letters.forEach(b => b.disabled = true);
    if (l !== cur.l) return feedback(false, `Здесь пишется <b>${cur.l.toUpperCase()}</b>. ${explain(cur)}`);
    if (cur.kind === 'rule' && $('#tr-why').checked) {
      phase = 'why';
      $('#tr-word').innerHTML = gap(cur.w, cur.l);
      const host = $('#tr-whys'); host.innerHTML = '';
      for (const [t, p] of Object.entries(POWERS)) {
        if (p.l !== cur.l) continue;
        const b = document.createElement('button'); b.type = 'button'; b.textContent = p.name;
        b.onclick = () => t === cur.t ? feedback(true, 'Точно! ' + explain(cur)) : feedback(false, `Буква верная, но сила другая. ${explain(cur)}`);
        host.append(b);
      }
      whybox.hidden = false;
      return;
    }
    feedback(true, 'Верно! ' + explain(cur));
  }
  function finish() {
    const stars = missed.length === 0 ? 3 : missed.length <= 2 ? 2 : 1;
    const best = store.get('pripre-best', {});
    if (stars > (best[mode.id] || 0)) { best[mode.id] = stars; store.set('pripre-best', best); }
    $('#tr-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('#tr-res-line').textContent = missed.length === 0 ? `Все ${total} слов с первого раза. Блестяще!`
      : `С первого раза: ${total - missed.length} из ${total}. Ошибки ты уже исправил.`;
    $('#tr-res-miss').innerHTML = missed.length ? `<p><b>Повтори эти слова:</b></p><ul class="miss">${missed.map(it => `<li>${explain(it)}</li>`).join('')}</ul>` : '';
    drawMenu(); view('result');
  }

  letters.forEach(b => b.onclick = () => answer(b.dataset.l));
  $('#tr-next').onclick = next;
  $('#tr-again').onclick = () => start(mode);
  $('#tr-menu-btn').onclick = $('#tr-quit').onclick = () => view('menu');
  document.addEventListener('keydown', e => {
    if (game.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (phase === 'letter') {
      if (k === 'и' || k === 'b' || k === '1') answer('и');
      else if (k === 'е' || k === 't' || k === '2') answer('е');
    } else if (phase === 'fb' && k === 'enter' && document.activeElement !== $('#tr-next')) { e.preventDefault(); next(); }
  });
  drawMenu(); view('menu');
})();
})();
