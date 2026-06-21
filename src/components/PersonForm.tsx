import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TextInput } from './ui/TextInput';
import { Button } from './ui/Button';
import { DatePickerField } from './ui/DatePickerField';
import { useTranslation } from 'react-i18next';
import { formStyles as styles } from '../theme/formStyles';
import { parseDate } from '../utils/date';
import type { Person } from '../types';

type PersonFormData = {
  firstName: string;
  lastName: string;
  birthSurname: string;
  gender: 'male' | 'female';
  birthDate: Date | null;
  deathDate: Date | null;
  notes: string;
};

type Props = {
  initialValues?: Partial<Pick<Person, 'firstName' | 'lastName' | 'birthSurname' | 'gender' | 'birthDate' | 'deathDate' | 'notes'>>;
  submitLabel: string;
  submitTestID?: string;
  onSubmit: (data: PersonFormData) => void;
};

export function PersonForm({ initialValues, submitLabel, submitTestID, onSubmit }: Props) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? '');
  const [lastName, setLastName] = useState(initialValues?.lastName ?? '');
  const [birthSurname, setBirthSurname] = useState(initialValues?.birthSurname ?? '');
  const [gender, setGender] = useState<'male' | 'female'>(initialValues?.gender ?? 'male');
  const [birthDate, setBirthDate] = useState<Date | null>(
    initialValues?.birthDate ? parseDate(initialValues.birthDate) : null,
  );
  const [deathDate, setDeathDate] = useState<Date | null>(
    initialValues?.deathDate ? parseDate(initialValues.deathDate) : null,
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const handleSubmit = () => {
    onSubmit({ firstName, lastName, birthSurname, gender, birthDate, deathDate, notes });
  };

  return (
    <View style={styles.form}>
      <TextInput
        testID="input-first-name"
        label={t('personForm.firstNameLabel')}
        placeholder={t('personForm.firstNamePlaceholder')}
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        testID="input-last-name"
        label={t('personForm.lastNameLabel')}
        placeholder={t('personForm.lastNamePlaceholder')}
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        testID="input-birth-surname"
        label={t('personForm.birthSurnameLabel')}
        placeholder={t('personForm.birthSurnamePlaceholder')}
        value={birthSurname}
        onChangeText={setBirthSurname}
      />

      <Text style={styles.label}>{t('personForm.genderLabel')}</Text>
      <View style={styles.genderRow}>
        <TouchableOpacity
          testID="gender-male"
          style={[styles.genderBtn, gender === 'male' && styles.genderActive]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
            {t('personForm.genderMale')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="gender-female"
          style={[styles.genderBtn, gender === 'female' && styles.genderActive]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
            {t('personForm.genderFemale')}
          </Text>
        </TouchableOpacity>
      </View>

      <DatePickerField
        testID="picker-birth"
        label={t('personForm.birthDateLabel')}
        value={birthDate}
        onChange={setBirthDate}
        clearLabel={t('personForm.clearBirthDate')}
      />

      <DatePickerField
        testID="picker-death"
        label={t('personForm.deathDateLabel')}
        value={deathDate}
        onChange={setDeathDate}
        clearLabel={t('personForm.clearDeathDate')}
      />

      <TextInput
        testID="input-notes"
        label={t('personForm.notesLabel')}
        placeholder={t('personForm.notesPlaceholder')}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button testID={submitTestID} title={submitLabel} onPress={handleSubmit} />
    </View>
  );
}
