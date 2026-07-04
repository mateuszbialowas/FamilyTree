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
  onEdit?: () => void;
  onRemove?: () => void;
  editTestID?: string;
};

export function RelationshipCard({ label, personName, detail, onPress, onEdit, onRemove, editTestID }: Props) {
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
      {onEdit && (
        <TouchableOpacity style={styles.iconBtn} onPress={onEdit} testID={editTestID}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
      {onRemove && (
        <TouchableOpacity style={styles.iconBtn} onPress={onRemove}>
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
  iconBtn: {
    padding: spacing.md,
  },
});
