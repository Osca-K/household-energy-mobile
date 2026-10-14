import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';

const definitions = fs.readFileSync('src/data/devices.ts', 'utf8');
const keys = [...definitions.matchAll(/key: '([^']+)', source:/g)].map(match => match[1]);
for (const key of keys) {
  const original = PNG.sync.read(fs.readFileSync(`assets/appliances/${key}.png`));
  const corrected = PNG.sync.read(fs.readFileSync(`assets/appliances-transparent/${key}.png`));
  assert.equal(corrected.width, original.width, `${key}: canvas width changed`);
  assert.equal(corrected.height, original.height, `${key}: canvas height changed`);
  let transparent = 0, partial = 0, error = 0;
  for (let index = 0; index < corrected.data.length; index += 4) {
    const alpha = corrected.data[index + 3] / 255;
    if (alpha === 0) transparent++;
    if (alpha > 0 && alpha < 1) partial++;
    for (let channel = 0; channel < 3; channel++) {
      const onWhite = corrected.data[index + channel] * alpha + 255 * (1 - alpha);
      error += Math.abs(original.data[index + channel] - onWhite);
    }
  }
  assert(transparent > 1000, `${key}: no genuinely transparent exterior`);
  assert(partial > 1000, `${key}: smooth partial-alpha edges/shadow missing`);
  assert(error / (corrected.width * corrected.height * 3) < 5, `${key}: appearance changed excessively on white`);
  for (const [x, y] of [[0, 0], [corrected.width - 1, 0], [0, corrected.height - 1], [corrected.width - 1, corrected.height - 1]]) {
    assert(corrected.data[(y * corrected.width + x) * 4 + 3] <= 5, `${key}: opaque rectangular corner remains`);
  }
  // The central tile and white appliance details must remain solid, not keyed out.
  for (let y = Math.floor(corrected.height * 0.3); y < corrected.height * 0.7; y += 17) {
    for (let x = Math.floor(corrected.width * 0.3); x < corrected.width * 0.7; x += 17) {
      assert(corrected.data[(y * corrected.width + x) * 4 + 3] >= 240, `${key}: interior white details lost`);
    }
  }
}
console.log(`Passed: ${keys.length} transparent Devices assets, original canvas sizes, partial alpha, solid interiors, transparent corners and appearance preservation on white.`);
