import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, SafeAreaView } from 'react-native';
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
    await processSyncQueue(db);
    await refetch();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Sync Health & Queue' }} />

      <View style={styles.statusSection}>
        <Text style={styles.sectionLabel}>STATUS SISTEM</Text>
        <Text style={styles.statusText}>
          Koneksi: {network.isConnected ? 'Online' : 'Offline'} ({network.type})
        </Text>
      </View>

      <Text style={styles.sectionLabel}>ANTREAN OUTBOX ({tasks?.length ?? 0} Item)</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.task_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={styles.taskCard}>
            <Text style={styles.taskIndex}>{index + 1}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskEndpoint}>
                {item.http_method} {item.endpoint}
              </Text>
              <Text style={styles.taskMeta}>
                Idempotency: {item.idempotency_key.substring(0, 8)}...
              </Text>
              <Text style={styles.taskMeta}>Status: {item.status}</Text>
              {item.retry_count > 0 && (
                <Text style={styles.taskMeta}>Retry: {item.retry_count}/{item.max_retries}</Text>
              )}
              {item.last_error && (
                <Text style={[styles.taskMeta, { color: colors.syncConflict }]} numberOfLines={1}>
                  Error: {item.last_error}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="✓"
            title="Antrean Sinkronisasi Bersih"
            subtitle="Tidak ada transaksi tertunda. Seluruh data lokal selaras dengan server pusat."
          />
        }
      />

      <View style={styles.footer}>
        <Pressable
          style={styles.syncButton}
          onPress={handleForceSync}
          accessibilityRole="button"
          accessibilityLabel="Paksa sinkronisasi sekarang"
        >
          <Text style={styles.syncButtonText}>⟳ PAKSA SINKRONISASI SEKARANG</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  statusSection: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: typography.body2.fontSize,
    marginTop: spacing.xs,
  },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: 80 },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  taskIndex: {
    color: colors.textTertiary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
    marginRight: spacing.sm,
    width: 24,
  },
  taskEndpoint: {
    color: colors.textPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  taskMeta: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
  },
  syncButton: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
