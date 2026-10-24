// The user's place in the 성심당 본점 queue.
//
// There is no backend yet, so the queue is simulated: it starts at the
// values shown in the design (124th, 2시간 9분) and counts down in real
// time. When the wait reaches zero the entry QR popup (Figma 17-6) opens
// over whatever screen is showing.
//
// To see the popup without waiting two hours, start the app with e.g.
//   EXPO_PUBLIC_WAIT_SECONDS=15 npx expo start
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const START_POSITION = 124;
const WAITING_NUMBER = 530;
const TOTAL_SECONDS = Number(process.env.EXPO_PUBLIC_WAIT_SECONDS) || 129 * 60;
const POSTPONE_SECONDS = 5 * 60;

type Status = 'waiting' | 'called' | 'cancelled';

type Waiting = {
  status: Status;
  position: number;
  waitingNumber: number;
  /** Remaining wait, rounded up to whole minutes. */
  hours: number;
  minutes: number;
  totalMinutes: number;
  /** Expected entry time, e.g. "11시 50분". */
  entryTime: string;
  postpone: () => void;
  cancel: () => void;
};

const WaitingContext = createContext<Waiting | null>(null);

export function WaitingProvider({ children }: { children: ReactNode }) {
  const [deadline, setDeadline] = useState(() => Date.now() + TOTAL_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [cancelled, setCancelled] = useState(false);

  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const status: Status = cancelled ? 'cancelled' : remaining === 0 ? 'called' : 'waiting';

  useEffect(() => {
    if (status !== 'waiting') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const postpone = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setDeadline(t + POSTPONE_SECONDS * 1000);
  }, []);

  const cancel = useCallback(() => setCancelled(true), []);

  const value = useMemo<Waiting>(() => {
    const totalMinutes = Math.ceil(remaining / 60);
    const entry = new Date(deadline);
    return {
      status,
      position: Math.min(START_POSITION, Math.max(1, Math.ceil((START_POSITION * remaining) / TOTAL_SECONDS))),
      waitingNumber: WAITING_NUMBER,
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalMinutes,
      entryTime: `${entry.getHours()}시 ${entry.getMinutes()}분`,
      postpone,
      cancel,
    };
  }, [status, remaining, deadline, postpone, cancel]);

  return <WaitingContext.Provider value={value}>{children}</WaitingContext.Provider>;
}

export function useWaiting() {
  const value = useContext(WaitingContext);
  if (!value) throw new Error('useWaiting must be used inside WaitingProvider');
  return value;
}
