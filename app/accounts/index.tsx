import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, FAB, Portal, Modal, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAccountStore } from '@/stores/useAccountStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { EmptyState } from '@/components/ui/EmptyState';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  checking: 'bank',
  savings: 'piggy-bank',
  credit: 'credit-card',
  cash: 'cash',
  other: 'wallet',
};

export default function AccountsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { accounts, loadAccounts, addAccount, getTotalBalance } = useAccountStore();
  const { defaultCurrency } = useSettingsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountType, setAccountType] = useState<string>('checking');
  const [initialBalance, setInitialBalance] = useState('');

  useEffect(() => { loadAccounts(); }, []);

  const handleAdd = () => {
    if (!name.trim()) return;
    addAccount({
      name: name.trim(),
      institution: institution.trim() || undefined,
      accountType: accountType as any,
      currencyCode: defaultCurrency,
      initialBalance: parseFloat(initialBalance) || 0,
      isDefault: accounts.length === 0,
    });
    setName('');
    setInstitution('');
    setInitialBalance('');
    setShowAddModal(false);
  };

  const totalBalance = getTotalBalance();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.totalCard}>
        <Card.Content style={styles.totalContent}>
          <Text variant="bodySmall">Total Balance</Text>
          <AmountDisplay amount={totalBalance} currencyCode={defaultCurrency} variant="headlineMedium" />
        </Card.Content>
      </Card>

      {accounts.length === 0 ? (
        <EmptyState icon="bank" title="No accounts" subtitle="Add your first bank account" />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.accountCard} onPress={() => router.push(`/accounts/${item.id}`)}>
              <Card.Content style={styles.accountContent}>
                <MaterialCommunityIcons name={ACCOUNT_TYPE_ICONS[item.accountType] ?? 'wallet'} size={28} color={theme.colors.primary} />
                <View style={styles.accountInfo}>
                  <Text variant="titleMedium">{item.name}</Text>
                  {item.institution && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.institution}</Text>}
                </View>
                <AmountDisplay amount={item.balance} currencyCode={item.currencyCode} variant="titleMedium" colorize />
              </Card.Content>
            </Card>
          )}
        />
      )}

      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} color={theme.colors.onPrimary} onPress={() => setShowAddModal(true)} />

      <Portal>
        <Modal visible={showAddModal} onDismiss={() => setShowAddModal(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={styles.modalTitle}>New Account</Text>
          <TextInput label="Account Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Institution (optional)" value={institution} onChangeText={setInstitution} mode="outlined" style={styles.input} />
          <SegmentedButtons
            value={accountType}
            onValueChange={setAccountType}
            buttons={[
              { value: 'checking', label: 'Checking' },
              { value: 'savings', label: 'Savings' },
              { value: 'credit', label: 'Credit' },
              { value: 'cash', label: 'Cash' },
            ]}
            style={styles.input}
          />
          <TextInput label="Initial Balance" value={initialBalance} onChangeText={setInitialBalance} mode="outlined" keyboardType="numeric" style={styles.input} />
          <View style={styles.modalActions}>
            <Button onPress={() => setShowAddModal(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleAdd}>Add Account</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  totalCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  totalContent: { alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 80 },
  accountCard: { marginBottom: 8 },
  accountContent: { flexDirection: 'row', alignItems: 'center' },
  accountInfo: { flex: 1, marginLeft: 12 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  modal: { margin: 20, padding: 20, borderRadius: 12 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
