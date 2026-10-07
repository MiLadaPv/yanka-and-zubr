/** Folk drawings: Yanka, Zubr, the woods, and the rushnik frames. */

export const INK = "#2a1c14";
export const PARCHMENT = "#f4e4c8";
export const RED = "#9e2b2b";
export const GREEN = "#1e6b43";
export const GOLD = "#e0b15a";

export function font(ctx, size, weight = 700) {
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  ctx.textBaseline = "middle";
}

export function text(ctx, value, x, y, size, color, align = "left", weight = 700) {
  font(ctx, size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

export function round(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function panel(ctx, x, y, w, h) {
  ctx.save();
  round(ctx, x, y, w, h, 22);
  ctx.fillStyle = PARCHMENT;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = RED;
  ctx.stroke();
  round(ctx, x + 8, y + 8, w - 16, h - 16, 16);
  ctx.lineWidth = 2;
  ctx.strokeStyle = GREEN;
  ctx.stroke();
  ornament(ctx, x + 22, y + 18, w - 44, RED);
  ctx.restore();
}

export function button(ctx, x, y, w, h, label, hot, disabled = false) {
  ctx.save();
  round(ctx, x, y, w, h, 14);
  ctx.fillStyle = disabled ? "#d9cbb4" : hot ? GREEN : "#fff8ec";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = disabled ? "#a89880" : hot ? "#143d28" : RED;
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, Math.min(26, h * 0.42), disabled ? "#7d6d5c" : hot ? "#f6f1e4" : INK, "center");
  ctx.restore();
}

export function ornament(ctx, x, y, w, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  const step = 18;
  for (let i = 0; i * step < w; i += 1) {
    const px = x + i * step;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + 6, y + 6);
    ctx.lineTo(px + 12, y);
    ctx.lineTo(px + 6, y - 6);
    ctx.closePath();
    ctx.globalAlpha = i % 2 ? 0.95 : 0.45;
    ctx.fill();
  }
  ctx.restore();
}

export function drawSun(ctx, x, y, r, color = "#f0c14a") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.12);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCoin(ctx, x, y, r = 10) {
  ctx.save();
  ctx.fillStyle = "#e2b34a";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#a87420";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fff1c2";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.2, r * 0.22, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHeart(ctx, x, y, scale = 1, filled = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-16, -4, -8, -16, 0, -8);
  ctx.bezierCurveTo(8, -16, 16, -4, 0, 8);
  ctx.fillStyle = filled ? "#c4333a" : "rgba(255,255,255,0.25)";
  ctx.fill();
  ctx.restore();
}

export function drawTree(ctx, x, y, kind, scale, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const sway = Math.sin(time * 1.4 + x * 0.01) * 3;
  if (kind === "pine") {
    ctx.fillStyle = "#6b4630";
    ctx.fillRect(-6, -40, 12, 40);
    ctx.fillStyle = "#1d5a3c";
    ctx.beginPath();
    ctx.moveTo(0, -150);
    ctx.lineTo(48, -30);
    ctx.lineTo(-48, -30);
    ctx.fill();
    ctx.fillStyle = "#26724c";
    ctx.beginPath();
    ctx.moveTo(0, -120);
    ctx.lineTo(36, -50);
    ctx.lineTo(-36, -50);
    ctx.fill();
  } else if (kind === "birch") {
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(-7, -90, 14, 90);
    ctx.fillStyle = "#2a241c";
    for (let i = 0; i < 5; i += 1) ctx.fillRect(-6, -20 - i * 14, 8, 3);
    ctx.translate(sway, 0);
    ctx.fillStyle = "#8fb56a";
    ctx.beginPath();
    ctx.ellipse(0, -110, 36, 26, 0, 0, Math.PI * 2);
    ctx.ellipse(-20, -90, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "flax") {
    ctx.strokeStyle = "#3e8a45";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(sway, -42);
    ctx.stroke();
    ctx.fillStyle = "#4f78d0";
    ctx.beginPath();
    ctx.ellipse(sway, -48, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "reed") {
    ctx.strokeStyle = "#8a9a4e";
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 6, 0);
      ctx.quadraticCurveTo(i * 8, -20, i * 4 + sway, -46);
      ctx.stroke();
    }
    ctx.fillStyle = "#6e5430";
    ctx.beginPath();
    ctx.ellipse(sway, -48, 4, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#6a4632";
    ctx.fillRect(-8, -46, 16, 48);
    ctx.translate(sway, 0);
    ctx.fillStyle = "#2f7a34";
    ctx.beginPath();
    ctx.arc(0, -78, 34, 0, Math.PI * 2);
    ctx.arc(-26, -60, 22, 0, Math.PI * 2);
    ctx.arc(28, -58, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3e9440";
    ctx.beginPath();
    ctx.arc(-8, -88, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawProp(ctx, kind, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === "cottage") {
    ctx.fillStyle = "#8d5a32";
    ctx.fillRect(-34, -48, 68, 48);
    ctx.fillStyle = "#f2d7a2";
    ctx.beginPath();
    ctx.moveTo(-48, -44);
    ctx.lineTo(0, -86);
    ctx.lineTo(48, -44);
    ctx.fill();
    ctx.fillStyle = "#6eb0d8";
    ctx.fillRect(-8, -34, 16, 14);
    ctx.strokeStyle = RED;
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -36, 20, 18);
    ctx.fillStyle = "#5c3b28";
    ctx.fillRect(16, -28, 12, 28);
  } else if (kind === "well") {
    ctx.fillStyle = "#8a8e92";
    ctx.fillRect(-16, -16, 32, 16);
    ctx.strokeStyle = "#6b4630";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.lineTo(-20, -48);
    ctx.lineTo(8, -34);
    ctx.stroke();
    ctx.fillStyle = "#d8d2c6";
    ctx.beginPath();
    ctx.arc(8, -34, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "castle") {
    ctx.fillStyle = "#8d3a32";
    ctx.fillRect(-46, -70, 28, 70);
    ctx.fillRect(18, -86, 30, 86);
    ctx.fillRect(-18, -48, 40, 48);
    ctx.fillStyle = "#f4efe6";
    for (let i = 0; i < 3; i += 1) ctx.fillRect(-44, -60 + i * 16, 24, 4);
    ctx.fillRect(20, -76, 26, 5);
    ctx.fillStyle = "#1c1a18";
    ctx.beginPath();
    ctx.arc(2, -16, 10, Math.PI, 0);
    ctx.fill();
  } else if (kind === "mill") {
    ctx.fillStyle = "#7a5340";
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(22, 0);
    ctx.lineTo(14, -48);
    ctx.lineTo(-14, -48);
    ctx.fill();
    ctx.save();
    ctx.translate(0, -48);
    ctx.rotate(time * 0.6);
    ctx.fillStyle = "#f0e2c4";
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(0, -4, 36, 8);
    }
    ctx.restore();
  } else if (kind === "cart") {
    ctx.fillStyle = "#8a5a32";
    ctx.fillRect(-24, -20, 48, 16);
    ctx.fillStyle = "#e2b34a";
    ctx.fillRect(-18, -30, 36, 12);
    ctx.fillStyle = "#3a2a22";
    ctx.beginPath();
    ctx.arc(-14, 0, 6, 0, Math.PI * 2);
    ctx.arc(14, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "bonfire") {
    ctx.fillStyle = "#5c3a28";
    ctx.fillRect(-16, -6, 32, 6);
    const flame = 16 + Math.sin(time * 8) * 4;
    ctx.fillStyle = "#ffb15a";
    ctx.beginPath();
    ctx.moveTo(0, -flame - 10);
    ctx.lineTo(12, 0);
    ctx.lineTo(-12, 0);
    ctx.fill();
    ctx.fillStyle = "#fff1c4";
    ctx.beginPath();
    ctx.moveTo(0, -flame);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, 0);
    ctx.fill();
  } else if (kind === "nest") {
    drawTree(ctx, 0, 0, "birch", 0.7, time);
    ctx.fillStyle = "#6b4630";
    ctx.beginPath();
    ctx.ellipse(18, -70, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawHero(ctx, x, y, opt) {
  const face = opt.face || 1;
  const moving = !!opt.moving;
  const air = !!opt.air;
  const time = opt.time || 0;
  const look = opt.look || { cloth: "#f6f1e6", trim: "#b4232a", belt: "#8d2e2e", hat: 0 };
  const step = moving && !air ? Math.sin(time * 14) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  if (air) ctx.rotate(-0.12);
  shadow(ctx, 18);
  leg(ctx, -7, step, "#2f3f5c");
  leg(ctx, 7, -step, "#2f3f5c");
  ctx.fillStyle = look.cloth;
  round(ctx, -13, -58, 26, 30, 8);
  ctx.fill();
  ctx.strokeStyle = look.trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -52);
  ctx.lineTo(-2, -46);
  ctx.lineTo(-8, -40);
  ctx.moveTo(8, -52);
  ctx.lineTo(2, -46);
  ctx.lineTo(8, -40);
  ctx.stroke();
  ctx.fillStyle = look.belt;
  ctx.fillRect(-13, -34, 26, 5);
  if (look.hat === 3) drawSpider(ctx, 0, -30, 0.45);
  ctx.fillStyle = "#f3c7a4";
  ctx.beginPath();
  ctx.arc(0, -70, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a241c";
  ctx.beginPath();
  ctx.arc(0, -76, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-11, -76, 22, 6);
  ctx.fillStyle = look.trim;
  ctx.fillRect(-4, -84, 8, 4);
  ctx.fillStyle = INK;
  ctx.fillRect(4, -72, 2, 2);
  if (look.hat === 1) {
    ctx.fillStyle = "#e6c56a";
    ctx.beginPath();
    ctx.ellipse(0, -80, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-8, -92, 16, 12);
  } else if (look.hat === 2) {
    ctx.strokeStyle = "#3e8a45";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -74, 12, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.fillStyle = "#d23b4a";
    ctx.beginPath();
    ctx.arc(-8, -80, 3, 0, Math.PI * 2);
    ctx.arc(6, -84, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4f78d0";
    ctx.beginPath();
    ctx.arc(0, -86, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function leg(ctx, x, swing, color) {
  ctx.save();
  ctx.translate(x, -28);
  ctx.rotate(swing * 0.5);
  ctx.fillStyle = color;
  ctx.fillRect(-3, 0, 6, 18);
  ctx.fillStyle = "#5a3a28";
  ctx.fillRect(-4, 16, 9, 5);
  ctx.restore();
}

export function drawZubr(ctx, x, y, opt) {
  const face = opt.face || 1;
  const time = opt.time || 0;
  const moving = !!opt.moving;
  const ram = !!opt.ram;
  const step = moving ? Math.sin(time * 12) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  if (ram) ctx.rotate(-0.18);
  shadow(ctx, 28);
  hoof(ctx, -18, step);
  hoof(ctx, -4, -step);
  hoof(ctx, 10, step);
  hoof(ctx, 22, -step);
  ctx.fillStyle = "#6d4324";
  ctx.beginPath();
  ctx.ellipse(4, -28, 28, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5a3418";
  ctx.beginPath();
  ctx.ellipse(-6, -36, 16, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6d4324";
  ctx.beginPath();
  ctx.ellipse(26, -30, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c4a07a";
  ctx.beginPath();
  ctx.ellipse(34, -28, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a1a12";
  ctx.fillRect(20, -18, 3, 8);
  ctx.strokeStyle = "#ead7b0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, -36);
  ctx.quadraticCurveTo(34, -48, 26, -46);
  ctx.moveTo(24, -36);
  ctx.quadraticCurveTo(18, -46, 22, -44);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillRect(36, -30, 2, 2);
  ctx.fillStyle = "#4e2f18";
  ctx.beginPath();
  ctx.ellipse(-22, -24, 6, 4, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hoof(ctx, x, swing) {
  ctx.save();
  ctx.translate(x, -16);
  ctx.rotate(swing * 0.45);
  ctx.fillStyle = "#4a301c";
  ctx.fillRect(-3, 0, 6, 14);
  ctx.fillStyle = "#2a1a12";
  ctx.fillRect(-4, 12, 8, 4);
  ctx.restore();
}

function shadow(ctx, w) {
  ctx.save();
  ctx.fillStyle = "rgba(20, 16, 10, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 0, w, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpider(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#e6d2a2";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
    ctx.lineTo(10, 0);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCreature(ctx, id, x, y, face, time, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face * scale, scale);
  const bob = Math.sin(time * 6) * 2;
  if (id === "stork" || id === "hornet" || id === "tsmok" || id === "rusalka") {
    /* flyers bob in the sim already */
  }
  if (id === "wolf" || id === "wolf_boss") beast(ctx, "#8d8a84", "#cfc8be", bob, "wolf");
  else if (id === "boar") beast(ctx, "#5c4638", "#d8c2a4", bob, "boar");
  else if (id === "lynx") beast(ctx, "#c2a15a", "#f0e2c0", bob, "lynx");
  else if (id === "hare") beast(ctx, "#b98a58", "#f3e6d4", bob, "hare");
  else if (id === "hedgehog") beast(ctx, "#8a6238", "#d8c8a8", bob, "hedgehog");
  else if (id === "beaver") beast(ctx, "#6a4a32", "#e6d2b8", bob, "beaver");
  else if (id === "viper") viper(ctx, bob);
  else if (id === "stork") stork(ctx, time);
  else if (id === "hornet") hornet(ctx, time);
  else if (id === "vodyanoy") vodyanoy(ctx, time);
  else if (id === "tsmok") tsmok(ctx, time);
  else if (id === "palyavik") palyavik(ctx, time);
  else if (id === "rusalka") rusalka(ctx, time);
  else if (id === "lesun") lesun(ctx, time);
  else beast(ctx, "#888", "#ddd", bob, "wolf");
  ctx.restore();
}

function beast(ctx, coat, belly, bob, kind) {
  shadow(ctx, 22);
  const step = bob;
  ctx.fillStyle = "#3a2a22";
  ctx.fillRect(-16, -14 + step, 5, 12);
  ctx.fillRect(-4, -14 - step, 5, 12);
  ctx.fillRect(8, -14 + step, 5, 12);
  ctx.fillRect(16, -14 - step, 5, 12);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(0, -24, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(2, -20, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(20, -30, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (kind === "wolf") {
    ctx.beginPath();
    ctx.moveTo(16, -36);
    ctx.lineTo(20, -46);
    ctx.lineTo(24, -34);
    ctx.fill();
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.moveTo(-20, -24);
    ctx.lineTo(-34, -18);
    ctx.lineTo(-18, -18);
    ctx.fill();
  } else if (kind === "boar") {
    ctx.strokeStyle = "#f4efe6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(26, -28);
    ctx.lineTo(34, -24);
    ctx.stroke();
  } else if (kind === "lynx") {
    ctx.fillStyle = INK;
    ctx.fillRect(14, -40, 3, 8);
    ctx.fillRect(22, -40, 3, 8);
    ctx.fillStyle = "#2a241c";
    for (let i = 0; i < 4; i += 1) ctx.fillRect(-8 + i * 6, -28, 3, 3);
  } else if (kind === "hare") {
    ctx.fillStyle = coat;
    ctx.fillRect(16, -48, 4, 18);
    ctx.fillRect(22, -46, 4, 16);
  } else if (kind === "hedgehog") {
    ctx.strokeStyle = "#4a3424";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-12 + i * 5, -28);
      ctx.lineTo(-8 + i * 5, -42);
      ctx.stroke();
    }
  } else if (kind === "beaver") {
    ctx.fillStyle = "#4a3428";
    ctx.beginPath();
    ctx.ellipse(-20, -18, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(26, -32, 4, 3);
  }
  ctx.fillStyle = INK;
  ctx.fillRect(24, -32, 2, 2);
}

function viper(ctx) {
  shadow(ctx, 16);
  ctx.strokeStyle = "#3e6b3a";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.quadraticCurveTo(0, -20, 10, -8);
  ctx.quadraticCurveTo(18, 2, 8, -28);
  ctx.stroke();
  ctx.fillStyle = "#2a241c";
  ctx.beginPath();
  ctx.arc(8, -32, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c4333a";
  ctx.fillRect(11, -34, 2, 2);
}

function stork(ctx, time) {
  const wing = Math.sin(time * 10) * 16;
  ctx.fillStyle = "#f7f4ee";
  ctx.beginPath();
  ctx.ellipse(0, -16, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c1a18";
  ctx.beginPath();
  ctx.ellipse(-6, -18 + wing * 0.05, 18, 5, -0.5 + wing * 0.01, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d23b3b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(14, -16);
  ctx.lineTo(28, -14);
  ctx.stroke();
  ctx.strokeStyle = "#d23b3b";
  ctx.beginPath();
  ctx.moveTo(2, -8);
  ctx.lineTo(0, 6);
  ctx.moveTo(8, -8);
  ctx.lineTo(10, 6);
  ctx.stroke();
}

function hornet(ctx, time) {
  const wing = Math.sin(time * 30) * 4;
  ctx.fillStyle = "#f0c14a";
  ctx.beginPath();
  ctx.ellipse(0, -10, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c1a18";
  ctx.fillRect(-6, -12, 3, 6);
  ctx.fillRect(-1, -12, 3, 6);
  ctx.fillStyle = "rgba(220,236,255,0.7)";
  ctx.beginPath();
  ctx.ellipse(-4, -16 - wing, 7, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function vodyanoy(ctx, time) {
  shadow(ctx, 20);
  ctx.fillStyle = "#3e6a62";
  ctx.beginPath();
  ctx.ellipse(0, -28, 18, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f544e";
  ctx.fillRect(-16, -18, 8, 16);
  ctx.fillRect(8, -18, 8, 16);
  ctx.fillStyle = "#d8e6c8";
  ctx.beginPath();
  ctx.arc(0, -46, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b8f4a";
  ctx.fillRect(-10, -40, 20, 8);
  ctx.fillStyle = INK;
  ctx.fillRect(-5, -48, 3, 3);
  ctx.fillRect(3, -48, 3, 3);
  ctx.fillStyle = "#7d9a4a";
  ctx.beginPath();
  ctx.ellipse(-16, -58 + Math.sin(time * 3) * 2, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tsmok(ctx, time) {
  ctx.strokeStyle = "#2f6b45";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-30, -10);
  ctx.quadraticCurveTo(0, -40 + Math.sin(time * 4) * 6, 30, -16);
  ctx.stroke();
  ctx.fillStyle = "#e0b15a";
  ctx.beginPath();
  ctx.moveTo(24, -28);
  ctx.lineTo(32, -44);
  ctx.lineTo(36, -24);
  ctx.fill();
  ctx.fillStyle = "#1c1a18";
  ctx.beginPath();
  ctx.ellipse(-8, -28, 12, 5, -0.6, 0, Math.PI * 2);
  ctx.ellipse(8, -22, 12, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c4333a";
  ctx.beginPath();
  ctx.arc(34, -18, 2, 0, Math.PI * 2);
  ctx.fill();
}

function palyavik(ctx, time) {
  shadow(ctx, 16);
  ctx.fillStyle = "#e2c56a";
  ctx.fillRect(-12, -40, 24, 28);
  ctx.strokeStyle = "#8a6a28";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -30);
  ctx.lineTo(-28, -18 + Math.sin(time * 6) * 4);
  ctx.moveTo(12, -30);
  ctx.lineTo(28, -18);
  ctx.stroke();
  ctx.fillStyle = "#4f78d0";
  ctx.beginPath();
  ctx.arc(0, -52, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c14a";
  ctx.beginPath();
  ctx.arc(0, -52, 4, 0, Math.PI * 2);
  ctx.fill();
}

function rusalka(ctx, time) {
  const sway = Math.sin(time * 2) * 4;
  ctx.fillStyle = "#8fd0c8";
  ctx.beginPath();
  ctx.moveTo(-12, -10);
  ctx.lineTo(12, -10);
  ctx.lineTo(18, -40);
  ctx.lineTo(-18, -40);
  ctx.fill();
  ctx.fillStyle = "#f4e6d4";
  ctx.beginPath();
  ctx.arc(0, -52, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1f6b4a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, -56);
  ctx.quadraticCurveTo(sway, -20, -10, -4);
  ctx.moveTo(4, -56);
  ctx.quadraticCurveTo(10 + sway, -24, 12, -2);
  ctx.stroke();
  ctx.fillStyle = "#d23b4a";
  ctx.beginPath();
  ctx.arc(-8, -60, 3, 0, Math.PI * 2);
  ctx.arc(2, -62, 3, 0, Math.PI * 2);
  ctx.fill();
}

function lesun(ctx, time) {
  shadow(ctx, 18);
  ctx.fillStyle = "#6b4a32";
  ctx.fillRect(-14, -58, 28, 42);
  ctx.fillStyle = "#3e6b3a";
  ctx.beginPath();
  ctx.arc(0, -70, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e6d2a8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -78);
  ctx.lineTo(-18, -96);
  ctx.lineTo(-2, -80);
  ctx.moveTo(8, -78);
  ctx.lineTo(20, -98);
  ctx.lineTo(4, -80);
  ctx.stroke();
  ctx.fillStyle = "#d8e6c4";
  ctx.fillRect(-6, -72, 3, 3);
  ctx.fillRect(4, -72, 3, 3);
  ctx.fillStyle = "#2f6b3a";
  ctx.beginPath();
  ctx.ellipse(Math.sin(time * 3) * 2, -60, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawShrine(ctx, x, y, sun) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6b4630";
  ctx.fillRect(-4, -36, 8, 36);
  ctx.fillStyle = "#f7f1e6";
  ctx.fillRect(-16, -34, 32, 18);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  ctx.strokeRect(-16, -34, 32, 18);
  ornament(ctx, -12, -25, 24, RED);
  if (sun) drawSun(ctx, 0, -48, 14);
  ctx.restore();
}

export function drawFern(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#1f6b3a";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(i * 6, -16, i * 10, -32 - Math.sin(time * 2 + i) * 2);
    ctx.stroke();
  }
  drawSun(ctx, 0, -40, 8, "#fff1c2");
  ctx.restore();
}

export function drawFood(ctx, id, x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (id === "draniki" || id === "blin" || id === "syrniki") {
    ctx.fillStyle = id === "syrniki" ? "#f0d2a0" : "#e2b15a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "kvass" || id === "khaladnik") {
    ctx.fillStyle = id === "khaladnik" ? "#c4474a" : "#c48a3a";
    round(ctx, -8, -12, 16, 18, 4);
    ctx.fill();
  } else if (id === "honey") {
    ctx.fillStyle = "#e2a020";
    ctx.beginPath();
    ctx.arc(0, 2, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "rye") {
    ctx.fillStyle = "#6b3e28";
    round(ctx, -10, -8, 20, 12, 6);
    ctx.fill();
  } else if (id === "cranberry") {
    ctx.fillStyle = "#c4333a";
    ctx.beginPath();
    ctx.arc(-4, 0, 4, 0, Math.PI * 2);
    ctx.arc(3, 2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#a87440";
    ctx.beginPath();
    ctx.ellipse(0, 2, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(-2, -8, 4, 6);
  }
  ctx.restore();
}
