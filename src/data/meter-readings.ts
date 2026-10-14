export type MeterKind = 'total' | 'remaining' | 'credit';
export type MeterReading = { id: string; kind: MeterKind; value: number; unit: 'kWh' | 'R'; photoUri: string; scannedAt: string; confirmedAt: string; recognisedText?: string };
export function isMeterReading(value: unknown): value is MeterReading {
  if (!value || typeof value !== 'object') return false;
  const record = value as MeterReading;
  return typeof record.id === 'string' && ['total', 'remaining', 'credit'].includes(record.kind)
    && record.unit === meterUnit(record.kind) && typeof record.value === 'number' && Number.isFinite(record.value) && record.value >= 0
    && typeof record.photoUri === 'string' && typeof record.scannedAt === 'string' && Number.isFinite(Date.parse(record.scannedAt))
    && typeof record.confirmedAt === 'string' && Number.isFinite(Date.parse(record.confirmedAt))
    && (record.recognisedText === undefined || typeof record.recognisedText === 'string');
}
export const meterUnit = (kind: MeterKind) => kind === 'credit' ? 'R' as const : 'kWh' as const;
export function parseMeterValue(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,4})?$/.test(trimmed)) return null;
  const number = Number(trimmed); return Number.isFinite(number) && number >= 0 ? number : null;
}
export function meterCandidates(text: string, kind: MeterKind): string[] {
  const candidates = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    if (/serial|meter\s*(?:no|number|id)|account|date|time|tariff|rate|\/kwh/i.test(line)) continue;
    const pattern = kind === 'credit' ? /(?:\bR\s*|ZAR\s*)(\d+(?:[.,]\d{1,4})?)\b/gi : /\b(\d+(?:[.,]\d{1,4})?)\s*kWh\b/gi;
    for (const match of line.matchAll(pattern)) {
      const value = parseMeterValue(match[1]); if (value !== null) candidates.add(match[1].replace(',', '.'));
    }
  }
  return [...candidates];
}
export const readingLabel: Record<MeterKind, string> = { total: 'Total meter reading', remaining: 'Units remaining', credit: 'Credit balance' };
export const meterTime = (time: string) => new Date(time).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
