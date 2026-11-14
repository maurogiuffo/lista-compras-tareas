import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { DomainError, NotFoundError } from '../../domain/index.js';

/** Traduce errores de dominio y de validación a respuestas HTTP con un formato uniforme. */
export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof NotFoundError) {
    return reply.status(404).send({ error: error.code, message: error.message });
  }
  if (error instanceof DomainError) {
    return reply.status(400).send({ error: error.code, message: error.message });
  }
  if (error.validation) {
    return reply.status(400).send({ error: 'VALIDATION_ERROR', message: error.message });
  }
  request.log.error(error);
  const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
  return reply.status(status).send({
    error: status === 500 ? 'INTERNAL_ERROR' : (error.code ?? 'ERROR'),
    message: status === 500 ? 'Error interno' : error.message,
  });
}
