import type { Device } from '@/data/devices';
import type { Household } from '@/state/household';
export type AccountUser = { uid: string; email: string; displayName: string; verified: boolean };
export type CloudHousehold = { id: string; name: string; creatorUid: string };
export type HouseholdRepository = {
  load(): Promise<Household>;
  save(state: Household): Promise<void>;
};
export type CloudRepository = {
  subscribe(onValue: (household: CloudHousehold | null, devices: Device[], members: { id: string; name: string }[]) => void, onError: (error: Error) => void): () => void;
  createHousehold(name: string, devices: Device[]): Promise<string>;
  saveDevice(device: Device): Promise<void>;
  deleteDevice(id: string): Promise<void>;
  dispose(): Promise<void>;
};
export type FirebaseBackend = {
  observe(callback: (user: AccountUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resendVerification(): Promise<void>;
  refreshVerification(): Promise<AccountUser | null>;
  resetPassword(email: string): Promise<void>;
  repository(user: AccountUser): Promise<CloudRepository>;
  resetCache(): Promise<void>;
};
