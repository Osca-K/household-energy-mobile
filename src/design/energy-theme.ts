import { StyleSheet } from 'react-native';

export const palette = { background: '#f5f3ff', card: '#ffffff', navy: '#17163d', muted: '#8582a4', blue: '#3978df', blueSurface: '#edf3ff', blueBorder: '#d5e3ff', lavender: '#eeebff', divider: '#e9e5f5', blush: '#fcf4f6', coral: '#d9878c' };
export const controlGradient = ['#85afff', '#3978df'] as const;
export const energyStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  content: { padding: 14, paddingBottom: 24, gap: 13, width: '100%', maxWidth: 430, alignSelf: 'center' },
  card: { borderRadius: 25, backgroundColor: palette.card, padding: 17, shadowColor: '#9184cf', shadowOpacity: 0.09, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  heading: { fontSize: 16, fontWeight: '500', color: palette.navy },
  body: { fontSize: 13, lineHeight: 19, color: palette.navy },
  secondary: { fontSize: 11, lineHeight: 17, color: palette.muted },
  value: { fontSize: 22, fontWeight: '500', color: palette.navy },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: palette.divider },
});
