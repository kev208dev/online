import assert from 'node:assert/strict';
import test from 'node:test';
import { createLanClient, pairLan, normalizeLanUrl, LanError } from '../src/state/lanClient.ts';
import { createLanSessionStore } from '../src/state/lanSession.ts';
import { createAppState, createLocalQueueRepository } from '../src/state/queueRepository.ts';

test('LAN address accepts local HTTP only, never a public token destination', () => {
  assert.equal(normalizeLanUrl('192.168.0.12:8787/'), 'http://192.168.0.12:8787');
  assert.equal(normalizeLanUrl('http://10.0.0.3:8787'), 'http://10.0.0.3:8787');
  for (const address of ['https://example.com', 'http://8.8.8.8:8787', 'http://192.168.0.2:8787/path', 'http://user:pass@192.168.0.2:8787']) {
    assert.throws(() => normalizeLanUrl(address), /Mac 주소/);
  }
});

test('pairing and authenticated requests send only the required code or role token', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => calls.length === 1
      ? { role: 'customer', token: 'secret-token', state: { queue: {}, commerce: {} } }
      : { state: { queue: { queueCounts: { main: 2 } }, commerce: {} } } };
  };
  const paired = await pairLan('192.168.0.12:8787', 'one-time-code', fakeFetch);
  assert.equal(paired.token, 'secret-token');
  const client = createLanClient('192.168.0.12:8787', paired.token, fakeFetch);
  assert.equal((await client.read()).state.queue.queueCounts.main, 2);
  assert.equal(calls[0].url, 'http://192.168.0.12:8787/pair');
  assert.equal(JSON.parse(calls[0].options.body).code, 'one-time-code');
  assert.equal(calls[0].options.headers.authorization, undefined);
  assert.equal(calls[1].options.headers.authorization, 'Bearer secret-token');
  assert.equal(calls[1].url, 'http://192.168.0.12:8787/state');
});

test('revoked session and failed network writes never return a changed state', async () => {
  const denied = createLanClient('http://192.168.0.12:8787', 'old-token', async () => ({
    ok: false, status: 401, json: async () => ({ error: '다시 연결해 주세요' }),
  }));
  await assert.rejects(denied.act({ type: 'join', branchId: 'main', acceptedTerms: true }), (error) => error instanceof LanError && error.code === 'unauthorized');
  const offline = createLanClient('http://192.168.0.12:8787', 'token', async () => { throw new Error('network unreachable'); });
  await assert.rejects(offline.act({ type: 'join', branchId: 'main', acceptedTerms: true }), (error) => error instanceof LanError && error.code === 'offline');
});

test('request timeout aborts a stalled network call', async () => {
  const stalled = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')));
  });
  const client = createLanClient('http://192.168.0.12:8787', 'token', stalled, 10);
  await assert.rejects(client.read(), (error) => error instanceof LanError && error.code === 'offline');
});

test('protected session is stored separately and local queue remains intact after leaving shared mode', async () => {
  const values = new Map();
  const secure = createLanSessionStore({
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => { values.set(key, value); },
    deleteItemAsync: async (key) => { values.delete(key); },
  });
  await secure.save({ baseUrl: 'http://192.168.0.12:8787', token: 'phone-token', role: 'customer' });
  assert.deepEqual(await secure.load(), { baseUrl: 'http://192.168.0.12:8787', token: 'phone-token', role: 'customer' });
  const localValues = new Map();
  const local = createLocalQueueRepository({
    getItem: async (key) => localValues.get(key) ?? null,
    setItem: async (key, value) => { localValues.set(key, value); },
  });
  const original = createAppState();
  original.queue.queueCounts.main = 12;
  await local.save(original);
  await secure.clear();
  assert.equal(await secure.load(), null);
  assert.equal((await local.load()).queue.queueCounts.main, 12);
});
