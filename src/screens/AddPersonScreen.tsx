import React from 'react';
import { ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { getParents } from '../utils/relationships';
import { generateId } from '../utils/uuid';
import { formatDateISO } from '../utils/date';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PersonForm } from '../components/PersonForm';
import { formStyles } from '../theme/formStyles';

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
    <ScrollView style={formStyles.container} contentContainerStyle={formStyles.content}>
      <ScreenHeader
        title="Dodaj osobę"
        subtitle={relatedPerson && relationType
          ? `${REL_LABELS[relationType]} ${relatedPerson.firstName} ${relatedPerson.lastName}`
          : undefined
        }
      />
      <PersonForm
        submitLabel="Zapisz"
        submitTestID="btn-save-person"
        onSubmit={handleSave}
      />
    </ScrollView>
  );
}
