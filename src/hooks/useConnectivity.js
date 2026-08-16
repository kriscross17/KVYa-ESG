import { useEffect, useState } from 'react';
import { flushSyncQueue, getQueuedSyncCount } from '../utils/sync.js';

export function useConnectivity() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [queued, setQueued] = useState(getQueuedSyncCount);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const refresh = () => setQueued(getQueuedSyncCount());
    const handleOnline = async () => {
      setOnline(true);
      const flushed = await flushSyncQueue();
      setQueued(getQueuedSyncCount());
      if (flushed) setLastSync(new Date().toISOString());
    };
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', refresh);
    window.addEventListener('brsr-sync-queue-changed', refresh);
    refresh();
    if (navigator.onLine) {
      flushSyncQueue().then((flushed) => {
        setQueued(getQueuedSyncCount());
        if (flushed) setLastSync(new Date().toISOString());
      }).catch(() => {});
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('brsr-sync-queue-changed', refresh);
    };
  }, []);

  return { online, queued, lastSync };
}
