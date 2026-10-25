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
  const joined = joinQueue(cancelQueue(first, now + 1), 'main', true, 'ENTRY-2', now + 2).state;
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

test('changing selected branch leaves actual registration untouched', async () => {
  const { createQueueState, joinQueue, selectBranch } = await queueDomain();
  const joined = joinQueue(createQueueState(), 'main', true, 'ENTRY-1', now).state;
  const selected = selectBranch(joined, 'dcc');
  assert.equal(selected.selectedBranchId, 'dcc');
  assert.equal(selected.wait.branchId, 'main');
  assert.equal(selected.queueCounts.main, 1);
  assert.equal(selected.queueCounts.dcc, 0);
});

test('active registration cannot be duplicated and cancelled ticket is never reused', async () => {
  const { createQueueState, joinQueue, cancelQueue } = await queueDomain();
  const first = joinQueue(createQueueState(), 'main', true, 'ENTRY-1', now).state;
  assert.match(joinQueue(first, 'dcc', true, 'ENTRY-2', now).reason, /이미/);
  const cancelled = cancelQueue(first, now + 1);
  const second = joinQueue(cancelled, 'main', true, 'ENTRY-2', now + 2).state;
  assert.equal(second.wait.ticketNumber, 2);
  assert.equal(second.nextTicketNumbers.main, 3);
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
