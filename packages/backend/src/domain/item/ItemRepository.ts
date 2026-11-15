import type { Category } from './Category.js';
import type { Item } from './Item.js';
import type { OwnerId } from './Owner.js';
import type { Subcategory } from './Subcategory.js';

export interface ItemFilter {
  readonly category?: Category;
  readonly subcategory?: Subcategory;
}

/**
 * Puerto de persistencia de UNA lista (la de un dueño). La infraestructura provee la
 * implementación concreta.
 */
export interface ItemRepository {
  /** Devuelve los ítems en el orden de la lista (de arriba hacia abajo). */
  findAll(filter?: ItemFilter): Promise<Item[]>;
  findById(id: string): Promise<Item | null>;
  /** Inserta o actualiza. Un ítem nuevo se agrega al principio de la lista. */
  save(item: Item): Promise<void>;
  delete(id: string): Promise<void>;
  /** Devuelve la secuencia completa de ids en orden. */
  getOrder(): Promise<string[]>;
  /** Reemplaza el orden completo de la lista. */
  saveOrder(ids: readonly string[]): Promise<void>;
}

/** Entrega el repositorio de la lista de cada dueño: cada usuario ve solo la suya. */
export interface ItemRepositoryProvider {
  forOwner(ownerId: OwnerId): ItemRepository;
}
