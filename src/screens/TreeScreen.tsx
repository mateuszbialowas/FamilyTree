import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFamily } from '../context/FamilyContext';
import { NodeContextMenu, type RelationType } from '../components/tree/NodeContextMenu';
import {
  consumeInitialTreeRootId,
  consumeInitialTreeRootName,
} from '../utils/screenshotMode';
import { loadRootId, saveRootId } from '../utils/storage';
import { FamilyTreeCanvas } from '../components/tree/FamilyTreeCanvas';
import { EmptyState } from '../components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export function TreeScreen() {
  const { t } = useTranslation();
  const { state } = useFamily();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [rootId, setRootId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  // Person whose long-press context menu is open (null = closed).
  const [menuPersonId, setMenuPersonId] = useState<string | null>(null);

  useEffect(() => {
    // rootId is consumed first (locale-independent). Fall back to
    // rootName for human-readable deep links.
    const pendingId = consumeInitialTreeRootId();
    if (pendingId && state.people.some(p => p.id === pendingId)) {
      setRootId(pendingId);
      return;
    }
    const pendingName = consumeInitialTreeRootName();
    if (!pendingName) return;
    const target = pendingName.toLowerCase();
    const match = state.people.find(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase() === target,
    );
    if (match) setRootId(match.id);
  }, [state.people]);

  // Restore the user's last chosen root once on launch (separate storage key, so
  // family data is never touched). Skipped if a deep link or pick already set it.
  const rootRestored = React.useRef(false);
  useEffect(() => {
    if (rootRestored.current || state.people.length === 0) return;
    rootRestored.current = true;
    loadRootId().then(savedId => {
      if (savedId && state.people.some(p => p.id === savedId)) {
        setRootId(prev => prev ?? savedId);
      }
    });
  }, [state.people]);

  const effectiveRootId = rootId && state.people.some(p => p.id === rootId)
    ? rootId
    : state.people[0]?.id ?? null;

  const rootPerson = state.people.find(p => p.id === effectiveRootId);

  const handleNodePress = useCallback((personId: string) => {
    navigation.navigate('PersonDetail', { personId, rootId: effectiveRootId });
  }, [navigation, effectiveRootId]);

  const handleNodeLongPress = useCallback((personId: string) => {
    setMenuPersonId(personId);
  }, []);

  const handleAddRelation = useCallback((relationType: RelationType) => {
    const personId = menuPersonId;
    setMenuPersonId(null);
    if (personId) {
      navigation.navigate('AddPerson', { relatedPersonId: personId, relationType });
    }
  }, [navigation, menuPersonId]);

  if (state.people.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="family-tree"
          title={t('tree.emptyTitle')}
          subtitle={t('tree.emptySubtitle')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Root person selector */}
      <TouchableOpacity style={styles.selectorBar} onPress={() => setPickerVisible(true)} testID="tree-root-selector">
        <Text style={styles.selectorLabel}>{t('tree.rootLabel')}</Text>
        <Text style={styles.selectorName} numberOfLines={1}>
          {rootPerson ? `${rootPerson.firstName} ${rootPerson.lastName}` : '—'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Tree canvas */}
      {effectiveRootId && (
        <FamilyTreeCanvas
          state={state}
          rootId={effectiveRootId}
          onNodePress={handleNodePress}
          onNodeLongPress={handleNodeLongPress}
        />
      )}

      {/* Root picker modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerVisible(false)}
          testID="picker-backdrop"
        >
          <Pressable style={styles.modalContent} onPress={() => { /* swallow tap */ }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('tree.rootPickerTitle')}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} testID="picker-close">
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={state.people}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item.id === effectiveRootId && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setRootId(item.id);
                    saveRootId(item.id);
                    setPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      item.id === effectiveRootId && styles.pickerItemTextActive,
                    ]}
                  >
                    {item.firstName} {item.lastName}
                  </Text>
                  {item.birthDate && (
                    <Text style={styles.pickerItemDate}>{t('tree.bornPrefix')} {item.birthDate}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Long-press node context menu */}
      <NodeContextMenu
        personId={menuPersonId}
        rootId={effectiveRootId}
        onClose={() => setMenuPersonId(null)}
        onAddRelation={handleAddRelation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectorLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  selectorName: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerItemActive: {
    backgroundColor: colors.surface,
  },
  pickerItemText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  pickerItemTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  pickerItemDate: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
});
