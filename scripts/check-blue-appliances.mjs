import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';

const definitions = fs.readFileSync('src/data/devices.ts', 'utf8');
const keys = [...definitions.matchAll(/key: '([^']+)', source:/g)].map(match => match[1]);
for (const key of keys) {
  assert(definitions.includes(`require('@/assets/appliances-blue-soft/${key}.png')`), `${key}: shared illustration uses old palette`);
  const image = PNG.sync.read(fs.readFileSync(`assets/appliances-blue-soft/${key}.png`));
  const source = PNG.sync.read(fs.readFileSync(`assets/appliances-transparent/${key}.png`));
  assert.equal(image.width, source.width, `${key}: width changed`);
  assert.equal(image.height, source.height, `${key}: height changed`);
  let clear = 0, partial = 0, blue = 0, incompatible = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    const [r, g, b, a] = image.data.subarray(i, i + 4);
    if (a === 0) clear++;
    else if (a < 255) partial++;
    // Examine solid colourful artwork, excluding neutral white tile and shadow.
    if (a >= 240 && Math.max(r, g, b) - Math.min(r, g, b) > 45) {
      if (b > r && b > g && g >= r) blue++;
      else incompatible++;
    }
  }
  assert(clear > 1000 && partial > 1000, `${key}: transparency/shadow missing`);
  assert(blue > 1000, `${key}: blue accents missing`);
  assert(incompatible / (blue + incompatible) < 0.1, `${key}: inconsistent accent palette`);
  for (const offset of [0, (image.width - 1) * 4, (image.height - 1) * image.width * 4, image.data.length - 4]) {
    assert(image.data[offset + 3] <= 5, `${key}: opaque rectangle remains`);
  }
}
assert(fs.readFileSync('src/data/device-list-illustrations.ts', 'utf8').includes('illustration(key)'), 'Devices should reuse shared palette');
console.log(`Passed: ${keys.length} shared blue appliance assets, canvas sizes, alpha transparency, soft edges and consistent blue accents.`);
