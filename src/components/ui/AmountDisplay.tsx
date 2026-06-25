import React from 'react';
import { Text, useTheme } from 'react-native-paper';
import { formatAmount } from '@/utils/money';

interface Props {
  amount: number;
  currencyCode?: string;
  variant?: 'bodySmall' | 'bodyMedium' | 'bodyLarge' | 'titleMedium' | 'titleLarge' | 'headlineMedium' | 'headlineLarge';
  colorize?: boolean;
  style?: object;
}

export function AmountDisplay({ amount, currencyCode = 'TTD', variant = 'bodyLarge', colorize = false, style }: Props) {
  const theme = useTheme();
  const color = colorize
    ? amount >= 0 ? theme.colors.primary : theme.colors.error
    : undefined;

  return (
    <Text variant={variant} style={[color ? { color } : undefined, style]}>
      {formatAmount(amount, currencyCode)}
    </Text>
  );
}
