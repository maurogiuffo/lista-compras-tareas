import { describe, expect, it } from 'vitest';
import { Item, ValidationError } from '../../src/domain/index.js';

const now = new Date('2026-01-01T10:00:00Z');
const later = new Date('2026-01-02T10:00:00Z');

describe('Item', () => {
  it('se crea pendiente, con urgencia media por defecto y nombre recortado', () => {
    const item = Item.create(
      '1',
      { name: '  Tomates ', category: 'insumos', subcategory: 'verduleria' },
      now,
    );
    expect(item.name).toBe('Tomates');
    expect(item.status).toBe('pending');
    expect(item.urgency).toBe('media');
    expect(item.dueDate).toBeNull();
    expect(item.createdAt).toEqual(now);
  });

  it('acepta tareas con fecha y urgencia', () => {
    const item = Item.create(
      '1',
      { name: 'Pagar luz', category: 'tarea', urgency: 'alta', dueDate: '2026-03-10' },
      now,
    );
    expect(item.dueDate).toBe('2026-03-10');
    expect(item.urgency).toBe('alta');
  });

  it.each([
    [{ name: '', category: 'insumos', subcategory: 'carniceria' }],
    [{ name: 'x'.repeat(121), category: 'insumos', subcategory: 'carniceria' }],
    [{ name: 'Asado', category: 'ferreteria' }],
    [{ name: 'Asado', category: 'insumos', urgency: 'urgentisima' }],
    [{ name: 'Asado', category: 'insumos', dueDate: '2026-02-30' }],
    [{ name: 'Asado', category: 'insumos', dueDate: '10/03/2026' }],
  ])('rechaza datos inválidos %j', (input) => {
    expect(() => Item.create('1', input, now)).toThrow(ValidationError);
  });

  it('actualiza solo los campos enviados, limpia con null y no muta el original', () => {
    const original = Item.create(
      '1',
      { name: 'Pagar luz', category: 'tarea', dueDate: '2026-03-10' },
      now,
    );
    const updated = original.update({ urgency: 'alta', dueDate: null }, later);
    expect(updated.urgency).toBe('alta');
    expect(updated.dueDate).toBeNull();
    expect(updated.name).toBe('Pagar luz');
    expect(updated.updatedAt).toEqual(later);
    expect(original.urgency).toBe('media');
  });

  it('admite subcategoría solo en insumos', () => {
    const item = Item.create(
      '1',
      { name: 'Lavandina', category: 'insumos', subcategory: 'limpieza' },
      now,
    );
    expect(item.subcategory).toBe('limpieza');
    expect(Item.create('2', { name: 'Sal', category: 'insumos' }, now).subcategory).toBeNull();
    expect(() =>
      Item.create('3', { name: 'Pagar luz', category: 'tarea', subcategory: 'limpieza' }, now),
    ).toThrow(ValidationError);
    expect(() =>
      Item.create('4', { name: 'Clavos', category: 'insumos', subcategory: 'ferreteria' }, now),
    ).toThrow(ValidationError);
  });

  it('al pasar a tarea se limpia la subcategoría', () => {
    const item = Item.create(
      '1',
      { name: 'Lavandina', category: 'insumos', subcategory: 'limpieza' },
      now,
    );
    const task = item.update({ category: 'tarea' }, later);
    expect(task.category).toBe('tarea');
    expect(task.subcategory).toBeNull();
    expect(() => item.update({ category: 'tarea', subcategory: 'limpieza' }, later)).toThrow(
      ValidationError,
    );
    expect(item.update({ name: 'Lavandina en gel' }, later).subcategory).toBe('limpieza');
  });

  it('alterna entre comprado y falta', () => {
    const item = Item.create(
      '1',
      { name: 'Leche', category: 'insumos', subcategory: 'limpieza' },
      now,
    );
    expect(item.markDone(later).status).toBe('done');
    expect(item.markDone(later).markPending(later).status).toBe('pending');
  });
});
