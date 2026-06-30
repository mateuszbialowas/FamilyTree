import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { siblingGroup } from '../../utils/siblingOrder';
import { isNodeReorderable } from '../../utils/reorderAvailability';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export type RelationType = 'parent' | 'child' | 'spouse' | 'sibling';

type Props = {
  /** Person whose menu is shown; `null` keeps the menu closed. */
  personId: string | null;
  /** The tree's current root — reordering is validated against this view. */
  rootId: string | null;
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
export function NodeContextMenu({ personId, rootId, onClose, onAddRelation }: Props) {
  const { t } = useTranslation();
  const { state, dispatch } = useFamily();

  const person = personId ? state.people.find(p => p.id === personId) ?? null : null;

  // Current sibling order + the person's position — cheap, recomputed each
  // render so the dots/counter track every reorder.
  const siblings = personId ? siblingGroup(personId, state) : [];
  const index = siblings.findIndex(p => p.id === personId);
  const hasSiblings = siblings.length > 1;

  // Whether this node can move in the current view at all (the costly layout
  // simulation). It's a per-node property — pinned or not — so it does NOT
  // change as you reorder; compute it once per open, keyed on the structure and
  // root, NOT on `state` identity. This keeps the arrows snappy: tapping them no
  // longer re-runs the simulation every time.
  const movable = useMemo(
    () => (personId ? isNodeReorderable(personId, rootId, state) : false),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not on state.people: movability is stable across reorders, only the structure/root/person matter.
    [personId, rootId, state.parentChildRelationships, state.marriages],
  );
  const canLeft = movable && index > 0;
  const canRight = movable && index < siblings.length - 1;
  const locked = hasSiblings && !movable;
  const isRoot = personId != null && personId === rootId;

  const move = (direction: 'left' | 'right') => {
    if (personId) dispatch({ type: 'REORDER_SIBLING', payload: { personId, direction } });
  };

  // Pulse the highlighted dot whenever the person's position changes — instant,
  // in-sheet feedback that a reorder took effect, even while the tree is hidden
  // behind the sheet.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (index < 0) return;
    pulse.value = withSequence(
      withTiming(1.5, { duration: 110 }),
      withTiming(1, { duration: 130 }),
    );
  }, [index]);
  const activeDotStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Modal visible={personId !== null} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} testID="node-menu-backdrop">
        <Pressable style={styles.sheet} onPress={() => { /* swallow tap */ }}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {person ? `${person.firstName} ${person.lastName}` : ''}
            </Text>
            <TouchableOpacity onPress={onClose} testID="node-menu-close" hitSlop={8}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Primary actions — adding a related person is the common case. */}
          {ADD_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.relationType}
              testID={action.testID}
              style={styles.action}
              onPress={() => onAddRelation(action.relationType)}
            >
              <MaterialCommunityIcons name={action.icon} size={22} color={colors.primary} style={styles.actionIcon} />
              <Text style={styles.actionText}>{t(action.labelKey)}</Text>
            </TouchableOpacity>
          ))}

          {/* Secondary control — reordering siblings is occasional, so it sits
              at the bottom in a muted footer. */}
          {hasSiblings && (
            <View style={styles.orderSection}>
              <Text style={styles.orderTitle}>{t('tree.siblingOrderTitle')}</Text>
              {locked ? (
                <View style={styles.orderLocked} testID="sibling-order-locked">
                  <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} style={styles.orderLockedIcon} />
                  <Text style={styles.orderLockedText}>
                    {t(isRoot ? 'tree.siblingOrderLockedRoot' : 'tree.siblingOrderLocked')}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.orderRow}>
                    <ArrowButton
                      testID="btn-sibling-left"
                      icon="chevron-left"
                      enabled={canLeft}
                      label={t('tree.moveSiblingLeft')}
                      onPress={() => move('left')}
                    />
                    <View style={styles.dots}>
                      {siblings.map((s, i) =>
                        i === index ? (
                          <Animated.View key={s.id} style={[styles.dot, styles.dotActive, activeDotStyle]} />
                        ) : (
                          <View key={s.id} style={styles.dot} />
                        )
                      )}
                    </View>
                    <ArrowButton
                      testID="btn-sibling-right"
                      icon="chevron-right"
                      enabled={canRight}
                      label={t('tree.moveSiblingRight')}
                      onPress={() => move('right')}
                    />
                  </View>
                  <Text style={styles.orderPosition}>{index + 1} / {siblings.length}</Text>
                </>
              )}
            </View>
          )}
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
    paddingBottom: spacing.xl,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  dots: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.border,
    marginHorizontal: 3,
    marginVertical: 2,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  orderPosition: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  orderLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  orderLockedIcon: {
    marginRight: spacing.sm,
  },
  orderLockedText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
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
  },
  actionIcon: {
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
  },
  actionText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
});
