import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TreeStack } from './TreeStack';
import { ListStack } from './ListStack';
import { SettingsStack } from './SettingsStack';
import { FAB } from '../components/FAB';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const Tab = createBottomTabNavigator();

const HIDE_FAB_SCREENS = ['AddPerson', 'EditPerson', 'AddRelationship'];

export function BottomTabs() {
  const [nestedRoute, setNestedRoute] = useState('');

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Drzewo"
        screenListeners={{
          state: (e) => {
            const tabState = (e.data as any)?.state;
            if (tabState) {
              const activeTabRoute = tabState.routes[tabState.index];
              const nested = getFocusedRouteNameFromRoute(activeTabRoute) || '';
              setNestedRoute(nested);
            }
          },
        }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontFamily: fonts.body,
            fontSize: 11,
          },
        }}
      >
        <Tab.Screen
          name="Drzewo"
          component={TreeStack}
          options={{
            tabBarTestID: 'tab-tree',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="family-tree" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Lista"
          component={ListStack}
          options={{
            tabBarTestID: 'tab-list',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Ustawienia"
          component={SettingsStack}
          options={{
            tabBarTestID: 'tab-settings',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      {!HIDE_FAB_SCREENS.includes(nestedRoute) && <FAB />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
