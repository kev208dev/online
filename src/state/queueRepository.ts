import { createInitialState, INITIAL_OFFERS, STORE_KEYS, type DemoState } from '../domain/demo.ts';
import { BRANCH_IDS, createQueueState, type BranchId, type QueueState, type WaitSession } from '../domain/queue.ts';
import { createCommerceState, type CommerceState } from '../domain/commerce.ts';
import { STORE_IDS, type StoreId } from '../data/storeCatalog.ts';

export type AppState = DemoState & { queue: QueueState; commerce: CommerceState };
export type QueueRepository = {
  load: () => Promise<AppState>;
  save: (state: AppState) => Promise<void>;
};
export type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const V1_KEY = 'online-demo-v1';
const V2_KEY = 'online-queue-v2';

export function createAppState(): AppState {
  return { ...createInitialState(), wait: null, queue: createQueueState(), commerce: createCommerceState() };
}

function restoreCommerce(value: unknown): CommerceState {
  const initial = createCommerceState();
  if (!value || typeof value !== 'object') return initial;
  const raw = value as Partial<CommerceState>;
  const validStore = (id: unknown): id is StoreId => typeof id === 'string' && (STORE_IDS as string[]).includes(id);
  const stops = Array.isArray(raw.stops) ? raw.stops.filter(validStore) : [];
  return {
    stops,
    visited: Array.isArray(raw.visited) ? raw.visited.filter((id): id is StoreId => validStore(id) && stops.includes(id)) : [],
    coupons: Array.isArray(raw.coupons) ? raw.coupons.filter((coupon) => coupon && validStore(coupon.storeId) && typeof coupon.code === 'string' && typeof coupon.waitId === 'string' && Number.isFinite(coupon.expiresAt)) : [],
  };
}

function isBranchId(value: unknown): value is BranchId {
  return typeof value === 'string' && (BRANCH_IDS as readonly string[]).includes(value);
}

function nonNegative(value: unknown, fallback: number): number {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : fallback;
}

function restoreQueue(value: unknown): QueueState {
  const initial = createQueueState();
  if (!value || typeof value !== 'object') return initial;
  const raw = value as Partial<QueueState>;
  const queueCounts = { ...initial.queueCounts };
  const nextTicketNumbers = { ...initial.nextTicketNumbers };
  for (const id of BRANCH_IDS) {
    queueCounts[id] = nonNegative(raw.queueCounts?.[id], 0);
    nextTicketNumbers[id] = Math.max(1, nonNegative(raw.nextTicketNumbers?.[id], 1));
  }
  const candidate = raw.wait as Partial<WaitSession> | null | undefined;
  const wait = candidate && isBranchId(candidate.branchId)
    && (candidate.status === 'waiting' || candidate.status === 'completed')
    && Number.isSafeInteger(candidate.ticketNumber) && (candidate.ticketNumber as number) >= 1
    && Number.isSafeInteger(candidate.peopleAhead) && (candidate.peopleAhead as number) >= 0
    && typeof candidate.entryCode === 'string' && candidate.entryCode.length > 0
    && typeof candidate.id === 'string' && typeof candidate.startedAt === 'number'
    ? candidate as WaitSession : null;
  return {
    selectedBranchId: isBranchId(raw.selectedBranchId) ? raw.selectedBranchId : 'main',
    queueCounts,
    nextTicketNumbers,
    wait,
    usedEntryCodes: Array.isArray(raw.usedEntryCodes) ? raw.usedEntryCodes.filter((code): code is string => typeof code === 'string') : [],
  };
}

export function restoreAppState(raw: string | null, now = Date.now()): AppState {
  const initial = createAppState();
  if (!raw) return initial;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 && parsed?.version !== 2) return initial;
    const saved = parsed.state;
    if (!saved || typeof saved !== 'object') return initial;
    const oldVersion = parsed.version === 1;
    const coupons = Array.isArray(saved.coupons) ? saved.coupons.map((coupon: DemoState['coupons'][number]) => oldVersion && coupon?.usedAt === undefined
      ? { ...coupon, expiresAt: Math.min(nonNegative(coupon?.expiresAt, now), now) } : coupon) : [];
    const commerce = oldVersion ? createCommerceState() : restoreCommerce(saved.commerce);
    const existingCodes = new Set(commerce.coupons.map((coupon) => coupon.code));
    const previousCoupons = coupons.flatMap((coupon: DemoState['coupons'][number]) => {
      if (!coupon || !STORE_KEYS.includes(coupon.storeId) || typeof coupon.code !== 'string' || !coupon.code
        || typeof coupon.waitId !== 'string' || existingCodes.has(coupon.code)) return [];
      const usedAt = nonNegative(coupon.usedAt, -1);
      const expiry = nonNegative(coupon.expiresAt, now);
      existingCodes.add(coupon.code);
      return [{
        code: coupon.code, storeId: coupon.storeId, waitId: coupon.waitId,
        title: '이전 체험 쿠폰', condition: '이전 앱 내 기록 · 실제 할인 없음',
        issuedAt: nonNegative(coupon.issuedAt, now),
        expiresAt: usedAt >= 0 ? expiry : Math.min(expiry, now),
        ...(usedAt >= 0 ? { usedAt } : {}),
      }];
    });
    const stops = oldVersion ? [] : Array.isArray(saved.stops) ? saved.stops.filter((id: unknown) => STORE_KEYS.includes(id as DemoState['stops'][number])) : [];
    return {
      ...initial,
      coupons,
      offers: { ...INITIAL_OFFERS, ...(saved.offers && typeof saved.offers === 'object' ? saved.offers : {}) },
      profiles: saved.profiles && typeof saved.profiles === 'object' ? saved.profiles : {},
      alertsEnabled: saved.alertsEnabled === true,
      stops,
      visited: oldVersion ? [] : Array.isArray(saved.visited) ? saved.visited.filter((id: unknown) => stops.includes(id)) : [],
      currentStoreId: oldVersion ? null : stops.includes(saved.currentStoreId) ? saved.currentStoreId : null,
      queue: oldVersion ? createQueueState() : restoreQueue(saved.queue),
      commerce: { ...commerce, coupons: [...commerce.coupons, ...previousCoupons] },
    };
  } catch {
    return initial;
  }
}

export function serializeAppState(state: AppState): string {
  return JSON.stringify({ version: 2, state: { ...state, wait: null } });
}

export function createLocalQueueRepository(storage: KeyValueStorage, clock = Date.now): QueueRepository {
  let writeQueue = Promise.resolve();
  return {
    async load() {
      const current = await storage.getItem(V2_KEY);
      return restoreAppState(current ?? await storage.getItem(V1_KEY), clock());
    },
    save(state) {
      const serialized = serializeAppState(state);
      writeQueue = writeQueue.catch(() => {}).then(() => storage.setItem(V2_KEY, serialized));
      return writeQueue;
    },
  };
}
