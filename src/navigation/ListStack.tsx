import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PeopleListScreen } from '../screens/PeopleListScreen';
import { PersonDetailScreen } from '../screens/PersonDetailScreen';
import { AddPersonScreen } from '../screens/AddPersonScreen';
import { EditPersonScreen } from '../screens/EditPersonScreen';
import { AddRelationshipScreen } from '../screens/AddRelationshipScreen';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const Stack = createNativeStackNavigator();

export function ListStack() {
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
      <Stack.Screen name="ListHome" component={PeopleListScreen} options={{ title: 'Lista osób' }} />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: 'Szczegóły' }} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ title: 'Nowa osoba' }} />
      <Stack.Screen name="EditPerson" component={EditPersonScreen} options={{ title: 'Edycja' }} />
      <Stack.Screen name="AddRelationship" component={AddRelationshipScreen} options={{ title: 'Nowa relacja' }} />
    </Stack.Navigator>
  );
}
