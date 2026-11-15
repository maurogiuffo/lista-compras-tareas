import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { UseCasesFactory } from '../../container.js';
import { type ResolveOwner, ownerFromProxyHeader, registerOwner } from './owner.js';
import { errorHandler } from './errorHandler.js';
import { itemRoutes } from './routes/itemRoutes.js';

export interface ServerOptions {
  readonly useCasesFor: UseCasesFactory;
  /** Cómo se identifica al usuario de cada request. */
  readonly resolveOwner?: ResolveOwner;
  readonly logger?: FastifyServerOptions['logger'];
  readonly corsOrigin?: string | null;
}

export async function buildServer({
  useCasesFor,
  resolveOwner = ownerFromProxyHeader('local'),
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

  // El healthcheck de Docker lo consulta cada 30 s: no ensuciar los logs.
  app.get('/api/health', { logLevel: 'warn' }, async () => ({ status: 'ok' }));
  await app.register(
    async (api) => {
      registerOwner(api, resolveOwner);
      api.get('/me', async (request) => ({ user: request.owner }));
      await api.register(itemRoutes, { useCasesFor });
    },
    { prefix: '/api' },
  );

  return app;
}
