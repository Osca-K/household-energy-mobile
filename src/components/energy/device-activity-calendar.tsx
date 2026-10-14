import { useEffect, useRef, useState } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from '@/design/themed-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Device } from '@/data/devices';
import { dateLabel, dayIntervals, durationLabel, periodDates, sessions, shiftPeriod, summarise, tariffAt, type Period } from '@/data/history';
import { clockLabel, weekGroups } from '@/data/device-history';
import { palette, energyStyles as s } from '@/design/energy-theme';
import { Card, OutlineIcon } from './primitives';
import { SegmentedControl } from './segmented-control';

export function DateArrow({ previous = false, disabled = false, onPress, label }: { previous?: boolean; disabled?: boolean; onPress: () => void; label?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label || (previous ? 'Previous period' : 'Next period')} disabled={disabled} onPress={onPress} style={[styles.arrow, { opacity: disabled ? .3 : 1 }]}><OutlineIcon name={previous ? 'left' : 'right'} size={21} /></Pressable>;
}
export function DeviceActivityCalendar({ device, initialDate, period, anchor }: { device: Device; initialDate: string; period: Period; anchor: string }) {
  const month = period === 'month';
  const [rangeDate, setRangeDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [unit, setUnit] = useState<'energy' | 'cost'>(() => 'energy');
  const [sheet, setSheet] = useState<null | { days: string[]; day?: string }>(null);
  const [width, setWidth] = useState(300);
  const rail = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dates = periodDates(rangeDate, month ? 'month' : 'week');
  const groups = month ? weekGroups(dates) : dates.map(day => [day]);
  const index = Math.max(0, groups.findIndex(days => days.includes(selectedDate)));
  const cell = width / 3;
  const item = groups[index];
  useEffect(() => { rail.current?.scrollTo({ x: index * cell, animated: true }); }, [index, cell, rangeDate, month]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { clearTimeout(timer.current); }, [selectedDate, rangeDate]);
  const summary = (days: string[]) => summarise(days.flatMap(day => dayIntervals(device, day, anchor)));
  const value = (days: string[]) => { const total = summary(days); return days[0] > anchor ? 'Future' : total.energy === null ? 'No data' : unit === 'energy' ? `${total.energy.toFixed(1)} kWh` : `R${total.cost!.toFixed(2)}`; };
  const focusTotal = summary(item);
  const focusValue = item[0] > anchor ? 'Future' : focusTotal.energy === null ? 'No data' : unit === 'energy' ? focusTotal.energy.toFixed(1) : `R${focusTotal.cost!.toFixed(2)}`;
  const label = (days: string[], short = false) => month ? short ? `Week ${groups.indexOf(days) + 1}` : `${dateLabel(days[0])} – ${dateLabel(days.at(-1)!)}` : new Date(`${days[0]}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', ...(short ? {} : { month: 'short' }), timeZone: 'Africa/Johannesburg' });
  const navigate = (direction: number) => { clearTimeout(timer.current); const next = shiftPeriod(rangeDate, month ? 'month' : 'week', direction); setRangeDate(next); setSelectedDate(periodDates(next, month ? 'month' : 'week')[0]); };
  const choose = (i: number) => { clearTimeout(timer.current); setSelectedDate(groups[Math.max(0, Math.min(groups.length - 1, i))][0]); };
  const moveSelection = (direction: number) => {
    const target = index + direction;
    if (target >= 0 && target < groups.length) { setSelectedDate(groups[target][0]); return; }
    const nextRange = shiftPeriod(rangeDate, month ? 'month' : 'week', direction);
    const nextDates = periodDates(nextRange, month ? 'month' : 'week');
    if (nextDates[0] > anchor) return;
    const nextGroups = month ? weekGroups(nextDates) : nextDates.map(day => [day]);
    setRangeDate(nextRange);
    setSelectedDate(nextGroups[direction < 0 ? nextGroups.length - 1 : 0][0]);
  };
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderRelease: (_, gesture) => { if (Math.abs(gesture.dx) >= 38 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5) moveSelection(gesture.dx < 0 ? 1 : -1); },
    onPanResponderTerminationRequest: () => true,
  });
  return <Card style={styles.surface}>
    <View style={[s.row, { alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }]}><View style={{ flex: 1, minWidth: 125 }}><Text style={s.heading}>Calendar</Text><Text style={[s.secondary, { marginTop: 3 }]}>{device.name} activity</Text></View><View style={{ width: 138 }}><SegmentedControl label="Calendar unit" value={unit} onChange={setUnit} options={[{ value: 'energy', label: 'Energy' }, { value: 'cost', label: 'Cost' }]} /></View></View>
    <View style={[s.row, { justifyContent: 'space-between', gap: 8, marginTop: 15 }]}><DateArrow previous label="Previous calendar range" onPress={() => navigate(-1)} /><Text style={[s.secondary, { flex: 1, textAlign: 'center' }]}>{month ? new Date(`${rangeDate}T12:00:00Z`).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) : `${dateLabel(dates[0])} – ${dateLabel(dates.at(-1)!)}`}</Text><DateArrow label="Next calendar range" disabled={periodDates(shiftPeriod(rangeDate, month ? 'month' : 'week', 1), month ? 'month' : 'week')[0] > anchor} onPress={() => navigate(1)} /></View>
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ marginTop: 15 }}><ScrollView ref={rail} horizontal showsHorizontalScrollIndicator={false} snapToInterval={cell} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: cell }} scrollEventThrottle={32} onScroll={event => { const offset = event.nativeEvent.contentOffset.x; clearTimeout(timer.current); timer.current = setTimeout(() => choose(Math.round(offset / cell)), 160); }}>
      {groups.map((days, i) => <Pressable key={days[0]} accessibilityRole="button" accessibilityLabel={`Calendar ${label(days)}: ${value(days)}`} accessibilityState={{ selected: index === i }} onPress={() => choose(i)} style={{ width: cell, alignItems: 'center', minHeight: 73 }}><View style={[styles.datePill, index === i && styles.selectedPill]}><Text style={{ fontSize: 12, color: index === i ? palette.blue : palette.muted, textAlign: 'center' }}>{label(days, true)}</Text></View><View style={styles.railLine} /><View style={{ width: index === i ? 10 : 6, height: index === i ? 10 : 6, borderRadius: 5, marginTop: index === i ? -6 : -4, backgroundColor: index === i ? palette.blue : '#b1aacc' }} /></Pressable>)}
    </ScrollView></View>
    <View {...swipe.panHandlers} style={[s.row, { alignItems: 'stretch', marginTop: 12, gap: 7, touchAction: 'pan-y' }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous calendar item" disabled={index === 0} onPress={() => choose(index - 1)} style={styles.neighbour}>{index > 0 && <><Text style={styles.small}>{label(groups[index - 1], true)}</Text><Text style={styles.neighbourValue}>{value(groups[index - 1])}</Text></>}</Pressable>
      <View style={styles.focusPanel}><Text style={[styles.small, { textAlign: 'center' }]}>{label(item)}</Text><Text style={styles.focusValue}>{focusValue}{unit === 'energy' && focusTotal.energy !== null && item[0] <= anchor && <Text style={{ fontSize: 11, fontWeight: '400' }}> kWh</Text>}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${month ? 'View days' : 'View sessions'} for ${label(item)}`} onPress={() => setSheet({ days: item, day: month ? undefined : item[0] })} style={styles.sessionsButton}><Text style={{ fontSize: 11, color: palette.blue }}>{month ? 'View days' : 'View sessions'}</Text></Pressable></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Next calendar item" disabled={index + 1 >= groups.length} onPress={() => choose(index + 1)} style={styles.neighbour}>{index + 1 < groups.length && <><Text style={styles.small}>{label(groups[index + 1], true)}</Text><Text style={styles.neighbourValue}>{value(groups[index + 1])}</Text></>}</Pressable>
    </View>
    
    <SessionSheet device={device} selection={sheet} unit={unit} anchor={anchor} onClose={() => setSheet(null)} onDay={day => setSheet(current => current && { ...current, day })} onBack={() => setSheet(current => current && { days: current.days })} />
  </Card>;
}
function SessionSheet({ device, selection, unit, anchor, onClose, onDay, onBack }: { device: Device; selection: { days: string[]; day?: string } | null; unit: 'energy' | 'cost'; anchor: string; onClose: () => void; onDay: (day: string) => void; onBack: () => void }) {
  const insets = useSafeAreaInsets(); const { height } = useWindowDimensions();
  const data = selection?.day ? dayIntervals(device, selection.day, anchor) : [];
  const display = (energy: number | null, date = selection?.day || anchor) => energy === null ? 'No readings' : unit === 'energy' ? `${energy.toFixed(2)} kWh` : `R${(energy * tariffAt(date)).toFixed(2)}`;
  return <Modal visible={!!selection} transparent animationType="slide" onRequestClose={onClose}><View style={styles.overlay}><Pressable accessibilityRole="button" accessibilityLabel="Close sessions" onPress={onClose} style={StyleSheet.absoluteFill} /><Card style={[styles.sheet, { maxHeight: height * .8, paddingBottom: Math.max(17, insets.bottom), paddingLeft: Math.max(17, insets.left), paddingRight: Math.max(17, insets.right) }]}><View accessibilityViewIsModal><View style={[s.row, { justifyContent: 'space-between', gap: 10 }]}><Text style={s.heading}>{selection?.day ? 'Sessions' : 'Week activity'}</Text><Pressable accessibilityRole="button" onPress={onClose} style={styles.close}><Text style={{ color: palette.blue, fontSize: 12 }}>Close</Text></Pressable></View><Text style={s.secondary}>{device.name} · {unit === 'energy' ? 'Energy (kWh)' : 'Cost (R)'}</Text>{selection?.day && <Text style={s.secondary}>{dateLabel(selection.day)}</Text>}
    {selection?.day && selection.days.length > 1 && <Pressable accessibilityRole="button" onPress={onBack} style={styles.close}><Text style={{ color: palette.blue, fontSize: 11 }}>‹ Back to week days</Text></Pressable>}
    <ScrollView style={{ maxHeight: height * .57 }} contentContainerStyle={{ paddingBottom: 12 }}>
      {!selection?.day ? selection?.days.map(day => <Pressable key={day} accessibilityRole="button" onPress={() => onDay(day)} style={styles.sessionRow}><Text style={s.body}>{dateLabel(day)}</Text><Text style={s.secondary}>{display(summarise(dayIntervals(device, day, anchor)).energy, day)} · View sessions ›</Text></Pressable>) : !data.length ? <Text style={[s.secondary, { marginVertical: 18 }]}>No readings for this date.</Text> : sessions(data).map(item => <View key={item.start} style={styles.sessionRow}><Text style={s.body}>{clockLabel(item.start)} – {clockLabel(item.end)} · {item.state}</Text><Text style={s.secondary}>{durationLabel(item.end - item.start)} · {display(item.energy)}</Text></View>)}
    </ScrollView></View></Card></View></Modal>;
}
const styles = StyleSheet.create({ surface: { borderWidth: 1, borderColor: 'white', borderRadius: 27 }, arrow: { width: 44, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'white' }, datePill: { minHeight: 42, padding: 5, justifyContent: 'center', borderRadius: 17, width: '94%' }, selectedPill: { backgroundColor: 'white', shadowColor: '#9184cf', shadowOpacity: .08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }, railLine: { width: '100%', height: 1, marginTop: 12, backgroundColor: '#e3ddf5' }, focusPanel: { flex: 1.5, minWidth: 0, minHeight: 140, borderRadius: 23, backgroundColor: '#fff', borderWidth: 1, borderColor: 'white', justifyContent: 'space-between', alignItems: 'center', padding: 10, shadowColor: '#9184cf', shadowOpacity: .08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, focusValue: { fontSize: 19, fontWeight: '500', color: palette.navy, textAlign: 'center', marginVertical: 12 }, neighbour: { flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'center', gap: 14 }, small: { fontSize: 10, lineHeight: 15, color: palette.muted, textAlign: 'center' }, neighbourValue: { fontSize: 12, color: palette.navy, textAlign: 'center' }, sessionsButton: { borderRadius: 19, backgroundColor: palette.blueSurface, paddingHorizontal: 9, minHeight: 44, justifyContent: 'center' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#17163d44' }, sheet: { width: '100%', maxWidth: 430, alignSelf: 'center', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }, close: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }, sessionRow: { paddingVertical: 13, borderTopWidth: 1, borderTopColor: palette.divider, gap: 5 } });
