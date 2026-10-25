import assert from 'node:assert/strict';
import test from 'node:test';

test('successful QR checks provide distinct entry and coupon confirmation', async () => {
  const { scannerFeedback } = await import('../src/domain/scannerFeedback.ts');
  assert.deepEqual(scannerFeedback('entry'), {
    kind: 'success', title: '인증 완료', message: '입장 인증이 완료됐어요',
  });
  assert.deepEqual(scannerFeedback('coupon'), {
    kind: 'success', title: '인증 완료', message: '쿠폰 사용이 완료됐어요',
  });
});

test('a rejected QR never displays a successful confirmation', async () => {
  const { scannerFeedback } = await import('../src/domain/scannerFeedback.ts');
  assert.deepEqual(scannerFeedback('entry', '이미 인증한 QR이에요'), {
    kind: 'error', title: '인증 실패', message: '이미 인증한 QR이에요',
  });
});
