export type WhereFilterOp =
  | '<'
  | '<='
  | '=='
  | '!='
  | '>='
  | '>'
  | 'array-contains'
  | 'in'
  | 'array-contains-any'
  | 'not-in';

export type OrderByDirection = 'desc' | 'asc';

export interface IDataService<T> {
  /**
   * Subscribe to all documents in the collection, optionally ordered by a field.
   */
  subscribeAll(callback: (data: T[]) => void, orderByField?: string, orderDirection?: OrderByDirection): () => void;

  /**
   * Subscribe to a single document by ID.
   */
  subscribeOne(id: string, callback: (data: T | null) => void): () => void;

  /**
   * Subscribe to a collection based on a query.
   */
  subscribeByQuery(field: string, op: WhereFilterOp, value: any, callback: (data: T[]) => void): () => void;

  /**
   * Get all documents in the collection once.
   */
  getAll(): Promise<T[]>;

  /**
   * Get a single document by ID once.
   */
  getById(id: string): Promise<T | null>;

  /**
   * Get documents based on a query once.
   */
  getByQuery(field: string, op: WhereFilterOp, value: any): Promise<T[]>;

  /**
   * Add a new document. If id is provided, it sets the document with that ID.
   * Otherwise, it generates an auto-ID.
   */
  add(data: any, id?: string): Promise<string>;

  /**
   * Update an existing document.
   */
  update(id: string, data: any): Promise<void>;

  /**
   * Delete a document.
   */
  delete(id: string): Promise<void>;
}
