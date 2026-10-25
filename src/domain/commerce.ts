import { STORE_CATALOG, type StoreId } from '../data/storeCatalog.ts';
import type { QueueState } from './queue.ts';

export type LocalCoupon = {
  code: string;
  storeId: StoreId;
  waitId: string;
  title: string;
  condition: string;
  issuedAt: number;
  expiresAt: number;
  usedAt?: number;
};
export type CommerceState = {
  stops: StoreId[];
  visited: StoreId[];
  coupons: LocalCoupon[];
};
export type CommerceChange = { state: CommerceState; reason?: string };
export const COUPON_LIFETIME_MS = 2 * 60 * 60 * 1000;

export function createCommerceState(): CommerceState {
  return { stops: [], visited: [], coupons: [] };
}

function eligibility(queue: QueueState, storeId: StoreId): string | undefined {
  const wait = queue.wait;
  if (!wait || wait.status !== 'waiting') return '먼저 줄서기를 등록해 주세요';
  if (!wait.leaveAllowed) return '현장 대기 규칙을 확인해 주세요';
  if (!STORE_CATALOG[storeId] || STORE_CATALOG[storeId].branchId !== wait.branchId) return '줄서기 지점의 매장을 선택해 주세요';
  if (wait.peopleAhead === 0) return '입장 차례예요';
}

export function addStop(state: CommerceState, queue: QueueState, storeId: StoreId): CommerceChange {
  const reason = eligibility(queue, storeId);
  if (reason) return { state, reason };
  if (state.stops.includes(storeId)) return { state, reason: '이미 일정에 담은 매장이에요' };
  return { state: { ...state, stops: [...state.stops, storeId] } };
}

export function removeStop(state: CommerceState, storeId: StoreId): CommerceState {
  return { ...state, stops: state.stops.filter((id) => id !== storeId), visited: state.visited.filter((id) => id !== storeId) };
}

export function moveStop(state: CommerceState, storeId: StoreId, delta: -1 | 1): CommerceState {
  const index = state.stops.indexOf(storeId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= state.stops.length) return state;
  const stops = [...state.stops];
  [stops[index], stops[target]] = [stops[target], stops[index]];
  return { ...state, stops };
}

export function issueCoupon(state: CommerceState, queue: QueueState, storeId: StoreId, rawCode: string, now = Date.now()): CommerceChange {
  const reason = eligibility(queue, storeId);
  if (reason) return { state, reason };
  const wait = queue.wait!;
  const code = rawCode.trim();
  if (!code || state.coupons.some((coupon) => coupon.code === code)) return { state, reason: '새 인증 코드를 만들어 주세요' };
  if (state.coupons.some((coupon) => coupon.waitId === wait.id && coupon.storeId === storeId)) return { state, reason: '이미 발급한 쿠폰이 있어요' };
  const coupon: LocalCoupon = {
    code, storeId, waitId: wait.id, title: '체험용 방문 쿠폰',
    condition: '앱 내 인증 전용 · 실제 할인 없음', issuedAt: now,
    expiresAt: now + COUPON_LIFETIME_MS,
  };
  return { state: { ...state, coupons: [coupon, ...state.coupons] } };
}

export function redeemCoupon(state: CommerceState, storeId: StoreId, rawCode: string, now = Date.now()): CommerceChange {
  const code = rawCode.trim();
  const coupon = state.coupons.find((item) => item.code === code);
  if (!coupon) return { state, reason: '이 기기에서 발급한 쿠폰이 아니에요' };
  if (coupon.storeId !== storeId) return { state, reason: '다른 매장 쿠폰이에요' };
  if (coupon.usedAt !== undefined) return { state, reason: '이미 사용한 쿠폰이에요' };
  if (now >= coupon.expiresAt) return { state, reason: '유효기간이 지났어요' };
  return { state: { ...state, coupons: state.coupons.map((item) => item.code === code ? { ...item, usedAt: now } : item) } };
}

export function expireCoupons(state: CommerceState, waitId: string, now = Date.now()): CommerceState {
  return { ...state, stops: [], visited: [], coupons: state.coupons.map((coupon) => coupon.waitId === waitId && coupon.usedAt === undefined ? { ...coupon, expiresAt: Math.min(now, coupon.expiresAt) } : coupon) };
}
