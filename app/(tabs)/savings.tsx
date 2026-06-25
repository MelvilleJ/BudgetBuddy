import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, FAB, Button, TextInput, Portal, Modal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatAmount } from '@/utils/money';
import { EmptyState } from '@/components/ui/EmptyState';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SavingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { goals, loadGoals, addGoal, getTotalSaved } = useSavingsStore();
  const { defaultCurrency } = useSettingsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newMonthly, setNewMonthly] = useState('');

  useEffect(() => { loadGoals(); }, []);

  const totalSaved = getTotalSaved();

  const handleAddGoal = () => {
    if (!newName.trim()) return;
    addGoal({
      name: newName.trim(),
      targetAmount: newTarget ? parseFloat(newTarget) : undefined,
      monthlyTarget: parseFloat(newMonthly) || 0,
      currencyCode: defaultCurrency,
    });
    setNewName('');
    setNewTarget('');
    setNewMonthly('');
    setShowAddModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.totalCard}>
          <Card.Content style={styles.totalContent}>
            <MaterialCommunityIcons name="piggy-bank" size={32} color={theme.colors.primary} />
            <View style={styles.totalInfo}>
              <Text variant="bodySmall">Total Saved</Text>
              <AmountDisplay amount={totalSaved} currencyCode={defaultCurrency} variant="headlineMedium" />
            </View>
          </Card.Content>
        </Card>

        {goals.length === 0 ? (
          <EmptyState
            icon="piggy-bank"
            title="No savings goals"
            subtitle="Create a goal to start tracking your savings"
          />
        ) : (
          goals.map(goal => {
            const progress = goal.targetAmount ? goal.currentBalance / goal.targetAmount : null;
            return (
              <Card
                key={goal.id}
                style={styles.goalCard}
                onPress={() => router.push(`/savings/${goal.id}`)}
              >
                <Card.Content>
                  <View style={styles.goalHeader}>
                    <Text variant="titleMedium">{goal.name}</Text>
                    <AmountDisplay amount={goal.currentBalance} currencyCode={goal.currencyCode} variant="titleMedium" />
                  </View>
                  {goal.targetAmount ? (
                    <>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Target: {formatAmount(goal.targetAmount, goal.currencyCode)}
                      </Text>
                      <ProgressBar progress={progress ?? 0} />
                    </>
                  ) : null}
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    Monthly target: {formatAmount(goal.monthlyTarget, goal.currencyCode)}
                  </Text>
                </Card.Content>
              </Card>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setShowAddModal(true)}
      />

      <Portal>
        <Modal visible={showAddModal} onDismiss={() => setShowAddModal(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={styles.modalTitle}>New Savings Goal</Text>
          <TextInput label="Name" value={newName} onChangeText={setNewName} mode="outlined" style={styles.input} />
          <TextInput label="Target Amount (optional)" value={newTarget} onChangeText={setNewTarget} mode="outlined" keyboardType="numeric" style={styles.input} />
          <TextInput label="Monthly Target" value={newMonthly} onChangeText={setNewMonthly} mode="outlined" keyboardType="numeric" style={styles.input} />
          <View style={styles.modalActions}>
            <Button onPress={() => setShowAddModal(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAddGoal}>Create</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 80 },
  totalCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  totalContent: { flexDirection: 'row', alignItems: 'center' },
  totalInfo: { marginLeft: 16 },
  goalCard: { marginHorizontal: 16, marginBottom: 12 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bottomSpacer: { height: 20 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  modal: { margin: 20, padding: 20, borderRadius: 12 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
