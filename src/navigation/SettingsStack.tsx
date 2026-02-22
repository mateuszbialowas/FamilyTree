import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PersonDetailScreen } from '../screens/PersonDetailScreen';
import { AddPersonScreen } from '../screens/AddPersonScreen';
import { EditPersonScreen } from '../screens/EditPersonScreen';
import { AddRelationshipScreen } from '../screens/AddRelationshipScreen';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const Stack = createNativeStackNavigator();

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.heading, color: colors.text },
        headerShadowVisible: false,
        headerBackTitle: 'Wróć',
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Ustawienia' }} />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: 'Szczegóły' }} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ title: 'Nowa osoba' }} />
      <Stack.Screen name="EditPerson" component={EditPersonScreen} options={{ title: 'Edycja' }} />
      <Stack.Screen name="AddRelationship" component={AddRelationshipScreen} options={{ title: 'Nowa relacja' }} />
    </Stack.Navigator>
  );
}
