import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { periodLabel, displayValue, unitLabel, type Period, type Unit, type Segment } from '@/data/usage';
import { energyStyles as s, palette } from '@/design/energy-theme';
import { Card } from './primitives';

export function OtherDevicesSheet({ visible, devices, period, unit, onClose, onDevice }: { visible: boolean; devices: Segment[]; period: Period; unit: Unit; onClose: () => void; onDevice: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close other devices" onPress={onClose} style={StyleSheet.absoluteFill} />
      <Card style={[styles.sheet, { height: Math.min(height * 0.8, 165 + devices.length * 65 + insets.bottom), paddingBottom: Math.max(17, insets.bottom), paddingLeft: Math.max(17, insets.left), paddingRight: Math.max(17, insets.right) }]}>
        <View accessibilityViewIsModal style={{ flex: 1 }}>
          <View style={[s.row, { justifyContent: 'space-between', gap: 10 }]}><Text accessibilityRole="header" style={s.heading}>Other devices</Text><Pressable accessibilityRole="button" onPress={onClose} style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}><Text style={{ fontSize: 12, color: palette.blue }}>Close</Text></Pressable></View>
          <Text style={s.secondary}>{periodLabel[period]} · {unit === 'energy' ? 'Energy (kWh)' : 'Cost (R)'}</Text>
          <Text style={[s.secondary, { marginTop: 5, marginBottom: 9, fontSize: 10 }]}>Missing readings are not zero. Percentages use the recorded household total.</Text>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {devices.map(device => <Pressable key={device.id} accessibilityRole="button" accessibilityLabel={`View usage for ${device.name}`} onPress={() => { if (device.id) onDevice(device.id); }} style={styles.row}>
              <Text style={[s.body, { flex: 1, minWidth: 0 }]}>{device.name}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: palette.navy }}>{device.noData ? 'No data' : displayValue(device[unit], unit)}<Text style={{ fontSize: 10, fontWeight: '400' }}>{device.noData ? '' : ` ${unitLabel(unit)}`}</Text></Text>
              <Text style={{ minWidth: 30, textAlign: 'right', color: palette.muted, fontSize: 11 }}>{device.noData ? '—' : `${Math.round(device.share)}%`}</Text>
            </Pressable>)}
          </ScrollView>
        </View>
      </Card>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#17163d44' }, sheet: { width: '100%', maxWidth: 430, alignSelf: 'center', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderWidth: 1, borderColor: 'white' }, row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 13, borderTopWidth: 1, borderTopColor: palette.divider } });
