import assert from 'node:assert/strict';
import test from 'node:test';
import { createQueueState, joinSelectedQueue } from '../src/domain/queue.ts';
import { joinAndOpenQueue } from '../src/flows/join.ts';

test('successful async queue registration opens the queue tab only after the server accepts it', async () => {
  const destinations = [];
  const reason = await joinAndOpenQueue(async () => undefined, (path) => destinations.push(path), true);
  assert.equal(reason, undefined);
  assert.deepEqual(destinations, ['/schedule']);
});

test('failed async queue registration keeps the current screen and returns the reason', async () => {
  const destinations = [];
  const reason = await joinAndOpenQueue(async () => '이미 줄서기 중이에요', (path) => destinations.push(path), true);
  assert.equal(reason, '이미 줄서기 중이에요');
  assert.deepEqual(destinations, []);
});

test('unchecked required consent cannot register a queue or navigate', async () => {
  let queue = createQueueState();
  const destinations = [];
  const reason = await joinAndOpenQueue(async () => {
    const result = joinSelectedQueue(queue, true, 'ENTRY-1');
    queue = result.state;
    return result.reason;
  }, (path) => destinations.push(path), false);
  assert.equal(reason, '이용 제한 동의가 필요해요');
  assert.equal(queue.wait, null);
  assert.deepEqual(destinations, []);
});
