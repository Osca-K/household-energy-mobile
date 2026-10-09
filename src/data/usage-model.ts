import { initialDevices } from './devices';
import { dayIntervals, periodDates, sampleDate, summarise, tariff, localToday } from './history';
import { recordedAverages } from './usage-summary';
export { tariff } from './history';
export type Period = 'today' | 'week' | 'month';
export type Unit = 'energy' | 'cost';
export const periods: Period[] = ['today', 'week', 'month'];
export const periodLabel = { today: 'Today', week: 'Week', month: 'Month' };
export const totalLabel = { today: 'Total today', week: 'Total this week', month: 'Total this month' };
export const sample = { budget: 1400, spent: 892.4, estimate: 1260, load: 2.34, on: 3, devices: 5, remaining: 6 };
export type Segment = { id?: string; name: string; color: string; energy: number; cost: number; share: number; missing?: boolean; noData?: boolean; deviceCount?: number };
export function getUsage(period: Period, devices = initialDevices, anchor = sampleDate, now = new Date()) {
  const today = localToday(now);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const minute = Number(parts.find(part => part.type === 'hour')?.value) * 60 + Number(parts.find(part => part.type === 'minute')?.value);
  const dates = periodDates(anchor, period).filter(date => date <= anchor && date <= today);
  const sources = devices.filter(device => device.id !== 'smart-meter');
  const readings = (device: typeof devices[number], date: string) => dayIntervals(device, date, anchor).filter(interval => date < today || (date === today && interval.minute + interval.minutes <= minute));
  const recorded = sources.map(device => dates.flatMap(date => readings(device, date)));
  const summaries = recorded.map(summarise);
  const averages = recordedAverages(recorded.flat(), period);
  const total = summaries.reduce((sum, item) => sum + (item.energy ?? 0), 0);
  const colors = ['#8994f1', '#bac4f6', '#d0c9f3', '#aa92eb', '#dedbf8'];
  const segment = (name: string, color: string, energy: number): Segment => ({ name, color, energy, cost: energy * tariff, share: total ? energy / total * 100 : 0 });
  const breakdown = sources.map((device, i) => ({ ...segment(device.name, colors[i % colors.length], summaries[i].energy ?? 0), id: device.id, missing: summaries[i].missing, noData: summaries[i].energy === null }));
  const roomNames = [...new Set(sources.map(device => device.location || device.category))];
  const roomColors = ['#8994f1', '#e7c978', '#9ed5ad', '#a471e9', '#c8baf2'];
  const rooms = roomNames.map((room, i) => { const indices = sources.flatMap((device, index) => (device.location || device.category) === room ? [index] : []); return { ...segment(room, roomColors[i % roomColors.length], indices.reduce((sum, index) => sum + (summaries[index].energy ?? 0), 0)), noData: indices.every(index => summaries[index].energy === null), missing: indices.some(index => summaries[index].missing) }; });
  const daily = sources.map(device => anchor <= today ? readings(device, anchor) : []);
  const hourly = Array.from({ length: 24 }, (_, hour) => daily.reduce((sum, intervals) => sum + intervals.filter(item => item.minute >= hour * 60 && item.minute < (hour + 1) * 60).reduce((value, item) => value + (item.energy ?? 0), 0), 0));
  const energies = period === 'today' ? hourly : dates.map(date => sources.reduce((sum, device) => sum + (summarise(readings(device, date)).energy ?? 0), 0));
  const bins = energies.map((energy, i) => ({ energy, cost: energy * tariff, label: period === 'today' ? `${String(i).padStart(2, '0')}:00` : period === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] : String(i + 1) }));
  // Peak load is the largest simultaneous quarter-hour power reading, not
  // the largest daily energy bin divided by 24 (which would be mean power).
  const peak = Math.max(0, ...dates.flatMap(date => {
    const intervals = sources.map(device => readings(device, date));
    return Array.from({ length: 96 }, (_, index) => intervals.reduce((sum, values) => sum + (values[index]?.power ?? 0), 0));
  }));
  return { total, cost: total * tariff, bins, devices: breakdown, rooms, peak, average: total / (period === 'today' ? 24 : Math.max(1, dates.length) * 24), ...averages, missing: summaries.some(item => item.missing || item.energy === null) };
}
export function displayValue(value: number, unit: Unit) { return unit === 'energy' ? value.toFixed(1) : `R${value.toFixed(2)}`; }
export function unitLabel(unit: Unit) { return unit === 'energy' ? 'kWh' : ''; }
