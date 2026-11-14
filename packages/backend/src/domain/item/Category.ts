import { ValidationError } from '../shared/DomainError.js';

export const CATEGORIES = ['insumos', 'tarea'] as const;
export type Category = (typeof CATEGORIES)[number];

export function parseCategory(value: unknown): Category {
  if (typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value)) {
    return value as Category;
  }
  throw new ValidationError(
    `Categoría inválida: ${String(value)}. Valores: ${CATEGORIES.join(', ')}`,
  );
}
