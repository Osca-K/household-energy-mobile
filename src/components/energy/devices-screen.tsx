import { settingsOf, isCreator, canOperate } from '@/data/settings';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from '@/design/themed-gradient';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from '@/design/themed-native';
import { counts, deviceStatus, statusColor, type Device } from '@/data/devices';
import { deviceListIllustration } from '@/data/device-list-illustrations';
import { useHousehold } from '@/state/household';
import { energyStyles as s, palette, controlGradient } from '@/design/energy-theme';
import { Card, Page, OutlineIcon } from './primitives';
import { PillAction, SoftToggle } from './device-controls';

export default function DevicesScreen() {
  const { state, toggle, ready } = useHousehold();
  const { width } = useWindowDimensions();
  const summary = counts(state.devices);
  const compact = width < 360;
  const metrics = [
    { label: 'Total', value: summary.total },
    { label: 'On', value: summary.on, color: statusColor.On },
    { label: 'Scheduled', value: summary.scheduled, color: statusColor.Scheduled },
    { label: 'Offline', value: summary.offline, color: statusColor.Offline },
  ];
  return <Page>
    <View><Text style={styles.title}>Devices</Text><Text style={[s.secondary, { marginTop: 4 }]}>Monitor and manage your home appliances</Text></View>
    <Card style={[styles.surface, { padding: 14 }]}>
      <View style={[s.row, { alignItems: 'stretch' }]}>{metrics.map((metric, index) => <View key={metric.label} style={[styles.summaryColumn, index > 0 && styles.summaryDivider]}>
        <View style={[s.row, { gap: 4 }]}>{metric.color && <View style={[styles.summaryDot, { backgroundColor: metric.color }]} />}<Text style={styles.summaryLabel}>{metric.label}</Text></View>
        <Text style={styles.summaryValue}>{metric.value}</Text>
      </View>)}</View>
    </Card>
    {!isCreator(settingsOf(state)) && <Text style={s.secondary}>Members can view household usage and switch devices on or off. Household setup is managed by the person who created it.</Text>}
    {state.devices.map(device => <DeviceListCard key={device.id} device={device} ready={ready} compact={compact} onToggle={() => toggle(device.id)} />)}
    <Pressable accessibilityRole="button" disabled={!ready || !isCreator(settingsOf(state))} onPress={() => router.push('/device-form')}>
      <LinearGradient colors={controlGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addButton}><OutlineIcon name="plus" color="white" size={20} /><Text style={{ color: 'white', fontSize: 13 }}>Add Device</Text></LinearGradient>
    </Pressable>
  </Page>;
}

function DeviceListCard({ device, ready, compact, onToggle }: { device: Device; ready: boolean; compact: boolean; onToggle: () => void }) {
  const settings = settingsOf(useHousehold().state);
  const status = deviceStatus(device);
  const dotStatus = device.mode === 'scheduled' && device.enabled && device.powerOn && !device.offline ? 'Scheduled' : status;
  const monitoringOnly = device.id === 'smart-meter' || device.icon === 'smart-meter';
  const size = compact ? 74 : 88;
  return <Card style={[styles.surface, styles.deviceCard]}>
    <View style={styles.cardColumns}>
      {/* This column spans the information and actions, so the tile stays centred. */}
      <View style={[styles.illustrationTile, { width: size, height: size }]}>
        <Image source={deviceListIllustration(device.icon)} style={{ width: size, height: size }} contentFit="contain" alt="" />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.information}>
          <View style={styles.nameBlock}><Text style={styles.deviceName}>{device.name}</Text><Text style={[s.secondary, { marginTop: 3 }]}>{device.location || device.category}</Text></View>
          <View style={styles.controls}>
            <View accessible accessibilityLabel={`${device.name}: ${dotStatus}`} style={[styles.statusDot, { backgroundColor: statusColor[dotStatus] }]} />
            {!monitoringOnly && <SoftToggle value={device.powerOn} onChange={onToggle} disabled={!ready || !canOperate(settings) || device.offline || !device.enabled} label={`${device.name} power`} />}
          </View>
        </View>
        <View style={styles.actionDivider} />
        <View style={styles.actions}>
          <PillAction wide label="View usage" accessibilityLabel={`View usage for ${device.name}`} onPress={() => router.push({ pathname: '/device-usage', params: { id: device.id } })} />
          <PillAction disabled={!isCreator(settings)} label="Edit" accessibilityLabel={`Edit ${device.name}`} onPress={() => router.push({ pathname: '/device-form', params: { id: device.id } })} />
        </View>
      </View>
    </View>
  </Card>;
}

const styles = StyleSheet.create({
  title: { fontSize: 23, fontWeight: '500', color: palette.navy },
  surface: { borderWidth: 1, borderColor: '#ffffff', borderRadius: 27, shadowOpacity: 0.08, shadowRadius: 20 },
  summaryColumn: { flex: 1, minWidth: 0, alignItems: 'center', gap: 7, paddingVertical: 3 },
  summaryDivider: { borderLeftWidth: 1, borderLeftColor: palette.divider },
  summaryDot: { width: 6, height: 6, borderRadius: 3 },
  summaryLabel: { fontSize: 9, color: palette.muted },
  summaryValue: { fontSize: 22, fontWeight: '500', color: palette.navy },
  deviceCard: { padding: 13 },
  cardColumns: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  illustrationTile: { flexShrink: 0, backgroundColor: 'transparent' },
  cardContent: { flex: 1, minWidth: 0 },
  information: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 45 },
  nameBlock: { flex: 1, minWidth: 0 },
  deviceName: { fontSize: 13, fontWeight: '500', lineHeight: 19, color: palette.navy },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 0 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  actionDivider: { height: 1, backgroundColor: palette.divider, marginTop: 10, marginBottom: 9 },
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  addButton: { borderRadius: 26, minHeight: 48, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
});
