export type StoreKey = 'madeby' | 'redbutton' | 'dadareuda' | 'modif' | 'ajeossi';
export type Offer = { title: string; condition: string; enabled: boolean };
export type StoreProfile = { menu: string; hours: string; address: string };
export type Coupon = { code: string; storeId: StoreKey; waitId: string; title: string; condition: string; issuedAt: number; expiresAt: number; usedAt?: number };
export type WaitSession = { id: string; startedAt: number; endsAt: number; leaveAllowed: boolean };
export type DemoState = { wait: WaitSession | null; stops: StoreKey[]; visited: StoreKey[]; currentStoreId: StoreKey | null; coupons: Coupon[]; offers: Record<StoreKey, Offer>; profiles: Partial<Record<StoreKey, StoreProfile>>; alertsEnabled: boolean };
export type Change = { state: DemoState; reason?: string };

export const STORE_TIMES: Record<StoreKey, { walkMinutes: number; stayMinutes: number }> = {
  madeby: { walkMinutes: 2, stayMinutes: 20 },
  redbutton: { walkMinutes: 3, stayMinutes: 45 },
  dadareuda: { walkMinutes: 4, stayMinutes: 20 },
  modif: { walkMinutes: 5, stayMinutes: 20 },
  ajeossi: { walkMinutes: 5, stayMinutes: 45 },
};
export const STORE_KEYS = Object.keys(STORE_TIMES) as StoreKey[];
export const RETURN_BUFFER_MINUTES = 5;
export const INITIAL_OFFERS: Record<StoreKey, Offer> = {
  madeby: { title: '15% 할인', condition: '1만 원 이상 구매 시 · 시연용', enabled: true },
  redbutton: { title: '추가시간 10분', condition: '이용 시 · 시연용', enabled: true },
  dadareuda: { title: '음료 한 잔 무료', condition: '방문 시 · 시연용', enabled: true },
  modif: { title: '10% 할인', condition: '방문 시 · 시연용', enabled: true },
  ajeossi: { title: '캔 음료 하나 무료', condition: '식사 시 · 시연용', enabled: true },
};

export function createInitialState(): DemoState {
  return { wait: null, stops: [], visited: [], currentStoreId: null, coupons: [], offers: Object.fromEntries(STORE_KEYS.map((id) => [id, { ...INITIAL_OFFERS[id] }])) as Record<StoreKey, Offer>, profiles: {}, alertsEnabled: false };
}

export function startWait(state: DemoState, minutes: number, leaveAllowed: boolean, now = Date.now()): DemoState {
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 360) throw new Error('대기시간은 5~360분으로 입력해 주세요');
  return { ...state, wait: { id: `WAIT-${now}`, startedAt: now, endsAt: now + Math.round(minutes) * 60_000, leaveAllowed }, stops: [], visited: [], currentStoreId: null };
}

export function waitRemaining(state: DemoState, now = Date.now()): number {
  return state.wait ? Math.max(0, Math.ceil((state.wait.endsAt - now) / 60_000)) : 0;
}

export function itineraryBudget(stops: StoreKey[]): number {
  if (!stops.length) return 0;
  // Conservative demo estimate: return to anchor before each next store.
  return stops.reduce((sum, id) => sum + STORE_TIMES[id].walkMinutes * 2 + STORE_TIMES[id].stayMinutes, RETURN_BUFFER_MINUTES);
}
export function reminderAt(state: DemoState): number | null {
  if (!state.wait) return null;
  const travel = state.currentStoreId ? STORE_TIMES[state.currentStoreId].walkMinutes
    : Math.max(0, ...state.stops.filter((id) => !state.visited.includes(id)).map((id) => STORE_TIMES[id].walkMinutes));
  return state.wait.endsAt - (travel + RETURN_BUFFER_MINUTES) * 60_000;
}
export function returnGuidance(state: DemoState, now = Date.now()): 'none' | 'return-now' | 'expired' {
  if (!state.wait) return 'none';
  if (now >= state.wait.endsAt) return 'expired';
  const time = reminderAt(state);
  return state.wait.leaveAllowed && time !== null && now >= time ? 'return-now' : 'none';
}

function eligibility(state: DemoState, now: number): string | undefined {
  if (!state.wait) return '먼저 대기시간을 등록해 주세요';
  if (!state.wait.leaveAllowed) return '외출 가능 여부를 먼저 확인해 주세요';
  if (waitRemaining(state, now) === 0) return '예상 대기시간이 끝났어요';
}
export function eligibleStores(state: DemoState, now = Date.now()): StoreKey[] {
  if (eligibility(state, now)) return [];
  const remainingStops = state.stops.filter((id) => !state.visited.includes(id));
  const left = waitRemaining(state, now);
  return STORE_KEYS.filter((id) => !state.stops.includes(id) && itineraryBudget([...remainingStops, id]) <= left);
}

export function addStop(state: DemoState, stop: { id: StoreKey; walkMinutes?: number; stayMinutes?: number }, now = Date.now()): Change {
  const reason = eligibility(state, now);
  if (reason) return { state, reason };
  if (state.stops.includes(stop.id)) return { state, reason: '이미 일정에 담은 매장이에요' };
  const next = [...state.stops, stop.id];
  if (itineraryBudget(next.filter((id) => !state.visited.includes(id))) > waitRemaining(state, now)) return { state, reason: '남은 대기시간에 비해 방문 일정이 길어요' };
  return { state: { ...state, stops: next } };
}
export function removeStop(state: DemoState, id: StoreKey): DemoState {
  return { ...state, stops: state.stops.filter((value) => value !== id), visited: state.visited.filter((value) => value !== id), currentStoreId: state.currentStoreId === id ? null : state.currentStoreId };
}
export function moveStop(state: DemoState, id: StoreKey, delta: -1 | 1): DemoState {
  const index = state.stops.indexOf(id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= state.stops.length) return state;
  const stops = [...state.stops];
  [stops[index], stops[target]] = [stops[target], stops[index]];
  return { ...state, stops };
}
export function toggleVisited(state: DemoState, id: StoreKey): DemoState {
  if (!state.stops.includes(id)) return state;
  return { ...state, visited: state.visited.includes(id) ? state.visited.filter((value) => value !== id) : [...state.visited, id] };
}
export function selectCurrentStore(state: DemoState, id: StoreKey | null): DemoState {
  if (id !== null && !state.stops.includes(id)) return state;
  return { ...state, currentStoreId: id };
}

export function issueCoupon(state: DemoState, id: StoreKey, code: string, now = Date.now()): Change {
  const reason = eligibility(state, now);
  if (reason) return { state, reason };
  if (!STORE_KEYS.includes(id)) return { state, reason: '매장을 찾을 수 없어요' };
  if (!state.offers[id]?.enabled) return { state, reason: '현재 발급할 수 없는 혜택이에요' };
  if (state.coupons.some((coupon) => coupon.waitId === state.wait!.id && coupon.storeId === id))
    return { state, reason: '이미 발급한 쿠폰이 있어요' };
  if (STORE_TIMES[id].walkMinutes * 2 + RETURN_BUFFER_MINUTES > waitRemaining(state, now))
    return { state, reason: '매장에 다녀올 시간이 부족해요' };
  const offer = state.offers[id];
  const coupon: Coupon = { code, storeId: id, waitId: state.wait!.id, title: offer.title, condition: offer.condition, issuedAt: now, expiresAt: state.wait!.endsAt };
  return { state: { ...state, coupons: [coupon, ...state.coupons] } };
}

export function redeemCoupon(state: DemoState, storeId: StoreKey, rawCode: string, now = Date.now()): Change {
  const code = rawCode.trim();
  const coupon = state.coupons.find((value) => value.code === code);
  if (!coupon) return { state, reason: '이 기기에서 발급한 쿠폰이 아니에요' };
  if (coupon.storeId !== storeId) return { state, reason: '다른 매장 쿠폰이에요' };
  if (coupon.usedAt !== undefined) return { state, reason: '이미 사용한 쿠폰이에요' };
  if (now >= coupon.expiresAt) return { state, reason: '유효기간이 지났어요' };
  return { state: { ...state, coupons: state.coupons.map((value) => value.code === code ? { ...value, usedAt: now } : value) } };
}
export function updateOffer(state: DemoState, id: StoreKey, title: string, condition: string, enabled: boolean): DemoState {
  return { ...state, offers: { ...state.offers, [id]: { title: title.trim(), condition: condition.trim(), enabled } } };
}
export function updateProfile(state: DemoState, id: StoreKey, profile: StoreProfile): DemoState {
  return { ...state, profiles: { ...state.profiles, [id]: { menu: profile.menu.trim(), hours: profile.hours.trim(), address: profile.address.trim() } } };
}
export function endWait(state: DemoState, now = Date.now()): DemoState {
  const coupons = state.coupons.map((coupon) => coupon.waitId === state.wait?.id && coupon.usedAt === undefined
    ? { ...coupon, expiresAt: Math.min(coupon.expiresAt, now) } : coupon);
  return { ...state, wait: null, stops: [], visited: [], currentStoreId: null, coupons };
}
export function restoreState(raw: string | null): DemoState {
  if (!raw) return createInitialState();
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !Array.isArray(value?.state?.coupons) || !Array.isArray(value?.state?.stops)) return createInitialState();
    const state = value.state as DemoState;
    const stops = state.stops.filter((id) => STORE_KEYS.includes(id));
    return { ...createInitialState(), ...state, offers: { ...INITIAL_OFFERS, ...state.offers }, profiles: state.profiles ?? {}, stops, currentStoreId: state.currentStoreId && stops.includes(state.currentStoreId) ? state.currentStoreId : null };
  } catch { return createInitialState(); }
}
export function serializeState(state: DemoState): string {
  return JSON.stringify({ version: 1, state });
}
