/** Hand-built roads. Y is up. A full ground surface sits at y = 3. */

import { TILE } from "./config.js";

function stage(meta) {
  const w = meta.w;
  const h = meta.h ?? 16;
  const tiles = Array.from({ length: h }, () => new Uint8Array(w));
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y <= 2; y += 1) tiles[y][x] = TILE.SOLID;
  }
  for (let y = 0; y < 5; y += 1) tiles[y][0] = TILE.SOLID;

  const level = {
    id: meta.id,
    region: meta.region ?? 0,
    name: meta.name,
    be: meta.be,
    hint: meta.hint ?? "",
    hintBe: meta.hintBe ?? "",
    note: meta.note ?? "",
    noteBe: meta.noteBe ?? "",
    sun: !!meta.sun,
    boss: !!meta.boss,
    current: meta.current ?? 0,
    w,
    h,
    tiles,
    hero: { x: 4.2, y: 3 },
    goal: { x: w - 4, y: 3 },
    enemies: [],
    coins: [],
    foods: [],
    baskets: [],
    springs: [],
    gates: [],
    rafts: [],
    crumbles: [],
    fogs: [],
    props: [],
  };

  const inside = (x, y) => x > 0 && x < w && y >= 0 && y < h;
  const fill = (x0, x1, y0, y1, tile) => {
    for (let x = x0; x < x1; x += 1) {
      for (let y = y0; y <= y1; y += 1) if (inside(x, y)) tiles[y][x] = tile;
    }
  };

  return {
    gap(x0, x1) {
      fill(x0, x1, 0, 8, TILE.EMPTY);
    },
    lagoon(x0, x1) {
      for (let x = x0; x < x1; x += 1) {
        if (!inside(x, 2)) continue;
        tiles[0][x] = TILE.SOLID;
        tiles[1][x] = TILE.WATER;
        tiles[2][x] = TILE.WATER;
      }
    },
    block(x0, x1, y0, y1) {
      fill(x0, x1, y0, y1, TILE.SOLID);
    },
    platform(x, y, n) {
      for (let i = 0; i < n; i += 1) if (inside(x + i, y)) tiles[y][x + i] = TILE.PLATFORM;
    },
    spike(x, n) {
      for (let i = 0; i < n; i += 1) if (inside(x + i, 2)) tiles[2][x + i] = TILE.SPIKE;
    },
    lift(x0, x1, extra) {
      fill(x0, x1, 0, 2 + extra, TILE.SOLID);
    },
    coin(x, y) {
      level.coins.push({ x, y });
    },
    food(x, y, id) {
      level.foods.push({ x, y, id });
    },
    enemy(x, y, id) {
      level.enemies.push({ x, y, id });
    },
    basket(x, y = 3) {
      level.baskets.push({ x, y, w: 0.95, h: 0.9 });
    },
    spring(x, y = 3) {
      level.springs.push({ x, y, w: 1, h: 0.42 });
    },
    gate(x, y = 3, height = 1.7) {
      level.gates.push({ x, y, w: 0.82, h: height });
    },
    raft(x, y, width, minX, maxX, speed = 2.4) {
      level.rafts.push({ x, y, w: width, h: 0.42, minX, maxX, speed });
    },
    crumble(x, y) {
      level.crumbles.push({ x: x + 0.5, y, w: 1, h: 1 });
    },
    fog(x, y, width, height) {
      level.fogs.push({ x, y, w: width, h: height });
    },
    prop(kind, x, y = 3) {
      level.props.push({ kind, x, y });
    },
    hero(x, y = 3) {
      level.hero = { x, y };
    },
    goal(x, y = 3) {
      level.goal = { x, y };
    },
    done() {
      return level;
    },
  };
}

function cottage() {
  const s = stage({
    id: "cottage",
    region: 0,
    w: 50,
    name: "The Wattle Gate",
    be: "Плецены плот",
    hint: "Arrows run, Space jumps. Hop the brook and the basket.",
    hintBe: "Стрэлкі — бег, прабел — скачок. Пераскоч ручай і кошык.",
    note: "The wattle gate is where the village lets the forest begin.",
    noteBe: "Плецены плот — месца, дзе вёска адпускае цябе ў лес.",
  });
  s.prop("cottage", 7);
  s.prop("well", 12);
  s.coin(8, 4.4);
  s.coin(10.2, 4.7);
  s.coin(12.4, 4.4);
  s.basket(17);
  s.coin(18.6, 5.5);
  s.gap(22, 25);
  s.platform(21, 5, 5);
  s.coin(22.5, 7.2);
  s.coin(24.2, 7.2);
  s.food(31, 4.3, "draniki");
  s.coin(36, 4.4);
  s.coin(38.5, 4.8);
  s.goal(45);
  s.hero(4.2);
  return s.done();
}

function oakRoad() {
  const s = stage({
    id: "oak-road",
    region: 0,
    w: 64,
    name: "Oak Road",
    be: "Дубовая дарога",
    hint: "Stomp the wolf. E sends Zubr through the gate.",
    hintBe: "Наскоч на ваўка. E — і Зубр выбівае вароты.",
    note: "Oaks this wide remember the bison herds.",
    noteBe: "Дубы такой таўшчыні памятаюць статкі зуброў.",
  });
  s.coin(8, 4.4);
  s.food(11, 4.3, "kvass");
  s.gap(15, 18);
  s.enemy(24, 3, "wolf");
  s.coin(21, 4.4);
  s.coin(27, 4.4);
  s.spring(32);
  s.gap(36, 40);
  s.coin(37.5, 6.4);
  s.block(46, 51, 5, 7);
  s.gate(48.2);
  s.basket(54);
  s.food(58, 4.3, "honey");
  s.goal(61);
  return s.done();
}

function greyWolf() {
  const s = stage({
    id: "grey-wolf",
    region: 0,
    w: 34,
    sun: true,
    boss: true,
    name: "Grey Wolf",
    be: "Шэры Воўк",
    hint: "He scrapes a hoof, then charges. Stomp or ram.",
    hintBe: "Ён скрабе капытом і кідаецца. Наскоч або бадай.",
    note: "The first sun is tied in the oldest oak.",
    noteBe: "Першае сонца прывязана на самым старым дубе.",
  });
  s.block(0, 2, 0, 8);
  s.block(32, 34, 0, 8);
  s.food(8, 4.3, "draniki");
  s.coin(12, 4.5);
  s.enemy(22, 3, "wolf_boss");
  s.coin(26, 4.5);
  s.goal(30);
  return s.done();
}

function reedFord() {
  const s = stage({
    id: "reed-ford",
    region: 1,
    w: 58,
    name: "Reed Ford",
    be: "Чаротавы брод",
    hint: "The ford is slow but kind. Lilies hold the amber.",
    hintBe: "Брод марудны, але добры. На гарлачыках ляжыць бурштын.",
    note: "Reeds hide the water and the nests.",
    noteBe: "Чарот хавае ваду і гнёзды.",
  });
  s.prop("nest", 8, 3);
  s.lagoon(14, 28);
  s.platform(16, 5, 3);
  s.platform(22, 6, 3);
  s.coin(17.5, 7.2);
  s.coin(23.5, 8.2);
  s.enemy(20, 5.6, "stork");
  s.food(32, 4.3, "cranberry");
  s.lagoon(38, 50);
  s.platform(40, 5, 4);
  s.coin(42, 7.2);
  s.enemy(44, 5.5, "hornet");
  s.goal(54);
  return s.done();
}

function beaverSticks() {
  const s = stage({
    id: "beaver-sticks",
    region: 1,
    w: 62,
    name: "Beaver Sticks",
    be: "Бабровыя кіі",
    hint: "Hop the sticks. Ram the hedgehog. Khaladnik clears fog.",
    hintBe: "Пераскоч кіі. Бадай вожыка. Халаднік здымае туман.",
    note: "Beavers still write the shape of these rivers.",
    noteBe: "Бабры дагэтуль пішуць форму гэтых рэк.",
  });
  s.food(8, 4.3, "khaladnik");
  s.enemy(16, 3, "beaver");
  s.coin(14, 4.6);
  s.coin(20, 4.6);
  s.fog(24, 2.2, 30, 3.2);
  s.enemy(30, 3, "hedgehog");
  s.basket(34);
  s.spike(38, 2);
  s.enemy(46, 3, "viper");
  s.food(52, 4.3, "mushroom");
  s.coin(56, 4.5);
  s.goal(59);
  return s.done();
}

function vodyanoy() {
  const s = stage({
    id: "vodyanoy",
    region: 1,
    w: 36,
    sun: true,
    boss: true,
    name: "Vodyanoy",
    be: "Вадзянік",
    hint: "He spits river-water. The lilies are your stepping stones.",
    hintBe: "Ён плюе рачной вадой. Гарлачыкі — твае камяні.",
    note: "The second sun sank and he sat on it.",
    noteBe: "Другое сонца патанула, і ён сеў на яго.",
  });
  s.lagoon(6, 30);
  s.platform(10, 5, 3);
  s.platform(22, 5, 3);
  s.food(8, 6.4, "honey");
  s.enemy(18, 3, "vodyanoy");
  s.goal(33);
  return s.done();
}

function logRafts() {
  const s = stage({
    id: "log-rafts",
    region: 2,
    w: 66,
    current: -2.4,
    name: "Log Rafts",
    be: "Плыты",
    hint: "The Nyoman pushes back. Ride the logs.",
    hintBe: "Нёман штурхае назад. Стань на плыт.",
    note: "Timber still knows this river by heart.",
    noteBe: "Лес дагэтуль ведае гэтую раку на памяць.",
  });
  s.lagoon(12, 54);
  s.raft(16, 3, 2.4, 14, 24, 2.2);
  s.raft(28, 3, 2.6, 26, 38, 2.6);
  s.raft(42, 3, 2.4, 40, 52, 2.1);
  s.coin(18, 5.2);
  s.coin(32, 5.4);
  s.coin(46, 5.2);
  s.food(58, 4.3, "blin");
  s.prop("mill", 8);
  s.goal(62);
  return s.done();
}

function mirRoad() {
  const s = stage({
    id: "mir-road",
    region: 2,
    w: 62,
    name: "Road to Mir",
    be: "Дарога на Мір",
    hint: "Boars charge, lynxes leap. Springs clear the broken bridge.",
    hintBe: "Дзік атакуе, рысь скача. Спружына бярэ разбіты мост.",
    note: "Red brick and white stone: Mir watches the road.",
    noteBe: "Чырвоная цэгла і белы камень: Мір глядзіць на дарогу.",
  });
  s.prop("castle", 10, 3);
  s.enemy(18, 3, "boar");
  s.coin(16, 4.5);
  s.coin(22, 4.5);
  s.gap(26, 30);
  s.spring(24);
  s.food(34, 4.3, "rye");
  s.enemy(40, 3, "lynx");
  s.spike(46, 2);
  s.basket(50);
  s.coin(54, 4.6);
  s.goal(58);
  return s.done();
}

function tsmokBend() {
  const s = stage({
    id: "tsmok",
    region: 2,
    w: 38,
    sun: true,
    boss: true,
    name: "Tsmok's Bend",
    be: "Закрут Цмока",
    hint: "The crowned serpent swoops. Meet him in the air.",
    hintBe: "Каранаваны змей кідаецца зверху. Сустрэнь яго ў паветры.",
    note: "The third sun is a coin in a dragon's story.",
    noteBe: "Трэцяе сонца — манета ў казцы пра цмока.",
  });
  s.platform(8, 5, 4);
  s.platform(24, 5, 4);
  s.platform(15, 7, 3);
  s.food(10, 6.5, "kvass");
  s.enemy(20, 6.2, "tsmok");
  s.goal(34);
  return s.done();
}

function blueBloom() {
  const s = stage({
    id: "blue-bloom",
    region: 3,
    w: 56,
    name: "Blue Bloom",
    be: "Сіні цвет",
    hint: "The field is generous. Hares only want to play.",
    hintBe: "Поле шчодрае. Зайцы хочуць толькі гуляць.",
    note: "When flax flowers, the whole district turns into sky.",
    noteBe: "Калі квітнее лён, уся ваколіца робіцца небам.",
  });
  s.prop("cart", 9);
  s.enemy(14, 3, "hare");
  s.enemy(22, 3, "hare");
  s.food(18, 4.3, "syrniki");
  s.food(28, 4.3, "blin");
  s.coin(12, 4.5);
  s.coin(16, 5);
  s.coin(24, 4.5);
  s.coin(32, 5.1);
  s.enemy(36, 5.2, "hornet");
  s.gap(40, 43);
  s.food(48, 4.3, "cranberry");
  s.goal(52);
  return s.done();
}

function dazhynki() {
  const s = stage({
    id: "dazhynki",
    region: 3,
    w: 60,
    name: "Dazhynki",
    be: "Дажынкі",
    hint: "Hay bridges sag if you stand still. Keep running.",
    hintBe: "Саламяныя масты прасядаюць, калі стаяць. Бяжы.",
    note: "Dazhynki thanks the field with bread, wreaths, and noise.",
    noteBe: "Дажынкі дзякуе полю хлебам, вянкамі і гоманам.",
  });
  s.prop("cart", 8);
  s.gap(16, 21);
  s.crumble(16, 5);
  s.crumble(17, 5);
  s.crumble(18, 5);
  s.crumble(19, 5);
  s.coin(17.5, 7.3);
  s.enemy(26, 3, "boar");
  s.food(32, 4.3, "rye");
  s.gap(38, 43);
  s.crumble(38, 5);
  s.crumble(39, 5);
  s.crumble(40, 5);
  s.crumble(41, 5);
  s.spike(46, 2);
  s.basket(50);
  s.coin(54, 4.6);
  s.goal(57);
  return s.done();
}

function palyavik() {
  const s = stage({
    id: "palyavik",
    region: 3,
    w: 36,
    sun: true,
    boss: true,
    name: "Palyavik",
    be: "Палявік",
    hint: "The field spirit leaps. Bait the jump, then stomp.",
    hintBe: "Дух поля скача. Падмані яго і наскоч.",
    note: "The fourth sun smells like warm bread.",
    noteBe: "Чацвёртае сонца пахне цёплым хлебам.",
  });
  s.food(7, 4.3, "honey");
  s.crumble(12, 4);
  s.crumble(18, 4);
  s.crumble(24, 4);
  s.enemy(20, 3, "palyavik");
  s.goal(32);
  return s.done();
}

function pineShore() {
  const s = stage({
    id: "pine-shore",
    region: 4,
    w: 58,
    name: "Pine Shore",
    be: "Хваёвы бераг",
    hint: "Lynx in the shade. Spikes are the pine cones you do not kick.",
    hintBe: "Рысь у цені. Калючкі — шышкі, якія не варта пінаць.",
    note: "Pines stand around Narach like a dark green wall.",
    noteBe: "Хвоі стаяць вакол Нарачы цёмна-зялёнай сцяной.",
  });
  s.enemy(14, 3, "lynx");
  s.coin(12, 4.5);
  s.coin(18, 4.5);
  s.gap(22, 25);
  s.food(30, 4.3, "mushroom");
  s.enemy(34, 3, "hare");
  s.spike(40, 3);
  s.spring(38);
  s.food(48, 4.3, "cranberry");
  s.goal(54);
  return s.done();
}

function amberPier() {
  const s = stage({
    id: "amber-pier",
    region: 4,
    w: 60,
    name: "Amber Pier",
    be: "Бурштынавы прычал",
    hint: "The pier logs drift. Amber likes the brave hop.",
    hintBe: "Бярвёны прычала плывуць. Бурштын любіць смелы скачок.",
    note: "The shore glitters in stories even when the sand is only sand.",
    noteBe: "Бераг блішчыць у казках, нават калі пясок — проста пясок.",
  });
  s.lagoon(12, 48);
  s.raft(16, 3, 2.8, 14, 26, 1.8);
  s.raft(30, 3, 2.8, 28, 40, 2.2);
  s.raft(42, 3, 2.2, 40, 48, 1.6);
  s.enemy(22, 4.8, "beaver");
  s.coin(18, 5.4);
  s.coin(33, 5.6);
  s.food(52, 4.3, "syrniki");
  s.goal(56);
  return s.done();
}

function rusalkaLake() {
  const s = stage({
    id: "rusalka",
    region: 4,
    w: 38,
    sun: true,
    boss: true,
    name: "Rusalka",
    be: "Русалка",
    hint: "She dives from the air. The lilies keep you in the fight.",
    hintBe: "Яна кідаецца з паветра. Гарлачыкі трымаюць бой.",
    note: "The fifth sun is braided into a wet wreath.",
    noteBe: "Пятае сонца ўплецена ў мокры вянок.",
  });
  s.lagoon(6, 32);
  s.platform(9, 5, 3);
  s.platform(24, 5, 3);
  s.platform(16, 7, 3);
  s.food(11, 6.5, "honey");
  s.enemy(19, 6.4, "rusalka");
  s.goal(35);
  return s.done();
}

function wreathMeadow() {
  const s = stage({
    id: "wreath-meadow",
    region: 5,
    w: 54,
    name: "Wreath Meadow",
    be: "Луг вянкоў",
    hint: "Midsummer is loud and kind, until the wolf remembers the dark.",
    hintBe: "Серад лета гучны і добры, пакуль воўк не ўспомніць цемру.",
    note: "Every wreath on the water is a small wish.",
    noteBe: "Кожны вянок на вадзе — маленькае жаданне.",
  });
  s.prop("bonfire", 8, 3);
  s.food(12, 4.3, "blin");
  s.food(16, 4.3, "cranberry");
  s.coin(14, 5);
  s.coin(20, 4.6);
  s.enemy(26, 3, "wolf");
  s.gap(32, 35);
  s.enemy(40, 5.3, "hornet");
  s.food(44, 4.3, "kvass");
  s.goal(50);
  return s.done();
}

function bonfireHill() {
  const s = stage({
    id: "bonfire-hill",
    region: 5,
    w: 62,
    name: "Bonfire Hill",
    be: "Узгорак вогнішча",
    hint: "Springs climb the hill. Do not land in the coals.",
    hintBe: "Спружыны бяруць узгорак. Не ўпаді ў вуголле.",
    note: "Jumping the fire is an old dare and an old blessing.",
    noteBe: "Скачок праз агонь — старая спроба і стары благаслаў.",
  });
  s.prop("bonfire", 10, 3);
  s.spike(18, 2);
  s.spring(16);
  s.lift(22, 30, 2);
  s.enemy(26, 5, "wolf");
  s.coin(24, 6.4);
  s.spring(29, 5);
  s.gap(32, 36);
  s.lift(36, 46, 3);
  s.food(40, 7.4, "honey");
  s.enemy(42, 8.2, "hornet");
  s.spike(48, 2);
  s.coin(52, 4.6);
  s.goal(58, 3);
  return s.done();
}

function lesunNight() {
  const s = stage({
    id: "lesun",
    region: 5,
    w: 42,
    sun: true,
    boss: true,
    name: "Lesun",
    be: "Лясун",
    hint: "He throws acorns and steps through the trees. The fern opens when he falls.",
    hintBe: "Ён кідае жолуды і крочыць скрозь дрэвы. Папараць адкрыецца, калі ён упадзе.",
    note: "The sixth sun was never gone. It was waiting in the fern.",
    noteBe: "Шостае сонца нікуды не дзелася. Яно чакала ў папараці.",
  });
  s.prop("bonfire", 6, 3);
  s.platform(8, 5, 4);
  s.platform(28, 5, 4);
  s.platform(17, 7, 4);
  s.food(10, 6.5, "khaladnik");
  s.food(32, 6.5, "rye");
  s.enemy(21, 3, "lesun");
  s.goal(38);
  return s.done();
}

const BUILDERS = [
  cottage,
  oakRoad,
  greyWolf,
  reedFord,
  beaverSticks,
  vodyanoy,
  logRafts,
  mirRoad,
  tsmokBend,
  blueBloom,
  dazhynki,
  palyavik,
  pineShore,
  amberPier,
  rusalkaLake,
  wreathMeadow,
  bonfireHill,
  lesunNight,
];

export function campaign() {
  return BUILDERS.map((build, index) => {
    const level = build();
    level.index = index;
    return level;
  });
}

export function makeLevel(meta, mutate) {
  const api = stage({
    id: "sandbox",
    region: 0,
    name: "Sandbox",
    be: "Пясочніца",
    w: 24,
    ...meta,
  });
  if (mutate) mutate(api);
  const level = api.done();
  level.index = -1;
  return level;
}
