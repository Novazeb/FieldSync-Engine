import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../core/database/provider';
import {
  insertTransactionAtomic,
  getAllTransactions,
  resolveConflictKeepLocal,
  resolveConflictAcceptServer,
} from '../data/inventoryLocalRepo';
import { processSyncQueue } from '../../../core/sync/syncProcessor';
import { type CreateTransactionDTO } from '../../../core/sync/types';
import * as Haptics from 'expo-haptics';

const QUERY_KEY = ['inventory', 'transactions'] as const;

export const useTransactions = () => {
  const db = useDatabase();
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getAllTransactions(db),
    refetchInterval: 3000,
  });
};

export const useCreateTransaction = () => {
  const db = useDatabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTransactionDTO) => insertTransactionAtomic(db, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['sync', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['sync', 'queue'] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Asynchronously trigger immediate outbox flush if online
      processSyncQueue(db).then(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['sync', 'status'] });
        queryClient.invalidateQueries({ queryKey: ['sync', 'queue'] });
      }).catch(() => {});
    },
  });
};

export const useResolveConflict = () => {
  const db = useDatabase();
  const queryClient = useQueryClient();

  const keepLocal = useMutation({
    mutationFn: (txId: string) => resolveConflictKeepLocal(db, txId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['sync', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['sync', 'queue'] });
      processSyncQueue(db).then(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['sync', 'status'] });
        queryClient.invalidateQueries({ queryKey: ['sync', 'queue'] });
      }).catch(() => {});
    },
  });

  const acceptServer = useMutation({
    mutationFn: (args: { txId: string; serverData: { quantity: number; version: number } }) =>
      resolveConflictAcceptServer(db, args.txId, args.serverData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['sync', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['sync', 'queue'] });
    },
  });

  return { keepLocal, acceptServer };
};
