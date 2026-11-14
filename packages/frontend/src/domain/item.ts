/**
 * Modelo del lado del cliente. Refleja el contrato de la API (`ItemDto` del backend);
 * si cambia uno, hay que actualizar el otro.
 */
export const CATEGORIES = ['insumos', 'tarea'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Subcategorías de insumos. */
export const SUBCATEGORIES = [
  'almacen',
  'verduleria',
  'carniceria',
  'limpieza',
  'perfumeria',
  'mascotas',
] as const;
export type Subcategory = (typeof SUBCATEGORIES)[number];

export function hasSubcategories(category: Category): boolean {
  return category === 'insumos';
}

export const URGENCIES = ['baja', 'media', 'alta'] as const;
export type Urgency = (typeof URGENCIES)[number];

export type ItemStatus = 'pending' | 'done';

export interface Item {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly subcategory: Subcategory | null;
  readonly urgency: Urgency;
  readonly status: ItemStatus;
  readonly dueDate: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ItemDraft {
  readonly name: string;
  readonly category: Category;
  readonly subcategory: Subcategory | null;
  readonly urgency: Urgency;
  readonly dueDate: string | null;
  readonly notes: string | null;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  insumos: 'Insumos',
  tarea: 'Tareas',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  insumos: '🛒',
  tarea: '📋',
};

export const SUBCATEGORY_LABELS: Record<Subcategory, string> = {
  almacen: 'Almacén y lácteos',
  verduleria: 'Verdulería',
  carniceria: 'Carnicería',
  limpieza: 'Limpieza',
  perfumeria: 'Perfumería',
  mascotas: 'Mascotas',
};

export const SUBCATEGORY_ICONS: Record<Subcategory, string> = {
  almacen: '🧀',
  verduleria: '🥬',
  carniceria: '🥩',
  limpieza: '🧽',
  perfumeria: '🪥',
  mascotas: '🐱',
};

/** Etiqueta e ícono a mostrar: la subcategoría si tiene, si no la categoría. */
export function classification(item: Pick<Item, 'category' | 'subcategory'>): {
  label: string;
  icon: string;
} {
  return item.subcategory
    ? { label: SUBCATEGORY_LABELS[item.subcategory], icon: SUBCATEGORY_ICONS[item.subcategory] }
    : { label: CATEGORY_LABELS[item.category], icon: CATEGORY_ICONS[item.category] };
}

/** Filtro activo de la lista: todo, una categoría, o una subcategoría de insumos. */
export type ItemFilter =
  | { readonly kind: 'all' }
  | { readonly kind: 'category'; readonly category: Category }
  | { readonly kind: 'subcategory'; readonly subcategory: Subcategory };

export function matchesFilter(item: Item, filter: ItemFilter): boolean {
  switch (filter.kind) {
    case 'all':
      return true;
    case 'category':
      return item.category === filter.category;
    case 'subcategory':
      return item.subcategory === filter.subcategory;
  }
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

export type DueState = 'overdue' | 'today' | 'soon' | 'later';

/** Clasifica una fecha de vencimiento (YYYY-MM-DD) respecto de `today` (YYYY-MM-DD). */
export function dueState(dueDate: string, today: string): DueState {
  const days = Math.round((Date.parse(dueDate) - Date.parse(today)) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 3) return 'soon';
  return 'later';
}

/** Fecha local de hoy en formato YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}${year === String(new Date().getFullYear()) ? '' : `/${year}`}`;
}

export type ReorderTarget = { beforeId: string } | { afterId: string };

/**
 * Dado el orden visible (posiblemente filtrado) después de soltar, devuelve la referencia
 * que entiende la API: el vecino de abajo, o el de arriba si quedó último.
 */
export function reorderTarget(
  visibleIds: readonly string[],
  movedId: string,
): ReorderTarget | null {
  const index = visibleIds.indexOf(movedId);
  if (index === -1) return null;
  const next = visibleIds[index + 1];
  if (next !== undefined) return { beforeId: next };
  const prev = visibleIds[index - 1];
  if (prev !== undefined) return { afterId: prev };
  return null;
}

/** Mueve un elemento de `from` a `to` sin mutar el arreglo original. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  if (moved !== undefined) copy.splice(to, 0, moved);
  return copy;
}
