import { ValidationError } from '../shared/DomainError.js';
import type { Category } from './Category.js';

/** Subcategorías de `insumos`. Para sumar una nueva, agregarla a esta lista. */
export const SUBCATEGORIES = [
  'almacen',
  'verduleria',
  'carniceria',
  'limpieza',
  'perfumeria',
  'mascotas',
] as const;
export type Subcategory = (typeof SUBCATEGORIES)[number];

/** Categorías que admiten subcategoría. */
export const CATEGORIES_WITH_SUBCATEGORY: readonly Category[] = ['insumos'];

export function parseSubcategory(value: unknown): Subcategory {
  if (typeof value === 'string' && (SUBCATEGORIES as readonly string[]).includes(value)) {
    return value as Subcategory;
  }
  throw new ValidationError(
    `Subcategoría inválida: ${String(value)}. Valores: ${SUBCATEGORIES.join(', ')}`,
  );
}

export function assertSubcategoryAllowed(
  category: Category,
  subcategory: Subcategory | null,
): void {
  if (subcategory !== null && !CATEGORIES_WITH_SUBCATEGORY.includes(category)) {
    throw new ValidationError(`La categoría ${category} no admite subcategoría`);
  }
}
