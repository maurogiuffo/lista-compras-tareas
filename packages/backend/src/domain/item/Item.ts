import { ValidationError } from '../shared/DomainError.js';
import { type Category, parseCategory } from './Category.js';
import { type DueDate, parseDueDate } from './DueDate.js';
import type { ItemStatus } from './ItemStatus.js';
import { type Subcategory, assertSubcategoryAllowed, parseSubcategory } from './Subcategory.js';
import { DEFAULT_URGENCY, type Urgency, parseUrgency } from './Urgency.js';

export const MAX_NAME_LENGTH = 120;
export const MAX_NOTES_LENGTH = 500;

export interface ItemProps {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly subcategory: Subcategory | null;
  readonly urgency: Urgency;
  readonly status: ItemStatus;
  readonly dueDate: DueDate | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateItemInput {
  readonly name: unknown;
  readonly category: unknown;
  readonly subcategory?: unknown;
  readonly urgency?: unknown;
  readonly dueDate?: unknown;
  readonly notes?: unknown;
}

export type UpdateItemInput = Partial<CreateItemInput>;

/**
 * Entidad inmutable: cada operación devuelve una nueva instancia.
 * El orden en la lista no es responsabilidad del ítem, sino de `ItemOrder`.
 */
export class Item {
  private constructor(private readonly props: ItemProps) {}

  static create(id: string, input: CreateItemInput, now: Date): Item {
    return Item.validated({
      id,
      name: parseName(input.name),
      category: parseCategory(input.category),
      subcategory: parseOptional(input.subcategory, parseSubcategory),
      urgency: input.urgency === undefined ? DEFAULT_URGENCY : parseUrgency(input.urgency),
      status: 'pending',
      dueDate: parseOptional(input.dueDate, parseDueDate),
      notes: parseOptional(input.notes, parseNotes),
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstruye un ítem ya persistido (sin revalidar ni cambiar fechas). */
  static restore(props: ItemProps): Item {
    return new Item(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get category(): Category {
    return this.props.category;
  }
  get subcategory(): Subcategory | null {
    return this.props.subcategory;
  }
  get urgency(): Urgency {
    return this.props.urgency;
  }
  get status(): ItemStatus {
    return this.props.status;
  }
  get dueDate(): DueDate | null {
    return this.props.dueDate;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(input: UpdateItemInput, now: Date): Item {
    const category = input.category === undefined ? this.category : parseCategory(input.category);
    // Si cambia a una categoría sin subcategorías y no se indica otra, se limpia sola.
    const subcategory =
      input.subcategory !== undefined
        ? parseOptional(input.subcategory, parseSubcategory)
        : category === this.category
          ? this.subcategory
          : null;
    return this.with(
      {
        ...(input.name !== undefined && { name: parseName(input.name) }),
        category,
        subcategory,
        ...(input.urgency !== undefined && { urgency: parseUrgency(input.urgency) }),
        ...(input.dueDate !== undefined && { dueDate: parseOptional(input.dueDate, parseDueDate) }),
        ...(input.notes !== undefined && { notes: parseOptional(input.notes, parseNotes) }),
      },
      now,
    );
  }

  markDone(now: Date): Item {
    return this.with({ status: 'done' }, now);
  }

  markPending(now: Date): Item {
    return this.with({ status: 'pending' }, now);
  }

  toProps(): ItemProps {
    return { ...this.props };
  }

  private with(changes: Partial<ItemProps>, now: Date): Item {
    return Item.validated({ ...this.props, ...changes, updatedAt: now });
  }

  /** Reglas que involucran más de un campo. */
  private static validated(props: ItemProps): Item {
    assertSubcategoryAllowed(props.category, props.subcategory);
    return new Item(props);
  }
}

function parseName(value: unknown): string {
  if (typeof value !== 'string') throw new ValidationError('El nombre es obligatorio');
  const name = value.trim();
  if (name.length === 0) throw new ValidationError('El nombre no puede estar vacío');
  if (name.length > MAX_NAME_LENGTH) {
    throw new ValidationError(`El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`);
  }
  return name;
}

function parseNotes(value: unknown): string {
  if (typeof value !== 'string') throw new ValidationError('Las notas deben ser texto');
  const notes = value.trim();
  if (notes.length > MAX_NOTES_LENGTH) {
    throw new ValidationError(`Las notas no pueden superar ${MAX_NOTES_LENGTH} caracteres`);
  }
  return notes;
}

/** `null` o string vacío limpian el campo. */
function parseOptional<T>(value: unknown, parse: (v: unknown) => T): T | null {
  if (value === undefined || value === null || value === '') return null;
  return parse(value);
}
