/** The scrolling land: sky, tiles, creatures, and weather. */

import {
  drawCoin, drawCreature, drawFern, drawFood, drawHero, drawProp, drawShrine, drawSun, drawTree, drawZubr,
} from "./art.js";
import { REGIONS, TILE, VIEW, WARDROBE } from "./config.js";

const S = VIEW.s;

export function createCamera() {
  return { x: 0, y: 5.4, snap: true };
}

export function followCamera(cam, hero, dt) {
  const targetX = hero.x + hero.facing * 2.3;
  const targetY = hero.y > 8.5 ? hero.y - 2.2 : 5.6;
  if (cam.snap) {
    cam.x = targetX;
    cam.y = targetY;
    cam.snap = false;
    return;
  }
  const k = 1 - Math.pow(0.002, Math.max(dt, 0.001));
  cam.x += (targetX - cam.x) * k;
  cam.y += (targetY - cam.y) * k;
}

export function worldX(cam, x) {
  return (x - cam.x) * S + VIEW.w / 2;
}

export function worldY(cam, y) {
  return (cam.y - y) * S + VIEW.h * 0.62;
}

export function drawWorld(ctx, session, cam, time, look, reduce) {
  const region = REGIONS[session.level.region];
  const shake = reduce ? 0 : session.shake;
  ctx.save();
  if (shake > 0) ctx.translate(Math.sin(time * 90) * shake * 10, Math.cos(time * 70) * shake * 6);
  drawSky(ctx, region, cam, time);
  drawHills(ctx, region, cam, time);
  drawFarTrees(ctx, region, cam, time);
  drawTiles(ctx, session, cam, region, time);
  drawProps(ctx, session, cam, time);
  drawItems(ctx, session, cam, time);
  drawActors(ctx, session, cam, time, look);
  drawFx(ctx, session, cam);
  if (region.mist) mist(ctx, region, time);
  if (session.hero.exposure > 0.05) fogVeil(ctx, session.hero.exposure);
  ctx.restore();
}

export function drawSky(ctx, region, cam, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  sky.addColorStop(0, region.sky[0]);
  sky.addColorStop(0.55, region.sky[1]);
  sky.addColorStop(1, region.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const sunX = VIEW.w - 220 + Math.sin(time * 0.05) * 12 - (cam?.x || 0) * 2;
  const sunY = region.night ? 120 : 110;
  drawSun(ctx, sunX, sunY, region.night ? 28 : 46, region.night ? "#f4e2b0" : "#fff4c8");
  if (region.night) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 28; i += 1) {
      const px = (i * 97 + 20) % VIEW.w;
      const py = (i * 53) % 220;
      ctx.fillRect(px, py, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 4; i += 1) {
    const px = ((i * 280 - (cam?.x || 0) * 18 + time * 12) % (VIEW.w + 200)) - 100;
    cloud(ctx, px, 70 + (i % 3) * 28, 0.7 + (i % 2) * 0.3);
  }
}

function cloud(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.arc(22, 4, 14, 0, Math.PI * 2);
  ctx.arc(-20, 6, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHills(ctx, region, cam, time) {
  hill(ctx, region.hillFar, 430, 36, 0.008, -cam.x * 16);
  hill(ctx, region.hill, 500, 48, 0.01, -cam.x * 28);
  void time;
}

function hill(ctx, color, base, amp, freq, shift) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.h);
  for (let x = 0; x <= VIEW.w; x += 10) {
    ctx.lineTo(x, base + Math.sin((x + shift) * freq) * amp + Math.sin((x + shift) * freq * 2.3) * amp * 0.3);
  }
  ctx.lineTo(VIEW.w, VIEW.h);
  ctx.fill();
}

function drawFarTrees(ctx, region, cam, time) {
  for (let i = 0; i < 12; i += 1) {
    const span = VIEW.w + 180;
    const x = ((i * 150 - cam.x * S * 0.35) % span + span) % span - 80;
    drawTree(ctx, x, 500, region.tree === "flax" ? "birch" : region.tree, 0.85, time + i);
  }
}

function drawTiles(ctx, session, cam, region, time) {
  const level = session.level;
  const x0 = Math.max(0, Math.floor(cam.x - 12));
  const x1 = Math.min(level.w, Math.ceil(cam.x + 12));
  for (let tx = x0; tx < x1; tx += 1) {
    if (level.tiles[0][tx] === TILE.EMPTY) {
      const x = Math.round(worldX(cam, tx));
      const y = Math.round(worldY(cam, 3));
      ctx.fillStyle = "#1a2830";
      ctx.fillRect(x, y, S + 1, VIEW.h - y);
      ctx.fillStyle = region.water;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y + 18, S + 1, 28);
      ctx.globalAlpha = 1;
    }
    for (let ty = 0; ty < level.h; ty += 1) {
      const tile = level.tiles[ty][tx];
      if (!tile) continue;
      const x = Math.round(worldX(cam, tx));
      const y = Math.round(worldY(cam, ty + 1));
      if (tile === TILE.WATER) {
        const top = level.tiles[ty + 1]?.[tx] !== TILE.WATER;
        water(ctx, x, y, top, region, time, tx);
      } else if (tile === TILE.PLATFORM) {
        log(ctx, x, y, region);
      } else {
        ground(ctx, x, y, tile === TILE.SPIKE, region, tx, ty, level);
      }
    }
  }
  for (const raft of session.rafts) {
    const x = worldX(cam, raft.x);
    const y = worldY(cam, raft.y + raft.h);
    ctx.fillStyle = "#8a5a32";
    ctx.fillRect(x, y, raft.w * S, 14);
    ctx.strokeStyle = "#5c3a22";
    ctx.strokeRect(x, y, raft.w * S, 14);
  }
  for (const hay of session.crumbles) {
    if (hay.gone > 0) continue;
    const x = worldX(cam, hay.x - hay.w / 2);
    const y = worldY(cam, hay.y + hay.h);
    ctx.fillStyle = hay.stand > 0.4 ? "#c4a15a" : "#e2c56a";
    ctx.fillRect(x, y, S, S * 0.7);
    ctx.strokeStyle = "#8a6a28";
    ctx.strokeRect(x, y, S, S * 0.7);
  }
  for (const spring of session.springs) {
    drawFern(ctx, worldX(cam, spring.x), worldY(cam, spring.y), time);
  }
}

function ground(ctx, x, y, spike, region, tx, ty, level) {
  const above = ty + 1 >= level.h || level.tiles[ty + 1][tx] === TILE.EMPTY || level.tiles[ty + 1][tx] === TILE.PLATFORM;
  ctx.fillStyle = above ? region.ground : region.groundDeep;
  ctx.fillRect(x, y, S + 1, S + 1);
  if (above && !spike) {
    ctx.fillStyle = region.grass;
    ctx.fillRect(x, y, S + 1, 12);
    ctx.fillStyle = region.grassDark;
    const tuft = hash(tx, ty);
    if (tuft > 0.4) {
      ctx.fillRect(x + 10 + tuft * 20, y - 6, 3, 8);
      ctx.fillRect(x + 18 + tuft * 10, y - 9, 3, 10);
    }
    if (region.tree === "flax" && tuft > 0.55) {
      drawTree(ctx, x + 20, y + 8, "flax", 0.8, tx);
    } else if (region.id === "polesie" && tuft > 0.72) {
      drawTree(ctx, x + 16, y + 8, "reed", 0.8, tx);
    }
  }
  if (spike) {
    ctx.fillStyle = "#6b4630";
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 10 + i * 16, y + 8);
      ctx.lineTo(x + 16 + i * 16, y - 16);
      ctx.lineTo(x + 22 + i * 16, y + 8);
      ctx.fill();
    }
  }
  const crowded = level.props.some((prop) => Math.abs(prop.x - (tx + 0.5)) < 2.2);
  if (above && !spike && ty === 2 && tx > 8 && hash(tx, ty + 3) > 0.93 && !crowded) {
    drawTree(ctx, x + 8, y + 10, region.tree === "flax" ? "birch" : region.tree, 1, tx * 0.2);
  }
}

function water(ctx, x, y, surface, region, time, tx) {
  ctx.fillStyle = region.water;
  ctx.globalAlpha = 0.88;
  ctx.fillRect(x, y, S + 1, S + 1);
  ctx.globalAlpha = 1;
  if (!surface) return;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= S; i += 8) {
    const wy = y + 6 + Math.sin(time * 3 + tx + i * 0.2) * 2;
    if (i === 0) ctx.moveTo(x + i, wy);
    else ctx.lineTo(x + i, wy);
  }
  ctx.stroke();
}

function log(ctx, x, y, region) {
  ctx.fillStyle = region.wood;
  ctx.fillRect(x + 2, y + 6, S - 4, 18);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 8, y + 32, 16, 3);
}

function drawProps(ctx, session, cam, time) {
  for (const prop of session.level.props) {
    drawProp(ctx, prop.kind, worldX(cam, prop.x), worldY(cam, prop.y), time);
  }
  for (const gate of session.gates) {
    if (gate.broken) continue;
    const x = worldX(cam, gate.x);
    const y = worldY(cam, gate.y + gate.h);
    ctx.fillStyle = "#6b4630";
    ctx.fillRect(x - 8, y, 16, gate.h * S);
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(x - 18, y + 10, 36, 16);
    ctx.strokeStyle = "#9e2b2b";
    ctx.strokeRect(x - 18, y + 10, 36, 16);
  }
  for (const box of session.baskets) {
    if (box.broken) continue;
    const x = worldX(cam, box.x);
    const y = worldY(cam, box.y + box.h);
    ctx.fillStyle = "#c4924a";
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 8);
    ctx.lineTo(x + 16, y + 8);
    ctx.lineTo(x + 12, y + 36);
    ctx.lineTo(x - 12, y + 36);
    ctx.fill();
    ctx.strokeStyle = "#6b4630";
    ctx.stroke();
  }
  const goal = session.level.goal;
  if (session.bossDown && session.level.sun) drawFern(ctx, worldX(cam, goal.x), worldY(cam, goal.y), time);
  else drawShrine(ctx, worldX(cam, goal.x), worldY(cam, goal.y), session.level.sun && session.bossDown);
}

function drawItems(ctx, session, cam, time) {
  for (const coin of session.coins) {
    if (coin.got) continue;
    const bob = Math.sin(time * 4 + coin.x) * 4;
    drawCoin(ctx, worldX(cam, coin.x), worldY(cam, coin.y) + bob, 11);
  }
  for (const food of session.foods) {
    if (food.got) continue;
    drawFood(ctx, food.id, worldX(cam, food.x), worldY(cam, food.y) + Math.sin(time * 3 + food.x) * 3);
  }
  for (const shot of session.shots) {
    ctx.fillStyle = "#d8e6c8";
    ctx.beginPath();
    ctx.arc(worldX(cam, shot.x), worldY(cam, shot.y), shot.r * S, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawActors(ctx, session, cam, time, look) {
  const hero = session.hero;
  const zubr = session.zubr;
  const blink = hero.inv > 0 && Math.sin(time * 40) > 0;
  drawZubr(ctx, worldX(cam, zubr.x), worldY(cam, zubr.y), {
    face: zubr.facing,
    time,
    moving: Math.abs(zubr.vx) > 0.4,
    ram: zubr.ram > 0,
  });
  for (const enemy of session.enemies) {
    if (!enemy.alive) continue;
    if (enemy.state === "windup") {
      ctx.fillStyle = "rgba(196, 51, 58, 0.35)";
      ctx.beginPath();
      ctx.ellipse(worldX(cam, enemy.x), worldY(cam, enemy.y) + 8, enemy.w * S * 0.7, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const face = enemy.dir >= 0 ? 1 : -1;
    const visual = Math.max(0.85, enemy.h / 0.9);
    drawCreature(ctx, enemy.id, worldX(cam, enemy.x), worldY(cam, enemy.y), face, time + enemy.phase, visual);
    if (enemy.boss) {
      const bw = 54;
      const bx = worldX(cam, enemy.x) - bw / 2;
      const by = worldY(cam, enemy.y + enemy.h) - 16;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = "#e0b15a";
      ctx.fillRect(bx, by, bw * Math.max(0, enemy.hp / enemy.maxHp), 6);
    }
  }
  if (!blink) {
    drawHero(ctx, worldX(cam, hero.x), worldY(cam, hero.y), {
      face: hero.facing,
      time,
      moving: Math.abs(hero.vx) > 0.4 && hero.grounded,
      air: !hero.grounded,
      look,
    });
  }
}

function drawFx(ctx, session, cam) {
  ctx.save();
  for (const bit of session.fx) {
    const alpha = Math.max(0, bit.life / bit.max);
    ctx.globalAlpha = alpha;
    const x = worldX(cam, bit.x);
    const y = worldY(cam, bit.y) - (1 - alpha) * 16;
    if (bit.text) {
      ctx.fillStyle = "#fff8e8";
      ctx.font = "700 18px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(bit.text, x, y);
    } else if (bit.kind === "dust") {
      ctx.fillStyle = "#cbb892";
      ctx.fillRect(x, y, 4, 4);
    } else if (bit.kind === "sun") {
      drawSun(ctx, x, y, 18);
    }
  }
  ctx.restore();
}

function mist(ctx, region, time) {
  ctx.fillStyle = `rgba(220, 232, 224, ${0.08 + region.mist * 0.12 + Math.sin(time) * 0.02})`;
  ctx.fillRect(0, VIEW.h * 0.45, VIEW.w, VIEW.h * 0.55);
}

function fogVeil(ctx, amount) {
  ctx.fillStyle = `rgba(210, 224, 214, ${amount * 0.28})`;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function lookFromSave(save) {
  const shirt = WARDROBE.shirt[save.wear.shirt] || WARDROBE.shirt[0];
  const belt = WARDROBE.belt[save.wear.belt] || WARDROBE.belt[0];
  return { cloth: shirt.cloth, trim: shirt.trim, belt: belt.color, hat: save.wear.hat };
}
