/**
 * - `pending`: falta comprar / falta hacer. Se ubica arriba de la lista.
 * - `done`: comprado / hecho. Se ubica al final de la lista, listo para volver a marcarse.
 */
export const ITEM_STATUSES = ['pending', 'done'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];
