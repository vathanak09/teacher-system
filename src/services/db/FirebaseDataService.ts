import { db } from '@/lib/firebaseClient';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
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
  getFirestore,
} from 'firebase/firestore';
import { IDataService, WhereFilterOp, OrderByDirection } from './types';
import { SharedStream, subscribeToSharedStream } from './sharedStream';

export class FirebaseDataService<T extends { id?: string }> implements IDataService<T> {
  private collectionName: string;
  private dbInstance: ReturnType<typeof getFirestore>;
  private listStreams = new Map<string, SharedStream<T[]>>();
  private docStreams = new Map<string, SharedStream<T | null>>();

  constructor(collectionName: string, customDb?: ReturnType<typeof getFirestore>) {
    this.collectionName = collectionName;
    this.dbInstance = customDb || db;
  }

  private get collectionRef(): CollectionReference<DocumentData> {
    return collection(this.dbInstance, this.collectionName);
  }

  listenAll(
    callback: (data: T[]) => void,
    orderByField?: string,
    orderDirection?: OrderByDirection
  ): () => void {
    const key = `all:${orderByField || ''}:${orderDirection || 'asc'}`;
    let q: Query<DocumentData> = this.collectionRef;
    if (orderByField) {
      q = query(this.collectionRef, orderBy(orderByField, orderDirection || 'asc'));
    }

    return subscribeToSharedStream<T[]>(
      this.listStreams,
      key,
      [],
      callback,
      `Firestore:${this.collectionName}`,
      (onNext, onError) =>
        onSnapshot(
          q,
          (snapshot) => {
            const data: T[] = [];
            snapshot.forEach((docSnap) => {
              data.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
            });
            onNext(data);
          },
          onError
        )
    );
  }

  subscribeAll(
    callback: (data: T[]) => void,
    orderByField?: string,
    orderDirection?: OrderByDirection,
    _forceRefresh?: boolean
  ): () => void {
    return this.listenAll(callback, orderByField, orderDirection);
  }

  subscribeOne(id: string, callback: (data: T | null) => void): () => void {
    const key = `doc:${id}`;
    const docRef = doc(this.dbInstance, this.collectionName, id);

    return subscribeToSharedStream<T | null>(
      this.docStreams,
      key,
      null,
      callback,
      `Firestore:${this.collectionName}`,
      (onNext, onError) =>
        onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              onNext({ ...docSnap.data(), id: docSnap.id } as unknown as T);
            } else {
              onNext(null);
            }
          },
          onError
        )
    );
  }

  subscribeByQuery(
    field: string,
    op: WhereFilterOp,
    value: any,
    callback: (data: T[]) => void
  ): () => void {
    const key = `q:${field}:${op}:${JSON.stringify(value)}`;
    const q = query(this.collectionRef, where(field, op as any, value));

    return subscribeToSharedStream<T[]>(
      this.listStreams,
      key,
      [],
      callback,
      `Firestore:${this.collectionName}`,
      (onNext, onError) =>
        onSnapshot(
          q,
          (snapshot) => {
            const data: T[] = [];
            snapshot.forEach((docSnap) => {
              data.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
            });
            onNext(data);
          },
          onError
        )
    );
  }

  async getAll(): Promise<T[]> {
    const warmStream = this.listStreams.get('all::asc');
    if (warmStream?.hasData && warmStream.unsubscribeSource) {
      return [...warmStream.latestData];
    }

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
    const warmDoc = this.docStreams.get(`doc:${id}`);
    if (warmDoc?.hasData && warmDoc.unsubscribeSource) {
      return warmDoc.latestData ? { ...warmDoc.latestData } : null;
    }
    const warmAll = this.listStreams.get('all::asc');
    if (warmAll?.hasData && warmAll.unsubscribeSource) {
      const found = warmAll.latestData.find((item) => item.id === id);
      return found ? { ...found } : null;
    }

    const docRef = doc(this.dbInstance, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as unknown as T;
    }
    return null;
  }

  /**
   * Fetches the latest document directly from the Firestore server, falling back to cache/getDoc if offline.
   */
  async getFreshById(id: string): Promise<T | null> {
    const docRef = doc(this.dbInstance, this.collectionName, id);
    try {
      const docSnap = await getDocFromServer(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as unknown as T;
      }
      return null;
    } catch {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as unknown as T;
      }
      return null;
    }
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
    const timestamp = new Date().toISOString();
    const dataWithTimestamp = { ...data, updatedAt: timestamp, createdAt: data.createdAt || timestamp };
    if (id) {
      const docRef = doc(this.dbInstance, this.collectionName, id);
      await setDoc(docRef, dataWithTimestamp, { merge: true });
      return id;
    } else {
      const docRef = await addDoc(this.collectionRef, dataWithTimestamp);
      return docRef.id;
    }
  }

  async update(id: string, data: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const dataWithTimestamp = { ...data, updatedAt: timestamp };
    const docRef = doc(this.dbInstance, this.collectionName, id);
    await updateDoc(docRef, dataWithTimestamp);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.dbInstance, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
