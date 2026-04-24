import { useState, useEffect, useCallback } from 'react';

const QUEUE_KEY = 'civicfix_offline_queue';

/**
 * useOfflineSync — Phase 8.1
 * 
 * Queues failed report submissions when offline and syncs them
 * automatically when the user comes back online.
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  /**
   * Add a report submission to the offline queue
   */
  const enqueue = useCallback((reportData) => {
    const item = {
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      data: reportData,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    setQueue((prev) => [...prev, item]);
    return item.id;
  }, []);

  /**
   * Attempt to sync all queued reports
   */
  const syncQueue = useCallback(async () => {
    if (isSyncing || queue.length === 0) return;
    setIsSyncing(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    const results = { success: [], failed: [] };

    for (const item of queue) {
      try {
        const res = await fetch(`${API_URL}/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(item.data),
        });

        if (res.ok) {
          results.success.push(item.id);
        } else {
          results.failed.push({ ...item, retries: item.retries + 1 });
        }
      } catch {
        results.failed.push({ ...item, retries: item.retries + 1 });
      }
    }

    // Remove successfully synced items, keep failed ones (up to 3 retries)
    setQueue(results.failed.filter((item) => item.retries < 3));
    setIsSyncing(false);

    return results;
  }, [queue, isSyncing]);

  // Auto-sync when connection is restored
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_KEY);
  }, []);

  return {
    isOnline,
    queue,
    queueCount: queue.length,
    isSyncing,
    enqueue,
    syncQueue,
    clearQueue,
  };
}
