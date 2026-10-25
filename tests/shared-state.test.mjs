import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, createSharedState } from '../server/sharedState.mjs';

function act(state, role, action, now = 1000) {
  const result = applyAction(state, role, action, now);
  assert.equal(result.reason, undefined);
  return result;
}

test('customer registration and merchant progress lead to one-time entry', () => {
  let state = createSharedState();
  state = act(state, 'merchant', { type: 'setCount', branchId: 'main', count: 2 }).state;
  state = act(state, 'customer', { type: 'join', branchId: 'main', acceptedTerms: true }).state;
  assert.equal(state.queue.wait.ticketNumber, 1);
  assert.equal(state.queue.wait.peopleAhead, 2);
  const code = state.queue.wait.entryCode;
  assert.equal(applyAction(state, 'merchant', { type: 'verifyEntry', branchId: 'main', code }, 1001).reason, '아직 입장할 차례가 아니에요');
  state = act(state, 'merchant', { type: 'advance', branchId: 'main' }).state;
  state = act(state, 'merchant', { type: 'advance', branchId: 'main' }).state;
  assert.equal(state.queue.wait.peopleAhead, 0);
  state = act(state, 'merchant', { type: 'verifyEntry', branchId: 'main', code }, 1002).state;
  assert.equal(state.queue.wait.status, 'completed');
  assert.equal(applyAction(state, 'merchant', { type: 'verifyEntry', branchId: 'main', code }, 1003).reason, '이미 인증한 QR이에요');
});

test('coupon is scoped to the joined branch and can only be redeemed once', () => {
  let state = createSharedState();
  state = act(state, 'merchant', { type: 'setCount', branchId: 'main', count: 3 }).state;
  state = act(state, 'customer', { type: 'join', branchId: 'main', acceptedTerms: true }).state;
  assert.equal(applyAction(state, 'customer', { type: 'issueCoupon', storeId: 'cafe042' }).reason, '줄서기 지점의 매장을 선택해 주세요');
  const issued = act(state, 'customer', { type: 'issueCoupon', storeId: 'madeby' });
  state = issued.state;
  assert.match(issued.result.couponCode, /^ONLINE-COUPON-/);
  assert.equal(applyAction(state, 'merchant', { type: 'redeemCoupon', storeId: 'cafe042', code: issued.result.couponCode }).reason, '다른 매장 쿠폰이에요');
  state = act(state, 'merchant', { type: 'redeemCoupon', storeId: 'madeby', code: issued.result.couponCode }).state;
  assert.equal(applyAction(state, 'merchant', { type: 'redeemCoupon', storeId: 'madeby', code: issued.result.couponCode }).reason, '이미 사용한 쿠폰이에요');
});

test('manual total edits preserve issued ticket and people ahead, and counters stay branch-specific', () => {
  let state = createSharedState();
  state = act(state, 'merchant', { type: 'setCount', branchId: 'main', count: 25 }).state;
  state = act(state, 'customer', { type: 'join', branchId: 'main', acceptedTerms: true }).state;
  state = act(state, 'merchant', { type: 'setCount', branchId: 'main', count: 0 }).state;
  assert.deepEqual([state.queue.wait.ticketNumber, state.queue.wait.peopleAhead, state.queue.nextTicketNumbers.main], [1, 25, 2]);
  state = act(state, 'merchant', { type: 'advance', branchId: 'main' }).state;
  assert.equal(state.queue.wait.peopleAhead, 24);
  assert.equal(state.queue.queueCounts.main, 0);
  assert.equal(state.queue.nextTicketNumbers.station, 1);
  assert.equal(state.queue.selectedBranchId, 'main');
});

test('unconsented joins, unauthorized actions, and malformed branch/store inputs do not mutate state', () => {
  const state = createSharedState();
  for (const [role, action] of [
    ['customer', { type: 'join', branchId: 'main', acceptedTerms: false }],
    ['merchant', { type: 'join', branchId: 'main', acceptedTerms: true }],
    ['customer', { type: 'setCount', branchId: 'main', count: 10 }],
    ['customer', { type: 'join', branchId: 'bogus', acceptedTerms: true }],
    ['customer', { type: 'issueCoupon', storeId: 'bogus' }],
  ]) {
    const result = applyAction(state, role, action);
    assert.ok(result.reason);
    assert.equal(result.state, state);
  }
});

test('shared cancellation restricts only the cancelled branch for three months', () => {
  const cancelledAt = Date.UTC(2026, 0, 31, 12);
  let state = act(createSharedState(), 'customer', { type: 'join', branchId: 'main', acceptedTerms: true }, cancelledAt - 1).state;
  const cancelled = act(state, 'customer', { type: 'cancel' }, cancelledAt);
  state = cancelled.state;
  assert.equal(state.queue.blockedUntil.main, Date.UTC(2026, 3, 30, 12));
  assert.equal(cancelled.result?.restrictedUntil, Date.UTC(2026, 3, 30, 12));
  const denied = applyAction(state, 'customer', { type: 'join', branchId: 'main', acceptedTerms: true }, cancelledAt + 1);
  assert.match(denied.reason, /3개월/);
  assert.equal(denied.state, state);
  assert.equal(act(state, 'customer', { type: 'join', branchId: 'dcc', acceptedTerms: true }, cancelledAt + 1).state.queue.wait.branchId, 'dcc');
});
