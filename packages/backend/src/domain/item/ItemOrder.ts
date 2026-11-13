import { ValidationError } from '../shared/DomainError.js';

/**
 * Reglas puras de ordenamiento de la lista. Trabajan sobre la secuencia de ids
 * (de arriba hacia abajo) y devuelven una nueva secuencia sin mutar la original.
 */
export const ItemOrder = {
  /** Al marcar "falta": el ítem sube al principio. */
  moveToTop(order: readonly string[], id: string): string[] {
    assertContains(order, id);
    return [id, ...order.filter((x) => x !== id)];
  },

  /** Al marcar "comprado/hecho": el ítem baja a la última posición. */
  moveToBottom(order: readonly string[], id: string): string[] {
    assertContains(order, id);
    return [...order.filter((x) => x !== id), id];
  },

  /**
   * Arrastrar y soltar: ubica el ítem justo antes de `anchorId`.
   * Se usan vecinos en lugar de índices para que funcione aunque la vista esté filtrada.
   */
  moveBefore(order: readonly string[], id: string, anchorId: string): string[] {
    return insertNextTo(order, id, anchorId, 0);
  },

  /** Arrastrar y soltar: ubica el ítem justo después de `anchorId`. */
  moveAfter(order: readonly string[], id: string, anchorId: string): string[] {
    return insertNextTo(order, id, anchorId, 1);
  },
} as const;

function insertNextTo(
  order: readonly string[],
  id: string,
  anchorId: string,
  offset: 0 | 1,
): string[] {
  assertContains(order, id);
  assertContains(order, anchorId);
  if (id === anchorId) return [...order];
  const rest = order.filter((x) => x !== id);
  const index = rest.indexOf(anchorId) + offset;
  return [...rest.slice(0, index), id, ...rest.slice(index)];
}

function assertContains(order: readonly string[], id: string): void {
  if (!order.includes(id)) throw new ValidationError(`El ítem ${id} no está en la lista`);
}
