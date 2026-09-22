/**
 * Generates Windows/Linux application icons for electron-builder:
 *   build/icon.png  (512x512, from public/icon.svg)
 *   build/icon.ico  (multi-size ICO with PNG-compressed entries: 16…256)
 *
 * Usage: npm run icons
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, '');
const svgPath = path.join(root, 'public', 'icon.svg');
const outDir = path.join(root, 'resources');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

fs.mkdirSync(outDir, { recursive: true });

const svgBuffer = fs.readFileSync(svgPath);

// Render the vector logo at high resolution, then downscale per size.
const master = await sharp(svgBuffer, { density: 384 }).resize(1024, 1024).png().toBuffer();

await sharp(master).resize(512, 512).png().toFile(path.join(outDir, 'icon.png'));

/** Pack PNG buffers into a .ico container (Vista+ PNG-compressed entries). */
function packIco(entries) {
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + entrySize * entries.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dirParts = [];
  const dataParts = [];
  for (const { size, png } of entries) {
    const dir = Buffer.alloc(entrySize);
    dir.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 => 256)
    dir.writeUInt8(size >= 256 ? 0 : size, 1); // height
    dir.writeUInt8(0, 2); // palette colors
    dir.writeUInt8(0, 3); // reserved
    dir.writeUInt16LE(1, 4); // planes
    dir.writeUInt16LE(32, 6); // bpp
    dir.writeUInt32LE(png.length, 8);
    dir.writeUInt32LE(offset, 12);
    offset += png.length;
    dirParts.push(dir);
    dataParts.push(png);
  }
  return Buffer.concat([header, ...dirParts, ...dataParts]);
}

const entries = [];
for (const size of SIZES) {
  const png = await sharp(master).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  entries.push({ size, png });
}

fs.writeFileSync(path.join(outDir, 'icon.ico'), packIco(entries));
console.log('✔ resources/icon.png and resources/icon.ico generated (' + SIZES.join(', ') + ' px)');
