import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Card, Button, TextInput, DataTable, FAB, Portal, Modal } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatAmount } from '@/utils/money';
import { getMonthName, getCurrentMonth, getCurrentYear } from '@/utils/date';

export default function SavingsGoalDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { goals, contributions, loadContributions, addContribution, updateGoal, deleteGoal } = useSavingsStore();
  const { defaultCurrency } = useSettingsStore();

  const [showContribModal, setShowContribModal] = useState(false);
  const [contribAmount, setContribAmount] = useState('');
  const [contribMonth, setContribMonth] = useState(String(getCurrentMonth()));
  const [contribYear, setContribYear] = useState(String(getCurrentYear()));

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editMonthly, setEditMonthly] = useState('');

  const goal = goals.find(g => g.id === goalId);
  const goalContributions = goalId ? contributions[goalId] ?? [] : [];

  useEffect(() => {
    if (goalId) loadContributions(goalId);
  }, [goalId]);

  useEffect(() => {
    if (goal) {
      setEditName(goal.name);
      setEditTarget(goal.targetAmount ? String(goal.targetAmount) : '');
      setEditMonthly(String(goal.monthlyTarget));
    }
  }, [goal]);

  if (!goal || !goalId) return <Text>Goal not found</Text>;

  const progress = goal.targetAmount ? goal.currentBalance / goal.targetAmount : null;

  const handleAddContribution = () => {
    if (!contribAmount) return;
    addContribution({
      savingsGoalId: goalId,
      month: parseInt(contribMonth),
      year: parseInt(contribYear),
      amount: parseFloat(contribAmount),
      currencyCode: defaultCurrency,
    });
    setContribAmount('');
    setShowContribModal(false);
  };

  const handleUpdateGoal = () => {
    updateGoal(goalId, {
      name: editName,
      targetAmount: editTarget ? parseFloat(editTarget) : undefined,
      monthlyTarget: parseFloat(editMonthly) || 0,
    });
    setShowEditModal(false);
  };

  const handleDeleteGoal = () => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteGoal(goalId); router.back(); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall">{goal.name}</Text>
            <View style={styles.balanceRow}>
              <AmountDisplay amount={goal.currentBalance} currencyCode={goal.currencyCode} variant="headlineMedium" />
              {goal.targetAmount && (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  / {formatAmount(goal.targetAmount, goal.currencyCode)}
                </Text>
              )}
            </View>
            {progress !== null && <ProgressBar progress={progress} />}
            <Text variant="bodySmall" style={styles.monthlyLabel}>
              Monthly target: {formatAmount(goal.monthlyTarget, goal.currencyCode)}
            </Text>
            <View style={styles.actionRow}>
              <Button mode="outlined" onPress={() => setShowEditModal(true)} compact>Edit</Button>
              <Button mode="outlined" onPress={handleDeleteGoal} textColor={theme.colors.error} compact>Delete</Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>Contributions</Text>
            {goalContributions.length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Period</DataTable.Title>
                  <DataTable.Title numeric>Amount</DataTable.Title>
                </DataTable.Header>
                {goalContributions.map(c => (
                  <DataTable.Row key={c.id}>
                    <DataTable.Cell>{getMonthName(c.month)} {c.year}</DataTable.Cell>
                    <DataTable.Cell numeric>{formatAmount(c.amount, c.currencyCode)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>No contributions yet</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Contribution"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setShowContribModal(true)}
      />

      <Portal>
        <Modal visible={showContribModal} onDismiss={() => setShowContribModal(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={styles.modalTitle}>Add Contribution</Text>
          <TextInput label="Amount" value={contribAmount} onChangeText={setContribAmount} mode="outlined" keyboardType="numeric" style={styles.input} />
          <View style={styles.periodRow}>
            <TextInput label="Month (1-12)" value={contribMonth} onChangeText={setContribMonth} mode="outlined" keyboardType="numeric" style={[styles.input, styles.periodInput]} />
            <TextInput label="Year" value={contribYear} onChangeText={setContribYear} mode="outlined" keyboardType="numeric" style={[styles.input, styles.periodInput]} />
          </View>
          <View style={styles.modalActions}>
            <Button onPress={() => setShowContribModal(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddContribution}>Add</Button>
          </View>
        </Modal>

        <Modal visible={showEditModal} onDismiss={() => setShowEditModal(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={styles.modalTitle}>Edit Goal</Text>
          <TextInput label="Name" value={editName} onChangeText={setEditName} mode="outlined" style={styles.input} />
          <TextInput label="Target Amount (optional)" value={editTarget} onChangeText={setEditTarget} mode="outlined" keyboardType="numeric" style={styles.input} />
          <TextInput label="Monthly Target" value={editMonthly} onChangeText={setEditMonthly} mode="outlined" keyboardType="numeric" style={styles.input} />
          <View style={styles.modalActions}>
            <Button onPress={() => setShowEditModal(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleUpdateGoal}>Save</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 80 },
  card: { marginHorizontal: 16, marginTop: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  monthlyLabel: { marginTop: 8, opacity: 0.6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sectionTitle: { marginBottom: 8 },
  emptyText: { textAlign: 'center', marginVertical: 16, opacity: 0.5 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  modal: { margin: 20, padding: 20, borderRadius: 12 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodInput: { flex: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
