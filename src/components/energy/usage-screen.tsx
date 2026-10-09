import { useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getUsage, periods, periodLabel, totalLabel, displayValue, unitLabel, type Period, type Unit, type Segment } from '@/data/usage';
import { energyStyles as s, palette } from '@/design/energy-theme';
import { Card, Page, IconButton, OutlineIcon, type IconName } from './primitives';
import { SegmentedControl } from './segmented-control';
import { SoftRoomDonut, SoftUsageBar, UsageGraph } from './usage-charts';

import { useHousehold, householdLoad } from '@/state/household';
import { counts } from '@/data/devices';
import { UsageOverview, UsageChartMetrics } from './usage-overview';
import { topDevices } from '@/data/usage-summary';
import { OtherDevicesSheet } from './other-devices-sheet';
export default function UsageScreen() {
  const { state, update } = useHousehold();
  const budget = state.budget;
  const monthly = getUsage('month', state.devices, state.referenceDate);
  const daily = getUsage('today', state.devices, state.referenceDate);
  const tally = counts(state.devices);
  const elapsed = Number(state.referenceDate.slice(-2));
  const daysInMonth = new Date(Number(state.referenceDate.slice(0,4)), Number(state.referenceDate.slice(5,7)), 0).getDate();
  const sample = { spent: monthly.cost, estimate: monthly.cost / elapsed * daysInMonth, load: householdLoad(state.devices), on: tally.on, devices: tally.total, remaining: Math.ceil(112 / Math.max(0.1, daily.total)) };
  const setBudget = (value: number) => update(current => ({ ...current, budget: value }));
  const [period, setPeriod] = useState<Period>('today');
  const [unit, setUnit] = useState<Unit>('energy');
  const [dialog, setDialog] = useState<'budget' | 'scan' | 'notifications' | null>(null);
  const [draft, setDraft] = useState(String(budget));
  const [error, setError] = useState('');
  const [otherOpen, setOtherOpen] = useState(false);
  const data = getUsage(period, state.devices, state.referenceDate);
  const distribution = topDevices(data.devices, data.total);
  const openDevice = (id: string) => { setOtherOpen(false); router.push({ pathname: '/device-usage', params: { id } }); };
  const selectedTotal = unit === 'energy' ? data.total : data.cost;
  const periodControl = (label: string) => <SegmentedControl label={label} options={periods.map(value => ({ value, label: periodLabel[value] }))} value={period} onChange={setPeriod} />;
  const unitControl = (label: string) => <SegmentedControl label={label} options={[{ value: 'energy' as const, label: 'Energy' }, { value: 'cost' as const, label: 'Cost' }]} value={unit} onChange={setUnit} />;
  return <Page>
    <View style={[s.row, { justifyContent: 'space-between', gap: 10 }]}><View style={{ flex: 1 }}><Text style={styles.title}>Usage</Text><Text style={[s.secondary, { marginTop: 3 }]}>Your household electricity</Text></View><IconButton name="bell" label="Notifications" onPress={() => setDialog('notifications')} /></View>
    <UsageOverview budget={budget} spent={sample.spent} estimate={sample.estimate} energy={daily.total} cost={daily.cost} load={sample.load} on={sample.on} total={sample.devices} remaining={sample.remaining} />
    <Card style={{ padding: 9 }}><View style={[s.row, { alignItems: 'stretch' }]}>{[{ label: 'AI Tips', icon: 'ai', action: () => router.navigate('/ai') }, { label: 'Scan Meter', icon: 'scan', action: () => setDialog('scan') }, { label: 'Set Budget', icon: 'budget', action: () => { setDraft(String(budget)); setError(''); setDialog('budget'); } }].map(action => <Pressable key={action.label} accessibilityRole="button" onPress={action.action} style={styles.action}><View style={styles.iconCircle}><OutlineIcon name={action.icon as IconName} size={20} /></View><Text style={styles.actionLabel}>{action.label}</Text></Pressable>)}</View></Card>
    <Card style={{ borderRadius: 29, borderWidth: 1, borderColor: '#ffffff', padding: 17 }}>
      <Text style={s.heading}>Electricity Usage</Text><Text style={[s.secondary, { marginTop: 4, marginBottom: 16 }]}>Your electricity usage over time</Text>
      {periodControl('Usage graph period')}
      <View style={{ marginTop: 10, width: 154, alignSelf: 'flex-end' }}>{unitControl('Usage graph unit')}</View>
      <UsageGraph data={data} period={period} unit={unit} />
      <UsageChartMetrics energy={data.total} cost={data.cost} averageEnergy={data.averageEnergy} averageCost={data.averageCost} perHour={period === 'today'} />
    </Card>
    <Card><View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }]}><View style={{ flex: 1, minWidth: 0 }}><Text style={s.heading}>Usage by device</Text><Text style={[s.secondary, { fontSize: 10, marginTop: 4 }]}>Top 7 by energy usage</Text></View><View style={styles.total}><Text style={[s.secondary, { fontSize: 9 }]}>{totalLabel[period]}</Text><Text style={{ fontSize: 14, fontWeight: '500', marginTop: 3, color: palette.navy }}>{displayValue(selectedTotal, unit)}<Text style={{ fontSize: 10, fontWeight: '400' }}> {unitLabel(unit)}</Text></Text></View></View><View style={{ marginTop: 13 }}>{periodControl('Device usage period')}</View><View style={{ marginTop: 9, width: 154, alignSelf: 'flex-end' }}>{unitControl('Device usage unit')}</View><SoftUsageBar segments={distribution.rows.filter(device => device.share > 0)} /><View style={{ gap: 9, marginTop: 15 }}>{distribution.rows.map(device => <Pressable key={device.id} accessibilityRole="button" accessibilityLabel={device.id === 'other-devices' ? 'View other devices' : `View usage for ${device.name}`} onPress={() => device.id === 'other-devices' ? setOtherOpen(true) : device.id && openDevice(device.id)}><BreakdownRow segment={device} unit={unit} /></Pressable>)}</View></Card>
    <Text style={[s.secondary, { fontSize: 10 }]}>{data.missing ? 'Known sample subtotal ? Offline readings are missing, not zero.' : 'Completed sample readings'} ? {state.referenceDate}</Text>
    <RoomCard rooms={data.rooms} total={selectedTotal} unit={unit} period={period} onPeriod={setPeriod} onUnit={setUnit} />
    <Text style={{ fontSize: 9, textAlign: 'center', color: palette.muted }}>Local sample data · Illustrative tariff · No live readings</Text>
    <OtherDevicesSheet visible={otherOpen} devices={distribution.remaining} period={period} unit={unit} onClose={() => setOtherOpen(false)} onDevice={openDevice} />
    <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => setDialog(null)}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}><Card style={{ width: '100%', maxWidth: 350 }}><Text style={s.heading}>{dialog === 'budget' ? 'Set Budget' : dialog === 'scan' ? 'Scan Meter' : 'Notifications'}</Text>{dialog === 'budget' ? <><Text style={[s.secondary, { marginTop: 12 }]}>Monthly budget (R)</Text><TextInput accessibilityLabel="Monthly budget in rand" value={draft} onChangeText={value => { setDraft(value); setError(''); }} keyboardType="decimal-pad" style={styles.input} /><Text style={[s.secondary, { marginTop: 5 }]}>Saved locally for this household.</Text>{!!error && <Text accessibilityRole="alert" style={{ fontSize: 11, color: '#b45069', marginTop: 5 }}>{error}</Text>}<Pressable accessibilityRole="button" style={styles.save} onPress={() => { const next = Number(draft.trim().replace(',', '.')); if (!Number.isFinite(next) || next <= 0) { setError('Enter a budget greater than zero.'); return; } setBudget(next); setDialog(null); }}><Text style={{ color: 'white', fontSize: 13 }}>Save budget</Text></Pressable></> : <Text style={[s.body, { marginTop: 12 }]}>{dialog === 'scan' ? 'UI-only placeholder. Meter scanning is not connected; no photo or reading is captured.' : 'This screen uses local sample readings. Notifications are not connected.'}</Text>}<Pressable accessibilityRole="button" style={styles.close} onPress={() => setDialog(null)}><Text style={{ color: palette.blue, fontSize: 13 }}>Close</Text></Pressable></Card></KeyboardAvoidingView></Modal>
  </Page>;
}
function BreakdownRow({ segment, unit }: { segment: Segment; unit: Unit }) {
  return <View style={styles.breakdown}><View style={[styles.dot, { backgroundColor: segment.color }]} /><Text style={{ flex: 1, fontSize: 12, lineHeight: 17, color: palette.navy }}>{segment.name}</Text><Text style={{ fontSize: 12, fontWeight: '500', color: palette.navy }}>{segment.noData ? segment.deviceCount ? String(segment.deviceCount) : 'No data' : displayValue(segment[unit], unit)}<Text style={{ fontSize: 9, fontWeight: '400' }}> {segment.noData ? segment.deviceCount ? 'devices' : '' : unitLabel(unit)}</Text></Text><Text style={{ width: 32, fontSize: 11, textAlign: 'right', color: palette.muted }}>{segment.noData ? '' : `${Math.round(segment.share)}%`}</Text></View>;
}
function RoomCard({ rooms, total, unit, period, onPeriod, onUnit }: { rooms: Segment[]; total: number; unit: Unit; period: Period; onPeriod: (period: Period) => void; onUnit: (unit: Unit) => void }) {
  const [width, setWidth] = useState(0);
  return <Card><Text style={s.heading}>Usage by room</Text><Text style={[s.secondary, { marginTop: 3, marginBottom: 13 }]}>Your household electricity</Text><SegmentedControl label="Room usage period" options={periods.map(value => ({ value, label: periodLabel[value] }))} value={period} onChange={onPeriod} /><View style={{ width: 154, alignSelf: 'flex-end', marginTop: 9 }}><SegmentedControl label="Room usage unit" options={[{ value: 'energy' as const, label: 'Energy' }, { value: 'cost' as const, label: 'Cost' }]} value={unit} onChange={onUnit} /></View><View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ flexDirection: width >= 310 ? 'row' : 'column', alignItems: width >= 310 ? 'center' : 'stretch', gap: 16, marginTop: 18 }}><SoftRoomDonut segments={rooms.filter(room => room.share > 0)} total={total} unit={unit} /><View style={{ flex: width >= 310 ? 1 : undefined, gap: 4 }}>{rooms.map(room => <View key={room.name} style={[s.row, { gap: 8, minHeight: 38, borderBottomWidth: 1, borderBottomColor: '#efecf8' }]}><View style={[styles.dot, { backgroundColor: room.color }]} /><Text style={{ flex: 1, fontSize: 11, color: palette.navy }}>{room.name}</Text><Text style={{ fontSize: 13, color: palette.navy }}>{room.noData ? 'No data' : `${Math.round(room.share)}%`}</Text></View>)}</View></View></Card>;
}
const styles = StyleSheet.create({
  title: { fontSize: 23, fontWeight: '500', color: palette.navy }, dot: { width: 9, height: 9, borderRadius: 5 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eeebfc', alignItems: 'center', justifyContent: 'center' },
  action: { flex: 1, minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 2 }, actionLabel: { flexShrink: 1, fontSize: 10, lineHeight: 15, color: palette.navy },
  total: { width: 110, flexShrink: 0, alignItems: 'flex-end' },
  breakdown: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, paddingVertical: 13, borderRadius: 25, backgroundColor: '#ffffff' },
  backdrop: { flex: 1, backgroundColor: '#17163d44', alignItems: 'center', justifyContent: 'center', padding: 24 }, input: { borderWidth: 1, borderColor: '#e0daf6', borderRadius: 12, height: 46, marginTop: 6, paddingHorizontal: 12, color: palette.navy, fontSize: 16 }, save: { minHeight: 44, borderRadius: 22, backgroundColor: palette.blue, alignItems: 'center', justifyContent: 'center', marginTop: 14 }, close: { alignSelf: 'flex-end', minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', marginTop: 6 },
});
