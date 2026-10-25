import assert from 'node:assert/strict';
import test from 'node:test';
import { createQueueState, joinQueue, processAhead, selectBranch, setQueueCount, verifyEntry } from '../src/domain/queue.ts';
import { addStop, createCommerceState, expireCoupons, issueCoupon, redeemCoupon } from '../src/domain/commerce.ts';

const now = 1_800_000_000_000;

test('full same-device visit and entry flow consumes both QR codes exactly once', () => {
  let queue = setQueueCount(createQueueState(), 'main', 2);
  queue = joinQueue(queue, 'main', true, 'ENTRY-A', now).state;
  let commerce = createCommerceState();
  commerce = addStop(commerce, queue, 'madeby').state;
  assert.deepEqual(commerce.stops, ['madeby']);
  commerce = issueCoupon(commerce, queue, 'madeby', 'COUPON-A', now).state;
  assert.equal(commerce.coupons.length, 1);
  commerce = redeemCoupon(commerce, 'madeby', 'COUPON-A', now + 100).state;
  assert.equal(redeemCoupon(commerce, 'madeby', 'COUPON-A', now + 101).reason, '이미 사용한 쿠폰이에요');

  queue = selectBranch(queue, 'station');
  assert.equal(queue.wait.branchId, 'main');
  assert.equal(verifyEntry(queue, 'main', 'ENTRY-A', now).reason, '아직 입장할 차례가 아니에요');
  queue = processAhead(processAhead(queue, 'main'), 'main');
  assert.equal(queue.wait.peopleAhead, 0);
  queue = verifyEntry(queue, 'main', 'ENTRY-A', now + 200).state;
  commerce = expireCoupons(commerce, queue.wait.id, now + 200);
  assert.equal(queue.wait.status, 'completed');
  assert.equal(verifyEntry(queue, 'main', 'ENTRY-A', now + 201).reason, '이미 인증한 QR이에요');
  assert.equal(commerce.coupons[0].usedAt, now + 100);
});

test('unused coupon expires when entry is verified', () => {
  let queue = setQueueCount(createQueueState(), 'dcc', 1);
  queue = joinQueue(queue, 'dcc', true, 'ENTRY-DCC', now).state;
  const issued = issueCoupon(createCommerceState(), queue, 'cafe042', 'COUPON-DCC', now).state;
  queue = processAhead(queue, 'dcc');
  queue = verifyEntry(queue, 'dcc', 'ENTRY-DCC', now + 100).state;
  const expired = expireCoupons(issued, queue.wait.id, now + 100);
  assert.equal(redeemCoupon(expired, 'cafe042', 'COUPON-DCC', now + 101).reason, '유효기간이 지났어요');
});
