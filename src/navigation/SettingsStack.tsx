import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PersonDetailScreen } from '../screens/PersonDetailScreen';
import { AddPersonScreen } from '../screens/AddPersonScreen';
import { EditPersonScreen } from '../screens/EditPersonScreen';
import { AddRelationshipScreen } from '../screens/AddRelationshipScreen';
import { Logo } from '../components/Logo';
import { useSharedScreenOptions, useScreenTitles, headerStyles } from './stackConfig';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();

export function SettingsStack() {
  const { t } = useTranslation();
  const screenOptions = useSharedScreenOptions();
  const titles = useScreenTitles();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{
          headerTitle: () => (
            <View style={headerStyles.headerTitle}>
              <Logo size={28} />
              <Text style={headerStyles.headerText}>{t('nav.homeSettings')}</Text>
            </View>
          ),
        }}
      />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: titles.PersonDetail }} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ title: titles.AddPerson }} />
      <Stack.Screen name="EditPerson" component={EditPersonScreen} options={{ title: titles.EditPerson }} />
      <Stack.Screen name="AddRelationship" component={AddRelationshipScreen} options={{ title: titles.AddRelationship }} />
    </Stack.Navigator>
  );
}
