import { defaultSettings } from '@/data/settings';
import { localToday } from '@/data/history';
import type { Household } from '@/state/household';
import type { AccountUser, CloudHousehold } from './contracts';
import type { Device } from '@/data/devices';
export function accountState(user: AccountUser | null, home: CloudHousehold | null = null, devices: Device[] = [], members: { id: string; name: string }[] = []): Household {
  const settings = defaultSettings();
  settings.identityUid = user?.uid || ''; settings.profile = { name: user?.displayName || '', email: user?.email || '', location: { country: '', province: '', city: '', suburb: '' } };
  settings.household = { name: home?.name || '', address: '', owner: home?.creatorUid || '', members, invitations: [] };
  settings.supply = { ...settings.supply, country: '', province: '', city: '', suburb: '', rates: [], tariffName: '', provider: '' };
  return { scope: 'cloud', accountUid: user?.uid, householdId: home?.id, devices, settings, budget: 0, referenceDate: localToday(), messages: [], entries: [], reminders: [], tracking: false, meterReadings: [], readNotifications: [] };
}
