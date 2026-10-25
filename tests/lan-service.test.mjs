import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createLanService } from '../server/service.mjs';
import { parseConsoleCommand } from '../server/cli.mjs';

async function fixture(t, clock = () => Date.now()) {
  const dir = await mkdtemp(join(tmpdir(), 'online-lan-test-'));
  const dataPath = join(dir, 'state.json');
  const service = createLanService({ dataPath, host: '127.0.0.1', port: 0, now: clock });
  const started = await service.listen();
  const base = `http://127.0.0.1:${started.port}`;
  t.after(async () => { await service.close(); await rm(dir, { recursive: true, force: true }); });
  const request = async (path, method = 'GET', body, token) => {
    const response = await fetch(base + path, {
      method,
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  const pair = async (code) => {
    const result = await request('/pair', 'POST', { code });
    assert.equal(result.status, 200);
    return result.body;
  };
  return { service, started, dataPath, request, pair };
}

test('two roles share queue progress but merchant never receives customer QR codes', async (t) => {
  const f = await fixture(t);
  const customer = await f.pair(f.started.codes.customer);
  const merchant = await f.pair(f.started.codes.merchant);
  const setCount = await f.request('/action', 'POST', { type: 'setCount', branchId: 'main', count: 2 }, merchant.token);
  assert.equal(setCount.status, 200);
  const joined = await f.request('/action', 'POST', { type: 'join', branchId: 'main', acceptedTerms: true }, customer.token);
  assert.equal(joined.body.state.queue.wait.peopleAhead, 2);
  const entryCode = joined.body.state.queue.wait.entryCode;
  const merchantView = await f.request('/state', 'GET', undefined, merchant.token);
  assert.equal(merchantView.body.state.queue.wait, null);
  assert.equal(JSON.stringify(merchantView.body).includes(entryCode), false);
  await f.request('/action', 'POST', { type: 'advance', branchId: 'main' }, merchant.token);
  await f.request('/action', 'POST', { type: 'advance', branchId: 'main' }, merchant.token);
  const ready = await f.request('/state', 'GET', undefined, customer.token);
  assert.equal(ready.body.state.queue.wait.peopleAhead, 0);
  const verified = await f.request('/action', 'POST', { type: 'verifyEntry', branchId: 'main', code: entryCode }, merchant.token);
  assert.equal(verified.status, 200);
  assert.equal((await f.request('/state', 'GET', undefined, customer.token)).body.state.queue.wait.status, 'completed');
  assert.notEqual((await f.request('/action', 'POST', { type: 'verifyEntry', branchId: 'main', code: entryCode }, merchant.token)).status, 200);
});

test('role checks, used codes, bad codes, and expired codes fail closed', async (t) => {
  let now = 1000;
  const f = await fixture(t, () => now);
  assert.equal((await f.request('/pair', 'POST', { code: 'wrong' })).status, 401);
  const customer = await f.pair(f.started.codes.customer);
  assert.equal((await f.request('/pair', 'POST', { code: f.started.codes.customer })).status, 401);
  assert.equal((await f.request('/action', 'POST', { type: 'setCount', branchId: 'main', count: 3 }, customer.token)).status, 403);
  now += 11 * 60 * 1000;
  assert.equal((await f.request('/pair', 'POST', { code: f.started.codes.merchant })).status, 401);
  const state = await f.request('/state', 'GET', undefined, customer.token);
  assert.equal(state.body.state.queue.queueCounts.main, 0);
  assert.equal(JSON.stringify(state.body).includes(f.started.codes.merchant), false);
});

test('simultaneous coupon redemption commits exactly once', async (t) => {
  const f = await fixture(t);
  const customer = await f.pair(f.started.codes.customer);
  const merchant = await f.pair(f.started.codes.merchant);
  await f.request('/action', 'POST', { type: 'setCount', branchId: 'main', count: 3 }, merchant.token);
  await f.request('/action', 'POST', { type: 'join', branchId: 'main', acceptedTerms: true }, customer.token);
  const issued = await f.request('/action', 'POST', { type: 'issueCoupon', storeId: 'madeby' }, customer.token);
  const code = issued.body.result.couponCode;
  const [first, second] = await Promise.all([
    f.request('/action', 'POST', { type: 'redeemCoupon', storeId: 'madeby', code }, merchant.token),
    f.request('/action', 'POST', { type: 'redeemCoupon', storeId: 'madeby', code }, merchant.token),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409]);
  assert.equal((await f.request('/state', 'GET', undefined, customer.token)).body.state.commerce.coupons[0].usedAt !== undefined, true);
});

test('restart preserves state; reissue revokes one token without clearing records; reset clears all', async (t) => {
  const f = await fixture(t);
  const customer = await f.pair(f.started.codes.customer);
  const merchant = await f.pair(f.started.codes.merchant);
  await f.request('/action', 'POST', { type: 'setCount', branchId: 'main', count: 2 }, merchant.token);
  await f.request('/action', 'POST', { type: 'join', branchId: 'main', acceptedTerms: true }, customer.token);
  await f.service.close();
  const restarted = createLanService({ dataPath: f.dataPath, host: '127.0.0.1', port: 0 });
  const { port } = await restarted.listen();
  t.after(() => restarted.close());
  const base = `http://127.0.0.1:${port}`;
  const call = async (path, method, body, token) => {
    const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  assert.equal((await call('/state', 'GET', undefined, customer.token)).body.state.queue.wait.peopleAhead, 2);
  const newCode = await restarted.reissue('customer');
  assert.equal((await call('/state', 'GET', undefined, customer.token)).status, 401);
  const replacement = await call('/pair', 'POST', { code: newCode });
  assert.equal(replacement.body.state.queue.wait.peopleAhead, 2);
  assert.equal((await call('/state', 'GET', undefined, merchant.token)).status, 200);
  const resetCodes = await restarted.reset();
  assert.equal((await call('/state', 'GET', undefined, merchant.token)).status, 401);
  assert.equal((await call('/state', 'GET', undefined, replacement.body.token)).status, 401);
  const fresh = await call('/pair', 'POST', { code: resetCodes.customer });
  assert.equal(fresh.body.state.queue.wait, null);
  const disk = JSON.parse(await readFile(f.dataPath, 'utf8'));
  assert.equal(disk.shared.queue.queueCounts.main, 0);
});

test('console commands keep role reissue separate from explicitly confirmed full reset', () => {
  assert.deepEqual(parseConsoleCommand('reissue customer'), { type: 'reissue', role: 'customer' });
  assert.deepEqual(parseConsoleCommand('reissue merchant'), { type: 'reissue', role: 'merchant' });
  assert.deepEqual(parseConsoleCommand('reset --confirm-reset'), { type: 'reset' });
  assert.equal(parseConsoleCommand('reset'), null);
  assert.equal(parseConsoleCommand('reissue visitor'), null);
});
