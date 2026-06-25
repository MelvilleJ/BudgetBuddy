import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, FAB, Searchbar, Chip, Divider, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { MonthSelector } from '@/components/ui/MonthSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDisplayDate, getCurrentMonth, getCurrentYear } from '@/utils/date';

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { transactions, loadTransactions, setFilters, filters } = useTransactionStore();
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [showMonthFilter, setShowMonthFilter] = useState(true);

  useEffect(() => {
    if (showMonthFilter) {
      setFilters({ month, year, search: undefined });
    } else {
      setFilters({ month: undefined, year: undefined });
    }
  }, [month, year, showMonthFilter]);

  const handleSearch = (query: string) => {
    setSearch(query);
    if (query.length > 1) {
      setFilters({ search: query, month: undefined, year: undefined });
      setShowMonthFilter(false);
    } else if (query.length === 0) {
      setShowMonthFilter(true);
      setFilters({ search: undefined, month, year });
    }
  };

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search transactions..."
        onChangeText={handleSearch}
        value={search}
        style={styles.searchbar}
      />

      {showMonthFilter && (
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />
      )}

      {transactions.length === 0 ? (
        <EmptyState
          icon="swap-horizontal"
          title="No transactions"
          subtitle="Tap + to add your first transaction"
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <Card style={styles.transactionCard} onPress={() => router.push(`/transaction/${item.id}`)}>
              <Card.Content style={styles.transactionContent}>
                <View style={styles.transactionLeft}>
                  <Text variant="bodyLarge">{item.description || item.categoryName || 'Transaction'}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatDisplayDate(item.date)} {item.categoryName ? `· ${item.categoryName}` : ''}
                  </Text>
                  {item.accountName && (
                    <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                      {item.accountName}
                    </Text>
                  )}
                </View>
                <AmountDisplay
                  amount={item.type === 'income' ? item.amount : -item.amount}
                  currencyCode={item.currencyCode}
                  variant="titleMedium"
                  colorize
                />
              </Card.Content>
            </Card>
          )}
        />
      )}

      <View style={styles.fabContainer}>
        <FAB
          icon="camera"
          style={[styles.fabSecondary, { backgroundColor: theme.colors.secondaryContainer }]}
          color={theme.colors.onSecondaryContainer}
          onPress={() => router.push('/scan')}
          size="small"
        />
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => router.push('/transaction/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { marginHorizontal: 16, marginTop: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  transactionCard: { marginVertical: 2 },
  transactionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionLeft: { flex: 1, marginRight: 8 },
  fabContainer: { position: 'absolute', right: 16, bottom: 16, alignItems: 'center' },
  fabSecondary: { marginBottom: 12 },
  fab: {},
});
