// team-app/src/offline/queue.js
// NEU (Phase F, Ermittler-Chat-System): rein clientseitige Offline-
// Warteschlange auf Basis von IndexedDB. Speichert fehlgeschlagene
// Chat-Antworten und Foto-Uploads, solange keine Netzwerkverbindung besteht,
// und sendet sie bei Wiederverbindung ueber die bestehenden api-Funktionen
// (respondToChat, submitPhoto) erneut -- es gibt bewusst KEINEN eigenen
// Backend-Sync-Endpunkt, um keine unverifizierten Server-Signaturen zu raten.
const DB_NAME = 'ermittler_offline_queue';
const STORE_NAME = 'actions';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueAction(action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ ...action, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedActions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedAction(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Sendet alle wartenden Aktionen erneut. handlers ist ein Objekt mit
// { respondToChat: (nodeId, response) => Promise, submitPhoto: (nodeId, file) => Promise }.
// Wird typischerweise beim 'online'-Browser-Event aufgerufen.
export async function flushQueue(handlers) {
  const actions = await getQueuedActions();
  for (const action of actions) {
    try {
      if (action.type === 'respond') {
        await handlers.respondToChat(action.nodeId, action.response);
      } else if (action.type === 'photo') {
        await handlers.submitPhoto(action.nodeId, action.file);
      }
      await removeQueuedAction(action.id);
    } catch {
      // Bleibt in der Warteschlange, wird beim naechsten 'online'-Event erneut versucht.
    }
  }
}
