import type { Category, DueDate, Item, ItemStatus, Urgency } from '../domain/index.js';

/** Representación serializable de un ítem, expuesta hacia afuera de la aplicación. */
export interface ItemDto {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly urgency: Urgency;
  readonly status: ItemStatus;
  readonly dueDate: DueDate | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toItemDto(item: Item): ItemDto {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    urgency: item.urgency,
    status: item.status,
    dueDate: item.dueDate,
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
