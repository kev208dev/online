import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { ActivityIndicator, AppState, View } from 'react-native';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  addStop, createInitialState, endWait, issueCoupon, moveStop, redeemCoupon, removeStop,
  restoreState, selectCurrentStore, serializeState, startWait, toggleVisited, updateOffer,
  updateProfile, type Change, type DemoState, type StoreKey, type StoreProfile,
} from '../domain/demo';
import { syncReminder } from '../notifications/reminders';

const STORAGE_KEY = 'online-demo-v1';
type Api = {
  state: DemoState;
  now: number;
  ready: boolean;
  start: (minutes: number, leaveAllowed: boolean) => string | undefined;
  finish: () => void;
  add: (id: StoreKey) => string | undefined;
  remove: (id: StoreKey) => void;
  move: (id: StoreKey, delta: -1 | 1) => void;
  visit: (id: StoreKey) => void;
  current: (id: StoreKey | null) => void;
  issue: (id: StoreKey) => Change;
  redeem: (id: StoreKey, code: string) => string | undefined;
  offer: (id: StoreKey, title: string, condition: string, enabled: boolean) => void;
  profile: (id: StoreKey, value: StoreProfile) => void;
  alerts: (enabled: boolean) => void;
  reset: () => void;
};
const Context = createContext<Api | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createInitialState);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now);
  const live = useRef(state);
  const hydrated = useRef(false);
  const saveQueue = useRef(Promise.resolve());
  const reminderQueue = useRef(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!mounted) return;
      const restored = restoreState(raw);
      live.current = restored;
      setState(restored);
      hydrated.current = true;
      setReady(true);
    }).catch(() => { hydrated.current = true; setReady(true); });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const appListener = AppState.addEventListener('change', (status) => { if (status === 'active') setNow(Date.now()); });
    return () => { mounted = false; clearInterval(timer); appListener.remove(); };
  }, []);

  const replace = useCallback((next: DemoState) => {
    live.current = next;
    setState(next);
    if (hydrated.current) saveQueue.current = saveQueue.current.then(() => AsyncStorage.setItem(STORAGE_KEY, serializeState(next))).catch(() => {});
  }, []);
  useEffect(() => {
    if (!ready) return;
    reminderQueue.current = reminderQueue.current.then(() => syncReminder(state)).catch(() => {});
  }, [ready, state]);
  const start = useCallback((minutes: number, leaveAllowed: boolean) => {
    try { replace(startWait(live.current, minutes, leaveAllowed)); return undefined; }
    catch (error) { return error instanceof Error ? error.message : '대기시간을 확인해 주세요'; }
  }, [replace]);
  const finish = useCallback(() => replace(endWait(live.current)), [replace]);
  const add = useCallback((id: StoreKey) => {
    const result = addStop(live.current, { id });
    if (!result.reason) replace(result.state);
    return result.reason;
  }, [replace]);
  const remove = useCallback((id: StoreKey) => replace(removeStop(live.current, id)), [replace]);
  const move = useCallback((id: StoreKey, delta: -1 | 1) => replace(moveStop(live.current, id, delta)), [replace]);
  const visit = useCallback((id: StoreKey) => replace(toggleVisited(live.current, id)), [replace]);
  const current = useCallback((id: StoreKey | null) => replace(selectCurrentStore(live.current, id)), [replace]);
  const issue = useCallback((id: StoreKey) => {
    const result = issueCoupon(live.current, id, `ONLINE-DEMO-${randomUUID()}`);
    if (!result.reason) replace(result.state);
    return result;
  }, [replace]);
  const redeem = useCallback((id: StoreKey, code: string) => {
    const result = redeemCoupon(live.current, id, code);
    if (!result.reason) replace(result.state);
    return result.reason;
  }, [replace]);
  const offer = useCallback((id: StoreKey, title: string, condition: string, enabled: boolean) =>
    replace(updateOffer(live.current, id, title, condition, enabled)), [replace]);
  const profile = useCallback((id: StoreKey, value: StoreProfile) => replace(updateProfile(live.current, id, value)), [replace]);
  const alerts = useCallback((enabled: boolean) => replace({ ...live.current, alertsEnabled: enabled }), [replace]);
  const reset = useCallback(() => replace(createInitialState()), [replace]);
  return <Context.Provider value={{ state, now, ready, start, finish, add, remove, move, visit, current, issue, redeem, offer, profile, alerts, reset }}>{ready ? children : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#f47738" /></View>}</Context.Provider>;
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error('useDemo needs DemoProvider');
  return value;
}
