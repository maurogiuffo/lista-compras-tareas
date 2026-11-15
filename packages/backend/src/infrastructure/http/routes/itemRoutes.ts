import type { FastifyPluginAsync } from 'fastify';
import type { ReorderItemInput } from '../../../application/index.js';
import type { CreateItemInput, OwnerId, UpdateItemInput } from '../../../domain/index.js';
import type { UseCasesFactory } from '../../../container.js';

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', minLength: 1 } },
} as const;

const itemFields = {
  name: { type: 'string' },
  category: { type: 'string' },
  subcategory: { type: ['string', 'null'] },
  urgency: { type: 'string' },
  dueDate: { type: ['string', 'null'] },
  notes: { type: ['string', 'null'] },
} as const;

interface IdParams {
  id: string;
}

/**
 * Adaptador HTTP: solo traduce requests a casos de uso y resultados a respuestas.
 * La validación de valores (categorías, fechas, etc.) vive en el dominio.
 */
export const itemRoutes: FastifyPluginAsync<{ useCasesFor: UseCasesFactory }> = async (
  app,
  { useCasesFor },
) => {
  // Cada request opera solo sobre la lista de su usuario.
  const useCases = (request: { owner: OwnerId }) => useCasesFor(request.owner);

  app.get<{ Querystring: { category?: string; subcategory?: string } }>(
    '/items',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { category: { type: 'string' }, subcategory: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (request) => useCases(request).listItems.execute(request.query),
  );

  app.post<{ Body: CreateItemInput }>(
    '/items',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'category'],
          properties: itemFields,
          additionalProperties: false,
        },
      },
    },
    async (request, reply) =>
      reply.status(201).send(await useCases(request).createItem.execute(request.body)),
  );

  app.patch<{ Params: IdParams; Body: UpdateItemInput }>(
    '/items/:id',
    {
      schema: {
        params: idParams,
        body: { type: 'object', properties: itemFields, additionalProperties: false },
      },
    },
    async (request) => useCases(request).updateItem.execute(request.params.id, request.body),
  );

  app.delete<{ Params: IdParams }>(
    '/items/:id',
    { schema: { params: idParams } },
    async (request, reply) => {
      await useCases(request).deleteItem.execute(request.params.id);
      return reply.status(204).send();
    },
  );

  app.post<{ Params: IdParams }>(
    '/items/:id/done',
    { schema: { params: idParams } },
    async (request) => useCases(request).markItemDone.execute(request.params.id),
  );

  app.post<{ Params: IdParams }>(
    '/items/:id/pending',
    { schema: { params: idParams } },
    async (request) => useCases(request).markItemPending.execute(request.params.id),
  );

  app.post<{ Params: IdParams; Body: ReorderItemInput }>(
    '/items/:id/reorder',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          properties: {
            beforeId: { type: 'string', minLength: 1 },
            afterId: { type: 'string', minLength: 1 },
          },
          oneOf: [{ required: ['beforeId'] }, { required: ['afterId'] }],
          additionalProperties: false,
        },
      },
    },
    async (request) => ({
      order: await useCases(request).reorderItem.execute(request.params.id, request.body),
    }),
  );
};
