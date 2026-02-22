import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput } from './ui/TextInput';
import { Button } from './ui/Button';
import { formStyles as styles } from '../theme/formStyles';
import { formatDateISO, parseDate } from '../utils/date';
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
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showDeathPicker, setShowDeathPicker] = useState(false);

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

      <Text style={styles.label}>Data urodzenia</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowBirthPicker(true)}>
        <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
          {birthDate ? formatDateISO(birthDate) : 'Wybierz datę'}
        </Text>
      </TouchableOpacity>
      {showBirthPicker && (
        <DateTimePicker
          value={birthDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowBirthPicker(Platform.OS === 'ios');
            if (date) setBirthDate(date);
          }}
        />
      )}

      <Text style={styles.label}>Data śmierci (opcjonalne)</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDeathPicker(true)}>
        <Text style={deathDate ? styles.dateText : styles.datePlaceholder}>
          {deathDate ? formatDateISO(deathDate) : 'Wybierz datę'}
        </Text>
      </TouchableOpacity>
      {deathDate && (
        <TouchableOpacity onPress={() => setDeathDate(null)}>
          <Text style={styles.clearDate}>Wyczyść datę śmierci</Text>
        </TouchableOpacity>
      )}
      {showDeathPicker && (
        <DateTimePicker
          value={deathDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowDeathPicker(Platform.OS === 'ios');
            if (date) setDeathDate(date);
          }}
        />
      )}

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
