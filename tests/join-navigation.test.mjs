import assert from 'node:assert/strict';
import test from 'node:test';
import { createQueueState, joinSelectedQueue } from '../src/domain/queue.ts';
import { joinAndOpenQueue } from '../src/flows/join.ts';

test('successful queue registration opens the queue tab', () => {
  const destinations = [];
  const reason = joinAndOpenQueue(() => undefined, (path) => destinations.push(path), true);
  assert.equal(reason, undefined);
  assert.deepEqual(destinations, ['/schedule']);
});

test('failed queue registration keeps the current screen and returns the reason', () => {
  const destinations = [];
  const reason = joinAndOpenQueue(() => '이미 줄서기 중이에요', (path) => destinations.push(path), true);
  assert.equal(reason, '이미 줄서기 중이에요');
  assert.deepEqual(destinations, []);
});

test('unchecked required consent cannot register a queue or navigate', () => {
  let queue = createQueueState();
  const destinations = [];
  const reason = joinAndOpenQueue(() => {
    const result = joinSelectedQueue(queue, true, 'ENTRY-1');
    queue = result.state;
    return result.reason;
  }, (path) => destinations.push(path), false);
  assert.equal(reason, '이용 제한 동의가 필요해요');
  assert.equal(queue.wait, null);
  assert.deepEqual(destinations, []);
});
