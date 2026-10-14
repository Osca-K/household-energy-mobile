import { getUsage } from './usage';
import { dayIntervals, sessions } from './history';
import { settingsOf } from './settings';
import { home } from './home';
import type { Household } from '@/state/household';
export type HouseholdAlert = { id: string; title: string; explanation: string; time: string; deviceId?: string };
export function householdAlerts(state: Household): HouseholdAlert[] {
  const settings = settingsOf(state); const date = state.referenceDate;
  const alerts: HouseholdAlert[] = [];
  const add = (key: string, title: string, explanation: string, deviceId?: string) => alerts.push({ id: `${date}:${key}`, title, explanation, time: `${date}T19:00:00+02:00`, deviceId });
  for (const device of state.devices.filter(device => device.id !== 'smart-meter')) {
    const intervals = dayIntervals(device, date, date); const longestSession = Math.max(0, ...sessions(intervals).filter(session => session.state === 'Active').map(session => session.end - session.start)); const limit = Number(settings.alerts[device.id]);
    if (limit > 0 && longestSession > limit) add(`runtime:${device.id}`, `${device.name} ran longer`, `A recorded active session lasted ${longestSession} minutes, above its ${limit}-minute limit. Review its sessions.`, device.id);
    if (intervals.some(interval => interval.state === 'Off' && (interval.power ?? 0) > 0)) add(`unexpected:${device.id}`, 'Unexpected consumption', `${device.name} has a positive power reading while recorded as off. Review the readings; no operator is identified.`, device.id);
    if (device.offline) add(`offline:${device.id}`, `${device.name} is offline`, 'Readings are unavailable. Missing data does not mean zero consumption.', device.id);
  }
  const daily = getUsage('today', state.devices, date); const remaining = Math.ceil(home.balance / Math.max(.1, daily.total));
  if (remaining <= 7) add('balance', 'Prepaid balance running low', `About ${remaining} days remain at the recorded usage rate (${home.balance} kWh available).`);
  const spent = getUsage('month', state.devices, date).cost;
  if (spent >= state.budget * .8) add(spent >= state.budget ? 'budget-exceeded' : 'budget-nearing', spent >= state.budget ? 'Monthly budget exceeded' : 'Budget approaching its limit', `Recorded spending is R${spent.toFixed(2)} of your R${state.budget.toFixed(2)} budget.`);
  return alerts;
}
