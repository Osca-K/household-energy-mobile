import { router, type Href } from 'expo-router';
import { useAuthentication } from '@/state/auth';
import { useHousehold } from '@/state/household';
import { Text, View } from '@/design/themed-native';
import { energyStyles as s } from '@/design/energy-theme';
import { Card, Page } from './primitives';
import { ScreenHeader } from './device-controls';
import { WelcomeButton } from './welcome-screen';
export function AccountProfile() {
  const auth = useAuthentication(); const { state } = useHousehold();
  return <Page><ScreenHeader title="Profile" fallback={'/devices' as Href} /><Card><Text style={s.heading}>{auth.user?.displayName || 'Your account'}</Text><Text style={[s.secondary, { marginTop: 8 }]}>{auth.user?.email}</Text><View style={{ marginTop: 16 }}><WelcomeButton label="Account & verification" onPress={() => router.push('/account' as Href)} /></View></Card><Card><Text style={s.heading}>{state.settings?.household.name || 'My household'}</Text>{state.settings?.household.members.map(member => <Text key={member.id} style={[s.body, { marginTop: 12 }]}>{member.name}</Text>)}<View style={{ marginTop: 16 }}><WelcomeButton label={state.householdId ? 'View household' : 'Create household'} onPress={() => router.push('/household-setup' as Href)} /></View></Card><WelcomeButton label="Sign out" onPress={() => { void auth.signOut().then(() => router.replace('/')).catch(() => {}); }} />{!!auth.error && <Card><Text accessibilityRole="alert" style={s.body}>{auth.error}</Text></Card>}</Page>;
}
