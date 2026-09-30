/* Средние века: понятия. 6 класс. */
(function () {
'use strict';

const GROUPS = {
  feudal: { title: 'Феодальное общество', intro: 'Кто кому служит и кто кого кормит: земля, сеньоры, вассалы и крестьяне.' },
  church: { title: 'Церковь', intro: 'Первое сословие: кто в нём главный, откуда деньги и как боролись с несогласными.' },
  town:   { title: 'Город и деревня', intro: 'Как работали ремесленники, торговали купцы и пахали крестьяне.' }
};

const TERMS = [
  { id: 'feodalizm', group: 'feudal', term: 'Феодализм',
    short: 'Строй, где земля у феодалов, а работают на ней зависимые крестьяне.',
    def: 'Общественный строй Средних веков: вся земля принадлежит феодалам (королю, герцогам, графам, баронам, рыцарям), а зависимые крестьяне обрабатывают её и несут повинности. Феодалы связаны между собой «феодальной лестницей»: старший (сеньор) даёт младшему (вассалу) землю за военную службу.',
    mnemo: '<b>Феод</b> — это земля, которую дают за службу. Феод‑ализм = «строй, где всё держится на феодах». Запомни лестницу: <b>король → герцоги и графы → бароны → рыцари</b>. Крестьяне на лестнице не стоят — они внизу и кормят всех.',
    extra: ['Правило: «Вассал моего вассала — не мой вассал». Барон подчиняется графу, но не обязан слушаться короля напрямую.', 'Феодал = владелец феода. Сеньор и вассал — это роли: граф вассал короля, но сеньор для своих баронов.'],
    img: 'svg:feudal', caption: 'Схема феодальной лестницы. Нажми на ступеньку.' },
  { id: 'senior', group: 'feudal', term: 'Синьор', alt: ['сеньор'],
    short: '«Старший»: феодал, давший вассалу землю.',
    def: 'Сеньор (от латинского senior — «старший») — феодал, который передал часть своей земли (феод) другому феодалу и стал его господином. Тот, кто получил землю, — вассал: он обязан ему военной службой, советом и помощью.',
    mnemo: '<b>Senior = старший.</b> В школе старшие — «сеньоры», младшие — «юниоры». Сеньор старше по лестнице, поэтому вассал перед ним <b>встаёт на колени</b> и вкладывает свои руки в его руки — это и нарисовано на миниатюре.',
    extra: ['Обряд принесения клятвы называется оммаж (от французского homme — «человек»): вассал становится «человеком» сеньора.', 'Сеньор обязан защищать вассала, а вассал — воевать за сеньора обычно 40 дней в году.'],
    img: 'img/senior.jpg', pos: 'center', caption: 'Граф Рамон Гифре принимает оммаж вассала. Liber feudorum maior, XII в.',
    credit: 'Liber feudorum maior (ок. 1190), Архив Арагонской короны — Wikimedia Commons, public domain' },
  { id: 'rytsar', group: 'feudal', term: 'Рыцарь',
    short: 'Конный воин‑феодал в доспехах.',
    def: 'Рыцарь — конный воин, мелкий феодал, низшая ступень феодальной лестницы. Владел небольшим поместьем, за которое служил сеньору в войске. Должен был соблюдать кодекс чести: верность сеньору, защита слабых, храбрость.',
    mnemo: 'Немецкое <b>Ritter</b> = «всадник», от reiten — «ездить верхом». Рыцарь без коня — не рыцарь: доспехи, конь и оруженосец стоили как целая деревня, поэтому рыцарем мог быть только землевладелец.',
    extra: ['Мальчика в 7 лет отдавали пажом, в 14 — оруженосцем, в 21 — посвящали в рыцари ударом меча по плечу.', 'Турнир — состязание рыцарей; герб на щите — чтобы узнать воина в закрытом шлеме.'],
    img: 'img/knight.jpg', pos: 'center', caption: 'Рыцарь Гартман фон Ауэ. Манесский кодекс, ок. 1300.',
    credit: 'Codex Manesse, fol. 184v (ок. 1300–1340), Гейдельбергская библиотека — Wikimedia Commons, public domain' },
  { id: 'sosloviya', group: 'feudal', term: 'Сословия',
    short: 'Большие группы людей с наследственными правами и обязанностями.',
    def: 'Сословия — большие группы людей, имеющие одинаковые права и обязанности, которые передаются по наследству. В Средние века общество делили на три такие группы: духовенство («те, кто молится»), рыцарство («те, кто воюет») и крестьяне с горожанами («те, кто трудится»).',
    mnemo: 'Три сословия = три дела: <b>молятся, воюют, трудятся.</b> На миниатюре стоят все трое: монах, рыцарь и крестьянин с лопатой. Из сословия нельзя выйти: сын рыцаря — рыцарь, сын крестьянина — крестьянин.',
    extra: ['Считалось, что такой порядок установлен Богом, поэтому менять его нельзя.', 'Первые два сословия не платили налоги и жили за счёт третьего.'],
    img: 'img/estates.jpg', pos: 'center', caption: 'Монах, рыцарь и крестьянин — три сословия. Французская рукопись, XIII в.',
    credit: 'Инициал из французской рукописи XIII в. (British Library, Sloane 2435) — Wikimedia Commons, public domain' },
  { id: 'povinnosti', group: 'feudal', term: 'Повинности',
    short: 'Принудительные обязанности крестьян в пользу феодала.',
    def: 'Повинности — принудительные обязанности зависимых крестьян в пользу феодала за пользование землёй. Главные из них: барщина (работа на господской земле) и оброк (часть продуктов или деньги).',
    mnemo: '<b>Повинен = обязан, виноват.</b> Крестьянин «повинен» отработать и отдать. Формула для диктанта: <b>повинности = барщина + оброк.</b>',
    extra: ['За пользование мельницей, печью, прессом феодала тоже платили — это «баналитеты».', 'Крестьяне сами кормили себя, феодала и церковь: три рта на одно хозяйство.'],
    img: 'img/povinnosti.jpg', pos: 'center 80%', caption: 'Пахота, виноградник и сев у стен замка. «Роскошный часослов герцога Беррийского», март, ок. 1412–1416.',
    credit: 'Братья Лимбург, «Роскошный часослов герцога Беррийского», лист «Март» (ок. 1412–1416) — Wikimedia Commons, public domain' },
  { id: 'barshchina', group: 'feudal', term: 'Барщина',
    short: 'Работа крестьян на господской земле.',
    def: 'Барщина — все даровые работы крестьян в хозяйстве феодала: пахать и убирать господское поле, строить и чинить его замок, мосты, дороги, возить грузы. Работали своими орудиями и на своих лошадях.',
    mnemo: '<b>Барщина — работа на барина.</b> На миниатюре крестьяне жнут, а над ними стоит управляющий с палкой — это и есть барщина: работаешь не себе, а барину, и за тобой следят.',
    extra: ['Обычно 2–3 дня в неделю, в страду — больше.', 'Сравни: барщина — отдаёшь труд, оброк — отдаёшь продукты.'],
    img: 'img/barshchina.jpg', pos: 'center', caption: 'Жатва под надзором управляющего. Псалтирь королевы Марии, ок. 1310.',
    credit: 'Псалтирь королевы Марии (British Library, Royal 2 B VII), ок. 1310 — Wikimedia Commons, public domain' },
  { id: 'obrok', group: 'feudal', term: 'Оброк',
    short: 'Часть продуктов (или деньги), которую крестьянин отдавал феодалу.',
    def: 'Оброк — доля продуктов своего хозяйства (зерно, скот, птица, яйца, масло, полотно) или деньги, которые зависимые крестьяне регулярно отдавали феодалу за пользование землёй.',
    mnemo: '<b>Оброк — отдать кусок.</b> На гравюре крестьяне несут господину гуся, корзину яиц, деньги. Оброк «носят», барщину «отрабатывают». Оброк натуральный (продукты) и денежный.',
    extra: ['С ростом городов феодалы всё чаще требовали оброк деньгами — крестьянам приходилось везти продукты на рынок.'],
    img: 'img/obrok.jpg', pos: 'center', caption: 'Крестьяне приносят господину подати. Гравюра XV–XVI в.',
    credit: 'Гравюра XV–XVI в. «Крестьянские подати» — Wikimedia Commons, public domain' },
  { id: 'natural', group: 'feudal', term: 'Натуральное хозяйство', alt: ['натуральное', 'натуральное хоз-во'],
    short: 'Всё нужное производят сами, для себя, а не для продажи.',
    def: 'Натуральное хозяйство — хозяйство, в котором всё необходимое для жизни (еда, одежда, орудия, посуда) производится самими людьми для собственного потребления, а не для продажи. Торговля при этом почти не нужна.',
    mnemo: '<b>«Натурой», а не деньгами.</b> Посмотри на зимний двор: овцы дают шерсть, ульи — мёд, голубятня — птицу, дрова рубят рядом, хлеб пекут сами. Ничего не покупают. Противоположность — <b>товарное</b> хозяйство, где делают на продажу.',
    extra: ['Раннее Средневековье почти целиком жило натуральным хозяйством: дороги плохие, денег мало, городов почти нет.', 'С ростом городов в XI–XIII вв. натуральное хозяйство постепенно уступает торговле.'],
    img: 'img/natural.jpg', pos: 'center 70%', caption: 'Зимний двор: овчарня, ульи, голубятня, дровосек. «Роскошный часослов», февраль.',
    credit: 'Братья Лимбург, «Роскошный часослов герцога Беррийского», лист «Февраль» (ок. 1412–1416) — Wikimedia Commons, public domain' },

  { id: 'duhovenstvo', group: 'church', term: 'Духовенство',
    short: 'Служители церкви: первое сословие.',
    def: 'Духовенство — служители церкви: папа римский, кардиналы, епископы, священники, монахи. Первое сословие Средневековья, «те, кто молится». Делилось на белое (священники, служившие среди людей) и чёрное (монахи).',
    mnemo: 'Духовенство заботится о <b>духе</b>, о душе. Самый узнаваемый его знак — папа в высокой <b>тиаре</b> (тройной короне), как на фреске.',
    extra: ['Духовенство было самым образованным сословием: книги, школы и университеты были при церкви.', 'Церковь владела примерно третью всех земель Европы.'],
    img: 'img/clergy.jpg', pos: 'center 30%', caption: 'Папа Иннокентий III. Фреска монастыря Субиако, XIII в.',
    credit: 'Фреска «Папа Иннокентий III», монастырь Сакро-Спеко в Субиако, XIII в. — Wikimedia Commons, public domain' },
  { id: 'ierarhiya', group: 'church', term: 'Иерархия',
    short: 'Лестница чинов от низших к высшим.',
    def: 'Иерархия (от греческого «священная власть») — расположение чинов и должностей ступенями от низших к высшим, где каждый подчиняется тому, кто выше. Например, в церкви: папа римский → кардиналы → архиепископы → епископы → священники.',
    mnemo: '<b>Иер-архия</b>: «архи» — как в словах <b>архи</b>епископ и мон<b>архи</b>я, значит «власть». Иерархия — это <b>лестница власти</b>. Феодальная лестница — тоже иерархия, только светская.',
    extra: ['Слово «иерархия» сегодня используют для любой лестницы подчинения: в армии, в фирме, в школе.'],
    img: 'svg:church', caption: 'Церковная иерархия. Нажми на ступеньку.' },
  { id: 'orden', group: 'church', term: 'Монашеский орден', alt: ['орден', 'монашеский орден'],
    short: 'Объединение монахов с единым уставом.',
    def: 'Монашеский орден — объединение монастырей и монахов, живущих по единому уставу (правилам). Известные примеры: бенедиктинцы (самый древний), францисканцы (нищенствующие проповедники, основатель Франциск Ассизский), доминиканцы (борцы с ересями).',
    mnemo: 'Латинское <b>ordo = порядок, строй</b>. Орден — монахи, которые живут «в строю», по одним правилам. На фреске Джотто Франциск Ассизский стоит на коленях перед папой: тот <b>утверждает устав</b> нового ордена.',
    extra: ['Монах даёт три обета: бедности, послушания и безбрачия.', 'Девиз бенедиктинцев: «Молись и трудись».'],
    img: 'img/order.jpg', pos: 'center', caption: 'Папа утверждает устав ордена Франциска. Джотто, ок. 1297–1300.',
    credit: 'Джотто, «Утверждение устава» из цикла о св. Франциске, базилика в Ассизи (ок. 1297–1300) — Wikimedia Commons, public domain' },
  { id: 'desyatina', group: 'church', term: 'Церковная десятина', alt: ['десятина'],
    short: 'Налог в пользу церкви: десятая часть доходов.',
    def: 'Церковная десятина — налог в пользу церкви: десятая часть урожая, приплода скота и других доходов, которую обязаны были отдавать все верующие.',
    mnemo: '<b>Десятина = десятая часть.</b> Собрал 10 мешков — один неси в церковь. На картине крестьяне как раз тащат мешки к священнику с тетрадью.',
    extra: ['Для хранения десятины строили огромные «десятинные амбары».', 'Десятина + плата за обряды + дары земли сделали церковь богатейшим феодалом Европы.'],
    img: 'img/tithe.jpg', pos: 'center', caption: 'Сбор десятины: крестьяне несут мешки священнику. Б. Норденберг, 1865.',
    credit: 'Бенгт Норденберг, «Сбор десятины в Сконе» (1865), Национальный музей Швеции — Wikimedia Commons, public domain' },
  { id: 'inkvizitsiya', group: 'church', term: 'Инквизиция',
    short: 'Церковный суд для борьбы с еретиками.',
    def: 'Инквизиция (от латинского inquisitio — «расследование, розыск») — особый церковный суд, созданный в XIII веке для поиска и наказания еретиков (людей, чьи взгляды расходились с учением церкви). Применяла доносы, пытки, а упорных еретиков передавала светским властям для сожжения.',
    mnemo: '<b>Инквизиция = расследование</b> (как «инспектор»: ин-, «внутрь», + quaero, «ищу»). На картине Берругете доминиканцы сидят на помосте, как судьи, а внизу еретиков ведут на костёр.',
    extra: ['Инквизицией чаще всего руководили доминиканцы — их прозвали «псы Господни».', 'Ересь — от греческого «выбор»: еретик «выбрал» своё учение вместо церковного.'],
    img: 'img/inquisition.jpg', pos: 'center 25%', caption: 'Суд инквизиции (аутодафе). П. Берругете, ок. 1495.',
    credit: 'Педро Берругете, «Св. Доминик на аутодафе» (ок. 1495), Прадо — Wikimedia Commons, public domain' },

  { id: 'tsekh', group: 'town', term: 'Цех',
    short: 'Союз ремесленников одной специальности в городе.',
    def: 'Цех — союз ремесленников одной специальности в средневековом городе (пекарей, ткачей, кузнецов). В нём состояли мастера; у мастера работали подмастерья (за плату) и ученики (бесплатно, за науку). Такой союз защищал своих членов от конкуренции и следил за качеством.',
    mnemo: 'Цех — <b>ремесленники</b>, гильдия — <b>купцы</b>. На листе из книги нюрнбергского приюта портной кроит сукно — типичный мастер цеха. Слово живо до сих пор: «сборочный цех» на заводе.',
    extra: ['Чтобы стать мастером, подмастерье делал «шедевр» — образцовое изделие — и платил взнос.', 'Цех = не здание, а организация; он же ополчение города и «клуб» со своей церковью и знаменем.'],
    img: 'img/tsekh.jpg', pos: 'center 40%', caption: 'Портной за работой. Книга братства Менделя, Нюрнберг, XV в.',
    credit: 'Hausbuch der Mendelschen Zwölfbrüderstiftung, Нюрнберг (XV в.), лист 18r — Wikimedia Commons, public domain' },
  { id: 'ustav', group: 'town', term: 'Устав',
    short: 'Правила цеха: сколько, как и по какой цене делать.',
    def: 'Устав — свод правил, обязательных для всех членов цеха (или ордена). Такой свод правил определял, сколько изделий делать, из какого сырья, какого качества, по какой цене продавать, сколько держать учеников и подмастерьев, сколько часов работать.',
    mnemo: 'Устав <b>уст-анавливает</b> правила. Это грамота с печатью, как на фото: написано — значит закон для всего цеха. Нарушил устав — штраф или изгнание из цеха.',
    extra: ['Устав запрещал работать ночью и переманивать покупателей — чтобы никто не разбогател за счёт других.', 'У монашеского ордена тоже устав: слово одно, смысл тот же — единые правила.'],
    img: 'img/ustav.jpg', pos: 'center 20%', caption: 'Цеховая грамота с печатью. Базель.',
    credit: 'Цеховая грамота (Zunftbrief) цеха садовников Базеля, фото Thierry Bosshart — Wikimedia Commons, CC BY-SA 4.0' },
  { id: 'gildiya', group: 'town', term: 'Гильдия',
    short: 'Союз купцов для защиты и взаимопомощи.',
    def: 'Гильдия — союз купцов одного города для защиты в пути, взаимопомощи и получения торговых привилегий. Купцы ездили вместе, нанимали охрану, помогали ограбленным, добивались льгот у правителей.',
    mnemo: 'Гильдия — <b>купцы</b>, цех — ремесленники. Английское guild созвучно с <b>gold</b>: купцы, золото, весы — как на миниатюре, где торговцы взвешивают монеты.',
    extra: ['Самый известный союз купцов — Ганза, объединившая десятки городов на Балтике и Северном море.', 'Гильдия купцов и цех ремесленников устроены похоже: собрание, старшины, касса, общие праздники.'],
    img: 'img/guild.jpg', pos: 'center', caption: 'Купцы взвешивают товар и деньги. Рукопись Монтекассино, XI в.',
    credit: 'Рабан Мавр, «De rerum naturis», Монтекассино, MS Casin. 132 (ок. 1022–1032) — Wikimedia Commons, public domain' },
  { id: 'yarmarka', group: 'town', term: 'Ярмарка',
    short: 'Большие ежегодные торги, куда съезжались купцы из разных стран.',
    def: 'Ярмарка — большие торги, устраиваемые регулярно (обычно раз в год) в определённом месте, куда съезжались купцы из разных стран. Самые известные проходили в Шампани (Франция) и в Ланди под Парижем.',
    mnemo: 'Немецкое <b>Jahrmarkt = «годовой рынок»</b> (Jahr — год, Markt — рынок). Отличие от обычного рынка: раз в год, съезд издалека, товары со всего света. На миниатюре епископ благословляет открытие ярмарки Ланди.',
    extra: ['На ярмарках появились менялы и ростовщики — будущие банкиры.', 'Ярмарка длилась неделями: сначала торговали сукном, потом кожей, потом взвешивали товары и рассчитывались.'],
    img: 'img/fair.jpg', pos: 'center 40%', caption: 'Ярмарка Ланди под Парижем. «Большие французские хроники», ок. 1330.',
    credit: 'Миниатюра «Ярмарка Ланди», Большие французские хроники (ок. 1330) — Wikimedia Commons, public domain' },
  { id: 'trehpolye', group: 'town', term: 'Трёхполье', alt: ['трехполье', 'трёхполье', 'трёхполная система', 'трехпольная система'],
    short: 'Пашня делится на три поля: озимое, яровое и пар.',
    def: 'Трёхполье — система земледелия, при которой пашня делится на три поля: первое засевают осенью озимыми (рожь, пшеница), второе весной яровыми (овёс, ячмень), третье оставляют «под паром» — отдыхать. Каждый год поля меняются местами.',
    mnemo: '<b>Три поля, одно отдыхает</b> — как три игрока, один из которых сидит на скамейке запасных. Нажми «Следующий год» на схеме и посмотри, как поля меняются по кругу. Раньше было двуполье: половина земли простаивала, теперь только треть.',
    extra: ['Трёхполье + тяжёлый плуг + хомут для лошади = больше хлеба, а значит, больше людей и городов в XI–XIII вв.', 'Озимые сеют осенью, они зимуют под снегом; яровые сеют весной.'],
    img: 'svg:field', caption: 'Схема трёхполья. Нажми «Следующий год».' }
];

/* ---------- SVG diagrams ---------- */
const FEUDAL_LEVELS = [
  { id: 'king', label: 'Король', note: '<b>Король</b> — верховный сеньор. Раздаёт крупные земли герцогам и графам, за это они приводят ему войско. Своего сеньора у короля нет.' },
  { id: 'dukes', label: 'Герцоги и графы', note: '<b>Герцоги и графы</b> — вассалы короля и сеньоры для баронов. Правят целыми областями, имеют своё войско и суд.' },
  { id: 'barons', label: 'Бароны', note: '<b>Бароны</b> — вассалы графов, сеньоры для рыцарей. Владеют несколькими деревнями и замком.' },
  { id: 'knights', label: 'Рыцари', note: '<b>Рыцари</b> — низшая ступень. Вассалы баронов, а своих вассалов у них нет. Одна деревня, конь и доспехи.' },
  { id: 'peasants', label: 'Крестьяне', note: '<b>Крестьяне</b> — не на лестнице: они не вассалы, а зависимые люди. Кормят всех, кто выше, через барщину и оброк.' }
];

function svgFeudal(interactive) {
  const w = 400, h = 300, rows = 4, top = 30, rowH = 50;
  let s = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" role="img" aria-label="Феодальная лестница">`;
  s += `<rect width="${w}" height="${h}" fill="#f4ead8"/>`;
  for (let i = 0; i < rows; i++) {
    const lvl = FEUDAL_LEVELS[i];
    const y = top + i * rowH, half = 40 + i * 42;
    const x1 = w / 2 - half, x2 = w / 2 + half, x1b = w / 2 - half - 42, x2b = w / 2 + half + 42;
    const fill = ['#c0392b', '#d35400', '#e67e22', '#f39c12'][i];
    s += `<g class="lvl" data-lvl="${lvl.id}"><path d="M${x1},${y} L${x2},${y} L${x2b},${y + rowH - 4} L${x1b},${y + rowH - 4} Z" fill="${fill}" stroke="#5a2d0c" stroke-width="2"/>`;
    s += `<text x="${w / 2}" y="${y + rowH / 2 + 3}" text-anchor="middle" fill="#fff" font-size="16" font-weight="700">${lvl.label}</text></g>`;
  }
  const py = top + rows * rowH + 6;
  s += `<g class="lvl" data-lvl="peasants"><rect x="20" y="${py}" width="${w - 40}" height="44" rx="6" fill="#7d9b4a" stroke="#3b4d1c" stroke-width="2"/>`;
  s += `<text x="${w / 2}" y="${py + 27}" text-anchor="middle" fill="#fff" font-size="16" font-weight="700">Крестьяне (не на лестнице)</text></g>`;
  s += `<text x="12" y="${top + rowH * 2 + 4}" fill="#5a2d0c" font-size="12" transform="rotate(-90 12 ${top + rowH * 2 + 4})" text-anchor="middle">сеньоры ↑  ·  вассалы ↓</text>`;
  s += `</svg>`;
  return s;
}

const CHURCH_LEVELS = [
  { id: 'pope', label: 'Папа римский', sub: 'глава всей церкви', note: '<b>Папа римский</b> — глава католической церкви, «наместник Бога на земле». Живёт в Риме, назначает кардиналов и епископов, может отлучить от церкви даже короля.' },
  { id: 'cardinals', label: 'Кардиналы', sub: 'советники папы', note: '<b>Кардиналы</b> — ближайшие помощники папы, носят красные одежды. Из них выбирают нового папу.' },
  { id: 'archbishops', label: 'Архиепископы', sub: 'главные над епископами', note: '<b>Архиепископы</b> — старшие епископы: возглавляют церковь целой большой области (например, Кентерберийский в Англии).' },
  { id: 'bishops', label: 'Епископы', sub: 'глава церкви области', note: '<b>Епископы</b> — глава церкви в своём округе (епархии), сидят в главном соборе города. Часто крупные феодалы.' },
  { id: 'priests', label: 'Священники', sub: 'служат в приходах', note: '<b>Священники</b> — служат в деревенских и городских церквях (приходах): крестят, венчают, отпевают, собирают десятину. Ближе всех к простым людям.' }
];

function svgChurch() {
  const w = 400, h = 300, n = CHURCH_LEVELS.length, rowH = 50, top = 22;
  let s = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" role="img" aria-label="Церковная иерархия"><rect width="${w}" height="${h}" fill="#efe7f7"/>`;
  const fills = ['#5b3a8a', '#6f4aa3', '#845fb8', '#9a78cc', '#b094d9'];
  for (let i = 0; i < n; i++) {
    const l = CHURCH_LEVELS[i], y = top + i * rowH, half = 70 + i * 32;
    s += `<g class="lvl" data-lvl="${l.id}"><rect x="${w / 2 - half}" y="${y}" width="${half * 2}" height="${rowH - 8}" rx="8" fill="${fills[i]}" stroke="#2e1d47" stroke-width="2"/>`;
    s += `<text x="${w / 2}" y="${y + 20}" text-anchor="middle" fill="#fff" font-size="15" font-weight="700">${l.label}</text>`;
    s += `<text x="${w / 2}" y="${y + 35}" text-anchor="middle" fill="#efe7f7" font-size="11">${l.sub}</text></g>`;
    if (i < n - 1) s += `<path d="M${w / 2 - half - 10},${y + rowH - 6} l-6,-8 l12,0 z" fill="#2e1d47"/>`;
  }
  s += `<text x="20" y="${h - 10}" fill="#2e1d47" font-size="12">Каждая ступень подчиняется той, что выше</text></svg>`;
  return s;
}

const FIELD_KINDS = {
  winter: { label: 'Озимое', sub: 'посеяли осенью: рожь, пшеница', fill: '#e2b53a', icon: '🌾' },
  spring: { label: 'Яровое', sub: 'посеяли весной: овёс, ячмень', fill: '#7cb342', icon: '🌱' },
  fallow: { label: 'Пар', sub: 'отдыхает: пасут скот', fill: '#a1887f', icon: '🐄' }
};
const FIELD_ORDER = ['winter', 'spring', 'fallow'];

function svgField(state) {
  state = state || FIELD_ORDER;
  const w = 400, h = 300;
  let s = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" role="img" aria-label="Трёхполье"><rect width="${w}" height="${h}" fill="#dfeecc"/>`;
  s += `<text x="${w / 2}" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="#2f3e1a">Пашня деревни: три поля</text>`;
  for (let i = 0; i < 3; i++) {
    const k = FIELD_KINDS[state[i]], x = 18 + i * 124;
    s += `<g class="field" data-i="${i}"><rect x="${x}" y="44" width="116" height="170" rx="6" fill="${k.fill}" stroke="#3b4d1c" stroke-width="2"/>`;
    s += `<text x="${x + 58}" y="112" text-anchor="middle" font-size="40">${k.icon}</text>`;
    s += `<text x="${x + 58}" y="150" text-anchor="middle" font-size="17" font-weight="700" fill="#1f2a10">${k.label}</text>`;
    s += `<text x="${x + 58}" y="170" text-anchor="middle" font-size="10" fill="#1f2a10">${k.sub.split(': ')[0]}</text>`;
    s += `<text x="${x + 58}" y="184" text-anchor="middle" font-size="10" fill="#1f2a10">${k.sub.split(': ')[1]}</text>`;
    s += `<text x="${x + 58}" y="234" text-anchor="middle" font-size="12" fill="#2f3e1a">поле ${i + 1}</text></g>`;
  }
  s += `<text x="${w / 2}" y="270" text-anchor="middle" font-size="13" fill="#2f3e1a">озимое → яровое → пар → озимое …</text></svg>`;
  return s;
}

/* Вопрос без подсказки: убираем «Термин (…) — » в начале определения */
function question(t) {
  const d = t.def; let depth = 0;
  for (let i = 0; i < d.length - 2; i++) {
    if (d[i] === '(') depth++; else if (d[i] === ')') depth--;
    else if (depth === 0 && d.slice(i, i + 3) === ' — ' && i < 80) {
      const head = norm(d.slice(0, i)), names = [t.term].concat(t.alt || []).map(x => norm(x).split(' ').pop().slice(0, 5));
      if (names.some(n => head.includes(n))) { const rest = d.slice(i + 3); return rest[0].toUpperCase() + rest.slice(1); }
      break;
    }
  }
  return d;
}

function renderPic(t, state) {
  if (t.img === 'svg:feudal') return svgFeudal();
  if (t.img === 'svg:church') return svgChurch();
  if (t.img === 'svg:field') return svgField(state);
  return `<img src="${t.img}" alt="${t.caption}" loading="lazy" style="--pos:${t.pos || 'center'}">`;
}

/* ---------- utils ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const byId = Object.fromEntries(TERMS.map(t => [t.id, t]));
const norm = s => s.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9 -]/g, '').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const m = a.length, n = b.length, d = [];
  for (let i = 0; i <= m; i++) { d[i] = [i]; }
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function checkAnswer(t, input) {
  const v = norm(input); if (!v) return 'empty';
  const variants = [t.term].concat(t.alt || []).map(norm);
  if (variants.includes(v)) return 'ok';
  if (variants.some(x => lev(x, v) <= (x.length > 6 ? 2 : 1))) return 'typo';
  return 'bad';
}
const store = {
  get known() { try { return new Set(JSON.parse(localStorage.getItem('mt-known') || '[]')); } catch (e) { return new Set(); } },
  set known(v) { try { localStorage.setItem('mt-known', JSON.stringify([...v])); } catch (e) { /* ignore */ } }
};

/* ---------- tabs ---------- */
document.querySelectorAll('.tabs [role=tab]').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', b === btn));
  document.querySelectorAll('.tab').forEach(s => s.hidden = s.dataset.tab !== btn.dataset.tab);
  location.hash = btn.dataset.tab;
}));
if (location.hash && $(`.tabs [data-tab="${location.hash.slice(1)}"]`)) $(`.tabs [data-tab="${location.hash.slice(1)}"]`).click();

/* ---------- learn ---------- */
function renderLearn() {
  const root = $('#groups'); root.innerHTML = '';
  const known = store.known;
  for (const g of Object.keys(GROUPS)) {
    const sec = document.createElement('section'); sec.className = 'group'; sec.dataset.g = g;
    sec.innerHTML = `<h2><span class="tag"></span>${GROUPS[g].title}</h2><p class="intro">${GROUPS[g].intro}</p><div class="cards"></div>`;
    const grid = $('.cards', sec);
    TERMS.filter(t => t.group === g).forEach(t => {
      const c = document.createElement('article'); c.className = 'card' + (known.has(t.id) ? ' known' : ''); c.dataset.id = t.id; c.tabIndex = 0;
      c.innerHTML = `
        <label class="known-toggle" title="Уже знаю"><input type="checkbox" ${known.has(t.id) ? 'checked' : ''}> знаю</label>
        <div class="pic">${renderPic(t)}</div>
        <div class="content">
          <div class="term">${t.term}</div>
          <div class="short">${t.short}</div>
          <div class="body">
            <p class="def">${t.def}</p>
            <div class="mnemo"><span class="lbl">Как запомнить</span>${t.mnemo}</div>
            ${t.img.startsWith('svg:') ? `<div class="diagram-ui"></div>` : ''}
            <div class="extra"><span class="lbl">Ещё пара фактов</span><ul>${t.extra.map(x => `<li>${x}</li>`).join('')}</ul></div>
            <div class="caption">${t.caption}</div>
            <div class="foot"><a href="#" class="close">Свернуть ↑</a></div>
          </div>
        </div>`;
      grid.appendChild(c);
    });
    root.appendChild(sec);
  }
  updateKnown();
}
function updateKnown() { $('#known-count').textContent = store.known.size; }

$('#groups').addEventListener('click', e => {
  const card = e.target.closest('.card'); if (!card) return;
  if (e.target.closest('.known-toggle')) {
    if (e.target.tagName !== 'INPUT') return;
    const k = store.known; e.target.checked ? k.add(card.dataset.id) : k.delete(card.dataset.id); store.known = k;
    card.classList.toggle('known', e.target.checked); updateKnown(); return;
  }
  if (e.target.closest('.close')) { e.preventDefault(); closeCard(card); return; }
  if (e.target.closest('.diagram-ui, .pic svg')) return;
  if (!card.classList.contains('open')) openCard(card);
});
$('#groups').addEventListener('keydown', e => {
  const card = e.target.closest('.card'); if (!card || e.target !== card) return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.contains('open') ? closeCard(card) : openCard(card); }
  if (e.key === 'Escape') closeCard(card);
});
function openCard(card) {
  document.querySelectorAll('.card.open').forEach(closeCard);
  card.classList.add('open');
  const t = byId[card.dataset.id];
  if (t.img.startsWith('svg:')) bindDiagram(card, t);
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function closeCard(card) { card.classList.remove('open'); const ui = $('.diagram-ui', card); if (ui) ui.innerHTML = ''; }

function bindDiagram(card, t) {
  const pic = $('.pic', card), ui = $('.diagram-ui', card);
  if (t.img === 'svg:feudal' || t.img === 'svg:church') {
    const levels = t.img === 'svg:feudal' ? FEUDAL_LEVELS : CHURCH_LEVELS;
    ui.innerHTML = `<div class="diag-note">Нажми на любую ступеньку схемы, чтобы узнать, кто это и кому подчиняется.</div>`;
    pic.classList.add('diagram');
    pic.querySelectorAll('.lvl').forEach(el => el.addEventListener('click', () => {
      const idx = levels.findIndex(l => l.id === el.dataset.lvl);
      pic.querySelectorAll('.lvl').forEach((x, i) => { x.classList.toggle('sel', i === idx); x.classList.toggle('dim', Math.abs(i - idx) > 1); });
      $('.diag-note', ui).innerHTML = levels[idx].note;
    }));
  } else if (t.img === 'svg:field') {
    let state = FIELD_ORDER.slice(), year = 1;
    const notes = ['Год 1. Поле 1 — озимое, поле 2 — яровое, поле 3 — под паром (отдыхает).', 'Поля «сдвинулись»: то, что было под паром, засеяли озимыми; отдыхает бывшее яровое.', 'Ещё год — ещё сдвиг. За три года каждое поле по разу побывает и озимым, и яровым, и паром.'];
    ui.innerHTML = `<div class="diag-note">${notes[0]}</div><div class="diag-btns"><button class="btn primary" type="button">Следующий год →</button><span class="year">Год 1</span></div>`;
    $('.diag-btns button', ui).addEventListener('click', () => {
      state = [state[2], state[0], state[1]]; year++;
      pic.innerHTML = svgField(state);
      $('.year', ui).textContent = 'Год ' + year;
      $('.diag-note', ui).textContent = `Год ${year}. ` + (year === 2 ? notes[1] : year === 3 ? notes[2] : year % 3 === 1 ? 'Круг замкнулся: поля стоят как в первый год. Земля не истощается, а треть её каждый год отдыхает.' : notes[2]);
    });
  }
}

/* ---------- trainer ---------- */
let train = null;
$('#train-start').addEventListener('click', () => {
  const set = $('input[name=train-set]:checked').value;
  const list = TERMS.filter(t => set === 'all' || t.group === set);
  train = { queue: shuffle(list), total: list.length, done: 0, repeats: 0, missed: new Set() };
  renderTrain();
});
function renderTrain() {
  const area = $('#train-area');
  if (!train.queue.length) {
    area.innerHTML = `<div class="result"><div class="big">${train.missed.size === 0 ? '🏆' : '👍'}</div>
      <p>Все ${train.total} понятий пройдены.${train.missed.size ? ` Пришлось повторить: ${train.missed.size}.` : ' С первого раза!'}</p>
      ${train.missed.size ? `<ul>${[...train.missed].map(id => `<li><b>${byId[id].term}</b> — ${byId[id].short}</li>`).join('')}</ul>` : ''}
      <button class="btn primary" id="train-again">Ещё раз</button></div>`;
    $('#train-again').addEventListener('click', () => $('#train-start').click());
    return;
  }
  const t = train.queue[0];
  area.innerHTML = `<div class="progress"><span>Осталось: ${train.queue.length}</span><span>Пройдено: ${train.done} / ${train.total}</span></div>
    <div class="bar"><i style="width:${train.done / train.total * 100}%"></i></div>
    <div class="flash">
      <div class="pic">${renderPic(t)}</div>
      <div class="q"><span class="lbl">Какое это понятие?</span>${question(t)}</div>
      <div class="answer" hidden>${t.term}<div class="mnemo">${t.mnemo}</div></div>
      <div class="actions"><button class="btn primary" id="reveal">Показать ответ</button></div>
    </div>`;
  $('#reveal').addEventListener('click', () => {
    $('.answer', area).hidden = false;
    $('.actions', area).innerHTML = `<button class="btn ok" id="yes">✅ Знал</button><button class="btn bad" id="no">❌ Не знал, повторить</button>`;
    $('#yes').addEventListener('click', () => { train.queue.shift(); train.done++; renderTrain(); });
    $('#no').addEventListener('click', () => { const x = train.queue.shift(); train.missed.add(x.id); train.repeats++; train.queue.splice(Math.min(3, train.queue.length), 0, x); renderTrain(); });
  });
}

/* ---------- matching ---------- */
let match = null;
$('#match-start').addEventListener('click', () => {
  const picked = shuffle(TERMS).slice(0, 6);
  match = { ids: picked.map(t => t.id), sel: null, done: new Set(), errors: 0 };
  const area = $('#match-area');
  area.innerHTML = `<div class="col terms">${shuffle(picked).map(t => `<button class="chip term" data-id="${t.id}">${t.term}</button>`).join('')}</div>
    <div class="col defs">${shuffle(picked).map(t => `<button class="chip def" data-id="${t.id}">${t.short}</button>`).join('')}</div>`;
  $('#match-status').textContent = 'Ошибок: 0';
});
$('#match-area').addEventListener('click', e => {
  const chip = e.target.closest('.chip'); if (!chip || chip.classList.contains('done') || !match) return;
  if (chip.classList.contains('term')) {
    document.querySelectorAll('#match-area .term').forEach(x => x.classList.remove('sel'));
    chip.classList.add('sel'); match.sel = chip.dataset.id; return;
  }
  if (!match.sel) return;
  const termChip = $(`#match-area .term[data-id="${match.sel}"]`);
  if (chip.dataset.id === match.sel) {
    chip.classList.add('done'); termChip.classList.add('done'); termChip.classList.remove('sel'); match.done.add(match.sel); match.sel = null;
    if (match.done.size === match.ids.length) $('#match-status').textContent = `Готово! Ошибок: ${match.errors}. ${match.errors === 0 ? '🏆 Идеально.' : 'Нажми «Новый набор», чтобы продолжить.'}`;
  } else {
    match.errors++; $('#match-status').textContent = 'Ошибок: ' + match.errors;
    chip.classList.add('wrong'); setTimeout(() => chip.classList.remove('wrong'), 400);
  }
});

/* ---------- dictation ---------- */
let dict = null;
$('#dict-start').addEventListener('click', () => startDict(shuffle(TERMS)));
function startDict(list) { dict = { list, i: 0, results: [] }; renderDict(); }
function renderDict() {
  const area = $('#dict-area');
  if (dict.i >= dict.list.length) {
    const ok = dict.results.filter(r => r.verdict === 'ok').length, typo = dict.results.filter(r => r.verdict === 'typo').length, bad = dict.results.filter(r => r.verdict === 'bad' || r.verdict === 'empty');
    const n = dict.list.length, mark = ok + typo === n ? (typo ? '5−' : '5') : ok + typo >= n * 0.8 ? '4' : ok + typo >= n * 0.6 ? '3' : '2';
    area.innerHTML = `<div class="result"><div class="big">${ok + typo} / ${n}</div><p>Правильно: ${ok}${typo ? `, с опечаткой: ${typo}` : ''}${bad.length ? `, ошибок: ${bad.length}` : ''}. Оценка примерно <b>${mark}</b>.</p>
      ${bad.length ? `<ul>${bad.map(r => `<li><b>${byId[r.id].term}</b> — ты написал: «${r.input || '—'}»</li>`).join('')}</ul><button class="btn primary" id="dict-redo">Повторить только ошибки</button> ` : ''}
      <button class="btn" id="dict-all">Весь диктант заново</button></div>`;
    if (bad.length) $('#dict-redo').addEventListener('click', () => startDict(shuffle(bad.map(r => byId[r.id]))));
    $('#dict-all').addEventListener('click', () => $('#dict-start').click());
    return;
  }
  const t = dict.list[dict.i], pics = $('#dict-pics').checked;
  area.innerHTML = `<div class="progress"><span>Вопрос ${dict.i + 1} из ${dict.list.length}</span><span>Верно: ${dict.results.filter(r => r.verdict !== 'bad' && r.verdict !== 'empty').length}</span></div>
    <div class="bar"><i style="width:${dict.i / dict.list.length * 100}%"></i></div>
    <div class="dict">${pics ? `<div class="pic">${renderPic(t)}</div>` : ''}
      <p class="q">${question(t)}</p>
      <form><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Напиши понятие" aria-label="Понятие"><button class="btn primary" type="submit">Проверить</button></form>
      <div class="verdict" hidden></div></div>`;
  const input = $('input', area); input.focus();
  $('form', area).addEventListener('submit', e => {
    e.preventDefault();
    const v = checkAnswer(t, input.value); dict.results.push({ id: t.id, verdict: v, input: input.value.trim() });
    const vd = $('.verdict', area); vd.hidden = false; input.disabled = true; $('form button', area).disabled = true;
    const cls = v === 'ok' ? 'ok' : v === 'typo' ? 'warn' : 'bad';
    vd.className = 'verdict ' + cls;
    vd.innerHTML = (v === 'ok' ? '✅ Верно! ' : v === 'typo' ? '⚠️ Почти: есть опечатка. Правильно: ' : '❌ Неверно. Правильно: ') + `<span class="right">${t.term}</span>` +
      (v !== 'ok' ? `<div class="mnemo">${t.mnemo}</div>` : '') + `<div style="margin-top:10px"><button class="btn primary" id="dict-next" type="button">Дальше →</button></div>`;
    const next = $('#dict-next'); next.focus();
    next.addEventListener('click', () => { dict.i++; renderDict(); });
  });
  area.addEventListener('keydown', e => { if (e.key === 'Enter' && $('#dict-next')) { e.preventDefault(); $('#dict-next').click(); } });
}

/* ---------- credits ---------- */
$('#credits-list').innerHTML = TERMS.filter(t => t.credit).map(t => `<li><b>${t.term}</b>: ${t.credit}</li>`).join('');

renderLearn();
window.__mt = { TERMS, question, checkAnswer };
})();
