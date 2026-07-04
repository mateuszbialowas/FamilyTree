import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { TextInput } from './ui/TextInput';
import { Button } from './ui/Button';
import { DatePickerField } from './ui/DatePickerField';
import { useTranslation } from 'react-i18next';
import { formStyles as styles } from '../theme/formStyles';
import { colors } from '../theme/colors';
import { parseDate } from '../utils/date';
import type { PersonFormValues } from '../utils/person';
import type { Person } from '../types';

type Props = {
  initialValues?: Partial<Pick<Person, 'firstName' | 'lastName' | 'birthSurname' | 'gender' | 'birthDate' | 'deceased' | 'deathDate' | 'notes'>>;
  submitLabel: string;
  submitTestID?: string;
  onSubmit: (values: PersonFormValues) => void;
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
  // Backward-compat: an existing death date implies the person is deceased even
  // when the older data had no explicit flag.
  const [deceased, setDeceased] = useState<boolean>(
    initialValues?.deceased ?? initialValues?.deathDate != null,
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const handleSubmit = () => {
    // Normalisation (trimming, dropping the death date when living, ISO
    // conversion) lives in personFieldsFromForm — here we just hand off state.
    onSubmit({ firstName, lastName, birthSurname, gender, birthDate, deceased, deathDate, notes });
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

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('personForm.deceasedLabel')}</Text>
        <Switch
          testID="switch-deceased"
          value={deceased}
          onValueChange={setDeceased}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      {deceased && (
        <DatePickerField
          testID="picker-death"
          label={t('personForm.deathDateLabel')}
          value={deathDate}
          onChange={setDeathDate}
          clearLabel={t('personForm.clearDeathDate')}
        />
      )}

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
