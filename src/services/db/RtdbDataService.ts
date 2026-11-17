import { studentRtdb } from '@/lib/firebaseClient';
import {
  Database,
  DataSnapshot,
  endAt,
  equalTo,
  get,
  onValue,
  orderByChild,
  push,
  query as rtdbQuery,
  ref,
  remove,
  set,
  startAt,
  update,
  Query,
} from 'firebase/database';
import { IDataService, OrderByDirection, WhereFilterOp } from './types';
import { SharedStream, subscribeToSharedStream } from './sharedStream';

/**
 * Firebase RTDB rejects objects containing undefined values anywhere in the tree.
 * Strips undefined keys recursively while preserving explicit null/empty strings.
 */
function sanitizeForRtdb<V>(value: V): V {
  if (value === undefined) return null as unknown as V;
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : sanitizeForRtdb(item))) as unknown as V;
  }
  if (value && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        cleaned[k] = sanitizeForRtdb(v);
      }
    }
    return cleaned as V;
  }
  return value;
}

function matchesFilter(fieldVal: any, op: WhereFilterOp, target: any): boolean {
  switch (op) {
    case '==': return fieldVal === target;
    case '!=': return fieldVal !== target;
    case '<': return fieldVal < target;
    case '<=': return fieldVal <= target;
    case '>': return fieldVal > target;
    case '>=': return fieldVal >= target;
    case 'in': return Array.isArray(target) && target.includes(fieldVal);
    case 'not-in': return Array.isArray(target) && !target.includes(fieldVal);
    case 'array-contains': return Array.isArray(fieldVal) && fieldVal.includes(target);
    case 'array-contains-any':
      return Array.isArray(fieldVal) && Array.isArray(target) && target.some((t) => fieldVal.includes(t));
    default: return true;
  }
}

function sortRecords<T>(items: T[], orderByField?: string, orderDirection?: OrderByDirection): T[] {
  if (!orderByField) return items;
  const dir = orderDirection === 'desc' ? -1 : 1;
  return [...items].sort((a: any, b: any) => {
    const av = a?.[orderByField];
    const bv = b?.[orderByField];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

function snapshotToArray<T>(
  snapshot: DataSnapshot,
  orderByField?: string,
  orderDirection?: OrderByDirection
): T[] {
  const items: T[] = [];
  if (!snapshot.exists()) return items;
  snapshot.forEach((child) => {
    const val = child.val();
    if (val && typeof val === 'object') {
      items.push({ ...val, id: child.key } as unknown as T);
    }
  });
  return sortRecords(items, orderByField, orderDirection);
}

function isMissingIndexError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '').toLowerCase();
  return msg.includes('index not defined');
}

/**
 * Firebase Realtime Database adapter implementing IDataService<T> with
 * shared multi-component stream pooling and safe fallback for unindexed queries.
 */
export class RtdbDataService<T extends { id?: string }> implements IDataService<T> {
  private path: string;
  private rtdbInstance: Database;
  private listStreams = new Map<string, SharedStream<T[]>>();
  private docStreams = new Map<string, SharedStream<T | null>>();

  constructor(path: string, customRtdb?: Database) {
    this.path = path;
    this.rtdbInstance = customRtdb || studentRtdb;
  }

  private get collectionRef() {
    return ref(this.rtdbInstance, this.path);
  }

  private buildQueryRef(field: string, op: WhereFilterOp, value: any): { q: Query; serverFiltered: boolean } {
    if (value !== undefined && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null)) {
      if (op === '==') {
        return { q: rtdbQuery(this.collectionRef, orderByChild(field), equalTo(value)), serverFiltered: true };
      }
      if (op === '>=') {
        return { q: rtdbQuery(this.collectionRef, orderByChild(field), startAt(value)), serverFiltered: true };
      }
      if (op === '<=') {
        return { q: rtdbQuery(this.collectionRef, orderByChild(field), endAt(value)), serverFiltered: true };
      }
    }
    return { q: this.collectionRef, serverFiltered: false };
  }

  listenAll(
    callback: (data: T[]) => void,
    orderByField?: string,
    orderDirection?: OrderByDirection
  ): () => void {
    const key = `all:${orderByField || ''}:${orderDirection || 'asc'}`;

    return subscribeToSharedStream<T[]>(
      this.listStreams,
      key,
      [],
      callback,
      `RTDB:${this.path}`,
      (onNext, onError) =>
        onValue(
          this.collectionRef,
          (snapshot) => onNext(snapshotToArray<T>(snapshot, orderByField, orderDirection)),
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
    const docRef = ref(this.rtdbInstance, `${this.path}/${id}`);

    return subscribeToSharedStream<T | null>(
      this.docStreams,
      key,
      null,
      callback,
      `RTDB:${this.path}`,
      (onNext, onError) =>
        onValue(
          docRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const val = snapshot.val();
              onNext({ ...(val && typeof val === 'object' ? val : {}), id: snapshot.key } as unknown as T);
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
    const { q, serverFiltered } = this.buildQueryRef(field, op, value);

    return subscribeToSharedStream<T[]>(
      this.listStreams,
      key,
      [],
      callback,
      `RTDB:${this.path}`,
      (onNext, onError) => {
        let activeUnsub: (() => void) | null = null;
        let cancelled = false;

        const attachFallback = () => {
          if (cancelled) return;
          activeUnsub = onValue(
            this.collectionRef,
            (snapshot) => {
              const rows = snapshotToArray<T>(snapshot);
              onNext(rows.filter((item: any) => matchesFilter(item?.[field], op, value)));
            },
            onError
          );
        };

        activeUnsub = onValue(
          q,
          (snapshot) => {
            const rows = snapshotToArray<T>(snapshot);
            onNext(serverFiltered ? rows : rows.filter((item: any) => matchesFilter(item?.[field], op, value)));
          },
          (err) => {
            if (serverFiltered && isMissingIndexError(err)) {
              console.warn(
                `[RTDB:${this.path}] Missing ".indexOn": ["${field}"] in RTDB Rules; falling back to client filter.`
              );
              attachFallback();
            } else {
              onError(err);
            }
          }
        );

        return () => {
          cancelled = true;
          if (activeUnsub) activeUnsub();
        };
      }
    );
  }

  async getAll(): Promise<T[]> {
    const warmStream = this.listStreams.get('all::asc');
    if (warmStream?.hasData && warmStream.unsubscribeSource) {
      return [...warmStream.latestData];
    }

    const snapshot = await get(this.collectionRef);
    return snapshotToArray<T>(snapshot);
  }

  async getCount(): Promise<number> {
    const all = await this.getAll();
    return all.length;
  }

  async getCountByQuery(field: string, op: WhereFilterOp, value: any): Promise<number> {
    const matched = await this.getByQuery(field, op, value);
    return matched.length;
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

    const snapshot = await get(ref(this.rtdbInstance, `${this.path}/${id}`));
    if (snapshot.exists()) {
      const val = snapshot.val();
      return { ...(val && typeof val === 'object' ? val : {}), id: snapshot.key } as unknown as T;
    }
    return null;
  }

  async getByQuery(field: string, op: WhereFilterOp, value: any): Promise<T[]> {
    const { q, serverFiltered } = this.buildQueryRef(field, op, value);
    try {
      const snapshot = await get(q);
      const rows = snapshotToArray<T>(snapshot);
      return serverFiltered ? rows : rows.filter((item: any) => matchesFilter(item?.[field], op, value));
    } catch (err) {
      if (serverFiltered && isMissingIndexError(err)) {
        const snapshot = await get(this.collectionRef);
        const rows = snapshotToArray<T>(snapshot);
        return rows.filter((item: any) => matchesFilter(item?.[field], op, value));
      }
      throw err;
    }
  }

  async add(data: any, id?: string): Promise<string> {
    const timestamp = new Date().toISOString();
    const payload = sanitizeForRtdb({
      ...data,
      updatedAt: timestamp,
      createdAt: data?.createdAt || timestamp,
    });

    if (id) {
      await update(ref(this.rtdbInstance, `${this.path}/${id}`), payload);
      return id;
    }

    const newRef = push(this.collectionRef);
    await set(newRef, { ...payload, id: newRef.key });
    return newRef.key!;
  }

  async update(id: string, data: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const payload = sanitizeForRtdb({
      ...data,
      updatedAt: timestamp,
    });
    await update(ref(this.rtdbInstance, `${this.path}/${id}`), payload);
  }

  async delete(id: string): Promise<void> {
    await remove(ref(this.rtdbInstance, `${this.path}/${id}`));
  }
}
