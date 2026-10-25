import { randomUUID } from 'node:crypto';
import { STORE_CATALOG } from '../src/data/storeCatalog.ts';
import {
  cancelQueue, createQueueState, joinQueue, processAhead, setQueueCount, verifyEntry,
  BRANCH_IDS,
} from '../src/domain/queue.ts';
import {
  createCommerceState, expireCoupons, issueCoupon, redeemCoupon,
} from '../src/domain/commerce.ts';

const customerActions = new Set(['join', 'cancel', 'issueCoupon']);
const merchantActions = new Set(['setCount', 'advance', 'verifyEntry', 'redeemCoupon']);

export function createSharedState() {
  return { queue: createQueueState(), commerce: createCommerceState() };
}

export function applyAction(state, role, action, now = Date.now()) {
  const type = action?.type;
  if (!((role === 'customer' && customerActions.has(type)) || (role === 'merchant' && merchantActions.has(type)))) {
    return { state, reason: '이 작업을 사용할 권한이 없어요' };
  }
  if (['join', 'setCount', 'advance', 'verifyEntry'].includes(type) && !BRANCH_IDS.includes(action.branchId)) {
    return { state, reason: '지점을 찾을 수 없어요' };
  }
  if (['issueCoupon', 'redeemCoupon'].includes(type) && !STORE_CATALOG[action.storeId]) {
    return { state, reason: '가게를 찾을 수 없어요' };
  }
  if (type === 'join') {
    if (action.acceptedTerms !== true) return { state, reason: '이용 제한 동의가 필요해요' };
    const result = joinQueue(state.queue, action.branchId, true, `ONLINE-ENTRY-${randomUUID()}`, now);
    return result.reason ? { state, reason: result.reason } : { state: { ...state, queue: result.state } };
  }
  if (type === 'cancel') {
    const waitId = state.queue.wait?.id;
    if (!waitId || state.queue.wait.status !== 'waiting') return { state, reason: '취소할 줄서기가 없어요' };
    const branchId = state.queue.wait.branchId;
    const queue = cancelQueue(state.queue, now);
    return { state: {
      queue,
      commerce: expireCoupons(state.commerce, waitId, now),
    }, result: { restrictedUntil: queue.blockedUntil[branchId] } };
  }
  if (type === 'setCount') {
    try { return { state: { ...state, queue: setQueueCount(state.queue, action.branchId, action.count) } }; }
    catch (error) { return { state, reason: error instanceof Error ? error.message : '대기 인원을 확인해 주세요' }; }
  }
  if (type === 'advance') return { state: { ...state, queue: processAhead(state.queue, action.branchId) } };
  if (type === 'verifyEntry') {
    if (typeof action.code !== 'string') return { state, reason: '인증 코드를 입력해 주세요' };
    const result = verifyEntry(state.queue, action.branchId, action.code, now);
    if (result.reason) return { state, reason: result.reason };
    return { state: {
      queue: result.state,
      commerce: expireCoupons(state.commerce, state.queue.wait.id, now),
    } };
  }
  if (type === 'issueCoupon') {
    const result = issueCoupon(state.commerce, state.queue, action.storeId, `ONLINE-COUPON-${randomUUID()}`, now);
    if (result.reason) return { state, reason: result.reason };
    return { state: { ...state, commerce: result.state }, result: { couponCode: result.state.coupons[0].code } };
  }
  if (typeof action.code !== 'string') return { state, reason: '인증 코드를 입력해 주세요' };
  const result = redeemCoupon(state.commerce, action.storeId, action.code, now);
  return result.reason ? { state, reason: result.reason } : { state: { ...state, commerce: result.state } };
}
