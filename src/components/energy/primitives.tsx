import type { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '@/state/household';
import Svg, { Path, Circle } from 'react-native-svg';
import { energyStyles as styles, palette } from '@/design/energy-theme';

const paths = {
  home: 'm3 11 9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  usage: 'M13 2 4 14h7l-1 8 10-13h-7l1-7Z',
  devices: 'M5 3h11v17H5V3Zm11 7h5v11h-5M9 17h3',
  ai: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-4 11a2 2 0 0 1-4 0',
  profile: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-2a8 8 0 0 1 16 0v2H4Z',
  location: 'M12 22s8-8 8-14a8 8 0 1 0-16 0c0 6 8 14 8 14ZM12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  members: 'M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 21v-3a6 6 0 0 1 12 0v3M4 6a3 3 0 0 0 0 6M20 6a3 3 0 0 1 0 6M2 21v-4a4 4 0 0 1 3-4m17 8v-4a4 4 0 0 0-3-4',
  scan: 'M8 3H4v5m12-5h4v5M4 16v5h4m12-5v5h-4',
  plus: 'M12 6v12M6 12h12',
  left: 'm15 18-6-6 6-6', right: 'm9 18 6-6-6-6',
  sun: 'M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
  gauge: 'M3 17a9 9 0 1 1 18 0M12 13l5-5M10 15a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5h5',
  budget: 'M4 7h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3M16 12h5v4h-5v-4Z',
  edit: 'm4 16-1 5 5-1L20 8l-4-4L4 16Zm10-10 4 4M4 16l4 4',
  send: 'm22 2-7 20-4-9-9-4 20-7Zm-11 11 11-11',
};
export type IconName = keyof typeof paths;
export function OutlineIcon({ name, size = 22, color = palette.blue }: { name: IconName; size?: number; color?: string }) {
  const accessibility = Platform.OS === 'web' ? { 'aria-hidden': true as const } : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" {...accessibility}><Path d={paths[name]} />{name === 'sun' && <Circle cx="12" cy="12" r="4" fill={color} />}{name === 'plus' && <Circle cx="12" cy="12" r="10" />}</Svg>;
}
export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <LinearGradient colors={['#ffffff', '#fcfbff']} style={[styles.card, style]}>{children}</LinearGradient>;
}
export function Page({ children, keyboard = false }: PropsWithChildren<{ keyboard?: boolean }>) {
  const { error, retry } = useHousehold(); const insets = useSafeAreaInsets();
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.page}><KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboard ? Platform.OS === 'ios' ? 'padding' : 'height' : undefined}><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>{!!error && <View style={{ backgroundColor: '#fff0f3', padding: 12, borderRadius: 14 }}><Text accessibilityRole="alert" style={styles.secondary}>{error}</Text><Pressable accessibilityRole="button" onPress={retry} style={{ minHeight: 40, justifyContent: 'center' }}><Text style={{ color: palette.blue, fontSize: 12 }}>Retry local save</Text></Pressable></View>}{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function IconButton({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [local.iconButton, { opacity: pressed ? 0.6 : 1 }]}><OutlineIcon name={name} color={palette.muted} /></Pressable>;
}
export function Progress({ fraction, label }: { fraction: number; label: string }) {
  const percent = Math.max(0, Math.min(100, fraction * 100));
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: percent }} style={local.track}><LinearGradient colors={['#aaa5ee', '#7b7bf9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, width: `${percent}%`, borderRadius: 5 }} /></View>;
}
export function Placeholder({ title }: { title: string }) {
  return <Page><Text style={[styles.heading, { fontSize: 23 }]}>{title}</Text><Card><Text style={styles.heading}>{title} is coming next</Text><Text style={[styles.secondary, { marginTop: 8 }]}>This is a local UI preview. Home is ready; this tab is a placeholder.</Text></Card></Page>;
}
const local = StyleSheet.create({ iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#9184cf', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, track: { height: 8, backgroundColor: '#eeedf5', borderRadius: 5, marginTop: 9, overflow: 'hidden' } });
