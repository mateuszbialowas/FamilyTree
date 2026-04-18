import React, { useMemo } from 'react';
import {
  View, Text, Modal, FlatList, Pressable, TouchableOpacity, StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFamily } from '../context/FamilyContext';
import type { HistoryEntry } from '../context/FamilyContext';
import { EmptyState } from './ui/EmptyState';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { t } from '../i18n';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Row =
  | { kind: 'past'; index: number; entry: HistoryEntry }
  | { kind: 'present'; entry: HistoryEntry }
  | { kind: 'future'; index: number; entry: HistoryEntry };

export function HistoryModal({ visible, onClose }: Props) {
  const { pastEntries, futureEntries, presentEntry, jumpTo } = useFamily();

  const rows: Row[] = useMemo(() => {
    // Kolejność: najstarszy past u góry → present → najbliższa przyszłość → odległa
    const r: Row[] = [];
    pastEntries.forEach((entry, index) => r.push({ kind: 'past', index, entry }));
    r.push({ kind: 'present', entry: presentEntry });
    futureEntries.forEach((entry, index) => r.push({ kind: 'future', index, entry }));
    return r;
  }, [pastEntries, futureEntries, presentEntry]);

  const isEmpty = pastEntries.length === 0 && futureEntries.length === 0;

  const handleRowPress = (row: Row) => {
    if (row.kind === 'present') return;
    jumpTo({ direction: row.kind, index: row.index });
    onClose();
  };

  const renderRow = ({ item }: { item: Row }) => {
    const isPresent = item.kind === 'present';
    const isFuture = item.kind === 'future';
    const testID =
      item.kind === 'present'
        ? 'history-row-present'
        : `history-row-${item.kind}-${item.index}`;

    return (
      <TouchableOpacity
        testID={testID}
        style={styles.row}
        onPress={() => handleRowPress(item)}
        disabled={isPresent}
        activeOpacity={0.6}
      >
        <View style={styles.rowContent}>
          <Text
            style={[
              styles.label,
              isPresent && styles.labelPresent,
              isFuture && styles.labelFuture,
            ]}
            numberOfLines={2}
          >
            {item.entry.label}
          </Text>
          <Text style={[styles.timestamp, isFuture && styles.labelFuture]}>
            {formatRelativeTime(item.entry.timestamp)}
          </Text>
        </View>
        {isPresent && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{t.history.currentChip}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        testID="history-backdrop"
      >
        <Pressable style={styles.sheet} onPress={() => { /* swallow */ }}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.history.title}</Text>
            <TouchableOpacity onPress={onClose} testID="history-close">
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {isEmpty ? (
            <EmptyState
              icon="history"
              title={t.history.emptyTitle}
              subtitle={t.history.emptySubtitle}
            />
          ) : (
            <FlatList
              testID="history-list"
              data={rows}
              keyExtractor={(item) =>
                item.kind === 'present' ? 'present' : `${item.kind}-${item.index}`
              }
              renderItem={renderRow}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '75%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  labelPresent: {
    fontFamily: fonts.bodyBold,
  },
  labelFuture: {
    color: colors.textMuted,
  },
  timestamp: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs,
    color: colors.white,
  },
});
