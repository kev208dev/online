import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { ActivityIndicator, AppState as NativeAppState, View } from 'react-native';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  addStop, endWait, issueCoupon, moveStop, redeemCoupon, removeStop,
  selectCurrentStore, startWait, toggleVisited, updateOffer,
  updateProfile, type Change, type StoreKey, type StoreProfile,
} from '../domain/demo';
import {
  cancelQueue, joinQueue, processAhead, selectBranch, setQueueCount, verifyEntry,
  type BranchId,
} from '../domain/queue';
import {
  addStop as addLocalStop, expireCoupons, issueCoupon as issueLocalCoupon,
  moveStop as moveLocalStop, redeemCoupon as redeemLocalCoupon, removeStop as removeLocalStop,
  type CommerceChange,
} from '../domain/commerce';
import type { StoreId } from '../data/storeCatalog';
import { notifyQueueAdvance } from '../notifications/reminders';
import { createAppState, createLocalQueueRepository, type AppState } from './queueRepository';
import { adminGate } from './adminCredentials';

const repository = createLocalQueueRepository(AsyncStorage);
type Api = {
  state: AppState;
  now: number;
  ready: boolean;
  admin: { hasPin: boolean; unlocked: boolean };
  setAdminPin: (code: string, pin: string) => Promise<string | undefined>;
  unlockAdmin: (pin: string) => Promise<string | undefined>;
  lockAdmin: () => void;
  join: (branchId: BranchId, leaveAllowed: boolean) => string | undefined;
  selectBranch: (branchId: BranchId) => void;
  setCount: (branchId: BranchId, count: number) => string | undefined;
  advance: (branchId: BranchId) => string | undefined;
  cancel: () => void;
  verifyEntry: (branchId: BranchId, code: string) => string | undefined;
  addLocal: (id: StoreId) => string | undefined;
  removeLocal: (id: StoreId) => void;
  moveLocal: (id: StoreId, delta: -1 | 1) => void;
  issueLocal: (id: StoreId) => CommerceChange;
  redeemLocal: (id: StoreId, code: string) => string | undefined;
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
  const [state, setState] = useState(createAppState);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState({ hasPin: false, unlocked: false });
  const [now, setNow] = useState(Date.now);
  const live = useRef(state);
  const hydrated = useRef(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([repository.load(), adminGate.initialize()]).then(([restored]) => {
      if (!mounted) return;
      live.current = restored;
      setState(restored);
      setAdmin({ hasPin: adminGate.hasPin, unlocked: false });
      hydrated.current = true;
      setReady(true);
    }).catch(() => { hydrated.current = true; setReady(true); });
    const appListener = NativeAppState.addEventListener('change', (status) => {
      if (status === 'active') setNow(Date.now());
      else if (status === 'background') { adminGate.lock(); setAdmin({ hasPin: adminGate.hasPin, unlocked: false }); }
    });
    return () => { mounted = false; appListener.remove(); };
  }, []);

  const replace = useCallback((next: AppState) => {
    live.current = next;
    setState(next);
    setNow(Date.now());
    if (hydrated.current) void repository.save(next).catch(() => {});
  }, []);
  const setAdminPin = useCallback(async (code: string, pin: string) => {
    const reason = await adminGate.setup(code, pin);
    setAdmin({ hasPin: adminGate.hasPin, unlocked: false });
    return reason;
  }, []);
  const unlockAdmin = useCallback(async (pin: string) => {
    const reason = await adminGate.unlock(pin);
    setAdmin({ hasPin: adminGate.hasPin, unlocked: adminGate.unlocked });
    return reason;
  }, []);
  const lockAdmin = useCallback(() => {
    adminGate.lock();
    setAdmin({ hasPin: adminGate.hasPin, unlocked: false });
  }, []);
  const join = useCallback((branchId: BranchId, leaveAllowed: boolean) => {
    const result = joinQueue(live.current.queue, branchId, leaveAllowed, `ONLINE-ENTRY-${randomUUID()}`);
    if (!result.reason) replace({ ...live.current, queue: result.state });
    return result.reason;
  }, [replace]);
  const chooseBranch = useCallback((branchId: BranchId) => replace({ ...live.current, queue: selectBranch(live.current.queue, branchId) }), [replace]);
  const setCount = useCallback((branchId: BranchId, count: number) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    try { replace({ ...live.current, queue: setQueueCount(live.current.queue, branchId, count) }); return undefined; }
    catch (error) { return error instanceof Error ? error.message : '대기 인원을 확인해 주세요'; }
  }, [replace]);
  const advance = useCallback((branchId: BranchId) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    const before = live.current.queue.wait?.peopleAhead;
    const next = processAhead(live.current.queue, branchId);
    replace({ ...live.current, queue: next });
    if (live.current.alertsEnabled) void notifyQueueAdvance(next, before).catch(() => {});
  }, [replace]);
  const cancel = useCallback(() => {
    const waitId = live.current.queue.wait?.id;
    replace({ ...live.current, queue: cancelQueue(live.current.queue), commerce: waitId ? expireCoupons(live.current.commerce, waitId) : live.current.commerce });
  }, [replace]);
  const verifyEntryCode = useCallback((branchId: BranchId, code: string) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    const result = verifyEntry(live.current.queue, branchId, code);
    if (!result.reason) {
      const waitId = live.current.queue.wait?.id;
      replace({ ...live.current, queue: result.state, commerce: waitId ? expireCoupons(live.current.commerce, waitId) : live.current.commerce });
    }
    return result.reason;
  }, [replace]);
  const addLocal = useCallback((id: StoreId) => {
    const result = addLocalStop(live.current.commerce, live.current.queue, id);
    if (!result.reason) replace({ ...live.current, commerce: result.state });
    return result.reason;
  }, [replace]);
  const removeLocal = useCallback((id: StoreId) => replace({ ...live.current, commerce: removeLocalStop(live.current.commerce, id) }), [replace]);
  const moveLocal = useCallback((id: StoreId, delta: -1 | 1) => replace({ ...live.current, commerce: moveLocalStop(live.current.commerce, id, delta) }), [replace]);
  const issueLocal = useCallback((id: StoreId) => {
    const result = issueLocalCoupon(live.current.commerce, live.current.queue, id, `ONLINE-COUPON-${randomUUID()}`);
    if (!result.reason) replace({ ...live.current, commerce: result.state });
    return result;
  }, [replace]);
  const redeemLocal = useCallback((id: StoreId, code: string) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    const result = redeemLocalCoupon(live.current.commerce, id, code);
    if (!result.reason) replace({ ...live.current, commerce: result.state });
    return result.reason;
  }, [replace]);
  const start = useCallback((minutes: number, leaveAllowed: boolean) => {
    try { replace(startWait(live.current, minutes, leaveAllowed) as AppState); return undefined; }
    catch (error) { return error instanceof Error ? error.message : '대기시간을 확인해 주세요'; }
  }, [replace]);
  const finish = useCallback(() => replace(endWait(live.current) as AppState), [replace]);
  const add = useCallback((id: StoreKey) => {
    const result = addStop(live.current, { id });
    if (!result.reason) replace(result.state as AppState);
    return result.reason;
  }, [replace]);
  const remove = useCallback((id: StoreKey) => replace(removeStop(live.current, id) as AppState), [replace]);
  const move = useCallback((id: StoreKey, delta: -1 | 1) => replace(moveStop(live.current, id, delta) as AppState), [replace]);
  const visit = useCallback((id: StoreKey) => replace(toggleVisited(live.current, id) as AppState), [replace]);
  const current = useCallback((id: StoreKey | null) => replace(selectCurrentStore(live.current, id) as AppState), [replace]);
  const issue = useCallback((id: StoreKey) => {
    const result = issueCoupon(live.current, id, `ONLINE-COUPON-${randomUUID()}`);
    if (!result.reason) replace(result.state as AppState);
    return result;
  }, [replace]);
  const redeem = useCallback((id: StoreKey, code: string) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    const result = redeemCoupon(live.current, id, code);
    if (!result.reason) replace(result.state as AppState);
    return result.reason;
  }, [replace]);
  const offer = useCallback((id: StoreKey, title: string, condition: string, enabled: boolean) => {
    if (adminGate.unlocked) replace(updateOffer(live.current, id, title, condition, enabled) as AppState);
  }, [replace]);
  const profile = useCallback((id: StoreKey, value: StoreProfile) => {
    if (adminGate.unlocked) replace(updateProfile(live.current, id, value) as AppState);
  }, [replace]);
  const alerts = useCallback((enabled: boolean) => replace({ ...live.current, alertsEnabled: enabled }), [replace]);
  const reset = useCallback(() => { if (adminGate.unlocked) replace(createAppState()); }, [replace]);
  return <Context.Provider value={{ state, now, ready, admin, setAdminPin, unlockAdmin, lockAdmin, join, selectBranch: chooseBranch, setCount, advance, cancel, verifyEntry: verifyEntryCode, addLocal, removeLocal, moveLocal, issueLocal, redeemLocal, start, finish, add, remove, move, visit, current, issue, redeem, offer, profile, alerts, reset }}>{ready ? children : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#f47738" /></View>}</Context.Provider>;
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error('useDemo needs DemoProvider');
  return value;
}
