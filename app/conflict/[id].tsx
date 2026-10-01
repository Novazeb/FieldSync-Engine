import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../../src/core/database/provider';
import { getTransactionById } from '../../src/features/inventory/data/inventoryLocalRepo';
import { useResolveConflict } from '../../src/features/inventory/hooks/useInventory';
import { colors, spacing, typography, radii } from '../../src/shared/theme/tokens';
import * as Haptics from 'expo-haptics';

export default function ConflictResolutionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { keepLocal, acceptServer } = useResolveConflict();

  const { data: tx, isLoading } = useQuery({
    queryKey: ['inventory', 'transaction', id],
    queryFn: () => (id ? getTransactionById(db, id) : null),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!tx) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Transaksi tidak ditemukan.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>KEMBALI</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleKeepLocal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await keepLocal.mutateAsync(tx.id);
    router.back();
  };

  const handleAcceptServer = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await acceptServer.mutateAsync({
      txId: tx.id,
      serverData: { quantity: tx.quantity, version: tx.version + 1 },
    });
    router.back();
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Resolusi Konflik Data' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 32 }]}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>PERBEDAAN VERSI DATA (409 CONFLICT)</Text>
          <Text style={styles.bannerDesc}>
            Data ini telah diperbarui di server pusat oleh pengguna lain saat perangkat Anda offline.
            Pilih versi yang ingin Anda pertahankan di sistem.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>PERBANDINGAN REKONSILIASI</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardBadgeLocal}>VERSI LOKAL (PERANGKAT)</Text>
            <Text style={styles.versionTag}>v{tx.version}</Text>
          </View>
          <Text style={styles.skuText}>{tx.sku}: {tx.item_name}</Text>
          <Text style={styles.detailText}>Tipe Mutasi: {tx.type}</Text>
          <Text style={styles.qtyText}>Kuantitas: {tx.quantity} Unit</Text>
          {tx.notes && <Text style={styles.notesText}>Catatan: {tx.notes}</Text>}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardBadgeServer}>VERSI SERVER PUSAT</Text>
            <Text style={styles.versionTag}>v{tx.version + 1}</Text>
          </View>
          <Text style={styles.skuText}>{tx.sku}: {tx.item_name}</Text>
          <Text style={styles.detailText}>Tipe Mutasi: {tx.type}</Text>
          <Text style={styles.qtyText}>Status Server: Diverifikasi Master DB</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.btnKeepLocal]}
            onPress={handleKeepLocal}
            disabled={keepLocal.isPending || acceptServer.isPending}
          >
            <Text style={styles.btnKeepText}>
              PERTAHANKAN DATA LOKAL (TIMPA SERVER)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.btnAcceptServer]}
            onPress={handleAcceptServer}
            disabled={keepLocal.isPending || acceptServer.isPending}
          >
            <Text style={styles.btnAcceptText}>
              TERIMA DATA SERVER (PERBARUI LOKAL)
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  banner: {
    backgroundColor: '#3B1812',
    borderWidth: 1,
    borderColor: colors.syncConflict,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerTitle: {
    color: colors.syncConflict,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  bannerDesc: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
  },
  sectionTitle: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardBadgeLocal: {
    color: colors.syncActive,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  cardBadgeServer: {
    color: colors.syncOnline,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  versionTag: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  skuText: {
    color: colors.textPrimary,
    fontSize: typography.body1.fontSize,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: typography.body2.fontSize,
    marginBottom: 2,
  },
  qtyText: {
    color: colors.textPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
  },
  notesText: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    marginTop: 4,
  },
  actions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    height: 48,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  btnKeepLocal: {
    backgroundColor: colors.bgSubtle,
  },
  btnKeepText: {
    color: colors.textPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
  },
  btnAcceptServer: {
    backgroundColor: colors.textPrimary,
  },
  btnAcceptText: {
    color: colors.bgPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
  },
  errorText: { color: colors.textSecondary, marginBottom: spacing.md },
  backBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: radii.sm,
  },
  backBtnText: { color: colors.textPrimary, fontWeight: '700' },
});
