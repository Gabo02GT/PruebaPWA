// IndexedDB utility para almacenamiento offline
import type { BodyComposition } from '../types';

class IndexedDBManager {
  private dbName = 'GymTrackerDB';
  private version = 1;

  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear object store para mediciones corporales
        if (!db.objectStoreNames.contains('bodyCompositions')) {
          const store = db.createObjectStore('bodyCompositions', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }

        // Rutinas
        if (!db.objectStoreNames.contains('routines')) {
          const store = db.createObjectStore('routines', { keyPath: 'id', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Ejercicios
        if (!db.objectStoreNames.contains('exercises')) {
          const store = db.createObjectStore('exercises', { keyPath: 'id', autoIncrement: true });
          store.createIndex('name', 'name', { unique: false });
        }

        // Meals
        if (!db.objectStoreNames.contains('meals')) {
          const store = db.createObjectStore('meals', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  async addBodyComposition(data: Omit<BodyComposition, 'id'>): Promise<number> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['bodyCompositions'], 'readwrite');
      const store = transaction.objectStore('bodyCompositions');
      const request = store.add(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getAllBodyCompositions(): Promise<BodyComposition[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['bodyCompositions'], 'readonly');
      const store = transaction.objectStore('bodyCompositions');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getUnsyncedBodyCompositions(): Promise<BodyComposition[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['bodyCompositions'], 'readonly');
      const store = transaction.objectStore('bodyCompositions');
      const index = store.index('synced');
      const range = IDBKeyRange.only(false);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markAsSynced(id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['bodyCompositions'], 'readwrite');
      const store = transaction.objectStore('bodyCompositions');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          const updateRequest = store.put(record);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          reject(new Error('Record not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteBodyComposition(id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['bodyCompositions'], 'readwrite');
      const store = transaction.objectStore('bodyCompositions');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Exercises
  async addExercise(data: { name: string; muscleGroup?: string; equipment?: string; description?: string }): Promise<number> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['exercises'], 'readwrite');
      const store = transaction.objectStore('exercises');
      const request = store.add(data as any);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getAllExercises(): Promise<any[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['exercises'], 'readonly');
      const store = transaction.objectStore('exercises');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteExercise(id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['exercises'], 'readwrite');
      const store = transaction.objectStore('exercises');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Routines
  async addRoutine(data: { name: string; createdAt: string; exercises: Array<{ exerciseId?: number; name: string; sets: number; reps: number }> }): Promise<number> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['routines'], 'readwrite');
      const store = transaction.objectStore('routines');
      const request = store.add(data as any);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getAllRoutines(): Promise<any[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['routines'], 'readonly');
      const store = transaction.objectStore('routines');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteRoutine(id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['routines'], 'readwrite');
      const store = transaction.objectStore('routines');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Meals
  async addMeal(data: { date: string; name: string; calories?: number; protein?: number; carbs?: number; fats?: number; notes?: string }): Promise<number> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['meals'], 'readwrite');
      const store = transaction.objectStore('meals');
      const request = store.add(data as any);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getAllMeals(): Promise<any[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['meals'], 'readonly');
      const store = transaction.objectStore('meals');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteMeal(id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['meals'], 'readwrite');
      const store = transaction.objectStore('meals');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const dbManager = new IndexedDBManager();