/**
 * ════════════════════════════════════════════════════════════════
 *  🎨  GENERATE ASSETS — tạo ảnh placeholder + nhạc nền demo
 * ════════════════════════════════════════════════════════════════
 *  Chạy:  npm run assets
 *
 *  · 12 ảnh SVG pastel (public/photos/1.svg … 12.svg) — thay bằng
 *    ảnh thật của khách khi làm phiên bản riêng.
 *  · 1 nhạc nền WAV dịu nhẹ tự tổng hợp (public/music/love.wav) —
 *    thay bằng bài hát thật (mp3) của khách.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const photosDir = join(root, "public", "photos");
const musicDir = join(root, "public", "music");
mkdirSync(photosDir, { recursive: true });
mkdirSync(musicDir, { recursive: true });

/* ── 1. ẢNH PLACEHOLDER ──────────────────────────────────── */

// Bảng màu pastel xen kẽ
const PALETTES = [
  ["#FFE9F0", "#FFC9DC", "#F25C88"], // hồng phấn
  ["#EDE4FF", "#D8C5F7", "#8E5CD9"], // tím oải hương
  ["#FFEFDD", "#FFD9BC", "#E8845C"], // đào ấm
  ["#FFE3EA", "#FFB8CD", "#D6336C"], // hồng đậm
  ["#E6F0FF", "#C3D8FA", "#5C7ED9"], // xanh dịu
  ["#FCE7F3", "#F5C0E0", "#C25CA8"], // tím hồng
];

// Path trái tim chuẩn (viewBox 24×24), đặt trong <g transform>
const HEART_D =
  "M12 21.35s-8.4-5.62-8.4-11.2C3.6 6.9 6.24 4.4 9 4.4c1.34 0 2.4.7 3 1.72.6-1.02 1.66-1.72 3-1.72 2.76 0 5.4 2.5 5.4 5.75 0 5.58-8.4 11.2-8.4 11.2Z";

/** PRNG seeded — ảnh luôn giống nhau mỗi lần chạy */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function heart(x, y, size, rotate, fill, opacity) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${size / 24})" opacity="${opacity}">
    <path d="${HEART_D}" fill="${fill}"/></g>`;
}

function makePhoto(i) {
  const rand = mulberry32(i * 7919);
  const [c1, c2, accent] = PALETTES[i % PALETTES.length];
  const W = 800, H = 1000;

  // Vòng tròn mềm phía sau
  const circles = Array.from({ length: 3 }, () => {
    const cx = 120 + rand() * 560;
    const cy = 140 + rand() * 720;
    const r = 90 + rand() * 150;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="0.25"/>`;
  }).join("\n  ");

  // Trái tim rải rác
  const hearts = Array.from({ length: 7 }, () => {
    const x = 60 + rand() * 680;
    const y = 80 + rand() * 840;
    const s = 16 + rand() * 46;
    const r = -30 + rand() * 60;
    return heart(x, y, s, r, "#ffffff", 0.35 + rand() * 0.3);
  }).join("\n  ");

  // Sparkle 4 cánh
  const sparkles = Array.from({ length: 5 }, () => {
    const x = 60 + rand() * 680;
    const y = 80 + rand() * 840;
    const s = 8 + rand() * 14;
    return `<path d="M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z" fill="#ffffff" opacity="0.55"/>`;
  }).join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${circles}
  ${hearts}
  ${sparkles}
  <text x="${W / 2}" y="485" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="200" font-weight="bold" fill="${accent}" opacity="0.9">${i}</text>
  <text x="${W / 2}" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="30" letter-spacing="10" fill="${accent}" opacity="0.65">KỶ NIỆM</text>
  ${heart(W / 2, 640, 42, 0, accent, 0.85)}
</svg>\n`;
}

for (let i = 1; i <= 12; i++) {
  writeFileSync(join(photosDir, `${i}.svg`), makePhoto(i));
}
console.log("✔ 12 ảnh placeholder → public/photos/");


const SR = 16000;              // sample rate
const DUR = 24;                // giây
const N = SR * DUR;
const buf = new Float32Array(N);
const rand = mulberry32(42);

/** Nốt nhạc tần số (Hz) */
const F = {
  A2: 110.0, F2: 87.31, G2: 98.0,
  A3: 220.0, B3: 246.94, C3: 130.81, E3: 164.81, F3: 174.61, G3: 196.0,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99,
};

/** Hợp âm pad: C – Am – F – G (mỗi hợp âm 6 giây) */
const CHORDS = [
  [F.C3, F.G3, F.C4, F.E4], // C
  [F.A2, F.C4, F.E4, F.A4], // Am
  [F.F2, F.A3, F.C4, F.F4], // F
  [F.G2, F.B3, F.D4, F.G4], // G
];

function env(t, dur, attack = 1.4, release = 1.6) {
  if (t < attack) return t / attack;
  if (t > dur - release) return Math.max(0, (dur - t) / release);
  return 1;
}

// Pad: sóng sin + bồi âm nhẹ
CHORDS.forEach((chord, ci) => {
  const start = ci * 6;
  const dur = 6.2;
  chord.forEach((f) => {
    for (let i = 0; i < Math.floor(dur * SR); i++) {
      const idx = Math.floor(start * SR) + i;
      if (idx >= N) break;
      const t = i / SR;
      const w =
        Math.sin(2 * Math.PI * f * t) * 0.8 +
        Math.sin(2 * Math.PI * f * 2 * t) * 0.12 +
        Math.sin(2 * Math.PI * f * 3 * t) * 0.04;
      buf[idx] += w * 0.075 * env(t, dur);
    }
  });
});

// Giai điệu ngũ cung C (C D E G A) — chậm rãi, ngẫu nhiên có seed
const PENTA = [F.C5, F.D5, F.E5, F.G5, F.A4, F.G4, F.E4];
let t = 2.0;
while (t < DUR - 4) {
  const f = PENTA[Math.floor(rand() * PENTA.length)];
  const dur = 0.5 + rand() * 0.7;
  for (let i = 0; i < Math.floor(dur * SR); i++) {
    const idx = Math.floor(t * SR) + i;
    if (idx >= N) break;
    const tt = i / SR;
    const e = tt < 0.06 ? tt / 0.06 : Math.max(0, 1 - (tt - dur * 0.55) / (dur * 0.45));
    const w = Math.sin(2 * Math.PI * f * tt) * 0.85 + Math.sin(2 * Math.PI * f * 2 * tt) * 0.1;
    buf[idx] += w * 0.085 * e;
  }
  t += dur + 0.15 + rand() * 0.35;
}

// Fade in / out toàn bài + chuẩn hoá nhẹ (soft-clip)
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(buf[i]));
const gain = 0.62 / peak;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 2.5) * Math.min(1, (DUR - t) / 3.5);
  buf[i] = Math.tanh(buf[i] * gain) * fade;
}

// Ghi WAV mono 16-bit
const pcm = Buffer.alloc(44 + N * 2);
pcm.write("RIFF", 0);
pcm.writeUInt32LE(36 + N * 2, 4);
pcm.write("WAVE", 8);
pcm.write("fmt ", 12);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);       // PCM
pcm.writeUInt16LE(1, 22);       // mono
pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 2, 28);
pcm.writeUInt16LE(2, 32);
pcm.writeUInt16LE(16, 34);
pcm.write("data", 36);
pcm.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
}
writeFileSync(join(musicDir, "love.wav"), pcm);
console.log("✔ Nhạc nền demo → public/music/love.wav");

/* ── 2. NHẠC NỀN DEMO → xem phần dưới file ───────────────── */
