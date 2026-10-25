export const BRANCH_IDS = ['main', 'station', 'dcc', 'lotte'] as const;
export type BranchId = (typeof BRANCH_IDS)[number];

export type WaitSession = {
  id: string;
  branchId: BranchId;
  ticketNumber: number;
  peopleAhead: number;
  entryCode: string;
  startedAt: number;
  leaveAllowed: boolean;
  status: 'waiting' | 'completed';
  completedAt?: number;
};

export type QueueState = {
  selectedBranchId: BranchId;
  queueCounts: Record<BranchId, number>;
  nextTicketNumbers: Record<BranchId, number>;
  blockedUntil: Record<BranchId, number>;
  wait: WaitSession | null;
  usedEntryCodes: string[];
};

export type QueueChange = { state: QueueState; reason?: string };

function validBranch(value: string): value is BranchId {
  return (BRANCH_IDS as readonly string[]).includes(value);
}

export function createQueueState(): QueueState {
  return {
    selectedBranchId: 'main',
    queueCounts: { main: 0, station: 0, dcc: 0, lotte: 0 },
    nextTicketNumbers: { main: 1, station: 1, dcc: 1, lotte: 1 },
    blockedUntil: { main: 0, station: 0, dcc: 0, lotte: 0 },
    wait: null,
    usedEntryCodes: [],
  };
}

export function selectBranch(state: QueueState, branchId: BranchId): QueueState {
  if (!validBranch(branchId)) throw new Error('지점을 찾을 수 없어요');
  return { ...state, selectedBranchId: branchId };
}

export function setQueueCount(state: QueueState, branchId: BranchId, count: number): QueueState {
  if (!validBranch(branchId)) throw new Error('지점을 찾을 수 없어요');
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('대기 인원은 0명 이상의 정수여야 해요');
  return {
    ...state,
    queueCounts: { ...state.queueCounts, [branchId]: count },
  };
}

export function joinQueue(
  state: QueueState,
  branchId: BranchId,
  leaveAllowed: boolean,
  entryCode: string,
  now = Date.now(),
): QueueChange {
  if (!validBranch(branchId)) return { state, reason: '지점을 찾을 수 없어요' };
  if (state.wait?.status === 'waiting') return { state, reason: '이미 줄서기 중이에요' };
  const restrictedUntil = queueRestrictionUntil(state, branchId, now);
  if (restrictedUntil) return { state, reason: `취소 후 3개월 이용 제한 중이에요. ${restrictionEndLabel(restrictedUntil)}부터 다시 줄설 수 있어요` };
  const code = entryCode.trim();
  if (!code || state.usedEntryCodes.includes(code) || state.wait?.entryCode === code) {
    return { state, reason: '새 인증 코드를 만들어 주세요' };
  }
  const ticketNumber = state.nextTicketNumbers[branchId];
  if (!Number.isSafeInteger(ticketNumber) || ticketNumber < 1) return { state, reason: '대기 번호를 확인해 주세요' };
  const currentCount = state.queueCounts[branchId];
  const wait: WaitSession = {
    id: `WAIT-${branchId}-${ticketNumber}-${now}`,
    branchId,
    ticketNumber,
    peopleAhead: currentCount,
    entryCode: code,
    startedAt: now,
    leaveAllowed,
    status: 'waiting',
  };
  return {
    state: {
      ...state,
      wait,
      queueCounts: { ...state.queueCounts, [branchId]: currentCount + 1 },
      nextTicketNumbers: { ...state.nextTicketNumbers, [branchId]: ticketNumber + 1 },
    },
  };
}

export function joinSelectedQueue(state: QueueState, leaveAllowed: boolean, entryCode: string, now = Date.now()): QueueChange {
  return joinQueue(state, state.selectedBranchId, leaveAllowed, entryCode, now);
}

export function processAhead(state: QueueState, branchId: BranchId): QueueState {
  if (!validBranch(branchId)) throw new Error('지점을 찾을 수 없어요');
  const wait = state.wait?.status === 'waiting' && state.wait.branchId === branchId ? state.wait : null;
  if (wait && wait.peopleAhead === 0) return state;
  const count = state.queueCounts[branchId];
  return {
    ...state,
    queueCounts: { ...state.queueCounts, [branchId]: Math.max(0, count - 1) },
    wait: wait ? { ...wait, peopleAhead: Math.max(0, wait.peopleAhead - 1) } : state.wait,
  };
}

export function peopleAhead(state: QueueState): number {
  return state.wait?.status === 'waiting' ? state.wait.peopleAhead : 0;
}

export function queueRestrictionUntil(state: QueueState, branchId: BranchId, now = Date.now()): number | null {
  const until = state.blockedUntil?.[branchId] ?? 0;
  return until > now ? until : null;
}

export function restrictionEndLabel(until: number): string {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(until);
}

function threeCalendarMonthsAfter(timestamp: number): number {
  // The service operates in Korea, so clamp month-end in the Seoul calendar.
  const seoulOffset = 9 * 60 * 60 * 1000;
  const date = new Date(timestamp + seoulOffset);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 3);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime() - seoulOffset;
}

// User-specified approximate pace; actual branch service speed is not measured.
const ESTIMATED_PEOPLE_PER_MINUTE = 4;

export function estimateQueueWait(state: QueueState): { peopleAhead: number; minutes: number; label: string } | null {
  const wait = state.wait;
  if (!wait || wait.status !== 'waiting') return null;
  const minutes = Math.ceil(wait.peopleAhead / ESTIMATED_PEOPLE_PER_MINUTE);
  if (minutes === 0) return { peopleAhead: 0, minutes: 0, label: '입장 차례' };
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const label = hours === 0 ? `약 ${minutes}분` : `약 ${hours}시간${remainder ? ` ${remainder}분` : ''}`;
  return { peopleAhead: wait.peopleAhead, minutes, label };
}

export function cancelQueue(state: QueueState, now = Date.now()): QueueState {
  const wait = state.wait;
  if (!wait || wait.status !== 'waiting') return state;
  return {
    ...state,
    wait: null,
    queueCounts: { ...state.queueCounts, [wait.branchId]: Math.max(0, state.queueCounts[wait.branchId] - 1) },
    blockedUntil: { ...createQueueState().blockedUntil, ...state.blockedUntil, [wait.branchId]: Math.max(state.blockedUntil?.[wait.branchId] ?? 0, threeCalendarMonthsAfter(now)) },
    usedEntryCodes: [...state.usedEntryCodes, wait.entryCode],
  };
}

export function verifyEntry(state: QueueState, branchId: BranchId, rawCode: string, now = Date.now()): QueueChange {
  const wait = state.wait;
  if (!wait) return { state, reason: '확인할 줄서기가 없어요' };
  if (wait.status === 'completed') return { state, reason: '이미 인증한 QR이에요' };
  if (wait.branchId !== branchId) return { state, reason: '다른 지점 QR이에요' };
  if (wait.entryCode !== rawCode.trim()) return { state, reason: '인증 코드가 일치하지 않아요' };
  if (wait.peopleAhead > 0) return { state, reason: '아직 입장할 차례가 아니에요' };
  return {
    state: {
      ...state,
      wait: { ...wait, status: 'completed', completedAt: now },
      queueCounts: { ...state.queueCounts, [branchId]: Math.max(0, state.queueCounts[branchId] - 1) },
      usedEntryCodes: [...state.usedEntryCodes, wait.entryCode],
    },
  };
}
