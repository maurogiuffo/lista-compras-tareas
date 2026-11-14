import {
  type ItemFilter,
  type ItemRepository,
  parseCategory,
  parseSubcategory,
} from '../../domain/index.js';
import { type ItemDto, toItemDto } from '../ItemDto.js';

export interface ListItemsQuery {
  readonly category?: unknown;
  readonly subcategory?: unknown;
}

export class ListItems {
  constructor(private readonly repository: ItemRepository) {}

  async execute(query: ListItemsQuery = {}): Promise<ItemDto[]> {
    const filter: ItemFilter = {
      ...(query.category !== undefined && { category: parseCategory(query.category) }),
      ...(query.subcategory !== undefined && { subcategory: parseSubcategory(query.subcategory) }),
    };
    const items = await this.repository.findAll(filter);
    return items.map(toItemDto);
  }
}
