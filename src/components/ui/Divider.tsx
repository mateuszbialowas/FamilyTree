import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  marginVertical?: number;
};

export function Divider({ marginVertical = spacing.lg }: Props) {
  return (
    <View style={[styles.container, { marginVertical }]}>
      <View style={styles.line} />
      <Text style={styles.dot}>{'\u2014 \u00B7 \u2014'}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.border,
    fontSize: 12,
  },
});
