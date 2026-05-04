import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { generateId } from '../utils/uuid';
import { formatDateISO } from '../utils/date';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../theme/formStyles';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

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
  const [showMarriagePicker, setShowMarriagePicker] = useState(false);

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

    if (relType === 'parent-child') {
      const exists = state.parentChildRelationships.some(
        (r) => r.parentId === person.id && r.childId === selectedPersonId
      );
      if (exists) {
        Alert.alert(t('common.error'), t('addRelationship.errorParentChildExists'));
        return;
      }
      dispatch({
        type: 'ADD_PARENT_CHILD',
        payload: { id: generateId(), parentId: person.id, childId: selectedPersonId },
      });
    } else if (relType === 'child-parent') {
      const exists = state.parentChildRelationships.some(
        (r) => r.parentId === selectedPersonId && r.childId === person.id
      );
      if (exists) {
        Alert.alert(t('common.error'), t('addRelationship.errorParentChildExists'));
        return;
      }
      dispatch({
        type: 'ADD_PARENT_CHILD',
        payload: { id: generateId(), parentId: selectedPersonId, childId: person.id },
      });
    } else {
      const exists = state.marriages.some(
        (m) =>
          (m.spouse1Id === person.id && m.spouse2Id === selectedPersonId) ||
          (m.spouse1Id === selectedPersonId && m.spouse2Id === person.id)
      );
      if (exists) {
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
    }

    navigation.goBack();
  };

  const relTypes: { key: RelType; label: string }[] = [
    { key: 'parent-child', label: t('addRelationship.typeParentChild', { firstName: person.firstName }) },
    { key: 'child-parent', label: t('addRelationship.typeChildParent', { firstName: person.firstName }) },
    { key: 'marriage', label: t('addRelationship.typeMarriage') },
  ];

  return (
    <ScrollView style={formStyles.container} contentContainerStyle={formStyles.content}>
      <ScreenHeader
        title={t('addRelationship.title')}
        subtitle={t('addRelationship.forSubtitle', { firstName: person.firstName, lastName: person.lastName })}
      />

      <View style={formStyles.form}>
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
          <>
            <Text style={[formStyles.label, { marginTop: spacing.lg }]}>{t('addRelationship.marriageDateLabel')}</Text>
            <TouchableOpacity style={formStyles.dateBtn} onPress={() => setShowMarriagePicker(true)}>
              <Text style={marriageDate ? formStyles.dateText : formStyles.datePlaceholder}>
                {marriageDate ? formatDateISO(marriageDate) : t('common.selectDate')}
              </Text>
            </TouchableOpacity>
            {showMarriagePicker && (
              <DateTimePicker
                value={marriageDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowMarriagePicker(Platform.OS === 'ios');
                  if (date) setMarriageDate(date);
                }}
              />
            )}
          </>
        )}

        <Text style={[formStyles.label, { marginTop: spacing.lg }]}>{t('addRelationship.selectPersonLabel')}</Text>
        <TextInput
          placeholder={t('addRelationship.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginBottom: spacing.sm }}
        />

        {otherPeople.map((p) => (
          <TouchableOpacity
            key={p.id}
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
        ))}

        <View style={{ marginTop: spacing.xl }}>
          <Button
            testID="btn-save-relationship"
            title={t('addRelationship.save')}
            onPress={handleSave}
            disabled={!selectedPersonId}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
