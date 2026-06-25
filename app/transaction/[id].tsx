import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, useTheme, SegmentedButtons, Menu } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { getDatabase } from '@/db/database';
import { getAllCategories } from '@/db/repositories/categoryRepo';
import { getTransactionById } from '@/db/repositories/transactionRepo';
import type { Category } from '@/types/domain';
import { CURRENCY_LIST } from '@/constants/currencies';

export default function EditTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateTransaction, deleteTransaction } = useTransactionStore();
  const { accounts, loadAccounts } = useAccountStore();

  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('TTD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    setCategories(getAllCategories(db));
    loadAccounts();

    if (id) {
      const t = getTransactionById(db, id);
      if (t) {
        setDate(t.date);
        setAmount(String(t.amount));
        setDescription(t.description ?? '');
        setType(t.type);
        setCategoryId(t.categoryId);
        setAccountId(t.accountId ?? '');
        setCurrencyCode(t.currencyCode);
      }
    }
  }, [id]);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedCurrency = CURRENCY_LIST.find(c => c.code === currencyCode);

  const handleSave = () => {
    if (!amount || !categoryId || !id) return;
    updateTransaction({
      id,
      date,
      month: '',
      year: 0,
      categoryId,
      accountId: accountId || undefined,
      description: description || undefined,
      amount: parseFloat(amount),
      currencyCode,
      type,
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTransaction(id!); router.back(); } },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <SegmentedButtons
        value={type}
        onValueChange={v => setType(v as any)}
        buttons={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
          { value: 'transfer', label: 'Transfer' },
        ]}
        style={styles.segmented}
      />

      <TextInput label="Date" value={date} onChangeText={setDate} mode="outlined" placeholder="YYYY-MM-DD" style={styles.input} />
      <TextInput label="Amount" value={amount} onChangeText={setAmount} mode="outlined" keyboardType="numeric" style={styles.input} left={<TextInput.Affix text={selectedCurrency?.symbol ?? '$'} />} />

      <Menu visible={showCurrencyMenu} onDismiss={() => setShowCurrencyMenu(false)} anchor={<TextInput label="Currency" value={`${currencyCode} - ${selectedCurrency?.name ?? ''}`} mode="outlined" style={styles.input} editable={false} onPressIn={() => setShowCurrencyMenu(true)} right={<TextInput.Icon icon="chevron-down" onPress={() => setShowCurrencyMenu(true)} />} />}>
        {CURRENCY_LIST.map(c => <Menu.Item key={c.code} title={`${c.code} - ${c.name}`} onPress={() => { setCurrencyCode(c.code); setShowCurrencyMenu(false); }} />)}
      </Menu>

      <Menu visible={showCategoryMenu} onDismiss={() => setShowCategoryMenu(false)} anchor={<TextInput label="Category" value={selectedCategory?.name ?? 'Select'} mode="outlined" style={styles.input} editable={false} onPressIn={() => setShowCategoryMenu(true)} right={<TextInput.Icon icon="chevron-down" onPress={() => setShowCategoryMenu(true)} />} />}>
        {categories.map(c => <Menu.Item key={c.id} title={c.name} onPress={() => { setCategoryId(c.id); setShowCategoryMenu(false); }} />)}
      </Menu>

      <Menu visible={showAccountMenu} onDismiss={() => setShowAccountMenu(false)} anchor={<TextInput label="Account" value={selectedAccount?.name ?? 'Select'} mode="outlined" style={styles.input} editable={false} onPressIn={() => setShowAccountMenu(true)} right={<TextInput.Icon icon="chevron-down" onPress={() => setShowAccountMenu(true)} />} />}>
        {accounts.map(a => <Menu.Item key={a.id} title={a.name} onPress={() => { setAccountId(a.id); setShowAccountMenu(false); }} />)}
      </Menu>

      <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" style={styles.input} multiline />

      <Button mode="contained" onPress={handleSave} style={styles.saveButton} disabled={!amount || !categoryId}>Update Transaction</Button>
      <Button mode="outlined" onPress={handleDelete} style={styles.deleteButton} textColor={theme.colors.error}>Delete Transaction</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  segmented: { marginBottom: 16 },
  input: { marginBottom: 12 },
  saveButton: { marginTop: 8 },
  deleteButton: { marginTop: 8, borderColor: '#B71C1C' },
});
