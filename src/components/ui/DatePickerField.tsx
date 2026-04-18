import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Platform, Modal, Pressable, StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateISO } from '../../utils/date';
import { formStyles } from '../../theme/formStyles';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  clearLabel?: string;
  placeholder?: string;
  testID?: string;
};

export function DatePickerField({
  label,
  value,
  onChange,
  clearLabel,
  placeholder = 'Wybierz datę',
  testID,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Date | null>(null);

  const openPicker = () => {
    setPending(value ?? new Date());
    setOpen(true);
  };

  const confirm = () => {
    if (pending) onChange(pending);
    setOpen(false);
  };

  const cancel = () => {
    setPending(null);
    setOpen(false);
  };

  return (
    <>
      <Text style={formStyles.label}>{label}</Text>
      <TouchableOpacity
        testID={testID}
        style={formStyles.dateBtn}
        onPress={openPicker}
      >
        <Text style={value ? formStyles.dateText : formStyles.datePlaceholder}>
          {value ? formatDateISO(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {value && clearLabel && (
        <TouchableOpacity onPress={() => onChange(null)}>
          <Text style={formStyles.clearDate}>{clearLabel}</Text>
        </TouchableOpacity>
      )}

      {/* iOS: modal bottom sheet with Anuluj / Gotowe — matches Apple Calendar pattern */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={cancel}
        >
          <Pressable style={styles.overlay} onPress={cancel}>
            <Pressable style={styles.sheet} onPress={() => { /* swallow */ }}>
              <View style={styles.toolbar}>
                <TouchableOpacity onPress={cancel} testID="date-cancel">
                  <Text style={styles.cancel}>Anuluj</Text>
                </TouchableOpacity>
                <Text style={styles.toolbarTitle}>{label}</Text>
                <TouchableOpacity onPress={confirm} testID="date-confirm">
                  <Text style={styles.done}>Gotowe</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pending ?? new Date()}
                mode="date"
                display="spinner"
                locale="pl-PL"
                onChange={(_, date) => {
                  if (date) setPending(date);
                }}
                style={styles.picker}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Android: native dialog auto-closes on selection */}
      {Platform.OS === 'android' && open && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) onChange(date);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: 40,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toolbarTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  cancel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  done: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  picker: {
    backgroundColor: colors.background,
  },
});
