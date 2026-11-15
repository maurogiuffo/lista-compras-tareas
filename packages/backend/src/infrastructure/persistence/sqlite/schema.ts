import type { DatabaseSync } from 'node:sqlite';

export interface MigrationOptions {
  /** Dueño al que se asignan los ítems creados antes de que existieran usuarios. */
  readonly defaultOwner: string;
}

/**
 * Migraciones en orden. Cada una se aplica una sola vez; la versión aplicada
 * se guarda en `PRAGMA user_version`. Nunca modificar una migración existente:
 * agregar una nueva al final.
 */
const MIGRATIONS: readonly ((options: MigrationOptions) => string)[] = [
  () => `CREATE TABLE items (
     id          TEXT PRIMARY KEY,
     name        TEXT NOT NULL,
     category    TEXT NOT NULL,
     urgency     TEXT NOT NULL,
     status      TEXT NOT NULL,
     due_date    TEXT,
     notes       TEXT,
     position    INTEGER NOT NULL,
     created_at  TEXT NOT NULL,
     updated_at  TEXT NOT NULL
   );
   CREATE INDEX idx_items_position ON items(position);
   CREATE INDEX idx_items_category ON items(category);`,

  // v2: categorías insumos/tarea con subcategorías. Verdulería y carnes pasan a ser
  // subcategorías de insumos.
  () => `ALTER TABLE items ADD COLUMN subcategory TEXT;
   UPDATE items SET category = 'insumos', subcategory = 'verduleria' WHERE category = 'verduleria';
   UPDATE items SET category = 'insumos', subcategory = 'carniceria' WHERE category = 'carnes';`,

  // v3: cada usuario tiene su propia lista. Lo existente pasa al dueño por defecto.
  ({
    defaultOwner,
  }) => `ALTER TABLE items ADD COLUMN owner_id TEXT NOT NULL DEFAULT ${sqlString(defaultOwner)};
   DROP INDEX IF EXISTS idx_items_position;
   CREATE INDEX idx_items_owner_position ON items(owner_id, position);`,
];

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function migrate(db: DatabaseSync, options: MigrationOptions): void {
  const { user_version: current } = db.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.exec('BEGIN');
    try {
      const migration = MIGRATIONS[version];
      if (migration) db.exec(migration(options));
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}
