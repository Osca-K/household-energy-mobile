import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { home as homeSample, alerts } from '@/data/home';
import { energyStyles as s, palette } from '@/design/energy-theme';
import { Card, Page, OutlineIcon, IconButton, Progress, type IconName } from './primitives';
import { EnergyChart } from './energy-chart';
import { useHousehold } from '@/state/household';
import { counts } from '@/data/devices';
import { getUsage } from '@/data/usage';

export default function HomeScreen() {
  const { state } = useHousehold();
  const daily = getUsage('today', state.devices, state.referenceDate);
  const month = getUsage('month', state.devices, state.referenceDate);
  const tally = counts(state.devices);
  const home = { ...homeSample, active: tally.on, devices: tally.total, energy: daily.total, cost: daily.cost, spent: month.cost, budget: state.budget };
  const [unit, setUnit] = useState<'kWh' | 'Cost'>('kWh');
  const [preview, setPreview] = useState<'Notifications' | 'Profile' | 'Scan Meter' | 'Add Top-up' | null>(null);
  return <Page>
    <View style={[s.row, { justifyContent: 'space-between', gap: 10, paddingHorizontal: 3 }]}><View style={{ flex: 1 }}><Text style={styles.title}>Home</Text><View style={[s.row, { gap: 5, marginTop: 3 }]}><Text style={s.secondary}>Good morning, {home.resident}</Text><OutlineIcon name="sun" size={16} color="#edc55e" /></View></View><View style={[s.row, { gap: 8 }]}><View><IconButton name="bell" label="Notifications" onPress={() => setPreview('Notifications')} /><View pointerEvents="none" style={styles.notificationDot} /></View><IconButton name="profile" label="Profile" onPress={() => setPreview('Profile')} /></View></View>
    <Card>
      <View style={styles.householdTop}><View style={{ flex: 1, minWidth: 0, zIndex: 1 }}><Text style={styles.eyebrow}>MY HOUSEHOLD</Text><Text style={[s.heading, { marginTop: 13 }]}>{home.household}</Text><View style={[s.row, { gap: 8, marginTop: 12 }]}><OutlineIcon name="home" size={17} color={palette.muted} /><Text style={s.secondary}>{home.address}</Text></View><View style={[s.row, { gap: 8, marginTop: 7 }]}><OutlineIcon name="location" size={17} color={palette.muted} /><Text style={[s.secondary, { flex: 1 }]}>{home.area}</Text></View></View><Image source={require('@/assets/images/house-illustration.png')} contentFit="contain" style={styles.house} accessibilityLabel="Modern white household illustration" /></View>
      <View style={styles.horizontalDivider} /><View style={[s.row, { alignItems: 'stretch' }]}><Summary icon="devices" label="Active devices" value={`${home.active} of ${home.devices}`} /><View style={s.divider} /><Summary icon="members" label="Home members" value={`${home.members} members`} /></View>
    </Card>
    <Card><View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }]}><View style={{ flex: 1 }}><Text style={s.heading}>Today’s Energy</Text><Text style={[s.secondary, { marginTop: 3 }]}>Sample electricity usage for today</Text></View><View style={styles.selector}>{(['kWh', 'Cost'] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === unit }} accessibilityLabel={`Show ${item === 'Cost' ? 'cost in rand' : 'energy in kWh'}`} onPress={() => setUnit(item)} style={[styles.segment, item === unit && styles.segmentActive]}><Text style={{ fontSize: 11, color: unit === item ? '#fff' : palette.muted }}>{item}</Text></Pressable>)}</View></View>
      <View style={[s.row, { alignItems: 'stretch', marginTop: 20, marginBottom: 5 }]}><Metric label="Energy Used" value={home.energy.toFixed(1)} unit="kWh" /><View style={s.divider} /><Metric label="Today’s Cost" value={`R${home.cost.toFixed(2)}`} /></View><EnergyChart unit={unit} bins={daily.bins} />
    </Card>
    <Card><View style={[s.row, { alignItems: 'stretch' }]}><View style={{ flex: 1, paddingRight: 16 }}><Text style={s.body}>Prepaid Balance</Text><Text style={[s.value, { marginTop: 6 }]}>{home.balance}<Text style={styles.unit}> kWh</Text></Text><Text style={[s.secondary, { marginTop: 5 }]}>About {home.daysLeft} days left</Text><Progress fraction={home.balanceFraction} label="Prepaid balance" /></View><View style={s.divider} /><View style={{ flex: 1, paddingLeft: 16 }}><Text style={s.body}>Monthly Budget</Text><Text style={[s.value, { marginTop: 6 }]}>R{home.spent.toFixed(2)}</Text><Text style={[s.secondary, { marginTop: 5 }]}>of R{home.budget.toLocaleString('en-ZA')} ({Math.round(home.spent / home.budget * 100)}%)</Text><Progress fraction={home.spent / home.budget} label="Monthly budget used" /></View></View></Card>
    <AlertCarousel />
    <Card style={{ paddingHorizontal: 7, paddingVertical: 12 }}><View style={[s.row, { alignItems: 'stretch' }]}>{([{ label: 'Scan Meter', icon: 'scan', action: () => setPreview('Scan Meter') }, { label: 'Add Top-up', icon: 'plus', action: () => setPreview('Add Top-up') }, { label: 'Ask AI', icon: 'ai', action: () => router.push('/conversation') }] as { label: string; icon: IconName; action: () => void }[]).map((action, i) => <View key={action.label} style={[s.row, { flex: 1, alignItems: 'stretch' }]}>{i > 0 && <View style={s.divider} />}<Pressable accessibilityRole="button" onPress={action.action} style={styles.quickAction}><View style={styles.actionCircle}><OutlineIcon name={action.icon} size={23} /></View><Text style={styles.actionLabel}>{action.label}</Text></Pressable></View>)}</View></Card>
    <Text style={{ fontSize: 9, color: palette.muted, textAlign: 'center' }}>Local sample data · No live device connections</Text>
    <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}><View style={styles.modalBackdrop}><Card style={{ width: '100%', maxWidth: 350 }}><Text style={s.heading}>{preview}</Text><Text style={[s.body, { marginTop: 12 }]}>{preview === 'Profile' ? `${home.resident} · ${home.household}. This is a sample household profile.` : preview === 'Notifications' ? 'Your sample alerts appear on Home. Notifications are not connected.' : preview === 'Scan Meter' ? 'Meter scanning is a UI-only placeholder. No photo is captured or analysed.' : 'Top-ups are a UI-only placeholder. No purchase or balance change occurs.'}</Text><Pressable accessibilityRole="button" onPress={() => setPreview(null)} style={styles.closeButton}><Text style={{ color: palette.blue, fontSize: 13 }}>Close</Text></Pressable></Card></View></Modal>
  </Page>;
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 5, paddingBottom: 6 }}><Text style={s.secondary}>{label}</Text><Text style={[s.value, { marginTop: 6 }]}>{value}{unit && <Text style={styles.unit}> {unit}</Text>}</Text></View>;
}
function Summary({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <View style={[s.row, { flex: 1, gap: 8, paddingHorizontal: 5, paddingVertical: 2 }]}><View style={styles.summaryCircle}><OutlineIcon name={icon} size={23} /></View><View style={{ flex: 1 }}><Text style={[s.secondary, { fontSize: 10 }]}>{label}</Text><Text style={{ fontSize: 13, fontWeight: '500', color: palette.navy, marginTop: 3 }}>{value}</Text></View></View>;
}
function AlertCarousel() {
  const row = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const currentIndex = useRef(0);
  useEffect(() => { row.current?.scrollTo({ x: currentIndex.current * width, animated: false }); }, [width]); // Keep the same alert when the viewport rotates.
  const go = (direction: number) => { const next = (index + direction + alerts.length) % alerts.length; row.current?.scrollTo({ x: next * width, animated: true }); currentIndex.current = next; setIndex(next); };
  return <Card style={{ backgroundColor: palette.blush, padding: 0, overflow: 'hidden' }}><View style={[s.row, { backgroundColor: palette.blush, paddingVertical: 8 }]}><Pressable accessibilityRole="button" accessibilityLabel="Previous alert" onPress={() => go(-1)} style={styles.alertArrow}><OutlineIcon name="left" /></Pressable><View style={{ flex: 1, minWidth: 0 }} onLayout={event => setWidth(event.nativeEvent.layout.width)}><ScrollView horizontal pagingEnabled ref={row} showsHorizontalScrollIndicator={false} onScroll={event => { if (width) { const next = Math.max(0, Math.min(alerts.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))); currentIndex.current = next; setIndex(next); } }} scrollEventThrottle={16}>{alerts.map(alert => <View key={alert.title} style={{ width, paddingVertical: 18, paddingRight: 3 }}><View style={[s.row, { alignItems: 'flex-start', gap: 7 }]}><View style={styles.statusDot} /><View style={{ flex: 1 }}><Text style={{ fontSize: 12, lineHeight: 18, fontWeight: '500', color: palette.navy }}>{alert.title}</Text><Text style={[s.secondary, { marginTop: 3 }]}>{alert.detail}</Text></View></View></View>)}</ScrollView></View><Pressable accessibilityRole="button" accessibilityLabel="Next alert" onPress={() => go(1)} style={styles.alertArrow}><OutlineIcon name="right" /></Pressable></View><Text accessibilityLiveRegion="polite" style={styles.counter}>{index + 1} / {alerts.length}</Text></Card>;
}
const styles = StyleSheet.create({
  title: { fontSize: 23, fontWeight: '500', color: palette.navy }, notificationDot: { position: 'absolute', right: 8, top: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: '#e7734c' },
  eyebrow: { fontSize: 9, letterSpacing: 1.4, color: '#78858b' }, householdTop: { flexDirection: 'row', alignItems: 'center', minHeight: 133 }, house: { width: '44%', height: 138, marginRight: -8 },
  horizontalDivider: { height: 1, backgroundColor: palette.divider, marginTop: 12, marginBottom: 12 }, summaryCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f2f0ff', alignItems: 'center', justifyContent: 'center' },
  selector: { flexDirection: 'row', backgroundColor: '#f3f1ff', borderRadius: 20, padding: 3 }, segment: { minWidth: 43, minHeight: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }, segmentActive: { backgroundColor: palette.blue }, unit: { fontSize: 12, fontWeight: '400' },
  quickAction: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4, minHeight: 63 }, actionCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f3f1ff', alignItems: 'center', justifyContent: 'center' }, actionLabel: { fontSize: 10, color: '#514b9b', textAlign: 'center' },
  alertArrow: { width: 38, minHeight: 60, alignItems: 'center', justifyContent: 'center' }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.coral, marginTop: 6 }, counter: { position: 'absolute', top: 6, right: 45, fontSize: 9, color: palette.muted },
  modalBackdrop: { flex: 1, backgroundColor: '#17163d44', alignItems: 'center', justifyContent: 'center', padding: 24 }, closeButton: { alignSelf: 'flex-end', minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', marginTop: 12 },
});
