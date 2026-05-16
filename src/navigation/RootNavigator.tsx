import React from 'react';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { BottomTabs } from './BottomTabs';

/**
 * Deep-link configuration for programmatic navigation. Used by the
 * Maestro screenshot flow to bypass the iOS tab-tap bug in Maestro
 * 2.x (mobile-dev-inc/maestro#2448 — `tapOn` on a tab button is
 * reported as successful but does not actually trigger React
 * Navigation's onPress). Hitting a URL like
 * `family-tree://navigate/settings` routes through React Navigation's
 * own linking handler, which dispatches a real navigation event.
 *
 * This is orthogonal to the `family-tree://load-{sample,marketing}/...`
 * URLs handled imperatively by FamilyContext — those mutate app state,
 * these mutate navigation. The path prefixes don't overlap.
 */
const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['family-tree://'],
  config: {
    screens: {
      Drzewo: 'navigate/tree',
      Lista: 'navigate/list',
      Ustawienia: 'navigate/settings',
    },
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <BottomTabs />
    </NavigationContainer>
  );
}
