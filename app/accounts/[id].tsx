import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAccountStore } from '@/stores/useAccountStore';
import { getDatabase } from '@/db/database';
import { getTransactionsByAccount } from '@/db/repositories/transactionRepo';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDisplayDate } from '@/utils/date';
import type { Transaction } from '@/types/domain';

export default function AccountDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accounts, deleteAccount, getBalance } = useAccountStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const account = accounts.find(a => a.id === id);
  const balance = id ? getBalance(id) : 0;

  useEffect(() => {
    if (id) {
      const db = getDatabase();
      setTransactions(getTransactionsByAccount(db, id));
    }
  }, [id]);

  if (!account) return <Text>Account not found</Text>;

  const handleDelete = () => {
    Alert.alert('Delete Account', 'This will not delete associated transactions.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteAccount(id!); router.back(); } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Text variant="headlineSmall">{account.name}</Text>
          {account.institution && <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{account.institution}</Text>}
          <AmountDisplay amount={balance} currencyCode={account.currencyCode} variant="headlineMedium" colorize style={styles.balance} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Type: {account.accountType} · Currency: {account.currencyCode}
          </Text>
          <Button mode="outlined" onPress={handleDelete} textColor={theme.colors.error} style={styles.deleteBtn} compact>
            Delete Account
          </Button>
        </Card.Content>
      </Card>

      <Text variant="titleSmall" style={styles.sectionTitle}>Transactions</Text>

      {transactions.length === 0 ? (
        <EmptyState icon="swap-horizontal" title="No transactions" subtitle="Transactions linked to this account will appear here" />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txInfo}>
                <Text variant="bodyMedium">{item.description || item.categoryName || 'Transaction'}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{formatDisplayDate(item.date)}</Text>
              </View>
              <AmountDisplay amount={item.type === 'income' ? item.amount : -item.amount} currencyCode={item.currencyCode} colorize />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: { marginHorizontal: 16, marginTop: 8 },
  headerContent: { alignItems: 'center' },
  balance: { marginVertical: 8 },
  deleteBtn: { marginTop: 12, borderColor: '#B71C1C' },
  sectionTitle: { marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  txInfo: { flex: 1, marginRight: 8 },
});
