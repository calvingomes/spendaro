import type { Expense, Pot } from "@/lib/types";

const DB_NAME = "xpenses-db";
const STORE_NAME = "expenses";
const POTS_STORE_NAME = "pots";
const DB_VERSION = 3;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(POTS_STORE_NAME)) {
        db.createObjectStore(POTS_STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveLocalExpenses(expenses: Expense[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    store.clear();
    expenses.forEach((expense) => {
      store.put(expense);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalExpenses(): Promise<Expense[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as Expense[]) || [];
        items.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
          return String(b.id || "").localeCompare(String(a.id || ""));
        });
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to fetch local expenses from IndexedDB:", err);
    return [];
  }
}

export async function putLocalExpense(expense: Expense): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(expense);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLocalExpense(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveLocalPots(pots: Pot[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POTS_STORE_NAME, "readwrite");
    const store = tx.objectStore(POTS_STORE_NAME);
    
    store.clear();
    pots.forEach((pot) => {
      store.put(pot);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalPots(): Promise<Pot[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(POTS_STORE_NAME, "readonly");
      const store = tx.objectStore(POTS_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as Pot[]) || [];
        items.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeA - timeB;
        });
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to fetch local pots from IndexedDB:", err);
    return [];
  }
}

export async function putLocalPot(pot: Pot): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POTS_STORE_NAME, "readwrite");
    const store = tx.objectStore(POTS_STORE_NAME);
    store.put(pot);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLocalPot(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POTS_STORE_NAME, "readwrite");
    const store = tx.objectStore(POTS_STORE_NAME);
    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

