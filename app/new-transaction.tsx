import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { colors, spacing, typography, radii } from '../src/shared/theme/tokens';
import { useCreateTransaction } from '../src/features/inventory/hooks/useInventory';
import { type TransactionType } from '../src/core/sync/types';

export default function NewTransactionScreen() {
  const router = useRouter();
  const createTx = useCreateTransaction();

  const [sku, setSku] = useState('');
  const [itemName, setItemName] = useState('');
  const [type, setType] = useState<TransactionType>('INBOUND');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!sku.trim()) newErrors.sku = 'SKU belum dipilih atau tidak terdaftar di katalog lokal.';
    if (!itemName.trim()) newErrors.itemName = 'Nama barang wajib diisi.';
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty <= 0) newErrors.quantity = 'Kuantitas harus lebih dari 0 unit.';
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
          <Text style={styles.label}>KODE SKU / BARCODE</Text>
          <TextInput
            style={[styles.input, errors.sku && styles.inputError]}
            placeholder="Contoh: SKU-88401"
            placeholderTextColor={colors.textTertiary}
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
          />
          {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  form: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
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
});
