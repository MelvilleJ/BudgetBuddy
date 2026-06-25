import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { List, TextInput, Text, useTheme, Button, Card, Divider, Switch } from 'react-native-paper';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useRouter } from 'expo-router';
import { CURRENCY_LIST } from '@/constants/currencies';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const settings = useSettingsStore();
  const sync = useSyncStore();

  const [llmUrl, setLlmUrl] = useState(settings.llmBaseUrl);
  const [llmModel, setLlmModel] = useState(settings.llmModel);
  const [llmKey, setLlmKey] = useState(settings.llmApiKey);
  const [supaUrl, setSupaUrl] = useState(settings.supabaseUrl);
  const [supaKey, setSupaKey] = useState(settings.supabaseAnonKey);
  const [income, setIncome] = useState(String(settings.monthlyIncome));

  const saveLLM = () => {
    settings.updateSetting('llm_base_url', llmUrl);
    settings.updateSetting('llm_model', llmModel);
    settings.updateSetting('llm_api_key', llmKey);
  };

  const saveSupabase = () => {
    settings.updateSetting('supabase_url', supaUrl);
    settings.updateSetting('supabase_anon_key', supaKey);
  };

  const saveIncome = () => {
    settings.updateSetting('monthly_income', income);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>AI Receipt Scanner</Text>
          <TextInput label="API Base URL" value={llmUrl} onChangeText={setLlmUrl} mode="outlined" placeholder="http://192.168.1.100:8080" style={styles.input} />
          <TextInput label="Model Name" value={llmModel} onChangeText={setLlmModel} mode="outlined" placeholder="llava" style={styles.input} />
          <TextInput label="API Key" value={llmKey} onChangeText={setLlmKey} mode="outlined" secureTextEntry placeholder="sk-..." style={styles.input} />
          <Button mode="contained" onPress={saveLLM} style={styles.saveButton}>Save AI Settings</Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Supabase Cloud Sync</Text>
          <TextInput label="Supabase URL" value={supaUrl} onChangeText={setSupaUrl} mode="outlined" placeholder="https://xxx.supabase.co" style={styles.input} />
          <TextInput label="Anon Key" value={supaKey} onChangeText={setSupaKey} mode="outlined" secureTextEntry style={styles.input} />
          <Button mode="contained" onPress={saveSupabase} style={styles.saveButton}>Save Sync Settings</Button>

          <Divider style={styles.divider} />
          <View style={styles.syncInfo}>
            <Text variant="bodyMedium">Pending changes: {sync.pendingCount}</Text>
            {sync.lastSyncAt && <Text variant="bodySmall">Last sync: {sync.lastSyncAt}</Text>}
            {sync.lastError && <Text variant="bodySmall" style={{ color: theme.colors.error }}>{sync.lastError}</Text>}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Income</Text>
          <TextInput label="Monthly Take-Home" value={income} onChangeText={setIncome} mode="outlined" keyboardType="numeric" style={styles.input} />
          <Button mode="contained" onPress={saveIncome} style={styles.saveButton}>Update Income</Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Accounts</Text>
          <Button mode="outlined" onPress={() => router.push('/accounts/')} style={styles.saveButton} icon="bank">
            Manage Bank Accounts
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { marginHorizontal: 16, marginTop: 12 },
  sectionTitle: { marginBottom: 12 },
  input: { marginBottom: 8 },
  saveButton: { marginTop: 4 },
  divider: { marginVertical: 12 },
  syncInfo: { gap: 4 },
  bottomSpacer: { height: 40 },
});
