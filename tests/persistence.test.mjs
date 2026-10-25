import assert from 'node:assert/strict';
import test from 'node:test';

const now = 1_800_000_000_000;
async function modules() {
  const repository = await import('../src/state/queueRepository.ts').catch(() => null);
  assert.ok(repository, 'queue repository must exist');
  const queue = await import('../src/domain/queue.ts');
  return { repository, queue };
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
  };
}

test('v1 timed wait does not revive as a queue and old coupon history expires', async () => {
  const { repository } = await modules();
  const old = {
    version: 1,
    state: {
      wait: { id: 'WAIT-OLD', startedAt: now - 1_000, endsAt: now + 3_600_000, leaveAllowed: true },
      stops: ['madeby'], visited: [], currentStoreId: 'madeby',
      coupons: [{ code: 'OLD', storeId: 'madeby', waitId: 'WAIT-OLD', title: '옛 혜택', condition: '옛 조건', issuedAt: now - 1_000, expiresAt: now + 3_600_000 }],
      offers: { madeby: { title: '편집한 혜택', condition: '편집 조건', enabled: true } },
      profiles: { madeby: { menu: '수정 메뉴', hours: '11-20', address: '수정 주소' } },
      alertsEnabled: true,
    },
  };
  const storage = memoryStorage({ 'online-demo-v1': JSON.stringify(old) });
  const state = await repository.createLocalQueueRepository(storage, () => now).load();
  assert.equal(state.queue.wait, null);
  assert.equal(state.wait, null);
  assert.deepEqual(state.stops, []);
  assert.equal(state.coupons[0].expiresAt, now);
  assert.equal(state.offers.madeby.title, '편집한 혜택');
  assert.equal(state.profiles.madeby.menu, '수정 메뉴');
});

test('v2 round trip preserves selected and registered branches plus independent numbers', async () => {
  const { repository, queue } = await modules();
  const storage = memoryStorage();
  const local = repository.createLocalQueueRepository(storage, () => now);
  const base = repository.createAppState();
  const registered = queue.joinQueue(queue.setQueueCount(base.queue, 'main', 12), 'main', true, 'ENTRY-13', now).state;
  const selected = queue.selectBranch(queue.setQueueCount(registered, 'main', 1), 'dcc');
  const state = { ...base, queue: selected };
  await local.save(state);
  const loaded = await local.load();
  assert.equal(loaded.queue.selectedBranchId, 'dcc');
  assert.equal(loaded.queue.wait.branchId, 'main');
  assert.equal(loaded.queue.wait.ticketNumber, 13);
  assert.equal(loaded.queue.wait.peopleAhead, 12);
  assert.equal(loaded.queue.queueCounts.main, 1);
  assert.equal(loaded.queue.nextTicketNumbers.main, 14);
});

test('repository serializes consecutive saves so the newest state wins', async () => {
  const { repository, queue } = await modules();
  const values = new Map();
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      if (!values.has('first-write-seen')) {
        values.set('first-write-seen', 'yes');
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      values.set(key, value);
    },
  };
  const local = repository.createLocalQueueRepository(storage, () => now);
  const base = repository.createAppState();
  const first = { ...base, queue: queue.selectBranch(base.queue, 'station') };
  const second = { ...base, queue: queue.selectBranch(base.queue, 'lotte') };
  await Promise.all([local.save(first), local.save(second)]);
  assert.equal((await local.load()).queue.selectedBranchId, 'lotte');
});
