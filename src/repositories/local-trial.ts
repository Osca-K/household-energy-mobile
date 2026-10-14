import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialDevices, type Device } from '@/data/devices';
import { normaliseSettings } from '@/data/settings';
import { isMeterReading } from '@/data/meter-readings';
import type { Household } from '@/state/household';
import type { HouseholdRepository } from './contracts';
export const trialStorageKey = 'household-energy:prototype-v1';
export function restoreTrial(raw: string, initial: Household): Household {
  const value = JSON.parse(raw) as Household;
  if (value.scope === 'cloud' || value.accountUid || value.householdId || !Array.isArray(value.devices) || !value.devices.every((device: Device) => typeof device.id === 'string' && typeof device.name === 'string' && typeof device.icon === 'string' && typeof device.category === 'string' && typeof device.location === 'string' && ['power','powerUnit','voltage','voltageUnit','frequency','frequencyUnit'].every(key => typeof device[key as keyof Device] === 'string') && ['alwaysOn','scheduled','manual'].includes(device.mode) && ['enabled','powerOn','offline'].every(key => typeof device[key as keyof Device] === 'boolean') && Array.isArray(device.schedules) && device.schedules.every(slot => typeof slot.id === 'string' && Array.isArray(slot.days) && slot.days.every(day => Number.isInteger(day) && day >= 0 && day <= 6) && typeof slot.start === 'string' && typeof slot.end === 'string' && typeof slot.enabled === 'boolean')) || !(value.budget > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(value.referenceDate) || !Array.isArray(value.messages) || !Array.isArray(value.entries)) throw new Error('Invalid local trial state');
  return { ...initial, ...value, scope: 'trial', settings: { ...normaliseSettings(value.settings), identityUid: undefined }, devices: value.devices.map(device => ({ ...device, origin: initialDevices.some(sample => sample.id === device.id) ? 'sample' : 'local' })), meterReadings: (value.meterReadings || []).filter(isMeterReading) };
}
export class LocalTrialRepository implements HouseholdRepository {
  private queue = Promise.resolve();
  constructor(private readonly initial: () => Household) {}
  async load() { const raw = await AsyncStorage.getItem(trialStorageKey); return raw ? restoreTrial(raw, this.initial()) : this.initial(); }
  save(state: Household) {
    if (state.scope === 'cloud' || state.accountUid || state.householdId) return Promise.reject(new Error('Cloud state cannot be written to trial storage.'));
    const value = JSON.stringify(state);
    this.queue = this.queue.catch(() => {}).then(() => AsyncStorage.setItem(trialStorageKey, value)); return this.queue;
  }
}
