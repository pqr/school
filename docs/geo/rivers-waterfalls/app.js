'use strict';

/* ---------- Объекты домашнего задания ---------- */

const OCEANS = {
  atl: 'Атлантический океан',
  pac: 'Тихий океан',
  ind: 'Индийский океан',
  arc: 'Северный Ледовитый океан',
  casp: 'Каспийское море (бессточная область)',
};

const CONTINENTS = [
  {id: 'na', name: 'Северная Америка'},
  {id: 'sa', name: 'Южная Америка'},
  {id: 'af', name: 'Африка'},
  {id: 'eu', name: 'Евразия: Европа'},
  {id: 'as', name: 'Евразия: Азия'},
];

// src / mouth — примерные координаты [долгота, широта], на карте прилипают к руслу.
// label — точка для подписи.
const OBJECTS = [
  {id: 'mississippi', type: 'river', name: 'Миссисипи', cont: 'na', ocean: 'atl', len: '≈ 3 800 км (с Миссури ≈ 6 400 км)',
    srcText: 'озеро Итаска (север США)', mouthText: 'Мексиканский залив', countries: 'США',
    src: [-95.2, 47.2], mouth: [-89.2, 29.1], label: [-90.5, 36],
    hook: 'Индейцы звали её «Отец вод». Течёт с севера на юг через середину США — прямо в Мексиканский залив.',
    fact: 'Вместе с притоком Миссури — одна из самых длинных речных систем мира.'},
  {id: 'colorado', type: 'river', name: 'Колорадо', cont: 'na', ocean: 'pac', len: '≈ 2 300 км',
    srcText: 'Скалистые горы', mouthText: 'Калифорнийский залив', countries: 'США, Мексика',
    src: [-105.8, 40.4], mouth: [-114.8, 31.8], label: [-118.5, 36.5],
    hook: '«Колорадо» по-испански — «красноватая». Это она прорезала Большой каньон.',
    fact: 'Воду разбирают на орошение, поэтому сейчас река часто не доходит до моря.'},
  {id: 'mackenzie', type: 'river', name: 'Макензи', cont: 'na', ocean: 'arc', len: '≈ 1 700 км (с Пис ≈ 4 200 км)',
    srcText: 'Большое Невольничье озеро', mouthText: 'море Бофорта', countries: 'Канада',
    src: [-117.6, 61.2], mouth: [-135, 69.3], label: [-140, 64.5],
    hook: 'Самая длинная река Канады. Течёт на северо-запад, в Северный Ледовитый океан.',
    fact: 'Большую часть года покрыта льдом.'},
  {id: 'amazon', type: 'river', name: 'Амазонка', cont: 'sa', ocean: 'atl', len: '≈ 6 400 км (с Укаяли ≈ 7 000 км)',
    srcText: 'Анды (Перу)', mouthText: 'Атлантический океан', countries: 'Бразилия, Перу, Колумбия',
    src: [-71.7, -15.2], mouth: [-50.4, -0.2], label: [-62, -0.6],
    hook: 'Самая полноводная река мира. Течёт с запада на восток почти по экватору.',
    fact: 'У неё больше 500 притоков, а бассейн — самый большой на Земле.'},
  {id: 'parana', type: 'river', name: 'Парана', cont: 'sa', ocean: 'atl', len: '≈ 4 400 км',
    srcText: 'Бразильское плоскогорье', mouthText: 'залив Ла-Плата', countries: 'Бразилия, Парагвай, Аргентина',
    src: [-46.4, -19.1], mouth: [-58.4, -34], label: [-61.5, -28],
    hook: 'Впадает в залив Ла-Плата у Буэнос-Айреса. На её притоке Игуасу — водопад Игуасу.',
    fact: 'На Паране стоит одна из крупнейших ГЭС мира — Итайпу.'},
  {id: 'niger', type: 'river', name: 'Нигер', cont: 'af', ocean: 'atl', len: '≈ 4 200 км',
    srcText: 'Леоно-Либерийская возвышенность (Гвинея)', mouthText: 'Гвинейский залив', countries: 'Гвинея, Мали, Нигер, Нигерия',
    src: [-10.7, 9.2], mouth: [6, 4.4], label: [-3.5, 18.5],
    hook: 'Течёт дугой, как бумеранг: сначала на северо-восток к Сахаре, потом поворачивает на юг — в Гвинейский залив.',
    fact: 'В устье — большая дельта с множеством рукавов.'},
  {id: 'nile', type: 'river', name: 'Нил', cont: 'af', ocean: 'atl', len: '≈ 6 700 км',
    srcText: 'озеро Виктория (Восточная Африка)', mouthText: 'Средиземное море', countries: 'Уганда, Судан, Египет и др.',
    src: [33.2, 0.4], mouth: [31.82, 31.52], label: [35.3, 22.5],
    hook: 'Одна из самых длинных рек мира. Течёт с юга на север прямо через Сахару — в Средиземное море.',
    fact: 'У Хартума сливаются Белый и Голубой Нил. Дельта Нила похожа на греческую букву Δ.'},
  {id: 'congo', type: 'river', name: 'Конго', cont: 'af', ocean: 'atl', len: '≈ 4 700 км',
    srcText: 'возвышенности на юге Африки (верховье — Луалаба)', mouthText: 'Атлантический океан', countries: 'ДР Конго, Республика Конго',
    src: [25.6, -11.7], mouth: [12.3, -6], label: [17.5, 1.5],
    hook: 'Единственная крупная река, которая дважды пересекает экватор. Течёт дугой, как перевёрнутая «С».',
    fact: 'Вторая река мира по полноводности после Амазонки.'},
  {id: 'zambezi', type: 'river', name: 'Замбези', cont: 'af', ocean: 'ind', len: '≈ 2 600 км',
    srcText: 'возвышенность на северо-западе Замбии', mouthText: 'Мозамбикский пролив', countries: 'Замбия, Зимбабве, Мозамбик и др.',
    src: [24.3, -11.3], mouth: [36.3, -18.8], label: [31.5, -13.2],
    hook: 'Самая большая река Африки, текущая в Индийский океан. На ней — водопад Виктория.',
    fact: 'На Замбези построены большие водохранилища Кариба и Кабора-Баса.'},
  {id: 'limpopo', type: 'river', name: 'Лимпопо', cont: 'af', ocean: 'ind', len: '≈ 1 750 км',
    srcText: 'возвышенности на севере ЮАР', mouthText: 'Индийский океан', countries: 'ЮАР, Ботсвана, Зимбабве, Мозамбик',
    src: [27.1, -25.2], mouth: [33.6, -25.2], label: [29.5, -26.5],
    hook: '«Мы в Африку поедем, на Лимпопо!» — помнишь доктора Айболита? Река на юге Африки, пересекает Южный тропик.',
    fact: 'Самая южная из рек нашего списка.'},
  {id: 'dnieper', type: 'river', name: 'Днепр', cont: 'eu', ocean: 'atl', len: '≈ 2 200 км',
    srcText: 'Валдайская возвышенность', mouthText: 'Чёрное море', countries: 'Россия, Беларусь, Украина',
    src: [33.4, 55.6], mouth: [32, 46.5], label: [29.6, 50.2],
    hook: '«Чуден Днепр при тихой погоде…» — Гоголь. Течёт с севера на юг в Чёрное море.',
    fact: 'Третья по длине река Европы после Волги и Дуная.'},
  {id: 'danube', type: 'river', name: 'Дунай', cont: 'eu', ocean: 'atl', len: '≈ 2 850 км',
    srcText: 'горы Шварцвальд (Германия)', mouthText: 'Чёрное море', countries: '10 стран: Германия, Австрия, Венгрия, Сербия, Румыния…',
    src: [8.2, 48], mouth: [29.6, 45.2], label: [17, 45.5],
    hook: 'Течёт с запада на восток через 10 стран и 4 столицы: Вену, Братиславу, Будапешт и Белград.',
    fact: 'Вторая по длине река Европы.'},
  {id: 'volga', type: 'river', name: 'Волга', cont: 'eu', ocean: 'casp', len: '≈ 3 530 км',
    srcText: 'Валдайская возвышенность', mouthText: 'Каспийское море', countries: 'Россия',
    src: [32.6, 57.2], mouth: [47.9, 46], label: [44, 53.6],
    hook: 'Самая длинная река Европы. «Волга впадает в Каспийское море» — а Каспий не связан с океаном.',
    fact: 'В устье — огромная дельта, больше 500 рукавов.'},
  {id: 'ural', type: 'river', name: 'Урал', cont: 'eu', ocean: 'casp', len: '≈ 2 430 км',
    srcText: 'Уральские горы (хребет Уралтау)', mouthText: 'Каспийское море', countries: 'Россия, Казахстан',
    src: [59.4, 54.6], mouth: [51.8, 46.9], label: [57, 49],
    hook: 'По реке Урал (вместе с Уральскими горами) проводят границу Европы и Азии.',
    fact: 'Раньше называлась Яик.'},
  {id: 'tigris', type: 'river', name: 'Тигр', cont: 'as', ocean: 'ind', len: '≈ 1 850 км',
    srcText: 'Армянское нагорье (Турция)', mouthText: 'Персидский залив (вместе с Евфратом — Шатт-эль-Араб)', countries: 'Турция, Сирия, Ирак',
    src: [39.8, 38.4], mouth: [47.4, 31], label: [46.4, 35.3],
    hook: 'Тигр — восточная река Междуречья, ближе к горам. Он короче и быстрее Евфрата, на нём — Багдад.',
    fact: 'Между Тигром и Евфратом — Месопотамия, где возникли первые города.'},
  {id: 'euphrates', type: 'river', name: 'Евфрат', cont: 'as', ocean: 'ind', len: '≈ 2 700 км',
    srcText: 'Армянское нагорье (Турция)', mouthText: 'Персидский залив (вместе с Тигром — Шатт-эль-Араб)', countries: 'Турция, Сирия, Ирак',
    src: [41.2, 39.8], mouth: [47.4, 31], label: [37.6, 33.2],
    hook: 'Евфрат — западная и самая длинная река Юго-Западной Азии. Делает большую дугу через пустыню.',
    fact: 'Сливается с Тигром в реку Шатт-эль-Араб.'},
  {id: 'indus', type: 'river', name: 'Инд', cont: 'as', ocean: 'ind', len: '≈ 3 180 км',
    srcText: 'Тибетское нагорье (Гималаи)', mouthText: 'Аравийское море', countries: 'Китай, Индия, Пакистан',
    src: [79.7, 32.4], mouth: [67.5, 24], label: [65.3, 28],
    hook: 'Дал имя стране Индии, но почти весь течёт по Пакистану. Впадает в Аравийское море.',
    fact: 'В долине Инда была одна из древнейших цивилизаций.'},
  {id: 'ganges', type: 'river', name: 'Ганг', cont: 'as', ocean: 'ind', len: '≈ 2 700 км',
    srcText: 'Гималаи', mouthText: 'Бенгальский залив', countries: 'Индия, Бангладеш',
    src: [78.9, 30.9], mouth: [89.5, 22], label: [82, 23.6],
    hook: 'Священная река индийцев. Вместе с Брахмапутрой образует крупнейшую дельту в мире.',
    fact: 'Течёт с запада на восток вдоль Гималаев.'},
  {id: 'ob', type: 'river', name: 'Обь', cont: 'as', ocean: 'arc', len: '≈ 3 650 км (с Иртышом ≈ 5 400 км)',
    srcText: 'Алтай (слияние Бии и Катуни)', mouthText: 'Карское море (Обская губа)', countries: 'Россия',
    src: [85, 52.5], mouth: [69, 66.8], label: [77, 59],
    hook: 'Обь впадает в длинный узкий залив — Обскую губу. С Иртышом — самая длинная река России.',
    fact: 'Течёт по Западно-Сибирской равнине, вокруг много болот.'},
  {id: 'yenisei', type: 'river', name: 'Енисей', cont: 'as', ocean: 'arc', len: '≈ 3 500 км',
    srcText: 'горы Тувы (слияние Большого и Малого Енисея)', mouthText: 'Карское море', countries: 'Россия (и Монголия в верховьях)',
    src: [94.4, 51.7], mouth: [83, 70.1], label: [92.5, 64],
    hook: 'Самая полноводная река России. Делит Сибирь на Западную и Восточную.',
    fact: 'Главный приток — Ангара, вытекает из Байкала.'},
  {id: 'lena', type: 'river', name: 'Лена', cont: 'as', ocean: 'arc', len: '≈ 4 400 км',
    srcText: 'Байкальский хребет', mouthText: 'море Лаптевых', countries: 'Россия',
    src: [108.1, 53.9], mouth: [126, 72.3], label: [121, 61.5],
    hook: 'Начинается рядом с Байкалом, течёт через Якутию на север — в море Лаптевых.',
    fact: 'Целиком течёт по России, в устье — большая дельта.'},
  {id: 'kolyma', type: 'river', name: 'Колыма', cont: 'as', ocean: 'arc', len: '≈ 2 130 км',
    srcText: 'нагорья на северо-востоке России', mouthText: 'Восточно-Сибирское море', countries: 'Россия',
    src: [145.5, 61.6], mouth: [160.8, 68.8], label: [156.5, 64.3],
    hook: 'Самая восточная река нашего списка. Впадает в Восточно-Сибирское море.',
    fact: 'В бассейне Колымы — одни из самых холодных мест Северного полушария.'},
  {id: 'amur', type: 'river', name: 'Амур', cont: 'as', ocean: 'pac', len: '≈ 2 800 км (с Аргунью ≈ 4 400 км)',
    srcText: 'слияние Шилки и Аргуни', mouthText: 'Охотское море (Амурский лиман)', countries: 'Россия, Китай',
    src: [121.5, 53.3], mouth: [140.7, 53], label: [131, 51],
    hook: 'По Амуру проходит граница России и Китая. Течёт на восток, в Охотское море.',
    fact: 'На Амуре стоят Благовещенск, Хабаровск и Комсомольск-на-Амуре.'},
  {id: 'huanghe', type: 'river', name: 'Хуанхэ', cont: 'as', ocean: 'pac', len: '≈ 5 460 км',
    srcText: 'Тибетское нагорье', mouthText: 'Бохайский залив (Жёлтое море)', countries: 'Китай',
    src: [96.2, 34.9], mouth: [119, 37.8], label: [104, 40.8],
    hook: '«Жёлтая река»: несёт много жёлтого лёсса. Делает большую петлю буквой «П».',
    fact: 'Северная из двух великих рек Китая.'},
  {id: 'yangtze', type: 'river', name: 'Янцзы', cont: 'as', ocean: 'pac', len: '≈ 6 300 км',
    srcText: 'Тибетское нагорье', mouthText: 'Восточно-Китайское море', countries: 'Китай',
    src: [98.5, 32], mouth: [121.9, 31.3], label: [111, 27.3],
    hook: 'Самая длинная река Евразии. Южная из двух великих рек Китая, в устье — Шанхай.',
    fact: 'На Янцзы — крупнейшая ГЭС мира «Три ущелья».'},

  {id: 'angel', type: 'fall', name: 'Анхель', cont: 'sa', ocean: 'atl', len: '979 м — самый высокий в мире',
    river: 'река Керепакупай-Меру (бассейн Ориноко)', countries: 'Венесуэла', at: [-62.54, 5.97], label: [-62.5, 9.5],
    hook: 'Самый высокий водопад на Земле — почти километр! Падает со столовой горы на Гвианском плоскогорье.',
    fact: 'Назван в честь лётчика Джимми Энджела (Ангела), который увидел его с самолёта.'},
  {id: 'niagara', type: 'fall', name: 'Ниагарский', cont: 'na', ocean: 'atl', len: '≈ 50 м высотой, ширина ≈ 1 км',
    river: 'река Ниагара, между озёрами Эри и Онтарио', countries: 'США и Канада', at: [-79.07, 43.08], label: [-72, 41],
    hook: 'Стоит на границе США и Канады, на реке между Великими озёрами Эри и Онтарио.',
    fact: 'Один из самых полноводных водопадов мира.'},
  {id: 'victoria', type: 'fall', name: 'Виктория', cont: 'af', ocean: 'ind', len: '≈ 120 м высотой, ширина ≈ 1,8 км',
    river: 'река Замбези', countries: 'Замбия и Зимбабве', at: [25.86, -17.92], label: [21, -20],
    hook: 'На реке Замбези. Местные зовут его «Моси-оа-Тунья» — «гремящий дым».',
    fact: 'Открыл для европейцев Давид Ливингстон в 1855 году и назвал в честь королевы Виктории.'},
  {id: 'iguazu', type: 'fall', name: 'Игуасу', cont: 'sa', ocean: 'atl', len: 'до 82 м, ширина ≈ 2,7 км',
    river: 'река Игуасу (приток Параны)', countries: 'Аргентина и Бразилия', at: [-54.44, -25.69], label: [-46.5, -26.3],
    hook: 'Целая система из почти 300 водопадов на реке Игуасу, недалеко от Параны.',
    fact: 'Самое знаменитое место — ущелье «Глотка дьявола».'},
];
const BY_ID = Object.fromEntries(OBJECTS.map(o => [o.id, o]));
const kindName = o => (o.type === 'river' ? 'река' : 'водопад');
const fullName = o => (o.type === 'river' ? 'река ' + o.name : 'водопад ' + o.name);

/* ---------- Прогресс ---------- */

const STORE_KEY = 'geo-rivers-waterfalls-v1';
let store = {score: {}, drawn: {}};
try {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) store = Object.assign(store, JSON.parse(raw));
} catch (e) { /* без сохранения */ }
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
}
function mark(id, ok) {
  const s = store.score[id] || {ok: 0, streak: 0};
  if (ok) { s.ok++; s.streak++; } else { s.streak = 0; }
  store.score[id] = s;
  save();
}
function level(id) {
  const s = store.score[id];
  if (!s) return 0;
  return s.streak >= 2 ? 2 : (s.ok > 0 ? 1 : 0);
}

/* ---------- Карта ---------- */

const W = 960, H = 500;
const svg = d3.select('#map');
const projection = d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], {type: 'Sphere'});
const path = d3.geoPath(projection);
const G = window.GEO_DATA;

svg.append('defs').append('clipPath').attr('id', 'clip').append('path').attr('d', path({type: 'Sphere'}));
const root = svg.append('g');
const world = root.append('g').attr('clip-path', 'url(#clip)');
world.append('path').attr('class', 'sphere').attr('d', path({type: 'Sphere'}));
world.append('path').attr('class', 'grat').attr('d', path(d3.geoGraticule10()));
world.append('path').attr('class', 'land').attr('d', path(topojson.feature(G.land, G.land.objects.land)));
// d3 ждёт обход колец по часовой стрелке; «вывернутые» озёра разворачиваем.
for (const f of G.lakes.features) {
  f.geometry.coordinates = f.geometry.coordinates
    .map(poly => poly.filter(ring => ring.length >= 4))
    .filter(poly => poly.length);
  if (d3.geoArea(f) > 2 * Math.PI) f.geometry.coordinates.forEach(poly => poly.forEach(ring => ring.reverse()));
}
world.append('path').attr('class', 'lake').attr('d', path(G.lakes));
const borders = world.append('path').attr('class', 'borders').attr('display', 'none')
  .attr('d', path(topojson.mesh(G.countries, G.countries.objects.countries, (a, b) => a !== b)));

const oceanLabels = [
  ['ТИХИЙ ОКЕАН', [-140, 2]], ['ТИХИЙ ОКЕАН', [165, 22]], ['АТЛАНТИЧЕСКИЙ ОКЕАН', [-38, 28]],
  ['ИНДИЙСКИЙ ОКЕАН', [80, -22]], ['СЕВЕРНЫЙ ЛЕДОВИТЫЙ ОКЕАН', [-20, 76]],
];
const oceanG = root.append('g');
oceanG.selectAll('text').data(oceanLabels).join('text').attr('class', 'ocean-lbl')
  .attr('text-anchor', 'middle').text(d => d[0])
  .attr('x', d => projection(d[1])[0]).attr('y', d => projection(d[1])[1]);

const riversG = root.append('g');
const marksG = root.append('g');
const fallsG = root.append('g');
const labelsG = root.append('g');

// Спроецированные линии для «попадания» по клику.
const rivers = OBJECTS.filter(o => o.type === 'river');
const falls = OBJECTS.filter(o => o.type === 'fall');
for (const r of rivers) {
  r.geo = {type: 'MultiLineString', coordinates: G.rivers[r.id]};
  r.lines = G.rivers[r.id].map(l => l.map(c => projection(c)));
  const pts = r.lines.flat();
  r.srcXY = nearestVertex(pts, projection(r.src));
  r.mouthXY = nearestVertex(pts, projection(r.mouth));
}
for (const f of falls) f.xy = projection(f.at);
for (const o of OBJECTS) o.labelXY = projection(o.label);

function nearestVertex(pts, p) {
  let best = pts[0], bd = Infinity;
  for (const q of pts) {
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = dx * dx + dy * dy;
  let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function distTo(o, p) {
  if (o.type === 'fall') return Math.hypot(p[0] - o.xy[0], p[1] - o.xy[1]) * 0.75; // водопады чуть «крупнее»
  let best = Infinity;
  for (const l of o.lines) for (let i = 1; i < l.length; i++) best = Math.min(best, segDist(p, l[i - 1], l[i]));
  return best;
}

const riverSel = riversG.selectAll('path').data(rivers).join('path')
  .attr('class', 'river').attr('data-ocean', d => d.ocean).attr('d', d => path(d.geo))
  .attr('vector-effect', 'non-scaling-stroke');
const fallSel = fallsG.selectAll('circle').data(falls).join('circle')
  .attr('class', 'fall').attr('cx', d => d.xy[0]).attr('cy', d => d.xy[1]);
const labelSel = labelsG.selectAll('text').data(OBJECTS).join('text')
  .attr('class', d => 'lbl' + (d.type === 'fall' ? ' fall-lbl' : ''))
  .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
  .attr('x', d => d.labelXY[0]).attr('y', d => d.labelXY[1])
  .text(d => d.name);

let zoomK = 1;
function scaleUi() {
  const k = zoomK;
  const fs = Math.max(7, 10.5 - (k - 1) * 0.15);
  labelSel.attr('font-size', fs / k).attr('stroke-width', 3 / k);
  oceanG.selectAll('text').attr('font-size', 11 / k);
  fallSel.attr('r', d => (d.sel ? 7 : 5) / k).attr('stroke-width', 1.5 / k);
  marksG.selectAll('circle').attr('r', 5.5 / k).attr('stroke-width', 1.5 / k);
  marksG.selectAll('text').attr('font-size', 11 / k).attr('stroke-width', 3 / k)
    .attr('dy', -9 / k);
  marksG.selectAll('.pulse').attr('r', 9 / k).attr('stroke-width', 2.5 / k);
}

const zoom = d3.zoom().scaleExtent([1, 14]).translateExtent([[0, 0], [W, H]]).clickDistance(6)
  .on('zoom', ev => {
    root.attr('transform', ev.transform);
    zoomK = ev.transform.k;
    scaleUi();
  });
svg.call(zoom).on('dblclick.zoom', null);
d3.select('#zin').on('click', () => svg.transition().duration(300).call(zoom.scaleBy, 1.6));
d3.select('#zout').on('click', () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.6));
d3.select('#zreset').on('click', () => resetView());

function resetView() { svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity); }
function zoomToObject(o, pad = 1) {
  let x0, y0, x1, y1;
  if (o.type === 'fall') {
    [x0, y0] = [o.xy[0] - 40, o.xy[1] - 25]; [x1, y1] = [o.xy[0] + 40, o.xy[1] + 25];
  } else {
    [[x0, y0], [x1, y1]] = path.bounds(o.geo);
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const w = Math.max(x1 - x0, 70) * pad * 1.6, h = Math.max(y1 - y0, 40) * pad * 1.6;
  const k = Math.max(1, Math.min(8, W / w, H / h));
  const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-cx, -cy);
  svg.transition().duration(650).call(zoom.transform, t);
}

/* Подсветка */
function clearMarks() {
  marksG.selectAll('*').remove();
  riverSel.classed('sel good wrong dim hover peek', false);
  fallSel.classed('sel good wrong peek', false).each(d => { d.sel = false; });
  labelSel.classed('sel show peek', false);
  scaleUi();
}
function highlight(o, cls = 'sel', opts = {}) {
  const sel = o.type === 'river' ? riverSel.filter(d => d === o) : fallSel.filter(d => d === o);
  sel.classed(cls, true).classed('peek', true).raise();
  if (o.type === 'fall') { o.sel = true; }
  if (opts.label !== false) labelSel.filter(d => d === o).classed('show peek', true).classed('sel', cls === 'sel');
  if (opts.pulse || o.type === 'fall') {
    const p = o.type === 'fall' ? o.xy : o.mouthXY;
    if (o.type === 'fall') marksG.append('circle').attr('class', 'pulse').attr('cx', p[0]).attr('cy', p[1]);
  }
  if (opts.ends && o.type === 'river') {
    for (const [xy, c, t] of [[o.srcXY, 'mk-src', 'исток'], [o.mouthXY, 'mk-mouth', 'устье']]) {
      marksG.append('circle').attr('class', c).attr('cx', xy[0]).attr('cy', xy[1]);
      marksG.append('text').attr('class', 'mk-text').attr('text-anchor', 'middle').attr('x', xy[0]).attr('y', xy[1]).text(t);
    }
  }
  scaleUi();
}

/* Клики и наведение */
const tip = document.getElementById('tip');
function svgPoint(ev) { return d3.pointer(ev, root.node()); }
function tolerance() {
  const px = svg.node().getBoundingClientRect().width / W; // экранных px на единицу viewBox
  return 16 / (px * zoomK);
}
function nearest(p, list = OBJECTS) {
  let best = null, bd = Infinity;
  for (const o of list) { const d = distTo(o, p); if (d < bd) { bd = d; best = o; } }
  return {o: best, d: bd};
}
let hoverObj = null;
svg.on('pointermove', ev => {
  if (ev.pointerType === 'touch' || !['study', 'contour'].includes(mode)) { tip.hidden = true; return; }
  if (document.body.classList.contains('hide-objects')) return;
  const {o, d} = nearest(svgPoint(ev));
  const hit = d < tolerance() ? o : null;
  if (hit !== hoverObj) {
    riverSel.classed('hover', x => x === hit);
    hoverObj = hit;
  }
  if (hit) {
    const r = svg.node().parentNode.getBoundingClientRect();
    tip.hidden = false;
    tip.textContent = (hit.type === 'fall' ? 'вдп. ' : '') + hit.name;
    tip.style.left = (ev.clientX - r.left) + 'px';
    tip.style.top = (ev.clientY - r.top) + 'px';
    svg.style('cursor', 'pointer');
  } else {
    tip.hidden = true;
    svg.style('cursor', null);
  }
}).on('pointerleave', () => { tip.hidden = true; riverSel.classed('hover', false); hoverObj = null; });
svg.on('click', ev => {
  const p = svgPoint(ev);
  const {o, d} = nearest(p);
  const hit = d < tolerance() ? o : null;
  if (mode === 'study' && hit) selectStudy(hit.id, false);
  else if (mode === 'contour' && hit && !document.body.classList.contains('hide-objects')) selectStudy(hit.id, false, true);
  else if (mode === 'find') findClick(p, hit);
});

/* Слои */
const body = document.body;
const lyrLabels = document.getElementById('lyrLabels');
const lyrOcean = document.getElementById('lyrOcean');
const lyrBorders = document.getElementById('lyrBorders');
const lyrHide = document.getElementById('lyrHide');
const legend = document.getElementById('legend');
legend.innerHTML = Object.entries(OCEANS)
  .map(([k, v]) => `<li><span class="sw" style="border-color: var(--${k})"></span>${v}</li>`).join('');
function applyLayers() {
  body.classList.toggle('hide-labels', !lyrLabels.checked);
  body.classList.toggle('by-ocean', lyrOcean.checked);
  legend.hidden = !lyrOcean.checked;
  borders.attr('display', lyrBorders.checked ? null : 'none');
  body.classList.toggle('hide-objects', mode === 'contour' && lyrHide.checked);
}
[lyrLabels, lyrOcean, lyrBorders, lyrHide].forEach(i => i.addEventListener('change', applyLayers));

/* ---------- Режимы ---------- */

const panel = document.getElementById('panel');
const promptEl = document.getElementById('prompt');
let mode = 'study';
let labelsPref = true;

document.querySelectorAll('#modes button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

function setMode(m) {
  if (mode === 'study' || mode === 'contour') labelsPref = lyrLabels.checked;
  mode = m;
  document.querySelectorAll('#modes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  body.className = body.className.replace(/\bmode-\S+/g, '').trim();
  body.classList.add('mode-' + m);
  clearMarks();
  promptEl.hidden = true;
  promptEl.className = 'prompt';
  const quiz = m === 'find' || m === 'guess';
  lyrLabels.checked = quiz ? false : labelsPref;
  lyrLabels.disabled = quiz;
  if (m !== 'contour') lyrHide.checked = false;
  applyLayers();
  resetView();
  if (m === 'study') renderStudy();
  else if (m === 'find') renderQuizSetup('find');
  else if (m === 'guess') renderQuizSetup('guess');
  else renderContour();
}

function dot(id) {
  const l = level(id);
  return `<span class="dot${l === 2 ? ' done' : l === 1 ? ' half' : ''}" aria-hidden="true"></span>`;
}
function chipsHtml(selectedId) {
  return CONTINENTS.map(c => {
    const items = OBJECTS.filter(o => o.cont === c.id);
    return `<h3>${c.name}</h3><div class="chips">` + items.map(o =>
      `<button type="button" class="chip${o.type === 'fall' ? ' fall-chip' : ''}" data-id="${o.id}" aria-pressed="${o.id === selectedId}">${dot(o.id)}${o.type === 'fall' ? 'вдп. ' : ''}${o.name}</button>`
    ).join('') + '</div>';
  }).join('');
}

/* Изучение */
let studyId = null;
function renderStudy() {
  const learned = OBJECTS.filter(o => level(o.id) === 2).length;
  panel.innerHTML = `
    <h2>Выбери реку или водопад</h2>
    <p class="small">Нажми на название или прямо на реку на карте. Точка: <span style="color:var(--hl)">●</span> — уже угадывал, <span style="color:var(--ok)">●</span> — выучено (2 раза подряд верно в тренажёре). Выучено: <b>${learned} из ${OBJECTS.length}</b>.</p>
    <div id="card"></div>
    ${chipsHtml(studyId)}`;
  panel.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => selectStudy(b.dataset.id, true)));
  if (studyId) selectStudy(studyId, false);
}
function selectStudy(id, zoomIn, inContour = false) {
  studyId = id;
  const o = BY_ID[id];
  clearMarks();
  riverSel.classed('dim', d => d !== o && o.type === 'river');
  highlight(o, 'sel', {ends: true});
  if (zoomIn) zoomToObject(o);
  if (inContour) { renderContourCard(o); return; }
  panel.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  document.getElementById('card').innerHTML = cardHtml(o);
  document.getElementById('cardZoom').addEventListener('click', () => zoomToObject(o));
  if (!zoomIn && window.innerWidth < 900) document.getElementById('card').scrollIntoView({behavior: 'smooth', block: 'nearest'});
}
function cardHtml(o) {
  const cont = CONTINENTS.find(c => c.id === o.cont).name.replace('Евразия: ', 'Евразия (') + (o.cont === 'eu' || o.cont === 'as' ? ')' : '');
  const rows = o.type === 'river' ? `
      <dt>Материк</dt><dd>${cont}</dd>
      <dt>Исток</dt><dd>${o.srcText}</dd>
      <dt>Устье</dt><dd>${o.mouthText}</dd>
      <dt>Бассейн</dt><dd><span class="badge ${o.ocean}">${OCEANS[o.ocean]}</span></dd>
      <dt>Длина</dt><dd>${o.len}</dd>
      <dt>Страны</dt><dd>${o.countries}</dd>` : `
      <dt>Материк</dt><dd>${cont}</dd>
      <dt>Где</dt><dd>${o.river}</dd>
      <dt>Высота</dt><dd>${o.len}</dd>
      <dt>Страны</dt><dd>${o.countries}</dd>`;
  const howto = o.type === 'river'
    ? `<p class="howto">✏️ <b>На контурной карте:</b> найди исток — ${o.srcText}, проведи синюю линию до устья — ${o.mouthText}. Линия тонкая у истока и толще к устью. Подпиши «${o.name}» вдоль реки.</p>`
    : `<p class="howto">✏️ <b>На контурной карте:</b> поставь значок водопада на реке (${o.river.replace(/ \(.*\)/, '')}) и подпиши «вдп. ${o.name}».</p>`;
  return `<div class="card">
    <div class="kind">${kindName(o)}</div>
    <h2>${o.name}</h2>
    <dl class="facts">${rows}</dl>
    <p class="hook">💡 ${o.hook}</p>
    <p class="small">${o.fact}</p>
    ${howto}
    <div class="row"><button type="button" class="btn" id="cardZoom">🔍 Приблизить на карте</button></div>
  </div>`;
}

/* ---------- Тренажёры ---------- */

let quiz = null;
const quizPrefs = {set: 'all', area: 'all'};
function quizPool() {
  return OBJECTS.filter(o =>
    (quizPrefs.set === 'all' || o.type === quizPrefs.set) &&
    (quizPrefs.area === 'all' || o.cont === quizPrefs.area || (quizPrefs.area === 'ea' && (o.cont === 'eu' || o.cont === 'as'))));
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function segHtml(name, opts, val) {
  return `<div class="seg small-seg" role="group" data-pref="${name}">` + opts.map(([v, t]) =>
    `<button type="button" data-v="${v}" aria-pressed="${v === val}">${t}</button>`).join('') + '</div>';
}
function renderQuizSetup(kind) {
  quiz = null;
  const title = kind === 'find' ? '🎯 Найди на карте' : '❓ Что это?';
  const text = kind === 'find'
    ? 'Я называю реку или водопад — ты нажимаешь на него на карте. Подписей нет, как на настоящем зачёте у доски.'
    : 'На карте подсвечивается река или водопад — выбери правильное название из четырёх.';
  panel.innerHTML = `
    <h2>${title}</h2>
    <p>${text}</p>
    <h3>Что спрашивать</h3>
    ${segHtml('set', [['all', 'Всё'], ['river', 'Реки'], ['fall', 'Водопады']], quizPrefs.set)}
    <h3>Где</h3>
    ${segHtml('area', [['all', 'Весь мир'], ['na', 'Сев. Америка'], ['sa', 'Юж. Америка'], ['af', 'Африка'], ['ea', 'Евразия']], quizPrefs.area)}
    <p class="small" id="poolInfo"></p>
    <div class="row"><button type="button" class="btn primary" id="start">Начать</button></div>`;
  const info = () => { document.getElementById('poolInfo').textContent = `Вопросов: ${quizPool().length}. Ошибки повторятся в конце.`; };
  panel.querySelectorAll('[data-pref]').forEach(g => g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    quizPrefs[g.dataset.pref] = b.dataset.v;
    g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    info();
  })));
  info();
  document.getElementById('start').addEventListener('click', () => startQuiz(kind));
}
function startQuiz(kind) {
  const pool = quizPool();
  if (!pool.length) return;
  quiz = {kind, queue: shuffle(pool.slice()), total: pool.length, done: 0, right: 0, mistakes: new Set(), tries: 0, cur: null, locked: false};
  nextQuestion();
}
function quizHeader() {
  const pct = Math.round(100 * quiz.done / quiz.total);
  return `<div class="row" style="justify-content:space-between;margin-top:0"><span class="score">Верно: ${quiz.right} · Отвечено: ${quiz.done} из ${quiz.total}</span>
    <button type="button" class="btn" id="quit">Заново</button></div>
    <div class="bar"><i style="width:${pct}%"></i></div>`;
}
function bindQuit() { document.getElementById('quit').addEventListener('click', () => renderQuizSetup(quiz.kind)); }
function nextQuestion() {
  clearMarks();
  promptEl.className = 'prompt';
  if (!quiz.queue.length) return finishQuiz();
  quiz.cur = quiz.queue.shift();
  quiz.tries = 0;
  quiz.locked = false;
  if (quiz.kind === 'find') askFind(); else askGuess();
}
function finishQuiz() {
  promptEl.hidden = true;
  resetView();
  const m = [...quiz.mistakes].map(id => BY_ID[id]);
  const pct = Math.round(100 * quiz.right / quiz.total);
  const verdict = pct === 100 ? 'Идеально! Можно идти к доске 🏆' : pct >= 80 ? 'Отлично! Повтори ошибки — и будет идеально.' : 'Неплохо для начала. Повтори ошибки в режиме «Изучать».';
  panel.innerHTML = `
    <h2>Готово!</h2>
    <p class="score" style="font-size:1.3rem">С первого раза: ${quiz.right} из ${quiz.total} (${pct}%)</p>
    <p>${verdict}</p>
    ${m.length ? `<h3>Ошибки — повтори их</h3><ul class="mistakes">${m.map(o => `<li><a href="#" data-id="${o.id}">${fullName(o)}</a></li>`).join('')}</ul>` : ''}
    <div class="row">
      <button type="button" class="btn primary" id="again">Ещё раз</button>
      ${m.length ? '<button type="button" class="btn" id="onlyErr">Только ошибки</button>' : ''}
      <button type="button" class="btn" id="setup">Настройки</button>
    </div>`;
  const kind = quiz.kind;
  panel.querySelectorAll('.mistakes a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); studyId = a.dataset.id; setMode('study'); selectStudy(studyId, true);
  }));
  document.getElementById('again').addEventListener('click', () => startQuiz(kind));
  document.getElementById('setup').addEventListener('click', () => renderQuizSetup(kind));
  const oe = document.getElementById('onlyErr');
  if (oe) oe.addEventListener('click', () => {
    quiz = {kind, queue: shuffle(m.slice()), total: m.length, done: 0, right: 0, mistakes: new Set(), tries: 0, cur: null};
    nextQuestion();
  });
}

/* Найди на карте */
function askFind() {
  const o = quiz.cur;
  promptEl.hidden = false;
  promptEl.innerHTML = `Покажи: <span class="big">${fullName(o)}</span>`;
  panel.innerHTML = quizHeader() + `
    <p>Нажми на <b>${fullName(o)}</b> на карте. Можно приближать карту.</p>
    <div id="fb"></div>
    <div class="row"><button type="button" class="btn" id="hint">Подсказка</button><button type="button" class="btn" id="skip">Не знаю</button></div>`;
  bindQuit();
  document.getElementById('hint').addEventListener('click', () => {
    const c = CONTINENTS.find(c => c.id === o.cont).name;
    feedback(`Подсказка: это ${c}. ${o.type === 'river' ? 'Впадает: ' + o.mouthText + '.' : o.river + '.'}`, '');
    zoomToObject(o, 2.4);
    quiz.tries = Math.max(quiz.tries, 1);
  });
  document.getElementById('skip').addEventListener('click', () => findReveal(false));
}
function feedback(html, cls) {
  const fb = document.getElementById('fb');
  if (fb) fb.innerHTML = `<div class="feedback ${cls}">${html}</div>`;
}
function findClick(p, hit) {
  if (!quiz || quiz.kind !== 'find' || quiz.locked || !quiz.cur) return;
  const o = quiz.cur;
  if (hit === o || (o.type === 'fall' && distTo(o, p) < tolerance() * 1.4)) {
    const first = quiz.tries === 0;
    if (first) quiz.right++;
    else quiz.mistakes.add(o.id);
    mark(o.id, first);
    quiz.done++;
    quiz.locked = true;
    highlight(o, 'good', {ends: o.type === 'river'});
    promptEl.className = 'prompt ok';
    promptEl.innerHTML = `✅ Верно! Это <span class="big">${fullName(o)}</span>`;
    feedback(o.hook, 'ok');
    afterAnswer();
    return;
  }
  quiz.tries++;
  clearMarks();
  if (hit) {
    highlight(hit, 'wrong');
    feedback(`❌ Это <b>${fullName(hit)}</b>. Ищи дальше!`, 'bad');
  } else {
    marksG.append('circle').attr('class', 'mk-mouth').attr('cx', p[0]).attr('cy', p[1]).style('fill', 'var(--bad)');
    scaleUi();
    feedback('❌ Здесь нет рек и водопадов из списка. Попробуй ещё!', 'bad');
  }
  if (quiz.tries >= 3) findReveal(true);
}
function findReveal(afterTries) {
  const o = quiz.cur;
  quiz.mistakes.add(o.id);
  mark(o.id, false);
  quiz.done++;
  quiz.locked = true;
  quiz.queue.push(o); // повторим в конце
  quiz.total++;
  clearMarks();
  highlight(o, 'sel', {ends: o.type === 'river'});
  zoomToObject(o, 1.8);
  promptEl.className = 'prompt bad';
  promptEl.innerHTML = `Вот она: <span class="big">${fullName(o)}</span>`;
  feedback(`${afterTries ? 'Три попытки — смотри, где она. ' : ''}${o.hook} Этот вопрос повторится в конце.`, 'bad');
  afterAnswer();
}
function afterAnswer() {
  const fb = document.getElementById('fb');
  const row = panel.querySelector('.row:last-child');
  row.innerHTML = '<button type="button" class="btn primary" id="next">Дальше →</button>';
  document.getElementById('next').addEventListener('click', () => { resetView(); nextQuestion(); });
  document.getElementById('next').focus({preventScroll: true});
  panel.querySelector('.score').textContent = `Верно: ${quiz.right} · Отвечено: ${quiz.done} из ${quiz.total}`;
  panel.querySelector('.bar i').style.width = Math.round(100 * quiz.done / quiz.total) + '%';
  if (fb && window.innerWidth < 900) fb.scrollIntoView({behavior: 'smooth', block: 'nearest'});
}

/* Что это? */
function askGuess() {
  const o = quiz.cur;
  highlight(o, 'sel', {label: false, pulse: true});
  if (o.type === 'river') riverSel.classed('dim', d => d !== o);
  zoomToObject(o, 2.6);
  // варианты: того же типа, сначала соседи по материку
  const same = OBJECTS.filter(x => x !== o && x.type === o.type);
  const isEA = x => x.cont === 'eu' || x.cont === 'as';
  const near = shuffle(same.filter(x => x.cont === o.cont || (isEA(x) && isEA(o))));
  const opts = [...new Set([...near, ...shuffle(same)])].slice(0, 3);
  const all = shuffle([o, ...opts]);
  promptEl.hidden = false;
  promptEl.innerHTML = `Что это за ${o.type === 'river' ? 'река' : 'водопад'}?`;
  panel.innerHTML = quizHeader() + `
    <p>Посмотри на ${o.type === 'river' ? 'подсвеченную реку' : 'подсвеченный водопад'} на карте.</p>
    <div class="opts">${all.map(x => `<button type="button" class="opt" data-id="${x.id}">${x.name}</button>`).join('')}</div>
    <div id="fb"></div>
    <div class="row"></div>`;
  bindQuit();
  panel.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => guessPick(b)));
}
function guessPick(btn) {
  if (quiz.locked) return;
  const o = quiz.cur;
  const pick = BY_ID[btn.dataset.id];
  if (pick === o) {
    const first = quiz.tries === 0;
    if (first) quiz.right++; else quiz.mistakes.add(o.id);
    mark(o.id, first);
    quiz.done++;
    quiz.locked = true;
    btn.classList.add('good');
    panel.querySelectorAll('.opt').forEach(b => { b.disabled = true; });
    clearMarks();
    highlight(o, 'good', {ends: o.type === 'river'});
    promptEl.className = 'prompt ok';
    promptEl.innerHTML = `✅ Верно! Это <span class="big">${fullName(o)}</span>`;
    feedback(`${o.hook}`, 'ok');
    afterAnswer();
  } else {
    quiz.tries++;
    btn.classList.add('bad');
    btn.disabled = true;
    const hint = pick.type === 'river' ? `${pick.name} впадает: ${pick.mouthText} (${CONTINENTS.find(c => c.id === pick.cont).name}).` : `${pick.name} — ${pick.river}.`;
    feedback(`❌ Нет. ${hint} Попробуй ещё!`, 'bad');
  }
}

/* ---------- Контурная карта ---------- */

function renderContour() {
  const drawn = OBJECTS.filter(o => store.drawn[o.id]).length;
  panel.innerHTML = `
    <h2>✏️ Контурная карта, стр. 12–13</h2>
    <p class="small">Карта выглядит как контурная. Нажми на реку — увидишь исток и устье. Включи «Спрятать реки», чтобы проверить себя, или распечатай карту-образец.</p>
    <h3>Как правильно наносить</h3>
    <ol class="steps">
      <li>Сначала найди реку в атласе: где <b>исток</b>, где <b>устье</b>, через какие горы и равнины течёт.</li>
      <li>Веди реку <b>синим</b> карандашом или ручкой от истока к устью. У истока линия тоньше, к устью — толще.</li>
      <li>Название пиши <b>вдоль реки</b>, мелко и аккуратно, не перечёркивая линию.</li>
      <li>Водопад — условный знак (например, ✕ или две короткие чёрточки поперёк реки) и подпись «вдп. Анхель».</li>
      <li>Если подпись не помещается — поставь цифру, а расшифровку напиши в легенде.</li>
    </ol>
    <div class="row">
      <button type="button" class="btn" id="print">🖨 Печать карты-образца</button>
    </div>
    <div id="card"></div>
    <h3>Что уже нанесено: <span id="drawnCount">${drawn}</span> из ${OBJECTS.length}</h3>
    <div class="bar"><i id="drawnBar" style="width:${Math.round(100 * drawn / OBJECTS.length)}%"></i></div>
    <ul class="checklist">${OBJECTS.map(o => `<li><label><input type="checkbox" data-id="${o.id}"${store.drawn[o.id] ? ' checked' : ''}>${o.type === 'fall' ? 'вдп. ' : ''}${o.name}</label></li>`).join('')}</ul>`;
  document.getElementById('print').addEventListener('click', () => {
    lyrHide.checked = false; lyrLabels.checked = true; applyLayers(); clearMarks(); resetView();
    setTimeout(() => window.print(), 600);
  });
  panel.querySelectorAll('.checklist input').forEach(i => i.addEventListener('change', () => {
    store.drawn[i.dataset.id] = i.checked;
    save();
    const n = OBJECTS.filter(o => store.drawn[o.id]).length;
    document.getElementById('drawnCount').textContent = n;
    document.getElementById('drawnBar').style.width = Math.round(100 * n / OBJECTS.length) + '%';
  }));
  panel.querySelectorAll('.checklist label').forEach(l => l.addEventListener('mouseenter', () => {
    const o = BY_ID[l.querySelector('input').dataset.id];
    clearMarks(); highlight(o, 'sel', {ends: true});
  }));
}
function renderContourCard(o) {
  const c = document.getElementById('card');
  if (!c) return;
  c.innerHTML = `<div class="card"><div class="kind">${kindName(o)}</div><h2>${o.name}</h2>` +
    (o.type === 'river'
      ? `<p><b>Исток:</b> ${o.srcText}<br><b>Устье:</b> ${o.mouthText}</p>`
      : `<p>${o.river}</p>`) + '</div>';
}

/* старт */
body.classList.add('mode-study');
applyLayers();
scaleUi();
renderStudy();
