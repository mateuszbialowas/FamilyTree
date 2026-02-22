import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

type Props = {
  label: string;
  personName: string;
  detail?: string;
  onPress?: () => void;
  onRemove?: () => void;
};

export function RelationshipCard({ label, personName, detail, onPress, onRemove }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
        accessible={false}
      >
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.name}>{personName}</Text>
        {detail && <Text style={styles.detail}>{detail}</Text>}
      </TouchableOpacity>
      {onRemove && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.text,
    marginTop: 2,
  },
  detail: {
    fontFamily: fonts.bodyItalic,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  removeBtn: {
    padding: spacing.md,
  },
});
