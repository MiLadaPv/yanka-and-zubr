/** Local progress. Pure normalize() is what the tests trust. */

export const SAVE_KEY = "yanka-zubr-save-v1";

export function defaultSave() {
  return {
    version: 1,
    unlocked: 0,
    coins: 0,
    stars: {},
    suns: [0, 0, 0, 0, 0, 0],
    seen: [],
    foods: [],
    places: [],
    story: false,
    music: true,
    sound: true,
    lang: "en",
    wear: { shirt: 0, belt: 0, hat: 0 },
    owned: { shirt: [0], belt: [0], hat: [0] },
  };
}

export function normalize(raw) {
  const base = defaultSave();
  if (!raw || typeof raw !== "object") return base;
  const save = { ...base, ...raw, version: 1 };
  save.wear = { ...base.wear, ...(raw.wear || {}) };
  save.owned = {
    shirt: unique(raw.owned?.shirt, [0]),
    belt: unique(raw.owned?.belt, [0]),
    hat: unique(raw.owned?.hat, [0]),
  };
  save.suns = Array.from({ length: 6 }, (_, i) => (raw.suns && raw.suns[i] ? 1 : 0));
  save.stars = raw.stars && typeof raw.stars === "object" ? { ...raw.stars } : {};
  save.seen = Array.isArray(raw.seen) ? [...new Set(raw.seen)] : [];
  save.foods = Array.isArray(raw.foods) ? [...new Set(raw.foods)] : [];
  save.places = Array.isArray(raw.places) ? [...new Set(raw.places)] : [];
  save.unlocked = Math.max(0, Number(save.unlocked) || 0);
  save.coins = Math.max(0, Number(save.coins) || 0);
  save.lang = save.lang === "be" ? "be" : "en";
  save.music = save.music !== false;
  save.sound = save.sound !== false;
  save.story = !!save.story;
  return save;
}

function unique(list, fallback) {
  const nums = Array.isArray(list) ? list.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0) : [];
  return [...new Set([...(nums.length ? nums : fallback)])];
}

export function loadSave() {
  try {
    if (typeof localStorage === "undefined") return defaultSave();
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function writeSave(save) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private mode and full disks should not crash the road */
  }
}
