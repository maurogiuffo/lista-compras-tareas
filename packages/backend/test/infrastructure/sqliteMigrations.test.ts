import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { migrate } from '../../src/infrastructure/persistence/sqlite/schema.js';

describe('migraciones SQLite', () => {
  it('v2 convierte las categorías viejas en subcategorías de insumos', () => {
    const db = new DatabaseSync(':memory:');
    // Simula una base creada con la versión 1.
    db.exec(`CREATE TABLE items (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, urgency TEXT NOT NULL,
      status TEXT NOT NULL, due_date TEXT, notes TEXT, position INTEGER NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      PRAGMA user_version = 1;`);
    const insert = db.prepare(
      `INSERT INTO items VALUES (?, ?, ?, 'media', 'pending', NULL, NULL, 0, 'x', 'x')`,
    );
    insert.run('1', 'Tomates', 'verduleria');
    insert.run('2', 'Asado', 'carnes');
    insert.run('3', 'Detergente', 'insumos');
    insert.run('4', 'Pagar luz', 'tarea');

    migrate(db);

    const rows = db.prepare('SELECT id, category, subcategory FROM items ORDER BY id').all();
    expect(rows.map((r) => ({ ...r }))).toEqual([
      { id: '1', category: 'insumos', subcategory: 'verduleria' },
      { id: '2', category: 'insumos', subcategory: 'carniceria' },
      { id: '3', category: 'insumos', subcategory: null },
      { id: '4', category: 'tarea', subcategory: null },
    ]);
  });
});
