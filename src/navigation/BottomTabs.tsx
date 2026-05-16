import React, { useState } from 'react';
import { View, Pressable, StyleSheet, type PressableProps } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TreeStack } from './TreeStack';
import { ListStack } from './ListStack';
import { SettingsStack } from './SettingsStack';
import { FAB } from '../components/FAB';
import { useFamily } from '../context/FamilyContext';
import { useTranslation } from 'react-i18next';
import { useSplashVisible } from '../utils/uiState';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const Tab = createBottomTabNavigator();

const HIDE_FAB_SCREENS = ['AddPerson', 'EditPerson', 'AddRelationship'];

/**
 * Custom tab button. React Navigation v7 renamed `tabBarTestID` (v6) to
 * `tabBarButtonTestID`, but on iOS the underlying `PlatformPressable`
 * sets the testID on a view that Maestro can locate yet the tap event
 * doesn't propagate to the tab's onPress (observed on
 * @react-navigation/bottom-tabs 7.14.0 with iOS 18.x — see
 * BottomTabItem.js → PlatformPressable → AnimatedPressable chain).
 *
 * Bypass: render a vanilla Pressable ourselves and set testID directly.
 * The navigator passes Pressable-shaped props (onPress, onLongPress,
 * accessibilityRole, style, children, ...). We forward them verbatim.
 *
 * Cast at the boundary: React Navigation 7 uses legacy ref types that
 * don't unify with the modern `Ref<View>` on Pressable.
 */
function makeTabBarButton(testID: string) {
  return function TabBarButton(props: BottomTabBarButtonProps) {
    return <Pressable {...(props as unknown as PressableProps)} testID={testID} />;
  };
}

export function BottomTabs() {
  const { t } = useTranslation();
  const [nestedRoute, setNestedRoute] = useState('');
  const { isLoading } = useFamily();
  const splashVisible = useSplashVisible();

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
            tabBarLabel: t('nav.tabTree'),
            tabBarButton: makeTabBarButton('tab-tree'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="family-tree" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Lista"
          component={ListStack}
          options={{
            tabBarLabel: t('nav.tabList'),
            tabBarButton: makeTabBarButton('tab-list'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Ustawienia"
          component={SettingsStack}
          options={{
            tabBarLabel: t('nav.tabSettings'),
            tabBarButton: makeTabBarButton('tab-settings'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      {!splashVisible && !isLoading && !HIDE_FAB_SCREENS.includes(nestedRoute) && <FAB />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
