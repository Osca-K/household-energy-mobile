import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { HouseholdProvider } from '@/state/household';
import { palette } from '@/design/energy-theme';
export default function Layout() {
  useEffect(() => { void SplashScreen.hideAsync(); }, []);
  return <SafeAreaProvider><HouseholdProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="device-form" /><Stack.Screen name="device-usage" /><Stack.Screen name="conversation" /></Stack></HouseholdProvider></SafeAreaProvider>;
}
