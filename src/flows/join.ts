export function joinAndOpenQueue(
  join: () => string | undefined,
  navigate: (path: '/schedule') => void,
  acceptedTerms: boolean,
): string | undefined {
  if (!acceptedTerms) return '이용 제한 동의가 필요해요';
  const reason = join();
  if (!reason) navigate('/schedule');
  return reason;
}
