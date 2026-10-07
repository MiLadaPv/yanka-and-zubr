/** Platformer simulation. No rendering, no storage — the tests run this as-is. */

import { ENEMIES, FOODS, PHYSICS as P, TILE } from "./config.js";

const STEP = 1 / 60;

export function tileAt(level, x, y) {
  if (x < 0 || x >= level.w) return TILE.SOLID;
  if (y < 0 || y >= level.h) return TILE.EMPTY;
  return level.tiles[y][x];
}

function spawnEnemy(e) {
  const d = ENEMIES[e.id];
  const scale = d.scale || 1;
  return {
    id: e.id,
    x: e.x,
    y: e.y,
    w: d.w * scale,
    h: d.h * scale,
    hp: d.hp,
    maxHp: d.hp,
    speed: d.speed,
    behaviour: d.behaviour,
    spiky: !!d.spiky,
    boss: !!d.boss,
    reward: d.reward || 2,
    sight: d.sight || 6,
    windup: d.windup || 0.45,
    cooldown: d.cooldown || 1.4,
    burst: d.burst || 7,
    range: d.range || 3,
    swoop: !!d.swoop,
    dir: e.x > 8 ? -1 : 1,
    vx: 0,
    vy: 0,
    state: "patrol",
    timer: 0,
    originX: e.x,
    originY: e.y,
    grounded: false,
    stun: 0,
    alive: true,
    rammed: false,
    phase: (e.x * 0.37) % 1,
  };
}

export function createSession(level) {
  return {
    level,
    time: 0,
    status: "play",
    coinsGot: 0,
    pickups: 0,
    bank: 0,
    hurts: 0,
    met: [],
    tasted: [],
    fx: [],
    shots: [],
    shake: 0,
    bossDown: false,
    summoned: false,
    winT: 0,
    hero: {
      x: level.hero.x,
      y: level.hero.y,
      vx: 0,
      vy: 0,
      w: P.width,
      h: P.height,
      facing: 1,
      grounded: true,
      coyote: P.coyote,
      jumpBuf: 0,
      cut: false,
      hearts: 3,
      maxHearts: 3,
      inv: 0,
      hurtLock: 0,
      shield: false,
      speedT: 0,
      jumpT: 0,
      magnetT: 0,
      coolT: 0,
      exposure: 0,
      spikeT: 0,
      inFord: false,
      safeX: level.hero.x,
      safeY: level.hero.y,
      wading: false,
    },
    zubr: {
      x: level.hero.x - 1.55,
      y: level.hero.y,
      vx: 0,
      vy: 0,
      w: 1.35,
      h: 1.05,
      facing: 1,
      grounded: true,
      ram: 0,
      cd: 0,
    },
    enemies: level.enemies.map(spawnEnemy),
    coins: level.coins.map((c) => ({ ...c, got: false })),
    foods: level.foods.map((c) => ({ ...c, got: false })),
    baskets: level.baskets.map((b) => ({ ...b, hp: 1, broken: false })),
    springs: level.springs.map((b) => ({ ...b, cd: 0 })),
    gates: level.gates.map((g) => ({ ...g, hp: 1, broken: false })),
    rafts: level.rafts.map((r) => ({ ...r, dir: 1, prevX: r.x })),
    crumbles: level.crumbles.map((c) => ({ ...c, stand: 0, gone: 0 })),
  };
}

export function update(session, input, dt) {
  let left = Math.min(Math.max(dt, 0), 0.05);
  let first = true;
  while (left > 1e-6) {
    const step = Math.min(STEP, left);
    tick(session, first ? input : { ...input, jump: false, ram: false }, step);
    first = false;
    left -= step;
  }
}

function tick(session, input, dt) {
  session.time += dt;
  session.shake = Math.max(0, session.shake - dt);
  ageFx(session, dt);
  if (session.bossDown && session.status === "play") {
    session.winT += dt;
    if (session.winT > 0.75) session.status = "won";
  }
  if (session.status !== "play") return;

  const hero = session.hero;
  hero.inv = Math.max(0, hero.inv - dt);
  hero.hurtLock = Math.max(0, hero.hurtLock - dt);
  hero.speedT = Math.max(0, hero.speedT - dt);
  hero.jumpT = Math.max(0, hero.jumpT - dt);
  hero.magnetT = Math.max(0, hero.magnetT - dt);
  hero.coolT = Math.max(0, hero.coolT - dt);
  const wading = hero.wading;
  hero.inFord = false;

  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (hero.hurtLock <= 0 && move) hero.facing = move;
  let speed = P.run * (hero.speedT > 0 ? 1.28 : 1) * (hero.exposure > 0.85 ? 0.75 : 1);
  if (wading) speed *= 0.62;
  const target = (hero.hurtLock > 0 ? 0 : move) * speed + (wading ? session.level.current || 0 : 0);
  const rate = hero.grounded ? (move ? P.groundAccel : P.groundDecel) : P.airAccel;
  hero.vx = approach(hero.vx, target, rate * dt);

  if (input.jump) hero.jumpBuf = P.jumpBuffer;
  else hero.jumpBuf = Math.max(0, hero.jumpBuf - dt);
  if (hero.grounded) hero.coyote = P.coyote;
  else hero.coyote = Math.max(0, hero.coyote - dt);

  if (hero.jumpBuf > 0 && hero.coyote > 0 && hero.hurtLock <= 0) {
    hero.vy = hero.jumpT > 0 ? P.jump * 1.14 : P.jump;
    hero.jumpBuf = 0;
    hero.coyote = 0;
    hero.grounded = false;
    hero.cut = false;
    burst(session, "jump", hero.x, hero.y + 0.2);
  } else if (!hero.grounded) {
    const grav = hero.inFord ? 16 : P.gravity;
    hero.vy -= grav * dt;
    const cap = hero.inFord ? 5 : P.maxFall;
    if (hero.vy < -cap) hero.vy = -cap;
  } else {
    hero.vy = 0;
  }
  if (hero.vy > 0 && !input.jumpHeld && !hero.cut) {
    hero.vy *= P.jumpCut;
    hero.cut = true;
  }

  const feetBefore = hero.y;
  moveRafts(session, dt);
  moveBody(hero, session, dt, true);
  hero.wading = !!hero.inFord;
  updateExposure(session, dt);
  updateZubr(session, input, dt);
  updateEnemies(session, dt, feetBefore);
  updateShots(session, dt);
  collect(session);
  crushHazards(session);
  if (hero.y < P.pit) fallIn(session);

  const bossAlive = session.enemies.some((e) => e.boss && e.alive);
  if (!bossAlive && session.level.boss && !session.bossDown) {
    session.bossDown = true;
    session.winT = 0;
    burst(session, "sun", session.level.goal.x, session.level.goal.y + 1.4);
  }
  if (!session.level.boss && !bossAlive && reachedGoal(session)) session.status = "won";
}

function reachedGoal(session) {
  const hero = session.hero;
  const goal = session.level.goal;
  return Math.abs(hero.x - goal.x) < 0.85 && Math.abs(hero.y - goal.y) < 1.3;
}

function fallIn(session) {
  const hero = session.hero;
  hero.hearts -= 1;
  session.hurts += 1;
  hero.x = hero.safeX;
  hero.y = hero.safeY;
  hero.vx = 0;
  hero.vy = 0;
  hero.inv = 1.2;
  hero.grounded = true;
  session.shake = 0.3;
  burst(session, "hurt", hero.x, hero.y + 1);
  if (hero.hearts <= 0) session.status = "dead";
}

function moveRafts(session, dt) {
  for (const raft of session.rafts) {
    raft.prevX = raft.x;
    raft.x += raft.dir * raft.speed * dt;
    if (raft.x < raft.minX) {
      raft.x = raft.minX;
      raft.dir = 1;
    } else if (raft.x + raft.w > raft.maxX) {
      raft.x = raft.maxX - raft.w;
      raft.dir = -1;
    }
  }
}

function blockers(session) {
  const list = [];
  for (const gate of session.gates) if (!gate.broken) list.push(gate);
  for (const box of session.baskets) if (!box.broken) list.push(box);
  for (const hay of session.crumbles) if (hay.gone <= 0) list.push(hay);
  return list;
}

function moveBody(body, session, dt, isHero) {
  const prevX = body.x;
  const prevY = body.y;
  body.stoodOn = null;
  body.x += body.vx * dt;
  resolveX(body, session);
  body.y += body.vy * dt;
  body.grounded = false;
  resolveY(body, session);
  ridePlatforms(body, session, prevY);
  rideWater(body, session, prevY);
  rideRaft(body, session, prevY);
  rideSpring(body, session, prevY, dt);
  if (!body.grounded && body.vy <= 0 && footing(session.level, body.x, body.y)) {
    body.grounded = true;
    body.vy = 0;
  }
  if (isHero) rememberSafe(session, body);
  if (isHero && body.grounded && Math.abs(body.x - prevX) > 0.02 && session.time % 0.22 < dt) {
    burst(session, "dust", body.x, body.y);
  }
}

function resolveX(body, session) {
  for (let guard = 0; guard < 3; guard += 1) {
    const hits = collectHits(session.level, body, (tile) => tile === TILE.SOLID || tile === TILE.SPIKE);
    const rects = overlappingRects(body, blockers(session));
    if (!hits.length && !rects.length) return;
    if (body.vx >= 0) {
      let edge = Infinity;
      for (const hit of hits) edge = Math.min(edge, hit.tx);
      for (const rect of rects) edge = Math.min(edge, rect.x - rect.w / 2);
      if (edge === Infinity) return;
      body.x = edge - body.w / 2 - 0.001;
    } else {
      let edge = -Infinity;
      for (const hit of hits) edge = Math.max(edge, hit.tx + 1);
      for (const rect of rects) edge = Math.max(edge, rect.x + rect.w / 2);
      if (edge === -Infinity) return;
      body.x = edge + body.w / 2 + 0.001;
    }
    body.vx = 0;
  }
}

function resolveY(body, session) {
  for (let guard = 0; guard < 3; guard += 1) {
    const hits = collectHits(session.level, body, (tile) => tile === TILE.SOLID || tile === TILE.SPIKE);
    if (!hits.length) return;
    if (body.vy > 0) {
      const ty = Math.min(...hits.map((hit) => hit.ty));
      body.y = ty - body.h - 0.001;
      body.vy = 0;
    } else {
      const floors = hits.filter((hit) => body.y <= hit.ty + 1.05);
      const ty = Math.max(...(floors.length ? floors : hits).map((hit) => hit.ty));
      body.y = ty + 1;
      body.vy = 0;
      body.grounded = true;
      if (hits.some((hit) => hit.tile === TILE.SPIKE)) body.spiked = true;
    }
  }
}

function ridePlatforms(body, session, prevY) {
  if (body.vy > 0) return;
  const left = body.x - body.w / 2;
  const right = body.x + body.w / 2;
  const x0 = Math.floor(left);
  const x1 = Math.floor(right - 0.001);
  const y0 = Math.floor(Math.min(body.y, prevY) - 1);
  const y1 = Math.floor(Math.max(body.y, prevY) + 0.2);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      if (tileAt(session.level, tx, ty) !== TILE.PLATFORM) continue;
      const top = ty + 1;
      if (prevY >= top - 0.08 && body.y <= top + 0.02) {
        body.y = top;
        body.vy = 0;
        body.grounded = true;
      }
    }
  }
  for (const rect of blockers(session)) {
    const top = rect.y + rect.h;
    const xOverlap = right > rect.x - rect.w / 2 && left < rect.x + rect.w / 2;
    if (!xOverlap) continue;
    if (prevY >= top - 0.08 && body.y <= top + 0.05 && body.vy <= 0) {
      body.y = top;
      body.vy = 0;
      body.grounded = true;
      body.stoodOn = rect;
    }
  }
}

function rideWater(body, session, prevY) {
  const surface = waterSurface(session.level, body.x);
  if (surface == null) return;
  if (body.vy <= 0.01 && prevY >= surface - 0.2 && body.y <= surface + 0.08) {
    body.y = surface;
    body.vy = 0;
    body.grounded = true;
    body.inFord = true;
  }
}

function rideRaft(body, session, prevY) {
  const left = body.x - body.w / 2;
  const right = body.x + body.w / 2;
  for (const raft of session.rafts) {
    const top = raft.y + raft.h;
    const xOverlap = right > raft.x && left < raft.x + raft.w;
    if (!xOverlap) continue;
    if (body.vy <= 0 && prevY >= top - 0.12 && body.y <= top + 0.08) {
      body.y = top;
      body.vy = 0;
      body.grounded = true;
      body.inFord = false;
      body.x += raft.x - raft.prevX;
      body.riding = true;
    }
  }
}

function rideSpring(body, session, prevY, dt) {
  for (const spring of session.springs) {
    spring.cd = Math.max(0, spring.cd - dt);
    const top = spring.y + spring.h;
    const xOverlap = Math.abs(body.x - spring.x) < (body.w + spring.w) / 2;
    if (!xOverlap || spring.cd > 0) continue;
    if (prevY >= top - 0.15 && body.y <= top + 0.08 && body.vy <= 0) {
      body.y = top;
      body.vy = P.spring;
      body.grounded = false;
      body.cut = true;
      spring.cd = 0.28;
      burst(session, "spring", spring.x, top);
    }
  }
}

function rememberSafe(session, hero) {
  if (!hero.grounded || hero.inv > 0.2) return;
  if (footing(session.level, hero.x, hero.y) && footing(session.level, hero.x - 0.35, hero.y) && footing(session.level, hero.x + 0.35, hero.y)) {
    hero.safeX = hero.x;
    hero.safeY = hero.y;
  }
}

function footing(level, x, feet) {
  const tx = Math.floor(x);
  const ty = Math.ceil(feet - 1 - 1e-4);
  const tile = tileAt(level, tx, ty);
  return tile === TILE.SOLID || tile === TILE.SPIKE || tile === TILE.PLATFORM || tile === TILE.WATER;
}

export function waterSurface(level, x) {
  const tx = Math.floor(x);
  if (tx < 0 || tx >= level.w) return null;
  let top = null;
  for (let y = 0; y < level.h; y += 1) {
    if (level.tiles[y][tx] === TILE.WATER) top = y + 1;
  }
  return top;
}

function updateExposure(session, dt) {
  const hero = session.hero;
  const bodyTop = hero.y + hero.h * 0.7;
  const inFog = session.level.fogs.some((fog) => hero.x > fog.x && hero.x < fog.x + fog.w && bodyTop > fog.y && hero.y < fog.y + fog.h);
  if (inFog && hero.coolT <= 0) hero.exposure = Math.min(1, hero.exposure + dt / 18);
  else hero.exposure = Math.max(0, hero.exposure - dt / 2.4);
  if (hero.exposure >= 1 && hero.inv <= 0) hurt(session, Math.sign(hero.vx) || 1);
}

function updateZubr(session, input, dt) {
  const zubr = session.zubr;
  const hero = session.hero;
  zubr.cd = Math.max(0, zubr.cd - dt);
  if (zubr.ram > 0) zubr.ram = Math.max(0, zubr.ram - dt);
  if (input.ram && zubr.cd <= 0 && zubr.ram <= 0) {
    zubr.ram = 0.42;
    zubr.cd = 1.15;
    zubr.facing = hero.facing;
    burst(session, "ram", zubr.x, zubr.y + 0.6);
  }
  if (zubr.ram > 0) {
    zubr.vx = zubr.facing * 16;
  } else {
    const tx = hero.x - hero.facing * 1.65;
    const dx = tx - zubr.x;
    zubr.facing = Math.abs(dx) > 0.2 ? Math.sign(dx) : hero.facing;
    zubr.vx = Math.max(-11, Math.min(11, dx * 4.2));
    if (Math.abs(hero.x - zubr.x) > 11 || zubr.y < P.pit + 1) {
      zubr.x = tx;
      zubr.y = hero.y;
      zubr.vy = 0;
    }
  }
  const wasGrounded = zubr.grounded;
  if (!wasGrounded) {
    zubr.vy -= P.gravity * dt;
    if (zubr.vy < -P.maxFall) zubr.vy = -P.maxFall;
  }
  const ahead = zubr.x + zubr.facing * 0.9;
  const wall = tileAt(session.level, Math.floor(ahead), Math.floor(zubr.y + 0.4)) === TILE.SOLID;
  const gap = !footing(session.level, zubr.x + zubr.facing * 0.8, zubr.y) && zubr.ram <= 0;
  const heroHigher = hero.y > zubr.y + 1.15 && Math.abs(hero.x - zubr.x) < 4.5;
  if (zubr.grounded && zubr.ram <= 0 && (wall || gap || heroHigher)) zubr.vy = 13.5;
  moveBody(zubr, session, dt, false);
  if (zubr.ram > 0) ramStrike(session);
  for (const enemy of session.enemies) if (zubr.ram <= 0) enemy.rammed = false;
}

function ramStrike(session) {
  const zubr = session.zubr;
  for (const gate of session.gates) {
    if (gate.broken) continue;
    if (near(zubr, gate, 1.35)) breakRect(session, gate);
  }
  for (const box of session.baskets) {
    if (box.broken) continue;
    if (near(zubr, box, 1.25)) breakRect(session, box);
  }
  for (const enemy of session.enemies) {
    if (!enemy.alive || enemy.rammed) continue;
    if (Math.abs(enemy.x - zubr.x) < (enemy.w + zubr.w) / 2 + 0.2 && Math.abs(enemy.y - zubr.y) < 1.3) {
      enemy.rammed = true;
      enemy.stun = 0.85;
      damageEnemy(session, enemy, 2);
    }
  }
}

function near(body, rect, reach) {
  const dx = rect.x - body.x;
  return Math.sign(dx || body.facing) === body.facing && Math.abs(dx) < reach && Math.abs(body.y - rect.y) < 1.6;
}

function breakRect(session, rect) {
  rect.hp -= 1;
  session.shake = Math.max(session.shake, 0.16);
  burst(session, "break", rect.x, rect.y + rect.h);
  if (rect.hp <= 0) {
    rect.broken = true;
    grantCoins(session, rect.x, rect.y + 0.6, 2);
  }
}

function updateEnemies(session, dt, feetBefore) {
  for (const enemy of session.enemies) {
    if (!enemy.alive) continue;
    enemy.stun = Math.max(0, enemy.stun - dt);
    if (Math.abs(enemy.x - session.hero.x) < 8) meet(session, enemy.id);
    if (enemy.behaviour === "fly") flyEnemy(session, enemy, dt);
    else stepEnemy(session, enemy, dt);
    if (enemy.stun > 0 && enemy.behaviour !== "fly") enemy.vx = 0;
    else actEnemy(session, enemy, dt);
    if (enemy.behaviour !== "fly" && enemy.behaviour !== "lesun") {
      if (!enemy.grounded) {
        enemy.vy -= P.gravity * dt;
        if (enemy.vy < -P.maxFall) enemy.vy = -P.maxFall;
      }
      moveBody(enemy, session, dt, false);
      if (enemy.y < P.pit) enemy.alive = false;
    }
    touchHero(session, enemy, feetBefore);
  }
  if (session.level.boss) maybeSummon(session);
}

function flyEnemy(session, enemy, dt) {
  enemy.x += enemy.dir * enemy.speed * dt;
  if (enemy.x > enemy.originX + enemy.range) enemy.dir = -1;
  if (enemy.x < enemy.originX - enemy.range) enemy.dir = 1;
  const bob = Math.sin(session.time * 2.2 + enemy.phase * 6) * 0.28;
  if (enemy.state === "swoop") {
    enemy.timer -= dt;
    enemy.y += enemy.vy * dt;
    if (enemy.timer <= 0) {
      enemy.state = "patrol";
      enemy.vy = 0;
    }
  } else {
    enemy.y = enemy.originY + bob;
    const hero = session.hero;
    if (enemy.swoop && Math.abs(hero.x - enemy.x) < 2.4 && hero.y < enemy.y) {
      enemy.state = "swoop";
      enemy.timer = 0.55;
      enemy.vy = -7.5;
    }
  }
}

function stepEnemy(session, enemy, dt) {
  if (enemy.behaviour === "lesun") return;
  if (enemy.behaviour === "flee") {
    const dir = Math.sign(enemy.x - session.hero.x) || 1;
    enemy.dir = dir;
    enemy.vx = dir * enemy.speed;
    return;
  }
  if (enemy.behaviour === "spit" && enemy.state !== "patrol") return;
  if (enemy.state === "windup") {
    enemy.vx = 0;
    enemy.timer -= dt;
    if (enemy.timer <= 0) {
      enemy.state = "burst";
      enemy.timer = enemy.behaviour === "leap" ? 0.55 : 0.42;
      enemy.dir = Math.sign(session.hero.x - enemy.x) || enemy.dir;
      enemy.vx = enemy.dir * enemy.burst;
      if (enemy.behaviour === "leap") enemy.vy = 12;
    }
    return;
  }
  if (enemy.state === "burst") {
    enemy.timer -= dt;
    if (enemy.behaviour !== "leap") enemy.vx = enemy.dir * enemy.burst;
    if (enemy.timer <= 0) {
      enemy.state = "cooldown";
      enemy.timer = enemy.cooldown;
      enemy.vx = 0;
    }
    return;
  }
  if (enemy.state === "cooldown") {
    enemy.timer -= dt;
    enemy.vx = enemy.dir * enemy.speed * 0.35;
    if (enemy.timer <= 0) enemy.state = "patrol";
    return;
  }
  enemy.vx = enemy.dir * enemy.speed;
  const probe = enemy.x + enemy.dir * (enemy.w / 2 + 0.15);
  const wall = tileAt(session.level, Math.floor(probe), Math.floor(enemy.y + 0.35));
  if ((wall === TILE.SOLID || wall === TILE.SPIKE) || !footing(session.level, probe, enemy.y)) enemy.dir *= -1;
}

function actEnemy(session, enemy, dt) {
  enemy.timer = enemy.timer;
  const hero = session.hero;
  const see = Math.abs(hero.x - enemy.x) < enemy.sight && Math.abs(hero.y - enemy.y) < 2.4;
  if (enemy.behaviour === "charge" || enemy.behaviour === "leap") {
    if (enemy.state === "patrol" && see && enemy.stun <= 0) {
      enemy.state = "windup";
      enemy.timer = enemy.windup;
    }
  }
  if (enemy.behaviour === "spit" && enemy.state === "patrol" && see && enemy.stun <= 0) {
    enemy.state = "windup";
    enemy.timer = enemy.windup;
    enemy.dir = Math.sign(hero.x - enemy.x) || enemy.dir;
  }
  if (enemy.behaviour === "spit" && enemy.state === "windup") {
    enemy.vx = 0;
    enemy.timer -= dt;
    if (enemy.timer <= 0) {
      spit(session, enemy);
      enemy.state = "cooldown";
      enemy.timer = enemy.cooldown;
    }
  }
  if (enemy.behaviour === "lesun") lesun(session, enemy, dt);
}

function lesun(session, enemy, dt) {
  const hero = session.hero;
  enemy.dir = Math.sign(hero.x - enemy.x) || enemy.dir;
  enemy.timer -= dt;
  if (enemy.state === "patrol") {
    enemy.x += enemy.dir * enemy.speed * 0.6 * dt;
    if (enemy.timer <= 0) {
      enemy.state = "throw";
      enemy.timer = 0.35;
    }
  } else if (enemy.state === "throw") {
    if (enemy.timer <= 0) {
      for (let i = -1; i <= 1; i += 1) {
        session.shots.push({
          x: enemy.x,
          y: enemy.y + enemy.h * 0.7,
          vx: enemy.dir * 6.5 + i * 1.4,
          vy: 6 + i,
          life: 2.2,
          r: 0.22,
        });
      }
      enemy.state = "step";
      enemy.timer = 0.45;
    }
  } else if (enemy.state === "step") {
    if (enemy.timer <= 0) {
      const hop = hero.x + (hero.x > enemy.x ? -3.2 : 3.2);
      enemy.x = Math.max(3, Math.min(session.level.w - 3, hop));
      burst(session, "poof", enemy.x, enemy.y + 1);
      enemy.state = "patrol";
      enemy.timer = 1.35;
    }
  }
  enemy.y = enemy.originY;
}

function maybeSummon(session) {
  const les = session.enemies.find((e) => e.id === "lesun" && e.alive);
  if (!les || session.summoned || les.hp > les.maxHp * 0.5) return;
  session.summoned = true;
  session.enemies.push(spawnEnemy({ id: "wolf", x: Math.max(4, les.x - 3), y: 3 }));
}

function spit(session, enemy) {
  const hero = session.hero;
  const dx = hero.x - enemy.x;
  const dy = hero.y + 0.6 - (enemy.y + enemy.h * 0.6);
  const len = Math.hypot(dx, dy) || 1;
  session.shots.push({
    x: enemy.x + enemy.dir * 0.4,
    y: enemy.y + enemy.h * 0.55,
    vx: (dx / len) * 7.2,
    vy: (dy / len) * 7.2,
    life: 2.4,
    r: enemy.boss ? 0.32 : 0.2,
  });
}

function updateShots(session, dt) {
  for (const shot of session.shots) {
    shot.life -= dt;
    shot.vy -= 8 * dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    const tile = tileAt(session.level, Math.floor(shot.x), Math.floor(shot.y));
    if (tile === TILE.SOLID || tile === TILE.SPIKE) shot.life = 0;
    const hero = session.hero;
    if (shot.life > 0 && Math.abs(shot.x - hero.x) < hero.w / 2 + shot.r && shot.y > hero.y && shot.y < hero.y + hero.h) {
      shot.life = 0;
      hurt(session, Math.sign(shot.x - hero.x) || 1);
    }
  }
  session.shots = session.shots.filter((shot) => shot.life > 0);
}

function touchHero(session, enemy, feetBefore) {
  if (!enemy.alive) return;
  const hero = session.hero;
  const top = enemy.y + enemy.h;
  const xOverlap = Math.abs(hero.x - enemy.x) < (hero.w + enemy.w) / 2 - 0.05;
  const falling = hero.vy < -0.35;
  const stomp = falling && xOverlap && feetBefore >= top - 0.15 && hero.y <= top + 0.3;
  if (enemy.behaviour === "flee") {
    if (stomp || (xOverlap && Math.abs((hero.y + hero.h / 2) - (enemy.y + enemy.h / 2)) < 1)) {
      damageEnemy(session, enemy, 2);
      if (stomp) bounce(hero);
    }
    return;
  }
  if (stomp) {
    if (enemy.spiky) hurt(session, Math.sign(hero.x - enemy.x) || enemy.dir);
    else {
      damageEnemy(session, enemy, 2);
      bounce(hero);
    }
    return;
  }
  const yOverlap = hero.y < top && hero.y + hero.h > enemy.y + 0.15;
  if (xOverlap && yOverlap) hurt(session, Math.sign(hero.x - enemy.x) || enemy.dir);
}

function bounce(hero) {
  hero.vy = hero.jumpBuf > 0 || hero.cut === false ? P.stompBounceHeld : P.stompBounce;
  hero.grounded = false;
  hero.cut = false;
}

function damageEnemy(session, enemy, amount) {
  if (!enemy.alive) return;
  enemy.hp -= amount;
  session.shake = Math.min(0.4, session.shake + (enemy.boss ? 0.2 : 0.1));
  burst(session, "hit", enemy.x, enemy.y + enemy.h);
  if (enemy.hp <= 0) {
    enemy.alive = false;
    grantCoins(session, enemy.x, enemy.y + 0.5, enemy.reward);
    meet(session, enemy.id);
  }
}

function hurt(session, dir) {
  const hero = session.hero;
  if (hero.inv > 0 || session.status !== "play") return;
  if (hero.shield) {
    hero.shield = false;
    hero.inv = 0.45;
    burst(session, "shield", hero.x, hero.y + 1);
    return;
  }
  hero.hearts -= 1;
  session.hurts += 1;
  hero.inv = P.invuln;
  hero.hurtLock = 0.28;
  hero.vy = P.hurtY;
  hero.vx = -Math.sign(dir || 1) * P.hurtX;
  hero.grounded = false;
  session.shake = 0.28;
  burst(session, "hurt", hero.x, hero.y + 1);
  if (hero.hearts <= 0) session.status = "dead";
}

function crushHazards(session) {
  const hero = session.hero;
  if (hero.spiked) {
    hero.spikeT -= STEP;
    if (hero.spikeT <= 0) {
      hurt(session, hero.facing);
      hero.spikeT = 0.7;
    }
  } else hero.spikeT = 0;
  hero.spiked = false;

  if (hero.stoodOn && hero.stoodOn.stand != null) {
    hero.stoodOn.stand += STEP;
    if (hero.stoodOn.stand > 0.8) {
      hero.stoodOn.gone = 3.2;
      hero.stoodOn.stand = 0;
    }
  }
  for (const hay of session.crumbles) {
    if (hay.gone > 0) hay.gone -= STEP;
    if (hero.stoodOn !== hay) hay.stand = Math.max(0, hay.stand - STEP * 0.35);
  }
  for (const box of session.baskets) {
    if (!box.broken && hero.stoodOn === box) breakRect(session, box);
  }
  hero.stoodOn = null;

  if (hero.grounded && hero.inFord) {
    const speed = P.run * (hero.speedT > 0 ? 1.28 : 1) * 0.62;
    /* marker so the renderer can splash; speed already applied next frame via inFord */
    hero.wade = speed;
  }
}

function collect(session) {
  const hero = session.hero;
  if (hero.magnetT > 0) {
    for (const coin of session.coins) {
      if (coin.got) continue;
      const dx = hero.x - coin.x;
      const dy = hero.y + 0.6 - coin.y;
      if (Math.hypot(dx, dy) < 5) {
        coin.x += dx * 8 * STEP;
        coin.y += dy * 8 * STEP;
      }
    }
  }
  for (const coin of session.coins) {
    if (coin.got) continue;
      if (Math.abs(hero.x - coin.x) < 0.7 && Math.abs(hero.y + 0.7 - coin.y) < 0.85) {
      coin.got = true;
      session.pickups += 1;
      grantCoins(session, coin.x, coin.y, 1);
    }
  }
  for (const food of session.foods) {
    if (food.got) continue;
    if (Math.abs(hero.x - food.x) < 0.7 && Math.abs(hero.y + 0.7 - food.y) < 0.9) {
      food.got = true;
      applyFood(session, food.id);
      if (!session.tasted.includes(food.id)) session.tasted.push(food.id);
      burst(session, "eat", food.x, food.y);
    }
  }
}

function grantCoins(session, x, y, count) {
  session.coinsGot += count;
  session.bank += count;
  burst(session, "coin", x, y, { text: `+${count}` });
}

export function applyFood(session, id) {
  const hero = session.hero;
  const effect = FOODS[id]?.effect;
  if (effect === "heal") hero.hearts = Math.min(hero.maxHearts, hero.hearts + 1);
  if (effect === "speed") hero.speedT = 6;
  if (effect === "shield") hero.shield = true;
  if (effect === "jump") hero.jumpT = 6;
  if (effect === "heart") {
    hero.maxHearts = Math.min(5, hero.maxHearts + 1);
    hero.hearts = hero.maxHearts;
  }
  if (effect === "magnet") hero.magnetT = 7;
  if (effect === "cool") {
    hero.exposure = 0;
    hero.coolT = 8;
  }
  if (effect === "snack") {
    if (hero.hearts < hero.maxHearts) hero.hearts += 1;
    else grantCoins(session, hero.x, hero.y + 1, 2);
  }
  if (effect === "coins") grantCoins(session, hero.x, hero.y + 1, 5);
}

function meet(session, id) {
  if (!session.met.includes(id)) session.met.push(id);
}

function burst(session, kind, x, y, extra = {}) {
  session.fx.push({ kind, x, y, life: extra.life ?? 0.45, max: extra.life ?? 0.45, text: extra.text || "" });
  if (session.fx.length > 70) session.fx.shift();
}

function ageFx(session, dt) {
  for (const bit of session.fx) bit.life -= dt;
  session.fx = session.fx.filter((bit) => bit.life > 0);
}

function approach(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  return Math.max(target, value - amount);
}

function collectHits(level, body, pred) {
  const hits = [];
  const left = body.x - body.w / 2;
  const right = body.x + body.w / 2;
  const bottom = body.y;
  const top = body.y + body.h;
  const x0 = Math.floor(left);
  const x1 = Math.floor(right - 0.0001);
  const y0 = Math.floor(bottom);
  const y1 = Math.floor(top - 0.0001);
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      const tile = tileAt(level, tx, ty);
      if (pred(tile, tx, ty)) hits.push({ tx, ty, tile });
    }
  }
  return hits;
}

function overlappingRects(body, rects) {
  const left = body.x - body.w / 2;
  const right = body.x + body.w / 2;
  const bottom = body.y;
  const top = body.y + body.h;
  return rects.filter((rect) => right > rect.x - rect.w / 2 && left < rect.x + rect.w / 2 && bottom < rect.y + rect.h && top > rect.y);
}

export function pathExists(level) {
  const stands = [];
  for (let x = 1; x < level.w - 1; x += 1) {
    for (let y = 0; y < level.h - 2; y += 1) {
      const tile = level.tiles[y][x];
      const above = level.tiles[y + 1][x];
      const head = level.tiles[y + 2]?.[x] ?? TILE.EMPTY;
      const surface = (tile === TILE.SOLID || tile === TILE.SPIKE || tile === TILE.PLATFORM) && above === TILE.EMPTY && head === TILE.EMPTY;
      if (surface) stands.push({ x: x + 0.5, y: y + 1, water: false });
      if (tile === TILE.WATER && above !== TILE.WATER && above !== TILE.SOLID && above !== TILE.SPIKE) {
        stands.push({ x: x + 0.5, y: y + 1, water: true });
      }
    }
  }
  for (const hay of level.crumbles) stands.push({ x: hay.x, y: hay.y + hay.h, water: false });
  for (const raft of level.rafts) stands.push({ x: raft.x + raft.w / 2, y: raft.y + raft.h, water: false });
  if (!stands.length) return false;
  const start = stands.reduce((best, stand) => {
    const score = Math.abs(stand.x - level.hero.x) + Math.abs(stand.y - level.hero.y);
    return score < best.score ? { stand, score } : best;
  }, { stand: stands[0], score: Infinity }).stand;
  const key = (stand) => `${stand.x},${stand.y}`;
  const seen = new Set([key(start)]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    if (Math.abs(node.x - level.goal.x) < 1.4 && Math.abs(node.y - level.goal.y) < 2.2) return true;
    for (const next of stands) {
      if (seen.has(key(next))) continue;
      if (!canTraverse(level, node, next)) continue;
      seen.add(key(next));
      queue.push(next);
    }
  }
  return false;
}

function canTraverse(level, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) <= 1.05 && Math.abs(dy) <= 0.2 && !solidPoint(level, (a.x + b.x) / 2, a.y + 0.4)) return true;
  if ((a.water || b.water) && Math.abs(dx) <= 1.2 && Math.abs(dy) <= 1.2) return true;
  if (dy < -0.4 && Math.abs(dx) <= 1.05 && dropClear(level, a, b)) return true;
  if (Math.abs(dx) <= 6.2 && dy <= 3.5 && dy >= -1.2 && jumpArc(level, a, b, a.water ? 14 : 17)) return true;
  if (dy <= 8 && Math.abs(dx) <= 8 && springNear(level, a) && jumpArc(level, a, b, 26)) return true;
  return false;
}

function springNear(level, stand) {
  return level.springs.some((spring) => Math.abs(spring.x - stand.x) < 1.4 && Math.abs(spring.y + spring.h - stand.y) < 0.9);
}

function dropClear(level, a, b) {
  if (Math.abs(a.x - b.x) > 1.2 || b.y >= a.y - 0.3) return false;
  for (let y = b.y + 0.35; y <= a.y + 0.15; y += 0.4) {
    if (solidPoint(level, b.x, y)) return false;
  }
  return true;
}

function jumpArc(level, a, b, jumpV) {
  const dir = Math.sign(b.x - a.x) || 1;
  let x = a.x;
  let y = a.y;
  let vy = jumpV;
  const vx = 7.5 * dir;
  for (let i = 0; i < 80; i += 1) {
    vy -= 42.5 / 60;
    const nx = x + vx / 60;
    const ny = y + vy / 60;
    if (solidPoint(level, nx, ny + 0.3) || solidPoint(level, nx, ny + 1.15)) return false;
    x = nx;
    y = ny;
    if (Math.abs(x - b.x) < 0.7 && Math.abs(y - b.y) < 0.55) return true;
    if (dir > 0 && x > b.x + 0.8) return false;
    if (dir < 0 && x < b.x - 0.8) return false;
    if (y < Math.min(a.y, b.y) - 3) return false;
  }
  return false;
}

function solidPoint(level, x, y) {
  const tile = tileAt(level, Math.floor(x), Math.floor(y));
  return tile === TILE.SOLID || tile === TILE.SPIKE;
}

export function starsFor(session) {
  let stars = 1;
  const total = session.level.coins.length;
  if (!total || session.pickups >= Math.ceil(total * 0.7)) stars += 1;
  if (session.hurts === 0) stars += 1;
  return stars;
}
