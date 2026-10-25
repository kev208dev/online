import assert from 'node:assert/strict';
import test from 'node:test';

const now = 1_800_000_000_000;
async function queueDomain() {
  const domain = await import('../src/domain/queue.ts').catch(() => null);
  assert.ok(domain, 'queue domain must exist');
  return domain;
}

test('new device keeps four branch counts and ticket counters separate', async () => {
  const { createQueueState } = await queueDomain();
  const state = createQueueState();
  assert.deepEqual(state.queueCounts, { main: 0, station: 0, dcc: 0, lotte: 0 });
  assert.deepEqual(state.nextTicketNumbers, { main: 1, station: 1, dcc: 1, lotte: 1 });
  assert.equal(state.selectedBranchId, 'main');
  assert.equal(state.wait, null);
});

test('manual total never changes the next ticket and joining stores people ahead', async () => {
  const { createQueueState, setQueueCount, joinQueue } = await queueDomain();
  const counted = setQueueCount(createQueueState(), 'main', 12);
  assert.equal(counted.nextTicketNumbers.main, 1);
  const joined = joinQueue(counted, 'main', true, 'ENTRY-1', now);
  assert.equal(joined.reason, undefined);
  assert.equal(joined.state.wait.ticketNumber, 1);
  assert.equal(joined.state.wait.peopleAhead, 12);
  assert.equal(joined.state.queueCounts.main, 13);
  assert.equal(joined.state.nextTicketNumbers.main, 2);
  assert.equal(joined.state.nextTicketNumbers.station, 1);
});

test('manual total below ticket number never rewrites ticket, ahead, or next number', async () => {
  const { createQueueState, setQueueCount, joinQueue, cancelQueue } = await queueDomain();
  const first = joinQueue(setQueueCount(createQueueState(), 'main', 12), 'main', true, 'ENTRY-1', now).state;
  const joined = joinQueue(cancelQueue(first, now + 1), 'main', true, 'ENTRY-2', Date.UTC(2027, 4, 1)).state;
  const edited = setQueueCount(joined, 'main', 1);
  assert.equal(edited.queueCounts.main, 1);
  assert.equal(edited.wait.ticketNumber, 2);
  assert.equal(edited.wait.peopleAhead, 12);
  assert.equal(edited.nextTicketNumbers.main, 3);
});

test('processing a person ahead works even after total was manually lowered to zero', async () => {
  const { createQueueState, setQueueCount, joinQueue, processAhead } = await queueDomain();
  let state = joinQueue(setQueueCount(createQueueState(), 'main', 2), 'main', true, 'ENTRY-1', now).state;
  state = setQueueCount(state, 'main', 0);
  state = processAhead(state, 'main');
  assert.equal(state.wait.peopleAhead, 1);
  assert.equal(state.queueCounts.main, 0);
  state = processAhead(state, 'main');
  state = processAhead(state, 'main');
  assert.equal(state.wait.peopleAhead, 0);
  assert.equal(state.queueCounts.main, 0);
});

test('remaining people and estimated time follow the registered wait, not manual total edits', async () => {
  const { createQueueState, setQueueCount, joinQueue, processAhead, selectBranch, estimateQueueWait } = await queueDomain();
  let state = joinQueue(setQueueCount(createQueueState(), 'main', 25), 'main', true, 'ENTRY-ESTIMATE', now).state;
  assert.deepEqual(estimateQueueWait(state), { peopleAhead: 25, minutes: 7, label: '약 7분' });
  state = selectBranch(setQueueCount(state, 'main', 1), 'dcc');
  assert.deepEqual(estimateQueueWait(state), { peopleAhead: 25, minutes: 7, label: '약 7분' });
  state = processAhead(state, 'main');
  assert.deepEqual(estimateQueueWait(state), { peopleAhead: 24, minutes: 6, label: '약 6분' });
});

test('estimated time follows four people per minute across requested examples', async () => {
  const { createQueueState, setQueueCount, joinQueue, estimateQueueWait } = await queueDomain();
  for (const [ahead, minutes, label] of [
    [40, 10, '약 10분'],
    [120, 30, '약 30분'],
    [240, 60, '약 1시간'],
    [360, 90, '약 1시간 30분'],
    [480, 120, '약 2시간'],
    [720, 180, '약 3시간'],
    [960, 240, '약 4시간'],
  ]) {
    const state = joinQueue(setQueueCount(createQueueState(), 'main', ahead), 'main', true, `ENTRY-${ahead}`, now).state;
    assert.deepEqual(estimateQueueWait(state), { peopleAhead: ahead, minutes, label });
  }
});

test('zero people ahead means entry turn rather than a misleading wait estimate', async () => {
  const { createQueueState, joinQueue, verifyEntry, estimateQueueWait } = await queueDomain();
  const joined = joinQueue(createQueueState(), 'station', true, 'ENTRY-ZERO', now).state;
  assert.deepEqual(estimateQueueWait(joined), { peopleAhead: 0, minutes: 0, label: '입장 차례' });
  const completed = verifyEntry(joined, 'station', 'ENTRY-ZERO', now + 1).state;
  assert.equal(estimateQueueWait(completed), null);
  assert.equal(estimateQueueWait(createQueueState()), null);
});

test('changing selected branch leaves actual registration untouched', async () => {
  const { createQueueState, joinQueue, selectBranch } = await queueDomain();
  const joined = joinQueue(createQueueState(), 'main', true, 'ENTRY-1', now).state;
  const selected = selectBranch(joined, 'dcc');
  assert.equal(selected.selectedBranchId, 'dcc');
  assert.equal(selected.wait.branchId, 'main');
  assert.equal(selected.queueCounts.main, 1);
  assert.equal(selected.queueCounts.dcc, 0);
});

test('search joins the selected branch but cannot replace an active registration', async () => {
  const { createQueueState, joinSelectedQueue, selectBranch } = await queueDomain();
  const selected = selectBranch(createQueueState(), 'dcc');
  const joined = joinSelectedQueue(selected, false, 'ENTRY-DCC', now);
  assert.equal(joined.reason, undefined);
  assert.equal(joined.state.wait.branchId, 'dcc');
  assert.equal(joined.state.wait.leaveAllowed, false);
  assert.equal(joined.state.nextTicketNumbers.dcc, 2);
  const anotherSelected = selectBranch(joined.state, 'station');
  const duplicate = joinSelectedQueue(anotherSelected, true, 'ENTRY-STATION', now + 1);
  assert.match(duplicate.reason, /이미 줄서기 중/);
  assert.equal(duplicate.state.wait.branchId, 'dcc');
});

test('active registration cannot be duplicated and cancelled ticket is never reused after restriction expires', async () => {
  const { createQueueState, joinQueue, cancelQueue } = await queueDomain();
  const first = joinQueue(createQueueState(), 'main', true, 'ENTRY-1', now).state;
  assert.match(joinQueue(first, 'dcc', true, 'ENTRY-2', now).reason, /이미/);
  const cancelled = cancelQueue(first, now + 1);
  const second = joinQueue(cancelled, 'main', true, 'ENTRY-2', Date.UTC(2027, 4, 1)).state;
  assert.equal(second.wait.ticketNumber, 2);
  assert.equal(second.nextTicketNumbers.main, 3);
});

test('cancelling blocks only that branch for three calendar months without changing issued tickets', async () => {
  const { createQueueState, joinQueue, cancelQueue, restrictionEndLabel } = await queueDomain();
  const cancelledAt = Date.UTC(2026, 0, 31, 12);
  const joined = joinQueue(createQueueState(), 'main', true, 'ENTRY-1', cancelledAt - 1000).state;
  const cancelled = cancelQueue(joined, cancelledAt);
  assert.equal(cancelled.blockedUntil?.main, Date.UTC(2026, 3, 30, 12));
  assert.equal(restrictionEndLabel(cancelled.blockedUntil.main), '2026년 4월 30일');
  assert.equal(cancelled.queueCounts.main, 0);
  assert.equal(cancelled.nextTicketNumbers.main, 2);
  const denied = joinQueue(cancelled, 'main', true, 'ENTRY-2', cancelledAt + 1);
  assert.match(denied.reason, /3개월|이용 제한/);
  assert.equal(denied.state, cancelled);
  assert.equal(joinQueue(cancelled, 'dcc', true, 'ENTRY-DCC', cancelledAt + 1).state.wait.branchId, 'dcc');
  assert.equal(joinQueue(cancelled, 'main', true, 'ENTRY-2', Date.UTC(2026, 3, 30, 12)).state.wait.ticketNumber, 2);
});

test('three-month restriction uses the Korean calendar date near midnight', async () => {
  const { createQueueState, joinQueue, cancelQueue } = await queueDomain();
  const cancelledAt = Date.UTC(2026, 0, 30, 16); // January 31, 01:00 in Seoul.
  const joined = joinQueue(createQueueState(), 'main', true, 'ENTRY-NIGHT', cancelledAt - 1000).state;
  const cancelled = cancelQueue(joined, cancelledAt);
  assert.equal(cancelled.blockedUntil.main, Date.UTC(2026, 3, 29, 16)); // April 30, 01:00 in Seoul.
});

test('entry QR is unavailable before turn, branch-specific, and single-use', async () => {
  const { createQueueState, setQueueCount, joinQueue, processAhead, verifyEntry } = await queueDomain();
  let state = joinQueue(setQueueCount(createQueueState(), 'main', 1), 'main', true, 'ENTRY-2', now).state;
  assert.match(verifyEntry(state, 'main', 'ENTRY-2', now).reason, /차례/);
  state = processAhead(state, 'main');
  assert.match(verifyEntry(state, 'dcc', 'ENTRY-2', now).reason, /다른 지점/);
  const accepted = verifyEntry(state, 'main', 'ENTRY-2', now);
  assert.equal(accepted.reason, undefined);
  assert.equal(accepted.state.wait.status, 'completed');
  assert.match(verifyEntry(accepted.state, 'main', 'ENTRY-2', now).reason, /이미/);
});

test('invalid counts and codes never mutate the queue', async () => {
  const { createQueueState, setQueueCount, joinQueue } = await queueDomain();
  const state = createQueueState();
  assert.throws(() => setQueueCount(state, 'main', -1));
  assert.throws(() => setQueueCount(state, 'main', 1.5));
  assert.equal(joinQueue(state, 'main', true, '', now).state, state);
  assert.deepEqual(state.queueCounts, { main: 0, station: 0, dcc: 0, lotte: 0 });
});

test('all four displayed branches have finite confirmed map coordinates', async () => {
  const branches = await import('../src/data/branches.ts').catch(() => null);
  assert.ok(branches, 'branch data must exist');
  for (const id of ['main', 'station', 'dcc', 'lotte']) {
    const item = branches.BRANCHES[id];
    assert.ok(item.name.startsWith('성심당'));
    assert.ok(item.address.startsWith('대전광역시'));
    assert.ok(Number.isFinite(item.latitude));
    assert.ok(Number.isFinite(item.longitude));
  }
});
