import React from 'react';
import { ScrollView, Alert, Platform, View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { getParents } from '../utils/relationships';
import { generateId } from '../utils/uuid';
import { formatDateISO } from '../utils/date';
import { ScreenHeader } from '../components/ui/ScreenHeader';
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
    relationType?: 'parent' | 'child' | 'spouse' | 'sibling';
  };
};

export function AddPersonScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AddPersonParams, 'AddPerson'>>();
  const { state, dispatch } = useFamily();

  const relLabel = (type: 'parent' | 'child' | 'spouse' | 'sibling'): string => {
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

  const handleSave = (data: {
    firstName: string;
    lastName: string;
    birthSurname: string;
    gender: 'male' | 'female';
    birthDate: Date | null;
    deathDate: Date | null;
    notes: string;
  }) => {
    if (!data.firstName.trim() || !data.lastName.trim()) {
      Alert.alert(t('common.error'), t('personForm.requiredError'));
      return;
    }

    const newPersonId = generateId();

    dispatch({
      type: 'ADD_PERSON',
      payload: {
        id: newPersonId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        birthSurname: data.birthSurname.trim() || null,
        gender: data.gender,
        birthDate: data.birthDate ? formatDateISO(data.birthDate) : null,
        deathDate: data.deathDate ? formatDateISO(data.deathDate) : null,
        notes: data.notes.trim(),
      },
    });

    if (relatedPersonId && relationType) {
      createAutoRelationship(relationType, newPersonId, relatedPersonId);
    }

    navigation.goBack();
  };

  const createAutoRelationship = (type: string, newId: string, relatedId: string) => {
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
        break;
      case 'spouse':
        dispatch({
          type: 'ADD_MARRIAGE',
          payload: {
            id: generateId(),
            spouse1Id: relatedId,
            spouse2Id: newId,
            marriageDate: null,
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
});
