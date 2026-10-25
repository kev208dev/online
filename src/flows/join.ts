export function joinAndOpenQueue(
  join: () => string | undefined,
  navigate: (path: '/schedule') => void,
): string | undefined {
  const reason = join();
  if (!reason) navigate('/schedule');
  return reason;
}
