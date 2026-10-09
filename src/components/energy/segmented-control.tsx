import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/design/energy-theme';

export function SegmentedControl<T extends string>({ options, value, onChange, label }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  const [width, setWidth] = useState(0);
  const [offset] = useState(() => new Animated.Value(0));
  const selected = options.findIndex(option => option.value === value);
  const itemWidth = Math.max(0, width - 8) / options.length;
  useEffect(() => { const animation = Animated.timing(offset, { toValue: selected * itemWidth, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }); animation.start(); return () => animation.stop(); }, [selected, itemWidth, offset]);
  return <View accessibilityLabel={label} style={styles.track} onLayout={event => setWidth(event.nativeEvent.layout.width)}><Animated.View pointerEvents="none" style={[styles.thumb, { width: itemWidth, transform: [{ translateX: offset }] }]} />{options.map(option => <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={`${label}: ${option.label}`} accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} style={styles.button}><Text style={[styles.label, { color: value === option.value ? palette.blue : palette.muted }]}>{option.label}</Text></Pressable>)}</View>;
}
const styles = StyleSheet.create({ track: { flexDirection: 'row', borderRadius: 25, padding: 4, backgroundColor: '#eeecf8' }, thumb: { position: 'absolute', left: 4, top: 4, bottom: 4, backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: '#ffffff', shadowColor: '#9184cf', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 }, button: { flex: 1, minWidth: 0, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }, label: { fontSize: 11, fontWeight: '500' } });
