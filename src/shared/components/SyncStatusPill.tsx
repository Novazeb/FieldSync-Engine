import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { useSyncStatus } from '../../features/sync/hooks/useSyncStatus';

interface SyncStatusPillProps {
  onPress?: () => void;
}

export const SyncStatusPill = ({ onPress }: SyncStatusPillProps) => {
  const { data } = useSyncStatus();
  if (!data) return null;

  const dotColor = data.conflict > 0
    ? colors.syncConflict
    : data.isOnline
      ? data.pending > 0 ? colors.syncActive : colors.syncOnline
      : colors.syncPending;

  return (
    <Pressable onPress={onPress} style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{data.label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    height: 36,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 0,
    marginRight: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
