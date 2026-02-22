import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TreeScreen } from '../screens/TreeScreen';
import { PersonDetailScreen } from '../screens/PersonDetailScreen';
import { AddPersonScreen } from '../screens/AddPersonScreen';
import { EditPersonScreen } from '../screens/EditPersonScreen';
import { AddRelationshipScreen } from '../screens/AddRelationshipScreen';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const Stack = createNativeStackNavigator();

export function TreeStack() {
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
      <Stack.Screen name="TreeHome" component={TreeScreen} options={{ title: 'Drzewo' }} />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: 'Szczegóły' }} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ title: 'Nowa osoba' }} />
      <Stack.Screen name="EditPerson" component={EditPersonScreen} options={{ title: 'Edycja' }} />
      <Stack.Screen name="AddRelationship" component={AddRelationshipScreen} options={{ title: 'Nowa relacja' }} />
    </Stack.Navigator>
  );
}
