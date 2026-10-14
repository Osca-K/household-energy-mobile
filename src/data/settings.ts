export type Member = { id: string; name: string };
export type Location = { country: string; province: string; city: string; suburb: string };
export type Settings = { identityUid?: string;
  profile: { name: string; email: string; location: Location };
  household: { name: string; address: string; owner: string; members: Member[]; invitation?: { token: string; expiresAt: string; revoked: boolean }; invitations: never[] };
  supply: Location & { provider: string; billing: 'Prepaid' | 'Postpaid'; tariffName: string; rates: { effective: string; rate: number }[] };
  appearance: 'Light';
  notifications: Record<string, boolean>; quiet: { enabled: boolean; start: string; end: string }; alerts: Record<string, string>;
  ai: boolean; analytics: boolean; research: boolean; pendingInvitation?: string; report: string;
};
export const notificationLabels = ['Device runtime limit', 'Unexpected device activity', 'Low prepaid balance', 'Budget approaching limit', 'Budget exceeded', 'Device offline', 'Invitations and membership', 'Weekly usage summary'];
const location = { country: 'South Africa', province: 'Gauteng', city: 'Johannesburg', suburb: 'Soweto' };
export const defaultSettings = (): Settings => ({
  profile: { name: 'Osca Kholopha', email: 'osca@example.com', location: { ...location } },
  household: { name: 'Kholopha Home', address: 'House 24', owner: 'self', members: [{ id: 'self', name: 'Osca Kholopha' }, { id: 'member-2', name: 'Alex Kholopha' }, { id: 'member-3', name: 'Sam Kholopha' }, { id: 'member-4', name: 'Taylor Kholopha' }], invitations: [] },
  supply: { ...location, provider: '', billing: 'Prepaid', tariffName: 'Illustrative flat rate', rates: [{ effective: '0000-01-01', rate: 28.65 / 18.7 }] },
  appearance: 'Light', notifications: Object.fromEntries(notificationLabels.map(label => [label, true])), quiet: { enabled: false, start: '22:00', end: '07:00' }, alerts: { 'air-conditioner': '120' }, ai: true, analytics: false, research: false, report: '',
});
export function settingsOf(state: { settings?: Settings }) { return state.settings ?? defaultSettings(); }
export function isCreator(settings: Settings) { return settings.household.owner === (settings.identityUid || 'self') && canOperate(settings); }
export function canOperate(settings: Settings) { return settings.household.members.some(member => member.id === (settings.identityUid || 'self')); }
export function canAdd(settings: Settings, count: number) { return isCreator(settings) && count >= 0; }
export function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase() || '?'; }
export function transferOwner(settings: Settings, id: string): Settings { if (settings.household.owner !== 'self' || !settings.household.members.some(member => member.id === id && id !== 'self')) return settings; return { ...settings, household: { ...settings.household, owner: id, members: settings.household.members.map(member => member.id === id ? { ...member } : member) } }; }
export function rateFor(settings: Settings, date: string) { return [...settings.supply.rates].sort((a, b) => b.effective.localeCompare(a.effective)).find(item => item.effective <= date)?.rate ?? 28.65 / 18.7; }

export function normaliseSettings(value?: Settings): Settings { const base = defaultSettings(); if (!value || typeof value !== 'object') return base; const clean = Object.fromEntries(Object.entries(value).filter(([key]) => !['defaultView', 'systemAppearance', 'reduceTransparency'].includes(key))) as Settings; return { ...base, ...clean, profile: { ...base.profile, ...value.profile, location: { ...base.profile.location, ...value.profile?.location } }, household: { ...base.household, ...value.household, members: Array.isArray(value.household?.members) ? value.household.members.map(member => ({ id: member.id, name: member.name })) : base.household.members, invitations: [] }, supply: { ...base.supply, ...value.supply, rates: Array.isArray(value.supply?.rates) && value.supply.rates.length && value.supply.rates.every(item => typeof item.effective === 'string' && Number.isFinite(item.rate) && item.rate > 0) ? value.supply.rates : base.supply.rates }, notifications: { ...base.notifications, ...value.notifications }, quiet: { ...base.quiet, ...value.quiet }, alerts: { ...base.alerts, ...value.alerts }, appearance: 'Light', research: value.research === true }; }
