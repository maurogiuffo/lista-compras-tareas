import type { FastifyInstance, FastifyRequest } from 'fastify';
import { type OwnerId, parseOwnerId } from '../../domain/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Usuario dueño de la lista sobre la que opera el request. */
    owner: OwnerId;
  }
}

/** Determina el usuario de un request, o `null` si no se pudo identificar. */
export type ResolveOwner = (request: FastifyRequest) => OwnerId | null;

/** Header que completa el nginx del contenedor web con el usuario autenticado. */
export const PROXY_USER_HEADER = 'x-remote-user';

/**
 * El nginx del contenedor `web` autentica y reenvía el usuario en `X-Remote-User`
 * (y descarta el que pudiera mandar el cliente). La API no se publica fuera de Docker,
 * así que ese header es confiable. Sin header se usa `defaultUser`.
 */
export function ownerFromProxyHeader(defaultUser: string): ResolveOwner {
  const fallback = parseOwnerId(defaultUser);
  return (request) => {
    const header = request.headers[PROXY_USER_HEADER];
    const value = Array.isArray(header) ? header[0] : header;
    return value && value.trim() ? parseOwnerId(value) : fallback;
  };
}

export function registerOwner(app: FastifyInstance, resolve: ResolveOwner): void {
  app.decorateRequest('owner', '' as OwnerId);
  app.addHook('onRequest', async (request, reply) => {
    const owner = resolve(request);
    if (!owner) {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Usuario no identificado' });
    }
    request.owner = owner;
  });
}
