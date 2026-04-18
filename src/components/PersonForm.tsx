import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TextInput } from './ui/TextInput';
import { Button } from './ui/Button';
import { DatePickerField } from './ui/DatePickerField';
import { formStyles as styles } from '../theme/formStyles';
import { parseDate } from '../utils/date';
import type { Person } from '../types';

type PersonFormData = {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  birthDate: Date | null;
  deathDate: Date | null;
  notes: string;
};

type Props = {
  initialValues?: Partial<Pick<Person, 'firstName' | 'lastName' | 'gender' | 'birthDate' | 'deathDate' | 'notes'>>;
  submitLabel: string;
  submitTestID?: string;
  onSubmit: (data: PersonFormData) => void;
};

export function PersonForm({ initialValues, submitLabel, submitTestID, onSubmit }: Props) {
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? '');
  const [lastName, setLastName] = useState(initialValues?.lastName ?? '');
  const [gender, setGender] = useState<'male' | 'female'>(initialValues?.gender ?? 'male');
  const [birthDate, setBirthDate] = useState<Date | null>(
    initialValues?.birthDate ? parseDate(initialValues.birthDate) : null,
  );
  const [deathDate, setDeathDate] = useState<Date | null>(
    initialValues?.deathDate ? parseDate(initialValues.deathDate) : null,
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const handleSubmit = () => {
    onSubmit({ firstName, lastName, gender, birthDate, deathDate, notes });
  };

  return (
    <View style={styles.form}>
      <TextInput
        testID="input-first-name"
        label="Imię *"
        placeholder="Wprowadź imię"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        testID="input-last-name"
        label="Nazwisko *"
        placeholder="Wprowadź nazwisko"
        value={lastName}
        onChangeText={setLastName}
      />

      <Text style={styles.label}>Płeć</Text>
      <View style={styles.genderRow}>
        <TouchableOpacity
          testID="gender-male"
          style={[styles.genderBtn, gender === 'male' && styles.genderActive]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
            Mężczyzna
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="gender-female"
          style={[styles.genderBtn, gender === 'female' && styles.genderActive]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
            Kobieta
          </Text>
        </TouchableOpacity>
      </View>

      <DatePickerField
        testID="picker-birth"
        label="Data urodzenia"
        value={birthDate}
        onChange={setBirthDate}
        clearLabel="Wyczyść datę urodzenia"
      />

      <DatePickerField
        testID="picker-death"
        label="Data śmierci (opcjonalne)"
        value={deathDate}
        onChange={setDeathDate}
        clearLabel="Wyczyść datę śmierci"
      />

      <TextInput
        testID="input-notes"
        label="Notatki"
        placeholder="Dodatkowe informacje..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button testID={submitTestID} title={submitLabel} onPress={handleSubmit} />
    </View>
  );
}
