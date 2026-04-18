import React, { useState } from 'react';
import { View, Alert, StyleSheet, ScrollView } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useFamily } from '../context/FamilyContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Divider';
import { HistoryModal } from '../components/HistoryModal';
import { t } from '../i18n';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { validateFamilyState } from '../utils/validateImport';

export function SettingsScreen() {
  const { state, dispatch, pastEntries, futureEntries } = useFamily();
  const [historyVisible, setHistoryVisible] = useState(false);
  const historyCount = pastEntries.length + futureEntries.length;

  const handleExport = async () => {
    try {
      const json = JSON.stringify(state, null, 2);
      const file = new File(Paths.cache, 'family_tree_export.json');
      if (!file.exists) file.create();
      file.write(json);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: t.settings.exportDialogTitle,
      });
    } catch {
      Alert.alert(t.common.error, t.settings.exportFail);
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
        Alert.alert(t.common.error, t.settings.importInvalidJson);
        return;
      }
      const validation = validateFamilyState(raw);
      if (!validation.ok) {
        Alert.alert(t.settings.importInvalidTitle, validation.error);
        return;
      }
      const { data } = validation;
      Alert.alert(
        t.settings.importConfirmTitle,
        t.settings.importConfirmBody(
          data.people.length,
          data.parentChildRelationships.length,
          data.marriages.length,
        ),
        [
          { text: t.common.cancel, style: 'cancel' },
          {
            text: t.settings.importConfirmCta,
            onPress: () => dispatch({ type: 'IMPORT_DATA', payload: data }),
          },
        ]
      );
    } catch {
      Alert.alert(t.common.error, t.settings.importFail);
    }
  };

  const handleClear = () => {
    Alert.alert(
      t.settings.clearTitle,
      t.settings.clearBody,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.clear,
          style: 'destructive',
          onPress: () => dispatch({ type: 'CLEAR_DATA' }),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={t.settings.title} />

      <View style={styles.section}>
        <Button
          testID="btn-history"
          title={t.settings.history(historyCount)}
          onPress={() => setHistoryVisible(true)}
          variant="outline"
          disabled={historyCount === 0}
        />
      </View>

      <Divider />

      <View style={styles.section}>
        <Button testID="btn-import" title={t.settings.importJson} onPress={handleImport} variant="outline" />
        <View style={styles.gap} />
        <Button testID="btn-export" title={t.settings.exportJson} onPress={handleExport} variant="outline" />
      </View>

      <Divider />

      <View style={styles.section}>
        <Button testID="btn-clear-data" title={t.settings.clearAll} onPress={handleClear} variant="ghost" />
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
});
