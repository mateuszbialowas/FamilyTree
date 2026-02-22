import React from 'react';
import { View, Alert, StyleSheet, ScrollView } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useFamily } from '../context/FamilyContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Divider';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { FamilyState } from '../types';

export function SettingsScreen() {
  const { state, dispatch } = useFamily();

  const handleExport = async () => {
    try {
      const json = JSON.stringify(state, null, 2);
      const file = new File(Paths.cache, 'family_tree_export.json');
      if (!file.exists) file.create();
      file.write(json);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Eksportuj drzewo genealogiczne',
      });
    } catch {
      Alert.alert('Błąd', 'Nie udało się wyeksportować danych.');
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
      const data = JSON.parse(json) as FamilyState;
      if (!data.people || !data.parentChildRelationships || !data.marriages) {
        Alert.alert('Błąd', 'Nieprawidłowy format pliku.');
        return;
      }
      Alert.alert(
        'Import danych',
        `Znaleziono ${data.people.length} osób. Czy chcesz zastąpić obecne dane?`,
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Importuj',
            onPress: () => dispatch({ type: 'IMPORT_DATA', payload: data }),
          },
        ]
      );
    } catch {
      Alert.alert('Błąd', 'Nie udało się zaimportować danych.');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Wyczyść dane',
      'Czy na pewno chcesz usunąć wszystkie dane? Tej operacji nie można cofnąć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyczyść',
          style: 'destructive',
          onPress: () => dispatch({ type: 'CLEAR_DATA' }),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Ustawienia" />

      <View style={styles.section}>
        <Button testID="btn-import" title="Importuj dane (JSON)" onPress={handleImport} variant="outline" />
        <View style={styles.gap} />
        <Button testID="btn-export" title="Eksportuj dane (JSON)" onPress={handleExport} variant="outline" />
      </View>

      <Divider />

      <View style={styles.section}>
        <Button testID="btn-clear-data" title="Wyczyść wszystkie dane" onPress={handleClear} variant="ghost" />
      </View>
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
