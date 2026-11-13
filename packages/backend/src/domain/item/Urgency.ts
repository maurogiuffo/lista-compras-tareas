import { ValidationError } from '../shared/DomainError.js';

export const URGENCIES = ['baja', 'media', 'alta'] as const;
export type Urgency = (typeof URGENCIES)[number];

export const DEFAULT_URGENCY: Urgency = 'media';

export function parseUrgency(value: unknown): Urgency {
  if (typeof value === 'string' && (URGENCIES as readonly string[]).includes(value)) {
    return value as Urgency;
  }
  throw new ValidationError(
    `Urgencia inválida: ${String(value)}. Valores: ${URGENCIES.join(', ')}`,
  );
}
