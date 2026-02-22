import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

export function FAB() {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      testID="fab-add-person"
      style={styles.fab}
      onPress={() => navigation.navigate('AddPerson')}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    // Android shadow
    elevation: 6,
    zIndex: 100,
  },
  icon: {
    color: '#FDF5E6',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
  },
});
