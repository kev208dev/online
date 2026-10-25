import { LanError, type LanAction, type LanResponse, type LanState } from './lanClient.ts';
import type { AppState } from './queueRepository.ts';

export function mergeLanSnapshot(local: AppState, remote: LanState): AppState {
  return {
    ...local,
    queue: { ...remote.queue, selectedBranchId: local.queue.selectedBranchId },
    commerce: remote.commerce,
  };
}

export async function performLanAction(
  client: { act: (action: LanAction) => Promise<LanResponse> },
  connected: boolean,
  action: LanAction,
  commit: (snapshot: LanState) => void,
): Promise<{ reason?: string; result?: LanResponse['result']; failureCode?: LanError['code'] }> {
  if (!connected) return { reason: '연결 끊김 · Mac과 Wi-Fi를 확인해 주세요', failureCode: 'offline' };
  try {
    const response = await client.act(action);
    commit(response.state);
    return { result: response.result };
  } catch (error) {
    if (error instanceof LanError) return { reason: error.message, failureCode: error.code };
    return { reason: '연결 끊김 · Mac과 Wi-Fi를 확인해 주세요', failureCode: 'offline' };
  }
}
