import assert from 'node:assert/strict';
import test from 'node:test';
import { createQueueState, joinQueue, selectBranch, setQueueCount } from '../src/domain/queue.ts';
import { STORE_CATALOG, storesForBranch } from '../src/data/storeCatalog.ts';
import { createCommerceState, addStop, issueCoupon, redeemCoupon, expireCoupons } from '../src/domain/commerce.ts';

const now = 1_800_000_000_000;
function waiting(branchId = 'main') {
  const seeded = setQueueCount(createQueueState(), branchId, 2);
  const queue = joinQueue(seeded, branchId, true, `ENTRY-${branchId}`, now).state;
  return { queue, commerce: createCommerceState() };
}

test('each branch has at least two distinct local stores', () => {
  for (const branchId of ['main', 'station', 'dcc', 'lotte']) {
    const stores = storesForBranch(branchId);
    assert.ok(stores.length >= 2, branchId);
    assert.equal(new Set(stores.map((store) => store.id)).size, stores.length);
    assert.ok(stores.every((store) => store.branchId === branchId));
  }
  assert.equal(STORE_CATALOG.ajeossi2, undefined);
});

test('browsing another branch never changes coupon eligibility or planned stores', () => {
  const { queue, commerce } = waiting('main');
  const browsing = selectBranch(queue, 'station');
  assert.equal(issueCoupon(commerce, browsing, 'cafejosun', 'C1', now).reason, '줄서기 지점의 매장을 선택해 주세요');
  assert.equal(addStop(commerce, browsing, 'cafejosun').reason, '줄서기 지점의 매장을 선택해 주세요');
  assert.equal(issueCoupon(commerce, browsing, 'madeby', 'C2', now).reason, undefined);
});

test('coupon issuance, use, expiry and duplicates are confined to active wait and store', () => {
  const { queue, commerce } = waiting();
  const issued = issueCoupon(commerce, queue, 'madeby', 'C1', now);
  assert.equal(issued.reason, undefined);
  assert.equal(issueCoupon(issued.state, queue, 'madeby', 'C2', now).reason, '이미 발급한 쿠폰이 있어요');
  assert.equal(redeemCoupon(issued.state, 'dadareuda', 'C1', now).reason, '다른 매장 쿠폰이에요');
  const used = redeemCoupon(issued.state, 'madeby', 'C1', now);
  assert.equal(used.reason, undefined);
  assert.equal(redeemCoupon(used.state, 'madeby', 'C1', now).reason, '이미 사용한 쿠폰이에요');
  const ended = expireCoupons(issued.state, queue.wait.id, now + 1);
  assert.equal(redeemCoupon(ended, 'madeby', 'C1', now + 2).reason, '유효기간이 지났어요');
});

test('a wait without permission to leave cannot issue a coupon', () => {
  const queue = joinQueue(createQueueState(), 'main', false, 'ENTRY-1', now).state;
  assert.equal(issueCoupon(createCommerceState(), queue, 'madeby', 'C1', now).reason, '현장 대기 규칙을 확인해 주세요');
});
