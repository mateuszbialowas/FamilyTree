import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFamily } from '../context/FamilyContext';
import { TextInput } from '../components/ui/TextInput';
import { EmptyState } from '../components/ui/EmptyState';
import { PersonListItem } from '../components/PersonListItem';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function PeopleListScreen() {
  const { state } = useFamily();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = [...state.people].sort((a, b) =>
      a.lastName.localeCompare(b.lastName, 'pl')
    );
    if (!q) return list;
    return list.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
    );
  }, [state.people, search]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          testID="search-input"
          placeholder="Szukaj po imieniu lub nazwisku..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchInput}
          autoCorrect={false}
        />
      </View>
      <FlatList
        testID="people-list"
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PersonListItem
            person={item}
            onPress={() => navigation.navigate('PersonDetail', { personId: item.id })}
          />
        )}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="book-open-variant"
            title="Twoja kronika jest pusta"
            subtitle="Dodaj pierwszą osobę, naciskając przycisk +"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchInput: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  emptyList: {
    flex: 1,
  },
});
