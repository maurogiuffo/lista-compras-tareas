import { ValidationError } from '../shared/DomainError.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha calendario sin hora, en formato ISO `YYYY-MM-DD`. */
export type DueDate = string & { readonly __brand: 'DueDate' };

export function parseDueDate(value: unknown): DueDate {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    throw new ValidationError(`Fecha inválida: ${String(value)}. Formato esperado: YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ValidationError(`Fecha inexistente: ${value}`);
  }
  return value as DueDate;
}
