import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, View, StyleSheet } from 'react-native';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useDatabase } from '@/hooks/useDatabase';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { isReady, error } = useDatabase();
  const loadSettings = useSettingsStore(s => s.loadSettings);
  const settingsLoaded = useSettingsStore(s => s.loaded);

  useEffect(() => {
    if (isReady && !settingsLoaded) {
      loadSettings();
    }
  }, [isReady, settingsLoaded]);

  if (error) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.center}>
          <Text variant="bodyLarge">Database Error: {error}</Text>
        </View>
      </PaperProvider>
    );
  }

  if (!isReady) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.loadingText}>Loading...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="transaction/new" options={{ headerShown: true, title: 'New Transaction', presentation: 'modal' }} />
          <Stack.Screen name="transaction/[id]" options={{ headerShown: true, title: 'Edit Transaction', presentation: 'modal' }} />
          <Stack.Screen name="scan" options={{ headerShown: true, title: 'Scan Receipt', presentation: 'modal' }} />
          <Stack.Screen name="accounts/index" options={{ headerShown: true, title: 'Accounts' }} />
          <Stack.Screen name="accounts/[id]" options={{ headerShown: true, title: 'Account Detail' }} />
          <Stack.Screen name="budget/[categoryId]" options={{ headerShown: true, title: 'Edit Budget', presentation: 'modal' }} />
          <Stack.Screen name="savings/[goalId]" options={{ headerShown: true, title: 'Savings Goal' }} />
          <Stack.Screen name="summary/[month]" options={{ headerShown: true, title: 'Monthly Summary' }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16 },
});
