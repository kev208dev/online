export function entryFeedback(reason?: string) {
  return reason
    ? { title: '입장 인증 실패', message: reason }
    : { title: '입장 인증 완료', message: '입장 인증이 완료됐어요' };
}
