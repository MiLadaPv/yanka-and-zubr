/** Screens, the path, and the chest. Buttons are collected for the pointer. */

import {
  INK, PARCHMENT, RED, button, drawCoin, drawCreature, drawFood, drawHeart, drawHero, drawProp, drawSun,
  drawTree, drawZubr, ornament, panel, text,
} from "./art.js";
import { ENEMIES, FOODS, REGIONS, STORY, STR, VIEW, WARDROBE, pick, tr } from "./config.js";
import { drawSky, drawWorld, followCamera, lookFromSave } from "./render.js";

const W = VIEW.w;
const H = VIEW.h;

export function drawFrame(ctx, app, dt) {
  app.buttons = [];
  const lang = app.save.lang;
  if (app.screen === "play" || app.screen === "pause") {
    followCamera(app.cam, app.session.hero, app.screen === "pause" ? 0 : dt);
    drawWorld(ctx, app.session, app.cam, app.time, lookFromSave(app.save), app.reduce);
    hud(ctx, app, lang);
    if (app.screen === "pause") pause(ctx, app, lang);
    return;
  }
  if (app.screen === "home") return home(ctx, app, lang);
  if (app.screen === "story") return story(ctx, app, lang);
  if (app.screen === "map") return map(ctx, app, lang);
  if (app.screen === "help") return help(ctx, app, lang);
  if (app.screen === "album") return album(ctx, app, lang);
  if (app.screen === "chest") return chest(ctx, app, lang);
  if (app.screen === "complete" || app.screen === "fail") return result(ctx, app, lang);
  if (app.screen === "ending") return ending(ctx, app, lang);
  home(ctx, app, lang);
}

function home(ctx, app, lang) {
  const region = REGIONS[0];
  drawSky(ctx, region, { x: app.time * 0.15, y: 5 }, app.time);
  hillBand(ctx, region);
  drawTree(ctx, 120, 520, "oak", 1.3, app.time);
  drawTree(ctx, 250, 540, "birch", 1, app.time);
  drawProp(ctx, "cottage", 430, 560, app.time);
  ctx.save();
  ctx.translate(690, 590);
  ctx.scale(1.7, 1.7);
  drawZubr(ctx, -36, 0, { face: 1, time: app.time, moving: false });
  drawHero(ctx, 48, -6, { face: 1, time: app.time, moving: Math.sin(app.time * 2) > 0, look: lookFromSave(app.save) });
  ctx.restore();
  drawTree(ctx, 980, 530, "pine", 1.15, app.time);
  ctx.fillStyle = "rgba(20, 28, 18, 0.28)";
  ctx.fillRect(0, 0, W, 150);
  text(ctx, lang === "be" ? "ЯНКА І ЗУБР" : "YANKA & ZUBR", 64, 78, 64, "#fff8ec", "left");
  text(ctx, tr(lang, "subtitle"), 68, 124, 22, "#f4e4c8", "left", 600);
  const quotes = ["quote1", "quote2", "quote3", "quote4"];
  text(ctx, tr(lang, quotes[Math.floor(app.time / 4) % quotes.length]), 68, 168, 18, "#fff1c9", "left", 500);

  panel(ctx, 860, 150, 360, 500);
  const items = [
    ["play", tr(lang, "play"), true],
    ["path", tr(lang, "path"), false],
    ["story", tr(lang, "story"), false],
    ["album", tr(lang, "album"), false],
    ["chest", tr(lang, "chest"), false],
    ["help", tr(lang, "help"), false],
  ];
  items.forEach((item, index) => {
    const y = 200 + index * 62;
    hit(app, item[0], 888, y, 304, 52);
    button(ctx, 888, y, 304, 52, item[1], item[2] || hover(app, 888, y, 304, 52));
  });
  chip(ctx, app, "lang", 888, 590, 90, 36, lang === "be" ? "EN" : "БЕ");
  chip(ctx, app, "music", 990, 590, 90, 36, app.save.music ? "♪" : "♪×");
  chip(ctx, app, "sound", 1092, 590, 90, 36, app.save.sound ? "◉" : "○");
  drawCoin(ctx, 80, 660, 14);
  text(ctx, String(app.save.coins), 100, 660, 22, "#fff8ec");
  drawSun(ctx, 190, 658, 16);
  text(ctx, String(app.save.suns.reduce((sum, sun) => sum + sun, 0)) + "/6", 210, 660, 22, "#fff8ec");
}

function story(ctx, app, lang) {
  backdrop(ctx, app, 0);
  panel(ctx, 140, 80, 1000, 560);
  text(ctx, tr(lang, "storyTitle"), W / 2, 130, 36, INK, "center");
  const page = STORY[app.storyPage];
  wrap(ctx, pick(lang, page.en, page.be), 200, 200, 880, 28, INK);
  text(ctx, `${app.storyPage + 1} / ${STORY.length}`, W / 2, 500, 18, "#6b5344", "center", 600);
  const last = app.storyPage >= STORY.length - 1;
  hit(app, "story-skip", 200, 540, 200, 56);
  button(ctx, 200, 540, 200, 56, tr(lang, "skip"), false);
  hit(app, "story-next", 820, 540, 260, 56);
  button(ctx, 820, 540, 260, 56, last ? tr(lang, "onTheRoad") : tr(lang, "more"), true);
}

function map(ctx, app, lang) {
  backdrop(ctx, app, 2);
  panel(ctx, 40, 30, 1200, 660);
  text(ctx, tr(lang, "path"), W / 2, 78, 40, INK, "center");
  text(ctx, pick(lang, "Six suns, one road home.", "Шэсць сонцаў, адна дарога дахаты."), W / 2, 118, 20, "#6b5344", "center", 500);
  REGIONS.forEach((region, regionIndex) => {
    const x = 120 + regionIndex * 190;
    text(ctx, pick(lang, region.short, region.shortBe), x + 40, 170, 18, INK, "center");
    if (app.save.suns[regionIndex]) drawSun(ctx, x + 40, 196, 10);
    for (let step = 0; step < 3; step += 1) {
      const index = regionIndex * 3 + step;
      const level = app.levels[index];
      const y = 240 + step * 130;
      const open = index <= app.save.unlocked;
      const here = index === app.mapCursor;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + 40, y, 28, 0, Math.PI * 2);
      ctx.fillStyle = !open ? "#d9cbb4" : level.sun ? "#e0b15a" : "#1e6b43";
      ctx.fill();
      if (here) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = RED;
        ctx.stroke();
      }
      ctx.fillStyle = "#fff8ec";
      ctx.font = "700 20px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(open ? String(index + 1) : "·", x + 40, y + 1);
      ctx.restore();
      const stars = app.save.stars[level.id] || 0;
      text(ctx, "★★★".slice(0, stars) + "☆☆☆".slice(stars), x + 40, y + 42, 14, "#a87420", "center");
      if (open) hit(app, `level-${index}`, x + 8, y - 32, 64, 64);
    }
  });
  const selected = app.levels[app.mapCursor];
  if (selected && app.mapCursor <= app.save.unlocked) {
    text(ctx, pick(lang, selected.name, selected.be), W / 2, 630, 26, INK, "center");
  }
  hit(app, "back-home", 70, 80, 140, 48);
  button(ctx, 70, 80, 140, 48, tr(lang, "back"), false);
}

function help(ctx, app, lang) {
  backdrop(ctx, app, 3);
  panel(ctx, 120, 60, 1040, 600);
  text(ctx, tr(lang, "helpTitle"), W / 2, 110, 36, INK, "center");
  ["help1", "help2", "help3", "help4"].forEach((key, index) => {
    const y = 180 + index * 100;
    drawSun(ctx, 190, y, 12, index % 2 ? "#9e2b2b" : "#e0b15a");
    wrap(ctx, tr(lang, key), 230, y - 24, 860, 24, INK);
  });
  hit(app, "back-home", 500, 580, 280, 56);
  button(ctx, 500, 580, 280, 56, tr(lang, "back"), true);
}

function album(ctx, app, lang) {
  backdrop(ctx, app, 1);
  panel(ctx, 50, 36, 1180, 650);
  text(ctx, tr(lang, "albumTitle"), W / 2, 78, 34, INK, "center");
  const tabs = [["beasts", "beasts"], ["foods", "foods"], ["places", "places"]];
  tabs.forEach((tab, index) => {
    const x = 90 + index * 200;
    hit(app, `tab-${tab[0]}`, x, 110, 180, 44);
    button(ctx, x, 110, 180, 44, tr(lang, tab[1]), app.albumTab === tab[0]);
  });
  if (app.albumTab === "beasts") grid(ctx, app, lang, Object.keys(ENEMIES), (id, x, y) => {
    const known = app.save.seen.includes(id);
    if (known) drawCreature(ctx, id, x + 50, y + 78, 1, app.time, 0.8);
    else text(ctx, "?", x + 50, y + 60, 32, "#b7a48c", "center");
    text(ctx, known ? pick(lang, ENEMIES[id].en, ENEMIES[id].be) : "…", x + 50, y + 100, 16, INK, "center", 600);
  });
  if (app.albumTab === "foods") grid(ctx, app, lang, Object.keys(FOODS), (id, x, y) => {
    const known = app.save.foods.includes(id);
    if (known) drawFood(ctx, id, x + 50, y + 58);
    text(ctx, known ? pick(lang, FOODS[id].en, FOODS[id].be) : "…", x + 50, y + 100, 16, INK, "center", 600);
  });
  if (app.albumTab === "places") {
    REGIONS.forEach((region, index) => {
      const x = 90 + (index % 3) * 370;
      const y = 180 + Math.floor(index / 3) * 200;
      const known = app.save.places.includes(region.id);
      ctx.fillStyle = known ? "#fff8ec" : "#e7d7bc";
      ctx.fillRect(x, y, 340, 170);
      ctx.strokeStyle = RED;
      ctx.strokeRect(x, y, 340, 170);
      text(ctx, known ? pick(lang, region.en, region.be) : "…", x + 170, y + 28, 20, INK, "center");
      if (known) wrap(ctx, pick(lang, region.fact, region.factBe), x + 16, y + 52, 308, 18, "#3e3128");
    });
  }
  hit(app, "back-home", 980, 110, 180, 44);
  button(ctx, 980, 110, 180, 44, tr(lang, "back"), false);
}

function grid(ctx, app, lang, ids, paint) {
  ids.forEach((id, index) => {
    const x = 80 + (index % 6) * 190;
    const y = 180 + Math.floor(index / 6) * 150;
    ctx.fillStyle = "#fff8ec";
    ctx.fillRect(x, y, 170, 130);
    ctx.strokeStyle = "#1e6b43";
    ctx.strokeRect(x, y, 170, 130);
    paint(id, x, y, lang);
  });
  void app;
}

function chest(ctx, app, lang) {
  backdrop(ctx, app, 4);
  panel(ctx, 70, 40, 1140, 640);
  text(ctx, tr(lang, "chestTitle"), W / 2, 86, 36, INK, "center");
  drawHero(ctx, 180, 280, { face: 1, time: app.time, look: lookFromSave(app.save) });
  drawCoin(ctx, 150, 330, 12);
  text(ctx, String(app.save.coins), 168, 330, 22, INK);
  column(ctx, app, lang, "shirt", 340, pick(lang, "Shirt", "Вышыванка"));
  column(ctx, app, lang, "belt", 620, pick(lang, "Belt", "Пояс"));
  column(ctx, app, lang, "hat", 900, pick(lang, "Head", "Галава"));
  hit(app, "back-home", 500, 600, 280, 52);
  button(ctx, 500, 600, 280, 52, tr(lang, "back"), true);
}

function column(ctx, app, lang, slot, x, title) {
  text(ctx, title, x + 90, 140, 22, INK, "center");
  WARDROBE[slot].forEach((item, index) => {
    const y = 170 + index * 90;
    const owned = app.save.owned[slot].includes(index);
    const worn = app.save.wear[slot] === index;
    hit(app, `${owned ? "wear" : "buy"}-${slot}-${index}`, x, y, 220, 64);
    button(ctx, x, y, 220, 48, pick(lang, item.en, item.be), worn, !owned && app.save.coins < item.cost);
    text(ctx, worn ? tr(lang, "worn") : owned ? tr(lang, "wear") : String(item.cost), x + 110, y + 58, 13, "#6b5344", "center", 600);
  });
}

function result(ctx, app, lang) {
  const session = app.session;
  const region = REGIONS[session.level.region];
  drawSky(ctx, region, { x: 0, y: 5 }, app.time);
  panel(ctx, 180, 70, 920, 580);
  const won = app.screen === "complete";
  text(ctx, won ? (session.level.sun ? tr(lang, "sunFound") : tr(lang, "roadClear")) : tr(lang, "failed"), W / 2, 120, 34, INK, "center");
  text(ctx, pick(lang, session.level.name, session.level.be), W / 2, 168, 24, "#6b5344", "center", 600);
  if (won) {
    const stars = app.awardedStars || 1;
    text(ctx, "★★★".slice(0, stars) + "☆☆☆".slice(stars), W / 2, 220, 36, "#a87420", "center");
    wrap(ctx, pick(lang, session.level.note, session.level.noteBe), 240, 270, 800, 24, INK);
    wrap(ctx, pick(lang, region.fact, region.factBe), 240, 360, 800, 22, "#3e3128");
    hit(app, "complete-next", 250, 540, 300, 58);
    button(ctx, 250, 540, 300, 58, session.level.index >= app.levels.length - 1 ? tr(lang, "home") : tr(lang, "next"), true);
    hit(app, "complete-map", 730, 540, 280, 58);
    button(ctx, 730, 540, 280, 58, tr(lang, "map"), false);
  } else {
    wrap(ctx, tr(lang, "failedBody"), 260, 280, 760, 28, INK);
    drawZubr(ctx, W / 2, 430, { face: 1, time: app.time, moving: false });
    hit(app, "fail-retry", 250, 540, 300, 58);
    button(ctx, 250, 540, 300, 58, tr(lang, "retry"), true);
    hit(app, "fail-map", 730, 540, 280, 58);
    button(ctx, 730, 540, 280, 58, tr(lang, "map"), false);
  }
}

function ending(ctx, app, lang) {
  const region = REGIONS[5];
  drawSky(ctx, region, { x: app.time * 0.2, y: 5 }, app.time);
  drawProp(ctx, "bonfire", 360, 560, app.time);
  drawProp(ctx, "cottage", 860, 560, app.time);
  drawHero(ctx, 560, 575, { face: 1, time: app.time, look: lookFromSave(app.save) });
  drawZubr(ctx, 680, 580, { face: -1, time: app.time, moving: false });
  for (let i = 0; i < 6; i += 1) drawSun(ctx, 280 + i * 120, 150, 18);
  panel(ctx, 160, 190, 960, 280);
  text(ctx, tr(lang, "endingTitle"), W / 2, 230, 36, INK, "center");
  wrap(ctx, tr(lang, "endingBody"), 200, 270, 880, 24, INK);
  hit(app, "back-home", 500, 560, 280, 58);
  button(ctx, 500, 560, 280, 58, tr(lang, "home"), true);
}

function hud(ctx, app, lang) {
  const session = app.session;
  const hero = session.hero;
  for (let i = 0; i < hero.maxHearts; i += 1) drawHeart(ctx, 48 + i * 36, 42, 1, i < hero.hearts);
  if (hero.shield) text(ctx, "✦", 48 + hero.maxHearts * 36, 40, 22, "#e0b15a");
  drawCoin(ctx, 48, 84, 12);
  text(ctx, String(app.save.coins + session.bank), 68, 84, 22, "#fff8ec");
  if (hero.exposure > 0.04) {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(40, 108, 160, 10);
    ctx.fillStyle = "#d8e6dc";
    ctx.fillRect(40, 108, 160 * hero.exposure, 10);
    text(ctx, tr(lang, "fog"), 210, 112, 14, "#fff8ec", "left", 600);
  }
  const level = session.level;
  text(ctx, pick(lang, level.name, level.be), W / 2, 36, 24, "#fff8ec", "center");
  if (session.time < 7 && level.hint) {
    text(ctx, pick(lang, level.hint, level.hintBe), W / 2, 68, 18, "#fff1c9", "center", 600);
  }
  hit(app, "pause", W - 90, 24, 64, 48);
  button(ctx, W - 90, 24, 64, 48, "II", false);
  const ready = session.zubr.cd <= 0;
  hold(app, "left", 36, H - 110, 90, 70);
  hold(app, "right", 140, H - 110, 90, 70);
  hold(app, "jump", W - 250, H - 120, 100, 80);
  hold(app, "ram", W - 130, H - 120, 100, 80);
  button(ctx, 36, H - 110, 90, 70, "←", hover(app, 36, H - 110, 90, 70));
  button(ctx, 140, H - 110, 90, 70, "→", hover(app, 140, H - 110, 90, 70));
  button(ctx, W - 250, H - 120, 100, 80, tr(lang, "jump"), false);
  button(ctx, W - 130, H - 120, 100, 80, tr(lang, "ram"), ready);
  const boss = session.enemies.find((enemy) => enemy.boss && enemy.alive);
  if (boss) text(ctx, pick(lang, ENEMIES[boss.id].en, ENEMIES[boss.id].be), W / 2, H - 36, 18, "#fff8ec", "center", 600);
}

function pause(ctx, app, lang) {
  ctx.fillStyle = "rgba(12, 18, 14, 0.45)";
  ctx.fillRect(0, 0, W, H);
  panel(ctx, 390, 160, 500, 400);
  text(ctx, tr(lang, "pause"), W / 2, 220, 40, INK, "center");
  hit(app, "resume", 460, 280, 360, 60);
  button(ctx, 460, 280, 360, 60, tr(lang, "resume"), true);
  hit(app, "retry", 460, 360, 360, 60);
  button(ctx, 460, 360, 360, 60, tr(lang, "retry"), false);
  hit(app, "give-up", 460, 440, 360, 60);
  button(ctx, 460, 440, 360, 60, tr(lang, "map"), false);
}

function backdrop(ctx, app, regionIndex) {
  const region = REGIONS[regionIndex];
  drawSky(ctx, region, { x: app.time * 0.1, y: 5 }, app.time);
  hillBand(ctx, region);
}

function hillBand(ctx, region) {
  ctx.fillStyle = region.grass;
  ctx.fillRect(0, 560, W, 160);
  ctx.fillStyle = region.ground;
  ctx.fillRect(0, 600, W, 120);
}

function chip(ctx, app, id, x, y, w, h, label) {
  hit(app, id, x, y, w, h);
  button(ctx, x, y, w, h, label, hover(app, x, y, w, h));
}

function hit(app, id, x, y, w, h) {
  app.buttons.push({ id, x, y, w, h });
}

function hold(app, id, x, y, w, h) {
  app.buttons.push({ id, x, y, w, h, hold: id });
}

function hover(app, x, y, w, h) {
  const p = app.pointer;
  return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
}

function wrap(ctx, value, x, y, width, size, color) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const words = value.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > width) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += size + 8;
    } else line = trial;
  }
  if (line) ctx.fillText(line, x, yy);
}

void PARCHMENT;
void ornament;
void RED;
void STR;
