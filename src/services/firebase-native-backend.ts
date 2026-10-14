import { getApp } from '@react-native-firebase/app';
import { getAuth, onIdTokenChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail, updateProfile, reload, getIdToken, type User } from '@react-native-firebase/auth';
import { getFirestore, doc, collection, getDocFromServer, setDoc, onSnapshot, writeBatch, serverTimestamp, deleteDoc, terminate, clearPersistence, type Firestore } from '@react-native-firebase/firestore';
import { confirmedDeviceRecord, deviceFromCloud, importableDevices } from '@/repositories/cloud-records';
import type { AccountUser, CloudHousehold, CloudRepository, FirebaseBackend } from '@/repositories/contracts';
import type { Device } from '@/data/devices';
let database: Firestore | undefined;
let initialization: Promise<Firestore> | undefined;
let resetting: Promise<void> | undefined;
let cacheResetFailure: Error | null = null;
const disposers = new Set<() => void>();
const userValue = (user: User | null): AccountUser | null => user ? { uid: user.uid, email: user.email || '', displayName: user.displayName || '', verified: user.emailVerified } : null;
function assertUser(uid: string) { const user = getAuth().currentUser; if (!user || user.uid !== uid || !user.emailVerified) throw new Error('A verified account is required.'); }
async function firestore() {
  if (resetting) await resetting;
  if (cacheResetFailure) throw cacheResetFailure;
  if (!database) {
    initialization ||= (async () => {
      const db = getFirestore(getApp());
      // Await native settings before any operation. AsyncStorage is unrelated.
      await (db as unknown as { settings(value: { persistence: boolean }): Promise<void> }).settings({ persistence: false });
      database = db;
      return db;
    })();
    try { await initialization; } finally { initialization = undefined; }
  }
  if (!database) throw new Error('Account database initialization was interrupted.');
  return database;
}
async function resetNativeCache() {
  if (cacheResetFailure) throw cacheResetFailure;
  for (const detach of [...disposers]) detach();
  if (initialization) await initialization;
  if (!database) return;
  const db = database; database = undefined;
  try { await terminate(db); await clearPersistence(db); cacheResetFailure = null; }
  catch { cacheResetFailure = new Error('Firebase cache could not be reset safely. Close and restart the app before signing into another account.'); throw cacheResetFailure; }
}
async function resetCache() {
  resetting ||= resetNativeCache();
  try { await resetting; } finally { resetting = undefined; }
}
export const backend: FirebaseBackend = {
  observe: callback => onIdTokenChanged(getAuth(), user => callback(userValue(user))),
  async signIn(email, password) { await signInWithEmailAndPassword(getAuth(), email.trim(), password); },
  async register(name, email, password) { const result = await createUserWithEmailAndPassword(getAuth(), email.trim(), password); await updateProfile(result.user, { displayName: name.trim() }); await sendEmailVerification(result.user); },
  async signOut() { await signOut(getAuth()); },
  async resendVerification() { const user = getAuth().currentUser; if (!user) throw new Error('Sign in first.'); await sendEmailVerification(user); },
  async refreshVerification() { const user = getAuth().currentUser; if (!user) return null; await reload(user); await getIdToken(user, true); return userValue(getAuth().currentUser); },
  async resetPassword(email) { await sendPasswordResetEmail(getAuth(), email.trim()); },
  resetCache,
  async repository(user) {
    assertUser(user.uid); const db = await firestore(); assertUser(user.uid);
    const profile = doc(db, 'users', user.uid);
    const existing = await getDocFromServer(profile); assertUser(user.uid);
    if (!existing.exists()) await setDoc(profile, { displayName: user.displayName || 'Household member', email: user.email, activeHouseholdId: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    let householdId = ''; let detached = false; let generation = 0;
    const listeners = new Set<() => void>();
    const stopHousehold = () => { generation++; for (const off of listeners) off(); listeners.clear(); };
    const detach = () => { if (detached) return; detached = true; stopHousehold(); profileOff?.(); disposers.delete(detach); };
    let profileOff: (() => void) | undefined;
    disposers.add(detach);
    const repository: CloudRepository = {
      subscribe(onValue, onError) {
        if (detached) throw new Error('This account repository is closed.');
        profileOff?.();
        profileOff = onSnapshot(profile, snapshot => {
          if (detached) return; stopHousehold(); householdId = snapshot.data()?.activeHouseholdId || ''; onValue(null, [], []);
          if (!householdId) return;
          const version = generation; let home: CloudHousehold | null = null; let devices: Device[] = []; let members: { id: string; name: string }[] = [];
          let receivedHome = false, receivedDevices = false, receivedMembers = false;
          const publish = () => { if (!detached && generation === version && receivedHome && receivedDevices && receivedMembers) onValue(home, devices, members); };
          const fail = (error: Error) => { if (detached || generation !== version) return; stopHousehold(); onValue(null, [], []); onError(error); };
          listeners.add(onSnapshot(doc(db, 'households', householdId), record => { if (generation !== version || detached) return; home = record.exists() ? { id: record.id, name: record.data()!.name, creatorUid: record.data()!.creatorUid } : null; receivedHome = true; publish(); }, fail));
          listeners.add(onSnapshot(collection(db, 'households', householdId, 'devices'), records => { if (generation !== version || detached) return; devices = records.docs.map(record => deviceFromCloud(record.id, record.data() as ReturnType<typeof confirmedDeviceRecord>)); receivedDevices = true; publish(); }, fail));
          listeners.add(onSnapshot(collection(db, 'households', householdId, 'members'), records => { if (generation !== version || detached) return; members = records.docs.map(record => ({ id: record.id, name: record.data().displayName })); receivedMembers = true; publish(); }, fail));
        }, error => { if (!detached) { stopHousehold(); onValue(null, [], []); onError(error); } });
        return detach;
      },
      async createHousehold(name, devices) {
        assertUser(user.uid); if (detached) throw new Error('Account changed.');
        if (!name.trim() || name.trim().length > 80 || devices.length > 100) throw new Error('Enter a household name of up to 80 characters and select at most 100 devices.');
        if (devices.some(device => !importableDevices([device]).length)) throw new Error('Only explicitly confirmed local devices can be imported.');
        const home = doc(collection(db, 'households')); const batch = writeBatch(db);
        batch.set(home, { name: name.trim(), creatorUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        batch.set(doc(db, 'households', home.id, 'members', user.uid), { uid: user.uid, displayName: user.displayName || 'Household member', joinedAt: serverTimestamp() });
        batch.update(profile, { activeHouseholdId: home.id, updatedAt: serverTimestamp() });
        for (const device of devices) {
          const target = doc(collection(db, 'households', home.id, 'devices'));
          batch.set(target, { ...confirmedDeviceRecord(device), powerOn: false, createdBy: user.uid, updatedBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
        await batch.commit(); return home.id;
      },
      async saveDevice(device) {
        assertUser(user.uid); if (detached || !householdId) throw new Error('Create a household first.');
        const target = device.id ? doc(db, 'households', householdId, 'devices', device.id) : doc(collection(db, 'households', householdId, 'devices'));
        const previous = await getDocFromServer(target); assertUser(user.uid); if (detached) throw new Error('Account changed.');
        const data = confirmedDeviceRecord(device);
        await setDoc(target, { ...data, createdBy: previous.exists() ? previous.data()!.createdBy : user.uid, createdAt: previous.exists() ? previous.data()!.createdAt : serverTimestamp(), updatedBy: user.uid, updatedAt: serverTimestamp() });
      },
      async deleteDevice(id) { assertUser(user.uid); if (detached || !householdId) throw new Error('Account changed.'); await deleteDoc(doc(db, 'households', householdId, 'devices', id)); },
      async dispose() { detach(); },
    };
    return repository;
  },
};
