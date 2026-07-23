const DB_NAME = "share-target-db";
const STORE_NAME = "shared-files";

export interface SharedFilePayload {
  files: File[];
  title?: string;
  text?: string;
  timestamp: number;
}

function openShareDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Reads and clears the pending shared payload written by the service worker
 * when the app is opened via the Web Share Target action.
 */
export async function getSharedFilesFromIDB(): Promise<SharedFilePayload | undefined> {
  if (typeof indexedDB === "undefined") return undefined;
  const db = await openShareDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const data = await new Promise<SharedFilePayload | undefined>((resolve, reject) => {
    const req = store.get("latest");
    req.onsuccess = () => resolve(req.result as SharedFilePayload | undefined);
    req.onerror = () => reject(req.error);
  });
  if (data) store.delete("latest");
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
  return data;
}
