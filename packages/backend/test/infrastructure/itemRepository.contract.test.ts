import { describe, expect, it } from 'vitest';
import {
  Item,
  type ItemRepository,
  type ItemRepositoryProvider,
  type OwnerId,
  ValidationError,
} from '../../src/domain/index.js';
import { InMemoryItemRepositoryProvider } from '../../src/infrastructure/persistence/InMemoryItemRepository.js';
import { SqliteItemRepositoryProvider } from '../../src/infrastructure/persistence/sqlite/SqliteItemRepository.js';
import { openDatabase } from '../../src/infrastructure/persistence/sqlite/openDatabase.js';

const now = new Date('2026-01-01T10:00:00Z');
const make = (id: string, subcategory: string | null = 'verduleria', category = 'insumos') =>
  Item.create(
    id,
    { name: `Item ${id}`, category, subcategory, dueDate: '2026-02-01', notes: 'nota' },
    now,
  );

const ana = 'ana' as OwnerId;
const beto = 'beto' as OwnerId;

/** Toda implementación de ItemRepository debe cumplir el mismo contrato. */
const implementations: [string, () => ItemRepositoryProvider][] = [
  ['InMemory', () => new InMemoryItemRepositoryProvider()],
  ['SQLite', () => new SqliteItemRepositoryProvider(openDatabase(':memory:'))],
];

describe.each(implementations)('ItemRepository (%s)', (_, createProvider) => {
  const createRepo = (): ItemRepository => createProvider().forOwner(ana);

  it('cada dueño tiene su propia lista, con su propio orden', async () => {
    const provider = createProvider();
    const anaList = provider.forOwner(ana);
    const betoList = provider.forOwner(beto);
    await anaList.save(make('a'));
    await anaList.save(make('b'));
    await betoList.save(make('c'));
    expect(await anaList.getOrder()).toEqual(['b', 'a']);
    expect(await betoList.getOrder()).toEqual(['c']);
    // Beto no puede ver, borrar ni reordenar ítems de Ana.
    expect(await betoList.findById('a')).toBeNull();
    await betoList.delete('a');
    expect(await anaList.findById('a')).not.toBeNull();
    await expect(betoList.saveOrder(['a', 'c'])).rejects.toThrow(ValidationError);
    expect((await provider.forOwner(ana).findAll()).map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('guarda y recupera un ítem con todos sus campos', async () => {
    const repo = createRepo();
    const item = make('a');
    await repo.save(item);
    expect((await repo.findById('a'))?.toProps()).toEqual(item.toProps());
    expect(await repo.findById('zzz')).toBeNull();
  });

  it('los ítems nuevos van al principio y actualizar no cambia la posición', async () => {
    const repo = createRepo();
    await repo.save(make('a'));
    await repo.save(make('b'));
    await repo.save(make('c'));
    await repo.save(make('a').markDone(now));
    expect(await repo.getOrder()).toEqual(['c', 'b', 'a']);
    expect((await repo.findById('a'))?.status).toBe('done');
  });

  it('filtra por categoría y subcategoría respetando el orden', async () => {
    const repo = createRepo();
    await repo.save(make('a', 'carniceria'));
    await repo.save(make('b', 'verduleria'));
    await repo.save(make('c', 'carniceria'));
    await repo.save(make('d', null, 'tarea'));
    const carnes = await repo.findAll({ subcategory: 'carniceria' });
    expect(carnes.map((i) => i.id)).toEqual(['c', 'a']);
    const insumos = await repo.findAll({ category: 'insumos' });
    expect(insumos.map((i) => i.id)).toEqual(['c', 'b', 'a']);
    const tareas = await repo.findAll({ category: 'tarea' });
    expect(tareas.map((i) => i.id)).toEqual(['d']);
  });

  it('guarda un orden nuevo y rechaza órdenes incompletos o duplicados', async () => {
    const repo = createRepo();
    await repo.save(make('a'));
    await repo.save(make('b'));
    await repo.saveOrder(['a', 'b']);
    expect((await repo.findAll()).map((i) => i.id)).toEqual(['a', 'b']);
    await expect(repo.saveOrder(['a'])).rejects.toThrow(ValidationError);
    await expect(repo.saveOrder(['a', 'a'])).rejects.toThrow(ValidationError);
  });

  it('borra un ítem', async () => {
    const repo = createRepo();
    await repo.save(make('a'));
    await repo.save(make('b'));
    await repo.delete('a');
    expect(await repo.getOrder()).toEqual(['b']);
    expect(await repo.findById('a')).toBeNull();
  });
});
