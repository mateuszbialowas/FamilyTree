import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, Alert, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFamily } from '../context/FamilyContext';
import { FamilyTreeCanvas } from '../components/tree/FamilyTreeCanvas';
import { EmptyState } from '../components/ui/EmptyState';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export function TreeScreen() {
  const { state } = useFamily();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [rootId, setRootId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const effectiveRootId = rootId && state.people.some(p => p.id === rootId)
    ? rootId
    : state.people[0]?.id ?? null;

  const rootPerson = state.people.find(p => p.id === effectiveRootId);

  const handleNodePress = useCallback((personId: string) => {
    navigation.navigate('PersonDetail', { personId });
  }, [navigation]);

  const handleNodeLongPress = useCallback((personId: string) => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return;
    const name = `${person.firstName} ${person.lastName}`;

    Alert.alert(
      name,
      'Dodaj powiązaną osobę',
      [
        {
          text: 'Dodaj rodzica',
          onPress: () => navigation.navigate('AddPerson', { relatedPersonId: personId, relationType: 'parent' }),
        },
        {
          text: 'Dodaj dziecko',
          onPress: () => navigation.navigate('AddPerson', { relatedPersonId: personId, relationType: 'child' }),
        },
        {
          text: 'Dodaj małżonka',
          onPress: () => navigation.navigate('AddPerson', { relatedPersonId: personId, relationType: 'spouse' }),
        },
        {
          text: 'Dodaj rodzeństwo',
          onPress: () => navigation.navigate('AddPerson', { relatedPersonId: personId, relationType: 'sibling' }),
        },
        { text: 'Anuluj', style: 'cancel' },
      ],
    );
  }, [navigation, state.people]);

  if (state.people.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="family-tree"
          title="Brak osób w drzewie"
          subtitle="Dodaj pierwszą osobę używając przycisku +"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Root person selector */}
      <TouchableOpacity style={styles.selectorBar} onPress={() => setPickerVisible(true)}>
        <Text style={styles.selectorLabel}>Korzeń drzewa:</Text>
        <Text style={styles.selectorName} numberOfLines={1}>
          {rootPerson ? `${rootPerson.firstName} ${rootPerson.lastName}` : '—'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Tree canvas */}
      {effectiveRootId && (
        <FamilyTreeCanvas
          state={state}
          rootId={effectiveRootId}
          onNodePress={handleNodePress}
          onNodeLongPress={handleNodeLongPress}
        />
      )}

      {/* Root picker modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz korzeń drzewa</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={state.people}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item.id === effectiveRootId && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setRootId(item.id);
                    setPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      item.id === effectiveRootId && styles.pickerItemTextActive,
                    ]}
                  >
                    {item.firstName} {item.lastName}
                  </Text>
                  {item.birthDate && (
                    <Text style={styles.pickerItemDate}>ur. {item.birthDate}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectorLabel: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  selectorName: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerItemActive: {
    backgroundColor: colors.surface,
  },
  pickerItemText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  pickerItemTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  pickerItemDate: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
});
