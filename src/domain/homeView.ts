import { storesForBranch } from '../data/storeCatalog.ts';
import type { QueueState } from './queue.ts';

export function homeView(queue: QueueState) {
  const selectedBranchId = queue.selectedBranchId;
  return {
    selectedBranchId,
    queueCount: queue.queueCounts[selectedBranchId],
    stores: storesForBranch(selectedBranchId),
    activeWait: queue.wait?.status === 'waiting' ? queue.wait : null,
  };
}
