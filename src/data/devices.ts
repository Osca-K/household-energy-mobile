import type { ImageSource } from 'expo-image';
export type Mode = 'alwaysOn' | 'scheduled' | 'manual';
export type Schedule = { id: string; days: number[]; start: string; end: string; enabled: boolean };
export type Device = { confirmed?: boolean; origin?: 'sample' | 'local' | 'cloud'; brand?: string; model?: string; id: string; name: string; icon: string; category: string; location: string; power: string; powerUnit: string; voltage: string; voltageUnit: string; frequency: string; frequencyUnit: string; mode: Mode; enabled: boolean; powerOn: boolean; offline: boolean; schedules: Schedule[] };
export const icons: { name: string; key: string; source: ImageSource }[] = [
  { name: 'Smart Meter', key: 'smart-meter', source: require('@/assets/appliances-blue-soft/smart-meter.png') },
  { name: 'Air Conditioner', key: 'air-conditioner', source: require('@/assets/appliances-blue-soft/air-conditioner.png') },
  { name: 'Fridge', key: 'fridge', source: require('@/assets/appliances-blue-soft/fridge.png') },
  { name: 'Washing Machine', key: 'washing-machine', source: require('@/assets/appliances-blue-soft/washing-machine.png') },
  { name: 'Water Heater', key: 'water-heater', source: require('@/assets/appliances-blue-soft/water-heater.png') },
  { name: 'Blender', key: 'blender', source: require('@/assets/appliances-blue-soft/blender.png') },
  { name: 'Kettle', key: 'kettle', source: require('@/assets/appliances-blue-soft/kettle.png') },
  { name: 'Mixer', key: 'mixer', source: require('@/assets/appliances-blue-soft/mixer.png') },
  { name: 'Juicer', key: 'juicer', source: require('@/assets/appliances-blue-soft/juicer.png') },
  { name: 'Toaster', key: 'toaster', source: require('@/assets/appliances-blue-soft/toaster.png') },
  { name: 'Rice Cooker', key: 'rice-cooker', source: require('@/assets/appliances-blue-soft/rice-cooker.png') },
  { name: 'Fan', key: 'fan', source: require('@/assets/appliances-blue-soft/fan.png') },
  { name: 'Microwave', key: 'microwave', source: require('@/assets/appliances-blue-soft/microwave.png') },
  { name: 'Vacuum', key: 'vacuum', source: require('@/assets/appliances-blue-soft/vacuum.png') },
  { name: 'Heater', key: 'heater', source: require('@/assets/appliances-blue-soft/heater.png') },
  { name: 'Iron', key: 'iron', source: require('@/assets/appliances-blue-soft/iron.png') },
  { name: 'Air Fryer', key: 'air-fryer', source: require('@/assets/appliances-blue-soft/air-fryer.png') },
  { name: 'Dishwasher', key: 'dishwasher', source: require('@/assets/appliances-blue-soft/dishwasher.png') },
  { name: 'Oven', key: 'oven', source: require('@/assets/appliances-blue-soft/oven.png') },
  { name: 'TV', key: 'television', source: require('@/assets/appliances-blue-soft/television.png') },
  { name: 'Computer', key: 'computer', source: require('@/assets/appliances-blue-soft/computer.png') },
  { name: 'Lights', key: 'lights', source: require('@/assets/appliances-blue-soft/lights.png') },
  { name: 'Other', key: 'other', source: require('@/assets/appliances-blue-soft/other.png') },
];
export const categories = ['Kitchen', 'Laundry', 'Cooling', 'Heating', 'Water Heating', 'Lighting', 'Cleaning', 'Entertainment', 'Other'];
export const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const illustration = (key: string) => (icons.find(icon => icon.key === key) || icons[icons.length - 1]).source;
export const suggestedName = (key: string) => icons.find(icon => icon.key === key)?.name || 'Device';
export const blankDevice = (): Device => ({ id: '', name: '', icon: '', category: 'Kitchen', location: 'Kitchen', power: '', powerUnit: 'W', voltage: '', voltageUnit: 'V', frequency: '', frequencyUnit: 'Hz', mode: 'manual', enabled: true, powerOn: false, offline: false, schedules: [] });
const make = (id: string, category: string, location: string, power: string, mode: Mode, offline = false): Device => ({ ...blankDevice(), id, name: suggestedName(id), icon: id, category, location, power, voltage: '220–240', frequency: '50', mode, powerOn: !offline, offline });
export const initialDevices: Device[] = [make('smart-meter', 'Other', 'Main line', '5', 'alwaysOn'), make('air-conditioner', 'Cooling', 'Living room', '2500', 'manual'), make('fridge', 'Kitchen', 'Kitchen', '600', 'alwaysOn'), make('washing-machine', 'Laundry', 'Laundry', '500', 'manual', true), { ...make('water-heater', 'Water Heating', 'Bathroom', '3000', 'scheduled'), schedules: [{ id: 'heater-morning', days: [1, 2, 3, 4, 5], start: '06:00', end: '07:00', enabled: true }, { id: 'heater-evening', days: [1, 2, 3, 4, 5], start: '18:00', end: '19:00', enabled: true }] }];
export function scheduledAt(slot: Schedule, day: number, time: string) {
  if (!slot.enabled) return false;
  return slot.start < slot.end ? slot.days.includes(day) && time >= slot.start && time < slot.end : (slot.days.includes(day) && time >= slot.start) || (slot.days.includes((day + 6) % 7) && time < slot.end);
}
// A stable local status snapshot, not live hardware telemetry.
export function deviceStatus(device: Device) {
  if (device.offline) return 'Offline' as const;
  if (!device.enabled || !device.powerOn) return 'Off' as const;
  if (device.mode === 'scheduled' && !device.schedules.some(slot => scheduledAt(slot, 4, '10:15'))) return 'Scheduled' as const;
  return 'On' as const;
}
export const statusColor = { On: '#a4ca79', Scheduled: '#807afa', Off: '#c8c9d9', Offline: '#999ba8' };
// On counts powered appliances; the meter is a monitoring device. A scheduled appliance may also be on.
export function counts(devices: Device[]) { return { total: devices.length, on: devices.filter(device => device.id !== 'smart-meter' && device.enabled && device.powerOn && !device.offline).length, scheduled: devices.filter(device => device.enabled && device.mode === 'scheduled').length, offline: devices.filter(device => device.offline).length }; }
export function currentPower(device: Device) { if (device.offline) return null; if (deviceStatus(device) !== 'On') return 0; const numeric = (value: string) => Number(value.split(/[-?]/)[0].trim().replace(',', '.')) || 0; const power = numeric(device.power); if (device.powerUnit === 'A') return power * numeric(device.voltage) * (device.voltageUnit === 'kV' ? 1000 : 1) / 1000; return power / (device.powerUnit === 'kW' ? 1 : 1000); }
export function validateDevice(device: Device): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!icons.some(icon => icon.key === device.icon)) errors.icon = 'Choose a device icon.';
  if (device.name.trim().length > 40) errors.name = 'Use at most 40 characters.';
  for (const key of ['power', 'voltage', 'frequency'] as const) { const value = device[key].trim().replace(key === 'frequency' ? /\//g : /$^/, '-'); if (value && !/^\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?$/.test(value)) errors[key] = 'Enter a positive number or range.'; else if (value && value.split(/[-–]/).some(part => Number(part.replace(',', '.')) <= 0)) errors[key] = 'Values must be greater than zero.'; else if (value.includes('-') || value.includes('–')) { const range = value.split(/[-–]/).map(part => Number(part.replace(',', '.'))); if (range[0] > range[1]) errors[key] = 'Enter the lower value first.'; } }
  if (device.mode === 'scheduled' && (!device.schedules.length || device.schedules.some(slot => !slot.days.length || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(slot.start) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(slot.end) || slot.start === slot.end))) errors.schedule = 'Each slot needs a day and two different valid HH:MM times.';
  return errors;
}
export function upsert(devices: Device[], device: Device) { const saved = { ...device, id: device.id || newId(), name: device.name.trim() || suggestedName(device.icon) }; return devices.some(item => item.id === saved.id) ? devices.map(item => item.id === saved.id ? saved : item) : [...devices, saved]; }
