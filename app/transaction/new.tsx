import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TextInput, Button, useTheme, SegmentedButtons, Text, Menu } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getDatabase } from '@/db/database';
import { getAllCategories } from '@/db/repositories/categoryRepo';
import type { Category } from '@/types/domain';
import { formatDate } from '@/utils/date';
import { CURRENCY_LIST } from '@/constants/currencies';

export default function NewTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    prefillDate?: string;
    prefillAmount?: string;
    prefillDescription?: string;
    prefillCategory?: string;
    prefillCurrency?: string;
  }>();

  const { addTransaction } = useTransactionStore();
  const { accounts, loadAccounts } = useAccountStore();
  const { defaultCurrency } = useSettingsStore();

  const [date, setDate] = useState(params.prefillDate ?? formatDate(new Date()));
  const [amount, setAmount] = useState(params.prefillAmount ?? '');
  const [description, setDescription] = useState(params.prefillDescription ?? '');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [categoryId, setCategoryId] = useState(params.prefillCategory ?? '');
  const [accountId, setAccountId] = useState('');
  const [currencyCode, setCurrencyCode] = useState(params.prefillCurrency ?? defaultCurrency);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  useEffect(() => {
    const db = getDatabase();
    setCategories(getAllCategories(db));
    loadAccounts();
  }, []);

  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      const defaultAcc = accounts.find(a => a.isDefault);
      if (defaultAcc) setAccountId(defaultAcc.id);
    }
  }, [accounts]);

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedCurrency = CURRENCY_LIST.find(c => c.code === currencyCode);

  const handleSave = () => {
    if (!amount || !categoryId) return;
    addTransaction({
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

      <TextInput
        label="Date"
        value={date}
        onChangeText={setDate}
        mode="outlined"
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />

      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        left={<TextInput.Affix text={selectedCurrency?.symbol ?? '$'} />}
      />

      <Menu
        visible={showCurrencyMenu}
        onDismiss={() => setShowCurrencyMenu(false)}
        anchor={
          <TextInput
            label="Currency"
            value={`${currencyCode} - ${selectedCurrency?.name ?? ''}`}
            mode="outlined"
            style={styles.input}
            editable={false}
            onPressIn={() => setShowCurrencyMenu(true)}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setShowCurrencyMenu(true)} />}
          />
        }
      >
        {CURRENCY_LIST.map(c => (
          <Menu.Item key={c.code} title={`${c.code} - ${c.name}`} onPress={() => { setCurrencyCode(c.code); setShowCurrencyMenu(false); }} />
        ))}
      </Menu>

      <Menu
        visible={showCategoryMenu}
        onDismiss={() => setShowCategoryMenu(false)}
        anchor={
          <TextInput
            label="Category"
            value={selectedCategory?.name ?? 'Select category'}
            mode="outlined"
            style={styles.input}
            editable={false}
            onPressIn={() => setShowCategoryMenu(true)}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setShowCategoryMenu(true)} />}
          />
        }
      >
        {categories.map(c => (
          <Menu.Item key={c.id} title={c.name} onPress={() => { setCategoryId(c.id); setShowCategoryMenu(false); }} />
        ))}
      </Menu>

      <Menu
        visible={showAccountMenu}
        onDismiss={() => setShowAccountMenu(false)}
        anchor={
          <TextInput
            label="Account"
            value={selectedAccount?.name ?? 'Select account'}
            mode="outlined"
            style={styles.input}
            editable={false}
            onPressIn={() => setShowAccountMenu(true)}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setShowAccountMenu(true)} />}
          />
        }
      >
        {accounts.map(a => (
          <Menu.Item key={a.id} title={a.name} onPress={() => { setAccountId(a.id); setShowAccountMenu(false); }} />
        ))}
      </Menu>

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
        multiline
      />

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
        disabled={!amount || !categoryId}
      >
        Save Transaction
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  segmented: { marginBottom: 16 },
  input: { marginBottom: 12 },
  saveButton: { marginTop: 8 },
});
