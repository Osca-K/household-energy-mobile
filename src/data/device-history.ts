import type { Device } from './devices';
import { addDays, dayIntervals, summarise, tariffAt, type Interval, type Period } from './history';
export const clockLabel = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
export const weekGroups = (dates: string[]) => Array.from({ length: Math.ceil(dates.length / 7) }, (_, i) => dates.slice(i * 7, i * 7 + 7));
export type DeviceBin = { label: string; start: number; end: number; value: number | null; missing: boolean };
export function deviceBins(device: Device, dates: string[], anchor: string, period: Period, cost: boolean): DeviceBin[] {
  if (period === 'today') return dayIntervals(device, dates[0], anchor).map(item => ({ label: `${clockLabel(item.minute)}–${clockLabel(item.minute + item.minutes)}`, start: item.minute, end: item.minute + item.minutes, value: cost ? item.energy === null ? null : item.energy * tariffAt(item.date) : item.power, missing: !!item.missing || item.energy === null }));
  return (period === 'month' ? weekGroups(dates) : dates.map(day => [day])).map((days, index) => {
    const summary = summarise(days.flatMap(day => dayIntervals(device, day, anchor)));
    return { label: days.length === 1 ? days[0] : `${days[0]} – ${days.at(-1)}`, start: index, end: index + 1, value: cost ? summary.cost : summary.energy, missing: summary.missing };
  });
}
// Off -> powered transitions, never Idle -> Active compressor/heating cycles.
export function observedSwitchOns(device: Device, intervals: Interval[], anchor: string) {
  if (!intervals.length || intervals.every(item => item.state === 'Offline')) return null;
  let previous = dayIntervals(device, addDays(intervals[0].date, -1), anchor).at(-1);
  let count = 0;
  for (const item of intervals) {
    const contiguous = previous && (previous.date === item.date ? previous.minute + previous.minutes === item.minute : addDays(previous.date, 1) === item.date && previous.minute + previous.minutes === 1440 && item.minute === 0);
    if (contiguous && previous?.state === 'Off' && (item.state === 'Active' || item.state === 'Idle')) count++;
    previous = item;
  }
  return count;
}
