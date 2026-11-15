import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { type MigrationOptions, migrate } from './schema.js';

/** Abre (o crea) la base y aplica las migraciones pendientes. Usar ':memory:' en tests. */
export function openDatabase(
  path: string,
  options: MigrationOptions = { defaultOwner: 'local' },
): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  migrate(db, options);
  return db;
}
