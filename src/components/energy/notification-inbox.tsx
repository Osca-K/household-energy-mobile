import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from '@/design/themed-native';
import { useHousehold } from '@/state/household';
import { householdAlerts } from '@/data/notifications';
import { energyStyles as s, palette } from '@/design/energy-theme';
import { Card, Page, OutlineIcon } from './primitives';
import { ScreenHeader } from './device-controls';
import { SegmentedControl } from './segmented-control';
export default function NotificationInbox() {
  const { state, update } = useHousehold(); const alerts = householdAlerts(state); const read = state.readNotifications || [];
  const [filter, setFilter] = useState<'all' | 'unread'>('all'); const shown = alerts.filter(alert => filter === 'all' || !read.includes(alert.id));
  const mark = (ids: string[]) => update(current => ({ ...current, readNotifications: [...new Set([...(current.readNotifications || []), ...ids])] }));
  return <Page><ScreenHeader title="Notifications" fallback="/home" /><SegmentedControl label="Notification filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }]} /><Pressable accessibilityRole="button" disabled={!alerts.some(alert => !read.includes(alert.id))} onPress={() => mark(alerts.map(alert => alert.id))} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end' }}><Text style={{ color: palette.blue, fontSize: 12 }}>Mark all as read</Text></Pressable><Card>{!shown.length ? <View style={{ paddingVertical: 18 }}><Text style={s.heading}>{filter === 'unread' ? 'You’re all caught up' : 'No notifications'}</Text><Text style={[s.secondary, { marginTop: 7 }]}>Household alerts will appear here.</Text></View> : shown.map((alert, index) => <Pressable key={alert.id} accessibilityRole="button" accessibilityLabel={`${alert.title}${read.includes(alert.id) ? '' : ', unread'}`} onPress={() => { mark([alert.id]); router.push(alert.deviceId ? { pathname: '/device-usage', params: { id: alert.deviceId } } : '/usage'); }} style={{ minHeight: 80, paddingVertical: 14, borderTopWidth: index ? 1 : 0, borderTopColor: palette.divider, flexDirection: 'row', gap: 9, alignItems: 'center' }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: read.includes(alert.id) ? 'transparent' : palette.blue }} /><View style={{ flex: 1, minWidth: 0, gap: 5 }}><Text style={s.body}>{alert.title}</Text><Text style={s.secondary}>{alert.explanation}</Text><Text style={[s.secondary, { fontSize: 10 }]}>{new Date(alert.time).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View><OutlineIcon name="right" size={15} /></Pressable>)}</Card></Page>;
}
