import type { Interval } from './history';
import { tariff } from './history';
import type { Period, Segment } from './usage-model';

// Household coverage is the union of recorded time slots, not the sum of
// device-hours. An offline device contributes neither energy nor a zero reading.
export function recordedAverages(intervals: Interval[], period: Period) {
  const covered = new Map<string, number>();
  let energy = 0;
  for (const interval of intervals) {
    if (interval.energy === null) continue;
    energy += interval.energy;
    covered.set(`${interval.date}:${interval.minute}`, interval.minutes);
  }
  const minutes = [...covered.values()].reduce((sum, value) => sum + value, 0);
  const intervalsCovered = minutes / (period === 'today' ? 60 : 1440);
  return { averageEnergy: intervalsCovered ? energy / intervalsCovered : null, averageCost: intervalsCovered ? energy * tariff / intervalsCovered : null, intervalsCovered };
}

export function topDevices(devices: Segment[], total: number) {
  const order = (a: Segment, b: Segment) => b.energy - a.energy || (a.id ?? a.name).localeCompare(b.id ?? b.name);
  const recorded = devices.filter(device => !device.noData).map(device => ({ ...device, share: total ? device.energy / total * 100 : 0 })).sort(order);
  const missing = devices.filter(device => device.noData).map(device => ({ ...device, share: 0 })).sort((a, b) => a.name.localeCompare(b.name));
  const top = recorded.slice(0, 7);
  const restRecorded = recorded.slice(7);
  const remaining = [...restRecorded, ...missing];
  const energy = restRecorded.reduce((sum, device) => sum + device.energy, 0);
  const cost = restRecorded.reduce((sum, device) => sum + device.cost, 0);
  const other: Segment | null = remaining.length ? { id: 'other-devices', name: 'Other devices', color: '#dedbf8', energy, cost, share: total ? energy / total * 100 : 0, noData: !restRecorded.length, deviceCount: remaining.length } : null;
  return { rows: other ? [...top, other] : top, remaining };
}
