import React, { useState } from 'react';
import { ScrollView, Alert, Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RelationType } from '../types';
import { useFamily } from '../context/FamilyContext';
import { getParents, getSpouses } from '../utils/relationships';
import { personFieldsFromForm, hasRequiredNames, type PersonFormValues } from '../utils/person';
import { generateId } from '../utils/uuid';
import { formatDateISO } from '../utils/date';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { DatePickerField } from '../components/ui/DatePickerField';
import { PersonForm } from '../components/PersonForm';
import { KeyboardDoneAccessory } from '../components/ui/KeyboardDoneAccessory';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../theme/formStyles';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

type AddPersonParams = {
  AddPerson: {
    relatedPersonId?: string;
    relationType?: RelationType;
  };
};

export function AddPersonScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AddPersonParams, 'AddPerson'>>();
  const { state, dispatch } = useFamily();

  const relLabel = (type: RelationType): string => {
    switch (type) {
      case 'parent': return t('addPerson.relationParent');
      case 'child': return t('addPerson.relationChild');
      case 'spouse': return t('addPerson.relationSpouse');
      case 'sibling': return t('addPerson.relationSibling');
    }
  };

  const relatedPersonId = route.params?.relatedPersonId;
  const relationType = route.params?.relationType;
  const relatedPerson = relatedPersonId ? state.people.find(p => p.id === relatedPersonId) : null;
  const siblingParents = relationType === 'sibling' && relatedPersonId
    ? getParents(relatedPersonId, state)
    : [];

  // When adding a child to someone who has a spouse, offer to link the new
  // child to that spouse too, so both parents are connected in one step.
  const coParents = relationType === 'child' && relatedPersonId
    ? getSpouses(relatedPersonId, state).map(s => s.person)
    : [];
  // A single spouse is pre-selected (the common case); with several spouses the
  // user picks which one is the other parent.
  const [selectedCoParentIds, setSelectedCoParentIds] = useState<string[]>(
    coParents.length === 1 ? [coParents[0].id] : [],
  );

  const toggleCoParent = (id: string) => {
    setSelectedCoParentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  // Optional marriage date captured inline when quick-adding a spouse.
  const [spouseMarriageDate, setSpouseMarriageDate] = useState<Date | null>(null);

  const handleSave = (values: PersonFormValues) => {
    if (!hasRequiredNames(values)) {
      Alert.alert(t('common.error'), t('personForm.requiredError'));
      return;
    }

    const newPersonId = generateId();

    dispatch({
      type: 'ADD_PERSON',
      payload: { id: newPersonId, ...personFieldsFromForm(values) },
    });

    if (relatedPersonId && relationType) {
      createAutoRelationship(relationType, newPersonId, relatedPersonId);
    }

    navigation.goBack();
  };

  const createAutoRelationship = (type: RelationType, newId: string, relatedId: string) => {
    switch (type) {
      case 'parent':
        dispatch({
          type: 'ADD_PARENT_CHILD',
          payload: { id: generateId(), parentId: newId, childId: relatedId },
        });
        break;
      case 'child':
        dispatch({
          type: 'ADD_PARENT_CHILD',
          payload: { id: generateId(), parentId: relatedId, childId: newId },
        });
        // Also link the selected co-parent(s) so the child sits under both.
        selectedCoParentIds.forEach(coParentId => {
          dispatch({
            type: 'ADD_PARENT_CHILD',
            payload: { id: generateId(), parentId: coParentId, childId: newId },
          });
        });
        break;
      case 'spouse':
        dispatch({
          type: 'ADD_MARRIAGE',
          payload: {
            id: generateId(),
            spouse1Id: relatedId,
            spouse2Id: newId,
            marriageDate: spouseMarriageDate ? formatDateISO(spouseMarriageDate) : null,
            divorceDate: null,
          },
        });
        break;
      case 'sibling':
        getParents(relatedId, state).forEach(parent => {
          dispatch({
            type: 'ADD_PARENT_CHILD',
            payload: { id: generateId(), parentId: parent.id, childId: newId },
          });
        });
        // Slot the new sibling in by birth date when the group is hand-arranged
        // (otherwise this is a no-op and birthDate ordering applies).
        dispatch({ type: 'PLACE_NEW_SIBLING', payload: { personId: newId } });
        break;
    }
  };

  return (
    <View style={formStyles.container}>
      <ScrollView
        style={formStyles.container}
        contentContainerStyle={formStyles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <ScreenHeader
          title={t('addPerson.title')}
          subtitle={relatedPerson && relationType
            ? `${relLabel(relationType)} ${relatedPerson.firstName} ${relatedPerson.lastName}`
            : undefined
          }
        />
        {relationType === 'sibling' && relatedPerson && (
          <View testID="sibling-preview" style={previewStyles.box}>
            <Text style={previewStyles.title}>{t('addPerson.siblingPreviewTitle')}</Text>
            {siblingParents.length > 0 ? (
              <>
                <Text style={previewStyles.body}>
                  {t('addPerson.siblingPreviewBody', { firstName: relatedPerson.firstName })}
                </Text>
                {siblingParents.map(p => (
                  <Text key={p.id} style={previewStyles.bullet}>
                    • {p.firstName} {p.lastName}
                  </Text>
                ))}
              </>
            ) : (
              <Text style={previewStyles.body}>
                {t('addPerson.siblingPreviewEmpty', { firstName: relatedPerson.firstName })}
              </Text>
            )}
          </View>
        )}
        {relationType === 'child' && coParents.length > 0 && relatedPerson && (
          <View testID="coparent-picker" style={previewStyles.box}>
            <Text style={previewStyles.title}>{t('addPerson.coParentTitle')}</Text>
            <Text style={previewStyles.body}>
              {coParents.length === 1
                ? t('addPerson.coParentBodySingle', { firstName: relatedPerson.firstName })
                : t('addPerson.coParentBodyMulti', { firstName: relatedPerson.firstName })}
            </Text>
            {coParents.map(cp => {
              const checked = selectedCoParentIds.includes(cp.id);
              return (
                <TouchableOpacity
                  key={cp.id}
                  testID={`coparent-${cp.id}`}
                  style={previewStyles.checkRow}
                  onPress={() => toggleCoParent(cp.id)}
                >
                  <MaterialCommunityIcons
                    name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={checked ? colors.primary : colors.textMuted}
                  />
                  <Text style={previewStyles.checkLabel}>
                    {cp.firstName} {cp.lastName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {relationType === 'spouse' && relatedPerson && (
          <View testID="spouse-marriage-date" style={previewStyles.box}>
            <Text style={previewStyles.title}>{t('addPerson.spouseMarriageTitle')}</Text>
            <DatePickerField
              label={t('addPerson.spouseMarriageDateLabel')}
              value={spouseMarriageDate}
              onChange={setSpouseMarriageDate}
              clearLabel={t('addPerson.clearSpouseMarriageDate')}
            />
          </View>
        )}
        <PersonForm
          submitLabel={t('addPerson.saveLabel')}
          submitTestID="btn-save-person"
          onSubmit={handleSave}
        />
      </ScrollView>
      <KeyboardDoneAccessory />
    </View>
  );
}

const previewStyles = StyleSheet.create({
  box: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  bullet: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checkLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
});
