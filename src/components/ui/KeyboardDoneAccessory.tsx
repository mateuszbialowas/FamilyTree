import React from 'react';
import {
  InputAccessoryView, View, Text, Pressable, Keyboard, StyleSheet, Platform,
} from 'react-native';
import { t } from '../../i18n';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

/**
 * Native iOS inputAccessoryView with a "Gotowe" button.
 * Pair with `inputAccessoryViewID={KEYBOARD_DONE_ID}` on target TextInputs.
 *
 * iOS attaches this to the keyboard natively — it moves with the keyboard
 * animation, no JS positioning needed. Android has no equivalent convention
 * (users dismiss via back button or scroll-drag), so this renders nothing
 * there.
 */
export const KEYBOARD_DONE_ID = 'keyboard-done-accessory';

export function KeyboardDoneAccessory() {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={styles.bar}>
        <Pressable
          testID="kb-done"
          onPress={Keyboard.dismiss}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          hitSlop={8}
        >
          <Text style={styles.txt}>{t.common.done}</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  btnPressed: {
    opacity: 0.6,
  },
  txt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
});
