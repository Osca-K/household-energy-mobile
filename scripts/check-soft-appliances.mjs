import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';

const definitions = fs.readFileSync('src/data/devices.ts', 'utf8');
const keys = [...definitions.matchAll(/key: '([^']+)', source:/g)].map(match => match[1]);
function surroundDarkness(image) {
  let darkness = 0, samples = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (x > image.width * 0.22 && x < image.width * 0.78 && y > image.height * 0.22 && y < image.height * 0.78) continue;
      const i = (y * image.width + x) * 4;
      darkness += image.data[i + 3] / 255 * (255 - (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3);
      samples++;
    }
  }
  return darkness / samples;
}
for (const key of keys) {
  assert(definitions.includes(`require('@/assets/appliances-blue-soft/${key}.png')`), `${key}: softened asset not connected`);
  const before = PNG.sync.read(fs.readFileSync(`assets/appliances-blue/${key}.png`));
  const after = PNG.sync.read(fs.readFileSync(`assets/appliances-blue-soft/${key}.png`));
  assert.equal(after.width, before.width, `${key}: width changed`);
  assert.equal(after.height, before.height, `${key}: height changed`);
  const previous = surroundDarkness(before), current = surroundDarkness(after);
  assert(current < previous * 0.65, `${key}: tile surround remains too dark (${current.toFixed(2)} vs ${previous.toFixed(2)})`);
  assert(current < 5, `${key}: tile surround should be faint`);
  for (const i of [0, (after.width - 1) * 4, (after.height - 1) * after.width * 4, after.data.length - 4]) {
    assert(after.data[i + 3] <= 5, `${key}: opaque canvas corner`);
  }
}
console.log(`Passed: ${keys.length} softened assets connected, same canvas sizes, transparent corners and substantially lighter tile surrounds.`);
