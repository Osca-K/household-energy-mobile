import { useAuthentication } from './auth';
import { LocalTrialRepository } from '@/repositories/local-trial';
import { accountState } from '@/repositories/cloud-state';
import type { CloudRepository } from '@/repositories/contracts';
import { type MeterReading } from '@/data/meter-readings';
import { enforcePermissions } from './permissions';
import { defaultSettings, settingsOf, isCreator, canOperate, type Settings } from '@/data/settings';
import { createContext, useContext, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { initialDevices, upsert, type Device, deviceStatus, currentPower } from '@/data/devices';
import { configureTariffs, sampleDate } from '@/data/history';
export type Message = { id: string; role: 'assistant' | 'user'; text: string; time: string; context?: 'schedule' | 'usage' | 'bill' };
export type Household = { scope?: 'trial' | 'cloud'; accountUid?: string; householdId?: string; meterReadings?: MeterReading[]; devices: Device[]; budget: number; referenceDate: string; messages: Message[]; entries: string[]; reminders: string[]; tracking: boolean; settings?: Settings; readNotifications?: string[] };
export const initialHousehold = (): Household => ({ scope: 'trial', meterReadings: [], devices: initialDevices.map(device => ({ ...device, origin: 'sample' as const, confirmed: false })), budget: 1400, referenceDate: sampleDate, messages: [], entries: [], reminders: [], tracking: false, settings: defaultSettings(), readNotifications: [] });
export const makeMessage = (role: Message['role'], text: string, context?: Message['context']): Message => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, role, text, time: new Date().toISOString(), context });
export function demoReply(prompt: string, budget: number): { text: string; context?: Message['context'] } {
  if (/save|schedule|water heater|hot water|settings|lower.*bill/i.test(prompt)) return { text: 'Review your water heater schedule against the times your household needs hot water. Compare its morning and evening sessions with your routine.', context: 'schedule' };
  if (/usage|high|fridge|cooling/i.test(prompt)) return { text: 'Compare device usage and runtime to find the largest contributors. Check water heating and cooling first. Offline devices have missing readings.', context: 'usage' };
  if (/bill|cost|budget|balance|last|run out/i.test(prompt)) return { text: `Your monthly budget is R${budget.toFixed(2)}. Usage cost estimates use the household tariff recorded for each date. Compare your spending and estimated total in Usage.`, context: 'bill' };
  return { text: 'Ask about electricity usage, device schedules or your household budget.' };
}
export function appendQuestion(state: Household, prompt: string, entry?: string) { const text = prompt.trim(); if (!text || (entry && state.entries.includes(entry))) return state; const reply = settingsOf(state).ai ? demoReply(text, state.budget) : { text: 'Household data access is disabled. Energy is measured in kWh; cost estimates use your household tariff. The household creator can enable contextual assistance in Privacy.' }; const greeting = state.messages.length ? state.messages : [makeMessage('assistant', `Hi ${settingsOf(state).profile.name.split(' ')[0]}. What would you like to know about your electricity?`)]; return { ...state, messages: [...greeting, makeMessage('user', text), makeMessage('assistant', reply.text, reply.context)], entries: entry ? [...state.entries, entry] : state.entries }; }
type Actions = { state: Household; ready: boolean; error: string; retry: () => void; update: (change: (state: Household) => Household) => void; saveDevice: (device: Device) => Promise<void>; deleteDevice: (id: string) => Promise<void>; createHousehold: (name: string, devices: Device[]) => Promise<string>; toggle: (id: string) => void; ask: (question: string, entry?: string) => void; greet: () => void; joinHousehold: (token: string) => void };
const Context = createContext<Actions | null>(null);
export function HouseholdProvider({ children }: PropsWithChildren) {
  const auth = useAuthentication();
  return <ScopedHousehold key={auth.mode + ':' + (auth.user?.uid || '') + ':' + auth.epoch}>{children}</ScopedHousehold>;
}
function ScopedHousehold({ children }: PropsWithChildren) {
  const auth = useAuthentication(); const cloud = auth.mode === 'account';
  const [state, setState] = useState<Household>(() => cloud ? accountState(auth.user) : initialHousehold());
  const [ready, setReady] = useState(() => cloud && !auth.user?.verified); const [error, setError] = useState('');
  const local = useRef(new LocalTrialRepository(initialHousehold)); const repository = useRef<CloudRepository | null>(null); const alive = useRef(true);
  configureTariffs(settingsOf(state).supply.rates);
  useEffect(() => { alive.current = true; let active = true; let ownedRepository: CloudRepository | null = null; let detach: (() => void) | undefined; if (!cloud) { local.current.load().then(value => { if (active) setState(value); }).catch(() => { if (active) setError('Local trial data could not be restored.'); }).finally(() => { if (active) setReady(true); }); }
    else if (auth.user?.verified && auth.backend) { const user = auth.user; auth.backend.repository(user).then(repo => { if (!active) { void repo.dispose(); return; } ownedRepository = repo; repository.current = repo; detach = repo.subscribe((home, devices, members) => { if (!active) return; setState(accountState(user, home, devices, members)); setReady(true); setError(''); }, cause => { if (active) { setState(accountState(user)); setError(cause.message); setReady(true); } }); }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Household could not be loaded.'); setReady(true); } }); }
    return () => { active = false; alive.current = false; detach?.(); if (ownedRepository) void ownedRepository.dispose(); repository.current = null; };
  }, [cloud, auth.user, auth.backend]);
  const persist = useCallback((value: Household) => { if (cloud) return; void local.current.save(value).then(() => { if (alive.current) setError(''); }).catch(() => { if (alive.current) setError('Changes could not be saved locally. Retry saving.'); }); }, [cloud]);
  useEffect(() => { if (ready && !cloud) persist(state); }, [state, ready, cloud, persist]);
  const update = useCallback((change: (value: Household) => Household) => {
    if (!ready) return;
    if (cloud) { setError('This setting is not connected in stage one.'); return; }
    setState(current => enforcePermissions(current, change(current)));
  }, [ready, cloud]);
  const saveDevice = async (device: Device) => { const confirmed = { ...device, confirmed: true, origin: cloud ? 'cloud' as const : 'local' as const }; if (cloud) { if (!repository.current) throw new Error('Load or create your household first.'); await repository.current.saveDevice(confirmed); } else update(current => ({ ...current, devices: isCreator(settingsOf(current)) ? upsert(current.devices, confirmed) : current.devices })); };
  const deleteDevice = async (id: string) => { if (cloud) { if (!repository.current) throw new Error('Load your household first.'); await repository.current.deleteDevice(id); } else update(current => ({ ...current, devices: current.devices.filter(device => device.id !== id) })); };
  const createHousehold = async (name: string, devices: Device[]) => { if (!repository.current) throw new Error('Verify your email and connect first.'); return repository.current.createHousehold(name, devices); };
  const toggle = (id: string) => { if (cloud) { setError('Device controls are not connected in stage one.'); return; } update(current => ({ ...current, devices: current.devices.map(device => device.id === id && canOperate(settingsOf(current)) && !device.offline && device.id !== 'smart-meter' && device.enabled ? { ...device, powerOn: !device.powerOn } : device) })); };
  const joinHousehold = () => { setError('QR joining is reserved for a later stage.'); };
  const ask = (question: string, entry?: string) => update(current => appendQuestion(current, question, entry));
  const greet = () => update(current => current.messages.length ? current : { ...current, messages: [makeMessage('assistant', `Hi ${settingsOf(current).profile.name.split(' ')[0]}. What would you like to know about your electricity?`)] });

  return <Context.Provider value={{ state, ready, error, retry: () => cloud ? void auth.verify().catch(() => {}) : persist(state), update, saveDevice, deleteDevice, createHousehold, toggle, ask, greet, joinHousehold }}>{children}</Context.Provider>;
}
export function useHousehold() { const value = useContext(Context); if (!value) throw Error('HouseholdProvider is required'); return value; }
export function householdLoad(devices: Device[]) { return devices.filter(device => device.id !== 'smart-meter' && deviceStatus(device) === 'On').reduce((sum, device) => sum + (currentPower(device) ?? 0), 0); }
