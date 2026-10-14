import fs from 'node:fs';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
const projectId = 'demo-household-energy';
const env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8089, rules: fs.readFileSync('firestore.rules', 'utf8') } });
const dbFor = (uid, verified = true) => env.authenticatedContext(uid, { email: uid + '@example.com', email_verified: verified }).firestore();
const creator = dbFor('creator'); const other = dbFor('other'); const member = dbFor('member'); const guest = env.unauthenticatedContext().firestore();
const home = uid => ({ name: 'Real household', creatorUid: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const membership = uid => ({ uid, displayName: 'Member', joinedAt: serverTimestamp() });
const device = uid => ({ name: 'Fridge', icon: 'fridge', category: 'Kitchen', location: 'Kitchen', brand: 'Example', model: 'A1', power: '150', powerUnit: 'W', voltage: '220-240', voltageUnit: 'V', frequency: '50/60', frequencyUnit: 'Hz', mode: 'manual', enabled: true, powerOn: false, offline: true, schedules: [], createdBy: uid, updatedBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
async function createAtomic(db, uid, hid, includeDevice = false) { const batch = writeBatch(db); batch.set(doc(db,'households',hid),home(uid)); batch.set(doc(db,'households',hid,'members',uid),membership(uid)); if (includeDevice) batch.set(doc(db,'households',hid,'devices','device-1'),device(uid)); return batch.commit(); }
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('Passed:', name); }
try {
  await test('trial/anonymous cannot read or write household data', async () => { await assertFails(setDoc(doc(guest,'households','guest'),home('guest'))); await assertFails(getDoc(doc(guest,'households','one'))); });
  await test('unverified account cannot create a household', () => assertFails(createAtomic(dbFor('unverified',false),'unverified','unverified')));
  await test('household without initial membership is rejected', () => assertFails(setDoc(doc(creator,'households','orphan'),home('creator'))));
  await test('atomic household, creator membership and initial device succeed', () => assertSucceeds(createAtomic(creator,'creator','one',true)));
  await test('creator can read own household/devices', async () => { await assertSucceeds(getDoc(doc(creator,'households','one'))); await assertSucceeds(getDocs(collection(creator,'households','one','devices'))); });
  await test('other verified user cannot read or write another household', async () => { await assertFails(getDoc(doc(other,'households','one'))); await assertFails(setDoc(doc(other,'households','one','devices','bad'),device('other'))); });
  await test('cannot grant self membership in an existing household', () => assertFails(setDoc(doc(other,'households','one','members','other'),membership('other'))));
  await test('creator cannot add another member in stage one', () => assertFails(setDoc(doc(creator,'households','one','members','other'),membership('other'))));
  await test('cannot spoof creator UID or first membership', async () => { const batch = writeBatch(other); batch.set(doc(other,'households','spoof'),home('creator')); batch.set(doc(other,'households','spoof','members','creator'),membership('creator')); await assertFails(batch.commit()); });
  await test('cannot change creator identity', () => assertFails(updateDoc(doc(creator,'households','one'),{creatorUid:'other',updatedAt:serverTimestamp()})));
  await test('cannot change joined identity or timestamp', () => assertFails(updateDoc(doc(creator,'households','one','members','creator'),{uid:'other'})));
  await test('creator can edit valid confirmed device fields', () => assertSucceeds(updateDoc(doc(creator,'households','one','devices','device-1'),{power:'2.0',powerUnit:'kW',updatedBy:'creator',updatedAt:serverTimestamp()})));
  await test('device ownership and creation timestamps are immutable', async () => { await assertFails(updateDoc(doc(creator,'households','one','devices','device-1'),{createdBy:'other',updatedAt:serverTimestamp()})); await assertFails(updateDoc(doc(creator,'households','one','devices','device-1'),{createdAt:Timestamp.fromMillis(1),updatedAt:serverTimestamp()})); });
  await test('field types and units are validated', async () => { await assertFails(setDoc(doc(creator,'households','one','devices','bad'),{...device('creator'),power:150})); await assertFails(setDoc(doc(creator,'households','one','devices','bad'),{...device('creator'),powerUnit:'kWh'})); await assertFails(setDoc(doc(creator,'households','one','devices','bad'),{...device('creator'),power:'not a reading'})); });
  await test('photos, OCR text and nested image payloads are rejected', async () => { for (const field of ['photoUri','labelPhoto','imageData','recognisedText','ocrText','history']) await assertFails(setDoc(doc(creator,'households','one','devices','bad'),{...device('creator'),[field]:'private'})); await assertFails(setDoc(doc(creator,'households','one','devices','bad'),{...device('creator'),schedules:[{id:'s',days:[1],start:'07:00',end:'08:00',enabled:true,photoUri:'private'}]})); });
  await test('client timestamps and invalid schedules are rejected', async () => { await assertFails(setDoc(doc(creator,'households','one','devices','bad'),{...device('creator'),updatedAt:Timestamp.fromMillis(1)})); await assertFails(setDoc(doc(creator,'households','one','devices','bad'),{...device('creator'),mode:'scheduled',schedules:[]})); });
  await test('private user profile is UID-bound and isolated', async () => { await assertSucceeds(setDoc(doc(creator,'users','creator'),{displayName:'Creator',email:'creator@example.com',activeHouseholdId:'one',createdAt:serverTimestamp(),updatedAt:serverTimestamp()})); await assertFails(getDoc(doc(other,'users','creator'))); await assertFails(setDoc(doc(other,'users','creator'),{displayName:'Other',email:'other@example.com',activeHouseholdId:'one',createdAt:serverTimestamp(),updatedAt:serverTimestamp()})); });
  await test('active household cannot point into a foreign household', () => assertFails(setDoc(doc(other,'users','other'),{displayName:'Other',email:'other@example.com',activeHouseholdId:'one',createdAt:serverTimestamp(),updatedAt:serverTimestamp()})));
  await env.withSecurityRulesDisabled(async context => { await setDoc(doc(context.firestore(),'households','one','members','member'),{uid:'member',displayName:'Existing member',joinedAt:Timestamp.now()}); });
  await test('existing member can read but not manage devices', async () => { await assertSucceeds(getDoc(doc(member,'households','one','devices','device-1'))); await assertFails(updateDoc(doc(member,'households','one','devices','device-1'),{name:'Changed',updatedBy:'member',updatedAt:serverTimestamp()})); await assertFails(deleteDoc(doc(member,'households','one','devices','device-1'))); });
  await test('later-stage sessions, invitations and arbitrary paths are denied', async () => { for (const sub of ['sessions','invitations','notifications','meterPhotos']) await assertFails(setDoc(doc(creator,'households','one',sub,'bad'),{createdBy:'creator'})); await assertFails(setDoc(doc(creator,'public','bad'),{data:'bad'})); });
  await test('creator deletion works', () => assertSucceeds(deleteDoc(doc(creator,'households','one','devices','device-1'))));
  assert(passed >= 21); console.log(`${passed} real Firestore emulator rule tests passed.`);
} finally { await env.cleanup(); }
