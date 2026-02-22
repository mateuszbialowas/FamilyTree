import { StyleSheet } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export const SHARED_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { fontFamily: fonts.heading, color: colors.text },
  headerShadowVisible: false,
  headerBackTitle: 'Wróć',
};

export const SCREEN_TITLES = {
  PersonDetail: 'Szczegóły',
  AddPerson: 'Nowa osoba',
  EditPerson: 'Edycja',
  AddRelationship: 'Nowa relacja',
} as const;

export const headerStyles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.text,
  },
});
