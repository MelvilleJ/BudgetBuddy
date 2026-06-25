import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, useTheme, Card, ActivityIndicator, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { scanReceipt } from '@/services/scanner/receiptScanner';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getDatabase } from '@/db/database';
import { getAllCategories } from '@/db/repositories/categoryRepo';
import type { ScannedReceipt } from '@/types/scanner';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ScanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { getLLMConfig } = useSettingsStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScannedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (source: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = {
      quality: 0.8,
      allowsEditing: false,
    };

    const pickerResult = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!imageUri) return;

    const config = getLLMConfig();
    if (!config.baseUrl) {
      setError('AI not configured. Go to Settings to set up your LLM connection.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const db = getDatabase();
      const categories = getAllCategories(db);
      const scanned = await scanReceipt(imageUri, config, categories);
      setResult(scanned);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const useResult = () => {
    if (!result) return;
    router.replace({
      pathname: '/transaction/new',
      params: {
        prefillDate: result.date,
        prefillAmount: String(result.total),
        prefillDescription: result.vendor,
        prefillCategory: result.suggestedCategory ?? '',
        prefillCurrency: result.currency,
      },
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {!imageUri ? (
        <View style={styles.pickerContainer}>
          <MaterialCommunityIcons name="receipt" size={80} color={theme.colors.onSurfaceVariant} style={styles.icon} />
          <Text variant="titleMedium" style={styles.promptText}>Capture or select a receipt</Text>
          <View style={styles.buttonRow}>
            <Button mode="contained" icon="camera" onPress={() => pickImage('camera')} style={styles.pickButton}>
              Camera
            </Button>
            <Button mode="outlined" icon="image" onPress={() => pickImage('library')} style={styles.pickButton}>
              Gallery
            </Button>
          </View>
        </View>
      ) : (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />

          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={() => { setImageUri(null); setResult(null); setError(null); }}>
              Retake
            </Button>
            <Button mode="contained" onPress={processImage} disabled={isProcessing} loading={isProcessing}>
              {isProcessing ? 'Processing...' : 'Extract Data'}
            </Button>
          </View>

          {error && (
            <Card style={[styles.resultCard, { backgroundColor: theme.colors.errorContainer }]}>
              <Card.Content>
                <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer }}>{error}</Text>
                <Button mode="text" onPress={() => router.push('/transaction/new')} style={styles.manualButton}>
                  Enter manually instead
                </Button>
              </Card.Content>
            </Card>
          )}

          {result && (
            <Card style={styles.resultCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.resultTitle}>Extracted Data</Text>
                <Text variant="bodyMedium">Date: {result.date}</Text>
                <Text variant="bodyMedium">Vendor: {result.vendor}</Text>
                <Text variant="bodyMedium">Total: {result.currency} {result.total}</Text>
                {result.items.length > 0 && (
                  <>
                    <Text variant="bodySmall" style={styles.itemsLabel}>Items:</Text>
                    {result.items.map((item, i) => (
                      <Text key={i} variant="bodySmall">  - {item.name}: {result.currency} {item.amount}</Text>
                    ))}
                  </>
                )}
                <Button mode="contained" onPress={useResult} style={styles.useButton}>
                  Use This Data
                </Button>
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, flexGrow: 1 },
  pickerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
  icon: { marginBottom: 16, opacity: 0.5 },
  promptText: { marginBottom: 24, opacity: 0.6 },
  buttonRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginVertical: 12 },
  pickButton: { minWidth: 120 },
  preview: { width: '100%', height: 300, borderRadius: 12, marginBottom: 8 },
  resultCard: { marginTop: 12 },
  resultTitle: { marginBottom: 8 },
  itemsLabel: { marginTop: 8 },
  useButton: { marginTop: 16 },
  manualButton: { marginTop: 8 },
});
