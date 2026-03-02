import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Person } from '../types';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

type Props = {
  person: Person;
  onPress: () => void;
};

function formatDates(person: Person): string {
  const birth = person.birthDate ?? '?';
  const death = person.deathDate ?? 'żyje';
  return `${birth} – ${death}`;
}

export function PersonListItem({ person, onPress }: Props) {
  return (
    <TouchableOpacity testID={`person-item-${person.id}`} style={styles.container} onPress={onPress} activeOpacity={0.7} accessible={false}>
      <View style={styles.iconWrap}>
        <Text style={styles.initials}>
          {(person.firstName?.[0] ?? '').toUpperCase()}{(person.lastName?.[0] ?? '').toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {person.firstName} {person.lastName}
        </Text>
        <Text style={styles.dates}>{formatDates(person)}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    // Android
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  initials: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  dates: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});
