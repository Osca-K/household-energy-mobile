import { useId } from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { palette } from '@/design/energy-theme';
import { costSeries, energySeries } from '@/data/home';

export function EnergyChart({ unit, bins }: { unit: 'kWh' | 'Cost'; bins?: { energy: number; cost: number }[] }) {
  const id = useId().replace(/:/g, '');
  const values = bins ? [...bins.map(bin => unit === 'kWh' ? bin.energy : bin.cost), unit === 'kWh' ? bins[bins.length - 1].energy : bins[bins.length - 1].cost] : unit === 'kWh' ? energySeries : costSeries;
  const points = values.map((value, i) => ({ x: 3 + i * 294 / (values.length - 1), y: 83 - value / Math.max(0.01, ...values) * 58 }));
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    path += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return <View accessible accessibilityLabel={`Sample ${unit === 'kWh' ? 'energy in kWh' : 'cost in rand'} chart from midnight to midnight`}><Svg width="100%" height={98} viewBox="0 0 300 100" preserveAspectRatio="none"><Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={palette.blue} stopOpacity={0.19} /><Stop offset="1" stopColor={palette.blue} stopOpacity={0.01} /></LinearGradient></Defs><Path d={`${path} L297,100 L3,100 Z`} fill={`url(#${id})`} /><Path d={path} fill="none" stroke={palette.blue} strokeWidth={2.8} strokeLinecap="round" /></Svg><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>{['00:00', '06:00', '12:00', '18:00', '24:00'].map(time => <Text key={time} style={{ fontSize: 10, color: palette.muted }}>{time}</Text>)}</View></View>;
}
