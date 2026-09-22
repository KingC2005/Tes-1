import { AppDatabaseState } from '../types';

const DB_NAME = 'LunchAccountingDB';
const DB_VERSION = 1;

const STORES = {
  STATE: 'app_state',
  MEMBERS: 'members',
  INGREDIENTS: 'ingredients',
  PURCHASES: 'purchases',
  MEALS: 'meals',
  TRANSACTIONS: 'transactions',
  SETTLEMENTS: 'settlements',
  RECIPES: 'recipes',
  SETTINGS: 'settings'
};

export class OfflineIndexedDB {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  public static getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('IndexedDB is not supported in this browser.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // Store for full state snapshots
          if (!db.objectStoreNames.contains(STORES.STATE)) {
            db.createObjectStore(STORES.STATE, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.error('Failed to open IndexedDB:', request.error);
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  /**
   * Saves the entire application state snapshot permanently into IndexedDB
   */
  public static async saveState(state: AppDatabaseState): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction([STORES.STATE], 'readwrite');
        const store = tx.objectStore(STORES.STATE);
        
        store.put({
          key: 'current_database_state',
          data: state,
          updatedAt: new Date().toISOString()
        });

        tx.oncomplete = () => {
          resolve(true);
        };

        tx.onerror = () => {
          console.error('IndexedDB saveState transaction error:', tx.error);
          resolve(false);
        };
      });
    } catch (err) {
      console.error('Error saving state to IndexedDB:', err);
      return false;
    }
  }

  /**
   * Loads the application state snapshot from IndexedDB
   */
  public static async loadState(): Promise<AppDatabaseState | null> {
    if (!this.isSupported()) return null;
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction([STORES.STATE], 'readonly');
        const store = tx.objectStore(STORES.STATE);
        const request = store.get('current_database_state');

        request.onsuccess = () => {
          if (request.result && request.result.data) {
            resolve(request.result.data as AppDatabaseState);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('IndexedDB loadState error:', request.error);
          resolve(null);
        };
      });
    } catch (err) {
      console.error('Error loading state from IndexedDB:', err);
      return null;
    }
  }

  /**
   * Check storage quota & offline statistics
   */
  public static async getStorageInfo(): Promise<{
    usageBytes: number;
    quotaBytes: number;
    isPersisted: boolean;
  }> {
    let usageBytes = 0;
    let quotaBytes = 0;
    let isPersisted = false;

    if (typeof navigator !== 'undefined' && navigator.storage) {
      try {
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          usageBytes = estimate.usage || 0;
          quotaBytes = estimate.quota || 0;
        }
        if (navigator.storage.persisted) {
          isPersisted = await navigator.storage.persisted();
        }
      } catch {
        // Ignore fallback
      }
    }

    return { usageBytes, quotaBytes, isPersisted };
  }

  /**
   * Request persistent storage permission so browser never purges it under disk pressure
   */
  public static async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  }
}
