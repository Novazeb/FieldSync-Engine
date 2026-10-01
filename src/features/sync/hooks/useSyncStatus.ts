import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../core/database/provider';
import { getSyncQueueStats, processSyncQueue } from '../../../core/sync/syncProcessor';
import { getNetworkStatus, onReconnect } from '../../../core/network/networkMonitor';

export interface SyncStatusInfo {
  isOnline: boolean;
  pending: number;
  failed: number;
  conflict: number;
  label: string;
}

export const useSyncStatus = () => {
  const db = useDatabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = onReconnect(async () => {
      await processSyncQueue(db);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sync', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['sync', 'queue'] });
    });
    return unsub;
  }, [db, queryClient]);

  return useQuery({
    queryKey: ['sync', 'status'],
    queryFn: async (): Promise<SyncStatusInfo> => {
      const network = getNetworkStatus();
      if (network.isConnected) {
        await processSyncQueue(db);
      }
      const stats = await getSyncQueueStats(db);
      const total = stats.pending + stats.failed;

      let label: string;
      if (stats.conflict > 0) {
        label = `KONFLIK (${stats.conflict})`;
      } else if (!network.isConnected && total > 0) {
        label = `OFFLINE (${total})`;
      } else if (!network.isConnected) {
        label = 'OFFLINE';
      } else if (total > 0) {
        label = `SYNCING (${total})`;
      } else {
        label = 'SYNCED';
      }

      return { isOnline: network.isConnected, ...stats, label };
    },
    refetchInterval: 3000,
  });
};
