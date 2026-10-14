import type { Device } from './devices';
export type LabelField = 'power' | 'voltage' | 'frequency' | 'brand' | 'model';
export type LabelCandidate = { value: string; unit: string; source: string };
export type LabelScan = { text: string; candidates: Record<LabelField, LabelCandidate[]> };
export function extractLabel(text: string): LabelScan {
  const candidates: LabelScan['candidates'] = { power: [], voltage: [], frequency: [], brand: [], model: [] };
  const lines = text.replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean);
  const add = (field: LabelField, value: string, unit: string, source: string) => {
    if (!candidates[field].some(item => item.value === value && item.unit === unit)) candidates[field].push({ value, unit, source });
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const context = /^(?:[\d.,\s/–—-]+)(?:kW|W|V|Hz)\b/i.test(line) && index ? lines[index - 1] + ' ' + line : line;
    for (const match of line.matchAll(/\b(\d+(?:[.,]\d+)?(?:\s*[-–—/]\s*\d+(?:[.,]\d+)?)?)\s*(kW|W|kV|V|kHz|Hz)\b/gi)) {
      const value = match[1].replace(/,/g, '.').replace(/\s/g, '').replace(/[–—]/g, '-'); const unit = match[2].toLowerCase();
      if (unit === 'w' || unit === 'kw') {
        // Conservative: bare wattages are ambiguous. Never infer input watts from amps,
        // output/cooling/heating capacity, energy per year, or a mixed input/output line.
        if (/\b(input|power consumption|power input|rated power|rated input)\b/i.test(context) && !/\b(output|capacity|cooling|heating|annual|year|kwh)\b/i.test(context)) add('power', value, unit === 'kw' ? 'kW' : 'W', context);
      } else if (unit === 'v' || unit === 'kv') add('voltage', value, unit === 'kv' ? 'kV' : 'V', context);
      else if (unit === 'hz' || unit === 'khz') add('frequency', value, unit === 'khz' ? 'kHz' : 'Hz', context);
    }
    for (const field of ['brand', 'model'] as const) {
      const match = line.match(new RegExp('^' + field + '(?:\\s+(?:no\\.?|number|name))?\\s*[:#-]\\s*([A-Za-z0-9][A-Za-z0-9 ._/-]{0,79})$', 'i'));
      if (match) add(field, match[1].trim(), '', line);
    }
  }
  return { text, candidates };
}
export function applyUnambiguousScan(device: Device, scan: LabelScan): Device {
  const result = { ...device };
  for (const field of ['power', 'voltage', 'frequency', 'brand', 'model'] as const) {
    const values = scan.candidates[field];
    if (!result[field]?.trim() && values.length === 1) {
      result[field] = values[0].value;
      if (field === 'power' || field === 'voltage' || field === 'frequency') result[`${field}Unit`] = values[0].unit;
    }
  }
  return result;
}
