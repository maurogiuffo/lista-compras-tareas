import { beforeEach, describe, expect, it } from 'vitest';
import {
  CreateItem,
  DeleteItem,
  ListItems,
  MarkItemDone,
  MarkItemPending,
  ReorderItem,
  UpdateItem,
} from '../../src/application/index.js';
import { NotFoundError, ValidationError } from '../../src/domain/index.js';
import { InMemoryItemRepository } from '../../src/infrastructure/persistence/InMemoryItemRepository.js';
import { FixedClock, SequentialIds } from '../helpers.js';

describe('casos de uso de ítems', () => {
  let repo: InMemoryItemRepository;
  let clock: FixedClock;
  let create: CreateItem;
  let list: ListItems;

  const names = async () => (await list.execute()).map((i) => i.name);

  beforeEach(async () => {
    repo = new InMemoryItemRepository();
    clock = new FixedClock();
    create = new CreateItem(repo, new SequentialIds(), clock);
    list = new ListItems(repo);
    // Cada nuevo ítem entra arriba: el orden final es Leche, Asado, Tomates.
    await create.execute({ name: 'Tomates', category: 'verduleria' });
    await create.execute({ name: 'Asado', category: 'carnes' });
    await create.execute({ name: 'Leche', category: 'insumos' });
  });

  it('los ítems nuevos se agregan al principio', async () => {
    expect(await names()).toEqual(['Leche', 'Asado', 'Tomates']);
  });

  it('filtra por categoría', async () => {
    const carnes = await list.execute({ category: 'carnes' });
    expect(carnes.map((i) => i.name)).toEqual(['Asado']);
    await expect(list.execute({ category: 'otra' })).rejects.toThrow(ValidationError);
  });

  it('al marcar comprado el ítem pasa a la última posición', async () => {
    const done = await new MarkItemDone(repo, clock).execute('item-3'); // Leche
    expect(done.status).toBe('done');
    expect(await names()).toEqual(['Asado', 'Tomates', 'Leche']);
  });

  it('al marcar que falta el ítem sube al principio', async () => {
    const pending = await new MarkItemPending(repo, clock).execute('item-1'); // Tomates
    expect(pending.status).toBe('pending');
    expect(await names()).toEqual(['Tomates', 'Leche', 'Asado']);
  });

  it('reordena con arrastrar y soltar', async () => {
    const reorder = new ReorderItem(repo);
    await reorder.execute('item-1', { beforeId: 'item-3' });
    expect(await names()).toEqual(['Tomates', 'Leche', 'Asado']);
    await reorder.execute('item-1', { afterId: 'item-2' });
    expect(await names()).toEqual(['Leche', 'Asado', 'Tomates']);
  });

  it('edita un ítem y registra la fecha de modificación', async () => {
    clock.advance(60_000);
    const updated = await new UpdateItem(repo, clock).execute('item-2', { name: 'Vacío' });
    expect(updated.name).toBe('Vacío');
    expect(updated.updatedAt).not.toBe(updated.createdAt);
    expect(await names()).toEqual(['Leche', 'Vacío', 'Tomates']);
  });

  it('borra un ítem', async () => {
    await new DeleteItem(repo).execute('item-2');
    expect(await names()).toEqual(['Leche', 'Tomates']);
  });

  it('devuelve NotFound para ids inexistentes', async () => {
    await expect(new DeleteItem(repo).execute('nope')).rejects.toThrow(NotFoundError);
    await expect(new MarkItemDone(repo, clock).execute('nope')).rejects.toThrow(NotFoundError);
    await expect(new UpdateItem(repo, clock).execute('nope', {})).rejects.toThrow(NotFoundError);
  });
});
