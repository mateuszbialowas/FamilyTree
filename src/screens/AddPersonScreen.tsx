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

const REL_LABELS: Record<string, string> = {
  parent: 'Rodzic dla',
  child: 'Dziecko dla',
  spouse: 'Małżonek dla',
  sibling: 'Rodzeństwo dla',
};

export function AddPersonScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AddPersonParams, 'AddPerson'>>();
  const { state, dispatch } = useFamily();

  const relatedPersonId = route.params?.relatedPersonId;
  const relationType = route.params?.relationType;
  const relatedPerson = relatedPersonId ? state.people.find(p => p.id === relatedPersonId) : null;
  const siblingParents = relationType === 'sibling' && relatedPersonId
    ? getParents(relatedPersonId, state)
    : [];

  const handleSave = (data: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    birthDate: Date | null;
    deathDate: Date | null;
    notes: string;
  }) => {
    if (!data.firstName.trim() || !data.lastName.trim()) {
      Alert.alert('Błąd', 'Imię i nazwisko są wymagane.');
      return;
    }

    const newPersonId = generateId();

    dispatch({
      type: 'ADD_PERSON',
      payload: {
        id: newPersonId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
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
          title="Dodaj osobę"
          subtitle={relatedPerson && relationType
            ? `${REL_LABELS[relationType]} ${relatedPerson.firstName} ${relatedPerson.lastName}`
            : undefined
          }
        />
        {relationType === 'sibling' && relatedPerson && (
          <View testID="sibling-preview" style={previewStyles.box}>
            <Text style={previewStyles.title}>Automatyczne powiązania</Text>
            {siblingParents.length > 0 ? (
              <>
                <Text style={previewStyles.body}>
                  Nowa osoba zostanie przypisana jako dziecko tych samych rodziców co {relatedPerson.firstName}:
                </Text>
                {siblingParents.map(p => (
                  <Text key={p.id} style={previewStyles.bullet}>
                    • {p.firstName} {p.lastName}
                  </Text>
                ))}
              </>
            ) : (
              <Text style={previewStyles.body}>
                {relatedPerson.firstName} nie ma jeszcze przypisanych rodziców, więc żadne relacje nie zostaną dodane automatycznie.
              </Text>
            )}
          </View>
        )}
        <PersonForm
          submitLabel="Zapisz"
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
