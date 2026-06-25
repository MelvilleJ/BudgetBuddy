import React, { useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { MonthSelector } from '@/components/ui/MonthSelector';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { formatAmount } from '@/utils/money';
import { CATEGORY_GROUPS } from '@/constants/categories';

export default function BudgetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedMonth, selectedYear, summary, totalBudgeted, totalSpent, loadBudgets, setMonth } = useBudgetStore();
  const { defaultCurrency, monthlyIncome } = useSettingsStore();

  useEffect(() => { loadBudgets(); }, []);

  const grouped = CATEGORY_GROUPS.map(group => ({
    group,
    items: summary.filter(s => s.groupName === group),
  })).filter(g => g.items.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <MonthSelector month={selectedMonth} year={selectedYear} onChange={setMonth} />

        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall">Budgeted</Text>
                <AmountDisplay amount={totalBudgeted} currencyCode={defaultCurrency} variant="titleMedium" />
              </View>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall">Spent</Text>
                <AmountDisplay amount={totalSpent} currencyCode={defaultCurrency} variant="titleMedium" />
              </View>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall">Remaining</Text>
                <AmountDisplay amount={totalBudgeted - totalSpent} currencyCode={defaultCurrency} variant="titleMedium" colorize />
              </View>
            </View>
            <ProgressBar progress={totalBudgeted > 0 ? totalSpent / totalBudgeted : 0} />
          </Card.Content>
        </Card>

        {grouped.map(({ group, items }) => {
          const groupBudget = items.reduce((s, i) => s + i.budgetedAmount, 0);
          const groupSpent = items.reduce((s, i) => s + i.actualAmount, 0);

          return (
            <Card key={group} style={styles.groupCard}>
              <Card.Content>
                <View style={styles.groupHeader}>
                  <Text variant="titleSmall">{group}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatAmount(groupSpent, defaultCurrency)} / {formatAmount(groupBudget, defaultCurrency)}
                  </Text>
                </View>
                <Divider style={styles.divider} />
                {items.map(item => (
                  <View
                    key={item.categoryId}
                    style={styles.categoryRow}
                  >
                    <View style={styles.categoryInfo}>
                      <Text
                        variant="bodyMedium"
                        onPress={() => router.push(`/budget/${item.categoryId}`)}
                      >
                        {item.categoryName}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatAmount(item.actualAmount, defaultCurrency)} / {formatAmount(item.budgetedAmount, defaultCurrency)}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={item.budgetedAmount > 0 ? item.actualAmount / item.budgetedAmount : 0}
                      showPercentage
                    />
                  </View>
                ))}
              </Card.Content>
            </Card>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 20 },
  summaryCard: { marginHorizontal: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryItem: { alignItems: 'center' },
  groupCard: { marginHorizontal: 16, marginBottom: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { marginVertical: 8 },
  categoryRow: { marginBottom: 8 },
  categoryInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  bottomSpacer: { height: 20 },
});
