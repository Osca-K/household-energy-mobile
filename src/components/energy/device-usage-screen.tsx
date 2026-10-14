import { settingsOf, isCreator, canOperate } from '@/data/settings';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from '@/design/themed-gradient';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from '@/design/themed-native';
import { currentPower, deviceStatus, illustration, statusColor, type Device } from '@/data/devices';
import { dateLabel, durationLabel, idleSupported, periodDates, periodHistory, shiftPeriod, stateColors, type Period, type State } from '@/data/history';
import { observedSwitchOns } from '@/data/device-history';
import { useHousehold, householdLoad } from '@/state/household';
import { periodLabel, periods } from '@/data/usage';
import { energyStyles as s, palette } from '@/design/energy-theme';
import { Card, Page, OutlineIcon } from './primitives';
import { ScreenHeader, SoftToggle } from './device-controls';
import { SegmentedControl } from './segmented-control';
import { DeviceGraph, StateTimeline } from './device-history-charts';
import { DateArrow, DeviceActivityCalendar } from './device-activity-calendar';

export default function DeviceUsageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, ready } = useHousehold();
  const device = state.devices.find(item => item.id === id);
  if (!ready) return <Page><Text style={s.secondary}>Loading local devices…</Text></Page>;
  if (!device) return <Page><ScreenHeader title="Device not found" /><Text style={s.body}>Choose a device from the Devices tab.</Text></Page>;
  return <Details key={device.id} device={device} />;
}
function Details({ device }: { device: Device }) {
  const { state, toggle } = useHousehold();
  const anchor = state.referenceDate;
  const [period, setPeriod] = useState<Period>('today');
  const [date, setDate] = useState(anchor);
  const [cost, setCost] = useState(false);
  const [about, setAbout] = useState(false);
  const { dates, intervals, summary } = periodHistory(device, date, period, anchor);
  const status = deviceStatus(device);
  const load = device.id === 'smart-meter' ? householdLoad(state.devices) : currentPower(device);
  const states: State[] = idleSupported(device) ? ['Active', 'Idle', 'Off', 'Offline'] : ['Active', 'Off', 'Offline'];
  const { fontScale } = useWindowDimensions();
  const stateColumns = states.length === 4 || fontScale > 1.15 ? 2 : 3;
  const turnOns = observedSwitchOns(device, intervals, anchor);
  const descriptions = { Active: 'Drawing power', Idle: device.id === 'water-heater' ? 'On, not heating' : 'On, resting', Off: 'Switched off', Offline: 'No readings' };
  const next = shiftPeriod(date, period, 1);
  const metrics = [
    { label: 'Energy', value: summary.energy === null ? 'No data' : summary.energy.toFixed(1), unit: summary.energy === null ? '' : 'kWh' },
    { label: 'Cost', value: summary.cost === null ? 'No data' : `R${summary.cost.toFixed(2)}`, unit: '' },
    { label: 'Active time', value: intervals.length ? durationLabel(summary.durations.Active) : 'No data', unit: '' },
    { label: 'Current load', value: load === null ? 'No data' : load.toFixed(2), unit: load === null ? '' : 'kW' },
  ];
  return <Page>
    <ScreenHeader title="Device usage" subtitle="Your device activity" />
    <Card style={styles.surface}><View style={[s.row, { gap: 12, alignItems: 'center' }]}>
      <Image source={illustration(device.icon)} style={{ width: 72, height: 84, backgroundColor: 'transparent' }} contentFit="contain" alt="" />
      <View style={{ flex: 1, minWidth: 0 }}><View style={[s.row, { gap: 8, alignItems: 'flex-start' }]}><View style={{ flex: 1, minWidth: 0 }}><Text style={[s.heading, { fontSize: 16 }]}>{device.name}</Text><Text style={[s.secondary, { marginTop: 4 }]}>{device.location || device.category}</Text></View>{device.id !== 'smart-meter' && <SoftToggle label={`${device.name} power`} value={device.powerOn} disabled={device.offline || !device.enabled || !canOperate(settingsOf(state))} onChange={() => toggle(device.id)} />}</View>
      <View style={[s.row, { gap: 6, marginTop: 7 }]}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: statusColor[status] }} /><Text style={[s.secondary, { color: status === 'Offline' ? palette.muted : palette.blue }]}>{status === 'On' ? 'Active' : status}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Edit device and schedule" disabled={!isCreator(settingsOf(state))} onPress={() => router.push({ pathname: '/device-form', params: { id: device.id } })} style={{ alignSelf: 'flex-end', width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', opacity: isCreator(settingsOf(state)) ? 1 : 0.4 }}><OutlineIcon name="edit" size={20} /></Pressable></View>
    </View></Card>
    <Card style={styles.surface}><SegmentedControl label="Device history period" value={period} onChange={setPeriod} options={periods.map(value => ({ value, label: periodLabel[value] }))} /><View style={styles.dateRow}><DateArrow previous onPress={() => setDate(shiftPeriod(date, period, -1))} /><Text style={[s.secondary, { flex: 1, textAlign: 'center' }]}>{period === 'today' ? dateLabel(date) : `${dateLabel(dates[0])} – ${dateLabel(dates.at(-1)!)}`}</Text><DateArrow disabled={periodDates(next, period)[0] > anchor} onPress={() => setDate(next)} /></View></Card>
    <Card style={[styles.surface, { padding: 7 }]}><LinearGradient colors={['#f8f6ff', '#f2effd']} style={styles.inset}><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{metrics.map((metric, i) => <View key={metric.label} style={[styles.metric, i % 2 === 1 && styles.vertical, i > 1 && styles.horizontal]}><Text style={s.secondary}>{metric.label}</Text><Text style={styles.value}>{metric.value}<Text style={styles.unit}>{metric.unit ? ` ${metric.unit}` : ''}</Text></Text></View>)}</View></LinearGradient></Card>
    <Card style={styles.surface}><View style={{ width: 160 }}><SegmentedControl label="Device graph" value={cost ? 'cost' : 'power'} onChange={value => setCost(value === 'cost')} options={[{ value: 'power', label: period === 'today' ? 'Power' : 'Energy' }, { value: 'cost', label: 'Cost' }]} /></View><DeviceGraph key={`${period}-${date}-${cost}`} device={device} dates={dates} anchor={anchor} period={period} cost={cost} /></Card>
    <Card style={styles.surface}><View style={[s.row, { justifyContent: 'space-between', gap: 8 }]}><Text style={[s.heading, { flex: 1 }]}>{period === 'today' ? 'State history' : `${period === 'week' ? 'Weekly' : 'Monthly'} state summary`}</Text><Pressable accessibilityRole="button" onPress={() => setAbout(true)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ fontSize: 10, color: palette.blue }}>About states ⓘ</Text></Pressable></View>
      {!intervals.length ? <Text style={s.secondary}>No readings for this date.</Text> : <>
      {period === 'today' && <><View style={styles.legend}>{states.map(item => <View key={item} style={{ flexBasis: stateColumns === 2 ? '45%' : '29%', flexGrow: 1 }}><View style={[s.row, { gap: 6 }]}><Dot state={item} /><Text style={{ fontSize: 12, color: palette.navy, flexShrink: 1 }}>{item}</Text></View><Text style={[s.secondary, { marginTop: 4 }]}>{descriptions[item]}</Text></View>)}</View><StateTimeline intervals={intervals} /></>}
      <LinearGradient colors={['#f2efff', '#efecfc']} style={[styles.inset, { marginTop: 15 }]}><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{states.map((item, i) => <View key={item} style={[{ flexBasis: stateColumns === 2 ? '50%' : '33.333%', padding: 10, minWidth: 0 }, i % stateColumns > 0 && styles.vertical, i >= stateColumns && styles.horizontal]}><View style={[s.row, { gap: 5 }]}><Dot state={item} /><Text style={[s.secondary, { flexShrink: 1 }]}>{item}</Text></View><Text style={[styles.value, { fontSize: 17 }]}>{durationLabel(summary.durations[item])}</Text></View>)}</View></LinearGradient>
      {period !== 'today' && <View style={{ marginTop: 12 }}><Text style={s.secondary}>Turned on</Text><Text style={[styles.value, { fontSize: 17 }]}>{turnOns === null ? 'No data' : `${turnOns} times`}</Text></View>}
      </>}
    </Card>
    <DeviceActivityCalendar device={device} initialDate={anchor} period={period} anchor={anchor} />
    <Modal visible={about} transparent onRequestClose={() => setAbout(false)}><View style={{ flex: 1, backgroundColor: '#17163d44', justifyContent: 'center', padding: 24 }}><Card style={{ maxWidth: 350, width: '100%', alignSelf: 'center' }}><Text style={s.heading}>About states</Text>{states.map(item => <Text key={item} style={[s.body, { marginTop: 12 }]}>{item}: {descriptions[item]}.{item === 'Offline' ? ' Consumption is unknown, not zero.' : ''}</Text>)}<Pressable accessibilityRole="button" onPress={() => setAbout(false)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}><Text style={{ color: palette.blue }}>Close</Text></Pressable></Card></View></Modal>
  </Page>;
}
function Dot({ state }: { state: State }) { return <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: stateColors[state] }} />; }
const styles = StyleSheet.create({ surface: { borderWidth: 1, borderColor: 'white', borderRadius: 27 }, dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, borderRadius: 24, padding: 3, backgroundColor: '#f7f5fd' }, inset: { borderRadius: 22, padding: 7 }, metric: { width: '50%', padding: 12, minHeight: 88 }, vertical: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: palette.divider }, horizontal: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider }, value: { fontSize: 22, fontWeight: '500', color: palette.navy, marginTop: 8 }, unit: { fontSize: 12, fontWeight: '400' }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 15 } });
