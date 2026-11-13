import { type ItemRepository, parseCategory } from '../../domain/index.js';
import { type ItemDto, toItemDto } from '../ItemDto.js';

export interface ListItemsQuery {
  readonly category?: unknown;
}

export class ListItems {
  constructor(private readonly repository: ItemRepository) {}

  async execute(query: ListItemsQuery = {}): Promise<ItemDto[]> {
    const items = await this.repository.findAll(
      query.category === undefined ? {} : { category: parseCategory(query.category) },
    );
    return items.map(toItemDto);
  }
}
