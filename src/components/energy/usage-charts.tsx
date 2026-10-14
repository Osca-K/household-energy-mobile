import { useId } from 'react';
import { Text, View } from '@/design/themed-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from '@/design/themed-svg';
import { boundedCurve } from '@/data/chart-curve';
import { palette } from '@/design/energy-theme';
import { displayValue, type Period, type Segment, type Unit, type getUsage } from '@/data/usage';

function lighten(color: string) { return '#' + [1, 3, 5].map(index => Math.round(parseInt(color.slice(index, index + 2), 16) * 0.78 + 255 * 0.22).toString(16).padStart(2, '0')).join(''); }
export function UsageGraph({ data, period, unit }: { data: ReturnType<typeof getUsage>; period: Period; unit: Unit }) {
  const id = useId().replace(/:/g, '');
  const values = data.bins.map(bin => bin[unit]);
  // A repeated terminal point shows the midnight boundary; it adds no energy bin.
  if (period === 'today' && values.length) values.push(values[values.length - 1]);
  const maximum = Math.max(0.1, ...values) * 1.15;
  const points = values.map((value, i) => ({ x: 34 + i / Math.max(1, values.length - 1) * 292, y: 174 - value / maximum * 150 }));
  const { path } = boundedCurve(points);
  const ticks = period === 'today' ? [0, 4, 8, 12, 16, 20, 24] : period === 'week' ? values.map((_, i) => i) : [...new Set([0, ...values.flatMap((_, i) => i % 5 === 0 ? [i] : []), values.length - 1])];
  const axis = unit === 'energy' ? period === 'today' ? 'kWh per hourly interval' : 'kWh per day' : period === 'today' ? 'R per hourly interval' : 'R per day';
  return <View accessible accessibilityLabel={`${period} sample ${axis} chart. Total ${displayValue(unit === 'energy' ? data.total : data.cost, unit)} ${unit === 'energy' ? 'kWh' : 'rand'}.`}>
    <Text style={{ fontSize: 10, color: palette.muted, marginTop: 13, marginBottom: 7 }}>{axis}</Text>
    <Svg width="100%" height={230} viewBox="0 0 340 215">
      <Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={palette.blue} stopOpacity={0.29} /><Stop offset="1" stopColor={palette.blue} stopOpacity={0} /></LinearGradient></Defs>
      {[0, 1, 2, 3, 4].map(i => <G key={i}><Line x1="34" x2="326" y1={174 - i * 37.5} y2={174 - i * 37.5} stroke="#e6e1f3" strokeDasharray="3 4" /><SvgText x="26" y={178 - i * 37.5} textAnchor="end" fill={palette.muted} fontSize="9">{(maximum * i / 4).toFixed(1)}</SvgText></G>)}
      {!!path && <><Path d={`${path} L${points.at(-1)!.x},174 L34,174 Z`} fill={`url(#${id})`} /><Path d={path} fill="none" stroke={palette.blue} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" /></>}
      {ticks.filter(i => i >= 0 && i < values.length).map(i => <SvgText key={i} x={34 + i / Math.max(1, values.length - 1) * 292} y="202" fill={palette.muted} fontSize="8" textAnchor="middle">{period === 'today' ? `${String(i).padStart(2, '0')}:00` : data.bins[i].label}</SvgText>)}
    </Svg>
  </View>;
}
export function SoftUsageBar({ segments }: { segments: Segment[] }) {
  const id = useId().replace(/:/g, '');
  const pieces = segments.map((segment, index) => ({ ...segment, end: segments.slice(0, index + 1).reduce((sum, item) => sum + item.share, 0) / 100 * 360 }));
  return <View accessible accessibilityLabel="Device usage proportions" style={{ marginTop: 17 }}><Svg width="100%" height={28} viewBox="0 0 360 28" preserveAspectRatio="none"><Defs><ClipPath id={`${id}-clip`}><Rect width="360" height="28" rx="14" /></ClipPath>{pieces.map((piece, i) => <LinearGradient key={piece.name} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={lighten(piece.color)} /><Stop offset="1" stopColor={piece.color} /></LinearGradient>)}</Defs><G clipPath={`url(#${id}-clip)`}>{pieces.slice().reverse().map((piece, reverseIndex) => <Rect key={piece.name} width={piece.end} height="28" rx="14" fill={`url(#${id}-${pieces.length - 1 - reverseIndex})`} />)}</G></Svg></View>;
}
export function SoftRoomDonut({ segments, total, unit, size = 162 }: { segments: Segment[]; total: number; unit: Unit; size?: number }) {
  const id = useId().replace(/:/g, '');
  const arcs = segments.map((segment, index) => {
    const start = -90 + segments.slice(0, index).reduce((sum, item) => sum + item.share, 0) * 3.6;
    const angle = start + segment.share * 3.6;
    const point = (degrees: number) => ({ x: 100 + 73 * Math.cos(degrees * Math.PI / 180), y: 100 + 73 * Math.sin(degrees * Math.PI / 180) });
    const a = point(start), b = point(angle);
    return { ...segment, path: `M${a.x},${a.y} A73,73 0 ${segment.share > 50 ? 1 : 0},1 ${b.x},${b.y}` };
  });
  return <View accessible accessibilityLabel={`Room usage total ${displayValue(total, unit)} ${unit === 'energy' ? 'kWh' : 'rand'}`} style={{ width: size, height: size, flexShrink: 0, alignSelf: 'center' }}><Svg width="100%" height="100%" viewBox="0 0 200 200"><Defs>{arcs.map((arc, i) => <LinearGradient key={arc.name} id={`${id}-${i}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={lighten(arc.color)} /><Stop offset="1" stopColor={arc.color} /></LinearGradient>)}</Defs><Circle cx="100" cy="100" r="88" stroke="#faf9ff" strokeWidth="20" fill="none" />{arcs.map((arc, i) => <G key={arc.name}><Path d={arc.path} fill="none" stroke="#ffffff" strokeWidth="27" strokeLinecap="round" /><Path d={arc.path} fill="none" stroke={`url(#${id}-${i})`} strokeWidth="25" strokeLinecap="round" /></G>)}<Circle cx="100" cy="100" r="45" fill="#fbfaff" /><SvgText x="100" y="102" textAnchor="middle" fontSize={unit === 'energy' ? '26' : '20'} fill={palette.navy}>{displayValue(total, unit)}</SvgText><SvgText x="100" y="123" textAnchor="middle" fontSize="12" fill={palette.muted}>{unit === 'energy' ? 'kWh' : 'Cost'}</SvgText></Svg></View>;
}
