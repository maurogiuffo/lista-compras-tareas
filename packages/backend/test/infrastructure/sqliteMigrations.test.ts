import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { migrate } from '../../src/infrastructure/persistence/sqlite/schema.js';

describe('migraciones SQLite', () => {
  it('v2 y v3: categorías viejas a subcategorías, y lo existente al dueño por defecto', () => {
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

    migrate(db, { defaultOwner: 'mauro' });

    const rows = db
      .prepare('SELECT id, category, subcategory, owner_id FROM items ORDER BY id')
      .all();
    expect(rows.map((r) => ({ ...r }))).toEqual([
      { id: '1', category: 'insumos', subcategory: 'verduleria', owner_id: 'mauro' },
      { id: '2', category: 'insumos', subcategory: 'carniceria', owner_id: 'mauro' },
      { id: '3', category: 'insumos', subcategory: null, owner_id: 'mauro' },
      { id: '4', category: 'tarea', subcategory: null, owner_id: 'mauro' },
    ]);
  });
});
