import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { DataTable, Text, useTheme, Card } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { getDatabase } from '@/db/database';
import { getBudgetsByMonth } from '@/db/repositories/budgetRepo';
import { getMonthlyTotalByCategory } from '@/db/repositories/transactionRepo';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { formatAmount } from '@/utils/money';
import { getMonthName, getCurrentYear } from '@/utils/date';
import { CATEGORY_GROUPS } from '@/constants/categories';
import type { CategorySummary } from '@/types/domain';

export default function MonthlySummaryScreen() {
  const theme = useTheme();
  const { month } = useLocalSearchParams<{ month: string }>();
  const { defaultCurrency, monthlyIncome } = useSettingsStore();
  const [summary, setSummary] = useState<CategorySummary[]>([]);
  const monthNum = parseInt(month ?? '1');
  const year = getCurrentYear();

  useEffect(() => {
    const db = getDatabase();
    const budgets = getBudgetsByMonth(db, monthNum, year);
    const actuals = getMonthlyTotalByCategory(db, monthNum, year);
    const actualMap = new Map(actuals.map(a => [a.category_id, a.total]));

    const s: CategorySummary[] = budgets.map(b => {
      const actual = actualMap.get(b.categoryId) ?? 0;
      return {
        categoryId: b.categoryId,
        categoryName: b.categoryName ?? '',
        groupName: b.groupName ?? '',
        budgetedAmount: b.budgetedAmount,
        actualAmount: actual,
        variance: b.budgetedAmount - actual,
        percentUsed: b.budgetedAmount > 0 ? (actual / b.budgetedAmount) * 100 : 0,
      };
    });
    setSummary(s);
  }, [monthNum]);

  const totalBudgeted = summary.reduce((s, c) => s + c.budgetedAmount, 0);
  const totalSpent = summary.reduce((s, c) => s + c.actualAmount, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>{getMonthName(monthNum)} {year}</Text>

      {CATEGORY_GROUPS.map(group => {
        const items = summary.filter(s => s.groupName === group);
        if (items.length === 0) return null;
        return (
          <Card key={group} style={styles.card}>
            <Card.Content>
              <Text variant="titleSmall">{group}</Text>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Category</DataTable.Title>
                  <DataTable.Title numeric>Budget</DataTable.Title>
                  <DataTable.Title numeric>Actual</DataTable.Title>
                  <DataTable.Title numeric>Variance</DataTable.Title>
                </DataTable.Header>
                {items.map(item => (
                  <DataTable.Row key={item.categoryId}>
                    <DataTable.Cell>{item.categoryName}</DataTable.Cell>
                    <DataTable.Cell numeric>{formatAmount(item.budgetedAmount, defaultCurrency)}</DataTable.Cell>
                    <DataTable.Cell numeric>{formatAmount(item.actualAmount, defaultCurrency)}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text style={{ color: item.variance >= 0 ? theme.colors.primary : theme.colors.error }}>
                        {formatAmount(item.variance, defaultCurrency)}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>
        );
      })}

      <Card style={styles.card}>
        <Card.Content>
          <DataTable>
            <DataTable.Row>
              <DataTable.Cell><Text variant="titleSmall">TOTAL</Text></DataTable.Cell>
              <DataTable.Cell numeric>{formatAmount(totalBudgeted, defaultCurrency)}</DataTable.Cell>
              <DataTable.Cell numeric>{formatAmount(totalSpent, defaultCurrency)}</DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{ color: totalBudgeted - totalSpent >= 0 ? theme.colors.primary : theme.colors.error, fontWeight: 'bold' }}>
                  {formatAmount(totalBudgeted - totalSpent, defaultCurrency)}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell><Text variant="bodySmall">Income</Text></DataTable.Cell>
              <DataTable.Cell numeric>{formatAmount(monthlyIncome, defaultCurrency)}</DataTable.Cell>
              <DataTable.Cell numeric>{''}</DataTable.Cell>
              <DataTable.Cell numeric>{''}</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell><Text variant="bodySmall">Over/Under</Text></DataTable.Cell>
              <DataTable.Cell numeric>{''}</DataTable.Cell>
              <DataTable.Cell numeric>{''}</DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{ color: monthlyIncome - totalSpent >= 0 ? theme.colors.primary : theme.colors.error }}>
                  {formatAmount(monthlyIncome - totalSpent, defaultCurrency)}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { margin: 16 },
  card: { marginHorizontal: 16, marginBottom: 12 },
});
