import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar as PaperProgressBar, Text, useTheme } from 'react-native-paper';

interface Props {
  progress: number;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, label, showPercentage = true }: Props) {
  const theme = useTheme();
  const clamped = Math.min(Math.max(progress, 0), 1);
  const pct = Math.round(clamped * 100);
  const color = pct > 100 ? theme.colors.error : pct > 80 ? theme.colors.tertiary : theme.colors.primary;

  return (
    <View style={styles.container}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && <Text variant="bodySmall">{label}</Text>}
          {showPercentage && <Text variant="bodySmall" style={{ color }}>{pct}%</Text>}
        </View>
      )}
      <PaperProgressBar progress={clamped} color={color} style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  bar: { height: 6, borderRadius: 3 },
});
