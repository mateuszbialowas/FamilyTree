import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { parentChildExists, marriageExists } from '../utils/relationships';
import { generateId } from '../utils/uuid';
import { formatDateISO } from '../utils/date';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { DatePickerField } from '../components/ui/DatePickerField';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../theme/formStyles';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import type { Person } from '../types';

type RouteParams = { AddRelationship: { personId: string } };
type RelType = 'parent-child' | 'child-parent' | 'marriage';

export function AddRelationshipScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RouteParams, 'AddRelationship'>>();
  const navigation = useNavigation();
  const { state, dispatch } = useFamily();

  const person = state.people.find((p) => p.id === route.params.personId);
  const [relType, setRelType] = useState<RelType>('parent-child');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [marriageDate, setMarriageDate] = useState<Date | null>(null);

  const otherPeople = useMemo(() => {
    const q = search.toLowerCase().trim();
    return state.people
      .filter((p) => p.id !== route.params.personId)
      .filter((p) => !q || p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q))
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'pl'));
  }, [state.people, route.params.personId, search]);

  if (!person) return null;

  const handleSave = () => {
    if (!selectedPersonId) {
      Alert.alert(t('common.error'), t('addRelationship.errorSelectPerson'));
      return;
    }

    if (relType === 'marriage') {
      if (marriageExists(state, person.id, selectedPersonId)) {
        Alert.alert(t('common.error'), t('addRelationship.errorMarriageExists'));
        return;
      }
      dispatch({
        type: 'ADD_MARRIAGE',
        payload: {
          id: generateId(),
          spouse1Id: person.id,
          spouse2Id: selectedPersonId,
          marriageDate: marriageDate ? formatDateISO(marriageDate) : null,
          divorceDate: null,
        },
      });
    } else {
      // 'parent-child' → person is the parent; 'child-parent' → person is the child.
      const parentId = relType === 'parent-child' ? person.id : selectedPersonId;
      const childId = relType === 'parent-child' ? selectedPersonId : person.id;
      if (parentChildExists(state, parentId, childId)) {
        Alert.alert(t('common.error'), t('addRelationship.errorParentChildExists'));
        return;
      }
      dispatch({
        type: 'ADD_PARENT_CHILD',
        payload: { id: generateId(), parentId, childId },
      });
    }

    navigation.goBack();
  };

  const relTypes: { key: RelType; label: string }[] = [
    { key: 'parent-child', label: t('addRelationship.typeParentChild', { firstName: person.firstName }) },
    { key: 'child-parent', label: t('addRelationship.typeChildParent', { firstName: person.firstName }) },
    { key: 'marriage', label: t('addRelationship.typeMarriage') },
  ];

  const renderPerson = ({ item: p }: { item: Person }) => (
    <TouchableOpacity
      style={[styles.personRow, selectedPersonId === p.id && styles.personRowActive]}
      onPress={() => setSelectedPersonId(p.id)}
    >
      <Text
        style={[
          styles.personName,
          selectedPersonId === p.id && styles.personNameActive,
        ]}
      >
        {p.firstName} {p.lastName}
      </Text>
      {p.birthDate && (
        <Text style={styles.personDate}>{t('tree.bornPrefix')} {p.birthDate}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={formStyles.container}>
      {/* Fixed top: header, relationship type, marriage date and search stay
          pinned so the results list below always has a stable anchor. */}
      <View style={styles.fixedTop}>
        <ScreenHeader
          title={t('addRelationship.title')}
          subtitle={t('addRelationship.forSubtitle', { firstName: person.firstName, lastName: person.lastName })}
        />

        <View style={styles.topBody}>
          <Text style={formStyles.label}>{t('addRelationship.typeLabel')}</Text>
          {relTypes.map((rt) => (
            <TouchableOpacity
              key={rt.key}
              style={[styles.typeBtn, relType === rt.key && styles.typeActive]}
              onPress={() => setRelType(rt.key)}
            >
              <Text style={[styles.typeText, relType === rt.key && styles.typeTextActive]}>
                {rt.label}
              </Text>
            </TouchableOpacity>
          ))}

          {relType === 'marriage' && (
            <View style={{ marginTop: spacing.md }}>
              <DatePickerField
                label={t('addRelationship.marriageDateLabel')}
                value={marriageDate}
                onChange={setMarriageDate}
                clearLabel={t('addRelationship.clearMarriageDate')}
              />
            </View>
          )}

          <Text style={[formStyles.label, { marginTop: spacing.md }]}>{t('addRelationship.selectPersonLabel')}</Text>
          <TextInput
            placeholder={t('addRelationship.searchPlaceholder')}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Scrollable results fill the rest of the screen. */}
      <FlatList
        data={otherPeople}
        keyExtractor={(p) => p.id}
        renderItem={renderPerson}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('addRelationship.noResults')}</Text>
        }
      />

      {/* Fixed footer keeps the save button reachable above the tab bar. */}
      <View style={styles.footer}>
        <Button
          testID="btn-save-relationship"
          title={t('addRelationship.save')}
          onPress={handleSave}
          disabled={!selectedPersonId}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedTop: {
    backgroundColor: colors.background,
  },
  topBody: {
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  typeBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  typeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  typeTextActive: {
    color: colors.background,
    fontFamily: fonts.bodyBold,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.xs,
  },
  personRowActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  personName: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  personNameActive: {
    color: colors.background,
    fontFamily: fonts.bodyBold,
  },
  personDate: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
});
