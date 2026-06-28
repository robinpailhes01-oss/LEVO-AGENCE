// Generates placeholder gradient-orb avatars (PNG, RGBA) for each agent.
// Pure Node — no native deps. Run: node scripts/gen-avatars.mjs
import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "avatars");
mkdirSync(OUT, { recursive: true });

const SIZE = 256;

/** hex -> [r,g,b] */
function hex(h) {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(rgba, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeOrb(color) {
  const base = hex(color);
  const light = mix(base, [255, 255, 255], 0.55);
  const dark = mix(base, [13, 17, 23], 0.45);
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = SIZE / 2 - 6;
  // light source offset for a soft 3D sheen
  const lx = SIZE * 0.38;
  const ly = SIZE * 0.34;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) {
        rgba[i + 3] = 0; // transparent outside
        continue;
      }
      const ld = Math.sqrt((x - lx) ** 2 + (y - ly) ** 2) / (r * 1.6);
      const t = Math.min(1, Math.max(0, ld));
      const col = mix(light, dark, t);
      // soft edge antialias
      const edge = Math.min(1, (r - dist) / 3);
      rgba[i] = col[0];
      rgba[i + 1] = col[1];
      rgba[i + 2] = col[2];
      rgba[i + 3] = Math.round(255 * edge);
    }
  }
  return encodePng(rgba, SIZE, SIZE);
}

const agents = {
  luna: "#1A3BFF",
  orion: "#1D9E75",
  hermes: "#BA7517",
  veille: "#7B2FBE",
};

for (const [name, color] of Object.entries(agents)) {
  writeFileSync(join(OUT, `${name}.png`), makeOrb(color));
  console.log(`wrote ${name}.png`);
}
