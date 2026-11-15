import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ItemDto } from '../../src/application/index.js';
import { createUseCasesFactory } from '../../src/container.js';
import { buildServer } from '../../src/infrastructure/http/buildServer.js';
import { ownerFromProxyHeader } from '../../src/infrastructure/http/owner.js';
import { SqliteItemRepositoryProvider } from '../../src/infrastructure/persistence/sqlite/SqliteItemRepository.js';
import { openDatabase } from '../../src/infrastructure/persistence/sqlite/openDatabase.js';
import { FixedClock, SequentialIds } from '../helpers.js';

describe('API /api/items', () => {
  let app: FastifyInstance;

  const create = async (body: object) => {
    const res = await app.inject({ method: 'POST', url: '/api/items', payload: body });
    return { status: res.statusCode, item: res.json<ItemDto>() };
  };
  const names = async (query = '') => {
    const res = await app.inject({ method: 'GET', url: `/api/items${query}` });
    return res.json<ItemDto[]>().map((i) => i.name);
  };

  beforeEach(async () => {
    const provider = new SqliteItemRepositoryProvider(openDatabase(':memory:'));
    app = await buildServer({
      useCasesFor: createUseCasesFactory(provider, {
        clock: new FixedClock(),
        ids: new SequentialIds(),
      }),
      resolveOwner: ownerFromProxyHeader('local'),
    });
  });

  afterEach(() => app.close());

  it('cada usuario del proxy ve solo su lista', async () => {
    const as = (user: string) => ({ 'x-remote-user': user });
    await app.inject({
      method: 'POST',
      url: '/api/items',
      headers: as('ana'),
      payload: { name: 'Yerba', category: 'insumos' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/items',
      headers: as('beto'),
      payload: { name: 'Café', category: 'insumos' },
    });
    const list = async (user: string) =>
      (await app.inject({ method: 'GET', url: '/api/items', headers: as(user) }))
        .json<ItemDto[]>()
        .map((i) => i.name);
    expect(await list('ana')).toEqual(['Yerba']);
    expect(await list('beto')).toEqual(['Café']);
    // Sin header, el usuario por defecto tiene su propia lista (vacía).
    expect(await names()).toEqual([]);

    // Beto no puede tocar ítems de Ana.
    const res = await app.inject({
      method: 'POST',
      url: '/api/items/item-1/done',
      headers: as('beto'),
    });
    expect(res.statusCode).toBe(404);

    const me = await app.inject({ method: 'GET', url: '/api/me', headers: as('ana') });
    expect(me.json()).toEqual({ user: 'ana' });
  });

  it('responde el health check', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('crea, lista, edita y borra', async () => {
    const { status, item } = await create({
      name: 'Tomates',
      category: 'insumos',
      subcategory: 'verduleria',
    });
    expect(status).toBe(201);
    expect(item).toMatchObject({
      id: 'item-1',
      name: 'Tomates',
      status: 'pending',
      urgency: 'media',
    });

    const patch = await app.inject({
      method: 'PATCH',
      url: '/api/items/item-1',
      payload: { urgency: 'alta' },
    });
    expect(patch.json<ItemDto>().urgency).toBe('alta');

    const del = await app.inject({ method: 'DELETE', url: '/api/items/item-1' });
    expect(del.statusCode).toBe(204);
    expect(await names()).toEqual([]);
  });

  it('marca comprado (al final) y falta (al principio)', async () => {
    await create({ name: 'Tomates', category: 'insumos', subcategory: 'verduleria' });
    await create({ name: 'Asado', category: 'insumos', subcategory: 'carniceria' });
    await create({ name: 'Lavandina', category: 'insumos', subcategory: 'limpieza' });

    await app.inject({ method: 'POST', url: '/api/items/item-3/done' });
    expect(await names()).toEqual(['Asado', 'Tomates', 'Lavandina']);

    await app.inject({ method: 'POST', url: '/api/items/item-1/pending' });
    expect(await names()).toEqual(['Tomates', 'Asado', 'Lavandina']);
  });

  it('reordena y filtra por categoría', async () => {
    await create({ name: 'Tomates', category: 'insumos', subcategory: 'verduleria' });
    await create({ name: 'Asado', category: 'insumos', subcategory: 'carniceria' });
    await create({ name: 'Pagar luz', category: 'tarea', dueDate: '2026-03-10' });

    const res = await app.inject({
      method: 'POST',
      url: '/api/items/item-3/reorder',
      payload: { afterId: 'item-1' },
    });
    expect(res.json()).toEqual({ order: ['item-2', 'item-1', 'item-3'] });
    expect(await names('?category=tarea')).toEqual(['Pagar luz']);
  });

  it.each([
    ['categoría inválida', { name: 'X', category: 'otra' }],
    ['fecha inválida', { name: 'X', category: 'tarea', dueDate: '31/12/2026' }],
    ['falta el nombre', { category: 'tarea' }],
    ['campo desconocido', { name: 'X', category: 'tarea', foo: 1 }],
  ])('responde 400 si hay %s', async (_, body) => {
    const res = await app.inject({ method: 'POST', url: '/api/items', payload: body });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('responde 400 si el reordenamiento no indica referencia', async () => {
    await create({ name: 'Tomates', category: 'insumos', subcategory: 'verduleria' });
    const res = await app.inject({ method: 'POST', url: '/api/items/item-1/reorder', payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('responde 404 para ítems inexistentes', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/items/nope/done' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toHaveProperty('error', 'NOT_FOUND');
  });
});
