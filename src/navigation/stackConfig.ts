import { StyleSheet } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { t } from '../i18n';

export const SHARED_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { fontFamily: fonts.heading, color: colors.text },
  headerShadowVisible: false,
  headerBackTitle: t.common.back,
};

export const SCREEN_TITLES = {
  PersonDetail: t.nav.titlePersonDetail,
  AddPerson: t.nav.titleAddPerson,
  EditPerson: t.nav.titleEditPerson,
  AddRelationship: t.nav.titleAddRelationship,
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
