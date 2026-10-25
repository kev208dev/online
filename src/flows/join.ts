export async function joinAndOpenQueue(
  join: () => Promise<string | undefined>,
  navigate: (path: '/schedule') => void,
  acceptedTerms: boolean,
): Promise<string | undefined> {
  if (!acceptedTerms) return '이용 제한 동의가 필요해요';
  const reason = await join();
  if (!reason) navigate('/schedule');
  return reason;
}
