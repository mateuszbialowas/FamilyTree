import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

type RouteParams = { EditPerson: { personId: string } };

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function EditPersonScreen() {
  const route = useRoute<RouteProp<RouteParams, 'EditPerson'>>();
  const navigation = useNavigation();
  const { state, dispatch } = useFamily();

  const person = state.people.find((p) => p.id === route.params.personId);
  if (!person) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Nie znaleziono osoby</Text>
      </View>
    );
  }

  const [firstName, setFirstName] = useState(person.firstName);
  const [lastName, setLastName] = useState(person.lastName);
  const [gender, setGender] = useState<'male' | 'female'>(person.gender);
  const [birthDate, setBirthDate] = useState<Date | null>(parseDate(person.birthDate));
  const [deathDate, setDeathDate] = useState<Date | null>(parseDate(person.deathDate));
  const [notes, setNotes] = useState(person.notes);
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showDeathPicker, setShowDeathPicker] = useState(false);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Błąd', 'Imię i nazwisko są wymagane.');
      return;
    }

    dispatch({
      type: 'UPDATE_PERSON',
      payload: {
        id: person.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
        deathDate: deathDate ? deathDate.toISOString().split('T')[0] : null,
        notes: notes.trim(),
      },
    });

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Edytuj osobę" />

      <View style={styles.form}>
        <TextInput
          testID="edit-input-first-name"
          label="Imię *"
          placeholder="Wprowadź imię"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          testID="edit-input-last-name"
          label="Nazwisko *"
          placeholder="Wprowadź nazwisko"
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.label}>Płeć</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, gender === 'male' && styles.genderActive]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
              Mężczyzna
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
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
            {birthDate ? birthDate.toISOString().split('T')[0] : 'Wybierz datę'}
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
            {deathDate ? deathDate.toISOString().split('T')[0] : 'Wybierz datę'}
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
          label="Notatki"
          placeholder="Dodatkowe informacje..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button testID="btn-save-edit" title="Zapisz zmiany" onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 200,
  },
  notFound: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 60,
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  genderActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  genderTextActive: {
    color: colors.background,
    fontFamily: fonts.bodyBold,
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    minHeight: 48,
    justifyContent: 'center',
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  datePlaceholder: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  clearDate: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },
});
