// Generate icons/icon{16,32,48,128}.png with no dependencies.
// Draws a red rounded square with a simple white maple-leaf-ish silhouette.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "icons");

const RED = [0xd5, 0x2b, 0x1e, 255];
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

// ---- tiny PNG encoder -------------------------------------------------------

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- drawing ----------------------------------------------------------------

// Leaf polygon in a 0..1 unit square (a stylised 5-lobe maple leaf).
const LEAF = [
  [0.50, 0.06], [0.58, 0.24], [0.68, 0.18], [0.66, 0.34], [0.86, 0.30],
  [0.78, 0.44], [0.90, 0.52], [0.66, 0.62], [0.70, 0.72], [0.54, 0.68],
  [0.54, 0.92], [0.46, 0.92], [0.46, 0.68], [0.30, 0.72], [0.34, 0.62],
  [0.10, 0.52], [0.22, 0.44], [0.14, 0.30], [0.34, 0.34], [0.32, 0.18],
  [0.42, 0.24],
];

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function inRoundedSquare(px, py, r) {
  // px, py in 0..1; r = corner radius in unit space
  const cx = Math.min(Math.max(px, r), 1 - r);
  const cy = Math.min(Math.max(py, r), 1 - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function render(size) {
  const buf = Buffer.alloc(size * size * 4);
  const ss = 4; // supersampling per axis
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const px = (x + (sx + 0.5) / ss) / size;
          const py = (y + (sy + 0.5) / ss) / size;
          let c = CLEAR;
          if (inRoundedSquare(px, py, 0.2)) {
            c = size >= 32 && pointInPolygon(px, py, LEAF) ? WHITE : RED;
            if (size < 32) {
              // Too small for the leaf: draw a white square dot instead.
              const d = Math.max(Math.abs(px - 0.5), Math.abs(py - 0.5));
              c = d < 0.18 ? WHITE : RED;
            }
          }
          r += c[0]; g += c[1]; b += c[2]; a += c[3];
        }
      }
      const n = ss * ss;
      const i = (y * size + x) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, buf);
}

mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const file = join(outDir, `icon${size}.png`);
  writeFileSync(file, render(size));
  console.log("wrote", file);
}
