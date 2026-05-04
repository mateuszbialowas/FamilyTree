import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useFamily } from '../context/FamilyContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Divider';
import { HistoryModal } from '../components/HistoryModal';
import { useTranslation } from 'react-i18next';
import { setLocale, SUPPORTED_LOCALES, type Locale } from '../i18n';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fonts, fontSizes } from '../theme/typography';
import { validateFamilyState } from '../utils/validateImport';
import { getSampleFamily } from '../utils/sampleFamilies';

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { state, dispatch, pastEntries, futureEntries } = useFamily();
  const [historyVisible, setHistoryVisible] = useState(false);
  const historyCount = pastEntries.length + futureEntries.length;
  const currentLocale = i18n.language as Locale;
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const currentLanguageLabel =
    SUPPORTED_LOCALES.find((l) => l.code === currentLocale)?.label ?? '';

  const handleExport = async () => {
    try {
      const json = JSON.stringify(state, null, 2);
      const file = new File(Paths.cache, 'family_tree_export.json');
      if (!file.exists) file.create();
      file.write(json);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: t('settings.exportDialogTitle'),
      });
    } catch {
      Alert.alert(t('common.error'), t('settings.exportFail'));
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });
      if (result.canceled) return;
      const pickedFile = result.assets[0];
      const file = new File(pickedFile.uri);
      const json = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(json);
      } catch {
        Alert.alert(t('common.error'), t('settings.importInvalidJson'));
        return;
      }
      const validation = validateFamilyState(raw);
      if (!validation.ok) {
        Alert.alert(t('settings.importInvalidTitle'), validation.error);
        return;
      }
      const { data } = validation;
      Alert.alert(
        t('settings.importConfirmTitle'),
        t('settings.importConfirmBody', {
          people: data.people.length,
          relations: data.parentChildRelationships.length,
          marriages: data.marriages.length,
        }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.importConfirmCta'),
            onPress: () => dispatch({ type: 'IMPORT_DATA', payload: data }),
          },
        ]
      );
    } catch {
      Alert.alert(t('common.error'), t('settings.importFail'));
    }
  };

  const handleLoadSample = () => {
    const sample = getSampleFamily(currentLocale);
    const performImport = () => dispatch({ type: 'IMPORT_DATA', payload: sample });

    if (state.people.length === 0) {
      performImport();
      return;
    }

    Alert.alert(
      t('settings.importConfirmTitle'),
      t('settings.importConfirmBody', {
        people: sample.people.length,
        relations: sample.parentChildRelationships.length,
        marriages: sample.marriages.length,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.importConfirmCta'), onPress: performImport },
      ],
    );
  };

  const handleClear = () => {
    Alert.alert(
      t('settings.clearTitle'),
      t('settings.clearBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: () => dispatch({ type: 'CLEAR_DATA' }),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={t('settings.title')} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <Pressable
          testID="btn-language-picker"
          onPress={() => setLanguagePickerVisible(true)}
          style={styles.selectRow}
        >
          <Text style={styles.selectValue}>{currentLanguageLabel}</Text>
          <Text style={styles.selectChevron}>›</Text>
        </Pressable>
      </View>

      <Modal
        visible={languagePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguagePickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLanguagePickerVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('settings.language')}</Text>
            {SUPPORTED_LOCALES.map(({ code, label }, index) => {
              const active = currentLocale === code;
              return (
                <Pressable
                  key={code}
                  testID={`btn-locale-${code}`}
                  onPress={() => {
                    setLocale(code as Locale);
                    setLanguagePickerVisible(false);
                  }}
                  style={[
                    styles.modalRow,
                    index < SUPPORTED_LOCALES.length - 1 && styles.modalRowBorder,
                    active && styles.modalRowActive,
                  ]}
                >
                  <Text style={[styles.modalRowText, active && styles.modalRowTextActive]}>
                    {label}
                  </Text>
                  {active && <Text style={styles.modalRowCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Divider />

      <View style={styles.section}>
        <Button
          testID="btn-history"
          title={t('settings.history', { count: historyCount })}
          onPress={() => setHistoryVisible(true)}
          variant="outline"
          disabled={historyCount === 0}
        />
      </View>

      <Divider />

      <View style={styles.section}>
        <Button testID="btn-load-sample" title={t('settings.loadSample')} onPress={handleLoadSample} variant="outline" />
        <View style={styles.gap} />
        <Button testID="btn-import" title={t('settings.importJson')} onPress={handleImport} variant="outline" />
        <View style={styles.gap} />
        <Button testID="btn-export" title={t('settings.exportJson')} onPress={handleExport} variant="outline" />
      </View>

      <Divider />

      <View style={styles.section}>
        <Button testID="btn-clear-data" title={t('settings.clearAll')} onPress={handleClear} variant="ghost" />
      </View>

      <HistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  gap: {
    height: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectValue: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  selectChevron: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  modalRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalRowActive: {
    backgroundColor: colors.surface,
  },
  modalRowText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  modalRowTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  modalRowCheck: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
});
