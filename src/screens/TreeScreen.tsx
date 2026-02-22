import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';

export function TreeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Drzewo</Text>
      <Text style={styles.sub}>Komponent drzewa zostanie podpięty tutaj</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xxl,
    color: colors.text,
  },
  sub: {
    fontFamily: fonts.bodyItalic,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 8,
  },
});
