import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, radii } from '../src/shared/theme/tokens';
import { useCreateTransaction, useStockSummary } from '../src/features/inventory/hooks/useInventory';
import { type TransactionType } from '../src/core/sync/types';

export default function NewTransactionScreen() {
  const router = useRouter();
  const createTx = useCreateTransaction();
  const { data: stockList } = useStockSummary();
  const [permission, requestPermission] = useCameraPermissions();

  const [sku, setSku] = useState('');
  const [itemName, setItemName] = useState('');
  const [type, setType] = useState<TransactionType>('INBOUND');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isScanning, setIsScanning] = useState(false);

  const matchedStock = stockList?.find(
    (item) => item.sku.toUpperCase() === sku.trim().toUpperCase()
  );
  const currentStock = matchedStock?.currentStock ?? 0;

  const handleSkuChange = (val: string) => {
    setSku(val);
    const existing = stockList?.find(
      (item) => item.sku.toUpperCase() === val.trim().toUpperCase()
    );
    if (existing && !itemName) {
      setItemName(existing.itemName);
    }
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Izin Kamera', 'Izin kamera dibutuhkan untuk memindai barcode fisik barang.');
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!result.data) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleSkuChange(result.data.trim());
    setIsScanning(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!sku.trim()) newErrors.sku = 'SKU belum diisi.';
    if (!itemName.trim()) newErrors.itemName = 'Nama barang wajib diisi.';
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Kuantitas harus lebih dari 0 unit.';
    } else if (type === 'OUTBOUND' && matchedStock && qty > currentStock) {
      newErrors.quantity = `Kuantitas melebihi stok tersedia (${currentStock} unit).`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createTx.mutateAsync({
        sku: sku.trim(),
        itemName: itemName.trim(),
        type,
        quantity: parseInt(quantity, 10),
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan ke database lokal.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Catat Transaksi Baru' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>KODE SKU / BARCODE</Text>
            <Pressable
              style={styles.scanBtn}
              onPress={handleOpenScanner}
              accessibilityRole="button"
              accessibilityLabel="Pindai barcode dengan kamera"
            >
              <Text style={styles.scanBtnText}>📷 SCAN BARCODE</Text>
            </Pressable>
          </View>

          <TextInput
            style={[styles.input, errors.sku && styles.inputError]}
            placeholder="Contoh: SKU-88401"
            placeholderTextColor={colors.textTertiary}
            value={sku}
            onChangeText={handleSkuChange}
            autoCapitalize="characters"
          />
          {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}

          {sku.trim().length > 0 && (
            <View style={styles.stockNoticeBox}>
              <Text style={styles.stockNoticeLabel}>STOK TERSEDIA SAAT INI:</Text>
              <Text
                style={[
                  styles.stockNoticeValue,
                  { color: currentStock > 0 ? colors.syncOnline : colors.syncPending },
                ]}
              >
                {currentStock} Unit {matchedStock ? `(${matchedStock.itemName})` : '(SKU Baru)'}
              </Text>
            </View>
          )}

          <Text style={styles.label}>NAMA BARANG</Text>
          <TextInput
            style={[styles.input, errors.itemName && styles.inputError]}
            placeholder="Nama produk / deskripsi"
            placeholderTextColor={colors.textTertiary}
            value={itemName}
            onChangeText={setItemName}
          />
          {errors.itemName && <Text style={styles.errorText}>{errors.itemName}</Text>}

          <Text style={styles.label}>TIPE MUTASI</Text>
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeButton, type === 'INBOUND' && styles.typeActive]}
              onPress={() => setType('INBOUND')}
              accessibilityRole="button"
            >
              <Text style={[styles.typeText, type === 'INBOUND' && styles.typeTextActive]}>
                ↓ BARANG MASUK
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeButton, { marginLeft: spacing.sm }, type === 'OUTBOUND' && styles.typeActiveOut]}
              onPress={() => setType('OUTBOUND')}
              accessibilityRole="button"
            >
              <Text style={[styles.typeText, type === 'OUTBOUND' && styles.typeTextActiveOut]}>
                ↑ BARANG KELUAR
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>KUANTITAS (UNIT)</Text>
          <TextInput
            style={[styles.input, errors.quantity && styles.inputError]}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}

          <Text style={styles.label}>CATATAN (OPSIONAL)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nomor palet, kondisi kemasan, atau catatan fisik..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <Pressable
            style={[styles.submitButton, createTx.isPending && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={createTx.isPending}
            accessibilityRole="button"
            accessibilityLabel="Simpan transaksi"
          >
            <Text style={styles.submitText}>SIMPAN TRANSAKSI</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isScanning}
        animationType="slide"
        onRequestClose={() => setIsScanning(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ARAHKAN KE BARCODE / QR</Text>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setIsScanning(false)}
            >
              <Text style={styles.modalCloseText}>✕ TUTUP</Text>
            </Pressable>
          </View>

          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'code128', 'code39', 'upc_a'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerTargetBox} />
              <Text style={styles.scannerHint}>
                Posisikan kode barcode tepat di dalam kotak
              </Text>
            </View>
          </CameraView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  form: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scanBtn: {
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: 2,
  },
  scanBtnText: {
    color: colors.syncOnline,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    color: colors.textPrimary,
    fontSize: typography.body1.fontSize,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  inputError: { borderColor: colors.syncConflict },
  stockNoticeBox: {
    backgroundColor: colors.bgSubtle,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockNoticeLabel: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    letterSpacing: 0.5,
  },
  stockNoticeValue: {
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { color: colors.syncConflict, fontSize: typography.caption.fontSize, marginTop: spacing.xs },
  typeRow: { flexDirection: 'row' },
  typeButton: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeActive: { borderColor: colors.badgeInboundText, backgroundColor: colors.badgeInboundBg },
  typeActiveOut: { borderColor: colors.badgeOutboundText, backgroundColor: colors.badgeOutboundBg },
  typeText: { color: colors.textSecondary, fontSize: typography.body2.fontSize, fontWeight: '600' },
  typeTextActive: { color: colors.badgeInboundText },
  typeTextActiveOut: { color: colors.badgeOutboundText },
  submitButton: {
    backgroundColor: colors.textPrimary,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.bgPrimary, fontSize: typography.body2.fontSize, fontWeight: '700', letterSpacing: 0.5 },

  modalContainer: { flex: 1, backgroundColor: colors.bgPrimary },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgPrimary,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.bgSubtle,
    borderRadius: 2,
  },
  modalCloseText: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  camera: { flex: 1 },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scannerTargetBox: {
    width: 260,
    height: 180,
    borderWidth: 2,
    borderColor: colors.syncOnline,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  scannerHint: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.md,
    fontWeight: '600',
  },
});
