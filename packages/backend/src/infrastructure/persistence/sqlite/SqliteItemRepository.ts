import type { DatabaseSync } from 'node:sqlite';
import {
  type Category,
  type DueDate,
  Item,
  type ItemFilter,
  type ItemRepository,
  type ItemStatus,
  type Urgency,
  ValidationError,
} from '../../../domain/index.js';

interface ItemRow {
  id: string;
  name: string;
  category: string;
  urgency: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS = 'id, name, category, urgency, status, due_date, notes, created_at, updated_at';

/** Adaptador de persistencia sobre SQLite (módulo nativo `node:sqlite`, sin dependencias). */
export class SqliteItemRepository implements ItemRepository {
  constructor(private readonly db: DatabaseSync) {}

  async findAll(filter: ItemFilter = {}): Promise<Item[]> {
    const rows =
      filter.category === undefined
        ? this.db.prepare(`SELECT ${COLUMNS} FROM items ORDER BY position`).all()
        : this.db
            .prepare(`SELECT ${COLUMNS} FROM items WHERE category = ? ORDER BY position`)
            .all(filter.category);
    return (rows as unknown as ItemRow[]).map(toEntity);
  }

  async findById(id: string): Promise<Item | null> {
    const row = this.db.prepare(`SELECT ${COLUMNS} FROM items WHERE id = ?`).get(id);
    return row ? toEntity(row as unknown as ItemRow) : null;
  }

  async save(item: Item): Promise<void> {
    const p = item.toProps();
    const params = [
      p.name,
      p.category,
      p.urgency,
      p.status,
      p.dueDate,
      p.notes,
      p.updatedAt.toISOString(),
      p.id,
    ];
    const { changes } = this.db
      .prepare(
        `UPDATE items SET name = ?, category = ?, urgency = ?, status = ?, due_date = ?,
           notes = ?, updated_at = ? WHERE id = ?`,
      )
      .run(...params);
    if (changes > 0) return;

    // Ítem nuevo: entra al principio de la lista.
    this.db
      .prepare(
        `INSERT INTO items (${COLUMNS}, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,
                 (SELECT COALESCE(MIN(position), 0) - 1 FROM items))`,
      )
      .run(
        p.id,
        p.name,
        p.category,
        p.urgency,
        p.status,
        p.dueDate,
        p.notes,
        p.createdAt.toISOString(),
        p.updatedAt.toISOString(),
      );
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM items WHERE id = ?').run(id);
  }

  async getOrder(): Promise<string[]> {
    const rows = this.db.prepare('SELECT id FROM items ORDER BY position').all();
    return (rows as unknown as { id: string }[]).map((r) => r.id);
  }

  async saveOrder(ids: readonly string[]): Promise<void> {
    const current = await this.getOrder();
    const sameSet =
      ids.length === current.length &&
      new Set(ids).size === ids.length &&
      ids.every((id) => current.includes(id));
    if (!sameSet) {
      throw new ValidationError('El nuevo orden debe contener exactamente los ítems actuales');
    }
    const update = this.db.prepare('UPDATE items SET position = ? WHERE id = ?');
    this.db.exec('BEGIN');
    try {
      ids.forEach((id, index) => update.run(index, id));
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

function toEntity(row: ItemRow): Item {
  return Item.restore({
    id: row.id,
    name: row.name,
    category: row.category as Category,
    urgency: row.urgency as Urgency,
    status: row.status as ItemStatus,
    dueDate: row.due_date as DueDate | null,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}
