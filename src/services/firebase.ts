import type { FirebaseBackend } from '@/repositories/contracts';
// Web/Expo Go keep local trials. No JS Firebase fallback silently contacts a project.
export async function loadFirebase(): Promise<FirebaseBackend> {
  throw new Error('Sign-in requires the configured native development build. Local trial remains available.');
}
