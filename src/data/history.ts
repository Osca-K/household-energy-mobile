import { initialDevices, type Device } from './devices';
export type Period = 'today' | 'week' | 'month';
export type State = 'Active' | 'Idle' | 'Off' | 'Offline';
export const tariff = 28.65 / 18.7;
export const stateColors: Record<State, string> = { Active: '#a8d274', Idle: '#aaa0f3', Off: '#d6d8e5', Offline: '#9294a7' };
export type Interval = { date: string; minute: number; minutes: number; state: State; power: number | null; energy: number | null; missing?: boolean };
export function localToday(now = new Date()) { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now); const value = (type: string) => parts.find(part => part.type === type)?.value; return `${value('year')}-${value('month')}-${value('day')}`; }
export function addDays(date: string, count: number) { const day = new Date(`${date}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + count); return day.toISOString().slice(0, 10); }
export const sampleDate = addDays(localToday(), -1);
export function periodDates(date: string, period: Period) { if (period === 'today') return [date]; const day = new Date(`${date}T12:00:00Z`); const start = period === 'week' ? addDays(date, -((day.getUTCDay() + 6) % 7)) : `${date.slice(0, 7)}-01`; const count = period === 'week' ? 7 : new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 0)).getUTCDate(); return Array.from({ length: count }, (_, i) => addDays(start, i)); }
export function shiftPeriod(date: string, period: Period, direction: number) { if (period !== 'month') return addDays(date, direction * (period === 'week' ? 7 : 1)); const day = new Date(`${date}T12:00:00Z`); return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + direction, 1)).toISOString().slice(0, 10); }
export function idleSupported(device: Device) { return device.id === 'water-heater' || device.id === 'fridge'; }
export function dayIntervals(device: Device, date: string, anchor = sampleDate): Interval[] {
  if (date > anchor || !initialDevices.some(item => item.id === device.id)) return [];
  if (device.id === 'smart-meter') { const sources = initialDevices.filter(item => item.id !== 'smart-meter').map(item => dayIntervals(item, date, anchor)); return Array.from({ length: 96 }, (_, i) => { const power = sources.reduce((sum, source) => sum + (source[i]?.power ?? 0), 0); return { date, minute: i * 15, minutes: 15, state: power > 0 ? 'Active' : 'Off', power, energy: power / 4, missing: sources.some(source => source[i]?.energy === null) }; }); }
  const variation = date === anchor ? 1 : 0.85 + Number(date.slice(-2)) % 4 * 0.1;
  return Array.from({ length: 96 }, (_, i) => {
    const hour = i / 4; let state: State = 'Off', power: number | null = 0;
    if (device.id === 'water-heater') { if ((hour >= 6 && hour < 7) || (hour >= 18 && hour < 19)) { state = 'Active'; power = 3 * variation; } else if ((hour >= 7 && hour < 7.5) || (hour >= 19 && hour < 19.25)) state = 'Idle'; }
    else if (device.id === 'air-conditioner' && hour >= 16 && hour < 19) { state = 'Active'; power = 2.5 * variation; }
    else if (device.id === 'fridge') { state = i % 3 === 0 ? 'Active' : 'Idle'; power = (state === 'Active' ? 0.6 : 0.025) * variation; }
    else if (device.id === 'washing-machine') { if (date >= addDays(anchor, -2)) { state = 'Offline'; power = null; } else if (hour >= 9 && hour < 10) { state = 'Active'; power = 0.5; } }
    return { date, minute: i * 15, minutes: 15, state, power, energy: power === null ? null : power / 4 };
  });
}
export function summarise(intervals: Interval[]) {
  const durations: Record<State, number> = { Active: 0, Idle: 0, Off: 0, Offline: 0 };
  intervals.forEach(item => { durations[item.state] += item.minutes; });
  const known = intervals.filter(item => item.energy !== null);
  const energy = known.length ? known.reduce((sum, item) => sum + (item.energy ?? 0), 0) : null;
  const turnOns = intervals.filter((item, i) => item.state === 'Active' && (i === 0 || intervals[i - 1].state !== 'Active' || intervals[i - 1].date !== item.date)).length;
  return { energy, cost: energy === null ? null : energy * tariff, durations, turnOns, missing: durations.Offline > 0 || intervals.some(item => item.missing), knownMinutes: known.length * 15 };
}
export function sessions(intervals: Interval[]) { return intervals.reduce<{ start: number; end: number; state: State; date: string; energy: number | null }[]>((result, item) => { const previous = result.at(-1); if (previous && previous.date === item.date && previous.state === item.state && previous.end === item.minute) { previous.end += item.minutes; if (previous.energy !== null) previous.energy += item.energy ?? 0; } else result.push({ date: item.date, start: item.minute, end: item.minute + item.minutes, state: item.state, energy: item.energy }); return result; }, []); }
export function durationLabel(minutes: number) { const hours = Math.floor(minutes / 60), rest = minutes % 60; return hours ? `${hours} h${rest ? ` ${rest} min` : ''}` : `${rest} min`; }
export function dateLabel(date: string) { return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', year: 'numeric' }); }
export function periodHistory(device: Device, date: string, period: Period, anchor = sampleDate) { const dates = periodDates(date, period); const intervals = dates.flatMap(day => dayIntervals(device, day, anchor)); return { dates, intervals, summary: summarise(intervals) }; }
