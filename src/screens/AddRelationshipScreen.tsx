import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { generateId } from '../utils/uuid';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { Card } from '../components/ui/Card';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

type RouteParams = { AddRelationship: { personId: string } };
type RelType = 'parent-child' | 'child-parent' | 'marriage';

export function AddRelationshipScreen() {
  const route = useRoute<RouteProp<RouteParams, 'AddRelationship'>>();
  const navigation = useNavigation();
  const { state, dispatch } = useFamily();

  const person = state.people.find((p) => p.id === route.params.personId);
  const [relType, setRelType] = useState<RelType>('parent-child');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [marriageDate, setMarriageDate] = useState<Date | null>(null);
  const [showMarriagePicker, setShowMarriagePicker] = useState(false);

  const otherPeople = useMemo(() => {
    const q = search.toLowerCase().trim();
    return state.people
      .filter((p) => p.id !== route.params.personId)
      .filter((p) => !q || p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q))
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'pl'));
  }, [state.people, route.params.personId, search]);

  if (!person) return null;

  const handleSave = () => {
    if (!selectedPersonId) {
      Alert.alert('Błąd', 'Wybierz osobę.');
      return;
    }

    if (relType === 'parent-child') {
      // Current person is parent of selected
      const exists = state.parentChildRelationships.some(
        (r) => r.parentId === person.id && r.childId === selectedPersonId
      );
      if (exists) {
        Alert.alert('Błąd', 'Ta relacja rodzic-dziecko już istnieje.');
        return;
      }
      dispatch({
        type: 'ADD_PARENT_CHILD',
        payload: { id: generateId(), parentId: person.id, childId: selectedPersonId },
      });
    } else if (relType === 'child-parent') {
      // Current person is child of selected
      const exists = state.parentChildRelationships.some(
        (r) => r.parentId === selectedPersonId && r.childId === person.id
      );
      if (exists) {
        Alert.alert('Błąd', 'Ta relacja rodzic-dziecko już istnieje.');
        return;
      }
      dispatch({
        type: 'ADD_PARENT_CHILD',
        payload: { id: generateId(), parentId: selectedPersonId, childId: person.id },
      });
    } else {
      // Marriage
      const exists = state.marriages.some(
        (m) =>
          (m.spouse1Id === person.id && m.spouse2Id === selectedPersonId) ||
          (m.spouse1Id === selectedPersonId && m.spouse2Id === person.id)
      );
      if (exists) {
        Alert.alert('Błąd', 'To małżeństwo już istnieje.');
        return;
      }
      dispatch({
        type: 'ADD_MARRIAGE',
        payload: {
          id: generateId(),
          spouse1Id: person.id,
          spouse2Id: selectedPersonId,
          marriageDate: marriageDate ? marriageDate.toISOString().split('T')[0] : null,
          divorceDate: null,
        },
      });
    }

    navigation.goBack();
  };

  const relTypes: { key: RelType; label: string }[] = [
    { key: 'parent-child', label: `${person.firstName} jest rodzicem` },
    { key: 'child-parent', label: `${person.firstName} jest dzieckiem` },
    { key: 'marriage', label: 'Małżeństwo' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Dodaj relację"
        subtitle={`dla ${person.firstName} ${person.lastName}`}
      />

      <View style={styles.form}>
        {/* Relationship type */}
        <Text style={styles.label}>Typ relacji</Text>
        {relTypes.map((rt) => (
          <TouchableOpacity
            key={rt.key}
            style={[styles.typeBtn, relType === rt.key && styles.typeActive]}
            onPress={() => setRelType(rt.key)}
          >
            <Text style={[styles.typeText, relType === rt.key && styles.typeTextActive]}>
              {rt.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Marriage date */}
        {relType === 'marriage' && (
          <>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>Data ślubu (opcjonalne)</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowMarriagePicker(true)}>
              <Text style={marriageDate ? styles.dateText : styles.datePlaceholder}>
                {marriageDate ? marriageDate.toISOString().split('T')[0] : 'Wybierz datę'}
              </Text>
            </TouchableOpacity>
            {showMarriagePicker && (
              <DateTimePicker
                value={marriageDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowMarriagePicker(Platform.OS === 'ios');
                  if (date) setMarriageDate(date);
                }}
              />
            )}
          </>
        )}

        {/* Person selector */}
        <Text style={[styles.label, { marginTop: spacing.lg }]}>Wybierz osobę</Text>
        <TextInput
          placeholder="Szukaj..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginBottom: spacing.sm }}
        />

        {otherPeople.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.personRow, selectedPersonId === p.id && styles.personRowActive]}
            onPress={() => setSelectedPersonId(p.id)}
          >
            <Text
              style={[
                styles.personName,
                selectedPersonId === p.id && styles.personNameActive,
              ]}
            >
              {p.firstName} {p.lastName}
            </Text>
            {p.birthDate && (
              <Text style={styles.personDate}>ur. {p.birthDate}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: spacing.xl }}>
          <Button
            testID="btn-save-relationship"
            title="Zapisz relację"
            onPress={handleSave}
            disabled={!selectedPersonId}
          />
        </View>
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
  },
  typeBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  typeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  typeTextActive: {
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
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.xs,
  },
  personRowActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  personName: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  personNameActive: {
    color: colors.background,
    fontFamily: fonts.bodyBold,
  },
  personDate: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
});
