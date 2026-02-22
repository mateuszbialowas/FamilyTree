import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PeopleListScreen } from '../screens/PeopleListScreen';
import { PersonDetailScreen } from '../screens/PersonDetailScreen';
import { AddPersonScreen } from '../screens/AddPersonScreen';
import { EditPersonScreen } from '../screens/EditPersonScreen';
import { AddRelationshipScreen } from '../screens/AddRelationshipScreen';
import { Logo } from '../components/Logo';
import { SHARED_SCREEN_OPTIONS, SCREEN_TITLES, headerStyles } from './stackConfig';

const Stack = createNativeStackNavigator();

export function ListStack() {
  return (
    <Stack.Navigator screenOptions={SHARED_SCREEN_OPTIONS}>
      <Stack.Screen
        name="ListHome"
        component={PeopleListScreen}
        options={{
          headerTitle: () => (
            <View style={headerStyles.headerTitle}>
              <Logo size={28} />
              <Text style={headerStyles.headerText}>Lista osób</Text>
            </View>
          ),
        }}
      />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: SCREEN_TITLES.PersonDetail }} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ title: SCREEN_TITLES.AddPerson }} />
      <Stack.Screen name="EditPerson" component={EditPersonScreen} options={{ title: SCREEN_TITLES.EditPerson }} />
      <Stack.Screen name="AddRelationship" component={AddRelationshipScreen} options={{ title: SCREEN_TITLES.AddRelationship }} />
    </Stack.Navigator>
  );
}
