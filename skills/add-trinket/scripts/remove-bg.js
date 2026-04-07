/**
 * Remove white/light-gray background from product images using flood-fill.
 *
 * Usage:
 *   node skills/add-trinket/scripts/remove-bg.js <input> <output> [threshold]
 *
 * Arguments:
 *   input      — source image path (JPG/PNG)
 *   output     — destination path (PNG with transparency)
 *   threshold  — flood-fill brightness cutoff, 0-255 (default: 242)
 *                Higher = more conservative (less removal)
 *                Lower  = more aggressive (more removal)
 *
 * Examples:
 *   node skills/add-trinket/scripts/remove-bg.js temp.jpg static/images/product.png
 *   node skills/add-trinket/scripts/remove-bg.js temp.jpg static/images/product.png 245
 */

const sharp = require('sharp');
const fs = require('fs');

const [,, inputPath, outputPath, thresholdArg] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node remove-bg.js <input> <output> [threshold]');
  process.exit(1);
}

const THRESHOLD = parseInt(thresholdArg, 10) || 242;

async function run() {
  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width, h = info.height, ch = info.channels;
  console.log(`Input: ${w}x${h}, ${ch} channels, threshold=${THRESHOLD}`);

  // Phase 1: Flood fill from edges to mark background
  const isBackground = new Uint8Array(w * h);
  const queue = [];

  for (let x = 0; x < w; x++) { queue.push(x); queue.push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { queue.push(y * w); queue.push(y * w + (w - 1)); }

  while (queue.length > 0) {
    const idx = queue.pop();
    if (isBackground[idx]) continue;

    const pi = idx * ch;
    const r = data[pi], g = data[pi + 1], b = data[pi + 2];
    const a = ch === 4 ? data[pi + 3] : 255;

    if (a === 0 || (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD)) {
      isBackground[idx] = 1;
      const x = idx % w, y = Math.floor(idx / w);
      if (x > 0) queue.push(idx - 1);
      if (x < w - 1) queue.push(idx + 1);
      if (y > 0) queue.push(idx - w);
      if (y < h - 1) queue.push(idx + w);
    }
  }

  // Phase 2: Build RGBA output with anti-aliased edges
  const out = Buffer.alloc(w * h * 4);
  let bgCount = 0, edgeCount = 0;

  for (let i = 0; i < w * h; i++) {
    const si = i * ch, di = i * 4;
    const r = data[si], g = data[si + 1], b = data[si + 2];
    const srcA = ch === 4 ? data[si + 3] : 255;

    if (isBackground[i] || srcA === 0) {
      out[di] = 0; out[di + 1] = 0; out[di + 2] = 0; out[di + 3] = 0;
      bgCount++;
      continue;
    }

    // Check if adjacent to background (edge pixel)
    const x = i % w, y = Math.floor(i / w);
    let nearBg = false;
    for (let dy = -1; dy <= 1 && !nearBg; dy++) {
      for (let dx = -1; dx <= 1 && !nearBg; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && isBackground[ny * w + nx]) {
          nearBg = true;
        }
      }
    }

    if (nearBg) {
      const lum = (r + g + b) / 3;
      if (lum > THRESHOLD) {
        out[di] = Math.round(r * 0.3);
        out[di + 1] = Math.round(g * 0.3);
        out[di + 2] = Math.round(b * 0.3);
        out[di + 3] = Math.round(Math.max(0, (THRESHOLD - lum + 15) / 15) * 255);
      } else if (lum > THRESHOLD - 20) {
        out[di] = r; out[di + 1] = g; out[di + 2] = b;
        out[di + 3] = Math.max(Math.round(((THRESHOLD - lum) / 20) * 255), 120);
      } else {
        out[di] = r; out[di + 1] = g; out[di + 2] = b; out[di + 3] = 255;
      }
      edgeCount++;
    } else {
      out[di] = r; out[di + 1] = g; out[di + 2] = b; out[di + 3] = 255;
    }
  }

  // Phase 3: Erode semi-transparent pixels with many bg neighbors
  const final = Buffer.from(out);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, di = i * 4;
      if (out[di + 3] > 0 && out[di + 3] < 200) {
        let bc = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ni = (y + dy) * w + (x + dx);
            if (out[ni * 4 + 3] === 0) bc++;
          }
        }
        if (bc >= 4) {
          final[di] = 0; final[di + 1] = 0; final[di + 2] = 0; final[di + 3] = 0;
        }
      }
    }
  }

  await sharp(final, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(outputPath);

  const stat = fs.statSync(outputPath);
  const totalPx = w * h;
  console.log(`Background: ${bgCount}/${totalPx} (${Math.round(bgCount / totalPx * 100)}%)`);
  console.log(`Edge pixels: ${edgeCount}`);
  console.log(`Saved: ${outputPath} (${Math.round(stat.size / 1024)} KB)`);
}

run().catch(e => { console.error(e); process.exit(1); });
