import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { colors, spacing, typography, radii } from '../src/shared/theme/tokens';
import { SyncStatusPill } from '../src/shared/components/SyncStatusPill';
import { TransactionCard } from '../src/shared/components/TransactionCard';
import { EmptyState } from '../src/shared/components/EmptyState';
import { useTransactions } from '../src/features/inventory/hooks/useInventory';
import { useSyncStatus } from '../src/features/sync/hooks/useSyncStatus';
import { useDatabaseReady } from '../src/core/database/provider';
import { startNetworkMonitor } from '../src/core/network/networkMonitor';

export default function HomeScreen() {
  const router = useRouter();
  const { data: transactions, isLoading, refetch } = useTransactions();
  const { data: syncStatus } = useSyncStatus();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    startNetworkMonitor();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const totalToday = transactions?.length ?? 0;
  const pendingCount = syncStatus?.pending ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => <Text style={styles.headerTitle}>FIELDSYNC</Text>,
          headerRight: () => (
            <SyncStatusPill onPress={() => router.push('/sync-queue')} />
          ),
        }}
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL TRANSAKSI</Text>
          <Text style={styles.summaryValue}>{totalToday}</Text>
        </View>
        <View style={[styles.summaryCard, { marginLeft: spacing.sm }]}>
          <Text style={styles.summaryLabel}>MENUNGGU SYNC</Text>
          <Text style={[styles.summaryValue, pendingCount > 0 && { color: colors.syncPending }]}>
            {pendingCount} Antrean
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>RIWAYAT MUTASI TERBARU</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat transaksi...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onConflictPress={() => router.push(`/conflict/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="—"
              title="Belum Ada Transaksi Hari Ini"
              subtitle="Semua mutasi barang masuk dan keluar yang Anda catat akan muncul di sini."
            />
          }
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/new-transaction')}
        accessibilityRole="button"
        accessibilityLabel="Catat transaksi baru"
      >
        <Text style={styles.fabText}>+ CATAT TRANSAKSI BARU</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading2.fontSize,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  summaryLabel: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: typography.heading2.fontSize,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.body1.fontSize,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.textPrimary,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: colors.bgPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
