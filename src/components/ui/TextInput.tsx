import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  Platform,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { KEYBOARD_DONE_ID } from './KeyboardDoneAccessory';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export function TextInput({
  label,
  error,
  containerStyle,
  style,
  inputAccessoryViewID,
  ...rest
}: Props) {
  const accessoryID = inputAccessoryViewID ??
    (Platform.OS === 'ios' ? KEYBOARD_DONE_ID : undefined);
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[styles.input, rest.multiline && styles.multiline, error && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        inputAccessoryViewID={accessoryID}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
    minHeight: 48,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
