import { ValidationError } from '../shared/DomainError.js';

/** Identificador del dueño de una lista (por ejemplo, el usuario autenticado). */
export type OwnerId = string & { readonly __brand: 'OwnerId' };

const MAX_OWNER_LENGTH = 100;

export function parseOwnerId(value: unknown): OwnerId {
  if (typeof value !== 'string') throw new ValidationError('Usuario inválido');
  const owner = value.trim();
  if (owner.length === 0 || owner.length > MAX_OWNER_LENGTH) {
    throw new ValidationError('Usuario inválido');
  }
  return owner as OwnerId;
}
