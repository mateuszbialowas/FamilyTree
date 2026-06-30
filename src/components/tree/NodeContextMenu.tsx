import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { siblingGroup } from '../../utils/siblingOrder';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export type RelationType = 'parent' | 'child' | 'spouse' | 'sibling';

type Props = {
  /** Person whose menu is shown; `null` keeps the menu closed. */
  personId: string | null;
  onClose: () => void;
  onAddRelation: (relationType: RelationType) => void;
};

type AddAction = { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; relationType: RelationType; labelKey: string; testID: string };

const ADD_ACTIONS: readonly AddAction[] = [
  { icon: 'arrow-up-bold-circle-outline', relationType: 'parent', labelKey: 'tree.longPressAddParent', testID: 'menu-add-parent' },
  { icon: 'arrow-down-bold-circle-outline', relationType: 'child', labelKey: 'tree.longPressAddChild', testID: 'menu-add-child' },
  { icon: 'heart-outline', relationType: 'spouse', labelKey: 'tree.longPressAddSpouse', testID: 'menu-add-spouse' },
  { icon: 'account-multiple-outline', relationType: 'sibling', labelKey: 'tree.longPressAddSibling', testID: 'menu-add-sibling' },
];

/**
 * Bottom-sheet shown on long-pressing a tree node. Offers reordering the person
 * among their siblings (arrows stay open for repeated taps, with the tree
 * updating live behind) and shortcuts to add a related person.
 */
export function NodeContextMenu({ personId, onClose, onAddRelation }: Props) {
  const { t } = useTranslation();
  const { state, dispatch } = useFamily();

  const person = personId ? state.people.find(p => p.id === personId) ?? null : null;
  // Recomputed each render, so the position label and arrow availability update
  // immediately after each reorder dispatch.
  const siblings = personId ? siblingGroup(personId, state) : [];
  const index = person ? siblings.findIndex(p => p.id === person.id) : -1;
  const hasSiblings = siblings.length > 1;
  const canMoveLeft = index > 0;
  const canMoveRight = index >= 0 && index < siblings.length - 1;

  const move = (direction: 'left' | 'right') => {
    if (personId) dispatch({ type: 'REORDER_SIBLING', payload: { personId, direction } });
  };

  return (
    <Modal visible={personId !== null} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} testID="node-menu-backdrop">
        <Pressable style={styles.sheet} onPress={() => { /* swallow tap */ }}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {person ? `${person.firstName} ${person.lastName}` : ''}
            </Text>
            <TouchableOpacity onPress={onClose} testID="node-menu-close">
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {hasSiblings && (
            <View style={styles.orderSection}>
              <Text style={styles.orderTitle}>{t('tree.siblingOrderTitle')}</Text>
              <View style={styles.orderRow}>
                <ArrowButton
                  testID="btn-sibling-left"
                  icon="chevron-left"
                  enabled={canMoveLeft}
                  label={t('tree.moveSiblingLeft')}
                  onPress={() => move('left')}
                />
                <Text style={styles.orderPosition}>{index + 1} / {siblings.length}</Text>
                <ArrowButton
                  testID="btn-sibling-right"
                  icon="chevron-right"
                  enabled={canMoveRight}
                  label={t('tree.moveSiblingRight')}
                  onPress={() => move('right')}
                />
              </View>
            </View>
          )}

          {ADD_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.relationType}
              testID={action.testID}
              style={styles.action}
              onPress={() => onAddRelation(action.relationType)}
            >
              <MaterialCommunityIcons name={action.icon} size={24} color={colors.primary} style={styles.actionIcon} />
              <Text style={styles.actionText}>{t(action.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ArrowButton({ testID, icon, enabled, label, onPress }: {
  testID: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  enabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      disabled={!enabled}
      accessibilityLabel={label}
      style={[styles.arrowBtn, !enabled && styles.arrowBtnDisabled]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={36} color={enabled ? colors.primary : colors.textMuted} />
    </TouchableOpacity>
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
    maxHeight: '70%',
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
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  orderSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderTitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderPosition: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.text,
    marginHorizontal: spacing.xl,
    minWidth: 64,
    textAlign: 'center',
  },
  arrowBtn: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  arrowBtnDisabled: {
    opacity: 0.4,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    marginRight: spacing.md,
  },
  actionText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
