import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, sendEmailVerification, applyActionCode, reload, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset, updateProfile } from 'firebase/auth';
// Test-only demo ID and dummy key: never production/native configuration.
const projectId = 'demo-household-energy';
const app = initializeApp({ projectId, apiKey: 'demo-key', authDomain: 'localhost' }, 'auth-tests');
const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
try {
  const email = `creator-${Date.now()}@example.com`; const password = 'test-password-123';
  const result = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(result.user, { displayName: 'Creator' });
  assert(!result.user.emailVerified); const uid = result.user.uid;
  await sendEmailVerification(result.user);
  const codes = async () => (await (await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/oobCodes`)).json()).oobCodes;
  const verification = (await codes()).find(code => code.email === email && code.requestType === 'VERIFY_EMAIL'); assert(verification); await applyActionCode(auth,verification.oobCode); await reload(auth.currentUser); assert(auth.currentUser.emailVerified);
  await signOut(auth); assert.equal(auth.currentUser,null); await signInWithEmailAndPassword(auth,email,password); assert.equal(auth.currentUser.uid,uid);
  await sendPasswordResetEmail(auth,email); const reset=(await codes()).find(code=>code.email===email&&code.requestType==='PASSWORD_RESET'); assert.equal(await verifyPasswordResetCode(auth,reset.oobCode),email); await confirmPasswordReset(auth,reset.oobCode,'new-test-password-123'); await signOut(auth); await assert.rejects(signInWithEmailAndPassword(auth,email,password)); await signInWithEmailAndPassword(auth,email,'new-test-password-123'); assert.equal(auth.currentUser.uid,uid);
  console.log('Passed real Auth emulator: registration, display name, verification link, sign-in/out, password recovery and changed-password rejection. Native SDK/signing remain separate checks.');
} finally { await signOut(auth); await deleteApp(app); }
