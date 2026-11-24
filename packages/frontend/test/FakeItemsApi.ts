import type { ItemsApi } from '../src/api/ItemsApi';
import type { Category, Item, ItemDraft, ReorderTarget } from '../src/domain/item';

/** Doble de la API en memoria, con las mismas reglas de orden que el backend. */
export class FakeItemsApi implements ItemsApi {
  items: Item[] = [];
  private seq = 0;

  user = 'mauro';

  async me() {
    return { user: this.user };
  }

  async list(category?: Category) {
    return this.items.filter((i) => !category || i.category === category);
  }

  async create(draft: ItemDraft) {
    const allowed = ['name', 'category', 'subcategory', 'urgency', 'dueDate', 'notes'];
    const unknown = Object.keys(draft).filter((k) => !allowed.includes(k));
    if (unknown.length > 0) throw new Error(`Campos no permitidos: ${unknown.join(', ')}`);
    this.seq += 1;
    const item: Item = {
      ...draft,
      id: `item-${this.seq}`,
      status: 'pending',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.items = [item, ...this.items];
    return item;
  }

  async update(id: string, changes: Partial<ItemDraft>) {
    // Igual que la API real: rechaza campos que no se pueden editar.
    const allowed = ['name', 'category', 'subcategory', 'urgency', 'dueDate', 'notes'];
    const unknown = Object.keys(changes).filter((k) => !allowed.includes(k));
    if (unknown.length > 0) throw new Error(`Campos no permitidos: ${unknown.join(', ')}`);
    return this.replace(id, changes);
  }

  async remove(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
  }

  async markDone(id: string) {
    const item = this.replace(id, { status: 'done' });
    this.items = [...this.items.filter((i) => i.id !== id), item];
    return item;
  }

  async markPending(id: string) {
    const item = this.replace(id, { status: 'pending' });
    this.items = [item, ...this.items.filter((i) => i.id !== id)];
    return item;
  }

  async reorder(id: string, target: ReorderTarget) {
    const moved = this.items.find((i) => i.id === id);
    if (!moved) throw new Error('not found');
    const rest = this.items.filter((i) => i.id !== id);
    const anchor = 'beforeId' in target ? target.beforeId : target.afterId;
    const index = rest.findIndex((i) => i.id === anchor) + ('beforeId' in target ? 0 : 1);
    this.items = [...rest.slice(0, index), moved, ...rest.slice(index)];
  }

  private replace(id: string, changes: Partial<Item>): Item {
    const current = this.items.find((i) => i.id === id);
    if (!current) throw new Error('not found');
    const updated = { ...current, ...changes };
    this.items = this.items.map((i) => (i.id === id ? updated : i));
    return updated;
  }
}
