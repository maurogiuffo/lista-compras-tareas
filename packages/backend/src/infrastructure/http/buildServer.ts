import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { UseCases } from '../../container.js';
import { errorHandler } from './errorHandler.js';
import { itemRoutes } from './routes/itemRoutes.js';

export interface ServerOptions {
  readonly useCases: UseCases;
  readonly logger?: FastifyServerOptions['logger'];
  readonly corsOrigin?: string | null;
}

export async function buildServer({
  useCases,
  logger = false,
  corsOrigin = null,
}: ServerOptions): Promise<FastifyInstance> {
  // Rechazar campos desconocidos en lugar de descartarlos en silencio.
  const app = Fastify({ logger, ajv: { customOptions: { removeAdditional: false } } });

  app.setErrorHandler(errorHandler);

  if (corsOrigin) {
    // CORS mínimo para desarrollo con el frontend en otro puerto.
    app.addHook('onRequest', async (request, reply) => {
      reply.header('Access-Control-Allow-Origin', corsOrigin);
      reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type');
      if (request.method === 'OPTIONS') return reply.status(204).send();
    });
  }

  app.get('/api/health', async () => ({ status: 'ok' }));
  await app.register(itemRoutes, { prefix: '/api', useCases });

  return app;
}
