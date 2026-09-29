import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../../core/database/provider';
import { getSyncQueueStats } from '../../../core/sync/syncProcessor';
import { getNetworkStatus } from '../../../core/network/networkMonitor';

export interface SyncStatusInfo {
  isOnline: boolean;
  pending: number;
  failed: number;
  conflict: number;
  label: string;
}

export const useSyncStatus = () => {
  const db = useDatabase();

  return useQuery({
    queryKey: ['sync', 'status'],
    queryFn: async (): Promise<SyncStatusInfo> => {
      const stats = await getSyncQueueStats(db);
      const network = getNetworkStatus();
      const total = stats.pending + stats.failed;

      let label: string;
      if (stats.conflict > 0) {
        label = `▲ Butuh Tindakan`;
      } else if (!network.isConnected && total > 0) {
        label = `Offline • ${total} Antrean`;
      } else if (!network.isConnected) {
        label = 'Offline • Standby';
      } else if (total > 0) {
        label = `Syncing (${total})`;
      } else {
        label = 'Online • Synced';
      }

      return { isOnline: network.isConnected, ...stats, label };
    },
    refetchInterval: 3000,
  });
};
