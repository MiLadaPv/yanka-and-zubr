/** Boots the road, keeps the save, and turns clicks into a journey. */

import { createAudio } from "./audio.js";
import { REGIONS, STORY, WARDROBE } from "./config.js";
import { campaign } from "./levels.js";
import { createCamera } from "./render.js";
import { loadSave, writeSave } from "./save.js";
import { createSession, starsFor, update } from "./sim.js";
import { drawFrame } from "./ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const params = new URLSearchParams(location.search);

const app = {
  screen: "home",
  save: loadSave(),
  levels: campaign(),
  session: null,
  cam: createCamera(),
  buttons: [],
  pointer: { x: -1, y: -1 },
  held: { left: false, right: false, jump: false, ram: false },
  keys: new Set(),
  edge: { jump: false, ram: false },
  time: 0,
  storyPage: 0,
  mapCursor: 0,
  albumTab: "beasts",
  pending: 0,
  banked: false,
  awardedStars: 1,
  audio: createAudio(),
  reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const pointers = new Map();

function fit() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  canvas.style.width = `${Math.floor(1280 * scale)}px`;
  canvas.style.height = `${Math.floor(720 * scale)}px`;
  canvas.width = Math.round(1280 * dpr);
  canvas.height = Math.round(720 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function pos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 720,
  };
}

function inside(button, point) {
  return point.x >= button.x && point.x <= button.x + button.w && point.y >= button.y && point.y <= button.y + button.h;
}

function persist() {
  writeSave(app.save);
  app.audio.setMusic(app.save.music);
  app.audio.setSound(app.save.sound);
}

function startLevel(index) {
  const level = app.levels[index];
  if (!level || index > app.save.unlocked) return;
  app.session = createSession(level);
  app.cam = createCamera();
  app.screen = "play";
  app.pending = 0;
  app.banked = false;
  app.audio.region(level.region);
  const place = REGIONS[level.region].id;
  if (!app.save.places.includes(place)) app.save.places.push(place);
  persist();
}

function finishLevel() {
  if (app.banked || !app.session) return;
  app.banked = true;
  const session = app.session;
  const stars = starsFor(session);
  app.awardedStars = stars;
  const previous = app.save.stars[session.level.id] || 0;
  app.save.stars[session.level.id] = Math.max(previous, stars);
  app.save.coins += session.bank;
  if (session.level.sun) app.save.suns[session.level.region] = 1;
  app.save.unlocked = Math.max(app.save.unlocked, (session.level.index ?? 0) + 1);
  for (const id of session.met) if (!app.save.seen.includes(id)) app.save.seen.push(id);
  for (const id of session.tasted) if (!app.save.foods.includes(id)) app.save.foods.push(id);
  app.save.story = true;
  persist();
  app.audio.win();
  const whole = app.save.suns.every(Boolean) && session.level.index === app.levels.length - 1;
  app.screen = whole ? "ending" : "complete";
}

function activate(id) {
  if (id === "play") {
    if (!app.save.story) {
      app.storyPage = 0;
      app.screen = "story";
    } else {
      app.mapCursor = Math.min(app.save.unlocked, app.levels.length - 1);
      app.screen = "map";
    }
  } else if (id === "path") {
    app.mapCursor = Math.min(app.save.unlocked, app.levels.length - 1);
    app.screen = "map";
  } else if (id === "story") {
    app.storyPage = 0;
    app.screen = "story";
  } else if (id === "album") app.screen = "album";
  else if (id === "chest") app.screen = "chest";
  else if (id === "help") app.screen = "help";
  else if (id === "back-home") app.screen = "home";
  else if (id === "lang") {
    app.save.lang = app.save.lang === "be" ? "en" : "be";
    persist();
  } else if (id === "music") {
    app.save.music = !app.save.music;
    persist();
  } else if (id === "sound") {
    app.save.sound = !app.save.sound;
    persist();
  } else if (id === "story-skip" || (id === "story-next" && app.storyPage >= STORY.length - 1)) {
    app.save.story = true;
    persist();
    app.mapCursor = Math.min(app.save.unlocked, app.levels.length - 1);
    app.screen = "map";
  } else if (id === "story-next") app.storyPage += 1;
  else if (id.startsWith("level-")) {
    const index = Number(id.slice(6));
    app.mapCursor = index;
    startLevel(index);
  } else if (id.startsWith("tab-")) app.albumTab = id.slice(4);
  else if (id.startsWith("wear-") || id.startsWith("buy-")) dress(id);
  else if (id === "pause") app.screen = "pause";
  else if (id === "resume") app.screen = "play";
  else if (id === "retry" || id === "fail-retry") startLevel(app.session.level.index);
  else if (id === "give-up" || id === "fail-map" || id === "complete-map") {
    app.mapCursor = app.session ? Math.min(app.session.level.index, app.save.unlocked) : 0;
    app.screen = "map";
  } else if (id === "complete-next") {
    const next = app.session.level.index + 1;
    if (next >= app.levels.length) app.screen = "home";
    else startLevel(next);
  }
}

function dress(id) {
  const [, slot, raw] = id.split("-");
  const index = Number(raw);
  const item = WARDROBE[slot]?.[index];
  if (!item) return;
  if (app.save.owned[slot].includes(index)) app.save.wear[slot] = index;
  else if (app.save.coins >= item.cost) {
    app.save.coins -= item.cost;
    app.save.owned[slot].push(index);
    app.save.wear[slot] = index;
  }
  persist();
}

function readInput() {
  const jumpHeld = app.keys.has("Space") || app.keys.has("KeyW") || app.keys.has("ArrowUp") || app.held.jump;
  const input = {
    left: app.keys.has("ArrowLeft") || app.keys.has("KeyA") || app.held.left,
    right: app.keys.has("ArrowRight") || app.keys.has("KeyD") || app.held.right,
    jump: app.edge.jump,
    jumpHeld,
    ram: app.edge.ram,
  };
  app.edge.jump = false;
  app.edge.ram = false;
  return input;
}

function loop(now) {
  const dt = Math.min(0.033, (now - (loop.last || now)) / 1000);
  loop.last = now;
  app.time += dt;
  if (app.screen === "play" && app.session) {
    update(app.session, readInput(), dt);
    if (app.session.status === "won") {
      app.pending += dt;
      if (app.pending > 0.6) finishLevel();
    } else if (app.session.status === "dead") {
      app.pending += dt;
      if (app.pending > 0.45) app.screen = "fail";
    } else app.pending = 0;
  }
  if (app.save.music) app.audio.tick(dt);
  drawFrame(ctx, app, dt);
  requestAnimationFrame(loop);
}

window.addEventListener("resize", fit);
window.addEventListener("keydown", (event) => {
  app.keys.add(event.code);
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
  if (event.code === "Space" || event.code === "KeyW" || event.code === "ArrowUp") app.edge.jump = true;
  if (event.code === "KeyE" || event.code === "KeyJ" || event.code === "ShiftLeft" || event.code === "ShiftRight") app.edge.ram = true;
  if (event.code === "Escape") {
    if (app.screen === "play") app.screen = "pause";
    else if (app.screen === "pause") app.screen = "play";
    else if (app.screen !== "home") app.screen = "home";
  }
  if (event.code === "KeyR" && app.session && (app.screen === "play" || app.screen === "fail")) startLevel(app.session.level.index);
  if (app.screen === "map") {
    if (event.code === "ArrowRight") app.mapCursor = Math.min(app.levels.length - 1, app.mapCursor + 1);
    if (event.code === "ArrowLeft") app.mapCursor = Math.max(0, app.mapCursor - 1);
    if (event.code === "ArrowDown") app.mapCursor = Math.min(app.levels.length - 1, app.mapCursor + 3);
    if (event.code === "ArrowUp") app.mapCursor = Math.max(0, app.mapCursor - 3);
    if (app.mapCursor > app.save.unlocked) app.mapCursor = app.save.unlocked;
    if (event.code === "Enter") startLevel(app.mapCursor);
  }
});
window.addEventListener("keyup", (event) => app.keys.delete(event.code));

canvas.addEventListener("pointerdown", (event) => {
  canvas.focus();
  app.audio.unlock();
  const point = pos(event);
  app.pointer = point;
  const button = [...app.buttons].reverse().find((item) => inside(item, point));
  if (!button) return;
  if (button.hold && app.screen === "play") {
    app.held[button.hold] = true;
    if (button.hold === "jump") app.edge.jump = true;
    if (button.hold === "ram") app.edge.ram = true;
    pointers.set(event.pointerId, button.hold);
    return;
  }
  activate(button.id);
});
canvas.addEventListener("pointerup", (event) => {
  const hold = pointers.get(event.pointerId);
  if (hold) app.held[hold] = false;
  pointers.delete(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  app.pointer = pos(event);
});
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

fit();
app.audio.setMusic(app.save.music);
app.audio.setSound(app.save.sound);
app.mapCursor = Math.min(app.save.unlocked, app.levels.length - 1);
if (params.has("level")) startLevel(Number(params.get("level")) || 0);
canvas.focus();
requestAnimationFrame(loop);
