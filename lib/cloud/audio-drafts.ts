export type AudioDraft = {
  key: string;
  blob: Blob;
  attempt: string;
  prompt: string;
};
async function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("bazuka-private-audio-drafts", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("drafts", { keyPath: "key" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function readDraft(key: string) {
  const db = await open();
  return new Promise<AudioDraft | undefined>((resolve, reject) => {
    const tx = db.transaction("drafts", "readonly");
    const r = tx.objectStore("drafts").get(key);
    tx.oncomplete = () => {
      db.close();
      resolve(r.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function writeDraft(key: string, draft?: AudioDraft) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    if (draft) tx.objectStore("drafts").put(draft);
    else tx.objectStore("drafts").delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
