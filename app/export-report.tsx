import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radii } from '../src/shared/theme/tokens';
import { useTransactionsByDate } from '../src/features/inventory/hooks/useInventory';
import { generateAndShareReportPdf } from '../src/features/inventory/services/pdfReportService';
import { EmptyState } from '../src/shared/components/EmptyState';
import * as Haptics from 'expo-haptics';

export default function ExportReportScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const { data: transactions, isLoading } = useTransactionsByDate(selectedDate);

  const formatDateHeader = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevDay = () => {
    Haptics.selectionAsync();
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    Haptics.selectionAsync();
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    Haptics.selectionAsync();
    setSelectedDate(new Date());
  };

  const dateStr = formatDateHeader(selectedDate);

  const handleExportPdf = async () => {
    if (!transactions) return;
    setIsExporting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await generateAndShareReportPdf({
        dateString: dateStr,
        transactions,
      });
    } catch {
      Alert.alert('Gagal Ekspor', 'Terjadi kesalahan saat memproses file PDF laporan.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalInbound = transactions?.filter((t) => t.type === 'INBOUND').reduce((sum, t) => sum + t.quantity, 0) ?? 0;
  const totalOutbound = transactions?.filter((t) => t.type === 'OUTBOUND').reduce((sum, t) => sum + t.quantity, 0) ?? 0;
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Laporan Mutasi PDF' }} />

      <View style={styles.dateSelectorCard}>
        <Text style={styles.selectorLabel}>PILIH TANGGAL LAPORAN</Text>
        <View style={styles.dateControlRow}>
          <Pressable style={styles.navBtn} onPress={handlePrevDay} accessibilityRole="button">
            <Text style={styles.navBtnText}>HARI SEBELUMNYA</Text>
          </Pressable>

          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          <Pressable style={styles.navBtn} onPress={handleNextDay} accessibilityRole="button">
            <Text style={styles.navBtnText}>HARI BERIKUTNYA</Text>
          </Pressable>
        </View>

        <Pressable style={styles.todayBtn} onPress={handleToday}>
          <Text style={styles.todayBtnText}>RESET KE HARI INI</Text>
        </Pressable>
      </View>

      <View style={styles.statsSummaryRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL TRANSAKSI</Text>
          <Text style={styles.statValue}>{transactions?.length ?? 0}</Text>
        </View>
        <View style={[styles.statBox, { marginLeft: spacing.sm }]}>
          <Text style={styles.statLabel}>MASUK</Text>
          <Text style={[styles.statValue, { color: colors.badgeInboundText }]}>+{totalInbound}</Text>
        </View>
        <View style={[styles.statBox, { marginLeft: spacing.sm }]}>
          <Text style={styles.statLabel}>KELUAR</Text>
          <Text style={[styles.statValue, { color: colors.badgeOutboundText }]}>-{totalOutbound}</Text>
        </View>
      </View>

      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>PRATINJAU CATATAN TRANSAKSI</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding + 64 }]}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txSku}>{item.sku}</Text>
                <Text style={styles.txName}>{item.item_name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.txQty,
                    { color: item.type === 'INBOUND' ? colors.badgeInboundText : colors.badgeOutboundText },
                  ]}
                >
                  {item.type === 'INBOUND' ? '+' : '-'}{item.quantity} Unit
                </Text>
                <Text style={styles.txType}>{item.type}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="0"
              title="Tidak Ada Catatan"
              subtitle={`Tidak ada mutasi barang yang tercatat pada tanggal ${dateStr}.`}
            />
          }
        />
      )}

      <View style={[styles.footer, { bottom: bottomPadding }]}>
        <Pressable
          style={[styles.downloadBtn, (isExporting || isLoading) && styles.btnDisabled]}
          onPress={handleExportPdf}
          disabled={isExporting || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Download Laporan PDF"
        >
          {isExporting ? (
            <ActivityIndicator color={colors.bgPrimary} />
          ) : (
            <Text style={styles.downloadBtnText}>UNDUH LAPORAN PDF</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  dateSelectorCard: {
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    padding: spacing.md,
  },
  selectorLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  dateControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  navBtn: {
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  navBtnText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateDisplay: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: typography.body1.fontSize,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  todayBtn: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
  },
  todayBtnText: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: typography.body1.fontSize,
    fontWeight: '700',
  },
  previewHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  previewTitle: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  txSku: {
    color: colors.textPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
  },
  txName: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
  },
  txQty: {
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
  },
  txType: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  downloadBtn: {
    backgroundColor: colors.textPrimary,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  downloadBtnText: {
    color: colors.bgPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
