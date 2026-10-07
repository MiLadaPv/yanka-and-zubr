import assert from "node:assert/strict";
import test from "node:test";
import { ENEMIES, FOODS, STR } from "../js/config.js";
import { campaign, makeLevel } from "../js/levels.js";
import { normalize } from "../js/save.js";
import { applyFood, createSession, pathExists, starsFor, tileAt, update } from "../js/sim.js";
import { TILE } from "../js/config.js";

const right = { left: false, right: true, jump: false, jumpHeld: true, ram: false };
const still = { left: false, right: false, jump: false, jumpHeld: false, ram: false };

function flat(extra) {
  return makeLevel({ w: 30, id: "flat" }, (stage) => {
    if (extra) extra(stage);
  });
}

test("strings exist in both languages", () => {
  for (const [key, row] of Object.entries(STR)) {
    assert.equal(typeof row.en, "string", key);
    assert.equal(typeof row.be, "string", key);
    assert.ok(row.en.length > 0, key);
    assert.ok(row.be.length > 0, key);
  }
  for (const food of Object.values(FOODS)) assert.ok(food.be && food.loreBe);
  for (const enemy of Object.values(ENEMIES)) assert.ok(enemy.be && enemy.loreBe);
});

test("running moves Yanka forward and a wall stops her", () => {
  const session = createSession(flat());
  const start = session.hero.x;
  for (let i = 0; i < 60; i += 1) update(session, right, 1 / 60);
  assert.ok(session.hero.x > start + 5, `x=${session.hero.x}`);
  assert.ok(session.hero.grounded);

  const walled = createSession(makeLevel({ w: 20 }, (stage) => stage.block(8, 10, 0, 6)));
  for (let i = 0; i < 90; i += 1) update(walled, right, 1 / 60);
  assert.ok(walled.hero.x < 8, `x=${walled.hero.x}`);
  assert.equal(tileAt(walled.level, 8, 2), TILE.SOLID);
});

test("a jump leaves the ground and lands again", () => {
  const session = createSession(flat());
  let peak = session.hero.y;
  update(session, { ...still, jump: true, jumpHeld: true }, 1 / 60);
  for (let i = 0; i < 40; i += 1) {
    update(session, { ...still, jumpHeld: true }, 1 / 60);
    peak = Math.max(peak, session.hero.y);
  }
  assert.ok(peak > 5, `peak=${peak}`);
  for (let i = 0; i < 80; i += 1) update(session, still, 1 / 60);
  assert.ok(session.hero.grounded, "should land");
  assert.ok(Math.abs(session.hero.y - 3) < 0.05, `y=${session.hero.y}`);
});

test("coins, food, and a pit", () => {
  const session = createSession(makeLevel({ w: 26 }, (stage) => {
    stage.coin(6, 4.2);
    stage.food(8, 4.2, "kvass");
    stage.gap(14, 18);
  }));
  for (let i = 0; i < 40; i += 1) update(session, right, 1 / 60);
  assert.ok(session.pickups >= 1);
  assert.ok(session.hero.speedT > 0);
  const before = session.hero.hearts;
  session.hero.x = 16;
  session.hero.y = 1;
  session.hero.vy = 0;
  session.hero.grounded = false;
  for (let i = 0; i < 90 && session.hero.hearts === before; i += 1) update(session, still, 1 / 60);
  assert.ok(session.hero.hearts < before || session.status === "dead");
  assert.ok(session.hero.y > 2 || session.status === "dead");
});

test("stomp defeats a wolf and a hedgehog pokes back", () => {
  const wolf = createSession(makeLevel({ w: 20 }, (stage) => stage.enemy(8, 3, "wolf")));
  wolf.hero.x = 8;
  wolf.hero.y = 5.2;
  wolf.hero.vy = -2;
  wolf.hero.grounded = false;
  for (let i = 0; i < 40 && wolf.enemies[0].alive; i += 1) update(wolf, still, 1 / 60);
  assert.equal(wolf.enemies[0].alive, false);

  const hog = createSession(makeLevel({ w: 20 }, (stage) => stage.enemy(8, 3, "hedgehog")));
  hog.hero.x = 8;
  hog.hero.y = 5.2;
  hog.hero.vy = -2;
  hog.hero.grounded = false;
  const hearts = hog.hero.hearts;
  for (let i = 0; i < 30; i += 1) update(hog, still, 1 / 60);
  assert.ok(hog.hero.hearts < hearts);
  assert.equal(hog.enemies[0].alive, true);
});

test("Zubr ram breaks a basket", () => {
  const session = createSession(makeLevel({ w: 20 }, (stage) => stage.basket(7)));
  session.hero.facing = 1;
  update(session, { ...still, ram: true }, 1 / 60);
  for (let i = 0; i < 40 && !session.baskets[0].broken; i += 1) update(session, still, 1 / 60);
  assert.equal(session.baskets[0].broken, true);
});

test("food effects and save normalize", () => {
  const session = createSession(flat());
  applyFood(session, "rye");
  assert.equal(session.hero.maxHearts, 4);
  applyFood(session, "honey");
  assert.equal(session.hero.shield, true);
  applyFood(session, "khaladnik");
  session.hero.exposure = 1;
  applyFood(session, "khaladnik");
  assert.equal(session.hero.exposure, 0);
  const save = normalize({ coins: -4, lang: "be", unlocked: 3, owned: { shirt: [0, 2] } });
  assert.equal(save.coins, 0);
  assert.equal(save.lang, "be");
  assert.deepEqual(save.suns, [0, 0, 0, 0, 0, 0]);
  assert.ok(save.owned.shirt.includes(2));
  assert.equal(starsFor(session), 3);
});

test("a lagoon can be waded", () => {
  const session = createSession(makeLevel({ w: 30 }, (stage) => stage.lagoon(8, 20)));
  for (let i = 0; i < 280; i += 1) update(session, right, 1 / 60);
  assert.ok(session.hero.x > 20, `x=${session.hero.x}`);
  assert.ok(session.hero.y > 2, `y=${session.hero.y}`);
});

test("every road reaches its shrine", () => {
  const levels = campaign();
  assert.equal(levels.length, 18);
  const ids = new Set(levels.map((level) => level.id));
  assert.equal(ids.size, 18);
  for (const level of levels) {
    assert.ok(pathExists(level), level.id);
    for (const enemy of level.enemies) assert.ok(ENEMIES[enemy.id], `${level.id}:${enemy.id}`);
    for (const food of level.foods) assert.ok(FOODS[food.id], `${level.id}:${food.id}`);
  }
});

test("the cottage road can be finished by running and jumping", () => {
  const level = campaign()[0];
  const session = createSession(level);
  let jumpHold = 0;
  for (let i = 0; i < 60 * 28 && session.status === "play"; i += 1) {
    const wantJump = !footingAhead(session) || blockerAhead(session);
    if (wantJump && session.hero.grounded) jumpHold = 10;
    update(session, {
      left: false,
      right: true,
      jump: wantJump && jumpHold === 10,
      jumpHeld: jumpHold > 0,
      ram: blockerAhead(session),
    }, 1 / 60);
    if (jumpHold > 0) jumpHold -= 1;
  }
  assert.equal(session.status, "won", `x=${session.hero.x} y=${session.hero.y} hearts=${session.hero.hearts}`);
});

test("campaign roads do not explode", () => {
  for (const level of campaign()) {
    const session = createSession(level);
    for (let i = 0; i < 90; i += 1) {
      update(session, { ...right, jump: i % 37 === 0, ram: i === 20 }, 1 / 60);
    }
    assert.ok(Number.isFinite(session.hero.x), level.id);
    assert.ok(Number.isFinite(session.hero.y), level.id);
    assert.ok(session.hero.y > -8, level.id);
  }
});

function footingAhead(session) {
  const hero = session.hero;
  return hasFoot(session.level, hero.x + 1.15, hero.y) || hasFoot(session.level, hero.x + 0.2, hero.y);
}

function hasFoot(level, x, feet) {
  const tx = Math.floor(x);
  const ty = Math.ceil(feet - 1 - 1e-4);
  if (tx < 0 || tx >= level.w || ty < 0) return false;
  const tile = level.tiles[ty][tx];
  return tile === TILE.SOLID || tile === TILE.SPIKE || tile === TILE.PLATFORM || tile === TILE.WATER;
}

function blockerAhead(session) {
  const hero = session.hero;
  return session.baskets.some((box) => !box.broken && box.x > hero.x && box.x - hero.x < 1.6);
}
