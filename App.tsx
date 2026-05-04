import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from '@expo-google-fonts/lora';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FamilyProvider } from './src/context/FamilyContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { colors } from './src/theme/colors';
import { loadStoredLocale, useLocale } from './src/i18n';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_700Bold,
  });

  const [showSplash, setShowSplash] = useState(true);
  const [localeReady, setLocaleReady] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    loadStoredLocale().finally(() => setLocaleReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && localeReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, localeReady]);

  const handleAnimationFinish = useCallback(() => {
    setTimeout(() => setShowSplash(false), 50);
  }, []);

  if (!fontsLoaded || !localeReady) {
    return (
      <View style={styles.loading}>
        <View />
      </View>
    );
  }

  return (
    <GestureHandlerRootView key={locale} style={styles.root}>
      <FamilyProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </FamilyProvider>
      {showSplash && <AnimatedSplash onFinish={handleAnimationFinish} />}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
