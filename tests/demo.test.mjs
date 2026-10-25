import assert from 'node:assert/strict';
import test from 'node:test';
import { addStop, createInitialState, eligibleStores, endWait, issueCoupon, redeemCoupon, reminderAt, returnGuidance, selectCurrentStore, startWait, toggleVisited, updateOffer, updateProfile, waitRemaining } from '../src/domain/demo.ts';

const now = 1_800_000_000_000;
const one = { id: 'madeby', walkMinutes: 2, stayMinutes: 20 };
const two = { id: 'dadareuda', walkMinutes: 4, stayMinutes: 20 };

test('manual wait needs explicit leave confirmation for a visit', () => {
  const wait = startWait(createInitialState(), 60, false, now);
  assert.equal(waitRemaining(wait, now), 60);
  assert.equal(addStop(wait, one, now).reason, '외출 가능 여부를 먼저 확인해 주세요');
});

test('itinerary keeps return buffer and refuses over-budget stop', () => {
  const wait = startWait(createInitialState(), 30, true, now);
  const first = addStop(wait, one, now);
  assert.equal(first.reason, undefined);
  assert.deepEqual(first.state.stops, ['madeby']);
  assert.equal(addStop(first.state, two, now).reason, '남은 대기시간에 비해 방문 일정이 길어요');
});

test('coupon is unique per store and wait and snapshots terms', () => {
  const wait = startWait(createInitialState(), 60, true, now);
  const issued = issueCoupon(wait, 'madeby', 'DEMO-1', now);
  assert.equal(issued.reason, undefined);
  assert.equal(issueCoupon(issued.state, 'madeby', 'DEMO-2', now).reason, '이미 발급한 쿠폰이 있어요');
  const changed = updateOffer(issued.state, 'madeby', '새 혜택', '새 조건', true);
  assert.notEqual(changed.offers.madeby.title, changed.coupons[0].title);
});

test('redemption rejects wrong store, expiry and duplicate use', () => {
  const state = issueCoupon(startWait(createInitialState(), 60, true, now), 'madeby', 'DEMO-1', now).state;
  assert.equal(redeemCoupon(state, 'dadareuda', 'DEMO-1', now).reason, '다른 매장 쿠폰이에요');
  assert.equal(redeemCoupon(state, 'madeby', 'DEMO-1', now + 61 * 60_000).reason, '유효기간이 지났어요');
  const used = redeemCoupon(state, 'madeby', 'DEMO-1', now);
  assert.equal(used.reason, undefined);
  assert.equal(redeemCoupon(used.state, 'madeby', 'DEMO-1', now).reason, '이미 사용한 쿠폰이에요');
});

test('return alert includes walk to anchor and five-minute buffer', () => {
  const state = addStop(startWait(createInitialState(), 60, true, now), one, now).state;
  assert.equal(reminderAt(state), now + (60 - 7) * 60_000);
});

test('ending a wait invalidates its unused coupons immediately', () => {
  const state = issueCoupon(startWait(createInitialState(), 60, true, now), 'madeby', 'DEMO-1', now).state;
  const ended = endWait(state, now + 1000);
  assert.equal(redeemCoupon(ended, 'madeby', 'DEMO-1', now + 2000).reason, '유효기간이 지났어요');
});

test('merchant profile edits persist separately from coupon terms', () => {
  const issued = issueCoupon(startWait(createInitialState(), 60, true, now), 'madeby', 'DEMO-1', now).state;
  const edited = updateProfile(issued, 'madeby', { menu: '시연 메뉴', hours: '11-20', address: '시연 주소' });
  assert.equal(edited.profiles.madeby.menu, '시연 메뉴');
  assert.equal(edited.coupons[0].condition, issued.coupons[0].condition);
});

test('a completed stop does not consume the future itinerary budget again', () => {
  const first = addStop(startWait(createInitialState(), 55, true, now), one, now).state;
  const completed = toggleVisited(first, 'madeby');
  assert.equal(addStop(completed, two, now + 20 * 60_000).reason, undefined);
});

test('selected current store controls the return departure time', () => {
  let state = startWait(createInitialState(), 60, true, now);
  state = addStop(state, one, now).state;
  state = addStop(state, two, now).state;
  assert.equal(reminderAt(state), now + (60 - 9) * 60_000);
  state = selectCurrentStore(state, 'madeby');
  assert.equal(reminderAt(state), now + (60 - 7) * 60_000);
  state = toggleVisited(state, 'madeby');
  assert.equal(reminderAt(state), now + (60 - 7) * 60_000);
  assert.equal(selectCurrentStore(state, null).currentStoreId, null);
});

test('in-app return guidance works without notification permission', () => {
  const state = startWait(createInitialState(), 60, true, now);
  assert.equal(returnGuidance(state, now + 54 * 60_000), 'none');
  assert.equal(returnGuidance(state, now + 55 * 60_000), 'return-now');
  assert.equal(returnGuidance(state, now + 60 * 60_000), 'expired');
});

test('home recommendations account for stops already scheduled', () => {
  const state = startWait(createInitialState(), 30, true, now);
  assert.deepEqual(eligibleStores(state, now), ['madeby']);
  const planned = addStop(state, one, now).state;
  assert.deepEqual(eligibleStores(planned, now), []);
});
