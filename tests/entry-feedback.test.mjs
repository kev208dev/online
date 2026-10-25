import assert from 'node:assert/strict';
import test from 'node:test';

test('entry verification reports success immediately and a reused code as failure', async () => {
  const feedback = await import('../src/domain/entryFeedback.ts').catch(() => null);
  assert.ok(feedback?.entryFeedback, 'entry verification feedback must be available');
  assert.deepEqual(feedback.entryFeedback(undefined), {
    title: '입장 인증 완료',
    message: '입장 인증이 완료됐어요',
  });
  assert.deepEqual(feedback.entryFeedback('이미 인증한 QR이에요'), {
    title: '입장 인증 실패',
    message: '이미 인증한 QR이에요',
  });
});
