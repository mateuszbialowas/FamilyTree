import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PersonDetailScreen } from '../screens/PersonDetailScreen';
import { AddPersonScreen } from '../screens/AddPersonScreen';
import { EditPersonScreen } from '../screens/EditPersonScreen';
import { AddRelationshipScreen } from '../screens/AddRelationshipScreen';
import { Logo } from '../components/Logo';
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
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Logo size={28} />
              <Text style={styles.headerText}>Ustawienia</Text>
            </View>
          ),
        }}
      />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: 'Szczegóły' }} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ title: 'Nowa osoba' }} />
      <Stack.Screen name="EditPerson" component={EditPersonScreen} options={{ title: 'Edycja' }} />
      <Stack.Screen name="AddRelationship" component={AddRelationshipScreen} options={{ title: 'Nowa relacja' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
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
