import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme, Card, DataTable } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getDatabase } from '@/db/database';
import { getCategoryById } from '@/db/repositories/categoryRepo';
import { getAnnualBudget } from '@/db/repositories/budgetRepo';
import { formatAmount } from '@/utils/money';
import { getMonthName } from '@/utils/date';

export default function EditBudgetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { selectedMonth, selectedYear, updateBudget, loadBudgets, budgets } = useBudgetStore();
  const { defaultCurrency } = useSettingsStore();

  const [amount, setAmount] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [annualBudgets, setAnnualBudgets] = useState<{ month: number; amount: number }[]>([]);

  useEffect(() => {
    if (!categoryId) return;
    const db = getDatabase();
    const cat = getCategoryById(db, categoryId);
    if (cat) setCategoryName(cat.name);

    const current = budgets.find(b => b.categoryId === categoryId);
    if (current) setAmount(String(current.budgetedAmount));

    const annual = getAnnualBudget(db, selectedYear)
      .filter(b => b.categoryId === categoryId)
      .map(b => ({ month: b.month, amount: b.budgetedAmount }));
    setAnnualBudgets(annual);
  }, [categoryId]);

  const handleSave = () => {
    if (!categoryId || !amount) return;
    updateBudget(categoryId, parseFloat(amount));
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>{categoryName}</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {getMonthName(selectedMonth)} {selectedYear}
      </Text>

      <TextInput
        label="Monthly Budget"
        value={amount}
        onChangeText={setAmount}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        left={<TextInput.Affix text="$" />}
      />

      <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
        Update Budget
      </Button>

      {annualBudgets.length > 0 && (
        <Card style={styles.historyCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.historyTitle}>Annual History ({selectedYear})</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Month</DataTable.Title>
                <DataTable.Title numeric>Budget</DataTable.Title>
              </DataTable.Header>
              {annualBudgets.map(b => (
                <DataTable.Row key={b.month}>
                  <DataTable.Cell>{getMonthName(b.month)}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatAmount(b.amount, defaultCurrency)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 16, opacity: 0.6 },
  input: { marginBottom: 12 },
  saveButton: { marginTop: 4 },
  historyCard: { marginTop: 24 },
  historyTitle: { marginBottom: 8 },
});
