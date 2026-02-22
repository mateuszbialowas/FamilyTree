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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { getParents } from '../utils/relationships';
import { generateId } from '../utils/uuid';

type AddPersonParams = {
  AddPerson: {
    relatedPersonId?: string;
    relationType?: 'parent' | 'child' | 'spouse' | 'sibling';
  };
};
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [deathDate, setDeathDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showDeathPicker, setShowDeathPicker] = useState(false);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Błąd', 'Imię i nazwisko są wymagane.');
      return;
    }

    const newPersonId = generateId();

    dispatch({
      type: 'ADD_PERSON',
      payload: {
        id: newPersonId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
        deathDate: deathDate ? deathDate.toISOString().split('T')[0] : null,
        notes: notes.trim(),
      },
    });

    // Auto-create relationship if coming from tree long-press
    if (relatedPersonId && relationType) {
      if (relationType === 'parent') {
        // New person is parent of related person
        dispatch({
          type: 'ADD_PARENT_CHILD',
          payload: { id: generateId(), parentId: newPersonId, childId: relatedPersonId },
        });
      } else if (relationType === 'child') {
        // Related person is parent of new person
        dispatch({
          type: 'ADD_PARENT_CHILD',
          payload: { id: generateId(), parentId: relatedPersonId, childId: newPersonId },
        });
      } else if (relationType === 'spouse') {
        dispatch({
          type: 'ADD_MARRIAGE',
          payload: {
            id: generateId(),
            spouse1Id: relatedPersonId,
            spouse2Id: newPersonId,
            marriageDate: null,
            divorceDate: null,
          },
        });
      } else if (relationType === 'sibling') {
        // Add same parents as the related person
        const parents = getParents(relatedPersonId, state);
        parents.forEach(parent => {
          dispatch({
            type: 'ADD_PARENT_CHILD',
            payload: { id: generateId(), parentId: parent.id, childId: newPersonId },
          });
        });
      }
    }

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Dodaj osobę"
        subtitle={relatedPerson && relationType
          ? `${REL_LABELS[relationType]} ${relatedPerson.firstName} ${relatedPerson.lastName}`
          : undefined
        }
      />

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

        {/* Gender picker */}
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

        {/* Birth date */}
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

        {/* Death date */}
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
          testID="input-notes"
          label="Notatki"
          placeholder="Dodatkowe informacje..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button testID="btn-save-person" title="Zapisz" onPress={handleSave} />
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
