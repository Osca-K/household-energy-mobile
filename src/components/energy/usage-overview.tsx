import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { energyStyles as s, palette } from '@/design/energy-theme';

export function UsageOverview({ budget, spent, estimate, energy, cost, load, on, total, remaining }: { budget: number; spent: number; estimate: number; energy: number; cost: number; load: number; on: number; total: number; remaining: number }) {
  const fraction = budget > 0 ? spent / budget : 0;
  const percentage = Math.round(fraction * 100);
  const within = spent <= budget && estimate <= budget;
  const status = load === 0 ? 'No load' : load < 1 ? 'Low' : load < 5 ? 'Moderate' : 'High';
  return <LinearGradient colors={['#ffffff', '#ffffff']} style={[s.card, styles.surface]}>
    <View style={[s.row, { alignItems: 'stretch' }]}>{[{ label: 'Budget', value: `R${budget.toLocaleString('en-ZA')}` }, { label: 'Spent', value: `R${spent.toFixed(2)}` }, { label: 'Estimate', value: `R${estimate.toFixed(2)}` }].map((metric, index) => <View key={metric.label} style={[styles.budgetColumn, index > 0 && styles.columnDivider]}><Text style={styles.label}>{metric.label}</Text><Text style={styles.budgetValue}>{metric.value}</Text></View>)}</View>
      <View accessibilityRole="progressbar" accessibilityLabel="Monthly budget used" accessibilityValue={{ min: 0, max: 100, now: Math.max(0, Math.min(100, fraction * 100)) }} style={styles.track}><LinearGradient colors={['#b2a5f4', '#7c6af4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.max(0, Math.min(100, fraction * 100))}%`, height: '100%', borderRadius: 8 }} /></View>
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 13 }]}><Text style={s.secondary}><Text style={{ fontSize: 16, color: '#8275e9' }}>{percentage}%</Text> used</Text><View style={[s.row, { gap: 6 }]}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: within ? '#9fbe84' : palette.coral }} /><Text style={s.secondary}>{within ? 'Within budget' : 'Above budget'}</Text></View></View>
    <View style={styles.summary}>
      <OverviewReading label="Today’s usage" value={`R${cost.toFixed(2)}`} detail={`${energy.toFixed(1)} kWh`} />
      <OverviewReading label="Current load" value={load.toFixed(2)} unit="kW" detail={status} />
      <OverviewReading label="Devices" value={String(on)} unit={`of ${total}`} detail="Active" />
      <OverviewReading label="Estimated to run out" value={String(remaining)} unit="days" detail="Usage-based" />
    </View>
  </LinearGradient>;
}
function OverviewReading({ label, value, unit, detail }: { label: string; value: string; unit?: string; detail: string }) {
  return <View style={styles.summaryRow}>
    <View style={styles.summaryLabel}><Text style={styles.label}>{label}</Text></View>
    <View style={styles.summaryMain}><Text style={styles.summaryValue}>{value}<Text style={styles.unit}>{unit ? ` ${unit}` : ''}</Text></Text></View>
    <View style={styles.summarySupport}><Text style={styles.supportingText}>{detail}</Text></View>
  </View>;
}
export function UsageChartMetrics({ energy, cost, averageEnergy, averageCost, perHour }: { energy: number; cost: number; averageEnergy: number | null; averageCost: number | null; perHour: boolean }) {
  return <LinearGradient colors={['#f8f6ff', '#f1eefb']} style={styles.inset}>{[{ label: 'Total energy', value: energy.toFixed(1), unit: 'kWh' }, { label: 'Total cost', value: `R${cost.toFixed(2)}`, unit: '' }, { label: 'Average energy', value: averageEnergy === null ? 'No data' : averageEnergy.toFixed(2), unit: averageEnergy === null ? '' : 'kWh', average: true }, { label: 'Average cost', value: averageCost === null ? 'No data' : `R${averageCost.toFixed(2)}`, unit: '', average: true }].map((metric, index) => <View key={metric.label} style={[styles.chartMetric, index % 2 === 1 && styles.columnDivider, index >= 2 && styles.rowDivider]}><Text style={styles.label}>{metric.label}</Text><Text style={[styles.value, { fontSize: 19 }]}>{metric.value}<Text style={styles.unit}>{metric.unit ? ` ${metric.unit}` : ''}</Text></Text>{metric.average && <Text style={[styles.supportingText, { fontSize: 10, marginTop: 3 }]}>{perHour ? 'Per hour' : 'Per day'}</Text>}</View>)}</LinearGradient>;
}
const styles = StyleSheet.create({
  surface: { borderRadius: 27, borderWidth: 1, borderColor: '#ffffff', padding: 17, shadowOpacity: 0.08, shadowRadius: 20 },
  budgetColumn: { flex: 1, minWidth: 0, paddingHorizontal: 7 }, columnDivider: { borderLeftWidth: 1, borderLeftColor: '#e8e3f4' }, rowDivider: { borderTopWidth: 1, borderTopColor: '#e8e3f4' },
  label: { fontSize: 11, lineHeight: 17, color: '#7e799b' }, budgetValue: { fontSize: 17, lineHeight: 24, fontWeight: '500', color: palette.navy, marginTop: 7 }, track: { height: 10, borderRadius: 8, backgroundColor: '#e9e4f7', overflow: 'hidden', marginTop: 20 },
  summary: { marginTop: 19 }, summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 65, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#e8e3f4' },
  summaryLabel: { flex: 1.15, minWidth: 0 }, summaryMain: { flex: 1, minWidth: 0 }, summarySupport: { flex: 0.9, minWidth: 0 },
  summaryValue: { fontSize: 18, lineHeight: 26, fontWeight: '500', color: palette.navy }, supportingText: { fontSize: 11, lineHeight: 17, color: '#7e799b', textAlign: 'right' },
  value: { fontSize: 22, lineHeight: 30, fontWeight: '500', color: palette.navy, marginTop: 8 }, unit: { fontSize: 12, fontWeight: '400' },
  inset: { marginTop: 8, borderRadius: 23, padding: 10, flexDirection: 'row', flexWrap: 'wrap' }, chartMetric: { width: '50%', paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center' },
});
