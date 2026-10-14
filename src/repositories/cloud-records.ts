import { initialDevices, suggestedName, validateDevice, type Device } from '@/data/devices';
const sampleIds = new Set(initialDevices.map(device => device.id));
export const importableDevices = (devices: Device[]) => devices.filter(device => device.confirmed === true && device.origin === 'local' && !sampleIds.has(device.id));
// An allowlist, never {...device} or {...household}: photos/OCR/state are local only.
export function confirmedDeviceRecord(device: Device) {
  if (!device.confirmed || Object.keys(validateDevice(device)).length) throw new Error('Confirm valid device specifications before sharing.');
  return {
    name: device.name.trim() || suggestedName(device.icon), icon: device.icon, category: device.category, location: device.location,
    brand: device.brand?.trim() || '', model: device.model?.trim() || '',
    power: device.power.trim(), powerUnit: device.powerUnit, voltage: device.voltage.trim(), voltageUnit: device.voltageUnit,
    frequency: device.frequency.trim(), frequencyUnit: device.frequencyUnit,
    mode: device.mode, enabled: device.enabled, powerOn: device.powerOn, offline: true,
    schedules: device.schedules.map(slot => ({ id: slot.id, days: [...slot.days], start: slot.start, end: slot.end, enabled: slot.enabled })),
  };
}
export function deviceFromCloud(id: string, data: ReturnType<typeof confirmedDeviceRecord>): Device {
  return { ...data, id, confirmed: true, origin: 'cloud' };
}
