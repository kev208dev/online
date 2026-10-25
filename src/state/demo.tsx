import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { ActivityIndicator, AppState as NativeAppState, View } from 'react-native';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  cancelQueue, createQueueState, joinQueue, processAhead, selectBranch, setQueueCount, verifyEntry,
  type BranchId,
} from '../domain/queue';
import {
  createCommerceState, expireCoupons, issueCoupon as issueLocalCoupon, redeemCoupon as redeemLocalCoupon,
  type CommerceChange,
} from '../domain/commerce';
import type { StoreId } from '../data/storeCatalog';
import { notifyQueueAdvance } from '../notifications/reminders';
import { createAppState, createLocalQueueRepository, type AppState } from './queueRepository';
import { adminGate } from './adminCredentials';
import { createLanClient, LanError, pairLan, type LanAction, type LanRole, type LanSession, type LanState } from './lanClient';
import { lanSessionStore } from './lanSessionNative';
import { mergeLanSnapshot, performLanAction } from './sharedMode';

const repository = createLocalQueueRepository(AsyncStorage);
type Connection = { mode: 'local' | LanRole; status: 'local' | 'connecting' | 'connected' | 'offline' | 'revoked' };
const emptyShared = (): LanState => ({ queue: createQueueState(), commerce: createCommerceState() });
type Api = {
  state: AppState;
  now: number;
  ready: boolean;
  admin: { hasPin: boolean; unlocked: boolean };
  connection: Connection;
  connectCustomer: (baseUrl: string, code: string) => Promise<string | undefined>;
  connectMerchant: (baseUrl: string, code: string) => Promise<string | undefined>;
  disconnectLan: () => Promise<string | undefined>;
  setAdminPin: (code: string, pin: string) => Promise<string | undefined>;
  unlockAdmin: (pin: string) => Promise<string | undefined>;
  lockAdmin: () => void;
  join: (branchId: BranchId, leaveAllowed: boolean) => Promise<string | undefined>;
  joinSelected: (leaveAllowed: boolean) => Promise<string | undefined>;
  selectBranch: (branchId: BranchId) => void;
  setCount: (branchId: BranchId, count: number) => Promise<string | undefined>;
  advance: (branchId: BranchId) => Promise<string | undefined>;
  cancel: () => Promise<string | undefined>;
  verifyEntry: (branchId: BranchId, code: string) => Promise<string | undefined>;
  issueLocal: (id: StoreId) => Promise<CommerceChange & { couponCode?: string }>;
  redeemLocal: (id: StoreId, code: string) => Promise<string | undefined>;
  alerts: (enabled: boolean) => void;
  reset: () => void;
};
const Context = createContext<Api | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createAppState);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState({ hasPin: false, unlocked: false });
  const [connection, setConnection] = useState<Connection>({ mode: 'local', status: 'local' });
  const [now, setNow] = useState(Date.now);
  const live = useRef(state);
  const local = useRef(state);
  const remote = useRef<LanState | null>(null);
  const session = useRef<LanSession | null>(null);
  const client = useRef<ReturnType<typeof createLanClient> | null>(null);
  const connectionRef = useRef<Connection>({ mode: 'local', status: 'local' });
  const hydrated = useRef(false);
  const foreground = useRef(true);
  const polling = useRef(false);
  const requestEpoch = useRef(0);

  const link = useCallback((next: Connection) => {
    connectionRef.current = next;
    setConnection(next);
  }, []);
  const present = useCallback((next: AppState) => {
    live.current = next;
    setState(next);
    setNow(Date.now());
  }, []);
  const receiveRemote = useCallback((snapshot: LanState) => {
    remote.current = snapshot;
    present(mergeLanSnapshot(local.current, snapshot));
    const mode = connectionRef.current.mode;
    if (mode !== 'local') link({ mode, status: 'connected' });
  }, [link, present]);
  const noteConnectionError = useCallback((error: unknown) => {
    const mode = connectionRef.current.mode;
    if (mode === 'local') return;
    link({ mode, status: error instanceof LanError && error.code === 'unauthorized' ? 'revoked' : 'offline' });
  }, [link]);
  const replaceDevice = useCallback((next: AppState) => {
    local.current = next;
    present(connectionRef.current.mode === 'local' ? next : mergeLanSnapshot(next, remote.current ?? emptyShared()));
    if (hydrated.current) void repository.save(next).catch(() => {});
  }, [present]);

  useEffect(() => {
    let mounted = true;
    Promise.all([repository.load(), adminGate.initialize(), lanSessionStore.load()]).then(async ([restored, , saved]) => {
      if (!mounted) return;
      local.current = restored;
      setAdmin({ hasPin: adminGate.hasPin, unlocked: false });
      if (saved) {
        session.current = saved;
        client.current = createLanClient(saved.baseUrl, saved.token);
        link({ mode: saved.role, status: 'connecting' });
        present(mergeLanSnapshot(restored, emptyShared()));
        try {
          const response = await client.current.read();
          if (mounted) receiveRemote(response.state);
        } catch (error) { if (mounted) noteConnectionError(error); }
      } else present(restored);
      if (mounted) { hydrated.current = true; setReady(true); }
    }).catch(() => {
      if (!mounted) return;
      // Secure storage failures must not silently show old local queue data.
      link({ mode: 'customer', status: 'offline' });
      present(mergeLanSnapshot(createAppState(), emptyShared()));
      hydrated.current = true;
      setReady(true);
    });
    return () => { mounted = false; };
  }, [link, noteConnectionError, present, receiveRemote]);

  useEffect(() => {
    const listener = NativeAppState.addEventListener('change', (status) => {
      foreground.current = status === 'active';
      if (status === 'active') setNow(Date.now());
      else if (status === 'background') { adminGate.lock(); setAdmin({ hasPin: adminGate.hasPin, unlocked: false }); }
    });
    const interval = setInterval(() => {
      const current = client.current;
      if (!hydrated.current || !foreground.current || !current || polling.current) return;
      polling.current = true;
      const epoch = requestEpoch.current;
      void current.read().then((response) => { if (client.current === current && requestEpoch.current === epoch) receiveRemote(response.state); })
        .catch((error) => { if (client.current === current && requestEpoch.current === epoch) noteConnectionError(error); })
        .finally(() => { polling.current = false; });
    }, 1000);
    return () => { listener.remove(); clearInterval(interval); };
  }, [noteConnectionError, receiveRemote]);

  const connect = useCallback(async (role: LanRole, baseUrl: string, code: string): Promise<string | undefined> => {
    if (connectionRef.current.mode !== 'local') return '기존 연결을 먼저 해제해 주세요';
    try {
      const paired = await pairLan(baseUrl, code, fetch, 5000, role);
      if (paired.role !== role) return '선택한 역할의 연결 코드를 입력해 주세요';
      const saved: LanSession = { baseUrl, token: paired.token, role };
      await lanSessionStore.save(saved);
      requestEpoch.current++;
      session.current = saved;
      client.current = createLanClient(baseUrl, saved.token);
      link({ mode: role, status: 'connected' });
      receiveRemote(paired.state);
    } catch (error) { return error instanceof Error ? error.message : 'Mac 연결을 확인해 주세요'; }
  }, [link, receiveRemote]);
  const disconnectLan = useCallback(async () => {
    try { await lanSessionStore.clear(); }
    catch { return '연결 정보를 삭제하지 못했어요'; }
    requestEpoch.current++;
    session.current = null;
    client.current = null;
    remote.current = null;
    link({ mode: 'local', status: 'local' });
    present(local.current);
    return undefined;
  }, [link, present]);
  const sharedAction = useCallback(async (action: LanAction) => {
    const current = client.current;
    if (!current || connectionRef.current.status === 'revoked') return { reason: '연결이 만료됐어요. 다시 연결해 주세요' };
    const epoch = ++requestEpoch.current;
    const result = await performLanAction(current, connectionRef.current.status === 'connected', action, (snapshot) => {
      if (client.current === current && requestEpoch.current === epoch) receiveRemote(snapshot);
    });
    if (client.current === current && requestEpoch.current === epoch && (result.failureCode === 'offline' || result.failureCode === 'unauthorized')) noteConnectionError(new LanError(result.reason ?? '', result.failureCode));
    return result;
  }, [noteConnectionError, receiveRemote]);
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
  const join = useCallback(async (branchId: BranchId, leaveAllowed: boolean) => {
    if (!leaveAllowed) return '이용 제한 동의가 필요해요';
    if (connectionRef.current.mode !== 'local') {
      if (connectionRef.current.mode !== 'customer') return '고객폰에서 줄서기해 주세요';
      return (await sharedAction({ type: 'join', branchId, acceptedTerms: true })).reason;
    }
    const result = joinQueue(local.current.queue, branchId, true, `ONLINE-ENTRY-${randomUUID()}`);
    if (!result.reason) replaceDevice({ ...local.current, queue: result.state });
    return result.reason;
  }, [replaceDevice, sharedAction]);
  const joinSelected = useCallback((leaveAllowed: boolean) => join(live.current.queue.selectedBranchId, leaveAllowed), [join]);
  const chooseBranch = useCallback((branchId: BranchId) => replaceDevice({ ...local.current, queue: selectBranch(local.current.queue, branchId) }), [replaceDevice]);
  const setCount = useCallback(async (branchId: BranchId, count: number) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    if (connectionRef.current.mode !== 'local') {
      if (connectionRef.current.mode !== 'merchant') return '매장폰에서 관리해 주세요';
      return (await sharedAction({ type: 'setCount', branchId, count })).reason;
    }
    try { replaceDevice({ ...local.current, queue: setQueueCount(local.current.queue, branchId, count) }); return undefined; }
    catch (error) { return error instanceof Error ? error.message : '대기 인원을 확인해 주세요'; }
  }, [replaceDevice, sharedAction]);
  const advance = useCallback(async (branchId: BranchId) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    if (connectionRef.current.mode !== 'local') {
      if (connectionRef.current.mode !== 'merchant') return '매장폰에서 관리해 주세요';
      return (await sharedAction({ type: 'advance', branchId })).reason;
    }
    const before = local.current.queue.wait?.peopleAhead;
    const next = processAhead(local.current.queue, branchId);
    replaceDevice({ ...local.current, queue: next });
    if (local.current.alertsEnabled) void notifyQueueAdvance(next, before).catch(() => {});
    return undefined;
  }, [replaceDevice, sharedAction]);
  const cancel = useCallback(async () => {
    if (connectionRef.current.mode !== 'local') {
      if (connectionRef.current.mode !== 'customer') return '고객폰에서 취소해 주세요';
      return (await sharedAction({ type: 'cancel' })).reason;
    }
    const waitId = local.current.queue.wait?.id;
    replaceDevice({ ...local.current, queue: cancelQueue(local.current.queue), commerce: waitId ? expireCoupons(local.current.commerce, waitId) : local.current.commerce });
    return undefined;
  }, [replaceDevice, sharedAction]);
  const verifyEntryCode = useCallback(async (branchId: BranchId, code: string) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    if (connectionRef.current.mode !== 'local') {
      if (connectionRef.current.mode !== 'merchant') return '매장폰에서 인증해 주세요';
      return (await sharedAction({ type: 'verifyEntry', branchId, code })).reason;
    }
    const result = verifyEntry(local.current.queue, branchId, code);
    if (!result.reason) {
      const waitId = local.current.queue.wait?.id;
      replaceDevice({ ...local.current, queue: result.state, commerce: waitId ? expireCoupons(local.current.commerce, waitId) : local.current.commerce });
    }
    return result.reason;
  }, [replaceDevice, sharedAction]);
  const issueLocal = useCallback(async (id: StoreId): Promise<CommerceChange & { couponCode?: string }> => {
    if (connectionRef.current.mode !== 'local') {
      if (connectionRef.current.mode !== 'customer') return { state: live.current.commerce, reason: '고객폰에서 쿠폰을 발급해 주세요' };
      const result = await sharedAction({ type: 'issueCoupon', storeId: id });
      return { state: live.current.commerce, reason: result.reason, couponCode: result.result?.couponCode };
    }
    const result = issueLocalCoupon(local.current.commerce, local.current.queue, id, `ONLINE-COUPON-${randomUUID()}`);
    if (!result.reason) replaceDevice({ ...local.current, commerce: result.state });
    return result;
  }, [replaceDevice, sharedAction]);
  const redeemLocal = useCallback(async (id: StoreId, code: string) => {
    if (!adminGate.unlocked) return '관리자 잠금을 해제해 주세요';
    if (connectionRef.current.mode !== 'local') {
      if (connectionRef.current.mode !== 'merchant') return '매장폰에서 인증해 주세요';
      return (await sharedAction({ type: 'redeemCoupon', storeId: id, code })).reason;
    }
    const result = redeemLocalCoupon(local.current.commerce, id, code);
    if (!result.reason) replaceDevice({ ...local.current, commerce: result.state });
    return result.reason;
  }, [replaceDevice, sharedAction]);
  const alerts = useCallback((enabled: boolean) => replaceDevice({ ...local.current, alertsEnabled: enabled }), [replaceDevice]);
  const reset = useCallback(() => { if (adminGate.unlocked && connectionRef.current.mode === 'local') replaceDevice(createAppState()); }, [replaceDevice]);
  return <Context.Provider value={{ state, now, ready, admin, connection, connectCustomer: (baseUrl, code) => connect('customer', baseUrl, code), connectMerchant: (baseUrl, code) => connect('merchant', baseUrl, code), disconnectLan, setAdminPin, unlockAdmin, lockAdmin, join, joinSelected, selectBranch: chooseBranch, setCount, advance, cancel, verifyEntry: verifyEntryCode, issueLocal, redeemLocal, alerts, reset }}>{ready ? children : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#f47738" /></View>}</Context.Provider>;
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error('useDemo needs DemoProvider');
  return value;
}
