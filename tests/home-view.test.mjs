import assert from 'node:assert/strict';
import test from 'node:test';

test('selected branch photo, count and discovery stay together while the active ticket stays separate', async () => {
  const { createQueueState, joinQueue, selectBranch, setQueueCount } = await import('../src/domain/queue.ts');
  const { homeView } = await import('../src/domain/homeView.ts');
  let queue = setQueueCount(createQueueState(), 'main', 5);
  queue = joinQueue(queue, 'main', true, 'ENTRY-1', 1_800_000_000_000).state;
  queue = setQueueCount(queue, 'dcc', 7);
  queue = selectBranch(queue, 'dcc');
  const view = homeView(queue);
  assert.equal(view.selectedBranchId, 'dcc');
  assert.equal(view.queueCount, 7);
  assert.equal(view.activeWait?.branchId, 'main');
  assert.equal(view.activeWait?.peopleAhead, 5);
  assert.ok(view.stores.length >= 2);
  assert.ok(view.stores.every((store) => store.branchId === 'dcc'));
});
