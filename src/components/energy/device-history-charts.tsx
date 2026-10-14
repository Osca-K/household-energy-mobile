import { useId, useState } from 'react';
import { Pressable, Text, View } from '@/design/themed-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from '@/design/themed-svg';
import { sessions, stateColors, type Interval, type Period } from '@/data/history';
import { deviceBins } from '@/data/device-history';
import type { Device } from '@/data/devices';
import { palette } from '@/design/energy-theme';

export function DeviceGraph({ device, dates, anchor, period, cost }: { device: Device; dates: string[]; anchor: string; period: Period; cost: boolean }) {
  const id = useId().replace(/:/g, '');
  const bins = deviceBins(device, dates, anchor, period, cost);
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(1);
  const maximum = Math.max(0.1, ...bins.map(bin => bin.value ?? 0)) * 1.12;
  const extent = period === 'today' ? 1440 : bins.length || 1;
  const x = (value: number) => 32 + value / extent * 290;
  const y = (value: number) => 178 - value / maximum * 145;
  const unit = cost ? 'R' : period === 'today' ? 'kW' : 'kWh';
  const caption = period === 'today' ? cost ? 'R · per 15-minute interval' : 'kW · 15-minute readings' : `${unit} · per ${period === 'month' ? 'week' : 'day'}`;
  const groups: typeof bins[] = [];
  bins.forEach((bin, index) => { if (bin.value !== null) { if (index === 0 || bins[index - 1].value === null) groups.push([]); groups.at(-1)!.push(bin); } });
  // Horizontal-tangent cubics stay between adjacent readings: no overshoot or negative dips.
  // Each interval's actual sample sits at its centre; disconnected groups preserve missing gaps.
  const pathFor = (group: typeof bins) => {
    let path = `M${x(group[0].start)},${y(group[0].value!)} H${x((group[0].start + group[0].end) / 2)}`;
    for (let i = 1; i < group.length; i++) {
      const previous = group[i - 1], current = group[i];
      const left = x((previous.start + previous.end) / 2), right = x((current.start + current.end) / 2);
      const third = (right - left) / 3;
      path += ` C${left + third},${y(previous.value!)} ${right - third},${y(current.value!)} ${right},${y(current.value!)}`;
    }
    return `${path} H${x(group.at(-1)!.end)}`;
  };
  const active = selected === null ? null : bins[selected];
  const selectAt = (location: number) => { const coordinate = Math.max(0, Math.min(extent - .001, ((location / width * 340 - 32) / 290) * extent)); setSelected(bins.findIndex(bin => coordinate >= bin.start && coordinate < bin.end)); };
  return <View><Text style={{ color: palette.muted, fontSize: 11, marginTop: 12, marginBottom: 5 }}>{caption}</Text>
    {active && <Text accessibilityLiveRegion="polite" style={{ color: palette.navy, fontSize: 11, marginBottom: 5 }}>{active.label} · {active.value === null ? 'No readings' : `${cost ? 'R' : ''}${active.value.toFixed(2)}${cost ? '' : ` ${unit}`}`}</Text>}
    {!bins.some(bin => bin.value !== null) ? <Text style={{ color: palette.muted, fontSize: 12, paddingVertical: 35 }}>No readings for this period.</Text> : <Pressable accessibilityRole="button" accessibilityLabel={`${caption}. Tap the chart for an interval value.`} onLayout={event => setWidth(event.nativeEvent.layout.width)} onPress={event => selectAt(event.nativeEvent.locationX)}>
      <Svg width="100%" height={220} viewBox="0 0 340 220"><Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={palette.blue} stopOpacity=".32" /><Stop offset="1" stopColor={palette.blue} stopOpacity=".01" /></LinearGradient></Defs>
        {[0, 1, 2, 3].map(i => <G key={i}><Line x1="32" x2="322" y1={178 - i * 145 / 3} y2={178 - i * 145 / 3} stroke="#e5e0f4" strokeDasharray="3 3" /><SvgText x="24" y={182 - i * 145 / 3} fontSize="9" fill={palette.muted} textAnchor="end">{(maximum * i / 3).toFixed(1)}</SvgText></G>)}
        {groups.map((group, i) => <G key={i}><Path d={`${pathFor(group)} L${x(group.at(-1)!.end)},178 L${x(group[0].start)},178 Z`} fill={`url(#${id})`} /><Path d={pathFor(group)} fill="none" stroke={palette.blue} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></G>)}
        {active?.value !== null && active?.value !== undefined && <G><Line x1={x((active.start + active.end) / 2)} x2={x((active.start + active.end) / 2)} y1="28" y2="178" stroke={palette.blueBorder} strokeDasharray="2 3" /><Circle cx={x((active.start + active.end) / 2)} cy={y(active.value)} r="3" fill={palette.blue} /></G>}
        {(period === 'today' ? ['00:00', '06:00', '12:00', '18:00', '24:00'] : bins.map((bin, i) => period === 'month' ? `W${i + 1}` : bin.label.slice(8))).map((tick, i, ticks) => <SvgText key={`${tick}-${i}`} x={period === 'today' ? 32 + i / (ticks.length - 1) * 290 : x(i + .5)} y="207" textAnchor="middle" fontSize="9" fill={palette.muted}>{tick}</SvgText>)}
      </Svg></Pressable>}
    
  </View>;
}
export function StateTimeline({ intervals }: { intervals: Interval[] }) {
  const id = useId().replace(/:/g, ''); const groups = sessions(intervals);
  return <View accessible accessibilityLabel={`State timeline: ${groups.map(group => `${group.state} ${group.start}–${group.end} minutes`).join(', ')}`}>
    <Svg width="100%" height={30} viewBox="0 0 1440 40" preserveAspectRatio="none"><Defs><ClipPath id={`${id}-clip`}><Rect width="1440" height="40" rx="55" ry="20" /></ClipPath>{Object.entries(stateColors).map(([state, color]) => <LinearGradient key={state} id={`${id}-${state}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity=".65" /><Stop offset=".55" stopColor={color} /><Stop offset="1" stopColor={color} stopOpacity=".9" /></LinearGradient>)}</Defs>
      <G clipPath={`url(#${id}-clip)`}>{groups.map(group => <G key={group.start}><Rect x={group.start} width={group.end - group.start} height="40" fill={`url(#${id}-${group.state})`} />{group.start > 0 && <Path d={`M${group.start},0 Q${group.start + Math.min(18, (group.end - group.start) / 4)},20 ${group.start},40`} stroke="white" strokeOpacity=".28" strokeWidth="2" fill="none" />}</G>)}</G>
    </Svg><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}>{['00:00', '06:00', '12:00', '18:00', '24:00'].map(time => <Text key={time} style={{ fontSize: 9, color: palette.muted }}>{time}</Text>)}</View>
  </View>;
}
