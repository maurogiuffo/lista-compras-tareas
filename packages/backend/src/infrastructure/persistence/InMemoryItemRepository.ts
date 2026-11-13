import type { Item, ItemFilter, ItemRepository } from '../../domain/index.js';
import { ValidationError } from '../../domain/index.js';

/** Implementación en memoria: útil para tests y desarrollo sin base de datos. */
export class InMemoryItemRepository implements ItemRepository {
  private readonly items = new Map<string, Item>();
  private order: string[] = [];

  async findAll(filter: ItemFilter = {}): Promise<Item[]> {
    return this.order
      .map((id) => this.items.get(id))
      .filter((item): item is Item => item !== undefined)
      .filter((item) => filter.category === undefined || item.category === filter.category);
  }

  async findById(id: string): Promise<Item | null> {
    return this.items.get(id) ?? null;
  }

  async save(item: Item): Promise<void> {
    if (!this.items.has(item.id)) this.order = [item.id, ...this.order];
    this.items.set(item.id, item);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
    this.order = this.order.filter((x) => x !== id);
  }

  async getOrder(): Promise<string[]> {
    return [...this.order];
  }

  async saveOrder(ids: readonly string[]): Promise<void> {
    const sameSet = ids.length === this.order.length && ids.every((id) => this.items.has(id));
    if (!sameSet)
      throw new ValidationError('El nuevo orden debe contener exactamente los ítems actuales');
    this.order = [...ids];
  }
}
