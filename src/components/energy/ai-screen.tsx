import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { illustration, newId } from '@/data/devices';
import { useHousehold } from '@/state/household';
import { energyStyles as s, palette } from '@/design/energy-theme';
import { Card, Page, OutlineIcon, IconButton } from './primitives';

const prompts = ['How can I save today?', 'Why is usage high?', 'Review device schedules', 'Explain my bill'];
const recommendations = [
  { id: 'fridge', title: 'Check fridge runtime', text: 'Review cooling cycles in the sample history.', action: 'View usage' },
  { id: 'water-heater', title: 'Review water heater schedule', text: 'Match heating times to your household routine.', action: 'Review schedule' },
  { id: 'air-conditioner', title: 'Understand cooling usage', text: 'Compare sample energy use by period.', action: 'View usage' },
];
export default function AIScreen() {
  const { state } = useHousehold();
  const row = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const go = (direction: number) => { const next = (index + direction + recommendations.length) % recommendations.length; setIndex(next); row.current?.scrollTo({ x: next * width, animated: true }); };
  const chat = (prompt?: string) => router.push(prompt ? { pathname: '/conversation', params: { prompt, entry: newId() } } : '/conversation');
  return <Page>
    <View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}><Text style={{ fontSize: 23, fontWeight: '500', color: palette.navy }}>AI</Text><Text style={s.secondary}>Your household energy assistant</Text></View><IconButton name="bell" label="Demo notifications" onPress={() => chat('Explain my sample alerts')} /></View>
    <Card><Text style={s.heading}>Energy Save Assistant</Text><Text style={[s.secondary, { marginTop: 5, marginBottom: 16 }]}>Ask about usage, devices and savings.</Text>
      <Card style={{ padding: 9, backgroundColor: '#fbfaff' }}><View style={[s.row, { justifyContent: 'space-between', marginBottom: 9 }]}><Text style={{ fontSize: 10, color: palette.blue }}>Recommended for you</Text><Text style={{ fontSize: 9, color: palette.muted }}>Demo insight</Text></View>
        <View style={[s.row, { gap: 3 }]}><Pressable accessibilityRole="button" accessibilityLabel="Previous recommendation" onPress={() => go(-1)} style={{ width: 30, minHeight: 70, justifyContent: 'center' }}><OutlineIcon name="left" /></Pressable><View style={{ flex: 1, minWidth: 0 }} onLayout={event => { const next = event.nativeEvent.layout.width; setWidth(next); row.current?.scrollTo({ x: index * next, animated: false }); }}><ScrollView ref={row} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={event => width && setIndex(Math.max(0, Math.min(2, Math.round(event.nativeEvent.contentOffset.x / width))))} scrollEventThrottle={16}>{recommendations.map(item => { const device = state.devices.find(value => value.id === item.id); return <View key={item.id} style={{ width, gap: 10, paddingVertical: 6 }}><View style={[s.row, { gap: 10, alignItems: 'flex-start' }]}><Image source={illustration(device?.icon ?? item.id)} style={{ width: 60, height: 70, borderRadius: 17 }} contentFit="contain" /><View style={{ flex: 1 }}><Text style={[s.body, { fontWeight: '500' }]}>{item.title}</Text><Text style={[s.secondary, { marginTop: 4 }]}>{item.text}</Text></View></View><Pressable accessibilityRole="button" disabled={!device} onPress={() => router.push({ pathname: item.action === 'Review schedule' ? '/device-form' : '/device-usage', params: { id: item.id } })} style={{ alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 15, justifyContent: 'center', borderRadius: 24, backgroundColor: palette.lavender }}><Text style={{ fontSize: 12, color: palette.blue }}>{item.action}</Text></Pressable></View>; })}</ScrollView></View><Pressable accessibilityRole="button" accessibilityLabel="Next recommendation" onPress={() => go(1)} style={{ width: 30, minHeight: 70, justifyContent: 'center', alignItems: 'flex-end' }}><OutlineIcon name="right" /></Pressable></View>
      </Card><View style={[s.row, { justifyContent: 'center', gap: 7, marginTop: 10 }]}>{recommendations.map((item, i) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Recommendation ${i + 1}`} accessibilityState={{ selected: i === index }} onPress={() => { setIndex(i); row.current?.scrollTo({ x: i * width, animated: true }); }} style={{ padding: 8 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === index ? palette.blue : '#d1cdea' }} /></Pressable>)}</View>
    </Card>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{prompts.map(prompt => <Pressable key={prompt} accessibilityRole="button" onPress={() => chat(prompt)} style={{ width: '48%', flexGrow: 1 }}><Card style={{ minHeight: 76, justifyContent: 'center' }}><Text style={s.body}>{prompt}</Text></Card></Pressable>)}</View>
    <Card><Pressable accessibilityRole="button" onPress={() => chat('How can I save today?')} style={[s.row, { gap: 9, minHeight: 44 }]}><View style={{ flex: 1 }}><Text style={{ fontSize: 12, color: palette.blue }}>Energy tip</Text><Text style={[s.body, { marginTop: 4 }]}>Check for appliances left running.</Text></View><Text style={{ fontSize: 11, color: palette.blue }}>Learn more</Text><OutlineIcon name="right" size={15} /></Pressable></Card>
    <Card><Pressable accessibilityRole="button" accessibilityLabel="Start or reopen electricity conversation" onPress={() => chat()} style={[s.row, { minHeight: 44, gap: 12 }]}><Text style={[s.secondary, { flex: 1 }]}>Ask about your electricity…</Text><OutlineIcon name="send" /></Pressable></Card>
    <Text style={[s.secondary, { fontSize: 10, textAlign: 'center' }]}>Local demo assistant · No AI connection or live insights</Text>
  </Page>;
}
