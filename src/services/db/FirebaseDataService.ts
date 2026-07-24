import { db } from '@/lib/firebaseClient';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Query,
  DocumentData,
  CollectionReference,
  getCountFromServer,
  getDocsFromCache,
  getDocsFromServer
} from 'firebase/firestore';
import { IDataService, WhereFilterOp, OrderByDirection } from './types';

export class FirebaseDataService<T extends { id?: string }> implements IDataService<T> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private get collectionRef(): CollectionReference<DocumentData> {
    return collection(db, this.collectionName);
  }

  listenAll(
    callback: (data: T[]) => void,
    orderByField?: string,
    orderDirection?: OrderByDirection
  ): () => void {
    let q: Query<DocumentData> = this.collectionRef;
    if (orderByField) {
      q = query(this.collectionRef, orderBy(orderByField, orderDirection || 'asc'));
    }

    return onSnapshot(q, (snapshot) => {
      const data: T[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
      });
      callback(data);
    });
  }

  subscribeAll(
    callback: (data: T[]) => void,
    orderByField?: string,
    orderDirection?: OrderByDirection,
    forceRefresh?: boolean
  ): () => void {
    let q: Query<DocumentData> = this.collectionRef;
    if (orderByField) {
      q = query(this.collectionRef, orderBy(orderByField, orderDirection || 'asc'));
    }

    const fetchLogic = async () => {
      let snapshot;
      try {
        if (forceRefresh) throw new Error("Force Refresh");
        snapshot = await getDocsFromCache(q);
        if (snapshot.empty) throw new Error("Cache Empty");
      } catch (e) {
        snapshot = await getDocsFromServer(q);
      }
      
      const data: T[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
      });
      callback(data);
    };

    fetchLogic();
    
    // Return dummy unsubscribe function
    return () => {};
  }

  subscribeOne(id: string, callback: (data: T | null) => void): () => void {
    const docRef = doc(db, this.collectionName, id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ ...docSnap.data(), id: docSnap.id } as unknown as T);
      } else {
        callback(null);
      }
    });
  }

  subscribeByQuery(
    field: string,
    op: WhereFilterOp,
    value: any,
    callback: (data: T[]) => void
  ): () => void {
    const q = query(this.collectionRef, where(field, op as any, value));
    return onSnapshot(q, (snapshot) => {
      const data: T[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
      });
      callback(data);
    });
  }

  async getAll(): Promise<T[]> {
    const snapshot = await getDocs(this.collectionRef);
    const data: T[] = [];
    snapshot.forEach((docSnap) => {
      data.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
    });
    return data;
  }

  async getCount(): Promise<number> {
    const snapshot = await getCountFromServer(this.collectionRef);
    return snapshot.data().count;
  }

  async getCountByQuery(field: string, op: WhereFilterOp, value: any): Promise<number> {
    const q = query(this.collectionRef, where(field, op as any, value));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as unknown as T;
    }
    return null;
  }

  async getByQuery(field: string, op: WhereFilterOp, value: any): Promise<T[]> {
    const q = query(this.collectionRef, where(field, op as any, value));
    const snapshot = await getDocs(q);
    const data: T[] = [];
    snapshot.forEach((docSnap) => {
      data.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
    });
    return data;
  }

  async add(data: any, id?: string): Promise<string> {
    if (id) {
      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, data, { merge: true });
      return id;
    } else {
      const docRef = await addDoc(this.collectionRef, data);
      return docRef.id;
    }
  }

  async update(id: string, data: any): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
