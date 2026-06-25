import React, { useEffect, useCallback } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, FAB, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { MonthSelector } from '@/components/ui/MonthSelector';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatAmount } from '@/utils/money';
import { formatDisplayDate } from '@/utils/date';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedMonth, selectedYear, totalBudgeted, totalSpent, summary, loadBudgets, setMonth } = useBudgetStore();
  const { getRecentTransactions } = useTransactionStore();
  const { goals, loadGoals } = useSavingsStore();
  const { accounts, loadAccounts } = useAccountStore();
  const { monthlyIncome, defaultCurrency } = useSettingsStore();

  const recentTransactions = getRecentTransactions(5);

  useEffect(() => {
    loadBudgets();
    loadGoals();
    loadAccounts();
  }, []);

  const handleMonthChange = useCallback((m: number, y: number) => {
    setMonth(m, y);
  }, []);

  const remaining = totalBudgeted - totalSpent;
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <MonthSelector month={selectedMonth} year={selectedYear} onChange={handleMonthChange} />

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardLabel}>Total Balance</Text>
            <AmountDisplay amount={totalBalance} currencyCode={defaultCurrency} variant="headlineMedium" />
            <Text variant="bodySmall" style={styles.accountCount}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardLabel}>Monthly Budget</Text>
            <View style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <Text variant="bodySmall">Income</Text>
                <AmountDisplay amount={monthlyIncome} currencyCode={defaultCurrency} variant="titleMedium" />
              </View>
              <View style={styles.budgetItem}>
                <Text variant="bodySmall">Spent</Text>
                <AmountDisplay amount={totalSpent} currencyCode={defaultCurrency} variant="titleMedium" />
              </View>
              <View style={styles.budgetItem}>
                <Text variant="bodySmall">Remaining</Text>
                <AmountDisplay amount={remaining} currencyCode={defaultCurrency} variant="titleMedium" colorize />
              </View>
            </View>
            <ProgressBar progress={totalBudgeted > 0 ? totalSpent / totalBudgeted : 0} />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardLabel}>Top Spending</Text>
            {summary
              .filter(s => s.actualAmount > 0)
              .sort((a, b) => b.actualAmount - a.actualAmount)
              .slice(0, 5)
              .map(s => (
                <View key={s.categoryId} style={styles.spendingRow}>
                  <View style={styles.spendingInfo}>
                    <Text variant="bodyMedium">{s.categoryName}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatAmount(s.actualAmount, defaultCurrency)} / {formatAmount(s.budgetedAmount, defaultCurrency)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={s.budgetedAmount > 0 ? s.actualAmount / s.budgetedAmount : 0}
                    showPercentage={false}
                  />
                </View>
              ))}
            {summary.filter(s => s.actualAmount > 0).length === 0 && (
              <Text variant="bodyMedium" style={styles.emptyText}>No spending recorded this month</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" style={styles.cardLabel}>Savings Progress</Text>
            </View>
            {goals.map(goal => {
              const progress = goal.targetAmount ? goal.currentBalance / goal.targetAmount : 0;
              return (
                <View key={goal.id} style={styles.savingsRow}>
                  <View style={styles.savingsInfo}>
                    <Text variant="bodyMedium">{goal.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatAmount(goal.currentBalance, defaultCurrency)}
                      {goal.targetAmount ? ` / ${formatAmount(goal.targetAmount, defaultCurrency)}` : ''}
                    </Text>
                  </View>
                  {goal.targetAmount ? (
                    <ProgressBar progress={progress} showPercentage />
                  ) : null}
                </View>
              );
            })}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardLabel}>Recent Transactions</Text>
            {recentTransactions.map((t, i) => (
              <React.Fragment key={t.id}>
                {i > 0 && <Divider />}
                <View style={styles.transactionRow}>
                  <View style={styles.transactionInfo}>
                    <Text variant="bodyMedium">{t.categoryName ?? t.description ?? 'Transaction'}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatDisplayDate(t.date)}{t.description ? ` - ${t.description}` : ''}
                    </Text>
                  </View>
                  <AmountDisplay
                    amount={t.type === 'income' ? t.amount : -t.amount}
                    currencyCode={t.currencyCode}
                    colorize
                  />
                </View>
              </React.Fragment>
            ))}
            {recentTransactions.length === 0 && (
              <Text variant="bodyMedium" style={styles.emptyText}>No transactions yet</Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => router.push('/transaction/new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 80 },
  card: { marginHorizontal: 16, marginBottom: 12 },
  cardLabel: { marginBottom: 8, opacity: 0.7 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  budgetItem: { alignItems: 'center' },
  accountCount: { marginTop: 4, opacity: 0.6 },
  spendingRow: { marginBottom: 8 },
  spendingInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  savingsRow: { marginBottom: 12 },
  savingsInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  transactionInfo: { flex: 1, marginRight: 8 },
  emptyText: { textAlign: 'center', marginVertical: 16, opacity: 0.5 },
  bottomSpacer: { height: 20 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
