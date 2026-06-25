import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { triggerSync } from '@/services/sync/syncEngine';
import { useSyncStore } from '@/stores/useSyncStore';

export function useSync() {
  const isConnected = useNetworkStatus();
  const wasConnected = useRef(isConnected);
  const { updatePendingCount, checkConfiguration } = useSyncStore();

  useEffect(() => {
    checkConfiguration();
    updatePendingCount();
  }, []);

  useEffect(() => {
    if (isConnected && !wasConnected.current) {
      triggerSync();
    }
    wasConnected.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      triggerSync();
    }
  }, []);

  return { isConnected, triggerSync };
}
