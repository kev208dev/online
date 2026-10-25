import assert from 'node:assert/strict';
import test from 'node:test';
import { joinAndOpenQueue } from '../src/flows/join.ts';

test('successful queue registration opens the queue tab', () => {
  const destinations = [];
  const reason = joinAndOpenQueue(() => undefined, (path) => destinations.push(path));
  assert.equal(reason, undefined);
  assert.deepEqual(destinations, ['/schedule']);
});

test('failed queue registration keeps the current screen and returns the reason', () => {
  const destinations = [];
  const reason = joinAndOpenQueue(() => '이미 줄서기 중이에요', (path) => destinations.push(path));
  assert.equal(reason, '이미 줄서기 중이에요');
  assert.deepEqual(destinations, []);
});
