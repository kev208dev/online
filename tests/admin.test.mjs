import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdminGate } from '../src/domain/admin.ts';

function fixture() {
  let credential = null;
  const repository = { load: async () => credential, save: async (value) => { credential = value; } };
  const hash = async (text) => `HASH:${text}`;
  const setupVerifier = 'HASH:online-setup-v1:valid-setup';
  return { repository, hash, setupVerifier };
}

test('missing or incorrect setup credential cannot create manager PIN', async () => {
  const { repository, hash, setupVerifier } = fixture();
  const gate = createAdminGate(repository, hash, setupVerifier);
  await gate.initialize();
  assert.equal(gate.hasPin, false);
  assert.equal(gate.unlocked, false);
  assert.equal(await gate.setup('', '1234'), '설정 코드를 확인해 주세요');
  assert.equal(await gate.setup('wrong', '1234'), '설정 코드를 확인해 주세요');
  assert.equal(gate.hasPin, false);
  assert.equal(gate.unlocked, false);
});

test('PIN is stored as salted verifier and setup code cannot be reused', async () => {
  const { repository, hash, setupVerifier } = fixture();
  const gate = createAdminGate(repository, hash, setupVerifier, () => 'fixed-salt');
  await gate.initialize();
  assert.equal(await gate.setup('valid-setup', '4321'), undefined);
  const saved = await repository.load();
  assert.equal(saved.salt, 'fixed-salt');
  assert.equal(saved.digest, 'HASH:fixed-salt:4321');
  assert.equal(gate.unlocked, false);
  assert.equal(await gate.setup('valid-setup', '9876'), '이미 PIN이 설정됐어요');
});

test('incorrect PIN remains locked; successful unlock is memory-only and restart locks', async () => {
  const { repository, hash, setupVerifier } = fixture();
  const gate = createAdminGate(repository, hash, setupVerifier, () => 'salt');
  await gate.initialize();
  await gate.setup('valid-setup', '4321');
  assert.equal(await gate.unlock('0000'), 'PIN이 일치하지 않아요');
  assert.equal(gate.unlocked, false);
  assert.equal(await gate.unlock('4321'), undefined);
  assert.equal(gate.unlocked, true);
  gate.lock();
  assert.equal(gate.unlocked, false);
  const restarted = createAdminGate(repository, hash, setupVerifier);
  await restarted.initialize();
  assert.equal(restarted.hasPin, true);
  assert.equal(restarted.unlocked, false);
});

test('PIN format rejects weak or malformed values', async () => {
  const { repository, hash, setupVerifier } = fixture();
  const gate = createAdminGate(repository, hash, setupVerifier);
  await gate.initialize();
  assert.ok(await gate.setup('valid-setup', '12ab'));
  assert.ok(await gate.setup('valid-setup', '123'));
  assert.ok(await gate.setup('valid-setup', '1111'));
});

test('failed protected-storage initialization cannot open a setup bypass', async () => {
  const hash = async (text) => `HASH:${text}`;
  const gate = createAdminGate({ load: async () => { throw new Error('storage unavailable'); }, save: async () => {} }, hash, 'HASH:online-setup-v1:valid-setup');
  await assert.rejects(gate.initialize());
  assert.ok(await gate.setup('valid-setup', '4321'));
  assert.equal(gate.unlocked, false);
});
