import Constants from 'expo-constants';
import type { FirebaseBackend } from '@/repositories/contracts';
export async function loadFirebase(): Promise<FirebaseBackend> {
  if (!Constants.expoConfig?.extra?.nativeFirebaseEnabled || Constants.executionEnvironment === 'storeClient') throw new Error('Firebase sign-in needs a configured development build. You can continue with a local trial.');
  // Deliberately lazy. Trial mode never loads Auth or opens a Firestore instance.
  return (await import('./firebase-native-backend')).backend;
}
