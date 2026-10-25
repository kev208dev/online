import assert from 'node:assert/strict';
import test from 'node:test';
import { STORE_CATALOG, STORE_IDS } from '../src/data/storeCatalog.ts';
import { issueCoupon, createCommerceState } from '../src/domain/commerce.ts';
import { createQueueState, joinQueue, setQueueCount } from '../src/domain/queue.ts';

test('every displayed store has a specific, clearly illustrative benefit', () => {
  assert.equal(STORE_IDS.length, 11);
  for (const id of STORE_IDS) {
    assert.ok(STORE_CATALOG[id].exampleBenefit.length >= 8, id);
    assert.notEqual(STORE_CATALOG[id].exampleBenefit, '앱 내 방문 쿠폰');
  }
  assert.equal(STORE_CATALOG.modif.exampleBenefit, '아이스 아메리카노 1잔 무료');
  assert.equal(STORE_CATALOG.ajeossi.exampleBenefit, '식사 2,000원 할인');
});

test('issued coupon snapshots its own store benefit while denying a real discount claim', () => {
  const queue = setQueueCount(createQueueState(), 'main', 3);
  const joined = joinQueue(queue, 'main', true, 'entry-1', 1000).state;
  const issued = issueCoupon(createCommerceState(), joined, 'modif', 'coupon-1', 1001);
  assert.equal(issued.reason, undefined);
  assert.equal(issued.state.coupons[0].title, '예시 혜택 · 아이스 아메리카노 1잔 무료');
  assert.match(issued.state.coupons[0].condition, /실제 할인 없음/);
});
