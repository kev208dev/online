export type ScannerMode = 'entry' | 'coupon';

export function scannerFeedback(mode: ScannerMode, reason?: string) {
  if (reason) return { kind: 'error' as const, title: '인증 실패', message: reason };
  return {
    kind: 'success' as const,
    title: '인증 완료',
    message: mode === 'entry' ? '입장 인증이 완료됐어요' : '쿠폰 사용이 완료됐어요',
  };
}
