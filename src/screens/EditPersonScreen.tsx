import React from 'react';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { formatDateISO } from '../utils/date';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PersonForm } from '../components/PersonForm';
import { KeyboardDoneAccessory } from '../components/ui/KeyboardDoneAccessory';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../theme/formStyles';

type RouteParams = { EditPerson: { personId: string } };

export function EditPersonScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RouteParams, 'EditPerson'>>();
  const navigation = useNavigation();
  const { state, dispatch } = useFamily();

  const person = state.people.find((p) => p.id === route.params.personId);
  if (!person) {
    return (
      <View style={formStyles.container}>
        <Text style={formStyles.notFound}>{t('personDetail.notFound')}</Text>
      </View>
    );
  }

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

    dispatch({
      type: 'UPDATE_PERSON',
      payload: {
        id: person.id,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        birthSurname: data.birthSurname.trim() || null,
        gender: data.gender,
        birthDate: data.birthDate ? formatDateISO(data.birthDate) : null,
        deathDate: data.deathDate ? formatDateISO(data.deathDate) : null,
        notes: data.notes.trim(),
      },
    });

    navigation.goBack();
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
        <ScreenHeader title={t('editPerson.title')} />
        <PersonForm
          initialValues={person}
          submitLabel={t('editPerson.saveLabel')}
          submitTestID="btn-save-edit"
          onSubmit={handleSave}
        />
      </ScrollView>
      <KeyboardDoneAccessory />
    </View>
  );
}
