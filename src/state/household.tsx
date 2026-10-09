import { createContext, useContext, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialDevices, upsert, type Device, deviceStatus, currentPower } from '@/data/devices';
import { sampleDate } from '@/data/history';
export type Message = { id: string; role: 'assistant' | 'user'; text: string; time: string; context?: 'schedule' | 'usage' | 'bill' };
export type Household = { devices: Device[]; budget: number; referenceDate: string; messages: Message[]; entries: string[]; reminders: string[]; tracking: boolean };
export const initialHousehold = (): Household => ({ devices: initialDevices, budget: 1400, referenceDate: sampleDate, messages: [], entries: [], reminders: [], tracking: false });
const key = 'household-energy:prototype-v1';
export const makeMessage = (role: Message['role'], text: string, context?: Message['context']): Message => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, role, text, time: new Date().toISOString(), context });
export function demoReply(prompt: string, budget: number): { text: string; context?: Message['context'] } {
  if (/save|schedule|water heater|hot water|settings|lower.*bill/i.test(prompt)) return { text: 'Review your water heater schedule against the times your household needs hot water. The sample history includes morning and evening heating sessions. Schedule changes here are local; no appliance is controlled and savings are not guaranteed.', context: 'schedule' };
  if (/usage|high|fridge|cooling/i.test(prompt)) return { text: 'In the sample data, water heating and cooling are the larger loads. Compare device usage and runtime. Offline means missing readings, so the household total is a known subtotal, not a complete live reading.', context: 'usage' };
  if (/bill|cost|budget|balance|last|run out/i.test(prompt)) return { text: `Your local monthly budget is R${budget.toFixed(2)}. Usage costs are calculated with the demo tariff of about R1.53/kWh. These are sample estimates, not a live bill or a guarantee about your prepaid balance.`, context: 'bill' };
  return { text: 'I can explain this prototype’s usage, device schedules and budget. Ask about one of these topics. These responses are local demo examples; no AI service or live readings are connected.' };
}
export function appendQuestion(state: Household, prompt: string, entry?: string) { const text = prompt.trim(); if (!text || (entry && state.entries.includes(entry))) return state; const reply = demoReply(text, state.budget); const greeting = state.messages.length ? state.messages : [makeMessage('assistant', 'Hi Osca. What would you like to know about your electricity?')]; return { ...state, messages: [...greeting, makeMessage('user', text), makeMessage('assistant', reply.text, reply.context)], entries: entry ? [...state.entries, entry] : state.entries }; }
type Actions = { state: Household; ready: boolean; error: string; retry: () => void; update: (change: (state: Household) => Household) => void; saveDevice: (device: Device) => void; toggle: (id: string) => void; ask: (question: string, entry?: string) => void; greet: () => void };
const Context = createContext<Actions | null>(null);
export function HouseholdProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<Household>(initialHousehold);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const queue = useRef(Promise.resolve());
  useEffect(() => { let alive = true; AsyncStorage.getItem(key).then(raw => { if (!alive) return; if (raw) { const value = JSON.parse(raw) as Household; if (!Array.isArray(value.devices) || !value.devices.every(device => typeof device.id === 'string' && typeof device.name === 'string' && typeof device.icon === 'string' && typeof device.category === 'string' && typeof device.location === 'string' && ['power','powerUnit','voltage','voltageUnit','frequency','frequencyUnit'].every(key => typeof device[key as keyof Device] === 'string') && ['alwaysOn','scheduled','manual'].includes(device.mode) && ['enabled','powerOn','offline'].every(key => typeof device[key as keyof Device] === 'boolean') && Array.isArray(device.schedules) && device.schedules.every(slot => typeof slot.id === 'string' && Array.isArray(slot.days) && slot.days.every(day => Number.isInteger(day) && day >= 0 && day <= 6) && typeof slot.start === 'string' && typeof slot.end === 'string' && typeof slot.enabled === 'boolean')) || !(value.budget > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(value.referenceDate) || !Array.isArray(value.messages) || !value.messages.every(message => typeof message.id === 'string' && ['user','assistant'].includes(message.role) && typeof message.text === 'string' && !Number.isNaN(Date.parse(message.time))) || !Array.isArray(value.entries) || !value.entries.every(entry => typeof entry === 'string')) throw Error('Invalid local state'); setState({ ...initialHousehold(), ...value }); } }).catch(() => { if (alive) setError('Local data could not be restored. This session uses sample data.'); }).finally(() => { if (alive) setReady(true); }); return () => { alive = false; }; }, []);
  const persist = useCallback((value: Household) => { queue.current = queue.current.catch(() => {}).then(() => AsyncStorage.setItem(key, JSON.stringify(value))).then(() => setError('')).catch(() => setError('Changes remain in this session, but could not be saved locally. Retry saving.')); }, []);
  useEffect(() => { if (ready) persist(state); }, [state, ready, persist]);
  const update = (change: (value: Household) => Household) => { if (ready) setState(change); };
  const saveDevice = (device: Device) => update(current => ({ ...current, devices: upsert(current.devices, device) }));
  const toggle = (id: string) => update(current => ({ ...current, devices: current.devices.map(device => device.id === id && !device.offline && device.id !== 'smart-meter' && device.enabled ? { ...device, powerOn: !device.powerOn } : device) }));
  const ask = (question: string, entry?: string) => update(current => appendQuestion(current, question, entry));
  const greet = () => update(current => current.messages.length ? current : { ...current, messages: [makeMessage('assistant', 'Hi Osca. What would you like to know about your electricity?')] });
  return <Context.Provider value={{ state, ready, error, retry: () => persist(state), update, saveDevice, toggle, ask, greet }}>{children}</Context.Provider>;
}
export function useHousehold() { const value = useContext(Context); if (!value) throw Error('HouseholdProvider is required'); return value; }
export function householdLoad(devices: Device[]) { return devices.filter(device => device.id !== 'smart-meter' && deviceStatus(device) === 'On').reduce((sum, device) => sum + (currentPower(device) ?? 0), 0); }
