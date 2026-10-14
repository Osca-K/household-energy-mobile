import { AuthenticationProvider } from '@/state/auth';
import { AppearanceProvider, useAppearance } from '@/design/appearance';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { HouseholdProvider } from '@/state/household';
export default function Layout() {
  useEffect(() => { void SplashScreen.hideAsync(); }, []);
  return <SafeAreaProvider><AuthenticationProvider><HouseholdProvider><AppearanceProvider><AppStack /></AppearanceProvider></HouseholdProvider></AuthenticationProvider></SafeAreaProvider>;
}
function AppStack() { const theme = useAppearance(); return <><StatusBar style={theme.dark ? "light" : "dark"} /><Stack initialRouteName="index" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}><Stack.Screen name="index" /><Stack.Screen name="account" /><Stack.Screen name="household-setup" /><Stack.Screen name="login-preview" /><Stack.Screen name="(tabs)" /><Stack.Screen name="device-form" /><Stack.Screen name="scan-meter" /><Stack.Screen name="device-usage" /><Stack.Screen name="conversation" /><Stack.Screen name="profile" /><Stack.Screen name="notifications" /><Stack.Screen name="join" /></Stack></>;
}
