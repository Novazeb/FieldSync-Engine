import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { colors, spacing, typography, radii } from '../src/shared/theme/tokens';
import { SyncStatusPill } from '../src/shared/components/SyncStatusPill';
import { TransactionCard } from '../src/shared/components/TransactionCard';
import { EmptyState } from '../src/shared/components/EmptyState';
import { useTransactions, useStockSummary } from '../src/features/inventory/hooks/useInventory';
import { useSyncStatus } from '../src/features/sync/hooks/useSyncStatus';
import { startNetworkMonitor } from '../src/core/network/networkMonitor';

export default function HomeScreen() {
  const router = useRouter();
  const { data: transactions, isLoading, refetch: refetchTx } = useTransactions();
  const { data: stockList, refetch: refetchStock } = useStockSummary();
  const { data: syncStatus } = useSyncStatus();
  const [activeTab, setActiveTab] = useState<'MUTASI' | 'STOK'>('MUTASI');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    startNetworkMonitor();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTx(), refetchStock()]);
    setRefreshing(false);
  }, [refetchTx, refetchStock]);

  const totalToday = transactions?.length ?? 0;
  const totalSku = stockList?.length ?? 0;
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
          <Text style={styles.summaryLabel}>TOTAL SKU</Text>
          <Text style={styles.summaryValue}>{totalSku}</Text>
        </View>
        <View style={[styles.summaryCard, { marginLeft: spacing.sm }]}>
          <Text style={styles.summaryLabel}>MENUNGGU SYNC</Text>
          <Text style={[styles.summaryValue, pendingCount > 0 && { color: colors.syncPending }]}>
            {pendingCount}
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === 'MUTASI' && styles.tabButtonActive]}
          onPress={() => setActiveTab('MUTASI')}
        >
          <Text style={[styles.tabText, activeTab === 'MUTASI' && styles.tabTextActive]}>
            RIWAYAT MUTASI
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'STOK' && styles.tabButtonActive]}
          onPress={() => setActiveTab('STOK')}
        >
          <Text style={[styles.tabText, activeTab === 'STOK' && styles.tabTextActive]}>
            STOK GUDANG ({totalSku})
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : activeTab === 'MUTASI' ? (
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
              title="Belum Ada Transaksi"
              subtitle="Semua mutasi barang masuk dan keluar yang dicatat akan muncul di sini."
            />
          }
        />
      ) : (
        <FlatList
          data={stockList}
          keyExtractor={(item) => item.sku}
          renderItem={({ item }) => (
            <View style={styles.stockCard}>
              <View style={styles.stockCardHeader}>
                <Text style={styles.stockSku}>{item.sku}</Text>
                <View style={styles.stockQtyBadge}>
                  <Text style={styles.stockQtyText}>
                    Sisa: {item.currentStock} Unit
                  </Text>
                </View>
              </View>
              <Text style={styles.stockItemName}>{item.itemName}</Text>
              <View style={styles.stockSubRow}>
                <Text style={styles.stockSubText}>
                  Masuk: <Text style={{ color: colors.badgeInboundText }}>+{item.totalInbound}</Text>
                </Text>
                <Text style={[styles.stockSubText, { marginLeft: spacing.md }]}>
                  Keluar: <Text style={{ color: colors.badgeOutboundText }}>-{item.totalOutbound}</Text>
                </Text>
              </View>
            </View>
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
              icon="📦"
              title="Belum Ada Stok Barang"
              subtitle="Catat transaksi masuk pertama untuk memulai penghitungan stok otomatis."
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
    padding: spacing.sm + 2,
  },
  summaryLabel: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: typography.body1.fontSize + 2,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 0,
    borderRadius: radii.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.bgSubtle,
  },
  tabText: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.textPrimary,
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
  stockCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockSku: {
    color: colors.textPrimary,
    fontSize: typography.body1.fontSize,
    fontWeight: '700',
  },
  stockQtyBadge: {
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  stockQtyText: {
    color: colors.syncOnline,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  stockItemName: {
    color: colors.textSecondary,
    fontSize: typography.body2.fontSize,
    marginBottom: spacing.xs,
  },
  stockSubRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  stockSubText: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
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
