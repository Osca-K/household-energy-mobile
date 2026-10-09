import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} }; cache.set(filename, module.exports);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = name => {
    if (name.startsWith('@/assets/')) return name;
    if (name === '@react-native-async-storage/async-storage') return {};
    if (name.startsWith('@/') || name.startsWith('.')) {
      const base = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(filename), name);
      return load(['.ts', '.tsx'].map(ext => base + ext).find(file => fs.existsSync(file)) ?? base);
    }
    return require(name);
  };
  vm.runInNewContext(source, { exports: module.exports, module, require: localRequire, Date, Intl, console, Math, Promise }, { filename });
  return module.exports;
}
const d = load('src/data/devices.ts');
const h = load('src/data/history.ts');
const u = load('src/data/usage.ts');
const chat = load('src/state/household.tsx');
const close = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} differs from ${b}`);
const anchor = '2026-10-08';
for (const period of u.periods) {
  const data = u.getUsage(period, d.initialDevices, anchor);
  for (const source of [data.devices, data.rooms, data.bins]) {
    close(source.reduce((sum, item) => sum + item.energy, 0), data.total);
    close(source.reduce((sum, item) => sum + item.cost, 0), data.cost);
    source.forEach(item => close(item.cost, item.energy * h.tariff));
  }
  close(data.devices.reduce((sum, item) => sum + item.share, 0), 100);
  close(data.rooms.reduce((sum, item) => sum + item.share, 0), 100);
  close(data.total, d.initialDevices.filter(device => device.id !== 'smart-meter').reduce((sum, device) => sum + (h.periodHistory(device, anchor, period, anchor).summary.energy ?? 0), 0));
  assert(data.missing);
  assert.equal(u.unitLabel('energy'), 'kWh');
  assert.equal(u.unitLabel('cost'), '');
}
close(u.getUsage('today', d.initialDevices, anchor).total, 18.7);
close(u.getUsage('today', d.initialDevices, anchor).cost, 28.65);
const heater = d.initialDevices.find(device => device.id === 'water-heater');
const washer = d.initialDevices.find(device => device.offline);
const ac = d.initialDevices.find(device => device.id === 'air-conditioner');
const heaterDay = h.periodHistory(heater, anchor, 'today', anchor).summary;
close(heaterDay.energy, 6);
assert.equal(heaterDay.durations.Active, 120);
assert.equal(heaterDay.durations.Idle, 45);
assert.equal(heaterDay.durations.Off, 1275);
assert.equal(heaterDay.turnOns, 2);
assert.equal(h.periodHistory(washer, anchor, 'today', anchor).summary.energy, null);
assert.equal(d.currentPower(washer), null);
assert.equal(h.periodHistory(ac, anchor, 'today', anchor).summary.durations.Idle, 0);
assert.equal(h.dayIntervals(ac, h.addDays(anchor, 1), anchor).length, 0);
for (const device of d.initialDevices) {
  for (const period of u.periods) {
    const history = h.periodHistory(device, anchor, period, anchor);
    const knownDays = history.dates.filter(date => date <= anchor).length;
    assert.equal(Object.values(history.summary.durations).reduce((sum, value) => sum + value, 0), knownDays * 1440);
    const sessions = h.sessions(history.intervals);
    close(sessions.reduce((sum, item) => sum + (item.energy ?? 0), 0), history.summary.energy ?? 0);
    close(sessions.reduce((sum, item) => sum + item.end - item.start, 0), knownDays * 1440);
  }
}
const meter = d.initialDevices[0];
const meterDay = h.periodHistory(meter, anchor, 'today', anchor).summary;
close(meterDay.energy, 18.7); assert(meterDay.missing);
assert.equal(d.counts(d.initialDevices).on, 3);
assert.equal(d.counts(d.initialDevices).scheduled, 1);
assert.equal(d.counts(d.initialDevices.map(device => device.id === heater.id ? { ...device, powerOn: false } : device)).on, 2);
assert.equal(d.counts(d.initialDevices).offline, 1);
const alwaysScheduled = { ...heater, schedules: [{ id: 'all', days: [4], start: '00:00', end: '23:59', enabled: true }] };
assert.equal(d.deviceStatus(alwaysScheduled), 'On');
assert.equal(d.counts([alwaysScheduled]).on, 1); assert.equal(d.counts([alwaysScheduled]).scheduled, 1);
const overnight = { id: 'night', days: [1], start: '22:00', end: '06:00', enabled: true };
assert(d.scheduledAt(overnight, 1, '23:00')); assert(d.scheduledAt(overnight, 2, '05:59')); assert(!d.scheduledAt(overnight, 2, '06:00'));
assert(!d.scheduledAt({ ...overnight, enabled: false }, 1, '23:00'));
assert.equal(Object.keys(d.validateDevice({ ...heater, mode: 'manual', schedules: [] })).length, 0);
assert(d.validateDevice({ ...heater, mode: 'scheduled', schedules: [] }).schedule);
assert(d.validateDevice({ ...heater, power: '-2' }).power);
assert(d.validateDevice({ ...heater, voltage: '240–220' }).voltage);
assert.equal(Object.keys(d.validateDevice({ ...heater, power: '2.5–3', powerUnit: 'kW' })).length, 0);
let devices = d.upsert(d.initialDevices, { ...d.blankDevice(), name: '', icon: 'kettle' });
assert.equal(devices.length, 6); assert.equal(devices.at(-1).name, 'Kettle');
const added = devices.at(-1); assert.equal(h.periodHistory(added, anchor, 'today', anchor).summary.energy, null);
devices = d.upsert(devices, { ...added, name: 'My kettle', mode: 'scheduled', schedules: [overnight] });
assert.equal(devices.length, 6); assert.equal(devices.at(-1).name, 'My kettle'); assert.equal(devices.at(-1).schedules.length, 1);
let state = chat.initialHousehold();
assert.equal(state.messages.length, 0);
state = chat.appendQuestion(state, 'How can I save today?', 'entry-one');
assert.equal(state.messages.length, 3); assert.equal(state.messages[1].role, 'user'); assert.equal(state.messages[2].context, 'schedule');
assert.equal(chat.appendQuestion(state, 'How can I save today?', 'entry-one'), state);
assert.equal(chat.appendQuestion(state, '   '), state);
state = chat.appendQuestion(state, 'Explain my bill', 'entry-two');
assert.equal(state.messages.length, 5); assert.equal(state.messages.at(-1).context, 'bill');
assert.equal(chat.appendQuestion(state, 'A general question').messages.at(-1).context, undefined);
assert.equal(JSON.parse(JSON.stringify(state)).messages.length, 5);
const curve = load('src/data/chart-curve.ts');
for (const values of [[0, 10, 0, 0, 4, 0], [0], [0, 0], [0.2, 0, 0.1, 20, 0.01], ...u.periods.flatMap(period => { const data = u.getUsage(period, d.initialDevices, anchor); return [data.bins.map(bin => bin.energy), data.bins.map(bin => bin.cost)]; })]) {
  const points = values.map((value, x) => ({ x, y: value }));
  const result = curve.boundedCurve(points);
  assert(!result.path.includes('NaN'));
  for (const { start, c1, c2, end } of result.segments) {
    for (let j = 0; j <= 100; j++) {
      const fraction = j / 100, inverse = 1 - fraction;
      const y = inverse ** 3 * start.y + 3 * inverse ** 2 * fraction * c1.y + 3 * inverse * fraction ** 2 * c2.y + fraction ** 3 * end.y;
      assert(y >= -1e-10, 'Interpolation must not create negative consumption');
      assert(y >= Math.min(start.y, end.y) - 1e-10 && y <= Math.max(start.y, end.y) + 1e-10, 'Interpolation must stay within the adjacent sample range');
    }
  }
}
for (const period of u.periods) {
  const data = u.getUsage(period, d.initialDevices, anchor);
  const dates = h.periodDates(anchor, period).filter(date => date <= anchor);
  const peaks = dates.flatMap(date => Array.from({ length: 96 }, (_, index) => d.initialDevices.filter(device => device.id !== 'smart-meter').reduce((sum, device) => sum + (h.dayIntervals(device, date, anchor)[index]?.power ?? 0), 0)));
  close(data.peak, Math.max(...peaks));
  close(data.average, data.total / (dates.length * 24));
}
close(u.getUsage('today', d.initialDevices, anchor).peak, 6.1);
const summary = load('src/data/usage-summary.ts');
const slot = (energy, minute = 0) => ({ date: anchor, minute, minutes: 15, energy });
const coverage = summary.recordedAverages([slot(1), slot(2), slot(null, 15), slot(0, 30)], 'today');
close(coverage.intervalsCovered, 0.5);
close(coverage.averageEnergy, 6);
close(coverage.averageCost, 6 * h.tariff);
assert.equal(summary.recordedAverages([slot(null)], 'today').averageEnergy, null);
for (const period of u.periods) {
  const data = u.getUsage(period, d.initialDevices, anchor, new Date('2026-10-08T08:00:00Z'));
  const days = h.periodDates(anchor, period).filter(date => date < anchor).length;
  close(data.intervalsCovered, period === 'today' ? 10 : days + 10 / 24);
  close(data.averageEnergy, data.total / data.intervalsCovered);
  close(data.averageCost, data.cost / data.intervalsCovered);
  const expected = d.initialDevices.filter(device => device.id !== 'smart-meter').reduce((sum, device) => sum + h.periodDates(anchor, period).filter(date => date <= anchor).flatMap(date => h.dayIntervals(device, date, anchor).filter(interval => date < anchor || interval.minute + interval.minutes <= 600)).reduce((value, interval) => value + (interval.energy ?? 0), 0), 0);
  close(data.total, expected);
}
const missingOnly = u.getUsage('today', [added], anchor);
assert.equal(missingOnly.averageEnergy, null);
assert.equal(missingOnly.averageCost, null);
const segments = Array.from({ length: 9 }, (_, index) => ({ id: String(index), name: `Device ${index}`, energy: index + 1, cost: (index + 1) * h.tariff, color: '#999', share: 0, noData: false }));
const missingSegment = { id: 'missing', name: 'Missing device', energy: 0, cost: 0, color: '#999', share: 0, noData: true };
const ranked = summary.topDevices([...segments, missingSegment], 45);
assert.equal(ranked.rows.slice(0, 7).map(item => item.id).join(','), '8,7,6,5,4,3,2');
assert.equal(ranked.remaining.map(item => item.id).join(','), '1,0,missing');
close(ranked.rows.at(-1).energy, 3);
close(ranked.rows.at(-1).cost, 3 * h.tariff);
close(ranked.rows.reduce((sum, item) => sum + item.energy, 0), 45);
close(ranked.rows.reduce((sum, item) => sum + item.share, 0), 100);
assert.equal(summary.topDevices(segments.slice(0, 7), 28).rows.length, 7);
assert.equal(summary.topDevices(segments.slice(0, 7), 28).remaining.length, 0);
const onlyMissingRest = summary.topDevices([...segments.slice(0, 3), missingSegment], 6);
assert(onlyMissingRest.rows.at(-1).noData);
assert.equal(onlyMissingRest.rows.at(-1).deviceCount, 1);
close(onlyMissingRest.rows.at(-1).share, 0);
assert.equal(summary.topDevices([missingSegment], 0).rows[0].deviceCount, 1);
console.log('Passed: prototype, chart interpolation, covered-interval averages, current-day cutoff, top-seven aggregation, fewer devices and missing-data checks.');
