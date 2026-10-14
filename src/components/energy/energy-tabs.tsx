import { useAppearance } from '@/design/appearance';
import type { Ref } from 'react';
import type { Href } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, Text, View, StyleSheet } from '@/design/themed-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OutlineIcon, type IconName } from './primitives';
import { palette } from '@/design/energy-theme';

export default function EnergyTabs() {
  const theme = useAppearance(); const insets = useSafeAreaInsets();
  return <Tabs style={theme.style(styles.shell)}><View style={styles.slot}><TabSlot style={{ flex: 1 }} /></View><TabList style={[theme.style(styles.bar), { marginBottom: Math.max(12, insets.bottom) }]}>
    <TabTrigger name="home" href={'/home' as Href} asChild><TabButton icon="home">Home</TabButton></TabTrigger>
    <TabTrigger name="usage" href="/usage" asChild><TabButton icon="usage">Usage</TabButton></TabTrigger>
    <TabTrigger name="devices" href="/devices" asChild><TabButton icon="devices">Devices</TabButton></TabTrigger>
    <TabTrigger name="ai" href="/ai" asChild><TabButton icon="ai">AI</TabButton></TabTrigger>
  </TabList></Tabs>;
}
function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: IconName; ref?: Ref<View> }) {
  return <Pressable {...props} accessibilityRole="tab" accessibilityState={{ selected: isFocused }} style={({ pressed }) => [styles.button, isFocused && styles.active, pressed && { opacity: 0.6 }]}><OutlineIcon name={icon} size={21} color={isFocused ? palette.blue : palette.muted} /><Text style={[styles.label, { color: isFocused ? palette.blue : palette.muted }]}>{children}</Text></Pressable>;
}
const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: palette.background, width: '100%', maxWidth: 430, alignSelf: 'center' }, slot: { flex: 1, minHeight: 0 },
  bar: { flexDirection: 'row', padding: 6, marginHorizontal: 12, borderRadius: 32, backgroundColor: '#ffffff', shadowColor: '#9184cf', shadowOpacity: 0.13, shadowRadius: 18, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  button: { flex: 1, minHeight: 55, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 5 }, active: { backgroundColor: palette.blueSurface }, label: { fontSize: 10 },
});
