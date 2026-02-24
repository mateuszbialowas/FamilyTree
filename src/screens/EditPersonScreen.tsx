import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { formatDateISO } from '../utils/date';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PersonForm } from '../components/PersonForm';
import { formStyles } from '../theme/formStyles';

type RouteParams = { EditPerson: { personId: string } };

export function EditPersonScreen() {
  const route = useRoute<RouteProp<RouteParams, 'EditPerson'>>();
  const navigation = useNavigation();
  const { state, dispatch } = useFamily();

  const person = state.people.find((p) => p.id === route.params.personId);
  if (!person) {
    return (
      <View style={formStyles.container}>
        <Text style={formStyles.notFound}>Nie znaleziono osoby</Text>
      </View>
    );
  }

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

    dispatch({
      type: 'UPDATE_PERSON',
      payload: {
        id: person.id,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender,
        birthDate: data.birthDate ? formatDateISO(data.birthDate) : null,
        deathDate: data.deathDate ? formatDateISO(data.deathDate) : null,
        notes: data.notes.trim(),
        photoUri: person.photoUri,
      },
    });

    navigation.goBack();
  };

  return (
    <ScrollView style={formStyles.container} contentContainerStyle={formStyles.content}>
      <ScreenHeader title="Edytuj osobę" />
      <PersonForm
        initialValues={person}
        submitLabel="Zapisz zmiany"
        submitTestID="btn-save-edit"
        onSubmit={handleSave}
      />
    </ScrollView>
  );
}
