const SYNC_QUEUE_KEY = 'india-post-brsr-sync-queue';
const CHANNEL_NAME = 'india-post-brsr-live';
const LIVE_EVENT_KEY = 'india-post-brsr-live-event';

let channel = null;
let lastHandledId = null;

function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function readQueue() {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  try {
    const bounded = queue.slice(-50);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(bounded));
    window.dispatchEvent(new CustomEvent('brsr-sync-queue-changed', { detail: { count: bounded.length } }));
    return true;
  } catch {
    return false;
  }
}

export function publishLiveUpdate(payload) {
  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'SUBMISSIONS_UPDATED',
    payload,
    at: new Date().toISOString(),
  };
  getChannel()?.postMessage(message);
  try { localStorage.setItem(LIVE_EVENT_KEY, JSON.stringify(message)); } catch {}
}

export function subscribeToLiveUpdates(handler) {
  const ch = getChannel();
  const handle = (message) => {
    if (!message || message.type !== 'SUBMISSIONS_UPDATED' || message.id === lastHandledId) return;
    lastHandledId = message.id;
    handler(message);
  };
  const listener = (event) => handle(event.data);
  ch?.addEventListener('message', listener);
  const storageListener = (event) => {
    if (event.key === LIVE_EVENT_KEY && event.newValue) {
      try { handle(JSON.parse(event.newValue)); } catch {}
    }
  };
  window.addEventListener('storage', storageListener);
  return () => {
    ch?.removeEventListener('message', listener);
    window.removeEventListener('storage', storageListener);
  };
}

export function enqueueSyncOperation(operation) {
  if (!operation?.id || !operation?.operation) return false;
  const targetSubmissionId = operation.data?.id || operation.data?.clientId || null;
  const queue = readQueue().filter((item) => {
    if (item.id === operation.id) return false;
    const itemSubmissionId = item.data?.id || item.data?.clientId || null;
    return !(targetSubmissionId && item.operation === operation.operation && itemSubmissionId === targetSubmissionId);
  });
  queue.push({ ...operation, at: operation.at || new Date().toISOString() });
  return writeQueue(queue);
}

export function getQueuedSyncCount() {
  return readQueue().length;
}

export function getQueuedOperations() {
  return readQueue();
}

export async function flushSyncQueue() {
  const queue = readQueue();
  if (!queue.length || typeof navigator !== 'undefined' && !navigator.onLine) return 0;
  try {
    const { backendEnabled, syncOperations } = await import('./api.js');
    if (!backendEnabled) return 0;
    const response = await syncOperations(queue.map(({ at, ...operation }) => operation));
    const successful = new Set((response.results || []).filter((r) => r.status === 'ok' || r.status === 'duplicate').map((r) => r.id));
    const remaining = queue.filter((item) => !successful.has(item.id));
    writeQueue(remaining);
    if (successful.size) publishLiveUpdate({ reason: 'SYNC_COMPLETED', count: successful.size });
    return successful.size;
  } catch {
    return 0;
  }
}
