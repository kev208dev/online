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

export function cancelQueue(state: QueueState, now = Date.now()): QueueState {
  const wait = state.wait;
  if (!wait || wait.status !== 'waiting') return state;
  return {
    ...state,
    wait: null,
    queueCounts: { ...state.queueCounts, [wait.branchId]: Math.max(0, state.queueCounts[wait.branchId] - 1) },
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
