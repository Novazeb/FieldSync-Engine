import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { type InventoryTransaction } from '../../core/sync/types';

interface TransactionCardProps {
  transaction: InventoryTransaction;
  onConflictPress?: (id: string) => void;
}

const statusConfig = {
  SYNCED: { label: 'SYNCED', color: colors.syncOnline },
  PENDING: { label: 'PENDING', color: colors.syncPending },
  FAILED: { label: 'FAILED', color: colors.syncConflict },
  CONFLICT: { label: 'CONFLICT', color: colors.syncConflict },
} as const;

const formatTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const TransactionCard = ({ transaction, onConflictPress }: TransactionCardProps) => {
  const isInbound = transaction.type === 'INBOUND';
  const status = statusConfig[transaction.sync_status];
  const qtyPrefix = isInbound ? '+' : '-';

  return (
    <Pressable
      style={styles.card}
      onPress={transaction.sync_status === 'CONFLICT' ? () => onConflictPress?.(transaction.id) : undefined}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: isInbound ? colors.badgeInboundBg : colors.badgeOutboundBg },
          ]}
        >
          <Text
            style={[
              styles.typeBadgeText,
              { color: isInbound ? colors.badgeInboundText : colors.badgeOutboundText },
            ]}
          >
            {isInbound ? 'INBOUND' : 'OUTBOUND'}
          </Text>
        </View>
        <Text style={styles.sku}>{transaction.sku}</Text>
        <Text style={[styles.quantity, { color: isInbound ? colors.badgeInboundText : colors.badgeOutboundText }]}>
          {qtyPrefix}{transaction.quantity} UNIT
        </Text>
      </View>

      <Text style={styles.itemName} numberOfLines={1}>
        {transaction.item_name}
        {transaction.notes ? ` (${transaction.notes})` : ''}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={styles.meta}>{formatTime(transaction.created_at)}</Text>
        <View style={[styles.statusBadge, { borderColor: status.color }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
  },
  typeBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    letterSpacing: 0.5,
  },
  sku: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body2.fontSize,
    fontWeight: typography.body2.fontWeight,
  },
  quantity: {
    fontSize: typography.body1.fontSize,
    fontWeight: '700',
  },
  itemName: {
    color: colors.textSecondary,
    fontSize: typography.body2.fontSize,
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: colors.bgSubtle,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
