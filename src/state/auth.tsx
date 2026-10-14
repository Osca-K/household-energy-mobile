import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccountUser, FirebaseBackend } from '@/repositories/contracts';
const modeKey = 'household-energy:storage-mode';
type Authentication = { mode: 'trial' | 'account'; user: AccountUser | null; ready: boolean; busy: boolean; error: string; epoch: number; backend: FirebaseBackend | null; signIn: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string) => Promise<void>; signOut: () => Promise<void>; trial: () => Promise<void>; verify: () => Promise<void>; resend: () => Promise<void>; recover: (email: string) => Promise<void> };
const Context = createContext<Authentication | null>(null);
export function AuthenticationProvider({ children }: PropsWithChildren) {
  const [activeBackend, setActiveBackend] = useState<FirebaseBackend | null>(null); const [mode, setMode] = useState<'trial' | 'account'>('trial'); const [user, setUser] = useState<AccountUser | null>(null); const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [epoch, setEpoch] = useState(0);
  const service = useRef<FirebaseBackend | null>(null); const detach = useRef<(() => void) | undefined>(undefined); const token = useRef(0); const lock = useRef(false); const uid = useRef<string | null>(null); const eventSequence = useRef(0);
  const activate = useCallback(async () => {
    const version = ++token.current; detach.current?.(); detach.current = undefined; setUser(null); uid.current = null; setEpoch(value => value + 1);
    const backend = await (await import('@/services/firebase')).loadFirebase();
    await backend.resetCache(); if (version !== token.current) return backend;
    service.current = backend; setActiveBackend(backend); setMode('account'); await AsyncStorage.setItem(modeKey, 'account');
    detach.current = backend.observe(next => {
      if (version !== token.current) return;
      const sequence = ++eventSequence.current;
      uid.current = next?.uid || null; setUser(null); setEpoch(value => value + 1);
      void backend.resetCache().then(() => { if (version === token.current && sequence === eventSequence.current) { setUser(next); setReady(true); } }).catch(cause => { if (version === token.current) { setError(cause instanceof Error ? cause.message : 'Account cache reset failed.'); setReady(true); } });
    });
    return backend;
  }, []);
  useEffect(() => { let alive = true; AsyncStorage.getItem(modeKey).then(async saved => { if (!alive) return; if (saved === 'account') { try { await activate(); } catch (cause) { if (alive) { setError(cause instanceof Error ? cause.message : 'Account could not be restored.'); setMode('trial'); } } } if (alive) setReady(true); }).catch(() => { if (alive) setReady(true); }); return () => { alive = false; detach.current?.(); }; }, [activate]);
  const run = async (action: () => Promise<void>) => { if (lock.current) throw new Error('An account action is already running.'); lock.current = true; setBusy(true); setError(''); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Account action failed.'); throw cause; } finally { lock.current = false; setBusy(false); } };
  const exit = async () => {
    token.current++; detach.current?.(); detach.current = undefined; setUser(null); uid.current = null; setMode('account'); setEpoch(value => value + 1);
    let cacheError: unknown;
    if (service.current) { try { await service.current.resetCache(); } catch (cause) { cacheError = cause; } await service.current.signOut(); }
    service.current = null; setActiveBackend(null); await AsyncStorage.setItem(modeKey, 'trial'); setMode('trial'); setReady(true);
    if (cacheError) throw cacheError;
  };
  const value: Authentication = {
    mode, user, ready, busy, error, epoch, backend: activeBackend,
    signIn: (email, password) => run(async () => { const backend = await activate(); await backend.signIn(email, password); }),
    register: (name, email, password) => run(async () => { const backend = await activate(); await backend.register(name, email, password); setUser(await backend.refreshVerification()); }),
    signOut: () => run(exit), trial: () => run(async () => { if (service.current || mode === 'account') await exit(); else { await AsyncStorage.setItem(modeKey, 'trial'); setMode('trial'); } }),
    verify: () => run(async () => { if (!service.current) throw new Error('Sign in first.'); setUser(await service.current.refreshVerification()); }),
    resend: () => run(async () => { if (!service.current) throw new Error('Sign in first.'); await service.current.resendVerification(); }),
    recover: email => run(async () => { const backend = await (await import('@/services/firebase')).loadFirebase(); await backend.resetPassword(email); }),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuthentication() { const value = useContext(Context); if (!value) throw new Error('AuthenticationProvider is required'); return value; }
