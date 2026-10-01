import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography, radii } from '../src/shared/theme/tokens';
import { EmptyState } from '../src/shared/components/EmptyState';
import { useDatabase, useDatabaseReady } from '../src/core/database/provider';
import { getNetworkStatus } from '../src/core/network/networkMonitor';
import { processSyncQueue } from '../src/core/sync/syncProcessor';
import { type SyncTask } from '../src/core/sync/types';
import * as Haptics from 'expo-haptics';

export default function SyncQueueScreen() {
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const isReady = useDatabaseReady();
  const network = getNetworkStatus();

  const { data: tasks, refetch } = useQuery({
    queryKey: ['sync', 'queue'],
    queryFn: () => db.getAllAsync<SyncTask>(
      `SELECT * FROM sync_queue ORDER BY created_at DESC;`
    ),
    enabled: isReady,
    refetchInterval: 3000,
  });

  const handleForceSync = async () => {
    await processSyncQueue(db, { force: true });
    await refetch();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Sync Health & Queue' }} />

      <View style={styles.statusSection}>
        <Text style={styles.statusSectionLabel}>STATUS SISTEM</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Koneksi:</Text>
          <Text style={styles.statusValue}>
            {network.isConnected ? 'Online' : 'Offline'} ({network.type})
          </Text>
        </View>
      </View>

      <View style={styles.listHeaderRow}>
        <Text style={styles.queueHeaderLabel}>ANTREAN OUTBOX</Text>
        <Text style={styles.queueHeaderCount}>{tasks?.length ?? 0} ITEM</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.task_id}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding + 64 }]}
        renderItem={({ item, index }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskCardHeader}>
              <View style={styles.endpointBadge}>
                <Text style={styles.taskEndpoint}>
                  {item.http_method} {item.endpoint}
                </Text>
              </View>
              <Text style={styles.taskIndex}>#{index + 1}</Text>
            </View>

            <View style={styles.taskDetails}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>IDEMPOTENCY</Text>
                <Text style={styles.metaValue}>
                  {item.idempotency_key.substring(0, 12)}...
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>STATUS</Text>
                <Text style={styles.metaValue}>{item.status}</Text>
              </View>
              {item.retry_count > 0 && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>RETRY</Text>
                  <Text style={styles.metaValue}>{item.retry_count} / {item.max_retries}</Text>
                </View>
              )}
              {item.last_error && (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.syncConflict }]}>ERROR</Text>
                  <Text style={[styles.metaValue, { color: colors.syncConflict }]} numberOfLines={1}>
                    {item.last_error}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="0"
            title="Antrean Sinkronisasi Bersih"
            subtitle="Tidak ada transaksi tertunda. Seluruh data lokal selaras dengan server pusat."
          />
        }
      />

      <View style={[styles.footer, { bottom: bottomPadding }]}>
        <Pressable
          style={styles.syncButton}
          onPress={handleForceSync}
          accessibilityRole="button"
          accessibilityLabel="Paksa sinkronisasi sekarang"
        >
          <Text style={styles.syncButtonText}>SINKRONISASI SEKARANG</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  statusSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  statusSectionLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: typography.body2.fontSize,
  },
  statusValue: {
    color: colors.textPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  queueHeaderLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  queueHeaderCount: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  taskCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  endpointBadge: {
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  taskEndpoint: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  taskIndex: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  taskDetails: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  metaValue: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  syncButton: {
    backgroundColor: colors.textPrimary,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonText: {
    color: colors.bgPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
