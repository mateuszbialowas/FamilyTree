import React, { useMemo } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { getParents, getChildren, getSpouses, getSiblings } from '../utils/relationships';
import { computeRelationshipLabels } from '../utils/relationshipLabels';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Divider } from '../components/ui/Divider';
import { RelationshipCard } from '../components/RelationshipCard';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing } from '../theme/spacing';

type RouteParams = { PersonDetail: { personId: string; rootId?: string } };

export function PersonDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'PersonDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { state, dispatch } = useFamily();

  const person = state.people.find((p) => p.id === route.params.personId);
  if (!person) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Nie znaleziono osoby</Text>
      </View>
    );
  }

  const rootId = route.params.rootId;
  const formalLabel = useMemo(() => {
    if (!rootId || rootId === person.id) return null;
    const labels = computeRelationshipLabels(rootId, state, 'formal');
    return labels.get(person.id) ?? null;
  }, [rootId, person.id, state]);

  const parents = getParents(person.id, state);
  const children = getChildren(person.id, state);
  const spouses = getSpouses(person.id, state);
  const siblings = getSiblings(person.id, state);

  const handleDelete = () => {
    Alert.alert(
      'Usuń osobę',
      `Czy na pewno chcesz usunąć ${person.firstName} ${person.lastName}? Usunięte zostaną również wszystkie powiązane relacje.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_PERSON', payload: person.id });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRemoveRelationship = (id: string, kind: 'parentChild' | 'marriage') => {
    Alert.alert('Usuń relację', 'Czy na pewno chcesz usunąć tę relację?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => dispatch({ type: 'REMOVE_RELATIONSHIP', payload: { id, kind } }),
      },
    ]);
  };

  const navigateToPerson = (id: string) => {
    navigation.push('PersonDetail', { personId: id });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={`${person.firstName} ${person.lastName}`}
        subtitle={formalLabel
          ? `${person.gender === 'male' ? 'Mężczyzna' : 'Kobieta'} · ${formalLabel}`
          : person.gender === 'male' ? 'Mężczyzna' : 'Kobieta'}
      />

      <Card style={styles.card}>
        <InfoRow label="Data urodzenia" value={person.birthDate ?? 'Nieznana'} />
        <InfoRow
          label="Data śmierci"
          value={person.deathDate ?? 'Żyje'}
        />
        {person.notes ? <InfoRow label="Notatki" value={person.notes} /> : null}
      </Card>

      {/* Relationships */}
      {parents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rodzice</Text>
          {parents.map((p) => {
            const rel = state.parentChildRelationships.find(
              (r) => r.parentId === p.id && r.childId === person.id
            );
            return (
              <RelationshipCard
                key={p.id}
                label="Rodzic"
                personName={`${p.firstName} ${p.lastName}`}
                onPress={() => navigateToPerson(p.id)}
                onRemove={rel ? () => handleRemoveRelationship(rel.id, 'parentChild') : undefined}
              />
            );
          })}
        </View>
      )}

      {spouses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Małżonkowie</Text>
          {spouses.map(({ person: sp, marriage }) => (
            <RelationshipCard
              key={sp.id}
              label="Małżonek"
              personName={`${sp.firstName} ${sp.lastName}`}
              detail={
                marriage.marriageDate
                  ? `Ślub: ${marriage.marriageDate}${marriage.divorceDate ? ` | Rozwód: ${marriage.divorceDate}` : ''}`
                  : undefined
              }
              onPress={() => navigateToPerson(sp.id)}
              onRemove={() => handleRemoveRelationship(marriage.id, 'marriage')}
            />
          ))}
        </View>
      )}

      {children.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dzieci</Text>
          {children.map((c) => {
            const rel = state.parentChildRelationships.find(
              (r) => r.parentId === person.id && r.childId === c.id
            );
            return (
              <RelationshipCard
                key={c.id}
                label="Dziecko"
                personName={`${c.firstName} ${c.lastName}`}
                onPress={() => navigateToPerson(c.id)}
                onRemove={rel ? () => handleRemoveRelationship(rel.id, 'parentChild') : undefined}
              />
            );
          })}
        </View>
      )}

      {siblings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rodzeństwo</Text>
          {siblings.map((s) => (
            <RelationshipCard
              key={s.id}
              label="Rodzeństwo"
              personName={`${s.firstName} ${s.lastName}`}
              onPress={() => navigateToPerson(s.id)}
            />
          ))}
        </View>
      )}

      <Divider />

      <View style={styles.actions}>
        <Button
          testID="btn-edit-person"
          title="Edytuj"
          onPress={() => navigation.navigate('EditPerson', { personId: person.id })}
          variant="primary"
        />
        <View style={styles.gap} />
        <Button
          testID="btn-add-relationship"
          title="Dodaj relację"
          onPress={() => navigation.navigate('AddRelationship', { personId: person.id })}
          variant="outline"
        />
        <View style={styles.gap} />
        <Button
          testID="btn-delete-person"
          title="Usuń osobę"
          onPress={handleDelete}
          variant="ghost"
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.text,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  gap: {
    height: spacing.sm,
  },
});
