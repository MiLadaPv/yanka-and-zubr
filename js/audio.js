/** Soft folk drones. Everything is synthesized so the game stays one folder. */

const MODES = [
  [262, 311, 349, 392, 466],
  [220, 262, 311, 349, 415],
  [247, 294, 330, 392, 440],
  [294, 349, 392, 466, 523],
  [262, 330, 392, 440, 494],
  [196, 247, 294, 311, 392],
];

const PATTERN = [0, 2, 4, 2, 3, 1, 4, 2];

export function createAudio() {
  const state = { ctx: null, music: true, sound: true, timer: 0, step: 0, region: 0, master: null };

  function context() {
    if (!state.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      state.ctx = new AC();
      state.master = state.ctx.createGain();
      state.master.gain.value = 0.9;
      state.master.connect(state.ctx.destination);
    }
    if (state.ctx.state === "suspended") state.ctx.resume();
    return state.ctx;
  }

  function blip(freq, dur, type, vol, slide = 0) {
    if (!state.sound) return;
    const ctx = context();
    if (!ctx || !state.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(state.master);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  return {
    unlock() {
      context();
    },
    setMusic(on) {
      state.music = on;
    },
    setSound(on) {
      state.sound = on;
    },
    region(index) {
      state.region = index;
    },
    tick(dt) {
      if (!state.music) return;
      state.timer -= dt;
      if (state.timer > 0) return;
      state.timer = 0.48;
      const scale = MODES[state.region % MODES.length];
      const note = scale[PATTERN[state.step % PATTERN.length]];
      state.step += 1;
      if (!state.sound && !state.music) return;
      const ctx = context();
      if (!ctx || !state.master) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = state.step % 4 === 0 ? "triangle" : "sine";
      osc.frequency.value = note;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.018, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(state.master);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    },
    jump() {
      blip(420, 0.12, "square", 0.03, 180);
    },
    coin() {
      blip(660, 0.08, "sine", 0.04, 220);
    },
    stomp() {
      blip(180, 0.1, "triangle", 0.05, -40);
    },
    hurt() {
      blip(140, 0.18, "sawtooth", 0.04, -70);
    },
    ram() {
      blip(90, 0.22, "triangle", 0.06, 30);
    },
    win() {
      blip(523, 0.12, "sine", 0.04, 0);
      setTimeout(() => blip(659, 0.14, "sine", 0.04, 0), 120);
      setTimeout(() => blip(784, 0.2, "sine", 0.04, 0), 240);
    },
    bite() {
      blip(520, 0.07, "square", 0.025, 40);
    },
  };
}
