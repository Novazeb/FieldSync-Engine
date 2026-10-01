import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, radii } from '../theme/tokens';
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        pressed && styles.pillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Status sinkronisasi: ${data.label}`}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{data.label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pillPressed: {
    opacity: 0.75,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
