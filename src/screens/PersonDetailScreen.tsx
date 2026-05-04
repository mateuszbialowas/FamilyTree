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
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing } from '../theme/spacing';

type RouteParams = { PersonDetail: { personId: string; rootId?: string } };

export function PersonDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RouteParams, 'PersonDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { state, dispatch } = useFamily();

  const person = state.people.find((p) => p.id === route.params.personId);
  if (!person) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>{t('personDetail.notFound')}</Text>
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
      t('personDetail.deleteTitle'),
      t('personDetail.deleteBody', { firstName: person.firstName, lastName: person.lastName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
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
    Alert.alert(t('personDetail.removeRelationshipTitle'), t('personDetail.removeRelationshipBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
        subtitle={(() => {
          const g = person.gender === 'male' ? t('personForm.genderMale') : t('personForm.genderFemale');
          return formalLabel ? `${g} · ${formalLabel}` : g;
        })()}
      />

      <Card style={styles.card}>
        <InfoRow label={t('personDetail.birthDateLabel')} value={person.birthDate ?? t('common.unknown')} />
        <InfoRow
          label={t('personDetail.deathDateLabel')}
          value={person.deathDate ?? t('common.alive')}
        />
        {person.notes ? <InfoRow label={t('personDetail.notesLabel')} value={person.notes} /> : null}
      </Card>

      {/* Relationships */}
      {parents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personDetail.sectionParents')}</Text>
          {parents.map((p) => {
            const rel = state.parentChildRelationships.find(
              (r) => r.parentId === p.id && r.childId === person.id
            );
            return (
              <RelationshipCard
                key={p.id}
                label={t('personDetail.relParent')}
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
          <Text style={styles.sectionTitle}>{t('personDetail.sectionSpouses')}</Text>
          {spouses.map(({ person: sp, marriage }) => (
            <RelationshipCard
              key={sp.id}
              label={t('personDetail.relSpouse')}
              personName={`${sp.firstName} ${sp.lastName}`}
              detail={
                marriage.marriageDate
                  ? `${t('personDetail.marriageLabel')}: ${marriage.marriageDate}${marriage.divorceDate ? ` | ${t('personDetail.divorceLabel')}: ${marriage.divorceDate}` : ''}`
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
          <Text style={styles.sectionTitle}>{t('personDetail.sectionChildren')}</Text>
          {children.map((c) => {
            const rel = state.parentChildRelationships.find(
              (r) => r.parentId === person.id && r.childId === c.id
            );
            return (
              <RelationshipCard
                key={c.id}
                label={t('personDetail.relChild')}
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
          <Text style={styles.sectionTitle}>{t('personDetail.sectionSiblings')}</Text>
          {siblings.map((s) => (
            <RelationshipCard
              key={s.id}
              label={t('personDetail.relSibling')}
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
          title={t('personDetail.btnEdit')}
          onPress={() => navigation.navigate('EditPerson', { personId: person.id })}
          variant="primary"
        />
        <View style={styles.gap} />
        <Button
          testID="btn-add-relationship"
          title={t('personDetail.btnAddRelationship')}
          onPress={() => navigation.navigate('AddRelationship', { personId: person.id })}
          variant="outline"
        />
        <View style={styles.gap} />
        <Button
          testID="btn-delete-person"
          title={t('personDetail.btnDelete')}
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
