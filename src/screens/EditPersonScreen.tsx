import React from 'react';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { personFieldsFromForm, hasRequiredNames, type PersonFormValues } from '../utils/person';
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

  const handleSave = (values: PersonFormValues) => {
    if (!hasRequiredNames(values)) {
      Alert.alert(t('common.error'), t('personForm.requiredError'));
      return;
    }

    // Spread the existing person first so fields the form doesn't own
    // (id, manualOrder) survive the edit; UPDATE_PERSON replaces wholesale.
    dispatch({
      type: 'UPDATE_PERSON',
      payload: { ...person, ...personFieldsFromForm(values) },
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
