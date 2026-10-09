import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHousehold, type Message } from '@/state/household';
import { energyStyles as s, palette } from '@/design/energy-theme';
import { Card, OutlineIcon } from './primitives';
import { ScreenHeader } from './device-controls';

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ prompt?: string; entry?: string }>();
  const { state, ready, ask, greet, error, retry } = useHousehold();
  const input = useRef<TextInput>(null);
  const scroll = useRef<ScrollView>(null);
  const entered = useRef(false);
  const submitting = useRef(false);
  const [draft, setDraft] = useState('');
  useEffect(() => { if (!ready) return; if (!entered.current) { entered.current = true; if (params.prompt) ask(params.prompt, params.entry); else greet(); } input.current?.focus(); }, [ready, params.prompt, params.entry, ask, greet]);
  const send = () => { if (!draft.trim() || !ready || submitting.current) return; submitting.current = true; ask(draft); setDraft(''); requestAnimationFrame(() => { submitting.current = false; }); };
  return <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}><View style={{ flex: 1, width: '100%', maxWidth: 470, alignSelf: 'center' }}>
    <View style={{ padding: 12 }}><Card style={{ padding: 9 }}><ScreenHeader title="Energy Save Assistant" subtitle="Demo conversation" fallback="/ai" /></Card></View>
    <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 17, paddingBottom: 24, gap: 18 }} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
      {state.messages.map(message => <View key={message.id}><View style={{ alignItems: message.role === 'user' ? 'flex-end' : 'flex-start' }}><View style={{ maxWidth: '88%', borderRadius: 22, padding: 15, backgroundColor: message.role === 'user' ? '#e9e7ff' : '#f0edfb' }}><Text style={[s.body, { lineHeight: 21, color: message.role === 'user' ? '#5d55ce' : palette.navy }]}>{message.text}</Text></View><Text style={{ fontSize: 9, color: palette.muted, paddingHorizontal: 10, marginTop: 5 }}>{new Date(message.time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</Text></View>{message.role === 'assistant' && message.context && <ContextAction message={message} />}</View>)}
    </ScrollView>
    {!!error && <Pressable accessibilityRole="button" onPress={retry} style={{ padding: 10 }}><Text style={[s.secondary, { color: '#a95668' }]}>{error} Tap to retry.</Text></Pressable>}
    <View style={{ padding: 12, paddingTop: 5 }}><Card style={{ padding: 7 }}><View style={[s.row, { gap: 7 }]}><TextInput ref={input} accessibilityLabel="Message the demo energy assistant" placeholder="Type a message…" placeholderTextColor={palette.muted} value={draft} onChangeText={setDraft} editable={ready} multiline style={{ flex: 1, minHeight: 44, maxHeight: 110, padding: 12, fontSize: 14, color: palette.navy, borderRadius: 23, borderWidth: 1, borderColor: palette.divider }} /><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!draft.trim() || !ready} onPress={send} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.blue, opacity: draft.trim() && ready ? 1 : 0.4 }}><OutlineIcon name="send" color="white" size={22} /></Pressable></View></Card><Text style={{ fontSize: 9, textAlign: 'center', color: palette.muted, marginTop: 7 }}>Local demo responses · Estimates use sample readings.</Text></View>
  </View></KeyboardAvoidingView></SafeAreaView>;
}
function ContextAction({ message }: { message: Message }) {
  const { state, update } = useHousehold();
  const heater = state.devices.find(device => device.id === 'water-heater');
  const isSchedule = message.context === 'schedule';
  return <Card style={{ marginTop: 13 }}><Text style={{ fontSize: 10, color: palette.blue }}>Demo recommendation</Text><Text style={[s.body, { fontWeight: '500', marginTop: 7 }]}>{isSchedule ? 'Review water heater schedule' : message.context === 'bill' ? 'Review your local budget' : 'Compare device usage'}</Text><Pressable accessibilityRole="button" onPress={() => isSchedule && heater ? router.push({ pathname: '/device-form', params: { id: heater.id } }) : router.push(message.context === 'bill' ? '/usage' : '/devices')} style={[s.row, { minHeight: 44, justifyContent: 'space-between' }]}><Text style={{ fontSize: 12, color: palette.blue }}>{isSchedule && heater ? 'Review schedule' : message.context === 'bill' ? 'View budget' : 'View devices'}</Text><OutlineIcon name="right" size={17} /></Pressable>{isSchedule && <Pressable accessibilityRole="button" onPress={() => update(value => ({ ...value, reminders: value.reminders.includes('Review water heater schedule') ? value.reminders : [...value.reminders, 'Review water heater schedule'] }))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[s.secondary, { color: palette.blue }]}>{state.reminders.includes('Review water heater schedule') ? 'Reminder saved locally (no notification)' : 'Save a local reminder'}</Text></Pressable>}</Card>;
}
