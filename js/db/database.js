/**
 * database.js
 * Camada de acesso ao IndexedDB. Substitui totalmente o localStorage.
 * Responsável por: abrir conexão, criar/migrar schema, expor operações
 * genéricas de baixo nível (get, getAll, put, delete, clear).
 * Nenhuma regra de negócio deve viver aqui — apenas persistência.
 */

const DB_NAME = 'ffpro_db';
const DB_VERSION = 1;

export const STORES = {
  ENTRIES: 'entries',
  ACCOUNTS: 'accounts',
  COST_CENTERS: 'costCenters',
  GOALS: 'goals',
  BUDGETS: 'budgets',
  TRANSFERS: 'transfers',
  SETTINGS: 'settings'
};

let dbPromise = null;

export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORES.ENTRIES)) {
        const entries = db.createObjectStore(STORES.ENTRIES, { keyPath: 'id' });
        entries.createIndex('by_dueDate', 'dueDate');
        entries.createIndex('by_type', 'type');
        entries.createIndex('by_status', 'status');
        entries.createIndex('by_account', 'account');
        entries.createIndex('by_costCenter', 'costCenter');
        entries.createIndex('by_installmentGroup', 'installmentGroup');
        entries.createIndex('by_month', 'monthKey');
      }
      if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
        db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.COST_CENTERS)) {
        db.createObjectStore(STORES.COST_CENTERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.GOALS)) {
        const goals = db.createObjectStore(STORES.GOALS, { keyPath: 'id' });
        goals.createIndex('by_status', 'status');
      }
      if (!db.objectStoreNames.contains(STORES.BUDGETS)) {
        const budgets = db.createObjectStore(STORES.BUDGETS, { keyPath: 'id' });
        budgets.createIndex('by_month', 'month');
        budgets.createIndex('by_category', 'category');
      }
      if (!db.objectStoreNames.contains(STORES.TRANSFERS)) {
        const transfers = db.createObjectStore(STORES.TRANSFERS, { keyPath: 'id' });
        transfers.createIndex('by_date', 'date');
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
    request.onblocked = () => reject(new Error('IndexedDB bloqueado por outra conexão aberta.'));
  });

  return dbPromise;
}

function withStore(storeName, mode, callback) {
  return openDatabase().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

export function getAll(storeName, indexName = null, query = null) {
  return openDatabase().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const source = indexName ? store.index(indexName) : store;
    const request = query ? source.getAll(query) : source.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

export function getOne(storeName, key) {
  return openDatabase().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

export function put(storeName, value) {
  return withStore(storeName, 'readwrite', (store) => store.put(value));
}

export function bulkPut(storeName, values) {
  return openDatabase().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    values.forEach((v) => store.put(v));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  }));
}

export function remove(storeName, key) {
  return withStore(storeName, 'readwrite', (store) => store.delete(key));
}

export function clearStore(storeName) {
  return withStore(storeName, 'readwrite', (store) => store.clear());
}

export async function clearDatabase() {
  await Promise.all(Object.values(STORES).map((s) => clearStore(s)));
}

export async function exportDatabase() {
  const data = {};
  for (const store of Object.values(STORES)) {
    data[store] = await getAll(store);
  }
  return data;
}

export async function importDatabase(data) {
  for (const store of Object.values(STORES)) {
    if (Array.isArray(data[store])) {
      await clearStore(store);
      if (data[store].length) await bulkPut(store, data[store]);
    }
  }
}
