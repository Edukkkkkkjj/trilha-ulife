// Gera os ícones PNG do aplicativo sem depender de biblioteca externa.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(size) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b]) => { if (x < 0 || y < 0 || x >= size || y >= size) return; const i = (y * size + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, [18, 20, 28]);
  const s = size / 64;
  const disc = (cx, cy, r, col) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, col); };
  const bez = (t) => { // duas curvas de Bézier encadeadas (a trilha)
    const seg = t < 0.5 ? [[12, 46], [22, 46], [20, 30], [32, 30]] : [[32, 30], [44, 30], [42, 16], [52, 16]];
    const u = t < 0.5 ? t * 2 : (t - 0.5) * 2, v = 1 - u;
    return [0, 1].map((k) => v ** 3 * seg[0][k] + 3 * v * v * u * seg[1][k] + 3 * v * u * u * seg[2][k] + u ** 3 * seg[3][k]);
  };
  for (let i = 0; i <= 400; i++) { const [x, y] = bez(i / 400); disc(x * s, y * s, 2.5 * s, [124, 140, 255]); }
  disc(12 * s, 46 * s, 5 * s, [255, 209, 102]); disc(32 * s, 30 * s, 5 * s, [95, 214, 168]); disc(52 * s, 16 * s, 5 * s, [255, 138, 122]);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const n of [180, 192, 512]) writeFileSync(`public/icone-${n}.png`, png(n));
console.log('ícones gerados');
