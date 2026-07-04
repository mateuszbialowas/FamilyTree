import { StyleSheet } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export function useSharedScreenOptions(): NativeStackNavigationOptions {
  const { t } = useTranslation();
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.primary,
    headerTitleStyle: { fontFamily: fonts.heading, color: colors.text },
    headerShadowVisible: false,
    headerBackTitle: t('common.back'),
  };
}

export function useScreenTitles() {
  const { t } = useTranslation();
  return {
    PersonDetail: t('nav.titlePersonDetail'),
    AddPerson: t('nav.titleAddPerson'),
    EditPerson: t('nav.titleEditPerson'),
    AddRelationship: t('nav.titleAddRelationship'),
    EditMarriage: t('nav.titleEditMarriage'),
  } as const;
}

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
