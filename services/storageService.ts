
const DB_NAME = 'MangoTour_DB';
const STORE_NAME = 'app_state';
const DB_VERSION = 1;

/**
 * IndexedDB를 초기화하고 연결을 반환합니다.
 */
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storageService = {
  /**
   * 데이터를 저장합니다. 용량 제한이 거의 없습니다.
   */
  async setItem(key: string, value: any): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * 데이터를 가져옵니다.
   */
  async getItem<T>(key: string): Promise<T | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * localStorage 데이터를 IndexedDB로 마이그레이션합니다.
   */
  async migrateFromLocalStorage(keys: string[]): Promise<void> {
    for (const key of keys) {
      const localValue = localStorage.getItem(key);
      if (localValue) {
        try {
          const parsed = JSON.parse(localValue);
          await this.setItem(key, parsed);
          localStorage.removeItem(key); // 마이그레이션 성공 시 로컬스토리지 삭제
          console.log(`Migrated ${key} to IndexedDB`);
        } catch (e) {
          console.error(`Failed to migrate ${key}`, e);
        }
      }
    }
  }
};
