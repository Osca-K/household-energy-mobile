import { canOperate, isCreator, settingsOf } from '@/data/settings';
import type { Household } from './household';
// Local authorization applies to every state update, not just visible controls.
// A shared backend must repeat these checks before any real mutations.
export function enforcePermissions(current: Household, proposed: Household): Household {
  const before = settingsOf(current); const next = settingsOf(proposed); const creator = isCreator(before);
  const canLeave = before.household.owner !== 'self' || before.household.members.length <= 1;
  const leaving = canLeave && !next.household.members.some(member => member.id === 'self');
  const household = creator ? (before.household.members.length > 1 && !next.household.members.some(member => member.id === 'self') && next.household.owner === 'self' ? before.household : next.household) : { ...before.household, members: before.household.members.filter(member => !(leaving && member.id === 'self')).map(member => member.id === 'self' ? { ...member, name: next.profile.name } : member) };
  return { ...proposed, meterReadings: canOperate(before) ? proposed.meterReadings : current.meterReadings, referenceDate: current.referenceDate, budget: creator ? proposed.budget : current.budget, devices: creator ? proposed.devices : current.devices.map(device => { const wanted = proposed.devices.find(item => item.id === device.id); const allowed = canOperate(before) && device.enabled && !device.offline && device.icon !== 'smart-meter'; return wanted && allowed ? { ...device, powerOn: wanted.powerOn } : device; }), settings: { ...next, appearance: 'Light', household, supply: creator ? next.supply : before.supply, alerts: creator ? next.alerts : before.alerts, ai: creator ? next.ai : before.ai, research: creator ? next.research : before.research } };
}
