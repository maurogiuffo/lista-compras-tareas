import type { Category, Item, ItemDraft, ReorderTarget } from '../domain/item';

/** Puerto que usa la UI para hablar con el backend. Permite usar un doble en los tests. */
export interface ItemsApi {
  /** Usuario actual: cada usuario tiene su propia lista. */
  me(): Promise<{ user: string }>;
  list(category?: Category): Promise<Item[]>;
  create(draft: ItemDraft): Promise<Item>;
  update(id: string, changes: Partial<ItemDraft>): Promise<Item>;
  remove(id: string): Promise<void>;
  markDone(id: string): Promise<Item>;
  markPending(id: string): Promise<Item>;
  reorder(id: string, target: ReorderTarget): Promise<void>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
